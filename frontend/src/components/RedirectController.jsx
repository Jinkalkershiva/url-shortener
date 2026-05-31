import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './RedirectController.css';

/**
 * Aligned with RedirectController.java
 * Handles visual output for expired URLs.
 */
export const RedirectController = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';

  return (
    <div className="expired-page-container">
      <div className="expired-card">
        <div className="expired-icon-wrapper">
          <svg className="expired-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="expired-title">Link No Longer Functional</h1>
        <p className="expired-desc">
          The shortened link <span className="expired-code-highlight">/{code}</span> is no longer active. 
          It has either expired or been removed by its creator, and is no longer functional.
        </p>

        <div className="expired-actions">
          <Link to="/" className="expired-btn primary">
            Create a New Short Link
          </Link>
          <Link to="/login" className="expired-btn secondary">
            Sign In to Manage Links
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RedirectController;
