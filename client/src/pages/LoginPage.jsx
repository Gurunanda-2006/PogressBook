import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // If already logged in, redirect to app
  if (user) {
    return <Navigate to="/todos" replace />;
  }

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google did not return a sign-in token. Check the OAuth Client ID and authorized JavaScript origin.');
      return;
    }

    const res = await login(credentialResponse.credential);
    if (res.success) {
      navigate('/todos');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <hr className="divider login-divider" />
        <h1 className="login-title">PROGRESSBOOK</h1>
        <p className="login-tagline">Track your day. Own your progress.</p>
        <hr className="divider login-divider" />
        
        <div className="login-action">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError('Google Sign-In failed. Check that this exact URL is added in Google Authorized JavaScript origins.')}
            theme="outline"
            shape="pill"
            text="continue_with"
            size="large"
          />
        </div>
        
        {error && <div className="login-error animate-in">{error}</div>}
      </div>
    </div>
  );
}
