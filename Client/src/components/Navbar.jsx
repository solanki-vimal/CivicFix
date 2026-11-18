// Shared header across the public feed, issue detail, and dashboard pages.

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Only citizens can create issues (the backend rejects other roles), so the
  // link is hidden for staff/admins. Logged-out visitors still see it:
  // /report is protected, so they're sent to log in and returned afterwards.
  const canReport = !isAuthenticated || user.role === 'citizen';

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        CivicFix
      </Link>

      <nav className="navbar-links">
        {canReport && (
          <Link to="/report" className={isAuthenticated ? 'navbar-cta' : undefined}>
            Report an issue
          </Link>
        )}
        {isAuthenticated ? (
          <>
            {/* Plain text, not a link — there's no dashboard/account page
                to send this to yet. Revisit once Phase 9 adds one. */}
            {user.role === 'citizen' && <Link to="/my-reports">My reports</Link>}
            {(user.role === 'dept_admin' || user.role === 'super_admin') && <Link to="/admin">Dashboard</Link>}
            <span className="navbar-username">{user.name}</span>
            <button type="button" className="navbar-logout" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup" className="navbar-cta">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
