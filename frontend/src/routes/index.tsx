import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PatientsPage } from '../pages/PatientsPage';
import { PatientDetailPage } from '../pages/PatientDetailPage';
import { NewAssessmentPage } from '../pages/NewAssessmentPage';
import { PupilTestPage } from '../pages/PupilTestPage';
import { PursuitTestPage } from '../pages/PursuitTestPage';
import { ProcessingPage } from '../pages/ProcessingPage';
import { AssessmentReportPage } from '../pages/AssessmentReportPage';
import { AboutPage } from '../pages/AboutPage';
import { AboutLimitationsPage } from '../pages/AboutLimitationsPage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage';
import { TermsConditionsPage } from '../pages/TermsConditionsPage';
import { ClinicOverviewPage } from '../pages/ClinicOverviewPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export interface AppRoute {
  path: string;
  element: React.ReactNode;
}

export const APP_ROUTES: AppRoute[] = [
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/clinic-overview',
    element: (
      <ProtectedRoute>
        <ClinicOverviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/patients',
    element: (
      <ProtectedRoute>
        <PatientsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/patients/:patientId',
    element: (
      <ProtectedRoute>
        <PatientDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assessments/new',
    element: (
      <ProtectedRoute>
        <NewAssessmentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assessments/:assessmentId/pupil-test',
    element: (
      <ProtectedRoute>
        <PupilTestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assessments/:assessmentId/pursuit-test',
    element: (
      <ProtectedRoute>
        <PursuitTestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assessments/:assessmentId/processing',
    element: (
      <ProtectedRoute>
        <ProcessingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/assessments/:assessmentId/report',
    element: (
      <ProtectedRoute>
        <AssessmentReportPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pupil-test',
    element: (
      <ProtectedRoute>
        <PupilTestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/pursuit-test',
    element: (
      <ProtectedRoute>
        <PursuitTestPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/processing/:assessmentId',
    element: (
      <ProtectedRoute>
        <ProcessingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports/:assessmentId',
    element: (
      <ProtectedRoute>
        <AssessmentReportPage />
      </ProtectedRoute>
    ),
  },
  { path: '/about', element: <AboutPage /> },
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
