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
  BarChart3,
} from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { PROTOCOL_VERSION } from '../lib/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/motion';
import { ApiClientError } from '../services/apiClient';
import { formatDate } from '../lib/formatters';
import { useTranslation } from '../i18n';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
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
      <ScrollReveal>
        <Card className="relative overflow-hidden border-slate-300 shadow-xs">
          {/* Subtle Technical Corner Accents */}
          <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-400">
              <path d="M 100 0 L 100 100 L 0 100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="medical">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                  <span>{PROTOCOL_VERSION}</span>
                </Badge>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider px-2 py-0.5 rounded border border-slate-200 bg-slate-50">
                  REF-LATENCY: 245ms | VELOCITY: 4.3mm/s
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
                {t('dashboard.heroTitle')}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {t('dashboard.heroDescription')}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <Button variant="navy" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>{t('dashboard.newPatient')}</span>
              </Button>
              <Link
                to="/assessments/new"
                className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 active:scale-[0.98] border border-sky-700 rounded-md shadow-xs transition-all duration-150 ease-out"
              >
                <ClipboardList className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                <span>{t('dashboard.initiateAssessment')}</span>
              </Link>
              <Link
                to="/patients"
                className="group inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors duration-150 sm:ml-auto"
              >
                <span>{t('dashboard.allPatients')}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </ScrollReveal>

      {/* Metrics Summary Strip */}
      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StaggerItem>
          <Card className="border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                  {t('dashboard.registeredRecords')}
                </span>
                <Users className="w-5 h-5 text-slate-500" aria-hidden="true" />
              </div>
              <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                {loading ? '-' : error ? '0' : patientCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.pseudonymousProfiles')}</p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                  {t('dashboard.recordedAssessments')}
                </span>
                <FileCheck className="w-5 h-5 text-teal-700" aria-hidden="true" />
              </div>
              <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                {loading ? '-' : error ? '0' : totalAssessmentsCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.completedSessions')}</p>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card className="border-slate-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider font-mono">
                  {t('dashboard.flaggedForReview')}
                </span>
                <AlertCircle className="w-5 h-5 text-sky-700" aria-hidden="true" />
              </div>
              <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
                {loading ? '-' : error ? '0' : pendingReviewCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">{t('dashboard.reviewFlagsDesc')}</p>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>

      {/* Clinic Overview Collective Analytics Preview Card */}
      <ScrollReveal delay={0.1}>
        <div className="p-4 sm:p-5 rounded-md border border-slate-300 bg-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold font-mono text-slate-900">
                  {t('clinicOverview.previewCardTitle')}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-teal-200 bg-teal-50 text-teal-800 font-bold">
                  COLLECTIVE ANALYTICS
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                {t('clinicOverview.previewCardDesc')}
              </p>
            </div>
          </div>
          <Link
            to="/clinic-overview"
            className="group inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-all self-end md:self-center font-mono whitespace-nowrap active:scale-[0.98]"
          >
            <span>{t('clinicOverview.viewOverview')}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </ScrollReveal>

      {/* Patient Roster Table */}
      <ScrollReveal delay={0.15} as="section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="recent-patients-heading" className="text-lg font-bold text-slate-900 font-mono">
              {t('dashboard.recentHeading')}
            </h2>
            <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">
              [MAX 8 RECORDS]
            </span>
          </div>
          <Link to="/patients" className="text-xs font-semibold text-sky-800 hover:text-sky-900 hover:underline font-mono">
            {t('dashboard.viewFullRegistry')} &rarr;
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
            title={t('dashboard.noRecordsFound')}
            description={t('dashboard.noRecordsDesc')}
            action={
              <Button variant="navy" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>{t('dashboard.addFirstPatient')}</span>
              </Button>
            }
          />
        ) : (
          <Card className="overflow-hidden border-slate-300">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider font-mono">
                    <th className="px-6 py-3.5">{t('dashboard.thPseudonymousId')}</th>
                    <th className="px-6 py-3.5">{t('dashboard.thAgeBand')}</th>
                    <th className="px-6 py-3.5">{t('dashboard.thConsent')}</th>
                    <th className="px-6 py-3.5">{t('dashboard.thLastAssessment')}</th>
                    <th className="px-6 py-3.5">{t('dashboard.thQuality')}</th>
                    <th className="px-6 py-3.5 text-right">{t('dashboard.thActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patients.slice(0, 8).map((patient) => (
                    <tr key={patient.patient_id} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          className="text-sky-800 hover:text-sky-900 hover:underline"
                        >
                          {patient.pseudonymous_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {patient.age_band || t('common.unspecified')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="consent" status={patient.consent_status} />
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        {formatDate(patient.last_assessment_date)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge type="quality" status={patient.last_quality_status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                        <Link
                          to={`/patients/${patient.patient_id}`}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline font-mono"
                        >
                          {t('dashboard.btnProfile')}
                        </Link>
                        <Link
                          to={`/assessments/new?patientId=${patient.patient_id}`}
                          className="text-xs font-semibold text-sky-800 hover:text-sky-900 hover:underline font-mono"
                        >
                          {t('dashboard.btnNewTest')} &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </ScrollReveal>

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
