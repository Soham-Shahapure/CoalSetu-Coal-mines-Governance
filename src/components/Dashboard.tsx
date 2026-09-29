import React from 'react';
import { User, SirdarAssignment, InspectionSummary, InspectionData } from '../types/inspection';
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowRight,
  Shield,
  Layers,
  Calendar,
  Users,
  Eye,
  PlusCircle,
  Lock,
} from 'lucide-react';

interface DashboardProps {
  user: User;
  assignment: SirdarAssignment;
  inspections: InspectionSummary[];
  activeDraft: InspectionData | null;
  onStartNewInspection: () => void;
  onResumeDraft: () => void;
  onViewInspection: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  assignment,
  inspections,
  activeDraft,
  onStartNewInspection,
  onResumeDraft,
  onViewInspection,
}) => {
  // Find today's inspection if any
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySubmitted = inspections.find(
    (i) => i.inspection_date === todayStr && i.status === 'SUBMITTED'
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-black">
      {/* Primary Action Card: Today's Shift Inspection Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <span>Today's Shift Inspection</span>
              </h3>
              {todaySubmitted ? (
                <span className="bg-emerald-50 text-black border-2 border-emerald-400 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  SUBMITTED & SEALED
                </span>
              ) : activeDraft ? (
                <span className="bg-sky-50 text-black border-2 border-sky-400 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  DRAFT IN PROGRESS
                </span>
              ) : (
                <span className="bg-slate-100 text-black border border-slate-300 text-xs px-3 py-1 rounded-full font-bold">
                  NOT STARTED
                </span>
              )}
            </div>

            <p className="text-[14px] text-black font-medium leading-relaxed mb-4">
              Under CMR 129(8), the Mining Sirdar must carry out shift inspections of his assigned district,
              record statutory observations (ventilation, roof & side strata, gas, water, safety materials),
              and submit the official statutory digital report (G.S.R. 977(E)).
            </p>

            {/* Inspection Stage / Status Indicator */}
            <div className="bg-slate-50 rounded-xl p-4 border-2 border-slate-200 mb-5">
              <div className="text-xs font-bold text-black uppercase tracking-wider mb-2.5">
                Shift Inspection Periods
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center text-sm">
                <div className="p-3 rounded-lg bg-white border-2 border-slate-300 shadow-2xs">
                  <div className="font-bold text-black">Period 1</div>
                  <div className="text-xs text-sky-950 font-bold mt-0.5">Pre-Shift / Entry</div>
                </div>
                <div className="p-3 rounded-lg bg-white border-2 border-slate-300 shadow-2xs">
                  <div className="font-bold text-black">Period 2</div>
                  <div className="text-xs text-sky-950 font-bold mt-0.5">Mid-Shift Working</div>
                </div>
                <div className="p-3 rounded-lg bg-white border-2 border-slate-300 shadow-2xs">
                  <div className="font-bold text-black">Period 3</div>
                  <div className="text-xs text-sky-950 font-bold mt-0.5">Handover / Exit</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            {todaySubmitted ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => onViewInspection(todaySubmitted.id)}
                  className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 border-2 border-slate-300 transition shadow-xs"
                >
                  <Eye className="w-4.5 h-4.5 text-emerald-700" />
                  <span>View Submitted Record ({todaySubmitted.inspection_number})</span>
                </button>
                <button
                  onClick={onStartNewInspection}
                  className="w-full sm:w-auto px-5 py-3 bg-sky-500 hover:bg-sky-600 text-black rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition shadow-xs border-2 border-sky-600"
                >
                  <PlusCircle className="w-4.5 h-4.5" />
                  <span>Start New Shift Inspection</span>
                </button>
              </div>
            ) : activeDraft ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={onResumeDraft}
                  className="w-full sm:flex-1 py-3.5 px-5 bg-sky-500 hover:bg-sky-600 text-black font-extrabold rounded-xl text-base transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 border-2 border-sky-600"
                >
                  <span>Continue Active Draft</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={onStartNewInspection}
                  className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-100 text-black rounded-xl text-sm font-bold border-2 border-slate-300 transition"
                >
                  Start Fresh
                </button>
              </div>
            ) : (
              <button
                onClick={onStartNewInspection}
                className="w-full py-4 px-5 bg-sky-500 hover:bg-sky-600 text-black font-extrabold rounded-xl text-base transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 border-2 border-sky-600"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Begin Shift Inspection Form</span>
              </button>
            )}
          </div>
        </div>

        {/* District & Statutory Guidelines Sidebar Card */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-2.5">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-700" />
              <span>Statutory Compliance Rules</span>
            </h3>
          </div>

          <div className="space-y-3 text-[13px] text-black font-medium">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
              <span>
                <strong className="font-bold">Source Record:</strong> Sirdar submissions are official statutory records and become <span className="text-sky-950 font-bold">immutable</span> upon submission.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
              <span>
                <strong className="font-bold">Deficiency Recording:</strong> Any observation of roof strata, goaf edge, or ventilation deficiency requires location and remedial action.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
              <span>
                <strong className="font-bold">Gas & Water:</strong> Inflammable gas detection (CH₄ / CO) and abnormal water seepage must be promptly documented.
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
              <span>
                <strong className="font-bold">Offline Tolerant:</strong> Work underground safely without internet; submissions sync when connected.
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-xs text-black font-bold">
            District: {assignment.district.description}
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-700" />
              <span>Recent Shift Submissions (Official Records)</span>
            </h3>
            <p className="text-xs text-black font-medium mt-0.5">
              Immutable statutory inspection records submitted for {assignment.district.district_name}
            </p>
          </div>
        </div>

        {inspections.filter((i) => i.status === 'SUBMITTED').length === 0 ? (
          <div className="text-center py-8 text-black text-sm bg-slate-50 rounded-xl border border-slate-300 font-medium">
            No submitted inspections recorded yet for this Sirdar.
          </div>
        ) : (
          <div className="space-y-2.5">
            {inspections
              .filter((i) => i.status === 'SUBMITTED')
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 border-2 border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-start sm:items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-sky-50 border border-sky-300 text-sky-700 flex items-center justify-center shrink-0">
                      <Lock className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-black">
                          {item.inspection_number}
                        </span>
                        <span className="text-xs bg-emerald-50 text-black border border-emerald-300 px-2 py-0.5 rounded font-bold">
                          LOCKED / SUBMITTED
                        </span>
                      </div>
                      <div className="text-xs text-black font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-black" />
                          {item.inspection_date}
                        </span>
                        <span>•</span>
                        <span className="font-semibold">{item.shift_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-black" />
                          {item.persons_under_charge} workmen under charge
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:self-center">
                    {item.deficiency_count > 0 && (
                      <span className="text-xs bg-amber-50 border border-amber-300 text-black px-2 py-0.5 rounded font-bold">
                        {item.deficiency_count} Deficiencies
                      </span>
                    )}
                    {item.gas_detected && (
                      <span className="text-xs bg-rose-50 border border-rose-300 text-rose-900 px-2 py-0.5 rounded font-bold">
                        Gas CH₄
                      </span>
                    )}
                    <button
                      onClick={() => onViewInspection(item.id)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition shadow-2xs"
                    >
                      <Eye className="w-4 h-4 text-sky-700" />
                      <span>View Record</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
