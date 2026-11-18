// Date helpers for the analytics charts. Everything is UTC, to match how
// MongoDB's $isoWeek / $isoWeekYear operators bucket dates by default.

const DAY_MS = 86400000;

// Monday 00:00 UTC of the ISO week containing `date`.
const startOfIsoWeekUTC = (date) => {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const isoDayOfWeek = day.getUTCDay() || 7; // Sunday is 7, not 0
  return new Date(day.getTime() - (isoDayOfWeek - 1) * DAY_MS);
};

// Monday of ISO week `isoWeek` in ISO year `isoYear`. January 4th always
// falls in ISO week 1, which anchors the calculation.
const isoWeekToMonday = (isoYear, isoWeek) => {
  const week1Monday = startOfIsoWeekUTC(new Date(Date.UTC(isoYear, 0, 4)));
  return new Date(week1Monday.getTime() + (isoWeek - 1) * 7 * DAY_MS);
};

// The last `weeks` week-start dates (Mondays), oldest first, ending with the
// current week. The first entry is a whole week, so every bucket in the
// trend chart covers the same span of time.
const getTrendWindow = (now = new Date(), weeks = 12) => {
  const thisMonday = startOfIsoWeekUTC(now);
  return Array.from({ length: weeks }, (_, i) => new Date(thisMonday.getTime() - (weeks - 1 - i) * 7 * DAY_MS));
};

// $group only returns weeks that have data, so a quiet week would simply be
// missing and the line chart would join its neighbours as if nothing happened.
// This returns one entry per week in the window, with 0 where there is no data.
// rows: [{ week, year, count }] straight from the aggregation.
const fillWeeklyTrend = (window, rows) => {
  const counts = new Map(rows.map((row) => [isoWeekToMonday(row.year, row.week).toISOString().slice(0, 10), row.count]));
  return window.map((monday) => {
    const weekStart = monday.toISOString().slice(0, 10);
    return { weekStart, count: counts.get(weekStart) || 0 };
  });
};

const getMonthBounds = (now = new Date()) => ({
  startOfThisMonth: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  startOfLastMonth: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
});

module.exports = { startOfIsoWeekUTC, isoWeekToMonday, getTrendWindow, fillWeeklyTrend, getMonthBounds };
