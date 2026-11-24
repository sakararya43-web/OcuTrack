import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { getAssessment } from '../services/assessmentService';
import { AssessmentDetail } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { PupilCurveChart } from '../components/charts/PupilCurveChart';
import { SmoothPursuitChart } from '../components/charts/SmoothPursuitChart';
import { BaselineComparisonView } from '../components/charts/BaselineComparisonView';
import { formatDate } from '../lib/formatters';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';

export const AssessmentReportPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);

  const fetchReport = async () => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAssessment(assessmentId);
      setAssessment(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: 'Failed to retrieve assessment report from backend.', isUnavailable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="panel-ramp p-16 text-center">
        <LoadingSpinner label="Compiling quantitative assessment report..." />
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
          <span>Back to Patient Registry</span>
        </Link>
        <ErrorAlert
          message={error?.message || 'Report could not be retrieved.'}
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-[#0F172A]">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          to={assessment.patient_id ? `/patients/${assessment.patient_id}` : '/patients'}
          onClick={() => soundFx.playClick()}
          className="link-editorial text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Participant Record</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              window.print();
            }}
            className="btn-ramp-secondary py-1.5 px-3 text-xs font-mono"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
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
                  Ocular Measurement &amp; Biomarker Report
                </h1>
              </div>
              <p className="text-xs text-[#475569] font-mono">
                Session ID: <span className="text-[#0F172A] font-semibold">{assessment.assessment_id}</span> &bull; Protocol:{' '}
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
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">Pseudonymous ID</span>
              <span className="font-semibold text-[#0F172A] flex items-center gap-1.5 text-sm">
                <User className="w-3.5 h-3.5 text-[#475569]" />
                {assessment.patient_id}
              </span>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">Captured Timestamp</span>
              <span className="font-medium text-[#0F172A] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#475569]" />
                {formatDate(assessment.assessment_at)}
              </span>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">Quality Usability</span>
              <span className="font-semibold text-[#0F766E]">
                {assessment.quality?.usable_frame_ratio !== undefined && assessment.quality?.usable_frame_ratio !== null
                  ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}% Usable`
                  : 'Acceptable'}
              </span>
            </div>
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
              <span className="text-[#64748B] block text-[10px] uppercase tracking-wider font-semibold">Review Status</span>
              <span className="font-medium text-[#0F172A]">
                {assessment.review_message ? 'Reviewed' : 'Awaiting Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-8 sm:p-10 space-y-8 bg-white">
          {/* Prominent Quality Warning if insufficient */}
          {isInsufficientQuality && (
            <div className="p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#0F172A] space-y-3 font-mono">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#B91C1C] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#B91C1C]">
                    Insufficient recording quality: repeat test
                  </h4>
                  <p className="leading-relaxed text-[#475569] font-sans font-normal">
                    This recording did not meet clinical usability thresholds (e.g. low usable frame ratio, motion artifact, or erratic illumination). In accordance with non-diagnostic protocol guidelines, extracted values are unvalidated and must not be presented as reliable physiological evidence.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  to={`/assessments/new?patientId=${assessment.patient_id}`}
                  onClick={() => soundFx.playClick()}
                  className="btn-ramp-primary py-2 px-3.5 text-xs shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Repeat Assessment Now</span>
                </Link>
              </div>
            </div>
          )}

          {assessment.review_message && (
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1 font-mono">
              <span className="font-semibold block uppercase tracking-wider text-[#0F172A]">
                Automated Review Finding:
              </span>
              <p className="leading-relaxed text-[#475569] font-sans font-normal">{assessment.review_message}</p>
            </div>
          )}

          {assessment.warnings && assessment.warnings.length > 0 && (
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-xs text-[#B45309] space-y-1 font-mono">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                <span>Recording Quality Flags</span>
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
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Eye className="w-4 h-4 text-[#0F172A]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                1. Pupil Light Reflex Biometrics
              </h3>
            </div>

            {/* Feature Values Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {Object.keys(pupilFeatures).length > 0 ? (
                Object.entries(pupilFeatures).map(([key, item]) => (
                  <div key={key} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
                    <span className="text-[#64748B] block truncate text-[10px] uppercase tracking-wider font-semibold">{item.label || key}</span>
                    <span className="text-xl font-semibold text-[#0F172A] font-mono block">
                      {isInsufficientQuality
                        ? 'Unvalidated'
                        : item.value !== null
                        ? item.value
                        : 'Not available'}
                    </span>
                    <span className="text-[10px] text-[#475569] block font-mono">
                      {isInsufficientQuality ? 'Repeat test' : item.unit}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[#475569] text-xs font-mono">
                  Pupil biometric features pending or not provided.
                </div>
              )}
            </div>

            {/* Pupil Diameter vs Time Chart */}
            <div className="pt-2">
              <PupilCurveChart series={assessment.pupil?.series} />
            </div>
          </div>

          {/* Section 2: Smooth Pursuit Kinematics */}
          <div className="space-y-4 pt-6 border-t border-[#E2E8F0]">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Crosshair className="w-4 h-4 text-[#0F172A]" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                2. Smooth-Pursuit Eye Movement Kinematics
              </h3>
            </div>

            {/* Pursuit Feature Values */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              {Object.keys(pursuitFeatures).length > 0 ? (
                Object.entries(pursuitFeatures).map(([key, item]) => (
                  <div key={key} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3.5 space-y-1">
                    <span className="text-[#64748B] block truncate text-[10px] uppercase tracking-wider font-semibold">{item.label || key}</span>
                    <span className="text-xl font-semibold text-[#0F172A] font-mono block">
                      {isInsufficientQuality
                        ? 'Unvalidated'
                        : item.value !== null
                        ? item.value
                        : 'Not available'}
                    </span>
                    <span className="text-[10px] text-[#475569] block font-mono">
                      {isInsufficientQuality ? 'Repeat test' : item.unit || 'ratio'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-[#475569] text-xs font-mono">
                  Pursuit tracking metrics pending or not provided.
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
                3. Across-Visit Longitudinal Comparison
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
                4. Experimental Sequence Dynamics (TCN)
              </h3>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 text-xs space-y-2 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[#0F172A] font-semibold text-xs">
                  Model: {assessment.temporal_model?.model_name || 'TCN-Temporal-Evaluator-v0.1'}
                </span>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-[#475569] border border-[#E2E8F0]">
                  Experimental Model Output
                </span>
              </div>
              <p className="text-[#475569] leading-relaxed font-sans font-normal">
                {assessment.temporal_model?.notes ||
                  'Temporal sequence features analyzed for experimental trajectory consistency. This model is under research validation and must not be used as clinical diagnostic evidence.'}
              </p>
            </div>
          </div>

          {/* Regulatory Disclaimer Banner at bottom of report */}
          <div className="mt-8 pt-6 border-t border-[#E2E8F0] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 flex items-start gap-3.5 text-xs text-[#475569] leading-relaxed font-sans">
            <div className="p-2 rounded-md bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold uppercase tracking-wider font-mono text-[#0F172A] text-[11px]">Notice of Regulatory &amp; Clinical Status</p>
              <p className="text-[#475569] font-normal">{NON_DIAGNOSTIC_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
