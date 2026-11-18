import React from 'react';
import { AlertCircle, ServerCrash, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../../services/apiClient';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

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
      role="alert"
      className={cn(
        'rounded-md p-5 border',
        isUnavailable
          ? 'bg-slate-100 border-slate-300 text-slate-900'
          : 'bg-rose-50 border-rose-200 text-rose-950',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {isUnavailable ? (
          <ServerCrash className="w-5 h-5 text-slate-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        ) : (
          <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        )}
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-semibold text-slate-900">
            {isUnavailable ? 'Backend Service Unavailable' : 'Request Error'}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
          {isUnavailable && (
            <div className="mt-2 text-xs bg-white p-3 rounded border border-slate-200 space-y-1 text-slate-600">
              <p className="font-semibold text-slate-800">Connection Info</p>
              <p>
                Target API: <code className="text-sky-800 font-mono">{baseUrl}</code>
              </p>
              <p>
                Start the FastAPI backend via{' '}
                <code className="text-slate-900 font-mono">
                  uvicorn backend.app.main:app --reload --port 8000
                </code>
                .
              </p>
            </div>
          )}
          {onRetry && (
            <div className="pt-1">
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Retry Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
