import {
  TraineeInformation,
  NCEPSessionDefinition,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
} from '../types/nursing';

export const INITIAL_TRAINEE_INFO: TraineeInformation = {
  traineeName: 'Feven Mulugeta',
  traineeId: 'AAU-NS-2024-0419',
  clinicalDepartmentWard: 'Surgical Inpatient Ward 4B / Acute Care Unit',
  assignedClinicalPreceptor: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
  trainingPeriodFrom: '2026-08-15',
  trainingPeriodTo: '2026-11-20',
};

export const INITIAL_FINAL_SIGNOFF: FinalCompetencySignoff = {
  isCertified: false,
  leadEducatorName: 'Dr. Berhanu Mengiste, PhD, RN',
  leadEducatorTitle: 'Lead Clinical Educator / Program Coordinator',
  signatureDataUrl: undefined,
  dateSigned: undefined,
  verificationHash: 'AAU-NCEP-CC1-89F2-411B-CERT',
};

export const NCEP_SESSIONS_DEFINITIONS: NCEPSessionDefinition[] = [
  // Sub-Competency 1
  {
    sessionNumber: 1,
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    sessionTitle: 'Comprehensive Assessment by History Taking & Physical Examination',
    requiredActivity:
      'Two complete comprehensive patient assessments (history taking & physical examination) on ward shifts, filed in portfolio',
    expectedEvidenceType: 'Comprehensive History & Physical Assessment Form',
  },
  {
    sessionNumber: 2,
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    sessionTitle: 'Validating Data Accuracy (Subjective–Objective Congruence)',
    requiredActivity:
      'Chart audit of two ward patients: subjective–objective data pairing with brief validation synthesis',
    expectedEvidenceType: 'Chart Audit / Subjective-Objective Congruence Tool',
  },
  {
    sessionNumber: 3,
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    sessionTitle: 'Identifying & Documenting Normal and Abnormal Findings',
    requiredActivity:
      'Standard nursing progress notes for three assigned ward patients meeting unit legal & completeness guidelines',
    expectedEvidenceType: 'Standard Nursing Progress Notes (SOAP/DAR format)',
  },
  {
    sessionNumber: 4,
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    sessionTitle: 'Interpreting Early Warning Signs (Danger Signs)',
    requiredActivity:
      'EWS scores calculated for all assigned patients over one shift; escalation of any score meeting action thresholds documented',
    expectedEvidenceType: 'EWS/NEWS Scoring Chart & Escalation Flow Record',
  },

  // Sub-Competency 2
  {
    sessionNumber: 5,
    subCompetencyId: 'sub_comp_2',
    subCompetencyTitle: 'Sub-Competency 2: Develop / Construct Nursing Diagnosis',
    sessionTitle: 'Developing Nursing Diagnoses Using PES Format',
    requiredActivity:
      'Three complete, prioritized PES diagnostic statements for assigned ward patients, included in care plan portfolio',
    expectedEvidenceType: 'PES Diagnostic Statement Portfolio Sheet',
  },
  {
    sessionNumber: 6,
    subCompetencyId: 'sub_comp_2',
    subCompetencyTitle: 'Sub-Competency 2: Develop / Construct Nursing Diagnosis',
    sessionTitle: 'Prioritizing Nursing Diagnoses Using Prioritizing Criteria',
    requiredActivity:
      'Prioritized diagnosis list (ABCs & Maslow’s hierarchy) with written justification for one complex multi-diagnosis patient',
    expectedEvidenceType: 'ABC & Maslow Hierarchy Prioritization Matrix',
  },
  {
    sessionNumber: 7,
    subCompetencyId: 'sub_comp_2',
    subCompetencyTitle: 'Sub-Competency 2: Develop / Construct Nursing Diagnosis',
    sessionTitle: 'Adapting Diagnostic Reasoning to Updated Assessment Data',
    requiredActivity:
      'Reflective journal entry on one real instance where a change in condition required revising nursing diagnoses',
    expectedEvidenceType: 'Diagnostic Reasoning Revision Reflective Entry',
  },

  // Sub-Competency 3
  {
    sessionNumber: 8,
    subCompetencyId: 'sub_comp_3',
    subCompetencyTitle: 'Sub-Competency 3: Design Prioritized Care Interventions',
    sessionTitle: 'Distinguishing Urgent from Routine Patient Needs',
    requiredActivity:
      '4-hour shift management plan with every intervention categorized Urgent or Routine, submitted for preceptor review',
    expectedEvidenceType: '4-Hour Urgent vs Routine Shift Management Plan',
  },
  {
    sessionNumber: 9,
    subCompetencyId: 'sub_comp_3',
    subCompetencyTitle: 'Sub-Competency 3: Design Prioritized Care Interventions',
    sessionTitle: 'Designing Structured Care Plans Using Prioritization Frameworks',
    requiredActivity:
      'Two complete structured care plans with SMART outcomes & categorized evidence-based interventions',
    expectedEvidenceType: 'Structured SMART Care Plans (Evidence-Based)',
  },

  // Sub-Competency 4
  {
    sessionNumber: 10,
    subCompetencyId: 'sub_comp_4',
    subCompetencyTitle: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
    sessionTitle: 'Identifying Risk Factors for Common Complications',
    requiredActivity:
      'Risk assessments (Braden, Morse Fall, Aspiration) on three ward patients with key preventive nursing interventions',
    expectedEvidenceType: 'Braden, Morse Fall & Aspiration Risk Assessment Records',
  },
  {
    sessionNumber: 11,
    subCompetencyId: 'sub_comp_4',
    subCompetencyTitle: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
    sessionTitle: 'Differentiating Early Warning Signs & Initiating Timely Interventions',
    requiredActivity:
      'Two SBAR escalation reports delivered to preceptor for patients with elevated NEWS scores',
    expectedEvidenceType: 'Structured SBAR Escalation Reports',
  },
  {
    sessionNumber: 12,
    subCompetencyId: 'sub_comp_4',
    subCompetencyTitle: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
    sessionTitle: 'Identifying Common Complications & Applying Basic Actions Independently',
    requiredActivity:
      '12-hour parameter trend analysis for one high-risk patient with targeted nursing monitoring actions',
    expectedEvidenceType: '12-Hour Vital Parameter Trend Analysis Sheet',
  },
  {
    sessionNumber: 13,
    subCompetencyId: 'sub_comp_4',
    subCompetencyTitle: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
    sessionTitle: 'Anticipating Deterioration & Escalating Care Decisively',
    requiredActivity:
      'One-page summary of ward rapid response activation steps and emergency equipment locations',
    expectedEvidenceType: 'Rapid Response Activation & Emergency Equipment Summary',
  },

  // Sub-Competency 5
  {
    sessionNumber: 14,
    subCompetencyId: 'sub_comp_5',
    subCompetencyTitle: 'Sub-Competency 5: Execute Nursing Interventions',
    sessionTitle: 'Implementing Care Plans & Adapting to Patient Responses',
    requiredActivity:
      'Three core nursing procedures (Annex 3 list) performed and documented under direct preceptor supervision',
    expectedEvidenceType: 'Direct Supervised Procedure Checklists',
  },
  {
    sessionNumber: 15,
    subCompetencyId: 'sub_comp_5',
    subCompetencyTitle: 'Sub-Competency 5: Execute Nursing Interventions',
    sessionTitle: 'Collaborating with Other Healthcare Providers',
    requiredActivity:
      'Participation in a multidisciplinary care conference / grand round for one complex patient, with 1-page summary',
    expectedEvidenceType: 'Multidisciplinary Care Conference Summary Record',
  },
  {
    sessionNumber: 16,
    subCompetencyId: 'sub_comp_5',
    subCompetencyTitle: 'Sub-Competency 5: Execute Nursing Interventions',
    sessionTitle: 'Delegating Tasks Respectfully, Responsibly & with Accountability',
    requiredActivity:
      'Two observed or performed delegation instances analyzed against the Five Rights of Delegation',
    expectedEvidenceType: 'Five Rights of Delegation Analysis Worksheet',
  },

  // Sub-Competency 6
  {
    sessionNumber: 17,
    subCompetencyId: 'sub_comp_6',
    subCompetencyTitle: 'Sub-Competency 6: Monitor and Evaluate Continuous Patient Conditions',
    sessionTitle: 'Evaluating Patient Condition Against Goals & Outcomes',
    requiredActivity:
      'Structured outcome evaluation 2 hours post-intervention for two patients, with chart copies & reflection notes',
    expectedEvidenceType: '2-Hour Post-Intervention Evaluation Notes',
  },
  {
    sessionNumber: 18,
    subCompetencyId: 'sub_comp_6',
    subCompetencyTitle: 'Sub-Competency 6: Monitor and Evaluate Continuous Patient Conditions',
    sessionTitle: 'Gap Analysis, Care Plan Revision & Lessons Learnt',
    requiredActivity:
      'Reassessment, gap analysis and updated care plan for one patient, with 2-page critical reflection',
    expectedEvidenceType: 'Reassessment Gap Analysis & 2-Page Critical Reflection',
  },
];

