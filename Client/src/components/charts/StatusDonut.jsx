// The chart is decorative (aria-hidden): the legend beside it states every
// figure as text, so nothing depends on seeing the colours.

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { toStatusSlices } from '../../utils/dashboardData';

export default function StatusDonut({ byStatus }) {
  const slices = toStatusSlices(byStatus);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) return <p className="chart-empty">No issues yet.</p>;

  const visible = slices.filter((slice) => slice.value > 0);

  return (
    <div className="donut">
      <div className="donut-chart" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={visible} dataKey="value" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2} stroke="none">
              {visible.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="donut-legend">
        {slices.map((slice) => (
          <li key={slice.key}>
            <span className="swatch" style={{ background: slice.color }} aria-hidden="true" />
            <span className="legend-label">{slice.label}</span>
            <strong>{slice.value}</strong>
            <span className="legend-percent">{slice.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
