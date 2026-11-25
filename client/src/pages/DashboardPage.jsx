import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  ClipboardList,
  Clock4,
  Hospital,
  Plus,
  Stethoscope,
  UserCheck,
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

    const doctorActivePct = doctors.length ? Math.round((activeDoctors / doctors.length) * 100) : 0;
    const todayPct = appointments.length ? Math.round((todaysAppointments.length / appointments.length) * 100) : 0;

    return {
      totalDoctors: doctors.length,
      activeDoctors,
      doctorActivePct,
      todaysCount: todaysAppointments.length,
      todayPct,
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
      header: 'Patient Details',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{row.patient_name}</div>
          <div className="text-muted">{row.patient_contact}</div>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      header: 'Attending Specialist',
      render: (row) => (
        <div className="row-inline" style={{ gap: 6 }}>
          <Stethoscope size={14} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.doctor_name}</div>
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>{row.doctor_specialization}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Date & Time',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{formatDisplayDate(row.appointment_date)}</div>
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
      <section className="hero-banner">
        <div>
          <div className="row-inline" style={{ gap: 8, marginBottom: 6 }}>
            <Hospital size={20} style={{ color: 'var(--color-primary-700)' }} aria-hidden="true" />
            <h1 className="hero-banner-title">BrightSmile Practice Console</h1>
          </div>
          <p className="hero-banner-sub">
            Real-time clinical management for dental specialists, patient scheduling, and appointment workflows.
          </p>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Button
            onClick={() => setScheduleOpen(true)}
            disabled={loading || Boolean(error)}
          >
            <Plus size={16} />
            Quick Appointment
          </Button>
        </div>
      </section>

      {loading && <LoadingState message="Loading clinic dashboard overview..." />}

      {!loading && error && (
        <Card icon={Activity}>
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
              icon={UserCheck}
              tone="teal"
              progress={metrics.doctorActivePct}
            />
            <StatCard
              label="Today's Appointments"
              value={metrics.todaysCount}
              subtext="Scheduled for today"
              icon={CalendarCheck}
              tone="blue"
              progress={metrics.todayPct}
            />
            <StatCard
              label="Upcoming Visits"
              value={metrics.upcomingCount}
              subtext="Active upcoming visits"
              icon={CalendarClock}
              tone="emerald"
            />
            <StatCard
              label="Pending Confirmation"
              value={metrics.pendingCount}
              subtext="Awaiting staff confirmation"
              icon={Clock4}
              tone="amber"
            />
          </section>

          <div className="dashboard-grid">
            <Card
              title="Upcoming & Recent Appointments"
              icon={ClipboardList}
              noBodyPadding
              actions={
                <Link to="/appointments" className="btn btn-ghost btn-sm">
                  View Schedule <ArrowRight size={14} />
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
              icon={Stethoscope}
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
                <div className="stack-md" style={{ gap: 14 }}>
                  {doctors.slice(0, 5).map((doc) => (
                    <div
                      key={doc.id}
                      className="row-between"
                      style={{
                        paddingBottom: 12,
                        borderBottom: '1px solid var(--color-border)',
                      }}
                    >
                      <div className="row-inline" style={{ minWidth: 0, gap: 12 }}>
                        <div className="avatar">{getInitials(doc.name)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'var(--color-text-primary)',
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
