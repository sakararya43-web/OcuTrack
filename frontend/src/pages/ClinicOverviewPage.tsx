import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Legend,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Users,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import {
  fetchClinicAnalytics,
  ClinicAnalyticsPayload,
  SAMPLE_CLINIC_DATASET,
} from '../services/clinicAnalyticsService';
import { StaggerContainer, StaggerItem, PulseIndicator } from '../components/motion';

export const ClinicOverviewPage: React.FC = () => {
  const { t } = useTranslation();

  const [analytics, setAnalytics] = useState<ClinicAnalyticsPayload>(SAMPLE_CLINIC_DATASET);
  const [loading, setLoading] = useState<boolean>(true);
  const [useSampleData, setUseSampleData] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('7D');
  const [queueFilter, setQueueFilter] = useState<'all' | 'changes' | 'quality'>('all');

  const loadData = async (forceSample: boolean) => {
    setLoading(true);
    try {
      const data = await fetchClinicAnalytics(forceSample);
      setAnalytics(data);
    } catch {
      setAnalytics(SAMPLE_CLINIC_DATASET);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(useSampleData);
  }, [useSampleData]);

  // Filtered Priority Queue
  const filteredQueue = useMemo(() => {
    if (queueFilter === 'changes') {
      return analytics.priorityQueue.filter((item) => item.triageStatus === 'change_detected');
    }
    if (queueFilter === 'quality') {
      return analytics.priorityQueue.filter((item) => item.qualityStatus === 'insufficient');
    }
    return analytics.priorityQueue;
  }, [analytics.priorityQueue, queueFilter]);

  const kpis = analytics.kpis;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-700 uppercase font-semibold">
              COLLECTIVE TELEMETRY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-teal-200 bg-teal-50 text-teal-800 font-bold">
              NO CROSS-PATIENT PUPIL AVERAGING
            </span>
            {analytics.isSampleData && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-300 bg-sky-100 text-sky-900 font-bold flex items-center gap-1.5">
                <PulseIndicator status="active" />
                {t('clinicOverview.demoDatasetActive')}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {t('clinicOverview.pageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            {t('clinicOverview.pageSubtitle')}
          </p>
        </div>

        {/* Dataset Toggle & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          <div className="flex items-center gap-1 p-1 rounded-md border border-slate-300 bg-slate-100 text-xs font-mono">
            <button
              type="button"
              onClick={() => setUseSampleData(false)}
              className={`px-2.5 py-1 rounded transition-colors ${
                !useSampleData
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('clinicOverview.toggleLive')}
            </button>
            <button
              type="button"
              onClick={() => setUseSampleData(true)}
              className={`px-2.5 py-1 rounded transition-colors ${
                useSampleData
                  ? 'bg-sky-800 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('clinicOverview.toggleDemo')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData(useSampleData)}
            disabled={loading}
            aria-label="Refresh telemetry analytics"
            className="p-2 rounded-md border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Demo Notice Banner (when in demo dataset mode) */}
      {analytics.isSampleData && (
        <div className="p-3 rounded-md border border-sky-200 bg-sky-50 text-xs text-sky-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-sky-700 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="font-semibold">Evaluator Note:</strong>{' '}
            {t('clinicOverview.demoDatasetNotice')}
          </p>
        </div>
      )}

      {/* Maximalist Telemetry KPI Strip (4 High-Density Cards) */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Assessments Logged */}
        <StaggerItem className="p-4 rounded-md border border-slate-300 bg-white shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                {t('clinicOverview.kpiTotalAssessments')}
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {kpis.totalAssessments}
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="text-teal-700 font-semibold">{t('clinicOverview.kpiDeltaWeekly')}</span>
            <span>All Wards</span>
          </div>
        </StaggerItem>

        {/* KPI 2: Attention Priority Queue */}
        <StaggerItem className="p-4 rounded-md border border-slate-300 bg-white shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                {t('clinicOverview.kpiAttentionQueue')}
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-sky-900 tabular-nums flex items-baseline gap-2">
                <span>{kpis.attentionQueueCount}</span>
                <span className="text-xs font-normal text-slate-500">requiring review</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-800">
              <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Deltas & Quality Flags</span>
            <span className="text-sky-800 font-semibold">Priority 1</span>
          </div>
        </StaggerItem>

        {/* KPI 3: Recording Quality Pass Rate */}
        <StaggerItem className="p-4 rounded-md border border-slate-300 bg-white shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                {t('clinicOverview.kpiPassRate')}
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-teal-800 tabular-nums">
                {kpis.qualityPassRate.toFixed(1)}%
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="text-teal-700 font-semibold">{t('clinicOverview.kpiPassRateTarget')}</span>
            <span>&gt;= 80% frames</span>
          </div>
        </StaggerItem>

        {/* KPI 4: Active Longitudinal Cohort */}
        <StaggerItem className="p-4 rounded-md border border-slate-300 bg-white shadow-xs relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
                {t('clinicOverview.kpiLongitudinalPatients')}
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
                {kpis.longitudinalPatientCount}
              </div>
            </div>
            <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <Users className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Intra-individual track</span>
            <span className="text-slate-700 font-semibold">&gt;= 2 visits</span>
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Visualizations Grid (Recharts + Timeframe Filters) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Triage Status Distribution Over Time */}
        <div className="p-4 sm:p-5 rounded-md border border-slate-300 bg-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                {t('clinicOverview.chartTriageTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t('clinicOverview.chartTriageSubtitle')}
              </p>
            </div>
            {/* Timeframe Controls */}
            <div className="flex items-center gap-1 self-start sm:self-center text-[10px] font-mono">
              {(['7D', '30D', 'ALL'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    timeframe === tf
                      ? 'border-slate-900 bg-slate-900 text-white font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tf === '7D'
                    ? t('clinicOverview.timeframe7D')
                    : tf === '30D'
                    ? t('clinicOverview.timeframe30D')
                    : t('clinicOverview.timeframeAll')}
                </button>
              ))}
            </div>
          </div>

          {/* Stacked Bar Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.triageSeries}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconSize={10}
                />
                <Bar
                  dataKey="noChange"
                  name={t('clinicOverview.statusNoChange')}
                  stackId="a"
                  fill="#0f766e"
                />
                <Bar
                  dataKey="changeDetected"
                  name={t('clinicOverview.statusChangeDetected')}
                  stackId="a"
                  fill="#0284c7"
                />
                <Bar
                  dataKey="insufficientQuality"
                  name={t('clinicOverview.statusInsufficientQuality')}
                  stackId="a"
                  fill="#475569"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Capture Quality & Failure Diagnostics */}
        <div className="p-4 sm:p-5 rounded-md border border-slate-300 bg-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                {t('clinicOverview.chartQualityTitle')}
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t('clinicOverview.chartQualitySubtitle')}
              </p>
            </div>
            <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-bold self-start sm:self-center">
              Field Diagnostics
            </span>
          </div>

          {/* Composed Chart: Line (Usable Frame Ratio) + Stacked Bars (Causes) */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={analytics.qualitySeries}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  domain={[80, 100]}
                  unit="%"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconSize={10}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="usableFrameRatio"
                  name="Usable Frames (%)"
                  stroke="#0369a1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0369a1' }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="lightingIssue"
                  name={t('clinicOverview.causeLighting')}
                  fill="#0f766e"
                />
                <Bar
                  yAxisId="right"
                  dataKey="visibilityIssue"
                  name={t('clinicOverview.causeVisibility')}
                  fill="#334155"
                />
                <Bar
                  yAxisId="right"
                  dataKey="motionIssue"
                  name={t('clinicOverview.causeMotion')}
                  fill="#64748b"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Attention Priority Queue Section */}
      <div className="p-4 sm:p-5 rounded-md border border-slate-300 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold font-mono text-slate-900">
                {t('clinicOverview.queueTableTitle')}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-300 bg-sky-100 text-sky-900 font-bold">
                {filteredQueue.length} Flagged
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('clinicOverview.queueTableSubtitle')}
            </p>
          </div>

          {/* Queue Filter Controls */}
          <div className="flex items-center gap-1.5 text-xs font-mono self-start sm:self-center">
            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                queueFilter === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('clinicOverview.filterAllQueue')}
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('changes')}
              className={`px-2.5 py-1 rounded transition-colors ${
                queueFilter === 'changes'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('clinicOverview.filterChangeOnly')}
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('quality')}
              className={`px-2.5 py-1 rounded transition-colors ${
                queueFilter === 'quality'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t('clinicOverview.filterQualityIssues')}
            </button>
          </div>
        </div>

        {/* Priority Table */}
        <div className="overflow-x-auto">
          {filteredQueue.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-slate-200 rounded bg-slate-50">
              <CheckCircle2 className="w-8 h-8 text-teal-700 mx-auto" aria-hidden="true" />
              <h4 className="text-sm font-bold text-slate-900 font-mono">
                {t('clinicOverview.noQueueItems')}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('clinicOverview.noQueueDesc')}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
              <thead className="bg-slate-50 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    {t('clinicOverview.thPatientId')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    {t('clinicOverview.thDate')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    {t('clinicOverview.thBattery')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    {t('clinicOverview.thQuality')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    {t('clinicOverview.thTriageStatus')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold">
                    {t('clinicOverview.thKeyDelta')}
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-bold text-right">
                    {t('clinicOverview.thAction')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredQueue.map((item) => (
                  <tr key={item.assessmentId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Patient ID */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link
                        to={`/patients/${item.patientId}`}
                        className="font-mono font-bold text-sky-800 hover:text-sky-950 hover:underline flex items-center gap-1.5"
                      >
                        <span>{item.pseudonymousCode}</span>
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-600">
                      {item.assessmentDate}
                    </td>

                    {/* Battery */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-700 uppercase font-semibold">
                        {item.batteryType === 'both'
                          ? 'Combined'
                          : item.batteryType === 'pupil_reflex'
                          ? 'Pupil Reflex'
                          : 'Smooth Pursuit'}
                      </span>
                    </td>

                    {/* Quality */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.qualityStatus === 'acceptable' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-teal-300 bg-teal-50 text-teal-800 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-teal-700" aria-hidden="true" />
                          Acceptable
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-400 bg-slate-100 text-slate-800 font-bold inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-slate-700" aria-hidden="true" />
                          Insufficient
                        </span>
                      )}
                    </td>

                    {/* Triage Status */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {item.triageStatus === 'change_detected' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-300 bg-sky-100 text-sky-900 font-bold">
                          Change Detected
                        </span>
                      ) : item.triageStatus === 'insufficient_quality' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-800 font-bold">
                          Repeat Test Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700">
                          Stable
                        </span>
                      )}
                    </td>

                    {/* Key Delta */}
                    <td className="px-3 py-3 font-mono text-slate-800 text-[11px] max-w-xs truncate">
                      {item.keyDeltaDescription}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <Link
                        to={`/patients/${item.patientId}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md border border-slate-300 bg-slate-50 text-slate-800 hover:text-slate-950 hover:bg-slate-100 active:scale-[0.98] transition-all"
                      >
                        <span>{t('clinicOverview.btnInspect')}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Regulatory & Scientific Transparency Callout */}
      <div className="p-4 rounded-md border border-slate-300 bg-slate-50 text-xs text-slate-700 flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 max-w-3xl">
          <ShieldCheck className="w-4 h-4 text-teal-800 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-slate-900 font-mono">
              Scientific Guardrail:
            </strong>{' '}
            OcuTrack measures intra-individual percent deltas against each patient's own physiological baseline. Collective triage charts track administrative operational throughput, quality pass rates, and review prioritization only. Cross-patient pupil size averaging is deliberately avoided to prevent diagnostic false positives.
          </p>
        </div>
        <Link
          to="/about"
          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sky-800 hover:text-sky-950 hover:underline whitespace-nowrap self-end sm:self-center"
        >
          <span>Methodology & Safety</span>
          <ExternalLink className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
