import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { app } from '../../Firebase';
import { Button, Card, Spin, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import fullLogo from '../../assets/Om-Prakash-Logo_processed.jpg'
import smallLogo from '../../assets/only-logo_processed.jpg'
import './Login.css';

// Function to check if email is authorized
const isEmailAuthorized = (email: string): boolean => {
    const authorizedEmails = import.meta.env.VITE_AUTHORIZED_EMAILS?.split(',') || [];
    return authorizedEmails.some((authorizedEmail: string) =>
        authorizedEmail.trim().toLowerCase() === email.toLowerCase()
    );
};

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);

    const loginWithGoogle = async () => {
        setIsLoading(true);
        const auth = getAuth(app);

        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('email');

            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, provider);
            const email = result.user.email;

            if (!email || !isEmailAuthorized(email)) {
                await auth.signOut();
                localStorage.removeItem('token');
                localStorage.removeItem('lastTokenRefresh');
                localStorage.removeItem('user');

                message.error('Access Denied: You are not authorized to access this application');
                return;
            }

            await setPersistence(auth, browserLocalPersistence);

            const idToken = await result.user.getIdToken();

            localStorage.setItem('token', idToken);
            localStorage.setItem('lastTokenRefresh', Date.now().toString());

            localStorage.setItem('user', JSON.stringify({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
            }));

            /*const user = result.user;
            console.log('User Details:', {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                token: idToken
            });*/

            message.success('Successfully logged in');

        } catch (error: any) {
            if (error.code === 'auth/popup-closed-by-user') {
                message.info('Login cancelled');
            } else {
                console.error('Login error:', error);
                message.error(error.message || 'Failed to login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="layout">
            <div className="left">
                <img src={fullLogo} alt="Logo" className='full-logo-img' />
            </div>
            <div className="right">
                <div className="logo">
                    <img src={smallLogo} alt="Logo" className='logo-img' />
                </div>
                <Card className="card">
                    <Button
                        type="primary"
                        icon={<GoogleOutlined />}
                        onClick={loginWithGoogle}
                        size="large"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? <Spin /> : 'Login with Google'}
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default Login;
