import React, { useState } from 'react';
import {
  Users,
  GraduationCap,
  Plus,
  Upload,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Key,
  UserCheck,
  Search,
  BookOpen,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Lock,
  Sparkles,
  FileText,
  ClipboardCheck,
  FileEdit,
  Award,
  UploadCloud,
  FileCode,
  Table,
  AlertCircle,
  X,
  Copy,
} from 'lucide-react';
import {
  CohortStudentRecord,
  TraineeInformation,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
  RegisteredPreceptor,
  TabType,
} from '../types/nursing';
import {
  getPreceptorPin,
  savePreceptorPin,
  getStoredPreceptors,
  saveStoredPreceptors,
  DEFAULT_REGISTERED_PRECEPTORS,
  FULL_15_PRECEPTORS_ROSTER,
  BLANK_TRAINEE_INFO,
  BLANK_FINAL_SIGNOFF,
} from '../utils/storage';
import mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  WidthType,
  HeadingLevel,
} from 'docx';
import { NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';

interface InstructorCohortManagerProps {
  cohortStudents: CohortStudentRecord[];
  currentStudentId: string;
  onSelectStudent: (student: CohortStudentRecord, targetTab?: TabType) => void;
  onAddStudent: (newRecord: CohortStudentRecord) => void;
  onImportStudentDossier: (record: CohortStudentRecord) => void;
  onImportMultipleStudentDossiers?: (records: CohortStudentRecord[]) => void;
}

export function InstructorCohortManager({
  cohortStudents,
  currentStudentId,
  onSelectStudent,
  onAddStudent,
  onImportStudentDossier,
  onImportMultipleStudentDossiers,
}: InstructorCohortManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newWard, setNewWard] = useState('Surgical Ward 4B');
  const [newPreceptor, setNewPreceptor] = useState('Sister Almaz Tesfaye, RN, MSc');

  // Master institutional PIN
  const [currentPin, setCurrentPin] = useState(getPreceptorPin);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinSavedMessage, setPinSavedMessage] = useState(false);

  // Registered Preceptors with individual PINs
  const [preceptorsList, setPreceptorsList] = useState<RegisteredPreceptor[]>(getStoredPreceptors);
  const [showPins, setShowPins] = useState(false);
  const [isPreceptorModalOpen, setIsPreceptorModalOpen] = useState(false);
  const [editingPreceptorId, setEditingPreceptorId] = useState<string | null>(null);

  // Preceptor Form fields
  const [precName, setPrecName] = useState('');
  const [precTitle, setPrecTitle] = useState('Senior Clinical Preceptor');
  const [precRole, setPrecRole] = useState<'preceptor' | 'mentor' | 'lead_educator'>('preceptor');
  const [precWard, setPrecWard] = useState('Medical ICU');
  const [precPin, setPrecPin] = useState('');
  const [precInitials, setPrecInitials] = useState('');

  // Preceptors search & filtering
  const [preceptorSearchQuery, setPreceptorSearchQuery] = useState('');
  const [preceptorRoleFilter, setPreceptorRoleFilter] = useState<'all' | 'preceptor' | 'mentor' | 'lead_educator'>('all');

  // Batch import state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [batchImportNotification, setBatchImportNotification] = useState<string | null>(null);

  // Student Dossier & Cohort Roster Import Modal state
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierImportTab, setDossierImportTab] = useState<'upload' | 'paste'>('upload');
  const [dossierRawText, setDossierRawText] = useState('');
  const [dossierImportPreview, setDossierImportPreview] = useState<CohortStudentRecord[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [dossierImportError, setDossierImportError] = useState<string | null>(null);
  const [dossierSuccessBanner, setDossierSuccessBanner] = useState<{
    title: string;
    details: string;
    count: number;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Download Sample JSON Dossier
  const handleDownloadSampleDossierJson = () => {
    const sampleDossier = {
      system: 'NCEP Core Competency 1 Clinical Practice Logbook',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      traineeInfo: {
        traineeName: 'Bethlehem Tadesse, RN',
        traineeId: 'NCEP-2026-089',
        clinicalDepartmentWard: 'Medical Intensive Care Unit (MICU)',
        assignedHospital: 'Hawassa University Comprehensive Specialized Hospital',
        assignedClinicalPreceptor: 'Sister Almaz Tefera, Senior Clinical Preceptor, MSc',
        trainingPeriodFrom: '2026-10-01',
        trainingPeriodTo: '2027-01-30',
      },
      detailedLogs: [
        {
          id: 'log-sample-1',
          sessionNumber: 1,
          sessionTitle: 'Comprehensive Patient Assessment & Bedside Triage',
          subCompetencyId: 'sub_comp_1',
          subCompetencyTitle: '1. Comprehensive Patient Assessment & Prioritization',
          dateOfActivity: new Date().toISOString().slice(0, 10),
          durationHours: 4,
          clinicalSettingWard: 'Medical Intensive Care Unit',
          activityDescription:
            'Performed complete bedside ABCDE and head-to-toe systematic assessment on an adult patient presenting with acute dyspnea and tachycardia.',
          reflectiveNotesLessonsLearned:
            'Calculated an Early Warning Score (EWS) of 6, recognizing early septic deterioration and initiating immediate high-flow oxygen and IV fluid resuscitation.',
          attachments: [],
          status: 'Met',
          source: 'manual',
          createdAt: new Date().toISOString(),
          preceptorSignoff: {
            isSigned: true,
            preceptorName: 'Sister Almaz Tefera, RN, MSc',
            dateSigned: new Date().toISOString().slice(0, 10),
            preceptorInitials: 'AT',
            competencyDemonstrated: 'Satisfactory',
            comments:
              'Demonstrated sharp clinical observation and swift EWS escalation according to hospital critical care protocol.',
          },
        },
      ],
      finalSignoff: BLANK_FINAL_SIGNOFF,
    };

    const blob = new Blob([JSON.stringify(sampleDossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCEP_SAMPLE_STUDENT_DOSSIER_TEMPLATE.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Sample CSV Cohort Roster
  const handleDownloadSampleRosterCsv = () => {
    const csvContent =
      'Trainee Name,Student ID,Ward / Department,Hospital,Assigned Preceptor\n' +
      'Bethlehem Tadesse,NCEP-2026-089,Medical Intensive Care Unit,Hawassa University Hospital,Sister Almaz Tefera\n' +
      'Yonas Bekele,NCEP-2026-092,Emergency & Trauma Center,Hawassa University Hospital,Dr. Berhanu Tesfaye\n' +
      'Selamawit Desta,NCEP-2026-095,Surgical Ward 4B,Hawassa University Hospital,Brother Dawit Hailu\n' +
      'Tewodros Girma,NCEP-2026-098,Pediatric ICU,Hawassa University Hospital,Sister Martha Assefa';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NCEP_COHORT_STUDENT_ROSTER_TEMPLATE.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Sample Word (.docx) Cohort Roster Template
  const handleDownloadSampleRosterDocx = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: 'Addis Ababa University - College of Health Sciences',
                heading: HeadingLevel.HEADING_2,
                spacing: { after: 120 },
              }),
              new Paragraph({
                text: 'National Clinical Educator Program (NCEP) - Core Competency 1',
                heading: HeadingLevel.HEADING_3,
                spacing: { after: 150 },
              }),
              new Paragraph({
                text: 'Trainee Cohort Enrollment Roster (Word Document Format)',
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: 'Instructions for Clinical Coordinators & Instructors: Enter or paste your enrolled nursing students in the table below. You can add more rows as needed. Save this Word document (.docx) and upload or drag-and-drop it directly into the AAU NCEP Digital Logbook app to automatically enroll all students.',
                spacing: { after: 300 },
              }),
              new DocxTable({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new DocxTableRow({
                    tableHeader: true,
                    children: [
                      new DocxTableCell({ children: [new Paragraph({ text: 'Student Full Name' })] }),
                      new DocxTableCell({ children: [new Paragraph({ text: 'Student ID' })] }),
                      new DocxTableCell({ children: [new Paragraph({ text: 'Ward / Department' })] }),
                      new DocxTableCell({ children: [new Paragraph({ text: 'Hospital' })] }),
                      new DocxTableCell({ children: [new Paragraph({ text: 'Assigned Clinical Preceptor' })] }),
                    ],
                  }),
                  new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph('Bethlehem Tadesse')] }),
                      new DocxTableCell({ children: [new Paragraph('NCEP-2026-089')] }),
                      new DocxTableCell({ children: [new Paragraph('Medical Intensive Care Unit')] }),
                      new DocxTableCell({ children: [new Paragraph('Hawassa University Hospital')] }),
                      new DocxTableCell({ children: [new Paragraph('Sister Almaz Tefera, RN, MSc')] }),
                    ],
                  }),
                  new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph('Yonas Bekele')] }),
                      new DocxTableCell({ children: [new Paragraph('NCEP-2026-092')] }),
                      new DocxTableCell({ children: [new Paragraph('Emergency & Trauma Center')] }),
                      new DocxTableCell({ children: [new Paragraph('Hawassa University Hospital')] }),
                      new DocxTableCell({ children: [new Paragraph('Dr. Berhanu Tesfaye')] }),
                    ],
                  }),
                  new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph('Selamawit Desta')] }),
                      new DocxTableCell({ children: [new Paragraph('NCEP-2026-095')] }),
                      new DocxTableCell({ children: [new Paragraph('Surgical Ward 4B')] }),
                      new DocxTableCell({ children: [new Paragraph('Hawassa University Hospital')] }),
                      new DocxTableCell({ children: [new Paragraph('Brother Dawit Hailu')] }),
                    ],
                  }),
                  new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph('Tewodros Girma')] }),
                      new DocxTableCell({ children: [new Paragraph('NCEP-2026-098')] }),
                      new DocxTableCell({ children: [new Paragraph('Pediatric ICU')] }),
                      new DocxTableCell({ children: [new Paragraph('Hawassa University Hospital')] }),
                      new DocxTableCell({ children: [new Paragraph('Sister Martha Assefa')] }),
                    ],
                  }),
                  new DocxTableRow({
                    children: [
                      new DocxTableCell({ children: [new Paragraph('Kidist Hailu')] }),
                      new DocxTableCell({ children: [new Paragraph('NCEP-2026-101')] }),
                      new DocxTableCell({ children: [new Paragraph('Coronary Care Unit (CCU)')] }),
                      new DocxTableCell({ children: [new Paragraph('Hawassa University Hospital')] }),
                      new DocxTableCell({ children: [new Paragraph('Sister Hiwot Kebede')] }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AAU_NCEP_COHORT_STUDENT_ROSTER_TEMPLATE.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate Word template:', err);
      alert('Unable to generate Word template on this device.');
    }
  };

  const parseJsonDossierContent = (jsonString: string): CohortStudentRecord[] => {
    const parsed = JSON.parse(jsonString);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const extracted: CohortStudentRecord[] = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;

      const rawInfo = item.traineeInfo || item.traineeInformation || item.studentInfo || item.student;
      if (!rawInfo) continue;

      const info: TraineeInformation = {
        traineeName: rawInfo.traineeName || rawInfo.name || 'Trainee',
        traineeId: rawInfo.traineeId || rawInfo.id || `NCEP-${Date.now().toString().slice(-4)}`,
        clinicalDepartmentWard: rawInfo.clinicalDepartmentWard || rawInfo.ward || 'Medical ICU',
        assignedClinicalPreceptor: rawInfo.assignedClinicalPreceptor || rawInfo.preceptor || '',
        trainingPeriodFrom: rawInfo.trainingPeriodFrom || '',
        trainingPeriodTo: rawInfo.trainingPeriodTo || '',
      };

      let detailedLogs: DetailedActivityLogSheet[] = [];
      if (Array.isArray(item.detailedLogs)) {
        detailedLogs = item.detailedLogs;
      } else if (Array.isArray(item.sessionsMet)) {
        detailedLogs = item.sessionsMet.map((s: any) => ({
          id: `log-reconstructed-${s.sessionNumber}-${Date.now()}`,
          sessionNumber: s.sessionNumber,
          sessionTitle: s.sessionTitle || `Session ${s.sessionNumber}`,
          subCompetencyId: `sub_comp_${Math.min(6, Math.max(1, Math.ceil(s.sessionNumber / 3)))}` as any,
          subCompetencyTitle: s.subCompetency || '',
          dateOfActivity: s.dateCompleted || new Date().toISOString().slice(0, 10),
          durationHours: 4,
          clinicalSettingWard: info.clinicalDepartmentWard,
          activityDescription: s.activityDescription || 'Clinical milestone verified.',
          reflectiveNotesLessonsLearned: s.reflectiveNotes || '',
          attachments: [],
          status: s.status === 'Met' ? 'Met' : 'Pending',
          source: 'manual',
          createdAt: new Date().toISOString(),
          preceptorSignoff: s.preceptorInitials
            ? {
                isSigned: true,
                preceptorName: info.assignedClinicalPreceptor,
                dateSigned: s.dateCompleted || new Date().toISOString().slice(0, 10),
                preceptorInitials: s.preceptorInitials,
                competencyDemonstrated: 'Satisfactory',
                comments: s.preceptorComments || 'Competency met and verified.',
              }
            : undefined,
        }));
      }

      const signoff: FinalCompetencySignoff =
        item.finalSignoff || item.certification || BLANK_FINAL_SIGNOFF;

      extracted.push({
        id: item.id || `student-dossier-${info.traineeId}-${Date.now()}`,
        traineeInfo: info,
        detailedLogs,
        finalSignoff: signoff,
        updatedAt: item.updatedAt || item.exportedAt || new Date().toISOString(),
      });
    }

    return extracted;
  };

  const parseCsvRosterContent = (csvText: string): CohortStudentRecord[] => {
    const rawLines = csvText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    const records: CohortStudentRecord[] = [];

    if (rawLines.length === 0) return records;

    // Check if lines are alternating pairs: Line 0 = Name, Line 1 = ID (common copy-paste format from tables/cards)
    const hasDelimiters = rawLines.some(
      (l) => l.includes(',') || l.includes('\t') || l.includes(';') || l.includes('|')
    );
    const isAlternating =
      !hasDelimiters &&
      rawLines.length >= 2 &&
      rawLines.length % 2 === 0 &&
      rawLines.every((line, idx) => {
        if (idx % 2 === 1) {
          return /\d|ncep|id/i.test(line);
        }
        return true;
      });

    if (isAlternating) {
      for (let k = 0; k < rawLines.length; k += 2) {
        let name = rawLines[k].replace(/^(?:name|trainee|student)\s*[:=\-]?\s*/i, '').trim();
        let sId = rawLines[k + 1].replace(/^(?:id|student id|trainee id)\s*[:=\-]?\s*/i, '').trim();
        if (!name) continue;
        if (!sId) sId = `NCEP-2026-${String(100 + k / 2)}`;

        const info: TraineeInformation = {
          traineeName: name,
          traineeId: sId,
          clinicalDepartmentWard: 'Medical ICU',
          assignedClinicalPreceptor: 'Sister Almaz Tefera, RN, MSc',
          trainingPeriodFrom: '',
          trainingPeriodTo: '',
        };

        records.push({
          id: `student-roster-${sId}-${Date.now()}-${k}`,
          traineeInfo: info,
          detailedLogs: [],
          finalSignoff: BLANK_FINAL_SIGNOFF,
          updatedAt: new Date().toISOString(),
        });
      }
      if (records.length > 0) return records;
    }

    // Determine if line 0 is a pure header row (e.g., "Student Name, ID, Ward")
    let startIndex = 0;
    if (rawLines.length > 1) {
      const l0 = rawLines[0].toLowerCase();
      const isPureHeader =
        (l0.includes('student name') ||
          l0.includes('trainee name') ||
          l0.includes('full name') ||
          (l0.includes('name') && (l0.includes('id') || l0.includes('ward') || l0.includes('department')))) &&
        !/\d{3,}/.test(l0);
      if (isPureHeader) {
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < rawLines.length; i++) {
      let line = rawLines[i];
      // Remove bullet numbers e.g. "1. ", "1) ", "[1] "
      line = line.replace(/^\s*(?:\[\d+\]|\d+[\.\)]|\-|\*)\s*/, '').trim();
      if (!line) continue;

      let name = '';
      let studentId = '';
      let ward = 'Medical ICU';
      let hospital = 'Hawassa University Comprehensive Specialized Hospital';
      let preceptor = 'Sister Almaz Tefera, RN, MSc';

      // Pattern 1: Labelled format like "Name: Bethlehem Tadesse, ID: NCEP-2026-089"
      const nameMatch = line.match(/(?:trainee|student|name)\s*[:=]\s*([^,;|\n]+)/i);
      const idMatch = line.match(/(?:student\s*id|trainee\s*id|\bid\b)\s*[:=]\s*([^,;|\n]+)/i);

      if (nameMatch || idMatch) {
        if (nameMatch) name = nameMatch[1].trim();
        if (idMatch) studentId = idMatch[1].trim();
      }

      if (!name || !studentId) {
        // Delimiter splitting
        let parts: string[] = [];
        if (line.includes('\t')) {
          parts = line.split('\t');
        } else if (line.includes(',')) {
          parts = line.split(',');
        } else if (line.includes(';')) {
          parts = line.split(';');
        } else if (line.includes('|')) {
          parts = line.split('|');
        } else if (/\s+-\s+/.test(line)) {
          parts = line.split(/\s+-\s+/);
        } else if (line.includes(':') && !nameMatch) {
          parts = line.split(':');
        } else {
          // Space separated e.g. 'Bethlehem Tadesse NCEP-2026-089' or 'Bethlehem Tadesse 12345'
          const idAtEnd = line.match(/^(.*?)\s+((?:NCEP-)?[\w\d\-\/]{3,})$/i);
          if (idAtEnd) {
            parts = [idAtEnd[1], idAtEnd[2]];
          } else {
            parts = [line];
          }
        }

        parts = parts.map((p) => p.replace(/^["']|["']$/g, '').trim()).filter(Boolean);

        if (parts.length >= 2) {
          const part0HasDigits = /\d/.test(parts[0]);
          const part1HasDigits = /\d/.test(parts[1]);

          if (part0HasDigits && !part1HasDigits) {
            studentId = studentId || parts[0];
            name = name || parts[1];
          } else {
            name = name || parts[0];
            studentId = studentId || parts[1];
          }

          if (parts[2]) ward = parts[2];
          if (parts[3]) hospital = parts[3];
          if (parts[4]) preceptor = parts[4];
        } else if (parts.length === 1) {
          if (!name) name = parts[0];
        }
      }

      // Clean up extracted values
      name = name.replace(/^(?:name|trainee|student)\s*[:=\-]?\s*/i, '').trim();
      studentId = studentId.replace(/^(?:id|student id|trainee id)\s*[:=\-]?\s*/i, '').trim();

      if (!name && !studentId) continue;
      if (!name && studentId) name = `Trainee ${studentId}`;
      if (!studentId) studentId = `NCEP-2026-${String(100 + i)}`;

      const info: TraineeInformation = {
        traineeName: name,
        traineeId: studentId,
        clinicalDepartmentWard: ward,
        assignedClinicalPreceptor: preceptor,
        trainingPeriodFrom: '',
        trainingPeriodTo: '',
      };

      records.push({
        id: `student-roster-${studentId}-${Date.now()}-${i}`,
        traineeInfo: info,
        detailedLogs: [],
        finalSignoff: BLANK_FINAL_SIGNOFF,
        updatedAt: new Date().toISOString(),
      });
    }

    return records;
  };

  const handleParseRawText = (rawText: string): CohortStudentRecord[] => {
    setDossierImportError(null);
    const trimmed = rawText.trim();
    if (!trimmed) {
      setDossierImportError('Please paste student JSON text or student names and IDs.');
      return [];
    }
    try {
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = parseJsonDossierContent(trimmed);
        if (parsed.length === 0) {
          setDossierImportError('No valid student dossier found in JSON text.');
          return [];
        }
        setDossierImportPreview(parsed);
        return parsed;
      } else {
        const parsed = parseCsvRosterContent(trimmed);
        if (parsed.length === 0) {
          setDossierImportError('No valid student records found in the pasted text.');
          return [];
        }
        setDossierImportPreview(parsed);
        return parsed;
      }
    } catch (err) {
      setDossierImportError('Failed to parse text. Please check JSON syntax or paste format.');
      return [];
    }
  };

  const parseWordDocumentContent = async (arrayBuffer: ArrayBuffer): Promise<CohortStudentRecord[]> => {
    try {
      const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
      const html = htmlResult.value || '';
      const records: CohortStudentRecord[] = [];

      // Case 1: Word Table Rows
      const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi);
      if (rowMatches && rowMatches.length > 0) {
        let startIndex = 0;
        const firstRowText = rowMatches[0].replace(/<[^>]+>/g, ' ').toLowerCase();
        if (
          firstRowText.includes('name') ||
          firstRowText.includes('id') ||
          firstRowText.includes('trainee') ||
          firstRowText.includes('student') ||
          firstRowText.includes('ward') ||
          firstRowText.includes('department')
        ) {
          startIndex = 1;
        }

        for (let r = startIndex; r < rowMatches.length; r++) {
          const row = rowMatches[r];
          const cellMatches = row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi);
          if (!cellMatches || cellMatches.length === 0) continue;

          const cells = cellMatches
            .map((c) => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(Boolean);
          if (cells.length === 0) continue;

          let name = cells[0] || '';
          let studentId = cells[1] || '';
          let ward = cells[2] || 'Medical ICU';
          let hospital = cells[3] || 'Hawassa University Comprehensive Specialized Hospital';
          let preceptor = cells[4] || 'Sister Almaz Tefera, RN, MSc';

          if (cells.length >= 2) {
            const c0Digits = /\d/.test(cells[0]);
            const c1Digits = /\d/.test(cells[1]);
            if (c0Digits && !c1Digits) {
              studentId = cells[0];
              name = cells[1];
            }
          }

          name = name.replace(/^(?:name|trainee|student)\s*[:=\-]?\s*/i, '').trim();
          studentId = studentId.replace(/^(?:id|student id|trainee id)\s*[:=\-]?\s*/i, '').trim();

          if (!name && !studentId) continue;
          if (!name) name = `Trainee ${studentId}`;
          if (!studentId) studentId = `NCEP-2026-${String(100 + r)}`;

          const info: TraineeInformation = {
            traineeName: name,
            traineeId: studentId,
            clinicalDepartmentWard: ward,
            assignedClinicalPreceptor: preceptor,
            trainingPeriodFrom: '',
            trainingPeriodTo: '',
          };

          records.push({
            id: `student-word-${studentId}-${Date.now()}-${r}`,
            traineeInfo: info,
            detailedLogs: [],
            finalSignoff: BLANK_FINAL_SIGNOFF,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // Case 2: If no table rows were detected, extract raw text / paragraphs from Word document
      if (records.length === 0) {
        const rawTextResult = await mammoth.extractRawText({ arrayBuffer });
        const text =
          rawTextResult.value ||
          html.replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ');
        if (text && text.trim()) {
          const fromText = parseCsvRosterContent(text);
          records.push(...fromText);
        }
      }

      return records;
    } catch (err) {
      console.error('Word extraction error:', err);
      return [];
    }
  };

  const handleProcessIncomingFiles = async (files: FileList | File[]) => {
    setDossierImportError(null);
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploadedFileNames(fileArray.map((f) => f.name));

    try {
      const allExtracted: CohortStudentRecord[] = [];

      for (const file of fileArray) {
        const lowerName = file.name.toLowerCase();

        if (
          lowerName.endsWith('.docx') ||
          lowerName.endsWith('.doc') ||
          file.type.includes('word') ||
          file.type.includes('officedocument')
        ) {
          const arrayBuffer = await file.arrayBuffer();
          const fromWord = await parseWordDocumentContent(arrayBuffer);
          allExtracted.push(...fromWord);
        } else if (lowerName.endsWith('.csv') || file.type.includes('csv')) {
          const text = await file.text();
          const fromCsv = parseCsvRosterContent(text);
          allExtracted.push(...fromCsv);
        } else {
          // JSON or fallback to text
          const text = await file.text();
          const fromJson = parseJsonDossierContent(text);
          if (fromJson.length > 0) {
            allExtracted.push(...fromJson);
          } else {
            const fromText = parseCsvRosterContent(text);
            allExtracted.push(...fromText);
          }
        }
      }

      if (allExtracted.length === 0) {
        setDossierImportError(
          'No valid student dossiers or roster entries detected in the selected file(s). Please verify the Word document, JSON schema, or CSV format.'
        );
        return;
      }

      setDossierImportPreview(allExtracted);
    } catch (err) {
      setDossierImportError(
        'Failed to read or parse file(s). Ensure the Word document (.docx) or file format is valid.'
      );
    }
  };

  const handleExecuteImport = (recordsToImport: CohortStudentRecord[]) => {
    if (recordsToImport.length === 0) return;

    if (onImportMultipleStudentDossiers) {
      onImportMultipleStudentDossiers(recordsToImport);
    } else {
      recordsToImport.forEach((rec) => onImportStudentDossier(rec));
    }

    setIsDossierModalOpen(false);
    setDossierImportPreview([]);
    setDossierRawText('');
    setUploadedFileNames([]);

    const firstStudent = recordsToImport[0];
    const totalMetSessions = firstStudent.detailedLogs.filter((l) => l.status === 'Met').length;

    setDossierSuccessBanner({
      title: `Successfully imported ${recordsToImport.length} student ${recordsToImport.length === 1 ? 'dossier' : 'dossiers'}!`,
      details:
        recordsToImport.length === 1
          ? `${firstStudent.traineeInfo.traineeName} (${firstStudent.traineeInfo.traineeId}) is now active with ${totalMetSessions} verified sessions.`
          : `Imported ${recordsToImport.map((s) => s.traineeInfo.traineeName).slice(0, 3).join(', ')}${recordsToImport.length > 3 ? ` and ${recordsToImport.length - 3} others` : ''}.`,
      count: recordsToImport.length,
    });
  };

  // Direct 1-Click Quick Import from disk (bypasses modal)
  const handleDirectQuickImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    try {
      const allExtracted: CohortStudentRecord[] = [];
      for (const file of fileArray) {
        const lowerName = file.name.toLowerCase();
        if (
          lowerName.endsWith('.docx') ||
          lowerName.endsWith('.doc') ||
          file.type.includes('word') ||
          file.type.includes('officedocument')
        ) {
          const arrayBuffer = await file.arrayBuffer();
          const fromWord = await parseWordDocumentContent(arrayBuffer);
          allExtracted.push(...fromWord);
        } else if (lowerName.endsWith('.csv') || file.type.includes('csv')) {
          const text = await file.text();
          allExtracted.push(...parseCsvRosterContent(text));
        } else {
          const text = await file.text();
          const fromJson = parseJsonDossierContent(text);
          if (fromJson.length > 0) {
            allExtracted.push(...fromJson);
          } else {
            allExtracted.push(...parseCsvRosterContent(text));
          }
        }
      }

      if (allExtracted.length > 0) {
        handleExecuteImport(allExtracted);
      } else {
        alert('Could not detect valid student roster or dossier data in the selected file.');
      }
    } catch (err) {
      alert('Failed to read or parse file. Please verify Word (.docx), CSV, or JSON format.');
    }
    e.target.value = '';
  };

  const handlePopulate15Preceptors = () => {
    setPreceptorsList(FULL_15_PRECEPTORS_ROSTER);
    saveStoredPreceptors(FULL_15_PRECEPTORS_ROSTER);
    setBatchImportNotification('Successfully loaded all 15 preceptors & mentors with individual PINs!');
    setTimeout(() => setBatchImportNotification(null), 4000);
  };

  const handleOpenBatchModal = () => {
    setBatchImportNotification(null);
    setBatchRawText(
      `Sister Almaz Tefera, Senior Clinical Preceptor, Medical ICU, 4182, AT\n` +
      `Dr. Berhanu Tesfaye, Clinical Mentor, Emergency Center & Trauma, 7021, BT\n` +
      `Sister Tigist Haile, Lead Clinical Educator, Academic Nursing, 9090, TH\n` +
      `Brother Dawit Hailu, Senior Clinical Preceptor, Surgical ICU, 3314, DH\n` +
      `Sister Hiwot Kebede, Clinical Mentor, Coronary Care Unit, 5520, HK\n` +
      `Brother Samuel Girma, Clinical Preceptor, Resuscitation & Red Zone, 6241, SG\n` +
      `Sister Martha Assefa, Clinical Mentor, Pediatric ICU, 1845, MA\n` +
      `Brother Yared Mengistu, Clinical Preceptor, Neuro-ICU, 2973, YM\n` +
      `Sister Bethlehem Worku, Clinical Preceptor, Renal & Hemodialysis, 8412, BW\n` +
      `Brother Elias Tadesse, Clinical Mentor, Trauma & Orthopedics, 4930, ET\n` +
      `Sister Senait Mekonnen, Clinical Preceptor, Burns Critical Care, 7154, SM\n` +
      `Brother Solomon Bekele, Clinical Mentor, Main Operating Theatres, 3829, SB\n` +
      `Sister Meron Getachew, Clinical Preceptor, Medical HDU, 6098, MG\n` +
      `Brother Natnael Fikru, Clinical Mentor, Emergency Observation, 5217, NF\n` +
      `Sister Rahel Desta, Clinical Supervisor, Clinical Quality & Audit, 8305, RD`
    );
    setIsBatchModalOpen(true);
  };

  const parseBatchText = (text: string): RegisteredPreceptor[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('#'));
    const parsed: RegisteredPreceptor[] = [];

    lines.forEach((line, index) => {
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map((p) => p.trim());

      const name = parts[0] || `Preceptor ${index + 1}`;
      const title = parts[1] || 'Clinical Preceptor';
      const ward = parts[2] || 'Clinical Rotation Ward';
      const pin = parts[3] || String(1000 + Math.floor(Math.random() * 8999));

      const calcInitials = parts[4]
        ? parts[4].toUpperCase()
        : name
            .split(' ')
            .filter((w) => w.length > 0 && !w.includes('.') && !w.includes(','))
            .map((w) => w[0])
            .join('')
            .slice(0, 3)
            .toUpperCase() || `P${index + 1}`;

      const lowerTitle = title.toLowerCase();
      let role: 'preceptor' | 'mentor' | 'lead_educator' = 'preceptor';
      if (lowerTitle.includes('mentor')) role = 'mentor';
      else if (
        lowerTitle.includes('lead') ||
        lowerTitle.includes('educator') ||
        lowerTitle.includes('director') ||
        lowerTitle.includes('supervisor')
      ) {
        role = 'lead_educator';
      }

      parsed.push({
        id: `prec-batch-${Date.now()}-${index}`,
        name,
        title,
        wardDepartment: ward,
        pin,
        initials: calcInitials,
        role,
      });
    });

    return parsed;
  };

  const handleExecuteBatchImport = (mode: 'replace' | 'append') => {
    const parsed = parseBatchText(batchRawText);
    if (parsed.length === 0) {
      alert('Please enter at least one valid preceptor line.');
      return;
    }

    let newList: RegisteredPreceptor[];
    if (mode === 'replace') {
      newList = parsed;
    } else {
      newList = [...preceptorsList, ...parsed];
    }

    setPreceptorsList(newList);
    saveStoredPreceptors(newList);
    setIsBatchModalOpen(false);
    setBatchImportNotification(`Successfully imported ${parsed.length} preceptors! Directory now has ${newList.length} total.`);
    setTimeout(() => setBatchImportNotification(null), 4000);
  };

  const handleExportPreceptorsCsv = () => {
    const headers = ['Full Name', 'Role', 'Title', 'Ward / Department', 'Initials', 'Security PIN'];
    const rows = preceptorsList.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.role,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.wardDepartment.replace(/"/g, '""')}"`,
      p.initials,
      p.pin,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ncep_clinical_preceptors_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateMasterPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput.trim()) return;
    savePreceptorPin(newPinInput.trim());
    setCurrentPin(newPinInput.trim());
    setNewPinInput('');
    setPinSavedMessage(true);
    setTimeout(() => setPinSavedMessage(false), 3000);
  };

  const handleOpenAddPreceptor = () => {
    setEditingPreceptorId(null);
    setPrecName('');
    setPrecTitle('Clinical Preceptor');
    setPrecRole('preceptor');
    setPrecWard('General Inpatient Ward');
    setPrecPin('');
    setPrecInitials('');
    setIsPreceptorModalOpen(true);
  };

  const handleOpenEditPreceptor = (p: RegisteredPreceptor) => {
    setEditingPreceptorId(p.id);
    setPrecName(p.name);
    setPrecTitle(p.title);
    setPrecRole(p.role);
    setPrecWard(p.wardDepartment);
    setPrecPin(p.pin);
    setPrecInitials(p.initials);
    setIsPreceptorModalOpen(true);
  };

  const handleDeletePreceptor = (id: string) => {
    if (preceptorsList.length <= 1) {
      alert('At least one instructor must remain registered.');
      return;
    }
    const filtered = preceptorsList.filter((p) => p.id !== id);
    setPreceptorsList(filtered);
    saveStoredPreceptors(filtered);
  };

  const handleSavePreceptor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!precName.trim() || !precPin.trim()) return;

    const calcInitials = precInitials.trim()
      ? precInitials.trim().toUpperCase()
      : precName
          .split(' ')
          .filter((w) => w.length > 0 && !w.includes('.') && !w.includes(','))
          .map((w) => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase() || 'CP';

    let updatedList: RegisteredPreceptor[];
    if (editingPreceptorId) {
      updatedList = preceptorsList.map((p) =>
        p.id === editingPreceptorId
          ? {
              ...p,
              name: precName.trim(),
              title: precTitle.trim(),
              role: precRole,
              wardDepartment: precWard.trim(),
              pin: precPin.trim(),
              initials: calcInitials,
            }
          : p
      );
    } else {
      const newPreceptor: RegisteredPreceptor = {
        id: `prec-${Date.now()}`,
        name: precName.trim(),
        title: precTitle.trim(),
        role: precRole,
        wardDepartment: precWard.trim(),
        pin: precPin.trim(),
        initials: calcInitials,
      };
      updatedList = [...preceptorsList, newPreceptor];
    }

    setPreceptorsList(updatedList);
    saveStoredPreceptors(updatedList);
    setIsPreceptorModalOpen(false);
  };

  const handleResetPreceptorsToDefault = () => {
    if (confirm('Reset the instructor registry to AAU standard preceptors?')) {
      setPreceptorsList(DEFAULT_REGISTERED_PRECEPTORS);
      saveStoredPreceptors(DEFAULT_REGISTERED_PRECEPTORS);
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentId.trim()) return;

    const newTrainee: TraineeInformation = {
      traineeName: newStudentName.trim(),
      traineeId: newStudentId.trim(),
      clinicalDepartmentWard: newWard.trim(),
      assignedClinicalPreceptor: newPreceptor.trim(),
      trainingPeriodFrom: '2026-08-15',
      trainingPeriodTo: '2026-11-20',
    };

    const newRecord: CohortStudentRecord = {
      id: `student-${Date.now()}`,
      traineeInfo: newTrainee,
      detailedLogs: [],
      finalSignoff: BLANK_FINAL_SIGNOFF,
      updatedAt: new Date().toISOString(),
    };

    onAddStudent(newRecord);
    setIsAddModalOpen(false);
    setNewStudentName('');
    setNewStudentId('');
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleProcessIncomingFiles(files);
    setIsDossierModalOpen(true);
    e.target.value = '';
  };

  const filteredStudents = cohortStudents.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.traineeInfo.traineeName.toLowerCase().includes(q) ||
      s.traineeInfo.traineeId.toLowerCase().includes(q) ||
      s.traineeInfo.clinicalDepartmentWard.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="p-6 bg-linear-to-r from-teal-950 via-teal-900 to-slate-900 text-white rounded-2xl shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <GraduationCap className="w-4 h-4" />
            <span>Instructor &amp; Clinical Coordinator Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            NCEP Cohort Roster &amp; Student Manager
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-teal-100 leading-relaxed">
            Monitor all students across Core Competency 1, manage preceptor authorization codes, switch
            between student logbooks, and audit submitted verification dossiers.
          </p>
        </div>
      </div>

      {/* Deployment & Workflow Guide for the Instructor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-teal-800" />
          <span>How to use this app with all your students</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 pt-1">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-teal-900">1. Share App Link with Students</span>
            <p className="leading-relaxed text-[11px] text-slate-600">
              Give your students the Shared App URL. Each student opens it on their phone, tablet, or
              laptop. Their entries automatically save to their own device storage.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-teal-900">2. Preceptors Sign with Security PIN</span>
            <p className="leading-relaxed text-[11px] text-slate-600">
              Only mentors who know the Preceptor PIN (default: <code>2026</code>) can mark sessions
              as &ldquo;Met&rdquo; and sign Section 3. Students cannot sign for themselves.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-teal-900">3. Collect &amp; Audit Submissions</span>
            <p className="leading-relaxed text-[11px] text-slate-600">
              Students export their completed dossier (JSON or PDF) and submit it to you. You can import
              their JSON dossier below to audit all 18 sessions and sign Part III!
            </p>
          </div>
        </div>
      </div>

      {/* Preceptor & Instructor Directory with Individual PINs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-800" />
              <h3 className="text-sm font-bold text-slate-900">
                Authorized Instructors &amp; Preceptors Directory ({preceptorsList.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Each instructor has their own personal PIN. Entering their PIN automatically attributes their name and initials to verified sessions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePopulate15Preceptors}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-2xs"
              title="Quickly populate the full 15-preceptor hospital faculty roster"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Load 15 Preceptors</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBatchModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Paste multiple preceptors at once"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Batch Import / CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportPreceptorsCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              title="Download directory as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? 'Hide PINs' : 'Show PINs'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddPreceptor}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Preceptor</span>
            </button>
          </div>
        </div>

        {/* Success or info alert */}
        {batchImportNotification && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{batchImportNotification}</span>
          </div>
        )}

        {/* Tip banner if currently only 3 instructors */}
        {preceptorsList.length < 15 && (
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
              <p className="text-amber-950 font-medium text-[11px]">
                Currently <strong>{preceptorsList.length}</strong> instructors listed. Have 15 preceptors &amp; mentors in your clinical rotation team?
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePopulate15Preceptors}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Populate All 15 Preceptors</span>
              </button>
              <button
                type="button"
                onClick={handleOpenBatchModal}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold border border-amber-300 rounded-lg text-xs transition-colors"
              >
                Paste Custom List
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by instructor name, title, ward, initials, or PIN..."
              value={preceptorSearchQuery}
              onChange={(e) => setPreceptorSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px]">Filter:</span>
            <select
              value={preceptorRoleFilter}
              onChange={(e) => setPreceptorRoleFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              <option value="all">All Roles ({preceptorsList.length})</option>
              <option value="preceptor">
                Clinical Preceptors ({preceptorsList.filter((p) => p.role === 'preceptor').length})
              </option>
              <option value="mentor">
                Clinical Mentors ({preceptorsList.filter((p) => p.role === 'mentor').length})
              </option>
              <option value="lead_educator">
                Lead Educators ({preceptorsList.filter((p) => p.role === 'lead_educator').length})
              </option>
            </select>
          </div>
        </div>

        {/* Preceptor List Grid */}
        {(() => {
          const filteredPreceptors = preceptorsList.filter((p) => {
            const q = preceptorSearchQuery.toLowerCase().trim();
            const matchesSearch =
              !q ||
              p.name.toLowerCase().includes(q) ||
              p.title.toLowerCase().includes(q) ||
              p.wardDepartment.toLowerCase().includes(q) ||
              p.initials.toLowerCase().includes(q) ||
              (showPins && p.pin.includes(q));

            const matchesRole = preceptorRoleFilter === 'all' || p.role === preceptorRoleFilter;

            return matchesSearch && matchesRole;
          });

          if (filteredPreceptors.length === 0) {
            return (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No instructors matched &ldquo;{preceptorSearchQuery}&rdquo;</p>
                <p className="text-[11px] text-slate-400 mt-1">Try clearing search or filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setPreceptorSearchQuery('');
                    setPreceptorRoleFilter('all');
                  }}
                  className="mt-3 px-3 py-1 text-xs text-teal-800 font-bold hover:underline"
                >
                  Clear Filters
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPreceptors.map((preceptor, pIdx) => (
                <div
                  key={`prec-${preceptor.id}-${pIdx}`}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 flex flex-col justify-between hover:border-teal-400 transition-colors shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-900">{preceptor.name}</h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              preceptor.role === 'mentor'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : preceptor.role === 'lead_educator'
                                ? 'bg-amber-100 text-amber-950 border border-amber-200'
                                : 'bg-teal-100 text-teal-900 border border-teal-200'
                            }`}
                          >
                            {preceptor.role === 'mentor'
                              ? 'Mentor'
                              : preceptor.role === 'lead_educator'
                              ? 'Lead Educator'
                              : 'Preceptor'}
                          </span>
                        </div>
                        <p className="text-[11px] text-teal-900 font-medium mt-0.5">{preceptor.title}</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 shrink-0">
                        {preceptor.initials}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Ward: <span className="text-slate-800 font-medium">{preceptor.wardDepartment}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">PIN:</span>
                      <span className="text-xs font-mono font-bold text-teal-950 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {showPins ? preceptor.pin : '••••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPreceptor(preceptor)}
                        className="p-1 text-slate-500 hover:text-teal-900 rounded hover:bg-white"
                        title="Edit Name, Ward, or PIN"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePreceptor(preceptor.id)}
                        className="p-1 text-slate-400 hover:text-rose-700 rounded hover:bg-white"
                        title="Remove preceptor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Master Institutional Backup PIN & AAU Defaults */}
        <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-teal-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>Master Institutional Backup Code</span>
            </span>
            <p className="text-[11px] text-teal-800">
              Shared fallback passcode for all clinical supervisors (Current: <code className="font-bold">{currentPin}</code>).
            </p>
          </div>

          <form onSubmit={handleUpdateMasterPin} className="flex items-center gap-2">
            <input
              type="text"
              maxLength={10}
              placeholder="New master code..."
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              className="w-32 px-2.5 py-1 text-xs rounded-lg border border-teal-300 bg-white font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1 text-xs font-semibold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shrink-0"
            >
              Update
            </button>
            {pinSavedMessage && (
              <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleResetPreceptorsToDefault}
              className="text-[11px] text-teal-700 hover:text-teal-950 underline ml-2"
            >
              Reset to Defaults
            </button>
          </form>
        </div>
      </div>

      {/* How Mentors & Preceptors Access Evaluation Forms Guide */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-teal-900/40 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-teal-800/60">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              How Mentors &amp; Preceptors Access and Complete Evaluation Forms
            </h3>
          </div>
          <span className="text-[10px] font-semibold bg-teal-800/80 text-teal-200 px-2.5 py-0.5 rounded-full border border-teal-600/40 self-start sm:self-auto">
            Instructor Portal Workflow
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-300">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-[11px] font-mono border border-teal-400/40 text-teal-200">1</span>
              <span>Select Trainee &amp; Form</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Find the student in the roster below. Click <strong className="text-white">Part I Matrix</strong>, <strong className="text-white">Part II Form</strong>, or <strong className="text-white">Part III Sign-off</strong> on their row to immediately load their records and jump directly to that evaluation section.
            </p>
          </div>

          <div className="p-3.5 bg-white/10 rounded-xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-300">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-[11px] font-mono border border-teal-400/40 text-teal-200">2</span>
              <span>Evaluate &amp; Sign with PIN</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              In <strong>Part I</strong>, click &ldquo;Mark Met &amp; Sign&rdquo; on any session. In <strong>Part II</strong>, open Section 3 to rate competency (Satisfactory/Needs Improvement), write narrative coaching observations, and sign with your personal 4-digit PIN.
            </p>
          </div>

          <div className="p-3.5 bg-white/10 rounded-xl border border-white/10 space-y-1.5 backdrop-blur-xs">
            <div className="flex items-center gap-1.5 font-bold text-teal-300">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-[11px] font-mono border border-teal-400/40 text-teal-200">3</span>
              <span>Summative Certification</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Once all 18 sessions are met, click <strong>Part III Sign-off</strong> to complete the institutional multi-domain summative evaluation, approve independent practice, and generate the official 7-page academic PDF report.
            </p>
          </div>
        </div>
      </div>

      {/* Cohort Students Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Enrolled Students Roster ({cohortStudents.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any evaluation button to switch to that trainee and immediately open their evaluation form
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Direct 1-click quick import from disk */}
            <label
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Pick a .json or .csv file to import and load student immediately with 1 click"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>⚡ Quick Upload (.docx / .csv / .json)</span>
              <input
                type="file"
                accept=".docx,.doc,.json,.csv,.txt"
                multiple
                onChange={handleDirectQuickImport}
                className="hidden"
              />
            </label>

            {/* Modal Dialog button */}
            <button
              type="button"
              onClick={() => {
                setDossierImportError(null);
                setDossierImportPreview([]);
                setDossierRawText('');
                setUploadedFileNames([]);
                setIsDossierModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title="Open the enrollment guide to import Word files (.docx), CSV, or paste student lists"
            >
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>Import Word / Roster Dialog</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Dossier Import Success Banner */}
        {dossierSuccessBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">{dossierSuccessBanner.title}</p>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">{dossierSuccessBanner.details}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDossierSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold p-1 rounded-md hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Currently Active Student Evaluation Banner */}
        {(() => {
          const currentStudent = cohortStudents.find(
            (s) => s.traineeInfo.traineeId === currentStudentId || s.id === currentStudentId
          );
          if (!currentStudent) return null;

          const currentMet = NCEP_SESSIONS_DEFINITIONS.filter((s) => {
            const log = currentStudent.detailedLogs.find((l) => l.sessionNumber === s.sessionNumber);
            return log?.status === 'Met';
          }).length;

          return (
            <div className="p-3.5 bg-gradient-to-r from-teal-50 via-slate-50 to-blue-50 rounded-xl border border-teal-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  {currentStudent.traineeInfo.traineeName ? currentStudent.traineeInfo.traineeName.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">
                      {currentStudent.traineeInfo.traineeName || 'Active Trainee'}
                    </span>
                    <span className="font-mono text-[10px] text-teal-800 bg-white px-2 py-0.5 rounded border border-teal-200">
                      {currentStudent.traineeInfo.traineeId || 'ID Pending'}
                    </span>
                    <span className="text-[10px] text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                      {currentStudent.traineeInfo.clinicalDepartmentWard || 'Ward Unassigned'}
                    </span>
                    <span className="text-[10px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded border border-teal-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-teal-700" /> Active Logbook Loaded
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Progress: <strong className="text-teal-950 font-bold">{currentMet} / 18 Sessions Met</strong> ({Math.round((currentMet / 18) * 100)}%) &middot; Assigned Preceptor: <strong className="text-slate-700">{currentStudent.traineeInfo.assignedClinicalPreceptor || 'Not designated'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <span className="text-[11px] font-bold text-slate-600 hidden lg:inline">Evaluate Now:</span>
                <button
                  type="button"
                  onClick={() => onSelectStudent(currentStudent, 'part1')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-xl transition-colors shadow-2xs"
                  title="Open Part I: Competency Tracking Matrix to verify and sign sessions"
                >
                  <ClipboardCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>Part I Matrix</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectStudent(currentStudent, 'part2')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-950 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-xl transition-colors shadow-2xs"
                  title="Open Part II: Detailed Log Sheet Form & Section 3 Preceptor Evaluation"
                >
                  <FileEdit className="w-3.5 h-3.5 text-blue-700" />
                  <span>Part II Form (Sec. 3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectStudent(currentStudent, 'part3')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-purple-950 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-xl transition-colors shadow-2xs"
                  title="Open Part III: Final Summative Sign-Off & Institutional Certification"
                >
                  <Award className="w-3.5 h-3.5 text-purple-700" />
                  <span>Part III Final</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student name, ID, or ward..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
          />
        </div>

        {/* Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-bold">Student Name</th>
                <th className="py-2.5 px-3 font-bold">Student ID</th>
                <th className="py-2.5 px-3 font-bold">Ward / Department</th>
                <th className="py-2.5 px-3 font-bold">Assigned Preceptor</th>
                <th className="py-2.5 px-3 font-bold text-center">Sessions Met</th>
                <th className="py-2.5 px-3 font-bold text-center">Part III Status</th>
                <th className="py-2.5 px-3 font-bold text-right">Access Evaluation Forms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((student, sIdx) => {
                const metCount = NCEP_SESSIONS_DEFINITIONS.filter((s) => {
                  const log = student.detailedLogs.find((l) => l.sessionNumber === s.sessionNumber);
                  return log?.status === 'Met';
                }).length;

                const isCurrent =
                  student.traineeInfo.traineeId === currentStudentId || student.id === currentStudentId;

                return (
                  <tr
                    key={`cohort-student-row-${student.id}-${student.traineeInfo?.traineeId || sIdx}-${sIdx}`}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isCurrent ? 'bg-teal-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                        )}
                        <span>{student.traineeInfo.traineeName || 'Unnamed Trainee'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-teal-900">
                      {student.traineeInfo.traineeId || '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {student.traineeInfo.clinicalDepartmentWard || '—'}
                    </td>

                    <td className="py-3 px-3 text-slate-700">
                      {student.traineeInfo.assignedClinicalPreceptor || '—'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-slate-900">
                        {metCount} / {NCEP_SESSIONS_DEFINITIONS.length}
                      </span>
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 mx-auto mt-1">
                        <div
                          className="bg-teal-700 h-1.5 rounded-full"
                          style={{
                            width: `${Math.round(
                              (metCount / NCEP_SESSIONS_DEFINITIONS.length) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {student.finalSignoff.isCertified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Certified
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">In Progress</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-teal-900 bg-teal-100/90 px-2 py-0.5 rounded border border-teal-300 inline-flex items-center gap-1">
                            Active
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student, 'part1')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200"
                          title="Open Part I Tracking Matrix for this trainee"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5 text-teal-700" />
                          <span>Part I Matrix</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student, 'part2')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                          title="Open Part II Detailed Log Sheet & Section 3 Formative Evaluation Form"
                        >
                          <FileEdit className="w-3.5 h-3.5 text-blue-700" />
                          <span>Part II Form</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectStudent(student, 'part3')}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                          title="Open Part III Final Summative Sign-Off & Institutional Certification"
                        >
                          <Award className="w-3.5 h-3.5 text-purple-700" />
                          <span>Part III Sign-off</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add New Trainee to Class Roster</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trainee Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bethlehem Desta"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trainee ID:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AAU-NS-2024-0420"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ward / Department:</label>
                <input
                  type="text"
                  required
                  value={newWard}
                  onChange={(e) => setNewWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Preceptor:</label>
                <input
                  type="text"
                  required
                  list="cohort-preceptors-list"
                  placeholder="Select preceptor or type custom name"
                  value={newPreceptor}
                  onChange={(e) => setNewPreceptor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
                <datalist id="cohort-preceptors-list">
                  {preceptorsList.map((p, pIdx) => (
                    <option key={`prec-opt-${p.id}-${pIdx}`} value={p.name}>
                      {p.title} ({p.wardDepartment})
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl"
                >
                  Create Trainee Logbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Instructor & Preceptor Modal */}
      {isPreceptorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-teal-300" />
                <h3 className="text-sm font-bold">
                  {editingPreceptorId ? 'Edit Instructor Details & Passcode' : 'Register New Instructor / Clinical Preceptor'}
                </h3>
              </div>
              <button
                onClick={() => setIsPreceptorModalOpen(false)}
                className="text-teal-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePreceptor} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Assign a personalized authorization PIN code to this instructor. When students request validation on the ward, the instructor enters their specific PIN to verify competencies under their own name.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Instructor / Preceptor Full Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sister Almaz Tefera, RN, MSc"
                  value={precName}
                  onChange={(e) => {
                    setPrecName(e.target.value);
                    if (!precInitials) {
                      const inits = e.target.value
                        .split(' ')
                        .filter((w) => w.length > 0 && !w.includes('.') && !w.includes(','))
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 3)
                        .toUpperCase();
                      setPrecInitials(inits);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Role Type:</label>
                  <select
                    value={precRole}
                    onChange={(e) => setPrecRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="preceptor">Clinical Preceptor</option>
                    <option value="mentor">Clinical Mentor</option>
                    <option value="lead_educator">Lead Clinical Educator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Initials (for Matrix):</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. AT"
                    value={precInitials}
                    onChange={(e) => setPrecInitials(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Professional Title / Credentials:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Clinical Preceptor - Critical Care"
                  value={precTitle}
                  onChange={(e) => setPrecTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ward / Hospital Department:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medical ICU / Emergency Center, TASH"
                  value={precWard}
                  onChange={(e) => setPrecWard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                <label className="block font-bold text-teal-950 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-teal-800" />
                  <span>Personal Security PIN Code (Confidential):</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="e.g. 4182"
                  value={precPin}
                  onChange={(e) => setPrecPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-teal-300 font-mono font-bold text-base tracking-widest text-teal-900 bg-white"
                />
                <p className="text-[10px] text-teal-800">
                  Must be known only to this instructor. Used to authorize signatures and certify sessions as Met.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPreceptorModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-2xs"
                >
                  {editingPreceptorId ? 'Save Changes' : 'Register Preceptor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Batch Import Preceptors Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-teal-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-300" />
                <h3 className="text-sm font-bold">
                  Batch Import / Quick Add Preceptors &amp; Mentors
                </h3>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="text-teal-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1 text-teal-950">
                <p className="font-bold">Instructions &amp; Supported Formats:</p>
                <p className="text-[11px] leading-relaxed text-teal-900">
                  Paste up to 15 or more preceptors (one per line). You can paste either:
                </p>
                <ul className="list-disc list-inside text-[11px] text-teal-900 space-y-0.5">
                  <li><strong>Full CSV / Tab:</strong> <code>Name, Title, Ward, PIN, Initials</code></li>
                  <li><strong>Simple Names only:</strong> <code>Sister Almaz Tefera</code> (Ward and unique PIN will be auto-assigned!)</li>
                </ul>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Preceptors List (1 per line):</span>
                  <span className="font-normal text-slate-500 font-mono text-[11px]">
                    ({batchRawText.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith('#')).length} lines detected)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBatchRawText(
                        FULL_15_PRECEPTORS_ROSTER.map(
                          (p) => `${p.name}, ${p.title}, ${p.wardDepartment}, ${p.pin}, ${p.initials}`
                        ).join('\n')
                      )
                    }
                    className="text-[11px] text-teal-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Insert 15 Standard Preceptors</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchRawText('')}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                rows={12}
                value={batchRawText}
                onChange={(e) => setBatchRawText(e.target.value)}
                placeholder="Paste CSV lines or names here..."
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-slate-50"
              />

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                <span className="text-[11px] text-slate-500">
                  Choose how to apply this list to your directory:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteBatchImport('append')}
                    className="px-3.5 py-1.5 font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-xl transition-colors"
                  >
                    + Append to Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteBatchImport('replace')}
                    className="px-4 py-1.5 font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-2xs transition-colors"
                  >
                    ✓ Replace Directory ({batchRawText.split('\n').filter((l) => l.trim().length > 0 && !l.startsWith('#')).length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Import Student Dossier & Cohort Roster Modal */}
      {isDossierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white p-5 sm:p-6 relative shrink-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-2 bg-teal-800/80 rounded-xl text-teal-200">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Import Student Dossier &amp; Cohort Roster
                  </h3>
                  <p className="text-xs text-teal-200/90">
                    Audit trainee practice logs &amp; reflections, or bulk-enroll students into your roster
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDossierModalOpen(false);
                  setDossierImportPreview([]);
                  setDossierImportError(null);
                  setUploadedFileNames([]);
                }}
                className="absolute top-5 right-5 p-2 rounded-xl text-teal-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700 overflow-y-auto flex-1 min-h-0">
              {/* Accepted Formats Explanation Cards */}
              <div className="space-y-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                  Accepted File Types &amp; Supported Formats:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-teal-950">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <span>1. Word Document (.DOCX)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Upload Word files from academic departments. Automatically extracts students from <strong>Word tables</strong>, numbered lists, or text.
                    </p>
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 bg-teal-100 text-teal-900 rounded-md font-semibold">
                      Accepts: .docx / .doc tables
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <Table className="w-4 h-4 text-teal-700" />
                      <span>2. Cohort Roster (.CSV)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      For bulk-enrolling from spreadsheets: <code>Name, Student ID, Ward, Hospital, Preceptor</code>, or simple <code>Name, ID</code> pairs.
                    </p>
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 bg-slate-200/80 text-slate-800 rounded-md font-semibold">
                      Accepts: .csv / Excel paste
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <FileCode className="w-4 h-4 text-teal-700" />
                      <span>3. Student Dossier (.JSON)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Exported by the trainee via &ldquo;Export Full Backup&rdquo;. Contains profile, all 18 clinical session logs, preceptor ratings, and signatures.
                    </p>
                    <span className="inline-block text-[10px] font-mono px-2 py-0.5 bg-slate-200/80 text-slate-800 rounded-md font-semibold">
                      Accepts: .json (single / batch)
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Templates Download Row */}
              <div className="p-3 bg-teal-50/60 border border-teal-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-[11px] text-teal-950 font-medium">
                  Need a pre-formatted template to fill in your students?
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadSampleRosterDocx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-teal-950 bg-white hover:bg-teal-100 border border-teal-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    title="Download ready-to-use Microsoft Word (.docx) student roster template with pre-built table"
                  >
                    <Download className="w-3 h-3 text-teal-700" />
                    <span>Sample Word Roster (.docx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleRosterCsv}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-600" />
                    <span>Sample Roster (.csv)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSampleDossierJson}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-500" />
                    <span>Sample Dossier (.json)</span>
                  </button>
                </div>
              </div>

              {/* Mode Selector (File Upload vs Direct Paste) */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setDossierImportTab('upload')}
                  className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-colors cursor-pointer ${
                    dossierImportTab === 'upload'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📁 Upload Word / CSV / JSON File(s)
                </button>
                <button
                  type="button"
                  onClick={() => setDossierImportTab('paste')}
                  className={`px-3 py-1.5 font-semibold text-xs rounded-lg transition-colors cursor-pointer ${
                    dossierImportTab === 'paste'
                      ? 'bg-white text-teal-950 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Paste Names &amp; IDs
                </button>
              </div>

              {/* Upload Tab */}
              {dossierImportTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files) {
                        handleProcessIncomingFiles(e.dataTransfer.files);
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isDragOver
                        ? 'border-teal-600 bg-teal-50/50 scale-[1.01]'
                        : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-teal-700 mx-auto mb-2" />
                    <p className="font-bold text-slate-900 text-xs sm:text-sm">
                      Drag &amp; drop Word document (.docx), cohort roster (.csv), or student dossier (.json) here
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports Word files with tables, bulleted lists, standard spreadsheets, or JSON backups
                    </p>

                    <div className="mt-4">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl cursor-pointer shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Browse Word (.docx), CSV, or JSON Files</span>
                        <input
                          type="file"
                          accept=".docx,.doc,.json,.csv,.txt"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) handleProcessIncomingFiles(e.target.files);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Selected File Banner with Quick Action */}
                  {uploadedFileNames.length > 0 && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-200/80 rounded-xl text-emerald-900 shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            Selected File(s): {uploadedFileNames.join(', ')}
                          </p>
                          <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                            ✓ {dossierImportPreview.length} student record(s) parsed and ready
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExecuteImport(dossierImportPreview)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Confirm &amp; Import Now ({dossierImportPreview.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Paste Text Tab */}
              {dossierImportTab === 'paste' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">
                      Paste student names &amp; IDs (one per line, CSV, tab-delimited, or JSON):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const example =
                          'Bethlehem Tadesse, NCEP-2026-089\n' +
                          'Yonas Bekele, NCEP-2026-092\n' +
                          'Selamawit Desta, NCEP-2026-095\n' +
                          'Tewodros Girma, NCEP-2026-098';
                        setDossierRawText(example);
                        handleParseRawText(example);
                      }}
                      className="text-teal-700 hover:text-teal-900 font-semibold underline cursor-pointer"
                    >
                      Fill Example Names &amp; IDs
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={dossierRawText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDossierRawText(val);
                      if (val.trim()) {
                        handleParseRawText(val);
                      } else {
                        setDossierImportPreview([]);
                        setDossierImportError(null);
                      }
                    }}
                    placeholder={`Paste student names & IDs here. Examples accepted:\nBethlehem Tadesse, NCEP-2026-089\nYonas Bekele, NCEP-2026-092\n\nOr paste JSON dossier object / array`}
                    className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 bg-slate-50"
                  />

                  {/* Actions Bar inside Paste Tab */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleParseRawText(dossierRawText);
                      }}
                      className="px-4 py-2 text-xs font-bold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5 text-teal-700" />
                      <span>Parse &amp; Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        let toImport = dossierImportPreview;
                        if (toImport.length === 0 && dossierRawText.trim()) {
                          toImport = handleParseRawText(dossierRawText);
                        }
                        if (toImport && toImport.length > 0) {
                          handleExecuteImport(toImport);
                        } else {
                          setDossierImportError('Please enter at least one student name and ID to import.');
                        }
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        dossierImportPreview.length > 0 || dossierRawText.trim().length > 0
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                      disabled={dossierImportPreview.length === 0 && dossierRawText.trim().length === 0}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>
                        {dossierImportPreview.length > 0
                          ? `Confirm & Import ${dossierImportPreview.length} Student${dossierImportPreview.length === 1 ? '' : 's'}`
                          : 'Confirm & Import Students'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {dossierImportError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">Import Notice</p>
                    <p className="text-[11px] text-rose-800 mt-0.5">{dossierImportError}</p>
                  </div>
                </div>
              )}

              {/* Preview Section when records parsed */}
              {dossierImportPreview.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                  {/* Top Preview Action Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="font-bold text-xs">
                          {dossierImportPreview.length} Student Record{dossierImportPreview.length === 1 ? '' : 's'} Verified &amp; Ready
                        </span>
                        <p className="text-[11px] text-emerald-800">
                          Click below to enroll students into your active cohort roster
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExecuteImport(dossierImportPreview)}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ring-2 ring-emerald-500/30"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Confirm &amp; Import Now ({dossierImportPreview.length})</span>
                    </button>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-200/80 text-slate-700 sticky top-0 font-bold z-10">
                        <tr>
                          <th className="p-2 pl-3">Student Name</th>
                          <th className="p-2">Student ID</th>
                          <th className="p-2">Ward / Dept</th>
                          <th className="p-2">Sessions Status</th>
                          <th className="p-2 pr-3">Preceptor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {dossierImportPreview.map((s, idx) => {
                          const metCount = s.detailedLogs.filter((l) => l.status === 'Met').length;
                          return (
                            <tr
                              key={`preview-student-row-${s.id || s.traineeInfo.traineeId || idx}-${idx}`}
                              className="hover:bg-teal-50/50"
                            >
                              <td className="p-2 pl-3 font-semibold text-slate-900">
                                {s.traineeInfo.traineeName || 'Unnamed Trainee'}
                              </td>
                              <td className="p-2 font-mono text-[10px] text-slate-700 font-bold">
                                {s.traineeInfo.traineeId}
                              </td>
                              <td className="p-2 text-slate-600">
                                {s.traineeInfo.clinicalDepartmentWard}
                              </td>
                              <td className="p-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    metCount > 0
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {metCount > 0 ? `${metCount} / 18 Met` : 'New Enrollment'}
                                </span>
                              </td>
                              <td className="p-2 pr-3 text-slate-600 text-[10px]">
                                {s.traineeInfo.assignedClinicalPreceptor || 'Unassigned'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Footer (ALWAYS VISIBLE & DOCKED) */}
            <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 shadow-md">
              <div className="flex items-center gap-2">
                {dossierImportPreview.length > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{dossierImportPreview.length} Student Record{dossierImportPreview.length > 1 ? 's' : ''} Ready to Import</span>
                  </span>
                ) : dossierRawText.trim().length > 0 ? (
                  <span className="text-xs text-teal-800 font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse" />
                    <span>Pasted student data detected. Ready to confirm.</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Upload a file or paste student names &amp; IDs above</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsDossierModalOpen(false);
                    setDossierImportPreview([]);
                    setDossierImportError(null);
                    setUploadedFileNames([]);
                  }}
                  className="px-4 py-2 font-semibold text-xs text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    let toImport = dossierImportPreview;
                    if (toImport.length === 0 && dossierRawText.trim()) {
                      toImport = handleParseRawText(dossierRawText);
                    }
                    if (toImport && toImport.length > 0) {
                      handleExecuteImport(toImport);
                    } else {
                      setDossierImportError('Please upload a file or paste student records first.');
                    }
                  }}
                  className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    dossierImportPreview.length > 0 || dossierRawText.trim().length > 0
                      ? 'bg-teal-700 hover:bg-teal-800 text-white hover:shadow-lg ring-2 ring-teal-500/30'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                  disabled={dossierImportPreview.length === 0 && dossierRawText.trim().length === 0}
                  title={
                    dossierImportPreview.length > 0
                      ? `Click to import ${dossierImportPreview.length} student records into your cohort`
                      : 'Click to import students'
                  }
                >
                  <CheckCircle2 className={`w-4 h-4 ${dossierImportPreview.length > 0 || dossierRawText.trim().length > 0 ? 'text-emerald-300' : 'text-slate-400'}`} />
                  <span>
                    {dossierImportPreview.length > 0
                      ? `Confirm & Import ${dossierImportPreview.length} Student${dossierImportPreview.length === 1 ? '' : 's'}`
                      : 'Confirm & Import Students'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
