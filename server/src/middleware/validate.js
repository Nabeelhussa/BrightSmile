import { AppError } from '../utils/AppError.js';

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isValidCalendarDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

export function parsePositiveId(rawId, label = 'ID') {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'INVALID_ID', `${label} must be a positive integer.`);
  }
  return id;
}

export function validateDoctorPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'INVALID_PAYLOAD', 'Request body must be a JSON object.');
  }

  const errors = {};
  const data = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      errors.name = 'Doctor name is required.';
    } else if (name.length < 2 || name.length > 120) {
      errors.name = 'Doctor name must be between 2 and 120 characters.';
    } else {
      data.name = name;
    }
  }

  if (!partial || body.specialization !== undefined) {
    const specialization =
      typeof body.specialization === 'string' ? body.specialization.trim() : '';
    if (!specialization) {
      errors.specialization = 'Specialization is required.';
    } else if (specialization.length > 120) {
      errors.specialization = 'Specialization cannot exceed 120 characters.';
    } else {
      data.specialization = specialization;
    }
  }

  if (!partial || body.phone !== undefined) {
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    if (!phone) {
      errors.phone = 'Phone number is required.';
    } else if (phone.length < 7 || phone.length > 40) {
      errors.phone = 'Phone number must be between 7 and 40 characters.';
    } else {
      data.phone = phone;
    }
  }

  if (!partial || body.email !== undefined) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email) || email.length > 160) {
      errors.email = 'Please provide a valid email address.';
    } else {
      data.email = email;
    }
  }

  if (!partial || body.availability !== undefined) {
    const availability =
      typeof body.availability === 'string' ? body.availability.trim() : '';
    if (!availability) {
      errors.availability = 'Availability schedule is required.';
    } else if (availability.length > 200) {
      errors.availability = 'Availability cannot exceed 200 characters.';
    } else {
      data.availability = availability;
    }
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active === 'boolean') {
      data.is_active = body.is_active;
    } else if (body.is_active === 1 || body.is_active === 0) {
      data.is_active = Boolean(body.is_active);
    } else if (body.is_active === 'true' || body.is_active === 'false') {
      data.is_active = body.is_active === 'true';
    } else {
      errors.is_active = 'Active status must be a boolean.';
    }
  } else if (!partial) {
    data.is_active = true;
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Please fix the highlighted doctor fields.', errors);
  }

  return data;
}

export function validateAppointmentPayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new AppError(400, 'INVALID_PAYLOAD', 'Request body must be a JSON object.');
  }

  const errors = {};
  const data = {};

  if (!partial || body.patient_name !== undefined) {
    const patientName =
      typeof body.patient_name === 'string' ? body.patient_name.trim() : '';
    if (!patientName) {
      errors.patient_name = 'Patient name is required.';
    } else if (patientName.length < 2 || patientName.length > 120) {
      errors.patient_name = 'Patient name must be between 2 and 120 characters.';
    } else {
      data.patient_name = patientName;
    }
  }

  if (!partial || body.patient_contact !== undefined) {
    const patientContact =
      typeof body.patient_contact === 'string' ? body.patient_contact.trim() : '';
    if (!patientContact) {
      errors.patient_contact = 'Patient phone or email is required.';
    } else if (patientContact.length < 5 || patientContact.length > 160) {
      errors.patient_contact = 'Patient contact must be between 5 and 160 characters.';
    } else {
      data.patient_contact = patientContact;
    }
  }

  if (!partial || body.doctor_id !== undefined) {
    const doctorId = Number(body.doctor_id);
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      errors.doctor_id = 'Please select a valid doctor.';
    } else {
      data.doctor_id = doctorId;
    }
  }

  if (!partial || body.appointment_date !== undefined) {
    const dateStr =
      typeof body.appointment_date === 'string' ? body.appointment_date.trim() : '';
    if (!dateStr) {
      errors.appointment_date = 'Appointment date is required.';
    } else if (!isValidCalendarDate(dateStr)) {
      errors.appointment_date = 'Appointment date must be a valid YYYY-MM-DD date.';
    } else {
      data.appointment_date = dateStr;
    }
  }

  if (!partial || body.appointment_time !== undefined) {
    const timeStr =
      typeof body.appointment_time === 'string' ? body.appointment_time.trim() : '';
    if (!timeStr) {
      errors.appointment_time = 'Appointment time is required.';
    } else if (!TIME_REGEX.test(timeStr)) {
      errors.appointment_time = 'Appointment time must use HH:MM (24-hour) format.';
    } else {
      data.appointment_time = timeStr;
    }
  }

  if (!partial || body.reason !== undefined) {
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (!reason) {
      errors.reason = 'Reason for visit is required.';
    } else if (reason.length < 3 || reason.length > 300) {
      errors.reason = 'Reason must be between 3 and 300 characters.';
    } else {
      data.reason = reason;
    }
  }

  if (body.status !== undefined) {
    const status = typeof body.status === 'string' ? body.status.trim().toLowerCase() : '';
    if (!APPOINTMENT_STATUSES.includes(status)) {
      errors.status = `Status must be one of: ${APPOINTMENT_STATUSES.join(', ')}.`;
    } else {
      data.status = status;
    }
  } else if (!partial) {
    data.status = 'pending';
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      errors.notes = 'Notes must be text.';
    } else if (body.notes.trim().length > 500) {
      errors.notes = 'Notes cannot exceed 500 characters.';
    } else {
      data.notes = body.notes.trim();
    }
  } else if (!partial) {
    data.notes = '';
  }

  if (Object.keys(errors).length > 0) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Please fix the highlighted appointment fields.',
      errors
    );
  }

  return data;
}
