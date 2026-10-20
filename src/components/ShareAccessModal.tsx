import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  UserCheck,
  GraduationCap,
  Users,
  X,
  ExternalLink,
  Key,
  Award,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
} from 'lucide-react';
import { getPreceptorPin, getStoredPreceptors } from '../utils/storage';

interface ShareAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareAccessModal({ isOpen, onClose }: ShareAccessModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Compute origin and base URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const traineeUrl = baseUrl;
  const preceptorUrl = `${baseUrl}?role=preceptor`;
  const leadEducatorUrl = `${baseUrl}?role=lead_educator&tab=cohort`;

  const preceptors = getStoredPreceptors();
  const masterPin = getPreceptorPin();

  const handleCopy = async (url: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('textarea');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800 rounded-xl">
              <Share2 className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Role Links &amp; Access Restriction Guide
              </h3>
              <p className="text-xs text-teal-200">
                How trainees, preceptors, and lead educators access the NCEP Logbook securely
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-teal-900 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-800 text-xs">
          {/* Quick Answer Banner */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-teal-950 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Is the link for trainees and preceptors the same?</span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              <strong>Yes! The core web address is the same.</strong> Both trainees and preceptors use the same platform. However, to prevent unauthorized changes, <strong>preceptor and educator features are protected by confidential PINs</strong>.
            </p>
            <p className="text-slate-600 text-[11px]">
              You can also share direct role-specific links below so preceptors or trainees open in their designated mode right away.
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Shareable Links for Your Team
            </h4>

            {/* 1. Trainee Link */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <span className="font-bold text-slate-900 text-xs">Trainee / Student Link</span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-full">
                    No PIN Required
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(traineeUrl, 'trainee')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-teal-600 hover:text-teal-700 transition-colors shadow-2xs"
                >
                  {copiedKey === 'trainee' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                Share this link with your nursing trainees. They can log clinical activities, enter reflections, attach evidence, and view their tracking matrix. They <strong>cannot sign off competencies or change instructor rosters</strong>.
              </p>
              <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 select-all truncate">
                {traineeUrl}
              </div>
            </div>

            {/* 2. Preceptor Link */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <span className="font-bold text-slate-900 text-xs">Clinical Preceptor / Mentor Link</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-semibold px-2 py-0.5 rounded-full">
                    Assigned PIN Protected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(preceptorUrl, 'preceptor')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-sky-600 hover:text-sky-700 transition-colors shadow-2xs"
                >
                  {copiedKey === 'preceptor' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                Share this link with hospital mentors (e.g. Ward In-Charges, ICU Preceptors). Opening this link prompts them for their <strong>assigned Preceptor PIN</strong>. Once verified, they can sign off sessions and validate competencies.
              </p>
              <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 select-all truncate">
                {preceptorUrl}
              </div>
            </div>

            {/* 3. Lead Educator Link */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <span className="font-bold text-slate-900 text-xs">Lead Clinical Educator &amp; Cohort Admin Link</span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full">
                    Master Passcode Protected
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(leadEducatorUrl, 'lead')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-purple-600 hover:text-purple-700 transition-colors shadow-2xs"
                >
                  {copiedKey === 'lead' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-600">
                For yourself and academic coordinators. Grants administrative access to the entire student cohort roster, student dossier imports, preceptor PIN management, and final institutional certification.
              </p>
              <div className="font-mono text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 select-all truncate">
                {leadEducatorUrl}
              </div>
            </div>
          </div>

          {/* How Restriction Works */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-teal-700" />
              <span>How Preceptor &amp; Educator Access is Restricted</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] text-slate-600">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                  1. Assigned PINs
                </span>
                <span>
                  Each clinical preceptor (currently {preceptors.length} registered) has their own confidential PIN. Preceptors can evaluate students and sign competencies, but cannot add new trainees or instructors.
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-purple-600" />
                  2. Lead Educator Admin
                </span>
                <span>
                  <strong>Only Lead Clinical Educators</strong> can enroll trainees, import Word dossiers, register preceptors/mentors, and issue final certification.
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  3. Master Passcode
                </span>
                <span>
                  The Lead Educator can set and change the institutional master passcode in the <strong>Instructor &amp; Cohorts</strong> tab anytime.
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  4. Trainee Guard
                </span>
                <span>
                  Trainees cannot switch to Preceptor/Lead Educator mode or access administrative tabs without an authorized staff PIN.
                </span>
              </div>
            </div>
          </div>

          {/* Apple & Cross-Device Compatibility Card */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-xl space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-teal-300" />
                <h4 className="font-bold text-xs text-white">Apple Devices Support (iPhone, iPad, Mac)</h4>
              </div>
              <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                100% Compatible
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              The application runs smoothly on any modern Apple browser (Safari, Chrome, Edge, Firefox) without requiring any App Store download.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] text-slate-200">
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-teal-300 block flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  iPhone (iOS)
                </span>
                <span className="text-[10px] text-slate-300 leading-tight block">
                  Touch-optimized navigation, native camera OCR logbook scanning, and Safari <em>&ldquo;Add to Home Screen&rdquo;</em> for full-screen PWA launch.
                </span>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-teal-300 block flex items-center gap-1">
                  <Tablet className="w-3.5 h-3.5" />
                  iPad (iPadOS)
                </span>
                <span className="text-[10px] text-slate-300 leading-tight block">
                  Dual-pane clinical layout, finger and <strong>Apple Pencil</strong> support on the preceptor signature pad with zero palm interference.
                </span>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-1">
                <span className="font-bold text-teal-300 block flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" />
                  Mac (macOS)
                </span>
                <span className="text-[10px] text-slate-300 leading-tight block">
                  Safari / Chrome desktop dashboard with spreadsheet CSV bulk roster import, Word (.docx) manual generator, and official academic PDF printing.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500">
            Registered preceptors: <strong>{preceptors.length} active mentors</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
