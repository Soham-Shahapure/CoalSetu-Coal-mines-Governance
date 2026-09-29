import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Plus, X, UserRound, CalendarDays, Link2, AlertCircle, CheckCircle2, Eye, FileCheck, RotateCcw, Loader2 } from 'lucide-react';
import { CorrectiveTask, CorrectiveTaskPriority, ManagerMineDetail } from '../types/manager';
import { api } from '../services/api';

interface Props {
  selectedMine: ManagerMineDetail | null;
  initialObservationId?: string | null;
  onCreated: (task: CorrectiveTask) => void;
}

const priorityTone = (priority: CorrectiveTaskPriority) => {
  if (priority === 'CRITICAL') return 'text-rose-800 bg-rose-50 border-rose-200';
  if (priority === 'HIGH') return 'text-amber-800 bg-amber-50 border-amber-200';
  if (priority === 'MEDIUM') return 'text-sky-800 bg-sky-50 border-sky-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
};

const statusTone = (status: string) => {
  if (status === 'VERIFIED') return 'text-emerald-800 bg-emerald-50 border-emerald-200';
  if (status === 'SUBMITTED_FOR_VERIFICATION') return 'text-sky-800 bg-sky-50 border-sky-200';
  if (status === 'IN_PROGRESS') return 'text-amber-800 bg-amber-50 border-amber-200';
  if (status === 'CANCELLED') return 'text-slate-600 bg-slate-100 border-slate-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
};

