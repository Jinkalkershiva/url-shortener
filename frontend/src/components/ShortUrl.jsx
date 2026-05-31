import React, { useState, useEffect } from 'react';
import './ShortUrl.css';

/**
 * Aligned with ShortUrl.java
 * Visual card representing a shortened URL resource and its click stats.
 */
export const ShortUrl = ({ urlData, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState('');

  const { shortUrl, originalUrl, shortCode, expiredAt, clickCount } = urlData;

  const isExpired = expiredAt ? new Date(expiredAt) < new Date() : false;

  useEffect(() => {
    if (!expiredAt || isExpired) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const diff = new Date(expiredAt) - new Date();
      if (diff <= 0) {
        setCountdown('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let str = '';
      if (days > 0) str += `${days}d `;
      if (hours > 0 || days > 0) str += `${hours}h `;
      str += `${minutes}m ${seconds}s`;
      setCountdown(str);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiredAt, isExpired]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="short-url-card">
      <div className="short-url-header">
        <span className="short-url-code">/{shortCode}</span>
        <span className={`short-url-status ${isExpired ? 'expired' : 'active'}`}>
          {isExpired ? 'Expired' : 'Active'}
        </span>
      </div>

      <div className="short-url-body">
        <div className="short-url-link-group">
          <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-url-display">
            {shortUrl}
          </a>
          <button className={`copy-button ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button className="delete-url-btn" onClick={() => onDelete(shortCode)}>
            Remove
          </button>
        </div>
        <div className="original-url-display" title={originalUrl}>
          Original: {originalUrl}
        </div>
      </div>

      <div className="short-url-footer">
        <div className="clicks-badge">
          <span>Clicks:</span>
          <span className="clicks-count">{clickCount || 0}</span>
        </div>
        {expiredAt && (
          <div className="expiration-display">
            {isExpired ? (
              <span>Expired: <span className="expiration-time">{formatDate(expiredAt)}</span></span>
            ) : (
              <span>Expires in: <span className={`expiration-time ${countdown.includes('s') && !countdown.includes('h') && !countdown.includes('d') ? 'soon' : ''}`}>{countdown}</span></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortUrl;
