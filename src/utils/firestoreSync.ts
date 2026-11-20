import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  enableNetwork,
  waitForPendingWrites,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  isFirestoreOfflineError,
  OperationType,
} from '../firebase';
import {
  CohortStudentRecord,
  DetailedActivityLogSheet,
  EvidenceAttachment,
  FinalCompetencySignoff,
  PreceptorSignoff,
  RegisteredPreceptor,
} from '../types/nursing';
import { normalizeStudentRecord, getStudentPin } from './storage';
import { ROOT_ADMIN_EMAIL } from '../contexts/FirebaseContext';

export class FirestoreOfflineError extends Error {
  code = 'firestore/offline';
  constructor(
    message = 'Cloud database is temporarily unreachable (client offline). Your logbook changes are safely saved locally and will sync automatically when reconnected.'
  ) {
    super(message);
    this.name = 'FirestoreOfflineError';
  }
}

export function reconnectFirestoreNetwork(): Promise<void> {
  return enableNetwork(db).catch(() => {});
}

export async function verifyFirestoreWritesCommitted(timeoutMs = 12000): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new FirestoreOfflineError(
      'Device is offline. Cloud database could not confirm your entry.'
    );
  }
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(
          new FirestoreOfflineError(
            'Cloud database did not confirm the save in time due to a slow or interrupted network connection.'
          )
        );
      }
    }, timeoutMs);

    waitForPendingWrites(db)
      .then(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve();
        }
      })
      .catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          if (isFirestoreOfflineError(err)) {
            reject(new FirestoreOfflineError());
          } else {
            reject(err);
          }
        }
      });
  });
}

function isPermissionDeniedError(error: unknown): boolean {
  const code = typeof (error as any)?.code === 'string' ? (error as any).code : '';
  const msg = error instanceof Error ? error.message : String(error || '');
  return (
    code === 'permission-denied' ||
    code === 'firestore/permission-denied' ||
    msg.toLowerCase().includes('missing or insufficient permissions')
  );
}

function handleFirestoreFailure(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  if (error instanceof FirestoreOfflineError) {
    throw error;
  }
  if (isFirestoreOfflineError(error)) {
    throw new FirestoreOfflineError();
  }
  handleFirestoreError(error, operationType, path);
}

async function withFirestoreRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isFirestoreOfflineError(err) || attempt === maxRetries) {
        throw err;
      }
      await enableNetwork(db).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 450));
    }
  }
  throw lastErr;
}

export function toFirestoreSafeId(raw: string, fallback = 'record'): string {
  const cleaned = String(raw || fallback)
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 128);
  return cleaned || fallback;
}

export function isUserRootAdmin(user: User | null): boolean {
  return Boolean(
    user && user.emailVerified && user.email?.toLowerCase() === ROOT_ADMIN_EMAIL
  );
}

function boundStr(val: unknown, max: number, fallback = ''): string {
  const s = typeof val === 'string' ? val : val == null ? fallback : String(val);
  return s.slice(0, max);
}

function serializeFinalSignoff(sig?: Partial<FinalCompetencySignoff>) {
  return {
    isCertified: Boolean(sig?.isCertified),
    leadEducatorName: boundStr(sig?.leadEducatorName, 120, ''),
    leadEducatorTitle: boundStr(
      sig?.leadEducatorTitle,
      120,
      'Lead Clinical Educator / Program Coordinator'
    ),
    signatureDataUrl: boundStr(sig?.signatureDataUrl, 200000, ''),
    dateSigned: boundStr(sig?.dateSigned, 32, ''),
    verificationHash: boundStr(sig?.verificationHash, 128, ''),
  };
}

function serializePreceptorSignoff(sig?: Partial<PreceptorSignoff>) {
  const validRating =
    sig?.competencyDemonstrated === 'Needs Improvement' ||
    sig?.competencyDemonstrated === 'Unsatisfactory'
      ? sig.competencyDemonstrated
      : 'Satisfactory';
  return {
    isSigned: Boolean(sig?.isSigned),
    preceptorName: boundStr(sig?.preceptorName, 120, ''),
    signatureDataUrl: boundStr(sig?.signatureDataUrl, 200000, ''),
    dateSigned: boundStr(sig?.dateSigned, 32, ''),
    preceptorInitials: boundStr(sig?.preceptorInitials, 16, ''),
    competencyDemonstrated: validRating,
    comments: boundStr(sig?.comments, 4000, ''),
  };
}

function timestampToIso(ts: unknown, fallback?: string): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (ts && typeof (ts as any).toDate === 'function') {
    try {
      return (ts as any).toDate().toISOString();
    } catch {
      // fallback
    }
  }
  return typeof ts === 'string' && ts ? ts : fallback || new Date().toISOString();
}

