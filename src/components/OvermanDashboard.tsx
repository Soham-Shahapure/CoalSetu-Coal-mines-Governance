import React from 'react';
import {
  User,
  OvermanAssignment,
  InspectionSummary,
  OvermanReportData,
} from '../types/inspection';
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  ArrowRight,
  Shield,
  Layers,
  Calendar,
  Users,
  Eye,
  Lock,
  Flame,
  Droplets,
  HeartPulse,
  Send,
  AlertCircle,
} from 'lucide-react';

interface OvermanDashboardProps {
  user: User;
  assignment: OvermanAssignment;
  receivedInspections: InspectionSummary[];
  todayReport: OvermanReportData | null;
  onOpenReport: () => void;
  onViewSirdarInspection: (id: string) => void;
  onViewOvermanReport: (id: string) => void;
}

export const OvermanDashboard: React.FC<OvermanDashboardProps> = ({
  user,
  assignment,
  receivedInspections,
  todayReport,
  onOpenReport,
  onViewSirdarInspection,
  onViewOvermanReport,
}) => {
  const currentShift = assignment.current_shift;
  const isSubmitted = todayReport?.status === 'SUBMITTED';
  const isReady = todayReport?.status === 'READY_FOR_REVIEW';

  // Count total deficiencies and statutory highlights across received Sirdar records
  const totalDeficiencies = receivedInspections.reduce((sum, i) => sum + i.deficiency_count, 0);
  const gasDetectedCount = receivedInspections.filter((i) => i.gas_detected).length;
  const waterCount = receivedInspections.filter((i) => i.water_seepage).length;
  const accidentCount = receivedInspections.filter((i) => i.accident_occurred).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-black font-sans">
      {/* 1. DGMS Statutory Header Banner */}
      <div className="bg-gradient-to-r from-sky-50 via-sky-50/60 to-white border-2 border-sky-300 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
              <span className="bg-sky-100 text-black text-xs font-bold px-2.5 py-0.5 rounded border border-sky-400 uppercase tracking-wider">
                Statutory Underground Overman
              </span>
              <span className="text-black font-semibold text-xs">
                CMR 2017 Reg 47(7)(d) • G.S.R. 972(E)
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              Hello {user.name}
            </h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-black">
              <span className="flex items-center gap-1 font-bold text-black">
                <MapPin className="w-4 h-4 text-sky-700 shrink-0" />
                {assignment.mine.mine_name}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-sky-950">
                {assignment.district.district_name} ({assignment.district.seam_name})
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-black font-medium">
                Subsidiary: {assignment.mine.subsidiary}
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-sky-300 rounded-xl p-3.5 sm:text-right shrink-0 shadow-xs">
            <div className="text-xs text-black font-bold uppercase tracking-wide">Assigned Area</div>
            <div className="text-base font-extrabold text-black mt-0.5">
              {assignment.district.district_name} Section
            </div>
            <div className="text-[13px] text-sky-950 font-bold mt-0.5">
              {assignment.district.seam_name} • Statutory In-Charge
            </div>
          </div>
        </div>
      </div>

      {/* 2. Current Shift & Overman Report Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="text-lg font-extrabold text-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-700" />
                <span>Underground Overman Daily Inspection Report</span>
              </h3>
              {isSubmitted ? (
                <span className="bg-emerald-50 text-black border-2 border-emerald-500 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  SUBMITTED & SEALED (IMMUTABLE)
                </span>
              ) : isReady ? (
                <span className="bg-amber-50 text-black border-2 border-amber-500 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-700" />
                  READY FOR REVIEW & SIGNING
                </span>
              ) : todayReport ? (
                <span className="bg-sky-50 text-black border-2 border-sky-400 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-700" />
                  DRAFT IN PROGRESS
                </span>
              ) : (
                <span className="bg-slate-100 text-black border border-slate-300 text-xs px-3 py-1 rounded-full font-bold">
                  NOT INITIALIZED
                </span>
              )}
            </div>

            <p className="text-[14px] text-black font-medium leading-relaxed mb-4">
              Under CMR 2017 Regulation 47(7)(d) and G.S.R. 972(E), the Overman must compile and maintain a daily
              statutory inspection report for his assigned district. Submitted Sirdar inspection records are
              deterministically mapped into Sections A through N only after the Overman selects the relevant source records, with complete source audit traceability.
            </p>

            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-3.5 mb-5 space-y-2 text-xs text-black">
              <div className="flex items-center justify-between font-bold border-b border-slate-200 pb-1.5">
                <span>Statutory Report Sections (A – N):</span>
                <span className="text-sky-900 font-extrabold">CMR 47(7)(d) Form G.S.R. 972(E)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="font-semibold">Auto-mapped from Sirdar:</span>
                  <span className="font-mono font-bold">A, B, E, F, I, J, K, M, N</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="font-semibold">Overman Required:</span>
                  <span className="font-mono font-bold">C, D, G, H, L, Parts Inspected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenReport}
              className="flex-1 py-3.5 px-5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 cursor-pointer"
            >
              {isSubmitted ? (
                <>
                  <Eye className="w-4.5 h-4.5" />
                  <span>View Sealed Statutory Overman Report</span>
                </>
              ) : todayReport ? (
                <>
                  <FileText className="w-4.5 h-4.5" />
                  <span>Open & Complete Overman Daily Report</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              ) : (
                <>
                  <FileText className="w-4.5 h-4.5" />
                  <span>Initialize Today's Overman Report</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Shift Summary Card */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-black uppercase tracking-wider">
                Current Shift
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Shift active"></span>
            </div>

            <div className="text-xl font-extrabold text-black">
              {currentShift?.shift_name || 'Morning Shift'}
            </div>
            <div className="text-sm font-bold text-sky-950 mt-0.5">
              {currentShift ? `${currentShift.start_time} – ${currentShift.end_time}` : '06:00 – 14:00'} IST
            </div>

            <div className="mt-4 pt-3 border-t-2 border-slate-100 space-y-2.5 text-xs text-black">
              <div>
                <span className="text-slate-600 font-semibold">Assigned Mine:</span>
                <div className="font-extrabold">{assignment.mine.mine_name}</div>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">District & Panel:</span>
                <div className="font-extrabold">{assignment.district.district_name}</div>
              </div>
              <div>
                <span className="text-slate-600 font-semibold">Coal Seam:</span>
                <div className="font-extrabold">{assignment.district.seam_name}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-slate-100 bg-sky-50/50 p-2.5 rounded-xl border border-sky-200 text-center">
            <span className="text-[11px] font-bold text-sky-950">
              Statutory Source Integrity: Sirdar records are immutable source records.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Received Sirdar Inspections Section */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b-2 border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-black flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-700" />
              <span>Sirdar Inspections Received for Assigned Area</span>
            </h3>
            <p className="text-xs text-black font-medium mt-0.5">
              Statutory shift inspections submitted under CMR 129(8) for {assignment.district.district_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-black border border-sky-300 text-xs font-extrabold px-3 py-1 rounded-full">
              {receivedInspections.length} Submitted Record{receivedInspections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Quick Highlights / Aggregates Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-slate-600 uppercase">Total Deficiencies</div>
            <div className="text-xl font-extrabold text-black mt-1">{totalDeficiencies}</div>
            <div className="text-[11px] text-slate-500 font-medium">Recorded by Sirdars</div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              <span>Gas Observations</span>
            </div>
            <div className="text-xl font-extrabold text-black mt-1">
              {gasDetectedCount > 0 ? (
                <span className="text-amber-700 font-black">{gasDetectedCount} Detected</span>
              ) : (
                '0 Detected'
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Mapped to Section B</div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
              <span>Water Seepage</span>
            </div>
            <div className="text-xl font-extrabold text-black mt-1">
              {waterCount > 0 ? (
                <span className="text-sky-800 font-black">{waterCount} Observed</span>
              ) : (
                '0 Nil'
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Mapped to Section I</div>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 p-3 rounded-xl">
            <div className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
              <span>Accidents / First Aid</span>
            </div>
            <div className="text-xl font-extrabold text-black mt-1">
              {accidentCount > 0 ? (
                <span className="text-rose-700 font-black">{accidentCount} Reported</span>
              ) : (
                '0 Nil'
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Mapped to Section M</div>
          </div>
        </div>

        {/* Inspections Cards List */}
        {receivedInspections.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-black">No Sirdar Inspections Received Yet</div>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Once a Mining Sirdar submits a completed shift inspection for {assignment.district.district_name}, it will appear here and will be available for the Overman to select as source records for a report.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedInspections.map((insp) => (
              <div
                key={insp.id}
                className="bg-white border-2 border-slate-200 hover:border-sky-300 rounded-xl p-4 sm:p-5 transition shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-extrabold text-black">
                      {insp.inspection_number}
                    </span>
                    <span className="bg-emerald-100 text-black border border-emerald-400 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-800" />
                      Statutory Sealed (Immutable)
                    </span>
                    <span className="bg-slate-100 text-black text-[11px] font-bold px-2 py-0.5 rounded border border-slate-300">
                      {insp.shift_name} ({insp.shift_hours})
                    </span>
                  </div>

                  <div className="text-xs text-black font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong className="font-bold">Sirdar In-Charge:</strong> {insp.sirdar_name} ({insp.sirdar_employee_id})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">Date:</strong> {insp.inspection_date}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">Persons Under Charge:</strong> {insp.persons_under_charge}
                    </span>
                  </div>

                  {/* Highlights pills */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] bg-slate-100 text-black font-semibold px-2 py-0.5 rounded border border-slate-200">
                      {insp.period_count} Inspection Periods
                    </span>
                    {insp.deficiency_count > 0 ? (
                      <span className="text-[11px] bg-amber-100 text-black font-bold px-2 py-0.5 rounded border border-amber-300">
                        {insp.deficiency_count} Deficiencies Recorded
                      </span>
                    ) : (
                      <span className="text-[11px] bg-emerald-50 text-black font-semibold px-2 py-0.5 rounded border border-emerald-200">
                        Zero Deficiencies
                      </span>
                    )}
                    {insp.gas_detected && (
                      <span className="text-[11px] bg-rose-100 text-black font-bold px-2 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-rose-700" />
                        Inflammable Gas Tested
                      </span>
                    )}
                    {insp.water_seepage && (
                      <span className="text-[11px] bg-sky-100 text-black font-bold px-2 py-0.5 rounded border border-sky-300">
                        Water Seepage Noted
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => onViewSirdarInspection(insp.id)}
                    className="w-full md:w-auto py-2.5 px-4 bg-white hover:bg-sky-50 text-black font-bold text-xs rounded-xl border-2 border-slate-300 hover:border-sky-500 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-4 h-4 text-sky-700" />
                    <span>View Original Sirdar Record</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Statutory Compliance Rules Note */}
      <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-5 shadow-xs">
        <h4 className="text-sm font-extrabold text-black mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-700" />
          <span>Statutory Data Integrity Principles (Coal Mines Regulations 2017)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-black font-medium leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0"></span>
            <span>
              <strong className="font-bold">Immutable Source Record:</strong> Sirdar inspection records cannot be modified, edited, or overwritten by the Overman. They remain immutable digital statutory documents under CMR 129(8).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0"></span>
            <span>
              <strong className="font-bold">Deterministic Mapping:</strong> Deficiencies in safety materials, ventilation, roof support, gas, danger, water, and accidents are deterministically routed to statutory Overman Sections A through N.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0"></span>
            <span>
              <strong className="font-bold">Source Traceability:</strong> Every auto-populated entry in the Overman report retains its source inspection ID, Sirdar name, employee ID, and time stamp, with a direct link to view the source record.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0"></span>
            <span>
              <strong className="font-bold">Overman Specific Entries:</strong> Sections C (Stone Dusting), D (Haulage), G (Hand Plan), H (Faces within 10m), and L (Successor Handover) must be directly inspected and entered by the Overman.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
