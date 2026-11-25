const STATUS_VARIANTS = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>{children}</span>
  );
}

export function StatusBadge({ status }) {
  const normalized = (status || 'pending').toLowerCase();
  const variant = STATUS_VARIANTS[normalized] || 'neutral';
  return <Badge variant={variant}>{normalized}</Badge>;
}

export function ActiveBadge({ isActive }) {
  return (
    <Badge variant={isActive ? 'success' : 'neutral'}>
      {isActive ? 'Active Roster' : 'Inactive'}
    </Badge>
  );
}
