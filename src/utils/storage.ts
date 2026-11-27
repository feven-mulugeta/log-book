import {
  TraineeInformation,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
  CohortStudentRecord,
  RegisteredPreceptor,
  EvidenceAttachment,
} from '../types/nursing';
import {
  INITIAL_TRAINEE_INFO,
  INITIAL_DETAILED_LOG_SHEETS,
  INITIAL_FINAL_SIGNOFF,
} from '../data/ncepData';
import {
  OFFICIAL_IMPORTED_PRECEPTORS,
  OFFICIAL_IMPORTED_STUDENTS,
} from '../data/officialImportedData';

const STORAGE_KEYS = {
  TRAINEE_INFO: 'ncep_trainee_info',
  DETAILED_LOGS: 'ncep_detailed_logs',
  FINAL_SIGNOFF: 'ncep_final_signoff',
  USER_ROLE: 'ncep_user_role',
  PRECEPTOR_PIN: 'ncep_preceptor_pin',
  COHORT_STUDENTS: 'ncep_cohort_students',
  PRECEPTOR_ROSTER: 'ncep_preceptor_roster',
  UNLOCKED_STUDENTS: 'ncep_unlocked_students_session',
  DELETED_OFFICIAL_IDS: 'ncep_deleted_official_student_ids',
};

export type UserRole = 'trainee' | 'preceptor' | 'lead_educator';

