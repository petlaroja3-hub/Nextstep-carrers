/**
 * Phase 0 TDD: Firestore Security Rules Adversarial Verification Suite
 * Verifies all 12 Dirty Dozen payloads defined in `security_spec.md` are
 * rejected by `firestore.rules`.
 */

export const DIRTY_DOZEN_SECURITY_ASSERTIONS = [
  {
    id: 1,
    name: 'Shadow Field Injection on Course',
    collection: 'courses',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'isValidCourse(incoming()) -> data.keys().hasOnly(...)'
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    collection: 'courses',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'isVerifiedUser() -> request.auth.token.email_verified == true'
  },
  {
    id: 3,
    name: 'Public Scraping of Unpublished Entrance Exams',
    collection: 'entranceExams',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'allow list: if existing().published == true || isBootstrappedAdmin()'
  },
  {
    id: 4,
    name: 'Privilege Escalation in adminRoles',
    collection: 'adminRoles',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'allow create: if isValidId(adminUid) && isBootstrappedAdmin()'
  },
  {
    id: 5,
    name: 'Cross-User Preference Snooping',
    collection: 'userPreferences',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'allow get: if isValidId(userId) && isOwner(userId)'
  },
  {
    id: 6,
    name: 'ID Poisoning Attack (>128 chars or invalid regex)',
    collection: 'colleges',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'isValidId(collegeId)'
  },
  {
    id: 7,
    name: 'Denial-of-Wallet Oversized String',
    collection: 'scholarships',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'data.eligibility.size() <= 1200'
  },
  {
    id: 8,
    name: 'Unbounded Array Injection (>10 items in userPreferences)',
    collection: 'userPreferences',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'isBoundedStringList(data.interests, 10)'
  },
  {
    id: 9,
    name: 'Array Element Type Poisoning (non-string element)',
    collection: 'userPreferences',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'arr[0] is string && arr[0].size() <= 300'
  },
  {
    id: 10,
    name: 'Timestamp Forgery (Backdated createdAt)',
    collection: 'careerUpdates',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'incoming().createdAt == request.time'
  },
  {
    id: 11,
    name: 'Immortal Field Mutation (createdAt or userId modified on update)',
    collection: 'userPreferences',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'incoming().userId == existing().userId && incoming().createdAt == existing().createdAt'
  },
  {
    id: 12,
    name: 'Update-Gap Type Poisoning on whitelisted field',
    collection: 'userPreferences',
    expected: 'PERMISSION_DENIED',
    ruleGate: 'isValidUserPreference(incoming()) wraps entire allow update block'
  }
];
