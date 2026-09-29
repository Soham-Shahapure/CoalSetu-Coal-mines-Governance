import React from 'react';
import { InspectionData, SirdarAssignment } from '../../types/inspection';
import { Calendar, Clock, MapPin, UserCheck, HardHat, Info } from 'lucide-react';

interface Step1Props {
  formData: InspectionData;
  assignment: SirdarAssignment;
  onChange: (updates: Partial<InspectionData>) => void;
}

export const Step1ShiftDetails: React.FC<Step1Props> = ({ formData, assignment, onChange }) => {
  const shifts = assignment.available_shifts;
  const currentShift = shifts.find((s) => s.id === formData.shift_id) || shifts[0];

  const handleShiftSelect = (shiftId: string) => {
    onChange({ shift_id: shiftId });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-600" />
          <span>Stage 1 — Shift & Statutory District Identification</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Statutory header details under G.S.R. 977(E). The Sirdar's district and seam assignment are automatically loaded.
        </p>
      </div>

      {/* Statutory Header Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mine & Subsidiary (Read-only verified) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>Colliery / Mine Name</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{assignment.mine.mine_name}</div>
          <div className="text-xs text-slate-500">
            Subsidiary: {assignment.mine.subsidiary} ({assignment.mine.mine_type})
          </div>
        </div>

        {/* District & Seam (Read-only verified) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
            <HardHat className="w-3 h-3" />
            <span>Assigned District & Area</span>
          </div>
          <div className="text-sm font-bold text-sky-800">
            {assignment.district.district_name} • {assignment.district.seam_name}
          </div>
          <div className="text-xs text-black font-semibold">
            Assigned Area: <span className="font-bold text-sky-950">Galleryify Section</span> (All Shifts)
          </div>
        </div>

        {/* Sirdar Identity */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>Reporting Sirdar</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{assignment.user.name}</div>
          <div className="text-xs text-slate-500">
            Certificate / Emp ID: <span className="font-mono text-slate-700 font-semibold">{assignment.user.employee_id}</span>
          </div>
        </div>

        {/* Inspection Date */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-sky-600" />
            <span>Inspection Date (Statutory Date)</span>
          </label>
          <input
            type="date"
            value={formData.inspection_date}
            onChange={(e) => onChange({ inspection_date: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
          />
        </div>
      </div>

      {/* Shift Selection */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Select Shift & Working Hours
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Select the statutory underground operational shift for this inspection:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {shifts.map((shift) => {
            const isSelected = formData.shift_id === shift.id;
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => handleShiftSelect(shift.id)}
                className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-50 border-2 border-sky-500 text-slate-900 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{shift.shift_name}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-sky-700 font-semibold mt-2">
                    {shift.start_time} – {shift.end_time}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                  8-hour shift duration
                </div>
              </button>
            );
          })}
        </div>

        {currentShift && (
          <div className="mt-4 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-xs">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              Confirmed Shift Hours: <strong className="text-slate-900 font-mono">{currentShift.start_time} to {currentShift.end_time}</strong> for district <strong className="text-sky-700">{assignment.district.district_name}</strong>.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
