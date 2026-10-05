import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import IssueFeedPage from './pages/IssueFeedPage';
import IssueDetailPage from './pages/IssueDetailPage';

export default function App() {
  return (
    <Routes>
      {/* Public issue feed — the actual home page, viewable
          without logging in. Not a redirect target anymore now that it has
          real content. */}
      <Route path="/" element={<IssueFeedPage />} />
      <Route path="/issues/:id" element={<IssueDetailPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        {/* The backend's Google OAuth callback redirects to CLIENT_URL/dashboard,
            so this exact path needs to exist as a protected route. */}
        <Route path="/dashboard" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
