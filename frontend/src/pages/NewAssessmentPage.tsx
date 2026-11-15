import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ClipboardList, ShieldAlert, CheckCircle2, Video } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { createAssessment } from '../services/assessmentService';
import { Patient, CreateAssessmentPayload, AssessmentSummary } from '../types/api';
import { PROTOCOL_VERSION } from '../lib/constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { ApiClientError } from '../services/apiClient';

export const NewAssessmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedPatientId = searchParams.get('patientId');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(true);
  const [patientsError, setPatientsError] = useState<{ message: string; isUnavailable: boolean } | null>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<string>(preselectedPatientId || '');
  const [testType, setTestType] = useState<'both' | 'pupil_reflex' | 'smooth_pursuit'>('both');
  const [lightingMethod, setLightingMethod] = useState<string>('controlled_ambient');
  const [lightingNotes, setLightingNotes] = useState<string>('Standard room lighting, participant facing screen evenly');
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
        setPatientsError({ message: 'Failed to retrieve patient registry.', isUnavailable: true });
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
      setCreationError('Please select a pseudonymous patient.');
      return;
    }

    if (!consentConfirmed) {
      setCreationError('You must confirm participant consent before initiating assessment recording.');
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
      setCreatedAssessment(result);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCreationError(err.message);
      } else if (err instanceof Error) {
        setCreationError(err.message);
      } else {
        setCreationError('Failed to create assessment session on backend.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Initiate New Ocular Assessment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure recording session parameters, verify consent, and initialize backend assessment tracking.
        </p>
      </div>

      {createdAssessment ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Assessment Session Initialized</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Assessment session <code className="font-mono font-semibold text-slate-800">{createdAssessment.assessment_id}</code> created for patient{' '}
              <span className="font-mono font-semibold text-slate-800">{selectedPatient?.pseudonymous_code}</span>.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-left max-w-md mx-auto space-y-1.5 font-mono">
            <div><span className="text-slate-400">Protocol:</span> {createdAssessment.protocol_version || PROTOCOL_VERSION}</div>
            <div><span className="text-slate-400">Status:</span> {createdAssessment.status}</div>
            <div><span className="text-slate-400">Quality:</span> {createdAssessment.quality_status}</div>
          </div>

          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-xs text-sky-900 max-w-md mx-auto flex items-start gap-2.5 text-left">
            <Video className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Next Stage (Phase 2):</strong> Camera stream initialization, pupil reflex capture, and smooth-pursuit animated target recording are enabled in Phase 2.
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={() => {
                setCreatedAssessment(null);
                setConsentConfirmed(false);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Start Another Session
            </button>
            <Link
              to={`/patients/${selectedPatientId}`}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Return to Patient History
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleStartAssessment} className="space-y-6">
          {creationError && (
            <ErrorAlert message={creationError} />
          )}

          {/* Patient Selection Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                1. Select Participant
              </h3>
              <button
                type="button"
                onClick={() => setIsPatientModalOpen(true)}
                className="text-xs font-medium text-sky-700 hover:text-sky-900"
              >
                + Register New Patient
              </button>
            </div>

            {loadingPatients ? (
              <LoadingSpinner label="Loading registered participants..." />
            ) : patientsError ? (
              <ErrorAlert
                message={patientsError.message}
                isUnavailable={patientsError.isUnavailable}
                onRetry={fetchPatientList}
              />
            ) : patients.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <p className="text-sm text-slate-600 mb-3">No patients available in the database.</p>
                <button
                  type="button"
                  onClick={() => setIsPatientModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md"
                >
                  Create Pseudonymous Record
                </button>
              </div>
            ) : (
              <div>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                  required
                >
                  <option value="" disabled>
                    -- Select Pseudonymous Code --
                  </option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.pseudonymous_code} (Age Band: {p.age_band})
                    </option>
                  ))}
                </select>
                {selectedPatient && (
                  <p className="mt-2 text-xs text-slate-500">
                    Selected: <strong className="text-slate-800 font-mono">{selectedPatient.pseudonymous_code}</strong> &bull; Consent Status:{' '}
                    <span className="text-emerald-700 font-medium">{selectedPatient.consent_status}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Test Protocol & Lighting Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              2. Test Protocol &amp; Environment
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Evaluation Battery
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col justify-between text-xs transition-all ${
                    testType === 'both'
                      ? 'border-sky-600 bg-sky-50/50 text-sky-950 ring-1 ring-sky-600'
                      : 'border-slate-200 hover:border-slate-300'
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
                  <span className="font-semibold text-slate-900">Complete Protocol</span>
                  <span className="text-slate-500 mt-1">Pupil reflex + Smooth pursuit</span>
                </label>

                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col justify-between text-xs transition-all ${
                    testType === 'pupil_reflex'
                      ? 'border-sky-600 bg-sky-50/50 text-sky-950 ring-1 ring-sky-600'
                      : 'border-slate-200 hover:border-slate-300'
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
                  <span className="font-semibold text-slate-900">Pupil Reflex Only</span>
                  <span className="text-slate-500 mt-1">Light stimulus constriction response</span>
                </label>

                <label
                  className={`p-3 border rounded-lg cursor-pointer flex flex-col justify-between text-xs transition-all ${
                    testType === 'smooth_pursuit'
                      ? 'border-sky-600 bg-sky-50/50 text-sky-950 ring-1 ring-sky-600'
                      : 'border-slate-200 hover:border-slate-300'
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
                  <span className="font-semibold text-slate-900">Smooth Pursuit Only</span>
                  <span className="text-slate-500 mt-1">Harmonic moving visual target</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Lighting Calibration Method
                </label>
                <select
                  value={lightingMethod}
                  onChange={(e) => setLightingMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="controlled_ambient">Controlled Ambient Office Lighting</option>
                  <option value="calibrated_external_luminaire">Calibrated External Luminaire</option>
                  <option value="screen_stimulus_flash">Screen Stimulus Flash Protocol</option>
                  <option value="natural_diffuse_daylight">Natural Diffuse Daylight</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Environment &amp; Setup Notes
                </label>
                <input
                  type="text"
                  value={lightingNotes}
                  onChange={(e) => setLightingNotes(e.target.value)}
                  placeholder="e.g. Uniform diffuse ambient lighting, no direct backlighting"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Consent & Safety Confirmation */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              3. Participant Consent &amp; Safety Disclaimer
            </h3>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-700" />
                <span>Protocol Safety &amp; Device Notice</span>
              </div>
              <p className="leading-relaxed">
                This software is an engineering hackathon research prototype. Measurements recorded are strictly for algorithmic benchmarking and longitudinal observation. It is not an FDA/CE-cleared diagnostic medical device.
              </p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                required
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 leading-normal">
                <strong>I verify informed consent:</strong> The participant has given consent to participate in this measurement session, understands the video capture process, and has been informed that this session is non-diagnostic.
              </span>
            </label>
          </div>

          {/* Submission Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/patients')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !consentConfirmed || !selectedPatientId}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                'Initializing Session...'
              ) : (
                <>
                  <ClipboardList className="w-4 h-4" />
                  Initialize Assessment Session
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