export async function ensureUserDocuments(user: User): Promise<void> {
  if (!user?.uid || !user.emailVerified) return;

  const userPath = `users/${user.uid}`;
  const privatePath = `users/${user.uid}/private/info`;

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await withFirestoreRetry(() => getDoc(userRef));
    const desiredRole = isUserRootAdmin(user) ? 'admin' : 'member';

    if (!snap.exists()) {
      await withFirestoreRetry(() =>
        setDoc(userRef, {
          uid: user.uid,
          displayName: boundStr(user.displayName || user.email?.split('@')[0] || 'User', 120),
          role: desiredRole,
          linkedStudentId: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } else {
      await withFirestoreRetry(() =>
        updateDoc(userRef, {
          displayName: boundStr(user.displayName || user.email?.split('@')[0] || 'User', 120),
          updatedAt: serverTimestamp(),
        })
      );
    }
  } catch (error) {
    handleFirestoreFailure(error, OperationType.WRITE, userPath);
  }

  try {
    const privRef = doc(db, 'users', user.uid, 'private', 'info');
    await withFirestoreRetry(() =>
      setDoc(
        privRef,
        {
          uid: user.uid,
          email: boundStr(user.email || '', 200),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    );
  } catch (error) {
    handleFirestoreFailure(error, OperationType.WRITE, privatePath);
  }

  if (isUserRootAdmin(user)) {
    const adminPath = `admins/${user.uid}`;
    try {
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await withFirestoreRetry(() => getDoc(adminRef));
      if (!adminSnap.exists()) {
        await withFirestoreRetry(() =>
          setDoc(adminRef, {
            uid: user.uid,
            email: boundStr(user.email || ROOT_ADMIN_EMAIL, 200),
            createdAt: serverTimestamp(),
          })
        );
      }
    } catch (error) {
      handleFirestoreFailure(error, OperationType.WRITE, adminPath);
    }
  }
}

export async function checkIsStaffInFirestore(user: User): Promise<boolean> {
  if (!user?.uid || !user.emailVerified) return false;
  if (isUserRootAdmin(user)) return true;

  const staffPath = `staffMembers/${user.uid}`;
  try {
    const staffSnap = await withFirestoreRetry(() => getDoc(doc(db, 'staffMembers', user.uid)));
    return staffSnap.exists();
  } catch (error) {
    handleFirestoreFailure(error, OperationType.GET, staffPath);
  }
}

export async function registerStaffMemberInFirestore(
  user: User,
  preceptor: RegisteredPreceptor,
  enteredPin: string
): Promise<void> {
  if (!user?.uid || !user.emailVerified) return;
  const staffPath = `staffMembers/${user.uid}`;
  const preceptorId = toFirestoreSafeId(preceptor.id, 'preceptor');

  try {
    const staffRef = doc(db, 'staffMembers', user.uid);
    const existing = await withFirestoreRetry(() => getDoc(staffRef));
    if (!existing.exists()) {
      await withFirestoreRetry(() =>
        setDoc(staffRef, {
          uid: user.uid,
          preceptorId,
          name: boundStr(preceptor.name, 120),
          role: preceptor.role || 'preceptor',
          title: boundStr(preceptor.title, 120),
          wardDepartment: boundStr(preceptor.wardDepartment, 120),
          initials: boundStr(preceptor.initials, 10),
          claimPin: boundStr(enteredPin, 10),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } else if (isUserRootAdmin(user)) {
      await withFirestoreRetry(() =>
        updateDoc(staffRef, {
          preceptorId,
          name: boundStr(preceptor.name, 120),
          role: preceptor.role || 'preceptor',
          title: boundStr(preceptor.title, 120),
          wardDepartment: boundStr(preceptor.wardDepartment, 120),
          initials: boundStr(preceptor.initials, 10),
          updatedAt: serverTimestamp(),
        })
      );
    }
  } catch (error) {
    handleFirestoreFailure(error, OperationType.WRITE, staffPath);
  }
}

export async function syncPreceptorSecretIfAdmin(
  user: User,
  preceptor: RegisteredPreceptor
): Promise<void> {
  if (!isUserRootAdmin(user)) return;
  const safeId = toFirestoreSafeId(preceptor.id, 'preceptor');
  const path = `staffSecrets/${safeId}`;
  try {
    await withFirestoreRetry(() =>
      setDoc(doc(db, 'staffSecrets', safeId), {
        preceptorId: safeId,
        name: boundStr(preceptor.name, 120),
        role: preceptor.role || 'preceptor',
        title: boundStr(preceptor.title, 120),
        wardDepartment: boundStr(preceptor.wardDepartment, 120),
        initials: boundStr(preceptor.initials, 10),
        pin: boundStr(preceptor.pin, 10, '0000'),
        updatedAt: serverTimestamp(),
      })
    );
  } catch (error) {
    handleFirestoreFailure(error, OperationType.WRITE, path);
  }
}

export async function seedInitialInstitutionalDataIfAdmin(
  user: User,
  cohortStudents: CohortStudentRecord[],
  preceptors: RegisteredPreceptor[]
): Promise<void> {
  if (!isUserRootAdmin(user)) return;

  // 1. Seed missing preceptor PIN secrets
  for (const p of preceptors) {
    const safeId = toFirestoreSafeId(p.id, 'preceptor');
    const path = `staffSecrets/${safeId}`;
    try {
      const ref = doc(db, 'staffSecrets', safeId);
      const snap = await withFirestoreRetry(() => getDoc(ref));
      if (!snap.exists()) {
        await withFirestoreRetry(() =>
          setDoc(ref, {
            preceptorId: safeId,
            name: boundStr(p.name, 120),
            role: p.role || 'preceptor',
            title: boundStr(p.title, 120),
            wardDepartment: boundStr(p.wardDepartment, 120),
            initials: boundStr(p.initials, 10),
            pin: boundStr(p.pin, 10, '0000'),
            updatedAt: serverTimestamp(),
          })
        );
      }
    } catch (error) {
      handleFirestoreFailure(error, OperationType.WRITE, path);
    }
  }

  // 2. Seed missing student PIN secrets & missing cohort dossiers (never overwrite existing!)
  for (const rawStudent of cohortStudents) {
    const student = normalizeStudentRecord(rawStudent);
    const safeId = toFirestoreSafeId(student.id, 'student');
    const pin = getStudentPin(student);

    try {
      const secretRef = doc(db, 'studentSecrets', safeId);
      const secretSnap = await withFirestoreRetry(() => getDoc(secretRef));
      if (!secretSnap.exists()) {
        await withFirestoreRetry(() =>
          setDoc(secretRef, {
            studentId: safeId,
            pin: boundStr(pin, 10, '0000'),
            updatedAt: serverTimestamp(),
          })
        );
      }
    } catch (error) {
      handleFirestoreFailure(error, OperationType.WRITE, `studentSecrets/${safeId}`);
    }

    try {
      const docRef = doc(db, 'cohortStudents', safeId);
      const docSnap = await withFirestoreRetry(() => getDoc(docRef));
      if (!docSnap.exists()) {
        await withFirestoreRetry(() =>
          setDoc(docRef, {
            id: safeId,
            ownerUid: '',
            preceptorUid: '',
            claimPin: '',
            traineeName: boundStr(student.traineeInfo.traineeName, 120),
            traineeId: boundStr(student.traineeInfo.traineeId, 64),
            clinicalDepartmentWard: boundStr(student.traineeInfo.clinicalDepartmentWard, 120),
            assignedClinicalPreceptor: boundStr(student.traineeInfo.assignedClinicalPreceptor, 120),
            trainingPeriodFrom: boundStr(student.traineeInfo.trainingPeriodFrom, 32),
            trainingPeriodTo: boundStr(student.traineeInfo.trainingPeriodTo, 32),
            finalSignoff: serializeFinalSignoff(student.finalSignoff),
            logsSummaryCount: student.detailedLogs.length,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      }
    } catch (error) {
      handleFirestoreFailure(error, OperationType.WRITE, `cohortStudents/${safeId}`);
    }
  }
}

export async function hydrateStudentFromDocData(
  user: User,
  safeId: string,
  docData: any,
  localPinHint?: string,
  options?: { skipLogsIfZero?: boolean }
): Promise<CohortStudentRecord> {
  const logsPath = `cohortStudents/${safeId}/logs`;
  const isAdmin = isUserRootAdmin(user);
  const isOwner = docData?.ownerUid === user.uid;
  let logDocs: { id: string; data: any }[] = [];

  const shouldSkipLogs = Boolean(
    options?.skipLogsIfZero &&
      typeof docData?.logsSummaryCount === 'number' &&
      docData.logsSummaryCount === 0
  );

  if (!shouldSkipLogs) {
    try {
      if (isAdmin) {
        const logsSnap = await withFirestoreRetry(() =>
          getDocs(collection(db, 'cohortStudents', safeId, 'logs'))
        );
        logDocs = logsSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
      } else if (isOwner) {
        const logsSnap = await withFirestoreRetry(() =>
          getDocs(
            query(
              collection(db, 'cohortStudents', safeId, 'logs'),
              where('ownerUid', '==', user.uid)
            )
          )
        );
        logDocs = logsSnap.docs.map((d) => ({ id: d.id, data: d.data() }));
      } else {
        // Verified Preceptor/Staff fetches sessions 1..18 via getDoc (uses allow get with isStaffMember)
        const snaps = await Promise.all(
          Array.from({ length: 18 }, (_, i) =>
            withFirestoreRetry(() =>
              getDoc(doc(db, 'cohortStudents', safeId, 'logs', `session-${i + 1}`))
            ).catch(() => null)
          )
        );
        for (const s of snaps) {
          if (s && s.exists()) {
            logDocs.push({ id: s.id, data: s.data() });
          }
        }
      }
    } catch (error) {
      handleFirestoreFailure(error, OperationType.LIST, logsPath);
    }
  }

  const logs: DetailedActivityLogSheet[] = await Promise.all(
    logDocs.map(async ({ id: logDocId, data: d }) => {
      const attIds: string[] = Array.isArray(d.attachmentIds) ? d.attachmentIds.slice(0, 10) : [];
      let attachments: EvidenceAttachment[] = [];

      if (attIds.length > 0) {
        const attSnaps = await Promise.all(
          attIds.map((attId) =>
            withFirestoreRetry(() =>
              getDoc(
                doc(db, 'cohortStudents', safeId, 'logs', logDocId, 'attachments', attId)
              )
            ).catch(() => null)
          )
        );
        attachments = attSnaps
          .filter((a): a is NonNullable<typeof a> => Boolean(a && a.exists()))
          .map((aDoc) => {
            const ad = (aDoc.data() || {}) as Record<string, any>;
            return {
              id: ad.id || aDoc.id,
              name: ad.name || 'Evidence',
              type: (ad.type || 'clinical_photo') as EvidenceAttachment['type'],
              dataUrl: ad.dataUrl || '',
              notes: ad.notes || '',
              uploadedAt: ad.uploadedAt || timestampToIso(ad.createdAt),
              sizeBytes: typeof ad.sizeBytes === 'number' ? ad.sizeBytes : 0,
            };
          });
      }

      return {
        id: d.id || logDocId,
        sessionNumber: Number(d.sessionNumber) || 1,
        sessionTitle: d.sessionTitle || `Session ${d.sessionNumber || 1}`,
        subCompetencyId: d.subCompetencyId || 'sub_comp_1',
        subCompetencyTitle: d.subCompetencyTitle || '',
        dateOfActivity: d.dateOfActivity || '',
        durationHours: Number(d.durationHours) || 0,
        clinicalSettingWard: d.clinicalSettingWard || '',
        activityDescription: d.activityDescription || '',
        reflectiveNotesLessonsLearned: d.reflectiveNotesLessonsLearned || '',
        attachments,
        preceptorSignoff: d.preceptorSignoff?.isSigned ? d.preceptorSignoff : undefined,
        status: d.status === 'Met' ? 'Met' : 'Pending',
        source: d.source === 'ocr_scan' ? 'ocr_scan' : 'manual',
        createdAt: timestampToIso(d.createdAt),
      } as DetailedActivityLogSheet;
    })
  );

  logs.sort((a, b) => a.sessionNumber - b.sessionNumber);

  return normalizeStudentRecord({
    id: safeId,
    traineeInfo: {
      traineeName: docData.traineeName || '',
      traineeId: docData.traineeId || '',
      clinicalDepartmentWard: docData.clinicalDepartmentWard || '',
      assignedClinicalPreceptor: docData.assignedClinicalPreceptor || '',
      trainingPeriodFrom: docData.trainingPeriodFrom || '',
      trainingPeriodTo: docData.trainingPeriodTo || '',
      ...(localPinHint ? { studentPin: localPinHint } : {}),
    },
    detailedLogs: logs,
    finalSignoff: docData.finalSignoff,
    updatedAt: timestampToIso(docData.updatedAt),
  });
}

export async function loadStudentFromFirestore(
  user: User,
  rawStudentId: string,
  localPinHint?: string
): Promise<CohortStudentRecord | null> {
  const safeId = toFirestoreSafeId(rawStudentId, 'student');
  const path = `cohortStudents/${safeId}`;
  try {
    const snap = await withFirestoreRetry(() => getDoc(doc(db, 'cohortStudents', safeId)));
    if (!snap.exists()) return null;
    return await hydrateStudentFromDocData(user, safeId, snap.data(), localPinHint);
  } catch (error) {
    handleFirestoreFailure(error, OperationType.GET, path);
  }
}

export async function loadAllCohortStudentsForAdmin(
  user: User,
  localPinLookup?: Record<string, string>
): Promise<CohortStudentRecord[]> {
  if (!isUserRootAdmin(user)) return [];
  const path = 'cohortStudents';
  try {
    const snap = await withFirestoreRetry(() => getDocs(collection(db, 'cohortStudents')));
    const results = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const pinHint =
          localPinLookup?.[d.id] || localPinLookup?.[data.traineeId] || undefined;
        return hydrateStudentFromDocData(user, d.id, data, pinHint, {
          skipLogsIfZero: true,
        });
      })
    );
    return results;
  } catch (error) {
    handleFirestoreFailure(error, OperationType.LIST, path);
  }
}

export async function loadOwnedStudentsForUser(
  user: User,
  isStaff: boolean,
  localPinLookup?: Record<string, string>
): Promise<CohortStudentRecord[]> {
  if (!user?.uid || !user.emailVerified) return [];
  if (isUserRootAdmin(user)) {
    return loadAllCohortStudentsForAdmin(user, localPinLookup);
  }

  const results: CohortStudentRecord[] = [];
  const seenIds = new Set<string>();

  try {
    const ownedQ = query(
      collection(db, 'cohortStudents'),
      where('ownerUid', '==', user.uid)
    );
    const ownedSnap = await withFirestoreRetry(() => getDocs(ownedQ));
    for (const d of ownedSnap.docs) {
      seenIds.add(d.id);
      const data = d.data();
      const pinHint = localPinLookup?.[d.id] || localPinLookup?.[data.traineeId];
      results.push(await hydrateStudentFromDocData(user, d.id, data, pinHint));
    }
  } catch (error) {
    handleFirestoreFailure(error, OperationType.LIST, 'cohortStudents');
  }

  if (isStaff) {
    try {
      const assignedQ = query(
        collection(db, 'cohortStudents'),
        where('preceptorUid', '==', user.uid)
      );
      const assignedSnap = await withFirestoreRetry(() => getDocs(assignedQ));
      for (const d of assignedSnap.docs) {
        if (seenIds.has(d.id)) continue;
        seenIds.add(d.id);
        const data = d.data();
        const pinHint = localPinLookup?.[d.id] || localPinLookup?.[data.traineeId];
        results.push(await hydrateStudentFromDocData(user, d.id, data, pinHint));
      }
    } catch (error) {
      handleFirestoreFailure(error, OperationType.LIST, 'cohortStudents');
    }
  }

  return results;
}

export async function saveStudentDossierToFirestore(
  user: User,
  rawStudent: CohortStudentRecord,
  options: { isStaff: boolean; claimPin?: string }
): Promise<void> {
  if (!user?.uid || !user.emailVerified) return;

  const student = normalizeStudentRecord(rawStudent);
  const safeId = toFirestoreSafeId(student.id, 'student');
  if (safeId.startsWith('student-blank-')) return;
  if (!student.traineeInfo.traineeName.trim() && !student.traineeInfo.traineeId.trim()) return;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new FirestoreOfflineError(
      'No active internet connection detected. Your entry has not been saved to the Cloud Database.'
    );
  }

  const isAdmin = isUserRootAdmin(user);
  const docPath = `cohortStudents/${safeId}`;
  const docRef = doc(db, 'cohortStudents', safeId);
  const effectivePin = boundStr(
    options.claimPin || getStudentPin(student),
    10,
    '0000'
  );

  let parentOwnerUid = user.uid;
  let parentPreceptorUid = options.isStaff ? user.uid : '';
  let existingData: any = null;

  // Attempt Action 1 Claim first ONLY if permission-denied indicates an unclaimed seeded doc
  if (!isAdmin && !options.isStaff) {
    try {
      const snap = await withFirestoreRetry(() => getDoc(docRef));
      if (snap.exists()) {
        existingData = snap.data();
      }
    } catch (err) {
      if (isPermissionDeniedError(err)) {
        // Unclaimed docs block non-staff get() until claimed via updateDoc Action 1
        try {
          await withFirestoreRetry(() =>
            updateDoc(docRef, {
              ownerUid: user.uid,
              claimPin: effectivePin,
              updatedAt: serverTimestamp(),
            })
          );
          const snapAfterClaim = await withFirestoreRetry(() => getDoc(docRef));
          if (snapAfterClaim.exists()) {
            existingData = snapAfterClaim.data();
          }
        } catch (claimErr) {
          handleFirestoreFailure(claimErr, OperationType.UPDATE, docPath);
        }
      } else {
        handleFirestoreFailure(err, OperationType.GET, docPath);
      }
    }
  } else {
    try {
      const snap = await withFirestoreRetry(() => getDoc(docRef));
      if (snap.exists()) {
        existingData = snap.data();
      }
    } catch (err) {
      handleFirestoreFailure(err, OperationType.GET, docPath);
    }
  }

  // If admin is saving a new student, ensure studentSecrets exists too
  if (isAdmin) {
    try {
      await withFirestoreRetry(() =>
        setDoc(
          doc(db, 'studentSecrets', safeId),
          {
            studentId: safeId,
            pin: effectivePin,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      );
    } catch (err) {
      handleFirestoreFailure(err, OperationType.WRITE, `studentSecrets/${safeId}`);
    }
  }

  if (!existingData) {
    // Create brand-new dossier doc
    parentOwnerUid = isAdmin ? '' : user.uid;
    parentPreceptorUid = options.isStaff && !isAdmin ? user.uid : '';
    try {
      await withFirestoreRetry(() =>
        setDoc(docRef, {
          id: safeId,
          ownerUid: parentOwnerUid,
          preceptorUid: parentPreceptorUid,
          claimPin: effectivePin,
          traineeName: boundStr(student.traineeInfo.traineeName, 120),
          traineeId: boundStr(student.traineeInfo.traineeId, 64),
          clinicalDepartmentWard: boundStr(student.traineeInfo.clinicalDepartmentWard, 120),
          assignedClinicalPreceptor: boundStr(
            student.traineeInfo.assignedClinicalPreceptor,
            120
          ),
          trainingPeriodFrom: boundStr(student.traineeInfo.trainingPeriodFrom, 32),
          trainingPeriodTo: boundStr(student.traineeInfo.trainingPeriodTo, 32),
          finalSignoff: serializeFinalSignoff(
            isAdmin ? student.finalSignoff : { ...student.finalSignoff, isCertified: false }
          ),
          logsSummaryCount: Math.min(100, student.detailedLogs.length),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );
    } catch (err) {
      handleFirestoreFailure(err, OperationType.CREATE, docPath);
    }
  } else {
    parentOwnerUid = existingData.ownerUid || (isAdmin ? '' : user.uid);
    parentPreceptorUid = existingData.preceptorUid || (options.isStaff ? user.uid : '');

    // Respect terminal lock for non-admins
    if (!existingData.finalSignoff?.isCertified || isAdmin) {
      try {
        if (isAdmin) {
          await withFirestoreRetry(() =>
            updateDoc(docRef, {
              traineeName: boundStr(student.traineeInfo.traineeName, 120),
              traineeId: boundStr(student.traineeInfo.traineeId, 64),
              clinicalDepartmentWard: boundStr(student.traineeInfo.clinicalDepartmentWard, 120),
              assignedClinicalPreceptor: boundStr(
                student.traineeInfo.assignedClinicalPreceptor,
                120
              ),
              trainingPeriodFrom: boundStr(student.traineeInfo.trainingPeriodFrom, 32),
              trainingPeriodTo: boundStr(student.traineeInfo.trainingPeriodTo, 32),
              finalSignoff: serializeFinalSignoff(student.finalSignoff),
              logsSummaryCount: Math.min(100, student.detailedLogs.length),
              updatedAt: serverTimestamp(),
            })
          );
        } else if (options.isStaff) {
          await withFirestoreRetry(() =>
            updateDoc(docRef, {
              preceptorUid: user.uid,
              clinicalDepartmentWard: boundStr(student.traineeInfo.clinicalDepartmentWard, 120),
              assignedClinicalPreceptor: boundStr(
                student.traineeInfo.assignedClinicalPreceptor,
                120
              ),
              trainingPeriodFrom: boundStr(student.traineeInfo.trainingPeriodFrom, 32),
              trainingPeriodTo: boundStr(student.traineeInfo.trainingPeriodTo, 32),
              finalSignoff: serializeFinalSignoff(student.finalSignoff),
              logsSummaryCount: Math.min(100, student.detailedLogs.length),
              updatedAt: serverTimestamp(),
            })
          );
        } else if (existingData.ownerUid === user.uid) {
          await withFirestoreRetry(() =>
            updateDoc(docRef, {
              traineeName: boundStr(student.traineeInfo.traineeName, 120),
              traineeId: boundStr(student.traineeInfo.traineeId, 64),
              clinicalDepartmentWard: boundStr(student.traineeInfo.clinicalDepartmentWard, 120),
              assignedClinicalPreceptor: boundStr(
                student.traineeInfo.assignedClinicalPreceptor,
                120
              ),
              trainingPeriodFrom: boundStr(student.traineeInfo.trainingPeriodFrom, 32),
              trainingPeriodTo: boundStr(student.traineeInfo.trainingPeriodTo, 32),
              logsSummaryCount: Math.min(100, student.detailedLogs.length),
              updatedAt: serverTimestamp(),
            })
          );
        }
      } catch (err) {
        handleFirestoreFailure(err, OperationType.UPDATE, docPath);
      }
    }
  }

  // Sync each DetailedActivityLogSheet + Attachments subcollection
  for (const log of student.detailedLogs) {
    const safeLogId = `session-${log.sessionNumber}`;
    const logPath = `cohortStudents/${safeId}/logs/${safeLogId}`;
    const logRef = doc(db, 'cohortStudents', safeId, 'logs', safeLogId);
    const boundedAttachments = (log.attachments || [])
      .filter((a) => a && typeof a.dataUrl === 'string' && a.dataUrl.length <= 750000)
      .slice(0, 10);
    const localAttachmentIds = boundedAttachments.map((a) =>
      toFirestoreSafeId(a.id, `att-${Date.now()}`)
    );
    const removedSet = new Set(
      (log.removedAttachmentIds || []).flatMap((id) => [id, toFirestoreSafeId(id, id)])
    );

    let existingLog: any = null;
    try {
      const logSnap = await withFirestoreRetry(() => getDoc(logRef));
      if (logSnap.exists()) existingLog = logSnap.data();
    } catch (err) {
      handleFirestoreFailure(err, OperationType.GET, logPath);
    }

    const existingAttachmentIds: string[] = Array.isArray(existingLog?.attachmentIds)
      ? existingLog.attachmentIds
      : [];
    const finalAttachmentIds = Array.from(
      new Set([...existingAttachmentIds, ...localAttachmentIds])
    )
      .filter((id) => !removedSet.has(id))
      .slice(0, 10);

    if (!existingLog) {
      const isSignedByStaff = (isAdmin || options.isStaff) && log.status === 'Met';
      try {
        await withFirestoreRetry(() =>
          setDoc(logRef, {
            id: safeLogId,
            studentId: safeId,
            ownerUid: parentOwnerUid,
            preceptorUid: isAdmin || options.isStaff ? user.uid : parentPreceptorUid,
            sessionNumber: Math.min(18, Math.max(1, Number(log.sessionNumber) || 1)),
            sessionTitle: boundStr(log.sessionTitle, 250),
            subCompetencyId: log.subCompetencyId || 'sub_comp_1',
            subCompetencyTitle: boundStr(log.subCompetencyTitle, 250),
            dateOfActivity: boundStr(log.dateOfActivity, 32),
            durationHours: Math.min(240, Math.max(0, Number(log.durationHours) || 0)),
            clinicalSettingWard: boundStr(log.clinicalSettingWard, 120),
            activityDescription: boundStr(log.activityDescription, 10000),
            reflectiveNotesLessonsLearned: boundStr(log.reflectiveNotesLessonsLearned, 10000),
            attachmentsCount: finalAttachmentIds.length,
            attachmentIds: finalAttachmentIds,
            preceptorSignoff: serializePreceptorSignoff(
              isSignedByStaff ? log.preceptorSignoff : { isSigned: false }
            ),
            status: isSignedByStaff ? 'Met' : 'Pending',
            source: log.source === 'ocr_scan' ? 'ocr_scan' : 'manual',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );
      } catch (err) {
        handleFirestoreFailure(err, OperationType.CREATE, logPath);
      }
    } else {
      try {
        if (isAdmin) {
          await withFirestoreRetry(() =>
            updateDoc(logRef, {
              dateOfActivity: boundStr(log.dateOfActivity, 32),
              durationHours: Math.min(240, Math.max(0, Number(log.durationHours) || 0)),
              clinicalSettingWard: boundStr(log.clinicalSettingWard, 120),
              activityDescription: boundStr(log.activityDescription, 10000),
              reflectiveNotesLessonsLearned: boundStr(log.reflectiveNotesLessonsLearned, 10000),
              attachmentsCount: finalAttachmentIds.length,
              attachmentIds: finalAttachmentIds,
              preceptorSignoff: serializePreceptorSignoff(log.preceptorSignoff),
              status: log.status === 'Met' ? 'Met' : 'Pending',
              source: log.source === 'ocr_scan' ? 'ocr_scan' : 'manual',
              updatedAt: serverTimestamp(),
            })
          );
        } else if (options.isStaff) {
          await withFirestoreRetry(() =>
            updateDoc(logRef, {
              preceptorUid: user.uid,
              dateOfActivity: boundStr(log.dateOfActivity, 32),
              clinicalSettingWard: boundStr(log.clinicalSettingWard, 120),
              preceptorSignoff: serializePreceptorSignoff(log.preceptorSignoff),
              status: log.status === 'Met' ? 'Met' : 'Pending',
              updatedAt: serverTimestamp(),
            })
          );
        } else if (existingLog.status === 'Pending' && parentOwnerUid === user.uid) {
          await withFirestoreRetry(() =>
            updateDoc(logRef, {
              dateOfActivity: boundStr(log.dateOfActivity, 32),
              durationHours: Math.min(240, Math.max(0, Number(log.durationHours) || 0)),
              clinicalSettingWard: boundStr(log.clinicalSettingWard, 120),
              activityDescription: boundStr(log.activityDescription, 10000),
              reflectiveNotesLessonsLearned: boundStr(log.reflectiveNotesLessonsLearned, 10000),
              attachmentsCount: finalAttachmentIds.length,
              attachmentIds: finalAttachmentIds,
              source: log.source === 'ocr_scan' ? 'ocr_scan' : 'manual',
              updatedAt: serverTimestamp(),
            })
          );
        } else if (existingLog.status === 'Met' && parentOwnerUid === user.uid) {
          const attChanged =
            finalAttachmentIds.length !== existingAttachmentIds.length ||
            finalAttachmentIds.some((id, i) => existingAttachmentIds[i] !== id);
          if (attChanged) {
            await withFirestoreRetry(() =>
              updateDoc(logRef, {
                attachmentsCount: finalAttachmentIds.length,
                attachmentIds: finalAttachmentIds,
                updatedAt: serverTimestamp(),
              })
            );
          }
        }
      } catch (err) {
        handleFirestoreFailure(err, OperationType.UPDATE, logPath);
      }
    }

    // Sync bounded attachments
    for (let idx = 0; idx < boundedAttachments.length; idx++) {
      const att = boundedAttachments[idx];
      const safeAttId = localAttachmentIds[idx];
      if (removedSet.has(safeAttId)) continue;
      const attPath = `cohortStudents/${safeId}/logs/${safeLogId}/attachments/${safeAttId}`;
      const attRef = doc(db, 'cohortStudents', safeId, 'logs', safeLogId, 'attachments', safeAttId);
      try {
        const attSnap = await withFirestoreRetry(() => getDoc(attRef));
        if (!attSnap.exists()) {
          await withFirestoreRetry(() =>
            setDoc(attRef, {
              id: safeAttId,
              studentId: safeId,
              logId: safeLogId,
              ownerUid: parentOwnerUid,
              preceptorUid: isAdmin || options.isStaff ? user.uid : parentPreceptorUid,
              name: boundStr(att.name, 200, 'Clinical Evidence'),
              type: boundStr(att.type, 40, 'clinical_photo'),
              dataUrl: boundStr(att.dataUrl, 750000),
              notes: boundStr(att.notes, 1000, ''),
              uploadedAt: boundStr(att.uploadedAt, 64, new Date().toISOString()),
              sizeBytes: Math.min(1048576, Math.max(0, Number(att.sizeBytes) || att.dataUrl.length)),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          );
        }
      } catch (err) {
        handleFirestoreFailure(err, OperationType.WRITE, attPath);
      }
    }

    // Remove attachment docs explicitly deleted by the student (or admin)
    if (removedSet.size > 0 && (isAdmin || parentOwnerUid === user.uid)) {
      for (const remRawId of log.removedAttachmentIds || []) {
        const safeRemId = toFirestoreSafeId(remRawId, remRawId);
        if (!safeRemId) continue;
        const remRef = doc(db, 'cohortStudents', safeId, 'logs', safeLogId, 'attachments', safeRemId);
        try {
          await withFirestoreRetry(() => deleteDoc(remRef));
        } catch {
          // Ignore if attachment doc never existed in Firestore
        }
      }
    }
  }

  await verifyFirestoreWritesCommitted();
}

export async function removeAttachmentFromFirestore(
  user: User,
  rawStudentId: string,
  logSessionNumber: number,
  attachmentId: string,
  remainingAttachments: EvidenceAttachment[]
): Promise<void> {
  if (!user?.uid || !user.emailVerified) return;
  const safeId = toFirestoreSafeId(rawStudentId, 'student');
  const safeLogId = `session-${logSessionNumber}`;
  const safeAttId = toFirestoreSafeId(attachmentId, attachmentId);
  if (!safeId || !safeAttId) return;

  const logRef = doc(db, 'cohortStudents', safeId, 'logs', safeLogId);
  const attRef = doc(db, 'cohortStudents', safeId, 'logs', safeLogId, 'attachments', safeAttId);
  const remainingIds = (remainingAttachments || [])
    .filter((a) => a && a.id && a.id !== attachmentId && typeof a.dataUrl === 'string' && a.dataUrl.length <= 750000)
    .slice(0, 10)
    .map((a) => toFirestoreSafeId(a.id, a.id));

  try {
    const logSnap = await withFirestoreRetry(() => getDoc(logRef));
    if (logSnap.exists()) {
      await withFirestoreRetry(() =>
        updateDoc(logRef, {
          attachmentsCount: remainingIds.length,
          attachmentIds: remainingIds,
          updatedAt: serverTimestamp(),
        })
      );
    }
  } catch (err) {
    handleFirestoreFailure(err, OperationType.UPDATE, `cohortStudents/${safeId}/logs/${safeLogId}`);
  }

  try {
    await withFirestoreRetry(() => deleteDoc(attRef));
  } catch (err) {
    handleFirestoreFailure(err, OperationType.DELETE, `cohortStudents/${safeId}/logs/${safeLogId}/attachments/${safeAttId}`);
  }

  await verifyFirestoreWritesCommitted();
}

export async function deleteStudentFromFirestoreIfAdmin(
  user: User,
  rawStudentId: string
): Promise<void> {
  if (!isUserRootAdmin(user)) return;
  const safeId = toFirestoreSafeId(rawStudentId, 'student');
  const path = `cohortStudents/${safeId}`;
  try {
    await withFirestoreRetry(() => deleteDoc(doc(db, 'cohortStudents', safeId)));
  } catch (err) {
    handleFirestoreFailure(err, OperationType.DELETE, path);
  }
}

export function subscribeActiveStudentFirestore(
  user: User,
  rawStudentId: string,
  localPinHint: string | undefined,
  onHydratedStudent: (student: CohortStudentRecord) => void
): () => void {
  if (!user?.uid || !user.emailVerified) return () => {};
  const safeId = toFirestoreSafeId(rawStudentId, 'student');
  if (!safeId || safeId.startsWith('student-blank-')) return () => {};

  const docPath = `cohortStudents/${safeId}`;
  const unsubDoc = onSnapshot(
    doc(db, 'cohortStudents', safeId),
    async (snap) => {
      if (!snap.exists()) return;
      try {
        const hydrated = await hydrateStudentFromDocData(
          user,
          safeId,
          snap.data(),
          localPinHint
        );
        onHydratedStudent(hydrated);
      } catch (e) {
        console.error('[FirestoreSync] Hydration error:', e);
      }
    },
    (error) => {
      handleFirestoreFailure(error, OperationType.GET, docPath);
    }
  );

  return () => {
    unsubDoc();
  };
}
