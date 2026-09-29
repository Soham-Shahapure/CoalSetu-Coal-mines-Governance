import React from 'react';
import { InspectionSummary } from '../types/inspection';
import {
  FileText,
  Eye,
  CheckCircle,
  AlertTriangle,
  Lock,
  Calendar,
  Clock,
  Flame,
  Droplets,
  HeartPulse,
  Users,
  Shield,
} from 'lucide-react';

interface OvermanSirdarListProps {
  inspections: InspectionSummary[];
  onViewInspection: (id: string) => void;
  districtName: string;
}

export const OvermanSirdarList: React.FC<OvermanSirdarListProps> = ({
  inspections,
  onViewInspection,
  districtName,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-black font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-sky-100 text-sky-950 text-xs font-bold px-2 py-0.5 rounded border border-sky-300 uppercase">
              CMR 129(8) Immutable Records
            </span>
            <span className="text-black font-semibold text-xs">
              Statutory Source Repository
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-black">
            Received Sirdar Shift Inspections
          </h2>
          <p className="text-xs text-black font-medium mt-1">
            All submitted shift inspections for {districtName}. These records are read-only and serve as statutory source evidence for the Overman daily report.
          </p>
        </div>

        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-center shrink-0">
          <div className="text-xl font-extrabold text-black">{inspections.length}</div>
          <div className="text-[11px] font-bold text-slate-600 uppercase">Total Submissions</div>
        </div>
      </div>

      {/* List */}
      {inspections.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-black">No Sirdar Inspections Available</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            No submitted Sirdar shift inspection records currently exist for this district.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="bg-white border-2 border-slate-300 hover:border-sky-400 rounded-2xl p-5 transition shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b-2 border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-black text-black">
                      {insp.inspection_number}
                    </span>
                    <span className="bg-emerald-100 text-black border border-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-800" />
                      Submitted & Sealed (Immutable)
                    </span>
                  </div>
                  <div className="text-xs text-black font-medium mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong className="font-bold">Mining Sirdar:</strong> {insp.sirdar_name} ({insp.sirdar_employee_id})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">Shift:</strong> {insp.shift_name} ({insp.shift_hours})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">Date:</strong> {insp.inspection_date}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewInspection(insp.id)}
                  className="py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-950 font-bold text-xs rounded-xl border-2 border-sky-300 hover:border-sky-500 transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                >
                  <Eye className="w-4 h-4 text-sky-700" />
                  <span>View Original Record</span>
                </button>
              </div>

              {/* Badges / Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-slate-500 font-semibold block text-[11px]">Persons Under Charge</span>
                  <span className="font-extrabold text-black text-sm">{insp.persons_under_charge} workmen</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-slate-500 font-semibold block text-[11px]">Inspection Periods</span>
                  <span className="font-extrabold text-black text-sm">{insp.period_count} periods completed</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-slate-500 font-semibold block text-[11px]">Deficiencies</span>
                  <span className={`font-extrabold text-sm ${insp.deficiency_count > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                    {insp.deficiency_count > 0 ? `${insp.deficiency_count} recorded` : 'Nil deficiencies'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                  <span className="text-slate-500 font-semibold block text-[11px]">Hazards & Tests</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {insp.gas_detected ? (
                      <span className="text-[10px] bg-rose-100 text-rose-950 font-bold px-1.5 py-0.5 rounded border border-rose-300">
                        CH₄ Tested
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-900 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                        Gas Nil
                      </span>
                    )}
                    {insp.water_seepage && (
                      <span className="text-[10px] bg-sky-100 text-sky-950 font-bold px-1.5 py-0.5 rounded border border-sky-300">
                        Water
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
