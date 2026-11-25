import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { closeDb, initDb } from '../src/db/index.js';
import { createSchema } from '../src/db/schema.js';
import { seedDatabase } from '../src/db/seed.js';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await response.json();
  return { status: response.status, body };
}

before(async () => {
  await initDb({ databaseUrl: '', sqlitePath: ':memory:' });
  await createSchema();
  await seedDatabase({ force: true });

  const app = createApp();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await closeDb();
});

describe('Dental Clinic API', () => {
  it('GET /api/health reports connected database', async () => {
    const { status, body } = await request('/api/health');
    assert.equal(status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
    assert.equal(body.data.database, 'connected');
  });

  it('Doctor CRUD lifecycle with validation and duplicate email protection', async () => {
    const listRes = await request('/api/doctors');
    assert.equal(listRes.status, 200);
    assert.ok(listRes.body.data.length >= 6);

    // Invalid payload -> 400
    const invalidRes = await request('/api/doctors', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: 'not-an-email' }),
    });
    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.body.error.code, 'VALIDATION_ERROR');
    assert.ok(invalidRes.body.error.details.name);
    assert.ok(invalidRes.body.error.details.email);

    // Create -> 201
    const createRes = await request('/api/doctors', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dr. Hannah Mercer',
        specialization: 'Prosthodontics',
        phone: '+1 (555) 890-1234',
        email: 'hannah.mercer@brightsmile.clinic',
        availability: 'Mon - Thu, 09:00 AM - 04:00 PM',
        is_active: true,
      }),
    });
    assert.equal(createRes.status, 201);
    const createdId = createRes.body.data.id;
    assert.equal(createRes.body.data.name, 'Dr. Hannah Mercer');

    // Duplicate email -> 409
    const dupRes = await request('/api/doctors', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dr. Duplicate',
        specialization: 'General Dentistry',
        phone: '+1 (555) 890-9999',
        email: 'hannah.mercer@brightsmile.clinic',
        availability: 'Fri, 09:00 AM - 01:00 PM',
      }),
    });
    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.body.error.code, 'DUPLICATE_EMAIL');

    // Get by ID -> 200
    const detailRes = await request(`/api/doctors/${createdId}`);
    assert.equal(detailRes.status, 200);
    assert.equal(detailRes.body.data.email, 'hannah.mercer@brightsmile.clinic');
    assert.ok(Array.isArray(detailRes.body.data.appointments));

    // Update via PATCH -> 200
    const patchRes = await request(`/api/doctors/${createdId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: false, availability: 'On Leave' }),
    });
    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.data.is_active, false);
    assert.equal(patchRes.body.data.availability, 'On Leave');

    // Delete -> 200
    const deleteRes = await request(`/api/doctors/${createdId}`, {
      method: 'DELETE',
    });
    assert.equal(deleteRes.status, 200);

    // Get deleted -> 404
    const afterDelete = await request(`/api/doctors/${createdId}`);
    assert.equal(afterDelete.status, 404);
  });

  it('Appointment CRUD lifecycle with invalid doctor check and overlap prevention', async () => {
    const doctorsRes = await request('/api/doctors');
    const activeDoctor = doctorsRes.body.data.find((d) => d.is_active);
    const inactiveDoctor = doctorsRes.body.data.find((d) => !d.is_active);
    assert.ok(activeDoctor);
    assert.ok(inactiveDoctor);

    // Non-existent doctor -> 400
    const badDocRes = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_name: 'Test Patient',
        patient_contact: '555-1234',
        doctor_id: 999999,
        appointment_date: '2027-05-10',
        appointment_time: '10:00',
        reason: 'Consultation',
      }),
    });
    assert.equal(badDocRes.status, 400);
    assert.equal(badDocRes.body.error.code, 'INVALID_DOCTOR');

    // Inactive doctor -> 409
    const inactiveDocRes = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_name: 'Test Patient',
        patient_contact: '555-1234',
        doctor_id: inactiveDoctor.id,
        appointment_date: '2027-05-10',
        appointment_time: '10:00',
        reason: 'Consultation',
      }),
    });
    assert.equal(inactiveDocRes.status, 409);
    assert.equal(inactiveDocRes.body.error.code, 'DOCTOR_INACTIVE');

    // Valid creation -> 201
    const createRes = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_name: 'Clara Oswald',
        patient_contact: 'clara@example.com',
        doctor_id: activeDoctor.id,
        appointment_date: '2027-05-10',
        appointment_time: '10:00',
        reason: 'Crown fitting',
        status: 'pending',
      }),
    });
    assert.equal(createRes.status, 201);
    const apptId = createRes.body.data.id;

    // Overlapping slot within 30 mins -> 409
    const overlapRes = await request('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patient_name: 'Amy Pond',
        patient_contact: '555-9988',
        doctor_id: activeDoctor.id,
        appointment_date: '2027-05-10',
        appointment_time: '10:15',
        reason: 'Cleaning',
      }),
    });
    assert.equal(overlapRes.status, 409);
    assert.equal(overlapRes.body.error.code, 'APPOINTMENT_CONFLICT');

    // Update status -> 200
    const statusRes = await request(`/api/appointments/${apptId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'confirmed' }),
    });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.data.status, 'confirmed');

    // Delete -> 200
    const deleteRes = await request(`/api/appointments/${apptId}`, {
      method: 'DELETE',
    });
    assert.equal(deleteRes.status, 200);
  });
});
