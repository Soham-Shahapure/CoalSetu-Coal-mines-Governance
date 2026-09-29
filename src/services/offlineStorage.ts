import { InspectionData } from '../types/inspection';

const STORAGE_KEY_PREFIX = 'coal_mine_sirdar_draft_';
const QUEUE_KEY = 'coal_mine_offline_queue';

export interface OfflineStatus {
  isOnline: boolean;
  hasPendingSync: boolean;
  lastSyncedAt: string | null;
}

export const offlineStorage = {
  saveLocalDraft: (userId: string, data: InspectionData): void => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(data));
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}_time`, new Date().toISOString());
    } catch (e) {
      console.error('Failed to save draft to local storage', e);
    }
  },

  getLocalDraft: (userId: string): { data: InspectionData; savedAt: string } | null => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      const savedAt = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}_time`) || new Date().toISOString();
      if (!raw) return null;
      return { data: JSON.parse(raw), savedAt };
    } catch (e) {
      console.error('Failed to read local draft', e);
      return null;
    }
  },

  clearLocalDraft: (userId: string): void => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}_time`);
    } catch (e) {
      console.error('Failed to clear local draft', e);
    }
  },

  enqueueOfflineSubmission: (data: InspectionData): void => {
    try {
      const existing = offlineStorage.getOfflineQueue();
      const updated = existing.filter((item) => item.id !== data.id);
      updated.push(data);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to enqueue offline submission', e);
    }
  },

  getOfflineQueue: (): InspectionData[] => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  clearQueueItem: (id?: string): void => {
    try {
      const queue = offlineStorage.getOfflineQueue();
      const remaining = queue.filter((i) => i.id !== id);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.error('Failed to clear queue item', e);
    }
  },
};
