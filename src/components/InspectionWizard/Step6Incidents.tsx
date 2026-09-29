import React from 'react';
import {
  InspectionData,
  GasObservation,
  WaterObservation,
  AccidentObservation,
  SuccessorConference,
} from '../../types/inspection';
import {
  Flame,
  Droplets,
  Ambulance,
  MessageSquare,
  FileEdit,
  AlertOctagon,
  CheckCircle,
} from 'lucide-react';

interface Step6Props {
  formData: InspectionData;
  onChange: (updates: Partial<InspectionData>) => void;
}

export const Step6Incidents: React.FC<Step6Props> = ({ formData, onChange }) => {
  const gas = formData.gas_observation || { detected: false };
  const water = formData.water_observation || { observed: false };
  const accident = formData.accident_observation || { occurred: false };
  const successor = formData.successor_conference || { conducted: false };

  return (
    <div className="space-y-7">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-sky-600" />
          <span>Stage 6 — Environmental Readings, Incidents & Handover</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Statutory declarations for Sections 13 through 17 under G.S.R. 977(E).
        </p>
      </div>

      {/* SECTION 13: INFLAMMABLE GAS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                13
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>Inflammable Gas Detected (CH₄ / Firedamp)</span>
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Was inflammable gas detected by flame safety lamp or electronic methanometer?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ gas_observation: { detected: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !gas.detected ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No Gas
            </button>
            <button
              type="button"
              onClick={() => onChange({ gas_observation: { ...gas, detected: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                gas.detected ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Gas Detected
            </button>
          </div>
        </div>

        {gas.detected && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  Location of Gas Detection (Required)
                </label>
                <input
                  type="text"
                  value={gas.location || ''}
                  onChange={(e) =>
                    onChange({
                      gas_observation: { ...gas, location: e.target.value },
                    })
                  }
                  placeholder="e.g. Gallery 7 Face / Roof Cavity"
                  required
                  className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  Observed Gas Percentage (Required)
                </label>
                <input
                  type="text"
                  value={gas.gas_percentage || ''}
                  onChange={(e) =>
                    onChange({
                      gas_observation: { ...gas, gas_percentage: e.target.value },
                    })
                  }
                  placeholder="e.g. 0.4% or 0.6%"
                  required
                  className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Enter exact methanometer / flame cap reading
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  Immediate Action Taken (Required)
                </label>
                <input
                  type="text"
                  value={gas.action_taken || ''}
                  onChange={(e) =>
                    onChange({
                      gas_observation: { ...gas, action_taken: e.target.value },
                    })
                  }
                  placeholder="e.g. Workers evacuated, auxiliary ventilation ducting extended"
                  required
                  className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 14: ABNORMAL WATER SEEPAGE */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                14
              </span>
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sky-600" />
                <span>Abnormal Water Seepage</span>
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Was abnormal water seepage, percolation, or flooding observed in the district?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ water_observation: { observed: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !water.observed ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => onChange({ water_observation: { ...water, observed: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                water.observed ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Abnormal Seepage
            </button>
          </div>
        </div>

        {water.observed && (
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  Location (Required)
                </label>
                <input
                  type="text"
                  value={water.location || ''}
                  onChange={(e) =>
                    onChange({
                      water_observation: { ...water, location: e.target.value },
                    })
                  }
                  placeholder="e.g. Gallery 7 Dip Side Floor / Level 3"
                  required
                  className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  Details of Seepage (Required)
                </label>
                <input
                  type="text"
                  value={water.details || ''}
                  onChange={(e) =>
                    onChange({
                      water_observation: { ...water, details: e.target.value },
                    })
                  }
                  placeholder="e.g. Heavy roof dripping and floor water pooling ~10 cm"
                  required
                  className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sky-800 mb-1">
                  Action Taken (Required)
                </label>
                <input
                  type="text"
                  value={water.action_taken || ''}
                  onChange={(e) =>
                    onChange({
                      water_observation: { ...water, action_taken: e.target.value },
                    })
                  }
                  placeholder="e.g. Auxiliary pump started; drain channel cleared"
                  required
                  className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 15: ACCIDENTS */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                15
              </span>
              <span className="flex items-center gap-1.5">
                <Ambulance className="w-4 h-4 text-rose-500" />
                <span>Accident Occurrence</span>
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Did any accident occur in the district during this shift?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ accident_observation: { occurred: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !accident.occurred ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No Accident
            </button>
            <button
              type="button"
              onClick={() => onChange({ accident_observation: { ...accident, occurred: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                accident.occurred ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Accident Reported
            </button>
          </div>
        </div>

        {accident.occurred && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  Cause & Details of Accident (Required)
                </label>
                <textarea
                  rows={2}
                  value={accident.cause_details || ''}
                  onChange={(e) =>
                    onChange({
                      accident_observation: { ...accident, cause_details: e.target.value },
                    })
                  }
                  placeholder="e.g. Miner slipped on tub track and injured right arm while loading"
                  required
                  className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-rose-800 mb-1">
                  First Aid Given By (Required)
                </label>
                <input
                  type="text"
                  value={accident.first_aid_given_by || ''}
                  onChange={(e) =>
                    onChange({
                      accident_observation: { ...accident, first_aid_given_by: e.target.value },
                    })
                  }
                  placeholder="e.g. Rajesh Kumar (Sirdar) / First Aid Station Dresser"
                  required
                  className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />

                <label className="block text-[11px] font-medium text-slate-700 mt-2 mb-1">
                  Additional Medical Remarks / Hospitalization
                </label>
                <input
                  type="text"
                  value={accident.remarks || ''}
                  onChange={(e) =>
                    onChange({
                      accident_observation: { ...accident, remarks: e.target.value },
                    })
                  }
                  placeholder="e.g. Sent to Colliery Hospital by surface ambulance"
                  className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 16: CONFERENCE WITH SUCCESSOR */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
                16
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Conference with Successor (Handover)</span>
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Was shift conference conducted with the relieving Sirdar at Sirdar Station / Inbye?
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => onChange({ successor_conference: { conducted: false } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                !successor.conducted ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onChange({ successor_conference: { ...successor, conducted: true } })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                successor.conducted ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Yes (Conducted)
            </button>
          </div>
        </div>

        {successor.conducted && (
          <div className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200 shadow-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Relieving Sirdar / Successor Name
              </label>
              <input
                type="text"
                value={successor.conveyed_to_person || ''}
                onChange={(e) =>
                  onChange({
                    successor_conference: {
                      ...successor,
                      conveyed_to_person: e.target.value,
                    },
                  })
                }
                placeholder="e.g. S. K. Mukherjee (Afternoon Shift Sirdar)"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Information & Instructions Conveyed
              </label>
              <input
                type="text"
                value={successor.information_conveyed || ''}
                onChange={(e) =>
                  onChange({
                    successor_conference: {
                      ...successor,
                      information_conveyed: e.target.value,
                    },
                  })
                }
                placeholder="e.g. Briefed on pump running at Gallery 7 and additional props set"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 17: OTHER REMARKS / DESCRIPTIVE REPORT */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-sky-100 text-sky-700 text-xs flex items-center justify-center font-bold border border-sky-200">
            17
          </span>
          <span className="flex items-center gap-1.5">
            <FileEdit className="w-4 h-4 text-sky-600" />
            <span>Other Remarks / Descriptive Daily Report</span>
          </span>
        </h4>
        <p className="text-xs text-slate-500">
          General state of the district, machinery operation, electrical apparatus, or any other statutory condition to be recorded under G.S.R. 977(E).
        </p>

        <textarea
          rows={3}
          value={formData.other_remarks || ''}
          onChange={(e) => onChange({ other_remarks: e.target.value })}
          placeholder="District condition normal throughout the shift. Strata stable, ventilation velocity within permissible limits. No other unusual occurrence."
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500 leading-relaxed resize-y mt-2 shadow-xs"
        />
      </div>
    </div>
  );
};
