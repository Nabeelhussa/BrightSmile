import { boolParam, query, queryOne } from '../db/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { parsePositiveId, validateDoctorPayload } from '../middleware/validate.js';
import { AppError } from '../utils/AppError.js';

function normalizeDoctor(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    specialization: row.specialization,
    phone: row.phone,
    email: row.email,
    availability: row.availability,
    is_active: Boolean(row.is_active),
    appointment_count: row.appointment_count !== undefined ? Number(row.appointment_count) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const listDoctors = asyncHandler(async (req, res) => {
  const { search, specialization, active } = req.query;
  const conditions = [];
  const params = [];

  if (typeof search === 'string' && search.trim()) {
    const pattern = `%${search.trim()}%`;
    conditions.push(
      '(LOWER(d.name) LIKE LOWER(?) OR LOWER(d.specialization) LIKE LOWER(?) OR LOWER(d.email) LIKE LOWER(?))'
    );
    params.push(pattern, pattern, pattern);
  }

  if (typeof specialization === 'string' && specialization.trim() && specialization !== 'all') {
    conditions.push('LOWER(d.specialization) = LOWER(?)');
    params.push(specialization.trim());
  }

  if (active === 'true' || active === 'false') {
    conditions.push('d.is_active = ?');
    params.push(boolParam(active === 'true'));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT d.*, COUNT(a.id) AS appointment_count
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     ${whereClause}
     GROUP BY d.id
     ORDER BY d.is_active DESC, d.name ASC`,
    params
  );

  res.status(200).json({
    success: true,
    data: result.rows.map(normalizeDoctor),
  });
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const id = parsePositiveId(req.params.id, 'Doctor ID');

  const doctor = await queryOne(
    `SELECT d.*, COUNT(a.id) AS appointment_count
     FROM doctors d
     LEFT JOIN appointments a ON a.doctor_id = d.id
     WHERE d.id = ?
     GROUP BY d.id`,
    [id]
  );

  if (!doctor) {
    throw new AppError(404, 'DOCTOR_NOT_FOUND', `Doctor with ID ${id} was not found.`);
  }

  const appointmentsResult = await query(
    `SELECT id, patient_name, patient_contact, appointment_date, appointment_time, reason, status, notes
     FROM appointments
     WHERE doctor_id = ?
     ORDER BY appointment_date ASC, appointment_time ASC`,
    [id]
  );

  res.status(200).json({
    success: true,
    data: {
      ...normalizeDoctor(doctor),
      appointments: appointmentsResult.rows.map((row) => ({
        ...row,
        id: Number(row.id),
      })),
    },
  });
});

export const createDoctor = asyncHandler(async (req, res) => {
  const payload = validateDoctorPayload(req.body, { partial: false });

  const existingEmail = await queryOne(
    'SELECT id FROM doctors WHERE LOWER(email) = LOWER(?)',
    [payload.email]
  );
  if (existingEmail) {
    throw new AppError(
      409,
      'DUPLICATE_EMAIL',
      `A doctor with email "${payload.email}" already exists.`,
      { email: 'Email address is already assigned to another doctor.' }
    );
  }

  const now = new Date().toISOString();
  const inserted = await queryOne(
    `INSERT INTO doctors (name, specialization, phone, email, availability, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`,
    [
      payload.name,
      payload.specialization,
      payload.phone,
      payload.email,
      payload.availability,
      boolParam(payload.is_active),
      now,
      now,
    ]
  );

  res.status(201).json({
    success: true,
    message: 'Doctor created successfully.',
    data: normalizeDoctor({ ...inserted, appointment_count: 0 }),
  });
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const id = parsePositiveId(req.params.id, 'Doctor ID');
  const existing = await queryOne('SELECT * FROM doctors WHERE id = ?', [id]);

  if (!existing) {
    throw new AppError(404, 'DOCTOR_NOT_FOUND', `Doctor with ID ${id} was not found.`);
  }

  const isPartial = req.method === 'PATCH';
  const payload = validateDoctorPayload(req.body, { partial: isPartial });

  if (Object.keys(payload).length === 0) {
    throw new AppError(400, 'EMPTY_UPDATE', 'No valid fields provided for update.');
  }

  const next = {
    name: payload.name ?? existing.name,
    specialization: payload.specialization ?? existing.specialization,
    phone: payload.phone ?? existing.phone,
    email: payload.email ?? existing.email,
    availability: payload.availability ?? existing.availability,
    is_active:
      payload.is_active !== undefined ? payload.is_active : Boolean(existing.is_active),
  };

  if (next.email.toLowerCase() !== existing.email.toLowerCase()) {
    const duplicate = await queryOne(
      'SELECT id FROM doctors WHERE LOWER(email) = LOWER(?) AND id != ?',
      [next.email, id]
    );
    if (duplicate) {
      throw new AppError(
        409,
        'DUPLICATE_EMAIL',
        `A doctor with email "${next.email}" already exists.`,
        { email: 'Email address is already assigned to another doctor.' }
      );
    }
  }

  const now = new Date().toISOString();
  const updated = await queryOne(
    `UPDATE doctors
     SET name = ?, specialization = ?, phone = ?, email = ?, availability = ?, is_active = ?, updated_at = ?
     WHERE id = ?
     RETURNING *`,
    [
      next.name,
      next.specialization,
      next.phone,
      next.email,
      next.availability,
      boolParam(next.is_active),
      now,
      id,
    ]
  );

  const countRow = await queryOne(
    'SELECT COUNT(*) AS appointment_count FROM appointments WHERE doctor_id = ?',
    [id]
  );

  res.status(200).json({
    success: true,
    message: 'Doctor updated successfully.',
    data: normalizeDoctor({
      ...updated,
      appointment_count: countRow?.appointment_count ?? 0,
    }),
  });
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const id = parsePositiveId(req.params.id, 'Doctor ID');
  const existing = await queryOne('SELECT id, name FROM doctors WHERE id = ?', [id]);

  if (!existing) {
    throw new AppError(404, 'DOCTOR_NOT_FOUND', `Doctor with ID ${id} was not found.`);
  }

  await query('DELETE FROM doctors WHERE id = ?', [id]);

  res.status(200).json({
    success: true,
    message: `${existing.name} was deleted successfully.`,
    data: { id },
  });
});
