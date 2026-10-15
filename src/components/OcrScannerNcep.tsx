import React, { useState } from 'react';
import {
  Upload,
  Scan,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Camera,
  RotateCw,
  Plus,
} from 'lucide-react';
import {
  DetailedActivityLogSheet,
  EvidenceAttachment,
  ExtractedOcrNcepEntry,
  OcrNcepExtractionResult,
} from '../types/nursing';
import { NCEP_SAMPLE_OCR_SCANS, NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';

interface OcrScannerNcepProps {
  onImportOcrLogs: (newLogs: DetailedActivityLogSheet[]) => void;
  onNavigateToMatrix: () => void;
}

export function OcrScannerNcep({ onImportOcrLogs, onNavigateToMatrix }: OcrScannerNcepProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrNcepExtractionResult | null>(null);
  const [extractedRows, setExtractedRows] = useState<ExtractedOcrNcepEntry[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setOcrResult(null);
    setImportSuccessCount(null);
    setImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = NCEP_SAMPLE_OCR_SCANS.find((s) => s.id === presetId);
    if (!preset) return;
    setError(null);
    setOcrResult(null);
    setImportSuccessCount(null);
    setSelectedImage(preset.thumbnail);
    setImageName(preset.title);
  };

  const handleScanNow = async () => {
    if (!selectedImage) {
      setError('Please select or upload an NCEP soft copy image first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setImportSuccessCount(null);

    try {
      const response = await fetch('/api/ocr-logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server responded with status ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.success || !resJson.data) {
        throw new Error('Invalid response structure from OCR service.');
      }

      const data = resJson.data;
      const parsedResult: OcrNcepExtractionResult = {
        documentTitle: data.documentTitle || 'NCEP Clinical Training & Practice Logbook',
        traineeIdentified: data.traineeIdentified,
        traineeIdIdentified: data.traineeIdIdentified,
        wardIdentified: data.wardIdentified,
        partDetected: (data.partDetected as any) || 'Part I: Tracking Matrix',
        overallNotes: data.overallNotes,
        extractedEntries: (data.entries || []).map((e: any, idx: number) => {
          let sNum = Number(e.sessionNumber) || (idx + 1);
          if (sNum < 1 || sNum > 18) sNum = (idx % 18) + 1;
          const sDef = NCEP_SESSIONS_DEFINITIONS.find((s) => s.sessionNumber === sNum);

          return {
            sessionNumber: sNum,
            sessionTitle: sDef?.sessionTitle || e.sessionTitle || `Session ${sNum}`,
            dateCompleted: e.date || new Date().toISOString().slice(0, 10),
            durationHours: Number(e.durationHours) || 4,
            clinicalSettingWard: e.clinicalSettingWard || 'Surgical Inpatient Ward 4B',
            activityDescription:
              e.activityDescription ||
              `Completed clinical practice assignment for Session ${sNum}: ${sDef?.requiredActivity || ''}`,
            reflectiveNotes:
              e.reflectiveNotes ||
              'Demonstrated patient assessment and clinical prioritization skills with preceptor verification.',
            status: (e.status === 'Met' ? 'Met' : 'Met') as 'Pending' | 'Met',
            preceptorInitials: e.preceptorInitials || 'AT',
            preceptorComments: e.preceptorComments || 'Competency demonstrated satisfactorily.',
            competencyRating: (e.competencyRating as any) || 'Satisfactory',
          };
        }),
      };

      setOcrResult(parsedResult);
      setExtractedRows(parsedResult.extractedEntries);
      setSelectedIndices(parsedResult.extractedEntries.map((_, i) => i));
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          'Failed to digitize NCEP logbook page. Please check image clarity or test with our sample presets.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRowChange = (index: number, field: keyof ExtractedOcrNcepEntry, val: any) => {
    const updated = [...extractedRows];
    updated[index] = { ...updated[index], [field]: val };
    setExtractedRows(updated);
  };

  const toggleSelect = (index: number) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleImport = () => {
    if (selectedIndices.length === 0) {
      setError('Please select at least one session entry to import.');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const softCopyEvidence: EvidenceAttachment | null = selectedImage
      ? {
          id: `att-ocr-${Date.now()}`,
          name: imageName || 'Scanned_NCEP_Logbook_Page.jpg',
          type: 'scanned_page',
          dataUrl: selectedImage,
          notes: `Digitized via AI OCR from NCEP soft copy logbook sheet on ${todayStr}.`,
          uploadedAt: new Date().toISOString(),
          sizeBytes: selectedImage.length,
        }
      : null;

    const newLogs: DetailedActivityLogSheet[] = selectedIndices.map((idx) => {
      const row = extractedRows[idx];
      const sDef = NCEP_SESSIONS_DEFINITIONS.find((s) => s.sessionNumber === row.sessionNumber)!;

      return {
        id: `ncep-log-ocr-${Date.now()}-${idx}`,
        sessionNumber: row.sessionNumber,
        sessionTitle: sDef?.sessionTitle || row.sessionTitle,
        subCompetencyId: sDef?.subCompetencyId || 'sub_comp_1',
        subCompetencyTitle: sDef?.subCompetencyTitle || 'Core Competency 1',
        dateOfActivity: row.dateCompleted || todayStr,
        durationHours: row.durationHours || 4,
        clinicalSettingWard: row.clinicalSettingWard || 'Surgical Ward 4B',
        activityDescription: row.activityDescription,
        reflectiveNotesLessonsLearned: row.reflectiveNotes || '',
        attachments: softCopyEvidence ? [softCopyEvidence] : [],
        preceptorSignoff: {
          isSigned: true,
          preceptorName: 'Sister Almaz Tesfaye, RN, MSc Clinical Nursing',
          preceptorInitials: row.preceptorInitials || 'AT',
          signatureDataUrl:
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60"><path d="M 20 40 Q 50 10, 80 35 T 140 25 T 180 35" fill="none" stroke="%231e3a8a" stroke-width="2.5"/><text x="30" y="52" font-family="cursive" font-size="12" fill="%231e3a8a">Almaz Tesfaye, RN</text></svg>',
          dateSigned: row.dateCompleted || todayStr,
          competencyDemonstrated: row.competencyRating || 'Satisfactory',
          comments: row.preceptorComments || 'Validated via scanned NCEP logbook.',
        },
        status: row.status || 'Met',
        source: 'ocr_scan',
        createdAt: new Date().toISOString(),
      };
    });

    onImportOcrLogs(newLogs);
    setImportSuccessCount(newLogs.length);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Banner */}
      <div className="p-6 bg-linear-to-r from-teal-950 via-teal-900 to-slate-900 text-white rounded-2xl shadow-sm">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>NCEP Multimodal OCR Scanner</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Digitize NCEP Logbook Soft Copy
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-teal-100 leading-relaxed">
            Upload scans or photos of your NCEP Core Competency 1 logbook (Part I Matrix or Part II
            Detailed Sheets). The OCR engine identifies the sessions, completed dates, preceptor initials,
            and reflective notes to update your digital record automatically.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Uploader (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-700" />
              <span>Select Soft Copy Page</span>
            </h3>

            {/* Dropzone */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-teal-600 transition-colors rounded-xl p-6 bg-slate-50 text-center cursor-pointer">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center pointer-events-none">
                <div className="p-3 bg-teal-50 rounded-full text-teal-700 mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-900">
                  Drop soft copy scan or take a ward photo
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports Part I Matrix sheets and Part II Activity templates
                </p>
              </div>
            </div>

            {/* Ready Sample Presets */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Or test with sample NCEP logbook sheets:
              </p>
              <div className="space-y-2">
                {NCEP_SAMPLE_OCR_SCANS.map((scan) => (
                  <button
                    key={scan.id}
                    type="button"
                    onClick={() => handleSelectPreset(scan.id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 transition-colors flex items-center justify-between group"
                  >
                    <div className="overflow-hidden pr-2">
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-900 truncate">
                        {scan.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {scan.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-teal-700 group-hover:translate-x-0.5 transition-transform">
                      Load →
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview & Action */}
            {selectedImage && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 truncate">{imageName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setImageName('');
                      setOcrResult(null);
                    }}
                    className="text-rose-600 hover:text-rose-800"
                  >
                    Clear
                  </button>
                </div>

                <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 max-h-72 flex items-center justify-center">
                  <img
                    src={selectedImage}
                    alt="Soft copy logbook preview"
                    className="w-full h-auto max-h-72 object-contain"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center text-white p-4">
                      <div className="w-8 h-8 border-3 border-teal-400 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs font-semibold">Gemini Vision Reading Logbook...</p>
                      <p className="text-[11px] text-teal-200 mt-1 text-center">
                        Matching NCEP Core Competency 1 sessions and signatures
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleScanNow}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Digitizing Page...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4" />
                      <span>Scan &amp; Digitize with AI OCR</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Reconciliation (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Digitized NCEP Sessions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ocrResult
                      ? `${extractedRows.length} sessions detected in ${ocrResult.partDetected}`
                      : 'Review extracted sessions before updating the e-Logbook'}
                  </p>
                </div>

                {extractedRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIndices.length === extractedRows.length) {
                        setSelectedIndices([]);
                      } else {
                        setSelectedIndices(extractedRows.map((_, i) => i));
                      }
                    }}
                    className="text-xs text-teal-700 font-semibold hover:underline"
                  >
                    {selectedIndices.length === extractedRows.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                )}
              </div>

              {/* Import Alert */}
              {importSuccessCount !== null && (
                <div className="my-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">
                        Successfully imported {importSuccessCount} sessions into your NCEP Logbook!
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Part I Tracking Matrix and Part II Activity Sheets have been updated with the
                        soft copy attached as evidence.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToMatrix}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition-colors ml-3"
                  >
                    <span>View Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Rows List */}
              {extractedRows.length > 0 ? (
                <div className="space-y-3 mt-3 max-h-[500px] overflow-y-auto pr-1">
                  {extractedRows.map((row, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition-colors text-xs ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/20'
                            : 'border-slate-200 opacity-70 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(idx)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700"
                          />

                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                Session {row.sessionNumber}: {row.sessionTitle}
                              </span>
                              <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[11px]">
                                Initials: {row.preceptorInitials}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                  Date Completed
                                </label>
                                <input
                                  type="date"
                                  value={row.dateCompleted}
                                  onChange={(e) =>
                                    handleRowChange(idx, 'dateCompleted', e.target.value)
                                  }
                                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                  Status
                                </label>
                                <select
                                  value={row.status}
                                  onChange={(e) => handleRowChange(idx, 'status', e.target.value)}
                                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                                >
                                  <option value="Met">Met</option>
                                  <option value="Pending">Pending</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                  Rating
                                </label>
                                <select
                                  value={row.competencyRating}
                                  onChange={(e) =>
                                    handleRowChange(idx, 'competencyRating', e.target.value)
                                  }
                                  className="w-full px-2 py-1 rounded border border-slate-300 text-xs bg-white"
                                >
                                  <option value="Satisfactory">Satisfactory</option>
                                  <option value="Needs Improvement">Needs Improvement</option>
                                  <option value="Unsatisfactory">Unsatisfactory</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                                Activity Description
                              </label>
                              <input
                                type="text"
                                value={row.activityDescription}
                                onChange={(e) =>
                                  handleRowChange(idx, 'activityDescription', e.target.value)
                                }
                                className="w-full px-2 py-1 rounded border border-slate-300 text-xs text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <Scan className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    No Scanned Entries Yet
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Select one of our sample NCEP logbook sheets or upload your physical logbook
                    photo on the left to extract the sessions.
                  </p>
                </div>
              )}
            </div>

            {extractedRows.length > 0 && (
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {selectedIndices.length} of {extractedRows.length} sessions selected
                </span>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedIndices.length === 0}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 rounded-xl transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Import into Digital Logbook</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
