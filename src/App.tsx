import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Scan,
  TrendingUp,
  FileCheck,
  Paperclip,
  Plus,
  ShieldCheck,
  User,
  GraduationCap,
  Sparkles,
  Award,
  Clock,
  Printer,
  ChevronRight,
  CheckCircle2,
  FileText,
  Share2,
  Lock,
} from 'lucide-react';
import {
  TraineeInformation,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
  EvidenceAttachment,
  CohortStudentRecord,
  RegisteredPreceptor,
} from './types/nursing';
import {
  getStoredTraineeInfo,
  getStoredDetailedLogs,
  getStoredFinalSignoff,
  getStoredUserRole,
  getStoredCohortStudents,
  saveStoredTraineeInfo,
  saveStoredDetailedLogs,
  saveStoredFinalSignoff,
  saveStoredUserRole,
  saveStoredCohortStudents,
  saveStoredPreceptors,
  FULL_15_PRECEPTORS_ROSTER,
  resetStorageToBlank,
  resetStorageToSample,
  UserRole,
} from './utils/storage';
import { NCEP_SESSIONS_DEFINITIONS } from './data/ncepData';
import { TraineeInfoAndInstructions } from './components/TraineeInfoAndInstructions';
import { PartITrackingMatrix } from './components/PartITrackingMatrix';
import { PartIIDetailedLogSheets } from './components/PartIIDetailedLogSheets';
import { PartIIIFinalSignoff } from './components/PartIIIFinalSignoff';
import { InstructorCohortManager } from './components/InstructorCohortManager';
import { OcrScannerNcep } from './components/OcrScannerNcep';
import { NcepEvidenceVault } from './components/NcepEvidenceVault';
import { NcepAcademicPrintView } from './components/NcepAcademicPrintView';
import { UserManualModal } from './components/UserManualModal';
import { PreceptorPinModal } from './components/PreceptorPinModal';
import { ShareAccessModal } from './components/ShareAccessModal';
import { cloudSync } from './utils/cloudSync';
import { CloudSyncIndicator } from './components/CloudSyncIndicator';

type TabType = 'page1' | 'part1' | 'part2' | 'part3' | 'cohort' | 'ocr' | 'vault';

