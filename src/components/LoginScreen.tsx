import React, { useState } from 'react';
import { api } from '../services/api';
import { User, DEMO_ACCOUNTS } from '../types/inspection';
import { HardHat, ShieldCheck, AlertCircle, ArrowRight, UserCheck, Lock, Award } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState<string>('O001');
  const [password, setPassword] = useState<string>('overman123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please enter Employee ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(employeeId.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (id: string, role: string) => {
    setEmployeeId(id);
    setPassword(role === 'OVERMAN' ? 'overman123' : role === 'MANAGER' ? 'manager123' : 'sirdar123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8 text-black">
      {/* Container */}
      <div className="w-full max-w-lg">
        {/* Emblem & Statutory Banner */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 border-2 border-sky-400 text-sky-700 mb-3 shadow-md shadow-sky-100">
            <HardHat className="w-9 h-9" />
          </div>
          <div className="inline-block bg-white border-2 border-slate-300 px-3 py-1 rounded-full text-xs font-bold text-sky-900 uppercase tracking-widest mb-1.5 shadow-xs">
            GOVERNMENT OF INDIA • DGMS STATUTORY
          </div>
          <h2 className="text-2xl font-extrabold text-black tracking-tight">
            Underground Coal Mine Governance Portal
          </h2>
          <p className="text-xs text-black font-medium mt-1 max-w-sm mx-auto">
            Statutory Sirdar (CMR 129(8)) & Overman Daily Inspection (CMR 47(7)(d) / G.S.R. 972(E)) Digital Systems
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-7 shadow-lg">
          <div className="border-b-2 border-slate-100 pb-3 mb-5">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <Lock className="w-4.5 h-4.5 text-sky-700" />
              <span>Statutory User Authentication</span>
            </h3>
            <p className="text-xs text-black font-medium mt-0.5">
              Enter your DGMS certificate or employee identification credential
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Employee ID / Certificate Registration No.
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  placeholder="e.g. O001, S001"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-black placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-600 font-mono uppercase font-bold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-black mb-1">
                Demo Authentication PIN
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. overman123 or demo PIN"
                required
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-black placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In (Demo Mode)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Quick-Select */}
          <div className="mt-6 pt-5 border-t-2 border-slate-100">
            <div className="text-xs font-extrabold text-black uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>DEMO MODE — Select Demonstration Persona</span>
              <span className="text-[11px] bg-sky-100 text-sky-950 font-bold px-2 py-0.5 rounded border border-sky-300">
                Secure Sign-in
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = employeeId === acc.employee_id;
                const roleColor =
                  acc.role === 'OVERMAN'
                    ? 'border-indigo-400 bg-indigo-50/70 text-indigo-950'
                    : acc.role === 'MANAGER'
                    ? 'border-purple-400 bg-purple-50/70 text-purple-950'
                    : 'border-sky-400 bg-sky-50/70 text-sky-950';

                const badgeColor =
                  acc.role === 'OVERMAN'
                    ? 'bg-indigo-600 text-white'
                    : acc.role === 'MANAGER'
                    ? 'bg-purple-600 text-white'
                    : 'bg-sky-600 text-white';

                return (
                  <button
                    key={acc.employee_id}
                    type="button"
                    onClick={() => selectDemoUser(acc.employee_id, acc.role)}
                    className={`p-3 rounded-xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? `${roleColor} ring-2 ring-sky-500/30 shadow-xs`
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-sky-700 shrink-0" />
                        <span className="text-sm font-extrabold text-black">{acc.name}</span>
                        <span className="font-mono text-xs font-bold text-black">({acc.employee_id})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${badgeColor}`}>
                          {acc.role}
                        </span>
                      </div>
                      <div className="text-xs text-black font-semibold mt-1">
                        {acc.designation}
                      </div>
                      <div className="text-[11px] text-slate-700 font-medium">
                        {acc.assignment_hint}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border-2 ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-slate-100 text-black border-slate-300'
                      }`}
                    >
                      {isSelected ? 'Active' : 'Select'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Statutory Compliance Footer Notice */}
        <div className="mt-5 text-center text-black text-xs font-semibold space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-black font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Immutable Statutory Source Record Principle Enforced</span>
          </p>
          <p className="text-slate-600 text-[11px]">
            Submitted records are sealed against modification under Coal Mines Regulations (CMR) 2017.
          </p>
        </div>
      </div>
    </div>
  );
};
