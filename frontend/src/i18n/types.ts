export type SupportedLanguage = 'en' | 'hi' | 'es' | 'fr';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'EN', nativeName: 'English' },
  { code: 'hi', label: 'HI', nativeName: 'हिन्दी' },
  { code: 'es', label: 'ES', nativeName: 'Español' },
  { code: 'fr', label: 'FR', nativeName: 'Français' },
];

export interface TranslationDictionary {
  common: {
    appName: string;
    appTagline: string;
    protocolVersion: string;
    disclaimer: string;
    loading: string;
    retry: string;
    actions: string;
    status: string;
    back: string;
    next: string;
    cancel: string;
    save: string;
    unspecified: string;
    demoMode: string;
  };
  nav: {
    dashboard: string;
    patients: string;
    newAssessment: string;
    clinicOverview: string;
    about: string;
    limitations: string;
    startAssessment: string;
    api: string;
    apiChecking: string;
    apiConnected: string;
    apiOffline: string;
    refreshApi: string;
  };
  dashboard: {
    heroTitle: string;
    heroDescription: string;
    newPatient: string;
    initiateAssessment: string;
    allPatients: string;
    registeredRecords: string;
    pseudonymousProfiles: string;
    recordedAssessments: string;
    completedSessions: string;
    flaggedForReview: string;
    reviewFlagsDesc: string;
    recentHeading: string;
    viewFullRegistry: string;
    thPseudonymousId: string;
    thAgeBand: string;
    thConsent: string;
    thLastAssessment: string;
    thQuality: string;
    thActions: string;
    btnProfile: string;
    btnNewTest: string;
    noRecordsFound: string;
    noRecordsDesc: string;
    addFirstPatient: string;
  };
  testPupil: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    warning: string;
    startCapture: string;
    recording: string;
    processing: string;
  };
  testPursuit: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    warning: string;
    startCapture: string;
    recording: string;
    processing: string;
  };
  review: {
    qualityAcceptable: string;
    qualityInsufficient: string;
    noNotableChange: string;
    changeDetected: string;
    experimentalOutput: string;
    comparisonUnavailable: string;
  };
  footer: {
    prototypeTitle: string;
    prototypeDesc: string;
    activeProtocol: string;
    governanceLegal: string;
    privacyPolicy: string;
    termsConditions: string;
    aboutOcutrack: string;
    systemBoundaries: string;
    clinicalScopeNotice: string;
    clinicalScopeDesc: string;
    allRightsReserved: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    staffId: string;
    password: string;
    role: string;
    ward: string;
    signIn: string;
    judgeFastTrack: string;
    signOut: string;
    communityWorker: string;
    clinician: string;
  };
}
