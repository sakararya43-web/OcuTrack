import React, { useEffect, useState } from 'react';
import { UserPlus, ShieldAlert, Check } from 'lucide-react';
import { createPatient } from '../../services/patientService';
import { Patient, CreatePatientPayload } from '../../types/api';
import { AGE_BANDS } from '../../lib/constants';
import { ApiClientError } from '../../services/apiClient';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

function generatePseudonymousCode(): string {
  return `OT-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pseudonymousCode, setPseudonymousCode] = useState<string>(generatePseudonymousCode);
  const [ageBand, setAgeBand] = useState<string>('40-49');
  const [contextNotes, setContextNotes] = useState<string>('');
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPseudonymousCode(generatePseudonymousCode());
      setContextNotes('');
      setConsentGranted(true);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = pseudonymousCode.trim();
    if (!cleanCode) {
      setError('Please provide a pseudonymous patient code.');
      return;
    }

    if (!consentGranted) {
      setError('Participant consent confirmation is required before registration.');
      return;
    }

    setIsSubmitting(true);

    const payload: CreatePatientPayload = {
      pseudonymous_code: cleanCode,
      age_band: ageBand,
      context_notes: contextNotes.trim() ? contextNotes.trim() : null,
      consent: {
        consent_status: 'granted',
        purpose: 'hackathon_demo_evaluation',
      },
    };

    try {
      const patient = await createPatient(payload);
      onSuccess(patient);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create patient record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="New Pseudonymous Patient"
      titleId="create-patient-dialog-title"
      icon={<UserPlus className="w-5 h-5 text-sky-700" aria-hidden="true" />}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <Alert
            variant="destructive"
            icon={<ShieldAlert className="w-4 h-4 text-rose-700" aria-hidden="true" />}
          >
            {error}
          </Alert>
        )}

        <Alert variant="info">
          <strong>Privacy Guarantee:</strong> Do not enter real names, emails, phone numbers, or
          dates of birth. Use pseudonymous identifiers only.
        </Alert>

        <div>
          <label
            htmlFor="patient-code-input"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Pseudonymous Code *
          </label>
          <div className="flex gap-2">
            <input
              id="patient-code-input"
              type="text"
              required
              value={pseudonymousCode}
              onChange={(e) => setPseudonymousCode(e.target.value)}
              placeholder="e.g. OT-1001"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600 font-mono"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPseudonymousCode(generatePseudonymousCode())}
              className="whitespace-nowrap"
            >
              Generate
            </Button>
          </div>
          <p className="mt-1 text-xs text-slate-500">De-identified participant reference identifier.</p>
        </div>

        <div>
          <label
            htmlFor="patient-age-band-select"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Age Band *
          </label>
          <select
            id="patient-age-band-select"
            value={ageBand}
            onChange={(e) => setAgeBand(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600 bg-white"
          >
            {AGE_BANDS.map((band) => (
              <option key={band} value={band}>
                {band}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="patient-context-notes"
            className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
          >
            Context Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <textarea
            id="patient-context-notes"
            rows={2}
            value={contextNotes}
            onChange={(e) => setContextNotes(e.target.value)}
            placeholder="e.g. Baseline screening session; room ambient light measured at 300 lux"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
          />
        </div>

        <div className="pt-3 border-t border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentGranted}
              onChange={(e) => setConsentGranted(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-sky-700 rounded border-slate-300 focus:ring-sky-600"
            />
            <span className="text-xs text-slate-700 leading-relaxed">
              <strong>Informed Consent Confirmed:</strong> Participant has been informed of test
              procedures, video capture parameters, and non-diagnostic research purpose, and has
              agreed to recording.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              'Creating Record...'
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                Save Patient Record
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
