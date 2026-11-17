import { useState } from 'react';
import { useSWRConfig } from 'swr';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { apiVerifyAssessment, USE_MOCK_DATA } from '../../services/api.js';

const STATUS_TEXT = {
  received: 'Received: NDRF not yet notified',
  ndrf_notified: 'NDRF notified: waiting for ground confirmation',
  ndrf_confirmed: 'NDRF confirmed: releasing waves 2 to 5',
  fully_dispatched: 'Confirmed and fully dispatched (waves 1 to 5 sent)',
  ndrf_denied: 'NDRF denied: no further waves will be sent'
};

/** Confirm / Deny for the selected event. Only shows the buttons while the event awaits NDRF verification. */
export default function NdrfVerifyPanel({ event }) {
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (USE_MOCK_DATA || !event) return null;

  const status = event.dispatch_status;
  async function decide(confirmed) {
    setBusy(true); setError('');
    try {
      await apiVerifyAssessment(event.event_id, confirmed);
      await mutate('active-disasters');
      await mutate(['dispatch-log', event.event_id]);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="mt-4 rounded-xl border border-zinc-300 bg-white/70 p-3 text-xs dark:border-white/15 dark:bg-white/5" data-testid="ndrf-verify-panel">
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
        <ShieldCheck className="h-3.5 w-3.5" /> NDRF ground verification
      </div>
      <p className="mt-1 text-zinc-700 dark:text-zinc-200" data-testid="ndrf-status">{STATUS_TEXT[status] || status || 'Status not available'}</p>
      {status === 'ndrf_notified' && (
        <div className="mt-2 flex gap-2">
          <button type="button" disabled={busy} onClick={() => decide(true)} data-testid="ndrf-confirm"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Confirm event
          </button>
          <button type="button" disabled={busy} onClick={() => decide(false)} data-testid="ndrf-deny"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 font-bold text-white hover:bg-red-500 disabled:opacity-60">
            <XCircle className="h-3.5 w-3.5" /> Deny
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}
