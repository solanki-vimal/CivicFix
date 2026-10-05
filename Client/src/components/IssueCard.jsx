// title, category, status badge, upvote count, photo thumbnail, address,
// time posted.

import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import './IssueCard.css';

export default function IssueCard({ issue }) {
  const thumbnail = issue.images?.[0];

  return (
    <Link to={`/issues/${issue._id}`} className="issue-card">
      <div className="issue-card-thumb">
        {thumbnail ? (
          <img src={thumbnail} alt="" loading="lazy" />
        ) : (
          <div className="issue-card-thumb-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="issue-card-body">
        <div className="issue-card-top">
          <span className="issue-card-category" style={{ color: issue.category?.color }}>
            {issue.category?.name}
          </span>
          <StatusBadge status={issue.status} />
        </div>
        <h3 className="issue-card-title">{issue.title}</h3>
        <div className="issue-card-meta">
          <span>{issue.address || 'Location pinned on map'}</span>
          <span aria-hidden="true">·</span>
          <span>{formatRelativeTime(issue.createdAt)}</span>
        </div>
        <div className="issue-card-upvotes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4l8 10h-5v6H9v-6H4z" />
          </svg>
          {issue.upvoteCount ?? 0}
        </div>
      </div>
    </Link>
  );
}
