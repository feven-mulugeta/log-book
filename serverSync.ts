import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'ncep_store.json');

export interface SyncEvent {
  id: string;
  type: 'STUDENT_UPDATED' | 'EVALUATION_SIGNED' | 'COHORT_SYNCED' | 'PRECEPTORS_UPDATED';
  studentId?: string;
  studentName?: string;
  source: 'trainee' | 'preceptor' | 'system';
  message: string;
  timestamp: string;
  details?: any;
}

interface ServerStore {
  cohortStudents: any[];
  preceptors: any[];
  lastUpdated: string;
}

// In-memory cache
let inMemoryStore: ServerStore = {
  cohortStudents: [],
  preceptors: [],
  lastUpdated: new Date().toISOString(),
};

const recentEvents: SyncEvent[] = [];
const connectedClients = new Set<WebSocket>();

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStoreFromDisk() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cohortStudents)) {
        const seenIds = new Set<string>();
        const sanitized: any[] = [];
        for (let i = 0; i < parsed.cohortStudents.length; i++) {
          const item = parsed.cohortStudents[i];
          if (!item || !item.traineeInfo) continue;
          let safeId = item.id || `student-${Date.now()}-${i}`;
          if (seenIds.has(safeId)) {
            safeId = `${safeId}-${i}`;
          }
          seenIds.add(safeId);
          sanitized.push({ ...item, id: safeId });
        }
        inMemoryStore = {
          ...parsed,
          cohortStudents: sanitized,
        };
        console.log(`[CloudSync] Loaded ${inMemoryStore.cohortStudents.length} students from disk store.`);
        return;
      }
    }
  } catch (err) {
    console.error('[CloudSync] Failed to read store from disk:', err);
  }

  // Fallback initial state if file doesn't exist
  inMemoryStore = {
    cohortStudents: [
      {
        id: 'student-1',
        traineeInfo: {
          traineeName: 'Feven Mulugeta',
          traineeId: 'AAU-NS-2024-0419',
          clinicalDepartmentWard: 'Surgical Inpatient Ward 4B / Acute Care Unit',
          assignedClinicalPreceptor: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
          trainingPeriodFrom: '2026-08-15',
          trainingPeriodTo: '2026-11-20',
        },
        detailedLogs: [],
        finalSignoff: {
          isCertified: false,
          leadEducatorName: 'Dr. Berhanu Mengiste, PhD, RN',
          leadEducatorTitle: 'Lead Clinical Educator / Program Coordinator',
          signatureDataUrl: undefined,
          dateSigned: undefined,
          verificationHash: 'AAU-NCEP-CC1-89F2-411B-CERT',
        },
        updatedAt: new Date().toISOString(),
      },
    ],
    preceptors: [],
    lastUpdated: new Date().toISOString(),
  };

  saveStoreToDisk();
}

function saveStoreToDisk() {
  try {
    ensureDataDirectory();
    inMemoryStore.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CloudSync] Failed to write store to disk:', err);
  }
}

// Broadcast helper to all connected clients
export function broadcastToAll(payload: any, excludeWs?: WebSocket) {
  const messageStr = JSON.stringify(payload);
  connectedClients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageStr);
      } catch (err) {
        console.error('[CloudSync] Error sending to WS client:', err);
      }
    }
  });
}

export function logSyncEvent(
  type: SyncEvent['type'],
  source: SyncEvent['source'],
  message: string,
  studentId?: string,
  studentName?: string,
  details?: any
): SyncEvent {
  const event: SyncEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    source,
    message,
    studentId,
    studentName,
    timestamp: new Date().toISOString(),
    details,
  };

  recentEvents.unshift(event);
  if (recentEvents.length > 100) {
    recentEvents.pop();
  }

  // Broadcast event to all WebSocket clients
  broadcastToAll({
    type: 'SYNC_EVENT',
    event,
  });

  return event;
}

export function getSyncState() {
  return {
    cohortStudents: inMemoryStore.cohortStudents,
    preceptors: inMemoryStore.preceptors,
    lastUpdated: inMemoryStore.lastUpdated,
    activeConnections: connectedClients.size,
  };
}

