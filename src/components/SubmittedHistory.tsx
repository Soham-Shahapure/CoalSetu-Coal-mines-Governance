import React, { useState } from 'react';
import { InspectionSummary } from '../types/inspection';
import {
  FileText,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Search,
  Eye,
  Filter,
} from 'lucide-react';

interface SubmittedHistoryProps {
  inspections: InspectionSummary[];
  onSelectInspection: (id: string) => void;
  onBackToDashboard: () => void;
}

export const SubmittedHistory: React.FC<SubmittedHistoryProps> = ({
  inspections,
  onSelectInspection,
  onBackToDashboard,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');

  const submittedOnly = inspections.filter((i) => i.status === 'SUBMITTED');

  const filtered = submittedOnly.filter((item) => {
    const matchesSearch =
      item.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspection_date.includes(searchTerm) ||
      item.district_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesShift =
      shiftFilter === 'ALL' || item.shift_name.toLowerCase().includes(shiftFilter.toLowerCase());

    return matchesSearch && matchesShift;
  });

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 text-black">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-black uppercase tracking-widest bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
              IMMUTABLE ARCHIVE
            </span>
            <span className="text-xs text-black font-semibold">
              Regulation 129(8) Daily Records
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-black mt-1">
            Submitted Statutory Inspection Reports
          </h2>
          <p className="text-[13px] text-black font-medium">
            Authoritative G.S.R. 977(E) reports submitted and preserved as immutable statutory records
          </p>
        </div>

        <div className="text-right self-start sm:self-auto">
          <span className="text-sm font-bold text-black bg-sky-100 px-3.5 py-1.5 rounded-xl border border-sky-300 shadow-xs">
            {submittedOnly.length} Sealed Records
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border-2 border-slate-300 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4.5 h-4.5 text-black absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Inspection ID (INS-2026-...), date, or district..."
            className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg pl-10 pr-3.5 py-2 text-sm text-black placeholder-slate-500 focus:outline-none focus:bg-white focus:border-sky-500 font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4.5 h-4.5 text-black shrink-0" />
          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="bg-slate-50 border-2 border-slate-200 rounded-lg px-3 py-2 text-sm text-black font-bold focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Shifts</option>
            <option value="Shift 1">Shift 1 (Morning)</option>
            <option value="Shift 2">Shift 2 (Afternoon)</option>
            <option value="Shift 3">Shift 3 (Night)</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <FileText className="w-10 h-10 text-black mx-auto" />
          <p className="text-sm text-black font-medium">
            No submitted statutory inspections match your criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border-2 border-slate-300 hover:border-sky-400 rounded-2xl p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-black">
                    {item.inspection_number}
                  </span>
                  <span className="text-xs bg-emerald-50 text-black border border-emerald-400 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    SUBMITTED • IMMUTABLE
                  </span>
                </div>

                <div className="text-[13px] text-black font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="flex items-center gap-1 text-black font-bold">
                    <Calendar className="w-4 h-4 text-sky-700" />
                    {item.inspection_date}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 text-black font-bold">
                    <Clock className="w-4 h-4 text-sky-700" />
                    {item.shift_name} ({item.shift_hours})
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sky-950 font-bold">
                    {item.district_name} ({item.seam_name})
                  </span>
                </div>

                <div className="text-xs text-black font-medium flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-black" />
                    {item.persons_under_charge} workmen under charge
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold">{item.period_count} inspection rounds</span>
                  <span className="text-slate-400">•</span>
                  <span>
                    {item.deficiency_count > 0 ? (
                      <strong className="text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">{item.deficiency_count} deficiencies</strong>
                    ) : (
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">All 5 areas satisfactory</span>
                    )}
                  </span>
                  {item.gas_detected && (
                    <span className="text-rose-900 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                      Gas Detected
                    </span>
                  )}
                  {item.water_seepage && (
                    <span className="text-sky-950 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-300">
                      Water Seepage
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => onSelectInspection(item.id)}
                  className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 text-black text-sm font-bold rounded-xl border-2 border-sky-300 flex items-center gap-1.5 transition shadow-xs"
                >
                  <Eye className="w-4.5 h-4.5 text-sky-700" />
                  <span>Open Full Record</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
