import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, ClipboardCheck, FileUp, Loader2, Send, UserRound, Wrench } from 'lucide-react';
import { CorrectiveTask } from '../types/manager';
import { api } from '../services/api';

const priorityTone = (priority: string) => priority === 'CRITICAL' ? 'text-rose-800 bg-rose-50 border-rose-200' : priority === 'HIGH' ? 'text-amber-800 bg-amber-50 border-amber-200' : priority === 'MEDIUM' ? 'text-sky-800 bg-sky-50 border-sky-200' : 'text-slate-700 bg-slate-100 border-slate-200';
const statusTone = (status: string) => status === 'VERIFIED' ? 'text-emerald-800 bg-emerald-50 border-emerald-200' : status === 'SUBMITTED_FOR_VERIFICATION' ? 'text-sky-800 bg-sky-50 border-sky-200' : status === 'IN_PROGRESS' ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-slate-700 bg-slate-100 border-slate-200';
const prettyStatus = (status: string) => status.replace(/_/g, ' ');
const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unable to read attachment.'));
  reader.onerror = () => reject(new Error('Unable to read attachment.'));
  reader.readAsDataURL(file);
});

export const OvermanCorrectiveActions: React.FC = () => {
  const [tasks, setTasks] = useState<CorrectiveTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [workSummary, setWorkSummary] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const loadTasks = async () => {
    setError('');
    try { setTasks(await api.getOvermanTasks()); }
    catch (err: any) { setError(err.message || 'Unable to load corrective actions.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTasks(); }, []);

  const startTask = async (task: CorrectiveTask) => {
    try {
      setSaving(true); setError('');
      await api.startOvermanTask(task.id);
      setActiveTaskId(task.id); setWorkSummary(''); setEvidenceNote(''); setAttachment(null);
      await loadTasks();
    } catch (err: any) { setError(err.message || 'Unable to start corrective action.'); }
    finally { setSaving(false); }
  };

  const submitWork = async (event: React.FormEvent, task: CorrectiveTask) => {
    event.preventDefault();
    if (!workSummary.trim() || (!evidenceNote.trim() && !attachment)) {
      setError('Enter the work completed and add an evidence note or attachment.');
      return;
    }
    if (attachment && attachment.size > 3 * 1024 * 1024) {
      setError('The attachment must be 3 MB or smaller.'); return;
    }
    if (attachment && !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(attachment.type)) {
      setError('Attach a PNG, JPEG, WEBP image or PDF document.'); return;
    }
    try {
      setSaving(true); setError('');
      const evidence: Array<{ type: 'NOTE' | 'IMAGE' | 'DOCUMENT'; name?: string; description?: string; data_url?: string }> = [];
      if (evidenceNote.trim()) evidence.push({ type: 'NOTE', description: evidenceNote.trim() });
      if (attachment) evidence.push({ type: attachment.type === 'application/pdf' ? 'DOCUMENT' : 'IMAGE', name: attachment.name, description: 'Supporting attachment', data_url: await readFileAsDataUrl(attachment) });
      await api.submitOvermanTask(task.id, { work_summary: workSummary.trim(), evidence });
      setActiveTaskId(null); setWorkSummary(''); setEvidenceNote(''); setAttachment(null);
      await loadTasks();
    } catch (err: any) { setError(err.message || 'Unable to submit corrective action.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-black font-sans">
      <div className="bg-gradient-to-r from-sky-50 via-sky-50/60 to-white border-2 border-sky-300 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-3"><ClipboardCheck className="w-6 h-6 text-sky-700" /><div><h2 className="text-2xl font-extrabold">Corrective Actions</h2><p className="text-sm text-slate-600 mt-1">Review assigned actions, record completed work and submit evidence.</p></div></div>
      </div>
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl px-4 py-3 text-sm font-semibold flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {loading ? <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 text-sm text-slate-500">Loading corrective actions…</div> : tasks.length === 0 ? <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 text-center"><CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" /><h3 className="font-extrabold mt-3">No corrective actions assigned</h3><p className="text-sm text-slate-500 mt-1">New actions assigned by the Manager will appear here.</p></div> : <div className="space-y-3">{tasks.map((task) => (
        <div key={task.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{task.title}</h3><span className="text-[10px] font-bold text-slate-400">{task.task_number}</span></div><p className="text-sm text-slate-600 mt-2 leading-relaxed">{task.description}</p></div>
            <div className="flex flex-wrap gap-2 shrink-0"><span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black ${priorityTone(task.priority)}`}>{task.priority}</span><span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black ${statusTone(task.status)}`}>{prettyStatus(task.status)}</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-5 text-xs text-slate-600"><span className="inline-flex items-center gap-1.5 font-bold"><UserRound className="w-3.5 h-3.5 text-sky-700" />Assigned by {task.created_by.name}</span><span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-sky-700" />Due {new Date(`${task.due_date}T00:00:00`).toLocaleDateString('en-IN')}</span></div>
          {task.return_note && task.status === 'IN_PROGRESS' && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><div className="text-xs font-extrabold text-amber-900">Manager requested further work</div><p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">{task.return_note}</p></div>}
          {task.work_summary && <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs font-extrabold text-slate-700">Work completed</div><p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{task.work_summary}</p></div>}
          {task.evidence?.length > 0 && <div className="mt-3"><div className="text-xs font-extrabold text-slate-700">Submitted evidence</div><div className="mt-2 flex flex-wrap gap-2">{task.evidence.map((item) => <div key={item.id} className="text-xs border border-slate-200 bg-white rounded-lg px-3 py-2 max-w-full">{item.name && <div className="font-bold break-all">{item.name}</div>}{item.description && <div className="text-slate-600 whitespace-pre-wrap">{item.description}</div>}{item.data_url && <a className="inline-block mt-1 text-sky-700 underline font-bold" href={item.data_url} download={item.name || 'corrective-action-evidence'} target="_blank" rel="noreferrer">Open attachment</a>}</div>)}</div></div>}
          {task.verification_note && task.status === 'VERIFIED' && <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-900"><div className="font-extrabold">Manager verification</div><p className="mt-1 whitespace-pre-wrap">{task.verification_note}</p></div>}
          <details className="mt-4 text-xs text-slate-600"><summary className="cursor-pointer font-extrabold text-sky-800">View action history ({task.audit_history.length})</summary><div className="mt-3 space-y-3 border-l-2 border-sky-100 pl-3">{task.audit_history.map((event) => <div key={event.id}><div className="font-extrabold">{event.event.replace(/_/g, ' ')}</div><div className="text-slate-500 mt-0.5">{event.actor_name} · {new Date(event.occurred_at).toLocaleString('en-IN')}</div>{event.note && <p className="mt-1 whitespace-pre-wrap">{event.note}</p>}</div>)}</div></details>
          {task.status === 'OPEN' && <button type="button" disabled={saving} onClick={() => startTask(task)} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-extrabold disabled:opacity-50"><Wrench className="w-4 h-4" />{saving ? 'Starting…' : 'Start Action'}</button>}
          {task.status === 'IN_PROGRESS' && <div className="mt-4">
            {activeTaskId !== task.id ? <button type="button" onClick={() => { setActiveTaskId(task.id); setWorkSummary(task.work_summary || ''); setEvidenceNote(''); setAttachment(null); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-extrabold"><Send className="w-4 h-4" />Record Work & Submit Evidence</button> : <form onSubmit={(e) => submitWork(e, task)} className="rounded-2xl border-2 border-sky-200 bg-sky-50/50 p-4 space-y-3">
              <div><label className="block text-xs font-extrabold text-slate-700">Work completed</label><textarea value={workSummary} onChange={(e) => setWorkSummary(e.target.value)} required rows={3} maxLength={5000} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-sky-500" placeholder="Describe the corrective work performed and the result." /></div>
              <div><label className="block text-xs font-extrabold text-slate-700">Evidence note</label><textarea value={evidenceNote} onChange={(e) => setEvidenceNote(e.target.value)} rows={2} maxLength={2000} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-sky-500" placeholder="Record inspection findings, measurements or other supporting details." /></div>
              <div><label className="block text-xs font-extrabold text-slate-700">Optional photo or PDF</label><label className="mt-1 flex items-center gap-2 border-2 border-dashed border-slate-300 rounded-xl px-3 py-3 bg-white text-sm cursor-pointer hover:border-sky-400"><FileUp className="w-4 h-4 text-sky-700 shrink-0" /><span className="truncate">{attachment ? attachment.name : 'Choose PNG, JPEG, WEBP or PDF (max 3 MB)'}</span><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={(e) => setAttachment(e.target.files?.[0] || null)} /></label>{attachment && <button type="button" onClick={() => setAttachment(null)} className="text-xs text-rose-700 underline mt-1">Remove attachment</button>}</div>
              <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setActiveTaskId(null)} className="px-4 py-2 rounded-xl border-2 border-slate-200 bg-white text-sm font-bold">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-extrabold disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{saving ? 'Submitting…' : 'Submit for Verification'}</button></div>
            </form>}
          </div>}
          {task.status === 'SUBMITTED_FOR_VERIFICATION' && <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">Submitted to the Manager for verification. You can review the submitted work and evidence above.</div>}
          {task.status === 'VERIFIED' && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Verified by the Manager.</div>}
        </div>
      ))}</div>}
    </div>
  );
};