export const ManagerCorrectiveActions: React.FC<Props> = ({ selectedMine, initialObservationId, onCreated }) => {
  const [tasks, setTasks] = useState<CorrectiveTask[]>([]);
  const [assignees, setAssignees] = useState<Array<{ user_id: string | null; name: string; employee_id: string; role: 'OVERMAN' }>>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CorrectiveTaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeKey, setAssigneeKey] = useState('');
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [reviewTask, setReviewTask] = useState<CorrectiveTask | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);

  const loadTasks = async () => {
    if (!selectedMine) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.getManagerTasks(selectedMine.mine_id);
      setTasks(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load corrective actions.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = async (observationId?: string) => {
    if (!selectedMine) return;
    try {
      setError('');
      const options = await api.getManagerTaskAssignees(selectedMine.mine_id);
      setAssignees(options);
      setAssigneeKey(options[0] ? `${options[0].user_id || 'none'}:${options[0].employee_id}` : '');
      setSourceIds(observationId ? [observationId] : []);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      setShowCreate(true);
    } catch (err: any) {
      setError(err.message || 'Unable to prepare corrective action.');
    }
  };

  useEffect(() => { loadTasks(); }, [selectedMine?.mine_id]);
  useEffect(() => { if (selectedMine && initialObservationId) openCreate(initialObservationId); }, [selectedMine?.mine_id, initialObservationId]);

  const selectedAssignee = useMemo(() => assignees.find((a) => `${a.user_id || 'none'}:${a.employee_id}` === assigneeKey), [assignees, assigneeKey]);
  const sourceCount = sourceIds.length;

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMine || !selectedAssignee) return;
    try {
      setSaving(true);
      setError('');
      const task = await api.createManagerTask({
        mine_id: selectedMine.mine_id,
        title,
        description,
        priority,
        due_date: dueDate,
        assigned_to_user_id: selectedAssignee.user_id,
        assigned_to_employee_id: selectedAssignee.employee_id,
        source_observation_ids: sourceIds,
      });
      setTasks((current) => [task, ...current]);
      setShowCreate(false);
      onCreated(task);
    } catch (err: any) {
      setError(err.message || 'Unable to create corrective action.');
    } finally {
      setSaving(false);
    }
  };

  const verifyTask = async () => {
    if (!reviewTask) return;
    try {
      setReviewSaving(true); setError('');
      await api.verifyManagerTask(reviewTask.id, reviewNote);
      setReviewTask(null); setReviewNote(''); setReturnReason('');
      await loadTasks();
    } catch (err: any) { setError(err.message || 'Unable to verify corrective action.'); }
    finally { setReviewSaving(false); }
  };

  const returnTask = async () => {
    if (!reviewTask || !returnReason.trim()) return;
    try {
      setReviewSaving(true); setError('');
      await api.returnManagerTask(reviewTask.id, returnReason.trim());
      setReviewTask(null); setReviewNote(''); setReturnReason('');
      await loadTasks();
    } catch (err: any) { setError(err.message || 'Unable to return corrective action.'); }
    finally { setReviewSaving(false); }
  };

  return (
    <section className="bg-white border-2 border-slate-200 rounded-3xl overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg">Corrective Actions</h2>
          <p className="text-xs text-slate-500 mt-1">Actions created by the Manager and assigned to the responsible Overman.</p>
        </div>
        <button type="button" disabled={!selectedMine} onClick={() => openCreate()} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-extrabold disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-4 h-4" /> Create Corrective Action
        </button>
      </div>

      {error && <div className="mx-5 mt-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl px-3 py-2 text-xs font-semibold flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}

      {!selectedMine ? (
        <div className="p-5 text-sm text-slate-500">Select a mine to view and create corrective actions.</div>
      ) : loading ? (
        <div className="p-5 text-sm text-slate-500">Loading corrective actions…</div>
      ) : tasks.length === 0 ? (
        <div className="p-5 text-sm text-slate-500">No corrective actions have been created for this mine.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[1.7fr_.8fr_.8fr_1fr] gap-3 items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2"><span className="font-extrabold text-sm">{task.title}</span><span className="text-[10px] text-slate-400 font-bold">{task.task_number}</span></div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
                {task.source_observation_ids.length > 0 && <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-sky-700 font-bold"><Link2 className="w-3 h-3" /> Linked to {task.source_observation_ids.length} observation{task.source_observation_ids.length === 1 ? '' : 's'}</div>}
              </div>
              <div><div className="text-[10px] uppercase text-slate-400 font-bold">Priority</div><span className={`inline-flex mt-1 px-2 py-1 rounded-lg border text-[10px] font-black ${priorityTone(task.priority)}`}>{task.priority}</span></div>
              <div><div className="text-[10px] uppercase text-slate-400 font-bold">Status</div><span className={`inline-flex mt-1 px-2 py-1 rounded-lg border text-[10px] font-black ${statusTone(task.status)}`}>{task.status.replace(/_/g, ' ')}</span></div>
              <div className="text-xs text-slate-600"><div className="flex items-center gap-1 font-bold"><UserRound className="w-3.5 h-3.5 text-sky-700" />{task.assigned_to.name}</div><div className="flex items-center gap-1 mt-1"><CalendarDays className="w-3.5 h-3.5 text-sky-700" />Due {new Date(`${task.due_date}T00:00:00`).toLocaleDateString('en-IN')}</div>{task.status === 'SUBMITTED_FOR_VERIFICATION' && <button type="button" onClick={() => { setReviewTask(task); setReviewNote(''); setReturnReason(''); }} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 text-white font-extrabold hover:bg-sky-700"><Eye className="w-3.5 h-3.5" />Review Submission</button>}</div>
            </div>
          ))}
        </div>
      )}

      {showCreate && selectedMine && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <form onSubmit={createTask} className="w-full max-w-2xl bg-white rounded-3xl border-2 border-sky-300 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between"><div><h3 className="text-lg font-extrabold">Create Corrective Action</h3><p className="text-xs text-slate-500 mt-1">{selectedMine.mine_name}</p></div><button type="button" onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div><label className="text-xs font-bold text-slate-700">Action title</label><input value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-sky-500 outline-none" placeholder="Enter the action required" /></div>
              <div><label className="text-xs font-bold text-slate-700">Description / instruction</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-sky-500 outline-none resize-none" placeholder="Describe what needs to be done" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-xs font-bold text-slate-700">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value as CorrectiveTaskPriority)} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></div>
                <div><label className="text-xs font-bold text-slate-700">Due date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-700">Assigned to</label><select value={assigneeKey} onChange={(e) => setAssigneeKey(e.target.value)} required className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white">{assignees.map((a) => <option key={`${a.user_id || 'none'}:${a.employee_id}`} value={`${a.user_id || 'none'}:${a.employee_id}`}>{a.name}</option>)}</select></div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-sm font-extrabold"><Link2 className="w-4 h-4 text-sky-700" />Supporting observations</div>
                <p className="text-xs text-slate-500 mt-1">Linking evidence is optional. The Manager decides whether this action is required.</p>
                <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                  {selectedMine.observations.map((observation) => <label key={observation.id} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={sourceIds.includes(observation.id)} onChange={(e) => setSourceIds((ids) => e.target.checked ? [...ids, observation.id] : ids.filter((id) => id !== observation.id))} className="mt-0.5 accent-sky-600" /><span><span className="font-bold">{observation.title}</span><span className="block text-slate-500">{observation.source_number}</span></span></label>)}
                </div>
                {sourceCount === 0 && <div className="text-[11px] text-slate-400 mt-2">No observations linked.</div>}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-2"><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold">Cancel</button><button type="submit" disabled={saving || !selectedAssignee} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-extrabold disabled:opacity-50">{saving ? 'Creating…' : 'Create Corrective Action'}</button></div>
          </form>
        </div>
      )}

      {reviewTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl bg-white rounded-3xl border-2 border-sky-300 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3"><div><h3 className="text-lg font-extrabold">Review Corrective Action</h3><p className="text-xs text-slate-500 mt-1">{reviewTask.task_number} · {reviewTask.mine_name}</p></div><button type="button" onClick={() => setReviewTask(null)} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button></div>
            <div className="p-5 space-y-4 max-h-[68vh] overflow-y-auto">
              <div><h4 className="font-extrabold">{reviewTask.title}</h4><p className="text-sm text-slate-600 mt-1">{reviewTask.description}</p></div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-extrabold text-slate-700">Work reported by {reviewTask.assigned_to.name}</div><p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{reviewTask.work_summary || 'No work summary supplied.'}</p></div>
              <div><h4 className="text-sm font-extrabold">Supporting evidence ({reviewTask.evidence.length})</h4>{reviewTask.evidence.length === 0 ? <p className="text-sm text-slate-500 mt-2">No evidence items were submitted.</p> : <div className="mt-2 space-y-2">{reviewTask.evidence.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="text-xs font-extrabold">{item.name || (item.type === 'NOTE' ? 'Evidence note' : 'Attachment')}</div>{item.description && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{item.description}</p>}{item.data_url && <a href={item.data_url} target="_blank" rel="noreferrer" download={item.name || 'corrective-action-evidence'} className="inline-flex items-center gap-1 mt-2 text-sm text-sky-700 underline font-bold"><FileCheck className="w-4 h-4" />Open evidence attachment</a>}</div>)}</div>}</div>
              <div className="text-xs text-slate-500">Submitted {reviewTask.submitted_at ? new Date(reviewTask.submitted_at).toLocaleString('en-IN') : '—'}</div>
              <div className="rounded-2xl border border-slate-200 p-4"><h4 className="text-sm font-extrabold">Action history</h4><div className="mt-3 space-y-3">{reviewTask.audit_history.map((event) => <div key={event.id} className="flex gap-3 text-xs"><div className="mt-1.5 w-2 h-2 rounded-full bg-sky-600 shrink-0" /><div><div className="font-extrabold">{event.event.replace(/_/g, ' ')}</div><div className="text-slate-500 mt-0.5">{event.actor_name} · {new Date(event.occurred_at).toLocaleString('en-IN')}</div>{event.note && <p className="text-slate-600 mt-1 whitespace-pre-wrap">{event.note}</p>}</div></div>)}</div></div>
              <div><label className="block text-xs font-extrabold text-slate-700">Verification note (optional)</label><textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} rows={2} maxLength={2000} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sky-500" placeholder="Record any verification details." /></div>
              <div><label className="block text-xs font-extrabold text-slate-700">Reason for return (required to return)</label><textarea value={returnReason} onChange={(e) => setReturnReason(e.target.value)} rows={2} maxLength={2000} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-sky-500" placeholder="Explain what further work or evidence is required." /></div>
            </div>
            <div className="p-5 border-t border-slate-200 flex flex-wrap justify-end gap-2"><button type="button" disabled={reviewSaving || !returnReason.trim()} onClick={returnTask} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-amber-300 text-amber-900 bg-amber-50 text-sm font-extrabold disabled:opacity-50"><RotateCcw className="w-4 h-4" />{reviewSaving ? 'Saving…' : 'Return for Further Work'}</button><button type="button" disabled={reviewSaving} onClick={verifyTask} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold disabled:opacity-50"><CheckCircle2 className="w-4 h-4" />{reviewSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}Verify Action</button></div>
          </div>
        </div>
      )}
    </section>
  );
};
