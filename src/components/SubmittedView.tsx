import React, { useState } from 'react';
import { InspectionData } from '../types/inspection';
import {
  Lock,
  ArrowLeft,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Users,
  HardHat,
  Wind,
  Layers,
  Flame,
  Droplets,
  Ambulance,
  MessageSquare,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface SubmittedViewProps {
  inspection: InspectionData & { mine?: any; district?: any; shift?: any; sirdar?: any };
  onBack: () => void;
}

export const SubmittedView: React.FC<SubmittedViewProps> = ({ inspection, onBack }) => {
  const [attemptedEdit, setAttemptedEdit] = useState<boolean>(false);

  const mineName = inspection.mine?.mine_name || 'Jhanjhra Underground Mine';
  const districtName = inspection.district?.district_name || 'District 2';
  const seamName = inspection.district?.seam_name || 'Seam A';
  const sirdarName = inspection.sirdar?.name || 'Rajesh Kumar';
  const sirdarEmpId = inspection.sirdar?.employee_id || 'S001';
  const shiftName = inspection.shift?.shift_name || 'Shift 1 (Morning)';
  const shiftHours = inspection.shift
    ? `${inspection.shift.start_time} – ${inspection.shift.end_time}`
    : '08:00 – 16:00';

  const handlePrint = () => {
    window.print();
  };

  const handleAttemptEdit = () => {
    setAttemptedEdit(true);
    setTimeout(() => setAttemptedEdit(false), 5000);
  };

  const deficiencies = inspection.deficiencies || {};
  const defKeys = Object.keys(deficiencies) as (keyof typeof deficiencies)[];

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <button
          onClick={onBack}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition self-start sm:self-auto font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </button>

        <div className="flex items-center space-x-2">
          {/* Attempt Edit Button to demonstrate statutory immutability */}
          <button
            onClick={handleAttemptEdit}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition"
            title="Demonstrate immutable data protection"
          >
            <Lock className="w-3.5 h-3.5 text-sky-600" />
            <span>Edit Record</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold rounded-xl border border-sky-200 flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600" />
            <span>Print Form G.S.R. 977(E)</span>
          </button>
        </div>
      </div>

      {/* Immutability Violation Warning Notice when user clicks Edit */}
      {attemptedEdit && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs space-y-1 animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>ACTION PROHIBITED: Statutory Record is Immutable</span>
          </div>
          <p className="text-[11px] text-amber-800/90 leading-relaxed">
            Under Coal Mines Regulations (CMR) 129(8) and central statutory governance, once a Mining Sirdar submits the daily shift inspection report, it becomes a permanent source record. Neither the Sirdar, Overman, nor Manager can modify or delete this authoritative document.
          </p>
        </div>
      )}

      {/* Official Form Document Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm print:bg-white print:text-black print:border-none print:shadow-none">
        {/* Statutory Official Header */}
        <div className="border-b-2 border-slate-200 pb-5 text-center space-y-1">
          <div className="text-[10px] font-bold text-sky-700 uppercase tracking-widest bg-sky-50 inline-block px-3 py-0.5 rounded border border-sky-200">
            FORM G.S.R. 977(E) • REGULATION 129(8)
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            DAILY REPORT OF UNDERGROUND WORKINGS EXAMINATION
          </h2>
          <p className="text-xs text-slate-500">
            MINING SIRDAR'S STATUTORY SHIFT INSPECTION RECORD
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              STATUS: SUBMITTED & SEALED
            </span>
            <span className="text-xs font-mono text-sky-700 font-bold">
              {inspection.inspection_number}
            </span>
          </div>
        </div>

        {/* Header Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">Name of Mine:</span>
            <span className="text-slate-900 font-bold">{mineName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">District, Seam & Area:</span>
            <span className="text-sky-700 font-bold">{districtName} ({seamName})</span>
            <span className="text-slate-700 block text-[10px] font-semibold">Area: Galleryify Section</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Shift & Hours:</span>
            <span className="text-slate-900 font-bold">{shiftName} ({shiftHours})</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Date of Inspection:</span>
            <span className="text-slate-900 font-bold">{inspection.inspection_date}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Sirdar Name:</span>
            <span className="text-slate-900 font-bold">{sirdarName}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Employee ID / Cert:</span>
            <span className="text-slate-700 font-bold">{sirdarEmpId}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Persons Under Charge:</span>
            <span className="text-sky-700 font-bold">{inspection.persons_under_charge} workmen</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Submitted At:</span>
            <span className="text-slate-700">
              {inspection.submitted_at
                ? new Date(inspection.submitted_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' IST'
                : '15:50 IST'}
            </span>
          </div>
        </div>

        {/* Section 1: District Examination Periods */}
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Section 1 — District Examination Periods
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(inspection.inspection_periods || []).map((p) => (
              <div
                key={p.period_number}
                className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs flex justify-between items-center"
              >
                <span className="text-slate-500">Period {p.period_number}:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {p.start_time} to {p.end_time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Deficiencies Observed (5 Statutory Areas) */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <h3 className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Section 3 — Deficiencies Observed in District
          </h3>
          <div className="space-y-2">
            {defKeys.map((k) => {
              const item = deficiencies[k];
              const hasDef = item?.has_deficiency;
              return (
                <div
                  key={k}
                  className={`p-3 rounded-lg border text-xs ${
                    hasDef
                      ? 'bg-amber-50 border-amber-300 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="text-slate-900">{k}</span>
                    {hasDef ? (
                      <span className="text-amber-800 text-[10px] bg-amber-100 px-2 py-0.5 rounded border border-amber-300 font-bold">
                        Deficiency Observed
                      </span>
                    ) : (
                      <span className="text-emerald-700 text-[10px] font-medium">Satisfactory</span>
                    )}
                  </div>
                  {hasDef && (
                    <div className="space-y-1 text-[11px] mt-2 pt-2 border-t border-amber-200 text-slate-700">
                      <div>
                        <strong className="text-slate-500">Location:</strong> {item.location_text}
                      </div>
                      <div>
                        <strong className="text-slate-500">Observation:</strong> {item.description}
                      </div>
                      <div className="text-emerald-800">
                        <strong className="text-slate-500">Remedial Action:</strong> {item.remedial_action}
                      </div>
                      {item.remarks && (
                        <div>
                          <strong className="text-slate-500">Remarks:</strong> {item.remarks}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4 & 5 & 6: Personnel & Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs">
          {/* Section 4 */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
            <h4 className="font-bold text-sky-800">
              Section 4 — Safety Instructions Given
            </h4>
            {(inspection.safety_instructions || []).length === 0 ? (
              <p className="text-slate-400 text-[11px]">No formal instructions logged.</p>
            ) : (
              <div className="space-y-1.5">
                {inspection.safety_instructions.map((si, i) => (
                  <div key={i} className="text-[11px] text-slate-700">
                    • "{si.instruction}" —{' '}
                    <span className="font-bold text-sky-700">
                      {si.persons_instructed} persons instructed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5 & 6 */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg space-y-2">
            <h4 className="font-bold text-sky-800">
              Section 5 & 6 — Crew Compliance
            </h4>
            <div className="text-[11px] space-y-1 text-slate-700">
              <div>
                <strong>Person Ordered Out (Sec. 5):</strong>{' '}
                {inspection.person_ordered_out?.occurred ? (
                  <span className="text-rose-600 font-semibold">
                    Yes — {inspection.person_ordered_out.person_name} (Assigned:{' '}
                    {inspection.person_ordered_out.assigned_place}, Found:{' '}
                    {inspection.person_ordered_out.actual_place})
                  </span>
                ) : (
                  'None'
                )}
              </div>
              <div>
                <strong>Inexperienced Person (Sec. 6):</strong>{' '}
                {inspection.inexperienced_person?.present ? (
                  <span>
                    Yes — {inspection.inexperienced_person.person_name} (Supervised by:{' '}
                    {inspection.inexperienced_person.supervisor_name})
                  </span>
                ) : (
                  'None'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Safety Materials */}
        <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
          <h3 className="font-bold text-sky-700 uppercase tracking-wider">
            Section 7 — Safety Materials Inspection
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
            {Object.entries(inspection.safety_materials || {}).map(([type, item]: any) => (
              <div key={type} className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="font-bold text-slate-700">{type}</div>
                <div
                  className={`mt-1 font-semibold ${
                    item.status === 'DEFICIENT'
                      ? 'text-amber-700'
                      : item.status === 'NOT_APPLICABLE'
                      ? 'text-slate-400'
                      : 'text-emerald-700'
                  }`}
                >
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8 & 9 & 10 & 11 & 12 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs">
          <div className="space-y-1 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <strong>Second Egress (Sec. 8):</strong>{' '}
              {inspection.egress_record?.travelled
                ? `Travelled on ${inspection.egress_record.travel_date}`
                : 'Not travelled this shift'}
            </div>
            <div>
              <strong>Support Withdrawn (Sec. 9):</strong>{' '}
              {inspection.support_withdrawals_occurred
                ? `${inspection.support_withdrawals?.length || 0} operations recorded`
                : 'None'}
            </div>
          </div>

          <div className="space-y-1 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <strong>Dangerous Places (Sec. 10):</strong>{' '}
              {inspection.dangerous_places?.observed ? (
                <span className="text-amber-700 font-semibold">
                  Observed at {inspection.dangerous_places.location}
                </span>
              ) : (
                'None'
              )}
            </div>
            <div>
              <strong>Inactive Places Fenced (Sec. 12):</strong>{' '}
              {inspection.inactive_places?.fenced ? 'Fenced off' : 'None active'}
            </div>
          </div>
        </div>

        {/* Section 13, 14, 15: Gas, Water, Accident */}
        <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
          <h3 className="font-bold text-sky-700 uppercase tracking-wider">
            Sections 13, 14 & 15 — Gas, Water & Accident Records
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Gas */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Inflammable Gas</span>
              </span>
              <p className="text-[11px] text-slate-700 mt-1">
                {inspection.gas_observation?.detected ? (
                  <span className="text-rose-600 font-bold">
                    Detected ({inspection.gas_observation.gas_percentage}) at {inspection.gas_observation.location}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">None detected</span>
                )}
              </p>
            </div>

            {/* Water */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>Water Seepage</span>
              </span>
              <p className="text-[11px] text-slate-700 mt-1">
                {inspection.water_observation?.observed ? (
                  <span className="text-sky-700 font-bold">
                    Abnormal at {inspection.water_observation.location}: {inspection.water_observation.details}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Normal drainage</span>
                )}
              </p>
            </div>

            {/* Accident */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Ambulance className="w-3.5 h-3.5 text-rose-500" />
                <span>Accidents</span>
              </span>
              <p className="text-[11px] text-slate-700 mt-1">
                {inspection.accident_observation?.occurred ? (
                  <span className="text-rose-600 font-bold">
                    Reported: {inspection.accident_observation.cause_details}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">Nil</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Section 16 & 17: Successor Conference & Remarks */}
        <div className="border-t border-slate-200 pt-4 space-y-3 text-xs">
          <div>
            <h4 className="font-bold text-slate-900">Section 16 — Conference with Successor</h4>
            <p className="text-slate-600 text-[11px] mt-0.5">
              {inspection.successor_conference?.conducted
                ? `Conducted with ${inspection.successor_conference.conveyed_to_person}: "${inspection.successor_conference.information_conveyed}"`
                : 'No formal conference recorded.'}
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900">Section 17 — Other Remarks / Descriptive Report</h4>
            <p className="text-slate-600 text-[11px] mt-0.5 italic">
              {inspection.other_remarks || 'District conditions satisfactory throughout the shift.'}
            </p>
          </div>
        </div>

        {/* Statutory Submission & Immutable Seal */}
        <div className="border-t-2 border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>IMMUTABLE STATUTORY SIRDAR SOURCE RECORD</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Device: {inspection.device_info || 'Rugged Underground IS Terminal'}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Timestamp: {inspection.submitted_at || inspection.created_at}
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6">
            <div className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider">
              {sirdarName}
            </div>
            <div className="text-[11px] text-sky-700 font-medium">
              Statutory Mining Sirdar In-Charge
            </div>
            <div className="text-[10px] text-slate-500">
              Govt. Sirdar Certificate #{sirdarEmpId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
