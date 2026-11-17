import { useEffect } from 'react';
import { AlertTriangle, Inbox, RefreshCw, X } from 'lucide-react';

export function DemoBadge({ theme = 'light', label = '' }) {
  // Demo text removed across UI as requested
  return null;
}

export function SimulationBadge({ theme = 'light', label = 'Simulation' }) {
  const isDark = theme === 'dark';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        isDark
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
          : 'border-amber-300 bg-amber-100/70 text-amber-900'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
      {label}
    </span>
  );
}

export function SourceBadge({ source = 'Civil Registry', theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono ${
        isDark
          ? 'bg-white/5 text-zinc-400 border border-white/10'
          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
      }`}
    >
      <span>Source:</span>
      <span className={isDark ? 'text-zinc-200' : 'text-zinc-800'}>{source}</span>
    </span>
  );
}

export function FreshnessIndicator({ timestamp, label, theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${
        isDark ? 'text-zinc-400' : 'text-zinc-500'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span>{label || (timestamp ? new Date(timestamp).toLocaleTimeString() : 'Fresh')}</span>
    </span>
  );
}

export function StatusBadge({ status = 'active', theme = 'light' }) {
  const isDark = theme === 'dark';
  const s = String(status).toLowerCase();
  let color = isDark
    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
    : 'bg-zinc-100 text-zinc-700 border-zinc-200';

  if (s.includes('completed') || s.includes('verified') || s.includes('success')) {
    color = isDark
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (s.includes('progress') || s.includes('auth') || s.includes('notified')) {
    color = isDark
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (s.includes('reject') || s.includes('denied') || s.includes('unsuccessful')) {
    color = isDark
      ? 'bg-red-500/20 text-red-300 border-red-500/40'
      : 'bg-red-50 text-red-800 border-red-200';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${color}`}
    >
      {status}
    </span>
  );
}

