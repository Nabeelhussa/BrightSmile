export function StatCard({ label, value, subtext, icon: Icon, tone = 'teal' }) {
  return (
    <article className="stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className={`stat-icon ${tone}`} aria-hidden="true">
          <Icon size={22} />
        </div>
      )}
    </article>
  );
}
