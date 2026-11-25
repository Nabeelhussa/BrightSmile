# BrightSmile Dental — Clinic Management System

A full-stack, responsive Dental Clinic Management System for managing **doctors** and **patient appointments**, built with **React + Vite**, **Express**, and **PostgreSQL** (with automatic built-in **SQLite** fallback for zero-setup local development).

---

## Features

- **Dashboard (`/dashboard`)**
  - Summary KPI cards for **Total Doctors** (and active count), **Today's Appointments**, **Upcoming Appointments**, and **Pending Confirmation**.
  - Upcoming & recent appointments overview table and doctors roster snapshot.
  - Quick appointment scheduling modal directly from the dashboard.
- **Doctors Directory (`/doctors`)**
  - Search by name, specialization, or email, plus specialization and active/inactive filters.
  - Full CRUD: create, view profile details (including assigned appointments), edit, toggle active status, and delete with destructive confirmation.
- **Appointments Schedule (`/appointments`)**
  - Filter by search term, status (`pending`, `confirmed`, `completed`, `cancelled`), doctor, and date (including one-click **Today's Schedule**).
  - Full CRUD, quick inline status updates, doctor availability validation, and **30-minute overlap protection** per doctor.
- **Resilient UX & API**
  - Loading spinners, empty states with helpful recovery actions, error states with retry buttons, and toast notifications on every mutation.
  - Client-side and server-side validation with structured JSON error responses (`400`, `404`, `409`, `500`).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite 6, `react-router-dom` v6, Lucide Icons, responsive CSS |
| **Backend** | Node.js (v22.5+ / v24), Express 4, CORS, `pg` |
| **Database** | PostgreSQL (production / Render) & Node built-in `node:sqlite` (zero-config local dev) |
| **Testing** | Node built-in test runner (`node --test`) |
| **Hosting** | Render (Web Service + Managed PostgreSQL + Static Site) |

---

## Project Structure

```text
├── .env.example
├── package.json                  # Root scripts to run API + Frontend together
├── render.yaml                   # Render Blueprint (PostgreSQL + API + Static Site)
├── docs/
│   └── PROJECT_DOCUMENTATION.md  # Architecture, schema, API specs, testing & deployment guide
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── app.js                # Express app, CORS, routes, centralized error handling
│   │   ├── server.js             # Entry point, DB init, schema & automatic seed
│   │   ├── config/env.js
│   │   ├── db/
│   │   │   ├── index.js          # Unified PostgreSQL / SQLite relational adapter
│   │   │   ├── schema.js         # Relational tables, foreign keys, indexes
│   │   │   ├── seed.js           # Idempotent mock clinic seed data
│   │   │   └── runSeed.js        # CLI seed runner
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── tests/api.test.js         # Integration tests for health, doctors, and appointments
└── client/
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/client.js         # Fetch wrapper + ApiError handling
        ├── components/           # Reusable layout, UI primitives, and domain modals
        ├── pages/                # DashboardPage, DoctorsPage, AppointmentsPage
        ├── styles/               # Design tokens, global layout, component styles
        └── utils/                # Formatters and client-side validators
```

---

## Local Setup & Running

### Prerequisites

- **Node.js `>= 22.5.0`** (tested on `v24.12.0`)
- **npm `>= 10`**
- *(Optional)* **PostgreSQL** if you want to test against Postgres locally instead of the automatic SQLite relational database.

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd <repo-folder>
git checkout develop
npm run install:all
```

### 2. Configure Environment Variables

Copy the example environment files (no secrets are required for local SQLite mode):

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

#### Backend (`server/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Express HTTP port | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `DATABASE_URL` | PostgreSQL connection string (if omitted, uses local SQLite) | *(empty)* |
| `SQLITE_PATH` | SQLite file path when `DATABASE_URL` is omitted | `./data/dental_clinic.db` |
| `DATABASE_SSL` | Set `true` to force SSL for PostgreSQL | `false` |
| `CORS_ORIGIN` | Comma-separated allowed frontend origins | `http://localhost:5173` |

#### Frontend (`client/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL for backend REST API (including `/api`) | `http://localhost:5000/api` |

### 3. Start the Application

Run both the Express API (`http://localhost:5000`) and React Vite dev server (`http://localhost:5173`) concurrently:

```bash
npm run dev
```

On startup, the backend automatically:
1. Initializes the relational schema (`doctors` and `appointments` tables with foreign keys and indexes).
2. Seeds **6 dental doctors** and **11 realistic appointments** relative to today's date (only if the database is empty).

To reset and re-seed the database manually at any time:

```bash
npm --prefix server run seed -- --force
```

### 4. Run Tests & Production Build

```bash
# Run backend API integration tests
npm test

# Build frontend production bundle
npm run build
```

---

## API Reference

All responses follow a consistent JSON envelope:
- Success: `{ "success": true, "data": ..., "message"?: "..." }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details"?: { ... } } }`

### Health Check

- **`GET /api/health`**
  ```bash
  curl http://localhost:5000/api/health
  ```
  Response (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "status": "ok",
      "database": "connected",
      "dialect": "sqlite",
      "timestamp": "2026-11-25T16:00:00.000Z"
    }
  }
  ```

### Doctors (`/api/doctors`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/doctors` | List doctors (`?search=`, `?specialization=`, `?active=true\|false`) |
| `GET` | `/api/doctors/:id` | Get single doctor with associated appointments |
| `POST` | `/api/doctors` | Create a new doctor |
| `PUT` / `PATCH` | `/api/doctors/:id` | Update doctor details or active status |
| `DELETE` | `/api/doctors/:id` | Delete a doctor (cascades linked appointments) |

