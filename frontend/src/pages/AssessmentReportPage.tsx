import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Calendar,
  User,
  ShieldAlert,
  ArrowLeft,
  Cpu,
  Crosshair,
  Printer,
  Eye,
  Activity,
  AlertTriangle,
  RotateCcw,
  ClipboardCheck,
  Stethoscope,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Video,
  Play,
  Loader2,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { getAssessment, triggerAnalysis } from '../services/assessmentService';
import { getPatients, getPatientHistory } from '../services/patientService';
import { AssessmentDetail, AssessmentSummary, Patient } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { PupilCurveChart } from '../components/charts/PupilCurveChart';
import { SmoothPursuitChart } from '../components/charts/SmoothPursuitChart';
import { BaselineComparisonView } from '../components/charts/BaselineComparisonView';
import { SequenceDynamicsSection } from '../components/charts/SequenceDynamicsSection';
import { buildPatientSituationSummary, interpretMetric, Tone } from '../lib/clinicalSummary';
import { formatDate } from '../lib/formatters';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';
import { useTranslation } from '../i18n';

type GuidanceKey =
  | 'repeatQuality'
  | 'clinicalReview'
  | 'standardizeRetest'
  | 'baselineEstablished'
  | 'routineMonitoring';

function resolvePatientGuidanceKey(
  assessment: AssessmentDetail,
  isInsufficientQuality: boolean
): GuidanceKey {
  if (isInsufficientQuality) {
    return 'repeatQuality';
  }
  const comp = assessment.longitudinal_comparison;
  if (comp?.status === 'not_comparable') {
    return 'standardizeRetest';
  }
  const hasDeltaShift = Object.values(comp?.feature_deltas || {}).some(
    (d) => d.direction === 'increased' || d.direction === 'decreased'
  );
  const reviewMessage = (assessment.review_message || '').trim();
  const hasReviewChange = /^change detected\b/i.test(reviewMessage);
  if (hasDeltaShift || hasReviewChange) {
    return 'clinicalReview';
  }
  if (!comp || comp.status === 'not_available') {
    return 'baselineEstablished';
  }
  return 'routineMonitoring';
}

const GUIDANCE_THEME: Record<
  GuidanceKey,
  {
    containerClass: string;
    iconBoxClass: string;
    badgeClass: string;
    stepNumClass: string;
    ctaClass: string;
    Icon: React.FC<{ className?: string }>;
    primaryTarget: 'repeat' | 'patient';
    showSecondaryPatientLink: boolean;
  }
> = {
  repeatQuality: {
    containerClass:
      'border-2 border-[#DC2626] bg-gradient-to-br from-[#FEF2F2] via-white to-[#FFF1F2] ring-4 ring-[#FEE2E2]/70',
    iconBoxClass: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    badgeClass: 'bg-[#B91C1C] text-white',
    stepNumClass: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
    ctaClass: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white',
    Icon: RotateCcw,
    primaryTarget: 'repeat',
    showSecondaryPatientLink: false,
  },
  clinicalReview: {
    containerClass:
      'border-2 border-[#D97706] bg-gradient-to-br from-[#FFFBEB] via-white to-[#FEF3C7]/50 ring-4 ring-[#FDE68A]/60',
    iconBoxClass: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    badgeClass: 'bg-[#B45309] text-white',
    stepNumClass: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]',
    ctaClass: 'bg-[#B45309] hover:bg-[#92400E] text-white',
    Icon: Stethoscope,
    primaryTarget: 'repeat',
    showSecondaryPatientLink: true,
  },
  standardizeRetest: {
    containerClass:
      'border-2 border-[#0284C7] bg-gradient-to-br from-[#F0F9FF] via-white to-[#E0F2FE]/50 ring-4 ring-[#BAE6FD]/60',
    iconBoxClass: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    badgeClass: 'bg-[#0369A1] text-white',
    stepNumClass: 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]',
    ctaClass: 'bg-[#0369A1] hover:bg-[#075985] text-white',
    Icon: SlidersHorizontal,
    primaryTarget: 'repeat',
    showSecondaryPatientLink: true,
  },
  baselineEstablished: {
    containerClass:
      'border-2 border-[#0F766E] bg-gradient-to-br from-[#F0FDF4] via-white to-[#CCFBF1]/40 ring-4 ring-[#99F6E4]/60',
    iconBoxClass: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    badgeClass: 'bg-[#0F766E] text-white',
    stepNumClass: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    ctaClass: 'bg-[#0F766E] hover:bg-[#115E59] text-white',
    Icon: ClipboardCheck,
    primaryTarget: 'patient',
    showSecondaryPatientLink: false,
  },
  routineMonitoring: {
    containerClass:
      'border-2 border-[#0F766E] bg-gradient-to-br from-[#F0FDF4] via-white to-[#CCFBF1]/40 ring-4 ring-[#99F6E4]/60',
    iconBoxClass: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    badgeClass: 'bg-[#0F766E] text-white',
    stepNumClass: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]',
    ctaClass: 'bg-[#0F766E] hover:bg-[#115E59] text-white',
    Icon: CheckCircle2,
    primaryTarget: 'patient',
    showSecondaryPatientLink: false,
  },
};

