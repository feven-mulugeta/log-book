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
  WifiOff,
  UploadCloud,
  Smartphone,
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
  mergeDetailedLogArrays,
  resolvePreceptorWard,
  ensureOfficialStudentsPresent,
  markOfficialStudentDeleted,
  unmarkOfficialStudentDeleted,
  normalizeTraineeIdKey,
  OFFICIAL_IMPORTED_STUDENTS,
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
import {
  CloudSaveStatusModal,
  CloudSavePopupState,
} from './components/CloudSaveStatusModal';
import { useFirebaseAuth } from './contexts/FirebaseContext';
import {
  ensureUserDocuments,
  checkIsStaffInFirestore,
  seedInitialInstitutionalDataIfAdmin,
  loadAllCohortStudentsForAdmin,
  loadOwnedStudentsForUser,
  loadStudentFromFirestore,
  saveStudentDossierToFirestore,
  removeAttachmentFromFirestore,
  registerStaffMemberInFirestore,
  deleteStudentFromFirestoreIfAdmin,
  savePreceptorsRosterToFirestore,
  loadPreceptorsFromFirestore,
  subscribePreceptorsFromFirestore,
  toFirestoreSafeId,
  FirestoreOfflineError,
  reconnectFirestoreNetwork,
} from './utils/firestoreSync';
import { isFirestoreOfflineError } from './firebase';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  enqueueOfflineSyncTask,
  removeOfflineSyncTask,
  getPendingOfflineSyncTasks,
  getPendingOfflineSyncCount,
  subscribeOfflineQueueChanges,
  saveOfflineSnapshot,
  loadOfflineSnapshot,
} from './utils/offlineQueue';

type TabType = 'page1' | 'part1' | 'part2' | 'part3' | 'cohort' | 'ocr' | 'vault';

