import React from 'react';
import Spinner from './Spinner';

export default function SlotPicker({ slots, selectedSlot, onSelectSlot, loading, error }) {
  if (loading) {
    return (
      <div className="py-8 text-center text-slate-500 flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-xs">Computing working hours & availability...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="py-6 text-center text-slate-500 text-xs bg-slate-50 rounded-lg border border-slate-200">
        No slots available for the selected date.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const isSelected = selectedSlot === slot.time;
          const isDisabled = !slot.isAvailable && !slot.isHeld;

          let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-sky-500 hover:text-sky-700';
          if (isSelected) {
            btnStyle = 'bg-sky-600 border-sky-600 text-white font-bold ring-2 ring-sky-300';
          } else if (isDisabled) {
            btnStyle = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-70';
          }

          return (
            <button
              key={slot.time}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectSlot(slot.time)}
              className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${btnStyle}`}
            >
              {slot.time}
              {!slot.isAvailable && <span className="block text-[10px] font-normal no-underline">({slot.reason || 'Unavailable'})</span>}
            </button>
          );
        })}
      </div>
      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
        <span>Click an available slot to hold it for 5 minutes.</span>
      </div>
    </div>
  );
}
