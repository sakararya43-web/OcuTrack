import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ClipboardList, ShieldAlert, CheckCircle2, Video, ArrowRight } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { createAssessment } from '../services/assessmentService';
import { Patient, CreateAssessmentPayload, AssessmentSummary } from '../types/api';
import { PROTOCOL_VERSION } from '../lib/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';
import { useTranslation } from '../i18n';

export const NewAssessmentPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [patientsError, setPatientsError] = useState<{ message: string; isUnavailable: boolean } | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const [testType, setTestType] = useState<'both' | 'pupil_reflex' | 'smooth_pursuit'>('both');
  const [lightingMethod, setLightingMethod] = useState<string>('controlled_ambient');
  const [lightingNotes, setLightingNotes] = useState<string>(() => t('newAssessmentPage.defaultNotes'));
  const [consentConfirmed, setConsentConfirmed] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [createdAssessment, setCreatedAssessment] = useState<AssessmentSummary | null>(null);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);

  const fetchPatientList = async () => {
    setLoadingPatients(true);
    setPatientsError(null);
    try {
      const data = await getPatients();
      setPatients(data);
      if (!selectedPatientId && data.length > 0) {
        setSelectedPatientId(preselectedPatientId || data[0].patient_id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setPatientsError({ message: err.message, isUnavailable: err.isUnavailable });
      } else if (err instanceof Error) {
        setPatientsError({ message: err.message, isUnavailable: false });
      } else {
        setPatientsError({ message: t('newAssessmentPage.errLoadPatients'), isUnavailable: true });
      }
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatientList();
  }, []);

  const handleStartAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreationError(null);

    if (!selectedPatientId) {
      setCreationError(t('newAssessmentPage.errNoPatient'));
      return;
    }

    if (!consentConfirmed) {
      setCreationError(t('newAssessmentPage.errNoConsent'));
      return;
    }

    setIsSubmitting(true);

    const deviceMetadata = {
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
    };

    const payload: CreateAssessmentPayload = {
      patient_id: selectedPatientId,
      protocol_version: PROTOCOL_VERSION,
      test_type: testType,
      device_metadata: deviceMetadata,
      lighting_metadata: {
        method: lightingMethod,
        notes: lightingNotes,
      },
    };

    try {
      const result = await createAssessment(payload);
      soundFx.playSuccess();
      setCreatedAssessment(result);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCreationError(err.message);
      } else if (err instanceof Error) {
        setCreationError(err.message);
      } else {
        setCreationError(t('newAssessmentPage.errCreateFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId);

  return (
    <div className="max-w-3xl mx-auto space-y-8 text-[#0F172A]">
      {/* Title */}
      <div className="border-b border-[#E2E8F0] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
            {t('newAssessmentPage.badge')}
          </span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
          {t('newAssessmentPage.headingMain')} <span className="italic text-[#475569]">{t('newAssessmentPage.headingItalic')}</span>
        </h1>
        <p className="text-sm text-[#475569] font-normal leading-relaxed font-sans">
          {t('newAssessmentPage.subtitle')}
        </p>
      </div>

      {createdAssessment ? (
        <div className="panel-ramp p-8 sm:p-10 space-y-6 text-center shadow-ramp-card">
          <div className="w-12 h-12 rounded-lg bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#0F172A] tracking-tight">{t('newAssessmentPage.createdTitle')}</h2>
            <p className="text-xs sm:text-sm text-[#475569] max-w-md mx-auto font-mono">
              {t('newAssessmentPage.createdDescPrefix')} <code className="font-mono font-semibold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">{createdAssessment.assessment_id}</code> {t('newAssessmentPage.createdDescMiddle')}{' '}
              <span className="font-semibold text-[#0F172A]">{selectedPatient?.pseudonymous_code}</span>.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 text-xs text-left max-w-md mx-auto space-y-2 font-mono">
            <div className="flex justify-between"><span className="text-[#64748B]">{t('newAssessmentPage.protocolLabel')}</span> <span className="text-[#0F172A] font-semibold">{createdAssessment.protocol_version || PROTOCOL_VERSION}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">{t('newAssessmentPage.statusLabel')}</span> <span className="text-[#0F766E] font-semibold">{createdAssessment.status}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">{t('newAssessmentPage.qualityGateLabel')}</span> <span className="text-[#0F172A]">{createdAssessment.quality_status}</span></div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to={
                testType === 'smooth_pursuit'
                  ? `/assessments/${createdAssessment.assessment_id}/pursuit-test`
                  : `/assessments/${createdAssessment.assessment_id}/pupil-test`
              }
              onClick={() => soundFx.playClick()}
              className="btn-ramp-primary text-xs py-2.5 px-5 shadow-sm"
            >
              <Video className="w-3.5 h-3.5" />
              <span>
                {testType === 'smooth_pursuit'
                  ? t('newAssessmentPage.proceedPursuit', 'Proceed to Smooth Pursuit Test')
                  : t('newAssessmentPage.proceedPupil')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setCreatedAssessment(null);
                setConsentConfirmed(false);
              }}
              className="btn-ramp-secondary text-xs py-2.5 px-4"
            >
              {t('newAssessmentPage.startAnother')}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleStartAssessment} className="space-y-6">
          {creationError && (
            <ErrorAlert message={creationError} />
          )}

          {/* Patient Selection Card */}
          <div className="panel-ramp p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold">
                {t('newAssessmentPage.step1Title')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setIsPatientModalOpen(true);
                }}
                className="text-xs font-mono text-[#0F172A] hover:underline font-medium"
              >
                {t('newAssessmentPage.registerNewPatient')}
              </button>
            </div>

            {loadingPatients ? (
              <LoadingSpinner label={t('newAssessmentPage.loadingParticipants')} />
            ) : patientsError ? (
              <ErrorAlert
                message={patientsError.message}
                isUnavailable={patientsError.isUnavailable}
                onRetry={fetchPatientList}
              />
            ) : patients.length === 0 ? (
              <div className="text-center py-6 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-5">
                <p className="text-xs font-mono text-[#475569] mb-3">{t('newAssessmentPage.noParticipants')}</p>
                <button
                  type="button"
                  onClick={() => setIsPatientModalOpen(true)}
                  className="btn-ramp-primary text-xs py-2 px-4 shadow-sm"
                >
                  {t('newAssessmentPage.createRecord')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedPatientId}
                  onChange={(e) => {
                    soundFx.playHover();
                    setSelectedPatientId(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:bg-white font-mono rounded-lg"
                  required
                >
                  <option value="" disabled className="text-gray-400">
                    {t('newAssessmentPage.selectPlaceholder')}
                  </option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.pseudonymous_code} ({t('newAssessmentPage.ageBandPrefix')} {p.age_band})
                    </option>
                  ))}
                </select>
                {selectedPatient && (
                  <p className="mt-1.5 text-xs font-mono text-[#475569]">
                    {t('newAssessmentPage.selectedPrefix')} <strong className="text-[#0F172A]">{selectedPatient.pseudonymous_code}</strong> &bull; {t('newAssessmentPage.consentStatusLabel')}{' '}
                    <span className="text-[#0F766E] font-medium">{selectedPatient.consent_status}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Test Protocol & Environment Card */}
          <div className="panel-ramp p-6 sm:p-8 space-y-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold pb-3 border-b border-[#E2E8F0]">
              {t('newAssessmentPage.step2Title')}
            </h3>

            <div className="space-y-2.5">
              <label className="block text-xs font-mono text-[#475569] uppercase tracking-wider font-semibold">
                {t('newAssessmentPage.evalBattery')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  onClick={() => soundFx.playHover()}
                  className={`p-4 rounded-lg border cursor-pointer flex flex-col justify-between text-xs transition-colors ${
                    testType === 'both'
                      ? 'border-[#0F172A] bg-[#F8FAFC] text-[#0F172A]'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]'
                  }`}
                >
                  <input
                    type="radio"
                    name="testType"
                    value="both"
                    checked={testType === 'both'}
                    onChange={() => setTestType('both')}
                    className="sr-only"
                  />
                  <span className="font-semibold text-[#0F172A] text-xs">{t('newAssessmentPage.batteryBoth')}</span>
                  <span className="text-[11px] text-[#475569] mt-1.5 font-normal">{t('newAssessmentPage.batteryBothDesc')}</span>
                </label>

                <label
                  onClick={() => soundFx.playHover()}
                  className={`p-4 rounded-lg border cursor-pointer flex flex-col justify-between text-xs transition-colors ${
                    testType === 'pupil_reflex'
                      ? 'border-[#0F172A] bg-[#F8FAFC] text-[#0F172A]'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]'
                  }`}
                >
                  <input
                    type="radio"
                    name="testType"
                    value="pupil_reflex"
                    checked={testType === 'pupil_reflex'}
                    onChange={() => setTestType('pupil_reflex')}
                    className="sr-only"
                  />
                  <span className="font-semibold text-[#0F172A] text-xs">{t('newAssessmentPage.batteryPupil')}</span>
                  <span className="text-[11px] text-[#475569] mt-1.5 font-normal">{t('newAssessmentPage.batteryPupilDesc')}</span>
                </label>

                <label
                  onClick={() => soundFx.playHover()}
                  className={`p-4 rounded-lg border cursor-pointer flex flex-col justify-between text-xs transition-colors ${
                    testType === 'smooth_pursuit'
                      ? 'border-[#0F172A] bg-[#F8FAFC] text-[#0F172A]'
                      : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]'
                  }`}
                >
                  <input
                    type="radio"
                    name="testType"
                    value="smooth_pursuit"
                    checked={testType === 'smooth_pursuit'}
                    onChange={() => setTestType('smooth_pursuit')}
                    className="sr-only"
                  />
                  <span className="font-semibold text-[#0F172A] text-xs">{t('newAssessmentPage.batteryPursuit')}</span>
                  <span className="text-[11px] text-[#475569] mt-1.5 font-normal">{t('newAssessmentPage.batteryPursuitDesc')}</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[#475569] uppercase tracking-wider font-semibold">
                  {t('newAssessmentPage.lightingMethodLabel')}
                </label>
                <select
                  value={lightingMethod}
                  onChange={(e) => setLightingMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:bg-white font-mono rounded-lg"
                >
                  <option value="controlled_ambient">{t('newAssessmentPage.lightingMethods.controlled_ambient')}</option>
                  <option value="calibrated_external_luminaire">{t('newAssessmentPage.lightingMethods.calibrated_external_luminaire')}</option>
                  <option value="screen_stimulus_flash">{t('newAssessmentPage.lightingMethods.screen_stimulus_flash')}</option>
                  <option value="natural_diffuse_daylight">{t('newAssessmentPage.lightingMethods.natural_diffuse_daylight')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[#475569] uppercase tracking-wider font-semibold">
                  {t('newAssessmentPage.notesLabel')}
                </label>
                <input
                  type="text"
                  value={lightingNotes}
                  onChange={(e) => setLightingNotes(e.target.value)}
                  placeholder={t('newAssessmentPage.notesPlaceholder')}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:bg-white font-mono rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Consent & Safety Confirmation */}
          <div className="panel-ramp p-6 sm:p-8 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#0F172A] font-semibold pb-3 border-b border-[#E2E8F0]">
              {t('newAssessmentPage.step3Title')}
            </h3>

            <div className="p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-xs text-[#475569] space-y-1 leading-relaxed font-sans">
              <div className="flex items-center gap-1.5 font-semibold text-[#B45309]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{t('newAssessmentPage.safetyNoticeTitle')}</span>
              </div>
              <p className="font-normal">
                {t('newAssessmentPage.safetyNoticeDesc')}
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                required
                checked={consentConfirmed}
                onChange={(e) => {
                  soundFx.playClick();
                  setConsentConfirmed(e.target.checked);
                }}
                className="mt-0.5 accent-[#0F172A] rounded"
              />
              <span className="text-xs text-[#475569] leading-normal font-sans">
                <strong className="text-[#0F172A] font-medium font-mono">{t('newAssessmentPage.consentBold')}</strong> {t('newAssessmentPage.consentDesc')}
              </span>
            </label>
          </div>

          {/* Submission Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                navigate('/patients');
              }}
              className="btn-ramp-secondary text-xs py-2 px-4"
            >
              {t('newAssessmentPage.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !consentConfirmed || !selectedPatientId}
              className="btn-ramp-primary text-xs py-2.5 px-5 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                t('newAssessmentPage.initializing')
              ) : (
                <>
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span>{t('newAssessmentPage.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <CreatePatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={(newPatient: Patient) => {
          setPatients((prev) => [newPatient, ...prev]);
          setSelectedPatientId(newPatient.patient_id);
        }}
      />
    </div>
  );
};
