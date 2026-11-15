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
      <div className={`p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1.5 ${className}`}>
        <h4 className="text-sm font-semibold text-slate-800">Longitudinal Baseline Comparison</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {comparison?.comparability_reason ||
            'No historical baseline is available for comparison. This assessment can serve as the patient’s initial baseline for future visits.'}
        </p>
      </div>
    );
  }

  if (comparison.status === 'not_comparable') {
    return (
      <div className={`p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900 ${className}`}>
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Assessments Not Directly Comparable</span>
        </div>
        <p className="leading-relaxed">
          {comparison.comparability_reason ||
            'Differences in test protocol version, camera resolution, or ambient lighting preclude direct numerical comparison between visits.'}
        </p>
      </div>
    );
  }

  const deltas = comparison.feature_deltas || {};
  const deltaEntries = Object.entries(deltas);

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-700">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Baseline Feature Delta Comparison</h4>
            <p className="text-xs text-slate-500">
              Compared with baseline session:{' '}
              <span className="font-mono font-medium text-slate-800">{comparison.baseline_id || 'Prior Accepted'}</span>
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
          Comparable Protocols
        </span>
      </div>

      {deltaEntries.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2">
          Feature deltas are being processed or are pending backend verification.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5">Feature Metric</th>
                <th className="px-4 py-2.5">Observed Delta (&Delta;)</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {deltaEntries.map(([featKey, deltaObj]) => {
                const formattedKey = featKey
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

                const isNull = deltaObj.delta === null;
                const deltaNum = deltaObj.delta ?? 0;

                return (
                  <tr key={featKey} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-sans font-medium text-slate-900">
                      {formattedKey}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {isNull ? 'Not available' : `${deltaNum > 0 ? '+' : ''}${deltaNum.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-sans">{deltaObj.unit || '—'}</td>
                    <td className="px-4 py-3 font-sans">
                      {isNull ? (
                        <span className="text-slate-400">Unavailable</span>
                      ) : deltaNum > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          Increased
                        </span>
                      ) : deltaNum < 0 ? (
                        <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[11px] font-medium">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          Decreased
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          <Minus className="w-3.5 h-3.5" />
                          Stable
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

      <p className="text-[11px] text-slate-400">
        Feature deltas represent mathematical differences across visits. They are provided as clinical decision support and do not represent a definitive medical diagnosis.
      </p>
    </div>
  );
};
