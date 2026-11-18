import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Cpu,
  Layers,
  FileCheck,
  Search,
  Eye,
  GitCompare,
} from 'lucide-react';
import { getAssessment, triggerAnalysis } from '../services/assessmentService';
import { AssessmentDetail } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { sanitizeClinicalText } from '../lib/formatters';
import { ApiClientError } from '../services/apiClient';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'validation',
    name: 'Video Validation & Codec Decoding',
    description: 'Validating WebM/MP4 container decodability and duration integrity.',
    icon: <FileCheck className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'quality',
    name: 'Frame Usability & Quality Check',
    description: 'Checking illumination levels, head motion, and usable frame ratio.',
    icon: <Search className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'landmarks',
    name: 'Ocular Landmark & Iris Segmentation',
    description: 'Tracking eye regions and pupil boundary contours.',
    icon: <Eye className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'features',
    name: 'Quantitative Biometric Extraction',
    description: 'Measuring constriction latency, velocity, and pursuit tracking gain.',
    icon: <Layers className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'temporal_model',
    name: 'Experimental Temporal Convolutional Network (TCN)',
    description: 'Evaluating sequence dynamics against reference time series.',
    icon: <Cpu className="w-4 h-4" aria-hidden="true" />,
  },
  {
    id: 'comparison',
    name: 'Longitudinal Baseline Comparison',
    description: 'Evaluating measurement deltas against prior accepted assessments.',
    icon: <GitCompare className="w-4 h-4" aria-hidden="true" />,
  },
];

