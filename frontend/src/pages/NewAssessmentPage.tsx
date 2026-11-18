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
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
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
  const [lightingNotes, setLightingNotes] = useState<string>(
    'Standard room lighting, participant facing screen evenly'
  );
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

  const getCaptureDestination = (assessmentId: string): { path: string; label: string } => {
    if (testType === 'smooth_pursuit') {
      return {
        path: `/assessments/${assessmentId}/pursuit-test`,
        label: 'Proceed to Smooth-Pursuit Test',
      };
    }
    if (testType === 'pupil_reflex') {
      return {
        path: `/assessments/${assessmentId}/pupil-test?mode=pupil_only`,
        label: 'Proceed to Pupil Reflex Test',
      };
    }
    return {
      path: `/assessments/${assessmentId}/pupil-test`,
      label: 'Proceed to Pupil Reflex Test',
    };
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Initiate New Ocular Assessment
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Configure recording protocol parameters, verify informed consent, and initialize a backend
          assessment session.
        </p>
      </div>

      {createdAssessment ? (
        <Card>
          <CardContent className="p-8 space-y-6 text-center">
            <div className="w-12 h-12 bg-teal-50 border border-teal-200 text-teal-700 rounded-md flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Assessment Session Initialized</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Assessment session{' '}
                <code className="font-mono font-semibold text-slate-900">
                  {createdAssessment.assessment_id}
                </code>{' '}
                created for participant{' '}
                <span className="font-mono font-semibold text-slate-900">
                  {selectedPatient?.pseudonymous_code}
                </span>
                .
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-xs text-left max-w-md mx-auto space-y-1.5 font-mono">
              <div>
                <span className="text-slate-500">Protocol:</span>{' '}
                {createdAssessment.protocol_version || PROTOCOL_VERSION}
              </div>
              <div>
                <span className="text-slate-500">Battery:</span> {testType}
              </div>
              <div>
                <span className="text-slate-500">Status:</span> {createdAssessment.status}
              </div>
              <div>
                <span className="text-slate-500">Quality:</span> {createdAssessment.quality_status}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(() => {
                const dest = getCaptureDestination(createdAssessment.assessment_id);
                return (
                  <Link
                    to={dest.path}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md shadow-sm transition-colors duration-150"
                  >
                    <Video className="w-4 h-4" aria-hidden="true" />
                    {dest.label}
                  </Link>
                );
              })()}
              <Button
                variant="secondary"
                onClick={() => {
                  setCreatedAssessment(null);
                  setConsentConfirmed(false);
                }}
              >
                Start Another Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleStartAssessment} className="space-y-6">
          {creationError && <ErrorAlert message={creationError} />}

          {/* Patient Selection Card */}
          <Card>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                  1. Select Participant
                </h2>
                <button
                  type="button"
                  onClick={() => setIsPatientModalOpen(true)}
                  className="text-xs font-semibold text-sky-800 hover:text-sky-900 hover:underline"
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
                <div className="text-center py-6 bg-slate-50 rounded-md border border-dashed border-slate-300">
                  <p className="text-sm text-slate-600 mb-3">
                    No patients available in the database.
                  </p>
                  <Button variant="navy" size="sm" onClick={() => setIsPatientModalOpen(true)}>
                    Create Pseudonymous Record
                  </Button>
                </div>
              ) : (
                <div>
                  <label htmlFor="participant-select" className="sr-only">
                    Select pseudonymous participant
                  </label>
                  <select
                    id="participant-select"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600 bg-white font-mono"
                    required
                  >
                    <option value="" disabled>
                      -- Select Pseudonymous Code --
                    </option>
                    {patients.map((p) => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.pseudonymous_code} (Age Band: {p.age_band || 'Unspecified'})
                      </option>
                    ))}
                  </select>
                  {selectedPatient && (
                    <p className="mt-2 text-xs text-slate-600">
                      Selected:{' '}
                      <strong className="text-slate-900 font-mono">
                        {selectedPatient.pseudonymous_code}
                      </strong>{' '}
                      &bull; Consent Status:{' '}
                      <span className="text-teal-800 font-medium">
                        {selectedPatient.consent_status}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Protocol & Lighting Card */}
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                2. Test Protocol &amp; Environment
              </h2>

              <fieldset>
                <legend className="block text-xs font-medium text-slate-700 mb-2">
                  Evaluation Battery
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3.5 border rounded-md cursor-pointer flex flex-col justify-between text-xs transition-colors duration-150 ${
                      testType === 'both'
                        ? 'border-sky-700 bg-sky-50 text-sky-950 ring-1 ring-sky-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
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
                    <span className="text-slate-600 mt-1">Pupil reflex + Smooth pursuit</span>
                  </label>

                  <label
                    className={`p-3.5 border rounded-md cursor-pointer flex flex-col justify-between text-xs transition-colors duration-150 ${
                      testType === 'pupil_reflex'
                        ? 'border-sky-700 bg-sky-50 text-sky-950 ring-1 ring-sky-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
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
                    <span className="text-slate-600 mt-1">Light stimulus constriction response</span>
                  </label>

                  <label
                    className={`p-3.5 border rounded-md cursor-pointer flex flex-col justify-between text-xs transition-colors duration-150 ${
                      testType === 'smooth_pursuit'
                        ? 'border-sky-700 bg-sky-50 text-sky-950 ring-1 ring-sky-700'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
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
                    <span className="text-slate-600 mt-1">Harmonic moving visual target</span>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label
                    htmlFor="lighting-method-select"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Lighting Calibration Method
                  </label>
                  <select
                    id="lighting-method-select"
                    value={lightingMethod}
                    onChange={(e) => setLightingMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600 bg-white"
                  >
                    <option value="controlled_ambient">Controlled Ambient Office Lighting</option>
                    <option value="calibrated_external_luminaire">
                      Calibrated External Luminaire
                    </option>
                    <option value="screen_stimulus_flash">Screen Stimulus Flash Protocol</option>
                    <option value="natural_diffuse_daylight">Natural Diffuse Daylight</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="lighting-notes-input"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Environment &amp; Setup Notes
                  </label>
                  <input
                    id="lighting-notes-input"
                    type="text"
                    value={lightingNotes}
                    onChange={(e) => setLightingNotes(e.target.value)}
                    placeholder="e.g. Uniform diffuse ambient lighting, no direct backlighting"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent & Safety Confirmation */}
          <Card>
            <CardContent className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-800">
                3. Participant Consent &amp; Safety Disclaimer
              </h2>

              <Alert
                variant="clinical"
                title="Protocol Safety & Device Notice"
                icon={<ShieldAlert className="w-4 h-4 text-slate-700" aria-hidden="true" />}
              >
                This software is an investigational clinical screening-support prototype.
                Measurements recorded are for research benchmarking and longitudinal observation. It
                is not an FDA- or CE-cleared diagnostic medical device.
              </Alert>

              <label className="flex items-start gap-3 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  required
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-sky-700 rounded border-slate-300 focus:ring-sky-600"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong>I verify informed consent:</strong> The participant has given consent to
                  participate in this measurement session, understands the video capture process,
                  and has been informed that this session is non-diagnostic.
                </span>
              </label>
            </CardContent>
          </Card>

          {/* Submission Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => navigate('/patients')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !consentConfirmed || !selectedPatientId}
            >
              {isSubmitting ? (
                'Initializing Session...'
              ) : (
                <>
                  <ClipboardList className="w-4 h-4" aria-hidden="true" />
                  Initialize Assessment Session
                </>
              )}
            </Button>
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
