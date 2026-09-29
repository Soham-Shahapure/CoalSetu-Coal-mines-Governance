import React from 'react';
import {
  InspectionData,
  SafetyInstruction,
  SafetyMaterialItem,
  SafetyMaterialType,
  SupportWithdrawal,
} from '../../types/inspection';
import {
  Shield,
  Plus,
  Trash2,
  AlertTriangle,
  UserX,
  UserCheck,
  CheckCircle,
  Package,
  Compass,
  Hammer,
  Eye,
  Activity,
  Fence,
} from 'lucide-react';

interface Step5Props {
  formData: InspectionData;
  onChange: (updates: Partial<InspectionData>) => void;
}

export const Step5SafetyConditions: React.FC<Step5Props> = ({ formData, onChange }) => {
  // 1. Safety Instructions
  const instructions = formData.safety_instructions || [];
  const handleAddInstruction = () => {
    onChange({
      safety_instructions: [
        ...instructions,
        { instruction: '', persons_instructed: formData.persons_under_charge || 1 },
      ],
    });
  };
  const handleUpdateInstruction = (
    index: number,
    field: keyof SafetyInstruction,
    val: any
  ) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ safety_instructions: updated });
  };
  const handleRemoveInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    onChange({ safety_instructions: updated });
  };

  // 2. Person Ordered Out
  const personOrderedOut = formData.person_ordered_out || { occurred: false };

  // 3. Inexperienced Person
  const inexperiencedPerson = formData.inexperienced_person || { present: false };

  // 4. Safety Materials
  const materials = formData.safety_materials || ({} as Record<SafetyMaterialType, SafetyMaterialItem>);
  const handleMaterialChange = (
    key: SafetyMaterialType,
    updates: Partial<SafetyMaterialItem>
  ) => {
    const existing = materials[key] || { material_type: key, status: 'ADEQUATE' };
    onChange({
      safety_materials: {
        ...materials,
        [key]: { ...existing, ...updates },
      },
    });
  };

  // 5. Second Egress
  const egress = formData.egress_record || { travelled: false };

  // 6. Support Withdrawn
  const supportOccurred = formData.support_withdrawals_occurred || false;
  const supportList = formData.support_withdrawals || [];
  const handleAddSupportRow = () => {
    onChange({
      support_withdrawals: [
        ...supportList,
        {
          place: '',
          cogs_sleepers_withdrawn: 0,
          props_withdrawn: 0,
          other_support: '',
          means_of_withdrawal: 'Sylvester Prop-Withdrawer',
        },
      ],
    });
  };
  const handleUpdateSupportRow = (
    index: number,
    field: keyof SupportWithdrawal,
    val: any
  ) => {
    const updated = [...supportList];
    updated[index] = { ...updated[index], [field]: val };
    onChange({ support_withdrawals: updated });
  };
  const handleRemoveSupportRow = (index: number) => {
    onChange({ support_withdrawals: supportList.filter((_, i) => i !== index) });
  };

  // 7. Dangerous Places
  const dangerousPlaces = formData.dangerous_places || {
    observed: false,
    reported_by_other: false,
  };

  // 8. Dangerous Operations
  const dangerousOps = formData.dangerous_operations || { occurred: false };

  // 9. Inactive Places
  const inactivePlaces = formData.inactive_places || { fenced: false };

  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-600" />
          <span>Stage 5 — Safety, Materials & Special District Conditions</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Statutory declarations for Sections 4 through 12 under G.S.R. 977(E).
        </p>
      </div>

      {/* SECTION 4: SAFETY INSTRUCTIONS GIVEN */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                4
              </span>
              <span>Safety Instructions Given</span>
            </h4>
            <p className="text-xs text-slate-500">
              Record safety instructions given to workmen and number of recipients
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddInstruction}
            className="text-xs px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Instruction</span>
          </button>
        </div>

        {instructions.length === 0 ? (
          <div className="p-3 bg-white rounded-xl text-xs text-slate-500 flex items-center justify-between border border-slate-200 shadow-xs">
            <span>No specific safety instructions recorded yet.</span>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="text-sky-600 hover:underline font-semibold text-xs"
            >
              + Record Instruction
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {instructions.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center shadow-xs"
              >
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Instruction Given #{idx + 1}
                  </label>
                  <input
                    type="text"
                    value={item.instruction}
                    onChange={(e) => handleUpdateInstruction(idx, 'instruction', e.target.value)}
                    placeholder="e.g. Use designated travelling roadway; do not approach unsupported roof."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Persons Instructed
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.persons_instructed}
                      onChange={(e) =>
                        handleUpdateInstruction(idx, 'persons_instructed', parseInt(e.target.value, 10) || 0)
                      }
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(idx)}
                    className="mt-5 p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Remove instruction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 5: PERSON ORDERED OUT */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                5
              </span>
              <span>Person Ordered Out of the Mine</span>
            </h4>
            <p className="text-xs text-slate-500">
              Was any person ordered out of the mine for working at a place other than assigned?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ person_ordered_out: { occurred: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !personOrderedOut.occurred
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onChange({ person_ordered_out: { ...personOrderedOut, occurred: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                personOrderedOut.occurred
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {personOrderedOut.occurred && (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Person Name / Designation
                </label>
                <input
                  type="text"
                  value={personOrderedOut.person_name || ''}
                  onChange={(e) =>
                    onChange({
                      person_ordered_out: { ...personOrderedOut, person_name: e.target.value },
                    })
                  }
                  placeholder="e.g. Ramesh Kumar, Loader"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Assigned Place
                </label>
                <input
                  type="text"
                  value={personOrderedOut.assigned_place || ''}
                  onChange={(e) =>
                    onChange({
                      person_ordered_out: { ...personOrderedOut, assigned_place: e.target.value },
                    })
                  }
                  placeholder="e.g. Level 2 East Heading"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Actual Place Found Working
                </label>
                <input
                  type="text"
                  value={personOrderedOut.actual_place || ''}
                  onChange={(e) =>
                    onChange({
                      person_ordered_out: { ...personOrderedOut, actual_place: e.target.value },
                    })
                  }
                  placeholder="e.g. Panel 4 Disused Junction"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Action Taken by Sirdar
                </label>
                <input
                  type="text"
                  value={personOrderedOut.action_taken || ''}
                  onChange={(e) =>
                    onChange({
                      person_ordered_out: { ...personOrderedOut, action_taken: e.target.value },
                    })
                  }
                  placeholder="e.g. Immediately stopped and escorted back to surface / Overman informed"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: INEXPERIENCED PERSON */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                6
              </span>
              <span>Inexperienced Person Working in District</span>
            </h4>
            <p className="text-xs text-slate-500">
              Was any inexperienced person working in the district under supervision?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ inexperienced_person: { present: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !inexperiencedPerson.present
                  ? 'bg-slate-100 text-slate-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onChange({ inexperienced_person: { ...inexperiencedPerson, present: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                inexperiencedPerson.present
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {inexperiencedPerson.present && (
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200 shadow-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Inexperienced Person Name
              </label>
              <input
                type="text"
                value={inexperiencedPerson.person_name || ''}
                onChange={(e) =>
                  onChange({
                    inexperienced_person: { ...inexperiencedPerson, person_name: e.target.value },
                  })
                }
                placeholder="e.g. Vikas Yadav (Trainee Trammer)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Person Under Whose Supervision Placed
              </label>
              <input
                type="text"
                value={inexperiencedPerson.supervisor_name || ''}
                onChange={(e) =>
                  onChange({
                    inexperienced_person: { ...inexperiencedPerson, supervisor_name: e.target.value },
                  })
                }
                placeholder="e.g. Senior Trammer H. B. Soren"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 7: SAFETY MATERIALS CHECKLIST */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
              7
            </span>
            <span>Safety Materials Statutory Checklist</span>
          </h4>
          <p className="text-xs text-slate-500">
            Mandatory inspection of safety materials under Regulation 129(8). Mark status and remedial action if deficient.
          </p>
        </div>

        <div className="space-y-3">
          {/* Timber */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">Timber (Props, Cogs, Lids, Sleepers)</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleMaterialChange('TIMBER', { status: 'ADEQUATE' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    materials.TIMBER?.status === 'ADEQUATE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Adequate
                </button>
                <button
                  type="button"
                  onClick={() => handleMaterialChange('TIMBER', { status: 'DEFICIENT' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    materials.TIMBER?.status === 'DEFICIENT'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Deficient
                </button>
              </div>
            </div>
            {materials.TIMBER?.status === 'DEFICIENT' && (
              <input
                type="text"
                value={materials.TIMBER?.remedial_action || ''}
                onChange={(e) => handleMaterialChange('TIMBER', { remedial_action: e.target.value })}
                placeholder="Remedial action taken: e.g. Indented 20 props & 40 lids from Pit Head Depot"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          {/* Buntons */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800">Buntons</span>
                <span className="text-[11px] text-slate-500 block sm:inline sm:ml-1">
                  (Where working place height exceeds 3 m)
                </span>
              </div>
              <div className="flex space-x-2">
                {(['ADEQUATE', 'DEFICIENT', 'NOT_APPLICABLE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleMaterialChange('BUNTON', { status: st })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      materials.BUNTON?.status === st
                        ? st === 'DEFICIENT'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : st === 'NOT_APPLICABLE'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'NOT_APPLICABLE' ? 'N/A' : st === 'ADEQUATE' ? 'Adequate' : 'Deficient'}
                  </button>
                ))}
              </div>
            </div>
            {materials.BUNTON?.status === 'DEFICIENT' && (
              <input
                type="text"
                value={materials.BUNTON?.remedial_action || ''}
                onChange={(e) => handleMaterialChange('BUNTON', { remedial_action: e.target.value })}
                placeholder="Remedial action taken for buntons"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          {/* Ladder */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">Ladder</span>
              <div className="flex space-x-2">
                {(['AVAILABLE', 'DEFICIENT', 'NOT_APPLICABLE'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleMaterialChange('LADDER', { status: st })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      materials.LADDER?.status === st
                        ? st === 'DEFICIENT'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : st === 'NOT_APPLICABLE'
                          ? 'bg-slate-200 text-slate-800'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'NOT_APPLICABLE' ? 'N/A' : st === 'AVAILABLE' ? 'Available' : 'Deficient'}
                  </button>
                ))}
              </div>
            </div>
            {materials.LADDER?.status === 'DEFICIENT' && (
              <input
                type="text"
                value={materials.LADDER?.remedial_action || ''}
                onChange={(e) => handleMaterialChange('LADDER', { remedial_action: e.target.value })}
                placeholder="Remedial action: e.g. Withdrawn cracked ladder; replacement requisitioned"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          {/* CO Detection */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-800">CO Detection Apparatus</span>
                <span className="text-[11px] text-slate-500 block sm:inline sm:ml-1">
                  (Cage with suitable birds or electronic CO detector)
                </span>
              </div>
              <div className="flex space-x-2">
                {(['AVAILABLE', 'DEFICIENT'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleMaterialChange('CO_DETECTION', { status: st })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      materials.CO_DETECTION?.status === st
                        ? st === 'DEFICIENT'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'AVAILABLE' ? 'Available / Serviceable' : 'Deficient'}
                  </button>
                ))}
              </div>
            </div>
            {materials.CO_DETECTION?.status === 'DEFICIENT' && (
              <input
                type="text"
                value={materials.CO_DETECTION?.remedial_action || ''}
                onChange={(e) => handleMaterialChange('CO_DETECTION', { remedial_action: e.target.value })}
                placeholder="Remedial action taken for carbon monoxide detection equipment"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            )}
          </div>

          {/* Other Safety Materials */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800">Other Safety Materials / PPE</span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => handleMaterialChange('OTHER', { status: 'ADEQUATE' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    materials.OTHER?.status === 'ADEQUATE'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Adequate
                </button>
                <button
                  type="button"
                  onClick={() => handleMaterialChange('OTHER', { status: 'DEFICIENT' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    materials.OTHER?.status === 'DEFICIENT'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Deficient
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={materials.OTHER?.description || ''}
                onChange={(e) => handleMaterialChange('OTHER', { description: e.target.value })}
                placeholder="Description of other equipment (e.g. Safety belts, dust respirators, cap lamps)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
              {materials.OTHER?.status === 'DEFICIENT' && (
                <input
                  type="text"
                  value={materials.OTHER?.remedial_action || ''}
                  onChange={(e) => handleMaterialChange('OTHER', { remedial_action: e.target.value })}
                  placeholder="Remedial action taken"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 8: SECOND EGRESS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                8
              </span>
              <span>Second Egress Inspection</span>
            </h4>
            <p className="text-xs text-slate-500">
              Did the Sirdar travel along the second egress of the surface not ordinarily used for travelling?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ egress_record: { travelled: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !egress.travelled ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  egress_record: {
                    travelled: true,
                    travel_date: formData.inspection_date || new Date().toISOString().split('T')[0],
                  },
                })
              }
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                egress.travelled ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {egress.travelled && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200 shadow-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Date of Travel along Second Egress
              </label>
              <input
                type="date"
                value={egress.travel_date || ''}
                onChange={(e) =>
                  onChange({
                    egress_record: { ...egress, travel_date: e.target.value },
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Remarks on Traveling Way
              </label>
              <input
                type="text"
                value={egress.remarks || ''}
                onChange={(e) =>
                  onChange({
                    egress_record: { ...egress, remarks: e.target.value },
                  })
                }
                placeholder="e.g. Second outlet travelled; ladders and clearway unobstructed"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 9: SUPPORT WITHDRAWN */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                9
              </span>
              <span>Support Withdrawn During Shift</span>
            </h4>
            <p className="text-xs text-slate-500">
              Was any roof or side support withdrawn in the district during this shift?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() =>
                onChange({ support_withdrawals_occurred: false, support_withdrawals: [] })
              }
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !supportOccurred ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({ support_withdrawals_occurred: true });
                if (supportList.length === 0) handleAddSupportRow();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                supportOccurred ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {supportOccurred && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-700">
                Support Withdrawal Operations Log:
              </span>
              <button
                type="button"
                onClick={handleAddSupportRow}
                className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Place Row</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-2.5">Place</th>
                    <th className="p-2.5">Cogs/Sleepers</th>
                    <th className="p-2.5">Props</th>
                    <th className="p-2.5">Other Support</th>
                    <th className="p-2.5">Means of Withdrawal</th>
                    <th className="p-2.5 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {supportList.map((row, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.place}
                          onChange={(e) => handleUpdateSupportRow(idx, 'place', e.target.value)}
                          placeholder="e.g. Gallery 4 Goaf Edge"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="p-2 w-24">
                        <input
                          type="number"
                          min={0}
                          value={row.cogs_sleepers_withdrawn}
                          onChange={(e) =>
                            handleUpdateSupportRow(
                              idx,
                              'cogs_sleepers_withdrawn',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </td>
                      <td className="p-2 w-20">
                        <input
                          type="number"
                          min={0}
                          value={row.props_withdrawn}
                          onChange={(e) =>
                            handleUpdateSupportRow(
                              idx,
                              'props_withdrawn',
                              parseInt(e.target.value, 10) || 0
                            )
                          }
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.other_support}
                          onChange={(e) => handleUpdateSupportRow(idx, 'other_support', e.target.value)}
                          placeholder="Bars / lids"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.means_of_withdrawal}
                          onChange={(e) =>
                            handleUpdateSupportRow(idx, 'means_of_withdrawal', e.target.value)
                          }
                          placeholder="Safety Prop-Withdrawer"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSupportRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 10: DANGEROUS PLACES */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
              10
            </span>
            <span>Dangerous Places Observed or Reported</span>
          </h4>
          <p className="text-xs text-slate-500">
            Dangerous places observed by Sirdar or reported by other workmen
          </p>
        </div>

        {/* 10A: Observed by Sirdar */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">
              Were any dangerous places observed by you?
            </span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() =>
                  onChange({ dangerous_places: { ...dangerousPlaces, observed: false } })
                }
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  !dangerousPlaces.observed ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ dangerous_places: { ...dangerousPlaces, observed: true } })
                }
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  dangerousPlaces.observed ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {dangerousPlaces.observed && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={dangerousPlaces.location || ''}
                  onChange={(e) =>
                    onChange({
                      dangerous_places: { ...dangerousPlaces, location: e.target.value },
                    })
                  }
                  placeholder="e.g. 4th Heading East Dip"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Nature of Danger
                </label>
                <input
                  type="text"
                  value={dangerousPlaces.nature_of_danger || ''}
                  onChange={(e) =>
                    onChange({
                      dangerous_places: { ...dangerousPlaces, nature_of_danger: e.target.value },
                    })
                  }
                  placeholder="e.g. Overhanging coal side liable to fall"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Action Taken
                </label>
                <input
                  type="text"
                  value={dangerousPlaces.action_taken || ''}
                  onChange={(e) =>
                    onChange({
                      dangerous_places: { ...dangerousPlaces, action_taken: e.target.value },
                    })
                  }
                  placeholder="e.g. Danger fence erected; workers withdrawn until dressed down"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 10B: Reported by another person */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800">
              Was any danger reported by another person?
            </span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() =>
                  onChange({ dangerous_places: { ...dangerousPlaces, reported_by_other: false } })
                }
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  !dangerousPlaces.reported_by_other ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({ dangerous_places: { ...dangerousPlaces, reported_by_other: true } })
                }
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                  dangerousPlaces.reported_by_other ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yes
              </button>
            </div>
          </div>

          {dangerousPlaces.reported_by_other && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 animate-in fade-in">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Reporting Person Name
                </label>
                <input
                  type="text"
                  value={dangerousPlaces.reporting_person_name || ''}
                  onChange={(e) =>
                    onChange({
                      dangerous_places: {
                        ...dangerousPlaces,
                        reporting_person_name: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. S. Soren (Driller)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Details of Danger
                </label>
                <input
                  type="text"
                  value={dangerousPlaces.other_report_details || ''}
                  onChange={(e) =>
                    onChange({
                      dangerous_places: {
                        ...dangerousPlaces,
                        other_report_details: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Gas blower hiss at Face 3"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Action Taken
                </label>
                <input
                  type="text"
                  value={dangerousPlaces.other_report_action || ''}
                  onChange={(e) =>
                    onChange({
                      dangerous_places: {
                        ...dangerousPlaces,
                        other_report_action: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Inspected with methanometer; ventilation restored"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 11: DANGEROUS OPERATIONS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                11
              </span>
              <span>Dangerous Operations Under Personal Supervision</span>
            </h4>
            <p className="text-xs text-slate-500">
              Were any dangerous operations carried out under your personal supervision?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ dangerous_operations: { occurred: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !dangerousOps.occurred ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({ dangerous_operations: { ...dangerousOps, occurred: true } })
              }
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                dangerousOps.occurred ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {dangerousOps.occurred && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200 shadow-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Nature of Operation
              </label>
              <input
                type="text"
                value={dangerousOps.operation_nature || ''}
                onChange={(e) =>
                  onChange({
                    dangerous_operations: { ...dangerousOps, operation_nature: e.target.value },
                  })
                }
                placeholder="e.g. Taking down severe overhang / clearing fall of ground"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={dangerousOps.location || ''}
                onChange={(e) =>
                  onChange({
                    dangerous_operations: { ...dangerousOps, location: e.target.value },
                  })
                }
                placeholder="e.g. Panel 4 Level 3 Crosscut"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Precautions & Actions Taken
              </label>
              <input
                type="text"
                value={dangerousOps.precautions_taken || ''}
                onChange={(e) =>
                  onChange({
                    dangerous_operations: { ...dangerousOps, precautions_taken: e.target.value },
                  })
                }
                placeholder="e.g. Pre-supported with hydraulic props under Sirdar personal watch; only experienced workmen engaged"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 12: INACTIVE/DISUSED PLACES FENCED OFF */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                12
              </span>
              <span>Inactive / Disused Places Fenced Off</span>
            </h4>
            <p className="text-xs text-slate-500">
              Were entrances to places not in active use fenced off during the shift?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ inactive_places: { fenced: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !inactivePlaces.fenced ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onChange({ inactive_places: { ...inactivePlaces, fenced: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                inactivePlaces.fenced ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes
            </button>
          </div>
        </div>

        {inactivePlaces.fenced && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200 shadow-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Location & Particulars of Entrances
              </label>
              <input
                type="text"
                value={inactivePlaces.location || ''}
                onChange={(e) =>
                  onChange({
                    inactive_places: { ...inactivePlaces, location: e.target.value },
                  })
                }
                placeholder="e.g. Gallery 2 West Inactive Heading"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fencing Particulars & Action Taken
              </label>
              <input
                type="text"
                value={inactivePlaces.action_taken || ''}
                onChange={(e) =>
                  onChange({
                    inactive_places: { ...inactivePlaces, action_taken: e.target.value },
                  })
                }
                placeholder="e.g. Substantial wooden fence and red danger board erected"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