// Helper sample SVG evidence documents
const SAMPLE_EVIDENCE_HISTORY_PHYSICAL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="380" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a">COMPREHENSIVE PATIENT ASSESSMENT (SESSION 1)</text><text x="40" y="80" font-family="Arial" font-size="11" fill="%2364748b">Tikur Anbessa Specialized Hospital | Surgical Ward 4B</text><line x1="40" y1="95" x2="560" y2="95" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="125" font-family="Arial" font-size="12" font-weight="bold" fill="%231e293b">Patient 1: 58M Post-Cholecystectomy Day 2 (De-identified)</text><text x="40" y="150" font-family="Arial" font-size="11" fill="%23334155">History: Pain 5/10 right upper quadrant, nausea controlled with Ondansetron.</text><text x="40" y="175" font-family="Arial" font-size="11" fill="%23334155">Physical Exam: Abdomen soft, hypoactive bowel sounds, midline dressing intact.</text><text x="40" y="200" font-family="Arial" font-size="11" fill="%23334155">Vitals: BP 124/78, HR 78 bpm, RR 18, Temp 36.8°C, SpO2 97% on room air.</text><line x1="40" y1="220" x2="560" y2="220" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="245" font-family="Arial" font-size="12" font-weight="bold" fill="%231e293b">Patient 2: 44F Acute Appendicitis Pre-op Assessment</text><text x="40" y="270" font-family="Arial" font-size="11" fill="%23334155">Findings: Rebound tenderness McBurney point, localized guarding, NPO status verified.</text><rect x="40" y="305" width="240" height="70" rx="6" fill="%23f0fdf4" stroke="%2386efac"/><text x="55" y="330" font-family="Arial" font-size="11" font-weight="bold" fill="%23166534">PRECEPTOR VERIFIED [AT]</text><text x="55" y="348" font-family="Arial" font-size="10" fill="%2315803d">Sr. Almaz Tesfaye, RN, MSc</text><text x="55" y="362" font-family="Arial" font-size="9" fill="%2316a34a">Competency: Satisfactory | 2026-08-22</text></svg>`;

