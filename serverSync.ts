import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'ncep_store.json');

export interface SyncEvent {
  id: string;
  type: 'STUDENT_UPDATED' | 'EVALUATION_SIGNED' | 'COHORT_SYNCED' | 'PRECEPTORS_UPDATED';
  studentId?: string;
  studentName?: string;
  source: 'trainee' | 'preceptor' | 'system';
  message: string;
  timestamp: string;
  details?: any;
}

interface ServerStore {
  cohortStudents: any[];
  preceptors: any[];
  lastUpdated: string;
}

export const OFFICIAL_INITIAL_PRECEPTORS = [
  {
    "id": "prec-batch-1792140406864-0",
    "name": "Abaynesh Mekonnen",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "2657",
    "initials": "AM",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-1",
    "name": "Aklil Hailu",
    "title": "Mentor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "2356",
    "initials": "AH",
    "role": "mentor"
  },
  {
    "id": "prec-batch-1792140406864-2",
    "name": "Amina Beshir",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "7772",
    "initials": "AB",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-3",
    "name": "Asselefech Negewo",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "3820",
    "initials": "AN",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-4",
    "name": "Boka Dugasa",
    "title": "Mentor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "6647",
    "initials": "BD",
    "role": "mentor"
  },
  {
    "id": "prec-batch-1792140406864-5",
    "name": "Getachew Wodajo",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "5589",
    "initials": "GW",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-6",
    "name": "Jembere Tesfaye",
    "title": "Mentor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "2236",
    "initials": "JT",
    "role": "mentor"
  },
  {
    "id": "prec-batch-1792140406864-7",
    "name": "Kono Tadese",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "9378",
    "initials": "KT",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-8",
    "name": "Meriem Seid",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "9270",
    "initials": "MS",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-9",
    "name": "Mohamed Legas",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "6979",
    "initials": "ML",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-10",
    "name": "Teje Tufa",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "9141",
    "initials": "TT",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406864-11",
    "name": "Tiruneh Ararsa",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "2902",
    "initials": "TA",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406865-12",
    "name": "Wondossen Tekileselasie",
    "title": "Clinical Preceptor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "3077",
    "initials": "WT",
    "role": "preceptor"
  },
  {
    "id": "prec-batch-1792140406865-13",
    "name": "Zeleke Argaw",
    "title": "Mentor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "8148",
    "initials": "ZA",
    "role": "mentor"
  },
  {
    "id": "prec-batch-1792140406865-14",
    "name": "Zuriash Mengistu",
    "title": "Mentor",
    "wardDepartment": "Clinical Rotation Ward",
    "pin": "5217",
    "initials": "ZM",
    "role": "mentor"
  },
  {
    "id": "prec-1792140612358",
    "name": "Mr. Yohannes Ayalew",
    "title": "Program Coordinator",
    "role": "lead_educator",
    "wardDepartment": "Medical-Surgical",
    "pin": "4182",
    "initials": "LE"
  }
];

