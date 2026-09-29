import React from 'react';
import { User, SirdarAssignment } from '../types/inspection';
import {
  User as UserIcon,
  Shield,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  HardHat,
  Award,
  Phone,
  Mail,
  Building,
  FileCheck2,
} from 'lucide-react';

interface SirdarProfileProps {
  user: User;
  assignment: SirdarAssignment | null;
  onBackToDashboard: () => void;
  onLogout: () => void;
}

export const SirdarProfile: React.FC<SirdarProfileProps> = ({
  user,
  assignment,
  onBackToDashboard,
  onLogout,
}) => {
  return (
    <div className="space-y-5 pb-8 max-w-2xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Sirdar Profile</h2>
          <p className="text-sm text-slate-500">
            Statutory miner credential & assignment information
          </p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            RK
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
              <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                <Shield className="w-3 h-3 text-blue-600" />
                Statutory Sirdar
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Assigned Area: Galleryify Section
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Employee ID: <span className="font-mono font-semibold text-slate-700">{user.employee_id}</span>
            </p>
            <p className="text-xs text-slate-500">
              Certificate No: <span className="font-mono font-semibold text-slate-700">DGMS/CMR-2017/S-44821</span>
            </p>
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-3 text-slate-700">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Official Email</p>
              <p className="font-semibold text-slate-800">{user.email || 'rajesh.kumar@ecl.coal.gov.in'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Contact Number</p>
              <p className="font-semibold text-slate-800">{user.phone || '+91 98310 12345'}</p>
            </div>
          </div>
        </div>

        {/* Current Statutory Assignment */}
        {assignment && (
          <div className="pt-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Assigned Mine, District & Area
            </h4>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Building className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {assignment.mine.mine_name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {assignment.mine.subsidiary} • {assignment.mine.location}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {assignment.district.district_name} ({assignment.district.seam_name})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Gassy Seam Category: Degree II • Ventilation Split: VS-4
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Assigned Area: Galleryify Section (All Shifts)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Statutory Area Inspection under CMR 129(8) • Continuous Inspection across all operational shifts
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statutory Certifications Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" />
          Statutory Certifications & Authorizations
        </h4>
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-medium text-slate-700">Sirdar's Certificate of Competency</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Valid (CMR 2017)
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-medium text-slate-700">Gas Testing Certificate (DGMS)</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Valid (CMR 2017)
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-medium text-slate-700">First Aid Certificate (St. John Ambulance)</span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Valid
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-xs hover:bg-red-100 transition cursor-pointer"
        >
          Sign Out of MineSafe
        </button>
      </div>
    </div>
  );
};