const SAMPLE_EVIDENCE_EWS_ESCALATION = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="380" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a">EARLY WARNING SCORE (EWS) AUDIT (SESSION 4)</text><text x="40" y="80" font-family="Arial" font-size="11" fill="%2364748b">Ward 4B Inpatient Shift Audit | Total Patients Audited: 6</text><line x1="40" y1="95" x2="560" y2="95" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="125" font-family="Arial" font-size="12" font-weight="bold" fill="%231e293b">Identified Escalation Case: Bed 14 (62M Post-op Laparotomy)</text><text x="40" y="150" font-family="Arial" font-size="11" fill="%23b91c1c">EWS Score: 5 (Medium Risk - RR 26, HR 108, BP 98/60, Temp 38.3°C)</text><text x="40" y="175" font-family="Arial" font-size="11" fill="%23334155">Escalation Action Taken: Promptly reported to Duty Medical Officer within 15 mins.</text><text x="40" y="200" font-family="Arial" font-size="11" fill="%23334155">Interventions: Commenced 2L O2 nasal cannula, 500mL crystalloid bolus, blood cultures sent.</text><rect x="40" y="305" width="240" height="70" rx="6" fill="%23f0fdf4" stroke="%2386efac"/><text x="55" y="330" font-family="Arial" font-size="11" font-weight="bold" fill="%23166534">PRECEPTOR VERIFIED [AT]</text><text x="55" y="348" font-family="Arial" font-size="10" fill="%2315803d">Sr. Almaz Tesfaye, RN, MSc</text><text x="55" y="362" font-family="Arial" font-size="9" fill="%2316a34a">Competency: Satisfactory | 2026-09-02</text></svg>`;

