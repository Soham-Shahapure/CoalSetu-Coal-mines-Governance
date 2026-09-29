import React, { useState } from 'react';
import {
  InspectionData,
  SirdarAssignment,
  ObservationCategory,
} from '../../types/inspection';
import {
  ShieldCheck,
  CheckCircle,
  AlertOctagon,
  Lock,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  FileCheck,
  Send,
} from 'lucide-react';

interface Step7Props {
  formData: InspectionData;
  assignment: SirdarAssignment;
  onGoToStep: (step: number) => void;
  onSubmitInspection: () => Promise<void>;
  submitting: boolean;
  submitError: string | null;
}

export const Step7Review: React.FC<Step7Props> = ({
  formData,
  assignment,
  onGoToStep,
  onSubmitInspection,
  submitting,
  submitError,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Validate mandatory statutory fields
  const validationErrors: { step: number; message: string }[] = [];

  if (!formData.shift_id) {
    validationErrors.push({ step: 1, message: 'Shift must be selected.' });
  }

  const validPeriods = (formData.inspection_periods || []).filter(
    (p) => p.start_time && p.end_time
  );
  if (validPeriods.length === 0) {
    validationErrors.push({
      step: 2,
      message: 'At least one complete statutory inspection period (Start & End Time) must be recorded.',
    });
  } else {
    validPeriods.forEach((p) => {
      if (p.start_time >= p.end_time) {
        validationErrors.push({
          step: 2,
          message: `In Period ${p.period_number}, end time (${p.end_time}) must be after start time (${p.start_time}).`,
        });
      }
    });
  }

  if (formData.persons_under_charge === undefined || formData.persons_under_charge < 0) {
    validationErrors.push({ step: 3, message: 'Number of persons under charge must be recorded.' });
  }

  // Deficiencies conditional validation
  if (formData.deficiencies) {
    const cats: ObservationCategory[] = ['VENTILATION', 'STRATA', 'GOAF_EDGE', 'FENCING', 'SANITATION'];
    cats.forEach((cat) => {
      const obs = formData.deficiencies[cat];
      if (obs && obs.has_deficiency) {
        if (!obs.location_text?.trim() || !obs.description?.trim() || !obs.remedial_action?.trim()) {
          validationErrors.push({
            step: 4,
            message: `Category ${cat} is marked as deficiency: Location, description, and remedial action are mandatory.`,
          });
        }
      }
    });
  }

  // Gas conditional validation
  if (formData.gas_observation?.detected) {
    if (!formData.gas_observation.location?.trim() || !formData.gas_observation.gas_percentage?.trim() || !formData.gas_observation.action_taken?.trim()) {
      validationErrors.push({
        step: 6,
        message: 'Inflammable gas detected: Location, percentage, and action taken are required.',
      });
    }
  }

  // Water conditional validation
  if (formData.water_observation?.observed) {
    if (!formData.water_observation.location?.trim() || !formData.water_observation.details?.trim() || !formData.water_observation.action_taken?.trim()) {
      validationErrors.push({
        step: 6,
        message: 'Abnormal water seepage: Location, details, and action taken are required.',
      });
    }
  }

  // Accident conditional validation
  if (formData.accident_observation?.occurred) {
    if (!formData.accident_observation.cause_details?.trim() || !formData.accident_observation.first_aid_given_by?.trim()) {
      validationErrors.push({
        step: 6,
        message: 'Accident occurred: Cause/details and first aid provider name are required.',
      });
    }
  }

  const isValid = validationErrors.length === 0;

  const currentShift = assignment.available_shifts.find((s) => s.id === formData.shift_id);
  const deficienciesList = Object.entries(formData.deficiencies || {})
    .filter(([_, obs]) => obs.has_deficiency)
    .map(([_, obs]) => obs);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-sky-600" />
            <span>Stage 7 — Statutory Review & Immutable Submission</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review the complete statutory daily inspection report prior to formal submission under G.S.R. 977(E).
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-sky-600" />
          <span>Statutory Source Record Principle</span>
        </div>
      </div>

      {/* Validation Banner if Errors Exist */}
      {!isValid && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Validation Requirements Unmet — Please address the following items:</span>
          </div>
          <ul className="space-y-1.5 text-xs text-rose-700 pl-6 list-disc">
            {validationErrors.map((err, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span>{err.message}</span>
                <button
                  type="button"
                  onClick={() => onGoToStep(err.step)}
                  className="text-[11px] underline font-semibold text-rose-800 hover:text-rose-900 shrink-0"
                >
                  Go to Stage {err.step}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statutory Header Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Report Header & Sirdar Assignment
          </span>
          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            Edit Shift
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Mine / Colliery:</span>
            <span className="font-semibold text-slate-800">{assignment.mine.mine_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">District & Seam:</span>
            <span className="font-semibold text-sky-700">
              {assignment.district.district_name} ({assignment.district.seam_name})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Reporting Sirdar:</span>
            <span className="font-semibold text-slate-800">
              {assignment.user.name} ({assignment.user.employee_id})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Date & Shift:</span>
            <span className="font-semibold text-slate-800">
              {formData.inspection_date} • {currentShift?.shift_name || 'Shift 1'} (
              {currentShift ? `${currentShift.start_time}–${currentShift.end_time}` : ''})
            </span>
          </div>
        </div>

        {/* Location Hierarchy representation */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-wrap items-center gap-2">
          <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
          <span className="text-slate-500 font-medium">Mine Location Hierarchy:</span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">
            {assignment.mine.mine_name}
          </span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-700 font-mono font-semibold">
            {assignment.district.district_name}
          </span>
          <span className="text-slate-400">→</span>
          <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-mono">
            {assignment.district.seam_name}
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-slate-500 italic">
            Underground Working Panels & Headings (GPS Coordinates: Null — Underground Hierarchy Enforced)
          </span>
        </div>
      </div>

      {/* Section 1 & 2: Inspection Periods and Personnel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Inspection Periods */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Examination Periods (Sec. 1)</span>
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            {validPeriods.map((p) => (
              <div
                key={p.period_number}
                className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200"
              >
                <span className="text-slate-700">Period {p.period_number}</span>
                <span className="font-mono text-sky-700 font-semibold">
                  {p.start_time} – {p.end_time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Personnel Under Charge */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Persons Under Charge (Sec. 2)</span>
            </span>
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="bg-sky-50/60 p-3 rounded-lg border border-sky-100 flex items-center justify-between">
            <span className="text-xs text-slate-700 font-medium">Declared District Crew:</span>
            <span className="text-lg font-bold text-sky-700 font-mono">
              {formData.persons_under_charge} workmen
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Deficiencies Observed Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>Deficiencies Observed (Sec. 3)</span>
          </span>
          <button
            type="button"
            onClick={() => onGoToStep(4)}
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
          >
            Edit Deficiencies
          </button>
        </div>

        {deficienciesList.length === 0 ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              All 5 statutory areas (Ventilation, Strata roof & sides, Goaf edges, Fencing, Sanitation) recorded as <strong>Satisfactory</strong>.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {deficienciesList.map((d) => (
              <div
                key={d.category}
                className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">{d.category}</span>
                  <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                    Deficiency Recorded
                  </span>
                </div>
                <div className="text-slate-700">
                  <strong className="text-slate-900">Place:</strong> {d.location_text}
                </div>
                <div className="text-slate-700">
                  <strong className="text-slate-900">Deficiency:</strong> {d.description}
                </div>
                <div className="text-emerald-800">
                  <strong className="text-slate-900">Remedial Action:</strong> {d.remedial_action}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety & Environmental Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Safety Instructions & Materials */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">Safety Checklist Summary</span>
            <button
              type="button"
              onClick={() => onGoToStep(5)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1 text-slate-600">
            <div>
              • Instructions: <strong className="text-slate-800">{formData.safety_instructions?.length || 0} given</strong>
            </div>
            <div>
              • Person Ordered Out:{' '}
              <strong className="text-slate-800">{formData.person_ordered_out?.occurred ? 'Yes (Reported)' : 'None'}</strong>
            </div>
            <div>
              • Inexperienced Person:{' '}
              <strong className="text-slate-800">{formData.inexperienced_person?.present ? 'Yes (Under supervision)' : 'None'}</strong>
            </div>
            <div>
              • Second Egress Travelled:{' '}
              <strong className="text-slate-800">{formData.egress_record?.travelled ? 'Yes' : 'No'}</strong>
            </div>
            <div>
              • Support Withdrawn:{' '}
              <strong className="text-slate-800">
                {formData.support_withdrawals_occurred
                  ? `${formData.support_withdrawals?.length || 0} operations logged`
                  : 'No'}
              </strong>
            </div>
          </div>
        </div>

        {/* Environmental & Incidents */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-900">Gas, Water & Incidents</span>
            <button
              type="button"
              onClick={() => onGoToStep(6)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-1 text-slate-600">
            <div className="flex items-center gap-1.5">
              <span>• Gas (CH₄ / CO):</span>
              {formData.gas_observation?.detected ? (
                <span className="text-rose-600 font-bold">
                  Detected ({formData.gas_observation.gas_percentage}) at {formData.gas_observation.location}
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">Nil / Below threshold</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>• Water Seepage:</span>
              {formData.water_observation?.observed ? (
                <span className="text-sky-700 font-bold">
                  Abnormal at {formData.water_observation.location}
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold">Normal</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span>• Accidents:</span>
              {formData.accident_observation?.occurred ? (
                <span className="text-rose-600 font-bold">Accident Recorded</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Nil</span>
              )}
            </div>
            <div>
              • Handover Conference:{' '}
              <strong className="text-slate-800">{formData.successor_conference?.conducted ? 'Conducted' : 'Not conducted'}</strong>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Submission Action Bar */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onGoToStep(6)}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={!isValid || submitting}
          className="w-full sm:w-auto px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md shadow-sky-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Submitting & Sealing...' : 'Submit Statutory Inspection (G.S.R. 977(E))'}</span>
        </button>
      </div>

      {/* CONFIRMATION MODAL (Section 32) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Submit & Seal Sirdar Statutory Inspection?
              </h3>
              <p className="text-xs text-sky-700 font-medium mt-1">
                Under Coal Mines Regulations (CMR) 129(8) and G.S.R. 977(E):
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
              <p>
                <strong className="text-slate-900">Statutory Immutability:</strong> Once submitted, this inspection becomes a permanent, tamper-evident source record.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                <li>It <strong>cannot be edited</strong> by the Sirdar or any other role.</li>
                <li>It <strong>cannot be deleted</strong>.</li>
                <li>It will receive an authoritative statutory timestamp and unique Inspection ID.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel / Return to Review
              </button>

              <button
                type="button"
                onClick={async () => {
                  setShowConfirmModal(false);
                  await onSubmitInspection();
                }}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white transition flex items-center gap-1.5 shadow-md shadow-sky-200"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm & Submit Statutory Report</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
