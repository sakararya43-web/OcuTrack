import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle, Award } from 'lucide-react';
import { LongitudinalComparisonResult } from '../../types/api';
import { Badge } from '../ui/Badge';
import { Alert } from '../ui/Alert';

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
      <div
        className={`p-6 bg-slate-50 border border-slate-200 rounded-md text-center space-y-1.5 ${className}`}
      >
        <h4 className="text-sm font-semibold text-slate-800">Longitudinal Baseline Comparison</h4>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          {comparison?.comparability_reason ||
            'No historical baseline is available for comparison. This assessment can serve as the patient’s initial baseline for future visits.'}
        </p>
      </div>
    );
  }

  if (comparison.status === 'not_comparable') {
    return (
      <Alert
        variant="clinical"
        title="Assessments Not Directly Comparable"
        icon={<AlertCircle className="w-4 h-4 text-slate-700" aria-hidden="true" />}
        className={className}
      >
        {comparison.comparability_reason ||
          'Differences in test protocol version, camera resolution, or ambient lighting preclude direct numerical comparison between visits.'}
      </Alert>
    );
  }

  const deltas = comparison.feature_deltas || {};
  const deltaEntries = Object.entries(deltas);

  return (
    <div className={`bg-white border border-slate-200 rounded-md p-5 shadow-sm space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-sky-50 border border-sky-200 text-sky-800">
            <Award className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Baseline Feature Delta Comparison
            </h4>
            <p className="text-xs text-slate-500">
              Compared with baseline session:{' '}
              <span className="font-mono font-medium text-slate-800">
                {comparison.baseline_id || 'Prior Accepted'}
              </span>
            </p>
          </div>
        </div>

        <Badge variant="teal">Comparable Protocols</Badge>
      </div>

      {deltaEntries.length === 0 ? (
        <p className="text-xs text-slate-500 py-2">
          Feature deltas are being processed or are pending backend verification.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="px-4 py-2.5">Feature Metric</th>
                <th className="px-4 py-2.5">Absolute Delta</th>
                <th className="px-4 py-2.5">Percent Change</th>
                <th className="px-4 py-2.5">Unit</th>
                <th className="px-4 py-2.5">Direction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {deltaEntries.map(([featKey, deltaObj]) => {
                const formattedKey = featKey
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

                const isNull = deltaObj.delta === null;
                const deltaNum = deltaObj.delta ?? 0;
                const pctDelta = deltaObj.percentage_delta;

                return (
                  <tr key={featKey} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-sans font-medium text-slate-900">
                      {formattedKey}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {isNull
                        ? 'Not available'
                        : `${deltaNum > 0 ? '+' : ''}${deltaNum.toFixed(2)}`}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {pctDelta !== null && pctDelta !== undefined
                        ? `${pctDelta > 0 ? '+' : ''}${pctDelta.toFixed(1)}%`
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-sans">
                      {deltaObj.unit || '-'}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      {isNull ? (
                        <span className="text-slate-500">Unavailable</span>
                      ) : deltaNum > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-900 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                          Increased
                        </span>
                      ) : deltaNum < 0 ? (
                        <span className="inline-flex items-center gap-1 text-teal-900 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          <ArrowDownRight className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                          Decreased
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          <Minus className="w-3.5 h-3.5" aria-hidden="true" />
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

      <p className="text-[11px] text-slate-500">
        Feature deltas represent mathematical differences across visits. They are provided as
        clinical decision support and do not represent a definitive medical diagnosis.
      </p>
    </div>
  );
};
