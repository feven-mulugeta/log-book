import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { EvidenceAttachment } from '../types/nursing';

interface EvidenceAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (attachment: EvidenceAttachment) => void;
  entryTitle?: string;
}

export function EvidenceAttachmentModal({
  isOpen,
  onClose,
  onSave,
  entryTitle,
}: EvidenceAttachmentModalProps) {
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<EvidenceAttachment['type']>('assessment_form');
  const [deidentifiedConfirmed, setDeidentifiedConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit. Please upload an optimized file.');
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleQuickPreset = (presetType: 'sample_ecg' | 'sample_slip' | 'sample_dressing') => {
    let name = '';
    let svgContent = '';
    if (presetType === 'sample_ecg') {
      name = '12_Lead_ECG_Rhythm_Strip_Normal_Sinus.svg';
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200"><rect width="600" height="200" fill="#fff5f5"/><path d="M 0 100 L 80 100 L 90 85 L 100 100 L 110 100 L 120 40 L 130 160 L 140 100 L 160 100 L 180 80 L 200 100 L 280 100 L 290 85 L 300 100 L 310 100 L 320 40 L 330 160 L 340 100 L 360 100 L 380 80 L 400 100 L 480 100 L 490 85 L 500 100 L 510 100 L 520 40 L 530 160 L 540 100 L 600 100" fill="none" stroke="#dc2626" stroke-width="2.5"/><text x="20" y="30" font-family="Arial" font-size="12" font-weight="bold" fill="#991b1b">ECG CALIBRATION 25mm/s, 10mm/mV | HR: 74 bpm Normal Sinus</text></svg>`;
    } else if (presetType === 'sample_slip') {
      name = 'Signed_Ward_Competency_Verification_Slip.svg';
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="#ffffff" stroke="#94a3b8" stroke-width="2"/><text x="30" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="#0f172a">CLINICAL COMPETENCY SLIP</text><line x1="30" y1="55" x2="570" y2="55" stroke="#cbd5e1"/><text x="30" y="90" font-family="Arial" font-size="12" fill="#334155">Procedure: IV Infusion Line Setting &amp; Flush</text><text x="30" y="120" font-family="Arial" font-size="12" fill="#334155">Student: Feven Mulugeta (AAU-NS-2024-0419)</text><text x="30" y="150" font-family="Arial" font-size="12" fill="#334155">Preceptor Sign-off: Proficient - Direct Supervision</text><rect x="30" y="180" width="200" height="80" fill="#f0fdf4" stroke="#86efac"/><text x="45" y="210" font-family="Arial" font-size="12" font-weight="bold" fill="#166534">WARD SISTER VERIFIED</text><text x="45" y="235" font-family="cursive" font-size="16" fill="#1e3a8a">Sr. Almaz Tesfaye</text></svg>`;
    } else {
      name = 'Deidentified_Wound_Progression_Record.svg';
      svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"><rect width="600" height="300" fill="#f8fafc" stroke="#94a3b8" stroke-width="2"/><text x="30" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="#0f172a">WOUND HEALING ASSESSMENT AUDIT</text><text x="30" y="80" font-family="Arial" font-size="12" fill="#334155">Stage: Granulation phase, 90% red tissue bed, zero foul odor</text><text x="30" y="110" font-family="Arial" font-size="12" fill="#334155">Dressing: Hydrocolloid dressing applied with paper tape border</text><rect x="30" y="160" width="180" height="60" fill="#eff6ff" stroke="#93c5fd"/><text x="40" y="195" font-family="Arial" font-size="12" font-weight="bold" fill="#1e40af">AUDITED BY CLINICAL LEAD</text></svg>`;
    }
    setFileData(`data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`);
    setFileName(name);
    setFileSize(svgContent.length);
  };

  const handleSave = () => {
    if (!fileData) {
      setError('Please select an evidence file or template.');
      return;
    }
    if (!deidentifiedConfirmed) {
      setError('Please acknowledge that no protected patient health identifiers are disclosed.');
      return;
    }

    const newAttachment: EvidenceAttachment = {
      id: `att-${Date.now()}`,
      name: fileName || 'Clinical_Evidence_Document',
      type,
      dataUrl: fileData,
      notes: notes.trim(),
      uploadedAt: new Date().toISOString(),
      sizeBytes: fileSize,
    };

    onSave(newAttachment);
    onClose();
    // Reset state
    setFileData(null);
    setFileName('');
    setNotes('');
    setDeidentifiedConfirmed(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Attach Clinical Evidence</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {entryTitle ? `Session: ${entryTitle}` : 'Attach documentation, photo or supervisor slip'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Evidence Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Evidence Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'assessment_form', label: 'Assessment Form' },
                { id: 'care_plan', label: 'Care Plan' },
                { id: 'chart_audit', label: 'Chart Audit' },
                { id: 'ews_sheet', label: 'EWS / NEWS Sheet' },
                { id: 'sbar_note', label: 'SBAR Escalation Note' },
                { id: 'reflective_entry', label: 'Reflective Entry' },
                { id: 'scanned_page', label: 'Scanned Soft Copy' },
                { id: 'clinical_photo', label: 'De-identified Photo' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setType(item.id as EvidenceAttachment['type'])}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left border transition-colors ${
                    type === item.id
                      ? 'border-teal-700 bg-teal-50 text-teal-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload or Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Evidence File (Image, PDF page, Scan)
            </label>
            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-5 hover:border-teal-600 transition-colors bg-slate-50/50 text-center">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center pointer-events-none">
                <Upload className="w-8 h-8 text-teal-700 mb-2" />
                <span className="text-xs font-semibold text-slate-800">
                  Click to upload or drag & drop evidence file
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  PNG, JPG, SVG, WebP up to 15MB
                </span>
              </div>
            </div>

            {/* Quick Presets for Demo / Testing */}
            <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
              <span className="shrink-0 text-[11px] font-medium text-slate-600">Sample templates:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('sample_slip')}
                className="text-[11px] text-teal-700 hover:underline"
              >
                Ward Slip
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('sample_ecg')}
                className="text-[11px] text-teal-700 hover:underline"
              >
                ECG Strip
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('sample_dressing')}
                className="text-[11px] text-teal-700 hover:underline"
              >
                Wound Audit
              </button>
            </div>
          </div>

          {/* Preview if uploaded */}
          {fileData && (
            <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={fileData}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-900 truncate">{fileName}</p>
                  <p className="text-[11px] text-slate-500">
                    {(fileSize / 1024).toFixed(1)} KB · Ready to link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFileData(null);
                  setFileName('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 px-2 py-1"
              >
                Remove
              </button>
            </div>
          )}

          {/* Clinical Notes / Caption */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clinical Context / Explanatory Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Verified by Ward in-charge prior to patient transfer. Shows clear incision margins."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          {/* Privacy Disclaimer Checkbox */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={deidentifiedConfirmed}
                onChange={(e) => setDeidentifiedConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md border-amber-300 text-teal-700 focus:ring-teal-600 cursor-pointer"
              />
              <span className="text-[11px] text-amber-900 leading-snug">
                <strong>Patient Confidentiality Confirmation:</strong> I verify that this attachment
                contains NO visible patient identifiers (names, MRN, phone numbers, or facial identity) in
                compliance with clinical ethics and healthcare regulations.
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!fileData || !deidentifiedConfirmed}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Attach Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
