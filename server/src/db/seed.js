import { boolParam, query, queryOne } from './index.js';

function formatOffsetDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const SEED_DOCTORS = [
  {
    name: 'Dr. Elena Rostova',
    specialization: 'General Dentistry',
    phone: '+1 (555) 234-8810',
    email: 'elena.rostova@brightsmile.clinic',
    availability: 'Mon - Fri, 09:00 AM - 05:00 PM',
    is_active: true,
  },
  {
    name: 'Dr. Marcus Vance',
    specialization: 'Orthodontics',
    phone: '+1 (555) 234-8821',
    email: 'marcus.vance@brightsmile.clinic',
    availability: 'Mon, Tue, Thu, 08:30 AM - 04:30 PM',
    is_active: true,
  },
  {
    name: 'Dr. Priya Nair',
    specialization: 'Endodontics',
    phone: '+1 (555) 234-8834',
    email: 'priya.nair@brightsmile.clinic',
    availability: 'Tue - Sat, 10:00 AM - 06:00 PM',
    is_active: true,
  },
  {
    name: 'Dr. Julian Brooks',
    specialization: 'Periodontics',
    phone: '+1 (555) 234-8847',
    email: 'julian.brooks@brightsmile.clinic',
    availability: 'Mon, Wed, Fri, 09:00 AM - 03:30 PM',
    is_active: true,
  },
  {
    name: 'Dr. Sophia Chen',
    specialization: 'Pediatric Dentistry',
    phone: '+1 (555) 234-8859',
    email: 'sophia.chen@brightsmile.clinic',
    availability: 'Mon - Fri, 08:00 AM - 02:30 PM',
    is_active: true,
  },
  {
    name: 'Dr. Arthur Pendelton',
    specialization: 'Oral Surgery',
    phone: '+1 (555) 234-8872',
    email: 'arthur.pendelton@brightsmile.clinic',
    availability: 'Wed - Thu, 11:00 AM - 05:00 PM',
    is_active: false,
  },
];

