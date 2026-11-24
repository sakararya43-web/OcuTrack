import React from 'react';
import { AlertCircle, ServerCrash, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../../services/apiClient';
import { soundFx } from '../../lib/soundFx';
import { useTranslation } from '../../i18n';

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
  const { t } = useTranslation();
  const baseUrl = getApiBaseUrl();

  return (
    <div
      className={`rounded-xl p-5 border transition-all ${isUnavailable
        ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#0F172A]'
        : 'bg-[#FEF2F2] border-[#FECACA] text-[#0F172A]'
        } ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`p-2 rounded-lg flex-shrink-0 mt-0.5 ${isUnavailable ? 'bg-[#FEF3C7] text-[#B45309]' : 'bg-[#FEE2E2] text-[#B91C1C]'
            }`}
        >
          {isUnavailable ? (
            <ServerCrash className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <h4 className="text-sm font-semibold tracking-tight">
            {isUnavailable ? t('errors.backendUnavailable') : t('errors.requestError')}
          </h4>
          <p className="text-xs text-[#475569] leading-relaxed font-sans">{message}</p>
          {isUnavailable && (
            <div className="mt-3 text-xs bg-white/80 p-3 rounded-lg border border-[#E2E8F0] space-y-1 text-[#475569] font-mono">
              <p className="font-semibold text-[#0F172A]">{t('errors.connectionDiagnostic')}</p>
              <p>
                {t('errors.targetApi')} <code className="text-[#0F172A] font-mono font-medium">{baseUrl}</code>
              </p>
              <p className="text-[11px] text-[#64748B]">
                {t('errors.runBackendHint')}{' '}
                <code className="text-[#0F172A] font-mono">uvicorn backend.app.main:app --reload --port 8000</code>
              </p>
            </div>
          )}
          {onRetry && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onRetry();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white text-[#0F172A] border border-[#E2E8F0] shadow-sm hover:bg-[#F8FAFC] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {t('errors.retryRequest')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
