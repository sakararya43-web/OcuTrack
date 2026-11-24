import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, AlertCircle, PlusCircle, ArrowRight, FileCheck, Activity } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { APP_TAGLINE, PROTOCOL_VERSION } from '../lib/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { ApiClientError } from '../services/apiClient';
import { formatDate } from '../lib/formatters';
import { soundFx } from '../lib/soundFx';

export const DashboardPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setError({ message: err.message, isUnavailable: false });
      } else {
        setError({ message: 'Failed to connect to backend', isUnavailable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const patientCount = patients.length;
  const totalAssessmentsCount = patients.reduce(
    (acc, p) => acc + (p.assessment_count !== undefined ? p.assessment_count : (p.last_assessment_date ? 1 : 0)),
    0
  );
  const pendingReviewCount = patients.filter(
    (p) => p.last_quality_status === 'insufficient' || p.feature_change_recorded === true
  ).length;

  return (
    <div className="space-y-10 text-[#0F172A]">
      {/* Editorial Overview Header (Ramp Style) */}
      <div className="border-b border-[#E2E8F0] pb-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
                Protocol {PROTOCOL_VERSION} · Console
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
              Clinical Telemetry &amp; <span className="italic text-[#475569]">Cohort Registry</span>
            </h1>
            <p className="font-sans text-sm sm:text-base leading-relaxed text-[#475569] font-normal">
              {APP_TAGLINE}. Engineered for feature extraction audits, longitudinal drift tracking, and non-invasive analysis of pupil light reflexes and smooth-pursuit eye movements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsModalOpen(true);
              }}
              className="btn-ramp-primary text-xs py-2.5 px-4 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Participant</span>
            </button>

            <Link
              to="/assessments/new"
              onClick={() => soundFx.playClick()}
              className="btn-ramp-secondary text-xs py-2.5 px-4"
            >
              <ClipboardList className="w-3.5 h-3.5 text-[#475569]" />
              <span>Initialize Test</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row (Ramp Minimal Data Band) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E2E8F0] panel-ramp p-6 sm:p-8">

        {/* Metric 1 */}
        <div className="space-y-1.5 sm:pr-6">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              REGISTERED COHORTS
            </span>
            <Users className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="text-3xl sm:text-4xl font-semibold text-[#0F172A] tracking-tight font-sans">
            {loading ? '-' : error ? '0' : patientCount}
          </div>
          <p className="text-xs text-[#475569] font-normal font-sans">
            Pseudonymous participant records in registry
          </p>
        </div>

        {/* Metric 2 */}
        <div className="pt-4 sm:pt-0 sm:px-6 space-y-1.5">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              RECORDED SESSIONS
            </span>
            <FileCheck className="w-4 h-4 text-[#64748B]" />
          </div>
          <div className="text-3xl sm:text-4xl font-semibold text-[#0F172A] tracking-tight font-sans">
            {loading ? '-' : error ? '0' : totalAssessmentsCount}
          </div>
          <p className="text-xs text-[#475569] font-normal font-sans">
            Completed biometric assessment trials
          </p>
        </div>

        {/* Metric 3 */}
        <div className="pt-4 sm:pt-0 sm:pl-6 space-y-1.5">
          <div className="flex items-center justify-between text-[#64748B]">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">
              REQUIRING REVIEW
            </span>
            <AlertCircle className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className={`text-3xl sm:text-4xl font-semibold tracking-tight font-sans ${pendingReviewCount > 0 ? 'text-[#B45309]' : 'text-[#0F172A]'}`}>
            {loading ? '-' : error ? '0' : pendingReviewCount}
          </div>
          <p className="text-xs text-[#475569] font-normal font-sans">
            Quality flags or longitudinal delta drift
          </p>
        </div>

      </div>

      {/* Main Content Area: Structured Patient Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <h2 className="text-xs font-mono text-[#0F172A] font-semibold flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-[#0F766E]" />
            <span>Recent Cohort Entries</span>
          </h2>
          <Link
            to="/patients"
            onClick={() => soundFx.playClick()}
            className="link-editorial text-xs font-semibold"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="panel-ramp p-12">
            <LoadingSpinner label="Querying participant database..." />
          </div>
        ) : error ? (
          <ErrorAlert
            message={error.message}
            isUnavailable={error.isUnavailable}
            onRetry={fetchDashboardData}
          />
        ) : patients.length === 0 ? (
          <EmptyState
            title="No participants registered"
            description="Register a pseudonymous participant to begin recording calibrated ocular biometric trials."
            action={
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsModalOpen(true);
                }}
                className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add First Participant</span>
              </button>
            }
          />
        ) : (
          <div className="panel-ramp overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-semibold">Participant Code</th>
                    <th className="px-6 py-3.5 font-semibold">Age Band</th>
                    <th className="px-6 py-3.5 font-semibold">Consent Status</th>
                    <th className="px-6 py-3.5 font-semibold">Latest Session</th>
                    <th className="px-6 py-3.5 font-semibold">Quality Gate</th>
                    <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {patients.slice(0, 5).map((patient) => (
                    <tr key={patient.patient_id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#0F172A]">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          onClick={() => soundFx.playClick()}
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <span className="text-[#64748B]"></span>
                          <span className="tracking-wide text-sm font-semibold">{patient.pseudonymous_code}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#475569]">{patient.age_band}</td>
                      <td className="px-6 py-4">
                        <StatusBadge type="consent" status={patient.consent_status} />
                      </td>
                      <td className="px-6 py-4 text-[#475569]">
                        {formatDate(patient.last_assessment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="quality" status={patient.last_quality_status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 text-[11px]">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          onClick={() => soundFx.playClick()}
                          className="text-[#475569] hover:text-[#0F172A] font-medium transition-colors"
                        >
                          Trajectory
                        </Link>
                        <span className="text-[#E2E8F0]">&bull;</span>
                        <Link
                          to={`/assessments/new?patientId=${patient.patient_id}`}
                          onClick={() => soundFx.playClick()}
                          className="text-[#0F172A] hover:underline transition-colors font-semibold"
                        >
                          New Test →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <CreatePatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newPatient: Patient) => {
          setPatients((prev) => [newPatient, ...prev]);
        }}
      />
    </div>
  );
};
