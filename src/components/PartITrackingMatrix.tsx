import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  ShieldCheck,
  FileText,
  Paperclip,
  Award,
  Lock,
  MapPin,
  Users,
  ArrowRightLeft,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { DetailedActivityLogSheet, NCEPSessionDefinition, SubCompetencyId, RegisteredPreceptor } from '../types/nursing';
import { NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';
import { PreceptorPinModal } from './PreceptorPinModal';
import { UserRole, resolvePreceptorWard } from '../utils/storage';

interface PartITrackingMatrixProps {
  detailedLogs: DetailedActivityLogSheet[];
  onOpenDetailedLogForSession: (sessionNumber: number) => void;
  onCreateNewDetailedLogForSession: (sessionNumber: number) => void;
  onQuickPreceptorSign?: (
    sessionNumber: number,
    newStatus: 'Met' | 'Pending',
    preceptor?: RegisteredPreceptor,
    enteredPin?: string
  ) => void;
  userRole?: UserRole;
  authenticatedPreceptor?: RegisteredPreceptor | null;
}

export function PartITrackingMatrix({
  detailedLogs,
  onOpenDetailedLogForSession,
  onCreateNewDetailedLogForSession,
  onQuickPreceptorSign,
  userRole = 'trainee',
  authenticatedPreceptor = null,
}: PartITrackingMatrixProps) {
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalAction, setPinModalAction] = useState<'sign' | 'unsign'>('sign');
  const [sessionToSign, setSessionToSign] = useState<number | null>(null);
  const [confirmUnsignSession, setConfirmUnsignSession] = useState<number | null>(null);

  // Group sessions by sub-competency
  const subCompetencies: { id: SubCompetencyId; title: string; sessions: NCEPSessionDefinition[] }[] = [
    {
      id: 'sub_comp_1',
      title: 'Sub-Competency 1: Perform Patient Assessment',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_1'),
    },
    {
      id: 'sub_comp_2',
      title: 'Sub-Competency 2: Develop / Construct Nursing Diagnosis',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_2'),
    },
    {
      id: 'sub_comp_3',
      title: 'Sub-Competency 3: Design Prioritized Care Interventions',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_3'),
    },
    {
      id: 'sub_comp_4',
      title: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_4'),
    },
    {
      id: 'sub_comp_5',
      title: 'Sub-Competency 5: Execute Nursing Interventions',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_5'),
    },
    {
      id: 'sub_comp_6',
      title: 'Sub-Competency 6: Monitor and Evaluate Continuous Patient Conditions',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_6'),
    },
  ];

  // Helper to find log for session
  const getLogForSession = (sessionNum: number) => {
    return detailedLogs.find((l) => l.sessionNumber === sessionNum);
  };

  const metCount = NCEP_SESSIONS_DEFINITIONS.filter((s) => {
    const log = getLogForSession(s.sessionNumber);
    return log?.status === 'Met';
  }).length;

  const handleStatusClick = (sessionNumber: number, currentMet: boolean) => {
    if (!onQuickPreceptorSign) {
      onOpenDetailedLogForSession(sessionNumber);
      return;
    }

    if (currentMet) {
      // Remove mistake signature & revert back to Pending (requires confirmation or PIN)
      if (userRole === 'trainee') {
        setPinModalAction('unsign');
        setSessionToSign(sessionNumber);
        setPinModalOpen(true);
      } else {
        setConfirmUnsignSession(sessionNumber);
      }
    } else {
      // Sign as Met: requires preceptor authorization PIN if in trainee mode
      if (userRole === 'trainee') {
        setPinModalAction('sign');
        setSessionToSign(sessionNumber);
        setPinModalOpen(true);
      } else {
        onQuickPreceptorSign(sessionNumber, 'Met', authenticatedPreceptor || undefined);
      }
    }
  };

  const handlePinSuccess = (preceptor?: RegisteredPreceptor, enteredPin?: string) => {
    setPinModalOpen(false);
    if (sessionToSign !== null && onQuickPreceptorSign) {
      const log = getLogForSession(sessionToSign);
      const newStatus = log?.status === 'Met' ? 'Pending' : 'Met';
      onQuickPreceptorSign(sessionToSign, newStatus, preceptor, enteredPin);
      setSessionToSign(null);
    }
  };

  // Distinct preceptors and wards across all evaluated sessions for this student
  const evaluatedLogs = detailedLogs.filter((l) => l.preceptorSignoff?.isSigned || l.status === 'Met');
  const evaluatingPreceptors = Array.from(
    new Set(
      evaluatedLogs
        .map((l) => l.preceptorSignoff?.preceptorName?.trim())
        .filter((n): n is string => !!n)
    )
  );
  const rotationWards = Array.from(
    new Set(
      detailedLogs
        .map((l) => l.clinicalSettingWard?.split('/')[0].trim())
        .filter((w): w is string => !!w)
    )
  );

  return (
    <div className="space-y-6">
      {/* Title & Real-time Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            PART I: COMPETENCY TRACKING MATRIX
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formative competency tracking matrix across all 18 clinical sessions and 6 sub-competencies
          </p>
        </div>

        {/* Real-time Status Gauge */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-900">
              {metCount} of {NCEP_SESSIONS_DEFINITIONS.length} Met
            </span>
            <p className="text-[10px] text-slate-500">
              {Math.round((metCount / NCEP_SESSIONS_DEFINITIONS.length) * 100)}% Competency Met
            </p>
          </div>
          <div className="w-20 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-teal-700 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.round((metCount / NCEP_SESSIONS_DEFINITIONS.length) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Clinical Rotations & Multi-Preceptor Badge Banner */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-900 rounded-xl shrink-0 mt-0.5">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-950">Clinical Rotations &amp; Multi-Preceptor Evaluations Supported</span>
              <span className="bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full text-[10px] font-bold">
                {evaluatingPreceptors.length > 0 ? `${evaluatingPreceptors.length} Faculty Evaluator${evaluatingPreceptors.length > 1 ? 's' : ''}` : 'Multi-Ward Tracking'}
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 mt-0.5">
              As trainees rotate across clinical wards, different preceptors and mentors evaluate and stamp individual sessions with their unique credentials and PIN.
            </p>
          </div>
        </div>

        {/* Wards & Preceptors Badges */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {rotationWards.slice(0, 3).map((w) => (
            <span key={w} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-300 text-amber-950 text-[10px] font-semibold">
              <MapPin className="w-2.5 h-2.5 text-amber-700" />
              <span>{w}</span>
            </span>
          ))}
          {evaluatingPreceptors.slice(0, 2).map((p) => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-teal-300 text-teal-950 text-[10px] font-semibold">
              <Users className="w-2.5 h-2.5 text-teal-700" />
              <span>{p.split(' ')[0]} {p.split(' ')[1] || ''}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Table Container (Styled to reflect the exact grid in the PDF) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse font-sans">
            {/* Table Header matching PDF Pages 2, 3, 4 */}
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800">
                <th className="py-3 px-4 font-bold w-1/4">Sub-Competency &amp; Session Focus</th>
                <th className="py-3 px-4 font-bold w-2/5">Required Clinical Activity / Assignment</th>
                <th className="py-3 px-3 font-bold text-center w-28">Date Completed</th>
                <th className="py-3 px-3 font-bold text-center w-28">Status (Pending / Met)</th>
                <th className="py-3 px-3 font-bold text-center w-40">Preceptor / Mentor Signed &amp; Ward</th>
                <th className="py-3 px-3 font-bold text-center w-24">Part II Action</th>
              </tr>
            </thead>

            <tbody>
              {subCompetencies.map((subComp) => (
                <React.Fragment key={subComp.id}>
                  {/* Sub-Competency Section Header Row */}
                  <tr className="bg-slate-100/90 border-y border-slate-300 font-bold text-slate-900">
                    <td colSpan={6} className="py-2.5 px-4 text-xs font-bold uppercase tracking-wide text-teal-950">
                      {subComp.title}
                    </td>
                  </tr>

                  {/* Sessions in this Sub-Competency */}
                  {subComp.sessions.map((session) => {
                    const log = getLogForSession(session.sessionNumber);
                    const isMet = log?.status === 'Met';
                    const hasLog = !!log;

                    return (
                      <tr
                        key={session.sessionNumber}
                        className="border-b border-slate-200 hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Sub-Competency & Session Focus */}
                        <td className="py-3 px-4 align-top">
                          <p className="font-bold text-slate-900">
                            Session {session.sessionNumber}: {session.sessionTitle}
                          </p>
                          <p className="text-[10px] text-teal-800 mt-0.5">
                            Evidence: {session.expectedEvidenceType}
                          </p>
                        </td>

                        {/* Required Clinical Activity / Assignment */}
                        <td className="py-3 px-4 align-top text-slate-700 leading-relaxed">
                          {session.requiredActivity}
                        </td>

                        {/* Date Completed */}
                        <td className="py-3 px-3 align-top text-center font-mono">
                          {log?.dateOfActivity ? (
                            <span className="text-slate-900 font-medium">{log.dateOfActivity}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Status (Pending / Met) */}
                        <td className="py-3 px-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => handleStatusClick(session.sessionNumber, isMet)}
                            title={
                              isMet
                                ? 'Competency verified as Met. Signed by mistake? Click to remove signature and return to Pending (Preceptor PIN required).'
                                : 'Click to authorize and sign as Met (Preceptor PIN required).'
                            }
                            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[11px] transition-all hover:scale-105 cursor-pointer ${
                              isMet
                                ? 'text-emerald-800 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                                : 'text-slate-600 bg-slate-100 border border-slate-300 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300'
                            }`}
                          >
                            {isMet ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Met</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Pending</span>
                              </>
                            )}
                          </button>
                          <span className="block text-[9px] text-slate-400 mt-0.5">
                            {isMet ? 'Verified · Undo' : 'Preceptor PIN'}
                          </span>
                        </td>

                        {/* Preceptor / Mentor Signed & Ward */}
                        <td className="py-3 px-3 align-top text-center font-sans">
                          {log?.preceptorSignoff?.isSigned ? (() => {
                            const evaluatorWard =
                              resolvePreceptorWard(
                                log.preceptorSignoff.preceptorName,
                                log.preceptorSignoff.preceptorInitials,
                                log.preceptorSignoff.preceptorWard
                              ) || log.clinicalSettingWard?.split('/')[0].trim() || '';
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className="font-bold text-teal-950 bg-teal-50/90 px-2 py-0.5 rounded-lg border border-teal-200 text-[11px] shadow-2xs leading-tight block text-center max-w-[160px]"
                                  title={`Evaluator: ${log.preceptorSignoff.preceptorName || 'Clinical Preceptor'}${evaluatorWard ? ` · Ward: ${evaluatorWard}` : ''}`}
                                >
                                  {log.preceptorSignoff.preceptorName || 'Clinical Preceptor'}
                                </span>
                                <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-slate-600 font-sans">
                                  {log.preceptorSignoff.preceptorInitials && (
                                    <span className="font-mono font-bold text-teal-700 bg-teal-100/60 px-1 py-0.2 rounded text-[9px]">
                                      {log.preceptorSignoff.preceptorInitials}
                                    </span>
                                  )}
                                  {evaluatorWard && (
                                    <span
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[9px] max-w-[125px] truncate"
                                      title={`Permanent Ward: ${evaluatorWard}`}
                                    >
                                      <MapPin className="w-2.5 h-2.5 text-teal-700 shrink-0" />
                                      <span className="truncate">{evaluatorWard}</span>
                                    </span>
                                  )}
                                </div>
                                {log.preceptorSignoff.dateSigned && (
                                  <span className="text-[9px] text-slate-400 font-mono block">
                                    Signed: {log.preceptorSignoff.dateSigned}
                                  </span>
                                )}
                              </div>
                            );
                          })() : (
                            <div className="text-center">
                              <span className="text-slate-300 text-xs block">—</span>
                              <span className="text-[9px] text-slate-400 italic">Pending Mentor</span>
                            </div>
                          )}
                        </td>

                        {/* Part II Action: View/Fill Log Sheet */}
                        <td className="py-3 px-3 align-top text-center">
                          {hasLog ? (
                            <button
                              type="button"
                              onClick={() => onOpenDetailedLogForSession(session.sessionNumber)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:text-teal-950 px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors"
                            >
                              <span>View Log</span>
                              {(log.attachments?.length || 0) > 0 && (
                                <Paperclip className="w-3 h-3 text-teal-700" />
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onCreateNewDetailedLogForSession(session.sessionNumber)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-teal-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Log Task</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Banner */}
        <div className="px-6 py-2.5 bg-slate-100 text-[11px] text-slate-500 font-serif flex items-center justify-between border-t border-slate-200">
          <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
          <span>Pages 2 – 4</span>
        </div>
      </div>

      {/* Confirm Remove Mistake Signature Modal (Preceptor / Lead Educator mode) */}
      {confirmUnsignSession !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-900 text-white flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-800 rounded-lg">
                <RotateCcw className="w-4 h-4 text-rose-200" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Remove Mistake Signature</h3>
                <p className="text-[11px] text-rose-200">
                  Session {confirmUnsignSession} · Revert status from Met back to Pending
                </p>
              </div>
            </div>
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Are you sure you want to remove the preceptor signature for{' '}
                  <strong>Session {confirmUnsignSession}</strong>? This clears the evaluator signature and sets the session back to <strong>Pending</strong> across all devices.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmUnsignSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const targetSession = confirmUnsignSession;
                    setConfirmUnsignSession(null);
                    if (targetSession !== null && onQuickPreceptorSign) {
                      onQuickPreceptorSign(targetSession, 'Pending', authenticatedPreceptor || undefined);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Remove Signature</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preceptor Security Authorization PIN Modal */}
      <PreceptorPinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setSessionToSign(null);
        }}
        onSuccess={handlePinSuccess}
        title={
          pinModalAction === 'unsign'
            ? 'Preceptor Authorization: Remove Mistake Signature'
            : 'Preceptor / Mentor Verification Required'
        }
        subtitle={
          pinModalAction === 'unsign'
            ? sessionToSign
              ? `Enter your assigned Preceptor / Mentor PIN to remove the signature on Session ${sessionToSign} and return its status to Pending.`
              : 'Enter your assigned Preceptor / Mentor PIN to remove a signature signed by mistake.'
            : sessionToSign
              ? `Only designated clinical preceptors or mentors can verify Session ${sessionToSign} and update its status to Met.`
              : 'Only designated clinical preceptors or mentors can update competency statuses.'
        }
      />
    </div>
  );
}
