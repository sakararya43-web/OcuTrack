import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, ChevronRight, PlusCircle } from 'lucide-react';
import { Patient } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';
import { Card, CardContent } from '../ui/Card';
import { formatShortDate } from '../../lib/formatters';

interface PatientCardProps {
  patient: Patient;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <User className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 font-mono text-sm">
                  {patient.pseudonymous_code}
                </h3>
                <p className="text-xs text-slate-500">
                  Age Band: {patient.age_band || 'Unspecified'}
                </p>
              </div>
            </div>
            <StatusBadge type="consent" status={patient.consent_status} />
          </div>

          {patient.context_notes && (
            <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 border border-slate-200 p-2.5 rounded">
              {patient.context_notes}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Last Assessment</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                {formatShortDate(patient.last_assessment_date)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Quality Status</span>
              <StatusBadge type="quality" status={patient.last_quality_status} />
            </div>
          </div>

          {patient.feature_change_recorded !== undefined && patient.feature_change_recorded !== null && (
            <div className="pt-1 text-xs">
              <span className="text-slate-500 block mb-0.5">Observed Delta</span>
              <StatusBadge type="change" status={patient.feature_change_recorded} />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
          <Link
            to={`/assessments/new?patientId=${patient.patient_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-800 hover:text-sky-900 hover:underline transition-colors duration-150"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            New Test
          </Link>
          <Link
            to={`/patients/${patient.patient_id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline transition-colors duration-150"
          >
            View Profile
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
