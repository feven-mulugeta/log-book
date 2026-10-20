import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Building,
  ShieldCheck,
  Check,
  Edit3,
  BookOpen,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { TraineeInformation, CohortStudentRecord } from '../types/nursing';
import { getStoredPreceptors } from '../utils/storage';

interface TraineeInfoAndInstructionsProps {
  traineeInfo: TraineeInformation;
  onUpdateTraineeInfo: (info: TraineeInformation) => void;
  completedSessionsCount: number;
  totalSessionsCount: number;
  onResetToBlank: () => void;
  onResetToSample: () => void;
  onExportFullBackup: () => void;
  onImportBackupFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cohortStudents?: CohortStudentRecord[];
  onSelectStudent?: (student: CohortStudentRecord) => void;
}

export function TraineeInfoAndInstructions({
  traineeInfo,
  onUpdateTraineeInfo,
  completedSessionsCount,
  totalSessionsCount,
  onResetToBlank,
  onResetToSample,
  onExportFullBackup,
  onImportBackupFile,
  cohortStudents = [],
  onSelectStudent,
}: TraineeInfoAndInstructionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<TraineeInformation>(traineeInfo);
  const [confirmBlank, setConfirmBlank] = useState(false);

  useEffect(() => {
    setFormData(traineeInfo);
  }, [traineeInfo]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTraineeInfo(formData);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Official Header Block from Page 1 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 text-center border-b border-slate-200 bg-slate-50/50 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-teal-800 font-sans">
            NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase font-serif">
            CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION
          </h2>
          <p className="text-sm font-semibold tracking-wider text-slate-600 uppercase font-sans">
            CLINICAL TRAINING &amp; PRACTICE LOGBOOK
          </p>
          <div className="w-24 h-0.5 bg-slate-900 mx-auto mt-2" />
        </div>

        {/* Trainee Information Section from Page 1 */}
        <div className="p-6 sm:p-8 space-y-6">
          {cohortStudents.length > 1 && onSelectStudent && (
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="font-semibold text-slate-800">
                  Select / Switch Trainee Profile on this Device:
                </span>
              </div>
              <select
                value={traineeInfo.traineeId}
                onChange={(e) => {
                  const target = cohortStudents.find(
                    (s) => s.traineeInfo.traineeId === e.target.value
                  );
                  if (target) onSelectStudent(target);
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-teal-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                {cohortStudents.map((s, idx) => (
                  <option key={`cohort-opt-${s.id}-${s.traineeInfo.traineeId || idx}-${idx}`} value={s.traineeInfo.traineeId}>
                    {s.traineeInfo.traineeName || 'Unnamed Trainee'} ({s.traineeInfo.traineeId || 'ID Pending'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans">
                TRAINEE INFORMATION
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official clinical registration and assigned preceptor
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Information'}</span>
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    • Trainee Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.traineeName}
                    onChange={(e) => setFormData({ ...formData, traineeName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    • Trainee ID:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.traineeId}
                    onChange={(e) => setFormData({ ...formData, traineeId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    • Clinical Department / Ward:
                  </label>
                  <input
                    type="text"
                    required
                    list="trainee-info-wards-list"
                    value={formData.clinicalDepartmentWard}
                    onChange={(e) =>
                      setFormData({ ...formData, clinicalDepartmentWard: e.target.value })
                    }
                    placeholder="e.g. Medical ICU"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-semibold"
                  />
                  <datalist id="trainee-info-wards-list">
                    <option value="Medical ICU" />
                    <option value="Surgical Inpatient Ward 4B / Acute Care" />
                    <option value="Emergency Center & Trauma" />
                    <option value="Pediatric ICU (PICU)" />
                    <option value="Coronary Care Unit (CCU)" />
                    <option value="Resuscitation & Red Zone" />
                    <option value="Neuro-ICU & Stroke Unit" />
                    <option value="Renal & Hemodialysis Unit" />
                    <option value="Burns Critical Care Unit" />
                    <option value="Trauma & Orthopedic Ward" />
                    <option value="Main Operating Theatres" />
                    <option value="Medical High Dependency Unit (HDU)" />
                    <option value="Emergency Observation Unit" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    • Assigned Clinical Preceptor / Mentor:
                  </label>
                  <input
                    type="text"
                    required
                    list="registered-preceptors-list"
                    placeholder="Type name or select from directory"
                    value={formData.assignedClinicalPreceptor}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedClinicalPreceptor: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                  <datalist id="registered-preceptors-list">
                    {getStoredPreceptors().map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.title} ({p.wardDepartment})
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    • Training Period: From
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.trainingPeriodFrom}
                    onChange={(e) =>
                      setFormData({ ...formData, trainingPeriodFrom: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    • Training Period: To
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.trainingPeriodTo}
                    onChange={(e) => setFormData({ ...formData, trainingPeriodTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Trainee Details</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs font-serif bg-slate-50/70 p-5 rounded-xl border border-slate-200">
              <div className="space-y-1">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  • Trainee Name:
                </span>
                <p className="text-sm font-bold text-slate-900 font-sans">
                  {traineeInfo.traineeName || '______________________________________'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  • Trainee ID:
                </span>
                <p className="text-sm font-mono font-bold text-teal-900">
                  {traineeInfo.traineeId || '_________________________________'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  • Clinical Department / Ward:
                </span>
                <p className="text-xs font-sans text-slate-800">
                  {traineeInfo.clinicalDepartmentWard || '___________________________'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  • Assigned Clinical Preceptor / Mentor:
                </span>
                <p className="text-xs font-sans text-slate-800">
                  {traineeInfo.assignedClinicalPreceptor || '_________________'}
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-1 border-t border-slate-200/80">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  • Training Period:
                </span>
                <p className="text-xs font-sans text-slate-800">
                  From <strong className="text-slate-900">{traineeInfo.trainingPeriodFrom || '_________'}</strong> To{' '}
                  <strong className="text-slate-900">{traineeInfo.trainingPeriodTo || '_________'}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Clinical Rotations & Multi-Preceptor Note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs flex items-start gap-2.5">
            <span className="p-1.5 bg-amber-500/10 text-amber-900 rounded-lg shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
            </span>
            <div className="space-y-0.5">
              <span className="font-bold text-amber-950 block">Clinical Ward Rotations &amp; Multi-Preceptor Evaluations Supported</span>
              <p className="text-[11px] text-amber-900/80 leading-relaxed">
                As trainees rotate across different clinical wards (Medical ICU, Surgical, Emergency, PICU, CCU, etc.), different assigned preceptors and mentors evaluate and sign off individual sessions throughout the residency. Each session log in Part II permanently records the specific ward setting, preceptor credentials, and formative feedback.
              </p>
            </div>
          </div>

          {/* Instructions for Use from Page 1 */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-sans flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-teal-800" />
              <span>INSTRUCTIONS FOR USE</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 bg-white p-5 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="font-bold text-teal-900 shrink-0">1. Purpose:</span>
                <p>
                  This logbook tracks your clinical application, practical competencies, and
                  formative assessments for <strong>Core Competency 1: Clinical Judgment and Prioritization</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-bold text-teal-900 shrink-0">2. Recording:</span>
                <p>
                  Complete the respective entries following each session, simulation, or
                  supervised clinical practice assignment, and attach the expected learning
                  evidence for that session (e.g., assessment forms, care plans, chart audits, EWS
                  sheets, SBAR notes, reflective entries).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-bold text-teal-900 shrink-0">3. Sign-Off:</span>
                <p>
                  Every practical task and clinical assignment must be verified and signed by your
                  designated clinical preceptor, mentor, or educator.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-bold text-teal-900 shrink-0">4. Portfolio Integration:</span>
                <p>
                  Store completed pages in your professional nursing training portfolio for final
                  evaluation.
                </p>
              </div>
            </div>
          </div>

          {/* Data Persistence & Backup Management */}
          <div className="space-y-3 pt-4 border-t border-slate-200 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-800" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Data Persistence &amp; Storage Controls
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Auto-saved in your browser (LocalStorage)
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                <strong>How your data works:</strong> Every clinical session you record, reflection you
                write, evidence document you attach, and preceptor signature you collect is
                automatically preserved on this device. Your data will <strong>not be erased</strong> when
                you refresh, close the tab, or reopen the application.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                {confirmBlank ? (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                    <span className="text-[11px] text-rose-800 font-bold">
                      Erase all entries to start fresh?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onResetToBlank();
                        setConfirmBlank(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-700 hover:bg-rose-800 rounded transition-colors"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmBlank(false)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmBlank(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-300 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Start Fresh / Blank Logbook</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onResetToSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Demo Sample Data</span>
                </button>

                <button
                  type="button"
                  onClick={onExportFullBackup}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Backup Logbook (.json)</span>
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={onImportBackupFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Banner */}
        <div className="px-6 py-2.5 bg-slate-100 text-[11px] text-slate-500 font-serif flex items-center justify-between border-t border-slate-200">
          <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
          <span>Page 1</span>
        </div>
      </div>
    </div>
  );
}
