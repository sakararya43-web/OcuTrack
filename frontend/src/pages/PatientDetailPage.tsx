import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, PlusCircle, ArrowLeft, ShieldAlert, History, Award, FileText, Activity } from 'lucide-react';
import { getPatient, getPatientHistory } from '../services/patientService';
import { Patient, AssessmentSummary } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { LongitudinalTrendChart, LongitudinalDataPoint } from '../components/charts/LongitudinalTrendChart';
import { formatDate } from '../lib/formatters';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';

export const PatientDetailPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [trendMetric, setTrendMetric] = useState<'latency' | 'velocity' | 'gain'>('latency');

  const fetchPatientDetails = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [patientData, historyData] = await Promise.all([
        getPatient(patientId),
        getPatientHistory(patientId).catch(() => [] as AssessmentSummary[]),
      ]);
      setPatient(patientData);
      setHistory(historyData);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: 'Failed to load patient record', isUnavailable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  if (loading) {
    return (
      <div className="panel-ramp p-16">
        <LoadingSpinner label="Loading participant record..." />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link
          to="/patients"
          onClick={() => soundFx.playClick()}
          className="link-editorial text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Registry</span>
        </Link>
        <ErrorAlert
          message={error?.message || 'Patient record could not be retrieved.'}
          isUnavailable={error?.isUnavailable}
          onRetry={fetchPatientDetails}
        />
      </div>
    );
  }

  // Sort history chronologically descending
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.assessment_at).getTime() - new Date(a.assessment_at).getTime()
  );

  // Baseline candidate: usually the earliest accepted assessment
  const baselineCandidate = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;

  // Prepare trend data points across visits using actual backend-extracted features
  const trendData: LongitudinalDataPoint[] = sortedHistory
    .slice()
    .reverse()
    .map((item) => ({
      assessmentDate: item.assessment_at,
      latencyMs: item.features?.latency_ms ?? null,
      velocityMmS: item.features?.constriction_velocity ?? null,
      trackingGain: item.features?.tracking_gain ?? null,
      isBaseline: item.assessment_id === baselineCandidate?.assessment_id,
    }));

  return (
    <div className="space-y-8 text-[#0F172A]">
      {/* Back button */}
      <div>
        <Link
          to="/patients"
          onClick={() => soundFx.playClick()}
          className="link-editorial text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patient Registry</span>
        </Link>
      </div>

      {/* Patient Profile Header Card (Ramp Style) */}
      <div className="panel-ramp p-8 space-y-6 shadow-ramp-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center font-mono text-[#0F172A]">
              <User className="w-6 h-6 text-[#475569]" />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#0F172A] font-mono tracking-tight">
                  {patient.pseudonymous_code}
                </h1>
                <StatusBadge type="consent" status={patient.consent_status} />
              </div>
              <p className="text-xs font-mono text-[#475569]">
                Age Band: <span className="font-semibold text-[#0F172A]">{patient.age_band}</span> &bull; Enrolled:{' '}
                {formatDate(patient.created_at)}
              </p>
              {patient.context_notes && (
                <div className="mt-2 text-xs bg-[#F8FAFC] text-[#475569] p-3 rounded-lg border border-[#E2E8F0] max-w-xl font-sans leading-relaxed">
                  {patient.context_notes}
                </div>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            <Link
              to={`/assessments/new?patientId=${patient.patient_id}`}
              onClick={() => soundFx.playClick()}
              className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>

        {/* Clinical Safety Note */}
        <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed font-sans">
          <ShieldAlert className="w-4 h-4 shrink-0 text-[#B45309] mt-0.5" />
          <span>
            <strong className="font-medium text-[#0F172A]">Clinical Safety Scope:</strong> Absence of observed longitudinal delta or stable measurements across visits does not establish that the participant is free of neurological impairment. Always rely on certified clinical diagnostic standards.
          </span>
        </div>
      </div>

      {/* Longitudinal Trend Chart (if multiple visits) */}
      {sortedHistory.length >= 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] flex items-center gap-2 font-semibold">
              <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Longitudinal Trajectory Across Visits</span>
            </h2>
            <div className="flex items-center gap-1 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg font-mono text-xs">
              {(['latency', 'velocity', 'gain'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    soundFx.playHover();
                    setTrendMetric(m);
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${trendMetric === m
                    ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                    : 'text-[#475569] hover:text-[#0F172A]'
                    }`}
                >
                  {m === 'latency' ? 'Latency' : m === 'velocity' ? 'Velocity' : 'Tracking Gain'}
                </button>
              ))}
            </div>
          </div>
          <div className="panel-ramp p-6 shadow-ramp-card">
            <LongitudinalTrendChart data={trendData} metric={trendMetric} />
          </div>
        </div>
      )}

      {/* Assessment History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-[#475569]" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
              Longitudinal Assessment History
            </h2>
          </div>
          <span className="text-xs font-mono text-[#475569]">
            Total Visits: <strong className="text-[#0F172A]">{history.length}</strong>
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <EmptyState
            title="No assessments recorded yet"
            description="Initiate the first assessment to record baseline pupil light reflex and smooth-pursuit measurements."
            icon={<Calendar className="w-5 h-5 text-[#475569]" />}
            action={
              <Link
                to={`/assessments/new?patientId=${patient.patient_id}`}
                onClick={() => soundFx.playClick()}
                className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Capture Baseline Test</span>
              </Link>
            }
          />
        ) : (
          <div className="panel-ramp overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">Assessment Date</th>
                    <th className="px-6 py-3.5 font-semibold">Protocol</th>
                    <th className="px-6 py-3.5 font-semibold">Run Status</th>
                    <th className="px-6 py-3.5 font-semibold">Quality</th>
                    <th className="px-6 py-3.5 font-semibold">Role</th>
                    <th className="px-6 py-3.5 font-semibold">Review Summary</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {sortedHistory.map((item) => {
                    const isBaseline = baselineCandidate?.assessment_id === item.assessment_id;
                    return (
                      <tr key={item.assessment_id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-6 py-4 font-semibold text-[#0F172A]">
                          {formatDate(item.assessment_at)}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#475569]">
                          {item.protocol_version || 'standard'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge type="assessment" status={item.status} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge type="quality" status={item.quality_status} />
                        </td>
                        <td className="px-6 py-4">
                          {isBaseline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0] font-mono">
                              <Award className="w-3 h-3" />
                              Baseline
                            </span>
                          ) : (
                            <span className="text-xs text-[#475569]">Follow-up</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-[#475569] max-w-xs truncate font-sans">
                          {item.review_message || 'Analysis pending or not available'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/assessments/${item.assessment_id}/report`}
                            onClick={() => soundFx.playClick()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:underline transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#475569]" />
                            <span>Report →</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
