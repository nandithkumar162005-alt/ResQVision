import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert, FileText, CheckCircle2, AlertTriangle, PhoneCall, Scale } from 'lucide-react';
import BrandMark from '../components/shared/BrandMark.jsx';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0D10] text-zinc-100 selection:bg-orange-500/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0E1217]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <BrandMark theme="dark" showTagline />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-mono font-semibold text-orange-400">
            <Scale className="h-3.5 w-3.5" />
            <span>Operational Framework &amp; Usage Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Last Updated: November 2026 | ResQVision Civil Protection Agreement
          </p>
        </div>

        {/* Priority Emergency Callout */}
        <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-200">
          <div className="flex items-start gap-3">
            <PhoneCall className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-bold text-sm text-white">Immediate Life-Threatening Emergency Notice</h2>
              <p className="text-xs leading-relaxed text-amber-200/90">
                ResQVision is an operational intelligence platform. Submission of an SOS through this portal does NOT bypass primary emergency services. In active danger, always immediately call <strong>112 (National Emergency Response System)</strong> or your local fire and police control room.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <ShieldAlert className="h-4 w-4 text-orange-400" />
              1. Non-Autonomous Dispatch Doctrine
            </h2>
            <p>
              ResQVision incorporates artificial intelligence models strictly to parse incoming photographs, evaluate structural damage probabilities, and calculate spatial proximities. Under our core operating charter:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs sm:text-sm">
              <li>No rescue battalion, air reconnaissance sortie, or motorized boat is dispatched autonomously by automated code.</li>
              <li>Every deployment order requires explicit affirmative authorization by an accredited government incident commander.</li>
              <li>Calculations regarding risk scores and inundation forecasts are operational advisories subject to official verification.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              2. Citizen Obligations and SOS Accuracy
            </h2>
            <p>
              Citizens utilizing the ResQVision portal agree to transmit factual, non-falsified location coordinates and incident descriptions. Frivolous, fraudulent, or hoax distress transmissions divert critical national rescue assets during catastrophes and are subject to prosecution under the Disaster Management Act, 2005.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              3. Meteorological Data and Evacuation Corridors
            </h2>
            <p>
              Evacuation lines, route corridors, safe havens, and shelter statuses displayed on the interactive map represent verified field locations coordinated with district administrations. However, dynamic ground conditions (such as sudden flash floods or landslides) may rapidly impact road trafficability. Responders on the ground retain authority over tactical movements.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <FileText className="h-4 w-4 text-blue-400" />
              4. Volunteer Registration Terms
            </h2>
            <p>
              Citizens registering as community volunteers do so with full acknowledgment that registration constitutes civilian support capacity and does not grant official law-enforcement, military, or disaster-response command authority. Volunteer dispatches are overseen by accredited District Disaster Management Authorities.
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-wrap items-center justify-between text-xs text-zinc-500">
          <span>ResQVision Platform: National Disaster Intelligence</span>
          <Link to="/privacy" className="hover:text-orange-400 transition">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
