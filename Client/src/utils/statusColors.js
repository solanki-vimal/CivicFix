// The same five colours as the --color-status-* CSS variables in index.css,
// for the places that need a real hex value (SVG charts can't read CSS variables
// through Recharts' props reliably).

export const STATUS_ORDER = ['pending', 'open', 'in_progress', 'resolved', 'rejected'];

export const STATUS_COLORS = {
  pending: '#8a8f87',
  open: '#2e6f95',
  in_progress: '#d6a419',
  resolved: '#2f7d5d',
  rejected: '#b23a2e',
};