**Create Doctor Example:**

```bash
curl -X POST http://localhost:5000/api/doctors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Clara Hayes",
    "specialization": "Orthodontics",
    "phone": "+1 (555) 390-2211",
    "email": "clara.hayes@brightsmile.clinic",
    "availability": "Mon - Thu, 09:00 AM - 05:00 PM",
    "is_active": true
  }'
```

### Appointments (`/api/appointments`)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/appointments` | List appointments (`?search=`, `?status=`, `?doctor_id=`, `?date=YYYY-MM-DD`) |
| `GET` | `/api/appointments/:id` | Get single appointment with doctor details |
| `POST` | `/api/appointments` | Schedule appointment (validates active doctor & 30-min slot availability) |
| `PUT` / `PATCH` | `/api/appointments/:id` | Update appointment details or status |
| `DELETE` | `/api/appointments/:id` | Delete an appointment |

**Create Appointment Example:**

```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name": "Emma Watson",
    "patient_contact": "+1 (555) 812-4401",
    "doctor_id": 1,
    "appointment_date": "2026-12-01",
    "appointment_time": "10:30",
    "reason": "Routine cleaning and X-ray",
    "status": "pending",
    "notes": "Prefers morning slot"
  }'
```

---

## Deploying to Render

This repository includes a [`render.yaml`](./render.yaml) Blueprint defining:
1. **`dental-clinic-db`**: Managed PostgreSQL database.
2. **`dental-clinic-api`**: Node Web Service (`rootDir: server`, health check `/api/health`).
3. **`dental-clinic-web`**: Static Site (`rootDir: client`, SPA rewrite `/* -> /index.html`).

### Deployment Steps
1. Push the `develop` branch to GitHub.
2. In Render Dashboard, choose **New + -> Blueprint** (or create the PostgreSQL, Web Service, and Static Site manually).
3. Copy the public URL of `dental-clinic-api` (e.g., `https://dental-clinic-api.onrender.com`) and set `VITE_API_URL=https://dental-clinic-api.onrender.com/api` on `dental-clinic-web`, then trigger a manual deploy of the static site.
4. *(Recommended)* Update `CORS_ORIGIN` on `dental-clinic-api` to your `dental-clinic-web` URL.
5. Verify `https://<your-api>.onrender.com/api/health` returns `{"success": true, "data": {"status": "ok", "database": "connected"}}`.
