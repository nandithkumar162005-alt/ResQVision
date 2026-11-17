import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, FileText, Eye, Database, Clock, Award } from 'lucide-react';
import BrandMark from '../components/shared/BrandMark.jsx';

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-semibold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Official Data Protection Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Effective Date: November 2026 | Disaster Intelligence &amp; Emergency Response Authority
          </p>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Lock className="h-4 w-4 text-orange-400" />
              1. Principles of Operational Emergency Privacy
            </h2>
            <p>
              ResQVision processes citizen information strictly for disaster mitigation, life safety assessment, relief resource allocation, and search-and-rescue mission support. We do not sell, rent, commercialize, or monetize civilian distress submissions or location telemetry under any circumstances.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Eye className="h-4 w-4 text-blue-400" />
              2. Information Captured During Distress Ingestion
            </h2>
            <p>
              When a citizen lodges an Emergency SOS report or requests relief shelter assistance, ResQVision collects the following parameters:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400 text-xs sm:text-sm">
              <li><strong>Geographic Coordinates:</strong> WGS84 GPS latitude and longitude used solely to pinpoint incident location and compute proximity to the nearest disaster zone and safe havens.</li>
              <li><strong>Distress Narrative:</strong> User-supplied details regarding family members trapped, medical urgency, or structural inundation.</li>
              <li><strong>Photographic Evidence:</strong> Uploaded images validated for authenticated magic bytes, stored in cryptographic tamper-evident storage for officer triage.</li>
              <li><strong>Contact Verification:</strong> Mobile contact number used exclusively by responding field battalions (NDRF / SDRF) for rescue corroboration.</li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Database className="h-4 w-4 text-purple-400" />
              3. Role-Based Access Control (RBAC) and Officer Triage
            </h2>
            <p>
              Access to citizen emergency data is strictly restricted to authenticated government responders (NDMA, NDRF, SDMA, and State Emergency Operation Centers). Every access request, photo review, triage decision, and tactical wave dispatch is immutably logged with an officer credential timestamp in the national audit trail.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Clock className="h-4 w-4 text-emerald-400" />
              4. Data Retention &amp; Incident Archive
            </h2>
            <p>
              Active distress records remain in live operational memory until officially marked as "Resolved" or "Evacuated" by a duty commander. Historical incident data is anonymized and archived strictly for meteorological modeling, flood basin risk assessment, and public safety research.
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <Award className="h-4 w-4 text-amber-400" />
              5. Citizen Data Rights &amp; Regulatory Compliance
            </h2>
            <p>
              Under applicable disaster management frameworks and data protection regulations, citizens possess the right to obtain verification receipts (available via PDF-1.4 cryptographically tagged export) and request rectification of incorrect contact coordinates through their localized State Disaster Management Authority (SDMA).
            </p>
          </section>
        </div>

        {/* Footer info */}
        <div className="mt-12 border-t border-white/10 pt-6 flex flex-wrap items-center justify-between text-xs text-zinc-500">
          <span>ResQVision Platform: National Disaster Intelligence</span>
          <Link to="/terms" className="hover:text-orange-400 transition">Terms &amp; Conditions</Link>
        </div>
      </main>
    </div>
  );
}
