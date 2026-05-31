import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import './AuthController.css';
import JwtUtil from '../utils/JwtUtil';
import GlobalExceptionHandler from '../utils/GlobalExceptionHandler';

/**
 * Aligned with AuthController.java
 * Coordinates authentication screens, mock OAuth2 simulation bypasses, and guest URL migrations.
 */
export const AuthController = ({ loadCurrentUser }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Loader and error states
  const [loadingOauth, setLoadingOauth] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Credentials form states
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loadingForm, setLoadingForm] = useState(false);

  // Simulation mode toggle (active by default to bypass Google credentials error)
  const [simulationMode, setSimulationMode] = useState(true);

  // Capture Oauth2 redirect parameters on mount
  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      setLoadingOauth(true);
      JwtUtil.saveToken(token);
      
      // Migrate guest links upon successful social redirect
      migrateGuestLinks()
        .then(() => loadCurrentUser())
        .then(() => {
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error(err);
          setErrorMsg('Failed to initialize user session.');
          setLoadingOauth(false);
        });
    } else if (error) {
      if (error === 'email_not_provided') {
        setErrorMsg('OAuth provider did not return an email address.');
      } else {
        setErrorMsg('Authentication failed. Please try again.');
      }
    }
  }, [searchParams, navigate, loadCurrentUser]);

  // Migrates guest links from localStorage to the backend user account
  const migrateGuestLinks = async () => {
    const guestLinksSaved = localStorage.getItem('scissors_guest_links');
    if (guestLinksSaved) {
      const guestLinks = JSON.parse(guestLinksSaved);
      if (guestLinks.length > 0) {
        const codes = guestLinks.map(link => link.shortCode);
        try {
          await axios.post('/api/urls/migrate', codes);
          localStorage.removeItem('scissors_guest_links');
        } catch (migrateErr) {
          console.error('Failed to migrate guest links:', migrateErr);
        }
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignup && !name)) return;

    setLoadingForm(true);
    setErrorMsg('');

    try {
      let response;
      if (isSignup) {
        response = await axios.post('/api/auth/signup', { email, password, name });
      } else {
        response = await axios.post('/api/auth/login', { email, password });
      }

      const { token } = response.data;
      JwtUtil.saveToken(token);
      
      // Migrate guest URLs
      await migrateGuestLinks();
      await loadCurrentUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(GlobalExceptionHandler.parse(err));
    } finally {
      setLoadingForm(false);
    }
  };

  // Triggers the mock OAuth2 login bypass
  const handleMockOAuth2Click = async (provider) => {
    setLoadingOauth(true);
    setErrorMsg('');
    try {
      const response = await axios.get(`/api/auth/mock-oauth2?provider=${provider}`);
      const { token } = response.data;
      JwtUtil.saveToken(token);

      // Migrate guest URLs
      await migrateGuestLinks();
      await loadCurrentUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg(GlobalExceptionHandler.parse(err));
    } finally {
      setLoadingOauth(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignup(!isSignup);
    setErrorMsg('');
    setEmail('');
    setPassword('');
    setName('');
  };

  if (loadingOauth) {
    return (
      <div className="auth-page-container">
        <div className="callback-loader">
          <div className="spinner"></div>
          <p>Setting up secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <h1 className="auth-logo">Scissors</h1>
        <p className="auth-tagline">Premium link shortener with secure analytics</p>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        {/* Credentials Form */}
        <form className="auth-form" onSubmit={handleFormSubmit}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loadingForm}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loadingForm}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loadingForm}
              minLength={isSignup ? 6 : undefined}
            />
          </div>

          <button type="submit" className="form-submit-btn" disabled={loadingForm}>
            {loadingForm ? 'Please wait...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <p className="auth-toggle-text">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <span className="auth-toggle-link" onClick={toggleAuthMode}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </span>
        </p>

        <div className="auth-divider">
          <span>or continue with</span>
        </div>

        {/* Simulation mode toggle */}
        <div 
          className="expiration-toggle-wrapper" 
          style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: '#9ca3af' }}
          onClick={() => setSimulationMode(!simulationMode)}
        >
          <div className={`checkbox-custom ${simulationMode ? 'checked' : ''}`} style={{ width: '15px', height: '15px' }}></div>
          <span>OAuth2 Dev Simulation Mode (Bypass Client ID setup)</span>
        </div>

        <div className="auth-buttons-group">
          {simulationMode ? (
            <>
              <button 
                type="button" 
                className="oauth-button google"
                onClick={() => handleMockOAuth2Click('google')}
              >
                <svg className="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button 
                type="button" 
                className="oauth-button github"
                onClick={() => handleMockOAuth2Click('github')}
              >
                <svg className="oauth-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                Continue with GitHub
              </button>
            </>
          ) : (
            <>
              {/* Points directly to real Spring Boot Oauth2 Authorize endpoints */}
              <a href="/oauth2/authorization/google" className="oauth-button google">
                <svg className="oauth-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>

              <a href="/oauth2/authorization/github" className="oauth-button github">
                <svg className="oauth-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                Continue with GitHub
              </a>
            </>
          )}
        </div>

        <Link to="/" className="auth-guest-link">
          Use as Guest
        </Link>
      </div>
    </div>
  );
};

export default AuthController;
