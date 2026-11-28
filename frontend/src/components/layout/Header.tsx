import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  RefreshCw,
  Command,
  BookOpen,
  User,
} from 'lucide-react';
import { checkBackendHealth } from '../../services/healthService';
import { APP_NAME, PROTOCOL_VERSION } from '../../lib/constants';
import { soundFx } from '../../lib/soundFx';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useHelpDrawer } from '../../context/HelpDrawerContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n';

interface MegaMenuSection {
  title: string;
  items: { label: string; href: string; desc?: string; badge?: string }[];
}

export const Header: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [activeMenu, setActiveMenu] = useState<'protocols' | 'biomarkers' | 'science' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { openDrawer } = useHelpDrawer();
  const { user, isAuthenticated } = useAuth();
  const { t, dict } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        await checkBackendHealth();
        if (isMounted) setBackendStatus('connected');
      } catch {
        if (isMounted) setBackendStatus('disconnected');
      }
    };
    check();
    const interval = setInterval(check, 35000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut Cmd+K or / for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        soundFx.playClick();
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
        soundFx.playClick();
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleMouseEnter = (menuKey: 'protocols' | 'biomarkers' | 'science') => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMenu(menuKey);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 200);
  };

  const megaMenuData: Record<string, { title: string; subtitle: string; columns: MegaMenuSection[]; featured: { title: string; desc: string; link: string; linkText: string; tag: string } }> = {
    protocols: {
      title: dict.header.megaMenu.protocols.title,
      subtitle: dict.header.megaMenu.protocols.subtitle,
      columns: [
        {
          title: dict.header.megaMenu.protocols.col1Title,
          items: dict.header.megaMenu.protocols.col1Items,
        },
        {
          title: dict.header.megaMenu.protocols.col2Title,
          items: dict.header.megaMenu.protocols.col2Items,
        },
      ],
      featured: dict.header.megaMenu.protocols.featured,
    },
    biomarkers: {
      title: dict.header.megaMenu.biomarkers.title,
      subtitle: dict.header.megaMenu.biomarkers.subtitle,
      columns: [
        {
          title: dict.header.megaMenu.biomarkers.col1Title,
          items: dict.header.megaMenu.biomarkers.col1Items,
        },
        {
          title: dict.header.megaMenu.biomarkers.col2Title,
          items: dict.header.megaMenu.biomarkers.col2Items,
        },
      ],
      featured: dict.header.megaMenu.biomarkers.featured,
    },
    science: {
      title: dict.header.megaMenu.science.title,
      subtitle: dict.header.megaMenu.science.subtitle,
      columns: [
        {
          title: dict.header.megaMenu.science.col1Title,
          items: dict.header.megaMenu.science.col1Items,
        },
        {
          title: dict.header.megaMenu.science.col2Title,
          items: dict.header.megaMenu.science.col2Items,
        },
      ],
      featured: dict.header.megaMenu.science.featured,
    },
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      soundFx.playClick();
      setSearchOpen(false);
      navigate(`/patients?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8FAFC]/95 backdrop-blur-md text-[#0F172A] border-b border-[#E2E8F0] transition-colors">
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2 flex-nowrap">

          {/* Left: Understated OcuTrack Branding & Navigation */}
          <div className="flex items-center gap-2 xl:gap-3 min-[1680px]:gap-5 shrink-0">
            <Link
              to="/"
              onClick={() => soundFx.playClick()}
              className="flex items-center gap-1.5 group shrink-0"
            >
              {/* Minimal Geometric Reticle Icon */}
              <div className="w-6 h-6 rounded-md bg-[#0F172A] text-[#F8FAFC] flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                <span className="text-[#0F766E]"></span>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="font-sans text-sm sm:text-base font-semibold tracking-tight text-[#0F172A]">
                  {APP_NAME}
                </span>
                <span className="hidden 2xl:inline font-mono text-[8.5px] uppercase tracking-wider px-1 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                  {PROTOCOL_VERSION}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 min-[1680px]:gap-3.5 text-[10.5px] xl:text-[11px] min-[1680px]:text-[12px] uppercase tracking-[0.01em] min-[1680px]:tracking-[0.03em] font-medium text-[#475569] shrink-0 whitespace-nowrap">
              <div
                className="relative py-5 cursor-pointer shrink-0"
                onMouseEnter={() => handleMouseEnter('protocols')}
                onMouseLeave={handleMouseLeave}
              >
                <span className={`inline-flex items-center gap-0.5 xl:gap-1 transition-colors ${activeMenu === 'protocols' ? 'text-[#0F172A]' : 'hover:text-[#0F172A]'}`}>
                  {t('nav.protocol', 'PROTOCOL')}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeMenu === 'protocols' ? 'rotate-180 text-[#0F172A]' : 'text-[#64748B]'}`} />
                </span>
              </div>

              <div
                className="relative py-5 cursor-pointer shrink-0"
                onMouseEnter={() => handleMouseEnter('biomarkers')}
                onMouseLeave={handleMouseLeave}
              >
                <span className={`inline-flex items-center gap-0.5 xl:gap-1 transition-colors ${activeMenu === 'biomarkers' ? 'text-[#0F172A]' : 'hover:text-[#0F172A]'}`}>
                  {t('nav.biomarkers', 'Biomarkers')}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeMenu === 'biomarkers' ? 'rotate-180 text-[#0F172A]' : 'text-[#64748B]'}`} />
                </span>
              </div>

              <div
                className="relative py-5 cursor-pointer shrink-0"
                onMouseEnter={() => handleMouseEnter('science')}
                onMouseLeave={handleMouseLeave}
              >
                <span className={`inline-flex items-center gap-0.5 xl:gap-1 transition-colors ${activeMenu === 'science' ? 'text-[#0F172A]' : 'hover:text-[#0F172A]'}`}>
                  {t('nav.theScience', 'The Science')}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeMenu === 'science' ? 'rotate-180 text-[#0F172A]' : 'text-[#64748B]'}`} />
                </span>
              </div>

              <a
                href="/#story-chronicle"
                onClick={() => soundFx.playClick()}
                className="py-5 transition-colors hover:text-[#0F172A] shrink-0"
              >
                {t('nav.story', 'STORY')}
              </a>

              <a
                href="/#ocular-3d-lab"
                onClick={() => soundFx.playClick()}
                className="py-5 transition-colors hover:text-[#0F172A] text-[#0F766E] font-semibold shrink-0"
              >
                {t('nav.globe3D', '3D GLOBE')}
              </a>

              <NavLink
                to="/console"
                onClick={() => soundFx.playClick()}
                className={({ isActive }) => `py-5 transition-colors shrink-0 ${isActive ? 'text-[#0F172A] font-semibold border-b-2 border-[#0F172A]' : 'hover:text-[#0F172A]'}`}
              >
                {t('nav.console', 'CONSOLE')}
              </NavLink>

              <NavLink
                to="/patients"
                onClick={() => soundFx.playClick()}
                className={({ isActive }) => `py-5 transition-colors shrink-0 ${isActive ? 'text-[#0F172A] font-semibold border-b-2 border-[#0F172A]' : 'hover:text-[#0F172A]'}`}
              >
                {t('nav.cohorts', 'COHORTS')}
              </NavLink>

              <NavLink
                to="/reports"
                onClick={() => soundFx.playClick()}
                className={({ isActive }) => `py-5 transition-colors shrink-0 ${isActive ? 'text-[#0F172A] font-semibold border-b-2 border-[#0F172A]' : 'hover:text-[#0F172A]'}`}
              >
                {t('nav.reports', 'REPORTS')}
              </NavLink>

              <NavLink
                to="/clinic-overview"
                onClick={() => soundFx.playClick()}
                className={({ isActive }) => `py-5 transition-colors shrink-0 ${isActive ? 'text-[#0F172A] font-semibold border-b-2 border-[#0F172A]' : 'hover:text-[#0F172A]'}`}
              >
                {t('nav.overview', 'OVERVIEW')}
              </NavLink>
            </nav>
          </div>

          {/* Right: Search, Language, Guide, Auth, API Status & CTA */}
          <div className="flex items-center gap-1 xl:gap-1.5 min-[1680px]:gap-2 shrink-0">

            {/* Language Switcher */}
            <LanguageSwitcher className="hidden xl:inline-flex shrink-0" />

            {/* Protocol Help Guide Trigger (Non-LLM Assistant) */}
            <button
              onClick={() => {
                soundFx.playClick();
                openDrawer();
              }}
              title={t('nav.openProtocolGuide')}
              aria-label={t('nav.openProtocolGuideAria')}
              className="inline-flex items-center gap-1 px-1.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] text-[11px] text-[#475569] hover:text-[#0F172A] transition-colors bg-white shadow-xs font-mono shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#0F766E]" />
              <span className="hidden min-[1400px]:inline text-[11px] font-medium">{t('nav.guide', 'Guide')}</span>
              <kbd className="hidden sm:inline-flex items-center px-1 text-[9px] bg-[#F1F5F9] border border-[#E2E8F0] rounded text-[#64748B]">?</kbd>
            </button>

            {/* Staff Authentication Portal */}
            <Link
              to="/login"
              onClick={() => soundFx.playClick()}
              title={isAuthenticated && user ? t('nav.loggedInAs', { name: user.name }) : t('nav.staffPortalLogin')}
              className="inline-flex items-center gap-1 px-1.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] text-[11px] font-medium text-[#475569] hover:text-[#0F172A] transition-colors bg-white shadow-xs shrink-0"
            >
              <User className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden min-[1400px]:inline">
                {isAuthenticated && user
                  ? (user.name.startsWith('Dr.') ? user.name.split(' ')[1] || 'Doctor' : user.name.split(' ')[0])
                  : t('nav.staff', 'Staff')}
              </span>
            </Link>

            {/* Quick Command Search Trigger */}
            <button
              onClick={() => {
                soundFx.playClick();
                setSearchOpen(true);
              }}
              title={t('nav.searchPatientRecords')}
              aria-label={t('nav.searchPatientRecordsAria')}
              className="hidden lg:flex items-center gap-1 px-1.5 py-1.5 rounded-md border border-[#E2E8F0] hover:border-[#CBD5E1] text-[11px] text-[#475569] hover:text-[#0F172A] transition-colors bg-white shadow-xs shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="font-sans text-[11px] hidden min-[1640px]:inline">{t('nav.search', 'Search')}</span>
              <kbd className="hidden 2xl:inline-flex items-center gap-0.5 px-1 py-0.2 text-[9.5px] font-mono text-[#64748B] bg-[#F1F5F9] border border-[#E2E8F0] rounded">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            {/* API Health Beacon */}
            <div
              title={t('nav.backendTelemetryHealth')}
              className="hidden xl:flex items-center gap-1 font-mono text-[10px] px-1.5 py-1.5 rounded-md bg-white border border-[#E2E8F0] shrink-0"
            >
              <span className="text-[10px] uppercase text-[#64748B]">{t('nav.api')}</span>
              {backendStatus === 'connected' && (
                <span className="text-[#0F766E] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                  <span className="hidden 2xl:inline">{t('nav.apiConnected', 'ONLINE')}</span>
                </span>
              )}
              {backendStatus === 'checking' && (
                <span className="text-[#B45309] font-medium flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span className="hidden 2xl:inline">{t('nav.apiChecking', 'SYNC')}</span>
                </span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="text-[#B91C1C] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
                  <span className="hidden 2xl:inline">{t('nav.apiOffline', 'OFFLINE')}</span>
                </span>
              )}
            </div>

            {/* Ramp-Style Primary CTA Button */}
            <Link
              to="/assessments/new"
              onClick={() => soundFx.playClick()}
              className="btn-ramp-primary hidden sm:inline-flex text-[11px] py-1.5 px-2.5 min-[1680px]:px-3 shrink-0 whitespace-nowrap"
            >
              <span>{t('nav.initiateTrial', 'Initiate Trial')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                soundFx.playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
              aria-label={t('nav.toggleMobileMenu')}
              className="lg:hidden p-1.5 text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Ramp Editorial Mega Menu Dropdown */}
      {activeMenu && megaMenuData[activeMenu] && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-[#E2E8F0] shadow-ramp-dropdown transition-all duration-200 z-50 animate-fade-in"
          onMouseEnter={() => {
            if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12 py-8">
            <div className="grid grid-cols-12 gap-8">

              {/* Context Summary Header */}
              <div className="col-span-3 border-r border-[#E2E8F0] pr-6 space-y-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#475569] block font-semibold">
                  {megaMenuData[activeMenu].title}
                </span>
                <h3 className="font-serif text-2xl font-normal leading-snug text-[#0F172A]">
                  {t('header.clinicalObservation')} <span className="italic text-[#475569]">{t('header.reflex')}</span>
                </h3>
                <p className="text-xs leading-relaxed text-[#475569] font-normal">
                  {megaMenuData[activeMenu].subtitle}
                </p>
                <div className="pt-2">
                  <Link
                    to="/about"
                    onClick={() => {
                      soundFx.playClick();
                      setActiveMenu(null);
                    }}
                    className="link-editorial text-xs font-semibold"
                  >
                    <span>{t('header.readFullMethodology')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Main Content Columns */}
              <div className="col-span-6 grid grid-cols-2 gap-8 px-4">
                {megaMenuData[activeMenu].columns.map((column, colIdx) => (
                  <div key={colIdx} className="space-y-3">
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#64748B] font-semibold border-b border-[#E2E8F0] pb-1.5">
                      {column.title}
                    </h4>
                    <div className="space-y-2">
                      {column.items.map((item, itemIdx) => (
                        <Link
                          key={itemIdx}
                          to={item.href}
                          onClick={() => {
                            soundFx.playClick();
                            setActiveMenu(null);
                          }}
                          className="group block p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#0F172A] group-hover:text-black transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="inline-flex px-1.5 py-0.2 text-[9px] font-mono font-medium rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <p className="text-[11px] text-[#475569] leading-relaxed line-clamp-2 mt-0.5">
                              {item.desc}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Featured Monograph Column */}
              <div className="col-span-3 bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] space-y-2.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#64748B] block font-semibold">
                  {megaMenuData[activeMenu].featured.tag}
                </span>
                <h4 className="font-sans text-base font-semibold text-[#0F172A] leading-snug">
                  {megaMenuData[activeMenu].featured.title}
                </h4>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {megaMenuData[activeMenu].featured.desc}
                </p>
                <div className="pt-1">
                  <Link
                    to={megaMenuData[activeMenu].featured.link}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveMenu(null);
                    }}
                    className="link-editorial text-xs font-semibold"
                  >
                    <span>{megaMenuData[activeMenu].featured.linkText}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Command Palette Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-xl w-full p-5 shadow-ramp-dropdown space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#475569]" />
                <h3 className="font-sans text-sm font-semibold text-[#0F172A]">{t('header.searchModalTitle')}</h3>
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder={t('header.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3.5 py-2.5 text-xs text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#0F172A] font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#0F172A] hover:bg-[#27282D] text-white text-[11px] font-medium rounded-md transition-colors"
                >
                  {t('header.searchButton')}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between text-xs text-[#64748B] font-mono pt-1">
              <span>{t('header.searchQuick')}</span>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  navigate('/patients');
                }}
                className="text-[#0F172A] hover:underline font-medium"
              >
                {t('header.browseAllCohorts')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-[#E2E8F0] px-6 py-5 space-y-4 shadow-lg">
          <div className="space-y-2.5 font-sans text-sm font-medium">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.overviewExperience')}
            </Link>
            <Link
              to="/console"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.clinicalConsole')}
            </Link>
            <Link
              to="/patients"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.cohortRegistry')}
            </Link>
            <Link
              to="/reports"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.reportsDirectory')}
            </Link>
            <Link
              to="/clinic-overview"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.clinicOverviewTracker')}
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.staffPortal')}
            </Link>
            <Link
              to="/assessments/new"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.initiateNewTrial')}
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-[#0F172A] hover:text-[#475569]"
            >
              {t('nav.methodologyScope')}
            </Link>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openDrawer();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#0F766E] font-medium border border-[#E2E8F0] rounded-md bg-white"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('nav.protocolGuide')}</span>
              </button>
            </div>
            <Link
              to="/assessments/new"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-ramp-primary w-full justify-center text-xs py-2"
            >
              {t('nav.startClinicalTrial')}
            </Link>
            <div className="text-center font-mono text-[10px] text-[#64748B]">
              {t('nav.investigationalDevice')}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
