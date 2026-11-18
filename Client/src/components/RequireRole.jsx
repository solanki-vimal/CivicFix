// Used INSIDE ProtectedRoute, so a user is guaranteed to exist here. Sends
// anyone whose role isn't allowed back to the feed. This only decides what
// the interface shows — the server still enforces roles on every endpoint.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles }) {
  const { user } = useAuth();
  return roles.includes(user?.role) ? <Outlet /> : <Navigate to="/" replace />;
}
