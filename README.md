# MERN Healthcare Appointment Platform

A complete, production-ready MERN stack Healthcare Appointment platform connecting **Patients** and **Doctors**. Built with Open Self-Registration for both roles, a clean medical UI using Tailwind CSS, real-time slot computation, 5-minute temporary slot holds with automatic MongoDB TTL expiration, and strict double-booking rejection via Mongoose compound unique indexes.

---

## 📁 Project Structure

```text
E:\HealtyCare Appointment\
├── backend/                <-- Express.js + Mongoose + MongoDB Backend
│   ├── index.js            <-- Express server entry point
│   ├── db.js               <-- Mongoose connector (MongoDB + MemoryServer fallback)
│   ├── autoSeed.js         <-- Automatic initial demo account populator
│   ├── seed.js             <-- Manual demo reset script
│   ├── models/             <-- Mongoose schemas (User, Patient, Doctor, Appointment, SlotHold)
│   ├── middleware/         <-- JWT auth middleware
│   └── routes/             <-- API endpoints (auth, doctors, appointments)
├── frontend/               <-- React + Vite + Tailwind CSS Frontend
│   ├── src/                <-- App.jsx, Pages, Components, Context
│   ├── vite.config.js      <-- Vite configuration
│   └── tailwind.config.js  <-- Tailwind medical color palette
├── package.json            <-- Root scripts & dependencies
├── README.md               <-- Documentation & manual run instructions
└── .env                    <-- Environment variables
```

---

## 🔑 Demo Credentials

Run `npm run seed` to reset the database to a clean demo state anytime before an interview:

| Role | Email | Password | Name / Specialization |
| :--- | :--- | :--- | :--- |
| **Patient** | `john@example.com` | `password123` | John Doe |
| **Patient** | `jane@example.com` | `password123` | Jane Smith |
| **Doctor** | `sarah@clinic.com` | `password123` | Dr. Sarah Jenkins (*General Physician*) |
| **Doctor** | `marcus@clinic.com` | `password123` | Dr. Marcus Vance (*Cardiologist*) |
| **Doctor** | `elena@clinic.com` | `password123` | Dr. Elena Rostova (*Dermatologist*) |

*Note: You can also register brand-new Patients or Doctors directly through the Signup UI at any time.*

---

## 🛠️ Local Run Instructions

### Option A: Standard Manual Running (2 Terminals)

**Terminal 1 (Backend Server - Port 5000)**:
```cmd
cd /d "E:\HealtyCare Appointment"
npm run backend
```

**Terminal 2 (Frontend Client - Port 5173)**:
```cmd
cd /d "E:\HealtyCare Appointment"
npm run frontend
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 🛡️ Headline Technical Architecture & Features

### 1. Open Self-Registration for Both Roles (`PATIENT` & `DOCTOR`)
- No seed script dependency required for app operation. Both Patients and Doctors sign up directly through the UI.
- Interactive Role Toggle (*"I'm a Patient"* vs *"I'm a Doctor"*).
- **Patient Registration**: Name, Email, Password, Phone, Date of Birth (`dob`).
- **Doctor Registration**: Name, Email, Password, Phone, Specialization (*General Physician, Cardiologist, Dermatologist, Pediatrician, Orthopedic*), Working Hours (*Start/End Time*), and Slot Duration in minutes (*default 30*).
- **Immediate Session Auth**: `POST /api/auth/register` creates the `User` doc and linked `Patient`/`Doctor` profile, sets an `httpOnly` JWT cookie, and logs the user in immediately.

### 2. Double-Booking Prevention via Compound Unique Index
To guarantee zero duplicate bookings at the database kernel level, the `Appointment` Mongoose schema defines a compound unique index:
```javascript
AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });
```
When concurrent booking requests arrive for the exact same slot, MongoDB enforces atomic isolation. The backend catches duplicate key errors (`code 11000`) and returns a clean HTTP 409 Conflict message:
```json
{ "error": "Sorry, this appointment slot is no longer available." }
```

### 3. Automatic 5-Minute Slot Hold via MongoDB TTL Index
When a patient selects a time slot, a temporary `SlotHold` document is created with `expiresAt = NOW() + 5 minutes`. The `SlotHold` model leverages a native **MongoDB TTL Index**:
```javascript
SlotHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```
MongoDB automatically purges expired hold documents in the background without needing manual cron jobs or cleanup logic.
