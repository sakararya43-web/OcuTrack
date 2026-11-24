import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle, Award } from 'lucide-react';
import { LongitudinalComparisonResult } from '../../types/api';

interface BaselineComparisonViewProps {
  comparison?: LongitudinalComparisonResult | null;
  className?: string;
}

export const BaselineComparisonView: React.FC<BaselineComparisonViewProps> = ({
  comparison,
  className = '',
}) => {
  if (!comparison || comparison.status === 'not_available') {
    return (
      <div className={`p-8 bg-white rounded-xl border border-[#E2E8F0] text-center space-y-2 font-mono ${className}`}>
        <h4 className="text-xs uppercase tracking-wider text-[#0F172A] font-semibold">Longitudinal Baseline Comparison</h4>
        <p className="text-xs text-[#475569] max-w-md mx-auto font-sans font-normal">
          {comparison?.comparability_reason ||
            'No historical baseline is available for comparison. This assessment can serve as the patient’s initial baseline for future visits.'}
        </p>
      </div>
    );
  }

  if (comparison.status === 'not_comparable') {
    return (
      <div className={`p-5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl space-y-2 text-xs text-[#0F172A] font-mono ${className}`}>
        <div className="flex items-center gap-2 font-semibold text-[#B91C1C]">
          <AlertCircle className="w-4 h-4 text-[#B91C1C]" />
          <span>Assessments Not Directly Comparable</span>
        </div>
        <p className="leading-relaxed font-sans font-normal text-[#475569]">
          {comparison.comparability_reason ||
            'Differences in test protocol version, camera resolution, or ambient lighting preclude direct numerical comparison between visits.'}
        </p>
      </div>
    );
  }

  const deltas = comparison.feature_deltas || {};
  const deltaEntries = Object.entries(deltas);

  return (
    <div className={`panel-ramp p-6 space-y-4 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-3 gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#F1F5F9] text-[#0F172A] rounded-md border border-[#E2E8F0]">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold text-[#0F172A]">Baseline Feature Delta Comparison</h4>
            <p className="text-xs font-mono text-[#475569]">
              Compared with baseline session:{' '}
              <span className="font-semibold text-[#0F172A]">{comparison.baseline_id || 'Prior Accepted'}</span>
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F0FDF4] text-[#0F766E] border border-[#BBF7D0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E]" />
          Comparable Test Protocols
        </span>
      </div>

      {deltaEntries.length === 0 ? (
        <p className="text-xs text-[#475569] font-mono py-2">
          No individual feature delta values computed for this session comparison.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">Biomarker Feature</th>
                <th className="py-2.5 px-4 font-semibold text-right">Absolute Delta (Δ)</th>
                <th className="py-2.5 px-4 font-semibold text-right">Trajectory Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {deltaEntries.map(([key, item]) => {
                const isIncreased = item.direction === 'increased';
                const isDecreased = item.direction === 'decreased';
                const isNull = item.delta === null;
                const deltaNum = item.delta ?? 0;
                const sign = deltaNum > 0 ? '+' : '';

                return (
                  <tr key={key} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#0F172A] capitalize font-sans text-xs">
                      {key.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      {isNull ? (
                        <span className="text-[#64748B]">Not available</span>
                      ) : (
                        <span
                          className={
                            Math.abs(deltaNum) > 0.1
                              ? isIncreased
                                ? 'text-[#B45309]'
                                : 'text-[#0F172A]'
                              : 'text-[#475569]'
                          }
                        >
                          <span>{sign}{deltaNum.toFixed(2)}</span>
                          {item.unit ? <span className="text-[#64748B] font-normal text-[11px] ml-1">{item.unit}</span> : null}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isNull ? (
                        <span className="text-[#64748B]">Unavailable</span>
                      ) : isIncreased ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309]">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Increased</span>
                        </span>
                      ) : isDecreased ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F172A]">
                          <ArrowDownRight className="w-3.5 h-3.5 text-[#475569]" />
                          <span>Decreased</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F766E]">
                          <Minus className="w-3.5 h-3.5 text-[#0F766E]" />
                          <span>Stable</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
