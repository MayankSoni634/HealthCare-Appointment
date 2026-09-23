import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DoctorCard from '../components/DoctorCard';
import SlotPicker from '../components/SlotPicker';
import Spinner from '../components/Spinner';
import { Search, Filter, Calendar, AlertCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DoctorDirectory() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialization, setSpecialization] = useState('');
  const [search, setSearch] = useState('');

  // Booking Modal State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Hold Timer state
  const [holdTimerSeconds, setHoldTimerSeconds] = useState(null);
  const [holdExpired, setHoldExpired] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [specialization]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (specialization) query.set('specialization', specialization);
      if (search) query.set('search', search);

      const res = await fetch(`/api/doctors?${query.toString()}`);
      const data = await res.json();
      if (res.ok && data.doctors) {
        setDoctors(data.doctors);
      }
    } catch {
      console.error('Failed to fetch doctor roster');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const openBookingModal = (doc) => {
    setSelectedDoctor(doc);
    setSelectedSlot('');
    setSymptoms('');
    setBookingError('');
    setHoldTimerSeconds(null);
    setHoldExpired(false);
    fetchSlotsForDoctor(doc._id, selectedDate);
  };

  const closeBookingModal = () => {
    setSelectedDoctor(null);
    setSelectedSlot('');
    setSymptoms('');
    setBookingError('');
    setHoldTimerSeconds(null);
  };

  const fetchSlotsForDoctor = async (doctorId, date) => {
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const res = await fetch(`/api/doctors/${doctorId}/slots?date=${date}`);
      const data = await res.json();
      if (res.ok && data.slots) {
        setSlots(data.slots);
      } else {
        setSlotsError(data.error || 'Failed to calculate available slots.');
      }
    } catch {
      setSlotsError('Network error while computing slots.');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Hold Timer interval effect
  useEffect(() => {
    if (holdTimerSeconds === null || holdTimerSeconds <= 0) return;
    const timer = setInterval(() => {
      setHoldTimerSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setHoldExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [holdTimerSeconds]);

  const handleSelectSlot = async (slotTime) => {
    setBookingError('');
    setHoldExpired(false);

    try {
      const res = await fetch('/api/appointments/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          date: selectedDate,
          timeSlot: slotTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBookingError(data.error || 'Failed to hold slot.');
        fetchSlotsForDoctor(selectedDoctor._id, selectedDate);
        return;
      }

      setSelectedSlot(slotTime);
      setHoldTimerSeconds(300); // 5 minutes
    } catch {
      setBookingError('Could not reserve slot.');
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !symptoms.trim()) {
      setBookingError('Please select an available time slot and describe your symptoms.');
      return;
    }

    if (holdExpired) {
      setBookingError('Slot reservation expired. Please re-select your time slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor._id,
          date: selectedDate,
          timeSlot: selectedSlot,
          symptoms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Catches Mongo duplicate key (code 11000) clean HTTP 409 response
        setBookingError(data.error || 'Booking failed.');
        setBookingLoading(false);
        fetchSlotsForDoctor(selectedDoctor._id, selectedDate);
        return;
      }

      closeBookingModal();
      navigate('/patient/dashboard');
    } catch {
      setBookingError('Failed to confirm appointment booking.');
      setBookingLoading(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find a Doctor</h1>
          <p className="text-sm text-slate-500">Browse medical specialists, check real-time working slots, and book a consultation</p>
        </div>

        {/* Search & Filter Controls */}
        <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="relative w-full sm:w-64">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 bg-white"
            >
              <option value="">All Specializations</option>
              <option value="General Physician">General Physician</option>
              <option value="Cardiologist">Cardiologist</option>
              <option value="Dermatologist">Dermatologist</option>
              <option value="Pediatrician">Pediatrician</option>
              <option value="Orthopedic">Orthopedic</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto py-2 px-5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        {/* Doctor Cards Responsive Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm">Loading available doctor directory...</span>
          </div>
        ) : doctors.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            No doctors found matching your query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <DoctorCard key={doc._id} doctor={doc} onBookClick={openBookingModal} />
            ))}
          </div>
        )}
      </main>

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Book Consultation</h3>
                <p className="text-xs text-slate-300">Dr. {selectedDoctor.userId?.name} ({selectedDoctor.specialization})</p>
              </div>
              <button onClick={closeBookingModal} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="p-6 space-y-5">
              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  1. Select Appointment Date
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                    setHoldTimerSeconds(null);
                    fetchSlotsForDoctor(selectedDoctor._id, e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Slot Picker Grid */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    2. Select Working Time Slot
                  </label>
                  {selectedSlot && holdTimerSeconds !== null && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${holdExpired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                      {holdExpired ? 'Hold Expired' : `Slot Held: ${formatTimer(holdTimerSeconds)}`}
                    </span>
                  )}
                </div>

                <SlotPicker
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelectSlot={handleSelectSlot}
                  loading={slotsLoading}
                  error={slotsError}
                />
              </div>

              {/* Patient Symptoms Intake */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  3. Describe Your Symptoms & Concerns
                </label>
                <textarea
                  required
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Please enter your symptoms and any relevant medical context for the doctor..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || !selectedSlot || !symptoms.trim() || holdExpired}
                  className="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-60"
                >
                  {bookingLoading ? <Spinner size="sm" /> : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
