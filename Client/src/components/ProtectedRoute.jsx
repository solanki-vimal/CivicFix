/*
   Design tokens for CivicFix. Colors, type, and status semantics are
   defined once here — every page and component in later phases should
   reference these variables rather than hardcoding hex values, so a
   future palette adjustment only happens in one place. */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Still waiting on the initial GET /me check — rendering nothing (or a
    // spinner) here avoids a flash-redirect to /login on every page refresh
    // before we actually know whether the session cookie is still valid.
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
