import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAuth } from 'firebase/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
    baseURL: BASE_URL,
});

// Keep track of token refresh state
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve();
        }
    });
    failedQueue = [];
};

// Function to get fresh token
const getFreshToken = async (forceRefresh = false) => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error('No user logged in');
    }

    try {
        const token = await user.getIdToken(forceRefresh);
        localStorage.setItem('token', token);
        localStorage.setItem('lastTokenRefresh', Date.now().toString());
        return token;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
};

// Request interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    try {
        let token = localStorage.getItem('token');
        const lastRefresh = localStorage.getItem('lastTokenRefresh');
        const now = Date.now();

        // If token is older than 55 minutes (3300 seconds), refresh it
        if (lastRefresh && now - parseInt(lastRefresh) > 3300000) {
            token = await getFreshToken(true);
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    } catch (error) {
        return Promise.reject(error);
    }
});

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest: any = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        // If error is unauthorized and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for the other refresh to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return api(originalRequest);
                }).catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Force token refresh
                const token = await getFreshToken(true);

                // Process any queued requests
                processQueue();

                // Retry the original request
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as Error);
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const contractorsAPI = {
    getAll: () => api.get('/contractors'),
    getById: (id: string) => api.get(`/contractors/${id}`),
    create: (data: any) => api.post('/contractors', data),
    update: (id: string, data: any) => api.put(`/contractors/${id}`, data),
    delete: (id: string) => api.delete(`/contractors/${id}`)
};

export const projectsAPI = {
    getAll: () => api.get('/projects'),
    getById: (id: string) => api.get(`/projects/${id}`),
    create: (data: any) => api.post('/projects', data),
    update: (id: string, data: any) => api.put(`/projects/${id}`, data),
    delete: (id: string) => api.delete(`/projects/${id}`)
};

export const transactionsAPI = {
    getAll: () => api.get('/transactions'),
    getById: (id: string) => api.get(`/transactions/${id}`),
    create: (data: any) => api.post('/transactions', data),
    update: (id: string, data: any) => api.put(`/transactions/${id}`, data),
    delete: (id: string) => api.delete(`/transactions/${id}`)
};

export const dealsAPI = {
    getAll: () => api.get('/deals'),
    getById: (id: string) => api.get(`/deals/${id}`),
    create: (data: any) => api.post('/deals', data),
    update: (id: string, data: any) => api.put(`/deals/${id}`, data),
    delete: (id: string) => api.delete(`/deals/${id}`)
};

export const metricsAPI = {
    getProjectTransactions: (id: string) => api.get(`/metrics/transactions/project/${id}`),
    getProjectContractors: (id: string) => api.get(`/metrics/contractors/project/${id}`),
    getContractorTransactions: (id: string) => api.get(`/metrics/transactions/contractor/${id}`),
    getContractorProjects: (id: string) => api.get(`/metrics/projects/contractor/${id}`)
};