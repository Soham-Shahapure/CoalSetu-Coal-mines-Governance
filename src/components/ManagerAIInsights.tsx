import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Archive, BrainCircuit, CheckCircle2, ChevronDown, FileSearch, History, LoaderCircle, RefreshCw, RotateCcw, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { api } from '../services/api';
import type { ManagerMineProfile } from '../types/manager';

interface Props { mines: ManagerMineProfile[] }
type Scope = 'AREA' | 'MINE';
const stages: Record<string, string> = {
  PREPARING_EVIDENCE: 'Preparing Evidence', ANALYZING_PATTERNS: 'Analyzing Patterns',
  VALIDATING_EVIDENCE: 'Validating Evidence', SAVING_REPORT: 'Saving Report', COMPLETED: 'Completed', FAILED: 'Generation failed',
};
const dateLabel = (value?: string) => value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const categoryLabel = (value: string) => value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

export const ManagerAIInsights: React.FC<Props> = ({ mines }) => {
  const [scope, setScope] = useState<Scope>('AREA');
  const [mineId, setMineId] = useState(mines[0]?.mine_id || '');
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30 | 90>(30);
  const [generation, setGeneration] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [evidence, setEvidence] = useState<Record<string, any>>({});
  const [expandedEvidence, setExpandedEvidence] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.listManagerAIInsights({ archived: showArchived });
      setHistory(data.reports || []);
    } catch (err: any) { setError(err.message || 'Unable to load report history.'); }
  }, [showArchived]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.getManagerAIInsightsStatus(), api.listManagerAIInsights({ archived: showArchived })])
      .then(([active, list]) => { if (alive) { if (active) setGeneration(active); setHistory(list.reports || []); } })
      .catch((err: any) => { if (alive) setError(err.message || 'Unable to initialize AI insights.'); });
    return () => { alive = false; };
  }, [showArchived]);

  useEffect(() => {
    if (!generation?.requestId || !['RUNNING'].includes(generation.status)) return;
    let alive = true;
    const poll = async () => {
      try {
        const next = await api.getManagerAIInsightRequest(generation.requestId);
        if (!alive) return;
        if (next.status === 'COMPLETED' && next.reportId) {
          // Fetch the saved report before changing status: changing RUNNING -> COMPLETED
          // cleans up this polling effect, so doing it first could invalidate `alive`
          // before the report fetch finishes and leave the button stuck on Generating.
          const report = await api.getManagerAIInsight(next.reportId);
          if (alive) {
            setSelectedReport(report);
            setGenerating(false);
            setError('');
            setGeneration(next);
            void loadHistory();
          }
        } else {
          setGeneration(next);
          if (next.status === 'FAILED' && alive) {
            setGenerating(false);
            setError(next.error || 'Generation failed.');
          }
        }
      } catch (err: any) { if (alive) setError(err.message || 'Unable to check generation progress.'); }
    };
    const timer = window.setInterval(poll, 1600);
    void poll();
    return () => { alive = false; window.clearInterval(timer); };
  }, [generation?.requestId, generation?.status, loadHistory]);

  const startGeneration = async () => {
    setError(''); setSelectedReport(null); setEvidence({}); setExpandedEvidence(null); setGenerating(true);
    try {
      const req = await api.generateManagerAIInsights({ scopeType: scope, ...(scope === 'MINE' ? { scopeId: mineId } : {}), periodDays });
      setGeneration(req);
    } catch (err: any) { setGenerating(false); setError(err.message || 'Unable to start generation.'); }
  };

  const openReport = async (reportId: string) => {
    setLoadingReport(true); setError(''); setEvidence({}); setExpandedEvidence(null);
    try { setSelectedReport(await api.getManagerAIInsight(reportId)); }
    catch (err: any) { setError(err.message || 'Unable to open report.'); }
    finally { setLoadingReport(false); }
  };

  const changeArchive = async (report: any) => {
    setError('');
    try {
      await api.archiveManagerAIInsight(report.reportId, report.status === 'ARCHIVED');
      if (selectedReport?.reportId === report.reportId) setSelectedReport(await api.getManagerAIInsight(report.reportId));
      await loadHistory();
    } catch (err: any) { setError(err.message || 'Unable to update report.'); }
  };

  const toggleEvidence = async (reportId: string, evidenceId: string) => {
    const key = `${reportId}:${evidenceId}`;
    if (expandedEvidence === key) { setExpandedEvidence(null); return; }
    setExpandedEvidence(key);
    if (evidence[key]) return;
    try { const item = await api.getManagerAIInsightEvidence(reportId, evidenceId); setEvidence(old => ({ ...old, [key]: item })); }
    catch (err: any) { setError(err.message || 'Supporting evidence is unavailable.'); }
  };

  const renderFinding = (finding: any, report: any, index: number) => (
    <article key={`${finding.title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
      <h4 className="font-extrabold text-sm text-slate-900">{finding.title}</h4>
      <p className="text-sm text-slate-700 leading-relaxed">{finding.summary}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {(finding.evidenceIds || []).map((id: string) => {
          const key = `${report.reportId}:${id}`;
          const item = evidence[key];
          return <button key={id} type="button" onClick={() => toggleEvidence(report.reportId, id)} className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-800 hover:bg-sky-100"><FileSearch className="h-3.5 w-3.5" /> Evidence {id.slice(-8)} <ChevronDown className={`h-3 w-3 transition ${expandedEvidence === key ? 'rotate-180' : ''}`} /></button>;
        })}
      </div>
      {(finding.evidenceIds || []).map((id: string) => {
        const key = `${report.reportId}:${id}`; const item = evidence[key];
        return expandedEvidence === key && item ? <div key={key} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1"><div className="font-extrabold">{item.mineName} · {item.sourceNumber}</div><div>{categoryLabel(item.category)} · {item.severity} · {dateLabel(item.observedAt)}</div><div className="font-semibold">{item.title}</div><p className="text-slate-700">{item.description}</p>{item.actionRecorded && <p><span className="font-bold">Recorded action:</span> {item.actionRecorded}</p>}</div> : null;
      })}
    </article>
  );

  return <section id="manager-ai-insights" className="scroll-mt-6 rounded-3xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white p-4 sm:p-6 space-y-5">
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
      <div className="flex gap-3"><div className="rounded-2xl bg-sky-100 p-3 h-fit"><BrainCircuit className="h-6 w-6 text-sky-800" /></div><div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-extrabold text-slate-950">AI Governance Insights</h2><span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">Advisory</span></div><p className="mt-1 text-sm text-slate-600 max-w-2xl">Generate evidence-linked summaries of recurring patterns and areas that merit human review. The existing governance score is not changed by AI.</p></div></div>
      <button type="button" onClick={() => { setShowArchived(v => !v); setSelectedReport(null); }} className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"><History className="h-4 w-4" /> {showArchived ? 'View Active History' : 'View Archived Reports'}</button>
    </div>

    {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span><button className="ml-auto font-bold" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}

    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <label className="space-y-1.5 text-xs font-extrabold text-slate-600">Analysis scope<select value={scope} onChange={e => setScope(e.target.value as Scope)} disabled={generating} className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"><option value="AREA">Entire authorized area</option><option value="MINE">Selected mine</option></select></label>
      <label className="space-y-1.5 text-xs font-extrabold text-slate-600">Mine{scope === 'AREA' ? ' (not applicable)' : ''}<select value={mineId} onChange={e => setMineId(e.target.value)} disabled={generating || scope === 'AREA'} className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900">{mines.map(m => <option key={m.mine_id} value={m.mine_id}>{m.mine_name}</option>)}</select></label>
      <label className="space-y-1.5 text-xs font-extrabold text-slate-600">Analysis period<select value={periodDays} onChange={e => setPeriodDays(Number(e.target.value) as 7 | 14 | 30 | 90)} disabled={generating} className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900">{[7, 14, 30, 90].map(d => <option key={d} value={d}>{d} days</option>)}</select></label>
      <div className="flex items-end"><button type="button" onClick={startGeneration} disabled={generating || (scope === 'MINE' && !mineId)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-800 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">{generating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{generating ? 'Generating…' : 'Generate AI Insights'}</button></div>
    </div>

    {(generation?.status === 'RUNNING' || generation?.status === 'COMPLETED') && <div className="rounded-2xl border border-sky-200 bg-white p-4 space-y-3"><div className="flex items-center gap-2">{generation.status === 'RUNNING' ? <LoaderCircle className="h-4 w-4 animate-spin text-sky-700" /> : <CheckCircle2 className="h-4 w-4 text-emerald-700" />}<span className="font-extrabold text-sm">{generation.status === 'COMPLETED' ? 'Report generated and saved' : (stages[generation.stage] || 'Processing request')}</span>{generation.status === 'RUNNING' && <span className="ml-auto text-xs text-slate-500">Request continues if you leave this page</span>}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{['PREPARING_EVIDENCE','ANALYZING_PATTERNS','VALIDATING_EVIDENCE','SAVING_REPORT'].map((stage, i) => { const current = ['PREPARING_EVIDENCE','ANALYZING_PATTERNS','VALIDATING_EVIDENCE','SAVING_REPORT'].indexOf(generation.stage); const completed = generation.status === 'COMPLETED' || i < current; const active = generation.status === 'RUNNING' && i === current; return <div key={stage} className={`rounded-lg px-2 py-2 text-center text-xs font-bold border ${completed ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : active ? 'bg-sky-100 border-sky-300 text-sky-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{completed ? '✓ ' : ''}{stages[stage]}</div>; })}</div></div>}
    {generation?.status === 'COMPLETED' && !selectedReport && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm font-bold text-emerald-900 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Report saved successfully.</div>}

    {selectedReport && <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{selectedReport.scopeLabel} · AI Insights</h3><span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${selectedReport.status === 'ARCHIVED' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>{selectedReport.status}</span></div><p className="text-xs text-slate-500 mt-1">Generated {dateLabel(selectedReport.createdAt)} · {selectedReport.periodDays}-day period · {new Date(selectedReport.periodStart).toLocaleDateString('en-IN')} – {new Date(selectedReport.periodEnd).toLocaleDateString('en-IN')}</p></div><div className="flex flex-wrap gap-2"><button onClick={() => changeArchive(selectedReport)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">{selectedReport.status === 'ARCHIVED' ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}{selectedReport.status === 'ARCHIVED' ? 'Restore' : 'Archive'}</button><button onClick={() => setSelectedReport(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">Close report</button></div></div>
      <div className="p-4 sm:p-5 space-y-5"><div className="rounded-xl bg-sky-50 border border-sky-100 p-4"><h4 className="font-extrabold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-sky-700" /> Area Summary</h4><p className="text-sm text-slate-700 mt-2 leading-relaxed">{selectedReport.sections.areaSummary}</p></div>
        <div><h4 className="font-extrabold text-sm flex items-center gap-2 mb-3"><RefreshCw className="h-4 w-4 text-sky-700" /> Recurring Patterns</h4>{selectedReport.sections.recurringPatterns.length ? <div className="space-y-3">{selectedReport.sections.recurringPatterns.map((f: any, i: number) => renderFinding(f, selectedReport, i))}</div> : <p className="text-sm text-slate-500">No recurring pattern was supported by the supplied evidence.</p>}</div>
        <div><h4 className="font-extrabold text-sm flex items-center gap-2 mb-3"><Target className="h-4 w-4 text-amber-700" /> Areas Requiring Attention</h4>{selectedReport.sections.attentionAreas.length ? <div className="space-y-3">{selectedReport.sections.attentionAreas.map((f: any, i: number) => renderFinding(f, selectedReport, i))}</div> : <p className="text-sm text-slate-500">No additional attention area was returned. This is not a declaration that conditions are safe.</p>}</div>
        <div className="rounded-xl border border-slate-200 p-4"><h4 className="font-extrabold text-sm flex items-center gap-2"><FileSearch className="h-4 w-4 text-sky-700" /> Supporting Evidence</h4><p className="text-xs text-slate-500 mt-1">{selectedReport.dataCoverage.submittedRecords} source records · {selectedReport.dataCoverage.observations} observations · {selectedReport.dataCoverage.level} coverage</p><p className="text-xs text-slate-600 mt-2">{selectedReport.dataCoverage.note}</p><div className="mt-3 flex flex-wrap gap-2">{selectedReport.evidenceSnapshot.slice(0, 12).map((e: any) => <button key={e.id} onClick={() => toggleEvidence(selectedReport.reportId, e.id)} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold hover:bg-sky-50">{e.sourceNumber} · {categoryLabel(e.category)}</button>)}</div>{selectedReport.evidenceSnapshot.slice(0, 12).map((e: any) => { const key = `${selectedReport.reportId}:${e.id}`; const item = evidence[key]; return expandedEvidence === key && item ? <div key={key} className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs"><div className="font-extrabold">{item.mineName} · {item.sourceNumber}</div><div>{categoryLabel(item.category)} · {item.severity} · {dateLabel(item.observedAt)}</div><div className="font-semibold mt-1">{item.title}</div><p className="mt-1">{item.description}</p></div> : null; })}</div>
        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1"><span>Model: {selectedReport.modelId}</span><span>Prompt: {selectedReport.promptVersion}</span><span>Report ID: {selectedReport.reportId}</span></div>
      </div>
    </div>}

    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden"><div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200"><div><h3 className="font-extrabold flex items-center gap-2"><History className="h-4 w-4 text-sky-700" /> {showArchived ? 'Archived Reports' : 'AI Insight History'}</h3><p className="text-xs text-slate-500 mt-1">Previously generated reports remain unchanged when source data changes.</p></div><button onClick={() => { void loadHistory(); }} className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50" title="Refresh history"><RefreshCw className="h-4 w-4" /></button></div>
      {loadingReport && <div className="p-4 text-sm text-slate-500">Opening saved report…</div>}
      {history.length === 0 ? <div className="p-6 text-center"><History className="h-7 w-7 text-slate-300 mx-auto" /><p className="mt-2 text-sm font-bold text-slate-600">No {showArchived ? 'archived' : 'saved'} reports yet</p><p className="mt-1 text-xs text-slate-500">Generate an insight report to create a historical record.</p></div> : <div className="divide-y divide-slate-100">{history.map(report => <div key={report.reportId} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3"><div className="flex-1 min-w-0"><div className="font-extrabold text-sm text-slate-900">{report.scopeLabel}</div><div className="text-xs text-slate-500 mt-1">{dateLabel(report.createdAt)} · {report.periodDays} days · {report.dataCoverage?.observations ?? 0} observations</div></div><div className="flex gap-2"><button onClick={() => openReport(report.reportId)} className="rounded-lg bg-sky-800 px-3 py-2 text-xs font-extrabold text-white hover:bg-sky-900">View Report</button><button onClick={() => changeArchive(report)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50">{showArchived ? 'Restore' : 'Archive'}</button></div></div>)}</div>}
    </div>
    <div className="flex items-start gap-2 text-[11px] text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0" /><span>AI output is advisory and evidence-linked. It cannot change source reports or the deterministic governance score. Coverage is a data-volume heuristic, not AI confidence or proof of safety.</span></div>
  </section>;
};
