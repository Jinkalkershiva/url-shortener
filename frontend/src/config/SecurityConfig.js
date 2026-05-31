import axios from 'axios';
import JwtUtil from '../utils/JwtUtil';

/**
 * Aligned with SecurityConfig.java
 * Configures global network interceptors and auth headers.
 */
export const SecurityConfig = {
  configureInterceptors(onAuthFailure) {
    // Inject bearer token into headers of every API request
    axios.interceptors.request.use(
      (config) => {
        const token = JwtUtil.getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle token expirations or unauthorized accesses
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          JwtUtil.clearToken();
          if (onAuthFailure) {
            onAuthFailure();
          } else {
            // Hard redirection fallback
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/') {
              window.location.href = '/login?expired=true';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }
};

export default SecurityConfig;
