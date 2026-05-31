import React from 'react';
import './User.css';
import JwtUtil from '../utils/JwtUtil';

/**
 * Aligned with User.java
 * Displays the current user context and handles session termination.
 */
export const User = ({ user, onLogout }) => {
  if (!user) return null;

  const handleLogoutClick = () => {
    JwtUtil.clearToken();
    if (onLogout) {
      onLogout();
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="user-profile-container">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="user-avatar" />
      ) : (
        <div className="user-avatar-placeholder">{getInitials(user.name)}</div>
      )}
      <div className="user-info">
        <span className="user-name">{user.name}</span>
        <span className="user-email">{user.email}</span>
        <span className={`user-badge ${user.provider}`}>
          {user.provider}
        </span>
      </div>
      <button className="logout-button" onClick={handleLogoutClick}>
        Log Out
      </button>
    </div>
  );
};

export default User;
