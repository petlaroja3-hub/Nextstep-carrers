import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ExternalLink,
  ArrowRight,
  Compass,
  BookOpen,
  GraduationCap,
  Building2,
  Award,
  Briefcase,
  Bell,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Globe,
  Menu,
  X,
  FileCheck2
} from 'lucide-react';
import heroCampusImg from './assets/images/hero_indian_students_campus_1791705787901.jpg';
import pathwayEnggImg from './assets/images/pathway_engineering_polytechnic_1791705801203.jpg';
import pathwayMedImg from './assets/images/pathway_medical_sciences_1791705812658.jpg';

import {
  auth,
  onAuthStateChanged,
  type User
} from './firebase';
import type {
  Language,
  PageId,
  Course,
  CourseCategory,
  EntranceExam,
  College,
  Scholarship,
  Career,
  CareerUpdate,
  OfficialSource,
  NotificationItem
} from './types';
import { TRANSLATIONS } from './i18n/translations';
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
} from './data/verifiedInitialData';
import {
  checkIsAdminUser,
  fetchCollectionRecords,
  loadUserPreferences,
  saveUserPreferences
} from './services/firestoreService';
import { PlannerView } from './components/PlannerView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AuditAndSetupView } from './components/AuditAndSetupView';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activePage, setActivePage] = useState<PageId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth & Admin state
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // Data state
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [categories, setCategories] = useState<CourseCategory[]>(INITIAL_COURSE_CATEGORIES);
  const [exams, setExams] = useState<EntranceExam[]>(INITIAL_ENTRANCE_EXAMS);
  const [colleges, setColleges] = useState<College[]>(INITIAL_COLLEGES);
  const [scholarships, setScholarships] = useState<Scholarship[]>(INITIAL_SCHOLARSHIPS);
  const [careers, setCareers] = useState<Career[]>(INITIAL_CAREERS);
  const [updates, setUpdates] = useState<CareerUpdate[]>(INITIAL_CAREER_UPDATES);
  const [sources, setSources] = useState<OfficialSource[]>(INITIAL_OFFICIAL_SOURCES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const [isFromFirestore, setIsFromFirestore] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Read notifications state
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nextstep_read_notifs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search & Filter states shared/contextual to directory pages
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [instTypeFilter, setInstTypeFilter] = useState<string>('ALL');

  // Detail modal state for courses
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Live probe state on public Official Updates page
  const [liveProbeLoadingUrl, setLiveProbeLoadingUrl] = useState<string | null>(null);
  const [liveProbeResults, setLiveProbeResults] = useState<
    Record<string, { status: string; httpCode: number; title: string; checkedAt: string; error: string }>
  >({});

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactState, setContactState] = useState('Andhra Pradesh');
  const [contactMessage, setContactMessage] = useState('');
  const [contactFeedback, setContactFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const t = TRANSLATIONS[lang];

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      if (currentUser) {
        const adminStatus = await checkIsAdminUser(currentUser);
        setIsAdmin(adminStatus);
        if (currentUser.emailVerified) {
          loadUserPreferences(currentUser.uid)
            .then(prefs => {
              if (prefs && Array.isArray(prefs.readNotificationIds)) {
                setReadNotifIds(prev => Array.from(new Set([...prev, ...prefs.readNotificationIds])));
              }
            })
            .catch(() => {});
        }
      } else {
        setIsAdmin(false);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const loadAllCollections = useCallback(async (adminMode: boolean) => {
    setLoadingData(true);
    setDataError(null);
    try {
      const [
        coursesRes,
        catsRes,
        examsRes,
        colsRes,
        schRes,
        carRes,
        updRes,
        srcRes,
        notifRes
      ] = await Promise.all([
        fetchCollectionRecords('courses', adminMode, INITIAL_COURSES),
        fetchCollectionRecords('courseCategories', adminMode, INITIAL_COURSE_CATEGORIES),
        fetchCollectionRecords('entranceExams', adminMode, INITIAL_ENTRANCE_EXAMS),
        fetchCollectionRecords('colleges', adminMode, INITIAL_COLLEGES),
        fetchCollectionRecords('scholarships', adminMode, INITIAL_SCHOLARSHIPS),
        fetchCollectionRecords('careers', adminMode, INITIAL_CAREERS),
        fetchCollectionRecords('careerUpdates', adminMode, INITIAL_CAREER_UPDATES),
        fetchCollectionRecords('officialSources', adminMode, INITIAL_OFFICIAL_SOURCES),
        fetchCollectionRecords('notifications', adminMode, INITIAL_NOTIFICATIONS)
      ]);

      setCourses(coursesRes.records);
      setCategories(catsRes.records);
      setExams(examsRes.records);
      setColleges(colsRes.records);
      setScholarships(schRes.records);
      setCareers(carRes.records);
      setUpdates(updRes.records);
      setSources(srcRes.records);
      setNotifications(notifRes.records);

      setIsFromFirestore(
        coursesRes.fromFirestore ||
          examsRes.fromFirestore ||
          collegesRes_fromFirestore(colsRes.fromFirestore, schRes.fromFirestore)
      );
    } catch (err: unknown) {
      console.error('Error loading Firestore collections:', err);
      setDataError(err instanceof Error ? err.message : 'Error loading database records.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  function collegesRes_fromFirestore(a: boolean, b: boolean) {
    return a || b;
  }

  useEffect(() => {
    if (!authReady) return;
    loadAllCollections(isAdmin);
  }, [authReady, isAdmin, loadAllCollections]);

  const navigateTo = (page: PageId, preserveSearch = false) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    setSelectedCourse(null);
    if (!preserveSearch) {
      setSearchQuery('');
      setStateFilter('ALL');
      setCategoryFilter('ALL');
      setDistrictFilter('ALL');
      setInstTypeFilter('ALL');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStateFilter('ALL');
    setCategoryFilter('ALL');
    setDistrictFilter('ALL');
    setInstTypeFilter('ALL');
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    const updated = Array.from(new Set([...readNotifIds, notifId]));
    setReadNotifIds(updated);
    try {
      localStorage.setItem('nextstep_read_notifs', JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
    if (user && user.emailVerified) {
      try {
        const existing = await loadUserPreferences(user.uid);
        await saveUserPreferences(user.uid, {
          currentLevel: existing?.currentLevel || 'class_10',
          interests: existing?.interests || ['Software & Computing'],
          preferredSubjects: existing?.preferredSubjects || ['Mathematics'],
          careerGoals: existing?.careerGoals || ['Engineering & Technology'],
          preferredState: existing?.preferredState || 'AP & TG',
          educationPreference: existing?.educationPreference || 'any',
          readNotificationIds: updated
        });
      } catch {
        // non-blocking
      }
    }
  };

  const handlePublicPortalProbe = async (url: string) => {
    setLiveProbeLoadingUrl(url);
    try {
      const res = await fetch('/api/verify-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setLiveProbeResults(prev => ({
        ...prev,
        [url]: {
          status: data.status,
          httpCode: data.httpCode,
          title: data.detectedTitle || '',
          checkedAt: data.checkedAt || new Date().toISOString().slice(0, 16),
          error: data.errorMessage || ''
        }
      }));
    } catch (err: unknown) {
      setLiveProbeResults(prev => ({
        ...prev,
        [url]: {
          status: 'CHECK_FAILED',
          httpCode: 0,
          title: '',
          checkedAt: new Date().toISOString().slice(0, 16),
          error: err instanceof Error ? err.message : 'Request failed'
        }
      }));
    } finally {
      setLiveProbeLoadingUrl(null);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactFeedback(null);
    if (contactName.trim().length < 2) {
      setContactFeedback({
        type: 'error',
        text: lang === 'te' ? 'దయచేసి మీ పూర్తి పేరు నమోదు చేయండి.' : 'Please enter your full name (at least 2 characters).'
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setContactFeedback({
        type: 'error',
        text: lang === 'te' ? 'దయచేసి సరైన ఇమెయిల్ చిరునామాను నమోదు చేయండి.' : 'Please enter a valid email address.'
      });
      return;
    }
    if (contactMessage.trim().length < 10) {
      setContactFeedback({
        type: 'error',
        text: lang === 'te' ? 'దయచేసి మీ సందేశాన్ని కనీసం 10 అక్షరాలలో వివరించండి.' : 'Please enter a message of at least 10 characters.'
      });
      return;
    }
    setContactFeedback({
      type: 'success',
      text:
        lang === 'te'
          ? 'మీ సందేశం స్వీకరించబడింది. అధికారిక పరీక్షా తేదీల కోసం సంబంధిత ప్రభుత్వ వెబ్‌సైట్లను కూడా తనిఖీ చేయగలరు.'
          : 'Thank you. Your guidance inquiry has been validated and recorded.'
    });
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  // Helper to check state filter match
  const matchesStateFilter = (itemState: string) => {
    if (stateFilter === 'ALL') return true;
    if (itemState === stateFilter) return true;
    if (itemState === 'AP & TG' && (stateFilter === 'Andhra Pradesh' || stateFilter === 'Telangana')) {
      return true;
    }
    return false;
  };

  // =========================================================================
  // DIRECTORY FILTERING LOGIC
  // =========================================================================

  const getFilteredCourses = (level: 'after_10th' | 'after_inter') => {
    return courses.filter(c => {
      if (!isAdmin && !c.published) return false;
      if (c.level !== level) return false;
      if (!matchesStateFilter(c.state)) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const hay = `${c.title} ${c.titleTe} ${c.category} ${c.description} ${c.descriptionTe} ${c.subjects.join(' ')} ${c.entranceExams.join(' ')} ${c.careerOpportunities.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  };

  const filteredExams = exams.filter(ex => {
    if (!isAdmin && !ex.published) return false;
    if (!matchesStateFilter(ex.state)) return false;
    if (categoryFilter !== 'ALL' && ex.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const hay = `${ex.name} ${ex.nameTe} ${ex.category} ${ex.purpose} ${ex.purposeTe} ${ex.examAuthority} ${ex.targetCourses.join(' ')}`.toLowerCase();
    return hay.includes(q);
  });

  const filteredColleges = colleges.filter(col => {
    if (!isAdmin && !col.published) return false;
    if (stateFilter !== 'ALL' && col.state !== stateFilter) return false;
    if (districtFilter !== 'ALL' && col.district !== districtFilter) return false;
    if (instTypeFilter !== 'ALL' && col.institutionType !== instTypeFilter) return false;
    if (categoryFilter !== 'ALL' && !col.availableCourses.includes(categoryFilter)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const hay = `${col.name} ${col.nameTe} ${col.district} ${col.location} ${col.availableCourses.join(' ')} ${col.entranceExams.join(' ')}`.toLowerCase();
    return hay.includes(q);
  });

  const filteredScholarships = scholarships.filter(sch => {
    if (!isAdmin && !sch.published) return false;
    if (!matchesStateFilter(sch.state)) return false;
    if (categoryFilter !== 'ALL' && sch.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const hay = `${sch.name} ${sch.nameTe} ${sch.category} ${sch.educationLevel} ${sch.eligibility} ${sch.eligibilityTe} ${sch.sourceReference}`.toLowerCase();
    return hay.includes(q);
  });

  const filteredCareers = careers.filter(car => {
    if (!isAdmin && !car.published) return false;
    if (categoryFilter !== 'ALL' && car.sector !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const hay = `${car.title} ${car.titleTe} ${car.sector} ${car.description} ${car.descriptionTe} ${car.skills.join(' ')} ${car.industries.join(' ')} ${car.relatedExams.join(' ')}`.toLowerCase();
    return hay.includes(q);
  });

  const filteredUpdates = updates.filter(upd => {
    if (!isAdmin && !upd.published) return false;
    if (!matchesStateFilter(upd.state)) return false;
    if (categoryFilter !== 'ALL' && upd.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const hay = `${upd.title} ${upd.titleTe} ${upd.description} ${upd.descriptionTe} ${upd.sourceName}`.toLowerCase();
    return hay.includes(q);
  });

  const unreadNotifCount = notifications.filter(n => n.published && !readNotifIds.includes(n.id)).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* =====================================================================
          STRICT 3-ZONE TOP BAR CONTRACT
          Zone 1: Single text element wordmark
          Zone 2: 5 concise single-line text navigation links
          Zone 3: 1 primary CTA button
      ===================================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-8">
        <a
          href="#home"
          onClick={e => {
            e.preventDefault();
            navigateTo('home');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
        >
          {t.brandName}
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#after-10th"
            onClick={e => {
              e.preventDefault();
              navigateTo('after-10th');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'after-10th' ? 'text-sky-700 font-semibold underline' : ''
            }`}
          >
            {t.navAfter10th}
          </a>
          <a
            href="#after-inter"
            onClick={e => {
              e.preventDefault();
              navigateTo('after-inter');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'after-inter' ? 'text-sky-700 font-semibold underline' : ''
            }`}
          >
            {t.navAfterInter}
          </a>
          <a
            href="#exams"
            onClick={e => {
              e.preventDefault();
              navigateTo('exams');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'exams' ? 'text-sky-700 font-semibold underline' : ''
            }`}
          >
            {t.navExams}
          </a>
          <a
            href="#scholarships"
            onClick={e => {
              e.preventDefault();
              navigateTo('scholarships');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'scholarships' ? 'text-sky-700 font-semibold underline' : ''
            }`}
          >
            {t.navScholarships}
          </a>
          <a
            href="#careers"
            onClick={e => {
              e.preventDefault();
              navigateTo('careers');
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activePage === 'careers' ? 'text-sky-700 font-semibold underline' : ''
            }`}
          >
            {t.navCareers}
          </a>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('planner')}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors whitespace-nowrap shrink-0"
          >
            {t.navPlanner}
          </button>
        </div>
      </header>

      {/* =====================================================================
          SECONDARY DIRECTORY & BILINGUAL WORKSPACE TOOLBAR
      ===================================================================== */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Secondary Directory Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-medium">
            <button
              type="button"
              onClick={() => navigateTo('home')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'home' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navHome}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('colleges')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'colleges' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navColleges}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('updates')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'updates' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navUpdates}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'notifications' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navNotifications} ({unreadNotifCount})
            </button>
            <button
              type="button"
              onClick={() => navigateTo('about')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'about' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navAbout}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('contact')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'contact' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navContact}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('audit-report')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activePage === 'audit-report' ? 'text-sky-400 font-semibold' : 'text-slate-300'
              }`}
            >
              {t.navAuditReport}
            </button>
          </div>

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs font-medium text-slate-200 py-1"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span>All Pages & Directories</span>
          </button>

          {/* Language Switcher & Admin Access */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'te' : 'en')}
              className="px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              aria-label="Switch Language between English and Telugu"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'en' ? 'తెలుగులో చూడండి (Telugu)' : 'Switch to English'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo(isAdmin ? 'admin-dashboard' : 'admin-login')}
              className="px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAdmin ? t.navAdminDashboard : t.navAdminLogin}</span>
            </button>
          </div>
        </div>

        {/* Mobile Full Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden pt-3 pb-2 mt-2 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {(
              [
                ['home', t.navHome],
                ['after-10th', t.navAfter10th],
                ['after-inter', t.navAfterInter],
                ['exams', t.navExams],
                ['colleges', t.navColleges],
                ['scholarships', t.navScholarships],
                ['careers', t.navCareers],
                ['planner', t.navPlanner],
                ['updates', t.navUpdates],
                ['notifications', `${t.navNotifications} (${unreadNotifCount})`],
                ['about', t.navAbout],
                ['contact', t.navContact],
                ['admin-dashboard', isAdmin ? t.navAdminDashboard : t.navAdminLogin],
                ['audit-report', t.navAuditReport]
              ] as Array<[PageId, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateTo(id)}
                className={`text-left px-3 py-2 rounded-md ${
                  activePage === id ? 'bg-sky-700 text-white font-semibold' : 'bg-slate-800/70 text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Translation Accuracy Notice when in Telugu */}
      {lang === 'te' && (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 text-center text-xs text-sky-950">
          {t.translationNotice}
        </div>
      )}

      {/* Global Loading or Error Banner */}
      {loadingData && (
        <div className="bg-white border-b border-slate-200 px-4 py-2 text-center text-xs text-slate-600">
          Synchronizing educational directories with Cloud Firestore...
        </div>
      )}
      {dataError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-center text-xs text-red-900">
          Firestore Notice: {dataError}
        </div>
      )}

      {/* =====================================================================
          MAIN VIEWPORT ROUTER
      ===================================================================== */}
      <main className="flex-grow">
        {/* ===================================================================
            PAGE 1: HOME
        =================================================================== */}
        {activePage === 'home' && (
          <div>
            {/* Hero Section — Balanced 2-Column Split */}
            <section className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                  <div className="lg:col-span-7 flex flex-col justify-center">
                    <p className="text-xs font-semibold tracking-wide text-sky-700 mb-3">
                      {t.heroKicker}
                    </p>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-[1.15]">
                      {t.heroTitle}
                    </h1>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl">
                      {t.heroSubtitle}
                    </p>

                    {/* Working Global Search Bar */}
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        const q = searchQuery.toLowerCase().trim();
                        if (!q) {
                          navigateTo('after-inter');
                          return;
                        }
                        if (q.includes('10th') || q.includes('mpc') || q.includes('bipc') || q.includes('poly') || q.includes('iti')) {
                          navigateTo('after-10th', true);
                        } else if (q.includes('jee') || q.includes('neet') || q.includes('eapcet') || q.includes('cet') || q.includes('clat') || q.includes('gate') || q.includes('cat')) {
                          navigateTo('exams', true);
                        } else if (q.includes('scholar') || q.includes('epass') || q.includes('jnanabhumi') || q.includes('nsp')) {
                          navigateTo('scholarships', true);
                        } else if (q.includes('iit') || q.includes('nit') || q.includes('university') || q.includes('college')) {
                          navigateTo('colleges', true);
                        } else {
                          navigateTo('after-inter', true);
                        }
                      }}
                      className="mt-7 flex flex-col sm:flex-row gap-2.5 max-w-2xl"
                    >
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={t.heroSearchPlaceholder}
                          className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-5 py-3 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        {t.heroSearchBtn}
                      </button>
                    </form>

                    {/* Primary Pathway Actions */}
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('after-10th')}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-sky-700" />
                        {t.heroExplore10thBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('after-inter')}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-sky-700" />
                        {t.heroExploreInterBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('planner')}
                        className="px-4 py-2.5 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <Compass className="w-3.5 h-3.5 text-sky-700" />
                        {t.heroPlannerBtn}
                      </button>
                    </div>
                  </div>

                  {/* Hero Visual Anchor */}
                  <div className="lg:col-span-5">
                    <div className="relative h-full min-h-[280px] rounded-xl overflow-hidden bg-slate-900 border border-slate-200">
                      <img
                        src={heroCampusImg}
                        alt="Indian college students studying together on a sunlit campus in Hyderabad"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 text-white">
                        <p className="text-xs font-mono text-sky-300">
                          VERIFIED EDUCATIONAL DIRECTORIES
                        </p>
                        <p className="text-sm font-medium mt-1">
                          Covering BIEAP, TGBIE, SBTET, APSCHE, TGCHE, NTA, JoSAA, MCC, Jnanabhumi, Telangana ePASS & NSP portals.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full-Width Key Directory Metrics Row Below Hero Split */}
                <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {courses.filter(c => c.published).length} Pathways
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Recognized Courses After Class 10 & Intermediate (10+2)
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {exams.filter(e => e.published).length} Entrance Exams
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      AP EAPCET, TG EAPCET, POLYCET, ECET, ICET, JEE, NEET, CUET, CLAT
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {scholarships.filter(s => s.published).length} Major Schemes
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      AP Jnanabhumi, Telangana ePASS, NSP Central Sector, AICTE & INSPIRE
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      English · తెలుగు
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Bilingual Guidance with Direct Official Government Portal Links
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Explore After 10th & Explore After Intermediate */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                {/* After 10th Card */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <div className="h-52 bg-slate-900 relative overflow-hidden">
                    <img
                      src={pathwayEnggImg}
                      alt="Students working on electronics and polytechnic engineering laboratory equipment"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        SSC / Class 10 Milestone · BIEAP · TGBIE · SBTET · DGT
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {t.secExploreAfter10th}
                      </h2>
                      <p className="text-sm text-slate-600 mt-2">
                        {t.secExploreAfter10thDesc}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                        {courses
                          .filter(c => c.level === 'after_10th' && c.published)
                          .slice(0, 5)
                          .map(c => (
                            <div key={c.id} className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-900">
                                {lang === 'te' && c.titleTe ? c.titleTe : c.title}
                              </span>
                              <span className="text-slate-500 font-mono tabular-nums shrink-0">
                                {c.duration}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => navigateTo('after-10th')}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <span>{t.heroExplore10thBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* After Intermediate Card */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                  <div className="h-52 bg-slate-900 relative overflow-hidden">
                    <img
                      src={pathwayMedImg}
                      alt="Students examining samples in a medical and life sciences laboratory"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Intermediate (10+2) Milestone · APSCHE · TGCHE · JoSAA · MCC · CUET
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {t.secExploreAfterInter}
                      </h2>
                      <p className="text-sm text-slate-600 mt-2">
                        {t.secExploreAfterInterDesc}
                      </p>
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                        {courses
                          .filter(c => c.level === 'after_inter' && c.published)
                          .slice(0, 5)
                          .map(c => (
                            <div key={c.id} className="flex items-center justify-between gap-2">
                              <span className="font-medium text-slate-900">
                                {lang === 'te' && c.titleTe ? c.titleTe : c.title}
                              </span>
                              <span className="text-slate-500 font-mono tabular-nums shrink-0">
                                {c.duration}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => navigateTo('after-inter')}
                        className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                      >
                        <span>{t.heroExploreInterBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Entrance Examinations & Scholarships Split */}
            <section className="bg-white border-y border-slate-200 py-14">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Entrance Exams Preview (7 cols) */}
                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs font-mono text-sky-700">ENTRANCE EXAM DIRECTORY</p>
                      <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                        {t.secUpcomingExams}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo('exams')}
                      className="text-xs font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      <span>View All {exams.length} Exams</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-[#F8FAFC] px-5">
                    {exams
                      .filter(e => e.published)
                      .slice(0, 6)
                      .map(exam => (
                        <div key={exam.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs text-slate-500">
                              <span>{exam.state}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{exam.examAuthority}</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              {lang === 'te' && exam.nameTe ? exam.nameTe : exam.name}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Schedule: {exam.datesVerified ? exam.importantDates : t.lblExamDateNotVerified}
                            </p>
                          </div>
                          <a
                            href={exam.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            {t.lblVisitOfficialPortal}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Scholarships & Updates Preview (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs font-mono text-sky-700">FINANCIAL AID</p>
                        <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                          {t.secScholarships}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('scholarships')}
                        className="text-xs font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>All Scholarships</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {scholarships
                        .filter(s => s.published)
                        .slice(0, 4)
                        .map(sch => (
                          <div key={sch.id} className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-xl">
                            <div className="text-xs text-slate-500">
                              <span>{sch.state}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{sch.educationLevel}</span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              {lang === 'te' && sch.nameTe ? sch.nameTe : sch.name}
                            </h3>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-slate-500">{sch.sourceReference}</span>
                              <a
                                href={sch.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                              >
                                Portal
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Latest Verified Official Updates & Career Planner Shortcut */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-mono text-sky-700">VERIFIED OFFICIAL SOURCES</p>
                    <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                      {t.secLatestUpdates}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo('updates')}
                    className="text-xs font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                  >
                    <span>All Official Updates</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {updates
                    .filter(u => u.published)
                    .slice(0, 4)
                    .map(upd => (
                      <div key={upd.id} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                            <span className="font-semibold text-emerald-700">
                              ✓ {upd.verificationStatus}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{upd.state}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">Checked: {upd.dateChecked}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900">
                            {lang === 'te' && upd.titleTe ? upd.titleTe : upd.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1.5">
                            {lang === 'te' && upd.descriptionTe ? upd.descriptionTe : upd.description}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">{upd.sourceName}</span>
                          <a
                            href={upd.officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            {t.lblVisitOfficialPortal}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Career Planner Banner */}
              <div className="bg-slate-900 text-white rounded-xl p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <p className="text-xs font-mono text-sky-400">PERSONALIZED ROADMAP GENERATOR</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                    {t.plannerHeading}
                  </h2>
                  <p className="text-sm text-slate-300 mt-2">
                    {t.plannerSubheading}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => navigateTo('planner')}
                    className="px-5 py-3 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <Compass className="w-4 h-4" />
                    {t.heroPlannerBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('colleges')}
                    className="px-4 py-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {t.navColleges}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================
            PAGE 2 & PAGE 3: COURSES AFTER 10TH & COURSES AFTER INTERMEDIATE
        =================================================================== */}
        {(activePage === 'after-10th' || activePage === 'after-inter') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {(() => {
              const targetLevel = activePage === 'after-10th' ? 'after_10th' : 'after_inter';
              const list = getFilteredCourses(targetLevel);
              const availableCats = Array.from(
                new Set(courses.filter(c => c.level === targetLevel).map(c => c.category))
              );

              return (
                <>
                  <div className="border-b border-slate-200 pb-6 mb-6">
                    <p className="text-xs font-mono text-sky-700 mb-1">
                      {activePage === 'after-10th'
                        ? 'PHASE 5 · CLASS 10 (SSC) PATHWAY DIRECTORY'
                        : 'PHASE 6 · INTERMEDIATE (10+2) DEGREE & PROFESSIONAL DIRECTORY'}
                    </p>
                    <h1 className="text-3xl font-bold text-slate-900">
                      {activePage === 'after-10th' ? t.secExploreAfter10th : t.secExploreAfterInter}
                    </h1>
                    <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                      {activePage === 'after-10th' ? t.secExploreAfter10thDesc : t.secExploreAfterInterDesc}
                    </p>
                  </div>

                  {/* Statutory Eligibility Disclaimer */}
                  <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                    <strong className="text-slate-900">Eligibility Note: </strong>
                    {t.lblInstitutionDisclaimer}
                  </div>

                  {/* Search & Filter Controls */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                      >
                        <option value="ALL">{t.filterCategoryLabel}: {t.filterAll}</option>
                        {availableCats.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <select
                        value={stateFilter}
                        onChange={e => setStateFilter(e.target.value)}
                        className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                      >
                        <option value="ALL">{t.filterStateLabel}: {t.filterAll}</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Telangana">Telangana</option>
                        <option value="AP & TG">AP & TG</option>
                        <option value="All India">All India</option>
                      </select>

                      <button
                        type="button"
                        onClick={resetFilters}
                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t.clearFiltersBtn}
                      </button>
                    </div>
                  </div>

                  {/* Course Detail View if Selected */}
                  {selectedCourse && (
                    <div className="mb-8 bg-white border-2 border-sky-700 rounded-xl p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-6">
                        <div>
                          <div className="text-xs text-slate-500">
                            <span>{selectedCourse.category}</span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono tabular-nums">{selectedCourse.duration}</span>
                            <span aria-hidden="true"> · </span>
                            <span>{selectedCourse.state}</span>
                          </div>
                          <h2 className="text-2xl font-bold text-slate-900 mt-1">
                            {lang === 'te' && selectedCourse.titleTe ? selectedCourse.titleTe : selectedCourse.title}
                          </h2>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCourse(null)}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                        >
                          {t.btnCloseDetails}
                        </button>
                      </div>

                      <p className="text-sm text-slate-700 mb-6">
                        {lang === 'te' && selectedCourse.descriptionTe
                          ? selectedCourse.descriptionTe
                          : selectedCourse.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblEligibility}</h3>
                            <p className="text-slate-600">
                              {lang === 'te' && selectedCourse.eligibilityTe
                                ? selectedCourse.eligibilityTe
                                : selectedCourse.eligibility}
                            </p>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblAdmissionProcess}</h3>
                            <p className="text-slate-600">{selectedCourse.admissionProcess}</p>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblSubjects}</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                              {selectedCourse.subjects.map(sub => (
                                <li key={sub}>{sub}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblStudyPathways}</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                              {selectedCourse.studyPathways.map(p => (
                                <li key={p}>{p}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblCareerOpportunities}</h3>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                              {selectedCourse.careerOpportunities.map(op => (
                                <li key={op}>{op}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblFurtherEducation}</h3>
                            <p className="text-slate-600">{selectedCourse.furtherEducation.join(' · ')}</p>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm mb-1">{t.lblEntranceExams}</h3>
                            <p className="text-slate-600">{selectedCourse.entranceExams.join(' · ')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                        <span className="text-slate-500">
                          {t.lblOfficialSource}: <strong className="text-slate-800">{selectedCourse.officialSourceName}</strong> ·{' '}
                          <span className="font-mono tabular-nums">
                            {t.lblLastVerified}: {selectedCourse.lastVerifiedDate}
                          </span>
                        </span>
                        <a
                          href={selectedCourse.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
                        >
                          {t.lblVisitOfficialPortal}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Courses List */}
                  {list.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                      <h3 className="text-base font-bold text-slate-900">{t.emptySearchTitle}</h3>
                      <p className="text-xs text-slate-500 mt-1">{t.emptySearchSubtitle}</p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg"
                      >
                        {t.clearFiltersBtn}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {list.map(course => (
                        <article
                          key={course.id}
                          className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                        >
                          <div>
                            {/* Unboxed metadata line per Zero-Pill Rule */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                              <span>{course.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{course.duration}</span>
                              <span aria-hidden="true">·</span>
                              <span>{course.state}</span>
                            </div>

                            <h2 className="text-lg font-bold text-slate-900">
                              {lang === 'te' && course.titleTe ? course.titleTe : course.title}
                            </h2>

                            <p className="text-sm text-slate-600 mt-2">
                              {lang === 'te' && course.descriptionTe ? course.descriptionTe : course.description}
                            </p>

                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                              <div>
                                <strong className="text-slate-900">{t.lblEligibility}: </strong>
                                {lang === 'te' && course.eligibilityTe ? course.eligibilityTe : course.eligibility}
                              </div>
                              <div>
                                <strong className="text-slate-900">{t.lblSubjects}: </strong>
                                {course.subjects.join(', ')}
                              </div>
                              <div>
                                <strong className="text-slate-900">{t.lblCareerOpportunities}: </strong>
                                {course.careerOpportunities.join(', ')}
                              </div>
                              <div>
                                <strong className="text-slate-900">{t.lblFurtherEducation}: </strong>
                                {course.furtherEducation.join(', ')}
                              </div>
                              <div>
                                <strong className="text-slate-900">{t.lblEntranceExams}: </strong>
                                {course.entranceExams.join(', ')}
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCourse(course);
                                window.scrollTo({ top: 160, behavior: 'smooth' });
                              }}
                              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                            >
                              {t.btnViewDetails}
                            </button>

                            <a
                              href={course.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                            >
                              <span>{course.officialSourceName}</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* ===================================================================
            PAGE 4: ENTRANCE EXAM DIRECTORY
        =================================================================== */}
        {activePage === 'exams' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-slate-200 pb-6 mb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">
                PHASE 7 · STATE & NATIONAL ENTRANCE EXAMINATIONS
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{t.secUpcomingExams}</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                Directory of 18+ statutory entrance examinations across Andhra Pradesh, Telangana, and All India. Where official dates have not yet been announced or verified by the conducting authority, "Official date not verified." is explicitly shown.
              </p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search JEE, NEET, AP EAPCET, TG EAPCET, POLYCET, ECET, ICET, CLAT, NATA, NIFT, NID, GATE, CAT..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterStateLabel}: {t.filterAll}</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="All India">All India</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterCategoryLabel}: {t.filterAll}</option>
                  {Array.from(new Set(exams.map(e => e.category))).map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.clearFiltersBtn}
                </button>
              </div>
            </div>

            {filteredExams.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <h3 className="text-base font-bold text-slate-900">{t.emptySearchTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.emptySearchSubtitle}</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg"
                >
                  {t.clearFiltersBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredExams.map(exam => (
                  <article
                    key={exam.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                        <span>{exam.state}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exam.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {t.lblLastVerified}: {exam.lastVerifiedDate}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'te' && exam.nameTe ? exam.nameTe : exam.name}
                      </h2>

                      <p className="text-sm text-slate-600 mt-2">
                        {lang === 'te' && exam.purposeTe ? exam.purposeTe : exam.purpose}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div>
                          <strong className="text-slate-900">Conducting Authority: </strong>
                          {exam.examAuthority}
                        </div>
                        <div>
                          <strong className="text-slate-900">{t.lblEligibility}: </strong>
                          {exam.eligibility}
                        </div>
                        <div>
                          <strong className="text-slate-900">Application Information: </strong>
                          {exam.applicationInfo}
                        </div>
                        <div>
                          <strong className="text-slate-900">Target Courses: </strong>
                          {exam.targetCourses.join(', ')}
                        </div>
                        <div className="pt-1">
                          <strong className="text-slate-900">Important Dates: </strong>
                          <span className={exam.datesVerified ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-medium'}>
                            {exam.datesVerified ? exam.importantDates : 'Official date not verified.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs font-mono text-slate-500 truncate">{exam.officialUrl}</span>
                      <a
                        href={exam.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        {t.lblVisitOfficialPortal}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            PAGE 5: COLLEGE DIRECTORY
        =================================================================== */}
        {activePage === 'colleges' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-slate-200 pb-6 mb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">
                PHASE 8 · RECOGNIZED UNIVERSITIES & COLLEGES DIRECTORY
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{t.navColleges}</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                Searchable reference directory of Central Institutes and State Universities in Andhra Pradesh and Telangana. Sample reference records used during development are clearly labeled so students verify live seat matrices on the official counseling portal.
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search college name, district (Hyderabad, Visakhapatnam, Tirupati, Warangal, Guntur), or course..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterStateLabel}: {t.filterAll}</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                </select>

                <select
                  value={districtFilter}
                  onChange={e => setDistrictFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterDistrictLabel}: {t.filterAll}</option>
                  {Array.from(new Set(colleges.map(c => c.district))).map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={instTypeFilter}
                  onChange={e => setInstTypeFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterTypeLabel}: {t.filterAll}</option>
                  <option value="Central Institute">Central Institute</option>
                  <option value="State University">State University</option>
                  <option value="Government College">Government College</option>
                  <option value="Private/Deemed">Private/Deemed</option>
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.clearFiltersBtn}
                </button>
              </div>
            </div>

            {filteredColleges.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <h3 className="text-base font-bold text-slate-900">{t.emptySearchTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.emptySearchSubtitle}</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg"
                >
                  {t.clearFiltersBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredColleges.map(col => (
                  <article
                    key={col.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                        <span>{col.state}</span>
                        <span aria-hidden="true">·</span>
                        <span>{col.district}</span>
                        <span aria-hidden="true">·</span>
                        <span>{col.institutionType}</span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'te' && col.nameTe ? col.nameTe : col.name}
                      </h2>

                      <p className="text-xs text-slate-500 mt-1">{col.location}</p>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div>
                          <strong className="text-slate-900">Available Courses: </strong>
                          {col.availableCourses.join(', ')}
                        </div>
                        <div>
                          <strong className="text-slate-900">{t.lblAdmissionProcess}: </strong>
                          {col.admissionProcess}
                        </div>
                        <div>
                          <strong className="text-slate-900">{t.lblEntranceExams}: </strong>
                          {col.entranceExams.join(', ')}
                        </div>
                        <div>
                          <strong className="text-slate-900">{t.lblOfficialSource}: </strong>
                          {col.sourceReference}
                        </div>
                        {col.isSampleRecord && (
                          <div className="text-amber-800 font-medium pt-1">
                            Note: {t.lblSampleDataNotice}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      <span className="text-xs font-mono text-slate-500">
                        {t.lblLastVerified}: {col.lastVerifiedDate}
                      </span>
                      <a
                        href={col.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        {t.lblVisitOfficialPortal}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            PAGE 6: SCHOLARSHIP DIRECTORY
        =================================================================== */}
        {activePage === 'scholarships' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-slate-200 pb-6 mb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">
                PHASE 9 · STATE & CENTRAL GOVERNMENT SCHOLARSHIPS
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{t.secScholarships}</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                Official state and central scholarship schemes including Andhra Pradesh Jnanabhumi, Telangana ePASS, National Scholarship Portal (NSP), AICTE Pragati & Saksham, DST INSPIRE, and NMMS.
              </p>
            </div>

            {/* Statutory Non-Guarantee Disclaimer */}
            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
              {t.lblScholarshipDisclaimer}
            </div>

            {/* Search & Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Jnanabhumi, Telangana ePASS, NSP, Pragati, Saksham, INSPIRE, NMMS..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterStateLabel}: {t.filterAll}</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="All India">All India</option>
                </select>

                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterCategoryLabel}: {t.filterAll}</option>
                  {Array.from(new Set(scholarships.map(s => s.category))).map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.clearFiltersBtn}
                </button>
              </div>
            </div>

            {filteredScholarships.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <h3 className="text-base font-bold text-slate-900">{t.emptySearchTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.emptySearchSubtitle}</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg"
                >
                  {t.clearFiltersBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredScholarships.map(sch => (
                  <article
                    key={sch.id}
                    className="bg-white border border-slate-200 rounded-xl p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                      <span>{sch.state}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sch.educationLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sch.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {t.lblLastVerified}: {sch.lastVerifiedDate}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {lang === 'te' && sch.nameTe ? sch.nameTe : sch.name}
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
                      <div className="lg:col-span-7 space-y-2.5">
                        <div>
                          <strong className="text-slate-900">{t.lblEligibility}: </strong>
                          {lang === 'te' && sch.eligibilityTe ? sch.eligibilityTe : sch.eligibility}
                        </div>
                        <div>
                          <strong className="text-slate-900">Benefits (Official Norms): </strong>
                          {sch.benefits}
                        </div>
                        <div>
                          <strong className="text-slate-900">Application Period: </strong>
                          <span className="text-amber-900 font-medium">{sch.applicationPeriod}</span>
                        </div>
                      </div>

                      <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <strong className="text-slate-900 block mb-2">
                          Commonly Required Official Documents:
                        </strong>
                        <ul className="list-disc pl-4 space-y-1 text-slate-600">
                          {sch.requiredDocuments.map(docItem => (
                            <li key={docItem}>{docItem}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-slate-500">
                        {t.lblOfficialSource}: <strong className="text-slate-800">{sch.sourceReference}</strong>
                      </span>
                      <a
                        href={sch.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        {t.lblVisitOfficialPortal}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            PAGE 7: CAREER OPTIONS
        =================================================================== */}
        {activePage === 'careers' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-slate-200 pb-6 mb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">
                PHASE 10 · MULTI-DISCIPLINARY CAREER EXPLORATION
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{t.secCareerGuidance}</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                Explore structured career pathways across Engineering, Medicine, Allied Health, Agriculture, Commerce, Civil Services, Law, and Design.
              </p>
            </div>

            <div className="mb-6 p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
              {t.lblCareerDisclaimer}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search career title, sector, skill, or related entrance exam..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="flex items-center gap-2.5">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">Sector: {t.filterAll}</option>
                  {Array.from(new Set(careers.map(c => c.sector))).map(sec => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.clearFiltersBtn}
                </button>
              </div>
            </div>

            {filteredCareers.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <h3 className="text-base font-bold text-slate-900">{t.emptySearchTitle}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.emptySearchSubtitle}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCareers.map(car => (
                  <article
                    key={car.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs text-slate-500 mb-1.5">
                        <span>{car.sector}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{car.officialReference}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'te' && car.titleTe ? car.titleTe : car.title}
                      </h2>
                      <p className="text-sm text-slate-600 mt-2">
                        {lang === 'te' && car.descriptionTe ? car.descriptionTe : car.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div>
                          <strong className="text-slate-900">Required Education: </strong>
                          {car.requiredEducation}
                        </div>
                        <div>
                          <strong className="text-slate-900">Key Skills: </strong>
                          {car.skills.join(', ')}
                        </div>
                        <div>
                          <strong className="text-slate-900">Potential Industries: </strong>
                          {car.industries.join(', ')}
                        </div>
                        <div>
                          <strong className="text-slate-900">Further Study Options: </strong>
                          {car.furtherStudy.join(', ')}
                        </div>
                        <div>
                          <strong className="text-slate-900">Related Courses: </strong>
                          {car.relatedCourses.join(', ')}
                        </div>
                        <div>
                          <strong className="text-slate-900">Related Entrance Exams: </strong>
                          {car.relatedExams.join(', ')}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            PAGE 8: CAREER PLANNER
        =================================================================== */}
        {activePage === 'planner' && (
          <PlannerView
            lang={lang}
            user={user}
            courses={courses.filter(c => c.published)}
            exams={exams.filter(e => e.published)}
            scholarships={scholarships.filter(s => s.published)}
            careers={careers.filter(c => c.published)}
            onNavigate={navigateTo}
          />
        )}

        {/* ===================================================================
            PAGE 9: OFFICIAL UPDATES & LIVE PORTAL CHECKER
        =================================================================== */}
        {activePage === 'updates' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            <div className="border-b border-slate-200 pb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">
                PHASE 12 · VERIFIED OFFICIAL SOURCES & ANNOUNCEMENTS
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{t.updatesHeading}</h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">{t.updatesSubheading}</p>
            </div>

            {/* Search & Filters */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search official updates by portal name, state, or topic..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <select
                  value={stateFilter}
                  onChange={e => setStateFilter(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="ALL">{t.filterStateLabel}: {t.filterAll}</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="All India">All India</option>
                </select>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  {t.clearFiltersBtn}
                </button>
              </div>
            </div>

            {/* Updates List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredUpdates.map(upd => {
                const probe = liveProbeResults[upd.officialUrl];
                return (
                  <article
                    key={upd.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                        {upd.verificationStatus === 'VERIFIED' ? (
                          <span className="font-semibold text-emerald-700">
                            ✓ {t.statusVerified}
                          </span>
                        ) : upd.verificationStatus === 'CHECK_FAILED' ? (
                          <span className="font-semibold text-red-700">
                            ✕ {t.statusCheckFailed}
                          </span>
                        ) : (
                          <span className="font-semibold text-amber-700">
                            ! {t.statusUnverified}
                          </span>
                        )}
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="text-slate-500">{upd.state}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          Checked: {upd.dateChecked}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900">
                        {lang === 'te' && upd.titleTe ? upd.titleTe : upd.title}
                      </h2>

                      <p className="text-sm text-slate-600 mt-2">
                        {lang === 'te' && upd.descriptionTe ? upd.descriptionTe : upd.description}
                      </p>

                      {probe && (
                        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
                          <div
                            className={
                              probe.status === 'VERIFIED_REACHABLE'
                                ? 'text-emerald-700 font-semibold'
                                : 'text-red-700 font-semibold'
                            }
                          >
                            Live Server Probe: {probe.status} (HTTP {probe.httpCode}) at {probe.checkedAt}
                          </div>
                          {probe.title && <div className="text-slate-700 mt-0.5">Title: {probe.title}</div>}
                          {probe.error && <div className="text-red-700 mt-0.5">Note: {probe.error}</div>}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handlePublicPortalProbe(upd.officialUrl)}
                        disabled={liveProbeLoadingUrl === upd.officialUrl}
                        className="px-3 py-1.5 font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1.5"
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-700" />
                        {liveProbeLoadingUrl === upd.officialUrl
                          ? 'Checking Portal...'
                          : 'Test Live Reachability'}
                      </button>

                      <a
                        href={upd.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-sky-700 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{upd.sourceName}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            PAGE 10: NOTIFICATIONS
        =================================================================== */}
        {activePage === 'notifications' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="border-b border-slate-200 pb-6 mb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">
                PHASE 3G · IN-SITE VERIFIED NOTIFICATIONS
              </p>
              <h1 className="text-3xl font-bold text-slate-900">{t.notificationsHeading}</h1>
              <p className="text-sm text-slate-600 mt-2">{t.notificationsSubheading}</p>
            </div>

            <div className="space-y-4">
              {notifications
                .filter(n => isAdmin || n.published)
                .map(notif => {
                  const isRead = readNotifIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      className={`p-5 rounded-xl border transition-colors ${
                        isRead
                          ? 'bg-white border-slate-200 opacity-80'
                          : 'bg-white border-sky-300 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                        <div>
                          <span className="font-semibold text-slate-800">{notif.category}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{notif.state}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">{notif.dateLabel}</span>
                        </div>
                        {isRead ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.markedReadLabel}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkNotificationRead(notif.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md"
                          >
                            {t.markAsReadBtn}
                          </button>
                        )}
                      </div>

                      <h2 className="text-base font-bold text-slate-900">
                        {lang === 'te' && notif.titleTe ? notif.titleTe : notif.title}
                      </h2>

                      <p className="text-sm text-slate-600 mt-1">
                        {lang === 'te' && notif.messageTe ? notif.messageTe : notif.message}
                      </p>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{notif.sourceReference}</span>
                        <a
                          href={notif.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sky-700 hover:underline inline-flex items-center gap-1"
                        >
                          {t.lblVisitOfficialPortal}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ===================================================================
            PAGE 11: ABOUT US
        =================================================================== */}
        {activePage === 'about' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
            <div className="border-b border-slate-200 pb-6">
              <p className="text-xs font-mono text-sky-700 mb-1">ABOUT NEXTSTEP CAREERS</p>
              <h1 className="text-3xl font-bold text-slate-900">
                {lang === 'te'
                  ? 'నెక్స్ట్‌స్టెప్ కెరీర్స్ (NextStep Careers) గురించి'
                  : 'Transparent, Source-Verified Career Guidance for Students in AP, Telangana & India'}
              </h1>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-4 text-sm text-slate-700">
              <p>
                <strong>NextStep Careers</strong> is built to help students and families across{' '}
                <strong>Andhra Pradesh, Telangana, and India</strong> navigate critical educational milestones after{' '}
                <strong>Class 10 (SSC)</strong> and <strong>Intermediate (10+2)</strong> without misinformation or unverified claims.
              </p>
              <h2 className="text-lg font-bold text-slate-900 pt-2">
                Our Verification & Editorial Principles
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Zero Invented Deadlines:</strong> We never fabricate exam dates, application windows, or government announcements. If an exam authority has not published or verified the current cycle date, we explicitly state <em>"Official date not verified."</em>
                </li>
                <li>
                  <strong>Direct Statutory Source Links:</strong> Every course, entrance exam, college, and scholarship entry links directly to the statutory council or portal (BIEAP, TGBIE, SBTET, APSCHE, TGCHE, NTA, JoSAA, MCC, Jnanabhumi, Telangana ePASS, and NSP).
                </li>
                <li>
                  <strong>Bilingual Accessibility (English & తెలుగు):</strong> Students and parents can switch seamlessly between English and Telugu while preserving official portal titles and URLs accurately.
                </li>
                <li>
                  <strong>Privacy & Security by Default:</strong> Powered by Cloud Firestore with strict role-based security rules and isolated user preferences.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ===================================================================
            PAGE 12: CONTACT US
        =================================================================== */}
        {activePage === 'contact' && (
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <h1 className="text-2xl font-bold text-slate-900">{t.navContact}</h1>
              <p className="text-xs text-slate-500 mt-1 mb-6">
                Have a question about an educational pathway or want to report an updated official portal link? Submit your message below.
              </p>

              {contactFeedback && (
                <div
                  className={`mb-5 p-3.5 rounded-lg border text-xs flex items-center gap-2 ${
                    contactFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}
                >
                  {contactFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                  )}
                  <span>{contactFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs" noValidate>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      State
                    </label>
                    <select
                      value={contactState}
                      onChange={e => setContactState(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Other State in India">Other State in India</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inquiry / Official Source Link Report *
                  </label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    placeholder="Describe your course, exam, or official source question..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
                >
                  Submit Inquiry
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================
            PAGE 13 & 14: ADMIN LOGIN & ADMIN DASHBOARD
        =================================================================== */}
        {(activePage === 'admin-login' || activePage === 'admin-dashboard') && (
          <AdminDashboardView
            lang={lang}
            user={user}
            isAdmin={isAdmin}
            isFromFirestore={isFromFirestore}
            courses={courses}
            categories={categories}
            exams={exams}
            colleges={colleges}
            scholarships={scholarships}
            careers={careers}
            updates={updates}
            sources={sources}
            notifications={notifications}
            onRefreshAll={() => loadAllCollections(isAdmin)}
          />
        )}

        {/* ===================================================================
            AUDIT & SETUP REPORT VIEW
        =================================================================== */}
        {activePage === 'audit-report' && (
          <AuditAndSetupView isFromFirestore={isFromFirestore} />
        )}
      </main>

      {/* =====================================================================
          CLEAN FOOTER
      ===================================================================== */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="font-bold text-slate-900 text-sm font-display">
              {t.brandName}
            </div>
            <p className="mt-1 max-w-xl">
              Educational and career guidance directory for students in Andhra Pradesh, Telangana, and across India. Always verify final admission dates and eligibility criteria on the linked official government and examination portals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => navigateTo('after-10th')} className="hover:text-slate-900">
              {t.navAfter10th}
            </button>
            <button type="button" onClick={() => navigateTo('after-inter')} className="hover:text-slate-900">
              {t.navAfterInter}
            </button>
            <button type="button" onClick={() => navigateTo('exams')} className="hover:text-slate-900">
              {t.navExams}
            </button>
            <button type="button" onClick={() => navigateTo('scholarships')} className="hover:text-slate-900">
              {t.navScholarships}
            </button>
            <button type="button" onClick={() => navigateTo('audit-report')} className="hover:text-slate-900">
              {t.navAuditReport}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
