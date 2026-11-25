import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, ChevronRight, Menu, Stethoscope } from 'lucide-react';
import { healthApi } from '../../api/client.js';
import { Button } from '../ui/Button.jsx';
import { SidebarNav } from './SidebarNav.jsx';

const ROUTE_LABELS = {
  '/dashboard': 'Dashboard',
  '/doctors': 'Doctors Directory',
  '/appointments': 'Appointments',
};

export function AppLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [dbDialect, setDbDialect] = useState('');

  useEffect(() => {
    let active = true;
    healthApi
      .check()
      .then((res) => {
        if (active) {
          setApiStatus('online');
          setDbDialect(res?.data?.dialect || '');
        }
      })
      .catch(() => {
        if (active) setApiStatus('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  const currentLabel = ROUTE_LABELS[location.pathname] || 'Dashboard';
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="app-shell">
      <SidebarNav
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        apiStatus={apiStatus}
        dbDialect={dbDialect}
      />

      <div className="main-wrapper">
        <header className="desktop-topbar">
          <div className="topbar-breadcrumb" aria-label="Breadcrumb">
            <span className="topbar-breadcrumb-brand">BrightSmile Dental</span>
            <ChevronRight size={14} aria-hidden="true" style={{ color: '#94a3b8' }} />
            <span className="topbar-breadcrumb-current">{currentLabel}</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-date-chip">
              <Calendar size={14} aria-hidden="true" style={{ color: '#0d9488' }} />
              <span>{formattedToday}</span>
            </div>
          </div>
        </header>

        <header className="mobile-topbar">
          <div className="row-inline" style={{ gap: 10 }}>
            <div className="brand-mark" style={{ width: 32, height: 32 }} aria-hidden="true">
              <Stethoscope size={16} />
            </div>
            <div>
              <span className="brand-title" style={{ fontSize: '0.95rem' }}>BrightSmile</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            style={{ color: '#ffffff' }}
          >
            <Menu size={20} />
          </Button>
        </header>

        <main className="main-content">
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
