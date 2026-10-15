import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, X, AlertCircle, Users, CheckCircle2 } from 'lucide-react';
import {
  verifyPreceptorPinDetailed,
  getStoredPreceptors,
  getPreceptorPin,
} from '../utils/storage';
import { RegisteredPreceptor } from '../types/nursing';

interface PreceptorPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (preceptor?: RegisteredPreceptor) => void;
  title?: string;
  subtitle?: string;
}

export function PreceptorPinModal({
  isOpen,
  onClose,
  onSuccess,
  title = 'Preceptor / Mentor Security Authorization',
  subtitle = 'Only authorized preceptors or clinical mentors can sign off competencies and update status to Met.',
}: PreceptorPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [identifiedPreceptor, setIdentifiedPreceptor] = useState<RegisteredPreceptor | null>(null);

  if (!isOpen) return null;

  const preceptors = getStoredPreceptors();
  const defaultMasterPin = getPreceptorPin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = verifyPreceptorPinDetailed(pin);
    if (result.valid) {
      setError(null);
      setIdentifiedPreceptor(result.preceptor || null);
      setTimeout(() => {
        setPin('');
        setIdentifiedPreceptor(null);
        onSuccess(result.preceptor);
      }, 400);
    } else {
      setError('Invalid authorization PIN. Please enter your personal preceptor PIN or institutional code.');
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
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-teal-200 hover:text-white rounded-lg hover:bg-teal-800"
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
              <span>Enter Preceptor / Mentor Authorization PIN:</span>
            </span>
            <input
              type="password"
              autoFocus
              maxLength={10}
              placeholder="e.g. 4182, 7021, 9090..."
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700 font-bold"
            />
            <p className="text-[10px] text-slate-500 text-center">
              Enter your individual instructor PIN or master institutional code (<code>{defaultMasterPin}</code>).
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

          {/* Collapsible Registered Preceptors Guide */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              className="text-[11px] text-teal-800 hover:text-teal-950 font-semibold flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {showDirectory ? 'Hide Preceptor Directory' : `View Authorized Preceptors (${preceptors.length})`}
              </span>
            </button>

            {showDirectory && (
              <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-2 max-h-40 overflow-y-auto">
                <p className="text-slate-500 italic">
                  Instructors can manage or add custom PINs in the <strong>Instructor &amp; Cohorts</strong> tab:
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
                      <div className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-[10px]">
                        PIN: {p.pin}
                      </div>
                    </div>
                  ))}
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[10px]">
                    <span className="font-medium text-slate-700">Master Institutional Backup Code</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {defaultMasterPin}
                    </span>
                  </div>
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

