import React from 'react';
import {
  TraineeInformation,
  DetailedActivityLogSheet,
  FinalCompetencySignoff,
} from '../types/nursing';
import { NCEP_SESSIONS_DEFINITIONS } from '../data/ncepData';

interface NcepAcademicPrintViewProps {
  traineeInfo: TraineeInformation;
  detailedLogs: DetailedActivityLogSheet[];
  finalSignoff: FinalCompetencySignoff;
}

export function NcepAcademicPrintView({
  traineeInfo,
  detailedLogs,
  finalSignoff,
}: NcepAcademicPrintViewProps) {
  // Helper to find log for session
  const getLogForSession = (sessionNum: number) => {
    return detailedLogs.find((l) => l.sessionNumber === sessionNum);
  };

  const subCompetencies = [
    {
      title: 'Sub-Competency 1: Perform Patient Assessment',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_1'),
    },
    {
      title: 'Sub-Competency 2: Develop / Construct Nursing Diagnosis',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_2'),
    },
    {
      title: 'Sub-Competency 3: Design Prioritized Care Interventions',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_3'),
    },
    {
      title: 'Sub-Competency 4: Prevent, Detect and Respond to Complications',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_4'),
    },
    {
      title: 'Sub-Competency 5: Execute Nursing Interventions',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_5'),
    },
    {
      title: 'Sub-Competency 6: Monitor and Evaluate Continuous Patient Conditions',
      sessions: NCEP_SESSIONS_DEFINITIONS.filter((s) => s.subCompetencyId === 'sub_comp_6'),
    },
  ];

  return (
    <div className="hidden print:block font-serif text-black bg-white w-full max-w-4xl mx-auto p-4 space-y-12">
      {/* PAGE 1: TRAINEE INFORMATION & INSTRUCTIONS FOR USE */}
      <div className="min-h-[1050px] flex flex-col justify-between py-6 page-break-after">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 pb-6 border-b border-black">
            <h2 className="text-base font-bold tracking-wider uppercase font-sans">
              NURSING COMPETENCY ENHANCEMENT PROGRAM (NCEP)
            </h2>
            <h1 className="text-lg font-bold tracking-tight uppercase">
              CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION
            </h1>
            <h3 className="text-sm font-semibold tracking-wide uppercase font-sans">
              CLINICAL TRAINING &amp; PRACTICE LOGBOOK
            </h3>
            <div className="w-full h-0.5 bg-black mt-2" />
          </div>

          {/* TRAINEE INFORMATION */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase font-sans">TRAINEE INFORMATION</h3>
            <div className="space-y-3 text-xs leading-relaxed pl-4 font-sans">
              <p>
                • <strong>Trainee Name:</strong>{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[320px]">
                  {traineeInfo.traineeName}
                </span>
              </p>
              <p>
                • <strong>Trainee ID:</strong>{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[260px] font-mono">
                  {traineeInfo.traineeId}
                </span>
              </p>
              <p>
                • <strong>Clinical Department / Ward:</strong>{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[340px]">
                  {traineeInfo.clinicalDepartmentWard}
                </span>
              </p>
              <p>
                • <strong>Assigned Clinical Preceptor / Mentor:</strong>{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[300px]">
                  {traineeInfo.assignedClinicalPreceptor}
                </span>
              </p>
              <p>
                • <strong>Training Period:</strong> From{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[140px] text-center font-mono">
                  {traineeInfo.trainingPeriodFrom}
                </span>{' '}
                To{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[140px] text-center font-mono">
                  {traineeInfo.trainingPeriodTo}
                </span>
              </p>
            </div>
          </div>

          {/* INSTRUCTIONS FOR USE */}
          <div className="space-y-4 pt-6">
            <h3 className="text-sm font-bold uppercase font-sans">INSTRUCTIONS FOR USE</h3>
            <div className="space-y-4 text-xs leading-relaxed text-black">
              <p>
                <strong>1. Purpose:</strong> This logbook tracks your clinical application, practical
                competencies, and formative assessments for{' '}
                <strong>Core Competency 1: Clinical Judgment and Prioritization</strong>.
              </p>
              <p>
                <strong>2. Recording:</strong> Complete the respective entries following each session,
                simulation, or supervised clinical practice assignment, and attach the expected learning
                evidence for that session (e.g., assessment forms, care plans, chart audits, EWS sheets,
                SBAR notes, reflective entries).
              </p>
              <p>
                <strong>3. Sign-Off:</strong> Every practical task and clinical assignment must be
                verified and signed by your designated clinical preceptor, mentor, or educator.
              </p>
              <p>
                <strong>4. Portfolio Integration:</strong> Store completed pages in your professional
                nursing training portfolio for final evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex justify-between text-[10px] text-gray-600 border-t border-gray-300">
          <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
          <span>Page 1</span>
        </div>
      </div>

      {/* PAGES 2, 3, 4: PART I: COMPETENCY TRACKING MATRIX */}
      <div className="min-h-[1050px] flex flex-col justify-between py-6 page-break-after">
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase font-sans">PART I: COMPETENCY TRACKING MATRIX</h3>

          <table className="w-full text-xs text-left border-collapse border border-black font-sans">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-bold">
                <th className="p-2 border-r border-black w-1/4">Sub-Competency &amp; Session Focus</th>
                <th className="p-2 border-r border-black w-2/5">Required Clinical Activity / Assignment</th>
                <th className="p-2 border-r border-black text-center w-24">Date Completed</th>
                <th className="p-2 border-r border-black text-center w-24">Status (Pending / Met)</th>
                <th className="p-2 text-center w-20">Preceptor Initials</th>
              </tr>
            </thead>
            <tbody>
              {subCompetencies.map((sub, idx) => (
                <React.Fragment key={idx}>
                  <tr className="bg-gray-200 border-y border-black font-bold">
                    <td colSpan={5} className="p-1.5 uppercase text-[11px]">
                      {sub.title}
                    </td>
                  </tr>
                  {sub.sessions.map((s) => {
                    const log = getLogForSession(s.sessionNumber);
                    return (
                      <tr key={s.sessionNumber} className="border-b border-gray-400">
                        <td className="p-2 border-r border-gray-400 font-semibold align-top">
                          Session {s.sessionNumber}: {s.sessionTitle}
                        </td>
                        <td className="p-2 border-r border-gray-400 align-top text-[11px]">
                          {s.requiredActivity}
                        </td>
                        <td className="p-2 border-r border-gray-400 text-center font-mono align-top text-[11px]">
                          {log?.dateOfActivity || ''}
                        </td>
                        <td className="p-2 border-r border-gray-400 text-center font-bold align-top text-[11px]">
                          {log?.status === 'Met' ? 'Met' : 'Pending'}
                        </td>
                        <td className="p-2 text-center font-bold font-mono align-top text-[11px]">
                          {log?.preceptorSignoff?.preceptorInitials || ''}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="pt-8 flex justify-between text-[10px] text-gray-600 border-t border-gray-300">
          <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
          <span>Pages 2 – 4</span>
        </div>
      </div>

      {/* PAGES 5 & 6: PART II: DETAILED CLINICAL ACTIVITY LOG SHEETS */}
      {detailedLogs.slice(0, 3).map((log, idx) => (
        <div key={log.id} className="min-h-[1050px] flex flex-col justify-between py-6 page-break-after">
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase font-sans">
                PART II: DETAILED CLINICAL ACTIVITY LOG SHEETS
              </h3>
              <p className="text-[11px] text-gray-600 italic font-sans">
                (Make copies of this template for each clinical session or practice assignment performed).
              </p>
            </div>

            <div className="space-y-2 text-xs font-sans border-b border-black pb-4">
              <p>
                <strong>Session Number &amp; Title:</strong>{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[340px]">
                  Session {log.sessionNumber}: {log.sessionTitle}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <p>
                  <strong>Date of Activity:</strong>{' '}
                  <span className="border-b border-black pb-0.5 inline-block min-w-[140px] font-mono">
                    {log.dateOfActivity}
                  </span>
                </p>
                <p>
                  <strong>Duration (Hours):</strong>{' '}
                  <span className="border-b border-black pb-0.5 inline-block min-w-[100px]">
                    {log.durationHours}
                  </span>
                </p>
              </div>
              <p>
                <strong>Clinical Setting / Ward:</strong>{' '}
                <span className="border-b border-black pb-0.5 inline-block min-w-[340px]">
                  {log.clinicalSettingWard}
                </span>
              </p>
            </div>

            {/* 1. Description */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold font-sans">
                1. Description of Activity Performed:{' '}
                <span className="font-normal italic text-gray-600">
                  (Summarize the assessment, diagnosis, prioritization, care planning, escalation,
                  intervention, delegation, or evaluation task undertaken, and the patient context without
                  identifiers.)
                </span>
              </h4>
              <p className="leading-relaxed whitespace-pre-line p-2 border border-gray-300 rounded min-h-[90px]">
                {log.activityDescription}
              </p>
            </div>

            {/* 2. Reflective Notes */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold font-sans">
                2. Reflective Notes &amp; Lessons Learned:{' '}
                <span className="font-normal italic text-gray-600">
                  (What went well? What challenges did you encounter regarding data accuracy,
                  prioritization, early recognition of deterioration, escalation, documentation, or patient
                  status? How would you handle it differently next time?)
                </span>
              </h4>
              <p className="leading-relaxed whitespace-pre-line p-2 border border-gray-300 rounded min-h-[90px]">
                {log.reflectiveNotesLessonsLearned}
              </p>
            </div>

            {/* 3. Preceptor Feedback */}
            <div className="space-y-3 text-xs border border-black p-4 rounded font-sans">
              <h4 className="font-bold">3. Preceptor / Mentor Feedback &amp; Formative Evaluation:</h4>
              <div>
                <span className="font-semibold">• Competency Demonstrated:</span>
                <div className="flex gap-6 mt-1">
                  <span>
                    [{log.preceptorSignoff?.competencyDemonstrated === 'Satisfactory' ? 'X' : ' '}] Satisfactory
                  </span>
                  <span>
                    [{log.preceptorSignoff?.competencyDemonstrated === 'Needs Improvement' ? 'X' : ' '}] Needs Improvement
                  </span>
                  <span>
                    [{log.preceptorSignoff?.competencyDemonstrated === 'Unsatisfactory' ? 'X' : ' '}] Unsatisfactory
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold">
                  • Specific Preceptor / Mentor Comments / Actionable Advice:
                </span>
                <p className="p-2 border border-gray-300 rounded mt-1 italic text-xs min-h-[50px]">
                  {log.preceptorSignoff?.comments || ''}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <p>
                  <strong>• Preceptor / Mentor Name:</strong><br />
                  <span className="border-b border-black pb-0.5 inline-block min-w-[160px]">
                    {log.preceptorSignoff?.preceptorName || ''}
                  </span>
                </p>
                <div>
                  <strong>• Signature:</strong><br />
                  {log.preceptorSignoff?.signatureDataUrl ? (
                    <img
                      src={log.preceptorSignoff.signatureDataUrl}
                      alt="Signature"
                      className="h-8 object-contain"
                    />
                  ) : (
                    <span className="border-b border-black inline-block min-w-[100px] h-6" />
                  )}
                </div>
                <p>
                  <strong>• Date Signed:</strong><br />
                  <span className="border-b border-black pb-0.5 inline-block min-w-[100px] font-mono">
                    {log.preceptorSignoff?.dateSigned || ''}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 flex justify-between text-[10px] text-gray-600 border-t border-gray-300">
            <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
            <span>Pages 5 – 6 (Sheet {idx + 1})</span>
          </div>
        </div>
      ))}

      {/* PAGE 7: PART III: FINAL COMPETENCY SIGN-OFF */}
      <div className="min-h-[1050px] flex flex-col justify-between py-6">
        <div className="space-y-10">
          <div className="space-y-3">
            <h3 className="text-base font-bold uppercase font-sans text-center border-b border-black pb-3">
              PART III: FINAL COMPETENCY SIGN-OFF
            </h3>
            <p className="text-sm font-sans text-center text-gray-700">
              CORE COMPETENCY 1: CLINICAL JUDGMENT AND PRIORITIZATION
            </p>
          </div>

          <div className="p-6 border border-black rounded text-center space-y-4 font-serif">
            <p className="text-sm sm:text-base leading-relaxed font-medium">
              This is to certify that the trainee has successfully completed all required sessions,
              practical assignments, and formative assessments outlined in{' '}
              <strong>Core Competency 1: Clinical Judgment and Prioritization</strong>.
            </p>
          </div>

          <div className="space-y-6 pt-4 font-sans text-xs">
            <p>
              • <strong>Lead Clinical Educator / Coordinator Name:</strong>{' '}
              <span className="border-b border-black pb-0.5 inline-block min-w-[320px] font-bold">
                {finalSignoff.leadEducatorName}
              </span>
            </p>

            <div className="grid grid-cols-2 gap-8 pt-6">
              <div>
                <p className="font-bold">• Signature:</p>
                {finalSignoff.signatureDataUrl ? (
                  <img
                    src={finalSignoff.signatureDataUrl}
                    alt="Signature"
                    className="h-12 object-contain mt-2"
                  />
                ) : (
                  <div className="h-12 border-b border-black mt-2" />
                )}
              </div>

              <div>
                <p className="font-bold">• Date:</p>
                <p className="font-mono text-sm font-semibold border-b border-black mt-2 pb-1">
                  {finalSignoff.dateSigned || ''}
                </p>
              </div>
            </div>

            {finalSignoff.verificationHash && (
              <div className="pt-8 text-center text-[10px] text-gray-500 font-mono">
                SECURE RECORD TOKEN: {finalSignoff.verificationHash}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex justify-between text-[10px] text-gray-600 border-t border-gray-300">
          <span>NCEP | Core Competency 1: Clinical Judgment and Prioritization | Logbook</span>
          <span>Page 7</span>
        </div>
      </div>
    </div>
  );
}
