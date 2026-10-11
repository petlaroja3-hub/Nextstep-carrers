# NextStep Careers — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Default-Deny Catch-All**: All paths not explicitly matched are denied (`allow read, write: if false;`).
2. **Public vs. Unpublished Content Isolation**: Public (unauthenticated or non-admin) readers may only read (`get` or `list`) documents in `courses`, `courseCategories`, `entranceExams`, `colleges`, `scholarships`, `careers`, `careerUpdates`, `officialSources`, and `notifications` when `resource.data.published == true`.
3. **Administrator Write Exclusivity**: Only verified administrators (`isAdmin()`) may `create`, `update`, or `delete` documents in any educational, source, update, or notification collection.
4. **No Self-Assigned Admin Privileges**: Users cannot create or modify their own document in `adminRoles` unless they are already the bootstrapped super-admin (`kodurisiri67@gmail.com` with `email_verified == true`).
5. **Private User Preferences Isolation (`userPreferences/{userId}`)**: Only the authenticated, email-verified owner (`request.auth.uid == userId`) can `get`, `list`, `create`, `update`, or `delete` their own `userPreferences/{userId}` document.
6. **Strict Schema & Volumetric Validation (`isValid[Entity]`)**: Every `create` and `update` operation validates exact keys (`hasAll` and `hasOnly`), string lengths (`.size() >= min && .size() <= max`), bounded arrays (`.size() <= 15` or `100` with element type check), and enums.
7. **Temporal & Immutable Integrity**: Every `create` requires `incoming().createdAt == request.time` (and `incoming().updatedAt == request.time` where applicable). Every `update` requires `incoming().createdAt == existing().createdAt` and `incoming().updatedAt == request.time`.
8. **Zero O(n) List Lookups**: No `allow list` rule invokes `get()` or `exists()`.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on Course**: Admin or attacker sends `{ ...validCourse, isSuperVerified: true }` -> Rejected by `data.keys().hasOnly(...)`.
2. **Unverified Admin Email Spoof**: Attacker signs in with `email == 'kodurisiri67@gmail.com'` but `email_verified == false` -> Rejected by `isVerifiedUser()`.
3. **Public Scraping of Unpublished Exams**: Unauthenticated client executes `list` on `/entranceExams` without `where('published', '==', true)` -> Rejected by `existing().published == true`.
4. **Privilege Escalation in `adminRoles`**: Regular signed-in user attempts `setDoc(doc(db, 'adminRoles', uid), { uid, email, role: 'admin', createdAt: serverTimestamp() })` -> Rejected because only `isBootstrappedAdmin()` can write to `adminRoles`.
5. **Cross-User Preference Snooping (PII/Privacy Leak)**: Authenticated user `userA` attempts `getDoc(doc(db, 'userPreferences', 'userB'))` -> Rejected by `request.auth.uid == userId`.
6. **ID Poisoning Attack**: Client attempts to create a document with a 500-character or special-character ID -> Rejected by `isValidId(id)`.
7. **Denial-of-Wallet Oversized String**: Client sends a 50,000-character `description` in `userPreferences` or `courses` -> Rejected by `.size() <= max`.
8. **Unbounded Array Injection**: User sends `interests` array with 500 items in `userPreferences` -> Rejected by `data.interests.size() <= 10`.
9. **Array Element Type Poisoning**: User sends `interests: [12345]` (number instead of string) -> Rejected by `data.interests.size() == 0 || data.interests[0] is string`.
10. **Timestamp Forgery (Backdating)**: Client sends a custom past timestamp for `createdAt` or `updatedAt` instead of `serverTimestamp()` -> Rejected by `incoming().createdAt == request.time`.
11. **Immortal Field Mutation**: Client attempts to mutate `createdAt` or `userId` during an `update` -> Rejected by `incoming().createdAt == existing().createdAt && incoming().userId == existing().userId`.
12. **Update-Gap Type Poisoning**: Client updates an allowed key (`preferredState`) in `userPreferences` with a boolean `true` instead of a valid state enum string -> Rejected because `isValidUserPreference(incoming())` wraps the entire `allow update` block.
