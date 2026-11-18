/**
 * Dirty Dozen Security Rule Verification Spec
 * Documents adversarial payloads expected to return PERMISSION_DENIED under firestore.rules.
 */

export const DIRTY_DOZEN_PAYLOADS = [
  {
    name: '01_unauthenticated_read',
    auth: null,
    path: '/cohortStudents/student-roster-NCEP-052-26',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '02_unverified_admin_email_spoof',
    auth: { uid: 'attacker-1', token: { email: 'feven.mulugeta@aau.edu.et', email_verified: false } },
    path: '/cohortStudents/student-roster-NCEP-052-26',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '03_self_assigned_admin_role',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/users/student-1',
    operation: 'create',
    payload: { uid: 'student-1', displayName: 'Student', role: 'admin', linkedStudentId: '' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '04_cross_user_pii_read',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/users/student-2/private/info',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '05_shadow_field_injection',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents/student-1',
    operation: 'update',
    payload: { isVerifiedOverride: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '06_student_self_certification',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents/student-1',
    operation: 'update',
    payload: { finalSignoff: { isCertified: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '07_student_self_sign_met_log',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents/student-1/logs/session-1',
    operation: 'create',
    payload: { status: 'Met', preceptorSignoff: { isSigned: true } },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '08_student_edit_terminal_met_log',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents/student-1/logs/session-1',
    operation: 'update',
    payload: { activityDescription: 'Tampered after preceptor signed' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '09_fake_preceptor_pin_escalation',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/staffMembers/student-1',
    operation: 'create',
    payload: { uid: 'student-1', preceptorId: 'prec-1', role: 'preceptor', claimPin: '0000' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10_id_poisoning_invalid_chars',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents/invalid id with spaces and $',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11_timestamp_spoofing',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents/student-1',
    operation: 'update',
    payload: { updatedAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12_blanket_list_scraping',
    auth: { uid: 'student-1', token: { email: 's1@example.com', email_verified: true } },
    path: '/cohortStudents',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
  },
];
