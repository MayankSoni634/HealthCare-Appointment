const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  specialization: {
    type: String,
    required: true,
    enum: ['General Physician', 'Cardiologist', 'Dermatologist', 'Pediatrician', 'Orthopedic'],
  },
  workingHoursStart: {
    type: String,
    default: '09:00',
  },
  workingHoursEnd: {
    type: String,
    default: '17:00',
  },
  slotDurationMinutes: {
    type: Number,
    default: 30,
  },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
