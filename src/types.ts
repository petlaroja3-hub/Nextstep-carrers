export type Language = 'en' | 'te';

export type PageId =
  | 'home'
  | 'after-10th'
  | 'after-inter'
  | 'exams'
  | 'colleges'
  | 'scholarships'
  | 'careers'
  | 'planner'
  | 'updates'
  | 'notifications'
  | 'about'
  | 'contact'
  | 'admin-login'
  | 'admin-dashboard'
  | 'audit-report';

export type StateScope = 'Andhra Pradesh' | 'Telangana' | 'All India' | 'AP & TG';

export interface Course {
  id: string;
  title: string;
  titleTe: string;
  level: 'after_10th' | 'after_inter';
  category: string;
  duration: string;
  eligibility: string;
  eligibilityTe: string;
  description: string;
  descriptionTe: string;
  subjects: string[];
  studyPathways: string[];
  careerOpportunities: string[];
  furtherEducation: string[];
  entranceExams: string[];
  admissionProcess: string;
  officialSourceName: string;
  officialUrl: string;
  state: StateScope;
  published: boolean;
  isSampleData: boolean;
  lastVerifiedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CourseCategory {
  id: string;
  name: string;
  nameTe: string;
  level: 'after_10th' | 'after_inter' | 'both';
  description: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EntranceExam {
  id: string;
  name: string;
  nameTe: string;
  category: string;
  state: StateScope;
  purpose: string;
  purposeTe: string;
  eligibility: string;
  examAuthority: string;
  applicationInfo: string;
  importantDates: string;
  datesVerified: boolean;
  officialUrl: string;
  targetCourses: string[];
  published: boolean;
  lastVerifiedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface College {
  id: string;
  name: string;
  nameTe: string;
  state: 'Andhra Pradesh' | 'Telangana' | 'All India';
  district: string;
  location: string;
  institutionType: 'Central Institute' | 'State University' | 'Government College' | 'Private/Deemed';
  availableCourses: string[];
  admissionProcess: string;
  entranceExams: string[];
  officialUrl: string;
  sourceReference: string;
  isSampleRecord: boolean;
  published: boolean;
  lastVerifiedDate: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Scholarship {
  id: string;
  name: string;
  nameTe: string;
  state: StateScope;
  educationLevel: string;
  category: string;
  eligibility: string;
  eligibilityTe: string;
  benefits: string;
  applicationPeriod: string;
  requiredDocuments: string[];
  officialUrl: string;
  sourceReference: string;
  published: boolean;
  lastVerifiedDate: string;
  createdAt?: unknown;
}

export interface Career {
  id: string;
  title: string;
  titleTe: string;
  sector: string;
  description: string;
  descriptionTe: string;
  requiredEducation: string;
  skills: string[];
  industries: string[];
  furtherStudy: string[];
  relatedCourses: string[];
  relatedExams: string[];
  officialReference: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CareerUpdate {
  id: string;
  title: string;
  titleTe: string;
  description: string;
  descriptionTe: string;
  category: 'Exam' | 'Scholarship' | 'Admission' | 'Course' | 'General';
  state: StateScope;
  sourceName: string;
  officialUrl: string;
  publicationDate: string;
  dateChecked: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED' | 'CHECK_FAILED';
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface OfficialSource {
  id: string;
  name: string;
  category: string;
  state: StateScope;
  officialUrl: string;
  lastChecked: string;
  lastStatus: 'VERIFIED_REACHABLE' | 'UNVERIFIED' | 'CHECK_FAILED';
  lastHttpCode: number;
  lastDetectedTitle: string;
  lastError: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface VerificationLog {
  id: string;
  sourceId: string;
  sourceName: string;
  officialUrl: string;
  status: 'VERIFIED_REACHABLE' | 'CHECK_FAILED';
  httpCode: number;
  detectedTitle: string;
  errorMessage: string;
  checkedByUid: string;
  createdAt?: unknown;
}

export interface NotificationItem {
  id: string;
  title: string;
  titleTe: string;
  message: string;
  messageTe: string;
  category: 'Exam' | 'Scholarship' | 'Course' | 'Deadline' | 'Announcement';
  state: StateScope;
  sourceReference: string;
  officialUrl: string;
  dateLabel: string;
  published: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPreference {
  userId: string;
  currentLevel: 'class_10' | 'inter_mpc' | 'inter_bipc' | 'inter_cec_mec' | 'diploma_iti' | 'undergraduate';
  interests: string[];
  preferredSubjects: string[];
  careerGoals: string[];
  preferredState: StateScope;
  educationPreference: 'degree_academic' | 'technical_professional' | 'diploma_skill' | 'any';
  readNotificationIds: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AdminRole {
  uid: string;
  email: string;
  role: 'admin' | 'super_admin';
  createdAt?: unknown;
}
