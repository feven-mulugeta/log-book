import React, { useState } from 'react';
import {
  Download,
  X,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  MousePointer,
  HelpCircle,
  FileText,
  Key,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  downloadStudentManual,
  downloadMentorManual,
} from '../utils/wordManualGenerator';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserManualModal({ isOpen, onClose }: UserManualModalProps) {
  const [activeManualTab, setActiveManualTab] = useState<'student' | 'mentor'>('student');
  const [isDownloadingStudent, setIsDownloadingStudent] = useState(false);
  const [isDownloadingMentor, setIsDownloadingMentor] = useState(false);

  if (!isOpen) return null;

  const handleDownloadStudent = async () => {
    try {
      setIsDownloadingStudent(true);
      await downloadStudentManual();
    } catch (e) {
      console.error(e);
      alert('Error generating Student Word Document. Please check browser permissions.');
    } finally {
      setIsDownloadingStudent(false);
    }
  };

  const handleDownloadMentor = async () => {
    try {
      setIsDownloadingMentor(true);
      await downloadMentorManual();
    } catch (e) {
      console.error(e);
      alert('Error generating Mentor Word Document. Please check browser permissions.');
    } finally {
      setIsDownloadingMentor(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-teal-950 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-800/60 rounded-xl border border-teal-700/50">
              <BookOpen className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-700/60">
                  Nursing Competency Enhancement Program (NCEP)
                </span>
                <span className="text-xs text-teal-200 font-mono">Word (.docx) Ready</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                NCEP Core Competency 1: Standardized Operational Manuals
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Word Document Download Action Cards */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Student Word Doc Card */}
            <div className="p-4 bg-white rounded-xl border border-teal-200 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-teal-50 rounded-xl text-teal-800 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900">Student &amp; Trainee Manual</h3>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded">
                      .DOCX
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Complete student operational guide with detailed breakdown of every application part, cursor use, activity logging, reflective notes, and weekly backups.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadStudent}
                disabled={isDownloadingStudent}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingStudent ? 'Generating Word File...' : 'Download Student Manual (Word .docx)'}</span>
              </button>
            </div>

            {/* Mentor & Preceptor Word Doc Card */}
            <div className="p-4 bg-white rounded-xl border border-amber-200 shadow-2xs flex flex-col justify-between space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-800 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-slate-900">Preceptor &amp; Mentor Manual</h3>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 bg-amber-100 text-amber-950 rounded">
                      .DOCX
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Supervisory guide for clinical mentors: 15-preceptor directory administration, individual PIN authentication, formative evaluations, and final certification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadMentor}
                disabled={isDownloadingMentor}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloadingMentor ? 'Generating Word File...' : 'Download Preceptor Manual (Word .docx)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Toggle for Reading In-App */}
        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveManualTab('student')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeManualTab === 'student'
                  ? 'border-teal-700 text-teal-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Read Student Manual In-App</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveManualTab('mentor')}
              className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeManualTab === 'mentor'
                  ? 'border-amber-600 text-amber-950'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Read Preceptor Manual In-App</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Nursing Competency Enhancement Program (NCEP) Official Docs
          </span>
        </div>

        {/* Manual Reader Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed bg-white">
          {activeManualTab === 'student' ? (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Student Header */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-teal-800 tracking-wider">
                  Nursing Competency Enhancement Program (NCEP) • Core Competency 1
                </span>
                <h3 className="text-base font-bold text-teal-950">
                  Student &amp; Clinical Nurse Trainee Operational Manual
                </h3>
                <p className="text-[11px] text-teal-900 font-medium flex items-center gap-1.5">
                  <span className="font-bold bg-teal-100/80 px-1.5 py-0.5 rounded border border-teal-200">Target Audience:</span>
                  <span>NCEP Trainees</span>
                </p>
              </div>

              {/* Cursor Guide Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <MousePointer className="w-4 h-4 text-teal-700" />
                  <span>Exhaustive Interactive Cursor &amp; Pointer Guide</span>
                </h4>
                <p>
                  As you navigate the logbook on desktop or mobile, your cursor/touch state will change to reflect available actions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <span>👆 Hand Pointer (cursor-pointer)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears over tabs, &quot;+ Log Task&quot; buttons, dropdowns, and file upload buttons. Click to trigger actions or switch screens.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <span>Ɪ Text I-Beam (cursor-text)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears over profile inputs, Description of Activity, and Reflective Notes. Click to place your typing cursor and record clinical observations.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <span>✍️ Crosshair / Pen (cursor-crosshair)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Active on the digital signature canvas pad. Click and drag with mouse, finger, or stylus to draw your official physical signature.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <span>🔍 Zoom-In (cursor-zoom-in)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears when hovering over evidence document thumbnails in the Evidence Vault. Click to inspect high-resolution clinical notes.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <span>🚫 Lock / Not-Allowed (cursor-not-allowed)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears over preceptor sign-off fields or locked evaluation ratings. Students cannot modify mentor feedback without an authorized PIN.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block flex items-center gap-1.5">
                      <span>⏳ Spinner / Wait (cursor-wait)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears during Word manual download, PDF dossier printing, and camera OCR processing while the system compiles documents.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guide to Every Part of App */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <Layers className="w-4 h-4 text-teal-700" />
                  <span>Guide to Every Part of the Application</span>
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 bg-teal-50/50 rounded-lg border border-teal-100">
                    <strong className="text-teal-950 font-bold block">1. Top Navigation &amp; Header Bar</strong>
                    <p className="text-slate-600 mt-0.5">
                      Houses your active name, ward, program title, Role Selector dropdown, &quot;Word Manuals&quot; button, and &quot;Print PDF&quot; shortcut.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">2. Tab 1: Trainee Information &amp; Instructions</strong>
                    <p className="text-slate-600 mt-0.5">
                      Enter your legal student name, university ID, current ward, and assigned preceptor. At the bottom, access the 4 storage controls: <em>Start Fresh, Restore Demo, Backup Logbook (.json), and Restore from Backup</em>.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">3. Tab 2: Part I - Tracking Matrix</strong>
                    <p className="text-slate-600 mt-0.5">
                      Master competency dashboard displaying all 18 clinical sessions, progress percentage, completion dates, and preceptor verification stamps. Click &quot;+ Log Task&quot; on any row to begin writing.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">4. Tab 3: Part II - Detailed Log Sheets</strong>
                    <p className="text-slate-600 mt-0.5">
                      Clinical shift records containing Section 1 (Shift details), Section 2 (Description of Activity &amp; Reflective Notes), and Section 3 (Preceptor PIN evaluation and digital signature).
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">5. Tab 4: Evidence Vault</strong>
                    <p className="text-slate-600 mt-0.5">
                      Central repository for de-identified SBAR handover notes, Early Warning Score charts, and ECG strips. Click thumbnails to inspect full images.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">6. Tab 5: OCR Scanner</strong>
                    <p className="text-slate-600 mt-0.5">
                      Converts bedside handwritten notes and paper logbook pages directly into digital logbook text using your camera.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">7. Tab 7: Part III - Final Sign-Off &amp; Tab 8: Print Academic Dossier</strong>
                    <p className="text-slate-600 mt-0.5">
                      Summative graduation sign-off once 18/18 sessions are met, and official 7-page Ministry of Health / AAU academic printout.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step by step */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-700" />
                  <span>How to Log Description of Activity &amp; Reflective Notes</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-teal-900 block font-bold">1. Description of Activity Performed:</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Describe the clinical case, patient presentation, physiological data gathered (vitals, EWS score, labs), nursing interventions performed, and your rationale for task prioritization.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-teal-900 block font-bold">2. Reflective Notes &amp; Lessons Learned:</strong>
                    <p className="text-slate-600 leading-relaxed">
                      Critical self-reflection: Did you recognize deterioration early? How effective was your SBAR communication? What challenges occurred, and what would you do differently next time?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Mentor Header */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">
                  Nursing Competency Enhancement Program (NCEP) • Core Competency 1
                </span>
                <h3 className="text-base font-bold text-amber-950">
                  Clinical Preceptor &amp; Mentor Operational Guide
                </h3>
                <p className="text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
                  <span className="font-bold bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200">Target Audience:</span>
                  <span>Preceptors and Mentors</span>
                </p>
              </div>

              {/* Cursor Guide Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <MousePointer className="w-4 h-4 text-amber-700" />
                  <span>Exhaustive Cursor &amp; Supervisory Pointer Guide</span>
                </h4>
                <p>
                  Supervisors and preceptors utilize specialized interactive cursors during evaluation and cohort review:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-950 block flex items-center gap-1.5">
                      <span>👆 Hand Pointer (cursor-pointer)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears over &quot;Sign Met&quot;, &quot;Sign as Preceptor&quot;, student table rows in Cohort Manager, and PIN reveal toggle. Click to authorize or inspect.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-950 block flex items-center gap-1.5">
                      <span>Ɪ Text I-Beam (cursor-text)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Appears in the 4-digit PIN modal input and the Preceptor Feedback &amp; Formative Coaching textarea. Click to type your confidential code and coaching notes.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-950 block flex items-center gap-1.5">
                      <span>✍️ Crosshair / Pen (cursor-crosshair)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Active on the digital signature pad in Section 3 and Part III. Draw your physical signature using your mouse, tablet stylus, or fingertip.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-amber-950 block flex items-center gap-1.5">
                      <span>🔍 Zoom-In (cursor-zoom-in)</span>
                    </span>
                    <p className="text-slate-600 mt-0.5">
                      Hovering over student SBAR handover sheets and EWS charts in the Evidence Vault to verify clinical documentation authenticity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guide to Every Part of App for Preceptors */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <Layers className="w-4 h-4 text-amber-700" />
                  <span>Guide to Every Supervisory Part of the Application</span>
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200">
                    <strong className="text-amber-950 font-bold block">1. Part I: Tracking Matrix (1-Click Quick Signing)</strong>
                    <p className="text-slate-600 mt-0.5">
                      Click &quot;Sign Met&quot; on any session row, enter your 4-digit PIN, and your initials (e.g. AT) and date are stamped immediately.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">2. Part II: Detailed Log Sheets (Formative Review &amp; Section 3)</strong>
                    <p className="text-slate-600 mt-0.5">
                      Audit student case descriptions and reflections. Click &quot;Sign as Preceptor&quot;, enter PIN, select performance rating (Satisfactory / Needs Improvement / Excellent), add coaching feedback, and sign.
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">3. Cohort &amp; Instructors Hub (Evaluating Trainees from the Portal)</strong>
                    <p className="text-slate-600 mt-0.5">
                      Manage cohort progress, audit enrolled trainees, and evaluate students with 1-click action buttons on any trainee row:
                    </p>
                    <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-[11px] text-slate-700 pl-1 font-sans">
                      <li><strong className="text-teal-900">Part I Matrix:</strong> Opens trainee’s 18-session matrix for milestone sign-offs.</li>
                      <li><strong className="text-blue-900">Part II Form:</strong> Opens Section 3 (Formative Evaluation) to score competency, write qualitative coaching notes, and sign.</li>
                      <li><strong className="text-purple-900">Part III Sign-off:</strong> Opens the Final Summative Evaluation Rubric and Institutional Certification.</li>
                      <li><strong className="text-amber-900">Rotate Ward:</strong> Rotates the trainee to a new ward (Medical ICU, Surgical, Emergency, PICU, CCU, etc.) and assigns their new preceptor/mentor with 1 click while permanently preserving all past evaluations!</li>
                      <li><strong className="text-slate-900">Import Student Dossier &amp; Roster:</strong> Click &ldquo;Import Student Dossier&rdquo; in the roster header. Accepts <strong>.json</strong> (digital student dossier backups containing all 18 logs, reflections, and preceptor ratings) and <strong>.csv</strong> (cohort spreadsheet rosters for bulk-enrolling students). Supports multi-file selection, drag-and-drop, and direct text paste with instant preview!</li>
                    </ul>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 font-bold block">4. Part III: Final Competency Sign-Off</strong>
                    <p className="text-slate-600 mt-0.5">
                      Summative program evaluation locked until 18/18 sessions are achieved. Lead Educator executes final certification generating a cryptographic verification hash.
                    </p>
                  </div>
                </div>
              </div>

              {/* 15 Preceptor Directory */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b pb-1">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Managing the 15 Preceptors &amp; Mentors Directory</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-[11px] pl-2">
                  <li><strong>⚡ Load 15 Preceptors:</strong> 1-click button in the directory header to populate the full hospital faculty roster across all ICU and Emergency units with assigned PINs.</li>
                  <li><strong>Batch Import / CSV:</strong> Quick-paste custom department rosters with names, roles, and wards.</li>
                  <li><strong>+ Add Preceptor:</strong> Register individual mentors with custom PINs.</li>
                  <li><strong>Show / Hide PINs:</strong> Toggle visibility when assigning passcodes to preceptor staff.</li>
                  <li><strong>Export CSV:</strong> Download a spreadsheet backup of your department faculty roster.</li>
                </ul>
              </div>

              {/* Clinical Rotations & Multi-Preceptor Evaluations */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-300 space-y-2">
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Clinical Rotations &amp; Multi-Preceptor Evaluation Protocol</span>
                </h4>
                <p className="text-[11px] text-amber-900/90 leading-relaxed">
                  <strong>Does the application accommodate student rotations from one ward to another where preceptors change?</strong> Yes, the NCEP system is natively designed for clinical rotations:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-950/90 pl-1">
                  <li><strong>Multi-Preceptor Attribution:</strong> Every single session (Sessions 1 to 18) can be supervised, evaluated, and signed off by a different preceptor or mentor. When an instructor enters their 4-digit PIN, their individual name, role, department, and initials are permanently attributed to that session.</li>
                  <li><strong>Ward-Specific Log Sheets:</strong> Each log sheet in Part II has its own dedicated <em>Clinical Setting / Ward</em> field, recording precisely which unit (Medical ICU, Surgical Ward 4B, Emergency &amp; Trauma, PICU, CCU, etc.) that clinical activity occurred in.</li>
                  <li><strong>1-Click Ward Rotation:</strong> In the Cohort Manager, click <em>&ldquo;Rotate Ward&rdquo;</em> on any trainee to rotate them to a new department and assign their next primary preceptor. All previous evaluations, signatures, and notes remain intact!</li>
                </ul>
              </div>

              {/* Real-Time Cross-Device Synchronization */}
              <div className="p-3.5 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 space-y-2">
                <h4 className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-700" />
                  <span>Real-Time Cross-Device Synchronization (Instructor ⟷ Student)</span>
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Both preceptors and students can use their own separate devices simultaneously. When an instructor signs or leaves feedback on their laptop, it appears live on the student’s phone screen. When a student writes reflections or uploads evidence on their phone, it displays instantly on the instructor’s workstation. Click the <strong>&ldquo;Live Cloud Sync&rdquo;</strong> button in the header at any time to share the app link or force a sync.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Nursing Competency Enhancement Program (NCEP) • Ministry of Health &amp; AAU Standards</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadStudent}
              className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Student Word (.docx)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMentor}
              className="px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Mentor Word (.docx)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
