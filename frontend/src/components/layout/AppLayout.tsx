import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { DisclaimerBanner } from './DisclaimerBanner';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-3 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-md focus:text-xs"
      >
        Skip to main content
      </a>
      <DisclaimerBanner />
      <Header />
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
