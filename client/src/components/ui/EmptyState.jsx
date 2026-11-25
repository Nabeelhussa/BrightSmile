import { Inbox } from 'lucide-react';

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="state-container">
      <div className="state-icon" aria-hidden="true">
        <Icon size={24} />
      </div>
      <h3 className="state-title">{title}</h3>
      {description && <p className="state-description">{description}</p>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}
