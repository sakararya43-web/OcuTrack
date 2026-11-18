import React, { useEffect, useState, useMemo } from 'react';
import { Search, PlusCircle, Users } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { PatientCard } from '../components/patients/PatientCard';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { ApiClientError } from '../services/apiClient';

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; isUnavailable: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) =>
      p.pseudonymous_code.toLowerCase().includes(q) ||
      p.age_band.toLowerCase().includes(q) ||
      (p.context_notes && p.context_notes.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pseudonymous Patient Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            De-identified patient cohorts and longitudinal observation records.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Register Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by pseudonymous ID (e.g. OT-1001)..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
        />
      </div>

      {/* States */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12">
          <LoadingSpinner label="Loading patient directory..." />
        </div>
      ) : error ? (
        <ErrorAlert
          message={error.message}
          isUnavailable={error.isUnavailable}
          onRetry={fetchPatients}
        />
      ) : patients.length === 0 ? (
        <EmptyState
          title="No patients registered"
          description="Register a pseudonymous patient to capture ocular recordings and review longitudinal history."
          icon={<Users className="w-6 h-6" />}
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Register First Patient
            </button>
          }
        />
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">No patients matched &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-xs text-sky-700 hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
