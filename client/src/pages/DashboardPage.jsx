import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  Clock,
  Plus,
  Stethoscope,
} from 'lucide-react';
import { appointmentsApi, doctorsApi } from '../api/client.js';
import { AppointmentFormModal } from '../components/appointments/AppointmentFormModal.jsx';
import { ActiveBadge, StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import {
  formatDisplayDate,
  formatDisplayTime,
  getInitials,
  getTodayIsoDate,
} from '../utils/formatters.js';

export function DashboardPage() {
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        doctorsApi.list(),
        appointmentsApi.list(),
      ]);
      setDoctors(doctorsRes.data || []);
      setAppointments(appointmentsRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const today = getTodayIsoDate();

  const metrics = useMemo(() => {
    const activeDoctors = doctors.filter((d) => d.is_active).length;
    const todaysAppointments = appointments.filter(
      (a) => a.appointment_date === today && a.status !== 'cancelled'
    );
    const upcomingAppointments = appointments.filter(
      (a) => a.appointment_date >= today && a.status !== 'cancelled' && a.status !== 'completed'
    );
    const pendingAppointments = appointments.filter((a) => a.status === 'pending');

    return {
      totalDoctors: doctors.length,
      activeDoctors,
      todaysCount: todaysAppointments.length,
      upcomingCount: upcomingAppointments.length,
      pendingCount: pendingAppointments.length,
    };
  }, [doctors, appointments, today]);

  const recentOrUpcoming = useMemo(() => {
    const upcoming = appointments.filter((a) => a.appointment_date >= today);
    if (upcoming.length > 0) return upcoming.slice(0, 6);
    return [...appointments].reverse().slice(0, 6);
  }, [appointments, today]);

  const handleCreateAppointment = async (payload) => {
    await appointmentsApi.create(payload);
    showToast('Appointment scheduled successfully.');
    await loadDashboard();
  };

  const appointmentColumns = [
    {
      key: 'patient_name',
      header: 'Patient',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.patient_name}</div>
          <div className="text-muted">{row.patient_contact}</div>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      header: 'Doctor',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.doctor_name}</div>
          <div className="text-muted">{row.doctor_specialization}</div>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Date & Time',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{formatDisplayDate(row.appointment_date)}</div>
          <div className="text-muted">{formatDisplayTime(row.appointment_time)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Clinic Dashboard</h1>
          <p className="page-description">
            Daily overview of dental practitioners, upcoming visits, and pending confirmations.
          </p>
        </div>
        <div className="page-actions">
          <Link to="/doctors" className="btn btn-secondary">
            Manage Doctors
          </Link>
          <Button onClick={() => setScheduleOpen(true)} disabled={loading || Boolean(error)}>
            <Plus size={16} />
            New Appointment
          </Button>
        </div>
      </header>

      {loading && <LoadingState message="Loading clinic dashboard..." />}

      {!loading && error && (
        <Card>
          <ErrorState
            title="Could not load dashboard"
            message={error}
            onRetry={loadDashboard}
          />
        </Card>
      )}

      {!loading && !error && (
        <>
          <section className="stats-grid" aria-label="Clinic summary metrics">
            <StatCard
              label="Total Doctors"
              value={metrics.totalDoctors}
              subtext={`${metrics.activeDoctors} active on roster`}
              icon={Stethoscope}
              tone="teal"
            />
            <StatCard
              label="Today's Appointments"
              value={metrics.todaysCount}
              subtext={`Scheduled for ${formatDisplayDate(today)}`}
              icon={CalendarCheck}
              tone="blue"
            />
            <StatCard
              label="Upcoming Appointments"
              value={metrics.upcomingCount}
              subtext="Active visits from today onward"
              icon={CalendarClock}
              tone="emerald"
            />
            <StatCard
              label="Pending Confirmation"
              value={metrics.pendingCount}
              subtext="Awaiting staff follow-up"
              icon={Clock}
              tone="amber"
            />
          </section>

          <div className="dashboard-grid">
            <Card
              title="Upcoming & Recent Appointments"
              noBodyPadding
              actions={
                <Link to="/appointments" className="btn btn-ghost btn-sm">
                  View all <ArrowRight size={14} />
                </Link>
              }
            >
              {recentOrUpcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No appointments scheduled"
                  description="Schedule your first patient appointment to populate the clinic timeline."
                  action={
                    <Button onClick={() => setScheduleOpen(true)}>
                      <Plus size={15} />
                      Schedule Appointment
                    </Button>
                  }
                />
              ) : (
                <DataTable
                  ariaLabel="Upcoming and recent appointments"
                  columns={appointmentColumns}
                  rows={recentOrUpcoming}
                  renderMobileCard={(row) => (
                    <>
                      <div className="row-between">
                        <div>
                          <div style={{ fontWeight: 700 }}>{row.patient_name}</div>
                          <div className="text-muted">{row.doctor_name}</div>
                        </div>
                        <StatusBadge status={row.status} />
                      </div>
                      <div className="text-secondary" style={{ fontSize: '0.86rem' }}>
                        {formatDisplayDate(row.appointment_date)} at{' '}
                        {formatDisplayTime(row.appointment_time)}
                      </div>
                      <div className="text-muted">{row.reason}</div>
                    </>
                  )}
                />
              )}
            </Card>

            <Card
              title="Doctors Roster"
              actions={
                <Link to="/doctors" className="btn btn-ghost btn-sm">
                  Directory <ArrowRight size={14} />
                </Link>
              }
            >
              {doctors.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="No doctors added"
                  description="Add clinic doctors so staff can assign patient visits."
                />
              ) : (
                <div className="stack-md" style={{ gap: 12 }}>
                  {doctors.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="row-between"
                      style={{
                        paddingBottom: 12,
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="row-inline" style={{ minWidth: 0 }}>
                        <div className="avatar">{getInitials(doc.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {doc.name}
                          </div>
                          <div className="text-muted">{doc.specialization}</div>
                        </div>
                      </div>
                      <ActiveBadge isActive={doc.is_active} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <AppointmentFormModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        doctors={doctors}
        onSubmit={handleCreateAppointment}
      />
    </div>
  );
}
