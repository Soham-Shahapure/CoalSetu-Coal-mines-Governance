import React from 'react';
import { OvermanReportData } from '../types/inspection';
import {
  FileText,
  Eye,
  CheckCircle,
  Clock,
  Lock,
  Calendar,
  Layers,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface OvermanReportsListProps {
  reports: OvermanReportData[];
  onOpenReport: (id: string) => void;
  onCreateNewReport: () => void;
}

export const OvermanReportsList: React.FC<OvermanReportsListProps> = ({
  reports,
  onOpenReport,
  onCreateNewReport,
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-black font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-2 border-slate-300 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="bg-sky-100 text-sky-950 text-xs font-bold px-2 py-0.5 rounded border border-sky-300 uppercase">
              CMR 47(7)(d) • G.S.R. 972(E)
            </span>
            <span className="text-black font-semibold text-xs">
              Daily Inspection Register
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-black">
            Overman Daily Reports History
          </h2>
          <p className="text-xs text-black font-medium mt-1">
            Permanent record of statutory daily inspection reports compiled by the Underground Overman.
          </p>
        </div>

        <button
          onClick={onCreateNewReport}
          className="py-3 px-5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-500/25 cursor-pointer shrink-0"
        >
          <FileText className="w-4 h-4" />
          <span>New Daily Report</span>
        </button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center">
          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-extrabold text-black">No Overman Reports Found</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Initialize your first daily report for today's shift by clicking the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => {
            const isSubmitted = rep.status === 'SUBMITTED';
            const isReady = rep.status === 'READY_FOR_REVIEW';

            return (
              <div
                key={rep.id}
                className="bg-white border-2 border-slate-300 hover:border-sky-400 rounded-2xl p-5 transition shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-black text-black">
                      {rep.report_number}
                    </span>
                    {isSubmitted ? (
                      <span className="bg-emerald-100 text-black border border-emerald-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-800" />
                        Submitted & Sealed (Immutable)
                      </span>
                    ) : isReady ? (
                      <span className="bg-amber-100 text-black border border-amber-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                        Ready for Review & Signing
                      </span>
                    ) : (
                      <span className="bg-sky-100 text-black border border-sky-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                        Draft in Progress
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-black font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>
                      <strong className="font-bold">Overman:</strong> {rep.overman_name} ({rep.overman_employee_id})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">District:</strong> {rep.district_name} ({rep.seam_name})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">Shift:</strong> {rep.shift_name} ({rep.shift_hours})
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>
                      <strong className="font-bold">Date:</strong> {rep.report_date}
                    </span>
                  </div>

                  <div className="text-xs text-black font-semibold">
                    <span className="text-slate-600">Parts Inspected:</span>{' '}
                    <span>{rep.parts_of_mine_inspected || 'General district inspection'}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => onOpenReport(rep.id)}
                    className="w-full md:w-auto py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    {isSubmitted ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>View Sealed Report</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Resume Report</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
