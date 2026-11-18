import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  Calendar,
  PlusCircle,
  ArrowLeft,
  ShieldAlert,
  History,
  Award,
  FileText,
} from 'lucide-react';
import { getPatient, getPatientHistory } from '../services/patientService';
import { Patient, AssessmentSummary } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import {
  LongitudinalTrendChart,
  LongitudinalDataPoint,
} from '../components/charts/LongitudinalTrendChart';
import { formatDate, sanitizeClinicalText } from '../lib/formatters';
import { ApiClientError } from '../services/apiClient';

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
      <Card>
        <CardContent className="p-12">
          <LoadingSpinner label="Loading participant record..." />
        </CardContent>
      </Card>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Registry
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

  // Baseline candidate: earliest acceptable complete assessment (or earliest visit if none acceptable yet)
  const acceptedHistory = sortedHistory.filter(
    (item) => item.status === 'complete' && item.quality_status === 'acceptable'
  );
  const baselineCandidate =
    acceptedHistory.length > 0
      ? acceptedHistory[acceptedHistory.length - 1]
      : sortedHistory.length > 0
      ? sortedHistory[sortedHistory.length - 1]
      : null;

  const hasEstablishedBaseline = acceptedHistory.length > 0;

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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Patient Registry
        </Link>
      </div>

      {/* Patient Profile Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-md bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-sky-400" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold font-mono text-slate-900">
                    {patient.pseudonymous_code}
                  </h1>
                  <StatusBadge type="consent" status={patient.consent_status} />
                  {hasEstablishedBaseline ? (
                    <Badge variant="medical">
                      <Award className="w-3 h-3" aria-hidden="true" />
                      Baseline Established
                    </Badge>
                  ) : (
                    <Badge variant="default">No Acceptable Baseline Yet</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  Age Band:{' '}
                  <span className="font-medium text-slate-900">
                    {patient.age_band || 'Unspecified'}
                  </span>{' '}
                  &bull; Enrolled: {formatDate(patient.created_at)}
                </p>
                {patient.context_notes && (
                  <div className="mt-2 text-xs bg-slate-50 text-slate-700 p-3 rounded border border-slate-200 max-w-xl">
                    {patient.context_notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end gap-3">
              <Link
                to={`/assessments/new?patientId=${patient.patient_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-md shadow-sm transition-colors duration-150"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                New Assessment
              </Link>
            </div>
          </div>

          <Alert
            variant="clinical"
            icon={<ShieldAlert className="w-4 h-4 text-slate-700" aria-hidden="true" />}
          >
            <strong>Clinical Safety Disclaimer:</strong> Absence of observed longitudinal delta or
            stable measurements across visits does not establish that the participant is free of
            neurological impairment. Always rely on certified clinical diagnostic standards.
          </Alert>
        </CardContent>
      </Card>

      {/* Longitudinal Trend Chart (if multiple visits) */}
      {sortedHistory.length >= 2 && (
        <section aria-labelledby="longitudinal-trajectory-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="longitudinal-trajectory-heading" className="text-lg font-semibold text-slate-900">
              Across-Visit Trajectory
            </h2>
            <div className="flex items-center gap-2" role="group" aria-label="Select trajectory metric">
              <Button
                size="sm"
                variant={trendMetric === 'latency' ? 'navy' : 'outline'}
                onClick={() => setTrendMetric('latency')}
                aria-pressed={trendMetric === 'latency'}
              >
                Latency
              </Button>
              <Button
                size="sm"
                variant={trendMetric === 'velocity' ? 'navy' : 'outline'}
                onClick={() => setTrendMetric('velocity')}
                aria-pressed={trendMetric === 'velocity'}
              >
                Velocity
              </Button>
              <Button
                size="sm"
                variant={trendMetric === 'gain' ? 'navy' : 'outline'}
                onClick={() => setTrendMetric('gain')}
                aria-pressed={trendMetric === 'gain'}
              >
                Tracking Gain
              </Button>
            </div>
          </div>
          <LongitudinalTrendChart data={trendData} metric={trendMetric} />
        </section>
      )}

      {/* Assessment History Section */}
      <section aria-labelledby="assessment-history-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" aria-hidden="true" />
            <h2 id="assessment-history-heading" className="text-lg font-semibold text-slate-900">
              Longitudinal Assessment History
            </h2>
          </div>
          <span className="text-xs text-slate-600">
            Total Visits: <strong className="text-slate-900 font-mono">{history.length}</strong>
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <EmptyState
            title="No assessments recorded yet"
            description="Initiate the first assessment to record baseline pupil light reflex and smooth-pursuit measurements."
            icon={<Calendar className="w-5 h-5" aria-hidden="true" />}
            action={
              <Link
                to={`/assessments/new?patientId=${patient.patient_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors duration-150"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                Capture Baseline Test
              </Link>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Assessment Date</th>
                    <th className="px-6 py-3.5">Protocol</th>
                    <th className="px-6 py-3.5">Run Status</th>
                    <th className="px-6 py-3.5">Quality</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Review Summary</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedHistory.map((item) => {
                    const isBaseline = baselineCandidate?.assessment_id === item.assessment_id;
                    return (
                      <tr
                        key={item.assessment_id}
                        className="hover:bg-slate-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {formatDate(item.assessment_at)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
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
                            <Badge variant="navy">
                              <Award className="w-3 h-3" aria-hidden="true" />
                              Baseline
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-500">Follow-up</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                          {item.review_message
                            ? sanitizeClinicalText(item.review_message)
                            : 'Analysis pending or not available'}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Link
                            to={`/assessments/${item.assessment_id}/report`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-800 hover:text-sky-900 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                            Report &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
};
