import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import IssueFeedPage from './pages/IssueFeedPage';
import IssueDetailPage from './pages/IssueDetailPage';
import ReportIssuePage from './pages/ReportIssuePage';
import MyReportsPage from './pages/MyReportsPage';

// Loaded on demand: the charting library is large, and only admins ever need it.
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

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
        <Route path="/my-reports" element={<MyReportsPage />} />

        <Route element={<RequireRole roles={['dept_admin', 'super_admin']} />}>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<p className="route-loading">Loading…</p>}>
                <AdminDashboardPage />
              </Suspense>
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
