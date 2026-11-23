import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';

// -------------------------------------------------------------
// FORMATTING HELPERS
// -------------------------------------------------------------

function createHeading1(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    run: {
      color: '0F766E', // Teal 700
      bold: true,
      size: 30, // 15pt
      font: 'Calibri',
    },
  });
}

function createHeading2(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    run: {
      color: '134E4A', // Teal 900
      bold: true,
      size: 24, // 12pt
      font: 'Calibri',
    },
  });
}

function createHeading3(text: string): Paragraph {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    run: {
      color: '334155', // Slate 700
      bold: true,
      size: 22, // 11pt
      font: 'Calibri',
    },
  });
}

function createBodyParagraph(text: string, isBold: boolean = false): Paragraph {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text,
        bold: isBold,
        size: 22, // 11pt
        font: 'Calibri',
        color: '1E293B',
      }),
    ],
  });
}

function createBulletItem(boldPrefix: string, text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [
      new TextRun({
        text: boldPrefix + ' ',
        bold: true,
        size: 22,
        font: 'Calibri',
        color: '0F766E',
      }),
      new TextRun({
        text: text,
        size: 22,
        font: 'Calibri',
        color: '1E293B',
      }),
    ],
  });
}

function createCalloutBox(title: string, message: string, borderColor: string = '0D9488', bgColor: string = 'F0FDFA'): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: {
              type: ShadingType.CLEAR,
              fill: bgColor,
              color: 'auto',
            },
            borders: {
              top: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
            },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `📌 ${title}: `,
                    bold: true,
                    color: '115E59',
                    size: 22,
                    font: 'Calibri',
                  }),
                  new TextRun({
                    text: message,
                    color: '134E4A',
                    size: 22,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createTable(headers: string[], rows: string[][], headerColor: string = '0F766E'): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              shading: {
                type: ShadingType.CLEAR,
                fill: headerColor,
                color: 'auto',
              },
              margins: { top: 120, bottom: 120, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: h,
                      bold: true,
                      color: 'FFFFFF',
                      size: 20,
                      font: 'Calibri',
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      ...rows.map(
        (row, idx) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  shading: {
                    type: ShadingType.CLEAR,
                    fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF',
                    color: 'auto',
                  },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    left: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                    right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          size: 20,
                          font: 'Calibri',
                          color: '1E293B',
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
      ),
    ],
  });
}

