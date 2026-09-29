import React from 'react';
import { Home, ClipboardCheck, History, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'dashboard' | 'wizard' | 'history' | 'profile';
  onTabChange: (tab: 'dashboard' | 'wizard' | 'history' | 'profile') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg md:hidden">
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-2">
        {/* 1. Home */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Home Dashboard"
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">Home</span>
        </button>

        {/* 2. Inspection (Visually Emphasized) */}
        <button
          onClick={() => onTabChange('wizard')}
          className="flex flex-col items-center justify-center min-h-[44px] -mt-3 group"
          aria-label="Shift Inspection Form"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
              currentTab === 'wizard'
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <span
            className={`text-[11px] font-bold mt-1 ${
              currentTab === 'wizard' ? 'text-blue-600' : 'text-slate-700'
            }`}
          >
            Inspection
          </span>
        </button>

        {/* 3. History */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Inspection History"
        >
          <History className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">History</span>
        </button>

        {/* 4. Profile */}
        <button
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            currentTab === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-label="Sirdar Profile"
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] font-medium mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};
