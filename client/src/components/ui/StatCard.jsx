export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  tone = 'teal',
  progress,
}) {
  const clampedProgress =
    typeof progress === 'number' ? Math.max(0, Math.min(100, progress)) : null;

  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-top">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
        {Icon && (
          <div className={`stat-icon ${tone}`} aria-hidden="true">
            <Icon size={20} />
          </div>
        )}
      </div>

      {clampedProgress !== null && (
        <div className="stat-meter-track" aria-hidden="true">
          <div
            className={`stat-meter-fill ${tone}`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      )}

      {subtext && <div className="stat-subtext">{subtext}</div>}
    </article>
  );
}
