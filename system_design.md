# System Design Document: Healthcare Appointment & Follow-up Manager

## 1. Overview
The Healthcare Appointment & Follow-up Manager is a role-based clinical platform connecting Patients, Doctors, and Administrators. It manages appointment scheduling, pre-visit symptom intake, AI pre-visit clinical summaries, post-visit clinical documentation, AI post-visit patient summaries, medication reminders, and notifications.

---

## 2. Double-Booking Prevention Architecture
Preventing simultaneous bookings for the same doctor and time slot is guaranteed through a multi-tiered strategy combining server-side transactional validation and database-level constraints.

### Database Unique Constraint
At the core of concurrency protection, the `Appointment` table enforces a composite unique index:
```prisma
@@unique([doctorId, appointmentDate, timeSlot])
```
If two patients attempt to confirm the exact same slot concurrently, the database engine enforces isolation. Only one transaction succeeds; the second receives a unique constraint violation (`P2002`).

### Server-Side Validation
The `POST /api/appointments` endpoint validates the requested date and time against active doctor leave records and existing non-cancelled appointments before attempting insertion. On constraint collision, the API catches the exception gracefully and returns an HTTP 409 Conflict response:
```json
{ "error": "Sorry, this appointment slot is no longer available." }
```

---

## 3. Temporary Slot Hold Mechanism
To prevent race conditions during symptom entry, the system implements a 5-minute temporary slot hold.

1. **Reservation Initiation**: When a patient selects an available slot, `POST /api/appointments/hold-slot` creates a record in `SlotHold` with `expiresAt = NOW() + 5 minutes`.
2. **Availability Filtering**: `GET /api/doctors/[id]/slots` excludes slots currently held by other patients (`expiresAt > NOW()`).
3. **Validation & Cleanup**: When booking is confirmed, the system verifies slot ownership and clears active holds. Expired holds automatically release without blocking other users.

---

## 4. Doctor Leave Conflict Handling
When an Administrator adds a doctor leave entry (`POST /api/doctors/[id]/leave`):

1. **Leave Registration**: A unique record `(doctorId, leaveDate)` is inserted into `DoctorLeave`.
2. **Booking Prevention**: Future booking attempts for that date/doctor are blocked at the API level (`isOnLeave: true`).
3. **Conflict Detection**: Existing non-cancelled appointments on the leave date are flagged in the database with `isLeaveConflict = true`.
4. **Patient Dispatch**: Notifications are immediately dispatched to affected patients informing them that their appointment requires rescheduling.

---

## 5. Resilient LLM Failure Handling
The AI integration utilizes OpenAI GPT models to generate clinical pre-visit summaries and patient-friendly post-visit notes. Crucially, external LLM failures or missing API keys never break core healthcare operations.

```
+------------------+      Try OpenAI API      +-------------------+
| Patient Symptoms | -----------------------> | OpenAI Completion |
+------------------+                          +-------------------+
         |                                              |
         | Error / No Key                               | Success
         v                                              v
+------------------+                          +-------------------+
| Fallback Summary |                          | Save AI Summary   |
| (isFallback: true)                          | (isFallback: false)|
+------------------+                          +-------------------+
```

- **Pre-Visit Fallback**: If OpenAI fails, the system executes a deterministic clinical rule fallback that extracts chief complaint keywords and provides standard diagnostic questions while marking `isFallback: true`.
- **Post-Visit Fallback**: If LLM summarization fails during clinical note submission, original doctor notes are saved intact, status updates to `COMPLETED`, and the UI displays `"AI summary currently unavailable."`

---

## 6. Resilient Notification Infrastructure
Email notifications (booking confirmation, cancellation notices, leave alerts) and Google Calendar sync are treated as secondary side-effects.

- **Non-Blocking Delivery**: Email and calendar API calls are wrapped in asynchronous try/catch handlers.
- **Graceful Degradation**: If SMTP or OAuth credentials are missing, notifications log mock payloads to console and store `MOCK_SENT` audit logs in `Notification` without interrupting appointment creation or editing.

---

## 7. Database Design
The relational SQLite/PostgreSQL schema consists of decoupled domain entities:

- **`User` / `Patient` / `Doctor`**: Core authentication and role profiles.
- **`DoctorLeave` / `SlotHold`**: Availability control and concurrency primitives.
- **`Appointment`**: Master booking record linked to `Symptom`, `AISymptomSummary`, `ClinicalNote`, `Prescription`, and `MedicationReminder`.
- **`Notification`**: Audit trail for system communications.
