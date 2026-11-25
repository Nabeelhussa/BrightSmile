import { useEffect, useState } from 'react';
import { Menu, Stethoscope } from 'lucide-react';
import { healthApi } from '../../api/client.js';
import { Button } from '../ui/Button.jsx';
import { SidebarNav } from './SidebarNav.jsx';

export function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    let active = true;
    healthApi
      .check()
      .then(() => {
        if (active) setApiStatus('online');
      })
      .catch(() => {
        if (active) setApiStatus('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <SidebarNav
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        apiStatus={apiStatus}
      />

      <div className="main-wrapper">
        <header className="mobile-topbar">
          <div className="row-inline" style={{ gap: 10 }}>
            <div className="brand-mark" style={{ width: 34, height: 34 }} aria-hidden="true">
              <Stethoscope size={17} />
            </div>
            <span className="brand-title">BrightSmile Dental</span>
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </Button>
        </header>

        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
