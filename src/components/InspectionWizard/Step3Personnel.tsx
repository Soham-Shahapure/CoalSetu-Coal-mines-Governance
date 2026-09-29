import React from 'react';
import { InspectionData } from '../../types/inspection';
import { Users, Info, Plus, Minus, UserCheck } from 'lucide-react';

interface Step3Props {
  formData: InspectionData;
  onChange: (updates: Partial<InspectionData>) => void;
}

export const Step3Personnel: React.FC<Step3Props> = ({ formData, onChange }) => {
  const currentCount = Number(formData.persons_under_charge) || 0;

  const setCount = (val: number) => {
    const sanitized = Math.max(0, Math.floor(val));
    onChange({ persons_under_charge: sanitized });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-sky-600" />
          <span>Stage 3 — Personnel Under Sirdar Charge (Section 2)</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Statutory declaration under G.S.R. 977(E) Section 2: Number of persons working in the district under the Sirdar's direct charge.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto text-center space-y-6 shadow-xs">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 shadow-xs">
          <Users className="w-7 h-7" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-900 mb-1">
            Number of persons working under my charge
          </label>
          <p className="text-xs text-slate-500">
            Including face workers, drillers, loaders, support men, and trammers
          </p>
        </div>

        {/* Large Counter Controls for Rugged Underground Tablets */}
        <div className="flex items-center justify-center space-x-4">
          <button
            type="button"
            onClick={() => setCount(currentCount - 1)}
            disabled={currentCount <= 0}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-300 hover:border-sky-400 text-slate-700 flex items-center justify-center disabled:opacity-40 text-xl font-bold transition active:scale-95 shadow-xs"
            aria-label="Decrease persons count"
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="relative">
            <input
              type="number"
              min={0}
              max={150}
              value={currentCount}
              onChange={(e) => setCount(parseInt(e.target.value, 10) || 0)}
              className="w-32 h-16 text-center text-3xl font-extrabold bg-white border-2 border-sky-500 rounded-2xl text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono shadow-inner"
            />
            <span className="block text-[11px] text-slate-500 font-medium mt-1">
              Workmen
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCount(currentCount + 1)}
            className="w-14 h-14 rounded-2xl bg-white border border-slate-300 hover:border-sky-400 text-slate-700 flex items-center justify-center text-xl font-bold transition active:scale-95 shadow-xs"
            aria-label="Increase persons count"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Quick presets common in Indian underground coal mine districts */}
        <div className="pt-4 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Quick Typical District Crew Presets:
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[12, 18, 24, 28, 32].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setCount(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition border ${
                  currentCount === num
                    ? 'bg-sky-500 text-white font-bold border-sky-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                {num} persons
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-center gap-2 text-left shadow-xs">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Crew count must be accurately declared prior to final statutory submission.
          </span>
        </div>
      </div>
    </div>
  );
};