const SAMPLE_EVIDENCE_SBAR_REPORT = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420"><rect width="600" height="420" fill="%23f8fafc"/><rect x="20" y="20" width="560" height="380" rx="8" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="55" font-family="Arial" font-size="16" font-weight="bold" fill="%230f172a">SBAR ESCALATION REPORT (SESSION 11)</text><line x1="40" y1="80" x2="560" y2="80" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="110" font-family="Arial" font-size="11" font-weight="bold" fill="%230f172a">S (Situation):</text><text x="140" y="110" font-family="Arial" font-size="11" fill="%23334155">Bed 8 patient reporting acute chest tightness and dyspnea.</text><text x="40" y="140" font-family="Arial" font-size="11" font-weight="bold" fill="%230f172a">B (Background):</text><text x="140" y="140" font-family="Arial" font-size="11" fill="%23334155">68F Day 3 post ORIF femur, immobilized with bilateral TED hose.</text><text x="40" y="170" font-family="Arial" font-size="11" font-weight="bold" fill="%230f172a">A (Assessment):</text><text x="140" y="170" font-family="Arial" font-size="11" fill="%23334155">NEWS score 6. HR 116 sinus tach, RR 28, SpO2 91% on room air.</text><text x="40" y="200" font-family="Arial" font-size="11" font-weight="bold" fill="%230f172a">R (Recommendation):</text><text x="160" y="200" font-family="Arial" font-size="11" fill="%23334155">Urgent medical review, 12-lead ECG, CT pulmonary angiogram.</text><rect x="40" y="305" width="240" height="70" rx="6" fill="%23f0fdf4" stroke="%2386efac"/><text x="55" y="330" font-family="Arial" font-size="11" font-weight="bold" fill="%23166534">PRECEPTOR VERIFIED [AT]</text><text x="55" y="348" font-family="Arial" font-size="10" fill="%2315803d">Sr. Almaz Tesfaye, RN, MSc</text><text x="55" y="362" font-family="Arial" font-size="9" fill="%2316a34a">Competency: Satisfactory | 2026-09-24</text></svg>`;

