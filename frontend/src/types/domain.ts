import { Patient, AssessmentSummary } from './api';

export interface PatientFilters {
  searchQuery: string;
}

export interface PatientDetailState {
  patient: Patient | null;
  history: AssessmentSummary[];
  baselineId: string | null;
}

export type NetworkStatus = 'idle' | 'loading' | 'success' | 'error' | 'unavailable';
