import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Loader2, ScanSearch, Upload, XCircle } from 'lucide-react';
import BrandMark from '../components/shared/BrandMark.jsx';
import { apiVerifyImage } from '../services/api.js';

const LEVEL = {
  green: { box: 'border-emerald-300 bg-emerald-50 text-emerald-900', Icon: CheckCircle2 },
  amber: { box: 'border-amber-300 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  red: { box: 'border-red-300 bg-red-50 text-red-900', Icon: XCircle },
  grey: { box: 'border-zinc-300 bg-zinc-100 text-zinc-800', Icon: HelpCircle }
};
const STATUS = {
  pass: { label: 'Matches', cls: 'bg-emerald-100 text-emerald-800' },
  fail: { label: 'Does not match', cls: 'bg-red-100 text-red-800' },
  warn: { label: 'Caution', cls: 'bg-amber-100 text-amber-800' },
  info: { label: 'Info', cls: 'bg-zinc-100 text-zinc-700' },
  unavailable: { label: 'Not checked', cls: 'bg-zinc-100 text-zinc-600' }
};
const VERDICT_TEXT = {
  AI_GENERATED: 'AI-generated',
  LIKELY_AI: 'Likely AI-generated',
  UNCERTAIN: 'Cannot tell',
  LIKELY_REAL: 'Likely a real photograph'
};

export default function VerifyImagePage() {
  const [file, setFile] = useState(null);
  const [claim, setClaim] = useState({ claimed_type: '', lat: '', lng: '', taken_at: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (k) => (e) => setClaim((c) => ({ ...c, [k]: e.target.value }));
  const useMyLocation = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => setClaim((c) => ({ ...c, lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5) })),
      () => setError('Could not read your location. Type the latitude and longitude instead.')
    );

  async function run(e) {
    e.preventDefault();
    if (!file) return setError('Choose a photo first.');
    setBusy(true); setError(''); setResult(null);
    try { setResult(await apiVerifyImage(file, claim)); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const lvl = result ? LEVEL[result.summary?.level] || LEVEL.grey : null;
  const input = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none';

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link to="/"><BrandMark theme="light" /></Link>
          <nav className="flex gap-4 text-sm font-semibold text-zinc-600">
            <Link to="/citizen/map" className="hover:text-zinc-900">Citizen Portal</Link>
            <Link to="/government/overview" className="hover:text-zinc-900">Rescue Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-start gap-3">
          <ScanSearch className="mt-1 h-7 w-7 text-orange-600" />
          <div>
            <h1 className="text-2xl font-bold">Verify an image</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Upload any photo. We check whether it looks real or AI-generated, and, if you say where, when and what it shows,
              we compare that claim with real weather (Open-Meteo) and earthquake (USGS) records.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form onSubmit={run} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 p-5 text-center hover:border-orange-400">
              {preview ? <img src={preview} alt="Selected upload" className="max-h-56 rounded-lg object-contain" />
                : (<><Upload className="h-7 w-7 text-zinc-400" /><span className="mt-2 text-sm text-zinc-600">Click to choose a JPEG, PNG or WebP (up to 15 MB)</span></>)}
              <input type="file" accept="image/*" className="hidden" data-testid="verify-file"
                onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setError(''); }} />
            </label>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">What is claimed? <span className="font-normal text-zinc-500">(optional, but needed for the weather / earthquake check)</span></legend>
              <select value={claim.claimed_type} onChange={set('claimed_type')} className={input} aria-label="Claimed event type">
                <option value="">Not specified</option>
                <option value="flood">Flood</option>
                <option value="earthquake">Earthquake</option>
                <option value="storm">Storm / cyclone</option>
                <option value="other">Something else</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Latitude e.g. 17.385" value={claim.lat} onChange={set('lat')} inputMode="decimal" aria-label="Latitude" />
                <input className={input} placeholder="Longitude e.g. 78.487" value={claim.lng} onChange={set('lng')} inputMode="decimal" aria-label="Longitude" />
              </div>
              <button type="button" onClick={useMyLocation} className="text-xs font-semibold text-orange-700 hover:underline">Use my current location</button>
              <input type="date" className={input} value={claim.taken_at} onChange={set('taken_at')} aria-label="Date the photo was taken" />
              <p className="text-xs text-zinc-500">If the photo still has GPS and a capture time inside it, we read those automatically.</p>
            </fieldset>

            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-60">
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : 'Verify image'}
            </button>
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 space-y-2">
                <p>{error}</p>
                {error.includes('waking up') && (
                  <button
                    type="button"
                    onClick={run}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-900 transition"
                  >
                    Retry Now
                  </button>
                )}
              </div>
            )}
          </form>

          <section aria-live="polite" className="space-y-4">
            {!result && !busy && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
                <p className="font-semibold text-zinc-800">How it works</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Reads the file’s hidden data (camera, editing software, AI-tool markers, GPS, time).</li>
                  <li>Measures pixel patterns (noise, frequency, edit traces).</li>
                  <li>Compares your claim with real weather and earthquake records for that place and day.</li>
                </ol>
                <p className="mt-3 text-xs text-zinc-500">Results are evidence, not proof. NDRF ground confirmation always comes first.</p>
              </div>
            )}
            {result && (
              <>
                <div className={`rounded-2xl border p-4 ${lvl.box}`}>
                  <div className="flex items-start gap-2">
                    <lvl.Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold" data-testid="verify-headline">{result.summary?.headline}</p>
                      <p className="mt-1 text-xs opacity-80">{result.summary?.next_step}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Image analysis</h2>
                  <p className="mt-2 text-lg font-bold" data-testid="verify-verdict">{VERDICT_TEXT[result.verdict] || result.label}</p>
                  <p className="text-sm text-zinc-600">AI probability {result.ai_probability}% · confidence {result.confidence}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200">
                    <div className="h-full bg-orange-500" style={{ width: `${result.ai_probability}%` }} />
                  </div>
                  {result.reasons?.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">{result.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  )}
                  <details className="mt-3 text-sm text-zinc-600">
                    <summary className="cursor-pointer font-semibold">Methods used</summary>
                    <ul className="mt-1 list-disc pl-5">{result.methods_used?.map((m, i) => <li key={i}>{m}</li>)}</ul>
                  </details>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Claim vs public records</h2>
                  <p className="mt-2 font-bold" data-testid="verify-context">{result.context?.label}</p>
                  <ul className="mt-3 space-y-3">
                    {result.context?.checks?.map((c) => {
                      const s = STATUS[c.status] || STATUS.info;
                      return (
                        <li key={c.id} className="text-sm">
                          <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                          <span className="font-semibold">{c.title}.</span> <span className="text-zinc-700">{c.detail}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-zinc-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{result.context?.note}</p>
                </div>
                <p className="text-xs text-zinc-500">{result.disclaimer}</p>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