export const INITIAL_DETAILED_LOG_SHEETS: DetailedActivityLogSheet[] = [
  {
    id: 'ncep-log-01',
    sessionNumber: 1,
    sessionTitle: 'Comprehensive Assessment by History Taking & Physical Examination',
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    dateOfActivity: '2026-08-22',
    durationHours: 4,
    clinicalSettingWard: 'Surgical Inpatient Ward 4B',
    activityDescription:
      'Conducted two complete head-to-toe comprehensive assessments on adult inpatients. Patient A: 58-year-old male post-laparoscopic cholecystectomy day 2. Conducted systematic interview covering past medical history (hypertension), current medications, pain assessment (PQRST), and full physical exam including surgical port inspection. Patient B: 44-year-old female admitted for acute abdominal pain awaiting diagnostic imaging.',
    reflectiveNotesLessonsLearned:
      'What went well: Developed comfortable rapport with both patients and maintained privacy using bedside curtains. Validated subjective pain complaints against objective findings (guarding, vital signs). Challenge: Balancing the detailed questioning without causing patient fatigue; learned to group physical examination steps smoothly to avoid unnecessary repositioning.',
    attachments: [
      {
        id: 'att-session-1',
        name: 'Comprehensive_History_Physical_Assessment_Sheet.svg',
        type: 'assessment_form',
        dataUrl: SAMPLE_EVIDENCE_HISTORY_PHYSICAL,
        notes: 'Two complete H&P records verified by ward sister.',
        uploadedAt: '2026-08-22T14:30:00.000Z',
        sizeBytes: 15400,
      },
    ],
    preceptorSignoff: {
      isSigned: true,
      preceptorName: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
      preceptorInitials: 'AT',
      signatureDataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10, 80 35 T 140 25 T 180 35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="30" y="52" font-family="cursive" font-size="12" fill="%231e3a8a">Almaz Tesfaye, RN</text></svg>',
      dateSigned: '2026-08-22',
      competencyDemonstrated: 'Satisfactory',
      comments:
        'Thorough systematic assessment technique. Excellent attention to surgical site inspection and patient dignity.',
    },
    status: 'Met',
    source: 'manual',
    createdAt: '2026-08-22T15:00:00.000Z',
  },
  {
    id: 'ncep-log-02',
    sessionNumber: 2,
    sessionTitle: 'Validating Data Accuracy (Subjective–Objective Congruence)',
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    dateOfActivity: '2026-08-26',
    durationHours: 3,
    clinicalSettingWard: 'Surgical Inpatient Ward 4B',
    activityDescription:
      'Performed chart audit and bedside verification for two ward patients. Paired subjective statements with objective findings: Patient 1 reported feeling "short of breath when sitting up"; objective findings showed RR 24, shallow chest expansion, SpO2 93% on room air, bibasilar crackles on auscultation. Patient 2 stated pain was "mild 2/10" but exhibited grimacing during transfer, heart rate 94 bpm, and abdominal muscle tensing.',
    reflectiveNotesLessonsLearned:
      'Learned that subjective statements do not always tell the full story due to stoicism or fear of analgesics. Objective validation is essential before confirming patient stability.',
    attachments: [],
    preceptorSignoff: {
      isSigned: true,
      preceptorName: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
      preceptorInitials: 'AT',
      signatureDataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10, 80 35 T 140 25 T 180 35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="30" y="52" font-family="cursive" font-size="12" fill="%231e3a8a">Almaz Tesfaye, RN</text></svg>',
      dateSigned: '2026-08-26',
      competencyDemonstrated: 'Satisfactory',
      comments:
        'Sound clinical critical thinking demonstrated when identifying non-verbal pain cues contradictory to stated score.',
    },
    status: 'Met',
    source: 'manual',
    createdAt: '2026-08-26T14:15:00.000Z',
  },
  {
    id: 'ncep-log-03',
    sessionNumber: 3,
    sessionTitle: 'Identifying & Documenting Normal and Abnormal Findings',
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    dateOfActivity: '2026-08-29',
    durationHours: 4,
    clinicalSettingWard: 'Surgical Inpatient Ward 4B',
    activityDescription:
      'Composed standard progress notes using DAR (Data, Action, Response) format for three assigned ward patients. Patient 1: Post-appendectomy day 1; Patient 2: Conservative management of acute pancreatitis; Patient 3: Post-debridement wound with negative pressure therapy. Addressed vital signs, pain ratings, IV infusion rates, surgical dressings, and intake/output balance.',
    reflectiveNotesLessonsLearned:
      'Ensured documentation complied with hospital legal standards: objective phrasing without ambiguous abbreviations, timely entry, and clear action-response loops.',
    attachments: [],
    preceptorSignoff: {
      isSigned: true,
      preceptorName: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
      preceptorInitials: 'AT',
      signatureDataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10, 80 35 T 140 25 T 180 35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="30" y="52" font-family="cursive" font-size="12" fill="%231e3a8a">Almaz Tesfaye, RN</text></svg>',
      dateSigned: '2026-08-29',
      competencyDemonstrated: 'Satisfactory',
      comments:
        'Documentation is clear, factual, and strictly follows unit legal formatting standards.',
    },
    status: 'Met',
    source: 'manual',
    createdAt: '2026-08-29T16:00:00.000Z',
  },
  {
    id: 'ncep-log-04',
    sessionNumber: 4,
    sessionTitle: 'Interpreting Early Warning Signs (Danger Signs)',
    subCompetencyId: 'sub_comp_1',
    subCompetencyTitle: 'Sub-Competency 1: Perform Patient Assessment',
    dateOfActivity: '2026-09-02',
    durationHours: 6,
    clinicalSettingWard: 'Surgical Inpatient Ward 4B',
    activityDescription:
      'Calculated National Early Warning Score (NEWS) for six assigned surgical patients at 08:00, 12:00, and 14:00. Identified one patient with score escalation from 2 to 5 (tachypnea RR 26, HR 108, BP 98/60, Temp 38.3°C). Documented threshold breach and initiated immediate escalation to medical team within 15 minutes as per protocol.',
    reflectiveNotesLessonsLearned:
      'Calculating scores systematically allowed us to catch early sepsis before overt hemodynamic collapse occurred. What to improve: Prepare baseline vitals for quick verbal handoff when dialing the doctor.',
    attachments: [
      {
        id: 'att-session-4',
        name: 'NEWS_Early_Warning_Escalation_Sheet.svg',
        type: 'ews_sheet',
        dataUrl: SAMPLE_EVIDENCE_EWS_ESCALATION,
        notes: 'Escalation chart for Bed 14 demonstrating early sepsis intervention.',
        uploadedAt: '2026-09-02T16:00:00.000Z',
        sizeBytes: 14800,
      },
    ],
    preceptorSignoff: {
      isSigned: true,
      preceptorName: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
      preceptorInitials: 'AT',
      signatureDataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10, 80 35 T 140 25 T 180 35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="30" y="52" font-family="cursive" font-size="12" fill="%231e3a8a">Almaz Tesfaye, RN</text></svg>',
      dateSigned: '2026-09-02',
      competencyDemonstrated: 'Satisfactory',
      comments:
        'Decisive action during the NEWS trigger prevented worsening septic shock. Commendable escalation.',
    },
    status: 'Met',
    source: 'manual',
    createdAt: '2026-09-02T16:45:00.000Z',
  },
  {
    id: 'ncep-log-11',
    sessionNumber: 11,
    sessionTitle: 'Differentiating Early Warning Signs & Initiating Timely Interventions',
    subCompetencyId: 'sub_comp_4',
    subCompetencyTitle: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
    dateOfActivity: '2026-09-24',
    durationHours: 5,
    clinicalSettingWard: 'Surgical Inpatient Ward 4B',
    activityDescription:
      'Constructed and delivered two structured SBAR (Situation, Background, Assessment, Recommendation) escalation reports to preceptor and surgical registrar for patients exhibiting acute changes. Case 1: Suspected pulmonary embolism (hypoxia SpO2 91%, tachycardia, pleuritic chest pain in immobilized orthopedic patient). Case 2: Acute urinary retention post-spinal anesthesia.',
    reflectiveNotesLessonsLearned:
      'SBAR structured communication provided an unambiguous framework that eliminated rambling and got immediate physician response. Felt much more confident presenting concise objective data.',
    attachments: [
      {
        id: 'att-session-11',
        name: 'SBAR_Escalation_Record_Bed8.svg',
        type: 'sbar_note',
        dataUrl: SAMPLE_EVIDENCE_SBAR_REPORT,
        notes: 'SBAR escalation sheet delivered to preceptor and registrar.',
        uploadedAt: '2026-09-24T15:30:00.000Z',
        sizeBytes: 16100,
      },
    ],
    preceptorSignoff: {
      isSigned: true,
      preceptorName: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
      preceptorInitials: 'AT',
      signatureDataUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10, 80 35 T 140 25 T 180 35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="30" y="52" font-family="cursive" font-size="12" fill="%231e3a8a">Almaz Tesfaye, RN</text></svg>',
      dateSigned: '2026-09-24',
      competencyDemonstrated: 'Satisfactory',
      comments:
        'Clear, articulate SBAR presentation with appropriate recommendations.',
    },
    status: 'Met',
    source: 'manual',
    createdAt: '2026-09-24T16:00:00.000Z',
  },
];

