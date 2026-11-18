import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList, ResponsiveContainer } from 'recharts';

export default function CategoryBars({ data }) {
  if (data.length === 0) return <p className="chart-empty">No issues yet.</p>;

  // Grow with the number of categories so labels never overlap.
  const height = Math.max(220, data.length * 34 + 40);
  const summary = data.map((row) => `${row.category} ${row.count}`).join(', ');

  return (
    <div style={{ height }} role="img" aria-label={`Issues by category: ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32 }}>
          <XAxis type="number" allowDecimals={false} />
          <YAxis type="category" dataKey="category" width={150} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: 'rgba(23, 36, 32, 0.05)' }} />
          <Bar dataKey="count" name="Issues" radius={[0, 4, 4, 0]}>
            {data.map((row, index) => (
              <Cell key={`${row.category}-${index}`} fill={row.color || '#0f5257'} />
            ))}
            <LabelList dataKey="count" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
