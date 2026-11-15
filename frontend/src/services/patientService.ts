import { apiRequest } from './apiClient';
import { Patient, CreatePatientPayload, AssessmentSummary } from '../types/api';

export async function getPatients(): Promise<Patient[]> {
  return apiRequest<Patient[]>('/api/patients', {
    method: 'GET',
  });
}

export async function getPatient(patientId: string): Promise<Patient> {
  return apiRequest<Patient>(`/api/patients/${encodeURIComponent(patientId)}`, {
    method: 'GET',
  });
}

export async function createPatient(payload: CreatePatientPayload): Promise<Patient> {
  return apiRequest<Patient>('/api/patients', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPatientHistory(patientId: string): Promise<AssessmentSummary[]> {
  return apiRequest<AssessmentSummary[]>(`/api/patients/${encodeURIComponent(patientId)}/history`, {
    method: 'GET',
  });
}
