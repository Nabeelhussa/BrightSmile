import { NavLink } from 'react-router-dom';
import {
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  Server,
  Stethoscope,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: CalendarClock },
];

export function SidebarNav({ isOpen, onClose, apiStatus, dbDialect }) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="row-inline" style={{ gap: 12 }}>
            <div className="brand-mark" aria-hidden="true">
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="brand-title">BrightSmile</div>
              <div className="brand-subtitle-badge">Practice Console</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close navigation menu"
            style={{ display: isOpen ? 'inline-flex' : 'none', color: '#475569' }}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Practice Management</div>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <div className="nav-link-content">
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </div>
              <ChevronRight size={14} style={{ opacity: 0.5 }} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="clinic-meta-card" title="Backend API & database status">
            <div className="clinic-status-row">
              <span
                className={`status-dot ${apiStatus === 'offline' ? 'offline' : ''}`}
                aria-hidden="true"
              />
              <span>
                {apiStatus === 'online'
                  ? 'System Operational'
                  : apiStatus === 'offline'
                    ? 'Server Offline'
                    : 'Connecting...'}
              </span>
            </div>
            <div className="row-inline text-muted" style={{ fontSize: '0.75rem', gap: 6, color: '#64748b' }}>
              <Server size={12} />
              <span>
                {apiStatus === 'online'
                  ? `REST API • ${dbDialect ? dbDialect.toUpperCase() : 'DB'} Active`
                  : apiStatus === 'offline'
                    ? 'Check local server'
                    : 'Checking health...'}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
