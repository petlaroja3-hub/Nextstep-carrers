import type { Language } from '../types';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    brandName: 'NextStep Careers',
    navHome: 'Home',
    navAfter10th: 'After 10th',
    navAfterInter: 'After Inter',
    navExams: 'Entrance Exams',
    navColleges: 'Colleges',
    navScholarships: 'Scholarships',
    navCareers: 'Careers',
    navPlanner: 'Career Planner',
    navUpdates: 'Official Updates',
    navNotifications: 'Notifications',
    navAbout: 'About Us',
    navContact: 'Contact Us',
    navAdminLogin: 'Admin Login',
    navAdminDashboard: 'Admin Console',
    navAuditReport: 'System Audit & Setup',

    heroKicker: 'Andhra Pradesh · Telangana · All India',
    heroTitle: 'Verified Educational & Career Pathways from Class 10 to Graduation',
    heroSubtitle:
      'Explore recognized courses after Class 10 and Intermediate, state and national entrance examinations, government scholarships, college directories, and official notifications.',
    heroSearchPlaceholder: 'Search courses (MPC, B.Tech, MBBS), exams (EAPCET, JEE, NEET), scholarships, or careers...',
    heroSearchBtn: 'Search Directory',
    heroPlannerBtn: 'Open My Next Step Planner',
    heroExplore10thBtn: 'Explore After 10th',
    heroExploreInterBtn: 'Explore After Intermediate',

    langSwitchLabel: 'తెలుగు',
    langCurrentNotice: 'Interface Language: English',
    translationNotice:
      'Note: Official portal titles and statutory government links are preserved in their original form for accuracy.',

    filterStateLabel: 'State / Scope',
    filterCategoryLabel: 'Category',
    filterLevelLabel: 'Level',
    filterDistrictLabel: 'District',
    filterTypeLabel: 'Institution Type',
    filterAll: 'All',
    clearFiltersBtn: 'Reset Filters',
    searchPlaceholder: 'Filter by keyword, subject, exam, or authority...',
    resultsCountLabel: 'Showing matching records',
    emptySearchTitle: 'No matching educational records found',
    emptySearchSubtitle: 'Try clearing your search query or resetting the active category and state filters.',

    lblDuration: 'Duration',
    lblEligibility: 'General Eligibility',
    lblSubjects: 'Core Subjects',
    lblStudyPathways: 'Available Study Pathways',
    lblCareerOpportunities: 'Potential Career Opportunities',
    lblFurtherEducation: 'Further Study Options',
    lblEntranceExams: 'Relevant Entrance Examinations',
    lblAdmissionProcess: 'Admission Process',
    lblOfficialSource: 'Official Reference Source',
    lblVisitOfficialPortal: 'Visit Official Website',
    lblLastVerified: 'Last Verified',
    lblSampleDataNotice: 'Sample Reference Record — Verify on Official Portal',
    lblInstitutionDisclaimer:
      'General eligibility is shown for guidance. Institution-specific cutoffs, reservation rules, and subject combinations vary by university and state admission authority.',
    lblExamDateNotVerified: 'Official date not verified.',
    lblExamDatesVerified: 'Official Schedule Verified',
    lblScholarshipDisclaimer:
      'Important: Meeting general eligibility criteria does not guarantee scholarship sanction. Final disbursement is governed by state/central government budgetary norms and biometric/document verification.',
    lblCareerDisclaimer:
      'Guidance Note: Career pathways describe educational prerequisites and industry sectors without promising specific employment or salary outcomes.',

    secExploreAfter10th: 'Pathways After Class 10 (SSC)',
    secExploreAfter10thDesc:
      'Intermediate streams (MPC, BiPC, CEC, MEC, HEC), 3-Year Polytechnic Diplomas, ITI trades, and vocational programs.',
    secExploreAfterInter: 'Pathways After Intermediate (10+2)',
    secExploreAfterInterDesc:
      'Undergraduate degrees across Engineering (B.Tech), Medicine (MBBS/BDS), Pure Sciences, Commerce, Law, Agriculture, Pharmacy, and Design.',
    secUpcomingExams: 'State & National Entrance Examinations',
    secScholarships: 'Government & Merit Scholarships',
    secLatestUpdates: 'Verified Official Announcements',
    secCareerGuidance: 'Career Exploration Directory',

    plannerHeading: 'My Next Step Career Planner',
    plannerSubheading:
      'Select your current academic stage, subject strengths, and regional preference to generate a personalized step-by-step educational roadmap.',
    plannerStep1: '1. Current Education Level',
    plannerStep2: '2. Preferred State / Region',
    plannerStep3: '3. Study Format Preference',
    plannerStep4: '4. Interests & Subject Strengths',
    plannerStep5: '5. Target Career Sectors',
    plannerGenerateBtn: 'Update My Career Plan',
    plannerSaveBtn: 'Save Preferences to My Account',
    plannerSignInToSaveBtn: 'Sign In with Google to Save Preferences',
    plannerSavedSuccess: 'Your career planner preferences have been saved securely to Cloud Firestore.',
    plannerDisclaimer:
      'Disclaimer: These recommendations are structured academic guidance based on your selections and do not constitute guaranteed admission or employment outcomes.',

    updatesHeading: 'Official Education & Examination Updates',
    updatesSubheading:
      'Announcements tracked from recognized government departments, examination authorities (APSCHE, TGCHE, NTA), and scholarship portals.',
    statusVerified: 'VERIFIED OFFICIAL SOURCE',
    statusUnverified: 'UNVERIFIED / MANUAL REVIEW',
    statusCheckFailed: 'SOURCE CHECK FAILED',

    notificationsHeading: 'In-Site Verified Notifications',
    notificationsSubheading:
      'Important alerts for entrance exams, scholarship windows, course admissions, and official announcements.',
    markAsReadBtn: 'Mark as Read',
    markedReadLabel: 'Read',

    adminLoginHeading: 'Administrator Authentication',
    adminLoginSubheading:
      'Sign in with an authorized administrator account to manage courses, exams, colleges, scholarships, official sources, and live verification logs.',
    adminSignInGoogleBtn: 'Sign In with Google (Recommended)',
    adminSignInEmailBtn: 'Sign In with Email & Password',
    adminResetPasswordBtn: 'Send Password Reset Email',
    adminLogoutBtn: 'Sign Out',
    adminUnauthorizedError:
      'Access Restricted: Your account is signed in but is not registered in the authorized adminRoles directory.',

    btnViewDetails: 'View Full Details',
    btnCloseDetails: 'Close Details',
    btnBackToList: 'Back to Directory'
  },
  te: {
    brandName: 'నెక్స్ట్‌స్టెప్ కెరీర్స్ (NextStep Careers)',
    navHome: 'హోమ్',
    navAfter10th: '10వ తరగతి తర్వాత',
    navAfterInter: 'ఇంటర్ తర్వాత',
    navExams: 'ప్రవేశ పరీక్షలు',
    navColleges: 'కళాశాలలు',
    navScholarships: 'స్కాలర్‌షిప్‌లు',
    navCareers: 'కెరీర్ అవకాశాలు',
    navPlanner: 'కెరీర్ ప్లానర్',
    navUpdates: 'అధికారిక అప్‌డేట్స్',
    navNotifications: 'నోటిఫికేషన్లు',
    navAbout: 'మా గురించి',
    navContact: 'సంప్రదించండి',
    navAdminLogin: 'అడ్మిన్ లాగిన్',
    navAdminDashboard: 'అడ్మిన్ డాష్‌బోర్డ్',
    navAuditReport: 'సిస్టమ్ ఆడిట్ & సెటప్',

    heroKicker: 'ఆంధ్రప్రదేశ్ · తెలంగాణ · ఆల్ ఇండియా',
    heroTitle: '10వ తరగతి నుండి గ్రాడ్యుయేషన్ వరకు ధృవీకరించబడిన విద్య మరియు కెరీర్ మార్గదర్శిని',
    heroSubtitle:
      '10వ తరగతి మరియు ఇంటర్మీడియట్ తర్వాత గుర్తింపు పొందిన కోర్సులు, రాష్ట్ర మరియు జాతీయ ప్రవేశ పరీక్షలు, ప్రభుత్వ స్కాలర్‌షిప్‌లు, కళాశాలల వివరాలు మరియు అధికారిక ప్రకటనలను అన్వేషించండి.',
    heroSearchPlaceholder: 'కోర్సులు (MPC, B.Tech, MBBS), పరీక్షలు (EAPCET, JEE, NEET), స్కాలర్‌షిప్‌లు వెతకండి...',
    heroSearchBtn: 'వెతకండి',
    heroPlannerBtn: 'నా కెరీర్ ప్లానర్ తెరవండి',
    heroExplore10thBtn: '10వ తరగతి తర్వాత కోర్సులు',
    heroExploreInterBtn: 'ఇంటర్ తర్వాత కోర్సులు',

    langSwitchLabel: 'English',
    langCurrentNotice: 'భాష: తెలుగు (Telugu)',
    translationNotice:
      'గమనిక: ఖచ్చితత్వం కోసం అధికారిక పోర్టల్ పేర్లు మరియు ప్రభుత్వ వెబ్‌సైట్ లింకులు వాటి అసలు రూపంలోనే ఉంచబడ్డాయి.',

    filterStateLabel: 'రాష్ట్రం / పరిధి',
    filterCategoryLabel: 'విభాగం',
    filterLevelLabel: 'స్థాయి',
    filterDistrictLabel: 'జిల్లా',
    filterTypeLabel: 'సంస్థ రకం',
    filterAll: 'అన్నీ (All)',
    clearFiltersBtn: 'ఫిల్టర్లు రీసెట్ చేయండి',
    searchPlaceholder: 'కోర్సు, సబ్జెక్టు లేదా పరీక్ష పేరుతో వెతకండి...',
    resultsCountLabel: 'ఫలితాలు చూపబడుతున్నాయి',
    emptySearchTitle: 'సరిపోయే విద్యా సమాచారం కనుగొనబడలేదు',
    emptySearchSubtitle: 'దయచేసి మీ సెర్చ్ పదాన్ని మార్చండి లేదా ఫిల్టర్లను రీసెట్ చేయండి.',

    lblDuration: 'కాలపరిమితి (Duration)',
    lblEligibility: 'సాధారణ అర్హత (Eligibility)',
    lblSubjects: 'ప్రధాన సబ్జెక్టులు',
    lblStudyPathways: 'అందుబాటులో ఉన్న విద్యా మార్గాలు',
    lblCareerOpportunities: 'కెరీర్ అవకాశాలు',
    lblFurtherEducation: 'ఉన్నత విద్యా అవకాశాలు',
    lblEntranceExams: 'సంబంధిత ప్రవేశ పరీక్షలు',
    lblAdmissionProcess: 'ప్రవేశ ప్రక్రియ (Admission Process)',
    lblOfficialSource: 'అధికారిక సమాచార మూలం',
    lblVisitOfficialPortal: 'అధికారిక వెబ్‌సైట్ తెరవండి',
    lblLastVerified: 'చివరిగా ధృవీకరించిన తేదీ',
    lblSampleDataNotice: 'నమూనా సమాచారం (Sample Reference) — అధికారిక పోర్టల్‌లో తనిఖీ చేయండి',
    lblInstitutionDisclaimer:
      'సాధారణ అర్హత సమాచారం మార్గదర్శకత్వం కోసం మాత్రమే ఇవ్వబడింది. నిర్దిష్ట కళాశాలల నిబంధనలు సంబంధిత విశ్వవిద్యాలయం మరియు ప్రభుత్వ ప్రవేశ కమిటీల ఆధారంగా మారవచ్చు.',
    lblExamDateNotVerified: 'అధికారిక తేదీ ఇంకా ధృవీకరించబడలేదు (Official date not verified).',
    lblExamDatesVerified: 'అధికారిక తేదీలు ధృవీకరించబడ్డాయి',
    lblScholarshipDisclaimer:
      'ముఖ్య గమనిక: అర్హత కలిగి ఉండటం వల్ల స్కాలర్‌షిప్ ఖచ్చితంగా వస్తుందనే హామీ లేదు. ప్రభుత్వ నిబంధనలు మరియు ధృవపత్రాల పరిశీలన ఆధారంగా మంజూరు చేయబడుతుంది.',
    lblCareerDisclaimer:
      'గమనిక: కెరీర్ సమాచారం విద్యా అవసరాలు మరియు నైపుణ్యాలను వివరిస్తుంది. ఇది ఉద్యోగ లేదా జీత భత్యాల హామీ కాదు.',

    secExploreAfter10th: '10వ తరగతి (SSC) తర్వాత విద్యా మార్గాలు',
    secExploreAfter10thDesc:
      'ఇంటర్మీడియట్ గ్రూపులు (MPC, BiPC, CEC, MEC, HEC), పాలిటెక్నిక్ డిప్లొమా, ITI ట్రేడ్‌లు మరియు ఒకేషనల్ కోర్సులు.',
    secExploreAfterInter: 'ఇంటర్మీడియట్ (10+2) తర్వాత డిగ్రీ & ప్రొఫెషనల్ కోర్సులు',
    secExploreAfterInterDesc:
      'ఇంజనీరింగ్ (B.Tech), మెడిసిన్ (MBBS/BDS), B.Sc, B.Com, BBA, BCA, BA, లా (Law), ఫార్మసీ, అగ్రికల్చర్ మరియు డిజైన్ కోర్సులు.',
    secUpcomingExams: 'రాష్ట్ర మరియు జాతీయ ప్రవేశ పరీక్షలు',
    secScholarships: 'ప్రభుత్వ మరియు మెరిట్ స్కాలర్‌షిప్‌లు',
    secLatestUpdates: 'ధృవీకరించబడిన అధికారిక ప్రకటనలు',
    secCareerGuidance: 'కెరీర్ అవకాశాల డైరెక్టరీ',

    plannerHeading: 'మై నెక్స్ట్ స్టెప్ (My Next Step) కెరీర్ ప్లానర్',
    plannerSubheading:
      'మీ ప్రస్తుత విద్యా స్థాయి, ఆసక్తులు మరియు రాష్ట్రాన్ని ఎంచుకుని మీకు సరిపోయే కోర్సులు మరియు ప్రవేశ పరీక్షల ప్రణాళికను పొందండి.',
    plannerStep1: '1. ప్రస్తుత విద్యా స్థాయి',
    plannerStep2: '2. ప్రాధాన్యత గల రాష్ట్రం',
    plannerStep3: '3. విద్యా విధానం ప్రాధాన్యత',
    plannerStep4: '4. ఆసక్తులు & ఇష్టమైన సబ్జెక్టులు',
    plannerStep5: '5. కెరీర్ లక్ష్యాలు',
    plannerGenerateBtn: 'కెరీర్ ప్లాన్ రూపొందించండి',
    plannerSaveBtn: 'నా ప్రాధాన్యతలను సేవ్ చేయండి',
    plannerSignInToSaveBtn: 'సేవ్ చేయడానికి Google తో సైన్ ఇన్ చేయండి',
    plannerSavedSuccess: 'మీ కెరీర్ ప్లానర్ ప్రాధాన్యతలు క్లౌడ్ ఫైర్‌స్టోర్‌లో సురక్షితంగా సేవ్ చేయబడ్డాయి.',
    plannerDisclaimer:
      'గమనిక: ఈ సూచనలు మార్గదర్శకత్వం కోసం మాత్రమే. ప్రవేశాలు లేదా ఉద్యోగాలకు ఇవి హామీ కాదు.',

    updatesHeading: 'అధికారిక విద్యా మరియు పరీక్షల అప్‌డేట్స్',
    updatesSubheading:
      'ప్రభుత్వ విద్యా శాఖలు, పరీక్షా బోర్డులు (APSCHE, TGCHE, NTA) మరియు స్కాలర్‌షిప్ పోర్టల్స్ నుండి సేకరించిన సమాచారం.',
    statusVerified: 'ధృవీకరించబడిన అధికారిక మూలం',
    statusUnverified: 'ధృవీకరించబడలేదు / పరిశీలనలో ఉంది',
    statusCheckFailed: 'వెబ్‌సైట్ తనిఖీ విఫలమైంది',

    notificationsHeading: 'ధృవీకరించబడిన నోటిఫికేషన్లు',
    notificationsSubheading:
      'ప్రవేశ పరీక్షలు, స్కాలర్‌షిప్ తేదీలు మరియు కోర్సు ప్రవేశాలకు సంబంధించిన ముఖ్య సమాచారం.',
    markAsReadBtn: 'చదివినట్లు గుర్తించు',
    markedReadLabel: 'చదివారు',

    adminLoginHeading: 'అడ్మినిస్ట్రేటర్ లాగిన్',
    adminLoginSubheading:
      'కోర్సులు, పరీక్షలు, కళాశాలలు, స్కాలర్‌షిప్‌లు మరియు అధికారిక వెబ్‌సైట్లను నిర్వహించడానికి అడ్మిన్ ఖాతాతో సైన్ ఇన్ చేయండి.',
    adminSignInGoogleBtn: 'Google ఖాతాతో సైన్ ఇన్ చేయండి',
    adminSignInEmailBtn: 'ఇమెయిల్ & పాస్‌వర్డ్‌తో సైన్ ఇన్ చేయండి',
    adminResetPasswordBtn: 'పాస్‌వర్డ్ రీసెట్ ఇమెయిల్ పంపండి',
    adminLogoutBtn: 'సైన్ అవుట్',
    adminUnauthorizedError:
      'అనుమతి లేదు: మీ ఖాతాకు అడ్మినిస్ట్రేటర్ అధికారాలు లేవు.',

    btnViewDetails: 'పూర్తి వివరాలు చూడండి',
    btnCloseDetails: 'మూసివేయండి',
    btnBackToList: 'జాబితాకు తిరిగి వెళ్ళండి'
  }
};
