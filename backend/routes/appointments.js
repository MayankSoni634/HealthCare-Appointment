const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const SlotHold = require('../models/SlotHold');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authMiddleware, requireRole } = require('../middleware/auth');

// POST /api/appointments/hold (5-minute temporary slot hold)
router.post('/hold', authMiddleware, requireRole('PATIENT'), async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;
    const patientId = req.user.patientId;

    if (!doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: 'doctorId, date, and timeSlot are required.' });
    }

    // 1. Check if appointment already booked
    const existingAppt = await Appointment.findOne({
      doctorId,
      date,
      timeSlot,
      status: { $ne: 'CANCELLED' },
    });

    if (existingAppt) {
      return res.status(409).json({ error: 'Sorry, this appointment slot is no longer available.' });
    }

    // 2. Check if held by another patient
    const now = new Date();
    const activeHold = await SlotHold.findOne({
      doctorId,
      date,
      timeSlot,
      expiresAt: { $gt: now },
    });

    if (activeHold && activeHold.patientId.toString() !== patientId.toString()) {
      return res.status(409).json({ error: 'Sorry, another patient is currently reserving this slot.' });
    }

    // 3. Create or refresh 5-minute hold (expiresAt = now + 5 minutes)
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    // Delete existing holds for this patient/slot
    await SlotHold.deleteMany({
      $or: [
        { patientId },
        { expiresAt: { $lte: now } },
      ],
    });

    const hold = await SlotHold.create({
      doctorId,
      patientId,
      date,
      timeSlot,
      expiresAt,
    });

    return res.json({
      message: 'Slot held for 5 minutes',
      expiresAt: hold.expiresAt,
      date: hold.date,
      timeSlot: hold.timeSlot,
    });
  } catch (error) {
    console.error('Error creating slot hold:', error);
    return res.status(500).json({ error: 'Failed to reserve appointment slot.' });
  }
});

// GET /api/appointments (Role-filtered appointment history)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'PATIENT' && req.user.patientId) {
      filter.patientId = req.user.patientId;
    } else if (req.user.role === 'DOCTOR' && req.user.doctorId) {
      filter.doctorId = req.user.doctorId;
    }

    const { status } = req.query;
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ date: 1, timeSlot: 1 });

    return res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

// GET /api/appointments/:id (Single appointment details)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email' },
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email' },
      });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    return res.json({ appointment });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    return res.status(500).json({ error: 'Failed to fetch appointment details.' });
  }
});

// POST /api/appointments (Finalize booking with double-booking prevention)
router.post('/', authMiddleware, requireRole('PATIENT'), async (req, res) => {
  try {
    const { doctorId, date, timeSlot, symptoms } = req.body;
    const patientId = req.user.patientId;

    if (!doctorId || !date || !timeSlot || !symptoms) {
      return res.status(400).json({ error: 'Doctor, Date, Time Slot, and Symptoms are required.' });
    }

    const doctor = await Doctor.findById(doctorId);
    const patient = await Patient.findById(patientId);

    if (!doctor || !patient) {
      return res.status(404).json({ error: 'Doctor or Patient profile not found.' });
    }

    // Create Appointment - Compound unique index catches double booking
    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      timeSlot,
      symptoms,
      status: 'BOOKED',
    });

    // Clear active hold for this slot
    await SlotHold.deleteMany({ doctorId, date, timeSlot }).catch(() => {});

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error) {
    // Catch Mongo Duplicate Key Error (code 11000) for compound unique index
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Sorry, this appointment slot is no longer available.' });
    }

    console.error('Error creating appointment:', error);
    return res.status(500).json({ error: 'Failed to finalize appointment booking.' });
  }
});

// POST /api/appointments/:id/complete (Doctor submits notes & prescription)
router.post('/:id/complete', authMiddleware, requireRole('DOCTOR'), async (req, res) => {
  try {
    const { clinicalNotes, medication, dosage, frequency, followUpInstructions } = req.body;

    if (!clinicalNotes) {
      return res.status(400).json({ error: 'Clinical notes are required.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    if (appointment.doctorId.toString() !== req.user.doctorId.toString()) {
      return res.status(403).json({ error: 'Unauthorized to update this appointment.' });
    }

    appointment.clinicalNotes = clinicalNotes;
    appointment.status = 'COMPLETED';

    if (medication) {
      appointment.prescription = {
        medication,
        dosage: dosage || '',
        frequency: frequency || 'Daily',
        followUpInstructions: followUpInstructions || '',
      };
    }

    await appointment.save();

    return res.json({
      message: 'Consultation completed and notes saved.',
      appointment,
    });
  } catch (error) {
    console.error('Error completing consultation:', error);
    return res.status(500).json({ error: 'Failed to submit clinical notes.' });
  }
});

module.exports = router;
