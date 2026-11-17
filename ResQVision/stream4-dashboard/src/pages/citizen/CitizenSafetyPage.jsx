import { useState } from 'react';
import { PhoneCall, ShieldAlert } from 'lucide-react';
import { useAppState } from '../../context/AppContext.jsx';
import { HAZARD_SAFETY_REFERENCES } from '../../data/mockData.js';

export default function CitizenSafetyPage() {
  const { theme } = useAppState();
  const isDark = theme === 'dark';
  const [selectedHazardId, setSelectedHazardId] = useState(HAZARD_SAFETY_REFERENCES[0].id);
  const current =
    HAZARD_SAFETY_REFERENCES.find(h => h.id === selectedHazardId) || HAZARD_SAFETY_REFERENCES[0];

  return (
    <div className={`mx-auto max-w-5xl space-y-5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      <div>
        <h1 className={`font-display text-xl font-bold sm:text-2xl ${isDark ? 'text-white' : 'text-zinc-900'}`}>
          Safety Information
        </h1>
        <p className={`mt-0.5 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Verified India National Emergency access and hazard-specific preparedness reference.
        </p>
      </div>

      <div className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
        isDark ? 'border-amber-500/30 bg-amber-950/30 text-amber-300' : 'border-amber-300/80 bg-amber-50/90 text-amber-950'
      }`}>
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p>
          <strong>Placeholder Reference Notice:</strong> ResQVision is not connected to a live
          official alert publishing feed or offline SMS gateway. Always follow official orders from
          NDMA, SDMA, IMD, and District Administration.
        </p>
      </div>

      {/* One-Tap National Emergency Contact + Honest Directory Status */}
      <section className={`rounded-2xl p-4 sm:p-5 border ${
        isDark ? 'glass-dark border-white/10 text-white' : 'glass-light border-zinc-200 text-zinc-900'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <PhoneCall className="h-4 w-4 text-red-500" />
              India National Emergency Response (ERSS)
            </h2>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              Verified unified emergency helpline across India for police, fire, ambulance, and
              disaster distress.
            </p>
          </div>
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-mono text-sm font-bold text-white shadow-sm transition hover:bg-red-700"
          >
            <PhoneCall className="h-4 w-4" />
            Call 112 Now
          </a>
        </div>

        <div className={`mt-4 rounded-xl border p-3 text-xs ${
          isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-zinc-200/80 bg-white/70 text-zinc-600'
        }`}>
          <strong>Local District / State / Rescue Directory:</strong> A verified district and state
          emergency directory has not been configured for this environment yet. Do not rely on
          unverified numbers; contact <strong>112</strong> or your local civil administration.
        </div>
      </section>

      {/* Hazard Selector + Prepared Instructions */}
      <section className={`rounded-2xl p-4 sm:p-6 border ${
        isDark ? 'glass-dark border-white/10 text-white' : 'glass-light border-zinc-200 text-zinc-900'
      }`}>
        <div className={`flex flex-wrap gap-2 border-b pb-4 ${isDark ? 'border-white/10' : 'border-zinc-200/70'}`}>
          {HAZARD_SAFETY_REFERENCES.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedHazardId(item.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                item.id === current.id
                  ? isDark
                    ? 'border-orange-500 bg-orange-600 text-white font-bold shadow-sm'
                    : 'border-zinc-900 bg-zinc-900 text-white'
                  : isDark
                  ? 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10'
                  : 'border-zinc-200 bg-white/75 text-zinc-700 hover:bg-white'
              }`}
            >
              {item.hazard}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-500 font-mono">
            {current.referenceSource}
          </p>
          <h2 className={`mt-1 font-display text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{current.hazard}</h2>
          <ul className="mt-3 space-y-2.5">
            {current.steps.map((stepText, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm border ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-zinc-200'
                    : 'border-zinc-200/60 bg-white/70 text-zinc-800'
                }`}
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                  isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700'
                }`}>
                  {idx + 1}
                </span>
                <span>{stepText}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
