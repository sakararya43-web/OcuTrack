import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Scale, Info } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';

export const Footer: React.FC = () => {
  return (
    <footer
      aria-label="Site footer"
      className="bg-white border-t border-slate-200 mt-auto print:hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-slate-200">
          {/* Prototype Identification */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <span>{APP_NAME} Clinical Screening-Support Prototype</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Browser-based quantitative ocular measurement and personal-baseline monitoring for
              trained healthcare worker review.
            </p>
            <p className="text-xs text-slate-500">
              Active Protocol:{' '}
              <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">
                {PROTOCOL_VERSION}
              </code>
            </p>
          </div>

          {/* Legal & Governance Links */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Governance &amp; Legal
            </h2>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  Methodology &amp; System Limitations
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Boundary Notice */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Clinical Scope Notice
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Not a certified medical device. Not intended for independent diagnosis, treatment
              decisions, or emergency triage. Measurements support repeat testing and clinician
              review only.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>{APP_NAME} Prototype. Pseudonymous research records only.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-slate-900 hover:underline">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-900 hover:underline">
              Terms and Conditions
            </Link>
            <Link to="/about" className="hover:text-slate-900 hover:underline">
              Limitations
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
