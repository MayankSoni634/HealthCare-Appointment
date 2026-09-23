const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
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
  dob: {
    type: String, // YYYY-MM-DD
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
