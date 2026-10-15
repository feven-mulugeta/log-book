import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  getSyncState,
  updateOrSaveStudent,
  updateCohortRoster,
  updatePreceptorsRoster,
  getEventsSince,
  setupRealtimeWebSocket,
} from './serverSync.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// High payload limit for image scans and evidence attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint for OCR Logbook digitization
app.post('/api/ocr-logbook', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

    const promptText = `
You are an expert Clinical Nursing Education OCR Specialist for the NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP) CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION.
Analyze this soft copy or photograph of the NCEP Clinical Training & Practice Logbook (Part I: Competency Tracking Matrix or Part II: Detailed Clinical Activity Log Sheets or Page 1 Trainee Info).

If the sheet is Part I Tracking Matrix:
Extract the session entries (Sessions 1 to 18), dates completed, status (Pending or Met), and preceptor initials.

If the sheet is Part II Detailed Clinical Activity Log Sheet:
Extract Session Number & Title, Date of Activity, Duration (Hours), Clinical Setting / Ward,
1. Description of Activity Performed,
2. Reflective Notes & Lessons Learned,
3. Preceptor / Mentor Feedback (Competency Demonstrated: Satisfactory / Needs Improvement / Unsatisfactory, Comments, Preceptor Name, Signature, Date Signed).

Return a structured JSON object containing:
- documentTitle: Title of the document / page
- traineeIdentified: Trainee Name if present
- traineeIdIdentified: Trainee ID if present
- wardIdentified: Clinical department / ward if present
- partDetected: "Part I: Tracking Matrix" or "Part II: Detailed Log Sheet" or "Trainee Info"
- overallNotes: Any notes or remarks on the page
- entries: Array of extracted session entries, each with:
  - sessionNumber: number (1 to 18)
  - sessionTitle: string
  - subCompetencyTitle: string
  - date: string (YYYY-MM-DD or readable date)
  - durationHours: number
  - clinicalSettingWard: string
  - activityDescription: string
  - reflectiveNotes: string
  - status: string ("Pending" or "Met")
  - preceptorInitials: string
  - preceptorComments: string
  - competencyRating: string ("Satisfactory", "Needs Improvement", "Unsatisfactory")
  - confidenceScore: number (0.0 to 1.0)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentTitle: { type: Type.STRING },
            traineeIdentified: { type: Type.STRING },
            traineeIdIdentified: { type: Type.STRING },
            wardIdentified: { type: Type.STRING },
            partDetected: { type: Type.STRING },
            overallNotes: { type: Type.STRING },
            entries: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sessionNumber: { type: Type.NUMBER },
                  sessionTitle: { type: Type.STRING },
                  subCompetencyTitle: { type: Type.STRING },
                  date: { type: Type.STRING },
                  durationHours: { type: Type.NUMBER },
                  clinicalSettingWard: { type: Type.STRING },
                  activityDescription: { type: Type.STRING },
                  reflectiveNotes: { type: Type.STRING },
                  status: { type: Type.STRING },
                  preceptorInitials: { type: Type.STRING },
                  preceptorComments: { type: Type.STRING },
                  competencyRating: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER },
                },
                required: ['sessionTitle'],
              },
            },
          },
          required: ['documentTitle', 'entries'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error during OCR processing:', error);
    return res.status(500).json({
      error: 'Failed to process logbook OCR',
      message: error?.message || 'Internal OCR processing error',
    });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Cloud Sync Endpoints
app.get('/api/sync/state', (req: Request, res: Response) => {
  res.json({ success: true, data: getSyncState() });
});

app.post('/api/sync/student', (req: Request, res: Response) => {
  try {
    const { student, source = 'trainee', message } = req.body;
    const result = updateOrSaveStudent(student, source, message);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/sync/cohort', (req: Request, res: Response) => {
  try {
    const { cohortStudents, source = 'preceptor' } = req.body;
    const result = updateCohortRoster(cohortStudents, source);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/sync/preceptors', (req: Request, res: Response) => {
  try {
    const { preceptors } = req.body;
    const result = updatePreceptorsRoster(preceptors);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/sync/events', (req: Request, res: Response) => {
  const since = req.query.since as string | undefined;
  const events = getEventsSince(since);
  res.json({ success: true, events, serverTime: new Date().toISOString() });
});

// Vite or Static file serving
async function setupViteOrStatic() {
  const isProduction = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  // Setup WebSocket real-time broadcast server on /ws/sync
  setupRealtimeWebSocket(server);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`NursLog e-Portfolio server with Real-Time Cloud Sync listening on port ${PORT}`);
  });
}

setupViteOrStatic();
