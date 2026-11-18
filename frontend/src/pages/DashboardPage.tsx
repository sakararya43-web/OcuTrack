import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { APP_NAME, APP_TAGLINE, PROTOCOL_VERSION } from '../lib/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
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
  const totalAssessmentsCount = patients.reduce(
    (acc, p) => acc + (p.assessment_count !== undefined ? p.assessment_count : p.last_assessment_date ? 1 : 0),
    0
  );
  const pendingReviewCount = patients.filter(
    (p) => p.last_quality_status === 'insufficient' || p.feature_change_recorded === true
  ).length;

  return (
    <div className="space-y-8">
      {/* Clinical Workspace Overview */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="max-w-3xl space-y-3">
            <Badge variant="medical">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
              Active Protocol: {PROTOCOL_VERSION}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {APP_NAME}: {APP_TAGLINE}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Standardized browser capture for pupil light reflex and smooth-pursuit eye movement
              measurements, quality verification, and personal-baseline comparison across visits.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
            <Button variant="navy" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              New Pseudonymous Patient
            </Button>
            <Link
              to="/assessments/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 border border-sky-700 rounded-md shadow-sm transition-colors duration-150"
            >
              <ClipboardList className="w-4 h-4" aria-hidden="true" />
              Initiate Assessment
            </Link>
            <Link
              to="/patients"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors duration-150 sm:ml-auto"
            >
              All Patients
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Records</span>
              <Users className="w-5 h-5 text-slate-500" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {loading ? '-' : error ? '0' : patientCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Pseudonymous patient profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Recorded Assessments</span>
              <FileCheck className="w-5 h-5 text-teal-700" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {loading ? '-' : error ? '0' : totalAssessmentsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Completed ocular measurement sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Flagged for Review</span>
              <AlertCircle className="w-5 h-5 text-sky-700" aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {loading ? '-' : error ? '0' : pendingReviewCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Quality flags or longitudinal feature deltas</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient Roster Table */}
      <section aria-labelledby="recent-patients-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-patients-heading" className="text-lg font-semibold text-slate-900">
            Recent Patients &amp; Assessments
          </h2>
          <Link to="/patients" className="text-xs font-medium text-sky-800 hover:text-sky-900 hover:underline">
            View full registry &rarr;
          </Link>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-8">
              <LoadingSpinner label="Fetching patient records from backend..." />
            </CardContent>
          </Card>
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
              <Button variant="navy" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                Add First Patient
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Pseudonymous ID</th>
                    <th className="px-6 py-3.5">Age Band</th>
                    <th className="px-6 py-3.5">Consent</th>
                    <th className="px-6 py-3.5">Last Assessment</th>
                    <th className="px-6 py-3.5">Quality</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patients.slice(0, 8).map((patient) => (
                    <tr key={patient.patient_id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          className="text-sky-800 hover:text-sky-900 hover:underline"
                        >
                          {patient.pseudonymous_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{patient.age_band || 'Unspecified'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge type="consent" status={patient.consent_status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(patient.last_assessment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="quality" status={patient.last_quality_status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          Profile
                        </Link>
                        <Link
                          to={`/assessments/new?patientId=${patient.patient_id}`}
                          className="text-xs font-semibold text-sky-800 hover:text-sky-900 hover:underline"
                        >
                          New Test &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

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
