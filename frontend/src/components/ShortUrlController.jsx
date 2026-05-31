import React, { useState, useEffect } from 'react';
import './ShortUrlController.css';
import ShortUrl from './ShortUrl';
import ShortUrlService from '../services/ShortUrlService';
import GlobalExceptionHandler from '../utils/GlobalExceptionHandler';

/**
 * Aligned with ShortUrlController.java
 * Orchestrates shortening input, custom time-limit sliders, and analytics history lists.
 */
export const ShortUrlController = ({ user }) => {
  const [url, setUrl] = useState('');
  const [useExpiration, setUseExpiration] = useState(false);
  const [expirationHours, setExpirationHours] = useState(24); // Defaults to exactly 1 day
  const [previewDate, setPreviewDate] = useState(null);
  
  const [links, setLinks] = useState(() => {
    if (!user) {
      const saved = localStorage.getItem('scissors_guest_links');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Sync guest links to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem('scissors_guest_links', JSON.stringify(links));
    }
  }, [links, user]);

  // Load database history for logged-in users, otherwise restore guest logs
  useEffect(() => {
    if (user) {
      ShortUrlService.getUserUrls()
        .then((data) => setLinks(data))
        .catch((err) => showToast(GlobalExceptionHandler.parse(err), 'error'));
    } else {
      const saved = localStorage.getItem('scissors_guest_links');
      setLinks(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

  // Dynamically compute the future expiration date-time on selection changes
  useEffect(() => {
    if (useExpiration) {
      const date = new Date();
      date.setHours(date.getHours() + parseInt(expirationHours));
      setPreviewDate(date);
    } else {
      setPreviewDate(null);
    }
  }, [useExpiration, expirationHours]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleShortenSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      let expiredAt = null;
      if (useExpiration && previewDate) {
        // Adjust standard JavaScript Date to local ISO format for Java LocalDateTime compatibility
        const tzOffset = previewDate.getTimezoneOffset() * 60000;
        expiredAt = new Date(previewDate.getTime() - tzOffset).toISOString().slice(0, 19);
      }

      const newLink = await ShortUrlService.shortenUrl(url, expiredAt);
      
      // Update link lists in view
      setLinks((prev) => [newLink, ...prev]);
      showToast('Link shortened successfully!');
      
      // Clean form inputs
      setUrl('');
      setUseExpiration(false);
    } catch (err) {
      console.error(err);
      showToast(GlobalExceptionHandler.parse(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUrl = async (shortCode) => {
    try {
      // Always delete from backend so the link is immediately deactivated and doesn't redirect anymore!
      await ShortUrlService.deleteUrl(shortCode);
    } catch (err) {
      console.warn('Failed to delete from backend database:', err);
    } finally {
      // Always filter out from frontend history
      setLinks((prev) => prev.filter((link) => link.shortCode !== shortCode));
      showToast('Link removed successfully!');
    }
  };

  const humanizeHours = (h) => {
    const hours = parseInt(h);
    if (hours < 24) {
      return `${hours} Hour${hours > 1 ? 's' : ''}`;
    }
    const days = Math.floor(hours / 24);
    const rem = hours % 24;
    let str = `${days} Day${days > 1 ? 's' : ''}`;
    if (rem > 0) {
      str += ` ${rem} Hour${rem > 1 ? 's' : ''}`;
    }
    if (hours === 168) {
      str += ' (7 Days Max)';
    }
    return str;
  };

  const formatPreviewDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="shortener-section">
        <div className="dashboard-title-group">
          <h1>Shorten Your Links</h1>
          <p>Create clean, manageable redirects with optional custom expirations</p>
        </div>

        <form className="shortener-form" onSubmit={handleShortenSubmit}>
          <div className="url-input-container">
            <input
              type="url"
              className="url-input"
              placeholder="Paste your long link here (https://...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="shorten-button" disabled={loading || !url}>
            {loading ? 'Shortening...' : 'Shorten'}
          </button>
        </form>

        <div 
          className="expiration-toggle-wrapper" 
          onClick={() => !loading && setUseExpiration(!useExpiration)}
        >
          <div className={`checkbox-custom ${useExpiration ? 'checked' : ''}`}></div>
          <span>Set custom link expiration (At most 7 days)</span>
        </div>

        {useExpiration && (
          <div className="expiration-slider-container">
            <div className="slider-header">
              <span>Link Validity Duration:</span>
              <span className="slider-value">{humanizeHours(expirationHours)}</span>
            </div>
            <input
              type="range"
              className="expiration-range-slider"
              min="1"
              max="168"
              value={expirationHours}
              onChange={(e) => setExpirationHours(e.target.value)}
              disabled={loading}
            />
            {previewDate && (
              <div className="slider-preview-banner">
                Link will expire on: <span className="slider-preview-time">{formatPreviewDate(previewDate)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="history-section">
        <h2 className="history-title">
          {user ? 'Your Dashboard History' : 'Guest Shortened Links'}
        </h2>
        
        <div className="links-grid">
          {links.length > 0 ? (
            links.map((link) => (
              <ShortUrl key={link.shortCode} urlData={link} onDelete={handleDeleteUrl} />
            ))
          ) : (
            <div className="empty-history-card">
              <span className="empty-history-icon">⚡</span>
              <h3>No shortened links yet</h3>
              <p>
                {user 
                  ? 'Your shortened links will automatically appear here.' 
                  : 'Shorten a link above to see it in your guest list.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Toast Notification Containers */}
      <div className="toasts-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.type === 'error' ? '❌' : '✨'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortUrlController;
