import React, { useState } from 'react';
import { InspectionSummary } from '../types/inspection';
import { api } from '../services/api';
import {
  Clock,
  Calendar,
  Users,
  Play,
  Trash2,
  AlertCircle,
  FileEdit,
} from 'lucide-react';

interface DraftsListProps {
  drafts: InspectionSummary[];
  onResumeDraft: (id?: string) => void;
  onRefresh: () => void;
}

export const DraftsList: React.FC<DraftsListProps> = ({
  drafts,
  onResumeDraft,
  onRefresh,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to discard this unsubmitted draft?')) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      await api.deleteDraft(id);
      onRefresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete draft.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-16 space-y-6 text-black">
      {/* Header */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-black uppercase tracking-widest bg-sky-100 px-2.5 py-0.5 rounded border border-sky-300">
              UNSUBMITTED WORKING COPIES
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-black mt-1">
            My Shift Inspection Drafts
          </h2>
          <p className="text-[13px] text-black font-medium">
            Editable inspection records in progress. Drafts are private and not visible as official statutory submissions.
          </p>
        </div>
      </div>

      {deleteError && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <Clock className="w-10 h-10 text-black mx-auto" />
          <p className="text-sm text-black font-medium">
            You have no active drafts in progress.
          </p>
          <button
            onClick={() => onResumeDraft()}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-black text-sm font-extrabold rounded-xl transition shadow-xs border-2 border-sky-600"
          >
            Start New Inspection
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="bg-white border-2 border-slate-300 hover:border-sky-400 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-black">
                    {d.inspection_number || 'DRAFT'}
                  </span>
                  <span className="text-xs bg-sky-100 text-black border border-sky-300 px-2.5 py-0.5 rounded-full font-bold">
                    IN PROGRESS
                  </span>
                </div>

                <div className="text-[13px] text-black font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="flex items-center gap-1 text-black font-bold">
                    <Calendar className="w-4 h-4 text-sky-700" />
                    {d.inspection_date}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold">{d.shift_name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-sky-950 font-bold">{d.district_name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-4 h-4 text-black" />
                    {d.persons_under_charge} workmen
                  </span>
                </div>

                <div className="text-xs text-black font-medium">
                  Last updated: {new Date(d.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => onResumeDraft(d.id)}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-black text-sm font-extrabold rounded-xl flex items-center gap-1.5 transition shadow-xs border-2 border-sky-600"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume Form</span>
                </button>

                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={deletingId === d.id}
                  className="p-2.5 text-black hover:text-rose-700 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                  title="Discard Draft"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