export function VerificationBadge({ verification = 'pending', theme = 'light' }) {
  const isDark = theme === 'dark';
  const v = String(verification).toLowerCase();
  let label = 'Pending Verification';
  let style = isDark
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-amber-50 text-amber-800 border-amber-200';

  if (v === 'verified') {
    label = 'Verified by Officer';
    style = isDark
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (v === 'rejected') {
    label = 'Rejected with Reason';
    style = isDark
      ? 'bg-red-500/15 text-red-300 border-red-500/30'
      : 'bg-red-50 text-red-800 border-red-200';
  } else if (v === 'unverified') {
    label = 'Unverified Civilian Report';
    style = isDark
      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
      : 'bg-zinc-100 text-zinc-600 border-zinc-200';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

export function LoadingSkeleton({ theme = 'light', rows = 3, variant = 'list' }) {
  const isDark = theme === 'dark';
  const base = isDark ? 'bg-zinc-800' : 'bg-zinc-200/80';
  const card = isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-white';

  if (variant === 'map') {
    return (
      <div
        className={`flex h-[440px] w-full animate-pulse items-center justify-center rounded-2xl border ${card}`}
        aria-busy="true"
        aria-label="Loading map"
      >
        <div className="space-y-3 text-center">
          <div className={`mx-auto h-8 w-8 rounded-full ${base}`} />
          <div className={`mx-auto h-3 w-44 rounded ${base}`} />
          <div className={`mx-auto h-2 w-32 rounded ${base}`} />
        </div>
      </div>
    );
  }

  if (variant === 'metrics') {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-busy="true">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className={`animate-pulse rounded-xl border p-4 ${card}`}>
            <div className={`h-3 w-20 rounded ${base}`} />
            <div className={`mt-3 h-7 w-14 rounded ${base}`} />
            <div className={`mt-2 h-2.5 w-28 rounded ${base}`} />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'timeline') {
    return (
      <div className="space-y-4 p-2" aria-busy="true">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-start gap-3 animate-pulse">
            <div className={`h-4 w-4 rounded-full mt-1 shrink-0 ${base}`} />
            <div className={`flex-1 rounded-xl border p-3 ${card} space-y-2`}>
              <div className={`h-3.5 w-1/3 rounded ${base}`} />
              <div className={`h-2.5 w-3/4 rounded ${base}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`rounded-xl border ${card} overflow-hidden animate-pulse`} aria-busy="true">
        <div className={`h-9 border-b ${isDark ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-100'}`} />
        <div className="divide-y divide-zinc-200/10 p-2 space-y-2">
          {Array.from({ length: rows }).map((_, idx) => (
            <div key={idx} className="flex justify-between py-2">
              <div className={`h-3 w-24 rounded ${base}`} />
              <div className={`h-3 w-32 rounded ${base}`} />
              <div className={`h-3 w-16 rounded ${base}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'incident' || variant === 'resource') {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className={`animate-pulse rounded-xl border p-4 ${card} space-y-2.5`}>
            <div className="flex justify-between">
              <div className={`h-3.5 w-1/3 rounded ${base}`} />
              <div className={`h-3 w-16 rounded ${base}`} />
            </div>
            <div className={`h-2.5 w-3/4 rounded ${base}`} />
            <div className="pt-2 border-t border-zinc-200/10 flex justify-between">
              <div className={`h-2 w-20 rounded ${base}`} />
              <div className={`h-2 w-12 rounded ${base}`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className={`animate-pulse rounded-xl border p-4 ${card}`}>
          <div className={`h-4 w-2/5 rounded ${base}`} />
          <div className={`mt-2.5 h-3 w-4/5 rounded ${base}`} />
        </div>
      ))}
    </div>
  );
}

export function LoadingState({ label = 'Loading...', theme = 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${
        isDark ? 'text-zinc-400' : 'text-zinc-600'
      }`}
    >
      <RefreshCw className="h-6 w-6 animate-spin text-orange-500 mb-2" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

export function EmptyState({ theme = 'light', icon: Icon = Inbox, title, description, action }) {
  const isDark = theme === 'dark';
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center ${
        isDark ? 'border-charcoal-700 bg-charcoal-900/60' : 'border-zinc-300 bg-zinc-50/70'
      }`}
    >
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
          isDark ? 'bg-charcoal-800 text-zinc-400' : 'bg-zinc-200/80 text-zinc-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`text-sm font-semibold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
        {title}
      </h3>
      {description && (
        <p className={`mt-1 max-w-md text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ theme = 'light', title = 'Data unavailable', message, onRetry }) {
  const isDark = theme === 'dark';
  return (
    <div
      role="alert"
      className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        isDark
          ? 'border-red-500/40 bg-red-950/30 text-red-200'
          : 'border-red-200 bg-red-50 text-red-900'
      }`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className={`mt-0.5 text-xs ${isDark ? 'text-red-200/80' : 'text-red-700'}`}>
            {message}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
            isDark
              ? 'border-red-400/40 bg-red-900/40 text-red-100 hover:bg-red-900/70'
              : 'border-red-300 bg-white text-red-800 hover:bg-red-100'
          }`}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

export function ModalDialog({
  open,
  onClose,
  title,
  subtitle,
  theme = 'light',
  maxWidth = 'max-w-2xl',
  children
}) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = event => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  const isDark = theme === 'dark';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px] transition-opacity"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rv-modal-title"
        className={`relative max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl p-5 shadow-2xl transition-all sm:p-6 ${
          isDark
            ? 'glass-dark text-zinc-100'
            : 'glass-light text-zinc-900'
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-current/10 pb-3.5">
          <div>
            {subtitle && (
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isDark ? 'text-orange-400' : 'text-orange-600'
                }`}
              >
                {subtitle}
              </p>
            )}
            <h2 id="rv-modal-title" className="mt-0.5 text-lg font-bold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className={`rounded-lg p-1.5 transition ${
              isDark
                ? 'text-zinc-400 hover:bg-charcoal-800 hover:text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
