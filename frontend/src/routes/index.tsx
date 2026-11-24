import React from 'react';
import { LoginPage } from '../pages/LoginPage';
import { ClinicOverviewPage } from '../pages/ClinicOverviewPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PatientsPage } from '../pages/PatientsPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';
import { NewAssessmentPage } from '../pages/NewAssessmentPage';
import { PupilTestPage } from '../pages/PupilTestPage';
import { PursuitTestPage } from '../pages/PursuitTestPage';
import { ProcessingPage } from '../pages/ProcessingPage';
import { AssessmentReportPage } from '../pages/AssessmentReportPage';
import { AboutLimitationsPage } from '../pages/AboutLimitationsPage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { TermsConditionsPage } from '../pages/TermsConditionsPage';

export interface AppRoute {
  path: string;
  element: React.ReactNode;
}

export const CONSOLE_ROUTES: AppRoute[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/clinic-overview', element: <ClinicOverviewPage /> },
  { path: '/overview', element: <ClinicOverviewPage /> },
  { path: '/console', element: <DashboardPage /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/patients', element: <PatientsPage /> },
  { path: '/patients/:patientId', element: <PatientDetailPage /> },
  { path: '/assessments/new', element: <NewAssessmentPage /> },
  { path: '/assessments/:assessmentId/pupil-test', element: <PupilTestPage /> },
  { path: '/assessments/:assessmentId/pursuit-test', element: <PursuitTestPage /> },
  { path: '/assessments/:assessmentId/processing', element: <ProcessingPage /> },
  { path: '/assessments/:assessmentId/report', element: <AssessmentReportPage /> },
  { path: '/about', element: <AboutLimitationsPage /> },
  { path: '/limitations', element: <AboutLimitationsPage /> },
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '/terms', element: <TermsConditionsPage /> },
];
