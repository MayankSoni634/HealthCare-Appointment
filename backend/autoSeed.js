const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const SlotHold = require('./models/SlotHold');

async function autoSeedIfEmpty() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[AutoSeed] Database already contains records. Skipping auto-seed.');
      return;
    }

    console.log('[AutoSeed] Empty database detected. Auto-seeding initial demo accounts...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Patients
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

    // 2. Doctors
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

    // 3. Sample Appointment
    const todayStr = new Date().toISOString().split('T')[0];
    await Appointment.create({
      patientId: p1._id,
      doctorId: d1._id,
      date: todayStr,
      timeSlot: '10:00',
      symptoms: 'Persistent chest tightness and exertional shortness of breath when walking up stairs.',
      status: 'BOOKED',
    });

    console.log('[AutoSeed] Auto-seeded 2 Patients and 3 Doctors successfully!');
    console.log('[AutoSeed] Demo Accounts Ready: john@example.com / sarah@clinic.com (Password: password123)');
  } catch (error) {
    console.error('[AutoSeed Error]:', error);
  }
}

module.exports = autoSeedIfEmpty;
