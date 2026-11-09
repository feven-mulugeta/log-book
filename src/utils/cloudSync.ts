import { CohortStudentRecord, RegisteredPreceptor } from '../types/nursing';
import { saveStoredPreceptors, saveStoredCohortStudents } from './storage';

export type SyncStatus = 'connected' | 'http_sync' | 'connecting' | 'offline';

export interface SyncNotification {
  id: string;
  title: string;
  body: string;
  type: 'preceptor_signed' | 'trainee_submitted' | 'cohort_updated' | 'info';
  timestamp: string;
}

type StudentUpdateCallback = (student: CohortStudentRecord, source: 'trainee' | 'preceptor') => void;
type CohortUpdateCallback = (cohort: CohortStudentRecord[]) => void;
type PreceptorUpdateCallback = (preceptors: RegisteredPreceptor[]) => void;
type StatusCallback = (status: SyncStatus, liveDevicesCount: number) => void;
type NotificationCallback = (notif: SyncNotification) => void;

// Consistent unique client ID per browser session to prevent self-echo and infinite sync loops
export const CLIENT_ID =
  typeof window !== 'undefined'
    ? (() => {
        let id = sessionStorage.getItem('ncep_sync_client_id');
        if (!id) {
          id = `cli_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          sessionStorage.setItem('ncep_sync_client_id', id);
        }
        return id;
      })()
    : 'server_env';

class CloudSyncService {
  private ws: WebSocket | null = null;
  private status: SyncStatus = 'connecting';
  private liveDevicesCount = 1;
  private reconnectTimer: any = null;
  private pollTimer: any = null;
  private lastPollTimestamp = new Date().toISOString();
  private debounceTimers: Record<string, any> = {};
  private isInitialized = false;
  private processedEventIds = new Set<string>();

  private studentUpdateListeners = new Set<StudentUpdateCallback>();
  private cohortUpdateListeners = new Set<CohortUpdateCallback>();
  private preceptorUpdateListeners = new Set<PreceptorUpdateCallback>();
  private statusListeners = new Set<StatusCallback>();
  private notificationListeners = new Set<NotificationCallback>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.connectWebSocket();
    this.startHttpPollingFallback();
    // Initial fetch from server
    this.fetchInitialState();
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    // If already open or connecting, do not create duplicate socket
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/sync`;

      this.updateStatus('connecting');
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.updateStatus('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (e) {
          console.error('[CloudSync] Error parsing message:', e);
        }
      };

      this.ws.onclose = () => {
        // Fall back to HTTP sync
        this.updateStatus('http_sync');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.updateStatus('http_sync');
      };
    } catch (err) {
      this.updateStatus('http_sync');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, 5000);
  }

  private startHttpPollingFallback() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // Only poll when WebSocket is NOT connected (as fallback across restrictive proxies)
    this.pollTimer = setInterval(async () => {
      if (this.isWsConnected()) {
        return; // WebSocket delivers events instantly; no need to poll
      }

      try {
        const res = await fetch(`/api/sync/events?since=${encodeURIComponent(this.lastPollTimestamp)}`);
        if (res.ok) {
          const body = await res.json();
          if (body.events && body.events.length > 0) {
            body.events.forEach((ev: any) => {
              if (ev.senderClientId === CLIENT_ID) return;
              if (this.processedEventIds.has(ev.id)) return;
              this.processedEventIds.add(ev.id);
              if (this.processedEventIds.size > 200) {
                const first = this.processedEventIds.values().next().value;
                if (first) this.processedEventIds.delete(first);
              }

              if (ev.type === 'STUDENT_UPDATED' && ev.details?.student) {
                this.notifyStudentUpdated(ev.details.student, ev.source);
                this.generateNotificationForEvent(ev);
              }
            });
          }
          if (body.serverTime) {
            this.lastPollTimestamp = body.serverTime;
          }
          if (this.status === 'offline') {
            this.updateStatus('http_sync');
          }
        }
      } catch (err) {
        if (this.status !== 'offline' && !this.isWsConnected()) {
          this.updateStatus('offline');
        }
      }
    }, 5000);
  }

  public async fetchInitialState(): Promise<{
    cohortStudents: CohortStudentRecord[];
    preceptors: RegisteredPreceptor[];
  } | null> {
    try {
      const res = await fetch('/api/sync/state');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.cohortStudents && json.data.cohortStudents.length > 0) {
            this.notifyCohortUpdated(json.data.cohortStudents);
          }
          if (json.data.preceptors && json.data.preceptors.length > 0) {
            this.notifyPreceptorUpdated(json.data.preceptors);
          }
          if (json.data.activeConnections !== undefined) {
            this.liveDevicesCount = Math.max(1, json.data.activeConnections);
            this.notifyStatus();
          }
          return json.data;
        }
      }
    } catch (e) {
      console.warn('[CloudSync] Could not reach server for initial sync, using local state.');
    }
    return null;
  }

  private handleIncomingMessage(msg: any) {
    // Crucial: Ignore echoes of messages sent from this exact client tab
    if (msg.senderClientId && msg.senderClientId === CLIENT_ID) {
      return;
    }

    if (msg.type === 'INIT_STATE') {
      if (msg.state?.cohortStudents) {
        this.notifyCohortUpdated(msg.state.cohortStudents);
      }
      if (msg.state?.preceptors) {
        this.notifyPreceptorUpdated(msg.state.preceptors);
      }
      if (msg.state?.activeConnections) {
        this.liveDevicesCount = msg.state.activeConnections;
        this.notifyStatus();
      }
    } else if (msg.type === 'STUDENT_UPDATED') {
      if (msg.student) {
        this.notifyStudentUpdated(msg.student, msg.source);
        if (msg.event) {
          this.generateNotificationForEvent(msg.event);
        }
      }
    } else if (msg.type === 'COHORT_UPDATED') {
      if (msg.cohortStudents) {
        this.notifyCohortUpdated(msg.cohortStudents);
      }
    } else if (msg.type === 'PRECEPTORS_UPDATED') {
      if (msg.preceptors) {
        this.notifyPreceptorUpdated(msg.preceptors);
      }
    } else if (msg.type === 'SYNC_EVENT' && msg.event) {
      this.generateNotificationForEvent(msg.event);
    }
  }

  private generateNotificationForEvent(event: any) {
    if (event.id) {
      if (this.processedEventIds.has(event.id)) return;
      this.processedEventIds.add(event.id);
      if (this.processedEventIds.size > 200) {
        const first = this.processedEventIds.values().next().value;
        if (first) this.processedEventIds.delete(first);
      }
    }

    const isPreceptorAction = event.source === 'preceptor';
    const notif: SyncNotification = {
      id: event.id || String(Date.now()),
      title: isPreceptorAction ? 'Preceptor Evaluation Update' : 'Trainee Activity Update',
      body: event.message || 'Logbook updated',
      type: isPreceptorAction ? 'preceptor_signed' : 'trainee_submitted',
      timestamp: event.timestamp || new Date().toISOString(),
    };
    this.notifyNotification(notif);
  }

  public isWsConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private updateStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    this.notifyStatus();
  }

  private notifyStatus() {
    this.statusListeners.forEach((l) => l(this.status, this.liveDevicesCount));
  }

  private notifyStudentUpdated(student: CohortStudentRecord, source: 'trainee' | 'preceptor') {
    this.studentUpdateListeners.forEach((l) => l(student, source));
  }

  private notifyCohortUpdated(cohort: CohortStudentRecord[]) {
    if (Array.isArray(cohort) && cohort.length > 0) {
      saveStoredCohortStudents(cohort);
    }
    this.cohortUpdateListeners.forEach((l) => l(cohort));
  }

  private notifyPreceptorUpdated(preceptors: RegisteredPreceptor[]) {
    if (Array.isArray(preceptors) && preceptors.length > 0) {
      saveStoredPreceptors(preceptors);
    }
    this.preceptorUpdateListeners.forEach((l) => l(preceptors));
  }

  private notifyNotification(notif: SyncNotification) {
    this.notificationListeners.forEach((l) => l(notif));
  }

  // Public subscriptions
  public onStudentUpdated(cb: StudentUpdateCallback) {
    this.studentUpdateListeners.add(cb);
    return () => this.studentUpdateListeners.delete(cb);
  }

  public onCohortUpdated(cb: CohortUpdateCallback) {
    this.cohortUpdateListeners.add(cb);
    return () => this.cohortUpdateListeners.delete(cb);
  }

  public onPreceptorsUpdated(cb: PreceptorUpdateCallback) {
    this.preceptorUpdateListeners.add(cb);
    return () => this.preceptorUpdateListeners.delete(cb);
  }

  public onStatusChange(cb: StatusCallback) {
    this.statusListeners.add(cb);
    cb(this.status, this.liveDevicesCount);
    return () => this.statusListeners.delete(cb);
  }

  public onNotification(cb: NotificationCallback) {
    this.notificationListeners.add(cb);
    return () => this.notificationListeners.delete(cb);
  }

  // Sync methods (called whenever local changes occur)
  public syncStudent(student: CohortStudentRecord, source: 'trainee' | 'preceptor' = 'trainee', message?: string) {
    const key = `sync_student_${student.id || student.traineeInfo.traineeId}`;
    if (this.debounceTimers[key]) {
      clearTimeout(this.debounceTimers[key]);
    }

    this.debounceTimers[key] = setTimeout(async () => {
      const payload = {
        student,
        source,
        message,
        clientId: CLIENT_ID,
      };

      // 1. If WebSocket is connected, broadcast via WebSocket
      if (this.isWsConnected()) {
        try {
          this.ws!.send(
            JSON.stringify({
              type: 'SYNC_STUDENT',
              ...payload,
            })
          );
          return;
        } catch (e) {
          console.error('[CloudSync] WS send error:', e);
        }
      }

      // 2. Fall back to HTTP API if WebSocket is offline or disconnected
      try {
        await fetch('/api/sync/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('[CloudSync] Failed to post student update to server:', err);
      }
    }, 350); // 350ms debounce
  }

  public async syncCohort(cohort: CohortStudentRecord[], source: 'trainee' | 'preceptor' = 'preceptor') {
    const payload = { cohortStudents: cohort, source, clientId: CLIENT_ID };

    if (this.isWsConnected()) {
      try {
        this.ws!.send(
          JSON.stringify({
            type: 'SYNC_COHORT',
            ...payload,
          })
        );
        return;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await fetch('/api/sync/cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async syncPreceptors(preceptors: RegisteredPreceptor[]) {
    const payload = { preceptors, clientId: CLIENT_ID };

    if (this.isWsConnected()) {
      try {
        this.ws!.send(
          JSON.stringify({
            type: 'SYNC_PRECEPTORS',
            ...payload,
          })
        );
        return;
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await fetch('/api/sync/preceptors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error(e);
    }
  }

  public getStatus(): { status: SyncStatus; liveDevicesCount: number } {
    return { status: this.status, liveDevicesCount: this.liveDevicesCount };
  }
}

export const cloudSync = new CloudSyncService();
