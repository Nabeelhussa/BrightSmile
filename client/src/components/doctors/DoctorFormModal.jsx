import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { ApiError } from '../../api/client.js';
import { SPECIALIZATIONS } from '../../utils/formatters.js';
import { validateDoctorForm } from '../../utils/validators.js';
import { Button } from '../ui/Button.jsx';
import {
  CheckboxField,
  FormField,
  SelectInput,
  TextInput,
} from '../ui/FormControls.jsx';
import { Modal } from '../ui/Modal.jsx';

const EMPTY_FORM = {
  name: '',
  specialization: 'General Dentistry',
  phone: '',
  email: '',
  availability: '',
  is_active: true,
};

export function DoctorFormModal({ isOpen, onClose, doctor, onSubmit }) {
  const isEditing = Boolean(doctor);
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (doctor) {
      setValues({
        name: doctor.name || '',
        specialization: doctor.specialization || 'General Dentistry',
        phone: doctor.phone || '',
        email: doctor.email || '',
        availability: doctor.availability || '',
        is_active: Boolean(doctor.is_active),
      });
    } else {
      setValues(EMPTY_FORM);
    }
    setErrors({});
    setServerError('');
  }, [isOpen, doctor]);

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === 'checkbox' ? event.target.checked : event.target.value;
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
    const validationErrors = validateDoctorForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    try {
      await onSubmit({
        name: values.name.trim(),
        specialization: values.specialization.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        availability: values.availability.trim(),
        is_active: Boolean(values.is_active),
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        if (error.details && typeof error.details === 'object') {
          setErrors((prev) => ({ ...prev, ...error.details }));
        }
      } else {
        setServerError('Unable to save doctor record. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const specializationOptions = SPECIALIZATIONS.includes(values.specialization)
    ? SPECIALIZATIONS
    : [values.specialization, ...SPECIALIZATIONS].filter(Boolean);

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={isEditing ? `Edit ${doctor.name}` : 'Add New Doctor'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="doctor-form" disabled={submitting}>
            {submitting
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Create Doctor'}
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

      <form id="doctor-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <FormField
            label="Full Name"
            htmlFor="doctor-name"
            required
            error={errors.name}
          >
            <TextInput
              id="doctor-name"
              placeholder="e.g. Dr. Elena Rostova"
              value={values.name}
              onChange={handleChange('name')}
              hasError={Boolean(errors.name)}
            />
          </FormField>

          <FormField
            label="Specialization"
            htmlFor="doctor-specialization"
            required
            error={errors.specialization}
          >
            <SelectInput
              id="doctor-specialization"
              value={values.specialization}
              onChange={handleChange('specialization')}
              hasError={Boolean(errors.specialization)}
            >
              {specializationOptions.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </SelectInput>
          </FormField>

          <FormField
            label="Phone Number"
            htmlFor="doctor-phone"
            required
            error={errors.phone}
          >
            <TextInput
              id="doctor-phone"
              type="tel"
              placeholder="+1 (555) 234-8810"
              value={values.phone}
              onChange={handleChange('phone')}
              hasError={Boolean(errors.phone)}
            />
          </FormField>

          <FormField
            label="Email Address"
            htmlFor="doctor-email"
            required
            error={errors.email}
          >
            <TextInput
              id="doctor-email"
              type="email"
              placeholder="doctor@brightsmile.clinic"
              value={values.email}
              onChange={handleChange('email')}
              hasError={Boolean(errors.email)}
            />
          </FormField>

          <FormField
            label="Availability Schedule"
            htmlFor="doctor-availability"
            required
            fullSpan
            error={errors.availability}
            hint="Example: Mon - Fri, 09:00 AM - 05:00 PM"
          >
            <TextInput
              id="doctor-availability"
              placeholder="Mon - Fri, 09:00 AM - 05:00 PM"
              value={values.availability}
              onChange={handleChange('availability')}
              hasError={Boolean(errors.availability)}
            />
          </FormField>

          <FormField label="Clinic Status" fullSpan>
            <CheckboxField
              id="doctor-active"
              label="Active — available to receive new patient appointments"
              checked={values.is_active}
              onChange={handleChange('is_active')}
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}
