import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, PlusCircle, FileText } from 'lucide-react';
import { Patient } from '../../types/api';
import { StatusBadge } from '../common/StatusBadge';
import { formatShortDate } from '../../lib/formatters';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

interface PatientCardProps {
  patient: Patient;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const { t } = useTranslation();

  return (
    <div className="panel-ramp p-6 flex flex-col justify-between text-[#0F172A] transition-all duration-150 group">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center font-mono text-[#0F172A] text-xs font-semibold">
              
            </div>
            <div>
              <h4 className="font-semibold text-[#0F172A] font-mono tracking-tight text-base group-hover:text-black transition-colors">
                {patient.pseudonymous_code}
              </h4>
              <p className="text-[10px] font-mono text-[#64748B]">{t('patientsPage.cohortPrefix')} {patient.age_band}</p>
            </div>
          </div>
          <StatusBadge type="consent" status={patient.consent_status} />
        </div>

        {patient.context_notes && (
          <p className="text-xs text-[#475569] line-clamp-2 bg-[#F8FAFC] p-3 rounded-lg font-sans border border-[#E2E8F0] leading-relaxed font-normal">
            {patient.context_notes}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E8F0] text-xs font-mono">
          <div>
            <span className="text-[#64748B] block mb-1 text-[9px] uppercase tracking-wider font-semibold">{t('patientsPage.lastAssessment')}</span>
            <span className="text-[#0F172A] flex items-center gap-1.5 text-[11px] font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#475569]" />
              {formatShortDate(patient.last_assessment_date)}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block mb-1 text-[9px] uppercase tracking-wider font-semibold">{t('patientsPage.qualityGate')}</span>
            <StatusBadge type="quality" status={patient.last_quality_status} />
          </div>
        </div>

        {patient.feature_change_recorded !== undefined && patient.feature_change_recorded !== null && (
          <div className="pt-1 text-xs font-mono">
            <span className="text-[#64748B] block mb-1 text-[9px] uppercase tracking-wider font-semibold">{t('patientsPage.longitudinalDelta')}</span>
            <StatusBadge type="change" status={patient.feature_change_recorded} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 mt-5 border-t border-[#E2E8F0] font-mono text-xs gap-2">
        <Link
          to={`/assessments/new?patientId=${patient.patient_id}`}
          onClick={() => soundFx.playClick()}
          className="inline-flex items-center gap-1.5 text-[#0F172A] hover:underline font-semibold transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{t('patientsPage.newTrial')}</span>
        </Link>
        <div className="flex items-center gap-3">
          {(patient.latest_completed_assessment_id || patient.latest_assessment_id) && (
            <Link
              to={`/assessments/${patient.latest_completed_assessment_id || patient.latest_assessment_id}/report`}
              onClick={() => soundFx.playClick()}
              className="inline-flex items-center gap-1 text-[#0F766E] hover:underline font-semibold transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>REPORT</span>
            </Link>
          )}
          <Link
            to={`/patients/${patient.patient_id}`}
            onClick={() => soundFx.playClick()}
            className="inline-flex items-center gap-1 text-[#475569] hover:text-[#0F172A] font-medium transition-colors group/link"
          >
            <span>{t('patientsPage.trajectory')}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
};
