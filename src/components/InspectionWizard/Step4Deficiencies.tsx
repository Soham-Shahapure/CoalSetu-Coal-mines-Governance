import React from 'react';
import {
  InspectionData,
  ObservationCategory,
  SectionDeficiencyObservation,
} from '../../types/inspection';
import {
  ShieldAlert,
  Wind,
  Layers,
  Ban,
  Fence,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  MapPin,
} from 'lucide-react';

interface Step4Props {
  formData: InspectionData;
  onChange: (updates: Partial<InspectionData>) => void;
}

interface CategoryConfig {
  key: ObservationCategory;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  locationPlaceholder: string;
  descriptionPlaceholder: string;
  remedialPlaceholder: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'VENTILATION',
    title: 'A. Ventilation',
    subtitle: 'Air circulation, brattice cloth, ventilation stoppings, velocity at face',
    icon: <Wind className="w-5 h-5 text-sky-400" />,
    locationPlaceholder: 'e.g. Gallery 5 between Level 2 & 3 / Last Ventilation Connection',
    descriptionPlaceholder: 'e.g. Brattice sheet torn by passing shuttle car; sluggish air current observed.',
    remedialPlaceholder: 'e.g. Replaced brattice cloth immediately and restored face ventilation.',
  },
  {
    key: 'STRATA',
    title: 'B. Support of Strata — Roof & Sides',
    subtitle: 'Roof coal/shale condition, side spalling, props, cogs, roof bolts, systematic support',
    icon: <Layers className="w-5 h-5 text-amber-400" />,
    locationPlaceholder: 'e.g. Panel 4 / Gallery 7 Junction / 2nd Dip Roadway',
    descriptionPlaceholder: 'e.g. Spalling of roof coal and side slip detected along crosscut.',
    remedialPlaceholder: 'e.g. Erected 2 additional hydraulic props and timber cogs. Area sound-tested.',
  },
  {
    key: 'GOAF_EDGE',
    title: 'C. Goaf Edges',
    subtitle: 'Breaker props, chocks, goaf fencing, settlement indicators, heating check',
    icon: <Ban className="w-5 h-5 text-orange-400" />,
    locationPlaceholder: 'e.g. Goaf edge of Pillar 14 / Depillaring Panel 2',
    descriptionPlaceholder: 'e.g. Displaced wooden chock at goaf perimeter.',
    remedialPlaceholder: 'e.g. Reset chock and strengthened breaker line with auxiliary props.',
  },
  {
    key: 'FENCING',
    title: 'D. Fencings',
    subtitle: 'Fencing of disused workings, danger zones, haulage roadways, machinery guards',
    icon: <Fence className="w-5 h-5 text-rose-400" />,
    locationPlaceholder: 'e.g. Disused heading at 3rd East Level',
    descriptionPlaceholder: 'e.g. Warning fencing board dislodged.',
    remedialPlaceholder: 'e.g. Re-erected statutory danger fencing with clear red reflector warning.',
  },
  {
    key: 'SANITATION',
    title: 'E. Sanitation',
    subtitle: 'Cleanliness of district roadways, drainage, latrines, disposal of waste',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    locationPlaceholder: 'e.g. Level 2 Main Loading Point / Sirdar Station',
    descriptionPlaceholder: 'e.g. Waste coal accumulation obstructing water drain.',
    remedialPlaceholder: 'e.g. Cleared drain channels and disinfected Sirdar rest station.',
  },
];

export const Step4Deficiencies: React.FC<Step4Props> = ({ formData, onChange }) => {
  const deficiencies = formData.deficiencies || ({} as Record<ObservationCategory, SectionDeficiencyObservation>);

  const handleToggleDeficiency = (category: ObservationCategory, hasDeficiency: boolean) => {
    const existing = deficiencies[category] || { category, has_deficiency: false };
    const updated = {
      ...deficiencies,
      [category]: {
        ...existing,
        has_deficiency: hasDeficiency,
      },
    };
    onChange({ deficiencies: updated });
  };

  const handleFieldChange = (
    category: ObservationCategory,
    field: keyof SectionDeficiencyObservation,
    value: string
  ) => {
    const existing = deficiencies[category] || { category, has_deficiency: true };
    const updated = {
      ...deficiencies,
      [category]: {
        ...existing,
        [field]: value,
      },
    };
    onChange({ deficiencies: updated });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-sky-600" />
          <span>Stage 4 — Deficiencies Observed (Section 3 of G.S.R. 977(E))</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Record statutory findings across the five key inspection areas. If no deficiency is observed, select <strong>Satisfactory</strong>. If a deficiency is marked, location and remedial action are mandatory.
        </p>
      </div>

      <div className="space-y-5">
        {CATEGORIES.map((cat) => {
          const obs = deficiencies[cat.key] || { category: cat.key, has_deficiency: false };
          const hasDef = obs.has_deficiency;

          return (
            <div
              key={cat.key}
              className={`rounded-2xl border transition p-4 sm:p-5 shadow-xs ${
                hasDef
                  ? 'bg-amber-50/60 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Card Header & Category Title */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    {cat.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{cat.title}</h4>
                    <p className="text-xs text-slate-500">{cat.subtitle}</p>
                  </div>
                </div>

                {/* Statutory Binary Toggle: Satisfactory vs Deficiency Observed */}
                <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleDeficiency(cat.key, false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      !hasDef
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Satisfactory</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleDeficiency(cat.key, true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      hasDef
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Deficiency Observed</span>
                  </button>
                </div>
              </div>

              {/* Progressive Disclosure: Fields revealed only if Deficiency Observed */}
              {hasDef && (
                <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Location Text */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>Underground Working Place / Location (Required)</span>
                      </label>
                      <input
                        type="text"
                        value={obs.location_text || ''}
                        onChange={(e) => handleFieldChange(cat.key, 'location_text', e.target.value)}
                        placeholder={cat.locationPlaceholder}
                        required
                        className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Hierarchy format: Panel / Gallery / Pillar / Heading / Roadway
                      </span>
                    </div>

                    {/* Deficiency Description */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Deficiency Observed (Required)
                      </label>
                      <textarea
                        rows={2}
                        value={obs.description || ''}
                        onChange={(e) => handleFieldChange(cat.key, 'description', e.target.value)}
                        placeholder={cat.descriptionPlaceholder}
                        required
                        className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none shadow-xs"
                      />
                    </div>

                    {/* Remedial Action Taken */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Remedial Action Taken by Sirdar (Required)
                      </label>
                      <textarea
                        rows={2}
                        value={obs.remedial_action || ''}
                        onChange={(e) => handleFieldChange(cat.key, 'remedial_action', e.target.value)}
                        placeholder={cat.remedialPlaceholder}
                        required
                        className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none resize-none shadow-xs"
                      />
                    </div>

                    {/* Remarks (Optional) */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Remarks / Escalation to Overman (Optional)
                      </label>
                      <input
                        type="text"
                        value={obs.remarks || ''}
                        onChange={(e) => handleFieldChange(cat.key, 'remarks', e.target.value)}
                        placeholder="e.g. Overman briefed; additional supplies requested for next shift."
                        className="w-full bg-white border border-slate-300 focus:border-sky-500 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
