import {
  User,
  SirdarAssignment,
  Shift,
  InspectionData,
  InspectionSummary,
  OvermanAssignment,
  OvermanReportData,
} from '../types/inspection';
import { ManagerOverview, ManagerMineProfile, ManagerMineDetail, CorrectiveTask, CorrectiveTaskPriority } from '../types/manager';
import { offlineStorage } from './offlineStorage';

const TOKEN_KEY = 'coal_mine_sirdar_token';
const USER_KEY = 'coal_mine_sirdar_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setAuth: (token: string, user: User) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const getHeaders = () => {
  const token = authStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  login: async (employeeId: string, password?: string): Promise<{ token: string; user: User }> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed. Please check Employee ID.');
    }

    const data = await res.json();
    authStorage.setAuth(data.token, data.user);
    return data;
  },

  getMyAssignment: async (): Promise<SirdarAssignment> => {
    const res = await fetch('/api/my-assignment', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load Sirdar district assignment.');
    }
    return res.json();
  },

  getShifts: async (): Promise<Shift[]> => {
    const res = await fetch('/api/shifts', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch shifts.');
    return res.json();
  },

  getMyInspections: async (): Promise<InspectionSummary[]> => {
    const res = await fetch('/api/my-inspections', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load inspection history.');
    return res.json();
  },

  getInspectionById: async (id: string): Promise<InspectionData & { mine?: any; district?: any; shift?: any; sirdar?: any }> => {
    const res = await fetch(`/api/inspections/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load inspection.');
    }
    return res.json();
  },

  saveDraft: async (data: InspectionData): Promise<InspectionData> => {
    const user = authStorage.getUser();
    if (user) {
      // Save locally first for offline resilience
      offlineStorage.saveLocalDraft(user.id, data);
    }

    try {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/api/inspections/draft/${data.id}` : '/api/inspections/draft';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save draft on server.');
      }

      const result = await res.json();
      if (user) {
        offlineStorage.saveLocalDraft(user.id, result);
      }
      return result;
    } catch (networkErr: any) {
      // If offline or network error, local copy already preserved
      console.warn('Network unavailable during draft save, preserved locally:', networkErr);
      return data;
    }
  },

  submitInspection: async (data: InspectionData): Promise<InspectionData> => {
    const user = authStorage.getUser();
    const url = data.id ? `/api/inspections/${data.id}/submit` : '/api/inspections/submit';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Statutory submission failed.');
      }

      const submitted = await res.json();
      if (user) {
        offlineStorage.clearLocalDraft(user.id);
        offlineStorage.clearQueueItem(data.id);
      }
      return submitted;
    } catch (err: any) {
      // If strictly network offline, enqueue for sync
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        offlineStorage.enqueueOfflineSubmission(data);
        throw new Error('OFFLINE_QUEUED: Device is currently offline. Inspection has been saved locally and queued for automatic statutory submission once connectivity resumes.');
      }
      throw err;
    }
  },

  deleteDraft: async (id: string): Promise<void> => {
    const res = await fetch(`/api/inspections/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete draft.');
    }
  },

  // ================= MANAGER (PHASE 3C) AI INSIGHTS API =================
  generateManagerAIInsights: async (input: { scopeType: 'AREA' | 'MINE'; scopeId?: string; periodDays: 7 | 14 | 30 | 90 }): Promise<any> => {
    const res = await fetch('/api/manager/ai-insights/generate', { method: 'POST', headers: getHeaders(), body: JSON.stringify(input) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to start AI insight generation.');
    return data.generation;
  },
  getManagerAIInsightsStatus: async (): Promise<any> => {
    const res = await fetch('/api/manager/ai-insights/generation-status', { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to retrieve AI insight status.');
    return data.generation;
  },
  getManagerAIInsightRequest: async (requestId: string): Promise<any> => {
    const res = await fetch(`/api/manager/ai-insights/generations/${encodeURIComponent(requestId)}`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to retrieve generation status.');
    return data.generation;
  },
  listManagerAIInsights: async (filters: { mineId?: string; scopeType?: string; periodDays?: string; archived?: boolean; page?: number } = {}): Promise<any> => {
    const query = new URLSearchParams();
    if (filters.mineId) query.set('mineId', filters.mineId);
    if (filters.scopeType) query.set('scopeType', filters.scopeType);
    if (filters.periodDays) query.set('periodDays', filters.periodDays);
    if (filters.archived !== undefined) query.set('archived', String(filters.archived));
    if (filters.page) query.set('page', String(filters.page));
    const res = await fetch(`/api/manager/ai-insights${query.size ? `?${query.toString()}` : ''}`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to load AI insight history.');
    return data;
  },
  getManagerAIInsight: async (reportId: string): Promise<any> => {
    const res = await fetch(`/api/manager/ai-insights/${encodeURIComponent(reportId)}`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to open AI insight report.');
    return data.report;
  },
  archiveManagerAIInsight: async (reportId: string, restore = false): Promise<any> => {
    const action = restore ? 'restore' : 'archive';
    const res = await fetch(`/api/manager/ai-insights/${encodeURIComponent(reportId)}/${action}`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Unable to update AI insight history.');
    return data.report;
  },
  getManagerAIInsightEvidence: async (reportId: string, evidenceId: string): Promise<any> => {
    const res = await fetch(`/api/manager/ai-insights/${encodeURIComponent(reportId)}/evidence/${encodeURIComponent(evidenceId)}`, { headers: getHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Supporting evidence is unavailable.');
    return data.evidence;
  },

  // ================= MANAGER (PHASE 3A) ANALYTICS API =================
  getManagerOverview: async (): Promise<ManagerOverview> => {
    const res = await fetch('/api/manager/overview', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load Manager overview.');
    }
    return res.json();
  },

  getManagerMineProfiles: async (): Promise<ManagerMineProfile[]> => {
    const res = await fetch('/api/manager/mines', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load mine profiles.');
    }
    const data = await res.json();
    return data.mines;
  },

  getManagerTaskAssignees: async (mineId: string): Promise<Array<{ user_id: string | null; name: string; employee_id: string; role: 'OVERMAN' }>> => {
    const res = await fetch(`/api/manager/task-assignees?mineId=${encodeURIComponent(mineId)}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load task assignees.');
    }
    const data = await res.json();
    return data.assignees;
  },

  getManagerTasks: async (mineId?: string): Promise<CorrectiveTask[]> => {
    const query = mineId ? `?mineId=${encodeURIComponent(mineId)}` : '';
    const res = await fetch(`/api/manager/tasks${query}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load corrective actions.');
    }
    const data = await res.json();
    return data.tasks;
  },

  createManagerTask: async (input: {
    mine_id: string;
    title: string;
    description: string;
    priority: CorrectiveTaskPriority;
    due_date: string;
    assigned_to_user_id?: string | null;
    assigned_to_employee_id?: string;
    source_observation_ids?: string[];
  }): Promise<CorrectiveTask> => {
    const res = await fetch('/api/manager/tasks', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create corrective action.');
    }
    return res.json();
  },

  getOvermanTasks: async (): Promise<CorrectiveTask[]> => {
    const res = await fetch('/api/overman/tasks', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load corrective actions.');
    }
    const data = await res.json();
    return data.tasks;
  },

  getOvermanTaskById: async (id: string): Promise<CorrectiveTask> => {
    const res = await fetch(`/api/overman/tasks/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load corrective action.');
    }
    return res.json();
  },

  startOvermanTask: async (id: string): Promise<CorrectiveTask> => {
    const res = await fetch(`/api/overman/tasks/${id}/start`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({}) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed to start corrective action.'); }
    return res.json();
  },

  submitOvermanTask: async (id: string, input: { work_summary: string; evidence: Array<{ type: 'NOTE' | 'IMAGE' | 'DOCUMENT'; name?: string; description?: string; data_url?: string }> }): Promise<CorrectiveTask> => {
    const res = await fetch(`/api/overman/tasks/${id}/submit`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(input) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed to submit corrective action.'); }
    return res.json();
  },

  verifyManagerTask: async (id: string, note: string): Promise<CorrectiveTask> => {
    const res = await fetch(`/api/manager/tasks/${id}/verify`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ note }) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed to verify corrective action.'); }
    return res.json();
  },

  returnManagerTask: async (id: string, reason: string): Promise<CorrectiveTask> => {
    const res = await fetch(`/api/manager/tasks/${id}/return`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ reason }) });
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Failed to return corrective action.'); }
    return res.json();
  },

  getManagerMineDetail: async (mineId: string): Promise<ManagerMineDetail> => {
    const res = await fetch(`/api/manager/mines/${mineId}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load mine profile.');
    }
    return res.json();
  },

  // ================= OVERMAN (PHASE 2) STATUTORY API =================

  getOvermanAssignment: async (): Promise<OvermanAssignment> => {
    const res = await fetch('/api/overman/assignment', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load Overman assignment.');
    }
    return res.json();
  },

  getReceivedSirdarInspections: async (): Promise<InspectionSummary[]> => {
    const res = await fetch('/api/overman/sirdar-inspections', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch received Sirdar inspections.');
    }
    return res.json();
  },

  getOvermanReports: async (): Promise<OvermanReportData[]> => {
    const res = await fetch('/api/overman/reports', { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load Overman reports.');
    }
    return res.json();
  },

  getOvermanReportById: async (id: string): Promise<OvermanReportData> => {
    const res = await fetch(`/api/overman/reports/${id}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to load Overman report.');
    }
    return res.json();
  },

  createOrGetOvermanDraft: async (options?: { report_date?: string; shift_id?: string; district_id?: string }): Promise<OvermanReportData> => {
    const res = await fetch('/api/overman/draft', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initialize Overman daily report.');
    }
    return res.json();
  },

  updateOvermanSourceSelection: async (reportId: string, selectedSourceInspectionIds: string[]): Promise<OvermanReportData> => {
    const updateRes = await fetch(`/api/overman/reports/${reportId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ selected_source_inspection_ids: selectedSourceInspectionIds }),
    });
    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to save Sirdar source selection.');
    }

    const assembleRes = await fetch(`/api/overman/assemble/${reportId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!assembleRes.ok) {
      const err = await assembleRes.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assemble Overman report from selected Sirdar records.');
    }
    return assembleRes.json();
  },

  assembleOvermanReport: async (reportId: string): Promise<OvermanReportData> => {
    const res = await fetch(`/api/overman/assemble/${reportId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to re-assemble Overman report from Sirdar data.');
    }
    return res.json();
  },

  updateOvermanReport: async (reportId: string, updates: Partial<OvermanReportData>): Promise<OvermanReportData> => {
    const res = await fetch(`/api/overman/reports/${reportId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update Overman report.');
    }
    return res.json();
  },

  submitOvermanReport: async (reportId: string, updates?: Partial<OvermanReportData>): Promise<OvermanReportData> => {
    const res = await fetch(`/api/overman/reports/${reportId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updates || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to submit Overman statutory report.');
    }
    return res.json();
  },
};
