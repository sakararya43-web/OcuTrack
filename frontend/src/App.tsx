import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import { AuthProvider } from './context/AuthContext';
import { HelpDrawerProvider } from './context/HelpDrawerContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtocolHelpDrawer } from './components/help/ProtocolHelpDrawer';
import { LandingPage } from './pages/LandingPage';
import { CONSOLE_ROUTES } from './routes';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HelpDrawerProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <ProtocolHelpDrawer />
            <Routes>
              {/* Refined Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Clinical Research Cockpit (Console) Routes */}
              <Route element={<AppLayout />}>
                {CONSOLE_ROUTES.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Route>

              {/* Fallback to Landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HelpDrawerProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
