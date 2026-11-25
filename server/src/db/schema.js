import { exec, getDialect } from './index.js';

/**
 * Create relational tables, foreign key constraints, and performance indexes
 * in either PostgreSQL or SQLite.
 */
export async function createSchema() {
  const dialect = getDialect();

  const idColumn =
    dialect === 'postgres'
      ? 'SERIAL PRIMARY KEY'
      : 'INTEGER PRIMARY KEY AUTOINCREMENT';

  const boolType = dialect === 'postgres' ? 'BOOLEAN NOT NULL DEFAULT TRUE' : 'INTEGER NOT NULL DEFAULT 1';

  await exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id ${idColumn},
      name VARCHAR(120) NOT NULL,
      specialization VARCHAR(120) NOT NULL,
      phone VARCHAR(40) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      availability VARCHAR(200) NOT NULL,
      is_active ${boolType},
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id ${idColumn},
      patient_name VARCHAR(120) NOT NULL,
      patient_contact VARCHAR(160) NOT NULL,
      doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      appointment_date VARCHAR(20) NOT NULL,
      appointment_time VARCHAR(10) NOT NULL,
      reason VARCHAR(300) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
      notes TEXT DEFAULT '',
      created_at VARCHAR(40) NOT NULL,
      updated_at VARCHAR(40) NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date
      ON appointments (doctor_id, appointment_date, appointment_time);

    CREATE INDEX IF NOT EXISTS idx_appointments_status
      ON appointments (status);
  `);
}
