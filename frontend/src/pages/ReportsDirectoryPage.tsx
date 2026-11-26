import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Search,
  PlusCircle,
  Video,
  Play,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Award,
  Loader2,
} from 'lucide-react';
import { getPatients } from '../services/patientService';
import { listAssessments, triggerAnalysis } from '../services/assessmentService';
import { AssessmentSummary, Patient } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { StatusBadge } from '../components/common/StatusBadge';
import { ApiClientError } from '../services/apiClient';
import { formatDate } from '../lib/formatters';
import { soundFx } from '../lib/soundFx';

type StatusFilter = 'all' | 'complete' | 'pending' | 'attention';

export const ReportsDirectoryPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientData, assessmentData] = await Promise.all([
        getPatients(),
        listAssessments(),
      ]);
      setPatients(Array.isArray(patientData) ? patientData : []);
      setAssessments(Array.isArray(assessmentData) ? assessmentData : []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: 'Failed to load patient reports.', isUnavailable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const patientById = useMemo(() => {
    const map = new Map<string, Patient>();
    for (const p of patients) {
      map.set(p.patient_id, p);
    }
    return map;
  }, [patients]);

  const filteredAssessments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assessments.filter((a) => {
      const patient = patientById.get(a.patient_id);
      const code = (a.pseudonymous_code || patient?.pseudonymous_code || '').toLowerCase();
      const notes = (patient?.context_notes || '').toLowerCase();
      const matchesQuery =
        !q ||
        code.includes(q) ||
        a.assessment_id.toLowerCase().includes(q) ||
        (a.review_message || '').toLowerCase().includes(q) ||
        notes.includes(q);

      const matchesPatient = selectedPatientId === 'all' || a.patient_id === selectedPatientId;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'complete' && a.status === 'complete') ||
        (statusFilter === 'pending' &&
          (a.status === 'created' || a.status === 'uploaded' || a.status === 'processing')) ||
        (statusFilter === 'attention' &&
          (a.quality_status === 'insufficient' ||
            a.status === 'failed' ||
            /^change detected\b/i.test((a.review_message || '').trim())));

      return matchesQuery && matchesPatient && matchesStatus;
    });
  }, [assessments, patientById, searchQuery, selectedPatientId, statusFilter]);

  const patientsWithoutAssessments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return patients.filter((p) => {
      const count = p.assessment_count ?? 0;
      if (count > 0) return false;
      if (selectedPatientId !== 'all' && p.patient_id !== selectedPatientId) return false;
      if (!q) return true;
      return (
        p.pseudonymous_code.toLowerCase().includes(q) ||
        (p.context_notes || '').toLowerCase().includes(q)
      );
    });
  }, [patients, searchQuery, selectedPatientId]);

  const handleRunAnalysis = async (assessmentId: string) => {
    setAnalyzingId(assessmentId);
    setActionError(null);
    try {
      soundFx.playClick();
      await triggerAnalysis(assessmentId);
      soundFx.playSuccess();
      await fetchData();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Unable to run analysis for this assessment.'
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const completedCount = assessments.filter((a) => a.status === 'complete').length;
  const pendingCount = assessments.filter((a) => a.status !== 'complete').length;

  return (
    <div className="space-y-8 text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              Clinical Reports Archive
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
            Patient Reports &amp; <span className="italic text-[#475569]">Assessment Archive</span>
          </h1>
          <p className="text-sm text-[#475569] font-normal font-sans max-w-2xl">
            Browse, search, and open any participant&apos;s quantitative ocular report anytime, or resume pending captures.
          </p>
        </div>

        <Link
          to="/assessments/new"
          onClick={() => soundFx.playClick()}
          className="btn-ramp-primary self-start sm:self-auto text-xs py-2.5 px-4 shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Assessment</span>
        </Link>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="panel-ramp p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Participants
          </span>
          <div className="text-2xl font-semibold font-sans text-[#0F172A]">
            {loading ? '-' : patients.length}
          </div>
        </div>
        <div className="panel-ramp p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Total Sessions
          </span>
          <div className="text-2xl font-semibold font-sans text-[#0F172A]">
            {loading ? '-' : assessments.length}
          </div>
        </div>
        <div className="panel-ramp p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#0F766E] font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed Reports
          </span>
          <div className="text-2xl font-semibold font-sans text-[#0F766E]">
            {loading ? '-' : completedCount}
          </div>
        </div>
        <div className="panel-ramp p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#B45309] font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Pending Capture / Analysis
          </span>
          <div className="text-2xl font-semibold font-sans text-[#B45309]">
            {loading ? '-' : pendingCount}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient code (e.g. OT-5442), session ID, or summary..."
              className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#0F172A]"
            />
          </div>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            aria-label="Filter by patient"
            className="px-3 py-2 text-xs font-mono bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
          >
            <option value="all">All Participants ({patients.length})</option>
            {patients.map((p) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.pseudonymous_code} ({p.assessment_count ?? 0} visits)
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg font-mono text-xs">
          {(
            [
              ['all', 'All'],
              ['complete', 'Completed'],
              ['pending', 'Pending'],
              ['attention', 'Needs Attention'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                soundFx.playHover();
                setStatusFilter(key);
              }}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                statusFilter === key
                  ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {actionError && <ErrorAlert message={actionError} />}

      {loading ? (
        <div className="panel-ramp p-16">
          <LoadingSpinner label="Loading clinical reports archive..." />
        </div>
      ) : error ? (
        <ErrorAlert
          message={error.message}
          isUnavailable={error.isUnavailable}
          onRetry={fetchData}
        />
      ) : (
        <div className="space-y-8">
          {/* Assessments & Reports Table */}
          <div className="panel-ramp overflow-hidden">
            {filteredAssessments.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <FileText className="w-6 h-6 text-[#64748B] mx-auto" />
                <h3 className="text-sm font-semibold text-[#0F172A]">No matching assessment reports</h3>
                <p className="text-xs text-[#475569] max-w-md mx-auto">
                  Adjust your filter or initiate a new assessment for any participant.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] uppercase tracking-wider">
                      <th className="px-5 py-3.5 font-semibold">Participant</th>
                      <th className="px-5 py-3.5 font-semibold">Captured At</th>
                      <th className="px-5 py-3.5 font-semibold">Battery</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold">Quality</th>
                      <th className="px-5 py-3.5 font-semibold">Summary</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredAssessments.map((item) => {
                      const patient = patientById.get(item.patient_id);
                      const code = item.pseudonymous_code || patient?.pseudonymous_code || item.patient_id;
                      const captureHref =
                        item.test_type === 'smooth_pursuit'
                          ? `/assessments/${item.assessment_id}/pursuit-test`
                          : `/assessments/${item.assessment_id}/pupil-test`;

                      return (
                        <tr key={item.assessment_id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/patients/${item.patient_id}`}
                                onClick={() => soundFx.playClick()}
                                className="font-semibold text-[#0F172A] hover:underline"
                              >
                                {code}
                              </Link>
                              {item.is_baseline && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
                                  <Award className="w-2.5 h-2.5" />
                                  Baseline
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#64748B] block">
                              {patient?.age_band ? `Age ${patient.age_band}` : item.assessment_id.slice(0, 8)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-[#475569]">{formatDate(item.assessment_at)}</td>
                          <td className="px-5 py-4 text-[#475569]">
                            {item.test_type === 'pupil_reflex'
                              ? 'Pupil Only'
                              : item.test_type === 'smooth_pursuit'
                              ? 'Pursuit Only'
                              : 'Both Tests'}
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge type="assessment" status={item.status} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge type="quality" status={item.quality_status} />
                          </td>
                          <td className="px-5 py-4 text-[#475569] max-w-xs truncate font-sans">
                            {item.review_message ||
                              (item.status === 'created'
                                ? 'Awaiting video capture / upload'
                                : 'Analysis pending')}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {item.status === 'created' && (
                                <Link
                                  to={captureHref}
                                  onClick={() => soundFx.playClick()}
                                  className="btn-ramp-secondary py-1 px-2.5 text-[11px]"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Capture</span>
                                </Link>
                              )}
                              {(item.status === 'uploaded' || item.status === 'failed') && (
                                <button
                                  type="button"
                                  onClick={() => handleRunAnalysis(item.assessment_id)}
                                  disabled={analyzingId === item.assessment_id}
                                  className="btn-ramp-secondary py-1 px-2.5 text-[11px]"
                                >
                                  {analyzingId === item.assessment_id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                  <span>Analyze</span>
                                </button>
                              )}
                              <Link
                                to={`/assessments/${item.assessment_id}/report`}
                                onClick={() => soundFx.playClick()}
                                className="btn-ramp-primary py-1 px-3 text-[11px]"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Report</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Participants Registered Without Assessments Yet */}
          {patientsWithoutAssessments.length > 0 && statusFilter === 'all' && (
            <div className="space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#0F172A] font-semibold">
                Participants Awaiting First Assessment ({patientsWithoutAssessments.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientsWithoutAssessments.map((p) => (
                  <div key={p.patient_id} className="panel-ramp p-5 flex items-center justify-between gap-4">
                    <div>
                      <Link
                        to={`/patients/${p.patient_id}`}
                        className="font-mono font-semibold text-sm text-[#0F172A] hover:underline"
                      >
                        {p.pseudonymous_code}
                      </Link>
                      <p className="text-[11px] font-mono text-[#64748B]">
                        Age {p.age_band || 'Unspecified'} &bull; No sessions yet
                      </p>
                    </div>
                    <Link
                      to={`/assessments/new?patientId=${p.patient_id}`}
                      onClick={() => soundFx.playClick()}
                      className="btn-ramp-primary py-1.5 px-3 text-[11px] shrink-0"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Start Test</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
