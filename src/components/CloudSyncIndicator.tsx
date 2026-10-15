import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  Share2,
  X,
  Radio,
  ArrowRightLeft,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { cloudSync, SyncStatus, SyncNotification } from '../utils/cloudSync';
import { CohortStudentRecord } from '../types/nursing';

interface CloudSyncIndicatorProps {
  currentStudent: CohortStudentRecord;
  onForceSync: () => void;
  userRole: 'trainee' | 'preceptor' | 'lead_educator';
}

export function CloudSyncIndicator({
  currentStudent,
  onForceSync,
  userRole,
}: CloudSyncIndicatorProps) {
  const [status, setStatus] = useState<SyncStatus>('connecting');
  const [liveDevicesCount, setLiveDevicesCount] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeToast, setActiveToast] = useState<SyncNotification | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<SyncNotification[]>([]);
  const [isSyncingManually, setIsSyncingManually] = useState(false);

  useEffect(() => {
    const unsubStatus = cloudSync.onStatusChange((newStatus, count) => {
      setStatus(newStatus);
      setLiveDevicesCount(count);
    });

    const unsubNotif = cloudSync.onNotification((notif) => {
      setActiveToast(notif);
      setRecentNotifications((prev) => [notif, ...prev.slice(0, 9)]);

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setActiveToast((current) => (current?.id === notif.id ? null : current));
      }, 6000);
    });

    return () => {
      unsubStatus();
      unsubNotif();
    };
  }, []);

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSync = async () => {
    setIsSyncingManually(true);
    onForceSync();
    await cloudSync.fetchInitialState();
    setTimeout(() => {
      setIsSyncingManually(false);
    }, 800);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold cursor-pointer hover:bg-emerald-100 transition-colors">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="hidden sm:inline">Live Cloud Sync</span>
            <span className="sm:hidden">Live</span>
          </div>
        );
      case 'http_sync':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold cursor-pointer hover:bg-blue-100 transition-colors">
            <Radio className="w-3 h-3 text-blue-600" />
            <span className="hidden sm:inline">Cloud Connected</span>
            <span className="sm:hidden">Synced</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold cursor-pointer">
            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
            <span>Connecting...</span>
          </div>
        );
      case 'offline':
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-medium cursor-pointer">
            <WifiOff className="w-3 h-3 text-slate-400" />
            <span>Local Storage</span>
          </div>
        );
    }
  };

  return (
    <>
      {/* Toast Notification for Real-Time Cross-Device Actions */}
      {activeToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-teal-500/40 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            {activeToast.type === 'preceptor_signed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowRightLeft className="w-4 h-4 text-teal-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h5 className="text-xs font-bold text-white truncate">{activeToast.title}</h5>
              <span className="text-[10px] text-teal-300 font-mono">Live</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{activeToast.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Widget */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Click to view Cross-Device Live Sync details & options"
          className="focus:outline-none"
        >
          {getStatusBadge()}
        </button>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={isSyncingManually}
          title="Force manual sync with cloud server"
          className="p-1.5 text-slate-500 hover:text-teal-900 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSyncingManually ? 'animate-spin text-teal-700' : ''}`}
          />
        </button>
      </div>

      {/* Cross-Device Live Sync Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Real-Time Cross-Device Synchronization</span>
                    <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/40">
                      Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-teal-200 mt-0.5">
                    Instructors and students can use their own devices simultaneously
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
              {/* How it works illustration */}
              <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>How Instructor &amp; Student Devices Sync Automatically</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-teal-950">
                      <Laptop className="w-4 h-4 text-teal-700" />
                      <span>1. Instructor&rsquo;s Device</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Preceptor logs into the <strong>Instructor &amp; Cohorts</strong> tab on their laptop or office workstation, selects the trainee, and signs sessions or fills Section 3 feedback with their 4-digit PIN.
                    </p>
                    <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                      Instantly saves to Cloud
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-teal-100 space-y-1.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-teal-950">
                      <Smartphone className="w-4 h-4 text-teal-700" />
                      <span>2. Student&rsquo;s Device</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Trainee opens the app on their phone or tablet in the ward. The moment the preceptor clicks &ldquo;Save&rdquo;, the student&rsquo;s screen updates live to show <strong>Met ✅</strong>, the preceptor&rsquo;s initials, feedback, and signature!
                    </p>
                    <span className="inline-block text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 mt-1">
                      Zero manual export needed
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    <strong>And Vice Versa:</strong> Whenever the trainee writes case reflections or attaches ECG/EWS evidence, it immediately shows up on the instructor&rsquo;s laptop!
                  </span>
                </div>
              </div>

              {/* Share URL with Students */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-xs">
                  Share App Link with Students &amp; Preceptors:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? window.location.href : ''}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-mono text-slate-700 truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors shadow-2xs shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Send this link to your students via Telegram, WhatsApp, or Email. Once they open it on their phones, they are connected to this live rotation database.
                </p>
              </div>

              {/* Currently Active Student & Sync Status */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Current Active Trainee Record:</span>
                  <span className="font-mono text-teal-900 font-bold">
                    {currentStudent.traineeInfo.traineeId || 'AAU-NS-2024-0419'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Name: <strong>{currentStudent.traineeInfo.traineeName || 'Trainee'}</strong></span>
                  <span>Ward: <strong>{currentStudent.traineeInfo.clinicalDepartmentWard || 'Ward 4B'}</strong></span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Connection Protocol: <strong>{status === 'connected' ? 'WebSocket (Sub-second Live)' : 'HTTP Cloud Polling'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleManualSync}
                    className="text-teal-800 hover:underline font-bold flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingManually ? 'animate-spin' : ''}`} />
                    <span>Re-sync Now</span>
                  </button>
                </div>
              </div>

              {/* Recent Sync Events Log */}
              {recentNotifications.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-800 text-xs">Recent Cross-Device Activity:</h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {recentNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span className="text-slate-700">{n.body}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Data persists securely on institutional server storage
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
