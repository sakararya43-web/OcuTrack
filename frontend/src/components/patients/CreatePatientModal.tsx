import React, { useState } from 'react';
import { X, UserPlus, ShieldAlert, Check } from 'lucide-react';
import { createPatient } from '../../services/patientService';
import { Patient, CreatePatientPayload } from '../../types/api';
import { AGE_BANDS } from '../../lib/constants';
import { ApiClientError } from '../../services/apiClient';

interface CreatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patient: Patient) => void;
}

export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pseudonymousCode, setPseudonymousCode] = useState(
    () => `OT-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [ageBand, setAgeBand] = useState<string>('40-49');
  const [contextNotes, setContextNotes] = useState<string>('');
  const [consentGranted, setConsentGranted] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800">
            <UserPlus className="w-5 h-5 text-sky-600" />
            <h3 className="font-semibold text-base">New Pseudonymous Patient</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-sky-50 border border-sky-100 rounded-lg p-3 text-xs text-sky-900 leading-relaxed">
            <strong>Privacy Guarantee:</strong> Do not enter real names, emails, phone numbers, or dates of birth. Use pseudonymous identifiers only.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Pseudonymous Code *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={pseudonymousCode}
                onChange={(e) => setPseudonymousCode(e.target.value)}
                placeholder="e.g. OT-1001"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setPseudonymousCode(`OT-${Math.floor(1000 + Math.random() * 9000)}`)}
                className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md whitespace-nowrap"
              >
                Generate
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">De-identified participant reference identifier.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Age Band *
            </label>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {AGE_BANDS.map((band) => (
                <option key={band} value={band}>
                  {band}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Context Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="e.g. Baseline screening session; room ambient light measured at 300 lux"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 leading-normal">
                <strong>Informed Consent Confirmed:</strong> Participant has been informed of test procedures, video capture parameters, and non-diagnostic research purpose, and has agreed to recording.
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-md shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                'Creating Record...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Patient Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
