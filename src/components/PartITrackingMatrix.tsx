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
} from 'lucide-react';
import { DetailedActivityLogSheet, NCEPSessionDefinition, SubCompetencyId, RegisteredPreceptor } from '../types/nursing';
import { NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';
import { PreceptorPinModal } from './PreceptorPinModal';
import { UserRole } from '../utils/storage';

interface PartITrackingMatrixProps {
  detailedLogs: DetailedActivityLogSheet[];
  onOpenDetailedLogForSession: (sessionNumber: number) => void;
  onCreateNewDetailedLogForSession: (sessionNumber: number) => void;
  onQuickPreceptorSign?: (
    sessionNumber: number,
    newStatus: 'Met' | 'Pending',
    preceptor?: RegisteredPreceptor
  ) => void;
  userRole?: UserRole;
}

export function PartITrackingMatrix({
  detailedLogs,
  onOpenDetailedLogForSession,
  onCreateNewDetailedLogForSession,
  onQuickPreceptorSign,
  userRole = 'trainee',
}: PartITrackingMatrixProps) {
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [sessionToSign, setSessionToSign] = useState<number | null>(null);

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
      // Toggle back to Pending (requires preceptor role or PIN)
      if (userRole === 'trainee') {
        setSessionToSign(sessionNumber);
        setPinModalOpen(true);
      } else {
        onQuickPreceptorSign(sessionNumber, 'Pending');
      }
    } else {
      // Sign as Met: requires preceptor authorization PIN if in trainee mode
      if (userRole === 'trainee') {
        setSessionToSign(sessionNumber);
        setPinModalOpen(true);
      } else {
        onQuickPreceptorSign(sessionNumber, 'Met');
      }
    }
  };

  const handlePinSuccess = (preceptor?: RegisteredPreceptor) => {
    setPinModalOpen(false);
    if (sessionToSign !== null && onQuickPreceptorSign) {
      const log = getLogForSession(sessionToSign);
      const newStatus = log?.status === 'Met' ? 'Pending' : 'Met';
      onQuickPreceptorSign(sessionToSign, newStatus, preceptor);
      setSessionToSign(null);
    }
  };

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
                <th className="py-3 px-3 font-bold text-center w-24">Preceptor Initials</th>
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
                                ? 'Competency verified as Met. Click to review or toggle (Preceptor PIN required).'
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
                            {isMet ? 'Verified' : 'Preceptor PIN'}
                          </span>
                        </td>

                        {/* Preceptor Initials */}
                        <td className="py-3 px-3 align-top text-center font-mono font-bold">
                          {log?.preceptorSignoff?.isSigned ? (
                            <span className="text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                              {log.preceptorSignoff.preceptorInitials || 'AT'}
                            </span>
                          ) : (
                            <span className="text-slate-300">___</span>
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
                              {log.attachments.length > 0 && (
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

      {/* Preceptor Security Authorization PIN Modal */}
      <PreceptorPinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setSessionToSign(null);
        }}
        onSuccess={handlePinSuccess}
        title="Preceptor / Mentor Verification Required"
        subtitle={
          sessionToSign
            ? `Only designated clinical preceptors or mentors can verify Session ${sessionToSign} and update its status to Met.`
            : 'Only designated clinical preceptors or mentors can update competency statuses.'
        }
      />
    </div>
  );
}
