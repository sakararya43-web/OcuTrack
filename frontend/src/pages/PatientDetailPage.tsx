import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Calendar, PlusCircle, ArrowLeft, ShieldAlert, History, Award, FileText } from 'lucide-react';
import { getPatient, getPatientHistory } from '../services/patientService';
import { Patient, AssessmentSummary } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { LongitudinalTrendChart, LongitudinalDataPoint } from '../components/charts/LongitudinalTrendChart';
import { formatDate } from '../lib/formatters';
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
      <div className="bg-white border border-slate-200 rounded-xl p-12">
        <LoadingSpinner label="Loading participant record..." />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
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
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient Registry
        </Link>
      </div>

      {/* Patient Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono text-xl shadow-sm">
              <User className="w-7 h-7 text-sky-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono text-slate-900">{patient.pseudonymous_code}</h1>
                <StatusBadge type="consent" status={patient.consent_status} />
              </div>
              <p className="text-sm text-slate-500">
                Age Band: <span className="font-medium text-slate-800">{patient.age_band}</span> &bull; Enrolled:{' '}
                {formatDate(patient.created_at)}
              </p>
              {patient.context_notes && (
                <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-100 max-w-xl">
                  {patient.context_notes}
                </div>
              )}
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-3">
            <Link
              to={`/assessments/new?patientId=${patient.patient_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Assessment
            </Link>
          </div>
        </div>

        {/* Clinical Note Alert */}
        <div className="mt-6 pt-6 border-t border-slate-100 bg-amber-50/60 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 sm:px-8 border-b rounded-b-2xl flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Clinical Safety Disclaimer:</strong> Absence of observed longitudinal delta or stable measurements across visits does not establish that the participant is free of neurological impairment. Always rely on certified clinical diagnostic standards.
          </span>
        </div>
      </div>

      {/* Longitudinal Trend Chart (if multiple visits) */}
      {sortedHistory.length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Across-Visit Trajectory</h2>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setTrendMetric('latency')}
                className={`px-2.5 py-1 rounded font-medium ${
                  trendMetric === 'latency'
                    ? 'bg-sky-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Latency
              </button>
              <button
                onClick={() => setTrendMetric('velocity')}
                className={`px-2.5 py-1 rounded font-medium ${
                  trendMetric === 'velocity'
                    ? 'bg-sky-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Velocity
              </button>
              <button
                onClick={() => setTrendMetric('gain')}
                className={`px-2.5 py-1 rounded font-medium ${
                  trendMetric === 'gain'
                    ? 'bg-sky-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tracking Gain
              </button>
            </div>
          </div>
          <LongitudinalTrendChart data={trendData} metric={trendMetric} />
        </div>
      )}

      {/* Assessment History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Longitudinal Assessment History</h2>
          </div>
          <span className="text-xs text-slate-500">
            Total Visits: <strong className="text-slate-800">{history.length}</strong>
          </span>
        </div>

        {sortedHistory.length === 0 ? (
          <EmptyState
            title="No assessments recorded yet"
            description="Initiate the first assessment to record baseline pupil light reflex and smooth-pursuit measurements."
            icon={<Calendar className="w-6 h-6" />}
            action={
              <Link
                to={`/assessments/new?patientId=${patient.patient_id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Capture Baseline Test
              </Link>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Assessment Date</th>
                    <th className="px-6 py-3.5">Protocol</th>
                    <th className="px-6 py-3.5">Run Status</th>
                    <th className="px-6 py-3.5">Quality</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Review Summary</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedHistory.map((item) => {
                    const isBaseline = baselineCandidate?.assessment_id === item.assessment_id;
                    return (
                      <tr key={item.assessment_id} className="hover:bg-slate-50/60 transition-colors">
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Award className="w-3 h-3" />
                              Baseline
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Follow-up</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                          {item.review_message || 'Analysis pending or not available'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/assessments/${item.assessment_id}/report`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Report &rarr;
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
