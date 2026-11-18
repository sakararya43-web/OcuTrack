import React, { useEffect, useState, useMemo } from 'react';
import { Search, PlusCircle, Users } from 'lucide-react';
import { getPatients } from '../services/patientService';
import { Patient } from '../types/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { PatientCard } from '../components/patients/PatientCard';
import { CreatePatientModal } from '../components/patients/CreatePatientModal';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
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
    return patients.filter(
      (p) =>
        p.pseudonymous_code.toLowerCase().includes(q) ||
        (p.age_band && p.age_band.toLowerCase().includes(q)) ||
        (p.context_notes && p.context_notes.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pseudonymous Patient Registry
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            De-identified participant records and personal-baseline monitoring cohorts.
          </p>
        </div>
        <Button variant="navy" onClick={() => setIsModalOpen(true)} className="self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Register Patient
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <label htmlFor="patient-search-input" className="sr-only">
          Filter patients by pseudonymous code, age band, or notes
        </label>
        <Search
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="patient-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by pseudonymous ID (e.g. OT-1001)..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600"
        />
      </div>

      {/* States */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <LoadingSpinner label="Loading patient directory..." />
          </CardContent>
        </Card>
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
          icon={<Users className="w-5 h-5" aria-hidden="true" />}
          action={
            <Button variant="navy" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              Register First Patient
            </Button>
          }
        />
      ) : filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-sm text-slate-600">No patients matched &quot;{searchQuery}&quot;</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-2 text-sky-800"
            >
              Clear filter
            </Button>
          </CardContent>
        </Card>
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
