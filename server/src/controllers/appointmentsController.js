import { query, queryOne } from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  APPOINTMENT_STATUSES,
  parsePositiveId,
  validateAppointmentPayload,
} from '../middleware/validate.js';
import { AppError } from '../utils/AppError.js';

const SLOT_DURATION_MINUTES = 30;

function toMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function normalizeAppointment(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    patient_name: row.patient_name,
    patient_contact: row.patient_contact,
    doctor_id: Number(row.doctor_id),
    doctor_name: row.doctor_name ?? null,
    doctor_specialization: row.doctor_specialization ?? null,
    doctor_is_active:
      row.doctor_is_active !== undefined ? Boolean(row.doctor_is_active) : undefined,
    appointment_date: row.appointment_date,
    appointment_time: row.appointment_time,
    reason: row.reason,
    status: row.status,
    notes: row.notes || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function fetchJoinedAppointment(id) {
  const row = await queryOne(
    `SELECT a.*, d.name AS doctor_name, d.specialization AS doctor_specialization, d.is_active AS doctor_is_active
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = ?`,
    [id]
  );
  return normalizeAppointment(row);
}

async function ensureValidDoctor(doctorId, { requireActive = true } = {}) {
  const doctor = await queryOne('SELECT * FROM doctors WHERE id = ?', [doctorId]);
  if (!doctor) {
    throw new AppError(
      400,
      'INVALID_DOCTOR',
      `Selected doctor (ID ${doctorId}) does not exist.`,
      { doctor_id: 'Selected doctor does not exist.' }
    );
  }
  if (requireActive && !Boolean(doctor.is_active)) {
    throw new AppError(
      409,
      'DOCTOR_INACTIVE',
      `${doctor.name} is currently inactive and cannot accept new appointments.`,
      { doctor_id: 'Selected doctor is inactive.' }
    );
  }
  return doctor;
}

async function ensureNoTimeOverlap({
  doctorId,
  doctorName,
  appointmentDate,
  appointmentTime,
  excludeAppointmentId = null,
}) {
  const params = [doctorId, appointmentDate];
  let excludeSql = '';
  if (excludeAppointmentId !== null) {
    excludeSql = 'AND id != ?';
    params.push(excludeAppointmentId);
  }

  const sameDayAppointments = await query(
    `SELECT id, appointment_time, patient_name
     FROM appointments
     WHERE doctor_id = ?
       AND appointment_date = ?
       AND status != 'cancelled'
       ${excludeSql}`,
    params
  );

  const requestedMinutes = toMinutes(appointmentTime);
  const conflict = sameDayAppointments.rows.find(
    (appt) => Math.abs(toMinutes(appt.appointment_time) - requestedMinutes) < SLOT_DURATION_MINUTES
  );

  if (conflict) {
    throw new AppError(
      409,
      'APPOINTMENT_CONFLICT',
      `Time slot conflict: ${doctorName} already has an appointment at ${conflict.appointment_time} on ${appointmentDate}. Please pick a slot at least ${SLOT_DURATION_MINUTES} minutes apart.`,
      {
        appointment_time: `Conflicts with existing ${conflict.appointment_time} appointment (${conflict.patient_name}).`,
      }
    );
  }
}

export const listAppointments = asyncHandler(async (req, res) => {
  const { status, doctor_id: doctorIdParam, date, search } = req.query;
  const conditions = [];
  const params = [];

  if (typeof status === 'string' && status.trim() && status !== 'all') {
    const normalizedStatus = status.trim().toLowerCase();
    if (!APPOINTMENT_STATUSES.includes(normalizedStatus)) {
      throw new AppError(400, 'INVALID_FILTER', 'Invalid appointment status filter.');
    }
    conditions.push('a.status = ?');
    params.push(normalizedStatus);
  }

  if (doctorIdParam !== undefined && doctorIdParam !== '' && doctorIdParam !== 'all') {
    const doctorId = parsePositiveId(doctorIdParam, 'doctor_id filter');
    conditions.push('a.doctor_id = ?');
    params.push(doctorId);
  }

  if (typeof date === 'string' && date.trim()) {
    conditions.push('a.appointment_date = ?');
    params.push(date.trim());
  }

  if (typeof search === 'string' && search.trim()) {
    const pattern = `%${search.trim()}%`;
    conditions.push(
      '(LOWER(a.patient_name) LIKE LOWER(?) OR LOWER(a.patient_contact) LIKE LOWER(?) OR LOWER(a.reason) LIKE LOWER(?) OR LOWER(d.name) LIKE LOWER(?))'
    );
    params.push(pattern, pattern, pattern, pattern);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT a.*, d.name AS doctor_name, d.specialization AS doctor_specialization, d.is_active AS doctor_is_active
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     ${whereClause}
     ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
    params
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(normalizeAppointment),
  });
});

