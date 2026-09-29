import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Database,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Gauge,
  Info,
  Layers3,
  RefreshCw,
  TrendingUp,
  ClipboardCheck,
  ListChecks,
  Search,
  SlidersHorizontal,
  BrainCircuit,
} from 'lucide-react';
import { User } from '../types/inspection';
import { ManagerMineDetail, ManagerMineProfile, ManagerOverview } from '../types/manager';
import { api } from '../services/api';
import { ManagerCorrectiveActions } from './ManagerCorrectiveActions';
import { ManagerAIInsights } from './ManagerAIInsights';

interface ManagerDashboardProps {
  user: User;
  onLogout: () => void;
}

const categoryLabel = (category: string) => category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const scoreTone = (score: number | null) => {
  if (score === null) return 'text-slate-500 bg-slate-100 border-slate-200';
  if (score >= 70) return 'text-rose-800 bg-rose-50 border-rose-200';
  if (score >= 45) return 'text-amber-800 bg-amber-50 border-amber-200';
  return 'text-emerald-800 bg-emerald-50 border-emerald-200';
};

const confidenceTone = (level: string) => {
  if (level === 'HIGH') return 'text-emerald-800 bg-emerald-50 border-emerald-200';
  if (level === 'MEDIUM') return 'text-amber-800 bg-amber-50 border-amber-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
};