// Presaved realistic soft copy scans of the actual NCEP Logbook pages for 1-click OCR demonstration!
export const NCEP_SAMPLE_OCR_SCANS = [
  {
    id: 'ncep-scan-matrix-page-2',
    title: 'NCEP Logbook Page 2 - Part I Matrix (Sub-Comp 1 & 2)',
    description: 'Scanned matrix sheet containing Sessions 1 through 7 with completed dates, status Met, and preceptor initials [AT].',
    part: 'Part I: Tracking Matrix',
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="450" height="600" viewBox="0 0 450 600"><rect width="450" height="600" fill="%23ffffff"/><text x="25" y="35" font-family="Arial" font-size="9" fill="%2364748b">NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook Page 2</text><text x="25" y="65" font-family="Arial" font-size="12" font-weight="bold" fill="%230f172a">PART I: COMPETENCY TRACKING MATRIX</text><rect x="25" y="80" width="400" height="24" fill="%231e3a8a"/><text x="30" y="96" font-family="Arial" font-size="8" font-weight="bold" fill="%23ffffff">Sub-Competency &amp; Session Focus</text><text x="170" y="96" font-family="Arial" font-size="8" font-weight="bold" fill="%23ffffff">Required Clinical Activity</text><text x="305" y="96" font-family="Arial" font-size="8" font-weight="bold" fill="%23ffffff">Date</text><text x="350" y="96" font-family="Arial" font-size="8" font-weight="bold" fill="%23ffffff">Status</text><text x="390" y="96" font-family="Arial" font-size="8" font-weight="bold" fill="%23ffffff">Initials</text><rect x="25" y="104" width="400" height="18" fill="%23e2e8f0"/><text x="30" y="117" font-family="Arial" font-size="8" font-weight="bold" fill="%230f172a">Sub-Competency 1: Perform Patient Assessment</text><line x1="25" y1="170" x2="425" y2="170" stroke="%23cbd5e1"/><text x="30" y="135" font-family="Arial" font-size="7.5" font-weight="bold">Session 1: Comprehensive Assessment</text><text x="170" y="135" font-family="Arial" font-size="7">Two comprehensive patient assessments</text><text x="305" y="135" font-family="Courier" font-size="7">2026-08-22</text><text x="350" y="135" font-family="Courier" font-size="7">Met</text><text x="390" y="135" font-family="Courier" font-size="7">[AT]</text><line x1="25" y1="220" x2="425" y2="220" stroke="%23cbd5e1"/><text x="30" y="185" font-family="Arial" font-size="7.5" font-weight="bold">Session 2: Validating Data Accuracy</text><text x="170" y="185" font-family="Arial" font-size="7">Chart audit of two ward patients</text><text x="305" y="185" font-family="Courier" font-size="7">2026-08-26</text><text x="350" y="185" font-family="Courier" font-size="7">Met</text><text x="390" y="185" font-family="Courier" font-size="7">[AT]</text><rect x="25" y="320" width="400" height="18" fill="%23e2e8f0"/><text x="30" y="333" font-family="Arial" font-size="8" font-weight="bold" fill="%230f172a">Sub-Competency 2: Develop / Construct Nursing Diagnosis</text><text x="30" y="355" font-family="Arial" font-size="7.5" font-weight="bold">Session 5: PES Format Diagnoses</text><text x="170" y="355" font-family="Arial" font-size="7">Three prioritized PES statements</text><text x="305" y="355" font-family="Courier" font-size="7">2026-09-05</text><text x="350" y="355" font-family="Courier" font-size="7">Met</text><text x="390" y="355" font-family="Courier" font-size="7">[AT]</text></svg>`,
  },
  {
    id: 'ncep-scan-page-5-detailed-log',
    title: 'NCEP Logbook Page 5 - Part II Detailed Log Sheet (Session 8)',
    description: 'Scanned Part II sheet with Session 8: Distinguishing Urgent from Routine Patient Needs, reflective notes, and preceptor feedback.',
    part: 'Part II: Detailed Log Sheet',
    thumbnail: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="450" height="600" viewBox="0 0 450 600"><rect width="450" height="600" fill="%23ffffff"/><text x="25" y="35" font-family="Arial" font-size="9" fill="%2364748b">NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook Page 5</text><text x="25" y="65" font-family="Arial" font-size="12" font-weight="bold" fill="%230f172a">PART II: DETAILED CLINICAL ACTIVITY LOG SHEETS</text><text x="25" y="90" font-family="Arial" font-size="8" font-weight="bold">Session Number &amp; Title:</text><text x="135" y="90" font-family="Courier" font-size="8">Session 8: Distinguishing Urgent from Routine Patient Needs</text><text x="25" y="110" font-family="Arial" font-size="8" font-weight="bold">Date of Activity:</text><text x="100" y="110" font-family="Courier" font-size="8">2026-09-15</text><text x="210" y="110" font-family="Arial" font-size="8" font-weight="bold">Duration (Hours):</text><text x="290" y="110" font-family="Courier" font-size="8">4 Hours</text><text x="25" y="130" font-family="Arial" font-size="8" font-weight="bold">Clinical Setting / Ward:</text><text x="135" y="130" font-family="Courier" font-size="8">Surgical Ward 4B</text><line x1="25" y1="145" x2="425" y2="145" stroke="%23cbd5e1"/><text x="25" y="165" font-family="Arial" font-size="8" font-weight="bold">1. Description of Activity Performed:</text><text x="25" y="185" font-family="Courier" font-size="7.5">Structured a 4-hour morning shift management plan for 5 post-operative patients.</text><text x="25" y="200" font-family="Courier" font-size="7.5">Classified acute airway/IV fluids as Urgent, and routine bed bath/linen as Routine.</text><line x1="25" y1="240" x2="425" y2="240" stroke="%23cbd5e1"/><text x="25" y="260" font-family="Arial" font-size="8" font-weight="bold">2. Reflective Notes &amp; Lessons Learned:</text><text x="25" y="280" font-family="Courier" font-size="7.5">Prioritization prevented delays when two patients simultaneously requested assistance.</text><rect x="25" y="380" width="400" height="110" fill="%23f8fafc" stroke="%23cbd5e1"/><text x="35" y="400" font-family="Arial" font-size="8" font-weight="bold">3. Preceptor / Mentor Feedback &amp; Formative Evaluation:</text><text x="35" y="420" font-family="Arial" font-size="8">[X] Satisfactory  [ ] Needs Improvement  [ ] Unsatisfactory</text><text x="35" y="440" font-family="Courier" font-size="7.5">Preceptor: Sr. Almaz Tesfaye, RN, MSc | Date: 15/09/2026 | Sig: [Verified]</text></svg>`,
  },
];
