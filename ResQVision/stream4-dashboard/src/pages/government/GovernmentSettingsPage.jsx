import { useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Save,
  Shield,
  ShieldCheck,
  User
} from 'lucide-react';
import { DemoBadge } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';

export default function GovernmentSettingsPage() {
  const { governmentUser, useMockData } = useAppState();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [criticalSirenSound, setCriticalSirenSound] = useState(true);
  const [satelliteOverlayQuality, setSatelliteOverlayQuality] = useState('high');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = e => {
    e.preventDefault();
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-zinc-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">
              System Settings & Agency Profile
            </h1>
            {useMockData && <DemoBadge label="Demo Configuration" />}
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Authorized command profile, security roles, and console telemetry preferences.
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Preferences updated successfully for current session.
        </div>
      )}

      {/* Agency Officer Profile Card */}
      <div className="glass-dark rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Shield className="h-4 w-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white">Authenticated Officer Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Full Name</span>
            <span className="text-white font-medium text-sm mt-0.5 block">
              {governmentUser?.name || 'Commander Vikram Rao'}
            </span>
          </div>

          <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Official Email</span>
            <span className="text-white font-medium text-sm mt-0.5 block font-mono">
              {governmentUser?.email || 'officer@ndrf.resqvision.local'}
            </span>
          </div>

          <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Department / Agency</span>
            <span className="text-orange-400 font-semibold text-sm mt-0.5 block">
              {governmentUser?.agency || 'NDRF / SDRF'}
            </span>
          </div>

          <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Operational Clearance</span>
            <span className="text-emerald-400 font-semibold text-sm mt-0.5 block flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Level 3 Incident Triage & Dispatch Authorized
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="glass-dark rounded-2xl border border-white/10 p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <Bell className="h-4 w-4 text-orange-400" />
          <h2 className="text-sm font-bold text-white">Console Alerts & Notification Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Incoming SOS Desktop Banner</span>
              <span className="text-[11px] text-zinc-400">
                Display immediate audio/visual notification when a new citizen SOS arrives.
              </span>
            </div>
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={e => setNotificationsEnabled(e.target.checked)}
              className="h-4 w-4 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div>
              <span className="text-xs font-semibold text-white block">Audible High-Priority Alert Tone</span>
              <span className="text-[11px] text-zinc-400">
                Chime on Level-1 distress submissions with 5+ people reported.
              </span>
            </div>
            <input
              type="checkbox"
              checked={criticalSirenSound}
              onChange={e => setCriticalSirenSound(e.target.checked)}
              className="h-4 w-4 accent-orange-500 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div>
              <span className="text-xs font-semibold text-white block">Satellite Imagery Texture Streaming</span>
              <span className="text-[11px] text-zinc-400">
                Resolution quality for Esri World Imagery base maps.
              </span>
            </div>
            <select
              value={satelliteOverlayQuality}
              onChange={e => setSatelliteOverlayQuality(e.target.value)}
              className="rounded-lg bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-orange-500"
            >
              <option value="high">High Resolution (Default)</option>
              <option value="balanced">Balanced / Bandwidth Saver</option>
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition"
          >
            <Save className="h-3.5 w-3.5" />
            Save System Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
