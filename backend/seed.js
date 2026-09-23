require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const SlotHold = require('./models/SlotHold');

async function seedDatabase() {
  await connectDB();
  console.log('[Seed] Clearing existing collections...');

  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Appointment.deleteMany({});
  await SlotHold.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Seed 2 Patients
  const p1User = await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: passwordHash,
    role: 'PATIENT',
  });
  const p1 = await Patient.create({
    userId: p1User._id,
    phone: '+1 (555) 234-5678',
    dob: '1988-04-12',
  });

  const p2User = await User.create({
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: passwordHash,
    role: 'PATIENT',
  });
  await Patient.create({
    userId: p2User._id,
    phone: '+1 (555) 987-6543',
    dob: '1992-09-25',
  });

  // 2. Seed 3 Doctors
  const d1User = await User.create({
    name: 'Dr. Sarah Jenkins',
    email: 'sarah@clinic.com',
    password: passwordHash,
    role: 'DOCTOR',
  });
  const d1 = await Doctor.create({
    userId: d1User._id,
    phone: '+1 (555) 100-2001',
    specialization: 'General Physician',
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    slotDurationMinutes: 30,
  });

  const d2User = await User.create({
    name: 'Dr. Marcus Vance',
    email: 'marcus@clinic.com',
    password: passwordHash,
    role: 'DOCTOR',
  });
  await Doctor.create({
    userId: d2User._id,
    phone: '+1 (555) 100-2002',
    specialization: 'Cardiologist',
    workingHoursStart: '09:00',
    workingHoursEnd: '16:00',
    slotDurationMinutes: 30,
  });

  const d3User = await User.create({
    name: 'Dr. Elena Rostova',
    email: 'elena@clinic.com',
    password: passwordHash,
    role: 'DOCTOR',
  });
  await Doctor.create({
    userId: d3User._id,
    phone: '+1 (555) 100-2003',
    specialization: 'Dermatologist',
    workingHoursStart: '10:00',
    workingHoursEnd: '18:00',
    slotDurationMinutes: 30,
  });

  // 3. Sample Existing Appointment
  const todayStr = new Date().toISOString().split('T')[0];
  await Appointment.create({
    patientId: p1._id,
    doctorId: d1._id,
    date: todayStr,
    timeSlot: '10:00',
    symptoms: 'Persistent chest tightness and exertional shortness of breath when walking up stairs.',
    status: 'BOOKED',
  });

  console.log('\n✅ Database seeded successfully!');
  console.log('==================================================');
  console.log('DEMO CREDENTIALS (Password for all: password123)');
  console.log('==================================================');
  console.log('Patient 1: john@example.com (John Doe)');
  console.log('Patient 2: jane@example.com (Jane Smith)');
  console.log('Doctor 1:  sarah@clinic.com (Dr. Sarah Jenkins - General Physician)');
  console.log('Doctor 2:  marcus@clinic.com (Dr. Marcus Vance - Cardiologist)');
  console.log('Doctor 3:  elena@clinic.com (Dr. Elena Rostova - Dermatologist)');
  console.log('==================================================\n');

  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
