// Deliberately minimal placeholder. Its only job is to prove the auth flow
// works end to end: sign up / log in / Google OAuth all land here (the
// backend's Google callback redirects to CLIENT_URL/dashboard),
// ProtectedRoute lets an authenticated user through, and the socket
// connection is live. The real role-specific dashboards are Phase 9.
// Now uses the shared Navbar (introduced in Phase 7) instead of its own
// ad-hoc header, for consistency with the feed and detail pages.

import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const { connected } = useSocket();

  return (
    <div className="dashboard-shell">
      <Navbar />

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