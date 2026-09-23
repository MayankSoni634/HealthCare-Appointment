import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Calendar, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={user.role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/dashboard'} className="flex items-center gap-2 text-sky-700 font-bold text-lg">
          <Stethoscope className="w-6 h-6 text-sky-600" />
          <span>CarePoint Health</span>
        </Link>

        <nav className="flex items-center gap-6">
          {user.role === 'PATIENT' && (
            <>
              <Link
                to="/patient/doctors"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/patient/doctors' ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                Find Doctors
              </Link>
              <Link
                to="/patient/dashboard"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === '/patient/dashboard' ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                My Appointments
              </Link>
            </>
          )}

          {user.role === 'DOCTOR' && (
            <Link
              to="/doctor/dashboard"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                location.pathname === '/doctor/dashboard' ? 'text-sky-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Patient Queue
            </Link>
          )}

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs border border-sky-200">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-500 capitalize">{user.role.toLowerCase()}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