function buildSeedAppointments(doctorIdsByEmail) {
  const today = formatOffsetDate(0);
  const tomorrow = formatOffsetDate(1);
  const inTwoDays = formatOffsetDate(2);
  const inThreeDays = formatOffsetDate(3);
  const yesterday = formatOffsetDate(-1);
  const twoDaysAgo = formatOffsetDate(-2);

  return [
    {
      patient_name: 'Liam Carter',
      patient_contact: '+1 (555) 701-1120',
      doctor_id: doctorIdsByEmail['elena.rostova@brightsmile.clinic'],
      appointment_date: today,
      appointment_time: '09:30',
      reason: 'Routine dental checkup and ultrasonic scaling',
      status: 'confirmed',
      notes: 'Annual hygiene visit',
    },
    {
      patient_name: 'Maya Lin',
      patient_contact: 'maya.lin@example.com',
      doctor_id: doctorIdsByEmail['marcus.vance@brightsmile.clinic'],
      appointment_date: today,
      appointment_time: '11:00',
      reason: 'Clear aligner tray adjustment and scan',
      status: 'pending',
      notes: 'Needs updated 3D arch scan',
    },
    {
      patient_name: 'Noah Patel',
      patient_contact: '+1 (555) 704-3391',
      doctor_id: doctorIdsByEmail['priya.nair@brightsmile.clinic'],
      appointment_date: today,
      appointment_time: '14:30',
      reason: 'Upper molar root canal consultation',
      status: 'confirmed',
      notes: 'Referred for sensitivity on tooth #14',
    },
    {
      patient_name: 'Chloe Bennett',
      patient_contact: '+1 (555) 709-4418',
      doctor_id: doctorIdsByEmail['sophia.chen@brightsmile.clinic'],
      appointment_date: today,
      appointment_time: '16:00',
      reason: 'Pediatric fluoride varnish and cavity check',
      status: 'pending',
      notes: 'First clinic visit',
    },
    {
      patient_name: 'Ethan Morales',
      patient_contact: 'ethan.morales@example.com',
      doctor_id: doctorIdsByEmail['julian.brooks@brightsmile.clinic'],
      appointment_date: tomorrow,
      appointment_time: '10:00',
      reason: 'Periodontal pocket charting and deep cleaning',
      status: 'confirmed',
      notes: 'Follow-up after 3 months',
    },
    {
      patient_name: 'Ava Thompson',
      patient_contact: '+1 (555) 712-9045',
      doctor_id: doctorIdsByEmail['elena.rostova@brightsmile.clinic'],
      appointment_date: tomorrow,
      appointment_time: '13:30',
      reason: 'Composite filling replacement on lower premolar',
      status: 'pending',
      notes: 'Confirm insurance pre-authorization',
    },
    {
      patient_name: 'Lucas Kim',
      patient_contact: 'lucas.kim@example.com',
      doctor_id: doctorIdsByEmail['marcus.vance@brightsmile.clinic'],
      appointment_date: inTwoDays,
      appointment_time: '09:00',
      reason: 'Braces wire tightening and bracket check',
      status: 'confirmed',
      notes: 'Month 6 orthodontic check',
    },
    {
      patient_name: 'Isabella Rossi',
      patient_contact: '+1 (555) 718-2277',
      doctor_id: doctorIdsByEmail['priya.nair@brightsmile.clinic'],
      appointment_date: inThreeDays,
      appointment_time: '15:00',
      reason: 'Post-endodontic crown evaluation',
      status: 'pending',
      notes: 'Check bite alignment',
    },
    {
      patient_name: 'Oliver Grant',
      patient_contact: '+1 (555) 720-6632',
      doctor_id: doctorIdsByEmail['elena.rostova@brightsmile.clinic'],
      appointment_date: yesterday,
      appointment_time: '10:30',
      reason: 'Teeth whitening consultation',
      status: 'completed',
      notes: 'Provided take-home kit instructions',
    },
    {
      patient_name: 'Harper Reed',
      patient_contact: 'harper.reed@example.com',
      doctor_id: doctorIdsByEmail['sophia.chen@brightsmile.clinic'],
      appointment_date: yesterday,
      appointment_time: '14:00',
      reason: 'Pediatric molar sealant placement',
      status: 'completed',
      notes: 'Completed without discomfort',
    },
    {
      patient_name: 'Benjamin Hayes',
      patient_contact: '+1 (555) 725-8814',
      doctor_id: doctorIdsByEmail['julian.brooks@brightsmile.clinic'],
      appointment_date: twoDaysAgo,
      appointment_time: '11:30',
      reason: 'Gum graft follow-up examination',
      status: 'cancelled',
      notes: 'Patient requested reschedule next week',
    },
  ];
}

/**
 * Populate the database with initial doctors and appointments only when empty.
 */
export async function seedDatabase({ force = false } = {}) {
  const existing = await queryOne('SELECT COUNT(*) AS count FROM doctors');
  const count = Number(existing?.count ?? 0);

  if (count > 0 && !force) {
    return { seeded: false, doctors: count };
  }

  if (force) {
    await query('DELETE FROM appointments');
    await query('DELETE FROM doctors');
  }

  const now = new Date().toISOString();
  const doctorIdsByEmail = {};

  for (const doc of SEED_DOCTORS) {
    const inserted = await queryOne(
      `INSERT INTO doctors (name, specialization, phone, email, availability, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id, email`,
      [
        doc.name,
        doc.specialization,
        doc.phone,
        doc.email,
        doc.availability,
        boolParam(doc.is_active),
        now,
        now,
      ]
    );
    doctorIdsByEmail[inserted.email] = inserted.id;
  }

  const appointments = buildSeedAppointments(doctorIdsByEmail);
  for (const appt of appointments) {
    await query(
      `INSERT INTO appointments (patient_name, patient_contact, doctor_id, appointment_date, appointment_time, reason, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appt.patient_name,
        appt.patient_contact,
        appt.doctor_id,
        appt.appointment_date,
        appt.appointment_time,
        appt.reason,
        appt.status,
        appt.notes,
        now,
        now,
      ]
    );
  }

  return {
    seeded: true,
    doctors: SEED_DOCTORS.length,
    appointments: appointments.length,
  };
}
