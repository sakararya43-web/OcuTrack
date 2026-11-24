import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, Scale, Info } from 'lucide-react';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';
import { useTranslation } from '../../i18n';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

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
              <span>{APP_NAME} {t('footer.prototypeTitle')}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('footer.prototypeDesc')}
            </p>
            <p className="text-xs text-slate-500">
              {t('footer.activeProtocol')}{' '}
              <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-800">
                {PROTOCOL_VERSION}
              </code>
            </p>
          </div>

          {/* Legal & Governance Links */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
              {t('footer.governanceLegal')}
            </h2>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link
                  to="/privacy"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  {t('footer.termsConditions')}
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <Info className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  {t('footer.aboutOcutrack')}
                </Link>
              </li>
              <li>
                <Link
                  to="/limitations"
                  className="inline-flex items-center gap-1.5 text-sky-800 hover:text-sky-900 hover:underline font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  {t('footer.systemBoundaries')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Clinical Boundary Notice */}
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900 font-mono">
              {t('footer.clinicalScopeNotice')}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t('footer.clinicalScopeDesc')}
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
          <p>{t('footer.allRightsReserved')}</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-slate-900 hover:underline">
              {t('nav.about')}
            </Link>
            <Link to="/limitations" className="hover:text-slate-900 hover:underline">
              {t('nav.limitations')}
            </Link>
            <Link to="/privacy" className="hover:text-slate-900 hover:underline">
              {t('footer.privacyPolicy')}
            </Link>
            <Link to="/terms" className="hover:text-slate-900 hover:underline">
              {t('footer.termsConditions')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
