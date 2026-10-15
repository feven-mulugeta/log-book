import { CohortStudentRecord, RegisteredPreceptor } from '../types/nursing';

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

class CloudSyncService {
  private ws: WebSocket | null = null;
  private status: SyncStatus = 'connecting';
  private liveDevicesCount = 1;
  private reconnectTimer: any = null;
  private pollTimer: any = null;
  private lastPollTimestamp = new Date().toISOString();
  private debounceTimers: Record<string, any> = {};

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
    this.connectWebSocket();
    this.startHttpPollingFallback();
    // Initial fetch from server
    this.fetchInitialState();
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

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
    // Poll events every 4 seconds for maximum reliability across proxy environments
    this.pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/sync/events?since=${encodeURIComponent(this.lastPollTimestamp)}`);
        if (res.ok) {
          const body = await res.json();
          if (body.events && body.events.length > 0) {
            body.events.forEach((ev: any) => {
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
    }, 4000);
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

  private isWsConnected(): boolean {
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
    this.cohortUpdateListeners.forEach((l) => l(cohort));
  }

  private notifyPreceptorUpdated(preceptors: RegisteredPreceptor[]) {
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
      // 1. Try sending via WebSocket
      if (this.isWsConnected()) {
        try {
          this.ws!.send(
            JSON.stringify({
              type: 'SYNC_STUDENT',
              student,
              source,
              message,
            })
          );
        } catch (e) {
          console.error('[CloudSync] WS send error:', e);
        }
      }

      // 2. Always persist via HTTP API as well
      try {
        await fetch('/api/sync/student', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student, source, message }),
        });
      } catch (err) {
        console.warn('[CloudSync] Failed to post student update to server:', err);
      }
    }, 400); // 400ms debounce
  }

  public async syncCohort(cohort: CohortStudentRecord[], source: 'trainee' | 'preceptor' = 'preceptor') {
    if (this.isWsConnected()) {
      try {
        this.ws!.send(
          JSON.stringify({
            type: 'SYNC_COHORT',
            cohortStudents: cohort,
            source,
          })
        );
      } catch (e) {
        console.error(e);
      }
    }

    try {
      await fetch('/api/sync/cohort', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortStudents: cohort, source }),
      });
    } catch (e) {
      console.error(e);
    }
  }

  public async syncPreceptors(preceptors: RegisteredPreceptor[]) {
    try {
      await fetch('/api/sync/preceptors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preceptors }),
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