// -------------------------------------------------------------
// 1. GENERATE STUDENT OPERATIONAL MANUAL (.DOCX)
// -------------------------------------------------------------
export async function generateStudentManualDocx(): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Institutional Header
          new Paragraph({
            text: 'NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)',
            alignment: AlignmentType.CENTER,
            run: {
              size: 20,
              font: 'Calibri',
              color: '0F766E',
              bold: true,
            },
          }),
          new Paragraph({
            text: 'CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION',
            alignment: AlignmentType.CENTER,
            run: {
              size: 24,
              font: 'Calibri',
              color: '134E4A',
              bold: true,
            },
          }),
          new Paragraph({
            text: 'STUDENT & CLINICAL NURSE TRAINEE OPERATIONAL MANUAL',
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            run: {
              size: 34,
              font: 'Calibri',
              color: '111827',
              bold: true,
            },
          }),
          createCalloutBox(
            'Target Audience',
            'NCEP Trainees'
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('1. Introduction & Overview'),
          createBodyParagraph(
            'Welcome to the Nursing Competency Enhancement Program (NCEP) digital logbook for Core Competency 1: Clinical Judgment and Prioritization. This system replaces paper record-keeping with an institutional, verifiable clinical portfolio. It enables you to document your daily nursing encounters across 18 specialized sessions, reflect on critical decisions, attach real clinical evidence, and receive secure mentor verifications directly on the ward.'
          ),
          createBodyParagraph(
            'All data entered into this logbook automatically saves to your local browser storage (LocalStorage). Your work is preserved even if you lose internet connectivity or close your browser.'
          ),

          createHeading1('2. Comprehensive Guide to Every Part of the Application'),
          createBodyParagraph(
            'The digital logbook is organized into distinct zones designed for seamless clinical workflow on mobile phones, tablets, and desktop computers:'
          ),

          createTable(
            ['Application Component / Tab', 'Exact Purpose', 'How the Student Uses It'],
            [
              [
                'Top Header Branding Bar',
                'Displays program title, Core Competency 1 badge, trainee identity, and global action buttons.',
                'Verify your active name and ward. Click "Word Manuals" to access guides, or "Print PDF" to print anytime.',
              ],
              [
                'Role Selector Dropdown',
                'Simulates or switches between Trainee, Preceptor, and Lead Educator perspectives.',
                'Keep set to "Trainee". Allows you to review how your preceptors will view your submitted logbook.',
              ],
              [
                'Tab 1: Trainee Information & Instructions',
                'Identity registration (Trainee Name & Trainee ID), individual student PIN security, instructions, and data persistence controls.',
                'Fill in your Trainee Name and Trainee ID so your dossier has a permanent Cloud Database ID. Manage your confidential 4-digit Student PIN and lock your session when stepping away from shared devices.',
              ],
              [
                'Tab 2: Part I - Tracking Matrix',
                '18-Session matrix showing competencies, status (Pending/Met), completion dates, and preceptor stamps.',
                'Inspect your progress bar (0% to 100%). Click "+ Log Task" or "View Log" to jump directly into activity editing.',
              ],
              [
                'Tab 3: Part II - Detailed Log Sheets',
                'The daily clinical recording environment with full case documentation and mentor evaluation cards.',
                'Record Description of Activity Performed, Reflective Notes & Lessons Learned, and request preceptor sign-off.',
              ],
              [
                'Tab 4: Evidence Vault',
                'Central repository for all clinical documents (SBAR handovers, EWS charts, ECG strips, fluid balance sheets).',
                'Audit all uploaded photos and PDFs. Click thumbnails to inspect high-resolution documents in the lightbox.',
              ],
              [
                'Tab 5: OCR Scanner',
                'Automated camera scanner that converts handwritten paper logbooks into digital text.',
                'Take a photo of paper logbook sheets. OCR automatically extracts text into your activity description and notes.',
              ],
              [
                'Tab 6: Cohort & Instructors',
                'Multi-student supervision and clinical faculty directory.',
                'View registered preceptors across hospital wards. Preceptors use this tab to review cohort rosters and PINs.',
              ],
              [
                'Tab 7: Part III - Final Competency Sign-Off',
                'Summative program evaluation, completion milestone verification, and graduation sign-off.',
                'Review your 18/18 completion status. Apply your digital signature once the Lead Educator signs.',
              ],
              [
                'Tab 8: Print Academic Dossier',
                '7-Page official institutional dossier formatted to Ministry of Health & AAU standards.',
                'Generate a certified physical or PDF document containing all entries, signatures, and tamper-proof verification hashes.',
              ],
            ]
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('3. Exhaustive Cursor & Interactive Pointer Guide'),
          createBodyParagraph(
            'In the NursLog application, the cursor changes dynamically based on the element you hover over. Understanding these visual states ensures smooth navigation and avoids confusion:'
          ),

          createTable(
            ['Cursor Look & State', 'Where It Appears in the App', 'What It Signifies & What Action to Take'],
            [
              [
                'Hand Pointer (cursor-pointer 👆)',
                'Tabs, "+ Log Task" buttons, status badges, dropdowns, "+ Attach Evidence" buttons, action cards.',
                'Indicates an active interactive element. Click to open modal, switch tab, toggle dropdown, or trigger action.',
              ],
              [
                'Text I-Beam (cursor-text Ɪ)',
                'Trainee info inputs, search bars, "Description of Activity Performed" and "Reflective Notes" textareas.',
                'Indicates editable text fields. Click to place your typing cursor and write or paste narrative notes.',
              ],
              [
                'Crosshair / Pen (cursor-crosshair ✍️)',
                'Digital signature canvas pads (in Part II Section 3 preceptor evaluation and Part III trainee signature).',
                'Indicates a drawing pad. Click and drag your mouse, finger, or stylus to draw your physical signature.',
              ],
              [
                'Zoom-In Magnifier (cursor-zoom-in 🔍)',
                'Document thumbnails in the Evidence Vault and attached file cards in Part II.',
                'Indicates an image preview. Click to open the full-screen high-resolution lightbox inspector.',
              ],
              [
                'Grab & Move (cursor-grab ✋)',
                'Inside the lightbox modal when inspecting enlarged clinical documents or ECG rhythm strips.',
                'Click and drag to pan across high-resolution clinical charts and read fine medical handwriting.',
              ],
              [
                'Not-Allowed / Lock (cursor-not-allowed 🚫)',
                'Preceptor Feedback rating radio buttons, signature pad when in Trainee mode, disabled buttons.',
                'Indicates restricted security area. Trainees cannot edit preceptor marks without an authorized PIN.',
              ],
              [
                'Wait / Spinner (cursor-wait ⏳)',
                'During Word document export, PDF compilation, and OCR image text processing.',
                'The system is processing data. Please wait 1-3 seconds for file generation to complete.',
              ],
              [
                'Default Arrow (cursor-default 🢕)',
                'Informational banners, competency descriptions, matrix table header rows, static labels.',
                'Non-clickable informational text. Read guidelines and standard operating definitions.',
              ],
            ]
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('4. Step-by-Step Guide: How Students Log Clinical Activities'),
          createHeading2('Step 1: Open the Target Session'),
          createBodyParagraph(
            'Go to "Part I: Tracking Matrix" and locate the session you completed on the ward (e.g. Session 8: Distinguishing Urgent from Routine Patient Needs). In the rightmost column, click the teal "+ Log Task" button (cursor changes to Hand Pointer 👆). This instantly navigates to Part II with that session selected.'
          ),

          createHeading2('Step 2: Complete Section 2 - Clinical Practice & Reflection'),
          createBodyParagraph(
            'Click into each textarea (cursor changes to Text I-Beam Ɪ) and document your clinical experience with professional detail:'
          ),
          createBulletItem(
            'Description of Activity Performed:',
            'Document the clinical case you managed. Detail patient presentation, primary clinical data gathered (vital signs, EWS score, lab values), specific nursing interventions performed, and your rationale for task prioritization.'
          ),
          createBulletItem(
            'Reflective Notes & Lessons Learned:',
            'Reflect on your clinical decision-making. Address: What went well? Did you recognize deterioration early? Were communication and escalation (e.g. SBAR) effective? What challenges arose and what would you do differently next time?'
          ),

          createHeading2('Step 3: Attach Supporting Evidence'),
          createBodyParagraph(
            'Click "+ Attach Evidence" on the activity sheet. Choose "Camera" to snap a photo of your anonymized SBAR handover note, Early Warning Score chart, or ECG strip. Ensure all patient names and identification numbers are blacked out to maintain strict medical confidentiality.'
          ),

          createHeading2('Step 4: Confirm Permanent Cloud Database Save (Pop-Up Verification)'),
          createBodyParagraph(
            'Immediately after you save a log, import OCR text, or attach evidence, wait 1–2 seconds for the Cloud Save Confirmation Pop-Up. You must verify the color and message before closing the app:'
          ),
          createBulletItem(
            'GREEN Pop-Up ("Permanently Saved on Cloud Database"):',
            'Confirmed! Both the Cloud Database and live server verified your entry. Your data is safe across devices and restarts.'
          ),
          createBulletItem(
            'AMBER Pop-Up ("NOT Saved — Connection Problem"):',
            'Your internet was offline or unstable. Your entry is saved on your browser ONLY. Reconnect to Wi-Fi/mobile data and click "Retry Cloud Save" until the GREEN pop-up appears.'
          ),
          createBulletItem(
            'INDIGO Pop-Up ("NOT Saved — Google Sign-In Required"):',
            'You are not signed into Google Cloud DB. Click "Sign in with Google & Save" inside the pop-up so your work is committed permanently.'
          ),
          createBulletItem(
            'ROSE Pop-Up ("NOT Saved — Action Required / Error"):',
            'Read the exact reason shown (for example, missing Trainee Name & ID in Tab 1). Complete Tab 1 first and save again.'
          ),

          createHeading2('Step 5: Request Preceptor Verification'),
          createBodyParagraph(
            'Hand your device to your clinical preceptor or mentor on the ward (or notify them to open your dossier on their device). The preceptor clicks "Sign as Preceptor", enters their confidential 4-digit PIN, provides formative feedback, selects a performance rating, draws their signature, and confirms the GREEN Cloud Save pop-up.'
          ),

          createHeading1('5. Data Persistence, Backups & Submissions'),
          createBodyParagraph(
            'Your logbook uses three layers of protection: (1) Browser LocalStorage for offline resilience, (2) Live Sync Server for real-time cross-device updates, and (3) Firebase Cloud Database (when signed in with Google) for permanent institutional storage. At the bottom of Tab 1 (Trainee Info & Instructions), you will also find manual backup controls:'
          ),
          createBulletItem('Start Fresh / Blank Logbook:', 'Clears all records to begin a new rotation. Use this on Day 1 to wipe sample demo records.'),
          createBulletItem('Restore Demo Sample Data:', 'Populates realistic sample patient encounters for training and practice.'),
          createBulletItem('Backup Logbook (.json):', 'Mandatory weekly habit! Downloads your complete logbook to your device storage.'),
          createBulletItem('Restore from Backup:', 'Uploads your saved `.json` file if switching between phone and computer.'),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('6. Program Completion & Academic Printing'),
          createBodyParagraph(
            'Once all 18 sessions are verified by your preceptors (100% Met), proceed to "Part III: Final Competency Sign-Off". Your Lead Clinical Educator will input the final summative evaluation. Both you and the educator apply digital signatures. Finally, open "Print Academic Dossier" to print or save the official 7-page credential for academic credit.'
          ),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 2. GENERATE PRECEPTOR & MENTOR OPERATIONAL GUIDE (.DOCX)
// -------------------------------------------------------------
export async function generateMentorPreceptorManualDocx(): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Institutional Header
          new Paragraph({
            text: 'NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)',
            alignment: AlignmentType.CENTER,
            run: {
              size: 20,
              font: 'Calibri',
              color: '0F766E',
              bold: true,
            },
          }),
          new Paragraph({
            text: 'CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION',
            alignment: AlignmentType.CENTER,
            run: {
              size: 24,
              font: 'Calibri',
              color: '134E4A',
              bold: true,
            },
          }),
          new Paragraph({
            text: 'CLINICAL PRECEPTOR & MENTOR OPERATIONAL GUIDE',
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            run: {
              size: 34,
              font: 'Calibri',
              color: '111827',
              bold: true,
            },
          }),
          createCalloutBox(
            'Target Audience',
            'Preceptors and Mentors'
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('1. Introduction & Supervisory Mandate'),
          createBodyParagraph(
            'As an authorized Clinical Preceptor or Mentor in the Nursing Competency Enhancement Program (NCEP), your role is pivotal in assessing and mentoring advanced beginner nurses in clinical judgment, acute situational awareness, and safe patient prioritization in critical care and emergency wards.'
          ),
          createBodyParagraph(
            'This application enforces institutional rigor by separating trainee documentation from mentor evaluation. Students can write clinical logs and upload evidence, but ONLY authorized preceptors and mentors can verify competencies, assign "Met" status, and sign evaluations using individual confidential PINs.'
          ),

          createHeading1('2. Comprehensive Guide to Every Part of the Application'),
          createBodyParagraph(
            'The application provides specialized supervisory and administrative tools for instructors:'
          ),

          createTable(
            ['Application Component / Tab', 'Preceptor / Mentor Role & Purpose', 'Operational Actions'],
            [
              [
                'Role Selector Dropdown',
                'Switches active role between Trainee, Preceptor, and Lead Educator.',
                'Select "Preceptor" or "Lead Educator" to unlock supervisory controls and audit views.',
              ],
              [
                'Tab 1: Trainee Info & Instructions',
                'Reviews student institutional details, assigned ward, and preceptor allocation.',
                'Verify that the trainee has entered their correct ID and selected you as their assigned clinical mentor.',
              ],
              [
                'Tab 2: Part I - Tracking Matrix',
                '18-Session competency oversight grid displaying attainment dates and mentor initials.',
                'Perform 1-click quick signing by clicking "Sign Met", entering your PIN, and stamping initials.',
              ],
              [
                'Tab 3: Part II - Detailed Log Sheets',
                'Detailed formative evaluation workspace for each student clinical shift.',
                'Review student case description and reflection. Click "Sign as Preceptor", enter PIN, rate performance, provide coaching comments, and sign.',
              ],
              [
                'Tab 4: Evidence Vault',
                'Auditing gallery for all clinical documents (SBAR handovers, EWS escalation charts, ECG strips).',
                'Inspect evidence photos in high resolution to verify authenticity and patient privacy de-identification.',
              ],
              [
                'Tab 5: OCR Scanner Review',
                'Supervising digital conversion of handwritten bedside notes.',
                'Verify that OCR-scanned text accurately reflects observed patient encounters on the ward.',
              ],
              [
                'Tab 6: Cohort & Instructors Hub',
                'Comprehensive department management: Cohort roster and 15 Preceptor Directory.',
                'Switch between students, import submitted `.json` dossiers, load the 15-preceptor roster, and manage PINs.',
              ],
              [
                'Tab 7: Part III - Final Competency Sign-Off',
                'Summative program evaluation upon completion of all 18 clinical sessions.',
                'Lead Clinical Educator unlocks evaluation with PIN, records summative score, and executes final institutional certification.',
              ],
              [
                'Tab 8: Print Academic Dossier',
                'Generates certified 7-page physical or PDF academic transcript for university archives.',
                'Inspect final signatures, stamps, and institutional verification hash before counter-signing hard copy.',
              ],
            ]
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('3. Exhaustive Cursor & Interactive Pointer Guide'),
          createBodyParagraph(
            'Instructors and preceptors interact with specialized cursors throughout the application. Here is what every cursor indicates during supervision:'
          ),

          createTable(
            ['Cursor Look & State', 'Where It Appears in the App', 'What It Signifies & Supervisory Action'],
            [
              [
                'Hand Pointer (cursor-pointer 👆)',
                'Status buttons ("Sign Met"), "Sign as Preceptor", student selector rows in Cohort table, PIN reveal button.',
                'Interactive action element. Click to open PIN security prompt, switch trainee dossier, or authorize records.',
              ],
              [
                'Text I-Beam (cursor-text Ɪ)',
                'PIN input modal, Formative Feedback comments textarea, Summative Remarks box in Part III, Preceptor registry fields.',
                'Editable text input. Click to enter your 4-digit PIN or type constructive coaching feedback for the student.',
              ],
              [
                'Crosshair / Pen (cursor-crosshair ✍️)',
                'Digital signature canvas in Section 3 of Part II and Final Sign-Off in Part III.',
                'Drawing pad. Use mouse, stylus, or fingertip to render your official physical signature on the digital canvas.',
              ],
              [
                'Zoom-In Magnifier (cursor-zoom-in 🔍)',
                'Evidence thumbnails attached to student activity sheets or in the Evidence Vault.',
                'Click to expand clinical documentation (EWS charts, ECG strips) into full-screen inspection mode.',
              ],
              [
                'Grab & Move (cursor-grab ✋)',
                'Enlarged clinical evidence viewer modal.',
                'Click and drag to pan across high-resolution hospital records and verify bedside measurements.',
              ],
              [
                'Not-Allowed / Lock (cursor-not-allowed 🚫)',
                'Final Sign-Off button when student has completed fewer than 18 sessions, or locked student self-evaluations.',
                'Action is restricted by business rules. The student must complete remaining requirements before authorization.',
              ],
              [
                'Wait / Spinner (cursor-wait ⏳)',
                'Batch roster import execution, Word (.docx) generation, and CSV export compilation.',
                'System is writing or parsing files. Wait 1-2 seconds for automatic completion.',
              ],
              [
                'Default Arrow (cursor-default 🢕)',
                'Competency standards guidelines, student clinical activity read-only display headers.',
                'Static background information for reviewing clinical expectations.',
              ],
            ]
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('4. Preceptor PIN Security Model & PIN Directory'),
          createBodyParagraph(
            'All signature actions and status modifications are secured behind personal PIN authentication:'
          ),
          createBulletItem(
            'Individual Preceptor PINs:',
            'Every instructor is registered with their own personal confidential 4-digit PIN (e.g., Sister Almaz Tefera uses PIN 4182; Dr. Berhanu Tesfaye uses PIN 7021). When you enter your PIN, the system verifies your identity, logs your full name, stamps your initials on the matrix, and records the current timestamp.'
          ),
          createBulletItem(
            'Institutional Master PIN:',
            'A master fallback authorization code (default: 2026) is available for senior nursing coordinators and lead clinical educators.'
          ),
          createBulletItem(
            'Confidentiality Rule:',
            'Never share your PIN with students. Enter your code personally on the student’s device or perform evaluations from the Instructor Portal.'
          ),

          createHeading2('Managing the 15 Preceptors & Mentors Directory'),
          createBodyParagraph(
            'Navigate to the "Cohort & Instructors" tab to manage your hospital faculty roster:'
          ),
          createTable(
            ['Directory Action Button', 'How to Use', 'Result in System'],
            [
              [
                '⚡ Load 15 Preceptors',
                'Click the amber button in the directory header',
                'Instantly loads the complete 15-preceptor hospital faculty roster across all ICU and Emergency units with assigned PINs.',
              ],
              [
                'Batch Import / CSV',
                'Click "Batch Import / CSV" and paste custom roster lines',
                'Registers multiple hospital preceptors simultaneously with auto-generated PINs and initials.',
              ],
              [
                '+ Add Preceptor',
                'Click "+ Add Preceptor" and fill out the registration form',
                'Creates a new instructor profile with specific role (Preceptor, Mentor, Lead Educator), ward, and custom PIN.',
              ],
              [
                'Show / Hide PINs',
                'Toggle the eye icon in the directory header',
                'Reveals or masks security PINs when distributing credentials to preceptor staff.',
              ],
              [
                'Export CSV',
                'Click the "Export" button',
                'Downloads a clean spreadsheet of all authorized preceptors, wards, and passcodes for department records.',
              ],
            ]
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('5. Step-by-Step Supervisory Workflows'),
          createHeading2('Workflow A: Quick Matrix Verification (Part I)'),
          createBulletItem('Step 1:', 'Open "Part I: Tracking Matrix" on the student’s device.'),
          createBulletItem('Step 2:', 'Locate the clinical session (Sessions 1 to 18).'),
          createBulletItem('Step 3:', 'Click the status button ("Sign Met" or "Pending").'),
          createBulletItem('Step 4:', 'Enter your individual Preceptor PIN in the security modal.'),
          createBulletItem('Step 5:', 'System stamps your initials (e.g. AT) and current date, flipping status to "Met" ✅.'),

          createHeading2('Workflow B: Detailed Formative Evaluation (Part II, Section 3)'),
          createBulletItem('Step 1:', 'Open "Part II: Detailed Log Sheets" and select the session card.'),
          createBulletItem('Step 2:', 'Audit the student’s case description, interventions, and reflective notes.'),
          createBulletItem('Step 3:', 'Inspect attached clinical evidence in the card or Evidence Vault.'),
          createBulletItem('Step 4:', 'Click "Sign as Preceptor" and enter your 4-digit PIN.'),
          createBulletItem('Step 5:', 'Select rating (Satisfactory / Needs Improvement / Excellent), add coaching notes, draw signature, and click "Save & Authorize Sign-Off".'),

          createHeading2('Workflow C: Accessing & Completing Evaluation Forms from the Instructor Portal'),
          createBodyParagraph(
            'Clinical preceptors and mentors can evaluate any enrolled trainee directly from the Instructor & Cohorts portal on faculty workstations or personal tablets:'
          ),
          createBulletItem('Step 1: Open Instructor Portal', 'Click the "Instructor & Cohorts" tab from the top navigation bar.'),
          createBulletItem('Step 2: Locate Trainee in Roster', 'Review enrolled trainees in the "Enrolled Students Roster" table, observing real-time session completion bars (e.g. 14 / 18 Met) and certification statuses.'),
          createBulletItem('Step 3: Direct 1-Click Form Access', 'In the "Access Evaluation Forms" column of any student row, click the specific form you wish to complete:'),
          createBulletItem('  • [Part I Matrix]:', 'Instantly switches to that trainee’s 18-session tracking matrix, allowing you to click "Mark Met & Sign" on any milestone session with your personal 4-digit PIN.'),
          createBulletItem('  • [Part II Form]:', 'Immediately opens that trainee’s Detailed Log Sheets at Section 3 (Formative Evaluation & Sign-off). Here you can audit their patient assessment notes, select Competency Rating (Satisfactory / Needs Improvement / Unsatisfactory), write actionable coaching feedback, and draw your digital signature.'),
          createBulletItem('  • [Part III Sign-off]:', 'Jumps directly to the Final Summative Evaluation Rubric and Institutional Certification for trainees who have completed all 18 clinical sessions.'),
          createBulletItem('  • [Rotate Ward]:', 'Allows rotating any trainee to a new clinical department (e.g. Medical ICU, Surgical Inpatient Ward 4B, Emergency & Trauma, Pediatric ICU, CCU) and assigning their new ward preceptor/mentor with 1 click. All past session evaluations, ratings, and signatures are permanently preserved!'),
          createBulletItem('Step 4: Active Trainee Quick Bar', 'Whenever a student is loaded, an "Active Trainee Evaluation Bar" appears at the top of the roster, providing immediate 1-click evaluation shortcuts without navigating manually.'),
          createBulletItem('Step 5: Importing Student Dossiers & Cohort Rosters', 'Click "Import Student Dossier" in the roster header to open the unified import modal. The system accepts two main formats:'),
          createBulletItem('  • Format 1: Student Dossier (.JSON):', 'Exported by trainees via "Export Full JSON Backup" or Part III "Download Certified Dossier". Restores student identity, all 18 clinical practice log sheets, self-reflections, dates, preceptor signatures, ratings, and institutional status. You can upload single files, select multiple .json files simultaneously (e.g. 10 student dossiers), or paste JSON data.'),
          createBulletItem('  • Format 2: Cohort Roster Spreadsheet (.CSV):', 'Used by clinical coordinators to bulk-enroll new students in seconds before rotations begin. Standard columns: Full Name, Student ID, Ward / Department, Hospital, Assigned Preceptor. Supports CSV file upload, drag-and-drop, or pasting spreadsheet text copied directly from Microsoft Excel.'),
          createBulletItem('  • Live Preview & Validation:', 'The system instantly inspects uploaded files, displaying trainee names, IDs, clinical wards, and verified session counts (e.g. 14 / 18 Met) before confirming import into your cohort.'),
          createBulletItem('Alternative Bedside Method:', 'Preceptors can also evaluate students at the bedside on the trainee’s own device by tapping "Preceptor Sign-off (PIN)" in Part II or "Mark Met & Sign" in Part I and entering their confidential 4-digit code.'),

          createHeading2('Clinical Rotations & Multi-Preceptor Evaluations Accommodation'),
          createBodyParagraph(
            'The NCEP logbook is architected specifically to support rotations across different hospital wards where preceptors and mentors change throughout residency. Each of the 18 sessions can be supervised and evaluated by a different preceptor or mentor. In Part I (Tracking Matrix), the evaluating preceptor’s unique initials and ward are stamped on each session. In Part II (Detailed Log Sheets), each activity log independently records the specific clinical ward setting, preceptor credentials, and formative evaluation.'
          ),

          createHeading2('Workflow D: Final Program Certification (Part III)'),
          createBulletItem('Step 1:', 'Verify the completion indicator shows "18 of 18 Sessions Completed (100%)".'),
          createBulletItem('Step 2:', 'Lead Clinical Educator clicks "Authorize Final Sign-Off", enters PIN, and records summative evaluation.'),
          createBulletItem('Step 3:', 'Trainee and Educator apply signatures to generate the permanent verification hash.'),
          createBulletItem('Step 4:', 'Open "Print Academic Dossier" to print or save the certified 7-page institutional credential.'),

          createHeading2('Workflow E: Real-Time Cross-Device Synchronization (Instructor Device ⟷ Student Device)'),
          createBodyParagraph(
            'The application includes built-in Real-Time Cloud Synchronization over WebSockets and secure HTTP sync. Instructors and students can simultaneously access the system from their own personal phones, tablets, or office laptops:'
          ),
          createBulletItem('• Instructor Evaluates on Laptop:', 'When a mentor opens the logbook from the Instructor Portal on their laptop and signs a session or records Section 3 feedback, the information is immediately saved to the server and broadcasted.'),
          createBulletItem('• Instant Display on Student Phone:', 'The trainee’s smartphone screen updates live—marking the session as "Met ✅", displaying the preceptor’s initials, competency rating, and feedback commentary in real time with a celebratory toast.'),
          createBulletItem('• Student Submits on Mobile:', 'When the trainee documents clinical reflections, bedside notes, or attaches EWS charts on their phone, the data appears immediately on the instructor’s workstation in the Cohort Manager and Detailed Log Sheets.'),
          createBulletItem('• Status Indicator:', 'The "🟢 Live Cloud Sync" indicator in the top header verifies real-time cross-device connectivity and allows manual 1-click re-syncing at any time.'),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// 3. GENERATE CLOUD SAVE VERIFICATION GUIDE (.DOCX)
//    FOR STUDENTS & INSTRUCTORS / PRECEPTORS
// -------------------------------------------------------------
export async function generateCloudSaveVerificationGuideDocx(): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)',
            alignment: AlignmentType.CENTER,
            run: {
              size: 20,
              font: 'Calibri',
              color: '0F766E',
              bold: true,
            },
          }),
          new Paragraph({
            text: 'CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION',
            alignment: AlignmentType.CENTER,
            run: {
              size: 24,
              font: 'Calibri',
              color: '134E4A',
              bold: true,
            },
          }),
          new Paragraph({
            text: 'STEP-BY-STEP GUIDE: ENSURING DATA IS PERMANENTLY SAVED ON THE CLOUD DATABASE',
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            run: {
              size: 30,
              font: 'Calibri',
              color: '111827',
              bold: true,
            },
          }),
          createCalloutBox(
            'Purpose of This Guide',
            'Step-by-step checklist for both Students (Trainees) and Instructors (Preceptors / Mentors / Lead Educators) to verify with 100% certainty that entered clinical logs, evidence attachments, and preceptor signatures are permanently saved to the Cloud Database—and how to recognize connection or permission problems.'
          ),
          new Paragraph({ spacing: { after: 180 } }),

          createHeading1('Part 1: How Permanent Cloud Saving Works'),
          createBodyParagraph(
            'The NCEP Clinical Logbook protects clinical entries across three layers, but ONLY Layer 3 guarantees permanent institutional Cloud Database storage across devices, browser resets, and app updates:'
          ),
          createBulletItem(
            'Layer 1 — Browser Local Cache:',
            'Temporarily holds your draft inside the phone or computer browser you are currently using. If browser history is cleared or you switch devices, local-only data will NOT follow you.'
          ),
          createBulletItem(
            'Layer 2 — Live Session Sync Server:',
            'Allows real-time cross-device sharing between students and mentors during active sessions.'
          ),
          createBulletItem(
            'Layer 3 — Permanent Cloud Database (Firebase Firestore):',
            'Activated when you sign in with Google ("Sign in for Cloud DB"). Whenever a student saves a log or a preceptor signs a log, the app waits for direct server confirmation from the Cloud Database before displaying the GREEN confirmation pop-up.'
          ),

          createHeading1('Part 2: Step-by-Step Guide for STUDENTS (Trainees)'),
          createHeading2('Step 1: Sign In to the Cloud Database First'),
          createBulletItem('Action:', 'Look at the top header bar. If you see the teal button "Sign in for Cloud DB", click it and sign in with your Google account once.'),
          createBulletItem('Verify:', 'Your Google email appears in the header beside a green "Cloud DB" badge.'),

          createHeading2('Step 2: Enter Your Trainee Name & Trainee ID in Tab 1'),
          createBulletItem('Action:', 'Open Tab 1 ("Trainee Info & Instructions") and enter your exact Full Name and Trainee ID (e.g., NCEP-080-26).'),
          createBulletItem('Why This Matters:', 'If Trainee Name and ID are blank, your profile has no official ID in the Cloud Database, and the system will block permanent cloud saving until they are filled.'),

          createHeading2('Step 3: Fill Your Clinical Log & Attach Compressed Evidence'),
          createBulletItem('Action:', 'Open Part I ("Tracking Matrix") or Part II ("Detailed Log Sheets"), select the clinical session (Sessions 1–18), enter Activity Date, Ward, Duration, Description of Activity, and Reflective Notes, then click Save Log Entry.'),
          createBulletItem('Attaching Photos / Evidence:', 'When attaching SBAR notes, EWS charts, or ECG images, the app automatically checks file weight and compresses heavy photos so they upload reliably without exceeding Cloud Database size limits. Remember: attached evidence stays permanently visible to your mentor and instructor unless you explicitly remove it.'),

          createHeading2('Step 4: Read the Cloud Save Confirmation Pop-Up (CRITICAL)'),
          createBodyParagraph(
            'After clicking Save, a brief "Saving to Cloud Database..." pop-up appears while waiting for the server. Never close the tab until the final result pop-up appears:'
          ),
          createBulletItem('GREEN Pop-Up — "Permanently Saved on Cloud Database":', 'SUCCESS. Both Cloud DB (Committed) and Live Server (Synced) confirmed your data. You may safely click "OK, Continue" and close or switch devices.'),
          createBulletItem('AMBER Pop-Up — "NOT Saved to Cloud Database (Connection Problem)":', 'WARNING — NOT SAVED ON CLOUD. Your device is offline or the network dropped. Reconnect to Wi-Fi/cellular data and click the amber "Retry Cloud Save" button inside the pop-up until the GREEN pop-up appears.'),
          createBulletItem('INDIGO Pop-Up — "NOT Saved to Cloud Database (Google Sign-In Required)":', 'WARNING — NOT SAVED ON CLOUD. Click "Sign in with Google & Save" directly in the pop-up; as soon as sign-in completes, the app automatically saves your pending log to the Cloud Database.'),
          createBulletItem('ROSE Pop-Up — "NOT Saved to Cloud Database (Other Error)":', 'WARNING — NOT SAVED ON CLOUD. Read the specific error message (for example, incomplete Trainee Name & ID in Tab 1 or quota/permission error), resolve the issue, and save again.'),

          createHeading2('Step 5: Final Student Verification Check'),
          createBulletItem('Action:', 'Verify that the header shows the green "Cloud DB" badge (not "Offline Cache" or "DB Notice"), confirm your saved session appears in Part I & Part II, and download a weekly ".json" backup from Tab 1 as an extra offline copy.'),

          new Paragraph({ spacing: { after: 140 } }),
          createHeading1('Part 3: Step-by-Step Guide for INSTRUCTORS, PRECEPTORS & MENTORS'),

          createHeading2('Step 1: Sign In to Google Cloud DB & Verify Your Staff Role'),
          createBulletItem('Action:', 'Click "Sign in for Cloud DB" in the top bar with your Google account (or Lead Educator institutional account).'),
          createBulletItem('Role Elevation:', 'Either switch the header Role dropdown ("Clinical Preceptor (PIN)" / "Lead Clinical Educator (PIN)") and enter your 4-digit PIN, OR enter your 4-digit PIN when prompted on any student session. Entering your PIN while signed in with Google registers your verified staff status in the Cloud Database.'),

          createHeading2('Step 2: Select & Inspect the Student Dossier'),
          createBulletItem('Action:', 'Open "Instructor & Cohorts" (for Lead Educators) or select the student dossier. Review Part II activity descriptions, reflective notes, and uploaded files in the "Evidence Vault".'),
          createBulletItem('Note on Evidence:', 'Any evidence uploaded by the student remains visible to mentors and instructors permanently unless deleted by the student.'),

          createHeading2('Step 3: Perform & Submit Your Sign-Off'),
          createBulletItem('Part I Quick Matrix Sign:', 'Click "Pending" on any session row, enter your 4-digit Preceptor PIN, and confirm.'),
          createBulletItem('Part II Formative Evaluation:', 'Click "Preceptor Sign-off", enter your 4-digit PIN, choose Competency Rating ("Satisfactory" / "Needs Improvement" / "Unsatisfactory"), write coaching comments, draw your digital signature, and click "Confirm & Sign Entry".'),
          createBulletItem('Part III Final Certification (Lead Educator):', 'Once all 18 sessions are "Met", open Part III, enter the Lead Educator passcode, draw your final signature, and generate the verification hash.'),

          createHeading2('Step 4: Wait for & Verify the Pop-Up Confirmation'),
          createBodyParagraph(
            'Do NOT walk away from the computer or close the student screen until the pop-up confirms permanent storage:'
          ),
          createBulletItem('GREEN Pop-Up ("Permanently Saved on Cloud Database"):', 'Displays the Action ("Preceptor Sign-Off Saved"), Trainee Name & ID, your "Signed By" Preceptor Name, and verification timestamp. Your signature is permanently saved in Firestore Cloud DB.'),
          createBulletItem('AMBER Pop-Up ("Connection Problem"):', 'Hospital Wi-Fi or mobile signal dropped. Wait for reconnection and click "Retry Cloud Save" immediately so your sign-off is not lost.'),
          createBulletItem('INDIGO Pop-Up ("Google Sign-In Required"):', 'Click "Sign in with Google & Save" so your signature writes permanently to Cloud DB rather than temporary local storage.'),
          createBulletItem('ROSE Pop-Up ("Permission Denied / Other Error"):', 'If a "Permission Denied" error appears, unlock your Role in the top header using your 4-digit Preceptor PIN (or verify with the Lead Clinical Educator that your PIN is registered), then click "Retry Save".'),

          createHeading2('Step 5: Cross-Check Confirmation After Saving'),
          createBulletItem('Checklist:', 'Confirm the session badge flipped to green "Met" in Part I Matrix, your name/initials and date appear in the Preceptor column, the header status reads green "Cloud DB", and the cohort completion count updated (e.g., 15 / 18 Met).'),

          new Paragraph({ spacing: { after: 140 } }),
          createHeading1('Part 4: Quick Pop-Up Reference Table'),
          createTable(
            ['Pop-Up Color & Title', 'Is It Saved on Cloud Database?', 'What Caused It', 'Exact Action Required'],
            [
              [
                'GREEN: Permanently Saved on Cloud Database',
                'YES — 100% Verified & Committed',
                'Live server AND Firebase Cloud DB confirmed the write.',
                'Click "OK, Continue". Safe to proceed or close.',
              ],
              [
                'AMBER: NOT Saved (Connection Problem)',
                'NO — Saved Locally Only',
                'No internet, Wi-Fi drop, firewall timeout, or unreachable Cloud DB.',
                'Restore internet connection and click "Retry Cloud Save" until GREEN.',
              ],
              [
                'INDIGO: NOT Saved (Sign-In Needed)',
                'NO — Temporary Browser/Live Only',
                'User is online but has not signed in via "Sign in for Cloud DB".',
                'Click "Sign in with Google & Save" in the pop-up.',
              ],
              [
                'ROSE: NOT Saved (Other Problem)',
                'NO — Save Rejected / Incomplete',
                'Blank Trainee Name/ID, missing Preceptor PIN permission, or quota limit.',
                'Read the exact message shown (fix Tab 1 Name/ID or re-enter PIN) and click "Retry Save".',
              ],
            ]
          ),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// -------------------------------------------------------------
// DOWNLOAD TRIGGERS (BROWSER HELPER)
// -------------------------------------------------------------
export async function downloadStudentManual(): Promise<void> {
  const blob = await generateStudentManualDocx();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NCEP_Core_Competency_1_Student_Manual_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadMentorManual(): Promise<void> {
  const blob = await generateMentorPreceptorManualDocx();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NCEP_Core_Competency_1_Mentor_Preceptor_Manual_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadCloudSaveVerificationGuide(): Promise<void> {
  const blob = await generateCloudSaveVerificationGuideDocx();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NCEP_Cloud_Save_Verification_Guide_Students_Instructors_${new Date().toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
