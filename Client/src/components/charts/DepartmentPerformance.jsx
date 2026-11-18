// City-wide only: average hours to resolve, per department.

import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

function PerformanceTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{row.department}</strong>
      <div>{row.total} issues, {row.resolved} resolved</div>
      <div>Average resolution: {row.avgResolutionHours} h</div>
    </div>
  );
}

export default function DepartmentPerformance({ data }) {
  if (data.length === 0 || data.every((row) => row.resolved === 0)) {
    return <p className="chart-empty">No issue has been resolved yet.</p>;
  }
  const height = Math.max(200, data.length * 44 + 40);
  const summary = data.map((row) => `${row.department} ${row.avgResolutionHours} hours`).join(', ');

  return (
    <div style={{ height }} role="img" aria-label={`Average resolution time by department: ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40 }}>
          <XAxis type="number" unit=" h" allowDecimals={false} />
          <YAxis type="category" dataKey="department" width={160} tick={{ fontSize: 12 }} />
          <Tooltip content={<PerformanceTooltip />} cursor={{ fill: 'rgba(23, 36, 32, 0.05)' }} />
          <Bar dataKey="avgResolutionHours" name="Average hours" fill="#2f7d5d" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="avgResolutionHours" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
