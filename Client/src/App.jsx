import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import IssueFeedPage from './pages/IssueFeedPage';
import IssueDetailPage from './pages/IssueDetailPage';
import ReportIssuePage from './pages/ReportIssuePage';

export default function App() {
  return (
    <Routes>
      {/* Public issue feed — the actual home page, viewable
          without logging in.  */}
      <Route path="/" element={<IssueFeedPage />} />
      <Route path="/issues/:id" element={<IssueDetailPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Logged-out visitors are sent to /login and returned here afterwards
          (LoginPage honours location.state.from). */}
      <Route element={<ProtectedRoute />}>
        <Route path="/report" element={<ReportIssuePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