export default function App() {
  const [traineeInfo, setTraineeInfo] = useState<TraineeInformation>(getStoredTraineeInfo);
  const [detailedLogs, setDetailedLogs] = useState<DetailedActivityLogSheet[]>(getStoredDetailedLogs);
  const [finalSignoff, setFinalSignoff] = useState<FinalCompetencySignoff>(getStoredFinalSignoff);
  const [userRole, setUserRole] = useState<UserRole>(getStoredUserRole);
  const [cohortStudents, setCohortStudents] = useState<CohortStudentRecord[]>(getStoredCohortStudents);
  const [currentStudentRosterId, setCurrentStudentRosterId] = useState<string>(() => {
    const list = getStoredCohortStudents();
    const storedInfo = getStoredTraineeInfo();
    let savedRosterId = '';
    try {
      savedRosterId = localStorage.getItem('ncep_current_student_roster_id') || '';
    } catch {
      // ignore storage access issues
    }
    if (savedRosterId && (savedRosterId.startsWith('student-blank-') || list.some((s) => s.id === savedRosterId))) {
      return savedRosterId;
    }
    const matched = storedInfo?.traineeId
      ? list.find((s) => s.traineeInfo?.traineeId === storedInfo.traineeId)
      : storedInfo?.traineeName
        ? list.find((s) => s.traineeInfo?.traineeName === storedInfo.traineeName)
        : undefined;
    return matched?.id || list[0]?.id || 'student-1';
  });

  useEffect(() => {
    try {
      if (currentStudentRosterId) {
        localStorage.setItem('ncep_current_student_roster_id', currentStudentRosterId);
      }
    } catch {
      // ignore storage quota errors
    }
  }, [currentStudentRosterId]);
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
  const [isFirestoreOffline, setIsFirestoreOffline] = useState<boolean>(false);
  const [isRetryingFirestore, setIsRetryingFirestore] = useState<boolean>(false);
  const [dismissAuthBanner, setDismissAuthBanner] = useState<boolean>(false);
  const [cloudSavePopup, setCloudSavePopup] = useState<CloudSavePopupState | null>(null);
  const [isRetryingCloudPopup, setIsRetryingCloudPopup] = useState<boolean>(false);
  const isOnline = useOnlineStatus();
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [isFlushingOfflineQueue, setIsFlushingOfflineQueue] = useState<boolean>(false);
  const isFlushingQueueRef = useRef<boolean>(false);
  const wasOfflineRef = useRef<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine === false : false
  );
  const firebaseUserRef = useRef(firebaseUser);
  firebaseUserRef.current = firebaseUser;
  const isRootAdminRef = useRef(isRootAdmin);
  isRootAdminRef.current = isRootAdmin;
  const isFirestoreStaffRef = useRef(isFirestoreStaff);
  isFirestoreStaffRef.current = isFirestoreStaff;
  const firestoreDebounceRef = useRef<any>(null);
  const inlineStaffCredentialRef = useRef<{ preceptor: RegisteredPreceptor; enteredPin: string } | null>(null);
  const pendingCloudRetryRef = useRef<{
    record: CohortStudentRecord;
    actionTitle: string;
    roleSource: 'trainee' | 'preceptor';
    roleLabel: CloudSavePopupState['roleLabel'];
    evaluatorName?: string;
    evaluatorWard?: string;
    isStaffAction?: boolean;
    inlineStaff?: { preceptor: RegisteredPreceptor; enteredPin: string } | null;
  } | null>(null);
  const pendingPreceptorsRetryRef = useRef<{
    updatedPreceptors: RegisteredPreceptor[];
    actionTitle: string;
    deletedIds?: string[];
  } | null>(null);
  const retryPopupAfterGoogleAuthRef = useRef<boolean>(false);

  // Stable refs to access current values inside one-time cloudSync subscription without re-subscribing
  const currentStudentRosterIdRef = useRef(currentStudentRosterId);
  currentStudentRosterIdRef.current = currentStudentRosterId;

  const activeTraineeIdRef = useRef(traineeInfo?.traineeId || '');
  activeTraineeIdRef.current = traineeInfo?.traineeId || '';

  const cohortStudentsRef = useRef(cohortStudents);
  cohortStudentsRef.current = cohortStudents;

  const detailedLogsRef = useRef(detailedLogs);
  detailedLogsRef.current = detailedLogs;

  const traineeInfoRef = useRef(traineeInfo);
  traineeInfoRef.current = traineeInfo;

  const finalSignoffRef = useRef(finalSignoff);
  finalSignoffRef.current = finalSignoff;

  // Flag and hash check to avoid echo loops and initial-mount broadcasts
  const isRemoteUpdateRef = useRef(false);
  const hasMountedSyncRef = useRef(false);
  const lastSyncedHashRef = useRef<string>('');
  const lastFirestoreHashRef = useRef<string>('');
  const lastLocalTraineeEditAtRef = useRef<number>(0);
  const lastPushedPreceptorsHashRef = useRef<string>('');

  const computePreceptorsHash = (list: RegisteredPreceptor[]) =>
    list
      .map(
        (p) =>
          `${p.id}|${p.name}|${p.wardDepartment}|${p.role}|${p.title}|${p.initials}`
      )
      .sort()
      .join('||');

  const applyHydratedPreceptors = (
    list: RegisteredPreceptor[],
    syncLocalContainer: boolean
  ) => {
    if (!Array.isArray(list) || list.length === 0) return;
    saveStoredPreceptors(list);
    cloudSync.setAuthoritativePreceptorsLoaded(true);
    window.dispatchEvent(new CustomEvent('ncep-preceptors-updated', { detail: list }));
    setAuthenticatedPreceptor((prevAuth) => {
      if (!prevAuth) return prevAuth;
      const refreshed = list.find(
        (p) =>
          p.id === prevAuth.id ||
          (p.name || '').trim().toLowerCase() === (prevAuth.name || '').trim().toLowerCase()
      );
      return refreshed || prevAuth;
    });
    if (syncLocalContainer) {
      const nextHash = computePreceptorsHash(list);
      if (lastPushedPreceptorsHashRef.current !== nextHash) {
        lastPushedPreceptorsHashRef.current = nextHash;
        cloudSync.syncPreceptors(list);
      }
    }
  };

  const computeStudentHash = (student: CohortStudentRecord) => {
    const t = student?.traineeInfo;
    const logs = Array.isArray(student?.detailedLogs) ? student.detailedLogs : [];
    const logsCount = logs.length;
    const logsSummary = logs
      .map(
        (l) =>
          `${l.sessionNumber}:${l.status}:${l.dateOfActivity}:${l.activityDescription?.length || 0}:${l.reflectiveNotesLessonsLearned?.length || 0}:${(l.attachments || []).map((a) => a.id).join(',')}:${(l.removedAttachmentIds || []).join(',')}:${l.preceptorSignoff?.isSigned ? '1' : '0'}`
      )
      .join('|');
    const signoffSummary = student?.finalSignoff
      ? `${student.finalSignoff.isCertified ? '1' : '0'}:${student.finalSignoff.verificationHash || ''}`
      : '0';
    return `${student?.id || ''}_${t?.traineeId || ''}_${t?.traineeName || ''}_${t?.clinicalDepartmentWard || ''}_${t?.assignedClinicalPreceptor || ''}_${t?.trainingPeriodFrom || ''}_${t?.trainingPeriodTo || ''}_${t?.studentPin || ''}_${logsCount}_${logsSummary}_${signoffSummary}`;
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

      // 1. Update in cohort list non-destructively (preserving submitted attachments)
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
          copy[idx] = mergeStudentWithRemote(copy[idx], remoteStudent);
          return copy;
        }
        return [remoteStudent, ...prev];
      });

      // 2. If it's the currently active student, merge & update active screen state safely!
      const currentActiveId = currentStudentRosterIdRef.current;
      const currentTraineeId = activeTraineeIdRef.current;

      if (
        remoteStudent.id === currentActiveId ||
        (remoteStudent.traineeInfo?.traineeId &&
          currentTraineeId &&
          remoteStudent.traineeInfo.traineeId === currentTraineeId)
      ) {
        const mergedForActive = mergeStudentWithRemote(
          {
            id: currentActiveId || remoteStudent.id,
            traineeInfo: traineeInfoRef.current,
            detailedLogs: detailedLogsRef.current,
            finalSignoff: finalSignoffRef.current,
            updatedAt: new Date(lastLocalTraineeEditAtRef.current || 0).toISOString(),
          },
          remoteStudent,
          { preferLocalTraineeInfo: Date.now() - lastLocalTraineeEditAtRef.current < 15000 }
        );

        isRemoteUpdateRef.current = true;
        lastSyncedHashRef.current = computeStudentHash(mergedForActive);

        setTraineeInfo(mergedForActive.traineeInfo);
        setDetailedLogs(mergedForActive.detailedLogs);
        setFinalSignoff(mergedForActive.finalSignoff);

        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 500);
      }
    });

    const unsubCohort = cloudSync.onCohortUpdated((remoteCohort) => {
      if (Array.isArray(remoteCohort) && remoteCohort.length > 0) {
        const safeRemoteCohort = remoteCohort.map((s, idx) => normalizeStudentRecord(s, idx));

        setCohortStudents((prev) => {
          const mergedFromRemote = safeRemoteCohort.map((remoteItem) => {
            const remoteTKey = normalizeTraineeIdKey(remoteItem.traineeInfo?.traineeId);
            const localMatch = prev.find((l) => {
              const localTKey = normalizeTraineeIdKey(l.traineeInfo?.traineeId);
              if (remoteTKey && localTKey) {
                return localTKey === remoteTKey;
              }
              return l.id === remoteItem.id;
            });
            return localMatch ? mergeStudentWithRemote(localMatch, remoteItem) : remoteItem;
          });

          // Preserve local students that were missing from a partial/stale remote broadcast
          const mergedIds = new Set(mergedFromRemote.map((s) => s.id));
          const mergedTKeys = new Set(
            mergedFromRemote
              .map((s) => normalizeTraineeIdKey(s.traineeInfo?.traineeId))
              .filter(Boolean)
          );
          for (const localItem of prev) {
            const localTKey = normalizeTraineeIdKey(localItem.traineeInfo?.traineeId);
            const hasId = mergedIds.has(localItem.id);
            const hasTraineeId = Boolean(localTKey && mergedTKeys.has(localTKey));
            if (!hasId && !hasTraineeId) {
              mergedFromRemote.push(localItem);
              mergedIds.add(localItem.id);
              if (localTKey) mergedTKeys.add(localTKey);
            }
          }

          const { students: mergedCohort } = ensureOfficialStudentsPresent(mergedFromRemote);

          // Sync active student state if the active student is in the updated cohort
          const activeId = currentStudentRosterIdRef.current;
          const activeTId = activeTraineeIdRef.current;
          const matchedActive = mergedCohort.find(
            (s) =>
              s.id === activeId ||
              (activeTId && s.traineeInfo?.traineeId === activeTId)
          );

          if (matchedActive) {
            const recentlyEditedLocal = Date.now() - lastLocalTraineeEditAtRef.current < 15000;
            const mergedActive = mergeStudentWithRemote(
              {
                id: activeId || matchedActive.id,
                traineeInfo: traineeInfoRef.current,
                detailedLogs: detailedLogsRef.current,
                finalSignoff: finalSignoffRef.current,
                updatedAt: recentlyEditedLocal
                  ? new Date(lastLocalTraineeEditAtRef.current).toISOString()
                  : '',
              },
              matchedActive,
              { preferLocalTraineeInfo: recentlyEditedLocal }
            );
            const currentHash = computeStudentHash({
              id: activeId,
              traineeInfo: traineeInfoRef.current,
              detailedLogs: detailedLogsRef.current,
              finalSignoff: finalSignoffRef.current,
              updatedAt: '',
            });
            const nextHash = computeStudentHash(mergedActive);
            if (currentHash !== nextHash) {
              isRemoteUpdateRef.current = true;
              lastSyncedHashRef.current = nextHash;
              setTraineeInfo(mergedActive.traineeInfo);
              setDetailedLogs(mergedActive.detailedLogs);
              setFinalSignoff(mergedActive.finalSignoff);
              setTimeout(() => {
                isRemoteUpdateRef.current = false;
              }, 500);
            }
          }

          return mergedCohort;
        });
      }
    });

    const unsubPreceptors = cloudSync.onPreceptorsUpdated((remotePreceptors) => {
      if (Array.isArray(remotePreceptors) && remotePreceptors.length > 0) {
        saveStoredPreceptors(remotePreceptors);
        window.dispatchEvent(new CustomEvent('ncep-preceptors-updated', { detail: remotePreceptors }));
        setAuthenticatedPreceptor((prevAuth) => {
          if (!prevAuth) return prevAuth;
          const refreshed = remotePreceptors.find(
            (p) =>
              p.id === prevAuth.id ||
              (p.name || '').trim().toLowerCase() === (prevAuth.name || '').trim().toLowerCase()
          );
          return refreshed || prevAuth;
        });
      }
    });

    return () => {
      unsubStudent();
      unsubCohort();
      unsubPreceptors();
    };
  }, []); // Run ONCE on mount

  // Sync state to local storage + high-capacity IndexedDB snapshots for offline phone persistence
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
    saveOfflineSnapshot('cohortStudents', cohortStudents);
  }, [cohortStudents]);

  useEffect(() => {
    if (
      String(currentStudentRosterId || '').startsWith('student-blank-') &&
      !traineeInfo?.traineeName?.trim() &&
      !traineeInfo?.traineeId?.trim() &&
      detailedLogs.length === 0
    ) {
      return;
    }
    saveOfflineSnapshot('activeDossier', {
      rosterId: currentStudentRosterId,
      traineeInfo,
      detailedLogs,
      finalSignoff,
    });
  }, [currentStudentRosterId, traineeInfo, detailedLogs, finalSignoff]);

  // Hydrate phone IndexedDB offline snapshots & subscribe to pending sync queue count on mount
  useEffect(() => {
    let active = true;
    const refreshQueueCount = () => {
      getPendingOfflineSyncCount().then((count) => {
        if (active) setPendingQueueCount(count);
      });
    };
    refreshQueueCount();
    const unsubQueue = subscribeOfflineQueueChanges(refreshQueueCount);

    (async () => {
      try {
        const [preceptorsSnap, cohortSnap, activeSnap] = await Promise.all([
          loadOfflineSnapshot<RegisteredPreceptor[]>('preceptors'),
          loadOfflineSnapshot<CohortStudentRecord[]>('cohortStudents'),
          loadOfflineSnapshot<{
            rosterId: string;
            traineeInfo: TraineeInformation;
            detailedLogs: DetailedActivityLogSheet[];
            finalSignoff: FinalCompetencySignoff;
          }>('activeDossier'),
        ]);
        if (!active) return;

        if (preceptorsSnap?.value && Array.isArray(preceptorsSnap.value) && preceptorsSnap.value.length > 0) {
          const currentLocal = getStoredPreceptors();
          if (currentLocal.length === 0) {
            saveStoredPreceptors(preceptorsSnap.value);
            window.dispatchEvent(new CustomEvent('ncep-preceptors-updated', { detail: preceptorsSnap.value }));
          }
        }

        if (cohortSnap?.value && Array.isArray(cohortSnap.value) && cohortSnap.value.length > 0) {
          setCohortStudents((prev) => {
            const copy = [...prev];
            let changed = false;
            for (const snapItem of cohortSnap.value) {
              const normSnap = normalizeStudentRecord(snapItem);
              const idx = copy.findIndex(
                (l) =>
                  l.id === normSnap.id ||
                  (l.traineeInfo?.traineeId &&
                    normSnap.traineeInfo?.traineeId &&
                    l.traineeInfo.traineeId === normSnap.traineeInfo.traineeId)
              );
              if (idx >= 0) {
                const merged = mergeStudentWithRemote(copy[idx], normSnap);
                if (computeStudentHash(merged) !== computeStudentHash(copy[idx])) {
                  copy[idx] = merged;
                  changed = true;
                }
              } else {
                copy.unshift(normSnap);
                changed = true;
              }
            }
            return changed ? copy : prev;
          });
        }

        if (activeSnap?.value && activeSnap.value.rosterId === currentStudentRosterIdRef.current) {
          const snapRecord = normalizeStudentRecord({
            id: activeSnap.value.rosterId,
            traineeInfo: activeSnap.value.traineeInfo,
            detailedLogs: activeSnap.value.detailedLogs,
            finalSignoff: activeSnap.value.finalSignoff,
            updatedAt: activeSnap.updatedAt || '',
          });
          const currRecord = normalizeStudentRecord({
            id: currentStudentRosterIdRef.current,
            traineeInfo: traineeInfoRef.current,
            detailedLogs: detailedLogsRef.current,
            finalSignoff: finalSignoffRef.current,
            updatedAt: '',
          });
          const merged = mergeStudentWithRemote(currRecord, snapRecord);
          if (computeStudentHash(merged) !== computeStudentHash(currRecord)) {
            isRemoteUpdateRef.current = true;
            setTraineeInfo(merged.traineeInfo);
            setDetailedLogs(merged.detailedLogs);
            setFinalSignoff(merged.finalSignoff);
            setTimeout(() => {
              isRemoteUpdateRef.current = false;
            }, 350);
          }
        }
      } catch (err) {
        console.warn('[OfflineDB] Snapshot hydration note:', err);
      }
    })();

    return () => {
      active = false;
      unsubQueue();
    };
  }, []);

  // Helper: Classify Firestore errors cleanly without exposing raw offline JSON
  const classifyFirestoreError = (err: unknown): { offline: boolean; message: string } => {
    if (err instanceof FirestoreOfflineError || isFirestoreOfflineError(err)) {
      return {
        offline: true,
        message:
          'Cloud database connection is currently offline or paused. Your entries are safely saved locally and on the live server, and will sync to Cloud DB once reconnected.',
      };
    }
    const rawMsg = err instanceof Error ? err.message : String(err || 'Cloud database sync error.');
    if (rawMsg.toLowerCase().includes('client is offline')) {
      return {
        offline: true,
        message:
          'Cloud database connection is currently offline or paused. Your entries are safely saved locally and on the live server, and will sync to Cloud DB once reconnected.',
      };
    }
    return { offline: false, message: rawMsg };
  };

  // Helper: Merge traineeInfo field-by-field so empty remote fields never erase student entries
  const mergeTraineeInfoSafe = (
    localInfo: TraineeInformation,
    remoteInfo: TraineeInformation,
    preferLocal = false
  ): TraineeInformation => {
    const keys: (keyof TraineeInformation)[] = [
      'traineeName',
      'traineeId',
      'clinicalDepartmentWard',
      'assignedClinicalPreceptor',
      'trainingPeriodFrom',
      'trainingPeriodTo',
      'studentPin',
    ];
    const result: TraineeInformation = { ...localInfo };
    for (const k of keys) {
      const lVal = typeof localInfo?.[k] === 'string' ? localInfo[k].trim() : '';
      const rVal = typeof remoteInfo?.[k] === 'string' ? remoteInfo[k].trim() : '';
      if (preferLocal) {
        result[k] = (lVal ? localInfo[k] : remoteInfo?.[k] || '') as string;
      } else {
        result[k] = (rVal ? remoteInfo[k] : localInfo?.[k] || '') as string;
      }
    }
    if (!result.studentPin) {
      result.studentPin = localInfo?.studentPin || remoteInfo?.studentPin || '';
    }
    return normalizeTraineeInfo(result);
  };

  // Helper: Merge remote Firestore/server student with local logs safely (never lose attached evidence or trainee info)
  const mergeStudentWithRemote = (
    local: CohortStudentRecord,
    remote: CohortStudentRecord,
    options?: { preferLocalTraineeInfo?: boolean }
  ): CohortStudentRecord => {
    const safeLocal = normalizeStudentRecord(local);
    const safeRemote = normalizeStudentRecord(remote);
    const mergedLogs = mergeDetailedLogArrays(safeLocal.detailedLogs, safeRemote.detailedLogs);

    const mergedSignoff =
      safeRemote.finalSignoff.isCertified || !safeLocal.finalSignoff.isCertified
        ? safeRemote.finalSignoff
        : safeLocal.finalSignoff;

    const localTs = Date.parse(safeLocal.updatedAt || '') || 0;
    const remoteTs = Date.parse(safeRemote.updatedAt || '') || 0;
    const preferLocalInfo = Boolean(
      options?.preferLocalTraineeInfo || (localTs > 0 && localTs > remoteTs)
    );

    const mergedTraineeInfo = mergeTraineeInfoSafe(
      safeLocal.traineeInfo,
      safeRemote.traineeInfo,
      preferLocalInfo
    );
    if (!mergedTraineeInfo.studentPin) {
      mergedTraineeInfo.studentPin = safeLocal.traineeInfo.studentPin || getStudentPin(safeLocal);
    }

    return normalizeStudentRecord({
      ...safeLocal,
      id: safeLocal.id || safeRemote.id,
      traineeInfo: mergedTraineeInfo,
      detailedLogs: mergedLogs,
      finalSignoff: mergedSignoff,
      updatedAt:
        preferLocalInfo && safeLocal.updatedAt
          ? safeLocal.updatedAt
          : safeRemote.updatedAt || safeLocal.updatedAt,
    });
  };

  // Helper: Parse Firestore / Cloud error into clear human-readable text & category
  const parseCloudErrorForPopup = (
    err: unknown
  ): { isConnection: boolean; message: string } => {
    if (
      err instanceof FirestoreOfflineError ||
      isFirestoreOfflineError(err) ||
      (typeof navigator !== 'undefined' && navigator.onLine === false)
    ) {
      return {
        isConnection: true,
        message:
          err instanceof Error && err.message
            ? err.message
            : 'Cloud database connection is currently offline or unreachable.',
      };
    }

    const raw = err instanceof Error ? err.message : String(err || 'Unknown Cloud DB error.');
    let extracted = raw;
    if (raw.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.error) {
          extracted = String(parsed.error);
        }
      } catch {
        // leave extracted as raw
      }
    }

    const lower = extracted.toLowerCase();
    if (
      lower.includes('client is offline') ||
      lower.includes('network') ||
      lower.includes('unavailable') ||
      lower.includes('failed to fetch')
    ) {
      return {
        isConnection: true,
        message: 'Network or Cloud Database server is temporarily unreachable.',
      };
    }
    if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
      return {
        isConnection: false,
        message:
          'Permission Denied by Cloud Database security rules. Ensure you are signed in with the assigned Google account or have verified Preceptor/Mentor PIN permissions.',
      };
    }
    if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
      return {
        isConnection: false,
        message:
          'Daily free-tier Cloud Database quota has been exceeded. Data could not be written to Cloud DB today.',
      };
    }
    if (lower.includes('unauthenticated')) {
      return {
        isConnection: false,
        message: 'Google authentication session expired. Please sign in again.',
      };
    }

    return {
      isConnection: false,
      message: extracted,
    };
  };

  // Helper: Persist a student record to Firestore safely with friendly offline reporting
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
    setIsFirestoreOffline(false);
    try {
      await saveStudentDossierToFirestore(firebaseUser, record, {
        isStaff: staffOverride ?? (isRootAdmin || isFirestoreStaff),
        claimPin: getStudentPin(record),
      });
      await removeOfflineSyncTask(`student:${safeId}`);
      setFirestoreSaveStatus('saved');
      setIsFirestoreOffline(false);
    } catch (err: any) {
      const classified = classifyFirestoreError(err);
      setFirestoreSaveStatus('error');
      setIsFirestoreOffline(classified.offline);
      setFirestoreErrorMsg(classified.message);
      if (classified.offline) {
        console.warn('[FirestoreSync] Client offline during save; offline phone backup retained.');
      } else {
        console.error('[FirestoreSync] Save failed:', err);
      }
    }
  };

  // Flush all queued offline changes to Cloud Firestore & Live Sync once internet returns
  const flushOfflineQueue = async (showSuccessPopup = false): Promise<number> => {
    if (isFlushingQueueRef.current) return 0;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0;

    const tasks = await getPendingOfflineSyncTasks();
    if (tasks.length === 0) return 0;

    const user = firebaseUserRef.current;
    if (!user || !user.emailVerified) {
      return 0;
    }

    isFlushingQueueRef.current = true;
    setIsFlushingOfflineQueue(true);
    setFirestoreSaveStatus('saving');
    let syncedCount = 0;

    try {
      await reconnectFirestoreNetwork();

      for (const task of tasks) {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) break;
        try {
          if (task.kind === 'preceptors') {
            await cloudSync.syncPreceptors(task.preceptors);
            await savePreceptorsRosterToFirestore(user, task.preceptors, task.deletedIds);
            await removeOfflineSyncTask(task.id);
            syncedCount += 1;
          } else if (task.kind === 'student') {
            if (task.inlineStaff?.preceptor && task.inlineStaff?.enteredPin) {
              await registerStaffMemberInFirestore(
                user,
                task.inlineStaff.preceptor,
                task.inlineStaff.enteredPin
              );
              setIsFirestoreStaff(true);
            }
            await cloudSync.syncStudentNow(task.record, task.roleSource, task.actionTitle);
            await saveStudentDossierToFirestore(user, task.record, {
              isStaff: Boolean(
                task.isStaffAction || isRootAdminRef.current || isFirestoreStaffRef.current
              ),
              claimPin: getStudentPin(task.record),
            });
            await removeOfflineSyncTask(task.id);
            syncedCount += 1;
          } else if (task.kind === 'attachment_delete') {
            await removeAttachmentFromFirestore(
              user,
              task.studentId,
              task.sessionNumber,
              task.attachmentId,
              task.remainingAttachments
            );
            await removeOfflineSyncTask(task.id);
            syncedCount += 1;
          }
        } catch (err) {
          const classified = classifyFirestoreError(err);
          setIsFirestoreOffline(classified.offline);
          setFirestoreSaveStatus('error');
          setFirestoreErrorMsg(classified.message);
          if (classified.offline) break;
          console.warn('[OfflineQueue] Task retry failed:', err);
        }
      }

      const remaining = await getPendingOfflineSyncCount();
      setPendingQueueCount(remaining);

      if (syncedCount > 0 && remaining === 0) {
        setFirestoreSaveStatus('saved');
        setIsFirestoreOffline(false);
        setFirestoreErrorMsg(null);
      }

      if (syncedCount > 0 && showSuccessPopup) {
        setCloudSavePopup({
          status: 'saved',
          actionTitle: `Back Online — ${syncedCount} Offline Change${syncedCount === 1 ? '' : 's'} Permanently Saved to Cloud`,
          roleLabel:
            userRole === 'lead_educator'
              ? 'Lead Clinical Educator'
              : userRole === 'preceptor'
                ? 'Clinical Preceptor / Mentor'
                : 'Student / Trainee',
          studentName: traineeInfoRef.current?.traineeName || 'Active Dossier',
          studentId: traineeInfoRef.current?.traineeId || '',
          savedAtIso: new Date().toISOString(),
          liveServerSaved: true,
          cloudDbSaved: true,
        });
      }
    } finally {
      isFlushingQueueRef.current = false;
      setIsFlushingOfflineQueue(false);
    }

    return syncedCount;
  };

  // Explicit verified save + pop-up confirmation for Student Log Entries & Preceptor/Mentor Sign-Offs
  const saveAndConfirmStudentToCloud = async (params: {
    record: CohortStudentRecord;
    actionTitle: string;
    roleSource: 'trainee' | 'preceptor';
    roleLabel: CloudSavePopupState['roleLabel'];
    evaluatorName?: string;
    evaluatorWard?: string;
    isStaffAction?: boolean;
    inlineStaff?: { preceptor: RegisteredPreceptor; enteredPin: string } | null;
  }) => {
    const {
      record,
      actionTitle,
      roleSource,
      roleLabel,
      evaluatorName,
      evaluatorWard,
      isStaffAction,
      inlineStaff,
    } = params;

    const studentName = record.traineeInfo?.traineeName?.trim() || '';
    const studentId = record.traineeInfo?.traineeId?.trim() || '';
    const safeId = toFirestoreSafeId(record.id, 'student');

    if (firestoreDebounceRef.current) {
      clearTimeout(firestoreDebounceRef.current);
      firestoreDebounceRef.current = null;
    }

    // Cannot permanently store logs on a blank unnamed profile in Cloud DB
    if (safeId.startsWith('student-blank-') || (!studentName && !studentId)) {
      setCloudSavePopup({
        status: 'other_error',
        actionTitle,
        roleLabel,
        studentName: studentName || 'Unnamed Trainee',
        studentId: studentId || 'Missing ID',
        evaluatorName,
        evaluatorWard,
        canRetry: false,
        detailMessage:
          'Trainee Name & ID are missing. Open Tab 1 (Trainee Info & Instructions), enter your Trainee Name and Trainee ID first, then save your log again so it can be stored under your official dossier in the Cloud Database.',
      });
      return;
    }

    // Persist immediately in phone IndexedDB queue BEFORE attempting network calls
    await enqueueOfflineSyncTask({
      id: `student:${safeId}`,
      kind: 'student',
      record,
      isStaffAction: Boolean(isStaffAction || isRootAdmin || isFirestoreStaff),
      inlineStaff: inlineStaff || inlineStaffCredentialRef.current || null,
      actionTitle,
      roleSource,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    });
    const queueTotal = await getPendingOfflineSyncCount();

    pendingPreceptorsRetryRef.current = null;
    pendingCloudRetryRef.current = params;

    // Show "Saving..." state while awaiting permanent confirmation
    setCloudSavePopup({
      status: 'saving',
      actionTitle,
      roleLabel,
      studentName,
      studentId,
      evaluatorName,
      evaluatorWard,
    });

    // Fast offline save path: cleanly reassure user it is saved on phone and queued for cloud
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsFirestoreOffline(true);
      setFirestoreSaveStatus('error');
      setFirestoreErrorMsg('Working offline. Saved safely on phone and queued to upload automatically when internet returns.');
      setCloudSavePopup({
        status: 'connection_error',
        actionTitle,
        roleLabel,
        studentName,
        studentId,
        evaluatorName,
        evaluatorWard,
        liveServerSaved: false,
        cloudDbSaved: false,
        savedLocallyOnPhone: true,
        pendingQueueCount: queueTotal,
        detailMessage: 'No internet connection right now — entry is saved on your phone.',
      });
      return;
    }

    // Prevent background debounced double-save for the exact same state hash
    const hash = computeStudentHash(record);
    lastSyncedHashRef.current = hash;
    lastFirestoreHashRef.current = hash;

    // 1. Live Server Save (/api/sync/student)
    const liveSyncResult = await cloudSync.syncStudentNow(
      record,
      roleSource,
      `${actionTitle} (${studentName || studentId})`
    );

    // 2. Check Google Cloud Auth before attempting Firestore commit
    if (!firebaseUser || !firebaseUser.emailVerified) {
      if (!liveSyncResult.ok && liveSyncResult.offline) {
        setCloudSavePopup({
          status: 'connection_error',
          actionTitle,
          roleLabel,
          studentName,
          studentId,
          evaluatorName,
          evaluatorWard,
          liveServerSaved: false,
          cloudDbSaved: false,
          savedLocallyOnPhone: true,
          pendingQueueCount: queueTotal,
          detailMessage:
            liveSyncResult.error ||
            'Could not connect to the live sync server or Cloud Database.',
        });
        return;
      }

      setCloudSavePopup({
        status: 'auth_required',
        actionTitle,
        roleLabel,
        studentName,
        studentId,
        evaluatorName,
        evaluatorWard,
        liveServerSaved: liveSyncResult.ok,
        cloudDbSaved: false,
        savedLocallyOnPhone: true,
        pendingQueueCount: queueTotal,
        detailMessage: liveSyncResult.ok
          ? undefined
          : liveSyncResult.error,
      });
      return;
    }

    // 3. Permanent Cloud Firestore Commit + waitForPendingWrites verification
    setFirestoreSaveStatus('saving');
    setFirestoreErrorMsg(null);
    setIsFirestoreOffline(false);

    try {
      const effectiveStaffCred = inlineStaff || inlineStaffCredentialRef.current;
      let staffElevated = Boolean(isStaffAction || isRootAdmin || isFirestoreStaff);

      if (effectiveStaffCred?.preceptor && effectiveStaffCred?.enteredPin) {
        await registerStaffMemberInFirestore(
          firebaseUser,
          effectiveStaffCred.preceptor,
          effectiveStaffCred.enteredPin
        );
        setIsFirestoreStaff(true);
        staffElevated = true;
      }

      await saveStudentDossierToFirestore(firebaseUser, record, {
        isStaff: staffElevated,
        claimPin: getStudentPin(record),
      });

      await removeOfflineSyncTask(`student:${safeId}`);
      setFirestoreSaveStatus('saved');
      setIsFirestoreOffline(false);
      setFirestoreErrorMsg(null);

      // ONLY now show permanent confirmation pop-up!
      setCloudSavePopup({
        status: 'saved',
        actionTitle,
        roleLabel,
        studentName,
        studentId,
        evaluatorName,
        evaluatorWard,
        savedAtIso: new Date().toISOString(),
        liveServerSaved: liveSyncResult.ok,
        cloudDbSaved: true,
      });
    } catch (err: unknown) {
      const parsed = parseCloudErrorForPopup(err);
      const classified = classifyFirestoreError(err);
      const latestQueueTotal = await getPendingOfflineSyncCount();

      setFirestoreSaveStatus('error');
      setIsFirestoreOffline(parsed.isConnection || classified.offline);
      setFirestoreErrorMsg(classified.message);

      if (parsed.isConnection || classified.offline) {
        setCloudSavePopup({
          status: 'connection_error',
          actionTitle,
          roleLabel,
          studentName,
          studentId,
          evaluatorName,
          evaluatorWard,
          liveServerSaved: liveSyncResult.ok,
          cloudDbSaved: false,
          savedLocallyOnPhone: true,
          pendingQueueCount: latestQueueTotal,
          detailMessage: parsed.message,
        });
      } else {
        setCloudSavePopup({
          status: 'other_error',
          actionTitle,
          roleLabel,
          studentName,
          studentId,
          evaluatorName,
          evaluatorWard,
          liveServerSaved: liveSyncResult.ok,
          cloudDbSaved: false,
          savedLocallyOnPhone: true,
          pendingQueueCount: latestQueueTotal,
          canRetry: true,
          detailMessage: parsed.message,
        });
      }
    }
  };

  // Explicit verified save + pop-up confirmation for Permanent Preceptor & Mentor Ward Assignments
  const handleSavePreceptorsToCloud = async (
    updatedPreceptors: RegisteredPreceptor[],
    actionTitle = 'Preceptor & Mentor Permanent Wards Saved',
    deletedIds?: string[]
  ) => {
    saveStoredPreceptors(updatedPreceptors);
    await saveOfflineSnapshot('preceptors', updatedPreceptors);
    await enqueueOfflineSyncTask({
      id: 'preceptors:roster',
      kind: 'preceptors',
      preceptors: updatedPreceptors,
      deletedIds,
      actionTitle,
      queuedAt: new Date().toISOString(),
      attempts: 0,
    });
    const queueTotal = await getPendingOfflineSyncCount();

    cloudSync.setAuthoritativePreceptorsLoaded(true);
    lastPushedPreceptorsHashRef.current = computePreceptorsHash(updatedPreceptors);

    if (authenticatedPreceptor) {
      const refreshedAuth = updatedPreceptors.find(
        (p) =>
          p.id === authenticatedPreceptor.id ||
          (p.name || '').trim().toLowerCase() ===
            (authenticatedPreceptor.name || '').trim().toLowerCase()
      );
      if (refreshedAuth) {
        setAuthenticatedPreceptor(refreshedAuth);
      }
    }

    pendingCloudRetryRef.current = null;
    pendingPreceptorsRetryRef.current = { updatedPreceptors, actionTitle, deletedIds };

    const summaryLabel = `Faculty Directory (${updatedPreceptors.length} Staff)`;
    const roleLabel: CloudSavePopupState['roleLabel'] = 'Lead Clinical Educator';

    setCloudSavePopup({
      status: 'saving',
      actionTitle,
      roleLabel,
      studentName: summaryLabel,
      studentId: 'Preceptors & Mentors',
    });

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setIsFirestoreOffline(true);
      setFirestoreSaveStatus('error');
      setFirestoreErrorMsg('Working offline. Preceptor wards saved on phone and queued for Cloud upload.');
      setCloudSavePopup({
        status: 'connection_error',
        actionTitle,
        roleLabel,
        studentName: summaryLabel,
        studentId: 'Preceptors & Mentors',
        liveServerSaved: false,
        cloudDbSaved: false,
        savedLocallyOnPhone: true,
        pendingQueueCount: queueTotal,
        detailMessage: 'Your device currently has no internet connection (offline).',
      });
      return;
    }

    await cloudSync.syncPreceptors(updatedPreceptors);

    if (!firebaseUser || !firebaseUser.emailVerified) {
      setCloudSavePopup({
        status: 'auth_required',
        actionTitle,
        roleLabel,
        studentName: summaryLabel,
        studentId: 'Preceptors & Mentors',
        liveServerSaved: true,
        cloudDbSaved: false,
        savedLocallyOnPhone: true,
        pendingQueueCount: queueTotal,
      });
      return;
    }

    setFirestoreSaveStatus('saving');
    setFirestoreErrorMsg(null);
    setIsFirestoreOffline(false);

    try {
      await savePreceptorsRosterToFirestore(firebaseUser, updatedPreceptors, deletedIds);
      await removeOfflineSyncTask('preceptors:roster');
      setFirestoreSaveStatus('saved');
      setIsFirestoreOffline(false);
      setFirestoreErrorMsg(null);

      setCloudSavePopup({
        status: 'saved',
        actionTitle,
        roleLabel,
        studentName: summaryLabel,
        studentId: 'Preceptors & Mentors',
        evaluatorName: authenticatedPreceptor?.name || firebaseUser.displayName || 'Lead Educator',
        evaluatorWard: authenticatedPreceptor?.wardDepartment || undefined,
        savedAtIso: new Date().toISOString(),
        liveServerSaved: true,
        cloudDbSaved: true,
      });
    } catch (err: unknown) {
      const parsed = parseCloudErrorForPopup(err);
      const classified = classifyFirestoreError(err);
      const latestQueueTotal = await getPendingOfflineSyncCount();

      setFirestoreSaveStatus('error');
      setIsFirestoreOffline(parsed.isConnection || classified.offline);
      setFirestoreErrorMsg(classified.message);

      if (parsed.isConnection || classified.offline) {
        setCloudSavePopup({
          status: 'connection_error',
          actionTitle,
          roleLabel,
          studentName: summaryLabel,
          studentId: 'Preceptors & Mentors',
          liveServerSaved: true,
          cloudDbSaved: false,
          savedLocallyOnPhone: true,
          pendingQueueCount: latestQueueTotal,
          detailMessage: parsed.message,
        });
      } else {
        setCloudSavePopup({
          status: 'other_error',
          actionTitle,
          roleLabel,
          studentName: summaryLabel,
          studentId: 'Preceptors & Mentors',
          liveServerSaved: true,
          cloudDbSaved: false,
          savedLocallyOnPhone: true,
          pendingQueueCount: latestQueueTotal,
          canRetry: true,
          detailMessage: parsed.message,
        });
      }
    }
  };

  // Permanent Firestore Initialization & Hydration when Google Auth is Ready
  useEffect(() => {
    if (!authReady || !firebaseUser || !firebaseUser.emailVerified) {
      setIsFirestoreStaff(false);
      cloudSync.setAuthoritativePreceptorsLoaded(false);
      return;
    }

    let cancelled = false;
    let unsubPreceptorsFs: (() => void) | null = null;

    const initFirestoreForUser = async () => {
      try {
        await ensureUserDocuments(firebaseUser);
        const staffVerified = await checkIsStaffInFirestore(firebaseUser);
        if (cancelled) return;
        setIsFirestoreStaff(staffVerified);

        // Flush any queued offline phone changes FIRST before pulling remote cloud state
        await flushOfflineQueue(wasOfflineRef.current);
        if (cancelled) return;

        const { students: ensuredRoster } = ensureOfficialStudentsPresent(cohortStudentsRef.current);
        const pinLookup: Record<string, string> = {};
        for (const s of ensuredRoster) {
          const pin = getStudentPin(s);
          pinLookup[s.id] = pin;
          pinLookup[toFirestoreSafeId(s.id)] = pin;
          if (s.traineeInfo?.traineeId) pinLookup[s.traineeInfo.traineeId] = pin;
        }

        if (isRootAdmin) {
          await seedInitialInstitutionalDataIfAdmin(
            firebaseUser,
            ensuredRoster,
            getStoredPreceptors()
          );
          if (cancelled) return;
        }

        // Hydrate permanent preceptor & mentor directory (including saved wards) directly from Cloud Firestore
        const { preceptors: remotePreceptors, fromCloud } = await loadPreceptorsFromFirestore(
          firebaseUser,
          getStoredPreceptors()
        );
        if (cancelled) return;
        if (fromCloud && Array.isArray(remotePreceptors) && remotePreceptors.length > 0) {
          applyHydratedPreceptors(remotePreceptors, true);
        }

        // Live multi-device listener for any future ward edits made on another device
        if (!unsubPreceptorsFs) {
          unsubPreceptorsFs = subscribePreceptorsFromFirestore(
            firebaseUser,
            getStoredPreceptors,
            (livePreceptors) => {
              if (!cancelled && Array.isArray(livePreceptors) && livePreceptors.length > 0) {
                applyHydratedPreceptors(livePreceptors, true);
              }
            }
          );
        }

        const remoteStudents = isRootAdmin
          ? await loadAllCohortStudentsForAdmin(firebaseUser, pinLookup)
          : await loadOwnedStudentsForUser(firebaseUser, staffVerified, pinLookup);

        if (cancelled) return;

        let mergedAfterCloud = [...cohortStudentsRef.current];
        if (remoteStudents.length > 0) {
          for (const remote of remoteStudents) {
            const remoteTKey = normalizeTraineeIdKey(remote.traineeInfo?.traineeId);
            const idx = mergedAfterCloud.findIndex((s) => {
              const localTKey = normalizeTraineeIdKey(s.traineeInfo?.traineeId);
              if (remoteTKey && localTKey) {
                return localTKey === remoteTKey;
              }
              return toFirestoreSafeId(s.id) === remote.id;
            });
            if (idx >= 0) {
              mergedAfterCloud[idx] = mergeStudentWithRemote(mergedAfterCloud[idx], remote);
            } else {
              mergedAfterCloud.unshift(remote);
            }
          }
        }

        const { students: cohortWithOfficials, restored: restoredOfficials } =
          ensureOfficialStudentsPresent(mergedAfterCloud);
        mergedAfterCloud = cohortWithOfficials;

        if (remoteStudents.length > 0 || restoredOfficials.length > 0) {
          setCohortStudents(mergedAfterCloud);
          saveStoredCohortStudents(mergedAfterCloud);
        }

        // If Root Admin or Staff sees an official cohort member (like Abdisa Beyene Gutema NCEP-052-26)
        // missing from Cloud Firestore (e.g. slot overwritten by another trainee or deleted), restore it to Cloud DB.
        if ((isRootAdmin || staffVerified) && !cancelled) {
          const toPersistToCloud = new Map<string, CohortStudentRecord>();
          for (const r of restoredOfficials) {
            toPersistToCloud.set(r.id, r);
          }
          if (isRootAdmin && remoteStudents.length > 0) {
            const remoteTraineeKeys = new Set(
              remoteStudents
                .map((r) => normalizeTraineeIdKey(r.traineeInfo?.traineeId))
                .filter(Boolean)
            );
            const officialKeys = new Set(
              OFFICIAL_IMPORTED_STUDENTS.map((o) =>
                normalizeTraineeIdKey(o.traineeInfo?.traineeId)
              ).filter(Boolean)
            );
            for (const s of mergedAfterCloud) {
              const tKey = normalizeTraineeIdKey(s.traineeInfo?.traineeId);
              if (tKey && officialKeys.has(tKey) && !remoteTraineeKeys.has(tKey)) {
                // Ensure the restored record doesn't overwrite a remote doc occupied by a different trainee
                const collidingRemote = remoteStudents.find(
                  (r) =>
                    r.id === toFirestoreSafeId(s.id) &&
                    normalizeTraineeIdKey(r.traineeInfo?.traineeId) !== tKey
                );
                const safeStudent = collidingRemote
                  ? { ...s, id: `${s.id}-restored` }
                  : s;
                toPersistToCloud.set(safeStudent.id, safeStudent);
              }
            }
          }

          for (const restoredStudent of toPersistToCloud.values()) {
            if (cancelled) break;
            try {
              await saveStudentDossierToFirestore(firebaseUser, restoredStudent, {
                isStaff: true,
                claimPin: getStudentPin(restoredStudent),
              });
              cloudSync.syncStudentNow(
                restoredStudent,
                'preceptor',
                `Restored official student ${restoredStudent.traineeInfo.traineeName || restoredStudent.traineeInfo.traineeId}`
              );
            } catch (restoreErr) {
              console.warn('[FirestoreSync] Could not restore official student:', restoreErr);
            }
          }
        }

        if (remoteStudents.length > 0) {
          // If current active student matches a restored Firestore record, hydrate active state safely
          const activeSafeId = toFirestoreSafeId(currentStudentRosterIdRef.current);
          const matchedRemote = remoteStudents.find(
            (r) =>
              r.id === activeSafeId ||
              (activeTraineeIdRef.current &&
                r.traineeInfo?.traineeId === activeTraineeIdRef.current)
          );

          if (matchedRemote) {
            const recentlyEditedLocal = Date.now() - lastLocalTraineeEditAtRef.current < 15000;
            const merged = mergeStudentWithRemote(
              {
                id: currentStudentRosterIdRef.current,
                traineeInfo: traineeInfoRef.current,
                detailedLogs: detailedLogsRef.current,
                finalSignoff: finalSignoffRef.current,
                updatedAt: recentlyEditedLocal
                  ? new Date(lastLocalTraineeEditAtRef.current).toISOString()
                  : '',
              },
              matchedRemote,
              { preferLocalTraineeInfo: recentlyEditedLocal }
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
          } else if (!isRootAdmin && detailedLogsRef.current.length === 0 && !traineeInfoRef.current?.traineeName?.trim()) {
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

        // If user already had local unsaved logs or edited trainee info on this device before signing in, push them up to Firestore!
        if (
          !String(currentStudentRosterIdRef.current).startsWith('student-blank-') &&
          (detailedLogsRef.current.length > 0 ||
            traineeInfoRef.current?.traineeName?.trim() ||
            traineeInfoRef.current?.traineeId?.trim())
        ) {
          const activeRecord: CohortStudentRecord = {
            id: currentStudentRosterIdRef.current,
            traineeInfo: traineeInfoRef.current,
            detailedLogs: detailedLogsRef.current,
            finalSignoff: finalSignoffRef.current,
            updatedAt: new Date().toISOString(),
          };
          await saveStudentDossierToFirestore(firebaseUser, activeRecord, {
            isStaff: isRootAdmin || staffVerified,
            claimPin: getStudentPin(activeRecord),
          });
        }

        setIsFirestoreOffline(false);
        setFirestoreErrorMsg(null);
        setFirestoreSaveStatus('saved');

        if (retryPopupAfterGoogleAuthRef.current && !cancelled) {
          retryPopupAfterGoogleAuthRef.current = false;
          if (pendingPreceptorsRetryRef.current) {
            const pPending = pendingPreceptorsRetryRef.current;
            handleSavePreceptorsToCloud(
              pPending.updatedPreceptors,
              pPending.actionTitle,
              pPending.deletedIds
            );
          } else if (pendingCloudRetryRef.current) {
            const pending = pendingCloudRetryRef.current;
            saveAndConfirmStudentToCloud({
              ...pending,
              isStaffAction: pending.isStaffAction || isRootAdmin || staffVerified,
            });
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          const classified = classifyFirestoreError(err);
          setFirestoreSaveStatus('error');
          setIsFirestoreOffline(classified.offline);
          setFirestoreErrorMsg(classified.message);
        }
      }
    };

    initFirestoreForUser();
    const handleOnline = () => {
      reconnectFirestoreNetwork().then(() => {
        if (!cancelled) initFirestoreForUser();
      });
    };
    window.addEventListener('online', handleOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      if (unsubPreceptorsFs) {
        unsubPreceptorsFs();
        unsubPreceptorsFs = null;
      }
    };
  }, [authReady, firebaseUser, isRootAdmin]);

  // Automatic flush & live sync reconnection when phone regains internet access
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      cloudSync.fetchInitialState();
      if (firebaseUser && firebaseUser.emailVerified) {
        flushOfflineQueue(true);
      }
    }
  }, [isOnline, firebaseUser]);

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

    // Refresh server sync state immediately so mentor/instructor sees all latest submitted evidence
    cloudSync.fetchInitialState();

    if (firebaseUser && firebaseUser.emailVerified) {
      let staffElevated = isRootAdmin || isFirestoreStaff;
      if (preceptor && enteredPin) {
        try {
          await registerStaffMemberInFirestore(firebaseUser, preceptor, enteredPin);
          setIsFirestoreStaff(true);
          staffElevated = true;
        } catch (err: any) {
          console.warn('[FirestoreSync] Staff verification note:', err?.message || err);
        }
      }
      const { preceptors: freshPreceptors, fromCloud } = await loadPreceptorsFromFirestore(
        firebaseUser,
        getStoredPreceptors()
      );
      if (fromCloud && freshPreceptors.length > 0) {
        applyHydratedPreceptors(freshPreceptors, true);
      }
      if (staffElevated) {
        hydrateSelectedFromFirestoreIfPossible(currentStudentRecord, true);
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
    if (tabId === 'part1' || tabId === 'part2' || tabId === 'cohort' || tabId === 'vault') {
      cloudSync.fetchInitialState();
      if (isRootAdmin || isFirestoreStaff) {
        hydrateSelectedFromFirestoreIfPossible(currentStudentRecord);
      }
    }
  };

  // Helper: hydrate selected student from Firestore when staff/admin or owner selects them
  const hydrateSelectedFromFirestoreIfPossible = async (
    target: CohortStudentRecord,
    staffOverride?: boolean
  ) => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    if (!(isRootAdmin || isFirestoreStaff || staffOverride)) return;
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
    unmarkOfficialStudentDeleted(normalized.traineeInfo?.traineeId || normalized.id);
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
    const targetStudent = cohortStudentsRef.current.find(
      (s) => s.id === studentId || s.traineeInfo?.traineeId === studentId
    );
    if (targetStudent?.traineeInfo?.traineeId) {
      markOfficialStudentDeleted(targetStudent.traineeInfo.traineeId);
    } else {
      markOfficialStudentDeleted(studentId);
    }

    if (firebaseUser && isRootAdmin) {
      deleteStudentFromFirestoreIfAdmin(firebaseUser, targetStudent?.id || studentId).catch((e) =>
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

  // Helper: Record inline staff/preceptor PIN verification for Part I/II/III Cloud DB writes
  const handleInlineStaffAuthenticated = (preceptor?: RegisteredPreceptor, enteredPin?: string) => {
    if (preceptor && enteredPin) {
      inlineStaffCredentialRef.current = { preceptor, enteredPin };
      if (firebaseUser && firebaseUser.emailVerified) {
        registerStaffMemberInFirestore(firebaseUser, preceptor, enteredPin)
          .then(() => setIsFirestoreStaff(true))
          .catch((err) => {
            console.warn('[FirestoreSync] Inline staff verification note:', err?.message || err);
          });
      }
    }
  };

  // Preceptor Quick Status Sign-Off from Part I Tracking Matrix
  const handleQuickPreceptorSignFromMatrix = (
    sessionNumber: number,
    newStatus: 'Met' | 'Pending',
    preceptor?: RegisteredPreceptor,
    enteredPin?: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const activePreceptor = preceptor || authenticatedPreceptor || undefined;
    const inlineStaff =
      activePreceptor && enteredPin ? { preceptor: activePreceptor, enteredPin } : null;
    if (inlineStaff) {
      inlineStaffCredentialRef.current = inlineStaff;
    }

    const effectiveName = activePreceptor
      ? activePreceptor.name
      : traineeInfo.assignedClinicalPreceptor || 'Clinical Preceptor';
    const effectiveInitials = activePreceptor
      ? activePreceptor.initials
      : effectiveName
          .split(' ')
          .filter((w: string) => w.length > 0 && !w.includes('.') && !w.includes(','))
          .map((w: string) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase() || 'CP';
    const effectiveWard = (
      activePreceptor?.wardDepartment ||
      resolvePreceptorWard(effectiveName, effectiveInitials) ||
      ''
    ).trim();

    const defaultComment = activePreceptor
      ? `Competency demonstrated and validated by ${activePreceptor.name} (${activePreceptor.title} · ${effectiveWard || activePreceptor.wardDepartment}).`
      : 'Competency evaluated and validated by preceptor.';

    const prevLogs = detailedLogsRef.current;
    const existingIdx = prevLogs.findIndex((l) => l.sessionNumber === sessionNumber);
    const nowIso = new Date().toISOString();
    let updatedLogs: DetailedActivityLogSheet[];

    if (existingIdx >= 0) {
      const copy = [...prevLogs];
      const current = copy[existingIdx];
      copy[existingIdx] = {
        ...current,
        status: newStatus,
        dateOfActivity: current.dateOfActivity || today,
        signoffUpdatedAt: nowIso,
        signoffRevokedAt: newStatus === 'Pending' ? nowIso : undefined,
        preceptorSignoff:
          newStatus === 'Met'
            ? {
                isSigned: true,
                preceptorName: effectiveName,
                preceptorInitials: effectiveInitials,
                ...(effectiveWard ? { preceptorWard: effectiveWard } : {}),
                competencyDemonstrated: 'Satisfactory',
                comments: current.preceptorSignoff?.comments || defaultComment,
                dateSigned: today,
              }
            : undefined,
      };
      updatedLogs = copy;
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
        clinicalSettingWard:
          effectiveWard || traineeInfo.clinicalDepartmentWard || 'Clinical Ward',
        activityDescription: `Completed required clinical activity for Session ${sessionNumber}: ${sessionDef?.requiredActivity || ''}`,
        reflectiveNotesLessonsLearned: `Demonstrated clinical judgment, followed protocols and integrated patient-centered care.`,
        attachments: [],
        status: newStatus,
        source: 'manual',
        createdAt: today,
        signoffUpdatedAt: nowIso,
        signoffRevokedAt: newStatus === 'Pending' ? nowIso : undefined,
        preceptorSignoff:
          newStatus === 'Met'
            ? {
                isSigned: true,
                preceptorName: effectiveName,
                preceptorInitials: effectiveInitials,
                ...(effectiveWard ? { preceptorWard: effectiveWard } : {}),
                competencyDemonstrated: 'Satisfactory',
                comments: defaultComment,
                dateSigned: today,
              }
            : undefined,
      };
      updatedLogs = [newLog, ...prevLogs];
    }

    const updatedRecord: CohortStudentRecord = normalizeStudentRecord({
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs: updatedLogs,
      finalSignoff,
      updatedAt: new Date().toISOString(),
    });

    const preHash = computeStudentHash(updatedRecord);
    lastSyncedHashRef.current = preHash;
    lastFirestoreHashRef.current = preHash;
    detailedLogsRef.current = updatedLogs;
    setDetailedLogs(updatedLogs);
    setCohortStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudentRosterId ||
        (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
          ? { ...s, detailedLogs: updatedLogs, updatedAt: updatedRecord.updatedAt }
          : s
      )
    );

    saveAndConfirmStudentToCloud({
      record: updatedRecord,
      actionTitle:
        newStatus === 'Met'
          ? `Preceptor Sign-Off Verified (Session ${sessionNumber} · Met)`
          : `Preceptor Signature Removed (Session ${sessionNumber} · Pending)`,
      roleSource: 'preceptor',
      roleLabel: userRole === 'lead_educator' ? 'Lead Clinical Educator' : 'Clinical Preceptor / Mentor',
      evaluatorName: newStatus === 'Met' ? effectiveName : activePreceptor?.name,
      evaluatorWard: newStatus === 'Met' && effectiveWard ? effectiveWard : activePreceptor?.wardDepartment || undefined,
      isStaffAction: true,
      inlineStaff,
    });
  };

  // Handler: Save or update detailed log sheet (flush immediately & confirm permanent Cloud DB write)
  const handleSaveLogSheet = (newLog: DetailedActivityLogSheet) => {
    const prevLogs = detailedLogsRef.current;
    const idx = prevLogs.findIndex((l) => l.id === newLog.id || l.sessionNumber === newLog.sessionNumber);
    const resolvedSignoffWard = newLog.preceptorSignoff?.isSigned
      ? resolvePreceptorWard(
          newLog.preceptorSignoff.preceptorName,
          newLog.preceptorSignoff.preceptorInitials,
          newLog.preceptorSignoff.preceptorWard
        )
      : '';
    const enrichedLog: DetailedActivityLogSheet =
      newLog.preceptorSignoff?.isSigned && resolvedSignoffWard
        ? {
            ...newLog,
            preceptorSignoff: {
              ...newLog.preceptorSignoff,
              preceptorWard: resolvedSignoffWard,
            },
          }
        : newLog;

    const updatedLogs =
      idx >= 0
        ? prevLogs.map((item, i) => (i === idx ? enrichedLog : item))
        : [enrichedLog, ...prevLogs];

    const updatedRecord: CohortStudentRecord = normalizeStudentRecord({
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs: updatedLogs,
      finalSignoff,
      updatedAt: new Date().toISOString(),
    });

    const preHash = computeStudentHash(updatedRecord);
    lastSyncedHashRef.current = preHash;
    lastFirestoreHashRef.current = preHash;
    detailedLogsRef.current = updatedLogs;
    setDetailedLogs(updatedLogs);
    setCohortStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudentRosterId ||
        (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
          ? { ...s, detailedLogs: updatedLogs, updatedAt: updatedRecord.updatedAt }
          : s
      )
    );

    const existingBeforeSave = idx >= 0 ? prevLogs[idx] : undefined;
    const isPreceptorUnsigningAction = Boolean(
      existingBeforeSave?.preceptorSignoff?.isSigned && !enrichedLog.preceptorSignoff?.isSigned
    );
    const isPreceptorSigningAction = Boolean(
      enrichedLog.preceptorSignoff?.isSigned &&
        (!existingBeforeSave?.preceptorSignoff?.isSigned ||
          existingBeforeSave.preceptorSignoff.dateSigned !== enrichedLog.preceptorSignoff.dateSigned ||
          existingBeforeSave.preceptorSignoff.preceptorName !== enrichedLog.preceptorSignoff.preceptorName ||
          existingBeforeSave.preceptorSignoff.preceptorWard !== enrichedLog.preceptorSignoff.preceptorWard ||
          userRole !== 'trainee')
    );

    const isStaffSignoffMutation = isPreceptorSigningAction || isPreceptorUnsigningAction;

    saveAndConfirmStudentToCloud({
      record: updatedRecord,
      actionTitle: isPreceptorUnsigningAction
        ? `Preceptor Signature Removed (Session ${enrichedLog.sessionNumber} · Pending)`
        : isPreceptorSigningAction
          ? `Preceptor Sign-Off Saved (Session ${enrichedLog.sessionNumber} · ${enrichedLog.status})`
          : `Session ${enrichedLog.sessionNumber} Clinical Activity Log Saved`,
      roleSource: isStaffSignoffMutation || userRole !== 'trainee' ? 'preceptor' : 'trainee',
      roleLabel:
        userRole === 'lead_educator'
          ? 'Lead Clinical Educator'
          : isStaffSignoffMutation || userRole === 'preceptor'
            ? 'Clinical Preceptor / Mentor'
            : 'Student / Trainee',
      evaluatorName: isPreceptorSigningAction
        ? enrichedLog.preceptorSignoff?.preceptorName
        : isPreceptorUnsigningAction
          ? authenticatedPreceptor?.name || inlineStaffCredentialRef.current?.preceptor?.name
          : undefined,
      evaluatorWard:
        isPreceptorSigningAction && resolvedSignoffWard
          ? resolvedSignoffWard
          : isPreceptorUnsigningAction
            ? authenticatedPreceptor?.wardDepartment || inlineStaffCredentialRef.current?.preceptor?.wardDepartment
            : undefined,
      isStaffAction: isStaffSignoffMutation || userRole !== 'trainee',
      inlineStaff: isStaffSignoffMutation ? inlineStaffCredentialRef.current : null,
    });
  };

  // Handler: Import logs from OCR (immediately confirm Cloud DB save)
  const handleImportOcrLogs = (newLogs: DetailedActivityLogSheet[]) => {
    const updatedLogs = [...detailedLogsRef.current];
    newLogs.forEach((nl) => {
      const idx = updatedLogs.findIndex((l) => l.sessionNumber === nl.sessionNumber);
      if (idx >= 0) {
        updatedLogs[idx] = nl;
      } else {
        updatedLogs.push(nl);
      }
    });

    const updatedRecord: CohortStudentRecord = normalizeStudentRecord({
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs: updatedLogs,
      finalSignoff,
      updatedAt: new Date().toISOString(),
    });

    const preHash = computeStudentHash(updatedRecord);
    lastSyncedHashRef.current = preHash;
    lastFirestoreHashRef.current = preHash;
    detailedLogsRef.current = updatedLogs;
    setDetailedLogs(updatedLogs);
    setCohortStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudentRosterId ||
        (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
          ? { ...s, detailedLogs: updatedLogs, updatedAt: updatedRecord.updatedAt }
          : s
      )
    );

    const isStaffRole = userRole === 'preceptor' || userRole === 'lead_educator';
    saveAndConfirmStudentToCloud({
      record: updatedRecord,
      actionTitle: `Imported ${newLogs.length} OCR Clinical Log Sheet${newLogs.length === 1 ? '' : 's'}`,
      roleSource: isStaffRole ? 'preceptor' : 'trainee',
      roleLabel:
        userRole === 'lead_educator'
          ? 'Lead Clinical Educator'
          : isStaffRole
            ? 'Clinical Preceptor / Mentor'
            : 'Student / Trainee',
      isStaffAction: isStaffRole,
    });
  };

  // Handler: Add attachment to log (immediately persisted & confirmed in Cloud DB)
  const handleAddAttachmentToLog = (logId: string, attachment: EvidenceAttachment) => {
    const prevLogs = detailedLogsRef.current;
    const targetLog = prevLogs.find((l) => l.id === logId);
    const updatedLogs = prevLogs.map((l) => {
      if (l.id !== logId) return l;
      const nextRemoved = (l.removedAttachmentIds || []).filter((id) => id !== attachment.id);
      return {
        ...l,
        attachments: [...(l.attachments || []), attachment],
        ...(nextRemoved.length > 0 ? { removedAttachmentIds: nextRemoved } : { removedAttachmentIds: undefined }),
      };
    });

    const updatedRecord: CohortStudentRecord = normalizeStudentRecord({
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs: updatedLogs,
      finalSignoff,
      updatedAt: new Date().toISOString(),
    });

    const preHash = computeStudentHash(updatedRecord);
    lastSyncedHashRef.current = preHash;
    lastFirestoreHashRef.current = preHash;
    detailedLogsRef.current = updatedLogs;
    setDetailedLogs(updatedLogs);
    setCohortStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudentRosterId ||
        (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
          ? { ...s, detailedLogs: updatedLogs, updatedAt: updatedRecord.updatedAt }
          : s
      )
    );

    saveAndConfirmStudentToCloud({
      record: updatedRecord,
      actionTitle: `Evidence Attached to Session ${targetLog?.sessionNumber || ''} (${attachment.name})`.trim(),
      roleSource: userRole === 'trainee' ? 'trainee' : 'preceptor',
      roleLabel:
        userRole === 'lead_educator'
          ? 'Lead Clinical Educator'
          : userRole === 'preceptor'
            ? 'Clinical Preceptor / Mentor'
            : 'Student / Trainee',
      isStaffAction: userRole !== 'trainee',
    });
  };

  // Handler: Lead Clinical Educator Part III Final Certification Sign-Off
  const handleUpdateFinalSignoff = (updatedSignoff: FinalCompetencySignoff) => {
    const updatedRecord: CohortStudentRecord = normalizeStudentRecord({
      id: currentStudentRosterId,
      traineeInfo,
      detailedLogs: detailedLogsRef.current,
      finalSignoff: updatedSignoff,
      updatedAt: new Date().toISOString(),
    });

    const preHash = computeStudentHash(updatedRecord);
    lastSyncedHashRef.current = preHash;
    lastFirestoreHashRef.current = preHash;
    finalSignoffRef.current = updatedSignoff;
    setFinalSignoff(updatedSignoff);
    setCohortStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudentRosterId ||
        (traineeInfo?.traineeId && s.traineeInfo?.traineeId === traineeInfo.traineeId)
          ? { ...s, finalSignoff: updatedSignoff, updatedAt: updatedRecord.updatedAt }
          : s
      )
    );

    saveAndConfirmStudentToCloud({
      record: updatedRecord,
      actionTitle: 'Part III Final Competency Certification Signed',
      roleSource: 'preceptor',
      roleLabel: 'Lead Clinical Educator',
      evaluatorName: updatedSignoff.leadEducatorName,
      isStaffAction: true,
      inlineStaff: inlineStaffCredentialRef.current,
    });
  };

  // Handler: Remove attachment from log (STRICTLY restricted to student / trainee only)
  const handleRemoveAttachmentFromLog = (logId: string, attachmentId: string) => {
    if (userRole !== 'trainee') return;

    const prevLogs = detailedLogsRef.current;
    const targetLog = prevLogs.find((l) => l.id === logId);
    if (!targetLog) return;

    const remainingAttachments = (targetLog.attachments || []).filter((a) => a.id !== attachmentId);
    const nextRemoved = Array.from(
      new Set([...(targetLog.removedAttachmentIds || []), attachmentId])
    );

    const updatedLogs = prevLogs.map((l) =>
      l.id === logId
        ? {
            ...l,
            attachments: remainingAttachments,
            removedAttachmentIds: nextRemoved,
          }
        : l
    );

    setDetailedLogs(updatedLogs);

    if (
      !String(currentStudentRosterId || '').startsWith('student-blank-') &&
      (traineeInfo?.traineeId?.trim() || traineeInfo?.traineeName?.trim())
    ) {
      const updatedRecord: CohortStudentRecord = {
        id: currentStudentRosterId,
        traineeInfo,
        detailedLogs: updatedLogs,
        finalSignoff,
        updatedAt: new Date().toISOString(),
      };
      const safeId = toFirestoreSafeId(updatedRecord.id, 'student');
      enqueueOfflineSyncTask({
        id: `attachment_delete:${safeId}:${targetLog.sessionNumber}:${attachmentId}`,
        kind: 'attachment_delete',
        studentId: updatedRecord.id,
        sessionNumber: targetLog.sessionNumber,
        attachmentId,
        remainingAttachments,
        queuedAt: new Date().toISOString(),
        attempts: 0,
      });
      enqueueOfflineSyncTask({
        id: `student:${safeId}`,
        kind: 'student',
        record: updatedRecord,
        isStaffAction: false,
        actionTitle: `Removed evidence from Session ${targetLog.sessionNumber}`,
        roleSource: 'trainee',
        queuedAt: new Date().toISOString(),
        attempts: 0,
      });
      cloudSync.syncStudentNow(
        updatedRecord,
        'trainee',
        `Student removed evidence attachment from Session ${targetLog.sessionNumber}`
      );
      if (firebaseUser && firebaseUser.emailVerified && isOnline) {
        removeAttachmentFromFirestore(
          firebaseUser,
          updatedRecord.id,
          targetLog.sessionNumber,
          attachmentId,
          remainingAttachments
        )
          .then(() =>
            removeOfflineSyncTask(
              `attachment_delete:${safeId}:${targetLog.sessionNumber}:${attachmentId}`
            )
          )
          .catch((err) => {
            console.warn('[FirestoreSync] Attachment deletion note:', err?.message || err);
          });
      }
    }
  };

  // Handler: Update Trainee Information & retain permanently (including promoting blank-slate trainees)
  const handleUpdateTraineeInfo = (rawInfo: TraineeInformation) => {
    const existingPin = traineeInfoRef.current?.studentPin;
    const normalizedInfo = normalizeTraineeInfo({
      ...rawInfo,
      studentPin: rawInfo.studentPin || existingPin,
    });

    lastLocalTraineeEditAtRef.current = Date.now();
    const activeLogs = detailedLogsRef.current;
    const activeSignoff = finalSignoffRef.current;
    const currentId = currentStudentRosterIdRef.current;
    const currentCohort = cohortStudentsRef.current;
    const trimmedTraineeId = normalizedInfo.traineeId.trim();
    const nextTraineeKey = normalizeTraineeIdKey(trimmedTraineeId);
    const hasIdentity = Boolean(normalizedInfo.traineeName.trim() || trimmedTraineeId);

    const currentSlotRecord = currentCohort.find((s) => s.id === currentId);
    const prevSlotTraineeKey = normalizeTraineeIdKey(currentSlotRecord?.traineeInfo?.traineeId);
    const existingOtherByTraineeId = nextTraineeKey
      ? currentCohort.find(
          (s) => s.id !== currentId && normalizeTraineeIdKey(s.traineeInfo?.traineeId) === nextTraineeKey
        )
      : undefined;

    let resolvedId = currentId;
    let promotedFromBlank = false;
    let switchedToDifferentSlot = false;

    if (String(currentId || '').startsWith('student-blank-') && hasIdentity) {
      if (existingOtherByTraineeId) {
        resolvedId = existingOtherByTraineeId.id;
      } else {
        resolvedId = `student-enrolled-${Date.now()}`;
      }
      promotedFromBlank = true;
      setCurrentStudentRosterId(resolvedId);
      setStudentUnlocked(trimmedTraineeId || resolvedId, true);
    } else if (existingOtherByTraineeId) {
      // Trainee entered a Trainee ID that belongs to another roster record — switch to it rather than overwriting current slot
      resolvedId = existingOtherByTraineeId.id;
      switchedToDifferentSlot = true;
      setCurrentStudentRosterId(resolvedId);
      setStudentUnlocked(trimmedTraineeId || resolvedId, true);
    } else if (
      userRole === 'trainee' &&
      prevSlotTraineeKey &&
      nextTraineeKey &&
      prevSlotTraineeKey !== nextTraineeKey
    ) {
      // Protect existing enrolled trainees (like default Abdisa Beyene Gutema / NCEP-052-26)
      // from being overwritten in place when another trainee types their own Trainee ID in Tab 1
      resolvedId = `student-enrolled-${Date.now()}`;
      switchedToDifferentSlot = true;
      setCurrentStudentRosterId(resolvedId);
      setStudentUnlocked(trimmedTraineeId || resolvedId, true);
    }

    if (nextTraineeKey) {
      unmarkOfficialStudentDeleted(nextTraineeKey);
    }

    const updatedRecord: CohortStudentRecord = normalizeStudentRecord({
      id: resolvedId,
      traineeInfo: normalizedInfo,
      detailedLogs: switchedToDifferentSlot ? [] : activeLogs,
      finalSignoff: switchedToDifferentSlot ? normalizeFinalSignoff({}) : activeSignoff,
      studentPin: normalizedInfo.studentPin || getStudentPin({
        id: resolvedId,
        traineeInfo: normalizedInfo,
        detailedLogs: switchedToDifferentSlot ? [] : activeLogs,
        finalSignoff: switchedToDifferentSlot ? normalizeFinalSignoff({}) : activeSignoff,
        updatedAt: new Date().toISOString(),
      }),
      updatedAt: new Date().toISOString(),
    });

    saveStoredTraineeInfo(updatedRecord.traineeInfo);
    traineeInfoRef.current = updatedRecord.traineeInfo;
    activeTraineeIdRef.current = updatedRecord.traineeInfo.traineeId || '';
    currentStudentRosterIdRef.current = resolvedId;
    setTraineeInfo(updatedRecord.traineeInfo);

    // Build updated cohort list & persist locally immediately
    let nextCohort: CohortStudentRecord[];
    const matchIdx = currentCohort.findIndex(
      (s) =>
        s.id === resolvedId ||
        (nextTraineeKey &&
          normalizeTraineeIdKey(s.traineeInfo?.traineeId) === nextTraineeKey)
    );

    if (matchIdx >= 0) {
      const existingEntry = normalizeStudentRecord(currentCohort[matchIdx]);
      const mergedLogs = switchedToDifferentSlot
        ? existingEntry.detailedLogs
        : mergeDetailedLogArrays(existingEntry.detailedLogs, activeLogs);
      const mergedSignoff = switchedToDifferentSlot
        ? existingEntry.finalSignoff
        : activeSignoff.isCertified
          ? activeSignoff
          : existingEntry.finalSignoff;

      const mergedEntry = normalizeStudentRecord({
        ...existingEntry,
        id: existingEntry.id,
        traineeInfo: updatedRecord.traineeInfo,
        detailedLogs: mergedLogs,
        finalSignoff: mergedSignoff,
        studentPin: updatedRecord.traineeInfo.studentPin || existingEntry.studentPin,
        updatedAt: updatedRecord.updatedAt,
      });
      resolvedId = mergedEntry.id;
      updatedRecord.id = mergedEntry.id;
      updatedRecord.detailedLogs = mergedEntry.detailedLogs;
      updatedRecord.finalSignoff = mergedEntry.finalSignoff;
      if (promotedFromBlank || switchedToDifferentSlot) {
        setDetailedLogs(mergedEntry.detailedLogs);
        setFinalSignoff(mergedEntry.finalSignoff);
        setCurrentStudentRosterId(mergedEntry.id);
      }
      nextCohort = currentCohort.map((s, i) => (i === matchIdx ? mergedEntry : s));
    } else if (hasIdentity) {
      if (switchedToDifferentSlot) {
        setDetailedLogs(updatedRecord.detailedLogs);
        setFinalSignoff(updatedRecord.finalSignoff);
      }
      nextCohort = [updatedRecord, ...currentCohort];
    } else {
      nextCohort = currentCohort;
    }

    setCohortStudents(nextCohort);
    saveStoredCohortStudents(nextCohort);

    if (!String(resolvedId || '').startsWith('student-blank-') && hasIdentity) {
      const hash = computeStudentHash(updatedRecord);
      lastSyncedHashRef.current = hash;
      lastFirestoreHashRef.current = hash;

      const safeId = toFirestoreSafeId(updatedRecord.id, 'student');
      enqueueOfflineSyncTask({
        id: `student:${safeId}`,
        kind: 'student',
        record: updatedRecord,
        isStaffAction: userRole === 'preceptor' || userRole === 'lead_educator',
        actionTitle: `Updated trainee profile (${updatedRecord.traineeInfo.traineeName || trimmedTraineeId})`,
        roleSource: userRole === 'preceptor' || userRole === 'lead_educator' ? 'preceptor' : 'trainee',
        queuedAt: new Date().toISOString(),
        attempts: 0,
      });

      cloudSync.syncStudentNow(
        updatedRecord,
        userRole === 'preceptor' || userRole === 'lead_educator' ? 'preceptor' : 'trainee',
        `Updated trainee profile for ${updatedRecord.traineeInfo.traineeName || trimmedTraineeId}`
      );

      if (firebaseUser && firebaseUser.emailVerified && isOnline) {
        if (firestoreDebounceRef.current) clearTimeout(firestoreDebounceRef.current);
        persistStudentToFirestore(updatedRecord);
      }
    }
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
      } catch {
        setIsFirestoreOffline(false);
        setFirestoreErrorMsg('Invalid backup JSON file. Please select a valid NCEP logbook backup (.json).');
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

  const handleRetryFirestoreSync = async () => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    setIsRetryingFirestore(true);
    try {
      await reconnectFirestoreNetwork();
      await flushOfflineQueue(true);
      await persistStudentToFirestore(currentStudentRecord);
    } finally {
      setIsRetryingFirestore(false);
    }
  };

  const handleForceSync = () => {
    cloudSync.syncStudentNow(
      currentStudentRecord,
      userRole === 'preceptor' || userRole === 'lead_educator' ? 'preceptor' : 'trainee',
      'Manual synchronization requested'
    );
    if (firebaseUser && firebaseUser.emailVerified) {
      reconnectFirestoreNetwork().then(async () => {
        await flushOfflineQueue(true);
        await persistStudentToFirestore(currentStudentRecord);
      });
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
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      firestoreSaveStatus === 'error'
                        ? isFirestoreOffline
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {firestoreSaveStatus === 'saving'
                      ? 'Saving...'
                      : firestoreSaveStatus === 'error'
                        ? isFirestoreOffline
                          ? 'Offline Cache'
                          : 'DB Notice'
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
                isOnline={isOnline}
                pendingSyncCount={pendingQueueCount}
                isFlushingOfflineQueue={isFlushingOfflineQueue}
              />

              <PWAInstallButton />

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

        {/* Offline Mode & Pending Cloud Sync Banner */}
        {(!isOnline || (isOnline && pendingQueueCount > 0)) && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-4">
            {!isOnline ? (
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-300 text-teal-950 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <WifiOff className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-teal-950 flex items-center gap-2 flex-wrap">
                      <span>Offline Mode Active — Working Without Internet</span>
                      {pendingQueueCount > 0 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                          {pendingQueueCount} Change{pendingQueueCount === 1 ? '' : 's'} Saved on Phone · Waiting for Internet
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-teal-800">
                      All logs, compressed photos, trainee info, and preceptor signatures are saved safely on your phone. Once you reach Wi-Fi or mobile data, they will upload permanently to Cloud DB.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-800 shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Phone Storage Ready</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <UploadCloud className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="font-bold text-amber-950">
                      Internet Restored — {pendingQueueCount} Offline Change{pendingQueueCount === 1 ? '' : 's'} Ready to Save Permanently on Cloud
                    </div>
                    <p className="text-[11px] text-amber-900">
                      {firebaseUser
                        ? 'Click Upload Now if automatic sync has not started yet.'
                        : 'Sign in with Google once so these queued phone entries save permanently into your Cloud Database.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {firebaseUser ? (
                    <button
                      type="button"
                      onClick={() => flushOfflineQueue(true)}
                      disabled={isFlushingOfflineQueue}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {isFlushingOfflineQueue ? 'Uploading to Cloud...' : 'Upload to Cloud Now'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={signInWithGoogle}
                      disabled={isSigningIn}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {isSigningIn ? 'Signing in...' : 'Sign in & Upload Now'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persistent Cloud Database Sign-In / Error Banner */}
        {(authError || (firestoreErrorMsg && isOnline) || (!firebaseUser && authReady && !dismissAuthBanner && isOnline)) && (
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-4">
            {(authError || firestoreErrorMsg) ? (
              <div
                className={`p-3 rounded-xl text-xs flex items-start justify-between gap-3 border ${
                  isFirestoreOffline && !authError
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isFirestoreOffline && !authError ? 'text-amber-600' : 'text-rose-600'
                    }`}
                  />
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {String(firestoreErrorMsg || authError).includes('Quota exceeded')
                        ? 'Firestore Daily Free-Tier Quota Exceeded (resets tomorrow).'
                        : isFirestoreOffline && !authError
                          ? 'Cloud Database Offline — Saved Safely on Phone'
                          : 'Cloud Database Notice'}
                    </div>
                    <div
                      className={`text-[11px] break-words ${
                        isFirestoreOffline && !authError ? 'text-amber-900' : 'text-rose-800'
                      }`}
                    >
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
                <div className="flex items-center gap-2 shrink-0">
                  {firebaseUser && isFirestoreOffline && (
                    <button
                      type="button"
                      onClick={handleRetryFirestoreSync}
                      disabled={isRetryingFirestore}
                      className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      {isRetryingFirestore ? 'Retrying...' : 'Retry Sync'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      clearAuthError();
                      setFirestoreErrorMsg(null);
                      setIsFirestoreOffline(false);
                    }}
                    className={`text-[11px] font-semibold hover:underline ${
                      isFirestoreOffline && !authError ? 'text-amber-800' : 'text-rose-700'
                    }`}
                  >
                    Dismiss
                  </button>
                </div>
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
          {userRole !== 'trainee' && (
            <div className="mb-5 bg-teal-950 text-white rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-teal-800/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-teal-800 text-teal-100 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-teal-300">
                      Reviewing Student Dossier
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {traineeInfo?.traineeName || 'Unselected'} ({traineeInfo?.traineeId || '—'})
                    </span>
                    <span className="text-[11px] text-teal-200">
                      · {traineeInfo?.clinicalDepartmentWard || 'Ward Unassigned'}
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-300/90 mt-0.5">
                    {totalAttachments > 0
                      ? `${totalAttachments} submitted clinical evidence file${totalAttachments === 1 ? '' : 's'} ready for review.`
                      : 'No evidence attachments uploaded for this student yet.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {activeTab !== 'vault' && (
                  <button
                    type="button"
                    onClick={() => handleTabClick('vault')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>View Evidence Vault ({totalAttachments})</span>
                  </button>
                )}
                {activeTab !== 'cohort' && (
                  <button
                    type="button"
                    onClick={() => handleTabClick('cohort')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-800 border border-teal-700 text-teal-100 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span>All Cohort Students ({cohortStudents.length})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'page1' && (
            <TraineeInfoAndInstructions
              traineeInfo={traineeInfo}
              onUpdateTraineeInfo={handleUpdateTraineeInfo}
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
              authenticatedPreceptor={authenticatedPreceptor}
            />
          )}

          {activeTab === 'part2' && (
            <PartIIDetailedLogSheets
              logs={detailedLogs}
              onSaveLog={handleSaveLogSheet}
              onAddAttachmentToLog={handleAddAttachmentToLog}
              onRemoveAttachmentFromLog={handleRemoveAttachmentFromLog}
              onStaffAuthenticated={handleInlineStaffAuthenticated}
              activeSessionToOpen={targetSessionForPart2}
              onClearActiveSession={() => setTargetSessionForPart2(null)}
              userRole={userRole}
              authenticatedPreceptor={authenticatedPreceptor}
              traineeName={traineeInfo?.traineeName}
              traineeId={traineeInfo?.traineeId}
            />
          )}

          {activeTab === 'part3' && (
            <PartIIIFinalSignoff
              traineeInfo={traineeInfo}
              detailedLogs={detailedLogs}
              finalSignoff={finalSignoff}
              onUpdateFinalSignoff={handleUpdateFinalSignoff}
              onStaffAuthenticated={handleInlineStaffAuthenticated}
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
              onSavePreceptorsToCloud={handleSavePreceptorsToCloud}
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
              onRemoveAttachment={handleRemoveAttachmentFromLog}
              userRole={userRole}
              studentName={traineeInfo?.traineeName}
              traineeId={traineeInfo?.traineeId}
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

      {/* Explicit Cloud Database Save Confirmation / Connection & Error Pop-Up */}
      <CloudSaveStatusModal
        state={cloudSavePopup}
        isRetrying={isRetryingCloudPopup}
        isSigningIn={isSigningIn}
        onClose={() => setCloudSavePopup(null)}
        onRetry={async () => {
          const pendingPreceptors = pendingPreceptorsRetryRef.current;
          const pending = pendingCloudRetryRef.current;
          setIsRetryingCloudPopup(true);
          try {
            await reconnectFirestoreNetwork();
            if (pendingPreceptors) {
              await handleSavePreceptorsToCloud(
                pendingPreceptors.updatedPreceptors,
                pendingPreceptors.actionTitle,
                pendingPreceptors.deletedIds
              );
            } else if (pending) {
              await saveAndConfirmStudentToCloud(pending);
            } else {
              await flushOfflineQueue(true);
            }
          } finally {
            setIsRetryingCloudPopup(false);
          }
        }}
        onSignInGoogle={async () => {
          retryPopupAfterGoogleAuthRef.current = true;
          await signInWithGoogle();
        }}
      />
    </div>
  );
}
