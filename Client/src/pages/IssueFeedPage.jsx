// Public feed : map + list side by side, both driven by the
// same filter state so they always stay in sync, plus infinite scroll on
// the list via the native Intersection Observer hook.

import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import IssueCard from '../components/IssueCard';
import IssueMap from '../components/IssueMap';
import * as issueApi from '../api/issueApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import './IssueFeedPage.css';

const PAGE_SIZE = 20;
const NEAR_ME_RADIUS = 5000; // meters, matches the backend's own default

export default function IssueFeedPage() {
  const [filters, setFilters] = useState({ category: '', status: '', department: '' });
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { coords, error: geoError, loading: geoLoading, requestLocation, clearLocation } = useGeolocation();

  const buildQuery = useCallback(
    (pageNum) => ({
      ...filters,
      lng: coords?.lng,
      lat: coords?.lat,
      radius: coords ? NEAR_ME_RADIUS : undefined,
      page: pageNum,
      limit: PAGE_SIZE,
    }),
    [filters, coords]
  );

  // Reset to page 1 and refetch whenever filters or the near-me location change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    issueApi
      .getIssues(buildQuery(1))
      .then((res) => {
        if (cancelled) return;
        setIssues(res.data);
        setTotal(res.pagination.total);
        setPage(1);
      })
      .catch(() => !cancelled && setError('Could not load issues. Please try again.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, coords]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setLoading(true);
    issueApi
      .getIssues(buildQuery(nextPage))
      .then((res) => {
        setIssues((prev) => [...prev, ...res.data]);
        setPage(nextPage);
      })
      .catch(() => setError('Could not load more issues.'))
      .finally(() => setLoading(false));
  }, [page, buildQuery]);

  const hasMore = issues.length < total;
  const sentinelRef = useInfiniteScroll({ hasMore, loading, onLoadMore: loadMore });

  const handleNearMe = () => {
    if (coords) {
      clearLocation();
    } else {
      requestLocation();
    }
  };

  return (
    <div className="feed-shell">
      <Navbar />
      <div className="feed-content">
        <div className="feed-header">
          <h1>Issues near you</h1>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onNearMe={handleNearMe}
            nearMeActive={!!coords}
            nearMeLoading={geoLoading}
          />
          {geoError && <p className="feed-geo-error">{geoError}</p>}
        </div>

        <div className="feed-split">
          <div className="feed-list">
            {error && <p className="feed-error">{error}</p>}
            {!loading && issues.length === 0 && !error && (
              <p className="feed-empty">No issues match these filters yet.</p>
            )}
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
            {hasMore && <div ref={sentinelRef} className="feed-sentinel" />}
            {loading && <p className="feed-loading">Loading…</p>}
          </div>

          <div className="feed-map">
            <IssueMap issues={issues} center={coords} />
          </div>
        </div>
      </div>
    </div>
  );
}
