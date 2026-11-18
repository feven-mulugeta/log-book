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
  Unlock,
  KeyRound,
  Database,
  LogIn,
  LogOut,
  AlertCircle,
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
  getStoredPreceptors,
  saveStoredTraineeInfo,
  saveStoredDetailedLogs,
  saveStoredFinalSignoff,
  saveStoredUserRole,
  saveStoredCohortStudents,
  saveStoredPreceptors,
  FULL_15_PRECEPTORS_ROSTER,
  resetStorageToBlank,
  resetStorageToSample,
  isStudentUnlocked,
  setStudentUnlocked,
  lockStudent,
  lockAllStudents,
  getStudentPin,
  normalizeStudentRecord,
  normalizeTraineeInfo,
  normalizeDetailedLog,
  normalizeFinalSignoff,
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
import { StudentPinModal } from './components/StudentPinModal';
import { StudentChangePinModal } from './components/StudentChangePinModal';
import { ShareAccessModal } from './components/ShareAccessModal';
import { cloudSync } from './utils/cloudSync';
import { CloudSyncIndicator } from './components/CloudSyncIndicator';
import { useFirebaseAuth } from './contexts/FirebaseContext';
import {
  ensureUserDocuments,
  checkIsStaffInFirestore,
  seedInitialInstitutionalDataIfAdmin,
  loadAllCohortStudentsForAdmin,
  loadOwnedStudentsForUser,
  loadStudentFromFirestore,
  saveStudentDossierToFirestore,
  registerStaffMemberInFirestore,
  deleteStudentFromFirestoreIfAdmin,
  toFirestoreSafeId,
} from './utils/firestoreSync';

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

  // Individual Student PIN Security Modal state
  const [isStudentPinModalOpen, setIsStudentPinModalOpen] = useState<boolean>(false);
  const [studentToUnlock, setStudentToUnlock] = useState<CohortStudentRecord | null>(null);
  const [pendingStudentTargetTab, setPendingStudentTargetTab] = useState<TabType | undefined>(undefined);
  const [isChangePinModalOpen, setIsChangePinModalOpen] = useState<boolean>(false);
  const [, setSessionUnlockCounter] = useState<number>(0);

  // Permanent Firebase Cloud Database auth & status
  const {
    user: firebaseUser,
    authReady,
    isRootAdmin,
    isSigningIn,
    authError,
    signInWithGoogle,
    signOutGoogle,
    clearAuthError,
  } = useFirebaseAuth();
  const [isFirestoreStaff, setIsFirestoreStaff] = useState<boolean>(false);
  const [firestoreSaveStatus, setFirestoreSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [firestoreErrorMsg, setFirestoreErrorMsg] = useState<string | null>(null);
  const [dismissAuthBanner, setDismissAuthBanner] = useState<boolean>(false);
  const firestoreDebounceRef = useRef<any>(null);

  // Stable refs to access current values inside one-time cloudSync subscription without re-subscribing
  const currentStudentRosterIdRef = useRef(currentStudentRosterId);
  currentStudentRosterIdRef.current = currentStudentRosterId;

  const activeTraineeIdRef = useRef(traineeInfo?.traineeId || '');
  activeTraineeIdRef.current = traineeInfo?.traineeId || '';

  const cohortStudentsRef = useRef(cohortStudents);
  cohortStudentsRef.current = cohortStudents;

  const detailedLogsRef = useRef(detailedLogs);
  detailedLogsRef.current = detailedLogs;

  // Flag and hash check to avoid echo loops and initial-mount broadcasts
  const isRemoteUpdateRef = useRef(false);
  const hasMountedSyncRef = useRef(false);
  const lastSyncedHashRef = useRef<string>('');
  const lastFirestoreHashRef = useRef<string>('');

  const computeStudentHash = (student: CohortStudentRecord) => {
    const t = student?.traineeInfo;
    const logs = Array.isArray(student?.detailedLogs) ? student.detailedLogs : [];
    const logsCount = logs.length;
    const logsSummary = logs
      .map(
        (l) =>
          `${l.sessionNumber}:${l.status}:${l.dateOfActivity}:${l.activityDescription?.length || 0}:${l.reflectiveNotesLessonsLearned?.length || 0}:${l.attachments?.length || 0}:${l.preceptorSignoff?.isSigned ? '1' : '0'}`
      )
      .join('|');
    const signoffSummary = student?.finalSignoff
      ? `${student.finalSignoff.isCertified ? '1' : '0'}:${student.finalSignoff.verificationHash || ''}`
      : '0';
    return `${student?.id || ''}_${t?.traineeId || ''}_${t?.traineeName || ''}_${t?.clinicalDepartmentWard || ''}_${t?.assignedClinicalPreceptor || ''}_${t?.studentPin || ''}_${logsCount}_${logsSummary}_${signoffSummary}`;
  };

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

  // Cross-device cloud sync: listen to remote updates from server (ONE-TIME SUBSCRIPTION ON MOUNT)
  useEffect(() => {
    cloudSync.init();

    const unsubStudent = cloudSync.onStudentUpdated((rawRemoteStudent) => {
      const remoteStudent = normalizeStudentRecord(rawRemoteStudent);

      // 1. Update in cohort list
      setCohortStudents((prev) => {
        const idx = prev.findIndex(
          (s) =>
            (s.traineeInfo?.traineeId &&
              remoteStudent.traineeInfo?.traineeId &&
              s.traineeInfo.traineeId === remoteStudent.traineeInfo.traineeId) ||
            s.id === remoteStudent.id
        );
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...remoteStudent, id: copy[idx].id };
          return copy;
        }
        return [remoteStudent, ...prev];
      });

      // 2. If it's the currently active student, update active screen state safely!
      const currentActiveId = currentStudentRosterIdRef.current;
      const currentTraineeId = activeTraineeIdRef.current;

      if (
        remoteStudent.id === currentActiveId ||
        (remoteStudent.traineeInfo?.traineeId &&
          currentTraineeId &&
          remoteStudent.traineeInfo.traineeId === currentTraineeId)
      ) {
        // Mark remote update and record hash so auto-broadcast will NOT re-send this back!
        isRemoteUpdateRef.current = true;
        const normalizedForActive = { ...remoteStudent, id: currentActiveId || remoteStudent.id };
        lastSyncedHashRef.current = computeStudentHash(normalizedForActive);

        setTraineeInfo(normalizedForActive.traineeInfo);
        setDetailedLogs(normalizedForActive.detailedLogs);
        setFinalSignoff(normalizedForActive.finalSignoff);

        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 500);
      }
    });

    const unsubCohort = cloudSync.onCohortUpdated((remoteCohort) => {
      if (Array.isArray(remoteCohort) && remoteCohort.length > 0) {
        const safeCohort = remoteCohort.map((s, idx) => normalizeStudentRecord(s, idx));
        setCohortStudents(safeCohort);
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
  }, []); // Run ONCE on mount

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

  // Helper: Merge remote Firestore student with local logs safely (never lose local unsaved work)
  const mergeStudentWithRemote = (
    local: CohortStudentRecord,
    remote: CohortStudentRecord
  ): CohortStudentRecord => {
    const safeLocal = normalizeStudentRecord(local);
    const safeRemote = normalizeStudentRecord(remote);
    const mergedBySession = new Map<number, DetailedActivityLogSheet>();

    for (const l of safeLocal.detailedLogs) {
      mergedBySession.set(l.sessionNumber, l);
    }
    for (const r of safeRemote.detailedLogs) {
      const existing = mergedBySession.get(r.sessionNumber);
      if (!existing) {
        mergedBySession.set(r.sessionNumber, r);
      } else {
        // Keep whichever has preceptor signoff, or more written detail/attachments
        const rSigned = r.status === 'Met' || r.preceptorSignoff?.isSigned;
        const lSigned = existing.status === 'Met' || existing.preceptorSignoff?.isSigned;
        if (rSigned && !lSigned) {
          mergedBySession.set(r.sessionNumber, r);
        } else if (!lSigned) {
          const rScore =
            (r.activityDescription?.length || 0) +
            (r.reflectiveNotesLessonsLearned?.length || 0) +
            (r.attachments?.length || 0) * 100;
          const lScore =
            (existing.activityDescription?.length || 0) +
            (existing.reflectiveNotesLessonsLearned?.length || 0) +
            (existing.attachments?.length || 0) * 100;
          if (rScore >= lScore) {
            mergedBySession.set(r.sessionNumber, r);
          }
        }
      }
    }

    const mergedLogs = Array.from(mergedBySession.values()).sort(
      (a, b) => a.sessionNumber - b.sessionNumber
    );

    const mergedSignoff =
      safeRemote.finalSignoff.isCertified || !safeLocal.finalSignoff.isCertified
        ? safeRemote.finalSignoff
        : safeLocal.finalSignoff;

    return normalizeStudentRecord({
      ...safeLocal,
      id: safeLocal.id || safeRemote.id,
      traineeInfo: {
        ...safeLocal.traineeInfo,
        ...safeRemote.traineeInfo,
        studentPin: safeLocal.traineeInfo.studentPin || getStudentPin(safeLocal),
      },
      detailedLogs: mergedLogs,
      finalSignoff: mergedSignoff,
      updatedAt: safeRemote.updatedAt || safeLocal.updatedAt,
    });
  };

  // Helper: Persist a student record to Firestore safely with error reporting
  const persistStudentToFirestore = async (
    record: CohortStudentRecord,
    staffOverride?: boolean
  ) => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    const safeId = toFirestoreSafeId(record.id, 'student');
    if (safeId.startsWith('student-blank-')) return;
    if (!record.traineeInfo?.traineeName?.trim() && !record.traineeInfo?.traineeId?.trim()) return;

    setFirestoreSaveStatus('saving');
    setFirestoreErrorMsg(null);
    try {
      await saveStudentDossierToFirestore(firebaseUser, record, {
        isStaff: staffOverride ?? (isRootAdmin || isFirestoreStaff),
        claimPin: getStudentPin(record),
      });
      setFirestoreSaveStatus('saved');
    } catch (err: any) {
      const msg = err?.message || 'Failed to save to Firestore.';
      setFirestoreSaveStatus('error');
      setFirestoreErrorMsg(msg);
      console.error('[FirestoreSync] Save failed:', err);
    }
  };

  // Permanent Firestore Initialization & Hydration when Google Auth is Ready
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      setIsFirestoreStaff(false);
      return;
    }

    let cancelled = false;

    const initFirestoreForUser = async () => {
      try {
        await ensureUserDocuments(firebaseUser);
        const staffVerified = await checkIsStaffInFirestore(firebaseUser);
        if (cancelled) return;
        setIsFirestoreStaff(staffVerified);

        const currentRoster = cohortStudentsRef.current;
        const pinLookup: Record<string, string> = {};
        for (const s of currentRoster) {
          const pin = getStudentPin(s);
          pinLookup[s.id] = pin;
          pinLookup[toFirestoreSafeId(s.id)] = pin;
          if (s.traineeInfo?.traineeId) pinLookup[s.traineeInfo.traineeId] = pin;
        }

        if (isRootAdmin) {
          await seedInitialInstitutionalDataIfAdmin(
            firebaseUser,
            currentRoster,
            getStoredPreceptors()
          );
          if (cancelled) return;
        }

        const remoteStudents = isRootAdmin
          ? await loadAllCohortStudentsForAdmin(firebaseUser, pinLookup)
          : await loadOwnedStudentsForUser(firebaseUser, staffVerified, pinLookup);

        if (cancelled) return;

        if (remoteStudents.length > 0) {
          setCohortStudents((prev) => {
            const copy = [...prev];
            for (const remote of remoteStudents) {
              const idx = copy.findIndex(
                (s) =>
                  toFirestoreSafeId(s.id) === remote.id ||
                  (s.traineeInfo?.traineeId &&
                    remote.traineeInfo?.traineeId &&
                    s.traineeInfo.traineeId === remote.traineeInfo.traineeId)
              );
              if (idx >= 0) {
                copy[idx] = mergeStudentWithRemote(copy[idx], remote);
              } else {
                copy.unshift(remote);
              }
            }
            return copy;
          });

          // If current active student matches a restored Firestore record, hydrate active state safely
          const activeSafeId = toFirestoreSafeId(currentStudentRosterIdRef.current);
          const matchedRemote = remoteStudents.find(
            (r) =>
              r.id === activeSafeId ||
              (activeTraineeIdRef.current &&
                r.traineeInfo?.traineeId === activeTraineeIdRef.current)
          );

          if (matchedRemote) {
            const merged = mergeStudentWithRemote(
              {
                id: currentStudentRosterIdRef.current,
                traineeInfo,
                detailedLogs: detailedLogsRef.current,
                finalSignoff,
                updatedAt: new Date().toISOString(),
              },
              matchedRemote
            );
            isRemoteUpdateRef.current = true;
            lastSyncedHashRef.current = computeStudentHash(merged);
            lastFirestoreHashRef.current = computeStudentHash(merged);
            setTraineeInfo(merged.traineeInfo);
            setDetailedLogs(merged.detailedLogs);
            setFinalSignoff(merged.finalSignoff);
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 500);
          } else if (!isRootAdmin && detailedLogsRef.current.length === 0) {
            // If non-admin student signed in on a brand-new device with empty local logs, auto-load their owned dossier
            const firstOwned = remoteStudents[0];
            if (firstOwned) {
              isRemoteUpdateRef.current = true;
              lastSyncedHashRef.current = computeStudentHash(firstOwned);
              lastFirestoreHashRef.current = computeStudentHash(firstOwned);
              setCurrentStudentRosterId(firstOwned.id);
              setTraineeInfo(firstOwned.traineeInfo);
              setDetailedLogs(firstOwned.detailedLogs);
              setFinalSignoff(firstOwned.finalSignoff);
              setStudentUnlocked(firstOwned.traineeInfo.traineeId || firstOwned.id, true);
              setTimeout(() => {
                isRemoteUpdateRef.current = false;
              }, 500);
            }
          }
        }

        // If user already had local unsaved logs on this device before signing in, push them up to Firestore!
        if (detailedLogsRef.current.length > 0 && !String(currentStudentRosterIdRef.current).startsWith('student-blank-')) {
          const activeRecord: CohortStudentRecord = {
            id: currentStudentRosterIdRef.current,
            traineeInfo,
            detailedLogs: detailedLogsRef.current,
            finalSignoff,
            updatedAt: new Date().toISOString(),
          };
          await saveStudentDossierToFirestore(firebaseUser, activeRecord, {
            isStaff: isRootAdmin || staffVerified,
            claimPin: getStudentPin(activeRecord),
          });
        }

        setFirestoreSaveStatus('saved');
      } catch (err: any) {
        if (!cancelled) {
          setFirestoreSaveStatus('error');
          setFirestoreErrorMsg(err?.message || 'Cloud database sync error.');
        }
      }
    };

    initFirestoreForUser();
    return () => {
      cancelled = true;
    };
  }, [authReady, firebaseUser, isRootAdmin]);

  // Automatically broadcast local edits to WebSocket AND persist permanently to Firestore
  useEffect(() => {
    if (isRemoteUpdateRef.current) return;

    const studentRecord: CohortStudentRecord = {
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs,
      finalSignoff,
      updatedAt: new Date().toISOString(),
    };

    const newHash = computeStudentHash(studentRecord);

    // Do NOT broadcast on initial page mount before the user has edited anything
    if (!hasMountedSyncRef.current) {
      hasMountedSyncRef.current = true;
      lastSyncedHashRef.current = newHash;
      lastFirestoreHashRef.current = newHash;
      return;
    }

    // Do NOT broadcast blank/unregistered placeholder slates over enrolled student records
    if (
      String(currentStudentRosterId || '').startsWith('student-blank-') ||
      (!traineeInfo?.traineeId?.trim() && !traineeInfo?.traineeName?.trim())
    ) {
      lastSyncedHashRef.current = newHash;
      return;
    }

    // If data hasn't changed since last sync, DO NOT broadcast!
    if (lastSyncedHashRef.current === newHash) {
      return;
    }

    lastSyncedHashRef.current = newHash;
    const isPreceptorRole = userRole === 'preceptor' || userRole === 'lead_educator';
    cloudSync.syncStudent(studentRecord, isPreceptorRole ? 'preceptor' : 'trainee');

    // Also update local cohort list entry so switching between students retains edits
    setCohortStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudentRosterId ||
        (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
          ? { ...s, traineeInfo, detailedLogs, finalSignoff, updatedAt: studentRecord.updatedAt }
          : s
      )
    );

    // Debounced permanent write to Firestore when authenticated
    if (firebaseUser && firebaseUser.emailVerified && lastFirestoreHashRef.current !== newHash) {
      lastFirestoreHashRef.current = newHash;
      if (firestoreDebounceRef.current) clearTimeout(firestoreDebounceRef.current);
      firestoreDebounceRef.current = setTimeout(() => {
        persistStudentToFirestore(studentRecord);
      }, 650);
    }
  }, [traineeInfo, detailedLogs, finalSignoff, currentStudentRosterId, userRole, firebaseUser, isRootAdmin, isFirestoreStaff]);

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

  const handleRoleAuthSuccess = async (preceptor?: RegisteredPreceptor, enteredPin?: string) => {
    setUserRole(targetRoleForAuth);
    setAuthenticatedPreceptor(preceptor || null);
    setIsRoleAuthModalOpen(false);
    if (pendingTabAfterAuth) {
      setActiveTab(pendingTabAfterAuth);
      setPendingTabAfterAuth(null);
    }
    if (firebaseUser && firebaseUser.emailVerified && preceptor && enteredPin) {
      try {
        await registerStaffMemberInFirestore(firebaseUser, preceptor, enteredPin);
        setIsFirestoreStaff(true);
      } catch (err: any) {
        console.warn('[FirestoreSync] Staff verification note:', err?.message || err);
      }
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

  // Helper: hydrate selected student from Firestore when staff/admin or owner selects them
  const hydrateSelectedFromFirestoreIfPossible = async (target: CohortStudentRecord) => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    if (!(isRootAdmin || isFirestoreStaff)) return;
    try {
      const remote = await loadStudentFromFirestore(
        firebaseUser,
        target.id,
        getStudentPin(target)
      );
      if (remote) {
        const merged = mergeStudentWithRemote(target, remote);
        if (currentStudentRosterIdRef.current === target.id) {
          isRemoteUpdateRef.current = true;
          lastSyncedHashRef.current = computeStudentHash(merged);
          lastFirestoreHashRef.current = computeStudentHash(merged);
          setTraineeInfo(merged.traineeInfo);
          setDetailedLogs(merged.detailedLogs);
          setFinalSignoff(merged.finalSignoff);
          setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 400);
        }
        setCohortStudents((prev) =>
          prev.map((s) => (s.id === target.id ? merged : s))
        );
      }
    } catch (err) {
      console.warn('[FirestoreSync] On-select hydration skipped:', err);
    }
  };

  // Cohort handlers & Student PIN security
  const handleSelectCohortStudent = (student: CohortStudentRecord, targetTab?: TabType) => {
    const safeStudent = normalizeStudentRecord(student);
    const studentKey = safeStudent.traineeInfo.traineeId || safeStudent.id;

    // In Trainee mode, enforce 4-digit student PIN if not yet unlocked in this session
    if (userRole === 'trainee' && !isStudentUnlocked(studentKey)) {
      setStudentToUnlock(safeStudent);
      setPendingStudentTargetTab(targetTab);
      setIsStudentPinModalOpen(true);
      return;
    }

    // Save current active student work into cohort list
    setCohortStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentRosterId || (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)) {
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

    // Switch to selected student without triggering a false "student updated" broadcast
    lastSyncedHashRef.current = computeStudentHash(safeStudent);
    lastFirestoreHashRef.current = computeStudentHash(safeStudent);
    setTraineeInfo(safeStudent.traineeInfo);
    setDetailedLogs(safeStudent.detailedLogs);
    setFinalSignoff(safeStudent.finalSignoff);
    setCurrentStudentRosterId(safeStudent.id);

    if (targetTab) {
      setActiveTab(targetTab);
    }

    hydrateSelectedFromFirestoreIfPossible(safeStudent);
  };

  const handleStudentUnlockSuccess = async () => {
    setIsStudentPinModalOpen(false);
    setSessionUnlockCounter((c) => c + 1);

    if (studentToUnlock) {
      const safeTarget = normalizeStudentRecord(studentToUnlock);

      // Save current active student work into cohort list
      setCohortStudents((prev) =>
        prev.map((s) => {
          if (s.id === currentStudentRosterId || (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)) {
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

      // Switch to selected student without triggering a false broadcast
      lastSyncedHashRef.current = computeStudentHash(safeTarget);
      lastFirestoreHashRef.current = computeStudentHash(safeTarget);
      setTraineeInfo(safeTarget.traineeInfo);
      setDetailedLogs(safeTarget.detailedLogs);
      setFinalSignoff(safeTarget.finalSignoff);
      setCurrentStudentRosterId(safeTarget.id);

      if (pendingStudentTargetTab) {
        setActiveTab(pendingStudentTargetTab);
      }
      setStudentToUnlock(null);
      setPendingStudentTargetTab(undefined);

      // If signed into Google, claim/hydrate their Firestore record right after unlocking
      if (firebaseUser && firebaseUser.emailVerified) {
        try {
          await saveStudentDossierToFirestore(firebaseUser, safeTarget, {
            isStaff: isRootAdmin || isFirestoreStaff,
            claimPin: getStudentPin(safeTarget),
          });
          const hydrated = await loadStudentFromFirestore(
            firebaseUser,
            safeTarget.id,
            getStudentPin(safeTarget)
          );
          if (hydrated) {
            const merged = mergeStudentWithRemote(safeTarget, hydrated);
            isRemoteUpdateRef.current = true;
            lastSyncedHashRef.current = computeStudentHash(merged);
            lastFirestoreHashRef.current = computeStudentHash(merged);
            setTraineeInfo(merged.traineeInfo);
            setDetailedLogs(merged.detailedLogs);
            setFinalSignoff(merged.finalSignoff);
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 400);
          }
        } catch (err: any) {
          console.warn('[FirestoreSync] Student claim/hydrate note:', err?.message || err);
        }
      }
    }
  };

  const handleOpenUnlockForCurrentStudent = () => {
    setStudentToUnlock(currentStudentRecord);
    setPendingStudentTargetTab(undefined);
    setIsStudentPinModalOpen(true);
  };

  const handleLockCurrentStudentSession = () => {
    const studentKey = currentStudentRecord.traineeInfo.traineeId || currentStudentRecord.id;
    lockStudent(studentKey);
    setSessionUnlockCounter((c) => c + 1);
  };

  const handlePinChangedSuccess = (newPin: string) => {
    setTraineeInfo((prev) => ({ ...prev, studentPin: newPin }));
    setCohortStudents((prev) =>
      prev.map((s) => {
        if (s.id === currentStudentRosterId || s.traineeInfo.traineeId === traineeInfo.traineeId) {
          return {
            ...s,
            studentPin: newPin,
            traineeInfo: { ...s.traineeInfo, studentPin: newPin },
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
    setSessionUnlockCounter((c) => c + 1);
  };

  const handleAddCohortStudent = (newRecord: CohortStudentRecord) => {
    const normalized = normalizeStudentRecord(newRecord);
    const hasConflict = cohortStudents.some((s) => s.id === normalized.id);
    const resolvedId =
      hasConflict || !normalized.id ? `student-add-${Date.now()}` : normalized.id;
    const finalRecord: CohortStudentRecord = { ...normalized, id: resolvedId };
    const updatedCohort = [finalRecord, ...cohortStudents];

    setCohortStudents(updatedCohort);
    saveStoredCohortStudents(updatedCohort);
    cloudSync.syncCohort(updatedCohort, 'preceptor');

    lastSyncedHashRef.current = computeStudentHash(finalRecord);
    lastFirestoreHashRef.current = computeStudentHash(finalRecord);
    setTraineeInfo(finalRecord.traineeInfo);
    setDetailedLogs(finalRecord.detailedLogs);
    setFinalSignoff(finalRecord.finalSignoff);
    setCurrentStudentRosterId(resolvedId);
    setActiveTab('page1');

    if (firebaseUser && firebaseUser.emailVerified) {
      persistStudentToFirestore(finalRecord, isRootAdmin || isFirestoreStaff);
    }
  };

  const handleDeleteCohortStudent = (studentId: string) => {
    if (firebaseUser && isRootAdmin) {
      deleteStudentFromFirestoreIfAdmin(firebaseUser, studentId).catch((e) =>
        console.warn('[FirestoreSync] Delete failed:', e)
      );
    }
    setCohortStudents((prev) => {
      const updated = prev.filter(
        (s) => s.id !== studentId && s.traineeInfo?.traineeId !== studentId
      );
      saveStoredCohortStudents(updated);
      cloudSync.syncCohort(updated);

      if (
        currentStudentRosterId === studentId ||
        traineeInfo?.traineeId === studentId
      ) {
        if (updated.length > 0) {
          const next = normalizeStudentRecord(updated[0]);
          lastSyncedHashRef.current = computeStudentHash(next);
          lastFirestoreHashRef.current = computeStudentHash(next);
          setCurrentStudentRosterId(next.id);
          setTraineeInfo(next.traineeInfo);
          setDetailedLogs(next.detailedLogs);
          setFinalSignoff(next.finalSignoff);
        } else {
          const blank = resetStorageToBlank();
          setCurrentStudentRosterId(`student-blank-${Date.now()}`);
          setTraineeInfo(blank.traineeInfo);
          setDetailedLogs(blank.detailedLogs);
          setFinalSignoff(blank.finalSignoff);
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

  // Reset to blank slate for a new real trainee (isolated from enrolled cohort student ID so it never overwrites a real student)
  const handleResetToBlank = () => {
    const blank = resetStorageToBlank();
    const blankRosterId = `student-blank-${Date.now()}`;
    setCurrentStudentRosterId(blankRosterId);
    setTraineeInfo(blank.traineeInfo);
    setDetailedLogs(blank.detailedLogs);
    setFinalSignoff(blank.finalSignoff);
    setStudentUnlocked(blank.traineeInfo.traineeId || 'fresh-blank', true);
  };

  // Reset to sample demo data
  const handleResetToSample = () => {
    const sample = resetStorageToSample();
    setTraineeInfo(normalizeTraineeInfo(sample.traineeInfo));
    setDetailedLogs((sample.detailedLogs || []).map((l, i) => normalizeDetailedLog(l, i)));
    setFinalSignoff(normalizeFinalSignoff(sample.finalSignoff));
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
    a.download = `NCEP_LOGBOOK_BACKUP_${traineeInfo?.traineeId || 'RECORD'}_${new Date().toISOString().slice(0, 10)}.json`;
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
        if (parsed.traineeInfo) setTraineeInfo(normalizeTraineeInfo(parsed.traineeInfo));
        if (Array.isArray(parsed.detailedLogs)) {
          setDetailedLogs(parsed.detailedLogs.map((l: any, i: number) => normalizeDetailedLog(l, i)));
        }
        if (parsed.finalSignoff) setFinalSignoff(normalizeFinalSignoff(parsed.finalSignoff));
      } catch (err) {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const safeLogs = Array.isArray(detailedLogs) ? detailedLogs : [];
  const metCount = NCEP_SESSIONS_DEFINITIONS.filter((s) => {
    const log = safeLogs.find((l) => l.sessionNumber === s.sessionNumber);
    return log?.status === 'Met';
  }).length;

  const totalAttachments = safeLogs.reduce((acc, l) => acc + (Array.isArray(l.attachments) ? l.attachments.length : 0), 0);

  const matchedCohortStudent = cohortStudents.find(
    (s) =>
      s.id === currentStudentRosterId ||
      (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
  );
  const currentStudentRecord: CohortStudentRecord = matchedCohortStudent
    ? normalizeStudentRecord(matchedCohortStudent)
    : {
        id: currentStudentRosterId,
        traineeInfo: normalizeTraineeInfo(traineeInfo),
        detailedLogs: safeLogs,
        finalSignoff: normalizeFinalSignoff(finalSignoff),
        updatedAt: new Date().toISOString(),
      };

  const handleForceSync = () => {
    cloudSync.syncStudent(
      currentStudentRecord,
      userRole === 'preceptor' || userRole === 'lead_educator' ? 'preceptor' : 'trainee',
      'Manual synchronization requested'
    );
    if (firebaseUser && firebaseUser.emailVerified) {
      persistStudentToFirestore(currentStudentRecord);
    }
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
                    <option value="trainee">Trainee ({(traineeInfo?.traineeName || 'Student').split(' ')[0] || 'Student'})</option>
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
                <div className="text-[11px] text-slate-500 hidden sm:flex sm:items-center sm:gap-2">
                  <span>Trainee: {traineeInfo?.traineeName || 'Not Selected'} ({traineeInfo?.traineeId || '—'}) · {traineeInfo?.clinicalDepartmentWard || 'Ward Unassigned'}</span>
                  {userRole === 'trainee' && (
                    <button
                      type="button"
                      onClick={handleOpenUnlockForCurrentStudent}
                      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer"
                      title="Student PIN Security Status: Click to unlock or verify"
                    >
                      {isStudentUnlocked(currentStudentRecord.traineeInfo?.traineeId || currentStudentRecord.id) ? (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">PIN Verified</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span className="text-amber-700">Enter PIN</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 font-sans flex-wrap">
              {/* Permanent Firebase Cloud Database Sign-In / Status */}
              {firebaseUser ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200/90 text-[11px]">
                  <Database className="w-3.5 h-3.5 text-teal-700" />
                  <span className="font-semibold text-teal-900 hidden md:inline max-w-[150px] truncate" title={firebaseUser.email || ''}>
                    {firebaseUser.email}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                    {firestoreSaveStatus === 'saving'
                      ? 'Saving...'
                      : firestoreSaveStatus === 'error'
                        ? 'DB Error'
                        : 'Cloud DB'}
                  </span>
                  <button
                    type="button"
                    onClick={signOutGoogle}
                    title="Sign out of Google Cloud Database"
                    className="p-0.5 text-slate-500 hover:text-rose-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={isSigningIn}
                  title="Sign in with Google to permanently save logbook entries across restarts and updates"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-2xs transition-colors disabled:opacity-60"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isSigningIn ? 'Signing in...' : 'Sign in for Cloud DB'}</span>
                </button>
              )}

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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-950 bg-teal-100/90 hover:bg-teal-200 border border-teal-300/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
                title="Download / Save Complete 7-Page Academic Dossier & Logbook in PDF format (Destination: Save as PDF)"
              >
                <Printer className="w-3.5 h-3.5 text-teal-800" />
                <span>Download PDF Dossier</span>
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
                  badge: finalSignoff?.isCertified ? 'Certified' : undefined,
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

        {/* Persistent Cloud Database Sign-In / Error Banner */}
        {(authError || firestoreErrorMsg || (!firebaseUser && authReady && !dismissAuthBanner)) && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-4">
            {(authError || firestoreErrorMsg) ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {String(firestoreErrorMsg || authError).includes('Quota exceeded')
                        ? 'Firestore Daily Free-Tier Quota Exceeded (resets tomorrow).'
                        : 'Cloud Database Notice'}
                    </div>
                    <div className="text-[11px] text-rose-800 break-words">
                      {String(firestoreErrorMsg || authError).includes(
                        "Quota exceeded for quota metric 'Free daily read units per project (free tier database)'"
                      ) ? (
                        <>
                          Free daily read quota reached. Upgrade or inspect usage in Firebase Console:{' '}
                          <a
                            href="https://console.firebase.google.com/project/gen-lang-client-0393548456/firestore/databases/ai-studio-nurslognursingel-14670a2c-9014-4602-9558-c27099970e61/data?openUpgradeDialog=true"
                            target="_blank"
                            rel="noreferrer"
                            className="underline font-bold"
                          >
                            Open Firestore Database
                          </a>
                        </>
                      ) : (
                        firestoreErrorMsg || authError
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clearAuthError();
                    setFirestoreErrorMsg(null);
                  }}
                  className="text-[11px] font-semibold text-rose-700 hover:underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="p-3 bg-teal-50/90 border border-teal-200 rounded-xl text-xs text-teal-950 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    <strong>Permanent Cloud Database Ready:</strong> Sign in with Google once so all clinical logs, reflections, and preceptor signatures are permanently saved across updates and devices.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    disabled={isSigningIn}
                    className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissAuthBanner(true)}
                    className="px-2 py-1 text-[11px] text-teal-800 hover:underline"
                  >
                    Later
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
              onDownloadPdf={() => window.print()}
              cohortStudents={cohortStudents}
              onSelectStudent={handleSelectCohortStudent}
              userRole={userRole}
              isCurrentStudentUnlocked={
                userRole !== 'trainee' ||
                isStudentUnlocked(currentStudentRecord.traineeInfo.traineeId || currentStudentRecord.id)
              }
              onOpenUnlockModal={handleOpenUnlockForCurrentStudent}
              onOpenChangePinModal={() => setIsChangePinModalOpen(true)}
              onLockSession={handleLockCurrentStudentSession}
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

      {/* Student Personal PIN Verification Modal (Protects against peer tampering) */}
      <StudentPinModal
        isOpen={isStudentPinModalOpen}
        student={studentToUnlock || currentStudentRecord}
        onSuccess={handleStudentUnlockSuccess}
        onCancel={() => {
          setIsStudentPinModalOpen(false);
          setStudentToUnlock(null);
          setPendingStudentTargetTab(undefined);
        }}
        onPreceptorOverride={() => {
          setIsStudentPinModalOpen(false);
          setTargetRoleForAuth('preceptor');
          setIsRoleAuthModalOpen(true);
        }}
      />

      {/* Student Self-Service PIN Change Modal */}
      <StudentChangePinModal
        isOpen={isChangePinModalOpen}
        student={currentStudentRecord}
        traineeInfo={traineeInfo}
        onClose={() => setIsChangePinModalOpen(false)}
        onPinChanged={handlePinChangedSuccess}
      />
    </div>
  );
}