export function updateOrSaveStudent(student: any, source: 'trainee' | 'preceptor' = 'trainee', message?: string) {
  if (!student || (!student.id && !student.traineeInfo?.traineeId)) {
    throw new Error('Invalid student data');
  }

  const studentId = student.id || student.traineeInfo?.traineeId;
  const studentName = student.traineeInfo?.traineeName || 'Trainee';

  const existingIdx = inMemoryStore.cohortStudents.findIndex(
    (s) => s.id === studentId || s.traineeInfo?.traineeId === student.traineeInfo?.traineeId
  );

  const updatedRecord = {
    ...student,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    inMemoryStore.cohortStudents[existingIdx] = updatedRecord;
  } else {
    inMemoryStore.cohortStudents.unshift(updatedRecord);
  }

  saveStoreToDisk();

  const defaultMsg =
    source === 'preceptor'
      ? `Preceptor updated evaluation for ${studentName}`
      : `Trainee ${studentName} updated logbook`;

  const event = logSyncEvent(
    'STUDENT_UPDATED',
    source,
    message || defaultMsg,
    studentId,
    studentName,
    { student: updatedRecord }
  );

  // Broadcast the updated student to all clients
  broadcastToAll({
    type: 'STUDENT_UPDATED',
    student: updatedRecord,
    source,
    event,
    timestamp: new Date().toISOString(),
  });

  return { student: updatedRecord, event };
}

export function updateCohortRoster(cohort: any[], source: 'trainee' | 'preceptor' = 'preceptor') {
  if (!Array.isArray(cohort)) return inMemoryStore.cohortStudents;

  const seenIds = new Set<string>();
  const sanitized = cohort.map((item, idx) => {
    let safeId = item.id || `student-${Date.now()}-${idx}`;
    if (seenIds.has(safeId)) {
      safeId = `${safeId}-${idx}`;
    }
    seenIds.add(safeId);
    return { ...item, id: safeId };
  });

  inMemoryStore.cohortStudents = sanitized;
  saveStoreToDisk();

  const event = logSyncEvent(
    'COHORT_SYNCED',
    source,
    `Cohort roster synced with ${sanitized.length} students`
  );

  broadcastToAll({
    type: 'COHORT_UPDATED',
    cohortStudents: sanitized,
    source,
    event,
  });

  return inMemoryStore.cohortStudents;
}

export function updatePreceptorsRoster(preceptors: any[]) {
  if (!Array.isArray(preceptors)) return inMemoryStore.preceptors;

  inMemoryStore.preceptors = preceptors;
  saveStoreToDisk();

  const event = logSyncEvent(
    'PRECEPTORS_UPDATED',
    'preceptor',
    `Preceptors directory updated (${preceptors.length} instructors)`
  );

  broadcastToAll({
    type: 'PRECEPTORS_UPDATED',
    preceptors,
    event,
  });

  return inMemoryStore.preceptors;
}

export function getEventsSince(sinceTimestamp?: string) {
  if (!sinceTimestamp) return recentEvents.slice(0, 30);
  const sinceTime = new Date(sinceTimestamp).getTime();
  return recentEvents.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
}

// WebSocket initialization
export function setupRealtimeWebSocket(server: http.Server) {
  // Load data immediately on boot
  loadStoreFromDisk();

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/sync') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('[CloudSync] WS Upgrade error:', err);
    }
  });

  wss.on('connection', (ws: WebSocket, req) => {
    connectedClients.add(ws);
    console.log(`[CloudSync] Client connected. Total live devices: ${connectedClients.size}`);

    // Send initial greeting & full state
    try {
      ws.send(
        JSON.stringify({
          type: 'INIT_STATE',
          state: getSyncState(),
          message: 'Connected to NCEP Real-Time Cross-Device Sync Server',
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('[CloudSync] Error sending INIT_STATE:', e);
    }

    ws.on('message', (data: string) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'SYNC_STUDENT') {
          updateOrSaveStudent(payload.student, payload.source || 'trainee', payload.message);
        } else if (payload.type === 'SYNC_COHORT') {
          updateCohortRoster(payload.cohortStudents, payload.source || 'preceptor');
        } else if (payload.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        console.error('[CloudSync] Error parsing WS message:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log(`[CloudSync] Client disconnected. Total live devices: ${connectedClients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[CloudSync] Client WS error:', err);
      connectedClients.delete(ws);
    });
  });

  // Heartbeat every 25 seconds to keep connection alive through any proxies
  const interval = setInterval(() => {
    connectedClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (e) {
          connectedClients.delete(ws);
        }
      } else {
        connectedClients.delete(ws);
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return { wss, connectedClients };
}