export const ProcessingPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fetchStatus = async () => {
    if (!assessmentId) return;
    try {
      const data = await getAssessment(assessmentId);
      setAssessment(data);
      setError(null);

      if (data.status === 'complete' || data.status === 'failed') {
        clearTimers();
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: 'Unable to reach backend processing service', isUnavailable: true });
      }
    }
  };

  useEffect(() => {
    fetchStatus();

    pollIntervalRef.current = setInterval(fetchStatus, 2500);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearTimers();
    };
  }, [assessmentId]);

  const handleRetryAnalysis = async () => {
    if (!assessmentId) return;
    setIsRetrying(true);
    setError(null);
    try {
      const data = await triggerAnalysis(assessmentId);
      setAssessment(data);
      setElapsedSeconds(0);
      if (data.status !== 'complete' && data.status !== 'failed') {
        clearTimers();
        pollIntervalRef.current = setInterval(fetchStatus, 2500);
        timerRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else {
        setError({ message: 'Failed to restart analysis.', isUnavailable: false });
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const isComplete = assessment?.status === 'complete';
  const isFailed = assessment?.status === 'failed';
  const isProcessing =
    !assessment || assessment.status === 'processing' || assessment.status === 'uploaded' || assessment.status === 'created';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Analysis Pipeline Execution
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Server-side video validation, ocular feature extraction, and longitudinal comparison.
          </p>
        </div>
        <div className="text-right font-mono text-xs text-slate-500">
          ID: <span className="font-semibold text-slate-800">{assessmentId?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Main Status Card */}
      <Card>
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              {isProcessing && (
                <div className="w-10 h-10 rounded-md bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                </div>
              )}
              {isComplete && (
                <div className="w-10 h-10 rounded-md bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                </div>
              )}
              {isFailed && (
                <div className="w-10 h-10 rounded-md bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
                  <XCircle className="w-5 h-5" aria-hidden="true" />
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {isProcessing && 'Backend Analysis in Progress'}
                  {isComplete && 'Analysis Completed Successfully'}
                  {isFailed && 'Analysis Pipeline Halted'}
                </h2>
                <p className="text-xs text-slate-600">
                  {isProcessing &&
                    `Elapsed: ${elapsedSeconds}s (Polling backend status every 2.5s; awaiting server completion)`}
                  {isComplete && `Completed in ${elapsedSeconds}s. Extracted measurements ready.`}
                  {isFailed && 'Processing terminated with error warnings.'}
                </p>
              </div>
            </div>

            <StatusBadge type="assessment" status={assessment?.status} />
          </div>

          {error && (
            <ErrorAlert
              message={error.message}
              isUnavailable={error.isUnavailable}
              onRetry={fetchStatus}
            />
          )}

          {/* Backend Pipeline Stages (Honest server-driven status without fake per-stage timers) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Pipeline Stages (Server-Reported Status)
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {isComplete ? '6 / 6 confirmed' : isFailed ? 'Halted' : 'Executing on server'}
              </span>
            </div>

            <div className="space-y-2">
              {PIPELINE_STAGES.map((stage, idx) => {
                const stageState = isComplete ? 'complete' : isFailed ? 'failed' : 'running';

                return (
                  <div
                    key={stage.id}
                    className={`flex items-start gap-3 p-3 rounded-md border text-xs ${
                      stageState === 'complete'
                        ? 'bg-teal-50/40 border-teal-200 text-slate-900'
                        : stageState === 'failed'
                        ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {stageState === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-teal-700" aria-hidden="true" />
                      ) : stageState === 'failed' ? (
                        <XCircle className="w-4 h-4 text-rose-700" aria-hidden="true" />
                      ) : (
                        <span className="w-5 h-5 rounded border border-slate-300 bg-white flex items-center justify-center text-[10px] font-mono text-slate-600">
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <span className="font-semibold flex items-center gap-1.5 text-slate-900">
                        {stage.icon}
                        {stage.name}
                      </span>
                      <span className="text-[11px] text-slate-600 block mt-0.5">
                        {stage.description}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completion Summary */}
          {isComplete && (
            <div className="bg-slate-50 border border-slate-200 rounded-md p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Extraction &amp; Quality Results
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3 rounded-md border border-slate-200">
                  <span className="text-slate-500 block mb-1">Quality Assessment</span>
                  <StatusBadge
                    type="quality"
                    status={assessment?.quality?.status || assessment?.quality_status}
                  />
                </div>

                <div className="bg-white p-3 rounded-md border border-slate-200">
                  <span className="text-slate-500 block mb-1">Usable Frame Ratio</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {assessment?.quality?.usable_frame_ratio !== undefined &&
                    assessment?.quality?.usable_frame_ratio !== null
                      ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}%`
                      : 'Not reported'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-md border border-slate-200">
                  <span className="text-slate-500 block mb-1">Model Status</span>
                  <span className="font-mono text-slate-800">
                    {assessment?.temporal_model?.status || 'not_configured'}
                  </span>
                </div>
              </div>

              {assessment?.review_message && (
                <div className="p-3 bg-white rounded-md border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-800 block mb-1">Review Guidance:</span>
                  <p className="text-slate-700">{sanitizeClinicalText(assessment.review_message)}</p>
                </div>
              )}

              {assessment?.warnings && assessment.warnings.length > 0 && (
                <Alert
                  variant="clinical"
                  title="Quality Warnings Logged"
                  icon={<AlertTriangle className="w-4 h-4 text-slate-700" aria-hidden="true" />}
                >
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                    {assessment.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </div>
          )}

          {/* Failed Recovery Actions */}
          {isFailed && (
            <Alert variant="destructive" title="Pipeline Execution Error">
              <div className="space-y-3">
                <p>
                  The analysis engine encountered an error or the uploaded video failed decodability
                  checks.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRetryAnalysis}
                    disabled={isRetrying}
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    {isRetrying ? 'Retrying Pipeline...' : 'Retry Analysis'}
                  </Button>
                  <Link
                    to={`/assessments/${assessmentId}/pupil-test`}
                    className="text-xs font-medium text-rose-800 hover:underline"
                  >
                    &larr; Retake Video Recording
                  </Link>
                </div>
              </div>
            </Alert>
          )}

          {/* Footer Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <Link
              to={assessment?.patient_id ? `/patients/${assessment.patient_id}` : '/patients'}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              &larr; Return to Patient Profile
            </Link>

            {isComplete && (
              <Link
                to={`/assessments/${assessmentId}/report`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md shadow-sm transition-colors duration-150"
              >
                Open Full Assessment Report
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
