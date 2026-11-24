import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Eye,
  Activity,
  Layers,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ArrowUp,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

export const JudgeFloatingHUD: React.FC = () => {
  const { t } = useTranslation();
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.round((currentScroll / totalScroll) * 100)));
      }
      setIsVisible(currentScroll > 280);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isVisible) return null;

  return (
    <motion.aside
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      aria-label={t('hud.ariaLabel')}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[92%] sm:w-auto shadow-xl"
    >
      <div className="bg-[#0F172A]/95 backdrop-blur-xl border border-slate-700/60 rounded-md p-2 px-3 sm:px-4 text-white flex items-center justify-between gap-3 sm:gap-4 font-mono text-xs">

        {/* Scroll Progress Ring & Chapter Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={scrollToTop}
            title={t('hud.backToTop')}
            className="relative w-7 h-7 flex items-center justify-center group rounded-sm hover:bg-white/10 transition-colors"
          >
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-white/15"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[#0D9488] transition-all duration-150"
                strokeDasharray={`${scrollProgress}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[9px] font-bold text-[#0D9488] group-hover:hidden">
              {scrollProgress}%
            </span>
            <ArrowUp className="w-3 h-3 text-[#0D9488] absolute hidden group-hover:block" />
          </button>

          <span className="hidden md:inline font-semibold text-[11px] text-slate-300">
            {t('hud.navigation')}
          </span>
        </div>

        {/* Navigation Quick Buttons (Rectangular, Subtle Radius) */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar"
            >
              <button
                onClick={() => scrollTo('story-chronicle')}
                className="px-2.5 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap text-[11px]"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>{t('hud.story')}</span>
              </button>

              <button
                onClick={() => scrollTo('ocular-3d-lab')}
                className="px-2.5 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap text-[11px]"
              >
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>{t('hud.globe3d')}</span>
              </button>

              <button
                onClick={() => scrollTo('clinical-simulator')}
                className="px-2.5 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap text-[11px]"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('hud.simulator')}</span>
              </button>

              <button
                onClick={() => scrollTo('technical-architecture')}
                className="px-2.5 py-1 rounded hover:bg-white/10 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap text-[11px] hidden sm:flex"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('hud.architecture')}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Action: Direct Test Link */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? t('hud.expandAria') : t('hud.collapseAria')}
            className="p-1.5 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            title={isCollapsed ? t('hud.expand') : t('hud.collapse')}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Link
            to="/assessments/new"
            className="bg-[#0F766E] hover:bg-[#115E59] text-white font-medium px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>{t('hud.liveTest')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </motion.aside>
  );
};

export default JudgeFloatingHUD;
