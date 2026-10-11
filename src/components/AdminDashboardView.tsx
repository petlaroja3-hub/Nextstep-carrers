import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Database,
  Globe,
  ExternalLink,
  KeyRound
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  BOOTSTRAPPED_ADMIN_EMAIL,
  type User
} from '../firebase';
import type {
  Language,
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
  StateScope
} from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import {
  sanitizeDocId,
  saveDocumentToCollection,
  toggleDocumentPublish,
  deleteDocumentFromCollection,
  seedBaselineDatabaseToFirestore,
  runLiveOfficialSourceCheck,
  fetchVerificationLogs,
  buildCoursePayload,
  buildCourseCategoryPayload,
  buildEntranceExamPayload,
  buildCollegePayload,
  buildScholarshipPayload,
  buildCareerPayload,
  buildCareerUpdatePayload,
  buildOfficialSourcePayload,
  buildNotificationPayload
} from '../services/firestoreService';

type AdminTab =
  | 'courses'
  | 'courseCategories'
  | 'entranceExams'
  | 'colleges'
  | 'scholarships'
  | 'careers'
  | 'careerUpdates'
  | 'officialSources'
  | 'notifications';

interface AdminDashboardViewProps {
  lang: Language;
  user: User | null;
  isAdmin: boolean;
  isFromFirestore: boolean;
  courses: Course[];
  categories: CourseCategory[];
  exams: EntranceExam[];
  colleges: College[];
  scholarships: Scholarship[];
  careers: Career[];
  updates: CareerUpdate[];
  sources: OfficialSource[];
  notifications: NotificationItem[];
  onRefreshAll: () => Promise<void>;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  lang,
  user,
  isAdmin,
  isFromFirestore,
  courses,
  categories,
  exams,
  colleges,
  scholarships,
  careers,
  updates,
  sources,
  notifications,
  onRefreshAll
}) => {
  const t = TRANSLATIONS[lang];

  // Auth form states
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authFeedback, setAuthFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin workspace states
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [opFeedback, setOpFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Verification logs state
  const [verificationLogs, setVerificationLogs] = useState<VerificationLog[]>([]);
  const [checkingSourceId, setCheckingSourceId] = useState<string | null>(null);

  // Editor modal / drawer state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isAdmin && activeTab === 'officialSources') {
      fetchVerificationLogs(user.uid, user.email === BOOTSTRAPPED_ADMIN_EMAIL)
        .then(logs => setVerificationLogs(logs))
        .catch(err => console.error('Failed to fetch verification logs:', err));
    }
  }, [user, isAdmin, activeTab]);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthFeedback({ type: 'success', text: 'Signed in with Google successfully.' });
    } catch (err: unknown) {
      setAuthFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Google Sign-In failed.'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setAuthFeedback({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      setAuthFeedback({ type: 'success', text: 'Signed in successfully.' });
    } catch (err: unknown) {
      setAuthFeedback({
        type: 'error',
        text:
          err instanceof Error
            ? `${err.message} (Note: Ensure Email/Password provider is enabled in Firebase Console, or use Google Sign-In above.)`
            : 'Email sign-in failed.'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!emailInput.trim()) {
      setAuthFeedback({ type: 'error', text: 'Enter your administrator email address above to receive a password reset link.' });
      return;
    }
    setAuthLoading(true);
    setAuthFeedback(null);
    try {
      await sendPasswordResetEmail(auth, emailInput.trim());
      setAuthFeedback({
        type: 'success',
        text: `Password reset email sent to ${emailInput.trim()}.`
      });
    } catch (err: unknown) {
      setAuthFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Could not send password reset email.'
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAuthFeedback({ type: 'success', text: 'Signed out safely.' });
  };

  const handleSeedDatabase = async () => {
    setBusyAction('seeding');
    setOpFeedback(null);
    try {
      const { seededCount } = await seedBaselineDatabaseToFirestore();
      await onRefreshAll();
      setOpFeedback({
        type: 'success',
        text:
          seededCount > 0
            ? `Successfully seeded ${seededCount} verified baseline records into Cloud Firestore across all 9 collections.`
            : 'All baseline records already exist in Cloud Firestore. Collections are up to date.'
      });
    } catch (err: unknown) {
      setOpFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to seed baseline database.'
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyOfficialSource = async (src: OfficialSource) => {
    if (!user) return;
    setCheckingSourceId(src.id);
    setOpFeedback(null);
    try {
      const { updatedSource, logEntry } = await runLiveOfficialSourceCheck(src, user.uid);
      setVerificationLogs(prev => [logEntry, ...prev]);
      await onRefreshAll();
      setOpFeedback({
        type: updatedSource.lastStatus === 'VERIFIED_REACHABLE' ? 'success' : 'error',
        text:
          updatedSource.lastStatus === 'VERIFIED_REACHABLE'
            ? `Verified ${src.name} (HTTP ${updatedSource.lastHttpCode}): "${updatedSource.lastDetectedTitle}"`
            : `Source check failed for ${src.name}: ${updatedSource.lastError}`
      });
    } catch (err: unknown) {
      setOpFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Official source check failed.'
      });
    } finally {
      setCheckingSourceId(null);
    }
  };

  const handleTogglePublish = async (id: string, currentPublished: boolean) => {
    setBusyAction(`pub-${id}`);
    setOpFeedback(null);
    try {
      if (!isFromFirestore) {
        await seedBaselineDatabaseToFirestore();
      }
      await toggleDocumentPublish(activeTab, id, !currentPublished);
      await onRefreshAll();
      setOpFeedback({
        type: 'success',
        text: `Record "${id}" ${!currentPublished ? 'published' : 'unpublished'} in Cloud Firestore.`
      });
    } catch (err: unknown) {
      setOpFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update publish status.'
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmDelete = async (id: string) => {
    setBusyAction(`del-${id}`);
    setOpFeedback(null);
    try {
      if (!isFromFirestore) {
        await seedBaselineDatabaseToFirestore();
      }
      await deleteDocumentFromCollection(activeTab, id);
      setConfirmDeleteId(null);
      await onRefreshAll();
      setOpFeedback({
        type: 'success',
        text: `Record "${id}" permanently deleted from Cloud Firestore.`
      });
    } catch (err: unknown) {
      setOpFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to delete document.'
      });
    } finally {
      setBusyAction(null);
    }
  };

  const openAddModal = () => {
    setEditingDocId(null);
    setFormError(null);
    const today = new Date().toISOString().slice(0, 10);
    if (activeTab === 'courses') {
      setFormState({
        title: '',
        titleTe: '',
        level: 'after_10th',
        category: 'Intermediate (10+2) Academic Streams',
        duration: '2 Years',
        eligibility: 'Pass in Class 10 (SSC or equivalent recognized board).',
        eligibilityTe: '',
        description: '',
        descriptionTe: '',
        subjectsText: 'Mathematics, Physics, Chemistry',
        studyPathwaysText: 'Government & Private Junior Colleges',
        careerOpportunitiesText: 'Engineering, Architecture, Defence',
        furtherEducationText: 'B.Tech, B.Sc., BCA',
        entranceExamsText: 'AP EAPCET, TG EAPCET, JEE Main',
        admissionProcess: 'Merit-based admission via state board portal.',
        officialSourceName: 'BIEAP / TGBIE',
        officialUrl: 'https://bie.ap.gov.in',
        state: 'AP & TG',
        published: true,
        isSampleData: false,
        lastVerifiedDate: today
      });
    } else if (activeTab === 'courseCategories') {
      setFormState({
        name: '',
        nameTe: '',
        level: 'both',
        description: '',
        published: true
      });
    } else if (activeTab === 'entranceExams') {
      setFormState({
        name: '',
        nameTe: '',
        category: 'Engineering & Architecture',
        state: 'Andhra Pradesh',
        purpose: '',
        purposeTe: '',
        eligibility: '10+2 or equivalent from a recognized board.',
        examAuthority: 'APSCHE / TGCHE / NTA',
        applicationInfo: 'Online CBT application via official portal.',
        importantDates: 'Official date not verified.',
        datesVerified: false,
        officialUrl: 'https://cets.apsche.ap.gov.in',
        targetCoursesText: 'B.Tech, B.Pharm, B.Sc. Agriculture',
        published: true,
        lastVerifiedDate: today
      });
    } else if (activeTab === 'colleges') {
      setFormState({
        name: '',
        nameTe: '',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        location: '',
        institutionType: 'State University',
        availableCoursesText: 'B.Tech, M.Tech, MCA',
        admissionProcess: 'Admission through AP EAPCET / TG EAPCET counseling.',
        entranceExamsText: 'AP EAPCET, GATE',
        officialUrl: 'https://cets.apsche.ap.gov.in',
        sourceReference: 'APSCHE Official University Directory',
        isSampleRecord: true,
        published: true,
        lastVerifiedDate: today
      });
    } else if (activeTab === 'scholarships') {
      setFormState({
        name: '',
        nameTe: '',
        state: 'Andhra Pradesh',
        educationLevel: 'Undergraduate & Post-Matric',
        category: 'State Government Welfare Scholarship',
        eligibility: '',
        eligibilityTe: '',
        benefits: 'As notified by the official sanctioning authority.',
        applicationPeriod: 'Official date not verified.',
        requiredDocumentsText: 'Aadhaar Card, Income Certificate, Caste Certificate, Bonafide',
        officialUrl: 'https://jnanabhumi.ap.gov.in',
        sourceReference: 'Official Government Scholarship Portal',
        published: true,
        lastVerifiedDate: today
      });
    } else if (activeTab === 'careers') {
      setFormState({
        title: '',
        titleTe: '',
        sector: 'Engineering & Technology',
        description: '',
        descriptionTe: '',
        requiredEducation: 'B.Tech / B.Sc. / Relevant Degree',
        skillsText: 'Problem Solving, Domain Technical Skills',
        industriesText: 'IT, Manufacturing, Public Sector',
        furtherStudyText: 'M.Tech, MBA, Ph.D.',
        relatedCoursesText: 'Intermediate MPC, B.Tech',
        relatedExamsText: 'JEE Main, AP EAPCET, TG EAPCET',
        officialReference: 'National Career Service (ncs.gov.in)',
        published: true
      });
    } else if (activeTab === 'careerUpdates') {
      setFormState({
        title: '',
        titleTe: '',
        description: '',
        descriptionTe: '',
        category: 'Exam',
        state: 'AP & TG',
        sourceName: 'APSCHE / TGCHE Official Portal',
        officialUrl: 'https://cets.apsche.ap.gov.in',
        publicationDate: today,
        dateChecked: today,
        verificationStatus: 'VERIFIED',
        published: true
      });
    } else if (activeTab === 'officialSources') {
      setFormState({
        name: '',
        category: 'Official Examination Authority',
        state: 'All India',
        officialUrl: 'https://nta.ac.in',
        lastChecked: today,
        lastStatus: 'UNVERIFIED',
        lastHttpCode: 0,
        lastDetectedTitle: '',
        lastError: '',
        published: true
      });
    } else if (activeTab === 'notifications') {
      setFormState({
        title: '',
        titleTe: '',
        message: '',
        messageTe: '',
        category: 'Announcement',
        state: 'AP & TG',
        sourceReference: 'Official Portal Reference',
        officialUrl: 'https://cets.apsche.ap.gov.in',
        dateLabel: today,
        published: true
      });
    }
    setIsEditorOpen(true);
  };

  const openEditModal = (item: Record<string, unknown>) => {
    setEditingDocId(String(item.id));
    setFormError(null);
    setFormState({
      ...item,
      subjectsText: Array.isArray(item.subjects) ? item.subjects.join(', ') : '',
      studyPathwaysText: Array.isArray(item.studyPathways) ? item.studyPathways.join(', ') : '',
      careerOpportunitiesText: Array.isArray(item.careerOpportunities) ? item.careerOpportunities.join(', ') : '',
      furtherEducationText: Array.isArray(item.furtherEducation) ? item.furtherEducation.join(', ') : '',
      entranceExamsText: Array.isArray(item.entranceExams) ? item.entranceExams.join(', ') : '',
      targetCoursesText: Array.isArray(item.targetCourses) ? item.targetCourses.join(', ') : '',
      availableCoursesText: Array.isArray(item.availableCourses) ? item.availableCourses.join(', ') : '',
      requiredDocumentsText: Array.isArray(item.requiredDocuments) ? item.requiredDocuments.join(', ') : '',
      skillsText: Array.isArray(item.skills) ? item.skills.join(', ') : '',
      industriesText: Array.isArray(item.industries) ? item.industries.join(', ') : '',
      furtherStudyText: Array.isArray(item.furtherStudy) ? item.furtherStudy.join(', ') : '',
      relatedCoursesText: Array.isArray(item.relatedCourses) ? item.relatedCourses.join(', ') : '',
      relatedExamsText: Array.isArray(item.relatedExams) ? item.relatedExams.join(', ') : ''
    });
    setIsEditorOpen(true);
  };

  const splitCsv = (val: unknown): string[] => {
    if (typeof val !== 'string') return [];
    return val
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 15);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const primaryTitle = String(formState.title || formState.name || '').trim();
    if (primaryTitle.length < 3) {
      setFormError('Title / Name is required and must be at least 3 characters.');
      return;
    }

    const urlVal = String(formState.officialUrl || '').trim();
    if (
      ['courses', 'entranceExams', 'colleges', 'scholarships', 'careerUpdates', 'officialSources', 'notifications'].includes(activeTab) &&
      (!urlVal.startsWith('http://') && !urlVal.startsWith('https://'))
    ) {
      setFormError('Official Website URL must begin with https:// or http://');
      return;
    }

    setBusyAction('saving-form');
    try {
      if (!isFromFirestore) {
        await seedBaselineDatabaseToFirestore();
      }

      const docId = editingDocId || sanitizeDocId(`${activeTab.slice(0, 4)}-${primaryTitle.toLowerCase()}-${Date.now().toString().slice(-4)}`);
      const existingCreatedAt = editingDocId ? formState.createdAt : undefined;
      let payload: Record<string, unknown> = {};

      if (activeTab === 'courses') {
        payload = buildCoursePayload(
          {
            ...(formState as Partial<Course>),
            subjects: splitCsv(formState.subjectsText),
            studyPathways: splitCsv(formState.studyPathwaysText),
            careerOpportunities: splitCsv(formState.careerOpportunitiesText),
            furtherEducation: splitCsv(formState.furtherEducationText),
            entranceExams: splitCsv(formState.entranceExamsText)
          },
          existingCreatedAt
        );
      } else if (activeTab === 'courseCategories') {
        payload = buildCourseCategoryPayload(formState as Partial<CourseCategory>, existingCreatedAt);
      } else if (activeTab === 'entranceExams') {
        payload = buildEntranceExamPayload(
          {
            ...(formState as Partial<EntranceExam>),
            targetCourses: splitCsv(formState.targetCoursesText)
          },
          existingCreatedAt
        );
      } else if (activeTab === 'colleges') {
        payload = buildCollegePayload(
          {
            ...(formState as Partial<College>),
            availableCourses: splitCsv(formState.availableCoursesText),
            entranceExams: splitCsv(formState.entranceExamsText)
          },
          existingCreatedAt
        );
      } else if (activeTab === 'scholarships') {
        payload = buildScholarshipPayload(
          {
            ...(formState as Partial<Scholarship>),
            requiredDocuments: splitCsv(formState.requiredDocumentsText)
          },
          existingCreatedAt
        );
      } else if (activeTab === 'careers') {
        payload = buildCareerPayload(
          {
            ...(formState as Partial<Career>),
            skills: splitCsv(formState.skillsText),
            industries: splitCsv(formState.industriesText),
            furtherStudy: splitCsv(formState.furtherStudyText),
            relatedCourses: splitCsv(formState.relatedCoursesText),
            relatedExams: splitCsv(formState.relatedExamsText)
          },
          existingCreatedAt
        );
      } else if (activeTab === 'careerUpdates') {
        payload = buildCareerUpdatePayload(formState as Partial<CareerUpdate>, existingCreatedAt);
      } else if (activeTab === 'officialSources') {
        payload = buildOfficialSourcePayload(formState as Partial<OfficialSource>, existingCreatedAt);
      } else if (activeTab === 'notifications') {
        payload = buildNotificationPayload(formState as Partial<NotificationItem>, existingCreatedAt);
      }

      await saveDocumentToCollection(activeTab, docId, payload, Boolean(editingDocId));
      await onRefreshAll();
      setIsEditorOpen(false);
      setOpFeedback({
        type: 'success',
        text: `Saved "${primaryTitle}" to Cloud Firestore collection "${activeTab}".`
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save document to Firestore.');
    } finally {
      setBusyAction(null);
    }
  };

  // =========================================================================
  // RENDER 1: NOT SIGNED IN OR NOT AUTHORIZED ADMIN
  // =========================================================================
  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-7 h-7 text-sky-700 shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.adminLoginHeading}</h1>
              <p className="text-xs text-slate-500">Firebase Authentication · Role-Based Access Control</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-6">{t.adminLoginSubheading}</p>

          {authFeedback && (
            <div
              className={`mb-5 p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                authFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {authFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              )}
              <span>{authFeedback.text}</span>
            </div>
          )}

          {user && !isAdmin && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-2">
              <p className="font-semibold">{t.adminUnauthorizedError}</p>
              <p>
                Signed in as: <span className="font-mono">{user.email}</span> (UID:{' '}
                <span className="font-mono">{user.uid}</span>)
              </p>
              <p>
                Only the bootstrapped owner (<span className="font-mono">{BOOTSTRAPPED_ADMIN_EMAIL}</span>) or UIDs registered in the <span className="font-mono">/adminRoles</span> collection have write access enforced by Firestore Security Rules.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-md font-medium inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.adminLogoutBtn}
              </button>
            </div>
          )}

          {!user && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                {t.adminSignInGoogleBtn}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="flex-shrink mx-3 text-xs text-slate-400">
                  OR EMAIL & PASSWORD
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Administrator Email
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="kodurisiri67@gmail.com"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t.adminSignInEmailBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={authLoading}
                    className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {t.adminResetPasswordBtn}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: AUTHORIZED ADMIN CONSOLE
  // =========================================================================

  const getActiveList = (): Array<Record<string, unknown> & { id: string; published: boolean }> => {
    switch (activeTab) {
      case 'courses':
        return courses as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'courseCategories':
        return categories as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'entranceExams':
        return exams as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'colleges':
        return colleges as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'scholarships':
        return scholarships as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'careers':
        return careers as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'careerUpdates':
        return updates as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'officialSources':
        return sources as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
      case 'notifications':
        return notifications as unknown as Array<Record<string, unknown> & { id: string; published: boolean }>;
    }
  };

  const rawRecords = getActiveList();
  const filteredRecords = rawRecords.filter(item => {
    if (statusFilter === 'published' && !item.published) return false;
    if (statusFilter === 'unpublished' && item.published) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const title = String(item.title || item.name || '').toLowerCase();
    const desc = String(item.description || item.purpose || item.message || item.eligibility || '').toLowerCase();
    const state = String(item.state || '').toLowerCase();
    return title.includes(q) || desc.includes(q) || state.includes(q);
  });

  const TABS: Array<{ id: AdminTab; label: string; count: number }> = [
    { id: 'courses', label: 'Courses', count: courses.length },
    { id: 'courseCategories', label: 'Categories', count: categories.length },
    { id: 'entranceExams', label: 'Entrance Exams', count: exams.length },
    { id: 'colleges', label: 'Colleges', count: colleges.length },
    { id: 'scholarships', label: 'Scholarships', count: scholarships.length },
    { id: 'careers', label: 'Careers', count: careers.length },
    { id: 'careerUpdates', label: 'Official Updates', count: updates.length },
    { id: 'officialSources', label: 'Official Sources & Verifier', count: sources.length },
    { id: 'notifications', label: 'Notifications', count: notifications.length }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>AUTHORIZED ADMINISTRATOR SESSION · {user.email}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            NextStep Careers — Admin Content & Verification Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Database Status:{' '}
            <span className="font-mono font-semibold text-slate-800">
              {isFromFirestore
                ? 'Live Cloud Firestore Persistence Active'
                : 'Showing Baseline Reference Data (Click "Sync Baseline to Firestore" to persist all records)'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={busyAction === 'seeding'}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5" />
            {busyAction === 'seeding' ? 'Syncing to Firestore...' : 'Sync Baseline to Firestore'}
          </button>

          <button
            type="button"
            onClick={() => onRefreshAll()}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t.adminLogoutBtn}
          </button>
        </div>
      </div>

      {opFeedback && (
        <div
          className={`mb-6 p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            opFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-red-50 border-red-200 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {opFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
            )}
            <span>{opFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpFeedback(null)}
            className="text-xs underline font-medium shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Collection Selector Tabs */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-slate-200/70 rounded-xl mb-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
              setConfirmDeleteId(null);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Toolbar: Search, Status Filter, Add Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search in ${activeTab}...`}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'published' | 'unpublished')}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="unpublished">Unpublished Only</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New Record
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">Title / Name</th>
                <th className="py-3.5 px-4">Category / Scope</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-500 text-xs">
                    No records match your active search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(item => {
                  const title = String(item.title || item.name || item.id);
                  const subtitle = String(item.category || item.sector || item.level || '');
                  const stateLabel = String(item.state || '');
                  const url = String(item.officialUrl || '');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{title}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {item.id}</div>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            {url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>{subtitle}</div>
                        {stateLabel && <div className="text-slate-500 mt-0.5">{stateLabel}</div>}
                        {activeTab === 'officialSources' && (
                          <div className="mt-1 font-mono text-xs text-slate-700">
                            Last Status: {String(item.lastStatus || 'UNVERIFIED')} (HTTP{' '}
                            {String(item.lastHttpCode || 0)}) · Checked: {String(item.lastChecked || 'N/A')}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <span
                          className={`font-semibold ${
                            item.published ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {item.published ? '● PUBLISHED' : '○ UNPUBLISHED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          {activeTab === 'officialSources' && (
                            <button
                              type="button"
                              onClick={() => handleVerifyOfficialSource(item as unknown as OfficialSource)}
                              disabled={checkingSourceId === item.id}
                              className="px-2.5 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-50"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              {checkingSourceId === item.id ? 'Probing...' : 'Verify Live'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleTogglePublish(item.id, item.published)}
                            disabled={busyAction === `pub-${item.id}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            {item.published ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                Unpublish
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                Publish
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          {confirmDeleteId === item.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleConfirmDelete(item.id)}
                                disabled={busyAction === `del-${item.id}`}
                                className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md whitespace-nowrap shrink-0"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-md whitespace-nowrap shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(item.id)}
                              className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification History Audit Log Table when in Official Sources tab */}
      {activeTab === 'officialSources' && (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Official Source Verification History (`verificationHistory` Collection)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Every live check probes the official government/examination URL via the server-side verifier (`/api/verify-source`) and writes an immutable audit record to Cloud Firestore.
          </p>
          {verificationLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">
              No live verification logs recorded yet. Click "Verify Live" on any official source above to test and log its reachability.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <th className="py-2.5 px-3">Source Name</th>
                    <th className="py-2.5 px-3">Official URL</th>
                    <th className="py-2.5 px-3">Status & HTTP Code</th>
                    <th className="py-2.5 px-3">Detected HTML Title / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {verificationLogs.map(log => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{log.sourceName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{log.officialUrl}</td>
                      <td className="py-2.5 px-3 font-mono">
                        <span
                          className={
                            log.status === 'VERIFIED_REACHABLE' ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'
                          }
                        >
                          {log.status} (HTTP {log.httpCode})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {log.detectedTitle || log.errorMessage || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {editingDocId ? `Edit Record (${editingDocId})` : `Add New Record to ${activeTab}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
              {/* Title or Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    English Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={String(formState.title ?? formState.name ?? '')}
                    onChange={e =>
                      setFormState({
                        ...formState,
                        title: e.target.value,
                        name: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telugu Title / Name (తెలుగు పేరు)
                  </label>
                  <input
                    type="text"
                    value={String(formState.titleTe ?? formState.nameTe ?? '')}
                    onChange={e =>
                      setFormState({
                        ...formState,
                        titleTe: e.target.value,
                        nameTe: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* State & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeTab !== 'courseCategories' && activeTab !== 'careers' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      State / Scope
                    </label>
                    <select
                      value={String(formState.state || 'All India')}
                      onChange={e => setFormState({ ...formState, state: e.target.value as StateScope })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      {activeTab !== 'colleges' && <option value="AP & TG">AP & TG</option>}
                      <option value="All India">All India</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Category / Sector
                  </label>
                  <input
                    type="text"
                    value={String(formState.category ?? formState.sector ?? '')}
                    onChange={e =>
                      setFormState({
                        ...formState,
                        category: e.target.value,
                        sector: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Course Level */}
              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Education Level
                    </label>
                    <select
                      value={String(formState.level || 'after_10th')}
                      onChange={e => setFormState({ ...formState, level: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="after_10th">After Class 10 (after_10th)</option>
                      <option value="after_inter">After Intermediate (after_inter)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={String(formState.duration || '')}
                      onChange={e => setFormState({ ...formState, duration: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Description / Purpose / Message */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Purpose / Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={String(
                    formState.description ?? formState.purpose ?? formState.message ?? formState.eligibility ?? ''
                  )}
                  onChange={e =>
                    setFormState({
                      ...formState,
                      description: e.target.value,
                      purpose: e.target.value,
                      message: e.target.value
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Eligibility if applicable */}
              {['courses', 'entranceExams', 'scholarships'].includes(activeTab) && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    General Eligibility Criteria *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={String(formState.eligibility || '')}
                    onChange={e => setFormState({ ...formState, eligibility: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Exam Dates Verification */}
              {activeTab === 'entranceExams' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="datesVerifiedCheck"
                      checked={Boolean(formState.datesVerified)}
                      onChange={e => setFormState({ ...formState, datesVerified: e.target.checked })}
                    />
                    <label htmlFor="datesVerifiedCheck" className="font-semibold text-slate-800">
                      Official Dates Verified by Authority
                    </label>
                  </div>
                  <div>
                    <input
                      type="text"
                      disabled={!formState.datesVerified}
                      value={
                        formState.datesVerified
                          ? String(formState.importantDates || '')
                          : 'Official date not verified.'
                      }
                      onChange={e => setFormState({ ...formState, importantDates: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Official URL */}
              {activeTab !== 'courseCategories' && activeTab !== 'careers' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Website URL (https://...) *
                  </label>
                  <input
                    type="url"
                    required
                    value={String(formState.officialUrl || '')}
                    onChange={e => setFormState({ ...formState, officialUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              {/* Published Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="publishedCheck"
                  checked={Boolean(formState.published ?? true)}
                  onChange={e => setFormState({ ...formState, published: e.target.checked })}
                />
                <label htmlFor="publishedCheck" className="font-semibold text-slate-800">
                  Published (Visible to Public Users)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyAction === 'saving-form'}
                  className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg disabled:opacity-50"
                >
                  {busyAction === 'saving-form' ? 'Saving to Firestore...' : 'Save to Cloud Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
