import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatWeekLabel } from '../../utils/dashboardData';

export default function WeeklyTrend({ data }) {
  const points = data.map((week) => ({ label: formatWeekLabel(week.weekStart), count: week.count }));
  const total = points.reduce((sum, point) => sum + point.count, 0);
  if (total === 0) return <p className="chart-empty">No issues were reported in the last 12 weeks.</p>;

  const summary = points.map((point) => `week of ${point.label}: ${point.count}`).join(', ');

  return (
    <div className="trend" role="img" aria-label={`Issues reported per week, last 12 weeks. ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ left: -16, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="count" name="Issues reported" stroke="#0f5257" fill="#0f5257" fillOpacity={0.18} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
