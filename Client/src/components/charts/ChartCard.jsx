import './charts.css';

export function ChartCard({ title, children, wide = false }) {
  return (
    <section className={`chart-card${wide ? ' chart-card-wide' : ''}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function KpiCard({ label, value, note }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      {note && <span className="kpi-note">{note}</span>}
    </div>
  );
}
