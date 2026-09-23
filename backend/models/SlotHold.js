const mongoose = require('mongoose');

const SlotHoldSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  timeSlot: {
    type: String, // HH:MM
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0, // MongoDB TTL index auto-deletes document when expiresAt date is reached!
  },
}, { timestamps: true });

// Index for quick slot hold lookups
SlotHoldSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });

module.exports = mongoose.model('SlotHold', SlotHoldSchema);
