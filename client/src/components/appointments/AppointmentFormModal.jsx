import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ApiError } from '../../api/client.js';
import {
  APPOINTMENT_STATUS_OPTIONS,
  getTodayIsoDate,
} from '../../utils/formatters.js';
import { validateAppointmentForm } from '../../utils/validators.js';
import { Button } from '../ui/Button.jsx';
import {
  FormField,
  SelectInput,
  TextareaInput,
  TextInput,
} from '../ui/FormControls.jsx';
import { Modal } from '../ui/Modal.jsx';

export function AppointmentFormModal({
  isOpen,
  onClose,
  appointment,
  doctors = [],
  onSubmit,
}) {
  const isEditing = Boolean(appointment);
  const [values, setValues] = useState({
    patient_name: '',
    patient_contact: '',
    doctor_id: '',
    appointment_date: getTodayIsoDate(),
    appointment_time: '09:30',
    reason: '',
    status: 'pending',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (appointment) {
      setValues({
        patient_name: appointment.patient_name || '',
        patient_contact: appointment.patient_contact || '',
        doctor_id: String(appointment.doctor_id || ''),
        appointment_date: appointment.appointment_date || getTodayIsoDate(),
        appointment_time: appointment.appointment_time || '09:30',
        reason: appointment.reason || '',
        status: appointment.status || 'pending',
        notes: appointment.notes || '',
      });
    } else {
      const firstActive = doctors.find((d) => d.is_active);
      setValues({
        patient_name: '',
        patient_contact: '',
        doctor_id: firstActive ? String(firstActive.id) : '',
        appointment_date: getTodayIsoDate(),
        appointment_time: '09:30',
        reason: '',
        status: 'pending',
        notes: '',
      });
    }
    setErrors({});
    setServerError('');
  }, [isOpen, appointment, doctors]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateAppointmentForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      await onSubmit({
        patient_name: values.patient_name.trim(),
        patient_contact: values.patient_contact.trim(),
        doctor_id: Number(values.doctor_id),
        appointment_date: values.appointment_date,
        appointment_time: values.appointment_time,
        reason: values.reason.trim(),
        status: values.status,
        notes: values.notes.trim(),
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        if (error.details && typeof error.details === 'object') {
          setErrors((prev) => ({ ...prev, ...error.details }));
        }
      } else {
        setServerError('Unable to save appointment. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={isEditing ? 'Edit Appointment' : 'Schedule Appointment'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="appointment-form" disabled={submitting}>
            {submitting
              ? 'Saving...'
              : isEditing
                ? 'Save Appointment'
                : 'Schedule Appointment'}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="form-alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{serverError}</span>
        </div>
      )}

      <form id="appointment-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField
            label="Patient Full Name"
            htmlFor="appt-patient-name"
            required
            error={errors.patient_name}
          >
            <TextInput
              id="appt-patient-name"
              placeholder="e.g. Liam Carter"
              value={values.patient_name}
              onChange={handleChange('patient_name')}
              hasError={Boolean(errors.patient_name)}
            />
          </FormField>

          <FormField
            label="Patient Phone or Email"
            htmlFor="appt-patient-contact"
            required
            error={errors.patient_contact}
          >
            <TextInput
              id="appt-patient-contact"
              placeholder="+1 (555) 701-1120 or email"
              value={values.patient_contact}
              onChange={handleChange('patient_contact')}
              hasError={Boolean(errors.patient_contact)}
            />
          </FormField>

          <FormField
            label="Attending Doctor"
            htmlFor="appt-doctor"
            required
            error={errors.doctor_id}
          >
            <SelectInput
              id="appt-doctor"
              value={values.doctor_id}
              onChange={handleChange('doctor_id')}
              hasError={Boolean(errors.doctor_id)}
            >
              <option value="">Select a doctor...</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={String(doc.id)}>
                  {doc.name} — {doc.specialization}
                  {!doc.is_active ? ' (Inactive)' : ''}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField
            label="Appointment Status"
            htmlFor="appt-status"
            required
            error={errors.status}
          >
            <SelectInput
              id="appt-status"
              value={values.status}
              onChange={handleChange('status')}
              hasError={Boolean(errors.status)}
            >
              {APPOINTMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField
            label="Date"
            htmlFor="appt-date"
            required
            error={errors.appointment_date}
          >
            <TextInput
              id="appt-date"
              type="date"
              value={values.appointment_date}
              onChange={handleChange('appointment_date')}
              hasError={Boolean(errors.appointment_date)}
            />
          </FormField>

          <FormField
            label="Time"
            htmlFor="appt-time"
            required
            error={errors.appointment_time}
            hint="Slots require a 30-minute gap per doctor."
          >
            <TextInput
              id="appt-time"
              type="time"
              value={values.appointment_time}
              onChange={handleChange('appointment_time')}
              hasError={Boolean(errors.appointment_time)}
            />
          </FormField>

          <FormField
            label="Reason for Visit"
            htmlFor="appt-reason"
            required
            fullSpan
            error={errors.reason}
          >
            <TextInput
              id="appt-reason"
              placeholder="e.g. Routine dental checkup and cleaning"
              value={values.reason}
              onChange={handleChange('reason')}
              hasError={Boolean(errors.reason)}
            />
          </FormField>

          <FormField
            label="Clinical Notes (Optional)"
            htmlFor="appt-notes"
            fullSpan
            error={errors.notes}
          >
            <TextareaInput
              id="appt-notes"
              rows={3}
              placeholder="Pre-visit reminders, insurance notes, or patient preferences..."
              value={values.notes}
              onChange={handleChange('notes')}
              hasError={Boolean(errors.notes)}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
