import React, { useState } from 'react';
import { KeyRound, CheckCircle2, ShieldAlert, X, Eye, EyeOff, Lock } from 'lucide-react';
import { CohortStudentRecord, TraineeInformation } from '../types/nursing';
import { verifyStudentPin, saveStoredTraineeInfo, getStoredCohortStudents, saveStoredCohortStudents, setStudentUnlocked } from '../utils/storage';
import { cloudSync } from '../utils/cloudSync';

interface StudentChangePinModalProps {
  isOpen: boolean;
  student: CohortStudentRecord | null;
  traineeInfo: TraineeInformation;
  onClose: () => void;
  onPinChanged: (newPin: string) => void;
}

export function StudentChangePinModal({
  isOpen,
  student,
  traineeInfo,
  onClose,
  onPinChanged,
}: StudentChangePinModalProps) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const currentStudent = student || {
    id: traineeInfo.traineeId,
    traineeInfo,
    detailedLogs: [],
    finalSignoff: { isCertified: false, leadEducatorName: '', leadEducatorTitle: '' },
    updatedAt: new Date().toISOString(),
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPin.trim()) {
      setError('Please enter your current Student PIN.');
      return;
    }

    // Verify current PIN
    const isCurrentValid = verifyStudentPin(currentStudent, currentPin.trim());
    if (!isCurrentValid) {
      setError('Current Student PIN is incorrect. If you forgot your PIN, please contact Lead Educator Mr. Yohannes Ayalew.');
      return;
    }

    if (!/^\d{4}$/.test(newPin.trim())) {
      setError('New PIN must be exactly 4 numeric digits (e.g. 5226).');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('New PIN and confirmation do not match.');
      return;
    }

    const cleanNewPin = newPin.trim();

    // Update in storage and state
    const studentId = currentStudent.traineeInfo.traineeId || currentStudent.id;
    const cohort = getStoredCohortStudents();
    const updatedCohort = cohort.map((s) => {
      if (s.id === currentStudent.id || s.traineeInfo.traineeId === currentStudent.traineeInfo.traineeId) {
        return {
          ...s,
          studentPin: cleanNewPin,
          traineeInfo: {
            ...s.traineeInfo,
            studentPin: cleanNewPin,
          },
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });

    saveStoredCohortStudents(updatedCohort);
    cloudSync.syncCohort(updatedCohort);

    const updatedTraineeInfo: TraineeInformation = {
      ...traineeInfo,
      studentPin: cleanNewPin,
    };
    saveStoredTraineeInfo(updatedTraineeInfo);
    setStudentUnlocked(studentId, true);

    const matchingStudent = updatedCohort.find(
      (s) => s.id === currentStudent.id || s.traineeInfo.traineeId === currentStudent.traineeInfo.traineeId
    );
    if (matchingStudent) {
      cloudSync.syncStudent(matchingStudent, 'trainee', `Updated personal Student PIN for ${matchingStudent.traineeInfo.traineeName}`);
    }

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onPinChanged(cleanNewPin);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs font-sans animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl text-teal-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Change My Student PIN</h3>
              <p className="text-[11px] text-teal-200">Personal Access Code Security</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-teal-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Student PIN Changed Successfully!</h4>
              <p className="text-slate-600 text-[11px]">
                Your personal Student PIN has been updated. Use this 4-digit passcode next time you access your portfolio.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-[11px] text-teal-950 space-y-1">
                <span className="font-bold block">Trainee Data Protection</span>
                <p className="text-teal-900 leading-relaxed">
                  Your Student PIN safeguards your shift logs, reflections, and attachments. Choose a 4-digit code that is easy for you to remember but cannot be guessed by other trainees.
                </p>
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current PIN */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  • Current Student PIN:
                </label>
                <div className="relative">
                  <input
                    type={showPins ? 'text' : 'password'}
                    required
                    maxLength={4}
                    inputMode="numeric"
                    placeholder="Enter current 4-digit PIN"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm tracking-widest text-slate-900"
                  />
                </div>
              </div>

              {/* New PIN */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  • New 4-Digit Student PIN:
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  required
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="e.g. 5226"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm tracking-widest text-slate-900"
                />
              </div>

              {/* Confirm New PIN */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  • Confirm New 4-Digit Student PIN:
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  required
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Re-enter new 4-digit PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm tracking-widest text-slate-900"
                />
              </div>

              {/* Show / Hide toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPins(!showPins)}
                  className="text-[11px] text-slate-500 hover:text-teal-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPins ? 'Mask PINs' : 'Show digits'}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={currentPin.length < 4 || newPin.length < 4 || confirmPin.length < 4}
                  className="px-5 py-2 font-bold text-white bg-teal-800 hover:bg-teal-900 disabled:opacity-40 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update My PIN</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
