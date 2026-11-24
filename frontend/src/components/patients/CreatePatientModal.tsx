import React, { useState } from 'react';
import { X, UserPlus, ShieldAlert } from 'lucide-react';
import { createPatient } from '../../services/patientService';
import { Patient, CreatePatientPayload } from '../../types/api';
import { AGE_BANDS } from '../../lib/constants';
import { ApiClientError } from '../../services/apiClient';
import { soundFx } from '../../lib/soundFx';

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
      setError('Please provide a pseudonymous participant code.');
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
      soundFx.playSuccess();
      onSuccess(patient);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to register participant record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-xl max-w-lg w-full p-6 shadow-ramp-dropdown space-y-5 animate-fade-in text-[#0F172A]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-sans text-base font-semibold text-[#0F172A]">Register Participant Record</h3>
              <p className="text-xs text-[#64748B] font-mono">
                De-identified pseudonymous cohort registration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#B91C1C]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pseudonymous Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#475569] uppercase tracking-wider font-semibold">
              Pseudonymous Code *
            </label>
            <input
              type="text"
              required
              value={pseudonymousCode}
              onChange={(e) => setPseudonymousCode(e.target.value)}
              placeholder="e.g. OT-1001"
              className="w-full px-3 py-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:bg-white"
            />
            <p className="text-[11px] text-[#64748B]">
              Must not contain names, MRNs, dates of birth, or direct identifiers.
            </p>
          </div>

          {/* Age Band */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#475569] uppercase tracking-wider font-semibold">
              Age Band *
            </label>
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:bg-white"
            >
              {AGE_BANDS.map((band) => (
                <option key={band} value={band}>
                  {band}
                </option>
              ))}
            </select>
          </div>

          {/* Context Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-[#475569] uppercase tracking-wider font-semibold">
              Context Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={contextNotes}
              onChange={(e) => setContextNotes(e.target.value)}
              placeholder="Non-identifying research context (e.g. Baseline assessment prior to task protocol)..."
              className="w-full px-3 py-2 text-xs font-sans bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#0F172A] focus:outline-none focus:border-[#0F172A] focus:bg-white"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentGranted}
                onChange={(e) => setConsentGranted(e.target.checked)}
                className="mt-0.5 accent-[#0F172A] rounded"
              />
              <span className="text-xs text-[#475569] leading-normal font-sans">
                <strong className="text-[#0F172A] font-medium">Verify informed participant consent:</strong> The subject understands that video frames are processed ephemerally, only mathematical metrics are retained, and that this evaluation is non-diagnostic.
              </span>
            </label>
          </div>

          {/* Notice */}
          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg flex items-start gap-2 text-xs text-[#475569] leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
            <span>Investigational software. Strictly for research observation and non-diagnostic tracking.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-ramp-secondary text-xs py-2 px-3.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !consentGranted}
              className="btn-ramp-primary text-xs py-2 px-4 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Registering...' : 'Register Participant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
