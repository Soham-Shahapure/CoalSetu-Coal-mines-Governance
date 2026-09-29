import React from 'react';
import { User } from '../types/inspection';
import {
  FileText,
  Clock,
  LogOut,
  HardHat,
  Shield,
  Layers,
  ChevronRight,
  Users,
  Award,
  ClipboardCheck,
} from 'lucide-react';

export type AppTab =
  | 'dashboard'
  | 'wizard'
  | 'drafts'
  | 'history'
  | 'profile'
  | 'overman-dashboard'
  | 'overman-report'
  | 'overman-sirdar'
  | 'overman-history'
  | 'overman-actions'
  | 'manager-dashboard';

interface HeaderProps {
  user: User;
  mineName?: string;
  districtName?: string;
  seamName?: string;
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;
  draftCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  mineName = 'Jhanjhra Underground Mine',
  districtName = 'Panel 4',
  seamName = 'Seam III',
  currentTab,
  onTabChange,
  onLogout,
  draftCount,
}) => {
  const isOverman = user.role === 'OVERMAN';
  const isManager = user.role === 'MANAGER';

  return (
    <header className="bg-white text-black border-b border-slate-300 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Statutory Header */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-sky-50 border-2 border-sky-300 flex items-center justify-center text-sky-700 shrink-0 shadow-xs">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold tracking-widest text-sky-950 uppercase bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                {isManager
                  ? 'DGMS STATUTORY CMR 2017 REG 27'
                  : isOverman
                  ? 'DGMS STATUTORY CMR 47(7)(d)'
                  : 'DGMS STATUTORY CMR 129(8)'}
              </span>
              <span className="text-xs text-black font-semibold hidden sm:inline">
                {isManager
                  ? 'COLLIERY HEADQUARTERS'
                  : isOverman
                  ? 'FORM G.S.R. 972(E)'
                  : 'FORM G.S.R. 977(E)'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-black flex items-center gap-1.5 mt-0.5">
              <span>
                {isManager
                  ? 'Colliery Management Portal'
                  : isOverman
                  ? 'Underground Overman Digital System'
                  : 'Underground Sirdar Digital System'}
              </span>
            </h1>
            <p className="text-[13px] text-black flex items-center gap-1.5 font-medium">
              <span className="text-black font-bold">{mineName}</span>
              <span>•</span>
              <span className="text-sky-900 font-bold">
                {isManager ? 'Jhanjhra Area Headquarters' : `${districtName} (${seamName})`}
              </span>
            </p>
          </div>
        </div>

        {/* User Badge & Actions */}
        <div className="flex items-center justify-between md:justify-end space-x-3 pt-1 md:pt-0 border-t md:border-t-0 border-slate-200">
          <div className="text-right">
            <div className="text-sm font-bold text-black flex items-center gap-1.5 justify-end">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>{user.name}</span>
              <span className="text-xs bg-slate-100 text-black px-2 py-0.5 rounded border border-slate-300 font-mono font-bold">
                {user.employee_id}
              </span>
            </div>
            <div className="text-xs text-black font-medium mt-0.5">
              Designation:{' '}
              <span className="text-sky-900 font-bold">
                {isManager
                  ? 'Manager'
                  : isOverman
                  ? 'Statutory Underground Overman'
                  : 'Underground Mining Sirdar'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="p-2 text-black hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-300 hover:border-rose-300 transition cursor-pointer"
            title="Sign out of statutory terminal"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className={`${isManager ? 'hidden' : 'bg-slate-50 border-t border-slate-300'}`}>
        <div className={`${isOverman ? 'w-full max-w-none px-4 lg:px-6' : 'max-w-6xl mx-auto px-4'} py-2.5 sm:py-3`}>
          <nav aria-label="Main Navigation" className="w-full">
            {!isManager && (isOverman ? (
              // OVERMAN TABS
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 w-full items-stretch">
                <button
                  type="button"
                  onClick={() => onTabChange('overman-dashboard')}
                  className={`group flex min-w-0 items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-sm xl:text-[15px] font-bold transition-all duration-150 cursor-pointer flex-nowrap whitespace-nowrap ${
                    currentTab === 'overman-dashboard'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <Layers
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'overman-dashboard' ? 'text-sky-900' : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="whitespace-nowrap">Overman Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('overman-report')}
                  className={`group flex min-w-0 items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-sm xl:text-[15px] font-bold transition-all duration-150 cursor-pointer flex-nowrap whitespace-nowrap ${
                    currentTab === 'overman-report'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <FileText
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'overman-report' ? 'text-sky-900' : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="whitespace-nowrap">Daily Report (CMR 47)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('overman-sirdar')}
                  className={`group flex min-w-0 items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-sm xl:text-[15px] font-bold transition-all duration-150 cursor-pointer flex-nowrap whitespace-nowrap ${
                    currentTab === 'overman-sirdar'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <Users
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'overman-sirdar' ? 'text-sky-900' : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="whitespace-nowrap">Received Sirdar Records</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('overman-actions')}
                  className={`group flex min-w-0 items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-sm xl:text-[15px] font-bold transition-all duration-150 cursor-pointer flex-nowrap whitespace-nowrap ${
                    currentTab === 'overman-actions'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <ClipboardCheck
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'overman-actions' ? 'text-sky-900' : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="whitespace-nowrap">Corrective Actions</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('overman-history')}
                  className={`group flex min-w-0 items-center justify-center gap-2 px-3 py-3.5 rounded-xl text-sm xl:text-[15px] font-bold transition-all duration-150 cursor-pointer flex-nowrap whitespace-nowrap ${
                    currentTab === 'overman-history'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <Shield
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'overman-history' ? 'text-sky-900' : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="whitespace-nowrap">Report History</span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded whitespace-nowrap shrink-0 ${
                      currentTab === 'overman-history'
                        ? 'bg-sky-200 text-black border border-sky-600'
                        : 'bg-slate-100 text-black border border-slate-300'
                    }`}
                  >
                    Immutable
                  </span>
                </button>
              </div>
            ) : (
              // SIRDAR TABS (100% UNCHANGED)
              <div
                className={`grid gap-2.5 sm:gap-3 w-full ${
                  draftCount > 0
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onTabChange('dashboard')}
                  className={`group flex items-center justify-center gap-2.5 py-3.5 px-4 sm:py-4 sm:px-6 rounded-xl text-base sm:text-[17px] font-bold transition-all duration-150 cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <Layers
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'dashboard'
                        ? 'text-sky-900'
                        : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">Sirdar Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('wizard')}
                  className={`group flex items-center justify-center gap-2.5 py-3.5 px-4 sm:py-4 sm:px-6 rounded-xl text-base sm:text-[17px] font-bold transition-all duration-150 cursor-pointer ${
                    currentTab === 'wizard'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <ClipboardCheck
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'wizard'
                        ? 'text-sky-900'
                        : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">Shift Inspection Form</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTabChange('history')}
                  className={`group flex items-center justify-center gap-2 sm:gap-2.5 py-3.5 px-4 sm:py-4 sm:px-6 rounded-xl text-base sm:text-[17px] font-bold transition-all duration-150 cursor-pointer ${
                    currentTab === 'history'
                      ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                      : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                  }`}
                >
                  <FileText
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      currentTab === 'history'
                        ? 'text-sky-900'
                        : 'text-black group-hover:scale-110'
                    }`}
                  />
                  <span className="truncate">Submitted Records</span>
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      currentTab === 'history'
                        ? 'bg-sky-200 text-black border border-sky-600'
                        : 'bg-slate-100 text-black border border-slate-300'
                    }`}
                  >
                    Immutable
                  </span>
                </button>

                {draftCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onTabChange('drafts')}
                    className={`group flex items-center justify-center gap-2 sm:gap-2.5 py-3.5 px-4 sm:py-4 sm:px-6 rounded-xl text-base sm:text-[17px] font-bold transition-all duration-150 cursor-pointer ${
                      currentTab === 'drafts'
                        ? 'bg-sky-100 text-black shadow-md border-2 border-sky-600 ring-2 ring-sky-500/25'
                        : 'bg-white text-black hover:bg-sky-50/70 border-2 border-slate-300 shadow-xs hover:border-sky-400'
                    }`}
                  >
                    <Clock
                      className={`w-5 h-5 shrink-0 transition-transform ${
                        currentTab === 'drafts'
                          ? 'text-sky-900'
                          : 'text-black group-hover:scale-110'
                      }`}
                    />
                    <span className="truncate">Drafts</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        currentTab === 'drafts'
                          ? 'bg-amber-200 text-black border border-amber-400'
                          : 'bg-amber-100 text-black border border-amber-300'
                      }`}
                    >
                      {draftCount}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
