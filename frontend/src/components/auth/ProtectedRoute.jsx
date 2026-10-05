import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UnauthorizedPage from '../../pages/UnauthorizedPage';

/**
 * Route guard component enforcing authentication and strict RBAC.
 * If user role does not match allowedRoles, renders the 403 Unauthorized experience.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles]
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div className="spinner" style={{ width: '36px', height: '36px', borderTopColor: '#0D9488' }} />
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
          Verifying Zero-Trust Credentials...
        </span>
      </div>
    );
  }

  // 1. Not Authenticated -> Redirect to Login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Strict RBAC Check
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user?.role || '').toUpperCase();
    const hasPermission = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);

    if (!hasPermission) {
      // Return explicit 403 Unauthorized experience
      return <UnauthorizedPage />;
    }
  }

  return children;
}
