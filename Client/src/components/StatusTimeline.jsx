// Each entry's reason/context comes from that entry's own `note` field, not
// from Issue.rejectionReason — the top-level field only reflects the
// issue's CURRENT state (and is cleared once status moves away from
// 'rejected', per the fix applied in updateIssueStatus). Reading from each
// historical entry instead means a past rejection still shows correctly
// here even after the issue was later reopened.

import StatusBadge from './StatusBadge';
import './StatusTimeline.css';

function formatTimestamp(dateString) {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function StatusTimeline({ history = [] }) {
  if (history.length === 0) {
    return <p className="timeline-empty">No status history yet.</p>;
  }

  return (
    <ol className="timeline">
      {history.map((entry) => (
        <li key={entry._id} className="timeline-entry">
          <span className={`timeline-dot status-${entry.toStatus}`} aria-hidden="true" />
          <div className="timeline-entry-body">
            <div className="timeline-entry-top">
              <StatusBadge status={entry.toStatus} />
              <span className="timeline-entry-time">{formatTimestamp(entry.createdAt)}</span>
            </div>
            <p className="timeline-entry-actor">
              {entry.fromStatus ? 'Updated' : 'Reported'} by {entry.changedBy?.name || 'Unknown'}
            </p>
            {entry.note && <p className="timeline-entry-note">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
