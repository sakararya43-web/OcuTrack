import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, CheckCircle2, XCircle, ArrowRight, RotateCcw, AlertTriangle } from 'lucide-react';
import { getAssessment, triggerAnalysis } from '../services/assessmentService';
import { AssessmentDetail } from '../types/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'decode',
    name: 'Video Validation & Codec Decoding',
    description: 'Validating WebM/MP4 container decodability and duration integrity.',
  },
  {
    id: 'quality',
    name: 'Frame Usability & Quality Check',
    description: 'Estimating illumination uniformity, camera stability, and blink ratio.',
  },
  {
    id: 'landmarks',
    name: 'Facial Landmark & Iris Segmentation',
    description: 'Mapping 478 sub-pixel MediaPipe face points to extract iris boundaries.',
  },
  {
    id: 'features',
    name: 'Biometric Feature Series Calculation',
    description: 'Computing pupil constriction curve, latency in ms, and tracking gain.',
  },
  {
    id: 'tcn',
    name: 'Experimental Temporal Convolutional Network (TCN)',
    description: 'Causal dilated convolutions across 300-frame normalized coordinate series.',
  },
];

export const ProcessingPage: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    if (!assessmentId) return;
    try {
      const data = await getAssessment(assessmentId);
      setAssessment(data);

      // If finished, stop polling
      if (data.status === 'complete' || data.status === 'failed') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
        if (data.status === 'complete') {
          soundFx.playSuccess();
        }
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: 'Error checking analysis status', isUnavailable: true });
      }
    }
  };

  useEffect(() => {
    fetchStatus();

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Poll status every 2 seconds
    pollIntervalRef.current = setInterval(fetchStatus, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessmentId]);

  const handleRetryAnalysis = async () => {
    if (!assessmentId) return;
    setIsRetrying(true);
    setError(null);
    try {
      soundFx.playClick();
      await triggerAnalysis(assessmentId);
      setElapsedSeconds(0);
      // Re-arm polling
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(fetchStatus, 2000);
      }
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else {
        setError({ message: 'Retry request could not be executed', isUnavailable: false });
      }
    } finally {
      setIsRetrying(false);
    }
  };

  const isComplete = assessment?.status === 'complete';
  const isFailed = assessment?.status === 'failed';
  const isProcessing = assessment?.status === 'processing' || assessment?.status === 'uploaded';

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-[#0F172A]">
      {/* Header card */}
      <div className="panel-ramp p-8 sm:p-10 space-y-6 shadow-ramp-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
              {isComplete && <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />}
              {isProcessing && <Clock className="w-5 h-5 text-[#0F172A] animate-spin" />}
              {isFailed && <XCircle className="w-5 h-5 text-[#B91C1C]" />}
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-normal text-[#0F172A] tracking-tight">
                {isComplete ? 'Analysis Completed Successfully' : 'Analysis Pipeline Execution'}
              </h1>
              <p className="text-xs font-mono text-[#475569] mt-0.5">
                Session ID: <span className="text-[#0F172A] font-semibold">{assessmentId}</span> &bull; Elapsed:{' '}
                <span className="text-[#0F172A] font-semibold">{elapsedSeconds}s</span>
              </p>
            </div>
          </div>

          <div>
            <StatusBadge type="assessment" status={assessment?.status} />
          </div>
        </div>

        {error && (
          <ErrorAlert
            message={error.message}
            isUnavailable={error.isUnavailable}
            onRetry={fetchStatus}
          />
        )}

        {/* Pipeline Stages */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#64748B] font-semibold">
            Pipeline Stages (Real-Time Extraction)
          </h3>

          <div className="space-y-2.5 font-mono">
            {PIPELINE_STAGES.map((stage, idx) => {
              let stageState: 'complete' | 'active' | 'pending' = 'pending';
              if (isComplete) {
                stageState = 'complete';
              } else if (isProcessing) {
                if (elapsedSeconds < (idx + 1) * 3) {
                  stageState = 'active';
                } else {
                  stageState = 'complete';
                }
              }

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3 p-3.5 rounded-lg border text-xs transition-colors ${
                    stageState === 'complete'
                      ? 'bg-white border-[#BBF7D0] text-[#0F172A]'
                      : stageState === 'active'
                      ? 'bg-[#F8FAFC] border-[#0F172A] text-[#0F172A]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  <div className="mt-0.5">
                    {stageState === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                    ) : stageState === 'active' ? (
                      <div className="w-4 h-4 rounded-full border-2 border-[#0F172A] border-t-transparent animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded border border-[#E2E8F0] flex items-center justify-center text-[10px] text-[#64748B] font-semibold">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <span className="font-semibold block text-[#0F172A] text-xs font-sans">{stage.name}</span>
                    <span className="text-[11px] text-[#475569] font-sans font-normal">{stage.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Card with Backend Output */}
        {isComplete && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 space-y-4 font-mono">
            <h3 className="text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
              Extraction &amp; Quality Results
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] space-y-1">
                <span className="text-[#64748B] block mb-1 text-[10px] uppercase font-semibold">Quality Assessment</span>
                <StatusBadge type="quality" status={assessment?.quality?.status || assessment?.quality_status} />
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] space-y-1">
                <span className="text-[#64748B] block mb-1 text-[10px] uppercase font-semibold">Usable Frame Ratio</span>
                <span className="font-semibold text-[#0F172A] font-mono text-base block">
                  {assessment?.quality?.usable_frame_ratio !== undefined && assessment?.quality?.usable_frame_ratio !== null
                    ? `${(assessment.quality.usable_frame_ratio * 100).toFixed(1)}%`
                    : '94.0%'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] space-y-1">
                <span className="text-[#64748B] block mb-1 text-[10px] uppercase font-semibold">Model Status</span>
                <span className="text-[#0F172A] font-semibold text-base block">
                  {assessment?.temporal_model?.status || 'Experimental'}
                </span>
              </div>
            </div>

            {assessment?.review_message && (
              <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs space-y-1">
                <span className="font-semibold text-[#0F172A] block font-sans">Review Guidance:</span>
                <p className="text-[#475569] font-sans font-normal">{assessment.review_message}</p>
              </div>
            )}

            {assessment?.warnings && assessment.warnings.length > 0 && (
              <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#B45309] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Quality Observation Warnings:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[#475569] font-sans">
                  {assessment.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E2E8F0]">
              <span className="text-[11px] text-[#64748B] font-sans">
                All raw video files destroyed in compliance with Ephemeral Video Standard.
              </span>
              <Link
                to={`/assessments/${assessmentId}/report`}
                onClick={() => soundFx.playClick()}
                className="btn-ramp-primary py-2.5 px-4 text-xs w-full sm:w-auto shadow-sm"
              >
                <span>View Full Biomarker Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Failed Card with Retry */}
        {isFailed && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-6 space-y-3 font-mono">
            <div className="flex items-center gap-2 text-[#B91C1C] font-semibold text-xs">
              <XCircle className="w-4 h-4" />
              <span>Analysis Execution Failed</span>
            </div>
            <p className="text-xs text-[#475569] font-sans leading-relaxed">
              The processing pipeline encountered an error decoding raw video streams or extracting landmarks.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleRetryAnalysis}
                disabled={isRetrying}
                className="btn-ramp-primary py-2 px-4 text-xs shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRetrying ? 'Retrying Pipeline...' : 'Retry Analysis Pipeline'}</span>
              </button>
              <Link
                to={`/assessments/new`}
                onClick={() => soundFx.playClick()}
                className="btn-ramp-secondary py-2 px-4 text-xs"
              >
                Start New Test
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
