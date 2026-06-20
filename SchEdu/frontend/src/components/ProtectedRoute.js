import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken, getRole } from '../services/authService';

const ProtectedRoute = ({ children, userRole, allowedRoles }) => {
  const token = getToken();
  const role = userRole || getRole();

  // If token is missing, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role restriction is provided, enforce it
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
  }

  // Otherwise, render children
  return children;
};

export default ProtectedRoute;
