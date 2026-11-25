import { NavLink } from 'react-router-dom';
import {
  CalendarClock,
  LayoutDashboard,
  Stethoscope,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: CalendarClock },
];

export function SidebarNav({ isOpen, onClose, apiStatus }) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand row-between">
          <div className="row-inline" style={{ gap: 12 }}>
            <div className="brand-mark" aria-hidden="true">
              <Stethoscope size={21} />
            </div>
            <div>
              <div className="brand-title">BrightSmile</div>
              <div className="brand-subtitle">Dental Clinic Manager</div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mobile-close-btn"
            aria-label="Close navigation menu"
            style={{ display: isOpen ? 'inline-flex' : 'none' }}
          >
            <X size={18} />
          </Button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Clinic Operations</div>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="clinic-status-pill" title="Backend API connection status">
            <span
              className={`status-dot ${apiStatus === 'offline' ? 'offline' : ''}`}
              aria-hidden="true"
            />
            <span>
              {apiStatus === 'online'
                ? 'API & Database Connected'
                : apiStatus === 'offline'
                  ? 'API Offline'
                  : 'Checking API...'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
