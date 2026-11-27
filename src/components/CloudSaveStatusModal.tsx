import React from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  AlertTriangle,
  Loader2,
  RefreshCw,
  LogIn,
  ShieldCheck,
  Database,
  X,
  WifiOff,
  ServerCrash,
  Smartphone,
  UploadCloud,
} from 'lucide-react';

export type CloudSavePopupStatus =
  | 'saving'
  | 'saved'
  | 'connection_error'
  | 'auth_required'
  | 'other_error';

export interface CloudSavePopupState {
  status: CloudSavePopupStatus;
  actionTitle: string;
  roleLabel: 'Student / Trainee' | 'Clinical Preceptor / Mentor' | 'Lead Clinical Educator';
  studentName: string;
  studentId: string;
  evaluatorName?: string;
  evaluatorWard?: string;
  savedAtIso?: string;
  liveServerSaved?: boolean;
  cloudDbSaved?: boolean;
  detailMessage?: string;
  canRetry?: boolean;
  savedLocallyOnPhone?: boolean;
  pendingQueueCount?: number;
}

interface CloudSaveStatusModalProps {
  state: CloudSavePopupState | null;
  onClose: () => void;
  onRetry: () => void;
  onSignInGoogle: () => void;
  isRetrying?: boolean;
  isSigningIn?: boolean;
}

