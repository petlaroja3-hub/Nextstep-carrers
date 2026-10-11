import React, { useState, useEffect } from 'react';
import {
  Compass,
  CheckCircle2,
  ExternalLink,
  Save,
  LogIn,
  AlertCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import type {
  Language,
  Course,
  EntranceExam,
  Scholarship,
  Career,
  StateScope,
  UserPreference,
  PageId
} from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import {
  auth,
  googleProvider,
  signInWithPopup,
  type User
} from '../firebase';
import {
  loadUserPreferences,
  saveUserPreferences
} from '../services/firestoreService';

interface PlannerViewProps {
  lang: Language;
  user: User | null;
  courses: Course[];
  exams: EntranceExam[];
  scholarships: Scholarship[];
  careers: Career[];
  onNavigate: (page: PageId) => void;
}

const INTEREST_OPTIONS = [
  'Software & Computing',
  'Core Engineering & Robotics',
  'Clinical Medicine & Healthcare',
  'Agriculture & Rural Sciences',
  'Commerce, Finance & Taxation',
  'Law, Judiciary & Public Policy',
  'Civil Services & Administration',
  'Architecture & Product Design',
  'Pure Sciences & Research',
  'Technical Skill Trades'
];

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology (Botany / Zoology)',
  'Commerce & Accountancy',
  'Economics',
  'History & Civics / Polity',
  'Computer Science / IT',
  'Drawing & Spatial Design'
];

const GOAL_OPTIONS = [
  'Engineering & Technology',
  'Medicine & Allied Health',
  'Science & Agriculture',
  'Commerce, Banking & Management',
  'Government & Public Services',
  'Law & Judiciary',
  'Design & Architecture'
];

