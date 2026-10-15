import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Paperclip,
  Calendar,
  AlertCircle,
  Eye,
  Edit2,
  ChevronDown,
  ChevronUp,
  Download,
  Award,
  Lock,
} from 'lucide-react';
import {
  DetailedActivityLogSheet,
  EvidenceAttachment,
  PreceptorSignoff,
  CompetencyRating,
  NCEPSessionDefinition,
  RegisteredPreceptor,
} from '../types/nursing';
import { NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';
import { SignaturePad } from './SignaturePad';
import { EvidenceAttachmentModal } from './EvidenceAttachmentModal';
import { PreceptorPinModal } from './PreceptorPinModal';

interface PartIIDetailedLogSheetsProps {
  logs: DetailedActivityLogSheet[];
  onSaveLog: (log: DetailedActivityLogSheet) => void;
  onAddAttachmentToLog: (logId: string, attachment: EvidenceAttachment) => void;
  activeSessionToOpen?: number | null;
  onClearActiveSession?: () => void;
  userRole: 'trainee' | 'preceptor' | 'lead_educator';
}

export function PartIIDetailedLogSheets({
  logs,
  onSaveLog,
  onAddAttachmentToLog,
  activeSessionToOpen,
  onClearActiveSession,
  userRole,
}: PartIIDetailedLogSheetsProps) {
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form State for Part II Sheet
  const [selectedSessionNumber, setSelectedSessionNumber] = useState<number>(
    activeSessionToOpen || 1
  );
  const [dateOfActivity, setDateOfActivity] = useState(new Date().toISOString().slice(0, 10));
  const [durationHours, setDurationHours] = useState<number>(4);
  const [clinicalSettingWard, setClinicalSettingWard] = useState(
    'Surgical Inpatient Ward 4B / Acute Care'
  );
  const [activityDescription, setActivityDescription] = useState('');
  const [reflectiveNotes, setReflectiveNotes] = useState('');
  const [attachments, setAttachments] = useState<EvidenceAttachment[]>([]);

  // Preceptor Signing State
  const [signingLog, setSigningLog] = useState<DetailedActivityLogSheet | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingLogToSign, setPendingLogToSign] = useState<DetailedActivityLogSheet | null>(null);
  const [preceptorName, setPreceptorName] = useState('Sister Almaz Tesfaye, RN, MSc Clinical Nursing');
  const [preceptorInitials, setPreceptorInitials] = useState('AT');
  const [competencyDemonstrated, setCompetencyDemonstrated] = useState<CompetencyRating>('Satisfactory');
  const [preceptorComments, setPreceptorComments] = useState(
    'Demonstrated sound clinical judgment, followed aseptic principles and accurately prioritized patient needs.'
  );
  const [showPreceptorSigPad, setShowPreceptorSigPad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const openPreceptorSigningModal = (log: DetailedActivityLogSheet, preceptor?: RegisteredPreceptor) => {
    setSigningLog(log);
    if (preceptor) {
      setPreceptorName(preceptor.name);
      setPreceptorInitials(preceptor.initials);
      setPreceptorComments(
        `Competency demonstrated and validated by ${preceptor.name} (${preceptor.title} · ${preceptor.wardDepartment}).`
      );
    } else {
      setPreceptorName(log.preceptorSignoff?.preceptorName || 'Sister Almaz Tefera, RN, MSc');
      setPreceptorInitials(log.preceptorSignoff?.preceptorInitials || 'AT');
      setPreceptorComments(
        log.preceptorSignoff?.comments ||
        'Demonstrated sound clinical judgment, followed aseptic principles and accurately prioritized patient needs.'
      );
    }
    setCompetencyDemonstrated(log.preceptorSignoff?.competencyDemonstrated || 'Satisfactory');
    setShowPreceptorSigPad(false);
    setSignatureDataUrl(log.preceptorSignoff?.signatureDataUrl || null);
  };

  const handleInitiatePreceptorSign = (log: DetailedActivityLogSheet) => {
    if (userRole === 'trainee') {
      setPendingLogToSign(log);
      setIsPinModalOpen(true);
    } else {
      openPreceptorSigningModal(log);
    }
  };

  // Evidence Attachment Modal state
  const [attachingToLogId, setAttachingToLogId] = useState<string | null>(null);
  const [lightboxAttachment, setLightboxAttachment] = useState<EvidenceAttachment | null>(null);

  // Auto-open editor if activeSessionToOpen is passed
  React.useEffect(() => {
    if (activeSessionToOpen) {
      const existing = logs.find((l) => l.sessionNumber === activeSessionToOpen);
      if (existing) {
        handleOpenEdit(existing);
      } else {
        handleOpenNewForSession(activeSessionToOpen);
      }
      if (onClearActiveSession) onClearActiveSession();
    }
  }, [activeSessionToOpen]);

  const handleOpenNewForSession = (sessionNum: number) => {
    const sessionDef = NCEP_SESSIONS_DEFINITIONS.find((s) => s.sessionNumber === sessionNum);
    setSelectedSessionNumber(sessionNum);
    setDateOfActivity(new Date().toISOString().slice(0, 10));
    setDurationHours(4);
    setClinicalSettingWard('Surgical Inpatient Ward 4B / Acute Care');
    setActivityDescription('');
    setReflectiveNotes('');
    setAttachments([]);
    setEditingLogId(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (log: DetailedActivityLogSheet) => {
    setSelectedSessionNumber(log.sessionNumber);
    setDateOfActivity(log.dateOfActivity);
    setDurationHours(log.durationHours);
    setClinicalSettingWard(log.clinicalSettingWard);
    setActivityDescription(log.activityDescription);
    setReflectiveNotes(log.reflectiveNotesLessonsLearned);
    setAttachments(log.attachments);
    setEditingLogId(log.id);
    setIsEditorOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionDef = NCEP_SESSIONS_DEFINITIONS.find(
      (s) => s.sessionNumber === Number(selectedSessionNumber)
    )!;

    const existingLog = editingLogId ? logs.find((l) => l.id === editingLogId) : null;

    const updatedLog: DetailedActivityLogSheet = {
      id: editingLogId || `ncep-log-${Date.now()}`,
      sessionNumber: sessionDef.sessionNumber,
      sessionTitle: sessionDef.sessionTitle,
      subCompetencyId: sessionDef.subCompetencyId,
      subCompetencyTitle: sessionDef.subCompetencyTitle,
      dateOfActivity,
      durationHours: Number(durationHours) || 4,
      clinicalSettingWard: clinicalSettingWard.trim() || 'Clinical Ward',
      activityDescription: activityDescription.trim(),
      reflectiveNotesLessonsLearned: reflectiveNotes.trim(),
      attachments: existingLog ? existingLog.attachments : attachments,
      preceptorSignoff: existingLog?.preceptorSignoff,
      status: existingLog?.preceptorSignoff?.isSigned ? 'Met' : 'Pending',
      source: existingLog?.source || 'manual',
      createdAt: existingLog?.createdAt || new Date().toISOString(),
    };

    onSaveLog(updatedLog);
    setIsEditorOpen(false);
  };

  const handleCompletePreceptorSign = () => {
    if (!signingLog || !signatureDataUrl) return;

    const signoff: PreceptorSignoff = {
      isSigned: true,
      preceptorName: preceptorName.trim() || 'Clinical Preceptor',
      preceptorInitials: preceptorInitials.trim() || 'CP',
      signatureDataUrl,
      dateSigned: new Date().toISOString().slice(0, 10),
      competencyDemonstrated,
      comments: preceptorComments.trim(),
    };

    const updated: DetailedActivityLogSheet = {
      ...signingLog,
      preceptorSignoff: signoff,
      status: competencyDemonstrated === 'Satisfactory' ? 'Met' : 'Pending',
    };

    onSaveLog(updated);
    setSigningLog(null);
    setShowPreceptorSigPad(false);
    setSignatureDataUrl(null);
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedSessionFilter !== 'all' && log.sessionNumber !== Number(selectedSessionFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">
            PART II: DETAILED CLINICAL ACTIVITY LOG SHEETS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 italic">
            (Make copies of this template for each clinical session or practice assignment performed).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSessionFilter}
            onChange={(e) => setSelectedSessionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Logged Sessions ({logs.length})</option>
            {NCEP_SESSIONS_DEFINITIONS.map((s) => (
              <option key={s.sessionNumber} value={s.sessionNumber}>
                Session {s.sessionNumber}: {s.sessionTitle.slice(0, 30)}...
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleOpenNewForSession(1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity Sheet</span>
          </button>
        </div>
      </div>

      {/* Log Sheets List */}
      <div className="space-y-6">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const isSigned = log.preceptorSignoff?.isSigned;
            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-slate-300 shadow-2xs overflow-hidden font-serif"
              >
                {/* Header from PDF Page 5 */}
                <div className="p-6 bg-slate-50/70 border-b border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-teal-800">
                      {log.subCompetencyTitle}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-sans font-bold px-2.5 py-0.5 rounded border ${
                          log.status === 'Met'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        Status: {log.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(log)}
                        className="text-xs font-sans font-semibold text-slate-700 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200"
                      >
                        Edit Sheet
                      </button>
                    </div>
                  </div>

                  {/* Header metadata lines strictly following PDF Page 5 */}
                  <div className="space-y-2 text-xs font-sans text-slate-800 pt-1">
                    <p>
                      <strong>Session Number &amp; Title:</strong>{' '}
                      <span className="font-semibold text-slate-900">
                        Session {log.sessionNumber}: {log.sessionTitle}
                      </span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <p>
                        <strong>Date of Activity:</strong>{' '}
                        <span className="font-mono">{log.dateOfActivity}</span>
                      </p>
                      <p>
                        <strong>Duration (Hours):</strong>{' '}
                        <span>{log.durationHours} Hours</span>
                      </p>
                      <p className="sm:col-span-2">
                        <strong>Clinical Setting / Ward:</strong>{' '}
                        <span>{log.clinicalSettingWard}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Body: Section 1 & Section 2 from PDF Page 5 */}
                <div className="p-6 space-y-6">
                  {/* 1. Description of Activity Performed */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-sans text-slate-900 uppercase">
                      1. Description of Activity Performed:{' '}
                      <span className="font-normal normal-case text-slate-500 italic">
                        (Summarize the assessment, diagnosis, prioritization, care planning, escalation,
                        intervention, delegation, or evaluation task undertaken, and the patient context
                        without identifiers.)
                      </span>
                    </h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                      {log.activityDescription || 'No description recorded yet.'}
                    </div>
                  </div>

                  {/* 2. Reflective Notes & Lessons Learned */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold font-sans text-slate-900 uppercase">
                      2. Reflective Notes &amp; Lessons Learned:{' '}
                      <span className="font-normal normal-case text-slate-500 italic">
                        (What went well? What challenges did you encounter regarding data accuracy,
                        prioritization, early recognition of deterioration, escalation, documentation, or
                        patient status? How would you handle it differently next time?)
                      </span>
                    </h4>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                      {log.reflectiveNotesLessonsLearned || 'No reflective notes recorded yet.'}
                    </div>
                  </div>

                  {/* Attachment Site for Each Session */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold font-sans text-slate-900 uppercase flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-teal-800" />
                          <span>Session Learning Evidence Attachments ({log.attachments.length})</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-sans">
                          Expected for this session:{' '}
                          <span className="font-semibold text-teal-900">
                            {NCEP_SESSIONS_DEFINITIONS.find((s) => s.sessionNumber === log.sessionNumber)
                              ?.expectedEvidenceType}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachingToLogId(log.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-sans font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Attach Evidence</span>
                      </button>
                    </div>

                    {log.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {log.attachments.map((att) => (
                          <div
                            key={att.id}
                            onClick={() => setLightboxAttachment(att)}
                            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-teal-600 transition-colors cursor-pointer flex items-center gap-3 group"
                          >
                            <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="overflow-hidden flex-1 font-sans">
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-900">
                                {att.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {att.type.replace('_', ' ')} · Click to inspect
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs font-sans text-slate-500">
                        No learning evidence attached for this session yet.{' '}
                        <button
                          type="button"
                          onClick={() => setAttachingToLogId(log.id)}
                          className="text-teal-800 font-semibold underline"
                        >
                          Attach evidence document now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Preceptor / Mentor Feedback & Formative Evaluation from PDF Page 5 & 6 */}
                  <div className="p-5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h4 className="text-xs font-bold font-sans text-slate-900 uppercase">
                        3. Preceptor / Mentor Feedback &amp; Formative Evaluation:
                      </h4>
                      {!isSigned && (
                        <div className="flex items-center gap-2">
                          {userRole === 'trainee' && (
                            <span className="text-[11px] font-sans font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>Preceptor Only</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleInitiatePreceptorSign(log)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors shadow-2xs"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {userRole === 'trainee' ? 'Preceptor Sign-off (PIN)' : 'Sign Formative Sheet'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Competency Demonstrated Checkboxes */}
                    <div className="space-y-1 font-sans text-xs">
                      <span className="font-bold text-slate-700">• Competency Demonstrated:</span>
                      <div className="flex items-center gap-6 pt-1">
                        {(['Satisfactory', 'Needs Improvement', 'Unsatisfactory'] as CompetencyRating[]).map(
                          (cat) => {
                            const isChecked = log.preceptorSignoff?.competencyDemonstrated === cat;
                            return (
                              <label key={cat} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  disabled
                                  checked={isChecked}
                                  className="h-4 w-4 rounded border-slate-300 text-teal-800"
                                />
                                <span
                                  className={`text-xs ${
                                    isChecked ? 'font-bold text-slate-900' : 'text-slate-500'
                                  }`}
                                >
                                  {cat}
                                </span>
                              </label>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {/* Specific Preceptor Comments */}
                    <div className="space-y-1 font-sans text-xs">
                      <span className="font-bold text-slate-700">
                        • Specific Preceptor / Mentor Comments / Actionable Advice:
                      </span>
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs italic text-slate-800">
                        {log.preceptorSignoff?.comments ? (
                          <span>&ldquo;{log.preceptorSignoff.comments}&rdquo;</span>
                        ) : (
                          <span className="text-slate-400 not-italic">
                            Awaiting preceptor evaluation and feedback.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preceptor Name, Signature & Date from PDF Page 6 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 font-sans text-xs">
                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block">
                          • Preceptor / Mentor Name:
                        </span>
                        <p className="font-semibold text-slate-900 mt-1">
                          {log.preceptorSignoff?.preceptorName || '______________________________'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block">• Signature:</span>
                        {log.preceptorSignoff?.signatureDataUrl ? (
                          <div className="h-10 w-36 bg-white rounded border border-slate-200 p-1 mt-1">
                            <img
                              src={log.preceptorSignoff.signatureDataUrl}
                              alt="Preceptor signature"
                              className="h-full object-contain"
                            />
                          </div>
                        ) : (
                          <p className="font-mono text-slate-400 mt-1">______________________</p>
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] font-bold text-slate-600 block">• Date Signed:</span>
                        <p className="font-mono font-semibold text-slate-900 mt-1">
                          {log.preceptorSignoff?.dateSigned || '______________________'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Banner from PDF */}
                <div className="px-6 py-2.5 bg-slate-100 text-[11px] text-slate-500 font-serif flex items-center justify-between border-t border-slate-200">
                  <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
                  <span>Pages 5 – 6</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 font-sans">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No Detailed Log Sheets Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &ldquo;New Activity Sheet&rdquo; or click &ldquo;Log Task&rdquo; from Part I to
              record a clinical activity template for any of the 18 sessions.
            </p>
          </div>
        )}
      </div>

      {/* Editor Modal for Part II Log Sheet */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  PART II: DETAILED CLINICAL ACTIVITY LOG SHEET
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete entries following each session, simulation or supervised assignment
                </p>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
              {/* Session Selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Session Number &amp; Title:
                </label>
                <select
                  value={selectedSessionNumber}
                  onChange={(e) => setSelectedSessionNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold"
                >
                  {NCEP_SESSIONS_DEFINITIONS.map((s) => (
                    <option key={s.sessionNumber} value={s.sessionNumber}>
                      Session {s.sessionNumber}: {s.sessionTitle} ({s.subCompetencyTitle.split(':')[0]})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-teal-800 mt-1">
                  Expected Activity:{' '}
                  {NCEP_SESSIONS_DEFINITIONS.find((s) => s.sessionNumber === selectedSessionNumber)
                    ?.requiredActivity}
                </p>
              </div>

              {/* Date, Duration & Setting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date of Activity:</label>
                  <input
                    type="date"
                    required
                    value={dateOfActivity}
                    onChange={(e) => setDateOfActivity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Hours):</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical Setting / Ward:</label>
                  <input
                    type="text"
                    required
                    value={clinicalSettingWard}
                    onChange={(e) => setClinicalSettingWard(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* 1. Description */}
              <div>
                <label className="block font-bold text-slate-900 mb-1 uppercase">
                  1. Description of Activity Performed:
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5 italic">
                  (Summarize the assessment, diagnosis, prioritization, care planning, escalation,
                  intervention, delegation, or evaluation task undertaken, and the patient context without
                  identifiers.)
                </p>
                <textarea
                  rows={4}
                  required
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  placeholder="Detail the clinical task, assessment steps, clinical decisions, and anonymized patient presentation..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* 2. Reflective Notes */}
              <div>
                <label className="block font-bold text-slate-900 mb-1 uppercase">
                  2. Reflective Notes &amp; Lessons Learned:
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5 italic">
                  (What went well? What challenges did you encounter regarding data accuracy,
                  prioritization, early recognition of deterioration, escalation, documentation, or patient
                  status? How would you handle it differently next time?)
                </p>
                <textarea
                  rows={4}
                  required
                  value={reflectiveNotes}
                  onChange={(e) => setReflectiveNotes(e.target.value)}
                  placeholder="Analyze what went well, communication nuances, technical barriers, and specific future adjustments..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors shadow-2xs"
                >
                  Save Activity Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preceptor Formative Sign-off Modal from PDF Page 5 & 6 */}
      {signingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
                <h3 className="text-sm font-bold">
                  3. Preceptor / Mentor Feedback &amp; Formative Evaluation
                </h3>
              </div>
              <button
                onClick={() => setSigningLog(null)}
                className="text-teal-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-900">
                  Session {signingLog.sessionNumber}: {signingLog.sessionTitle}
                </span>
                <p className="text-[11px] text-slate-600">
                  Trainee Activity Date: {signingLog.dateOfActivity} · Ward: {signingLog.clinicalSettingWard}
                </p>
              </div>

              {/* Competency Demonstrated: Satisfactory / Needs Improvement / Unsatisfactory */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  • Competency Demonstrated:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Satisfactory', 'Needs Improvement', 'Unsatisfactory'] as CompetencyRating[]).map(
                    (rate) => (
                      <button
                        type="button"
                        key={rate}
                        onClick={() => setCompetencyDemonstrated(rate)}
                        className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-colors ${
                          competencyDemonstrated === rate
                            ? 'border-teal-700 bg-teal-50 text-teal-900'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {rate}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  • Specific Preceptor / Mentor Comments / Actionable Advice:
                </label>
                <textarea
                  rows={3}
                  value={preceptorComments}
                  onChange={(e) => setPreceptorComments(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Preceptor Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    • Preceptor / Mentor Name:
                  </label>
                  <input
                    type="text"
                    value={preceptorName}
                    onChange={(e) => setPreceptorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    • Preceptor Initials:
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={preceptorInitials}
                    onChange={(e) => setPreceptorInitials(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Signature Pad */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">• Signature:</label>
                {signatureDataUrl ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <img
                      src={signatureDataUrl}
                      alt="Signature"
                      className="h-10 object-contain bg-white rounded p-1 border"
                    />
                    <button
                      type="button"
                      onClick={() => setSignatureDataUrl(null)}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Redraw
                    </button>
                  </div>
                ) : (
                  <SignaturePad
                    preceptorName={preceptorName}
                    onSave={(url) => setSignatureDataUrl(url)}
                    onCancel={() => setSigningLog(null)}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSigningLog(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompletePreceptorSign}
                  disabled={!signatureDataUrl}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl"
                >
                  Confirm &amp; Sign Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Attachment Modal */}
      {attachingToLogId && (
        <EvidenceAttachmentModal
          isOpen={!!attachingToLogId}
          onClose={() => setAttachingToLogId(null)}
          onSave={(attachment) => {
            onAddAttachmentToLog(attachingToLogId, attachment);
            setAttachingToLogId(null);
          }}
          entryTitle={`Session ${logs.find((l) => l.id === attachingToLogId)?.sessionNumber}: ${
            logs.find((l) => l.id === attachingToLogId)?.sessionTitle
          }`}
        />
      )}

      {/* Lightbox Viewer */}
      {lightboxAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">{lightboxAttachment.name}</h4>
              <button
                type="button"
                onClick={() => setLightboxAttachment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex-1 flex items-center justify-center overflow-auto max-h-[70vh]">
              <img
                src={lightboxAttachment.dataUrl}
                alt={lightboxAttachment.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>
            {lightboxAttachment.notes && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-700">
                <strong>Notes:</strong> {lightboxAttachment.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preceptor Security Authorization PIN Modal */}
      <PreceptorPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingLogToSign(null);
        }}
        onSuccess={(preceptor) => {
          setIsPinModalOpen(false);
          if (pendingLogToSign) {
            openPreceptorSigningModal(pendingLogToSign, preceptor);
            setPendingLogToSign(null);
          }
        }}
        title="Preceptor / Mentor Security Authorization"
        subtitle="Only designated clinical preceptors or mentors can evaluate this activity and sign."
      />
    </div>
  );
}
