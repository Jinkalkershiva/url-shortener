/**
 * Aligned with JwtUtil.java
 * Handles storage and extraction of JWT authentication tokens on the client.
 */

const TOKEN_KEY = 'url_shortener_jwt';

export const JwtUtil = {
  saveToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = this.decodePayload(token);
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch (e) {
      return false;
    }
  },

  getUserEmail() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      return payload.sub;
    } catch (e) {
      return null;
    }
  },

  getUserName() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      return payload.name;
    } catch (e) {
      return null;
    }
  },

  decodePayload(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Failed to decode JWT payload:', e);
      throw e;
    }
  }
};

export default JwtUtil;
