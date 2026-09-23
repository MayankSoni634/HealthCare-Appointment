const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// Helper to issue cookie and return response
function sendTokenResponse(res, user, profileId, statusCode = 200, message = 'Success') {
  const payload = {
    userId: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    patientId: user.role === 'PATIENT' ? profileId : undefined,
    doctorId: user.role === 'DOCTOR' ? profileId : undefined,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return res.status(statusCode).json({
    message,
    user: payload,
  });
}

// POST /api/auth/register (Open Self-Registration for PATIENT & DOCTOR)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, dob, specialization, workingHoursStart, workingHoursEnd, slotDurationMinutes } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (!['PATIENT', 'DOCTOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be PATIENT or DOCTOR.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    });

    let profileId = null;

    if (role === 'PATIENT') {
      const patient = await Patient.create({
        userId: newUser._id,
        phone: phone || '',
        dob: dob || '',
      });
      profileId = patient._id;
    } else if (role === 'DOCTOR') {
      if (!specialization) {
        return res.status(400).json({ error: 'Specialization is required for Doctor registration.' });
      }

      const doctor = await Doctor.create({
        userId: newUser._id,
        phone: phone || '',
        specialization,
        workingHoursStart: workingHoursStart || '09:00',
        workingHoursEnd: workingHoursEnd || '17:00',
        slotDurationMinutes: slotDurationMinutes ? parseInt(slotDurationMinutes, 10) : 30,
      });
      profileId = doctor._id;
    }

    return sendTokenResponse(res, newUser, profileId, 201, 'Registration successful');
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let profileId = null;
    if (user.role === 'PATIENT') {
      const patient = await Patient.findOne({ userId: user._id });
      if (patient) profileId = patient._id;
    } else if (user.role === 'DOCTOR') {
      const doctor = await Doctor.findOne({ userId: user._id });
      if (doctor) profileId = doctor._id;
    }

    return sendTokenResponse(res, user, profileId, 200, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to process login.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  return res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