export { OFFICIAL_IMPORTED_PRECEPTORS, OFFICIAL_IMPORTED_STUDENTS };
export const FULL_15_PRECEPTORS_ROSTER: RegisteredPreceptor[] = OFFICIAL_IMPORTED_PRECEPTORS;
export const DEFAULT_REGISTERED_PRECEPTORS: RegisteredPreceptor[] = OFFICIAL_IMPORTED_PRECEPTORS;
export const DEFAULT_COHORT_STUDENTS: CohortStudentRecord[] = OFFICIAL_IMPORTED_STUDENTS;

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[Storage] Failed to save ${key}:`, e);
  }
}

export function normalizeTraineeInfo(info: any): TraineeInformation {
  const raw = info && typeof info === 'object' ? info : {};
  return {
    traineeName: typeof raw.traineeName === 'string' ? raw.traineeName : '',
    traineeId: typeof raw.traineeId === 'string' ? raw.traineeId : '',
    clinicalDepartmentWard: typeof raw.clinicalDepartmentWard === 'string' ? raw.clinicalDepartmentWard : '',
    assignedClinicalPreceptor:
      typeof raw.assignedClinicalPreceptor === 'string' ? raw.assignedClinicalPreceptor : '',
    trainingPeriodFrom: typeof raw.trainingPeriodFrom === 'string' ? raw.trainingPeriodFrom : '',
    trainingPeriodTo: typeof raw.trainingPeriodTo === 'string' ? raw.trainingPeriodTo : '',
    ...(raw.studentPin ? { studentPin: String(raw.studentPin) } : {}),
  };
}

export function normalizeDetailedLog(log: any, index: number = 0): DetailedActivityLogSheet {
  const raw = log && typeof log === 'object' ? log : {};
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `ncep-log-${Date.now()}-${index}`,
    sessionNumber: Number(raw.sessionNumber) || 1,
    sessionTitle: typeof raw.sessionTitle === 'string' ? raw.sessionTitle : `Session ${Number(raw.sessionNumber) || 1}`,
    subCompetencyId: raw.subCompetencyId || 'sub_comp_1',
    subCompetencyTitle: typeof raw.subCompetencyTitle === 'string' ? raw.subCompetencyTitle : '',
    dateOfActivity: typeof raw.dateOfActivity === 'string' ? raw.dateOfActivity : '',
    durationHours: Number(raw.durationHours) || 4,
    clinicalSettingWard: typeof raw.clinicalSettingWard === 'string' ? raw.clinicalSettingWard : 'Medical ICU',
    activityDescription: typeof raw.activityDescription === 'string' ? raw.activityDescription : '',
    reflectiveNotesLessonsLearned:
      typeof raw.reflectiveNotesLessonsLearned === 'string' ? raw.reflectiveNotesLessonsLearned : '',
    attachments: Array.isArray(raw.attachments)
      ? raw.attachments.filter((a: any) => a && typeof a === 'object')
      : [],
    ...(Array.isArray(raw.removedAttachmentIds) && raw.removedAttachmentIds.length > 0
      ? {
          removedAttachmentIds: Array.from(
            new Set(raw.removedAttachmentIds.filter((id: any) => typeof id === 'string' && id))
          ),
        }
      : {}),
    preceptorSignoff: raw.preceptorSignoff && typeof raw.preceptorSignoff === 'object' ? raw.preceptorSignoff : undefined,
    ...(typeof raw.signoffUpdatedAt === 'string' && raw.signoffUpdatedAt
      ? { signoffUpdatedAt: raw.signoffUpdatedAt }
      : {}),
    ...(typeof raw.signoffRevokedAt === 'string' && raw.signoffRevokedAt
      ? { signoffRevokedAt: raw.signoffRevokedAt }
      : {}),
    status: raw.status === 'Met' ? 'Met' : 'Pending',
    source: raw.source === 'ocr_scan' ? 'ocr_scan' : 'manual',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
  };
}

export function mergeAttachments(
  localAtts: EvidenceAttachment[] = [],
  remoteAtts: EvidenceAttachment[] = [],
  removedIds: string[] = []
): EvidenceAttachment[] {
  const removedSet = new Set(removedIds.filter(Boolean));
  const map = new Map<string, EvidenceAttachment>();
  for (const att of [...(localAtts || []), ...(remoteAtts || [])]) {
    if (!att || typeof att !== 'object' || !att.id) continue;
    if (removedSet.has(att.id)) continue;
    if (!map.has(att.id)) {
      map.set(att.id, att);
    }
  }
  return Array.from(map.values());
}

function parseTimestampMs(val?: string): number {
  if (!val || typeof val !== 'string') return 0;
  const parsed = Date.parse(val);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mergeDetailedLogArrays(
  localLogs: DetailedActivityLogSheet[] = [],
  remoteLogs: DetailedActivityLogSheet[] = []
): DetailedActivityLogSheet[] {
  const mergedBySession = new Map<number, DetailedActivityLogSheet>();

  for (const rawL of localLogs || []) {
    const l = normalizeDetailedLog(rawL);
    mergedBySession.set(l.sessionNumber, l);
  }

  for (const rawR of remoteLogs || []) {
    const r = normalizeDetailedLog(rawR);
    const existing = mergedBySession.get(r.sessionNumber);
    if (!existing) {
      mergedBySession.set(r.sessionNumber, r);
      continue;
    }

    const combinedRemoved = Array.from(
      new Set([...(existing.removedAttachmentIds || []), ...(r.removedAttachmentIds || [])])
    );
    const mergedAtts = mergeAttachments(existing.attachments, r.attachments, combinedRemoved);

    const rSigned = r.status === 'Met' || Boolean(r.preceptorSignoff?.isSigned);
    const lSigned = existing.status === 'Met' || Boolean(existing.preceptorSignoff?.isSigned);

    let winner: DetailedActivityLogSheet = existing;
    if (rSigned && !lSigned) {
      const localRevokedMs = parseTimestampMs(existing.signoffRevokedAt);
      const remoteSignedMs = parseTimestampMs(
        r.signoffUpdatedAt || r.preceptorSignoff?.dateSigned
      );
      winner = localRevokedMs > 0 && localRevokedMs >= remoteSignedMs ? existing : r;
    } else if (lSigned && !rSigned) {
      const remoteRevokedMs = parseTimestampMs(r.signoffRevokedAt);
      const localSignedMs = parseTimestampMs(
        existing.signoffUpdatedAt || existing.preceptorSignoff?.dateSigned
      );
      winner = remoteRevokedMs > 0 && remoteRevokedMs >= localSignedMs ? r : existing;
    } else {
      const rScore =
        (r.activityDescription?.length || 0) +
        (r.reflectiveNotesLessonsLearned?.length || 0) +
        (r.attachments?.length || 0) * 100;
      const lScore =
        (existing.activityDescription?.length || 0) +
        (existing.reflectiveNotesLessonsLearned?.length || 0) +
        (existing.attachments?.length || 0) * 100;
      if (rScore >= lScore) {
        winner = r;
      }
    }

    const winnerSigned = winner.status === 'Met' || Boolean(winner.preceptorSignoff?.isSigned);
    const latestRevokedAt =
      parseTimestampMs(existing.signoffRevokedAt) >= parseTimestampMs(r.signoffRevokedAt)
        ? existing.signoffRevokedAt
        : r.signoffRevokedAt;

    mergedBySession.set(r.sessionNumber, {
      ...winner,
      attachments: mergedAtts,
      ...(!winnerSigned && latestRevokedAt ? { signoffRevokedAt: latestRevokedAt } : {}),
      ...(combinedRemoved.length > 0 ? { removedAttachmentIds: combinedRemoved } : {}),
    });
  }

  return Array.from(mergedBySession.values()).sort((a, b) => a.sessionNumber - b.sessionNumber);
}

export function normalizeFinalSignoff(signoff: any): FinalCompetencySignoff {
  const raw = signoff && typeof signoff === 'object' ? signoff : {};
  return {
    isCertified: Boolean(raw.isCertified),
    leadEducatorName: typeof raw.leadEducatorName === 'string' ? raw.leadEducatorName : '',
    leadEducatorTitle:
      typeof raw.leadEducatorTitle === 'string'
        ? raw.leadEducatorTitle
        : 'Lead Clinical Educator / Program Coordinator',
    signatureDataUrl: typeof raw.signatureDataUrl === 'string' ? raw.signatureDataUrl : undefined,
    dateSigned: typeof raw.dateSigned === 'string' ? raw.dateSigned : undefined,
    verificationHash: typeof raw.verificationHash === 'string' ? raw.verificationHash : undefined,
  };
}

export function normalizeStudentRecord(student: any, index: number = 0): CohortStudentRecord {
  const raw = student && typeof student === 'object' ? student : {};
  const traineeInfo = normalizeTraineeInfo(raw.traineeInfo);
  const detailedLogs = Array.isArray(raw.detailedLogs)
    ? raw.detailedLogs.filter((l: any) => l && typeof l === 'object').map((l: any, i: number) => normalizeDetailedLog(l, i))
    : [];
  const finalSignoff = normalizeFinalSignoff(raw.finalSignoff);
  const pin = raw.studentPin || traineeInfo.studentPin || computeDefaultStudentPin(traineeInfo.traineeId, index);

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `student-${Date.now()}-${index}`,
    traineeInfo: {
      ...traineeInfo,
      studentPin: String(pin),
    },
    detailedLogs,
    finalSignoff,
    studentPin: String(pin),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export function getStoredPreceptors(): RegisteredPreceptor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRECEPTOR_ROSTER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure the official roster (Abaynesh Mekonnen, Yohannes Ayalew, Aklil Hailu) is present
        const hasOfficial = parsed.some(
          (p) => p && (p.name?.includes('Abaynesh') || p.name?.includes('Yohannes Ayalew') || p.name?.includes('Aklil'))
        );
        if (hasOfficial) {
          let currentList = parsed.filter((p) => p && typeof p === 'object' && p.name);
          let changed = false;

          // One-time merge for newly added official mentor Yeshi Berhan (NICU, PIN 3570)
          const mergedKeyYeshi = 'ncep_official_mentor_yeshi_3570_merged';
          if (!localStorage.getItem(mergedKeyYeshi)) {
            const exists = currentList.some(
              (p) => p?.name?.trim().toLowerCase() === 'yeshi berhan' || p?.pin === '3570'
            );
            if (!exists) {
              const yeshi = OFFICIAL_IMPORTED_PRECEPTORS.find((p) => p.name === 'Yeshi Berhan');
              if (yeshi) {
                currentList = [...currentList, yeshi];
                changed = true;
              }
            }
            safeLocalStorageSet(mergedKeyYeshi, 'true');
          }

          // One-time merge for newly added official mentor Sr xx yy (Medical, PIN 4590)
          const mergedKeySr = 'ncep_official_mentor_sr_xx_yy_4590_merged';
          if (!localStorage.getItem(mergedKeySr)) {
            const exists = currentList.some(
              (p) => p?.name?.trim().toLowerCase() === 'sr xx yy' || p?.pin === '4590'
            );
            if (!exists) {
              const srMentor = OFFICIAL_IMPORTED_PRECEPTORS.find((p) => p.pin === '4590');
              if (srMentor) {
                currentList = [...currentList, srMentor];
                changed = true;
              }
            }
            safeLocalStorageSet(mergedKeySr, 'true');
          }

          if (changed) {
            safeLocalStorageSet(STORAGE_KEYS.PRECEPTOR_ROSTER, JSON.stringify(currentList));
          }
          return currentList;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_REGISTERED_PRECEPTORS;
}

export function saveStoredPreceptors(preceptors: RegisteredPreceptor[]): void {
  safeLocalStorageSet(STORAGE_KEYS.PRECEPTOR_ROSTER, JSON.stringify(preceptors));
}

export const CLINICAL_WARD_PRESETS: string[] = [
  'Medical',
  'Medical ICU',
  'Surgical',
  'Medical-Surgical',
  'NICU',
  'Emergency Center',
  'Pediatrics',
  'ICU',
  'Obstetrics & Gynecology',
  'Operating Theater',
  'Outpatient Department',
  'Clinical Education & Training Directorate',
];

export function resolvePreceptorWard(
  preceptorName?: string,
  preceptorInitials?: string,
  explicitWard?: string,
  preceptorsList?: RegisteredPreceptor[]
): string {
  if (explicitWard && explicitWard.trim()) {
    return explicitWard.trim();
  }
  const roster = preceptorsList || getStoredPreceptors();
  const cleanName = (preceptorName || '').trim().toLowerCase();
  const cleanInitials = (preceptorInitials || '').trim().toLowerCase();

  if (cleanName) {
    const exactMatch = roster.find(
      (p) => (p.name || '').trim().toLowerCase() === cleanName
    );
    if (exactMatch?.wardDepartment?.trim()) {
      return exactMatch.wardDepartment.trim();
    }
    const partialMatch = roster.find(
      (p) =>
        cleanName.includes((p.name || '').trim().toLowerCase()) ||
        (p.name || '').trim().toLowerCase().includes(cleanName)
    );
    if (partialMatch?.wardDepartment?.trim()) {
      return partialMatch.wardDepartment.trim();
    }
  }

  if (cleanInitials) {
    const initialsMatch = roster.find(
      (p) => (p.initials || '').trim().toLowerCase() === cleanInitials
    );
    if (initialsMatch?.wardDepartment?.trim()) {
      return initialsMatch.wardDepartment.trim();
    }
  }

  return '';
}

export function findPreceptorByPin(pin: string): RegisteredPreceptor | null {
  const trimmed = pin.trim();
  if (!trimmed) return null;
  const list = getStoredPreceptors();
  return list.find((p) => p.pin.trim() === trimmed) || null;
}

export function getPreceptorPin(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRECEPTOR_PIN);
    if (raw) return raw;
  } catch (e) {
    console.error(e);
  }
  return '2026'; // Default institutional preceptor authorization code
}

export function savePreceptorPin(pin: string): void {
  safeLocalStorageSet(STORAGE_KEYS.PRECEPTOR_PIN, pin);
}

export function verifyPreceptorPin(pin: string): boolean {
  const trimmed = pin.trim();
  if (!trimmed) return false;
  if (trimmed === getPreceptorPin()) return true;
  return getStoredPreceptors().some((p) => p.pin.trim() === trimmed);
}

export function verifyPreceptorPinDetailed(pin: string): {
  valid: boolean;
  preceptor?: RegisteredPreceptor;
} {
  const trimmed = pin.trim();
  if (!trimmed) return { valid: false };

  const matched = findPreceptorByPin(trimmed);
  if (matched) {
    return { valid: true, preceptor: matched };
  }

  if (trimmed === getPreceptorPin()) {
    return {
      valid: true,
      preceptor: {
        id: 'master-inst',
        name: 'Authorized Clinical Preceptor',
        role: 'preceptor',
        title: 'Institutional Preceptor',
        wardDepartment: 'Clinical Rotation Ward',
        pin: trimmed,
        initials: 'CP',
      },
    };
  }

  return { valid: false };
}

export function verifyLeadEducatorPin(pin: string): {
  valid: boolean;
  preceptor?: RegisteredPreceptor;
} {
  const trimmed = pin.trim();
  if (!trimmed) return { valid: false };

  // Master Lead Educator passcode
  if (trimmed === getPreceptorPin()) {
    return {
      valid: true,
      preceptor: {
        id: 'master-lead-educator',
        name: 'Lead Clinical Educator',
        role: 'lead_educator',
        title: 'Lead Clinical Educator / Program Coordinator',
        wardDepartment: 'Clinical Education & Training Directorate',
        pin: trimmed,
        initials: 'LE',
      },
    };
  }

  // Preceptors registered with 'lead_educator' role
  const matched = findPreceptorByPin(trimmed);
  if (matched && matched.role === 'lead_educator') {
    return { valid: true, preceptor: matched };
  }

  return { valid: false };
}

export const BLANK_TRAINEE_INFO: TraineeInformation = {
  traineeName: '',
  traineeId: '',
  clinicalDepartmentWard: '',
  assignedClinicalPreceptor: '',
  trainingPeriodFrom: '',
  trainingPeriodTo: '',
};

export const BLANK_FINAL_SIGNOFF: FinalCompetencySignoff = {
  isCertified: false,
  leadEducatorName: '',
  leadEducatorTitle: 'Lead Clinical Educator / Program Coordinator',
  signatureDataUrl: undefined,
  dateSigned: undefined,
  verificationHash: undefined,
};

export function getStoredTraineeInfo(): TraineeInformation {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAINEE_INFO);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return normalizeTraineeInfo(parsed);
      }
    }
  } catch (e) {
    console.error(e);
  }
  return normalizeTraineeInfo(DEFAULT_COHORT_STUDENTS[0]?.traineeInfo || INITIAL_TRAINEE_INFO);
}

export function saveStoredTraineeInfo(info: TraineeInformation): void {
  safeLocalStorageSet(STORAGE_KEYS.TRAINEE_INFO, JSON.stringify(info));
}

export function getStoredDetailedLogs(): DetailedActivityLogSheet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DETAILED_LOGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((l) => l && typeof l === 'object').map((l, i) => normalizeDetailedLog(l, i));
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveStoredDetailedLogs(logs: DetailedActivityLogSheet[]): void {
  safeLocalStorageSet(STORAGE_KEYS.DETAILED_LOGS, JSON.stringify(logs));
}

export function getStoredFinalSignoff(): FinalCompetencySignoff {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINAL_SIGNOFF);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const normalized = normalizeFinalSignoff(parsed);
        if (!normalized.leadEducatorName || normalized.leadEducatorName.includes('Berhanu') || normalized.leadEducatorName.includes('Tigist')) {
          normalized.leadEducatorName = 'Mr. Yohannes Ayalew';
        }
        return normalized;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return normalizeFinalSignoff(INITIAL_FINAL_SIGNOFF);
}

export function saveStoredFinalSignoff(signoff: FinalCompetencySignoff): void {
  safeLocalStorageSet(STORAGE_KEYS.FINAL_SIGNOFF, JSON.stringify(signoff));
}

export function getStoredUserRole(): UserRole {
  try {
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole;
    if (role === 'trainee' || role === 'preceptor' || role === 'lead_educator') {
      return role;
    }
  } catch (e) {
    console.error(e);
  }
  return 'trainee';
}

export function saveStoredUserRole(role: UserRole): void {
  safeLocalStorageSet(STORAGE_KEYS.USER_ROLE, role);
}

// Generate secure verification hash for Part III certification
export function generateNcepVerificationHash(traineeId: string, timestamp: string): string {
  const seed = `${traineeId || 'TRAINEE'}::${timestamp}::NCEP_CORE_COMPETENCY_1_ETHIOPIA`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const tail = Math.abs(hash * 37).toString(16).toUpperCase().padStart(6, '9');
  return `AAU-NCEP-CC1-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${tail.slice(0, 4)}`;
}

// Clear all data to a blank slate
export function resetStorageToBlank(): {
  traineeInfo: TraineeInformation;
  detailedLogs: DetailedActivityLogSheet[];
  finalSignoff: FinalCompetencySignoff;
} {
  saveStoredTraineeInfo(BLANK_TRAINEE_INFO);
  saveStoredDetailedLogs([]);
  saveStoredFinalSignoff(BLANK_FINAL_SIGNOFF);
  return {
    traineeInfo: BLANK_TRAINEE_INFO,
    detailedLogs: [],
    finalSignoff: BLANK_FINAL_SIGNOFF,
  };
}

// Reset to initial sample demo data
export function resetStorageToSample(): {
  traineeInfo: TraineeInformation;
  detailedLogs: DetailedActivityLogSheet[];
  finalSignoff: FinalCompetencySignoff;
} {
  saveStoredTraineeInfo(INITIAL_TRAINEE_INFO);
  saveStoredDetailedLogs(INITIAL_DETAILED_LOG_SHEETS);
  saveStoredFinalSignoff(INITIAL_FINAL_SIGNOFF);
  return {
    traineeInfo: INITIAL_TRAINEE_INFO,
    detailedLogs: INITIAL_DETAILED_LOG_SHEETS,
    finalSignoff: INITIAL_FINAL_SIGNOFF,
  };
}

export function computeDefaultStudentPin(traineeId?: string, index: number = 0): string {
  const cleanId = (traineeId || '').trim();
  const numMatch = cleanId.match(/\d+/g);
  if (numMatch && numMatch.length >= 2) {
    const p1 = numMatch[0].padStart(2, '0').slice(-2);
    const p2 = numMatch[1].padStart(2, '0').slice(-2);
    return `${p1}${p2}`;
  } else if (numMatch && numMatch.length === 1) {
    return numMatch[0].padStart(4, '0').slice(-4);
  }
  return String(1000 + (index % 9000));
}

export function getStudentPin(student?: CohortStudentRecord | TraineeInformation | null): string {
  if (!student) return '1234';
  if ('traineeInfo' in student && student.traineeInfo) {
    if (student.studentPin) return student.studentPin.trim();
    if (student.traineeInfo.studentPin) return student.traineeInfo.studentPin.trim();
    return computeDefaultStudentPin(student.traineeInfo.traineeId);
  }
  if ('studentPin' in student && student.studentPin) {
    return student.studentPin.trim();
  }
  if ('traineeId' in student && student.traineeId) {
    return computeDefaultStudentPin(student.traineeId);
  }
  return '1234';
}

export function verifyStudentPin(
  student: CohortStudentRecord | TraineeInformation | null | undefined,
  pinInput: string
): boolean {
  const trimmed = pinInput.trim();
  if (!trimmed) return false;
  // Master institutional preceptor PIN or lead educator PIN can override if student forgot PIN
  if (verifyPreceptorPin(trimmed)) {
    return true;
  }
  const expectedPin = getStudentPin(student);
  return trimmed === expectedPin;
}

export function isStudentUnlocked(traineeIdOrId: string): boolean {
  if (!traineeIdOrId) return false;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.UNLOCKED_STUDENTS);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(traineeIdOrId.trim());
  } catch (e) {
    return false;
  }
}

export function setStudentUnlocked(traineeIdOrId: string, unlocked: boolean): void {
  if (!traineeIdOrId) return;
  try {
    const clean = traineeIdOrId.trim();
    const raw = sessionStorage.getItem(STORAGE_KEYS.UNLOCKED_STUDENTS);
    let list: string[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }
    if (unlocked) {
      if (!list.includes(clean)) {
        list.push(clean);
      }
    } else {
      list = list.filter((id) => id !== clean);
    }
    sessionStorage.setItem(STORAGE_KEYS.UNLOCKED_STUDENTS, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

export function lockStudent(traineeIdOrId: string): void {
  setStudentUnlocked(traineeIdOrId, false);
}

export function lockAllStudents(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.UNLOCKED_STUDENTS);
  } catch (e) {
    console.error(e);
  }
}

export function normalizeTraineeIdKey(traineeId?: string): string {
  return String(traineeId || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function getDeletedOfficialStudentIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_OFFICIAL_IDS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((id) => normalizeTraineeIdKey(String(id))).filter(Boolean));
    }
  } catch (e) {
    console.warn('[Storage] Failed to read deleted official IDs:', e);
  }
  return new Set();
}

export function markOfficialStudentDeleted(traineeIdOrRecordId?: string): void {
  const key = normalizeTraineeIdKey(traineeIdOrRecordId);
  if (!key) return;
  try {
    const set = getDeletedOfficialStudentIds();
    set.add(key);
    safeLocalStorageSet(STORAGE_KEYS.DELETED_OFFICIAL_IDS, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('[Storage] Failed to mark official student deleted:', e);
  }
}

export function unmarkOfficialStudentDeleted(traineeIdOrRecordId?: string): void {
  const key = normalizeTraineeIdKey(traineeIdOrRecordId);
  if (!key) return;
  try {
    const set = getDeletedOfficialStudentIds();
    if (set.delete(key)) {
      safeLocalStorageSet(STORAGE_KEYS.DELETED_OFFICIAL_IDS, JSON.stringify(Array.from(set)));
    }
  } catch (e) {
    console.warn('[Storage] Failed to unmark official student deleted:', e);
  }
}

export function ensureOfficialStudentsPresent(
  list: CohortStudentRecord[],
  ignoreDeletedIds: boolean = false
): { students: CohortStudentRecord[]; restored: CohortStudentRecord[] } {
  const result = Array.isArray(list) ? [...list] : [];
  const deletedSet = ignoreDeletedIds ? new Set<string>() : getDeletedOfficialStudentIds();
  const existingTraineeIds = new Set<string>();
  const existingIds = new Set<string>();

  for (const s of result) {
    if (!s) continue;
    if (s.id) existingIds.add(String(s.id).trim());
    const tKey = normalizeTraineeIdKey(s.traineeInfo?.traineeId);
    if (tKey) existingTraineeIds.add(tKey);
  }

  const restored: CohortStudentRecord[] = [];
  for (const official of OFFICIAL_IMPORTED_STUDENTS) {
    const tKey = normalizeTraineeIdKey(official.traineeInfo?.traineeId);
    if (!tKey) continue;
    if (existingTraineeIds.has(tKey) || deletedSet.has(tKey)) {
      continue;
    }

    let safeId = official.id;
    if (existingIds.has(safeId)) {
      let suffix = 1;
      let candidate = `${official.id}-restored`;
      while (existingIds.has(candidate)) {
        suffix += 1;
        candidate = `${official.id}-restored-${suffix}`;
      }
      safeId = candidate;
    }

    const normalized = normalizeStudentRecord(
      {
        ...official,
        id: safeId,
        studentPin: official.studentPin || official.traineeInfo?.studentPin,
      },
      result.length
    );

    existingIds.add(normalized.id);
    existingTraineeIds.add(tKey);
    result.push(normalized);
    restored.push(normalized);
  }

  return { students: result, restored };
}

export function getStoredCohortStudents(): CohortStudentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COHORT_STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const seenIds = new Set<string>();
        const seenTraineeIds = new Set<string>();
        const sanitized: CohortStudentRecord[] = [];

        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i];
          if (!item || !item.traineeInfo) continue;

          const traineeId = item.traineeInfo.traineeId?.trim();
          const traineeIdKey = normalizeTraineeIdKey(traineeId);
          // If we already added this traineeId, skip duplicate
          if (traineeIdKey && seenTraineeIds.has(traineeIdKey)) {
            continue;
          }
          if (traineeIdKey) seenTraineeIds.add(traineeIdKey);

          let safeId = item.id ? String(item.id).trim() : `student-${Date.now()}-${i}`;
          if (seenIds.has(safeId)) {
            safeId = `${safeId}-${Date.now().toString().slice(-4)}-${i}`;
          }
          seenIds.add(safeId);

          const pin = item.studentPin || item.traineeInfo?.studentPin || computeDefaultStudentPin(traineeId, i);
          const normalized = normalizeStudentRecord({ ...item, id: safeId, studentPin: pin }, i);
          sanitized.push(normalized);
        }

        if (sanitized.length > 0) {
          const { students: ensured, restored } = ensureOfficialStudentsPresent(sanitized);
          if (restored.length > 0) {
            safeLocalStorageSet(STORAGE_KEYS.COHORT_STUDENTS, JSON.stringify(ensured));
          }
          return ensured;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_COHORT_STUDENTS.map((s, i) => normalizeStudentRecord(s, i));
}

export function saveStoredCohortStudents(students: CohortStudentRecord[]): void {
  safeLocalStorageSet(STORAGE_KEYS.COHORT_STUDENTS, JSON.stringify(students));
}