// In-memory cache
let inMemoryStore: ServerStore = {
  cohortStudents: [
    {
        "id": "student-roster-NCEP-063-26-1792135243668-0",
        "traineeInfo": {
            "traineeName": "Zinet Kiflie Lulsegd",
            "traineeId": "NCEP-063-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T08:42:25.141Z"
    },
    {
        "id": "student-roster-NCEP-025-26-1792135229550-0",
        "traineeInfo": {
            "traineeName": "Zekarias Mengist Andargie",
            "traineeId": "NCEP-025-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:20:39.370Z"
    },
    {
        "id": "student-roster-NCEP-024-26-1792135207204-0",
        "traineeInfo": {
            "traineeName": "Yohannes Godie Ashebir",
            "traineeId": "NCEP-024-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:20:30.110Z"
    },
    {
        "id": "student-roster-NCEP-047-26-1792135191125-0",
        "traineeInfo": {
            "traineeName": "Yitayeh Getinet Enyew,",
            "traineeId": "NCEP-047-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:20:08.059Z"
    },
    {
        "id": "student-roster-NCEP -08-26-1792135173309-0",
        "traineeInfo": {
            "traineeName": "Yewubdar Alemu Marie",
            "traineeId": "NCEP -08-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:19:50.427Z"
    },
    {
        "id": "student-roster-NCEP-056-26-1792135157784-0",
        "traineeInfo": {
            "traineeName": "Yetinayet Yewondwossen",
            "traineeId": "NCEP-056-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:19:35.064Z"
    },
    {
        "id": "student-roster-NCEP-062-26-1792135136697-0",
        "traineeInfo": {
            "traineeName": "Wubetu Alene Dessie",
            "traineeId": "NCEP-062-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:19:11.173Z"
    },
    {
        "id": "student-roster-NCEP-054-26-1792135118490-0",
        "traineeInfo": {
            "traineeName": "Wako Hajimekura Hawas",
            "traineeId": "NCEP-054-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:59.063Z"
    },
    {
        "id": "student-roster-NCEP-010-26-1792135104269-0",
        "traineeInfo": {
            "traineeName": "Tadelu Korsa Alemu",
            "traineeId": "NCEP-010-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:41.055Z"
    },
    {
        "id": "student-roster-NCEP-037-26-1792135086052-0",
        "traineeInfo": {
            "traineeName": "Sitotaw Molla",
            "traineeId": "NCEP-037-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:27.062Z"
    },
    {
        "id": "student-roster-NCEP-067-26-1792135071413-0",
        "traineeInfo": {
            "traineeName": "Rahel Gedif Chekol",
            "traineeId": "NCEP-067-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:01.826Z"
    },
    {
        "id": "student-roster-NCEP-039-26-1792135056811-0",
        "traineeInfo": {
            "traineeName": "Nigusu Nigat Mengaw",
            "traineeId": "NCEP-039-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:17:48.363Z"
    },
    {
        "id": "student-roster-NCEP-02-26-1792135041457-0",
        "traineeInfo": {
            "traineeName": "Negasa Matiwos Gadisa",
            "traineeId": "NCEP-02-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:17:39.058Z"
    },
    {
        "id": "student-roster-NCEP-058-26-1792135024265-0",
        "traineeInfo": {
            "traineeName": "Nebere Elias Hankamo",
            "traineeId": "NCEP-058-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:17:23.054Z"
    },
    {
        "id": "student-roster-NCEP-05-26-1792134999590-0",
        "traineeInfo": {
            "traineeName": "Mustefa Hussen Jarso",
            "traineeId": "NCEP-05-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:16:49.688Z"
    },
    {
        "id": "student-roster-NCEP-022-26-1792134978684-0",
        "traineeInfo": {
            "traineeName": "Mulusew Tewelign Mandie",
            "traineeId": "NCEP-022-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:16:40.193Z"
    },
    {
        "id": "student-roster-NCEP-064-26-1792134954681-0",
        "traineeInfo": {
            "traineeName": "Mulachew Nigatu Anshebo",
            "traineeId": "NCEP-064-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:16:13.209Z"
    },
    {
        "id": "student-roster-NCEP-061-26-1792134924220-0",
        "traineeInfo": {
            "traineeName": "Muktar Yesuf Hasan",
            "traineeId": "NCEP-061-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:15:42.838Z"
    },
    {
        "id": "student-roster-NCEP-03-26-1792134903074-0",
        "traineeInfo": {
            "traineeName": "Molla Ayalew Tefera",
            "traineeId": "NCEP-03-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:15:17.692Z"
    },
    {
        "id": "student-roster-NCEP-011-26-1792134881800-0",
        "traineeInfo": {
            "traineeName": "Mohammednur Bushura Adiro",
            "traineeId": "NCEP-011-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:52.675Z"
    },
    {
        "id": "student-roster-NCEP-050-26-1792134861653-0",
        "traineeInfo": {
            "traineeName": "Melaku Addise Mekonen",
            "traineeId": "NCEP-050-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:41.050Z"
    },
    {
        "id": "student-roster-NCEP-027-26-1792134845542-0",
        "traineeInfo": {
            "traineeName": "Megersa Hailu Abetu",
            "traineeId": "NCEP-027-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:16.093Z"
    },
    {
        "id": "student-roster-NCEP-014-26-1792134827885-0",
        "traineeInfo": {
            "traineeName": "Liya Ahmiti Mohammed",
            "traineeId": "NCEP-014-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:07.112Z"
    },
    {
        "id": "student-roster-NCEP-012-26-1792134811564-0",
        "traineeInfo": {
            "traineeName": "Lidya Temesgen Dirirsa,",
            "traineeId": "NCEP-012-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:13:51.064Z"
    },
    {
        "id": "student-roster-NCEP-028-26-1792134788177-0",
        "traineeInfo": {
            "traineeName": "Kuma Adugna Debele",
            "traineeId": "NCEP-028-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:13:21.850Z"
    },
    {
        "id": "student-roster-NCEP-029-26-1792134771686-0",
        "traineeInfo": {
            "traineeName": "Kiya Daba Guluma",
            "traineeId": "NCEP-029-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:13:08.572Z"
    },
    {
        "id": "student-roster-NCEP-066-26-1792134737030-0",
        "traineeInfo": {
            "traineeName": "kitila Dinkisa Idesa",
            "traineeId": "NCEP-066-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:12:29.947Z"
    },
    {
        "id": "student-roster-NCEP-04-26-1792134691653-0",
        "traineeInfo": {
            "traineeName": "Kasim sherefa ahmed",
            "traineeId": "NCEP-04-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:11:48.681Z"
    },
    {
        "id": "student-roster-NCEP-045-26-1792134668786-0",
        "traineeInfo": {
            "traineeName": "Jabessa Abdisa Tefera",
            "traineeId": "NCEP-045-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:11:18.620Z"
    },
    {
        "id": "student-roster-NCEP-051-26-1792134651113-0",
        "traineeInfo": {
            "traineeName": "Jabesa Fekadu Yadeta",
            "traineeId": "NCEP-051-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:11:04.135Z"
    },
    {
        "id": "student-roster-NCEP-016-26-1792134630328-0",
        "traineeInfo": {
            "traineeName": "Ilala Belay Zeleke",
            "traineeId": "NCEP-016-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:10:40.837Z"
    },
    {
        "id": "student-roster-NCEP-019-26-1792134614201-0",
        "traineeInfo": {
            "traineeName": "Halid Muhammed Ali",
            "traineeId": "NCEP-019-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:10:32.042Z"
    },
    {
        "id": "student-roster-NCEP-059-26-1792134588702-0",
        "traineeInfo": {
            "traineeName": "Hailu Feleke Cherana",
            "traineeId": "NCEP-059-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:10:07.674Z"
    },
    {
        "id": "student-roster-NCEP-041-26-1792134570032-0",
        "traineeInfo": {
            "traineeName": "Haile Mekonnen Asayehegn",
            "traineeId": "NCEP-041-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:09:39.872Z"
    },
    {
        "id": "student-roster-NCEP -06-26-1792134551709-0",
        "traineeInfo": {
            "traineeName": "Habtemariam Mulat Alemu",
            "traineeId": "NCEP -06-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:09:27.043Z"
    },
    {
        "id": "student-roster-NCEP-057-26-1792134524002-0",
        "traineeInfo": {
            "traineeName": "Gurmessa Dessale Assegie",
            "traineeId": "NCEP-057-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:56.169Z"
    },
    {
        "id": "student-roster-NECP-018-26-1792134506644-0",
        "traineeInfo": {
            "traineeName": "Gudisa Gemsisa Bekele,",
            "traineeId": "NECP-018-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:37.256Z"
    },
    {
        "id": "student-roster-NCEP-065-26-1792134487649-0",
        "traineeInfo": {
            "traineeName": "Gudina Hambisa Nemera",
            "traineeId": "NCEP-065-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:18.647Z"
    },
    {
        "id": "student-roster-NCEP-038-26-1792134468287-0",
        "traineeInfo": {
            "traineeName": "Gentelman Duri Kedir",
            "traineeId": "NCEP-038-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:00.789Z"
    },
    {
        "id": "student-roster-NCEP-049-26-1792134451755-0",
        "traineeInfo": {
            "traineeName": "Gebeyaw Alemu Fente,",
            "traineeId": "NCEP-049-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:07:43.498Z"
    },
    {
        "id": "student-roster-NCEP-040-26-1792134427205-0",
        "traineeInfo": {
            "traineeName": "Engedawerk Tilahun Fentie",
            "traineeId": "NCEP-040-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:07:22.457Z"
    },
    {
        "id": "student-roster-NCEP-046-26-1792134405510-0",
        "traineeInfo": {
            "traineeName": "Dawit Tigabu Amare",
            "traineeId": "NCEP-046-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:06:55.382Z"
    },
    {
        "id": "student-roster-NCEP-043-26-1792134382652-0",
        "traineeInfo": {
            "traineeName": "Dame Takalign Gashe",
            "traineeId": "NCEP-043-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:06:34.716Z"
    },
    {
        "id": "student-roster-NCEP-09-26-1792134367748-0",
        "traineeInfo": {
            "traineeName": "Christian Bedlu Merga",
            "traineeId": "NCEP-09-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:06:19.246Z"
    },
    {
        "id": "student-roster-NCEP-055-26-1792134343747-0",
        "traineeInfo": {
            "traineeName": "Bekele Guta Geda",
            "traineeId": "NCEP-055-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:05:54.476Z"
    },
    {
        "id": "student-roster-NCEP-044-26-1792134279163-0",
        "traineeInfo": {
            "traineeName": "Bedasa Asefa Workineh",
            "traineeId": "NCEP-044-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:04:49.166Z"
    },
    {
        "id": "student-roster-NCEP-020-26-1792134259560-0",
        "traineeInfo": {
            "traineeName": "Azene Wondayehu",
            "traineeId": "NCEP-020-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:04:31.678Z"
    },
    {
        "id": "student-roster-NCEP-015-26-1792134243203-0",
        "traineeInfo": {
            "traineeName": "Ana Mohammed Aliyi",
            "traineeId": "NCEP-015-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:04:15.033Z"
    },
    {
        "id": "student-roster-NCEP-042-26-1792134220806-0",
        "traineeInfo": {
            "traineeName": "Amanuel Yadeta Ereti",
            "traineeId": "NCEP-042-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:03:51.222Z"
    },
    {
        "id": "student-roster-NCEP-021-26-1792134191143-0",
        "traineeInfo": {
            "traineeName": "Abnet Tsegaye Tolla",
            "traineeId": "NCEP-021-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:03:22.403Z"
    },
    {
        "id": "student-roster-NCEP-030-26-1792134154132-0",
        "traineeInfo": {
            "traineeName": "Abel Gatew Cherkos",
            "traineeId": "NCEP-030-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:02:58.278Z"
    },
    {
        "id": "student-roster-NCEP-052-26-1792133226450-0",
        "traineeInfo": {
            "traineeName": "Abdisa Beyene Gutema,",
            "traineeId": "NCEP-052-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T06:58:21.524Z"
    }
],
    preceptors: OFFICIAL_INITIAL_PRECEPTORS,
  lastUpdated: new Date().toISOString(),
};

const recentEvents: SyncEvent[] = [];
const connectedClients = new Set<WebSocket>();

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadStoreFromDisk() {
  try {
    ensureDataDirectory();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cohortStudents)) {
        const seenIds = new Set<string>();
        const sanitized: any[] = [];
        for (let i = 0; i < parsed.cohortStudents.length; i++) {
          const item = parsed.cohortStudents[i];
          if (!item || !item.traineeInfo) continue;
          let safeId = item.id || `student-${Date.now()}-${i}`;
          if (seenIds.has(safeId)) {
            safeId = `${safeId}-${i}`;
          }
          seenIds.add(safeId);
          sanitized.push({ ...item, id: safeId });
        }

        const preceptorsList =
          Array.isArray(parsed.preceptors) && parsed.preceptors.length > 0
            ? parsed.preceptors
            : OFFICIAL_INITIAL_PRECEPTORS;

        inMemoryStore = {
          ...parsed,
          cohortStudents: sanitized,
          preceptors: preceptorsList,
        };

        if (!Array.isArray(parsed.preceptors) || parsed.preceptors.length === 0) {
          saveStoreToDisk();
        }

        console.log(`[CloudSync] Loaded ${inMemoryStore.cohortStudents.length} students and ${inMemoryStore.preceptors.length} preceptors from disk store.`);
        return;
      }
    }
  } catch (err) {
    console.error('[CloudSync] Failed to read store from disk:', err);
  }

  // Fallback initial state if file doesn't exist
  inMemoryStore = {
    cohortStudents: [
    {
        "id": "student-roster-NCEP-063-26-1792135243668-0",
        "traineeInfo": {
            "traineeName": "Zinet Kiflie Lulsegd",
            "traineeId": "NCEP-063-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T08:42:25.141Z"
    },
    {
        "id": "student-roster-NCEP-025-26-1792135229550-0",
        "traineeInfo": {
            "traineeName": "Zekarias Mengist Andargie",
            "traineeId": "NCEP-025-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:20:39.370Z"
    },
    {
        "id": "student-roster-NCEP-024-26-1792135207204-0",
        "traineeInfo": {
            "traineeName": "Yohannes Godie Ashebir",
            "traineeId": "NCEP-024-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:20:30.110Z"
    },
    {
        "id": "student-roster-NCEP-047-26-1792135191125-0",
        "traineeInfo": {
            "traineeName": "Yitayeh Getinet Enyew,",
            "traineeId": "NCEP-047-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:20:08.059Z"
    },
    {
        "id": "student-roster-NCEP -08-26-1792135173309-0",
        "traineeInfo": {
            "traineeName": "Yewubdar Alemu Marie",
            "traineeId": "NCEP -08-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:19:50.427Z"
    },
    {
        "id": "student-roster-NCEP-056-26-1792135157784-0",
        "traineeInfo": {
            "traineeName": "Yetinayet Yewondwossen",
            "traineeId": "NCEP-056-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:19:35.064Z"
    },
    {
        "id": "student-roster-NCEP-062-26-1792135136697-0",
        "traineeInfo": {
            "traineeName": "Wubetu Alene Dessie",
            "traineeId": "NCEP-062-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:19:11.173Z"
    },
    {
        "id": "student-roster-NCEP-054-26-1792135118490-0",
        "traineeInfo": {
            "traineeName": "Wako Hajimekura Hawas",
            "traineeId": "NCEP-054-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:59.063Z"
    },
    {
        "id": "student-roster-NCEP-010-26-1792135104269-0",
        "traineeInfo": {
            "traineeName": "Tadelu Korsa Alemu",
            "traineeId": "NCEP-010-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:41.055Z"
    },
    {
        "id": "student-roster-NCEP-037-26-1792135086052-0",
        "traineeInfo": {
            "traineeName": "Sitotaw Molla",
            "traineeId": "NCEP-037-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:27.062Z"
    },
    {
        "id": "student-roster-NCEP-067-26-1792135071413-0",
        "traineeInfo": {
            "traineeName": "Rahel Gedif Chekol",
            "traineeId": "NCEP-067-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:18:01.826Z"
    },
    {
        "id": "student-roster-NCEP-039-26-1792135056811-0",
        "traineeInfo": {
            "traineeName": "Nigusu Nigat Mengaw",
            "traineeId": "NCEP-039-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:17:48.363Z"
    },
    {
        "id": "student-roster-NCEP-02-26-1792135041457-0",
        "traineeInfo": {
            "traineeName": "Negasa Matiwos Gadisa",
            "traineeId": "NCEP-02-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:17:39.058Z"
    },
    {
        "id": "student-roster-NCEP-058-26-1792135024265-0",
        "traineeInfo": {
            "traineeName": "Nebere Elias Hankamo",
            "traineeId": "NCEP-058-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:17:23.054Z"
    },
    {
        "id": "student-roster-NCEP-05-26-1792134999590-0",
        "traineeInfo": {
            "traineeName": "Mustefa Hussen Jarso",
            "traineeId": "NCEP-05-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:16:49.688Z"
    },
    {
        "id": "student-roster-NCEP-022-26-1792134978684-0",
        "traineeInfo": {
            "traineeName": "Mulusew Tewelign Mandie",
            "traineeId": "NCEP-022-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:16:40.193Z"
    },
    {
        "id": "student-roster-NCEP-064-26-1792134954681-0",
        "traineeInfo": {
            "traineeName": "Mulachew Nigatu Anshebo",
            "traineeId": "NCEP-064-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:16:13.209Z"
    },
    {
        "id": "student-roster-NCEP-061-26-1792134924220-0",
        "traineeInfo": {
            "traineeName": "Muktar Yesuf Hasan",
            "traineeId": "NCEP-061-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:15:42.838Z"
    },
    {
        "id": "student-roster-NCEP-03-26-1792134903074-0",
        "traineeInfo": {
            "traineeName": "Molla Ayalew Tefera",
            "traineeId": "NCEP-03-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:15:17.692Z"
    },
    {
        "id": "student-roster-NCEP-011-26-1792134881800-0",
        "traineeInfo": {
            "traineeName": "Mohammednur Bushura Adiro",
            "traineeId": "NCEP-011-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:52.675Z"
    },
    {
        "id": "student-roster-NCEP-050-26-1792134861653-0",
        "traineeInfo": {
            "traineeName": "Melaku Addise Mekonen",
            "traineeId": "NCEP-050-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:41.050Z"
    },
    {
        "id": "student-roster-NCEP-027-26-1792134845542-0",
        "traineeInfo": {
            "traineeName": "Megersa Hailu Abetu",
            "traineeId": "NCEP-027-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:16.093Z"
    },
    {
        "id": "student-roster-NCEP-014-26-1792134827885-0",
        "traineeInfo": {
            "traineeName": "Liya Ahmiti Mohammed",
            "traineeId": "NCEP-014-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:14:07.112Z"
    },
    {
        "id": "student-roster-NCEP-012-26-1792134811564-0",
        "traineeInfo": {
            "traineeName": "Lidya Temesgen Dirirsa,",
            "traineeId": "NCEP-012-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:13:51.064Z"
    },
    {
        "id": "student-roster-NCEP-028-26-1792134788177-0",
        "traineeInfo": {
            "traineeName": "Kuma Adugna Debele",
            "traineeId": "NCEP-028-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:13:21.850Z"
    },
    {
        "id": "student-roster-NCEP-029-26-1792134771686-0",
        "traineeInfo": {
            "traineeName": "Kiya Daba Guluma",
            "traineeId": "NCEP-029-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:13:08.572Z"
    },
    {
        "id": "student-roster-NCEP-066-26-1792134737030-0",
        "traineeInfo": {
            "traineeName": "kitila Dinkisa Idesa",
            "traineeId": "NCEP-066-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:12:29.947Z"
    },
    {
        "id": "student-roster-NCEP-04-26-1792134691653-0",
        "traineeInfo": {
            "traineeName": "Kasim sherefa ahmed",
            "traineeId": "NCEP-04-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:11:48.681Z"
    },
    {
        "id": "student-roster-NCEP-045-26-1792134668786-0",
        "traineeInfo": {
            "traineeName": "Jabessa Abdisa Tefera",
            "traineeId": "NCEP-045-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:11:18.620Z"
    },
    {
        "id": "student-roster-NCEP-051-26-1792134651113-0",
        "traineeInfo": {
            "traineeName": "Jabesa Fekadu Yadeta",
            "traineeId": "NCEP-051-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:11:04.135Z"
    },
    {
        "id": "student-roster-NCEP-016-26-1792134630328-0",
        "traineeInfo": {
            "traineeName": "Ilala Belay Zeleke",
            "traineeId": "NCEP-016-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:10:40.837Z"
    },
    {
        "id": "student-roster-NCEP-019-26-1792134614201-0",
        "traineeInfo": {
            "traineeName": "Halid Muhammed Ali",
            "traineeId": "NCEP-019-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:10:32.042Z"
    },
    {
        "id": "student-roster-NCEP-059-26-1792134588702-0",
        "traineeInfo": {
            "traineeName": "Hailu Feleke Cherana",
            "traineeId": "NCEP-059-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:10:07.674Z"
    },
    {
        "id": "student-roster-NCEP-041-26-1792134570032-0",
        "traineeInfo": {
            "traineeName": "Haile Mekonnen Asayehegn",
            "traineeId": "NCEP-041-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:09:39.872Z"
    },
    {
        "id": "student-roster-NCEP -06-26-1792134551709-0",
        "traineeInfo": {
            "traineeName": "Habtemariam Mulat Alemu",
            "traineeId": "NCEP -06-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:09:27.043Z"
    },
    {
        "id": "student-roster-NCEP-057-26-1792134524002-0",
        "traineeInfo": {
            "traineeName": "Gurmessa Dessale Assegie",
            "traineeId": "NCEP-057-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:56.169Z"
    },
    {
        "id": "student-roster-NECP-018-26-1792134506644-0",
        "traineeInfo": {
            "traineeName": "Gudisa Gemsisa Bekele,",
            "traineeId": "NECP-018-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:37.256Z"
    },
    {
        "id": "student-roster-NCEP-065-26-1792134487649-0",
        "traineeInfo": {
            "traineeName": "Gudina Hambisa Nemera",
            "traineeId": "NCEP-065-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:18.647Z"
    },
    {
        "id": "student-roster-NCEP-038-26-1792134468287-0",
        "traineeInfo": {
            "traineeName": "Gentelman Duri Kedir",
            "traineeId": "NCEP-038-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:08:00.789Z"
    },
    {
        "id": "student-roster-NCEP-049-26-1792134451755-0",
        "traineeInfo": {
            "traineeName": "Gebeyaw Alemu Fente,",
            "traineeId": "NCEP-049-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:07:43.498Z"
    },
    {
        "id": "student-roster-NCEP-040-26-1792134427205-0",
        "traineeInfo": {
            "traineeName": "Engedawerk Tilahun Fentie",
            "traineeId": "NCEP-040-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:07:22.457Z"
    },
    {
        "id": "student-roster-NCEP-046-26-1792134405510-0",
        "traineeInfo": {
            "traineeName": "Dawit Tigabu Amare",
            "traineeId": "NCEP-046-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:06:55.382Z"
    },
    {
        "id": "student-roster-NCEP-043-26-1792134382652-0",
        "traineeInfo": {
            "traineeName": "Dame Takalign Gashe",
            "traineeId": "NCEP-043-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:06:34.716Z"
    },
    {
        "id": "student-roster-NCEP-09-26-1792134367748-0",
        "traineeInfo": {
            "traineeName": "Christian Bedlu Merga",
            "traineeId": "NCEP-09-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:06:19.246Z"
    },
    {
        "id": "student-roster-NCEP-055-26-1792134343747-0",
        "traineeInfo": {
            "traineeName": "Bekele Guta Geda",
            "traineeId": "NCEP-055-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:05:54.476Z"
    },
    {
        "id": "student-roster-NCEP-044-26-1792134279163-0",
        "traineeInfo": {
            "traineeName": "Bedasa Asefa Workineh",
            "traineeId": "NCEP-044-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:04:49.166Z"
    },
    {
        "id": "student-roster-NCEP-020-26-1792134259560-0",
        "traineeInfo": {
            "traineeName": "Azene Wondayehu",
            "traineeId": "NCEP-020-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:04:31.678Z"
    },
    {
        "id": "student-roster-NCEP-015-26-1792134243203-0",
        "traineeInfo": {
            "traineeName": "Ana Mohammed Aliyi",
            "traineeId": "NCEP-015-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:04:15.033Z"
    },
    {
        "id": "student-roster-NCEP-042-26-1792134220806-0",
        "traineeInfo": {
            "traineeName": "Amanuel Yadeta Ereti",
            "traineeId": "NCEP-042-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:03:51.222Z"
    },
    {
        "id": "student-roster-NCEP-021-26-1792134191143-0",
        "traineeInfo": {
            "traineeName": "Abnet Tsegaye Tolla",
            "traineeId": "NCEP-021-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:03:22.403Z"
    },
    {
        "id": "student-roster-NCEP-030-26-1792134154132-0",
        "traineeInfo": {
            "traineeName": "Abel Gatew Cherkos",
            "traineeId": "NCEP-030-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T07:02:58.278Z"
    },
    {
        "id": "student-roster-NCEP-052-26-1792133226450-0",
        "traineeInfo": {
            "traineeName": "Abdisa Beyene Gutema,",
            "traineeId": "NCEP-052-26",
            "clinicalDepartmentWard": "Medical ICU",
            "assignedClinicalPreceptor": "Sister Almaz Tefera, RN, MSc",
            "trainingPeriodFrom": "",
            "trainingPeriodTo": ""
        },
        "detailedLogs": [],
        "finalSignoff": {
            "isCertified": false,
            "leadEducatorName": "",
            "leadEducatorTitle": "Lead Clinical Educator / Program Coordinator"
        },
        "updatedAt": "2026-10-16T06:58:21.524Z"
    }
],
    preceptors: OFFICIAL_INITIAL_PRECEPTORS,
    lastUpdated: new Date().toISOString(),
  };

  saveStoreToDisk();
}

function saveStoreToDisk() {
  try {
    ensureDataDirectory();
    inMemoryStore.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CloudSync] Failed to write store to disk:', err);
  }
}

// Broadcast helper to all connected clients
export function broadcastToAll(payload: any, excludeWs?: WebSocket) {
  const messageStr = JSON.stringify(payload);
  connectedClients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(messageStr);
      } catch (err) {
        console.error('[CloudSync] Error sending to WS client:', err);
      }
    }
  });
}

export function logSyncEvent(
  type: SyncEvent['type'],
  source: SyncEvent['source'],
  message: string,
  studentId?: string,
  studentName?: string,
  details?: any
): SyncEvent {
  const event: SyncEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    source,
    message,
    studentId,
    studentName,
    timestamp: new Date().toISOString(),
    details,
  };

  recentEvents.unshift(event);
  if (recentEvents.length > 100) {
    recentEvents.pop();
  }

  // Broadcast event to all WebSocket clients
  broadcastToAll({
    type: 'SYNC_EVENT',
    event,
  });

  return event;
}

export function getSyncState() {
  return {
    cohortStudents: inMemoryStore.cohortStudents,
    preceptors: inMemoryStore.preceptors,
    lastUpdated: inMemoryStore.lastUpdated,
    activeConnections: connectedClients.size,
  };
}

export function updateOrSaveStudent(student: any, source: 'trainee' | 'preceptor' = 'trainee', message?: string) {
  if (!student || (!student.id && !student.traineeInfo?.traineeId)) {
    throw new Error('Invalid student data');
  }

  const studentId = student.id || student.traineeInfo?.traineeId;
  const studentName = student.traineeInfo?.traineeName || 'Trainee';

  const existingIdx = inMemoryStore.cohortStudents.findIndex(
    (s) => s.id === studentId || s.traineeInfo?.traineeId === student.traineeInfo?.traineeId
  );

  const updatedRecord = {
    ...student,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    inMemoryStore.cohortStudents[existingIdx] = updatedRecord;
  } else {
    inMemoryStore.cohortStudents.unshift(updatedRecord);
  }

  saveStoreToDisk();

  const defaultMsg =
    source === 'preceptor'
      ? `Preceptor updated evaluation for ${studentName}`
      : `Trainee ${studentName} updated logbook`;

  const event = logSyncEvent(
    'STUDENT_UPDATED',
    source,
    message || defaultMsg,
    studentId,
    studentName,
    { student: updatedRecord }
  );

  // Broadcast the updated student to all clients
  broadcastToAll({
    type: 'STUDENT_UPDATED',
    student: updatedRecord,
    source,
    event,
    timestamp: new Date().toISOString(),
  });

  return { student: updatedRecord, event };
}

export function updateCohortRoster(cohort: any[], source: 'trainee' | 'preceptor' = 'preceptor') {
  if (!Array.isArray(cohort)) return inMemoryStore.cohortStudents;

  const seenIds = new Set<string>();
  const sanitized = cohort.map((item, idx) => {
    let safeId = item.id || `student-${Date.now()}-${idx}`;
    if (seenIds.has(safeId)) {
      safeId = `${safeId}-${idx}`;
    }
    seenIds.add(safeId);
    return { ...item, id: safeId };
  });

  inMemoryStore.cohortStudents = sanitized;
  saveStoreToDisk();

  const event = logSyncEvent(
    'COHORT_SYNCED',
    source,
    `Cohort roster synced with ${sanitized.length} students`
  );

  broadcastToAll({
    type: 'COHORT_UPDATED',
    cohortStudents: sanitized,
    source,
    event,
  });

  return inMemoryStore.cohortStudents;
}

export function updatePreceptorsRoster(preceptors: any[]) {
  if (!Array.isArray(preceptors)) return inMemoryStore.preceptors;

  inMemoryStore.preceptors = preceptors;
  saveStoreToDisk();

  const event = logSyncEvent(
    'PRECEPTORS_UPDATED',
    'preceptor',
    `Preceptors directory updated (${preceptors.length} instructors)`
  );

  broadcastToAll({
    type: 'PRECEPTORS_UPDATED',
    preceptors,
    event,
  });

  return inMemoryStore.preceptors;
}

export function getEventsSince(sinceTimestamp?: string) {
  if (!sinceTimestamp) return recentEvents.slice(0, 30);
  const sinceTime = new Date(sinceTimestamp).getTime();
  return recentEvents.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
}

// WebSocket initialization
export function setupRealtimeWebSocket(server: http.Server) {
  // Load data immediately on boot
  loadStoreFromDisk();

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/sync') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.error('[CloudSync] WS Upgrade error:', err);
    }
  });

  wss.on('connection', (ws: WebSocket, req) => {
    connectedClients.add(ws);
    console.log(`[CloudSync] Client connected. Total live devices: ${connectedClients.size}`);

    // Send initial greeting & full state
    try {
      ws.send(
        JSON.stringify({
          type: 'INIT_STATE',
          state: getSyncState(),
          message: 'Connected to NCEP Real-Time Cross-Device Sync Server',
          timestamp: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('[CloudSync] Error sending INIT_STATE:', e);
    }

    ws.on('message', (data: string) => {
      try {
        const payload = JSON.parse(data.toString());

        if (payload.type === 'SYNC_STUDENT') {
          updateOrSaveStudent(payload.student, payload.source || 'trainee', payload.message);
        } else if (payload.type === 'SYNC_COHORT') {
          updateCohortRoster(payload.cohortStudents, payload.source || 'preceptor');
        } else if (payload.type === 'SYNC_PRECEPTORS') {
          updatePreceptorsRoster(payload.preceptors);
        } else if (payload.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
        }
      } catch (err) {
        console.error('[CloudSync] Error parsing WS message:', err);
      }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log(`[CloudSync] Client disconnected. Total live devices: ${connectedClients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[CloudSync] Client WS error:', err);
      connectedClients.delete(ws);
    });
  });

  // Heartbeat every 25 seconds to keep connection alive through any proxies
  const interval = setInterval(() => {
    connectedClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (e) {
          connectedClients.delete(ws);
        }
      } else {
        connectedClients.delete(ws);
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return { wss, connectedClients };
}
