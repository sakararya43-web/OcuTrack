import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, AlertCircle, PlusCircle, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { APP_NAME, APP_TAGLINE, PROTOCOL_VERSION } from '../lib/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { ApiClientError } from '../services/apiClient';
import { formatDate } from '../lib/formatters';

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
  const pendingReviewCount = patients.filter(
    (p) => p.last_quality_status === 'insufficient' || p.feature_change_recorded === true
  ).length;

  return (
    <div className="space-y-8">
      {/* Hero / Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            Active Protocol: {PROTOCOL_VERSION}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {APP_NAME} Workspace
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {APP_TAGLINE}. Designed for research review and longitudinal observation of pupil light reflexes and smooth-pursuit eye movements.
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Pseudonymous Patient
          </button>
          <Link
            to="/assessments/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            Initiate Assessment
          </Link>
          <Link
            to="/patients"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
          >
            All Patients
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Records</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '—' : error ? '0' : patientCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pseudonymous patient files</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quality / Delta Reviews</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {loading ? '—' : error ? '0' : pendingReviewCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Requiring repeat test or clinical check</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Protocol Status</span>
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-base font-semibold text-slate-800">
            Calibrated Suite
          </div>
          <p className="text-xs text-slate-500 mt-1">Standardized timing &amp; target path</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Patients &amp; Assessments</h2>
          <Link to="/patients" className="text-xs font-medium text-sky-700 hover:text-sky-900">
            View full registry &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <LoadingSpinner label="Fetching patient records from backend..." />
          </div>
        ) : error ? (
          <ErrorAlert
            message={error.message}
            isUnavailable={error.isUnavailable}
            onRetry={fetchDashboardData}
          />
        ) : patients.length === 0 ? (
          <EmptyState
            title="No patient records found"
            description="Create a pseudonymous patient record to start recording ocular measurements."
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Add First Patient
              </button>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Pseudonymous ID</th>
                    <th className="px-6 py-3.5">Age Band</th>
                    <th className="px-6 py-3.5">Consent</th>
                    <th className="px-6 py-3.5">Last Assessment</th>
                    <th className="px-6 py-3.5">Quality</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.slice(0, 5).map((patient) => (
                    <tr key={patient.patient_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        <Link to={`/patients/${patient.patient_id}`} className="hover:underline text-sky-800">
                          {patient.pseudonymous_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{patient.age_band}</td>
                      <td className="px-6 py-4">
                        <StatusBadge type="consent" status={patient.consent_status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(patient.last_assessment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="quality" status={patient.last_quality_status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/assessments/new?patientId=${patient.patient_id}`}
                          className="text-xs font-medium text-sky-700 hover:text-sky-900"
                        >
                          New Assessment &rarr;
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
