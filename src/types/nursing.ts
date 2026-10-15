export interface TraineeInformation {
  traineeName: string;
  traineeId: string;
  clinicalDepartmentWard: string;
  assignedClinicalPreceptor: string;
  trainingPeriodFrom: string;
  trainingPeriodTo: string;
}

export type SubCompetencyId =
  | 'sub_comp_1'
  | 'sub_comp_2'
  | 'sub_comp_3'
  | 'sub_comp_4'
  | 'sub_comp_5'
  | 'sub_comp_6';

export interface NCEPSessionDefinition {
  sessionNumber: number;
  subCompetencyId: SubCompetencyId;
  subCompetencyTitle: string;
  sessionTitle: string;
  requiredActivity: string;
  expectedEvidenceType: string;
}

export type CompetencyRating = 'Satisfactory' | 'Needs Improvement' | 'Unsatisfactory';

export interface EvidenceAttachment {
  id: string;
  name: string;
  type:
    | 'assessment_form'
    | 'care_plan'
    | 'chart_audit'
    | 'ews_sheet'
    | 'sbar_note'
    | 'reflective_entry'
    | 'scanned_page'
    | 'clinical_photo';
  dataUrl: string;
  notes?: string;
  uploadedAt: string;
  sizeBytes?: number;
}

export interface PreceptorSignoff {
  isSigned: boolean;
  preceptorName: string;
  signatureDataUrl?: string;
  dateSigned: string;
  preceptorInitials: string;
  competencyDemonstrated: CompetencyRating;
  comments: string;
}

// PART II: Detailed Clinical Activity Log Sheet
export interface DetailedActivityLogSheet {
  id: string;
  sessionNumber: number;
  sessionTitle: string;
  subCompetencyId: SubCompetencyId;
  subCompetencyTitle: string;
  dateOfActivity: string;
  durationHours: number;
  clinicalSettingWard: string;
  // 1. Description of Activity Performed
  activityDescription: string;
  // 2. Reflective Notes & Lessons Learned
  reflectiveNotesLessonsLearned: string;
  // Evidence attachments site for this session
  attachments: EvidenceAttachment[];
  // 3. Preceptor / Mentor Feedback & Formative Evaluation
  preceptorSignoff?: PreceptorSignoff;
  status: 'Pending' | 'Met';
  source: 'manual' | 'ocr_scan';
  createdAt: string;
}

// PART III: Final Competency Sign-Off
export interface FinalCompetencySignoff {
  isCertified: boolean;
  leadEducatorName: string;
  leadEducatorTitle: string;
  signatureDataUrl?: string;
  dateSigned?: string;
  verificationHash?: string;
}

export interface ExtractedOcrNcepEntry {
  sessionNumber: number;
  sessionTitle: string;
  dateCompleted: string;
  durationHours?: number;
  clinicalSettingWard?: string;
  activityDescription: string;
  reflectiveNotes?: string;
  status: 'Pending' | 'Met';
  preceptorInitials?: string;
  preceptorComments?: string;
  competencyRating?: CompetencyRating;
}

export interface OcrNcepExtractionResult {
  documentTitle: string;
  traineeIdentified?: string;
  traineeIdIdentified?: string;
  wardIdentified?: string;
  partDetected: 'Part I: Tracking Matrix' | 'Part II: Detailed Log Sheet' | 'General';
  extractedEntries: ExtractedOcrNcepEntry[];
  overallNotes?: string;
}

export interface CohortStudentRecord {
  id: string;
  traineeInfo: TraineeInformation;
  detailedLogs: DetailedActivityLogSheet[];
  finalSignoff: FinalCompetencySignoff;
  updatedAt: string;
}

export interface RegisteredPreceptor {
  id: string;
  name: string;
  role: 'preceptor' | 'mentor' | 'lead_educator';
  title: string;
  wardDepartment: string;
  pin: string;
  initials: string;
  email?: string;
}

export type TabType = 'page1' | 'part1' | 'part2' | 'part3' | 'cohort' | 'ocr' | 'vault';
