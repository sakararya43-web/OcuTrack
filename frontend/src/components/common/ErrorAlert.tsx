import React from 'react';
import { AlertCircle, ServerCrash, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../../services/apiClient';

interface ErrorAlertProps {
  message: string;
  isUnavailable?: boolean;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  isUnavailable = false,
  onRetry,
  className = '',
}) => {
  const baseUrl = getApiBaseUrl();

  return (
    <div
      className={`rounded-lg p-5 border ${
        isUnavailable
          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
          : 'bg-rose-50/70 border-rose-200 text-rose-900'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        {isUnavailable ? (
          <ServerCrash className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 space-y-1.5">
          <h4 className="text-sm font-semibold">
            {isUnavailable ? 'Backend Service Unavailable' : 'Request Error'}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
          {isUnavailable && (
            <div className="mt-3 text-xs bg-white/80 p-3 rounded border border-amber-200 space-y-1 text-slate-600">
              <p className="font-medium text-slate-800">Connection Info:</p>
              <p>
                Target API: <code className="text-amber-800 font-mono">{baseUrl}</code>
              </p>
              <p>
                To run Parth&apos;s FastAPI backend, start it via{' '}
                <code className="text-slate-800 font-mono">uvicorn backend.app.main:app --reload --port 8000</code>.
              </p>
            </div>
          )}
          {onRetry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white text-slate-800 border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Request
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
