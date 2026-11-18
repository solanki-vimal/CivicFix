// Turns the analytics API's response into what the charts and cards show.
// Kept as plain functions (no React) so they can be tested on their own.

import { STATUS_COLORS, STATUS_ORDER } from './statusColors';

const STATUS_LABELS = {
  pending: 'Pending',
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

// One slice per status, always in the same order, with its share of the total.
export const toStatusSlices = (byStatus = {}) => {
  const slices = STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_LABELS[key],
    value: byStatus[key] ?? 0,
    color: STATUS_COLORS[key],
  }));
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  return slices.map((slice) => ({
    ...slice,
    percent: total === 0 ? 0 : Math.round((slice.value / total) * 100),
  }));
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-09-21" -> "21 Sep". The date is read as UTC because the server buckets
// weeks in UTC; reading it in local time could show the previous day. Month names
// come from a fixed list, not Intl: browsers disagree on abbreviations (some give
// "Sept" for en-GB), which would make the chart labels differ from machine to machine.
export const formatWeekLabel = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
};

// Hours up to two days, days beyond that; 0 means there is nothing resolved to average.
export const formatHours = (hours) => {
  if (!hours) return 'No data';
  return hours >= 48 ? `${(hours / 24).toFixed(1)} days` : `${hours} h`;
};

export const compareWithLastMonth = (thisMonth, lastMonth) => {
  const diff = thisMonth - lastMonth;
  const comparison = diff > 0 ? `${diff} more than last month` : diff < 0 ? `${-diff} fewer than last month` : 'Same as last month';
  return `${comparison} (${lastMonth})`;
};
