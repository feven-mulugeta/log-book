import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, X, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import {
  verifyPreceptorPinDetailed,
  verifyLeadEducatorPin,
  getStoredPreceptors,
} from '../utils/storage';
import { RegisteredPreceptor } from '../types/nursing';

interface PreceptorPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (preceptor?: RegisteredPreceptor) => void;
  title?: string;
  subtitle?: string;
  requiredRole?: 'preceptor' | 'lead_educator';
}

export function PreceptorPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Preceptor / Mentor Security Authorization',
  subtitle = 'Only authorized preceptors or clinical mentors can sign off competencies and update status to Met.',
  requiredRole = 'preceptor',
}: PreceptorPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [identifiedPreceptor, setIdentifiedPreceptor] = useState<RegisteredPreceptor | null>(null);

  if (!isOpen) return null;

  const preceptors = getStoredPreceptors();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result =
      requiredRole === 'lead_educator'
        ? verifyLeadEducatorPin(pin)
        : verifyPreceptorPinDetailed(pin);

    if (result.valid) {
      setError(null);
      setIdentifiedPreceptor(result.preceptor || null);
      setTimeout(() => {
        setPin('');
        setIdentifiedPreceptor(null);
        onSuccess(result.preceptor);
      }, 350);
    } else {
      setError(
        requiredRole === 'lead_educator'
          ? 'Invalid Lead Clinical Educator authorization code. Please check with your program coordinator.'
          : 'Invalid authorization PIN. Please enter your confidential assigned preceptor PIN or lead educator code.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-teal-800 rounded-lg">
              <Lock className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              <p className="text-[10px] text-teal-200 font-sans">
                {requiredRole === 'lead_educator'
                  ? 'Restricted to Lead Clinical Educator / Program Director'
                  : 'Restricted to Assigned Clinical Preceptors & Mentors'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-teal-200 hover:text-white rounded-lg hover:bg-teal-800"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed text-[11px]">{subtitle}</p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-xs">
              <Key className="w-3.5 h-3.5 text-teal-700" />
              <span>
                {requiredRole === 'lead_educator'
                  ? 'Enter Lead Educator Master Passcode / PIN:'
                  : 'Enter Your Assigned Preceptor PIN:'}
              </span>
            </span>
            <input
              type="password"
              autoFocus
              maxLength={10}
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 text-center text-xl font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-bold bg-white"
            />
            <p className="text-[10px] text-slate-500 text-center">
              {requiredRole === 'lead_educator'
                ? 'Enter the institutional master passcode set in the Instructor Portal.'
                : 'Enter the individual 4-digit PIN provided to you by your Lead Clinical Educator.'}
            </p>
          </div>

          {identifiedPreceptor && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-medium animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Authorized as: <strong>{identifiedPreceptor.name}</strong> ({identifiedPreceptor.title} · {identifiedPreceptor.wardDepartment})
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Authorized Directory without revealing secrets */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              className="text-[11px] text-teal-800 hover:text-teal-950 font-semibold flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {showDirectory ? 'Hide Preceptor Directory' : `View Authorized Mentors & Preceptors (${preceptors.length})`}
              </span>
            </button>

            {showDirectory && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-2 max-h-44 overflow-y-auto">
                <p className="text-slate-600 text-[10px]">
                  Only verified institutional staff on this roster have an active PIN. To register a new mentor or reset your PIN, contact the Lead Clinical Educator:
                </p>
                <div className="space-y-1.5">
                  {preceptors.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{p.name} ({p.initials})</div>
                        <div className="text-[10px] text-slate-500">{p.title} · {p.wardDepartment}</div>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                        <ShieldCheck className="w-3 h-3 text-teal-600" />
                        <span>Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-2xs"
            >
              Authorize &amp; Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

