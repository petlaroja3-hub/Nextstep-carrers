import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  BOOTSTRAPPED_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  type User
} from '../firebase';
import type {
  Course,
  CourseCategory,
  EntranceExam,
  College,
  Scholarship,
  Career,
  CareerUpdate,
  OfficialSource,
  VerificationLog,
  NotificationItem,
  UserPreference
} from '../types';
import {
  INITIAL_COURSES,
  INITIAL_COURSE_CATEGORIES,
  INITIAL_ENTRANCE_EXAMS,
  INITIAL_COLLEGES,
  INITIAL_SCHOLARSHIPS,
  INITIAL_CAREERS,
  INITIAL_CAREER_UPDATES,
  INITIAL_OFFICIAL_SOURCES,
  INITIAL_NOTIFICATIONS
} from '../data/verifiedInitialData';

// Sanitize ID to match ^[a-zA-Z0-9_\-]+$ and length 1..128
export function sanitizeDocId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned.length > 0 ? cleaned : `doc-${Date.now()}`;
}

function clampStr(val: unknown, minLen: number, maxLen: number, fallback = 'N/A'): string {
  const s = typeof val === 'string' ? val.trim() : '';
  if (s.length < minLen) {
    return fallback.slice(0, maxLen);
  }
  return s.slice(0, maxLen);
}

function clampOptionalStr(val: unknown, maxLen: number): string {
  const s = typeof val === 'string' ? val.trim() : '';
  return s.slice(0, maxLen);
}

function clampStrList(val: unknown, maxItems = 15): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map(item => String(item || '').trim().slice(0, 290))
    .filter(Boolean)
    .slice(0, maxItems);
}

