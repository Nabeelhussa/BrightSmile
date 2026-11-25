const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function validateDoctorForm(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = 'Doctor name is required.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!values.specialization?.trim()) {
    errors.specialization = 'Please select or enter a specialization.';
  }

  if (!values.phone?.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (values.phone.trim().length < 7) {
    errors.phone = 'Enter a valid phone number (at least 7 characters).';
  }

  if (!values.email?.trim()) {
    errors.email = 'Email address is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.availability?.trim()) {
    errors.availability = 'Availability schedule is required.';
  }

  return errors;
}

export function validateAppointmentForm(values) {
  const errors = {};

  if (!values.patient_name?.trim()) {
    errors.patient_name = 'Patient name is required.';
  } else if (values.patient_name.trim().length < 2) {
    errors.patient_name = 'Patient name must be at least 2 characters.';
  }

  if (!values.patient_contact?.trim()) {
    errors.patient_contact = 'Patient phone or email is required.';
  } else if (values.patient_contact.trim().length < 5) {
    errors.patient_contact = 'Enter a valid phone number or email.';
  }

  if (!values.doctor_id) {
    errors.doctor_id = 'Please select an attending doctor.';
  }

  if (!values.appointment_date || !DATE_REGEX.test(values.appointment_date)) {
    errors.appointment_date = 'Please choose a valid appointment date.';
  }

  if (!values.appointment_time || !TIME_REGEX.test(values.appointment_time)) {
    errors.appointment_time = 'Please choose a valid appointment time.';
  }

  if (!values.reason?.trim()) {
    errors.reason = 'Reason for visit is required.';
  } else if (values.reason.trim().length < 3) {
    errors.reason = 'Reason must be at least 3 characters.';
  }

  return errors;
}
