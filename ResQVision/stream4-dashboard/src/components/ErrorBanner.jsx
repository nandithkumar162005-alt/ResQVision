import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

export function ErrorBanner({ error, onRetry, isRetrying = false }) {
  if (!error) return null;

  const isNetworkFailure = error.code === 'NETWORK_FAILURE' || error.code === 'TIMEOUT';
  const isMalformed = error.code === 'MALFORMED_JSON';

  let title = 'Dispatch service unavailable — retrying';
  let message = 'Unable to establish link with Stream 3 backend. Showing cached observations if available.';

  if (isMalformed) {
    title = 'Malformed Stream 3 response format';
    message = 'Backend returned data that does not match expected JSON contract. Please verify backend output.';
  } else if (error.status) {
    title = `Stream 3 HTTP ${error.status} Error`;
    message = error.message || 'The dispatch server responded with an error status.';
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12141A] border border-amber-500/40 text-amber-200 mb-6 shadow-md">
      <div className="flex items-start gap-3">
        {isNetworkFailure ? (
          <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <h4 className="text-sm font-semibold text-amber-300 font-mono tracking-wide uppercase">
            {title}
          </h4>
          <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
            {message}
          </p>
          {import.meta.env.DEV && error.details && (
            <div className="mt-1.5 text-[11px] font-mono text-amber-300/70 truncate max-w-xl">
              Details: {typeof error.details === 'object' ? JSON.stringify(error.details) : String(error.details)}
            </div>
          )}
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Re-establishing link...' : 'Retry Handshake'}</span>
        </button>
      )}
    </div>
  );
}
