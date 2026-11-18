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
  Download,
  RefreshCw,
  Eye,
  Activity,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { getAssessment, compareAssessment } from '../services/assessmentService';
import { AssessmentDetail } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { PupilCurveChart } from '../components/charts/PupilCurveChart';
import { SmoothPursuitChart } from '../components/charts/SmoothPursuitChart';
import { BaselineComparisonView } from '../components/charts/BaselineComparisonView';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { formatDate, formatStatusLabel, sanitizeClinicalText } from '../lib/formatters';
import { NON_DIAGNOSTIC_DISCLAIMER } from '../lib/constants';
import { ApiClientError } from '../services/apiClient';

function exportAssessmentToCsv(assessment: AssessmentDetail): void {
  const rows: string[][] = [
    ['Field', 'Value', 'Unit'],
    ['Assessment ID', assessment.assessment_id, ''],
    ['Pseudonymous Patient ID', assessment.patient_id, ''],
    ['Timestamp', assessment.assessment_at, ''],
    ['Protocol Version', assessment.protocol_version, ''],
    ['Status', assessment.status, ''],
    ['Quality Status', assessment.quality?.status || assessment.quality_status, ''],
    [
      'Usable Frame Ratio',
      assessment.quality?.usable_frame_ratio != null
        ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}%`
        : 'Not reported',
      '',
    ],
    ['Review Finding', sanitizeClinicalText(assessment.review_message) || 'None', ''],
  ];

  Object.entries(assessment.pupil?.features || {}).forEach(([key, feat]) => {
    rows.push([
      `Pupil: ${feat.label || key}`,
      feat.value !== null ? String(feat.value) : 'Not available',
      feat.unit || '',
    ]);
  });

  Object.entries(assessment.pursuit?.features || {}).forEach(([key, feat]) => {
    rows.push([
      `Pursuit: ${feat.label || key}`,
      feat.value !== null ? String(feat.value) : 'Not available',
      feat.unit || '',
    ]);
  });

  Object.entries(assessment.longitudinal_comparison?.feature_deltas || {}).forEach(
    ([key, delta]) => {
      rows.push([
        `Delta: ${key}`,
        delta.delta !== null ? String(delta.delta) : 'Not available',
        delta.unit || '',
      ]);
    }
  );

  rows.push(['Non-Diagnostic Notice', NON_DIAGNOSTIC_DISCLAIMER, '']);

  const csvContent = rows
    .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ocutrack-assessment-${assessment.assessment_id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof URL.revokeObjectURL === 'function') {
    URL.revokeObjectURL(url);
  }
}

export const AssessmentReportPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareError, setCompareError] = useState<string | null>(null);

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
        setError({
          message: 'Failed to retrieve assessment report from backend.',
          isUnavailable: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [assessmentId]);

  const handleRefreshComparison = async () => {
    if (!assessmentId) return;
    setIsComparing(true);
    setCompareError(null);
    try {
      const updated = await compareAssessment(assessmentId);
      setAssessment(updated);
    } catch (err: unknown) {
      setCompareError(
        err instanceof Error ? err.message : 'Failed to refresh longitudinal comparison.'
      );
    } finally {
      setIsComparing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <LoadingSpinner label="Compiling quantitative assessment report..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !assessment) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
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
  const temporalOutputEntries =
    assessment.temporal_model?.output && typeof assessment.temporal_model.output === 'object'
      ? Object.entries(assessment.temporal_model.output)
      : [];

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
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Participant Record
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAssessmentToCsv(assessment)}
            aria-label="Export assessment report as CSV"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            aria-label="Print assessment report"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Main Clinical Report Document */}
      <Card className="overflow-hidden print:border-none print:shadow-none">
        {/* Report Header */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-sky-700" aria-hidden="true" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Ocular Measurement &amp; Biomarker Report
                </h1>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Session ID: {assessment.assessment_id} &bull; Protocol:{' '}
                {assessment.protocol_version || 'ocutrack-protocol-0.1'}
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5">
              <StatusBadge type="assessment" status={assessment.status} />
              <StatusBadge
                type="quality"
                status={assessment.quality?.status || assessment.quality_status}
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Pseudonymous ID</span>
              <span className="font-mono font-semibold text-slate-900 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                {assessment.patient_id}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Captured Timestamp</span>
              <span className="font-medium text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                {formatDate(assessment.assessment_at)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Quality Usability</span>
              <span className="font-medium font-mono text-slate-900">
                {assessment.quality?.usable_frame_ratio !== undefined &&
                assessment.quality?.usable_frame_ratio !== null
                  ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}% Usable`
                  : 'Not reported'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Review Status</span>
              <span className="font-medium text-slate-900">
                {assessment.review_message ? 'Reviewed' : 'Awaiting Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Report Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Insufficient Recording Quality Gate */}
          {isInsufficientQuality && (
            <Alert
              variant="destructive"
              icon={<ShieldAlert className="w-5 h-5 text-rose-700" aria-hidden="true" />}
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <h2 className="font-bold text-sm text-rose-900 uppercase tracking-wide">
                    Insufficient recording quality: repeat test
                  </h2>
                  <p className="leading-relaxed text-rose-900">
                    This recording did not meet clinical usability thresholds (such as low usable
                    frame ratio, motion artifact, or erratic illumination). In accordance with
                    non-diagnostic protocol guidelines, extracted values are unvalidated and must
                    not be presented as reliable physiological evidence.
                  </p>
                </div>
                <div>
                  <Link
                    to={`/assessments/new?patientId=${assessment.patient_id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-md shadow-sm transition-colors duration-150"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Repeat Assessment Now
                  </Link>
                </div>
              </div>
            </Alert>
          )}

          {assessment.review_message && (
            <Alert variant="info">
              <span className="font-semibold block uppercase tracking-wider text-sky-900 mb-1">
                Automated Review Finding
              </span>
              <p className="text-sm text-slate-900 font-medium">
                {sanitizeClinicalText(assessment.review_message)}
              </p>
            </Alert>
          )}

          {assessment.warnings && assessment.warnings.length > 0 && (
            <Alert
              variant="clinical"
              title="Recording Quality Flags"
              icon={<AlertTriangle className="w-4 h-4 text-slate-700" aria-hidden="true" />}
            >
              <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                {assessment.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Section 1: Extracted Pupil Light Reflex Measurements */}
          <section aria-labelledby="pupil-section-heading" className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 id="pupil-section-heading" className="text-base font-semibold text-slate-900">
                1. Pupil Light Reflex Biometrics
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {Object.keys(pupilFeatures).length > 0 ? (
                Object.entries(pupilFeatures).map(([key, item]) => (
                  <div
                    key={key}
                    className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-1"
                  >
                    <span className="text-slate-600 block truncate">{item.label || key}</span>
                    <span className="text-base font-bold text-slate-900 font-mono block">
                      {isInsufficientQuality
                        ? 'Unvalidated'
                        : item.value !== null
                        ? item.value
                        : 'Not available'}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-mono">
                      {isInsufficientQuality ? 'Repeat test' : item.unit}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-xs">
                  Pupil biometric features pending or not provided.
                </div>
              )}
            </div>

            <PupilCurveChart series={assessment.pupil?.series} />
          </section>

          {/* Section 2: Smooth Pursuit Kinematics */}
          <section
            aria-labelledby="pursuit-section-heading"
            className="space-y-4 pt-6 border-t border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-sky-700" aria-hidden="true" />
              <h2 id="pursuit-section-heading" className="text-base font-semibold text-slate-900">
                2. Smooth-Pursuit Eye Movement Kinematics
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {Object.keys(pursuitFeatures).length > 0 ? (
                Object.entries(pursuitFeatures).map(([key, item]) => (
                  <div
                    key={key}
                    className="bg-slate-50 border border-slate-200 rounded-md p-3.5 space-y-1"
                  >
                    <span className="text-slate-600 block truncate">{item.label || key}</span>
                    <span className="text-base font-bold text-slate-900 font-mono block">
                      {isInsufficientQuality
                        ? 'Unvalidated'
                        : item.value !== null
                        ? item.value
                        : 'Not available'}
                    </span>
                    <span className="text-[11px] text-slate-500 block font-mono">
                      {isInsufficientQuality ? 'Repeat test' : item.unit || 'ratio'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 bg-slate-50 border border-slate-200 rounded-md text-slate-600 text-xs">
                  Pursuit tracking metrics pending or not provided.
                </div>
              )}
            </div>

            <SmoothPursuitChart series={assessment.pursuit?.series} />
          </section>

          {/* Section 3: Longitudinal Baseline Comparison */}
          <section
            aria-labelledby="longitudinal-section-heading"
            className="space-y-4 pt-6 border-t border-slate-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-700" aria-hidden="true" />
                <h2
                  id="longitudinal-section-heading"
                  className="text-base font-semibold text-slate-900"
                >
                  3. Across-Visit Longitudinal Comparison
                </h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshComparison}
                disabled={isComparing}
                className="print:hidden"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isComparing ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                {isComparing ? 'Re-evaluating...' : 'Re-evaluate Baseline'}
              </Button>
            </div>

            {compareError && <ErrorAlert message={compareError} />}

            <BaselineComparisonView comparison={assessment.longitudinal_comparison} />
          </section>

          {/* Section 4: Experimental Temporal Convolutional Network (TCN) */}
          <section
            aria-labelledby="tcn-section-heading"
            className="space-y-3 pt-6 border-t border-slate-200"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-slate-700" aria-hidden="true" />
              <h2 id="tcn-section-heading" className="text-base font-semibold text-slate-900">
                4. Experimental Sequence Dynamics (TCN)
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-slate-800 font-medium">
                  Model: {assessment.temporal_model?.model_name || 'TCN-Temporal-Evaluator-v0.1'}
                  {assessment.temporal_model?.model_version
                    ? ` (v${assessment.temporal_model.model_version})`
                    : ''}
                </span>
                <div className="flex items-center gap-2">
                  {assessment.temporal_model?.status && (
                    <Badge variant="outline">
                      Status: {formatStatusLabel(assessment.temporal_model.status)}
                    </Badge>
                  )}
                  <Badge variant="navy">Experimental Model Output</Badge>
                </div>
              </div>

              {temporalOutputEntries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  {temporalOutputEntries.map(([metricKey, metricVal]) => (
                    <div
                      key={metricKey}
                      className="bg-white border border-slate-200 rounded p-2.5 space-y-0.5"
                    >
                      <span className="text-[11px] text-slate-500 block">
                        {formatStatusLabel(metricKey)}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 text-sm">
                        {typeof metricVal === 'number'
                          ? metricVal.toFixed(3)
                          : metricVal !== null && metricVal !== undefined
                          ? String(metricVal)
                          : 'Not available'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-slate-600 leading-relaxed">
                {assessment.temporal_model?.notes ||
                  'Temporal sequence features analyzed for experimental trajectory consistency. This model is under research validation and must not be used as clinical diagnostic evidence.'}
              </p>
            </div>
          </section>

          {/* Regulatory Disclaimer Banner at bottom of report */}
          <Alert
            variant="clinical"
            title="Notice of Regulatory & Clinical Status"
            icon={<ShieldAlert className="w-5 h-5 text-slate-700" aria-hidden="true" />}
          >
            {NON_DIAGNOSTIC_DISCLAIMER}
          </Alert>
        </div>
      </Card>
    </div>
  );
};
