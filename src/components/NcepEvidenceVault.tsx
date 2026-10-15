import React, { useState } from 'react';
import {
  Paperclip,
  Search,
  ExternalLink,
  Download,
  Eye,
  FileText,
  Filter,
} from 'lucide-react';
import { DetailedActivityLogSheet, EvidenceAttachment } from '../types/nursing';

interface NcepEvidenceVaultProps {
  logs: DetailedActivityLogSheet[];
  onOpenAttachmentModalForSession: (sessionNumber: number) => void;
}

export function NcepEvidenceVault({
  logs,
  onOpenAttachmentModalForSession,
}: NcepEvidenceVaultProps) {
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxAttachment, setLightboxAttachment] = useState<{
    attachment: EvidenceAttachment;
    log: DetailedActivityLogSheet;
  } | null>(null);

  // Flatten all attachments across the 18 sessions
  const allEvidence: { attachment: EvidenceAttachment; log: DetailedActivityLogSheet }[] = [];
  logs.forEach((log) => {
    log.attachments.forEach((att) => {
      allEvidence.push({ attachment: att, log });
    });
  });

  const filtered = allEvidence.filter(({ attachment, log }) => {
    if (selectedType !== 'all' && attachment.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = attachment.name.toLowerCase().includes(q);
      const matchNotes = (attachment.notes || '').toLowerCase().includes(q);
      const matchSession = log.sessionTitle.toLowerCase().includes(q);
      if (!matchName && !matchNotes && !matchSession) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Learning Evidence Attachment Vault
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Expected learning evidences per session (Assessment Forms, Care Plans, Chart Audits, EWS
            Sheets, SBAR Notes, Reflective Entries)
          </p>
        </div>

        <div className="text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl font-medium">
          Total Attached Evidences: <strong>{allEvidence.length}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by evidence name, session focus, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
          >
            <option value="all">All Evidence Types ({allEvidence.length})</option>
            <option value="assessment_form">Assessment Forms</option>
            <option value="care_plan">Care Plans</option>
            <option value="chart_audit">Chart Audits</option>
            <option value="ews_sheet">EWS / NEWS Sheets</option>
            <option value="sbar_note">SBAR Escalation Notes</option>
            <option value="reflective_entry">Reflective Entries</option>
            <option value="scanned_page">Scanned Soft Copy Pages</option>
          </select>
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ attachment, log }) => (
            <div
              key={attachment.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors overflow-hidden flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-teal-800 text-[10px] uppercase">
                    {attachment.type.replace('_', ' ')}
                  </span>
                  <span>{new Date(attachment.uploadedAt).toLocaleDateString()}</span>
                </div>

                {/* Preview Thumbnail */}
                <div
                  onClick={() => setLightboxAttachment({ attachment, log })}
                  className="relative h-36 bg-slate-100 rounded-xl overflow-hidden cursor-pointer group border border-slate-200/80"
                >
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg">
                      <Eye className="w-3.5 h-3.5" />
                      View Document
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {attachment.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Session {log.sessionNumber}: {log.sessionTitle}
                  </p>
                </div>

                {attachment.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 line-clamp-2">
                    {attachment.notes}
                  </p>
                )}
              </div>

              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Status: <strong>{log.status}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setLightboxAttachment({ attachment, log })}
                  className="text-teal-800 hover:text-teal-950 font-semibold inline-flex items-center gap-1"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Paperclip className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-800">No Learning Evidence Attached</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Attach assessment forms, care plans, chart audits, EWS sheets, or SBAR notes to your
            Part II session log sheets to populate your evidence vault.
          </p>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {lightboxAttachment.attachment.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Session {lightboxAttachment.log.sessionNumber}: {lightboxAttachment.log.sessionTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxAttachment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex-1 flex items-center justify-center overflow-auto max-h-[70vh]">
              <img
                src={lightboxAttachment.attachment.dataUrl}
                alt={lightboxAttachment.attachment.name}
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                {lightboxAttachment.attachment.notes || 'Evidence verified and de-identified.'}
              </span>
              <a
                href={lightboxAttachment.attachment.dataUrl}
                download={lightboxAttachment.attachment.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