export default function App() {
  const [traineeInfo, setTraineeInfo] = useState<TraineeInformation>(getStoredTraineeInfo);
  const [detailedLogs, setDetailedLogs] = useState<DetailedActivityLogSheet[]>(getStoredDetailedLogs);
  const [finalSignoff, setFinalSignoff] = useState<FinalCompetencySignoff>(getStoredFinalSignoff);
  const [userRole, setUserRole] = useState<UserRole>(getStoredUserRole);
  const [cohortStudents, setCohortStudents] = useState<CohortStudentRecord[]>(getStoredCohortStudents);
  const [currentStudentRosterId, setCurrentStudentRosterId] = useState<string>(() => {
    const list = getStoredCohortStudents();
    return list[0]?.id || 'student-1';
  });
  const [activeTab, setActiveTab] = useState<TabType>('part1');
  const [targetSessionForPart2, setTargetSessionForPart2] = useState<number | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Security role restriction & PIN state
  const [authenticatedPreceptor, setAuthenticatedPreceptor] = useState<RegisteredPreceptor | null>(null);
  const [isRoleAuthModalOpen, setIsRoleAuthModalOpen] = useState<boolean>(false);
  const [targetRoleForAuth, setTargetRoleForAuth] = useState<'preceptor' | 'lead_educator'>('preceptor');
  const [pendingTabAfterAuth, setPendingTabAfterAuth] = useState<TabType | null>(null);

  // Flag to avoid echo loop when applying remote updates
  const isRemoteUpdateRef = useRef(false);

  // Check URL parameters for direct role links (e.g. ?role=preceptor or ?role=lead_educator or ?tab=cohort)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const tabParam = params.get('tab');
      if (roleParam === 'preceptor' || roleParam === 'mentor') {
        setTargetRoleForAuth('preceptor');
        setIsRoleAuthModalOpen(true);
      } else if (roleParam === 'lead_educator' || roleParam === 'instructor' || tabParam === 'cohort') {
        setTargetRoleForAuth('lead_educator');
        if (tabParam === 'cohort') setPendingTabAfterAuth('cohort');
        setIsRoleAuthModalOpen(true);
      }
    } catch (e) {
      console.error('URL params parsing error:', e);
    }
  }, []);

  // Cross-device cloud sync: listen to remote updates from server
  useEffect(() => {
    cloudSync.init();

    const unsubStudent = cloudSync.onStudentUpdated((remoteStudent, source) => {
      // 1. Update in cohort list
      setCohortStudents((prev) => {
        const idx = prev.findIndex(
          (s) =>
            (s.traineeInfo.traineeId && remoteStudent.traineeInfo.traineeId && s.traineeInfo.traineeId === remoteStudent.traineeInfo.traineeId) ||
            s.id === remoteStudent.id
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...remoteStudent, id: copy[idx].id };
          return copy;
        }
        const hasIdConflict = prev.some((s) => s.id === remoteStudent.id);
        const safeStudent = hasIdConflict
          ? { ...remoteStudent, id: `student-remote-${Date.now()}` }
          : remoteStudent;
        return [safeStudent, ...prev];
      });

      // 2. If it's the currently active student, update active screen state!
      if (
        remoteStudent.id === currentStudentRosterId ||
        (remoteStudent.traineeInfo.traineeId && remoteStudent.traineeInfo.traineeId === traineeInfo.traineeId)
      ) {
        isRemoteUpdateRef.current = true;
        setTraineeInfo(remoteStudent.traineeInfo);
        setDetailedLogs(remoteStudent.detailedLogs || []);
        setFinalSignoff(remoteStudent.finalSignoff);
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 150);
      }
    });

    const unsubCohort = cloudSync.onCohortUpdated((remoteCohort) => {
      if (Array.isArray(remoteCohort) && remoteCohort.length > 0) {
        const seen = new Set<string>();
        const sanitized = remoteCohort.map((s, idx) => {
          let safeId = s.id || `student-c-${Date.now()}-${idx}`;
          if (seen.has(safeId)) {
            safeId = `${safeId}-${Date.now().toString().slice(-4)}-${idx}`;
          }
          seen.add(safeId);
          return { ...s, id: safeId };
        });
        setCohortStudents(sanitized);
      }
    });

    const unsubPreceptors = cloudSync.onPreceptorsUpdated((remotePreceptors) => {
      if (Array.isArray(remotePreceptors) && remotePreceptors.length > 0) {
        saveStoredPreceptors(remotePreceptors);
      }
    });

    return () => {
      unsubStudent();
      unsubCohort();
      unsubPreceptors();
    };
  }, [currentStudentRosterId, traineeInfo.traineeId]);

  // Sync state to local storage
  useEffect(() => {
    saveStoredTraineeInfo(traineeInfo);
  }, [traineeInfo]);

  useEffect(() => {
    saveStoredDetailedLogs(detailedLogs);
  }, [detailedLogs]);

  useEffect(() => {
    saveStoredFinalSignoff(finalSignoff);
  }, [finalSignoff]);

  useEffect(() => {
    saveStoredUserRole(userRole);
  }, [userRole]);

  useEffect(() => {
    saveStoredCohortStudents(cohortStudents);
  }, [cohortStudents]);

  // Automatically broadcast local changes to the cloud server for other devices
  useEffect(() => {
    if (isRemoteUpdateRef.current) return;

    const studentRecord: CohortStudentRecord = {
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs,
      finalSignoff,
      updatedAt: new Date().toISOString(),
    };
    const isPreceptorRole = userRole === 'preceptor' || userRole === 'lead_educator';
    cloudSync.syncStudent(studentRecord, isPreceptorRole ? 'preceptor' : 'trainee');
  }, [traineeInfo, detailedLogs, finalSignoff, currentStudentRosterId, userRole]);

  // Security role switching & access control handlers
  const handleRoleSelectChange = (newRole: UserRole) => {
    if (newRole === 'trainee') {
      setUserRole('trainee');
      setAuthenticatedPreceptor(null);
      if (activeTab === 'cohort') {
        setActiveTab('part1');
      }
    } else if (newRole === 'preceptor') {
      if (authenticatedPreceptor && userRole === 'preceptor') return;
      setTargetRoleForAuth('preceptor');
      setPendingTabAfterAuth(null);
      setIsRoleAuthModalOpen(true);
    } else if (newRole === 'lead_educator') {
      if (authenticatedPreceptor?.role === 'lead_educator' && userRole === 'lead_educator') return;
      setTargetRoleForAuth('lead_educator');
      setPendingTabAfterAuth(null);
      setIsRoleAuthModalOpen(true);
    }
  };

  const handleLockRole = () => {
    setUserRole('trainee');
    setAuthenticatedPreceptor(null);
    if (activeTab === 'cohort') {
      setActiveTab('part1');
    }
  };

  const handleRoleAuthSuccess = (preceptor?: RegisteredPreceptor) => {
    setUserRole(targetRoleForAuth);
    setAuthenticatedPreceptor(preceptor || null);
    setIsRoleAuthModalOpen(false);
    if (pendingTabAfterAuth) {
      setActiveTab(pendingTabAfterAuth);
      setPendingTabAfterAuth(null);
    }
  };

  const handleTabClick = (tabId: TabType) => {
    if (tabId === 'cohort' && userRole === 'trainee') {
      setTargetRoleForAuth('lead_educator');
      setPendingTabAfterAuth('cohort');
      setIsRoleAuthModalOpen(true);
      return;
    }
    setActiveTab(tabId);
  };

  // Cohort handlers
  const handleSelectCohortStudent = (student: CohortStudentRecord, targetTab?: TabType) => {
    // Save current active student work into cohort list
    setCohortStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentRosterId || s.traineeInfo.traineeId === traineeInfo.traineeId) {
          return {
            ...s,
            traineeInfo,
            detailedLogs,
            finalSignoff,
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    // Switch to selected student
    setTraineeInfo(student.traineeInfo);
    setDetailedLogs(student.detailedLogs);
    setFinalSignoff(student.finalSignoff);
    setCurrentStudentRosterId(student.id);

    if (targetTab) {
      setActiveTab(targetTab);
    }
  };

  const handleAddCohortStudent = (newRecord: CohortStudentRecord) => {
    let resolvedId = newRecord.id;
    setCohortStudents((prev) => {
      const hasConflict = prev.some((s) => s.id === newRecord.id);
      if (hasConflict || !newRecord.id) {
        resolvedId = `student-add-${Date.now()}`;
      }
      return [{ ...newRecord, id: resolvedId }, ...prev];
    });
    setTraineeInfo(newRecord.traineeInfo);
    setDetailedLogs(newRecord.detailedLogs);
    setFinalSignoff(newRecord.finalSignoff);
    setCurrentStudentRosterId(resolvedId);
    setActiveTab('page1');
  };

  const handleDeleteCohortStudent = (studentId: string) => {
    setCohortStudents((prev) => {
      const updated = prev.filter(
        (s) => s.id !== studentId && s.traineeInfo.traineeId !== studentId
      );
      saveStoredCohortStudents(updated);
      cloudSync.syncCohort(updated);

      if (
        currentStudentRosterId === studentId ||
        traineeInfo.traineeId === studentId
      ) {
        if (updated.length > 0) {
          const next = updated[0];
          setCurrentStudentRosterId(next.id);
          setTraineeInfo(next.traineeInfo);
          setDetailedLogs(next.detailedLogs || []);
          setFinalSignoff(next.finalSignoff);
        } else {
          const blank = resetStorageToBlank();
          setTraineeInfo(blank.traineeInfo);
          setDetailedLogs(blank.detailedLogs);
          setFinalSignoff(blank.finalSignoff);
          setCurrentStudentRosterId('');
        }
      }

      return updated;
    });
  };

  const handleImportStudentDossier = (importedRecord: CohortStudentRecord) => {
    let resolvedId = importedRecord.id;
    setCohortStudents((prev) => {
      const idx = prev.findIndex(
        (s) =>
          (s.traineeInfo.traineeId &&
            importedRecord.traineeInfo.traineeId &&
            s.traineeInfo.traineeId === importedRecord.traineeInfo.traineeId) ||
          s.id === importedRecord.id
      );
      if (idx >= 0) {
        const copy = [...prev];
        resolvedId = copy[idx].id;
        copy[idx] = { ...importedRecord, id: resolvedId };
        return copy;
      }
      const hasConflict = prev.some((s) => s.id === importedRecord.id);
      if (hasConflict || !importedRecord.id) {
        resolvedId = `student-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      }
      return [{ ...importedRecord, id: resolvedId }, ...prev];
    });
    setTraineeInfo(importedRecord.traineeInfo);
    setDetailedLogs(importedRecord.detailedLogs);
    setFinalSignoff(importedRecord.finalSignoff);
    setCurrentStudentRosterId(resolvedId);
  };

  const handleImportMultipleStudentDossiers = (records: CohortStudentRecord[]) => {
    if (!records || records.length === 0) return;
    let firstId = records[0]?.id;

    setCohortStudents((prev) => {
      let copy = [...prev];
      records.forEach((rec, recIdx) => {
        const idx = copy.findIndex(
          (s) =>
            (s.traineeInfo.traineeId && rec.traineeInfo.traineeId && s.traineeInfo.traineeId === rec.traineeInfo.traineeId) ||
            s.id === rec.id
        );
        if (idx >= 0) {
          copy[idx] = { ...rec, id: copy[idx].id };
          if (recIdx === 0) firstId = copy[idx].id;
        } else {
          const hasConflict = copy.some((s) => s.id === rec.id);
          const safeId = hasConflict || !rec.id
            ? `student-batch-${Date.now()}-${recIdx}-${Math.random().toString(36).slice(2, 6)}`
            : rec.id;
          if (recIdx === 0) firstId = safeId;
          copy = [{ ...rec, id: safeId }, ...copy];
        }
      });
      return copy;
    });

    const first = records[0];
    if (first) {
      setTraineeInfo(first.traineeInfo);
      setDetailedLogs(first.detailedLogs);
      setFinalSignoff(first.finalSignoff);
      if (firstId) setCurrentStudentRosterId(firstId);
    }
  };

  const handleUpdateCohortStudent = (updatedStudent: CohortStudentRecord) => {
    setCohortStudents((prev) => {
      const idx = prev.findIndex(
        (s) => s.id === updatedStudent.id || s.traineeInfo.traineeId === updatedStudent.traineeInfo.traineeId
      );
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedStudent;
        saveStoredCohortStudents(copy);
        cloudSync.syncCohort(copy);
        return copy;
      }
      return prev;
    });

    if (
      currentStudentRosterId === updatedStudent.id ||
      traineeInfo.traineeId === updatedStudent.traineeInfo.traineeId
    ) {
      setTraineeInfo(updatedStudent.traineeInfo);
      setDetailedLogs(updatedStudent.detailedLogs || []);
      setFinalSignoff(updatedStudent.finalSignoff);
    }
    cloudSync.syncStudent(
      updatedStudent,
      'preceptor',
      `Rotated ward/assigned preceptor for ${updatedStudent.traineeInfo.traineeName}`
    );
  };

  // Preceptor Quick Status Sign-Off from Part I Tracking Matrix
  const handleQuickPreceptorSignFromMatrix = (
    sessionNumber: number,
    newStatus: 'Met' | 'Pending',
    preceptor?: RegisteredPreceptor
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const effectiveName = preceptor
      ? preceptor.name
      : traineeInfo.assignedClinicalPreceptor || 'Abaynesh Mekonnen';
    const effectiveInitials = preceptor
      ? preceptor.initials
      : effectiveName
          .split(' ')
          .filter((w: string) => w.length > 0 && !w.includes('.') && !w.includes(','))
          .map((w: string) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase() || 'AM';

    const defaultComment = preceptor
      ? `Competency demonstrated and validated by ${preceptor.name} (${preceptor.title} · ${preceptor.wardDepartment}).`
      : 'Competency evaluated and validated by preceptor.';

    setDetailedLogs((prev) => {
      const existingIdx = prev.findIndex((l) => l.sessionNumber === sessionNumber);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const current = copy[existingIdx];
        copy[existingIdx] = {
          ...current,
          status: newStatus,
          dateOfActivity: current.dateOfActivity || today,
          preceptorSignoff:
            newStatus === 'Met'
              ? {
                  isSigned: true,
                  preceptorName: effectiveName,
                  preceptorInitials: effectiveInitials,
                  competencyDemonstrated: 'Satisfactory',
                  comments: current.preceptorSignoff?.comments || defaultComment,
                  dateSigned: today,
                }
              : undefined,
        };
        return copy;
      } else {
        const sessionDef = NCEP_SESSIONS_DEFINITIONS.find((s) => s.sessionNumber === sessionNumber);
        const newLog: DetailedActivityLogSheet = {
          id: `log-matrix-${sessionNumber}-${Date.now()}`,
          sessionNumber,
          sessionTitle: sessionDef?.sessionTitle || `Session ${sessionNumber}`,
          subCompetencyId: sessionDef?.subCompetencyId || 'sub_comp_1',
          subCompetencyTitle: sessionDef?.subCompetencyTitle || '',
          dateOfActivity: today,
          durationHours: 4,
          clinicalSettingWard: preceptor?.wardDepartment || traineeInfo.clinicalDepartmentWard || 'Clinical Ward',
          activityDescription: `Completed required clinical activity for Session ${sessionNumber}: ${sessionDef?.requiredActivity || ''}`,
          reflectiveNotesLessonsLearned: `Demonstrated clinical judgment, followed protocols and integrated patient-centered care.`,
          attachments: [],
          status: newStatus,
          source: 'manual',
          createdAt: today,
          preceptorSignoff:
            newStatus === 'Met'
              ? {
                  isSigned: true,
                  preceptorName: effectiveName,
                  preceptorInitials: effectiveInitials,
                  competencyDemonstrated: 'Satisfactory',
                  comments: defaultComment,
                  dateSigned: today,
                }
              : undefined,
        };
        return [newLog, ...prev];
      }
    });
  };

  // Handler: Save or update detailed log sheet
  const handleSaveLogSheet = (newLog: DetailedActivityLogSheet) => {
    setDetailedLogs((prev) => {
      const idx = prev.findIndex((l) => l.id === newLog.id || l.sessionNumber === newLog.sessionNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newLog;
        return copy;
      }
      return [newLog, ...prev];
    });
  };

  // Handler: Import logs from OCR
  const handleImportOcrLogs = (newLogs: DetailedActivityLogSheet[]) => {
    setDetailedLogs((prev) => {
      const updated = [...prev];
      newLogs.forEach((nl) => {
        const idx = updated.findIndex((l) => l.sessionNumber === nl.sessionNumber);
        if (idx >= 0) {
          updated[idx] = nl;
        } else {
          updated.push(nl);
        }
      });
      return updated;
    });
  };

  // Handler: Add attachment to log
  const handleAddAttachmentToLog = (logId: string, attachment: EvidenceAttachment) => {
    setDetailedLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, attachments: [...l.attachments, attachment] } : l))
    );
  };

  // Switch to Part II with specific session
  const handleOpenDetailedLogForSession = (sessionNum: number) => {
    setTargetSessionForPart2(sessionNum);
    setActiveTab('part2');
  };

  // Reset to blank slate for a new real trainee
  const handleResetToBlank = () => {
    const blank = resetStorageToBlank();
    setTraineeInfo(blank.traineeInfo);
    setDetailedLogs(blank.detailedLogs);
    setFinalSignoff(blank.finalSignoff);
  };

  // Reset to sample demo data
  const handleResetToSample = () => {
    const sample = resetStorageToSample();
    setTraineeInfo(sample.traineeInfo);
    setDetailedLogs(sample.detailedLogs);
    setFinalSignoff(sample.finalSignoff);
  };

  // Export full backup JSON
  const handleExportFullBackup = () => {
    const backupData = {
      system: 'NCEP Core Competency 1 Clinical Practice Logbook',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      traineeInfo,
      detailedLogs,
      finalSignoff,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCEP_LOGBOOK_BACKUP_${traineeInfo.traineeId || 'RECORD'}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import full backup JSON
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.traineeInfo) setTraineeInfo(parsed.traineeInfo);
        if (Array.isArray(parsed.detailedLogs)) setDetailedLogs(parsed.detailedLogs);
        if (parsed.finalSignoff) setFinalSignoff(parsed.finalSignoff);
      } catch (err) {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const metCount = NCEP_SESSIONS_DEFINITIONS.filter((s) => {
    const log = detailedLogs.find((l) => l.sessionNumber === s.sessionNumber);
    return log?.status === 'Met';
  }).length;

  const totalAttachments = detailedLogs.reduce((acc, l) => acc + l.attachments.length, 0);

  const currentStudentRecord: CohortStudentRecord = cohortStudents.find(
    (s) => s.id === currentStudentRosterId || s.traineeInfo.traineeId === traineeInfo.traineeId
  ) || {
    id: currentStudentRosterId,
    traineeInfo,
    detailedLogs,
    finalSignoff,
    updatedAt: new Date().toISOString(),
  };

  const handleForceSync = () => {
    cloudSync.syncStudent(
      currentStudentRecord,
      userRole === 'preceptor' || userRole === 'lead_educator' ? 'preceptor' : 'trainee',
      'Manual synchronization requested'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* Printable 7-Page View matching the PDF */}
      <NcepAcademicPrintView
        traineeInfo={traineeInfo}
        detailedLogs={detailedLogs}
        finalSignoff={finalSignoff}
      />

      {/* Screen Interface (Hidden during Print) */}
      <div className="print:hidden flex flex-col min-h-screen">
        {/* Top Header Strip */}
        <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40">
          {/* Institutional sub-strip */}
          <div className="bg-teal-950 text-teal-100 text-[11px] px-4 sm:px-8 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold tracking-wide">
                NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-teal-300 font-medium">
                CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION
              </span>
              {userRole !== 'trainee' ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-teal-900/90 border border-teal-700/90 text-teal-100 px-2 py-0.5 rounded text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {userRole === 'lead_educator' ? 'Lead Educator' : 'Preceptor'}:{' '}
                      <strong className="text-white">
                        {authenticatedPreceptor ? authenticatedPreceptor.name : 'Authorized Staff'}
                      </strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLockRole}
                    className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors"
                    title="Lock preceptor access and return to Trainee mode"
                  >
                    <Lock className="w-3 h-3 text-amber-300" />
                    <span>Lock / Return</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-teal-400 font-medium">Role:</span>
                  <select
                    value={userRole}
                    onChange={(e) => handleRoleSelectChange(e.target.value as UserRole)}
                    className="bg-teal-900 text-teal-100 border border-teal-700/80 rounded px-1.5 py-0.5 text-[11px] cursor-pointer"
                  >
                    <option value="trainee">Trainee ({traineeInfo.traineeName.split(' ')[0] || 'Student'})</option>
                    <option value="preceptor">🔒 Clinical Preceptor (PIN)</option>
                    <option value="lead_educator">🔒 Lead Clinical Educator (PIN)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Primary Branding Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs font-serif">
                NCEP
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight font-serif">
                    Clinical Training &amp; Practice Logbook
                  </h1>
                  <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60 font-sans">
                    Core Competency 1
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Trainee: {traineeInfo.traineeName} ({traineeInfo.traineeId}) · {traineeInfo.clinicalDepartmentWard}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 font-sans flex-wrap">
              <CloudSyncIndicator
                currentStudent={currentStudentRecord}
                onForceSync={handleForceSync}
                userRole={userRole}
              />

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-teal-100/90 hover:bg-teal-200 border border-teal-300/80 rounded-xl transition-colors shadow-2xs"
                title="Share Links & Access Permissions Guide"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-800" />
                <span>Share Links</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/90 rounded-xl transition-colors shadow-2xs"
                title="View & Download Word (.docx) User Manuals"
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                <span>Word Manuals</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ocr')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-colors"
              >
                <Scan className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">OCR Soft Copy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetSessionForPart2(1);
                  setActiveTab('part2');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Session</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation Navigation Bar strictly following the PDF Parts */}
          <div className="max-w-7xl mx-auto px-4 sm:px-8 border-t border-slate-200/70 font-sans">
            <nav className="flex space-x-6 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'page1', label: 'Trainee Info & Instructions' },
                {
                  id: 'part1',
                  label: 'Part I: Tracking Matrix',
                  badge: `${metCount}/18 Met`,
                },
                {
                  id: 'part2',
                  label: 'Part II: Detailed Log Sheets',
                  badge: `${detailedLogs.length} Sheets`,
                },
                {
                  id: 'part3',
                  label: 'Part III: Final Sign-Off',
                  badge: finalSignoff.isCertified ? 'Certified' : undefined,
                },
                {
                  id: 'cohort',
                  label: 'Instructor & Cohorts',
                  badge: userRole === 'trainee' ? '🔒 Restricted' : `${cohortStudents.length} Students`,
                },
                { id: 'ocr', label: 'AI OCR Soft Copy Digitizer' },
                {
                  id: 'vault',
                  label: 'Evidence Vault',
                  badge: `${totalAttachments} Files`,
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as TabType)}
                    className={`py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'border-teal-700 text-teal-900 font-semibold'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                          isActive
                            ? 'bg-teal-100 text-teal-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          {activeTab === 'page1' && (
            <TraineeInfoAndInstructions
              traineeInfo={traineeInfo}
              onUpdateTraineeInfo={(info) => setTraineeInfo(info)}
              completedSessionsCount={metCount}
              totalSessionsCount={NCEP_SESSIONS_DEFINITIONS.length}
              onResetToBlank={handleResetToBlank}
              onResetToSample={handleResetToSample}
              onExportFullBackup={handleExportFullBackup}
              onImportBackupFile={handleImportBackupFile}
              cohortStudents={cohortStudents}
              onSelectStudent={handleSelectCohortStudent}
            />
          )}

          {activeTab === 'part1' && (
            <PartITrackingMatrix
              detailedLogs={detailedLogs}
              onOpenDetailedLogForSession={handleOpenDetailedLogForSession}
              onCreateNewDetailedLogForSession={handleOpenDetailedLogForSession}
              onQuickPreceptorSign={handleQuickPreceptorSignFromMatrix}
              userRole={userRole}
            />
          )}

          {activeTab === 'part2' && (
            <PartIIDetailedLogSheets
              logs={detailedLogs}
              onSaveLog={handleSaveLogSheet}
              onAddAttachmentToLog={handleAddAttachmentToLog}
              activeSessionToOpen={targetSessionForPart2}
              onClearActiveSession={() => setTargetSessionForPart2(null)}
              userRole={userRole}
            />
          )}

          {activeTab === 'part3' && (
            <PartIIIFinalSignoff
              traineeInfo={traineeInfo}
              detailedLogs={detailedLogs}
              finalSignoff={finalSignoff}
              onUpdateFinalSignoff={(s) => setFinalSignoff(s)}
              userRole={userRole}
            />
          )}

          {activeTab === 'cohort' && (
            <InstructorCohortManager
              cohortStudents={cohortStudents}
              currentStudentId={traineeInfo.traineeId}
              onSelectStudent={handleSelectCohortStudent}
              onAddStudent={handleAddCohortStudent}
              onDeleteStudent={handleDeleteCohortStudent}
              onImportStudentDossier={handleImportStudentDossier}
              onImportMultipleStudentDossiers={handleImportMultipleStudentDossiers}
              onUpdateStudent={handleUpdateCohortStudent}
              userRole={userRole}
              onRequireLeadEducatorAuth={() => {
                setTargetRoleForAuth('lead_educator');
                setIsRoleAuthModalOpen(true);
              }}
            />
          )}

          {activeTab === 'ocr' && (
            <OcrScannerNcep
              onImportOcrLogs={handleImportOcrLogs}
              onNavigateToMatrix={() => setActiveTab('part1')}
            />
          )}

          {activeTab === 'vault' && (
            <NcepEvidenceVault
              logs={detailedLogs}
              onOpenAttachmentModalForSession={handleOpenDetailedLogForSession}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500 font-serif mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook
            </span>
            <div className="font-sans text-[11px] text-slate-500 flex items-center gap-2">
              <span>Trainee: {traineeInfo.traineeName}</span>
              <span>·</span>
              <span>Preceptor: {traineeInfo.assignedClinicalPreceptor}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* User Manual Modal (Word .docx download & in-app viewer) */}
      <UserManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      {/* Share Links & Access Restriction Guide Modal */}
      <ShareAccessModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Security Role Authorization Modal for Preceptors & Lead Educators */}
      <PreceptorPinModal
        isOpen={isRoleAuthModalOpen}
        onClose={() => {
          setIsRoleAuthModalOpen(false);
          setPendingTabAfterAuth(null);
        }}
        onSuccess={handleRoleAuthSuccess}
        requiredRole={targetRoleForAuth}
        title={
          targetRoleForAuth === 'lead_educator'
            ? 'Lead Clinical Educator Master Authorization'
            : 'Clinical Preceptor / Mentor PIN Authorization'
        }
        subtitle={
          targetRoleForAuth === 'lead_educator'
            ? 'Access to the Instructor & Cohorts portal is restricted to Lead Clinical Educators. Enter the institutional master passcode.'
            : 'Access to Preceptor Mode is restricted to assigned hospital mentors. Enter your confidential 4-digit PIN.'
        }
      />
    </div>
  );
}
