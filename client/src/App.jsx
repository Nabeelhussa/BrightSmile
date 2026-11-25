import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { AppointmentsPage } from './pages/AppointmentsPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { DoctorsPage } from './pages/DoctorsPage.jsx';

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
