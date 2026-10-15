import {
  TraineeInformation,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
  CohortStudentRecord,
  RegisteredPreceptor,
} from '../types/nursing';
import {
  INITIAL_TRAINEE_INFO,
  INITIAL_DETAILED_LOG_SHEETS,
  INITIAL_FINAL_SIGNOFF,
} from '../data/ncepData';

const STORAGE_KEYS = {
  TRAINEE_INFO: 'ncep_trainee_info',
  DETAILED_LOGS: 'ncep_detailed_logs',
  FINAL_SIGNOFF: 'ncep_final_signoff',
  USER_ROLE: 'ncep_user_role',
  PRECEPTOR_PIN: 'ncep_preceptor_pin',
  COHORT_STUDENTS: 'ncep_cohort_students',
  PRECEPTOR_ROSTER: 'ncep_preceptor_roster',
};

export type UserRole = 'trainee' | 'preceptor' | 'lead_educator';

export const FULL_15_PRECEPTORS_ROSTER: RegisteredPreceptor[] = [
  {
    id: 'prec-1',
    name: 'Sister Almaz Tefera, RN, MSc',
    role: 'preceptor',
    title: 'Senior Clinical Preceptor - Critical Care',
    wardDepartment: 'Medical ICU',
    pin: '4182',
    initials: 'AT',
  },
  {
    id: 'prec-2',
    name: 'Dr. Berhanu Tesfaye, MD',
    role: 'mentor',
    title: 'Clinical Mentor - Emergency & Trauma Specialist',
    wardDepartment: 'Emergency Center & Trauma',
    pin: '7021',
    initials: 'BT',
  },
  {
    id: 'prec-3',
    name: 'Sister Tigist Haile, RN, BSc',
    role: 'lead_educator',
    title: 'Lead Clinical Educator / Program Coordinator',
    wardDepartment: 'Academic Nursing & Skills Lab',
    pin: '9090',
    initials: 'TH',
  },
  {
    id: 'prec-4',
    name: 'Brother Dawit Hailu, RN, BSc',
    role: 'preceptor',
    title: 'Senior Clinical Preceptor - Surgical Care',
    wardDepartment: 'Surgical ICU',
    pin: '3314',
    initials: 'DH',
  },
  {
    id: 'prec-5',
    name: 'Sister Hiwot Kebede, RN, MSc',
    role: 'mentor',
    title: 'Clinical Mentor - Cardiology & CCU',
    wardDepartment: 'Coronary Care Unit (CCU)',
    pin: '5520',
    initials: 'HK',
  },
  {
    id: 'prec-6',
    name: 'Brother Samuel Girma, RN',
    role: 'preceptor',
    title: 'Clinical Preceptor - Acute Resuscitation',
    wardDepartment: 'Resuscitation & Red Zone',
    pin: '6241',
    initials: 'SG',
  },
  {
    id: 'prec-7',
    name: 'Sister Martha Assefa, RN, BSc',
    role: 'mentor',
    title: 'Clinical Mentor - Pediatric Critical Care',
    wardDepartment: 'Pediatric ICU (PICU)',
    pin: '1845',
    initials: 'MA',
  },
  {
    id: 'prec-8',
    name: 'Brother Yared Mengistu, RN',
    role: 'preceptor',
    title: 'Clinical Preceptor - Neurological Nursing',
    wardDepartment: 'Neuro-ICU & Stroke Unit',
    pin: '2973',
    initials: 'YM',
  },
  {
    id: 'prec-9',
    name: 'Sister Bethlehem Worku, RN, BSc',
    role: 'preceptor',
    title: 'Clinical Preceptor - Nephrology & Dialysis',
    wardDepartment: 'Renal & Hemodialysis Unit',
    pin: '8412',
    initials: 'BW',
  },
  {
    id: 'prec-10',
    name: 'Brother Elias Tadesse, RN',
    role: 'mentor',
    title: 'Clinical Mentor - Orthopedics & Trauma',
    wardDepartment: 'Trauma & Orthopedic Ward',
    pin: '4930',
    initials: 'ET',
  },
  {
    id: 'prec-11',
    name: 'Sister Senait Mekonnen, RN',
    role: 'preceptor',
    title: 'Clinical Preceptor - Burns & Wound Care',
    wardDepartment: 'Burns Critical Care Unit',
    pin: '7154',
    initials: 'SM',
  },
  {
    id: 'prec-12',
    name: 'Brother Solomon Bekele, RN, BSc',
    role: 'mentor',
    title: 'Clinical Mentor - Perioperative Nursing',
    wardDepartment: 'Main Operating Theatres',
    pin: '3829',
    initials: 'SB',
  },
  {
    id: 'prec-13',
    name: 'Sister Meron Getachew, RN',
    role: 'preceptor',
    title: 'Clinical Preceptor - High Dependency Care',
    wardDepartment: 'Medical High Dependency Unit (HDU)',
    pin: '6098',
    initials: 'MG',
  },
  {
    id: 'prec-14',
    name: 'Brother Natnael Fikru, RN',
    role: 'mentor',
    title: 'Clinical Mentor - Emergency Triage & Observation',
    wardDepartment: 'Emergency Observation Unit',
    pin: '5217',
    initials: 'NF',
  },
  {
    id: 'prec-15',
    name: 'Sister Rahel Desta, RN, MSc',
    role: 'lead_educator',
    title: 'Clinical Quality Supervisor & Nurse Educator',
    wardDepartment: 'Clinical Quality & Nursing Audit',
    pin: '8305',
    initials: 'RD',
  },
];