export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, onLogout }) => {
  const [overview, setOverview] = useState<ManagerOverview | null>(null);
  const [selectedMine, setSelectedMine] = useState<ManagerMineDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskObservationId, setTaskObservationId] = useState<string | null>(null);

  const loadOverview = async (keepMine = true) => {
    try {
      setError('');
      setLoading(true);
      const data = await api.getManagerOverview();
      setOverview(data);
      if (!keepMine || !selectedMine) {
        const first = data.mines[0];
        if (first) await loadMine(first.mine_id);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load Manager analytics.');
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async (mineId: string) => {
    try {
      setDetailLoading(true);
      const detail = await api.getManagerMineDetail(mineId);
      setSelectedMine(detail);
    } catch (err: any) {
      setError(err.message || 'Unable to load mine profile.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(false);
    // Intentionally load once when the Manager workspace opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProfile = useMemo<ManagerMineProfile | null>(() => {
    if (!overview || !selectedMine) return null;
    return overview.mines.find((mine) => mine.mine_id === selectedMine.mine_id) || null;
  }, [overview, selectedMine]);

  const areaMetrics = useMemo(() => {
    if (!overview) return { average: null, higherAttention: 0, liveMines: 0, demoMines: 0 };
    const scored = overview.mines.filter((mine) => typeof mine.risk_score === 'number');
    return {
      average: scored.length ? Math.round(scored.reduce((sum, mine) => sum + (mine.risk_score || 0), 0) / scored.length) : null,
      higherAttention: scored.filter((mine) => (mine.risk_score || 0) >= 70).length,
      liveMines: overview.mines.filter((mine) => mine.data_source === 'LIVE_OPERATIONAL_DATA').length,
      demoMines: overview.mines.filter((mine) => mine.data_source === 'REPRESENTATIVE_DEMO_DATA').length,
    };
  }, [overview]);

  if (loading && !overview) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-700 font-semibold">
          <RefreshCw className="w-5 h-5 animate-spin" /> Loading management data…
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 space-y-4">
        <AlertTriangle className="w-8 h-8 text-rose-600" />
        <h2 className="text-xl font-extrabold">Manager analytics unavailable</h2>
        <p className="text-sm text-slate-600">{error || 'The Manager data service did not return an overview.'}</p>
        <button onClick={() => loadOverview(false)} className="px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm">Retry</button>
      </div>
    );
  }

  const score = selectedMine?.risk_score ?? null;
  const components = selectedMine?.risk_components;

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-gradient-to-br from-sky-100 via-sky-50 to-white border-2 border-sky-300 rounded-3xl px-7 py-6 sm:px-9 sm:py-7 shadow-sm">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-extrabold tracking-wide text-sky-950 uppercase">Manager</div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black mt-1.5">Manager Governance Dashboard</h1>
            <p className="text-slate-700 text-sm mt-1.5">{overview.area.name} · Underground Operations</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-xs text-slate-700 pt-1">
            <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4 text-sky-700" /> {user.name} · {user.employee_id}</span>
            <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4 text-sky-700" /> {overview.area.name} · Underground Operations</span>
          </div>
        </div>
      </div>

      <nav aria-label="Manager dashboard sections" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-2.5">
        {[
          { label: 'Mine Profiles', target: 'mine-governance-profile', Icon: Building2 },
          { label: 'Risk & Details', target: 'selected-mine-details', Icon: Gauge },
          { label: 'Corrective Actions', target: 'manager-corrective-actions', Icon: ListChecks },
          { label: 'Recent Observations', target: 'recent-observations', Icon: Search },
          { label: 'Score Method', target: 'governance-score-method', Icon: SlidersHorizontal },
          { label: 'AI Insights', target: 'manager-ai-insights', Icon: BrainCircuit },
        ].map(({ label, target, Icon }) => (
          <button
            key={target}
            type="button"
            onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="min-w-0 min-h-[54px] flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <Icon className="h-4 w-4 shrink-0 text-sky-700" />
            <span className="text-center leading-tight">{label}</span>
          </button>
        ))}
      </nav>

      {error && <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</div>}

      <ManagerAIInsights mines={overview.mines} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Mines', overview.area.mine_count, Building2],
          ['Submitted Records', overview.summary.submitted_records, FileText],
          ['Normalized observations', overview.summary.observations, AlertTriangle],
          ['Recurring Categories', overview.summary.recurring_categories, TrendingUp],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="bg-white border-2 border-slate-200 rounded-2xl p-4">
            <Icon className="w-5 h-5 text-sky-600" />
            <div className="text-2xl font-black mt-3">{value}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sky-700"><Gauge className="w-5 h-5" /><span className="text-xs font-extrabold uppercase tracking-wide">Area observed risk</span></div>
          <div className="text-3xl font-black mt-3">{areaMetrics.average ?? '—'}<span className="text-sm font-bold text-slate-400"> / 100</span></div>
          <p className="text-xs text-slate-500 mt-1">Average of available mine scores.</p>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sky-700"><Layers3 className="w-5 h-5" /><span className="text-xs font-extrabold uppercase tracking-wide">Mine data coverage</span></div>
          <div className="text-3xl font-black mt-3">{areaMetrics.liveMines} <span className="text-sm font-bold text-slate-500">live</span></div>
          <p className="text-xs text-slate-500 mt-1">{areaMetrics.demoMines} representative demo mine{areaMetrics.demoMines === 1 ? '' : 's'} included included in the area view.</p>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sky-700"><TrendingUp className="w-5 h-5" /><span className="text-xs font-extrabold uppercase tracking-wide">Higher observed-risk signals</span></div>
          <div className="text-3xl font-black mt-3">{areaMetrics.higherAttention}</div>
          <p className="text-xs text-slate-500 mt-1">Mines currently at 70+ on the 0–100 governance indicator.</p>
        </div>
      </section>

      <section id="mine-governance-profile" className="scroll-mt-6 bg-white border-2 border-slate-200 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-lg">Mine Governance Profile</h2>
            <p className="text-xs text-slate-500 mt-1">Select a mine to inspect its evidence, recurring patterns and score contributors.</p>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">Area mine view</span>
        </div>
        <div className="divide-y divide-slate-100">
          {overview.mines.map((mine) => (
            <button key={mine.mine_id} onClick={() => loadMine(mine.mine_id)} className={`w-full text-left p-4 sm:p-5 hover:bg-slate-50 transition ${selectedMine?.mine_id === mine.mine_id ? 'bg-sky-50/50' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-[1.8fr_.7fr_.7fr_.8fr_1fr_auto] gap-3 items-center">
                <div>
                  <div className="font-extrabold text-sm">{mine.mine_name}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{mine.data_source === 'LIVE_OPERATIONAL_DATA' ? 'Live demo data' : 'Representative demo data'}</div>
                </div>
                <div><div className="text-[10px] text-slate-400 font-bold uppercase">Risk</div><span className={`inline-flex mt-1 px-2 py-1 rounded-lg border text-sm font-black ${scoreTone(mine.risk_score)}`}>{mine.risk_score ?? '—'}/100</span></div>
                <div><div className="text-[10px] text-slate-400 font-bold uppercase">Records</div><div className="font-black mt-1">{mine.report_count}</div></div>
                <div><div className="text-[10px] text-slate-400 font-bold uppercase">Observations</div><div className="font-black mt-1">{mine.observation_count}</div></div>
                <div><div className="text-[10px] text-slate-400 font-bold uppercase">Confidence</div><span className={`inline-flex mt-1 px-2 py-1 rounded-lg border text-[10px] font-black ${confidenceTone(mine.data_confidence.level)}`}>{mine.data_confidence.level}</span></div>
                <ChevronRight className="w-5 h-5 text-slate-400 justify-self-end" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedMine && selectedProfile && (
        <section id="selected-mine-details" className="scroll-mt-6 grid grid-cols-1 xl:grid-cols-[1.25fr_.75fr] gap-6">
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-sky-600">Selected Mine</div>
                <h2 className="text-xl font-extrabold mt-1">{selectedMine.mine_name}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedMine.location}</p>
              </div>
              <div className={`rounded-2xl border-2 px-5 py-3 ${scoreTone(score)}`}>
                <div className="text-[10px] uppercase font-extrabold tracking-wider">Governance Risk Score</div>
                <div className="text-3xl font-black mt-1">{score ?? '—'} <span className="text-sm font-bold">/ 100</span></div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-900">Management indicator based on observed inspection data.</strong> Higher values indicate a higher observed governance burden in the available data. This is not a statutory DGMS risk rating. Corrective tasks are never created automatically.
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3"><h3 className="font-extrabold">Risk contributors</h3><span className="text-[10px] text-slate-500 font-bold">Normalized indicator scores</span></div>
              <div className="space-y-4">
                {[
                  { key: 'severity_weighted_observations', label: 'Severity-weighted observations', value: components?.severity_weighted_observations, weight: 25, description: 'Counts observed issues with higher analytical weight for HIGH-severity categories, relative to submitted records.' },
                  { key: 'recurring_observation_rate', label: 'Recurring observation rate', value: components?.recurring_observation_rate, weight: 20, description: 'Measures how many observed categories appear two or more times in the available records.' },
                  { key: 'observation_burden', label: 'Observation burden', value: components?.observation_burden, weight: 15, description: 'Measures the number of normalized observations relative to submitted records.' },
                  { key: 'overdue_action_rate', label: 'Overdue actions', value: components?.overdue_action_rate, weight: 20, description: 'Reflects overdue corrective actions once action records and due dates are available.' },
                  { key: 'closure_performance_risk', label: 'Closure performance', value: components?.closure_performance_risk, weight: 10, description: 'Reflects the proportion of corrective actions that remain unclosed.' },
                  { key: 'closure_time_risk', label: 'Closure time', value: components?.closure_time_risk, weight: 10, description: 'Reflects how long corrective actions take to close.' },
                ].map((item) => {
                  const breakdown = components?.breakdown?.find((part) => part.key === item.key);
                  const value = item.value;
                  return (
                    <div key={item.key}>
                      <div className="flex justify-between text-xs font-bold mb-1 gap-3"><span>{item.label} <span className="text-[10px] text-slate-400">({item.weight}% weight)</span></span><span className="text-slate-700 whitespace-nowrap">{value === null || value === undefined ? 'Not available yet' : `${value}/100`}</span></div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">{typeof value === 'number' && <div className="h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, value)}%` }} />}</div>
                      {typeof value === 'number' && breakdown?.weighted_contribution !== null && breakdown?.weighted_contribution !== undefined && <p className="text-[10px] text-sky-800 font-semibold mt-1">Contribution to current overall score: {breakdown.weighted_contribution.toFixed(1)} points</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5">
              <div className="flex items-center gap-2"><Database className="w-5 h-5 text-sky-600" /><h3 className="font-extrabold">Data coverage & confidence</h3></div>
              <div className="flex items-center gap-2 mt-3"><span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black ${confidenceTone(selectedMine.data_confidence.level)}`}>{selectedMine.data_confidence.level} COVERAGE</span></div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">{selectedMine.data_confidence.reports_analyzed} submitted records and {selectedMine.data_confidence.observations_analyzed} normalized observations analyzed.</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400 font-bold">Submitted records</div><div className="font-black mt-1">{selectedMine.data_confidence.reports_analyzed}</div></div>
                <div className="bg-slate-50 rounded-xl p-3"><div className="text-[10px] text-slate-400 font-bold">Normalized observations</div><div className="font-black mt-1">{selectedMine.data_confidence.observations_analyzed}</div></div>
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5">
              <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-sky-600" /><h3 className="font-extrabold">Recurring patterns</h3></div>
              {selectedMine.recurring_patterns.length === 0 ? <p className="text-xs text-slate-500 mt-3">No recurring pattern detected in the available records.</p> : <div className="space-y-3 mt-4">{selectedMine.recurring_patterns.slice(0, 5).map((pattern) => <div key={pattern.category} className="border border-slate-200 rounded-xl p-3"><div className="flex justify-between gap-3"><span className="font-extrabold text-sm">{categoryLabel(pattern.category)}</span><span className="text-xs font-black text-sky-700">{pattern.occurrence_count}×</span></div><p className="text-xs text-slate-500 mt-1">{pattern.description}</p></div>)}</div>}
            </div>
          </div>
        </section>
      )}

      {selectedMine && (
        <div id="manager-corrective-actions" className="scroll-mt-6">
          <ManagerCorrectiveActions
            selectedMine={selectedMine}
            initialObservationId={taskObservationId}
            onCreated={() => setTaskObservationId(null)}
          />
        </div>
      )}

      {selectedMine && (
        <section id="recent-observations" className="scroll-mt-6 bg-white border-2 border-slate-200 rounded-3xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div><h2 className="font-extrabold">Recent observations</h2><p className="text-xs text-slate-500 mt-1">Evidence surfaced for Manager review — not automatically converted into tasks.</p></div>{detailLoading && <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />}</div>
          <div className="divide-y divide-slate-100">
            {selectedMine.observations.slice(0, 8).map((observation) => (
              <div key={observation.id} className="p-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 rounded px-2 py-1">{categoryLabel(observation.category)}</span><span className="text-[10px] font-extrabold uppercase text-slate-400">{observation.source_number}</span></div><div className="font-bold text-sm mt-2">{observation.title}</div><p className="text-xs text-slate-600 mt-1 leading-relaxed">{observation.description}</p><button type="button" onClick={() => setTaskObservationId(observation.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-700 hover:text-sky-900"><ClipboardCheck className="w-3.5 h-3.5" /> Create action from this observation</button></div>
                <div className="md:text-right text-xs text-slate-500"><div className="font-bold">{new Date(observation.observed_at).toLocaleDateString('en-IN')}</div><div className="mt-1">Analytical weight: {observation.severity}</div><div className="mt-1 inline-flex items-center gap-1 text-slate-400"><Clock3 className="w-3 h-3" /> No manager action recorded</div></div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="governance-score-method" className="scroll-mt-6 bg-white border-2 border-slate-200 rounded-3xl p-5">
        <div className="flex items-start gap-3">
          <Gauge className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold">How the governance score is produced</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">Each available factor is normalized to a 0–100 indicator score, then combined using its listed weight. A component score of 50/100 is not a 50% chance of an accident: it is a normalized signal for that factor. For example, a score of 50 with a 20% weight contributes 10 points before any rescaling for unavailable components. Missing components are excluded rather than treated as zero risk. These prototype thresholds are management heuristics, not DGMS-prescribed scoring rules.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
              {[
                ['Severity-weighted observations', '25%', 'Counts observed issues with higher analytical weight for HIGH-severity categories, relative to submitted records.'],
                ['Recurring observation rate', '20%', 'Measures how many observed categories appear two or more times in the available records.'],
                ['Observation burden', '15%', 'Measures the number of normalized observations relative to submitted records.'],
                ['Overdue actions', '20%', 'Reflects overdue corrective actions once action records and due dates are available.'],
                ['Closure performance', '10%', 'Reflects the proportion of corrective actions that remain unclosed.'],
                ['Closure time', '10%', 'Reflects how long corrective actions take to close.'],
              ].map(([label, weight, description]) => (
                <div key={label} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3"><div className="text-[11px] font-extrabold">{label}</div><div className="text-[11px] text-sky-700 font-black shrink-0">{weight}</div></div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1.5">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-3 text-[11px] text-slate-500 bg-slate-100 border border-slate-200 rounded-2xl p-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Submitted Sirdar and Overman records remain immutable. Manager analytics aggregates submitted evidence; corrective actions are created only by the Manager.</span>
      </div>
    </div>
  );
};
