import React from 'react';
import { Navigate } from 'react-router-dom';
import JwtUtil from '../utils/JwtUtil';

/**
 * Aligned with JwtFilter.java
 * Route guard component that restricts access to authenticated users.
 */
export const JwtFilter = ({ children }) => {
  if (!JwtUtil.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default JwtFilter;
