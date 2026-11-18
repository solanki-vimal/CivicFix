// Analytics dashboard . A super admin sees the
// whole city and can narrow it to one department; a department admin always
// sees their own department — the server pins that, the page just shows it.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { ChartCard, KpiCard } from '../components/charts/ChartCard';
import StatusDonut from '../components/charts/StatusDonut';
import CategoryBars from '../components/charts/CategoryBars';
import WeeklyTrend from '../components/charts/WeeklyTrend';
import DepartmentPerformance from '../components/charts/DepartmentPerformance';
import DensityMap from '../components/charts/DensityMap';
import { useAuth } from '../context/AuthContext';
import * as analyticsApi from '../api/analyticsApi';
import * as departmentApi from '../api/departmentApi';
import { compareWithLastMonth, formatHours } from '../utils/dashboardData';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user.role === 'super_admin';

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [summary, setSummary] = useState(null);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isSuperAdmin) {
      departmentApi.getDepartments().then((res) => setDepartments(res.data));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      analyticsApi.getSummary(departmentId || undefined),
      analyticsApi.getLocations(departmentId || undefined),
    ])
      .then(([summaryRes, locationsRes]) => {
        if (cancelled) return;
        setSummary(summaryRes.data);
        setPoints(locationsRes.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setSummary(null);
        setError(err.response?.data?.message || 'Could not load the dashboard. Please try again.');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  const scopedDepartment = summary?.scope.department;
  const maxWorkload = summary ? Math.max(1, ...summary.staffWorkload.map((row) => row.openCount)) : 1;

  return (
    <div className="dash-shell">
      <Navbar />
      <div className="dash-content">
        <div className="dash-header">
          <div>
            <h1>Dashboard</h1>
            {summary && (
              <p className="dash-scope">
                Showing {scopedDepartment ? `the ${scopedDepartment.name} department` : 'all departments'}
              </p>
            )}
          </div>
          {isSuperAdmin && (
            <select
              className="dash-filter"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              aria-label="Department"
            >
              <option value="">All departments</option>
              {departments.map((department) => (
                <option key={department._id} value={department._id}>
                  {department.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && <p className="dash-error">{error}</p>}
        {!summary && loading && <p className="dash-loading">Loading dashboard…</p>}

        {summary && (
          <div className={loading ? 'dash-busy' : undefined} aria-busy={loading}>
            <div className="kpi-grid">
              <KpiCard label="Total issues" value={summary.totals.total} />
              <KpiCard label="Open issues" value={summary.totals.open} note="Pending, open and in progress" />
              <KpiCard
                label="Resolved this month"
                value={summary.totals.resolvedThisMonth}
                note={compareWithLastMonth(summary.totals.resolvedThisMonth, summary.totals.resolvedLastMonth)}
              />
              <KpiCard label="Average resolution time" value={formatHours(summary.avgResolutionHours)} />
            </div>

            <div className="chart-grid">
              <ChartCard title="Issues by status">
                <StatusDonut byStatus={summary.byStatus} />
              </ChartCard>

              <ChartCard title="Issues by category">
                <CategoryBars data={summary.byCategory} />
              </ChartCard>

              <ChartCard title="Issues reported per week" wide>
                <WeeklyTrend data={summary.weeklyTrend} />
              </ChartCard>

              {scopedDepartment ? (
                <ChartCard title="Staff workload">
                  {summary.staffWorkload.length === 0 ? (
                    <p className="chart-empty">No staff are assigned to this department yet.</p>
                  ) : (
                    <ul className="workload">
                      {summary.staffWorkload.map((row) => (
                        <li key={row.staffId}>
                          <span className="workload-name">{row.name}</span>
                          <span className="workload-bar" aria-hidden="true">
                            <span style={{ width: `${(row.openCount / maxWorkload) * 100}%` }} />
                          </span>
                          <strong>{row.openCount}</strong>
                          <span className="workload-unit">active</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </ChartCard>
              ) : (
                <ChartCard title="Average resolution time by department">
                  <DepartmentPerformance data={summary.departmentPerformance} />
                </ChartCard>
              )}

              <ChartCard title="Most upvoted unresolved issues">
                {summary.topUnresolvedByUpvotes.length === 0 ? (
                  <p className="chart-empty">No unresolved issue has been upvoted yet.</p>
                ) : (
                  <ol className="top-issues">
                    {summary.topUnresolvedByUpvotes.map((issue) => (
                      <li key={issue._id}>
                        <Link to={`/issues/${issue._id}`}>{issue.title}</Link>
                        <StatusBadge status={issue.status} />
                        <span className="top-issues-votes">{issue.upvoteCount} upvotes</span>
                      </li>
                    ))}
                  </ol>
                )}
              </ChartCard>

              <ChartCard title="Where issues are reported" wide>
                <DensityMap points={points} />
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
