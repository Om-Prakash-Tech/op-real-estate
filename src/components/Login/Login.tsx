// login.tsx

import { useState } from 'react';
import { getAuth, GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { app } from '../../Firebase';
import { Button, Card, Spin, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import './Login.css';

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);

    const loginWithGoogle = async () => {
        setIsLoading(true);
        const auth = getAuth(app);

        try {
            // Set persistence first
            await setPersistence(auth, browserLocalPersistence);

            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Get initial token
            const idToken = await result.user.getIdToken();

            // Store token and refresh token
            localStorage.setItem('token', idToken);
            localStorage.setItem('lastTokenRefresh', Date.now().toString());

            // Store user details
            localStorage.setItem('user', JSON.stringify({
                uid: result.user.uid,
                email: result.user.email,
                displayName: result.user.displayName,
            }));

            const user = result.user;
            console.log('User Details:', {

                uid: user.uid,

                email: user.email,

                displayName: user.displayName,

                token: idToken

            });

            message.success('Successfully logged in');
        } catch (error: any) {
            console.error('Login error:', error);
            message.error(error.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="layout">
            <div className="left">
                <img src="src/assets/Om-Prakash-Logo_processed.jpg" alt="Logo" className='full-logo-img' />
            </div>
            <div className="right">
                <div className="logo">
                    <img src="src/assets/only-logo_processed.jpg" alt="Logo" className='logo-img' />
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