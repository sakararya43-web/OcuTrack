import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { DisclaimerBanner } from './DisclaimerBanner';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <DisclaimerBanner />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>
            {APP_NAME} Prototype &bull; Protocol: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{PROTOCOL_VERSION}</code>
          </p>
          <p className="text-center sm:text-right">
            Not for direct diagnostic or emergency triage use. Clinical observation and review support only.
          </p>
        </div>
      </footer>
    </div>
  );
};
