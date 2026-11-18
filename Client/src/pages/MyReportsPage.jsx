// src/pages/MyReportsPage.jsx
// A citizen's own reports with their current status, so they can follow each
// one to resolution. Backed by GET /api/issues/mine (citizen-only, newest
// first, paginated); infinite scroll uses the same native-observer hook as the feed.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import IssueCard from '../components/IssueCard';
import { useAuth } from '../context/AuthContext';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import * as issueApi from '../api/issueApi';
import '../components/forms.css';
import './MyReportsPage.css';

const PAGE_SIZE = 20;

function MyReportsList() {
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    issueApi
      .getMyIssues({ page: 1, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setIssues(res.data);
        setTotal(res.pagination.total);
      })
      .catch(() => !cancelled && setError('Could not load your reports. Please try again.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setLoading(true);
    issueApi
      .getMyIssues({ page: nextPage, limit: PAGE_SIZE })
      .then((res) => {
        // Page offsets shift if a new report is filed mid-scroll, which can
        // repeat an item across pages — drop anything already shown.
        setIssues((prev) => {
          const seen = new Set(prev.map((issue) => issue._id));
          return [...prev, ...res.data.filter((issue) => !seen.has(issue._id))];
        });
        setPage(nextPage);
      })
      .catch(() => setError('Could not load more of your reports.'))
      .finally(() => setLoading(false));
  }, [page]);

  const hasMore = issues.length < total;
  const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore: loadMore });

  return (
    <>
      {!loading && !error && total > 0 && (
        <p className="reports-summary">
          {total} {total === 1 ? 'issue' : 'issues'} reported
        </p>
      )}

      {error && <p className="reports-error">{error}</p>}

      {!loading && !error && issues.length === 0 && (
        <div className="reports-empty">
          <p>You haven't reported any issues yet.</p>
          <Link to="/report" className="btn btn-primary">
            Report an issue
          </Link>
        </div>
      )}

      <div className="reports-list">
        {issues.map((issue) => (
          <div key={issue._id} className="my-report">
            <IssueCard issue={issue} />
            {/* The reason lives on the issue only while it is rejected (it is
                cleared if the issue is reopened), so this never shows stale text. */}
            {issue.status === 'rejected' && issue.rejectionReason && (
              <p className="my-report-note">
                <strong>Why it was rejected:</strong> {issue.rejectionReason}
              </p>
            )}
          </div>
        ))}
        {hasMore && <div ref={sentinelRef} className="reports-sentinel" />}
        {loading && <p className="reports-loading">Loading…</p>}
      </div>
    </>
  );
}

export default function MyReportsPage() {
  const { user } = useAuth();
  const isCitizen = user?.role === 'citizen';

  return (
    <div className="reports-shell">
      <Navbar />
      <div className="reports-content">
        <h1>My reports</h1>
        {isCitizen ? (
          <MyReportsList />
        ) : (
          <p className="reports-blocked">
            Only citizen accounts have reports, and you're signed in as {user?.role?.replace('_', ' ')}.{' '}
            <Link to="/">Back to the feed</Link>
          </p>
        )}
      </div>
    </div>
  );
}
