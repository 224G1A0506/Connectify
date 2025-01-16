// GoogleAuthButton.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './GoogleAuthButton.css';

const GoogleAuthButton = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Load Google API Script
        const loadGoogleScript = () => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            script.onload = () => {
                if (window.google) {
                    window.google.accounts.id.initialize({
                        client_id: '419760271508-svl7s7213q2sj198pnr9otj24tb3v7g0.apps.googleusercontent.com',
                        callback: handleGoogleResponse
                    });

                    window.google.accounts.id.renderButton(
                        document.getElementById('google-signin-button'),
                        { 
                            theme: 'outline',
                            size: 'large',
                            width: 250,
                            type: 'standard'
                        }
                    );
                }
            };
        };

        loadGoogleScript();
    }, []);

    const handleGoogleResponse = async (response) => {
        try {
            // Send ID token to your backend
            const result = await fetch('/google-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: response.credential
                })
            });

            const data = await result.json();

            if (data.error) {
                toast.error(data.error);
            } else {
                localStorage.setItem('jwt', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                toast.success('Successfully signed in with Google!');
                navigate('/');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="google-auth-container">
            <div className="google-divider">
                <span>or</span>
            </div>
            <div id="google-signin-button" className="google-button-wrapper"></div>
        </div>
    );
};

export default GoogleAuthButton;