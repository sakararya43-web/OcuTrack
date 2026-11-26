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
import { ReportsDirectoryPage } from '../pages/ReportsDirectoryPage';
import { AboutLimitationsPage } from '../pages/AboutLimitationsPage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { TermsConditionsPage } from '../pages/TermsConditionsPage';
import { RequireAuth } from '../components/auth/RequireAuth';

export interface AppRoute {
  path: string;
  element: React.ReactNode;
}

const protect = (node: React.ReactNode): React.ReactNode => <RequireAuth>{node}</RequireAuth>;

export const CONSOLE_ROUTES: AppRoute[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/clinic-overview', element: protect(<ClinicOverviewPage />) },
  { path: '/overview', element: protect(<ClinicOverviewPage />) },
  { path: '/console', element: protect(<DashboardPage />) },
  { path: '/dashboard', element: protect(<DashboardPage />) },
  { path: '/patients', element: protect(<PatientsPage />) },
  { path: '/patients/:patientId', element: protect(<PatientDetailPage />) },
  { path: '/reports', element: protect(<ReportsDirectoryPage />) },
  { path: '/assessments/new', element: protect(<NewAssessmentPage />) },
  { path: '/assessments/:assessmentId/pupil-test', element: protect(<PupilTestPage />) },
  { path: '/assessments/:assessmentId/pursuit-test', element: protect(<PursuitTestPage />) },
  { path: '/assessments/:assessmentId/processing', element: protect(<ProcessingPage />) },
  { path: '/assessments/:assessmentId/report', element: protect(<AssessmentReportPage />) },
  { path: '/about', element: <AboutLimitationsPage /> },
  { path: '/limitations', element: <AboutLimitationsPage /> },
  { path: '/privacy', element: <PrivacyPolicyPage /> },
  { path: '/terms', element: <TermsConditionsPage /> },
];
