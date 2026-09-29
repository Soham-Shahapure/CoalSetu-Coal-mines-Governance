import React, { useState } from 'react';
import {
  User,
  OvermanReportData,
  OvermanSectionCode,
  OvermanReportSection,
  OvermanReportEntry,
  InspectionSummary,
  STATUTORY_SECTIONS,
} from '../types/inspection';
import {
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  Lock,
  ArrowLeft,
  Shield,
  Layers,
  Calendar,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Flame,
  AlertTriangle,
  Award,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface OvermanReportEditorProps {
  user: User;
  report: OvermanReportData;
  onSaveDraft: (updated: OvermanReportData) => Promise<void>;
  onSubmitReport: (updated: OvermanReportData) => Promise<void>;
  availableSirdarInspections: InspectionSummary[];
  onSourceSelectionChange: (selectedSourceInspectionIds: string[]) => Promise<OvermanReportData | null>;
  onBack: () => void;
  onViewSourceRecord: (inspectionId: string) => void;
  saving: boolean;
  submitting: boolean;
  updatingSourceSelection: boolean;
}

export const OvermanReportEditor: React.FC<OvermanReportEditorProps> = ({
  user,
  report,
  onSaveDraft,
  onSubmitReport,
  availableSirdarInspections,
  onSourceSelectionChange,
  onBack,
  onViewSourceRecord,
  saving,
  submitting,
  updatingSourceSelection,
}) => {
  const isSubmitted = report.status === 'SUBMITTED';

  const [partsInspected, setPartsInspected] = useState<string>(
    report.parts_of_mine_inspected || ''
  );
  const [activeSection, setActiveSection] = useState<OvermanSectionCode>('A');
  const [sectionsData, setSectionsData] = useState<Record<OvermanSectionCode, OvermanReportSection>>(
    report.sections
  );
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [statutoryDeclarationAgreed, setStatutoryDeclarationAgreed] = useState<boolean>(false);
  const [showSourceSelector, setShowSourceSelector] = useState<boolean>(false);
  const [sourceSelection, setSourceSelection] = useState<string[]>(
    report.selected_source_inspection_ids || report.assembled_from_inspection_ids || []
  );
  const [sourceSelectionError, setSourceSelectionError] = useState<string | null>(null);

  const activeSectionIndex = STATUTORY_SECTIONS.findIndex((section) => section.code === activeSection);

  const navigateToSection = (index: number) => {
    if (index < 0 || index >= STATUTORY_SECTIONS.length) return;
    setActiveSection(STATUTORY_SECTIONS[index].code);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const goToPreviousSection = () => navigateToSection(activeSectionIndex - 1);
  const goToNextSection = () => navigateToSection(activeSectionIndex + 1);

  const groupedSourceRecords = availableSirdarInspections.reduce<Record<string, InspectionSummary[]>>((groups, inspection) => {
    const key = `${inspection.sirdar_employee_id}::${inspection.sirdar_name}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(inspection);
    return groups;
  }, {});

  const handleApplySourceSelection = async () => {
    if (isSubmitted || updatingSourceSelection) return;
    setSourceSelectionError(null);
    try {
      const updated = await onSourceSelectionChange(Array.from(new Set(sourceSelection)));
      if (updated) {
        setSectionsData(updated.sections);
        setPartsInspected(updated.parts_of_mine_inspected || '');
        setSourceSelection(updated.selected_source_inspection_ids || []);
      }
      setShowSourceSelector(false);
    } catch (err: any) {
      setSourceSelectionError(err?.message || 'Unable to update the selected Sirdar source records.');
    }
  };

  const toggleSource = (inspectionId: string) => {
    if (isSubmitted) return;
    setSourceSelection((prev) =>
      prev.includes(inspectionId)
        ? prev.filter((id) => id !== inspectionId)
        : [...prev, inspectionId]
    );
  };

  const toggleSirdarGroup = (inspectionIds: string[], select: boolean) => {
    if (isSubmitted) return;
    setSourceSelection((prev) => {
      if (select) return Array.from(new Set([...prev, ...inspectionIds]));
      const ids = new Set(inspectionIds);
      return prev.filter((id) => !ids.has(id));
    });
  };

  // Helper to update specific section's notes or structured data
  const handleUpdateNotes = (code: OvermanSectionCode, notes: string) => {
    if (isSubmitted) return;
    setSectionsData((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        overman_notes: notes,
      },
    }));
  };

  const handleUpdateStructured = (code: OvermanSectionCode, key: string, value: any) => {
    if (isSubmitted) return;
    setSectionsData((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        structured_data: {
          ...prev[code].structured_data,
          [key]: value,
        },
      },
    }));
  };

  const constructPayload = (): OvermanReportData => {
    return {
      ...report,
      parts_of_mine_inspected: partsInspected,
      sections: sectionsData,
    };
  };

  const handleSave = async () => {
    await onSaveDraft(constructPayload());
  };

  const handleSubmit = async () => {
    if (!statutoryDeclarationAgreed) return;
    await onSubmitReport(constructPayload());
    setShowReviewModal(false);
  };

  const currentSec = sectionsData[activeSection] || {
    code: activeSection,
    title: '',
    statutory_clause: '',
    population_status: 'PENDING',
    is_overman_input_required: false,
    entries: [],
    overman_notes: '',
    structured_data: {},
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-black font-sans">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl border border-slate-300 transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            <span>Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-sky-950 bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                {report.report_number}
              </span>
              {isSubmitted ? (
                <span className="bg-emerald-100 text-black border-2 border-emerald-500 text-xs px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-800" />
                  SUBMITTED & SEALED (IMMUTABLE)
                </span>
              ) : report.status === 'READY_FOR_REVIEW' ? (
                <span className="bg-amber-100 text-black border-2 border-amber-500 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                  READY FOR REVIEW
                </span>
              ) : (
                <span className="bg-sky-100 text-black border-2 border-sky-400 text-xs px-2.5 py-0.5 rounded-full font-extrabold">
                  DRAFT IN PROGRESS
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-black mt-1">
              Underground Overman Daily Inspection Report
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isSubmitted && (
            <>

              <button
                onClick={handleSave}
                disabled={saving}
                className="py-2.5 px-3.5 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-xl border-2 border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-sky-700" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                onClick={() => setShowReviewModal(true)}
                className="py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-500/25 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Review & Sign Report</span>
              </button>
            </>
          )}

          {isSubmitted && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-black font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-800" />
              <span>Statutory record sealed on {new Date(report.submitted_at || '').toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Report Header Metadata Card */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b-2 border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-sky-900 uppercase tracking-wider">
              Statutory Inspection Header • CMR 2017 Reg 47(7)(d)
            </div>
            <div className="text-base font-extrabold text-black mt-0.5">
              Colliery Daily Working Overman Report
            </div>
          </div>
          <div className="text-xs font-bold text-black bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
            Form G.S.R. 972(E)
          </div>
        </div>

        {/* Header Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-semibold block mb-0.5">Name of Mine</span>
            <span className="font-extrabold text-black text-sm block">{report.mine_name}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-semibold block mb-0.5">District / Panel</span>
            <span className="font-extrabold text-black text-sm block">{report.district_name}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-semibold block mb-0.5">Seam</span>
            <span className="font-extrabold text-black text-sm block">{report.seam_name}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-semibold block mb-0.5">Date of Inspection</span>
            <span className="font-extrabold text-black text-sm block">{report.report_date}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-semibold block mb-0.5">Shift & Hours</span>
            <span className="font-extrabold text-black text-sm block">
              {report.shift_name} ({report.shift_hours})
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="text-slate-600 font-semibold block mb-0.5">Overman In-Charge</span>
            <span className="font-extrabold text-black text-sm block">
              {report.overman_name} ({report.overman_employee_id})
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl col-span-2">
            <span className="text-slate-600 font-semibold block mb-0.5">Sirdar Source Records</span>
            <span className="font-extrabold text-black text-xs block">
              {sourceSelection.length > 0
                ? `${sourceSelection.length} Sirdar source inspection record${sourceSelection.length !== 1 ? 's' : ''} selected`
                : 'No Sirdar Source Records Selected'}
            </span>
          </div>
        </div>

        {/* Sirdar Source Selection */}
        <div className="bg-white border-2 border-sky-200 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-700" />
                <h3 className="text-sm sm:text-base font-extrabold text-black">Sirdar Source Records</h3>
              </div>
              <p className="text-xs text-slate-700 font-medium mt-1">
                Choose the submitted Sirdar inspection records that should be incorporated into this Overman report.
              </p>
            </div>
            {!isSubmitted && (
              <button
                type="button"
                onClick={() => { setSourceSelectionError(null); setShowSourceSelector(true); }}
                className="shrink-0 py-2 px-3.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                {sourceSelection.length > 0 ? 'Change Source Selection' : 'Select Source Records'}
              </button>
            )}
          </div>

          {sourceSelection.length === 0 ? (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-950 font-semibold">
              No Sirdar source records selected. The report will not automatically include available Sirdar observations until you select the relevant submitted records.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableSirdarInspections
                .filter((inspection) => sourceSelection.includes(inspection.id))
                .map((inspection) => (
                  <div key={inspection.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="text-xs font-extrabold text-black">{inspection.sirdar_name} ({inspection.sirdar_employee_id})</div>
                    <div className="text-[11px] font-mono font-bold text-sky-950 mt-1">{inspection.inspection_number}</div>
                    <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                      {inspection.shift_name} • {inspection.shift_hours} • {inspection.inspection_date}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Parts of Mine Inspected (Overman Entered) */}
        <div className="pt-2">
          <label className="block text-xs font-extrabold text-black mb-1.5 flex items-center justify-between">
            <span>Parts of Mine Inspected by Overman during Shift:</span>
            {!isSubmitted && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                Overman Statutory Entry
              </span>
            )}
          </label>
          {isSubmitted ? (
            <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-black">
              {partsInspected || 'No specific parts recorded.'}
            </div>
          ) : (
            <textarea
              rows={2}
              value={partsInspected}
              onChange={(e) => setPartsInspected(e.target.value)}
              placeholder="e.g. Panel 4 Continuous Miner Track, Tail Gate, Return Roadway, Substation, Crosscut 12..."
              className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-sm text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-sky-600"
            />
          )}
        </div>
      </div>

      {/* Source Selection Modal */}
      {showSourceSelector && !isSubmitted && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="p-5 border-b-2 border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-700" />
                  <h3 className="text-lg font-extrabold text-black">Select Sirdar Source Records</h3>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  Only submitted records within your authorized mine and Panel 4 scope are available.
                </p>
              </div>
              <button type="button" onClick={() => setShowSourceSelector(false)} className="text-slate-500 hover:text-black text-xl leading-none cursor-pointer">×</button>
            </div>

            <div className="p-5 max-h-[58vh] overflow-y-auto space-y-4">
              {availableSirdarInspections.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                  <div className="text-sm font-extrabold text-black">No submitted Sirdar records available</div>
                  <p className="text-xs text-slate-600 mt-1">New submitted records will appear automatically when you reopen or refresh this page.</p>
                </div>
              ) : (
                Object.entries(groupedSourceRecords).map(([groupKey, records]) => {
                  const [employeeId, sirdarName] = groupKey.split('::');
                  const recordIds = records.map((record) => record.id);
                  const allSelected = recordIds.every((id) => sourceSelection.includes(id));
                  return (
                    <div key={groupKey} className="border-2 border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200">
                        <div>
                          <div className="text-xs font-extrabold text-black uppercase tracking-wider">Sirdar</div>
                          <div className="text-sm font-extrabold text-black">{sirdarName} ({employeeId})</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => toggleSirdarGroup(recordIds, true)} className="text-[11px] font-extrabold text-sky-700 hover:text-sky-950 cursor-pointer">Select All</button>
                          <span className="text-slate-300">•</span>
                          <button type="button" onClick={() => toggleSirdarGroup(recordIds, false)} className="text-[11px] font-extrabold text-slate-700 hover:text-black cursor-pointer">Clear All</button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {records.map((inspection) => {
                          const selected = sourceSelection.includes(inspection.id);
                          return (
                            <label key={inspection.id} className={`flex items-start gap-3 p-4 cursor-pointer transition ${selected ? 'bg-sky-50/60' : 'bg-white hover:bg-slate-50'}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleSource(inspection.id)}
                                className="mt-1 w-4 h-4 accent-sky-600 cursor-pointer"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-extrabold text-black">{inspection.shift_name} — {inspection.shift_hours}</span>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-900">SUBMITTED</span>
                                </div>
                                <div className="text-xs text-slate-700 font-semibold mt-1">{inspection.inspection_date} • {inspection.inspection_number}</div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{inspection.period_count} inspection rounds</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{inspection.deficiency_count} deficiencies</span>
                                  {inspection.gas_detected && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-950">Gas observed</span>}
                                  {inspection.water_seepage && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-950">Water seepage</span>}
                                </div>
                              </div>
                              {selected && <Check className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />}
                            </label>
                          );
                        })}
                      </div>
                      <div className="px-4 py-2 bg-white border-t border-slate-100 text-[10px] font-semibold text-slate-500">
                        {recordIds.filter((id) => sourceSelection.includes(id)).length} of {recordIds.length} selected
                      </div>
                    </div>
                  );
                })
              )}

              {sourceSelectionError && (
                <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 text-xs text-rose-950 font-semibold">
                  {sourceSelectionError}
                </div>
              )}
            </div>

            <div className="p-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
              <div className="text-xs font-extrabold text-black">
                {sourceSelection.length} source record{sourceSelection.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button type="button" onClick={() => setShowSourceSelector(false)} className="py-2.5 px-4 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-xl border-2 border-slate-300 cursor-pointer">Cancel</button>
                <button type="button" onClick={handleApplySourceSelection} disabled={updatingSourceSelection} className="py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl cursor-pointer disabled:opacity-50">
                  {updatingSourceSelection ? 'Applying Selection...' : 'Apply Selection & Generate Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections A to N Navigation Tabs */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div>
          <div className="text-xs font-extrabold text-black uppercase tracking-wider mb-2">
            Statutory Sections A through N:
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {STATUTORY_SECTIONS.map((sec) => {
              const secData = sectionsData[sec.code];
              const isSelected = activeSection === sec.code;
              const hasEntries = (secData?.entries || []).length > 0;
              const isComplete = secData?.population_status === 'COMPLETED';

              return (
                <button
                  key={sec.code}
                  type="button"
                  onClick={() => setActiveSection(sec.code)}
                  className={`px-3 py-2.5 rounded-xl border-2 shrink-0 text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-100 border-sky-600 text-black shadow-xs ring-2 ring-sky-500/25'
                      : 'bg-white border-slate-300 text-black hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black">Sec {sec.code}</span>
                    {sec.is_overman_input_required && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Overman input required"></span>
                    )}
                    {hasEntries && (
                      <span className="w-2 h-2 rounded-full bg-sky-500" title="Sirdar data present"></span>
                    )}
                  </div>
                  <div className="text-xs font-bold truncate max-w-[120px] mt-0.5">
                    {sec.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Section Header */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
            <div>
              <span className="text-xs font-extrabold text-sky-900 uppercase">
                Section {currentSec.code}
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-black">
                {STATUTORY_SECTIONS.find((s) => s.code === activeSection)?.title}
              </h3>
            </div>
            <div>
              {currentSec.is_overman_input_required ? (
                <span className="bg-amber-100 text-black border border-amber-400 text-xs font-extrabold px-2.5 py-1 rounded-full">
                  Overman Input Required
                </span>
              ) : currentSec.entries.length > 0 ? (
                <span className="bg-sky-100 text-black border border-sky-400 text-xs font-extrabold px-2.5 py-1 rounded-full">
                  Auto-Mapped from {sourceSelection.length} Selected Sirdar Records
                </span>
              ) : (
                <span className="bg-emerald-50 text-black border border-emerald-300 text-xs font-extrabold px-2.5 py-1 rounded-full">
                  Nil Adverse Observations from Sirdars
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-black font-semibold">
            {STATUTORY_SECTIONS.find((s) => s.code === activeSection)?.statutory_clause}
          </p>
        </div>

        {/* 1. Auto-Populated Sirdar Observations with Source Traceability */}
        <div className="space-y-3">
          <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center justify-between">
            <span>Statutory Sirdar Source Observations</span>
            <span className="text-[11px] text-slate-600 font-semibold">
              Immutable under CMR 129(8) • Read-Only to Overman
            </span>
          </div>

          {currentSec.entries.length === 0 ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-black font-medium">
              No adverse observations or deficiencies recorded for Section {currentSec.code} in submitted Sirdar shift inspections.
            </div>
          ) : (
            <div className="space-y-3">
              {currentSec.entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white border-2 border-slate-300 rounded-xl p-4 space-y-3 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-black">{entry.title}</span>
                        <span className="bg-sky-100 text-black border border-sky-400 text-[10px] font-bold px-2 py-0.5 rounded">
                          AUTO-MAPPED
                        </span>
                      </div>
                      <div className="text-xs text-sky-950 font-bold mt-0.5">
                        Location: {entry.location || 'Assigned District'}
                      </div>
                    </div>

                    {/* Source Traceability Badge & Button */}
                    <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg text-right shrink-0">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        Source Traceability
                      </div>
                      <div className="text-xs font-bold text-black">
                        {entry.sirdar_name} ({entry.sirdar_employee_id})
                      </div>
                      <div className="text-[11px] font-mono text-slate-600">
                        {entry.source_inspection_number} • {entry.source_date}
                      </div>
                      {entry.source_inspection_id && (
                        <button
                          type="button"
                          onClick={() => onViewSourceRecord(entry.source_inspection_id!)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-700 hover:text-sky-900 bg-white px-2 py-0.5 rounded border border-slate-300 hover:border-sky-500 cursor-pointer transition shadow-2xs"
                        >
                          <Eye className="w-3 h-3 text-sky-700" />
                          <span>View Source Record</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-black font-medium leading-relaxed">
                    <strong className="font-bold">Observation Details:</strong> {entry.details}
                  </div>

                  {entry.action_taken && (
                    <div className="text-xs text-black font-semibold bg-emerald-50/60 border border-emerald-200 p-2 rounded-lg">
                      <strong className="font-bold text-emerald-950">Action Taken / Remedial Measure:</strong>{' '}
                      {entry.action_taken}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Overman Specific Inputs for Required Sections */}
        {activeSection === 'C' && (
          <div className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Overman Specific Entry — Stone Dusting & Barrier Measures</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">
                  Roadways Stone Dusted during Shift:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.roadways_dusted || ''}
                  onChange={(e) => handleUpdateStructured('C', 'roadways_dusted', e.target.value)}
                  placeholder="e.g. Main Intake Track, Belt Roadway up to 45L"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Quantity of Stone Dust Applied:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.dust_quantity || ''}
                  onChange={(e) => handleUpdateStructured('C', 'dust_quantity', e.target.value)}
                  placeholder="e.g. 35 bags (1750 kg limestone dust)"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Stone Dust Barrier Condition:
                </label>
                <select
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.barrier_condition || 'INTACT_SATISFACTORY'}
                  onChange={(e) => handleUpdateStructured('C', 'barrier_condition', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                >
                  <option value="INTACT_SATISFACTORY">Intact & Statutorily Adequate</option>
                  <option value="TOPPED_UP">Dust Topped Up / Trays Cleaned</option>
                  <option value="MAINTENANCE_REQUIRED">Maintenance Requisition Raised</option>
                  <option value="NOT_APPLICABLE">Not Applicable to District</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Sampling / Incombustible Dust % Test:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.sampling_result || ''}
                  onChange={(e) => handleUpdateStructured('C', 'sampling_result', e.target.value)}
                  placeholder="e.g. Sample S-4: >75% incombustible content"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'D' && (
          <div className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Overman Specific Entry — Haulage & Transport Safety Appliances</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">
                  Haulage Tracks & Ropes Condition:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.haulage_track_condition || ''}
                  onChange={(e) => handleUpdateStructured('D', 'haulage_track_condition', e.target.value)}
                  placeholder="e.g. Track gauge and fish plates examined, rope lubricated"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Runaway Stop Blocks & Switches:
                </label>
                <select
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.safety_appliances_tested || 'TESTED_OPERATIONAL'}
                  onChange={(e) => handleUpdateStructured('D', 'safety_appliances_tested', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                >
                  <option value="TESTED_OPERATIONAL">Tested & Functioning Correctly</option>
                  <option value="DEFECT_REPAIRED">Minor Defect Repaired On-Shift</option>
                  <option value="DEFECTIVE_HAULAGE_STOPPED">Defective - Haulage Suspended</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-black mb-1">
                  Signalling & Audio Bell Check:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.signalling_check || ''}
                  onChange={(e) => handleUpdateStructured('D', 'signalling_check', e.target.value)}
                  placeholder="e.g. Code of signals tested from all transfer points"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'G' && (
          <div className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Overman Specific Entry — Hand Plan & Working Faces</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">
                  Hand Plan Updated with Face Positions:
                </label>
                <select
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.hand_plan_updated || 'YES'}
                  onChange={(e) => handleUpdateStructured('G', 'hand_plan_updated', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                >
                  <option value="YES">Yes — Daily Marking Completed</option>
                  <option value="NO">No — Face Idle this Shift</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Face Advance Recorded (meters):
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.face_advance || ''}
                  onChange={(e) => handleUpdateStructured('G', 'face_advance', e.target.value)}
                  placeholder="e.g. Heading 1: 4.2m advance"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Date & Initials Marked on Plan:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.initials_marked || ''}
                  onChange={(e) => handleUpdateStructured('G', 'initials_marked', e.target.value)}
                  placeholder="e.g. Marked and initialed on 26/09/2026"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'H' && (
          <div className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Overman Specific Entry — Working Faces Within 10m of Workings / Water</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">
                  Any face approaching within 10m of old workings / water:
                </label>
                <select
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.within_10m || 'NO'}
                  onChange={(e) => handleUpdateStructured('H', 'within_10m', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                >
                  <option value="NO">No faces within 10m</option>
                  <option value="YES">YES — Special Statutory Precautions in Force</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Precautionary Boreholes / Barrier Width:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.precautions_detail || ''}
                  onChange={(e) => handleUpdateStructured('H', 'precautions_detail', e.target.value)}
                  placeholder="e.g. Nil, or 3 advance boreholes maintained at face"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'L' && (
          <div className="bg-amber-50/50 border-2 border-amber-300 rounded-xl p-4 space-y-3">
            <div className="text-xs font-extrabold text-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Overman Specific Entry — Handover Conference with Successor Overman</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">
                  Conference Conducted at Station:
                </label>
                <select
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.conference_conducted || 'YES'}
                  onChange={(e) => handleUpdateStructured('L', 'conference_conducted', e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-black"
                >
                  <option value="YES">Yes — In Person Conference Held</option>
                  <option value="NO">No — Relieving Overman Absent</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Relieving Overman Name & Employee ID:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.relieving_overman_name || ''}
                  onChange={(e) => handleUpdateStructured('L', 'relieving_overman_name', e.target.value)}
                  placeholder="e.g. K. P. Sen (O002)"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>

              <div>
                <label className="block font-bold text-black mb-1">
                  Matters & Precautions Conveyed:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={currentSec.structured_data?.matters_conveyed || ''}
                  onChange={(e) => handleUpdateStructured('L', 'matters_conveyed', e.target.value)}
                  placeholder="e.g. Crosscut 12 fenced, stone dusting scheduled"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Overman Remarks / Notes for this Section */}
        <div className="pt-2">
          <label className="block text-xs font-extrabold text-black mb-1.5 flex items-center justify-between">
            <span>Overman Statutory Remarks for Section {currentSec.code}:</span>
            <span className="text-[11px] text-slate-500 font-medium">
              Overman remarks supplement but do not alter Sirdar source records
            </span>
          </label>
          {isSubmitted ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-black">
              {currentSec.overman_notes || 'No remarks recorded.'}
            </div>
          ) : (
            <textarea
              rows={3}
              value={currentSec.overman_notes || ''}
              onChange={(e) => handleUpdateNotes(currentSec.code, e.target.value)}
              placeholder={`Enter Overman statutory remarks, findings, or instructions regarding ${STATUTORY_SECTIONS.find((s) => s.code === activeSection)?.title}...`}
              className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl text-xs font-semibold text-black placeholder-slate-400 focus:outline-none focus:border-sky-600"
            />
          )}
        </div>
      </div>

      {/* Persistent Draft Actions */}
      {!isSubmitted && (
        <div className="mt-6 bg-white/95 backdrop-blur border-2 border-slate-300 rounded-2xl shadow-lg px-3 sm:px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs font-semibold text-slate-700">
              {saving
                ? 'Saving your draft...'
                : 'Your report remains editable until you submit it.'}
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || updatingSourceSelection}
                className="py-2.5 px-4 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-xl border-2 border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-sky-700" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                disabled={saving || updatingSourceSelection}
                className="py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-500/25 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Review & Sign Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous / Next Section Navigation */}
      {!isSubmitted && (
        <div className="sticky bottom-0 z-30 mt-6 bg-white/95 backdrop-blur border-2 border-slate-300 rounded-2xl shadow-lg px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPreviousSection}
              disabled={activeSectionIndex <= 0}
              className="inline-flex items-center gap-1.5 py-2.5 px-3.5 sm:px-4 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-xl border-2 border-slate-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            <div className="text-center min-w-0">
              <div className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
                Section {activeSectionIndex + 1} of {STATUTORY_SECTIONS.length}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-black truncate max-w-[180px] sm:max-w-[360px]">
                {STATUTORY_SECTIONS[activeSectionIndex]?.code} • {STATUTORY_SECTIONS[activeSectionIndex]?.title}
              </div>
            </div>

            <button
              type="button"
              onClick={goToNextSection}
              disabled={activeSectionIndex >= STATUTORY_SECTIONS.length - 1}
              className="inline-flex items-center gap-1.5 py-2.5 px-3.5 sm:px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Statutory Review & Signing Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-slate-300 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
            <div className="border-b-2 border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="bg-sky-100 text-sky-950 font-bold text-xs px-2.5 py-0.5 rounded border border-sky-300">
                  DGMS STATUTORY REVIEW
                </span>
                <span className="text-xs font-bold text-black">
                  CMR 2017 Reg 47(7)(d) • Form G.S.R. 972(E)
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-black mt-1">
                Final Review & Statutory Submission
              </h3>
              <p className="text-xs text-black font-medium mt-1">
                Once submitted, this daily report becomes an immutable statutory legal document. It cannot be altered, edited, or deleted.
              </p>
            </div>

            {/* Statutory Summary Card */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-black">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-600 font-semibold block">Mine & District:</span>
                  <strong className="font-extrabold">{report.mine_name} • {report.district_name}</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold block">Seam:</span>
                  <strong className="font-extrabold">{report.seam_name}</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold block">Inspection Shift & Date:</span>
                  <strong className="font-extrabold">{report.shift_name} ({report.report_date})</strong>
                </div>
                <div>
                  <span className="text-slate-600 font-semibold block">Statutory Overman:</span>
                  <strong className="font-extrabold">{report.overman_name} ({report.overman_employee_id})</strong>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-600 font-semibold block">Parts of Mine Inspected:</span>
                <p className="font-bold text-black mt-0.5">{partsInspected || 'Standard district inspection'}</p>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-600 font-semibold block">Sirdar Source Records Mapped:</span>
                <p className="font-bold text-sky-950 mt-0.5">
                  {report.selected_source_inspection_ids.length} selected submitted Sirdar inspection records integrated with full traceability.
                </p>
              </div>
            </div>

            {/* Statutory Declaration Checkbox */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statutoryDeclarationAgreed}
                  onChange={(e) => setStatutoryDeclarationAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-sky-600 cursor-pointer"
                />
                <span className="text-xs text-black font-semibold leading-relaxed">
                  I, <strong className="font-bold">{user.name}</strong>, holding statutory Overman credential{' '}
                  <strong className="font-mono font-bold">{user.employee_id}</strong>, hereby certify under{' '}
                  <strong className="font-bold">Regulation 47(7)(d) of the Coal Mines Regulations, 2017</strong> that
                  I have personally inspected the district during this shift, reviewed the submitted Sirdar information
                  incorporated into this report, recorded the required Overman observations, and declare this to be a true
                  and complete statutory record.
                </span>
              </label>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-black font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition"
              >
                Back to Editing
              </button>

              <button
                type="button"
                disabled={!statutoryDeclarationAgreed || submitting}
                onClick={handleSubmit}
                className="py-3 px-6 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-sky-500/25 disabled:opacity-50 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{submitting ? 'Submitting & Sealing...' : 'Submit & Seal Statutory Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
