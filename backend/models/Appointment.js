const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  followUpInstructions: { type: String, default: '' },
}, { _id: false });

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
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
  symptoms: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['BOOKED', 'COMPLETED', 'CANCELLED'],
    default: 'BOOKED',
  },
  clinicalNotes: {
    type: String,
    default: '',
  },
  prescription: {
    type: PrescriptionSchema,
    default: null,
  },
}, { timestamps: true });

// Compound unique index to guarantee no two appointments exist for the same doctor, date, and slot
AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
