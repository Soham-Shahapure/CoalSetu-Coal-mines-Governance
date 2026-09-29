import React from 'react';
import { InspectionData, InspectionPeriod } from '../../types/inspection';
import { Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface Step2Props {
  formData: InspectionData;
  onChange: (updates: Partial<InspectionData>) => void;
}

export const Step2InspectionPeriods: React.FC<Step2Props> = ({ formData, onChange }) => {
  const periods = formData.inspection_periods || [
    { period_number: 1, start_time: '', end_time: '' },
    { period_number: 2, start_time: '', end_time: '' },
    { period_number: 3, start_time: '', end_time: '' },
  ];

  const handlePeriodChange = (
    index: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    const updated = [...periods];
    while (updated.length <= index) {
      updated.push({
        period_number: (updated.length + 1) as 1 | 2 | 3,
        start_time: '',
        end_time: '',
      });
    }
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange({ inspection_periods: updated });
  };

  const setSuggestedTimes = () => {
    onChange({
      inspection_periods: [
        { period_number: 1, start_time: '08:30', end_time: '10:30' },
        { period_number: 2, start_time: '11:15', end_time: '13:15' },
        { period_number: 3, start_time: '14:00', end_time: '15:30' },
      ],
    });
  };

  const getValidationWarning = (p: InspectionPeriod) => {
    if (p.start_time && p.end_time) {
      if (p.start_time >= p.end_time) {
        return 'End time must be after start time.';
      }
    } else if (p.start_time && !p.end_time) {
      return 'Completed inspection period cannot have an empty end time.';
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <span>Stage 2 — District Examination Periods (Section 1)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Regulation 129(8) requires recording of up to three statutory inspection rounds in the district.
          </p>
        </div>
        <button
          type="button"
          onClick={setSuggestedTimes}
          className="self-start sm:self-auto text-xs px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg border border-sky-200 transition font-medium"
        >
          Use Typical Shift Times
        </button>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((periodNum, idx) => {
          const p = periods.find((item) => item.period_number === periodNum) || {
            period_number: periodNum as 1 | 2 | 3,
            start_time: '',
            end_time: '',
          };
          const warning = getValidationWarning(p);
          const isComplete = p.start_time && p.end_time && !warning;

          return (
            <div
              key={periodNum}
              className={`bg-slate-50 border rounded-2xl p-4 sm:p-5 transition shadow-xs ${
                warning
                  ? 'border-rose-300 bg-rose-50/40'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center border border-sky-200">
                    {periodNum}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {periodNum === 1
                        ? 'First Inspection (Before/At Start of Shift)'
                        : periodNum === 2
                        ? 'Second Inspection (During Active Workings)'
                        : 'Third Inspection (Pre-Handover / Goaf & Face)'}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      {periodNum === 1 ? 'Mandatory Statutory Round' : 'Follow-up District Examination'}
                    </span>
                  </div>
                </div>

                {isComplete ? (
                  <span className="text-emerald-700 text-xs flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Recorded</span>
                  </span>
                ) : periodNum === 1 ? (
                  <span className="text-sky-700 text-xs font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Mandatory</span>
                ) : (
                  <span className="text-slate-400 text-xs">Optional</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Start Time (From)
                  </label>
                  <input
                    type="time"
                    value={p.start_time || ''}
                    onChange={(e) => handlePeriodChange(idx, 'start_time', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    End Time (To)
                  </label>
                  <input
                    type="time"
                    value={p.end_time || ''}
                    onChange={(e) => handlePeriodChange(idx, 'end_time', e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-sky-500 font-mono shadow-xs"
                  />
                </div>
              </div>

              {warning && (
                <div className="mt-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{warning}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2 shadow-xs">
        <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <span>
          <strong>Validation Rule:</strong> At least one complete inspection period (Start & End Time) must be recorded before final statutory submission. End time cannot precede start time.
        </span>
      </div>
    </div>
  );
};
