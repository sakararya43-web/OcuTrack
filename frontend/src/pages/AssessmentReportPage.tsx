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
      <div className="bg-white border border-slate-200 rounded-2xl p-12">
        <LoadingSpinner label="Compiling quantitative assessment report..." />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient Registry
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
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <Link
          to={assessment.patient_id ? `/patients/${assessment.patient_id}` : '/patients'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Participant Record
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Main Clinical Report Document */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-sky-700" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Ocular Measurement &amp; Biomarker Report
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Session ID: {assessment.assessment_id} &bull; Protocol:{' '}
                {assessment.protocol_version || 'ocutrack-protocol-0.1'}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5">
              <StatusBadge type="assessment" status={assessment.status} />
              <StatusBadge type="quality" status={assessment.quality?.status || assessment.quality_status} />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Pseudonymous ID</span>
              <span className="font-mono font-semibold text-slate-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {assessment.patient_id}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Captured Timestamp</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(assessment.assessment_at)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Quality Usability</span>
              <span className="font-medium text-slate-800">
                {assessment.quality?.usable_frame_ratio !== undefined && assessment.quality?.usable_frame_ratio !== null
                  ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}% Usable`
                  : 'Acceptable'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Review Status</span>
              <span className="font-medium text-slate-800">
                {assessment.review_message ? 'Reviewed' : 'Awaiting Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Review Message & Clinical Disclaimer */}
        <div className="p-6 sm:p-8 space-y-4">
          {/* Prominent Quality Warning if insufficient */}
          {isInsufficientQuality && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-rose-900 uppercase tracking-wide">
                    Insufficient recording quality — repeat test
                  </h4>
                  <p className="leading-relaxed text-rose-800">
                    This recording did not meet clinical usability thresholds (e.g. low usable frame ratio, motion artifact, or erratic illumination). In accordance with non-diagnostic protocol guidelines, extracted values are unvalidated and must not be presented as reliable physiological evidence.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  to={`/assessments/new?patientId=${assessment.patient_id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Repeat Assessment Now
                </Link>
              </div>
            </div>
          )}

          {assessment.review_message && (
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl text-xs text-sky-950 space-y-1">
              <span className="font-semibold block uppercase tracking-wider text-sky-900">
                Automated Review Finding:
              </span>
              <p className="leading-relaxed">{assessment.review_message}</p>
            </div>
          )}

          {assessment.warnings && assessment.warnings.length > 0 && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Recording Quality Flags</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                {assessment.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Extracted Pupil Light Reflex Measurements */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-semibold text-slate-900">
                1. Pupil Light Reflex Biometrics
              </h3>
            </div>

            {/* Feature Values Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.keys(pupilFeatures).length > 0 ? (
                Object.entries(pupilFeatures).map(([key, item]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-slate-500 block truncate">{item.label || key}</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {isInsufficientQuality
                        ? 'Unvalidated'
                        : item.value !== null
                        ? item.value
                        : 'Not available'}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {isInsufficientQuality ? 'Repeat test' : item.unit}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-slate-50 rounded-lg text-slate-500 text-xs">
                  Pupil biometric features pending or not provided.
                </div>
              )}
            </div>

            {/* Pupil Diameter vs Time Chart */}
            <PupilCurveChart series={assessment.pupil?.series} />
          </div>

          {/* Section 2: Smooth Pursuit Kinematics */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-sky-700" />
              <h3 className="text-base font-semibold text-slate-900">
                2. Smooth-Pursuit Eye Movement Kinematics
              </h3>
            </div>

            {/* Pursuit Feature Values */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {Object.keys(pursuitFeatures).length > 0 ? (
                Object.entries(pursuitFeatures).map(([key, item]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                    <span className="text-slate-500 block truncate">{item.label || key}</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {isInsufficientQuality
                        ? 'Unvalidated'
                        : item.value !== null
                        ? item.value
                        : 'Not available'}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      {isInsufficientQuality ? 'Repeat test' : item.unit || 'ratio'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-slate-50 rounded-lg text-slate-500 text-xs">
                  Pursuit tracking metrics pending or not provided.
                </div>
              )}
            </div>

            {/* Pursuit Tracking Chart */}
            <SmoothPursuitChart series={assessment.pursuit?.series} />
          </div>

          {/* Section 3: Longitudinal Baseline Comparison */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-700" />
              <h3 className="text-base font-semibold text-slate-900">
                3. Across-Visit Longitudinal Comparison
              </h3>
            </div>

            <BaselineComparisonView comparison={assessment.longitudinal_comparison} />
          </div>

          {/* Section 4: Experimental Temporal Convolutional Network (TCN) */}
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-700" />
              <h3 className="text-base font-semibold text-slate-900">
                4. Experimental Sequence Dynamics (TCN)
              </h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-700">
                  Model: {assessment.temporal_model?.model_name || 'TCN-Temporal-Evaluator-v0.1'}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                  Experimental Model Output
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {assessment.temporal_model?.notes ||
                  'Temporal sequence features analyzed for experimental trajectory consistency. This model is under research validation and must not be used as clinical diagnostic evidence.'}
              </p>
            </div>
          </div>

          {/* Regulatory Disclaimer Banner at bottom of report */}
          <div className="mt-8 pt-6 border-t border-slate-200 bg-amber-50/70 p-4 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Notice of Regulatory &amp; Clinical Status</p>
              <p className="leading-relaxed">{NON_DIAGNOSTIC_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
