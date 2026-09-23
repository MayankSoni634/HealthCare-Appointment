import React from 'react';
import { User, Clock } from 'lucide-react';

export default function DoctorCard({ doctor, onBookClick }) {
  const name = doctor.userId ? doctor.userId.name : 'Doctor';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-lg border border-sky-200 flex-shrink-0">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Dr. {name}</h3>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              {doctor.specialization}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-500 mb-5">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Working Hours: <strong>{doctor.workingHoursStart} - {doctor.workingHoursEnd}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Slot Duration: <strong>{doctor.slotDurationMinutes} mins</strong></span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onBookClick(doctor)}
        className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
      >
        Book Appointment
      </button>
    </div>
  );
}
