import { useEffect, useState } from 'react';
import { Calendar, Clock, Mail, Pencil, Phone, Stethoscope } from 'lucide-react';
import { doctorsApi } from '../../api/client.js';
import { formatDisplayDate, formatDisplayTime, getInitials } from '../../utils/formatters.js';
import { ActiveBadge, StatusBadge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { LoadingState } from '../ui/LoadingState.jsx';
import { Modal } from '../ui/Modal.jsx';

export function DoctorDetailModal({ doctorId, isOpen, onClose, onEdit }) {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = async () => {
    if (!doctorId) return;
    setLoading(true);
    setError('');
    try {
      const response = await doctorsApi.getById(doctorId);
      setDoctor(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load doctor details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchDetail();
    } else {
      setDoctor(null);
      setError('');
    }
  }, [isOpen, doctorId]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Profile"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          {doctor && (
            <Button
              onClick={() => {
                onClose();
                onEdit(doctor);
              }}
            >
              <Pencil size={15} />
              Edit Doctor
            </Button>
          )}
        </>
      }
    >
      {loading && <LoadingState message="Loading doctor profile..." />}
      {!loading && error && <ErrorState message={error} onRetry={fetchDetail} />}
      {!loading && !error && doctor && (
        <div>
          <div className="row-between" style={{ marginBottom: 18, flexWrap: 'wrap' }}>
            <div className="row-inline" style={{ gap: 14 }}>
              <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.05rem' }}>
                {getInitials(doctor.name)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>{doctor.name}</h3>
                <div className="row-inline text-secondary" style={{ gap: 6, marginTop: 2 }}>
                  <Stethoscope size={14} />
                  <span>{doctor.specialization}</span>
                </div>
              </div>
            </div>
            <ActiveBadge isActive={doctor.is_active} />
          </div>

          <div className="detail-meta-grid">
            <div>
              <div className="detail-meta-label">Phone</div>
              <div className="detail-meta-value row-inline" style={{ gap: 6 }}>
                <Phone size={14} color="#64748b" />
                {doctor.phone}
              </div>
            </div>
            <div>
              <div className="detail-meta-label">Email</div>
              <div className="detail-meta-value row-inline" style={{ gap: 6 }}>
                <Mail size={14} color="#64748b" />
                {doctor.email}
              </div>
            </div>
            <div>
              <div className="detail-meta-label">Availability</div>
              <div className="detail-meta-value row-inline" style={{ gap: 6 }}>
                <Clock size={14} color="#64748b" />
                {doctor.availability}
              </div>
            </div>
            <div>
              <div className="detail-meta-label">Total Appointments</div>
              <div className="detail-meta-value row-inline" style={{ gap: 6 }}>
                <Calendar size={14} color="#64748b" />
                {doctor.appointments?.length ?? 0} scheduled
              </div>
            </div>
          </div>

          <h4 style={{ fontSize: '0.96rem', marginBottom: 10 }}>
            Assigned Appointments
          </h4>

          {!doctor.appointments || doctor.appointments.length === 0 ? (
            <EmptyState
              title="No appointments assigned"
              description="This doctor currently has no scheduled patient visits."
            />
          ) : (
            <div className="stack-md" style={{ gap: 10 }}>
              {doctor.appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="mobile-item-card"
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{appt.patient_name}</div>
                    <div className="text-muted">
                      {formatDisplayDate(appt.appointment_date)} at{' '}
                      {formatDisplayTime(appt.appointment_time)} — {appt.reason}
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
