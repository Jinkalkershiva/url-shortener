import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import './HomeController.css';
import JwtUtil from '../utils/JwtUtil';
import ShortUrlService from '../services/ShortUrlService';
import SecurityConfig from '../config/SecurityConfig';
import AuthController from './AuthController';
import ShortUrlController from './ShortUrlController';
import RedirectController from './RedirectController';
import JwtFilter from './JwtFilter';
import User from './User';

/**
 * Aligned with HomeController.java
 * Provides top-level state coordination, global navigation layouts, and routing controls.
 */
export const HomeController = () => {
  const [user, setUser] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Synchronously load the currently authenticated user's session profile
  const loadCurrentUser = useCallback(async () => {
    if (JwtUtil.isAuthenticated()) {
      try {
        const userData = await ShortUrlService.getCurrentUser();
        setUser(userData);
        return userData;
      } catch (err) {
        console.error('Failed to load profile:', err);
        JwtUtil.clearToken();
        setUser(null);
        throw err;
      }
    } else {
      setUser(null);
    }
  }, []);

  // Configure security interceptors to clear credentials on unauthorized failures
  useEffect(() => {
    SecurityConfig.configureInterceptors(() => {
      setUser(null);
    });

    loadCurrentUser().finally(() => {
      setInitialized(true);
    });
  }, [loadCurrentUser]);

  const handleLogout = () => {
    setUser(null);
  };

  if (!initialized) {
    return (
      <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <nav className="main-navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <svg className="nav-logo-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7h7m-7-7l3 3V3M3 21h3.586a1 1 0 00.707-.293l5.414-5.414a1 1 0 00-.707-.707L6.586 19.586A1 1 0 006 20H3v-3a1 1 0 00-.293-.707L8.121 10.88a1 1 0 00-.707-.707L2 14.586a1 1 0 00-.293.707V21H3z" />
              </svg>
              Scissors
            </Link>

            <div className="nav-links">
              <NavLink 
                to="/" 
                className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
              >
                Shorten Link
              </NavLink>

              {user ? (
                <>
                  <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `nav-link-item ${isActive ? 'active' : ''}`}
                  >
                    My History
                  </NavLink>
                  <User user={user} onLogout={handleLogout} />
                </>
              ) : (
                <Link to="/login" className="nav-auth-btn">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          {/* Public URL shortening workspace */}
          <Route path="/" element={<ShortUrlController user={null} />} />
          
          {/* Secured user dashboard workspace */}
          <Route 
            path="/dashboard" 
            element={
              <JwtFilter>
                <ShortUrlController user={user} />
              </JwtFilter>
            } 
          />
          
          {/* Secure login workspace */}
          <Route 
            path="/login" 
            element={<AuthController loadCurrentUser={loadCurrentUser} />} 
          />
          
          {/* Expired URL warning workspace */}
          <Route path="/expired" element={<RedirectController />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default HomeController;