export const PlannerView: React.FC<PlannerViewProps> = ({
  lang,
  user,
  courses,
  exams,
  scholarships,
  careers,
  onNavigate
}) => {
  const t = TRANSLATIONS[lang];

  const [currentLevel, setCurrentLevel] = useState<UserPreference['currentLevel']>('class_10');
  const [preferredState, setPreferredState] = useState<StateScope>('AP & TG');
  const [educationPreference, setEducationPreference] =
    useState<UserPreference['educationPreference']>('any');
  const [interests, setInterests] = useState<string[]>(['Software & Computing', 'Core Engineering & Robotics']);
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>(['Mathematics', 'Physics']);
  const [careerGoals, setCareerGoals] = useState<string[]>(['Engineering & Technology']);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.emailVerified) return;
    let mounted = true;
    setLoadingPrefs(true);
    loadUserPreferences(user.uid)
      .then(prefs => {
        if (mounted && prefs) {
          setCurrentLevel(prefs.currentLevel);
          setPreferredState(prefs.preferredState);
          setEducationPreference(prefs.educationPreference);
          if (prefs.interests.length > 0) setInterests(prefs.interests);
          if (prefs.preferredSubjects.length > 0) setPreferredSubjects(prefs.preferredSubjects);
          if (prefs.careerGoals.length > 0) setCareerGoals(prefs.careerGoals);
          setReadNotificationIds(prefs.readNotificationIds || []);
        }
      })
      .catch(err => {
        console.error('Could not load saved user preferences:', err);
      })
      .finally(() => {
        if (mounted) setLoadingPrefs(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setSaveMessage(null);
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else if (list.length < 10) {
      setList([...list, item]);
    }
  };

  const handleSaveToFirestore = async () => {
    setSaveMessage(null);
    setSaveError(null);
    let activeUser = user;
    if (!activeUser) {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        activeUser = cred.user;
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.');
        return;
      }
    }
    if (!activeUser) return;

    setSavingPrefs(true);
    try {
      await saveUserPreferences(activeUser.uid, {
        currentLevel,
        interests,
        preferredSubjects,
        careerGoals,
        preferredState,
        educationPreference,
        readNotificationIds
      });
      setSaveMessage(t.plannerSavedSuccess);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleResetPlanner = () => {
    setCurrentLevel('class_10');
    setPreferredState('AP & TG');
    setEducationPreference('any');
    setInterests(['Software & Computing']);
    setPreferredSubjects(['Mathematics', 'Physics']);
    setCareerGoals(['Engineering & Technology']);
    setSaveMessage(null);
    setSaveError(null);
  };

  // Compute personalized recommendations
  const recommendedCourses = courses.filter(c => {
    if (currentLevel === 'class_10' && c.level !== 'after_10th') return false;
    if (currentLevel !== 'class_10' && c.level !== 'after_inter') return false;

    if (educationPreference === 'diploma_skill' && currentLevel === 'class_10') {
      return c.category.toLowerCase().includes('polytechnic') || c.title.toLowerCase().includes('iti');
    }

    const combinedText = `${c.title} ${c.description} ${c.subjects.join(' ')} ${c.careerOpportunities.join(' ')}`.toLowerCase();
    const matchesSubject = preferredSubjects.some(sub => {
      const keyword = sub.split(' ')[0].toLowerCase();
      return combinedText.includes(keyword);
    });
    const matchesInterest = interests.some(int => {
      const keyword = int.split(' ')[0].toLowerCase();
      return combinedText.includes(keyword);
    });
    return matchesSubject || matchesInterest || preferredSubjects.length === 0;
  });

  const displayCourses = recommendedCourses.length > 0 ? recommendedCourses : courses.slice(0, 4);

  const recommendedExams = exams.filter(ex => {
    const stateMatch =
      preferredState === 'All India' ||
      ex.state === 'All India' ||
      ex.state === 'AP & TG' ||
      (preferredState === 'AP & TG' && (ex.state === 'Andhra Pradesh' || ex.state === 'Telangana')) ||
      ex.state === preferredState;

    if (!stateMatch) return false;

    const courseExamMentions = displayCourses.flatMap(c => c.entranceExams).join(' ').toLowerCase();
    const examShortName = ex.name.split('(')[0].trim().toLowerCase();
    return courseExamMentions.includes(examShortName) || ex.state === preferredState;
  });

  const displayExams = recommendedExams.length > 0 ? recommendedExams : exams.slice(0, 5);

  const recommendedScholarships = scholarships.filter(sch => {
    return (
      sch.state === 'All India' ||
      sch.state === 'AP & TG' ||
      (preferredState === 'AP & TG' && (sch.state === 'Andhra Pradesh' || sch.state === 'Telangana')) ||
      sch.state === preferredState
    );
  });

  const recommendedCareers = careers.filter(car => {
    if (careerGoals.length === 0) return true;
    return careerGoals.some(goal => car.sector.toLowerCase().includes(goal.split(' ')[0].toLowerCase()));
  });

  const displayCareers = recommendedCareers.length > 0 ? recommendedCareers : careers.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-sky-700 mb-2">
            {lang === 'te' ? 'వ్యక్తిగత విద్యా & కెరీర్ ప్రణాళిక' : 'Interactive Educational Roadmap'}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {t.plannerHeading}
          </h1>
          <p className="mt-2 text-base text-slate-600 max-w-3xl">
            {t.plannerSubheading}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetPlanner}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t.clearFiltersBtn}
          </button>
          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={savingPrefs}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {user ? <Save className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
            {savingPrefs
              ? 'Saving...'
              : user
              ? t.plannerSaveBtn
              : t.plannerSignInToSaveBtn}
          </button>
        </div>
      </div>

      {loadingPrefs && (
        <div className="mb-6 p-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-600">
          Loading your saved Career Planner preferences from Cloud Firestore...
        </div>
      )}

      {saveMessage && (
        <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-sm text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {saveError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-sm text-red-900">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Two-Zone Sandbox Layout per Education Domain Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Control & Parameter Deck (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {t.plannerStep1}
            </label>
            <select
              value={currentLevel}
              onChange={e => setCurrentLevel(e.target.value as UserPreference['currentLevel'])}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              <option value="class_10">
                {lang === 'te' ? '10వ తరగతి (Class 10 / SSC) చదువుతున్నాను / పూర్తయింది' : 'Class 10 (SSC / CBSE / ICSE) Completed or Studying'}
              </option>
              <option value="inter_mpc">
                {lang === 'te' ? 'ఇంటర్మీడియట్ MPC (Mathematics, Physics, Chemistry)' : 'Intermediate (10+2) — MPC Stream'}
              </option>
              <option value="inter_bipc">
                {lang === 'te' ? 'ఇంటర్మీడియట్ BiPC (Biology, Physics, Chemistry)' : 'Intermediate (10+2) — BiPC Stream'}
              </option>
              <option value="inter_cec_mec">
                {lang === 'te' ? 'ఇంటర్మీడియట్ CEC / MEC / HEC (Commerce & Arts)' : 'Intermediate (10+2) — CEC / MEC / HEC Stream'}
              </option>
              <option value="diploma_iti">
                {lang === 'te' ? 'పాలిటెక్నిక్ డిప్లొమా / ITI' : 'Polytechnic Diploma / ITI Student'}
              </option>
              <option value="undergraduate">
                {lang === 'te' ? 'డిగ్రీ / బి.టెక్ (Undergraduate)' : 'Undergraduate Degree Student (Seeking PG / Careers)'}
              </option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                {t.plannerStep2}
              </label>
              <select
                value={preferredState}
                onChange={e => setPreferredState(e.target.value as StateScope)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="AP & TG">Both AP & Telangana</option>
                <option value="All India">All India (National)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                {t.plannerStep3}
              </label>
              <select
                value={educationPreference}
                onChange={e =>
                  setEducationPreference(e.target.value as UserPreference['educationPreference'])
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                <option value="any">All Recognized Formats</option>
                <option value="technical_professional">Professional (Engg / Med / Law)</option>
                <option value="degree_academic">Academic Degree & Honours</option>
                <option value="diploma_skill">Polytechnic Diploma & Skill ITI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {t.plannerStep4}
            </label>
            <p className="text-xs text-slate-500 mb-2.5">
              Select your preferred subjects:
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {SUBJECT_OPTIONS.map(sub => {
                const active = preferredSubjects.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleItem(preferredSubjects, setPreferredSubjects, sub)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 mb-2.5">
              Select your core interest areas:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INTEREST_OPTIONS.map(int => {
                const active = interests.includes(int);
                return (
                  <button
                    key={int}
                    type="button"
                    onClick={() => toggleItem(interests, setInterests, int)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {int}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              {t.plannerStep5}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_OPTIONS.map(goal => {
                const active = careerGoals.includes(goal);
                return (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleItem(careerGoals, setCareerGoals, goal)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {goal}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Stage: Personalized Step-by-Step Plan (7 Columns) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Disclaimer Banner */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-3">
            <Compass className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">
                {lang === 'te' ? 'మార్గదర్శక గమనిక: ' : 'Guidance Notice: '}
              </span>
              {t.plannerDisclaimer}
            </div>
          </div>

          {/* Step 1: Recommended Courses */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <p className="text-xs font-mono text-sky-700">STEP 01 · RECOMMENDED COURSES</p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {currentLevel === 'class_10'
                    ? lang === 'te'
                      ? '10వ తరగతి తర్వాత మీకు సరిపోయే కోర్సులు'
                      : 'Recommended Pathways After Class 10'
                    : lang === 'te'
                    ? 'ఇంటర్మీడియట్ తర్వాత మీకు సరిపోయే డిగ్రీ కోర్సులు'
                    : 'Recommended Degree & Professional Courses'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate(currentLevel === 'class_10' ? 'after-10th' : 'after-inter')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                {lang === 'te' ? 'అన్ని కోర్సులు' : 'Full Directory'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {displayCourses.map(course => (
                <div key={course.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span>{course.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{course.duration}</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.state}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'te' && course.titleTe ? course.titleTe : course.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {lang === 'te' && course.descriptionTe ? course.descriptionTe : course.description}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <span>
                      <strong className="text-slate-800">{t.lblEntranceExams}:</strong>{' '}
                      {course.entranceExams.join(', ')}
                    </span>
                    <a
                      href={course.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                    >
                      {course.officialSourceName}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step 2: Relevant Entrance Examinations */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <p className="text-xs font-mono text-sky-700">STEP 02 · ENTRANCE EXAMINATIONS</p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {lang === 'te' ? 'సంబంధిత ప్రవేశ పరీక్షలు & అధికారిక లింకులు' : 'Relevant Entrance Exams & Official Portals'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('exams')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                {lang === 'te' ? 'అన్ని పరీక్షలు' : 'All 18+ Exams'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {displayExams.map(exam => (
                <div key={exam.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span>{exam.state}</span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.examAuthority}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {t.lblLastVerified}: {exam.lastVerifiedDate}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'te' && exam.nameTe ? exam.nameTe : exam.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {lang === 'te' && exam.purposeTe ? exam.purposeTe : exam.purpose}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-700">
                      <strong>Schedule Status:</strong>{' '}
                      {exam.datesVerified ? exam.importantDates : t.lblExamDateNotVerified}
                    </span>
                    <a
                      href={exam.officialUrl}
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
          </section>

          {/* Step 3: Applicable Scholarships */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <p className="text-xs font-mono text-sky-700">STEP 03 · FINANCIAL SUPPORT & SCHOLARSHIPS</p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {lang === 'te' ? 'రాష్ట్ర & కేంద్ర ప్రభుత్వ స్కాలర్‌షిప్‌లు' : 'Relevant State & Central Scholarships'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('scholarships')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                {lang === 'te' ? 'అన్ని స్కాలర్‌షిప్‌లు' : 'Scholarship Explorer'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recommendedScholarships.map(sch => (
                <div key={sch.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span>{sch.state}</span>
                    <span aria-hidden="true">·</span>
                    <span>{sch.category}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'te' && sch.nameTe ? sch.nameTe : sch.name}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {lang === 'te' && sch.eligibilityTe ? sch.eligibilityTe : sch.eligibility}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{sch.sourceReference}</span>
                    <a
                      href={sch.officialUrl}
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
          </section>

          {/* Step 4: Long-Term Career Outcomes */}
          <section className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <p className="text-xs font-mono text-sky-700">STEP 04 · CAREER PATHWAYS</p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  {lang === 'te' ? 'భవిష్యత్తు కెరీర్ అవకాశాలు' : 'Aligned Career Destinations'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('careers')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                {lang === 'te' ? 'అన్ని కెరీర్లు' : 'Explore Careers'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {displayCareers.map(car => (
                <div key={car.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
                    <span>{car.sector}</span>
                    <span aria-hidden="true">·</span>
                    <span>{car.officialReference}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === 'te' && car.titleTe ? car.titleTe : car.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {lang === 'te' && car.descriptionTe ? car.descriptionTe : car.description}
                  </p>
                  <p className="text-xs text-slate-700 mt-2">
                    <strong>Required Education:</strong> {car.requiredEducation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
