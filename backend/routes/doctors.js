const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const SlotHold = require('../models/SlotHold');
const { authMiddleware } = require('../middleware/auth');

// GET /api/doctors (List & Filter doctors by specialization)
router.get('/', async (req, res) => {
  try {
    const { specialization, search } = req.query;
    const filter = {};

    if (specialization) {
      filter.specialization = specialization;
    }

    let doctors = await Doctor.find(filter).populate('userId', 'name email');

    if (search) {
      const searchLower = search.toLowerCase();
      doctors = doctors.filter(doc => doc.userId && doc.userId.name.toLowerCase().includes(searchLower));
    }

    return res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ error: 'Failed to fetch doctor directory.' });
  }
});

// GET /api/doctors/:id/slots?date=YYYY-MM-DD (Compute available time slots)
router.get('/:id/slots', authMiddleware, async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query; // YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter (YYYY-MM-DD) is required.' });
    }

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // 1. Generate working hour slots
    const [startH, startM] = doctor.workingHoursStart.split(':').map(Number);
    const [endH, endM] = doctor.workingHoursEnd.split(':').map(Number);

    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const duration = doctor.slotDurationMinutes || 30;

    // 2. Query existing non-cancelled appointments
    const existingAppointments = await Appointment.find({
      doctorId,
      date,
      status: { $ne: 'CANCELLED' },
    }).select('timeSlot');
    const bookedSlotSet = new Set(existingAppointments.map(a => a.timeSlot));

    // 3. Query active slot holds
    const now = new Date();
    const activeHolds = await SlotHold.find({
      doctorId,
      date,
      expiresAt: { $gt: now },
    });
    const heldSlotMap = new Map(); // timeSlot -> patientId
    activeHolds.forEach(hold => heldSlotMap.set(hold.timeSlot, hold.patientId.toString()));

    const currentPatientId = req.user.patientId ? req.user.patientId.toString() : null;

    const slots = [];
    while (currentMinutes + duration <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      const timeSlot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const isBooked = bookedSlotSet.has(timeSlot);
      const holdingPatientId = heldSlotMap.get(timeSlot);
      const isHeldByOther = holdingPatientId && holdingPatientId !== currentPatientId;
      const isHeldBySelf = holdingPatientId && holdingPatientId === currentPatientId;

      let isAvailable = true;
      let isHeld = false;
      let reason = null;

      if (isBooked) {
        isAvailable = false;
        reason = 'Booked';
      } else if (isHeldByOther) {
        isAvailable = false;
        isHeld = true;
        reason = 'Reserved by another patient';
      } else if (isHeldBySelf) {
        isHeld = true;
        reason = 'Reserved by you';
      }

      slots.push({
        time: timeSlot,
        isAvailable,
        isHeld,
        reason,
      });

      currentMinutes += duration;
    }

    return res.json({
      doctor: {
        id: doctor._id,
        name: doctor.userId.name,
        specialization: doctor.specialization,
      },
      date,
      slots,
    });
  } catch (error) {
    console.error('Error computing doctor slots:', error);
    return res.status(500).json({ error: 'Failed to compute available slots.' });
  }
});

module.exports = router;
