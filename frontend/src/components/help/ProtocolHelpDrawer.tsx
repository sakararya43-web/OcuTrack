import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useHelpDrawer } from '../../context/HelpDrawerContext';
import { useTranslation } from '../../i18n';
import {
  CLINICAL_PROTOCOLS,
  TROUBLESHOOTING_ITEMS,
} from './protocolRegistry';

export const ProtocolHelpDrawer: React.FC = () => {
  const { isOpen, closeDrawer, activeSectionId } = useHelpDrawer();
  const { t } = useTranslation();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'protocols' | 'troubleshooting'>('all');
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({});
  const [expandedTroubleIds, setExpandedTroubleIds] = useState<Record<string, boolean>>({});

  // Determine current active protocol based on URL route
  const currentRouteProtocol = useMemo(() => {
    const matched = CLINICAL_PROTOCOLS.find((p) => p.routeMatch(location.pathname));
    return matched || CLINICAL_PROTOCOLS[1]; // fallback to dashboard
  }, [location.pathname]);

  // When drawer opens or route changes, expand the current route protocol automatically
  useEffect(() => {
    if (isOpen) {
      const targetId = activeSectionId || currentRouteProtocol.id;
      setExpandedSectionIds((prev) => ({
        ...prev,
        [targetId]: true,
      }));
    }
  }, [isOpen, activeSectionId, currentRouteProtocol.id]);

  const toggleSection = (id: string) => {
    setExpandedSectionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleTroubleshooting = (id: string) => {
    setExpandedTroubleIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter protocols and troubleshooting items based on searchQuery
  const filteredProtocols = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      // Put current route protocol at the top
      return [...CLINICAL_PROTOCOLS].sort((a, b) => {
        if (a.id === currentRouteProtocol.id) return -1;
        if (b.id === currentRouteProtocol.id) return 1;
        return 0;
      });
    }

    return CLINICAL_PROTOCOLS.filter((p) => {
      const inTitle = p.title.toLowerCase().includes(q);
      const inDesc = p.description.toLowerCase().includes(q);
      const inCategory = p.category.toLowerCase().includes(q);
      const inParams = p.parameters.some(
        (param) => param.label.toLowerCase().includes(q) || param.value.toLowerCase().includes(q)
      );
      const inChecklist = p.checklist.some((item) => item.toLowerCase().includes(q));
      return inTitle || inDesc || inCategory || inParams || inChecklist;
    });
  }, [searchQuery, currentRouteProtocol.id]);

  const filteredTroubleshooting = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return TROUBLESHOOTING_ITEMS;

    return TROUBLESHOOTING_ITEMS.filter((item) => {
      const inQ = item.question.toLowerCase().includes(q);
      const inCause = item.cause.toLowerCase().includes(q);
      const inRemedy = item.remedy.some((r) => r.toLowerCase().includes(q));
      const inTags = item.tags.some((tag) => tag.toLowerCase().includes(q));
      return inQ || inCause || inRemedy || inTags;
    });
  }, [searchQuery]);

  const showProtocols = activeTab === 'all' || activeTab === 'protocols';
  const showTroubleshooting = activeTab === 'all' || activeTab === 'troubleshooting';

  const totalResults =
    (showProtocols ? filteredProtocols.length : 0) +
    (showTroubleshooting ? filteredTroubleshooting.length : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="help-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 print:hidden"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.aside
            key="help-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-xl md:max-w-2xl bg-white border-l border-slate-300 shadow-2xl z-50 flex flex-col font-sans print:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={t('help.guideTitle')}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-950 text-white relative">
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400">
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <span className="font-bold text-sm tracking-tight font-mono text-white">
                      {t('help.guideTitle')}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-teal-400">
                      v0.1-CLINICAL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed pr-6">
                    {t('help.guideSubtitle')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
                    ESC
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label={t('help.closeDrawer')}
                    className="p-1.5 rounded border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Active Context Banner */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold uppercase text-[10px]">
                    {t('help.activeScreen')}
                  </span>
                  <span className="text-slate-200 font-semibold truncate max-w-[280px]">
                    {currentRouteProtocol.title}
                  </span>
                </div>
                <span className="text-slate-400 text-[10px] hidden sm:inline">
                  {location.pathname}
                </span>
              </div>
            </div>

            {/* Controls: Search & Tabs */}
            <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 space-y-3">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('help.searchPlaceholder')}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-teal-700 text-slate-900 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-sm border transition-colors ${
                    activeTab === 'all'
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t('help.filterAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('protocols')}
                  className={`px-2.5 py-1 rounded-sm border transition-colors ${
                    activeTab === 'protocols'
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t('help.filterProtocols')} ({filteredProtocols.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('troubleshooting')}
                  className={`px-2.5 py-1 rounded-sm border transition-colors ${
                    activeTab === 'troubleshooting'
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {t('help.filterTroubleshooting')} ({filteredTroubleshooting.length})
                </button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {totalResults === 0 ? (
                <div className="text-center py-12 px-4 rounded-md border border-slate-200 bg-slate-50 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
                  <h4 className="text-sm font-bold text-slate-900">{t('help.noResultsTitle')}</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {t('help.noResultsDesc')}
                  </p>
                </div>
              ) : (
                <>
                  {/* Protocol Sections */}
                  {showProtocols && filteredProtocols.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-600 border-b border-slate-200 pb-1.5">
                        <span className="font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                          Clinical Operating Protocols
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {filteredProtocols.length} standard specifications
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {filteredProtocols.map((protocol) => {
                          const isCurrentRoute = protocol.id === currentRouteProtocol.id;
                          const isExpanded = !!expandedSectionIds[protocol.id];

                          return (
                            <div
                              key={protocol.id}
                              id={protocol.id}
                              className={`rounded-md border transition-all ${
                                isCurrentRoute
                                  ? 'border-sky-600 bg-sky-50/20 shadow-xs'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              }`}
                            >
                              {/* Section Accordion Trigger */}
                              <button
                                type="button"
                                onClick={() => toggleSection(protocol.id)}
                                aria-expanded={isExpanded}
                                className="w-full text-left p-3.5 flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                              >
                                <div className="space-y-1 pr-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-700 uppercase font-semibold">
                                      {protocol.category}
                                    </span>
                                    {isCurrentRoute && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-900 font-bold">
                                        {t('help.activeContextBadge')}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                    {protocol.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                    {protocol.description}
                                  </p>
                                </div>
                                <div className="p-1 rounded text-slate-500 mt-1 flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-700" aria-hidden="true" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                                  )}
                                </div>
                              </button>

                              {/* Accordion Content */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-slate-200 px-3.5 pb-4 pt-3 space-y-3.5"
                                  >
                                    {/* Parameters Grid */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                                        {t('help.parametersHeader')}
                                      </span>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                        {protocol.parameters.map((param, idx) => (
                                          <div
                                            key={idx}
                                            className="p-2 rounded border border-slate-200 bg-slate-50/70"
                                          >
                                            <span className="text-[10px] font-mono text-slate-500 block">
                                              {param.label}
                                            </span>
                                            <span className="font-mono font-semibold text-slate-800 text-[11px]">
                                              {param.value}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Standard Operating Checklist */}
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                                        {t('help.checklistHeader')}
                                      </span>
                                      <ul className="space-y-1.5 text-xs text-slate-700">
                                        {protocol.checklist.map((item, idx) => (
                                          <li key={idx} className="flex items-start gap-2 leading-relaxed">
                                            <CheckCircle2
                                              className="w-3.5 h-3.5 text-teal-700 mt-0.5 flex-shrink-0"
                                              aria-hidden="true"
                                            />
                                            <span>{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>

                                    {/* Reference Standard Footnote */}
                                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                                      <span>Standard: {protocol.referenceStandard}</span>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Troubleshooting Section */}
                  {showTroubleshooting && filteredTroubleshooting.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-600 border-b border-slate-200 pb-1.5">
                        <span className="font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                          {t('help.troubleshootingHeader')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {filteredTroubleshooting.length} diagnostic topics
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {filteredTroubleshooting.map((item) => {
                          const isExpanded = !!expandedTroubleIds[item.id];

                          return (
                            <div
                              key={item.id}
                              className="rounded-md border border-slate-300 bg-white hover:border-slate-400 transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => toggleTroubleshooting(item.id)}
                                aria-expanded={isExpanded}
                                className="w-full text-left p-3.5 flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                              >
                                <div className="space-y-1 pr-2">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {item.tags.map((tag, tIdx) => (
                                      <span
                                        key={tIdx}
                                        className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                    {item.question}
                                  </h4>
                                </div>
                                <div className="p-1 rounded text-slate-500 mt-1 flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-slate-700" aria-hidden="true" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                                  )}
                                </div>
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden border-t border-slate-200 px-3.5 pb-4 pt-3 space-y-3"
                                  >
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                                        Underlying Cause
                                      </span>
                                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                                        {item.cause}
                                      </p>
                                    </div>

                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                                        Remediation Steps
                                      </span>
                                      <ul className="space-y-1.5 text-xs text-slate-700">
                                        {item.remedy.map((step, sIdx) => (
                                          <li key={sIdx} className="flex items-start gap-2 leading-relaxed">
                                            <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-100 rounded px-1 mt-0.5">
                                              0{sIdx + 1}
                                            </span>
                                            <span>{step}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Notice */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-100 text-slate-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-800 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-[11px] leading-relaxed text-slate-600">
                  {t('help.nonDiagnosticNote')}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Keyboard shortcut: Shift + ?</span>
                <span>OcuTrack v0.1 Instrumentation</span>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
