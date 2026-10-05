// Reused everywhere a status needs to be shown: issue cards, the map
// legend, and the detail page's timeline. Colors come from the
// --color-status-* variables defined once in index.css.

import './StatusBadge.css';

const LABELS = {
  pending: 'Pending',
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status}</span>;
}

export { LABELS as STATUS_LABELS };
