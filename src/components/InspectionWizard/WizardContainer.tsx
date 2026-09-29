import React, { useState, useEffect } from 'react';
import {
  InspectionData,
  SirdarAssignment,
  ObservationCategory,
  SafetyMaterialType,
} from '../../types/inspection';
import { Step1ShiftDetails } from './Step1ShiftDetails';
import { Step2InspectionPeriods } from './Step2InspectionPeriods';
import { Step3Personnel } from './Step3Personnel';
import { Step4Deficiencies } from './Step4Deficiencies';
import { Step5SafetyConditions } from './Step5SafetyConditions';
import { Step6Incidents } from './Step6Incidents';
import { Step7Review } from './Step7Review';
import { api } from '../../services/api';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  FileCheck,
  Shield,
  Lock,
  Layers,
} from 'lucide-react';

interface WizardContainerProps {
  assignment: SirdarAssignment;
  initialData?: InspectionData | null;
  onSubmitted: (submittedRecord: InspectionData) => void;
  onCancel: () => void;
}

const STEPS = [
  { step: 1, label: 'Shift Details' },
  { step: 2, label: 'Inspection Periods' },
  { step: 3, label: 'Personnel' },
  { step: 4, label: 'Deficiencies' },
  { step: 5, label: 'Safety & Materials' },
  { step: 6, label: 'Incidents & Gas' },
  { step: 7, label: 'Review & Submit' },
];