export async function checkIsAdminUser(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;
  const path = `adminRoles/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'adminRoles', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function fetchCollectionRecords<T extends { id: string; published?: boolean }>(
  collectionName: string,
  includeUnpublishedForAdmin: boolean,
  fallbackData: T[]
): Promise<{ records: T[]; fromFirestore: boolean }> {
  try {
    const colRef = collection(db, collectionName);
    const q = includeUnpublishedForAdmin
      ? query(colRef)
      : query(colRef, where('published', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) {
      const filteredFallback = includeUnpublishedForAdmin
        ? fallbackData
        : fallbackData.filter(item => item.published !== false);
      return { records: filteredFallback, fromFirestore: false };
    }
    const records: T[] = snap.docs.map(d => ({
      ...(d.data() as Omit<T, 'id'>),
      id: d.id
    })) as T[];
    return { records, fromFirestore: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

export async function fetchVerificationLogs(adminUid: string, isBootstrapped: boolean): Promise<VerificationLog[]> {
  const path = 'verificationHistory';
  try {
    const colRef = collection(db, path);
    const q = isBootstrapped
      ? query(colRef)
      : query(colRef, where('checkedByUid', '==', adminUid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      ...(d.data() as Omit<VerificationLog, 'id'>),
      id: d.id
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

// ============================================================================
// DEFENSIVE PAYLOAD BUILDERS (MATCHING firebase-blueprint.json & firestore.rules)
// ============================================================================

export function buildCoursePayload(c: Partial<Course>, existingCreatedAt?: unknown) {
  return {
    title: clampStr(c.title, 2, 200, 'Untitled Course'),
    titleTe: clampOptionalStr(c.titleTe, 250),
    level: c.level === 'after_inter' ? 'after_inter' : 'after_10th',
    category: clampStr(c.category, 2, 100, 'General Pathway'),
    duration: clampStr(c.duration, 2, 100, '2 Years'),
    eligibility: clampStr(c.eligibility, 5, 1000, 'Pass in qualifying examination from recognized board.'),
    eligibilityTe: clampOptionalStr(c.eligibilityTe, 1200),
    description: clampStr(c.description, 10, 2500, 'Educational course pathway description.'),
    descriptionTe: clampOptionalStr(c.descriptionTe, 3000),
    subjects: clampStrList(c.subjects, 15),
    studyPathways: clampStrList(c.studyPathways, 15),
    careerOpportunities: clampStrList(c.careerOpportunities, 15),
    furtherEducation: clampStrList(c.furtherEducation, 15),
    entranceExams: clampStrList(c.entranceExams, 15),
    admissionProcess: clampStr(c.admissionProcess, 2, 1000, 'Merit or entrance based admission.'),
    officialSourceName: clampStr(c.officialSourceName, 2, 200, 'Official Education Board'),
    officialUrl: clampStr(c.officialUrl, 5, 500, 'https://education.gov.in'),
    state: (['Andhra Pradesh', 'Telangana', 'All India', 'AP & TG'].includes(String(c.state))
      ? c.state
      : 'All India') as Course['state'],
    published: Boolean(c.published ?? true),
    isSampleData: Boolean(c.isSampleData ?? false),
    lastVerifiedDate: clampStr(c.lastVerifiedDate, 4, 60, '2026-10-11'),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildCourseCategoryPayload(cat: Partial<CourseCategory>, existingCreatedAt?: unknown) {
  return {
    name: clampStr(cat.name, 2, 120, 'Course Category'),
    nameTe: clampOptionalStr(cat.nameTe, 150),
    level: (['after_10th', 'after_inter', 'both'].includes(String(cat.level))
      ? cat.level
      : 'both') as CourseCategory['level'],
    description: clampStr(cat.description, 5, 600, 'Recognized educational course category.'),
    published: Boolean(cat.published ?? true),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildEntranceExamPayload(ex: Partial<EntranceExam>, existingCreatedAt?: unknown) {
  const datesVerified = Boolean(ex.datesVerified ?? false);
  const importantDates = datesVerified
    ? clampStr(ex.importantDates, 4, 500, 'Official date not verified.')
    : 'Official date not verified.';
  return {
    name: clampStr(ex.name, 2, 180, 'Entrance Examination'),
    nameTe: clampOptionalStr(ex.nameTe, 220),
    category: clampStr(ex.category, 2, 100, 'General Entrance Exam'),
    state: (['Andhra Pradesh', 'Telangana', 'All India', 'AP & TG'].includes(String(ex.state))
      ? ex.state
      : 'All India') as EntranceExam['state'],
    purpose: clampStr(ex.purpose, 5, 1000, 'Admission to recognized higher education programs.'),
    purposeTe: clampOptionalStr(ex.purposeTe, 1200),
    eligibility: clampStr(ex.eligibility, 5, 1000, 'Refer to official examination information bulletin.'),
    examAuthority: clampStr(ex.examAuthority, 2, 250, 'Official Examination Authority'),
    applicationInfo: clampStr(ex.applicationInfo, 5, 1000, 'Online application via official examination portal.'),
    importantDates,
    datesVerified,
    officialUrl: clampStr(ex.officialUrl, 5, 500, 'https://nta.ac.in'),
    targetCourses: clampStrList(ex.targetCourses, 15),
    published: Boolean(ex.published ?? true),
    lastVerifiedDate: clampStr(ex.lastVerifiedDate, 4, 60, '2026-10-11'),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildCollegePayload(col: Partial<College>, existingCreatedAt?: unknown) {
  return {
    name: clampStr(col.name, 3, 250, 'Recognized Institution'),
    nameTe: clampOptionalStr(col.nameTe, 280),
    state: (['Andhra Pradesh', 'Telangana', 'All India'].includes(String(col.state))
      ? col.state
      : 'Andhra Pradesh') as College['state'],
    district: clampStr(col.district, 2, 120, 'District'),
    location: clampStr(col.location, 2, 250, 'Campus Location'),
    institutionType: ([
      'Central Institute',
      'State University',
      'Government College',
      'Private/Deemed'
    ].includes(String(col.institutionType))
      ? col.institutionType
      : 'State University') as College['institutionType'],
    availableCourses: clampStrList(col.availableCourses, 15),
    admissionProcess: clampStr(col.admissionProcess, 5, 1000, 'Admission through official state/national counseling.'),
    entranceExams: clampStrList(col.entranceExams, 15),
    officialUrl: clampStr(col.officialUrl, 5, 500, 'https://education.gov.in'),
    sourceReference: clampStr(col.sourceReference, 2, 250, 'Official University Portal'),
    isSampleRecord: Boolean(col.isSampleRecord ?? true),
    published: Boolean(col.published ?? true),
    lastVerifiedDate: clampStr(col.lastVerifiedDate, 4, 60, '2026-10-11'),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildScholarshipPayload(sch: Partial<Scholarship>, existingCreatedAt?: unknown) {
  return {
    name: clampStr(sch.name, 3, 250, 'Scholarship Program'),
    nameTe: clampOptionalStr(sch.nameTe, 280),
    state: (['Andhra Pradesh', 'Telangana', 'All India', 'AP & TG'].includes(String(sch.state))
      ? sch.state
      : 'All India') as Scholarship['state'],
    educationLevel: clampStr(sch.educationLevel, 2, 120, 'Post-Matric / Undergraduate'),
    category: clampStr(sch.category, 2, 120, 'Government Scholarship'),
    eligibility: clampStr(sch.eligibility, 5, 1200, 'Refer to official scholarship portal for eligibility criteria.'),
    eligibilityTe: clampOptionalStr(sch.eligibilityTe, 1500),
    benefits: clampStr(sch.benefits, 5, 1000, 'As notified by the official sanctioning authority.'),
    applicationPeriod: clampStr(sch.applicationPeriod, 4, 300, 'Official date not verified.'),
    requiredDocuments: clampStrList(sch.requiredDocuments, 15),
    officialUrl: clampStr(sch.officialUrl, 5, 500, 'https://scholarships.gov.in'),
    sourceReference: clampStr(sch.sourceReference, 2, 250, 'Official Scholarship Portal'),
    published: Boolean(sch.published ?? true),
    lastVerifiedDate: clampStr(sch.lastVerifiedDate, 4, 60, '2026-10-11'),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildCareerPayload(car: Partial<Career>, existingCreatedAt?: unknown) {
  return {
    title: clampStr(car.title, 2, 200, 'Career Option'),
    titleTe: clampOptionalStr(car.titleTe, 240),
    sector: clampStr(car.sector, 2, 100, 'General Sector'),
    description: clampStr(car.description, 10, 2000, 'Career pathway overview and responsibilities.'),
    descriptionTe: clampOptionalStr(car.descriptionTe, 2500),
    requiredEducation: clampStr(car.requiredEducation, 5, 800, 'Relevant undergraduate or diploma qualification.'),
    skills: clampStrList(car.skills, 15),
    industries: clampStrList(car.industries, 15),
    furtherStudy: clampStrList(car.furtherStudy, 15),
    relatedCourses: clampStrList(car.relatedCourses, 15),
    relatedExams: clampStrList(car.relatedExams, 15),
    officialReference: clampStr(car.officialReference, 2, 300, 'National Career Service (ncs.gov.in)'),
    published: Boolean(car.published ?? true),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildCareerUpdatePayload(upd: Partial<CareerUpdate>, existingCreatedAt?: unknown) {
  return {
    title: clampStr(upd.title, 3, 250, 'Official Announcement'),
    titleTe: clampOptionalStr(upd.titleTe, 300),
    description: clampStr(upd.description, 5, 2000, 'Official educational update details.'),
    descriptionTe: clampOptionalStr(upd.descriptionTe, 2400),
    category: (['Exam', 'Scholarship', 'Admission', 'Course', 'General'].includes(String(upd.category))
      ? upd.category
      : 'General') as CareerUpdate['category'],
    state: (['Andhra Pradesh', 'Telangana', 'All India', 'AP & TG'].includes(String(upd.state))
      ? upd.state
      : 'All India') as CareerUpdate['state'],
    sourceName: clampStr(upd.sourceName, 2, 200, 'Official Authority'),
    officialUrl: clampStr(upd.officialUrl, 5, 500, 'https://education.gov.in'),
    publicationDate: clampStr(upd.publicationDate, 4, 60, 'Official Portal Active'),
    dateChecked: clampStr(upd.dateChecked, 4, 60, new Date().toISOString().slice(0, 10)),
    verificationStatus: (['VERIFIED', 'UNVERIFIED', 'CHECK_FAILED'].includes(String(upd.verificationStatus))
      ? upd.verificationStatus
      : 'UNVERIFIED') as CareerUpdate['verificationStatus'],
    published: Boolean(upd.published ?? true),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildOfficialSourcePayload(src: Partial<OfficialSource>, existingCreatedAt?: unknown) {
  return {
    name: clampStr(src.name, 2, 200, 'Official Portal'),
    category: clampStr(src.category, 2, 100, 'Government Education Portal'),
    state: (['Andhra Pradesh', 'Telangana', 'All India', 'AP & TG'].includes(String(src.state))
      ? src.state
      : 'All India') as OfficialSource['state'],
    officialUrl: clampStr(src.officialUrl, 5, 500, 'https://nta.ac.in'),
    lastChecked: clampStr(src.lastChecked, 4, 60, new Date().toISOString().slice(0, 10)),
    lastStatus: (['VERIFIED_REACHABLE', 'UNVERIFIED', 'CHECK_FAILED'].includes(String(src.lastStatus))
      ? src.lastStatus
      : 'UNVERIFIED') as OfficialSource['lastStatus'],
    lastHttpCode: typeof src.lastHttpCode === 'number' ? src.lastHttpCode : 0,
    lastDetectedTitle: clampOptionalStr(src.lastDetectedTitle, 300),
    lastError: clampOptionalStr(src.lastError, 500),
    published: Boolean(src.published ?? true),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

export function buildNotificationPayload(notif: Partial<NotificationItem>, existingCreatedAt?: unknown) {
  return {
    title: clampStr(notif.title, 3, 220, 'Notification'),
    titleTe: clampOptionalStr(notif.titleTe, 260),
    message: clampStr(notif.message, 5, 1200, 'Verified educational notification.'),
    messageTe: clampOptionalStr(notif.messageTe, 1500),
    category: (['Exam', 'Scholarship', 'Course', 'Deadline', 'Announcement'].includes(String(notif.category))
      ? notif.category
      : 'Announcement') as NotificationItem['category'],
    state: (['Andhra Pradesh', 'Telangana', 'All India', 'AP & TG'].includes(String(notif.state))
      ? notif.state
      : 'All India') as NotificationItem['state'],
    sourceReference: clampStr(notif.sourceReference, 2, 200, 'Official Portal'),
    officialUrl: clampStr(notif.officialUrl, 5, 500, 'https://nta.ac.in'),
    dateLabel: clampStr(notif.dateLabel, 4, 60, new Date().toISOString().slice(0, 10)),
    published: Boolean(notif.published ?? true),
    createdAt: existingCreatedAt || serverTimestamp(),
    updatedAt: serverTimestamp()
  };
}

// ============================================================================
// CRUD & SEEDING OPERATIONS
// ============================================================================

export async function saveDocumentToCollection(
  collectionName: string,
  docId: string,
  payload: Record<string, unknown>,
  isUpdate: boolean
): Promise<void> {
  const cleanId = sanitizeDocId(docId);
  const path = `${collectionName}/${cleanId}`;
  try {
    await setDoc(doc(db, collectionName, cleanId), payload);
  } catch (error) {
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function toggleDocumentPublish(
  collectionName: string,
  docId: string,
  published: boolean
): Promise<void> {
  const cleanId = sanitizeDocId(docId);
  const path = `${collectionName}/${cleanId}`;
  try {
    await updateDoc(doc(db, collectionName, cleanId), {
      published,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteDocumentFromCollection(
  collectionName: string,
  docId: string
): Promise<void> {
  const cleanId = sanitizeDocId(docId);
  const path = `${collectionName}/${cleanId}`;
  try {
    await deleteDoc(doc(db, collectionName, cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedBaselineDatabaseToFirestore(): Promise<{ seededCount: number }> {
  let count = 0;

  for (const cat of INITIAL_COURSE_CATEGORIES) {
    const snap = await getDoc(doc(db, 'courseCategories', cat.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('courseCategories', cat.id, buildCourseCategoryPayload(cat), false);
      count++;
    }
  }

  for (const c of INITIAL_COURSES) {
    const snap = await getDoc(doc(db, 'courses', c.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('courses', c.id, buildCoursePayload(c), false);
      count++;
    }
  }

  for (const ex of INITIAL_ENTRANCE_EXAMS) {
    const snap = await getDoc(doc(db, 'entranceExams', ex.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('entranceExams', ex.id, buildEntranceExamPayload(ex), false);
      count++;
    }
  }

  for (const col of INITIAL_COLLEGES) {
    const snap = await getDoc(doc(db, 'colleges', col.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('colleges', col.id, buildCollegePayload(col), false);
      count++;
    }
  }

  for (const sch of INITIAL_SCHOLARSHIPS) {
    const snap = await getDoc(doc(db, 'scholarships', sch.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('scholarships', sch.id, buildScholarshipPayload(sch), false);
      count++;
    }
  }

  for (const car of INITIAL_CAREERS) {
    const snap = await getDoc(doc(db, 'careers', car.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('careers', car.id, buildCareerPayload(car), false);
      count++;
    }
  }

  for (const src of INITIAL_OFFICIAL_SOURCES) {
    const snap = await getDoc(doc(db, 'officialSources', src.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('officialSources', src.id, buildOfficialSourcePayload(src), false);
      count++;
    }
  }

  for (const upd of INITIAL_CAREER_UPDATES) {
    const snap = await getDoc(doc(db, 'careerUpdates', upd.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('careerUpdates', upd.id, buildCareerUpdatePayload(upd), false);
      count++;
    }
  }

  for (const notif of INITIAL_NOTIFICATIONS) {
    const snap = await getDoc(doc(db, 'notifications', notif.id));
    if (!snap.exists()) {
      await saveDocumentToCollection('notifications', notif.id, buildNotificationPayload(notif), false);
      count++;
    }
  }

  return { seededCount: count };
}

// ============================================================================
// OFFICIAL WEBSITE LIVE VERIFICATION (CALLS BACKEND /api/verify-source + FIRESTORE)
// ============================================================================

export async function runLiveOfficialSourceCheck(
  source: OfficialSource,
  adminUid: string
): Promise<{ updatedSource: OfficialSource; logEntry: VerificationLog }> {
  // Ensure the source document exists in Firestore before logging to verificationHistory
  const sourceDocRef = doc(db, 'officialSources', sanitizeDocId(source.id));
  const sourceSnap = await getDoc(sourceDocRef);
  let existingCreatedAt: unknown = undefined;
  if (sourceSnap.exists()) {
    existingCreatedAt = sourceSnap.data().createdAt;
  } else {
    await saveDocumentToCollection(
      'officialSources',
      source.id,
      buildOfficialSourcePayload(source),
      false
    );
    const createdSnap = await getDoc(sourceDocRef);
    existingCreatedAt = createdSnap.data()?.createdAt;
  }

  const response = await fetch('/api/verify-source', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: source.officialUrl, sourceName: source.name })
  });

  if (!response.ok) {
    throw new Error(`Verification API returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    url: string;
    checkedAt: string;
    status: 'VERIFIED_REACHABLE' | 'CHECK_FAILED';
    httpCode: number;
    detectedTitle: string;
    errorMessage: string;
  };

  const updatedSource: OfficialSource = {
    ...source,
    lastChecked: data.checkedAt.slice(0, 60),
    lastStatus: data.status,
    lastHttpCode: data.httpCode,
    lastDetectedTitle: (data.detectedTitle || '').slice(0, 300),
    lastError: (data.errorMessage || '').slice(0, 500)
  };

  await saveDocumentToCollection(
    'officialSources',
    source.id,
    buildOfficialSourcePayload(updatedSource, existingCreatedAt),
    true
  );

  const logId = sanitizeDocId(`log-${source.id}-${Date.now()}`);
  const logPayload = {
    sourceId: sanitizeDocId(source.id),
    sourceName: clampStr(source.name, 2, 200, 'Official Source'),
    officialUrl: clampStr(source.officialUrl, 5, 500, 'https://nta.ac.in'),
    status: data.status,
    httpCode: data.httpCode,
    detectedTitle: clampOptionalStr(data.detectedTitle, 300),
    errorMessage: clampOptionalStr(data.errorMessage, 500),
    checkedByUid: adminUid,
    createdAt: serverTimestamp()
  };

  try {
    await setDoc(doc(db, 'verificationHistory', logId), logPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `verificationHistory/${logId}`);
  }

  return {
    updatedSource,
    logEntry: {
      id: logId,
      ...logPayload
    }
  };
}

// ============================================================================
// USER PREFERENCES (CAREER PLANNER & READ NOTIFICATIONS)
// ============================================================================

export async function loadUserPreferences(userId: string): Promise<UserPreference | null> {
  const cleanUid = sanitizeDocId(userId);
  const path = `userPreferences/${cleanUid}`;
  try {
    const snap = await getDoc(doc(db, 'userPreferences', cleanUid));
    if (!snap.exists()) return null;
    return snap.data() as UserPreference;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserPreferences(
  userId: string,
  prefs: Omit<UserPreference, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  const cleanUid = sanitizeDocId(userId);
  const path = `userPreferences/${cleanUid}`;
  try {
    const docRef = doc(db, 'userPreferences', cleanUid);
    const snap = await getDoc(docRef);
    const payload = {
      userId: cleanUid,
      currentLevel: prefs.currentLevel,
      interests: clampStrList(prefs.interests, 10),
      preferredSubjects: clampStrList(prefs.preferredSubjects, 10),
      careerGoals: clampStrList(prefs.careerGoals, 10),
      preferredState: prefs.preferredState,
      educationPreference: prefs.educationPreference,
      readNotificationIds: clampStrList(prefs.readNotificationIds, 100),
      createdAt: snap.exists() ? snap.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
