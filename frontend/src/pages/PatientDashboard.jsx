import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { Calendar, Stethoscope, FileText, Pill, Clock, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

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
      console.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
            <p className="text-sm text-slate-500">Track your consultation schedule and post-visit medical notes</p>
          </div>
          <Link
            to="/patient/doctors"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Book New Appointment
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-2">
            <Spinner size="lg" />
            <span className="text-sm">Loading appointment history...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-600 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">No appointments booked yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Browse available specialists and pick a working time slot to book your first visit.</p>
            <Link
              to="/patient/doctors"
              className="inline-block mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-lg shadow-sm"
            >
              Browse Doctor Directory
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appt) => {
              const docName = appt.doctorId?.userId?.name || 'Doctor';
              const docSpec = appt.doctorId?.specialization || 'Specialist';

              return (
                <div key={appt._id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-200">
                          {docName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Dr. {docName}</h3>
                          <span className="text-xs text-sky-600 font-medium">{docSpec}</span>
                        </div>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date: <strong>{appt.date}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Time Slot: <strong>{appt.timeSlot}</strong></span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Symptoms Reported</span>
                      <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 line-clamp-2">
                        {appt.symptoms}
                      </p>
                    </div>
                  </div>

                  {appt.status === 'COMPLETED' ? (
                    <button
                      onClick={() => setSelectedAppt(appt)}
                      className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-lg border border-emerald-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Notes & Prescription
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 text-center py-1 font-medium italic">
                      Doctor notes will be available after completion
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Completed Consultation Details Modal */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden space-y-5 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Consultation Notes & Prescription</h3>
                <p className="text-xs text-slate-500">Dr. {selectedAppt.doctorId?.userId?.name} ({selectedAppt.date} at {selectedAppt.timeSlot})</p>
              </div>
              <StatusBadge status={selectedAppt.status} />
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1 text-sm">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Clinical Notes
                </span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedAppt.clinicalNotes || 'No notes entered.'}
                </p>
              </div>

              {selectedAppt.prescription && (
                <div>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1 text-sm">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Prescription Details
                  </span>
                  <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60 space-y-1 text-emerald-950">
                    <div><strong>Medication:</strong> {selectedAppt.prescription.medication}</div>
                    <div><strong>Dosage:</strong> {selectedAppt.prescription.dosage}</div>
                    <div><strong>Frequency:</strong> {selectedAppt.prescription.frequency}</div>
                    {selectedAppt.prescription.followUpInstructions && (
                      <div><strong>Follow-up Instructions:</strong> {selectedAppt.prescription.followUpInstructions}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedAppt(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
