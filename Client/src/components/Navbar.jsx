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

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        CivicFix
      </Link>

      <nav className="navbar-links">
        {isAuthenticated ? (
          <>
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
