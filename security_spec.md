# NCEP Clinical Logbook — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Verified Authentication Gate:** All reads and writes require `request.auth != null && request.auth.token.email_verified == true`.
2. **No Self-Assigned Roles:** Non-admin users creating `/users/{userId}` can only create `role: "member"` and cannot escalate `role` to `"admin"`. Staff access in `/staffMembers/{userId}` requires matching a valid PIN in admin-only `/staffSecrets/{preceptorId}` or being written by an admin.
3. **PII Isolation:** User emails live exclusively in `/users/{userId}/private/info` and are readable/writable only by the owner (`request.auth.uid == userId`) or an admin.
4. **Trainee Dossier Ownership & Terminal Locking:** A trainee can only read/write their own `/cohortStudents/{studentId}` record (`ownerUid == request.auth.uid`) and cannot self-certify `finalSignoff.isCertified = true`. Once certified (`finalSignoff.isCertified == true`), non-admins cannot alter the dossier.
5. **Master Gate on Subcollections:** Activity logs (`/cohortStudents/{studentId}/logs/{logId}`) and attachments (`/cohortStudents/{studentId}/logs/{logId}/attachments/{attachmentId}`) always validate parent dossier existence and ownership via `get()`.
6. **Student vs Preceptor Tiered Write Boundaries:** Trainees cannot mark their own session log `status: "Met"` or sign `preceptorSignoff.isSigned = true`, and cannot edit a log once `status == "Met"`. Only verified staff (`exists(/databases/$(database)/documents/staffMembers/$(request.auth.uid))`) or admins can sign off competencies.
7. **Strict Query & Cost Controls:** `allow list` rules evaluate `resource.data` directly against `request.auth.uid` (or `isRootAdmin()`) with zero `get()`/`exists()` calls. Every string and ID has explicit length bounds.

## 2. "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated read/write:** Request with `auth = null` on `/cohortStudents/{id}` -> DENIED.
2. **Unverified email write:** Request with `email_verified: false` claiming root admin email `feven.mulugeta@aau.edu.et` -> DENIED.
3. **Self-assigned admin role:** Non-admin creates `/users/{uid}` with `role: "admin"` -> DENIED.
4. **PII cross-user read:** User A reads `/users/{userB}/private/info` -> DENIED.
5. **Shadow field injection:** User creates/updates `/cohortStudents/{id}` with extra field `isBypassed: true` -> DENIED (`hasOnly` rejects).
6. **Student self-certification:** Student updates `/cohortStudents/{id}` setting `finalSignoff.isCertified: true` -> DENIED.
7. **Student self-signing Part II:** Student creates/updates `/cohortStudents/{id}/logs/{logId}` with `status: "Met"` or `preceptorSignoff.isSigned: true` -> DENIED.
8. **Editing terminal `Met` log:** Student modifies `activityDescription` on a log whose existing `status == "Met"` -> DENIED.
9. **Fake preceptor escalation:** Student creates `/staffMembers/{uid}` with wrong `claimPin` or elevated `role` -> DENIED.
10. **ID Poisoning:** Client writes document with 300-char ID or spaces/slashes (`../admin`) -> DENIED (`isValidId` rejects).
11. **Timestamp spoofing:** Client writes `createdAt` or `updatedAt` with a custom past/future timestamp instead of `request.time` -> DENIED.
12. **Blanket list scraping:** Non-admin runs unrestricted `getDocs(collection(db, 'cohortStudents'))` without ownership/assignment -> DENIED by `allow list`.
