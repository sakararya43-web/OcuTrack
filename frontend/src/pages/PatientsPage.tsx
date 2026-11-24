import React, { useEffect, useState, useMemo } from 'react';
import { Search, PlusCircle } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { PatientCard } from '../components/patients/PatientCard';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { ApiClientError } from '../services/apiClient';
import { soundFx } from '../lib/soundFx';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAgeBand, setSelectedAgeBand] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchPatients = async () => {
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
        setError({ message: 'Failed to load patient records', isUnavailable: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch = !searchQuery.trim() ||
        p.pseudonymous_code.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        p.age_band.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (p.context_notes && p.context_notes.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesBand = selectedAgeBand === 'all' || p.age_band === selectedAgeBand;
      return matchesSearch && matchesBand;
    });
  }, [patients, searchQuery, selectedAgeBand]);

  const ageBands = ['all', '18-29', '30-39', '40-49', '50-59', '60-69', '70+'];

  return (
    <div className="space-y-8 text-[#0F172A]">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
              Participant Cohort Registry
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0F172A] tracking-tight">
            Cohort Data <span className="italic text-[#475569]">Repository</span>
          </h1>
          <p className="text-sm text-[#475569] font-normal font-sans max-w-xl">
            De-identified participant cohorts and longitudinal biometric observation timelines.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            setIsModalOpen(true);
          }}
          className="btn-ramp-primary self-start sm:self-auto text-xs py-2.5 px-4 shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Register Participant</span>
        </button>
      </div>

      {/* Filter and Search Bar (Ramp Style) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by code (e.g. OT-1001)..."
            className="w-full pl-10 pr-4 py-2 text-xs font-mono bg-white border border-[#E2E8F0] rounded-lg text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:border-[#0F172A] transition-colors"
          />
        </div>

        {/* Age Band Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg font-mono text-xs overflow-x-auto">
          {ageBands.map((band) => (
            <button
              key={band}
              type="button"
              onClick={() => {
                soundFx.playHover();
                setSelectedAgeBand(band);
              }}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${selectedAgeBand === band
                ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                : 'text-[#475569] hover:text-[#0F172A]'
                }`}
            >
              {band === 'all' ? 'All Cohorts' : band}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="panel-ramp p-16">
          <LoadingSpinner label="Querying participant directory..." />
        </div>
      ) : error ? (
        <ErrorAlert
          message={error.message}
          isUnavailable={error.isUnavailable}
          onRetry={fetchPatients}
        />
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching participants found' : 'No participants registered'}
          description={
            searchQuery
              ? `No registered participants match "${searchQuery}". Clear your search query or add a new record.`
              : 'Add your first pseudonymous participant to begin capturing ocular biomarker datasets.'
          }
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
              <span>Register First Participant</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.patient_id} patient={patient} />
          ))}
        </div>
      )}

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
