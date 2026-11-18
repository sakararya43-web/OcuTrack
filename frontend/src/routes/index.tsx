import React from 'react';
import { Route, Navigate } from 'react-router-dom';
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

export const APP_ROUTES: AppRoute[] = [
  { path: '/', element: <DashboardPage /> },
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

export const renderAppRoutes = () => (
  <>
    {APP_ROUTES.map((route) => (
      <Route key={route.path} path={route.path} element={route.element} />
    ))}
    <Route path="*" element={<Navigate to="/" replace />} />
  </>
);
