import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { Calendar, User, FileText, Pill, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Form State for Clinical Notes & Prescription
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      if (res.ok && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch {
      console.error('Failed to load doctor appointments queue');
    } finally {
      setLoading(false);
    }
  };

  const openConsultationModal = (appt) => {
    setSelectedAppt(appt);
    setClinicalNotes(appt.clinicalNotes || '');
    if (appt.prescription) {
      setMedication(appt.prescription.medication || '');
      setDosage(appt.prescription.dosage || '');
      setFrequency(appt.prescription.frequency || 'Daily');
      setFollowUpInstructions(appt.prescription.followUpInstructions || '');
    } else {
      setMedication('');
      setDosage('');
      setFrequency('Daily');
      setFollowUpInstructions('');
    }
    setFormError('');
  };

  const closeConsultationModal = () => {
    setSelectedAppt(null);
    setFormError('');
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!clinicalNotes.trim()) {
      setFormError('Clinical assessment notes are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch(`/api/appointments/${selectedAppt._id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicalNotes,
          medication,
          dosage,
          frequency,
          followUpInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to submit clinical notes.');
        setSubmitting(false);
        return;
      }

      closeConsultationModal();
      fetchAppointments();
    } catch {
      setFormError('Failed to complete consultation.');
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const upcomingAppts = appointments.filter(a => a.date !== todayStr);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctor Patient Queue</h1>
          <p className="text-sm text-slate-500">Inspect patient symptoms and record post-visit clinical notes & prescriptions</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-sm">Loading patient queue...</span>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Today's Queue Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-bold text-slate-800">Today&apos;s Appointments ({todayStr})</h2>
                <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                  {todayAppts.length} Patient{todayAppts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {todayAppts.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  No appointments scheduled for today.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {todayAppts.map((appt) => (
                    <AppointmentQueueCard key={appt._id} appt={appt} onOpenModal={openConsultationModal} />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming Queue Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <h2 className="text-lg font-bold text-slate-800">Upcoming & Past Appointments</h2>
              </div>

              {upcomingAppts.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                  No upcoming appointments in queue.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingAppts.map((appt) => (
                    <AppointmentQueueCard key={appt._id} appt={appt} onOpenModal={openConsultationModal} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Doctor Consultation & Notes Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 bg-teal-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Consultation Record</h3>
                <p className="text-xs text-teal-200">
                  Patient: {selectedAppt.patientId?.userId?.name} | {selectedAppt.date} at {selectedAppt.timeSlot}
                </p>
              </div>
              <button onClick={closeConsultationModal} className="text-teal-200 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteConsultation} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Patient Reported Symptoms */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  Patient Reported Symptoms
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium leading-relaxed">
                  {selectedAppt.symptoms}
                </div>
              </div>

              {/* Doctor Clinical Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Doctor Assessment & Clinical Notes
                </label>
                <textarea
                  required
                  rows={4}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Enter medical assessment, findings, diagnosis, and patient instructions..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Prescription Inputs (Optional) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  Prescription Details (Optional)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Medication Name</label>
                    <input
                      type="text"
                      value={medication}
                      onChange={(e) => setMedication(e.target.value)}
                      placeholder="e.g. Amoxicillin"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 500mg"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 bg-white"
                    >
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="As needed">As needed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Follow-up Instructions</label>
                    <input
                      type="text"
                      value={followUpInstructions}
                      onChange={(e) => setFollowUpInstructions(e.target.value)}
                      placeholder="e.g. Rest & drink fluids"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeConsultationModal}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting || !clinicalNotes.trim()}
                  className="flex-1 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Spinner size="sm" /> : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save & Complete
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentQueueCard({ appt, onOpenModal }) {
  const patientName = appt.patientId?.userId?.name || 'Patient';
  const patientEmail = appt.patientId?.userId?.email || '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">{patientName}</h3>
            <span className="text-[11px] text-slate-500">{patientEmail}</span>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        <div className="text-xs text-slate-600 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-3">
          <span>Date: <strong>{appt.date}</strong></span>
          <span>Time: <strong>{appt.timeSlot}</strong></span>
        </div>

        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Symptoms</span>
          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
            {appt.symptoms}
          </p>
        </div>
      </div>

      <button
        onClick={() => onOpenModal(appt)}
        className="w-full py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5" />
        {appt.status === 'COMPLETED' ? 'Edit Consultation Notes' : 'Conduct Consultation'}
      </button>
    </div>
  );
}