export const getAppointmentById = asyncHandler(async (req, res) => {
  const id = parsePositiveId(req.params.id, 'Appointment ID');
  const appointment = await fetchJoinedAppointment(id);

  if (!appointment) {
    throw new AppError(404, 'APPOINTMENT_NOT_FOUND', `Appointment with ID ${id} was not found.`);
  }

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

export const createAppointment = asyncHandler(async (req, res) => {
  const payload = validateAppointmentPayload(req.body, { partial: false });
  const doctor = await ensureValidDoctor(payload.doctor_id, { requireActive: true });

  if (payload.status !== 'cancelled') {
    await ensureNoTimeOverlap({
      doctorId: payload.doctor_id,
      doctorName: doctor.name,
      appointmentDate: payload.appointment_date,
      appointmentTime: payload.appointment_time,
    });
  }

  const now = new Date().toISOString();
  const inserted = await queryOne(
    `INSERT INTO appointments
       (patient_name, patient_contact, doctor_id, appointment_date, appointment_time, reason, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [
      payload.patient_name,
      payload.patient_contact,
      payload.doctor_id,
      payload.appointment_date,
      payload.appointment_time,
      payload.reason,
      payload.status,
      payload.notes,
      now,
      now,
    ]
  );

  const created = await fetchJoinedAppointment(inserted.id);

  res.status(201).json({
    success: true,
    message: 'Appointment scheduled successfully.',
    data: created,
  });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const id = parsePositiveId(req.params.id, 'Appointment ID');
  const existing = await queryOne('SELECT * FROM appointments WHERE id = ?', [id]);

  if (!existing) {
    throw new AppError(404, 'APPOINTMENT_NOT_FOUND', `Appointment with ID ${id} was not found.`);
  }

  const isPartial = req.method === 'PATCH';
  const payload = validateAppointmentPayload(req.body, { partial: isPartial });

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, 'EMPTY_UPDATE', 'No valid fields provided for update.');
  }

  const next = {
    patient_name: payload.patient_name ?? existing.patient_name,
    patient_contact: payload.patient_contact ?? existing.patient_contact,
    doctor_id: payload.doctor_id ?? Number(existing.doctor_id),
    appointment_date: payload.appointment_date ?? existing.appointment_date,
    appointment_time: payload.appointment_time ?? existing.appointment_time,
    reason: payload.reason ?? existing.reason,
    status: payload.status ?? existing.status,
    notes: payload.notes !== undefined ? payload.notes : existing.notes || '',
  };

  const doctorChanged = next.doctor_id !== Number(existing.doctor_id);
  const slotChanged =
    doctorChanged ||
    next.appointment_date !== existing.appointment_date ||
    next.appointment_time !== existing.appointment_time;

  const doctor = await ensureValidDoctor(next.doctor_id, {
    requireActive: doctorChanged || (slotChanged && next.status !== 'cancelled'),
  });

  if (
    next.status !== 'cancelled' &&
    (slotChanged || existing.status === 'cancelled')
  ) {
    await ensureNoTimeOverlap({
      doctorId: next.doctor_id,
      doctorName: doctor.name,
      appointmentDate: next.appointment_date,
      appointmentTime: next.appointment_time,
      excludeAppointmentId: id,
    });
  }

  const now = new Date().toISOString();
  await query(
    `UPDATE appointments
     SET patient_name = ?, patient_contact = ?, doctor_id = ?, appointment_date = ?, appointment_time = ?, reason = ?, status = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      next.patient_name,
      next.patient_contact,
      next.doctor_id,
      next.appointment_date,
      next.appointment_time,
      next.reason,
      next.status,
      next.notes,
      now,
      id,
    ]
  );

  const updated = await fetchJoinedAppointment(id);

  res.status(200).json({
    success: true,
    message: 'Appointment updated successfully.',
    data: updated,
  });
});

export const deleteAppointment = asyncHandler(async (req, res) => {
  const id = parsePositiveId(req.params.id, 'Appointment ID');
  const existing = await queryOne(
    'SELECT id, patient_name FROM appointments WHERE id = ?',
    [id]
  );

  if (!existing) {
    throw new AppError(404, 'APPOINTMENT_NOT_FOUND', `Appointment with ID ${id} was not found.`);
  }

  await query('DELETE FROM appointments WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    message: `Appointment for ${existing.patient_name} was deleted successfully.`,
    data: { id },
  });
});
