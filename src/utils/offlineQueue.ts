import {
  CohortStudentRecord,
  EvidenceAttachment,
  RegisteredPreceptor,
} from '../types/nursing';

export type OfflineSyncTask =
  | {
      id: string;
      kind: 'student';
      record: CohortStudentRecord;
      isStaffAction: boolean;
      inlineStaff?: { preceptor: RegisteredPreceptor; enteredPin: string } | null;
      actionTitle: string;
      roleSource: 'trainee' | 'preceptor';
      queuedAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      kind: 'preceptors';
      preceptors: RegisteredPreceptor[];
      deletedIds?: string[];
      actionTitle: string;
      queuedAt: string;
      attempts: number;
      lastError?: string;
    }
  | {
      id: string;
      kind: 'attachment_delete';
      studentId: string;
      sessionNumber: number;
      attachmentId: string;
      remainingAttachments: EvidenceAttachment[];
      queuedAt: string;
      attempts: number;
      lastError?: string;
    };

const DB_NAME = 'ncep_offline_db';
const DB_VERSION = 1;
const STORE_SNAPSHOTS = 'snapshots';
const STORE_QUEUE = 'syncQueue';
const FALLBACK_QUEUE_KEY = 'ncep_offline_sync_queue_fallback';
const QUEUE_EVENT = 'ncep-offline-queue-changed';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openOfflineDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_QUEUE)) {
          db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        resolve(null);
      };
    } catch {
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

function readFallbackQueue(): OfflineSyncTask[] {
  try {
    const raw = localStorage.getItem(FALLBACK_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackQueue(tasks: OfflineSyncTask[]): void {
  try {
    localStorage.setItem(FALLBACK_QUEUE_KEY, JSON.stringify(tasks));
  } catch {
    // ignore storage quota errors on fallback
  }
}

function emitQueueChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
  }
}

export async function saveOfflineSnapshot<T>(key: string, value: T): Promise<void> {
  const db = await openOfflineDb();
  if (!db) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      store.put({
        key,
        value,
        updatedAt: new Date().toISOString(),
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[OfflineDB] Snapshot write note:', err);
  }
}

export async function loadOfflineSnapshot<T>(
  key: string
): Promise<{ value: T; updatedAt: string } | null> {
  const db = await openOfflineDb();
  if (!db) return null;
  try {
    return await new Promise<{ value: T; updatedAt: string } | null>((resolve) => {
      const tx = db.transaction(STORE_SNAPSHOTS, 'readonly');
      const store = tx.objectStore(STORE_SNAPSHOTS);
      const req = store.get(key);
      req.onsuccess = () => {
        const row = req.result;
        if (row && row.value !== undefined) {
          resolve({ value: row.value as T, updatedAt: row.updatedAt || '' });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function enqueueOfflineSyncTask(task: OfflineSyncTask): Promise<void> {
  const db = await openOfflineDb();
  if (!db) {
    const existing = readFallbackQueue().filter((t) => t.id !== task.id);
    existing.push(task);
    writeFallbackQueue(existing);
    emitQueueChanged();
    return;
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUE, 'readwrite');
      const store = tx.objectStore(STORE_QUEUE);
      store.put(task);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = readFallbackQueue().filter((t) => t.id !== task.id);
    existing.push(task);
    writeFallbackQueue(existing);
  }
  emitQueueChanged();
}

export async function removeOfflineSyncTask(id: string): Promise<void> {
  const db = await openOfflineDb();
  const fallback = readFallbackQueue().filter((t) => t.id !== id);
  writeFallbackQueue(fallback);

  if (db) {
    try {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_QUEUE, 'readwrite');
        tx.objectStore(STORE_QUEUE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // ignore IndexedDB error
    }
  }
  emitQueueChanged();
}

export async function getPendingOfflineSyncTasks(): Promise<OfflineSyncTask[]> {
  const db = await openOfflineDb();
  let tasks: OfflineSyncTask[] = [];

  if (db) {
    try {
      tasks = await new Promise<OfflineSyncTask[]>((resolve) => {
        const tx = db.transaction(STORE_QUEUE, 'readonly');
        const req = tx.objectStore(STORE_QUEUE).getAll();
        req.onsuccess = () => {
          resolve(Array.isArray(req.result) ? req.result : []);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      tasks = [];
    }
  }

  const fallback = readFallbackQueue();
  if (fallback.length > 0) {
    const byId = new Map<string, OfflineSyncTask>();
    for (const t of fallback) byId.set(t.id, t);
    for (const t of tasks) byId.set(t.id, t);
    tasks = Array.from(byId.values());
  }

  const priority = (t: OfflineSyncTask) =>
    t.kind === 'preceptors' ? 0 : t.kind === 'student' ? 1 : 2;

  return tasks.sort((a, b) => {
    const pDiff = priority(a) - priority(b);
    if (pDiff !== 0) return pDiff;
    return (Date.parse(a.queuedAt) || 0) - (Date.parse(b.queuedAt) || 0);
  });
}

export async function getPendingOfflineSyncCount(): Promise<number> {
  const tasks = await getPendingOfflineSyncTasks();
  return tasks.length;
}

export function subscribeOfflineQueueChanges(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(QUEUE_EVENT, cb);
  return () => window.removeEventListener(QUEUE_EVENT, cb);
}
