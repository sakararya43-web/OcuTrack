import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { NewAssessmentPage } from './pages/NewAssessmentPage';
import { PupilTestPage } from './pages/PupilTestPage';
import { PursuitTestPage } from './pages/PursuitTestPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { AssessmentReportPage } from './pages/AssessmentReportPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/:patientId" element={<PatientDetailPage />} />
          <Route path="/assessments/new" element={<NewAssessmentPage />} />
          <Route path="/assessments/:assessmentId/pupil-test" element={<PupilTestPage />} />
          <Route path="/assessments/:assessmentId/pursuit-test" element={<PursuitTestPage />} />
          <Route path="/assessments/:assessmentId/processing" element={<ProcessingPage />} />
          <Route path="/assessments/:assessmentId/report" element={<AssessmentReportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
