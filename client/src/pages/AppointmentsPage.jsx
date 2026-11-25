import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { appointmentsApi, doctorsApi } from '../api/client.js';
import { AppointmentFormModal } from '../components/appointments/AppointmentFormModal.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { SelectInput, TextInput } from '../components/ui/FormControls.jsx';
import { LoadingState } from '../components/ui/LoadingState.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import {
  APPOINTMENT_STATUS_OPTIONS,
  formatDisplayDate,
  formatDisplayTime,
  getTodayIsoDate,
} from '../utils/formatters.js';

export function AppointmentsPage() {
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const loadDoctors = useCallback(async () => {
    try {
      const response = await doctorsApi.list();
      setDoctors(response.data || []);
    } catch {
      // Handled by main appointments load error if server is unreachable
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await appointmentsApi.list({
        search: search.trim(),
        status: statusFilter,
        doctor_id: doctorFilter,
        date: dateFilter,
      });
      setAppointments(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, doctorFilter, dateFilter]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAppointments();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadAppointments]);

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    doctorFilter !== 'all' ||
    Boolean(dateFilter);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDoctorFilter('all');
    setDateFilter('');
  };

  const handleSaveAppointment = async (payload) => {
    if (editingAppointment) {
      await appointmentsApi.update(editingAppointment.id, payload);
      showToast(`Appointment for ${payload.patient_name} updated.`);
    } else {
      await appointmentsApi.create(payload);
      showToast(`Appointment scheduled for ${payload.patient_name}.`);
    }
    await loadAppointments();
  };

  const handleQuickStatusChange = async (appointment, nextStatus) => {
    if (appointment.status === nextStatus) return;
    setUpdatingStatusId(appointment.id);
    try {
      await appointmentsApi.patch(appointment.id, { status: nextStatus });
      showToast(`Status updated to ${nextStatus}.`);
      await loadAppointments();
    } catch (err) {
      showToast(err.message || 'Unable to update status.', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await appointmentsApi.remove(deleteTarget.id);
      showToast(`Appointment for ${deleteTarget.patient_name} deleted.`);
      setDeleteTarget(null);
      await loadAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to delete appointment.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'patient',
      header: 'Patient',
      render: (appt) => (
        <div>
          <div style={{ fontWeight: 700 }}>{appt.patient_name}</div>
          <div className="text-muted">{appt.patient_contact}</div>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      render: (appt) => (
        <div>
          <div style={{ fontWeight: 600 }}>{appt.doctor_name}</div>
          <div className="text-muted">{appt.doctor_specialization}</div>
        </div>
      ),
    },
    {
      key: 'datetime',
      header: 'Date & Time',
      render: (appt) => (
        <div>
          <div style={{ fontWeight: 500 }}>{formatDisplayDate(appt.appointment_date)}</div>
          <div className="text-muted">{formatDisplayTime(appt.appointment_time)}</div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (appt) => (
        <div style={{ maxWidth: 260 }}>
          <div style={{ fontSize: '0.88rem' }}>{appt.reason}</div>
          {appt.notes && <div className="text-muted">{appt.notes}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (appt) => (
        <div className="row-inline" style={{ gap: 8 }}>
          <StatusBadge status={appt.status} />
          <select
            aria-label={`Change status for ${appt.patient_name}`}
            className="inline-status-select"
            value={appt.status}
            disabled={updatingStatusId === appt.id}
            onChange={(e) => handleQuickStatusChange(appt, e.target.value)}
          >
            {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (appt) => (
        <div className="table-actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingAppointment(appt);
              setFormOpen(true);
            }}
            aria-label={`Edit appointment for ${appt.patient_name}`}
            title="Edit appointment"
          >
            <Pencil size={16} />
          </Button>
          <Button
            variant="danger-ghost"
            size="icon"
            onClick={() => setDeleteTarget(appt)}
            aria-label={`Delete appointment for ${appt.patient_name}`}
            title="Delete appointment"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <header className="page-header">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-description">
            Schedule patient visits, track confirmation statuses, and prevent double-booking.
          </p>
        </div>
        <div className="page-actions">
          <Button
            variant="secondary"
            onClick={() => setDateFilter(getTodayIsoDate())}
          >
            Today&apos;s Schedule
          </Button>
          <Button
            onClick={() => {
              setEditingAppointment(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} />
            Schedule Appointment
          </Button>
        </div>
      </header>

      <Card noBodyPadding>
        <div className="filter-toolbar">
          <div className="filter-group">
            <div className="search-input-wrap">
              <Search size={16} className="search-input-icon" aria-hidden="true" />
              <TextInput
                className="search-input"
                placeholder="Search patient, doctor, or reason..."
                aria-label="Search appointments"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <SelectInput
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 145 }}
            >
              <option value="all">All Statuses</option>
              {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectInput>

            <SelectInput
              aria-label="Filter by doctor"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              style={{ width: 'auto', minWidth: 175 }}
            >
              <option value="all">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={String(doc.id)}>
                  {doc.name}
                </option>
              ))}
            </SelectInput>

            <TextInput
              type="date"
              aria-label="Filter by appointment date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ width: 'auto' }}
            />

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            )}
          </div>
          <span className="text-muted">
            {appointments.length} appointment{appointments.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading && <LoadingState message="Loading appointments..." />}

        {!loading && error && (
          <ErrorState
            title="Unable to load appointments"
            message={error}
            onRetry={loadAppointments}
          />
        )}

        {!loading && !error && appointments.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title={hasFilters ? 'No appointments match these filters' : 'No appointments scheduled'}
            description={
              hasFilters
                ? 'Try clearing or adjusting your date, doctor, or status filters.'
                : 'Schedule your first patient visit to get started.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={resetFilters}>
                  Reset Filters
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditingAppointment(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus size={15} />
                  Schedule Appointment
                </Button>
              )
            }
          />
        )}

        {!loading && !error && appointments.length > 0 && (
          <DataTable
            ariaLabel="Appointments schedule"
            columns={columns}
            rows={appointments}
            renderMobileCard={(appt) => (
              <>
                <div className="row-between">
                  <div>
                    <div style={{ fontWeight: 700 }}>{appt.patient_name}</div>
                    <div className="text-muted">{appt.patient_contact}</div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                <div className="text-secondary" style={{ fontSize: '0.86rem' }}>
                  <strong>{appt.doctor_name}</strong> ({appt.doctor_specialization})
                </div>
                <div className="text-secondary" style={{ fontSize: '0.86rem' }}>
                  {formatDisplayDate(appt.appointment_date)} at{' '}
                  {formatDisplayTime(appt.appointment_time)}
                </div>
                <div className="text-muted">{appt.reason}</div>
                <div className="row-between" style={{ paddingTop: 4, flexWrap: 'wrap' }}>
                  <select
                    aria-label={`Change status for ${appt.patient_name}`}
                    className="inline-status-select"
                    value={appt.status}
                    disabled={updatingStatusId === appt.id}
                    onChange={(e) => handleQuickStatusChange(appt, e.target.value)}
                  >
                    {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="table-actions">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingAppointment(appt);
                        setFormOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger-ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(appt)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          />
        )}
      </Card>

      <AppointmentFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAppointment(null);
        }}
        appointment={editingAppointment}
        doctors={doctors}
        onSubmit={handleSaveAppointment}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isSubmitting={deleting}
        title="Delete Appointment"
        confirmLabel="Delete Appointment"
        message={
          deleteTarget
            ? `Are you sure you want to delete the appointment for ${deleteTarget.patient_name} on ${formatDisplayDate(deleteTarget.appointment_date)} at ${formatDisplayTime(deleteTarget.appointment_time)}?`
            : ''
        }
      />
    </div>
  );
}
