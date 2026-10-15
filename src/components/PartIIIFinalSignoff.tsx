import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Printer,
  Download,
  Lock,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  TraineeInformation,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
} from '../types/nursing';
import { NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';
import { SignaturePad } from './SignaturePad';
import { PreceptorPinModal } from './PreceptorPinModal';
import { generateNcepVerificationHash } from '../utils/storage';

interface PartIIIFinalSignoffProps {
  traineeInfo: TraineeInformation;
  detailedLogs: DetailedActivityLogSheet[];
  finalSignoff: FinalCompetencySignoff;
  onUpdateFinalSignoff: (signoff: FinalCompetencySignoff) => void;
  userRole: 'trainee' | 'preceptor' | 'lead_educator';
}

export function PartIIIFinalSignoff({
  traineeInfo,
  detailedLogs,
  finalSignoff,
  onUpdateFinalSignoff,
  userRole,
}: PartIIIFinalSignoffProps) {
  const [leadEducatorName, setLeadEducatorName] = useState(
    finalSignoff.leadEducatorName || 'Dr. Berhanu Mengiste, PhD, RN'
  );
  const [showSigPad, setShowSigPad] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(
    finalSignoff.signatureDataUrl || null
  );

  const handleInitiateSign = () => {
    if (userRole === 'trainee') {
      setIsPinModalOpen(true);
    } else {
      setShowSigPad(true);
    }
  };

  const metCount = NCEP_SESSIONS_DEFINITIONS.filter((s) => {
    const log = detailedLogs.find((l) => l.sessionNumber === s.sessionNumber);
    return log?.status === 'Met';
  }).length;

  const isAllSessionsMet = metCount === NCEP_SESSIONS_DEFINITIONS.length;

  const handleAdoptSignature = (sigUrl: string) => {
    setSignatureDataUrl(sigUrl);
    setShowSigPad(false);

    const now = new Date().toISOString().slice(0, 10);
    const hash = generateNcepVerificationHash(traineeInfo.traineeId, now);

    const updated: FinalCompetencySignoff = {
      isCertified: true,
      leadEducatorName: leadEducatorName.trim() || 'Lead Clinical Educator',
      leadEducatorTitle: 'Lead Clinical Educator / Program Coordinator',
      signatureDataUrl: sigUrl,
      dateSigned: now,
      verificationHash: hash,
    };

    onUpdateFinalSignoff(updated);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0f766e', '#1e3a8a', '#059669'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDossier = () => {
    const payload = {
      program: 'NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)',
      competency: 'CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION',
      document: 'CLINICAL TRAINING & PRACTICE LOGBOOK CERTIFICATION',
      traineeInformation: traineeInfo,
      certification: finalSignoff,
      completedSessionsCount: metCount,
      totalSessionsCount: NCEP_SESSIONS_DEFINITIONS.length,
      allSessionsStatus: NCEP_SESSIONS_DEFINITIONS.map((s) => {
        const log = detailedLogs.find((l) => l.sessionNumber === s.sessionNumber);
        return {
          sessionNumber: s.sessionNumber,
          sessionTitle: s.sessionTitle,
          subCompetency: s.subCompetencyTitle,
          dateCompleted: log?.dateOfActivity || null,
          status: log?.status || 'Pending',
          preceptorInitials: log?.preceptorSignoff?.preceptorInitials || null,
          preceptorComments: log?.preceptorSignoff?.comments || null,
        };
      }),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCEP_CORE_COMPETENCY_1_CERTIFIED_${traineeInfo.traineeId || 'RECORD'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (Hidden on print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs font-sans">
        <div>
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Academic Validation &amp; Endorsement</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            PART III: FINAL COMPETENCY SIGN-OFF &amp; CERTIFICATION
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal certification of Core Competency 1: Clinical Judgment and Prioritization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadDossier}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download JSON Dossier</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save Certified PDF</span>
          </button>
        </div>
      </div>

      {/* Progress Pre-requisite Warning */}
      {!isAllSessionsMet && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center justify-between font-sans">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <p className="font-bold">Formative Evaluation In Progress</p>
              <p className="text-[11px] text-amber-800">
                {metCount} of {NCEP_SESSIONS_DEFINITIONS.length} sessions completed and verified by
                preceptors. You may certify in advance or review pending sessions in Part I.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Official Certificate Sheet Matching PDF Page 7 */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-8 sm:p-12 max-w-3xl mx-auto space-y-8 font-serif text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Header from PDF */}
        <div className="text-center space-y-2 border-b border-slate-200 pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-800 font-sans">
            NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase">
            PART III: FINAL COMPETENCY SIGN-OFF
          </h2>
          <p className="text-xs font-sans text-slate-600 font-bold uppercase tracking-wider">
            CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION
          </p>
        </div>

        {/* Trainee Details Summary */}
        <div className="grid grid-cols-2 gap-4 text-xs font-sans bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Trainee Name:</span>
            <p className="font-bold text-slate-900 text-sm">{traineeInfo.traineeName}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Trainee ID:</span>
            <p className="font-mono font-bold text-teal-900 text-sm">{traineeInfo.traineeId}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Clinical Department / Ward:</span>
            <p className="text-slate-800">{traineeInfo.clinicalDepartmentWard}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500">Assigned Clinical Preceptor:</span>
            <p className="text-slate-800">{traineeInfo.assignedClinicalPreceptor}</p>
          </div>
        </div>

        {/* Exact Certification Text from Page 7 */}
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-300 text-center space-y-3">
          <p className="text-base sm:text-lg leading-relaxed text-slate-900 font-medium">
            This is to certify that the trainee has successfully completed all required sessions,
            practical assignments, and formative assessments outlined in{' '}
            <strong>Core Competency 1: Clinical Judgment and Prioritization</strong>.
          </p>
          <div className="text-xs font-sans text-emerald-800 font-bold flex items-center justify-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Formative Portfolio Validation Complete: {metCount} / {NCEP_SESSIONS_DEFINITIONS.length} Sessions Satisfactory</span>
          </div>
        </div>

        {/* Exact Sign-off Lines from Page 7 */}
        <div className="pt-6 border-t border-slate-300 space-y-6 font-sans text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                • Lead Clinical Educator / Coordinator Name:
              </label>
              <input
                type="text"
                value={leadEducatorName}
                onChange={(e) => setLeadEducatorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">• Date:</label>
              <p className="font-mono font-semibold text-slate-900 py-2 border-b border-slate-300">
                {finalSignoff.dateSigned || new Date().toISOString().slice(0, 10)}
              </p>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-2">• Signature:</label>
            {finalSignoff.signatureDataUrl ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-48 bg-white rounded border border-slate-200 p-1">
                    <img
                      src={finalSignoff.signatureDataUrl}
                      alt="Educator signature"
                      className="h-full object-contain mx-auto"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{finalSignoff.leadEducatorName}</p>
                    <p className="text-[11px] text-emerald-800 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Academic Endorsement Confirmed
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleInitiateSign}
                  className="text-xs text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded-lg"
                >
                  Change
                </button>
              </div>
            ) : showSigPad ? (
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl">
                <SignaturePad
                  preceptorName={leadEducatorName}
                  onSave={handleAdoptSignature}
                  onCancel={() => setShowSigPad(false)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={handleInitiateSign}
                className="w-full py-6 border-2 border-dashed border-teal-300 bg-teal-50/50 hover:bg-teal-50 rounded-xl text-teal-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Award className="w-5 h-5 text-teal-700" />
                <span>Click to Sign as Lead Clinical Educator / Coordinator</span>
              </button>
            )}
          </div>
        </div>

        {/* Verification Token */}
        {finalSignoff.verificationHash && (
          <div className="pt-4 border-t border-slate-200 text-center font-sans text-[11px] text-slate-500 space-y-1">
            <p className="font-mono font-bold text-teal-900">
              OFFICIAL VERIFICATION HASH: {finalSignoff.verificationHash}
            </p>
            <p>
              Certified and archived in the institutional clinical clerkship registry.
            </p>
          </div>
        )}

        {/* Footer Banner from PDF */}
        <div className="pt-4 text-[11px] text-slate-500 font-serif flex items-center justify-between border-t border-slate-200">
          <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
          <span>Page 7</span>
        </div>
      </div>

      {/* Security Authorization PIN Modal for Lead Educator */}
      <PreceptorPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={(preceptor) => {
          setIsPinModalOpen(false);
          if (preceptor) {
            setLeadEducatorName(preceptor.name);
          }
          setShowSigPad(true);
        }}
        title="Lead Educator / Coordinator Authorization"
        subtitle="Only the lead clinical educator or authorized program coordinator can execute final certification for this trainee. Please enter your authorization PIN."
      />
    </div>
  );
}