export const WizardContainer: React.FC<WizardContainerProps> = ({
  assignment,
  initialData,
  onSubmitted,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [draftSavedMsg, setDraftSavedMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<InspectionData | null>(null);

  // Default empty form structure
  const createInitialForm = (): InspectionData => {
    const todayStr = new Date().toISOString().split('T')[0];
    const defaultShift = assignment.available_shifts[0];

    const defRecord: Record<ObservationCategory, any> = {
      VENTILATION: { category: 'VENTILATION', has_deficiency: false },
      STRATA: { category: 'STRATA', has_deficiency: false },
      GOAF_EDGE: { category: 'GOAF_EDGE', has_deficiency: false },
      FENCING: { category: 'FENCING', has_deficiency: false },
      SANITATION: { category: 'SANITATION', has_deficiency: false },
    };

    const matRecord: Record<SafetyMaterialType, any> = {
      TIMBER: { material_type: 'TIMBER', status: 'ADEQUATE' },
      BUNTON: { material_type: 'BUNTON', status: 'ADEQUATE' },
      LADDER: { material_type: 'LADDER', status: 'AVAILABLE' },
      CO_DETECTION: { material_type: 'CO_DETECTION', status: 'AVAILABLE' },
      OTHER: { material_type: 'OTHER', status: 'ADEQUATE' },
    };

    return {
      sirdar_id: assignment.user.id,
      mine_id: assignment.mine.id,
      district_id: assignment.district.id,
      shift_id: defaultShift?.id || '',
      inspection_date: todayStr,
      persons_under_charge: 24, // Typical crew size for testing
      inspection_periods: [
        { period_number: 1, start_time: '08:30', end_time: '10:30' },
        { period_number: 2, start_time: '11:00', end_time: '13:00' },
        { period_number: 3, start_time: '14:00', end_time: '15:30' },
      ],
      deficiencies: defRecord,
      safety_instructions: [
        { instruction: 'Use designated travelling roadway; keep clear of conveyor haulage.', persons_instructed: 12 },
      ],
      person_ordered_out: { occurred: false },
      inexperienced_person: { present: false },
      safety_materials: matRecord,
      egress_record: { travelled: false },
      support_withdrawals_occurred: false,
      support_withdrawals: [],
      dangerous_places: { observed: false, reported_by_other: false },
      dangerous_operations: { occurred: false },
      inactive_places: { fenced: false },
      gas_observation: { detected: false },
      water_observation: { observed: false },
      accident_observation: { occurred: false },
      successor_conference: { conducted: false },
      other_remarks: '',
      status: 'DRAFT',
      created_at: new Date().toISOString(),
    };
  };

  const [formData, setFormData] = useState<InspectionData>(initialData || createInitialForm());

  const handleUpdate = (updates: Partial<InspectionData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setDraftSavedMsg(null);
    try {
      const saved = await api.saveDraft(formData);
      if (saved.id && !formData.id) {
        setFormData((prev) => ({ ...prev, id: saved.id }));
      }
      setDraftSavedMsg('Draft saved locally & synced to server.');
      setTimeout(() => setDraftSavedMsg(null), 3000);
    } catch (err: any) {
      setDraftSavedMsg('Draft preserved in local storage.');
      setTimeout(() => setDraftSavedMsg(null), 3000);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await api.submitInspection(formData);
      setSubmittedRecord(result);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission failed. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 7) {
      // Auto-save draft on step navigation
      handleSaveDraft();
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // SUCCESS SCREEN AFTER SUBMISSION
  if (submittedRecord) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300 text-black">
        <div className="bg-white border-2 border-emerald-400 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-emerald-800 flex items-center justify-center mx-auto shadow-md shadow-emerald-100">
            <CheckCircle className="w-9 h-9 text-emerald-800" />
          </div>

          <div>
            <span className="bg-emerald-100 text-black border-2 border-emerald-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Statutory Record Sealed & Submitted
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-black mt-2">
              Shift Inspection Successfully Submitted
            </h2>
            <p className="text-sm text-black font-medium mt-1 max-w-md mx-auto">
              The daily report has been permanently committed under Coal Mines Regulations (CMR) 129(8) and G.S.R. 977(E).
            </p>
          </div>

          {/* Statutory Certificate Box */}
          <div className="bg-slate-50 rounded-xl p-5 border-2 border-slate-300 text-left space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-black font-bold">Statutory Inspection ID:</span>
              <span className="text-base font-extrabold text-black">
                {submittedRecord.inspection_number}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-black font-bold">Submission Timestamp:</span>
              <span className="text-black font-semibold">
                {submittedRecord.submitted_at
                  ? new Date(submittedRecord.submitted_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    }) + ' IST'
                  : new Date().toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-black font-bold">Statutory Status:</span>
              <span className="text-black font-extrabold flex items-center gap-1">
                <Lock className="w-4 h-4 text-emerald-700" />
                IMMUTABLE SOURCE RECORD
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black font-bold">Reporting Sirdar:</span>
              <span className="text-black font-extrabold">
                {assignment.user.name} ({assignment.user.employee_id})
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-lg text-xs text-black font-medium text-left flex items-start gap-2">
            <Shield className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              <strong className="font-bold">Data Integrity Guarantee:</strong> In accordance with statutory governance requirements, this record is locked. It cannot be altered or overwritten by any user or administrator.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => onSubmitted(submittedRecord)}
              className="px-6 py-3.5 bg-sky-500 hover:bg-sky-600 text-black font-extrabold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 border-2 border-sky-600"
            >
              <FileCheck className="w-4.5 h-4.5" />
              <span>Open Locked Statutory Record (Read-Only)</span>
            </button>

            <button
              onClick={onCancel}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-black font-bold rounded-xl text-sm transition flex items-center justify-center border-2 border-slate-300"
            >
              Return to Sirdar Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 text-black">
      {/* Top Header & Save Draft Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-black uppercase tracking-widest bg-sky-100 px-2.5 py-0.5 rounded border border-sky-300">
              G.S.R. 977(E) FORM
            </span>
            <span className="text-xs text-black font-semibold">
              Underground Shift Inspection
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-black mt-1">
            {STEPS[currentStep - 1].label} (Stage {currentStep} of 7)
          </h2>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {draftSavedMsg && (
            <span className="text-xs text-emerald-800 font-bold animate-pulse flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              {draftSavedMsg}
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-black text-sm font-bold rounded-xl border-2 border-slate-300 flex items-center gap-1.5 transition disabled:opacity-50"
            title="Save draft to local storage and backend"
          >
            <Save className="w-4 h-4 text-sky-700" />
            <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 text-black hover:text-rose-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Progressive Step Progress Indicator */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 overflow-x-auto scrollbar-none shadow-xs">
        <div className="flex items-center min-w-[620px] justify-between relative">
          {STEPS.map((s, idx) => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <React.Fragment key={s.step}>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveDraft();
                    setCurrentStep(s.step);
                  }}
                  className="flex flex-col items-center group focus:outline-none cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition ${
                      isCurrent
                        ? 'bg-sky-500 text-black border-2 border-sky-600 ring-4 ring-sky-100 shadow-sm'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-black border border-slate-300 group-hover:bg-slate-200'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4.5 h-4.5" /> : s.step}
                  </div>
                  <span
                    className={`text-xs mt-1.5 font-bold whitespace-nowrap ${
                      isCurrent
                        ? 'text-sky-950 font-extrabold'
                        : isCompleted
                        ? 'text-black'
                        : 'text-slate-600'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition ${
                      s.step < currentStep ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Step Body */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-7 shadow-xs">
        {currentStep === 1 && (
          <Step1ShiftDetails
            formData={formData}
            assignment={assignment}
            onChange={handleUpdate}
          />
        )}
        {currentStep === 2 && (
          <Step2InspectionPeriods
            formData={formData}
            onChange={handleUpdate}
          />
        )}
        {currentStep === 3 && (
          <Step3Personnel
            formData={formData}
            onChange={handleUpdate}
          />
        )}
        {currentStep === 4 && (
          <Step4Deficiencies
            formData={formData}
            onChange={handleUpdate}
          />
        )}
        {currentStep === 5 && (
          <Step5SafetyConditions
            formData={formData}
            onChange={handleUpdate}
          />
        )}
        {currentStep === 6 && (
          <Step6Incidents
            formData={formData}
            onChange={handleUpdate}
          />
        )}
        {currentStep === 7 && (
          <Step7Review
            formData={formData}
            assignment={assignment}
            onGoToStep={(st) => setCurrentStep(st)}
            onSubmitInspection={handleSubmit}
            submitting={submitting}
            submitError={submitError}
          />
        )}
      </div>

      {/* Navigation Footer Controls */}
      {currentStep < 7 && (
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-5 py-3 bg-white hover:bg-slate-100 text-black rounded-xl text-sm font-bold flex items-center gap-2 border-2 border-slate-300 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            <span>Previous Stage</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-black rounded-xl text-sm font-extrabold flex items-center gap-2 transition shadow-md shadow-sky-500/20 border-2 border-sky-600"
          >
            <span>Save & Proceed to Stage {currentStep + 1}</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        </div>
      )}
    </div>
  );
};