export const AssessmentReportPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { t, dict } = useTranslation();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientVisits, setPatientVisits] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [isTriggeringAnalysis, setIsTriggeringAnalysis] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [simpleMode, setSimpleMode] = useState<boolean>(true);

  const fetchReport = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    setActionError(null);
    try {
      const data = await getAssessment(assessmentId);
      setAssessment(data);

      // Load patient list & visit history for anytime switching (best-effort)
      getPatients()
        .then((list) => {
          if (Array.isArray(list)) setPatients(list);
        })
        .catch(() => {});

      if (data.patient_id) {
        getPatientHistory(data.patient_id)
          .then((hist) => {
            if (Array.isArray(hist)) setPatientVisits(hist);
          })
          .catch(() => {});
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: t('reportPage.fetchError'), isUnavailable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [assessmentId]);

  const handleRunAnalysisNow = async () => {
    if (!assessment) return;
    setIsTriggeringAnalysis(true);
    setActionError(null);
    try {
      soundFx.playClick();
      const updated = await triggerAnalysis(assessment.assessment_id);
      setAssessment(updated);
      soundFx.playSuccess();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to execute analysis pipeline.'
      );
    } finally {
      setIsTriggeringAnalysis(false);
    }
  };

  if (loading) {
    return (
      <div className="panel-ramp p-16 text-center">
        <LoadingSpinner label={t('reportPage.loadingLabel')} />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto text-[#0F172A]">
        <Link
          to="/patients"
          onClick={() => soundFx.playClick()}
          className="link-editorial text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('reportPage.backToRegistry')}</span>
        </Link>
        <ErrorAlert
          message={error?.message || t('reportPage.notRetrieved')}
          isUnavailable={error?.isUnavailable}
          onRetry={fetchReport}
        />
      </div>
    );
  }

  const pupilFeatures = assessment.pupil?.features || {};
  const pursuitFeatures = assessment.pursuit?.features || {};

  const isInsufficientQuality =
    assessment.quality_status === 'insufficient' ||
    assessment.quality?.status === 'insufficient' ||
    assessment.pupil?.status === 'insufficient_quality' ||
    assessment.pursuit?.status === 'insufficient_quality';

  const guidanceKey = resolvePatientGuidanceKey(assessment, isInsufficientQuality);
  const guidanceCopy = dict.reportPage.patientNextSteps[guidanceKey];
  const guidanceTheme = GUIDANCE_THEME[guidanceKey];
  const GuidanceIcon = guidanceTheme.Icon;
  const repeatHref = `/assessments/new?patientId=${assessment.patient_id}`;
  const patientRecordHref = assessment.patient_id ? `/patients/${assessment.patient_id}` : '/patients';
  const primaryHref = guidanceTheme.primaryTarget === 'repeat' ? repeatHref : patientRecordHref;

  const currentPatient = patients.find((p) => p.patient_id === assessment.patient_id);
  const displayPatientCode =
    assessment.pseudonymous_code || currentPatient?.pseudonymous_code || assessment.patient_id;
  const latestCompletedVisit = patientVisits.find(
    (v) => v.status === 'complete' && v.assessment_id !== assessment.assessment_id
  );
  const continueCaptureHref =
    assessment.test_type === 'smooth_pursuit' || assessment.has_pupil_video
      ? `/assessments/${assessment.assessment_id}/pursuit-test`
      : `/assessments/${assessment.assessment_id}/pupil-test`;
  const isIncompleteSession = assessment.status !== 'complete';

  const handlePatientSwitch = (targetPatientId: string) => {
    const target = patients.find((p) => p.patient_id === targetPatientId);
    if (!target) return;
    soundFx.playClick();
    const targetReportId = target.latest_completed_assessment_id || target.latest_assessment_id;
    if (targetReportId) {
      navigate(`/assessments/${targetReportId}/report`);
    } else {
      navigate(`/patients/${target.patient_id}`);
    }
  };

  const patientSummary = buildPatientSituationSummary(assessment);
  const pupilUnit = pupilFeatures.baseline_diameter?.unit || 'mm';

  const toneBadgeClasses = (tone: Tone) => {
    switch (tone) {
      case 'good':
        return 'bg-[#F0FDF4] text-[#0F766E] border-[#BBF7D0]';
      case 'warn':
        return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      case 'alert':
        return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
      default:
        return 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
    }
  };

  const summaryPalette = {
    typical: {
      box: 'bg-[#F0FDF4] border-[#BBF7D0]',
      badge: 'bg-white text-[#0F766E] border-[#BBF7D0]',
      iconColor: 'text-[#0F766E]',
    },
    attention: {
      box: 'bg-[#FFFBEB] border-[#FDE68A]',
      badge: 'bg-white text-[#B45309] border-[#FDE68A]',
      iconColor: 'text-[#B45309]',
    },
    review: {
      box: 'bg-[#FEF2F2] border-[#FECACA]',
      badge: 'bg-white text-[#B91C1C] border-[#FECACA]',
      iconColor: 'text-[#B91C1C]',
    },
    retake: {
      box: 'bg-[#FEF2F2] border-[#FECACA]',
      badge: 'bg-white text-[#B91C1C] border-[#FECACA]',
      iconColor: 'text-[#B91C1C]',
    },
  }[patientSummary.level];

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-[#0F172A]">
      {/* Top action bar + Quick Patient/Visit Report Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to={assessment.patient_id ? `/patients/${assessment.patient_id}` : '/patients'}
            onClick={() => soundFx.playClick()}
            className="link-editorial text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('reportPage.backToRecord')}</span>
          </Link>
          <Link
            to="/reports"
            onClick={() => soundFx.playClick()}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#475569] hover:text-[#0F172A] transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>All Reports</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {patients.length > 0 && (
            <select
              value={assessment.patient_id}
              onChange={(e) => handlePatientSwitch(e.target.value)}
              aria-label="Switch participant report"
              className="px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.pseudonymous_code} ({p.assessment_count ?? 0} visits)
                </option>
              ))}
            </select>
          )}
          {patientVisits.length > 1 && (
            <select
              value={assessment.assessment_id}
              onChange={(e) => {
                soundFx.playClick();
                navigate(`/assessments/${e.target.value}/report`);
              }}
              aria-label="Switch visit report"
              className="px-2.5 py-1.5 text-xs font-mono bg-white border border-[#E2E8F0] rounded-md text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            >
              {patientVisits.map((v, idx) => (
                <option key={v.assessment_id} value={v.assessment_id}>
                  Visit #{patientVisits.length - idx} · {formatDate(v.assessment_at)} ({v.status})
                </option>
              ))}
            </select>
          )}
          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-white p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setSimpleMode(true)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                simpleMode ? 'bg-[#0F172A] text-white font-semibold' : 'text-[#475569]'
              }`}
            >
              Simple View
            </button>
            <button
              type="button"
              onClick={() => setSimpleMode(false)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                !simpleMode ? 'bg-[#0F172A] text-white font-semibold' : 'text-[#475569]'
              }`}
            >
              Clinical Detail
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              window.print();
            }}
            className="btn-ramp-secondary py-1.5 px-3 text-xs font-mono"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('reportPage.printReport')}</span>
          </button>
        </div>
      </div>

      {/* Main Clinical Report Document (Ramp Dossier Style) */}
      <div className="panel-ramp shadow-ramp-card print:border-none print:shadow-none overflow-hidden">
        {/* Report Header */}
        <div className="p-8 sm:p-10 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-md bg-white border border-[#E2E8F0] text-[#0F172A]">
                  <FileText className="w-5 h-5 text-[#475569]" />
                </div>
                <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#0F172A] tracking-tight">
                  {t('reportPage.reportTitle')}
                </h1>
              </div>
              <p className="text-xs text-[#475569] font-mono">
                {t('reportPage.sessionId')} <span className="text-[#0F172A] font-semibold">{assessment.assessment_id}</span> &bull; {t('reportPage.protocolLabel')}{' '}
                <span className="text-[#0F172A] font-semibold">{assessment.protocol_version || 'ocutrack-protocol-0.1'}</span>
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2">
              <StatusBadge type="assessment" status={assessment.status} />
              <StatusBadge type="quality" status={assessment.quality?.status || assessment.quality_status} />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-[#E2E8F0] text-xs font-mono">
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">{t('reportPage.pseudonymousId')}</span>
              <Link
                to={patientRecordHref}
                className="font-semibold text-[#0F172A] hover:underline flex items-center gap-1.5 text-sm"
              >
                <User className="w-3.5 h-3.5 text-[#475569]" />
                {displayPatientCode}
              </Link>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">{t('reportPage.capturedTimestamp')}</span>
              <span className="font-medium text-[#0F172A] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#475569]" />
                {formatDate(assessment.assessment_at)}
              </span>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">{t('reportPage.qualityUsability')}</span>
              <span className={`font-semibold ${isInsufficientQuality ? 'text-[#B91C1C]' : 'text-[#0F766E]'}`}>
                {assessment.quality?.usable_frame_ratio !== undefined && assessment.quality?.usable_frame_ratio !== null
                  ? t('reportPage.usableSuffix', { pct: (assessment.quality.usable_frame_ratio * 100).toFixed(1) })
                  : t('reportPage.acceptableFallback')}
              </span>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">{t('reportPage.reviewStatus')}</span>
              <span className="font-medium text-[#0F172A]">
                {assessment.review_message ? t('reportPage.reviewed') : t('reportPage.awaitingReview')}
              </span>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-8 sm:p-10 space-y-8 bg-white">
          {/* Actionable Incomplete / Pending Session Banner */}
          {isIncompleteSession && (
            <div className="p-5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl text-xs text-[#0F172A] space-y-3 font-mono print:hidden">
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-[#0369A1] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#0369A1]">
                    {assessment.status === 'created'
                      ? 'Assessment Capture Pending — No Video Uploaded Yet'
                      : assessment.status === 'failed'
                      ? 'Analysis Pipeline Did Not Complete'
                      : 'Recordings Uploaded — Ready for Biometric Analysis'}
                  </h4>
                  <p className="leading-relaxed text-[#334155] font-sans font-normal">
                    {assessment.status === 'created'
                      ? 'This session was initialized without completing the video recording or calibrated benchmark upload, so biometric curves are not yet populated.'
                      : assessment.status === 'failed'
                      ? 'The previous analysis run encountered an error. You can retry analysis or record a new capture.'
                      : 'Uploaded video streams are awaiting analysis extraction.'}
                  </p>
                </div>
              </div>
              {actionError && <ErrorAlert message={actionError} />}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {assessment.status === 'created' && (
                  <Link
                    to={continueCaptureHref}
                    onClick={() => soundFx.playClick()}
                    className="btn-ramp-primary py-2 px-3.5 text-xs shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Capture / Upload Video Now</span>
                  </Link>
                )}
                {(assessment.status === 'uploaded' ||
                  assessment.status === 'failed' ||
                  assessment.has_pupil_video ||
                  assessment.has_pursuit_video) && (
                  <button
                    type="button"
                    onClick={handleRunAnalysisNow}
                    disabled={isTriggeringAnalysis}
                    className="btn-ramp-primary py-2 px-3.5 text-xs shadow-sm"
                  >
                    {isTriggeringAnalysis ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isTriggeringAnalysis ? 'Running Analysis...' : 'Run Analysis Now'}</span>
                  </button>
                )}
                {latestCompletedVisit && (
                  <Link
                    to={`/assessments/${latestCompletedVisit.assessment_id}/report`}
                    onClick={() => soundFx.playClick()}
                    className="btn-ramp-secondary py-2 px-3.5 text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Latest Completed Report</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Plain-Language Patient Situation & Suggested Next Steps */}
          <div className={`p-6 rounded-xl border space-y-4 ${summaryPalette.box}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white border border-black/5 shrink-0 ${summaryPalette.iconColor}`}>
                  {patientSummary.level === 'typical' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : patientSummary.level === 'attention' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#475569] flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Plain-Language Patient Summary
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${summaryPalette.badge}`}>
                      {patientSummary.badgeText}
                    </span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#0F172A] font-normal">
                    {patientSummary.headline}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#475569] font-sans leading-relaxed">
                    {patientSummary.summaryText}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white/90 border border-black/5 rounded-lg p-4 space-y-2">
                <h3 className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[#0F172A]">
                  What We Observed
                </h3>
                <ul className="space-y-1.5 text-xs font-sans text-[#334155]">
                  {patientSummary.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                          h.tone === 'good'
                            ? 'bg-[#0F766E]'
                            : h.tone === 'warn'
                            ? 'bg-[#D97706]'
                            : h.tone === 'alert'
                            ? 'bg-[#B91C1C]'
                            : 'bg-[#64748B]'
                        }`}
                      />
                      <span>{h.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/90 border border-black/5 rounded-lg p-4 space-y-2">
                <h3 className="font-mono text-[11px] uppercase tracking-wider font-semibold text-[#0F172A] flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                  Suggested Next Steps for Patient
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs font-sans text-[#334155]">
                  {patientSummary.recommendations.map((rec, i) => (
                    <li key={i} className="leading-relaxed">{rec}</li>
                  ))}
                </ol>
              </div>
            </div>

            <p className="text-[11px] font-mono text-[#64748B]">{patientSummary.disclaimerNote}</p>
          </div>

          {/* Prominent Quality Warning if insufficient */}
          {isInsufficientQuality && (
            <div className="p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#0F172A] space-y-3 font-mono">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#B91C1C] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#B91C1C]">
                    {t('reportPage.insufficientTitle')}
                  </h4>
                  <p className="leading-relaxed text-[#475569] font-sans font-normal">
                    {t('reportPage.insufficientDesc')}
                  </p>
                </div>
              </div>
              {Array.isArray(dict.reportPage.ruralTips) && dict.reportPage.ruralTips.length > 0 && (
                <div className="bg-white/90 border border-[#FECACA] rounded-lg p-3.5 space-y-1.5 font-sans">
                  <h5 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0F172A]">
                    {t('reportPage.ruralTipsTitle')}
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-[#475569] text-[11px] leading-relaxed">
                    {dict.reportPage.ruralTips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <Link
                  to={`/assessments/new?patientId=${assessment.patient_id}`}
                  onClick={() => soundFx.playClick()}
                  className="btn-ramp-primary py-2 px-3.5 text-xs shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t('reportPage.repeatAssessment')}</span>
                </Link>
              </div>
            </div>
          )}

          {assessment.review_message && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1 font-mono">
              <span className="font-semibold block uppercase tracking-wider text-[#0F172A]">
                {t('reportPage.automatedFinding')}
              </span>
              <p className="leading-relaxed text-[#475569] font-sans font-normal">{assessment.review_message}</p>
            </div>
          )}

          {assessment.warnings && assessment.warnings.length > 0 && (
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#B45309] space-y-1 font-mono">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                <span>{t('reportPage.qualityFlags')}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[#475569] font-sans">
                {assessment.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Extracted Pupil Light Reflex Measurements */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0F172A]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                  {t('reportPage.section1Title')}
                </h3>
              </div>
              <span className="text-xs font-sans text-[#475569]">
                How quickly and clearly the pupil shrinks when light flashes
              </span>
            </div>

            {/* Feature Values Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              {Object.keys(pupilFeatures).length > 0 ? (
                Object.entries(pupilFeatures).map(([key, item]) => {
                  const interp = interpretMetric(key, item, pupilFeatures);
                  const displayUnit =
                    simpleMode && item.unit === 'px_or_normalized'
                      ? 'px'
                      : simpleMode && item.unit === 'px_or_normalized per second'
                      ? 'px/s'
                      : item.unit;

                  return (
                    <div key={key} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#0F172A] font-sans font-semibold text-xs">
                          {interp.plainLabel}
                        </span>
                        {!isInsufficientQuality && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${toneBadgeClasses(interp.tone)}`}>
                            {interp.statusLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-[#64748B] block truncate text-[10px] uppercase tracking-wider font-medium">
                        {item.label || key}
                      </span>
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-xl font-semibold text-[#0F172A] font-mono">
                          {isInsufficientQuality
                            ? t('reportPage.unvalidated')
                            : item.value !== null
                            ? item.value
                            : t('reportPage.notAvailable')}
                        </span>
                        <span className="text-[11px] text-[#475569] font-mono">
                          {isInsufficientQuality ? t('reportPage.repeatTest') : displayUnit}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] font-sans font-normal leading-snug">
                        {interp.plainMeaning}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[#475569] text-xs font-mono">
                  {t('reportPage.pupilPending')}
                </div>
              )}
            </div>

            {/* Pupil Diameter vs Time Chart */}
            <div className="pt-2">
              <PupilCurveChart series={assessment.pupil?.series} unit={pupilUnit} />
            </div>
          </div>

          {/* Section 2: Smooth Pursuit Kinematics */}
          <div className="space-y-4 pt-6 border-t border-[#E2E8F0]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#0F172A]" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                  {t('reportPage.section2Title')}
                </h3>
              </div>
              <span className="text-xs font-sans text-[#475569]">
                How smoothly the eyes follow a moving dot across the screen
              </span>
            </div>

            {/* Pursuit Feature Values */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              {Object.keys(pursuitFeatures).length > 0 ? (
                Object.entries(pursuitFeatures).map(([key, item]) => {
                  const interp = interpretMetric(key, item, pursuitFeatures);
                  const displayValue =
                    simpleMode &&
                    !isInsufficientQuality &&
                    item.value !== null &&
                    (key === 'tracking_continuity' || key === 'mean_tracking_error')
                      ? `${Math.round(item.value * 100)}`
                      : isInsufficientQuality
                      ? t('reportPage.unvalidated')
                      : item.value !== null
                      ? item.value
                      : t('reportPage.notAvailable');
                  const displayUnit =
                    simpleMode &&
                    !isInsufficientQuality &&
                    item.value !== null &&
                    (key === 'tracking_continuity' || key === 'mean_tracking_error')
                      ? '%'
                      : isInsufficientQuality
                      ? t('reportPage.repeatTest')
                      : item.unit || t('reportPage.ratioUnit');

                  return (
                    <div key={key} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#0F172A] font-sans font-semibold text-xs">
                          {interp.plainLabel}
                        </span>
                        {!isInsufficientQuality && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${toneBadgeClasses(interp.tone)}`}>
                            {interp.statusLabel}
                          </span>
                        )}
                      </div>
                      <span className="text-[#64748B] block truncate text-[10px] uppercase tracking-wider font-medium">
                        {item.label || key}
                      </span>
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-xl font-semibold text-[#0F172A] font-mono">
                          {displayValue}
                        </span>
                        <span className="text-[11px] text-[#475569] font-mono">
                          {displayUnit}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] font-sans font-normal leading-snug">
                        {interp.plainMeaning}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[#475569] text-xs font-mono">
                  {t('reportPage.pursuitPending')}
                </div>
              )}
            </div>

            {/* Pursuit Tracking Chart */}
            <div className="pt-2">
              <SmoothPursuitChart series={assessment.pursuit?.series} />
            </div>
          </div>

          {/* Section 3: Longitudinal Baseline Comparison */}
          <div className="space-y-4 pt-6 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Activity className="w-4 h-4 text-[#0F172A]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                {t('reportPage.section3Title')}
              </h3>
            </div>

            <div className="pt-2">
              <BaselineComparisonView comparison={assessment.longitudinal_comparison} />
            </div>
          </div>

          {/* Section 4: Experimental Temporal Convolutional Network (TCN) */}
          <div className="space-y-3 pt-6 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Cpu className="w-4 h-4 text-[#0F172A]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                {t('reportPage.section4Title')}
              </h3>
            </div>

            <SequenceDynamicsSection
              assessment={assessment}
              isInsufficientQuality={isInsufficientQuality}
              modelPrefixLabel={t('reportPage.modelPrefix')}
              experimentalBadgeLabel={t('reportPage.experimentalOutput')}
              defaultNotes={t('reportPage.tcnDefaultNotes')}
            />
          </div>

          {/* Highlighted Patient Next Steps & Action Plan (Below the 4 Assessment Sections) */}
          <section
            aria-label={dict.reportPage.patientNextSteps.sectionLabel}
            data-testid="patient-next-steps"
            className={`rounded-xl p-6 sm:p-7 space-y-5 shadow-sm transition-all ${guidanceTheme.containerClass}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-lg border shrink-0 ${guidanceTheme.iconBoxClass}`}>
                  <GuidanceIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest font-semibold text-[#475569]">
                      {dict.reportPage.patientNextSteps.sectionLabel}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${guidanceTheme.badgeClass}`}>
                      {guidanceCopy.badge}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#0F172A] tracking-tight">
                    {guidanceCopy.title}
                  </h3>
                  <p className="text-sm text-[#334155] leading-relaxed font-sans">
                    {guidanceCopy.summary}
                  </p>
                </div>
              </div>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {guidanceCopy.steps.map((step, idx) => (
                <li
                  key={idx}
                  className="bg-white/90 border border-[#E2E8F0] rounded-lg p-4 flex items-start gap-3 shadow-xs"
                >
                  <span
                    className={`w-6 h-6 rounded-md border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${guidanceTheme.stepNumClass}`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs text-[#0F172A] leading-relaxed font-sans font-medium">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-3 pt-1 print:hidden">
              <Link
                to={primaryHref}
                onClick={() => soundFx.playClick()}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-semibold shadow-xs transition-colors ${guidanceTheme.ctaClass}`}
              >
                <span>{guidanceCopy.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
              {guidanceTheme.showSecondaryPatientLink && 'secondaryCtaLabel' in guidanceCopy && (
                <Link
                  to={patientRecordHref}
                  onClick={() => soundFx.playClick()}
                  className="btn-ramp-secondary py-2 px-3.5 text-xs font-mono"
                >
                  <span>{guidanceCopy.secondaryCtaLabel}</span>
                </Link>
              )}
            </div>
          </section>

          {/* Regulatory Disclaimer Banner at bottom of report */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 flex items-start gap-3.5 text-xs text-[#475569] leading-relaxed font-sans">
            <div className="p-2 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold uppercase tracking-wider font-mono text-[#0F172A] text-[11px]">{t('reportPage.regulatoryNoticeTitle')}</p>
              <p className="text-[#475569] font-normal">{t('common.disclaimer', NON_DIAGNOSTIC_DISCLAIMER)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
