import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppLayout } from './components/layout/AppLayout';
import { renderAppRoutes } from './routes';

export const App: React.FC = () => {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route element={<AppLayout />}>
            {renderAppRoutes()}
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
};

export default App;
