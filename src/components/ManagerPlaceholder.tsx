import React from 'react';
import { User } from '../types/inspection';
import {
  Shield,
  Layers,
  HardHat,
  Cpu,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  LogOut,
  MapPin,
  Building2,
  Lock,
} from 'lucide-react';

interface ManagerPlaceholderProps {
  user: User;
  onLogout: () => void;
}

export const ManagerPlaceholder: React.FC<ManagerPlaceholderProps> = ({ user, onLogout }) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8 text-black font-sans">
      {/* Top Statutory Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-purple-50/60 to-white border-2 border-purple-300 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="bg-purple-100 text-purple-950 text-xs font-extrabold px-3 py-1 rounded-full border border-purple-300 uppercase tracking-wider">
                DGMS STATUTORY CMR 2017 • REGULATION 27
              </span>
              <span className="text-black font-bold text-xs bg-white px-2.5 py-1 rounded-full border border-slate-200">
                Management Workspace
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
              Manager Governance Dashboard
            </h2>
            <div className="text-sm text-purple-950 font-bold">
              Area-level mine management and governance information
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-black font-medium pt-1">
              <span className="flex items-center gap-1 font-extrabold">
                <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
                Jhanjhra Area Colliery Headquarters
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-extrabold">
                Colliery Manager: {user.name} ({user.employee_id})
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={onLogout}
              className="py-2.5 px-4 bg-white hover:bg-slate-100 text-black font-bold text-xs rounded-xl border-2 border-slate-300 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4 text-slate-700" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Notice Card */}
      <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border-2 border-purple-300 flex items-center justify-center text-purple-800 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-black">
              Statutory Manager Scope & Governance Architecture
            </h3>
            <p className="text-xs text-black font-medium mt-1 leading-relaxed">
              Under Regulation 27 of the Coal Mines Regulations 2017, the Colliery Manager holds overall statutory responsibility for the control, management, and direction of the mine. In this phased architecture, Sirdar (CMR 129(8)) and Overman (CMR 47(7)(d)) daily workflows form the immutable evidence base for consolidated Manager intelligence.
            </p>
          </div>
        </div>

        {/* Phase Roadmap Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Phase 1 */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-sky-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-300 uppercase">
                Phase 1 Active
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-extrabold text-black">
              Underground Sirdar System
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              CMR 129(8) Form G.S.R. 977(E). Statutory shift inspections, hazard logs, offline tolerance, and immutable source records.
            </p>
          </div>

          {/* Phase 2 */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300 uppercase">
                Phase 2 Active
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-sm font-extrabold text-black">
              Overman Daily Report
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              CMR 47(7)(d) Form G.S.R. 972(E). Deterministic Sirdar data mapping into Sections A–N, source audit traceability, and immutable sealed reports.
            </p>
          </div>

          {/* Phase 3 */}
          <div className="bg-purple-50/60 border-2 border-purple-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-purple-900 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 uppercase">
                Manager Workspace
              </span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-sm font-extrabold text-black">
              Manager AI Intelligence
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Consolidated mine-wide safety indices, statutory audit logs, cross-district trend analysis, and statutory escalation governance.
            </p>
          </div>
        </div>

        {/* Demo Switcher Quick Links */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="text-xs font-extrabold text-black uppercase tracking-wider">
            DEMO MODE — Test Active Operational Roles:
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onLogout}
              className="w-full sm:w-auto py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Switch to Mining Sirdar (S001)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="w-full sm:w-auto py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Switch to Underground Overman (O001)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