export const DEFAULT_REGISTERED_PRECEPTORS: RegisteredPreceptor[] = FULL_15_PRECEPTORS_ROSTER;

export function getStoredPreceptors(): RegisteredPreceptor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRECEPTOR_ROSTER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_REGISTERED_PRECEPTORS;
}

export function saveStoredPreceptors(preceptors: RegisteredPreceptor[]): void {
  localStorage.setItem(STORAGE_KEYS.PRECEPTOR_ROSTER, JSON.stringify(preceptors));
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
  localStorage.setItem(STORAGE_KEYS.PRECEPTOR_PIN, pin);
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
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_TRAINEE_INFO;
}

export function saveStoredTraineeInfo(info: TraineeInformation): void {
  localStorage.setItem(STORAGE_KEYS.TRAINEE_INFO, JSON.stringify(info));
}

export function getStoredDetailedLogs(): DetailedActivityLogSheet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DETAILED_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_DETAILED_LOG_SHEETS;
}

export function saveStoredDetailedLogs(logs: DetailedActivityLogSheet[]): void {
  localStorage.setItem(STORAGE_KEYS.DETAILED_LOGS, JSON.stringify(logs));
}

export function getStoredFinalSignoff(): FinalCompetencySignoff {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FINAL_SIGNOFF);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FINAL_SIGNOFF;
}

export function saveStoredFinalSignoff(signoff: FinalCompetencySignoff): void {
  localStorage.setItem(STORAGE_KEYS.FINAL_SIGNOFF, JSON.stringify(signoff));
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
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
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
          // If we already added this traineeId, skip duplicate
          if (traineeId && seenTraineeIds.has(traineeId)) {
            continue;
          }
          if (traineeId) seenTraineeIds.add(traineeId);

          let safeId = item.id ? String(item.id).trim() : `student-${Date.now()}-${i}`;
          if (seenIds.has(safeId)) {
            safeId = `${safeId}-${Date.now().toString().slice(-4)}-${i}`;
          }
          seenIds.add(safeId);

          sanitized.push({
            ...item,
            id: safeId,
          });
        }

        if (sanitized.length > 0) return sanitized;
      }
    }
  } catch (e) {
    console.error(e);
  }
  return [
    {
      id: 'student-1',
      traineeInfo: INITIAL_TRAINEE_INFO,
      detailedLogs: INITIAL_DETAILED_LOG_SHEETS,
      finalSignoff: INITIAL_FINAL_SIGNOFF,
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function saveStoredCohortStudents(students: CohortStudentRecord[]): void {
  localStorage.setItem(STORAGE_KEYS.COHORT_STUDENTS, JSON.stringify(students));
}
