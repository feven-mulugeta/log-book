import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, User, X, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { CohortStudentRecord } from '../types/nursing';
import { verifyStudentPin, setStudentUnlocked, verifyPreceptorPin } from '../utils/storage';

interface StudentPinModalProps {
  isOpen: boolean;
  student: CohortStudentRecord | null;
  onSuccess: () => void;
  onCancel: () => void;
  onPreceptorOverride?: () => void;
}

export function StudentPinModal({
  isOpen,
  student,
  onSuccess,
  onCancel,
  onPreceptorOverride,
}: StudentPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMessage('');
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError(true);
      setErrorMessage('Please enter your 4-digit Student PIN.');
      return;
    }

    const isValid = verifyStudentPin(student, pin.trim());
    if (isValid) {
      const studentKey = student.traineeInfo.traineeId || student.id;
      setStudentUnlocked(studentKey, true);
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setErrorMessage('Incorrect Student PIN. Please try again or ask your Preceptor / Lead Educator.');
    }
  };

  const handleKeyClick = (val: string) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      setError(false);
      if (newPin.length === 4) {
        // Auto-check on 4th digit
        const isValid = verifyStudentPin(student, newPin);
        if (isValid) {
          const studentKey = student.traineeInfo.traineeId || student.id;
          setStudentUnlocked(studentKey, true);
          onSuccess();
        } else {
          setError(true);
          setErrorMessage('Incorrect Student PIN. Please try again or contact your Lead Educator.');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl text-teal-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Student Identity Verification</h3>
              <p className="text-[11px] text-teal-200">Personal Logbook Access Protection</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Target Student Identity Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-300 text-teal-900 font-bold text-xs flex items-center justify-center shrink-0">
              {student.traineeInfo.traineeName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'ST'}
            </div>
            <div className="overflow-hidden flex-1 text-xs">
              <p className="font-bold text-slate-900 truncate">
                {student.traineeInfo.traineeName || 'Trainee'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                ID: {student.traineeInfo.traineeId}
              </p>
              <p className="text-[10px] text-teal-800 font-medium truncate mt-0.5">
                Ward: {student.traineeInfo.clinicalDepartmentWard || 'Clinical Ward'}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            To prevent other students from viewing, altering, or manipulating your clinical shift entries and reflections, please enter your personal <strong>4-digit Student PIN</strong>.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Enter 4-Digit Student PIN:</label>
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[11px] text-slate-500 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'Hide PIN' : 'Show PIN'}</span>
                </button>
              </div>

              {/* Pin Display Boxes */}
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const digit = pin[idx];
                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-bold transition-all ${
                        digit
                          ? 'border-teal-700 bg-teal-50 text-teal-950 shadow-xs'
                          : error
                          ? 'border-rose-400 bg-rose-50 text-rose-900'
                          : 'border-slate-300 bg-slate-50 text-slate-400'
                      }`}
                    >
                      {digit ? (showPin ? digit : '•') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Hidden input for direct keyboard entry on PC/laptop */}
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                  setError(false);
                  if (val.length === 4) {
                    const isValid = verifyStudentPin(student, val);
                    if (isValid) {
                      const studentKey = student.traineeInfo.traineeId || student.id;
                      setStudentUnlocked(studentKey, true);
                      onSuccess();
                    } else {
                      setError(true);
                      setErrorMessage('Incorrect Student PIN. Please try again or contact your Lead Educator.');
                    }
                  }
                }}
                className="w-full text-center tracking-widest text-transparent h-0 opacity-0 pointer-events-none"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage || 'Incorrect Student PIN.'}</span>
              </div>
            )}

            {/* On-Screen Touch Keypad for Phones and Tablets */}
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-[280px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  type="button"
                  key={digit}
                  onClick={() => handleKeyClick(digit)}
                  className="py-3 text-lg font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-teal-100 rounded-xl transition-colors cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="py-3 text-xs font-semibold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer select-none"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeyClick('0')}
                className="py-3 text-lg font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 active:bg-teal-100 rounded-xl transition-colors cursor-pointer select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer select-none"
              >
                ⌫
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={pin.length < 4}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 disabled:opacity-40 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Unlock Logbook</span>
              </button>
            </div>
          </form>

          {/* Help Banner */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <p>
              <strong>Forgot your PIN?</strong> Contact Lead Clinical Educator Mr. Yohannes Ayalew or your clinical preceptor to look up or reset your passcode.
            </p>
            {onPreceptorOverride && (
              <p>
                Faculty / Preceptor?{' '}
                <button
                  type="button"
                  onClick={onPreceptorOverride}
                  className="text-teal-800 font-bold underline hover:text-teal-950"
                >
                  Unlock with Preceptor PIN
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
