// src/types.ts
export interface MenuItem {
    key: string;
    icon: JSX.Element;
    label: string | JSX.Element;
    children?: {
        label: string;
        key: string;
        icon: JSX.Element;
    }[];
}

export interface Contractor {
    id: string;
    name: string;
    email: string;
    phone: string;
}