export function CloudSaveStatusModal({
  state,
  onClose,
  onRetry,
  onSignInGoogle,
  isRetrying = false,
  isSigningIn = false,
}: CloudSaveStatusModalProps) {
  if (!state) return null;

  const formattedTime = state.savedAtIso
    ? new Date(state.savedAtIso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

  const isSaved = state.status === 'saved';
  const isSaving = state.status === 'saving';
  const isConnection = state.status === 'connection_error';
  const isAuth = state.status === 'auth_required';
  const isOther = state.status === 'other_error';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cloud-save-popup-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Colored Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between text-white ${
            isSaving
              ? 'bg-teal-800'
              : isSaved
                ? 'bg-emerald-700'
                : isConnection
                  ? 'bg-amber-700'
                  : isAuth
                    ? 'bg-indigo-800'
                    : 'bg-rose-700'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-white/15 shrink-0">
              {isSaving && <Loader2 className="w-5 h-5 animate-spin text-white" />}
              {isSaved && <CheckCircle2 className="w-5 h-5 text-white" />}
              {isConnection && <WifiOff className="w-5 h-5 text-white" />}
              {isAuth && <Database className="w-5 h-5 text-white" />}
              {isOther && <AlertTriangle className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/85">
                {isSaving
                  ? 'Verifying Cloud Storage'
                  : isSaved
                    ? 'Cloud Database Confirmed'
                    : isConnection
                      ? state.savedLocallyOnPhone
                        ? 'Offline Mode · Saved on Your Phone'
                        : 'Save Failed · Connection Problem'
                      : isAuth
                        ? 'Saved on Phone · Sign-In Needed for Cloud'
                        : 'Save Failed · Non-Connection Error'}
              </p>
              <h3 id="cloud-save-popup-title" className="text-sm font-bold leading-snug">
                {isSaving && 'Saving to Cloud Database...'}
                {isSaved && 'Permanently Saved on Cloud Database'}
                {isConnection &&
                  (state.savedLocallyOnPhone
                    ? 'Saved on Phone · Pending Cloud Upload'
                    : 'NOT Saved to Cloud Database')}
                {isAuth && 'NOT Saved on Cloud Database'}
                {isOther && 'NOT Saved to Cloud Database'}
              </h3>
            </div>
          </div>

          {!isSaving && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close confirmation pop-up"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Action Summary Card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {state.roleLabel}
              </span>
              <span className="text-[10px] font-mono text-slate-500">{formattedTime}</span>
            </div>
            <p className="font-bold text-slate-900 text-xs">{state.actionTitle}</p>
            <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-2 gap-y-0.5">
              <span>
                Trainee: <strong className="text-slate-800">{state.studentName || 'Unassigned'}</strong>
              </span>
              {state.studentId && (
                <span>
                  ID: <strong className="font-mono text-slate-800">{state.studentId}</strong>
                </span>
              )}
              {state.evaluatorName && (
                <span>
                  Signed By: <strong className="text-teal-800">{state.evaluatorName}</strong>
                  {state.evaluatorWard ? (
                    <span className="ml-1 text-teal-700 font-semibold">
                      ({state.evaluatorWard} Ward)
                    </span>
                  ) : null}
                </span>
              )}
            </div>
          </div>

          {/* State-Specific Clear Explanation */}
          {isSaving && (
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 flex items-start gap-2.5">
              <Cloud className="w-4 h-4 text-teal-700 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1">
                <p className="font-semibold">
                  Waiting for permanent acknowledgment from Cloud Database...
                </p>
                <p className="text-[11px] text-teal-800">
                  Confirmation will only appear after the Cloud Database server confirms this entry is permanently committed.
                </p>
              </div>
            </div>
          )}

          {isSaved && (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900">
                    Your data is permanently saved and verified in the Cloud Database.
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Instructors, preceptors, and future sessions will retain this record safely across devices and app restarts.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center gap-1.5 text-emerald-900 font-semibold">
                  <Database className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Cloud DB: Committed</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-lg border flex items-center gap-1.5 font-semibold ${
                    state.liveServerSaved
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    {state.liveServerSaved ? 'Live Server: Synced' : 'Local Cache: Saved'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isConnection && (
            <div className="space-y-2.5">
              {state.savedLocallyOnPhone && (
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 flex items-start gap-2.5">
                  <Smartphone className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-teal-900">
                      Saved Safely on Your Phone (Offline Mode)
                    </p>
                    <p className="text-[11px] text-teal-800 leading-relaxed">
                      Your work is stored in your phone&rsquo;s offline database so closing the app or losing signal will <strong>not</strong> erase it.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2.5">
                {state.savedLocallyOnPhone ? (
                  <UploadCloud className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                ) : (
                  <CloudOff className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold text-amber-950">
                    {state.savedLocallyOnPhone
                      ? 'Waiting for Internet to Save Permanently on Cloud'
                      : 'Connection Problem — Data NOT Confirmed in Cloud Database'}
                  </p>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    {state.savedLocallyOnPhone
                      ? 'This entry is NOT in the permanent Cloud Database yet because your phone is currently offline. Keep working normally — as soon as you reach Wi-Fi or mobile data and open the app, it will automatically upload permanently.'
                      : 'Your entry could not reach or be confirmed by the Cloud Database due to an offline state, weak internet connection, or network timeout.'}
                  </p>
                  {typeof state.pendingQueueCount === 'number' && state.pendingQueueCount > 0 && (
                    <p className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-2.5 py-1 rounded-lg border border-amber-200 inline-block mt-1">
                      {state.pendingQueueCount} pending change{state.pendingQueueCount === 1 ? '' : 's'} queued on phone
                    </p>
                  )}
                  {state.detailMessage && (
                    <p className="text-[11px] font-medium text-amber-900 bg-amber-100/80 px-2.5 py-1.5 rounded-lg border border-amber-200 mt-1">
                      Details: {state.detailMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAuth && (
            <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-2.5">
              <LogIn className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-indigo-950">
                  Google Sign-In Required for Permanent Cloud Database
                </p>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  {state.liveServerSaved
                    ? 'Your entry was sent to the live session server and saved on this browser, ONLY — it is NOT saved permanently in Firebase Cloud Database yet because no Google account is signed in.'
                    : 'Your entry is saved on this device only and NOT saved permanently in Firebase Cloud Database because no Google account is signed in.'}
                </p>
              </div>
            </div>
          )}

          {isOther && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5">
              <ServerCrash className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-rose-950">
                  Cloud Database Rejected or Could Not Complete Save
                </p>
                <p className="text-[11px] text-rose-900 leading-relaxed">
                  This is <strong>not</strong> a connection outage. The data was <strong>not permanently saved</strong> to the Cloud Database because of the issue below:
                </p>
                {state.detailMessage && (
                  <p className="text-[11px] font-medium text-rose-900 bg-rose-100/80 px-2.5 py-1.5 rounded-lg border border-rose-200 mt-1 break-words">
                    {state.detailMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          {!isSaving && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {isConnection && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Retrying Cloud Save...' : 'Retry Cloud Save'}</span>
                </button>
              )}

              {isAuth && (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  disabled={isSigningIn}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isSigningIn ? 'Signing in...' : 'Sign in with Google & Save'}</span>
                </button>
              )}

              {isOther && state.canRetry !== false && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Retrying...' : 'Retry Save'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {isSaved
                  ? 'OK, Continue'
                  : isConnection && state.savedLocallyOnPhone
                    ? 'Continue Working Offline'
                    : 'Close'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
