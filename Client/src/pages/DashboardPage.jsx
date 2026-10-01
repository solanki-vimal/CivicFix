/*
 * Deliberately minimal placeholder. Its only job in this phase is to prove
 * the auth flow works end to end: sign up / log in / Google OAuth all land
 * here (the backend's Google callback redirects to CLIENT_URL/dashboard),
 * ProtectedRoute lets an authenticated user through, and the socket
 * connection is live. The real role-specific dashboards are Phase 9.
 */

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <span className="dashboard-brand">CivicFix</span>
        <button type="button" className="dashboard-logout" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <main className="dashboard-main">
        <h1>Hello, {user.name}</h1>
        <p>You're signed in. The full experience — reporting issues, browsing the map — arrives in the next phases.</p>

        <dl className="dashboard-details">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{user.role}</dd>
          </div>
          <div>
            <dt>Live updates</dt>
            <dd>{connected ? 'Connected' : 'Not connected'}</dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
