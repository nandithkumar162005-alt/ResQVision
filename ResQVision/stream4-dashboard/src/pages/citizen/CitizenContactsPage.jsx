import {
  AlertTriangle,
  Building,
  HeartPulse,
  Info,
  Phone,
  PhoneCall,
  Radio,
  Shield,
  ShieldAlert,
  Siren,
  UserCheck
} from 'lucide-react';
import { DemoBadge } from '../../components/shared/UiStates.jsx';
import { useAppState } from '../../context/AppContext.jsx';

const OFFICIAL_HELPLINES = [
  {
    number: '112',
    name: 'National Emergency Response Support System (ERSS)',
    authority: 'Ministry of Home Affairs (MHA)',
    description: 'Unified national emergency helpline for all immediate distress: Police, Fire, Ambulance, and Disaster Response.',
    hours: '24x7 Toll-Free',
    type: 'primary',
    verified: true
  },
  {
    number: '1078',
    name: 'NDMA Central Emergency Operations Centre',
    authority: 'National Disaster Management Authority',
    description: 'National disaster management coordination, cyclone warnings, seismic alerts, and relief logistics.',
    hours: '24x7 Operations',
    type: 'disaster',
    verified: true
  },
  {
    number: '011-24363260',
    name: 'NDRF HQ Operational Control Room',
    authority: 'National Disaster Response Force',
    description: 'Specialized search, rescue, flood boat deployment, and collapsed structure staging HQ.',
    hours: '24x7 Operations Room',
    type: 'disaster',
    verified: true
  },
  {
    number: '1070',
    name: 'SDMA State Emergency Operations Centre (SEOC)',
    authority: 'State Disaster Management Authority',
    description: 'State-level disaster monitoring, district evacuation staging, and civil relief deployment.',
    hours: '24x7 Toll-Free',
    type: 'state',
    verified: true
  },
  {
    number: '1077',
    name: 'DDMA District Emergency Operations Centre',
    authority: 'District Disaster Management Authority',
    description: 'District collectorate relief camps, food drops, water distribution, and local road clearance.',
    hours: '24x7 District Helplines',
    type: 'district',
    verified: true
  },
  {
    number: '108',
    name: 'Emergency Medical & Ambulance Transport',
    authority: 'State Health Department & Emergency Services',
    description: 'Trauma dispatch, urgent hospital admission, and triage transportation.',
    hours: '24x7 Toll-Free',
    type: 'medical',
    verified: true
  },
  {
    number: '101',
    name: 'Fire & Emergency Rescue Services',
    authority: 'State Fire Department',
    description: 'Structural collapse extraction, chemical hazard containment, and flood water pumping.',
    hours: '24x7 Toll-Free',
    type: 'fire',
    verified: true
  },
  {
    number: '1091',
    name: 'Women & Vulnerable Persons Distress Helpline',
    authority: 'Police / Women Safety Cell',
    description: 'Immediate safety and protective escort in relief camps and transit corridors.',
    hours: '24x7 Toll-Free',
    type: 'vulnerable',
    verified: true
  }
];

export default function CitizenContactsPage() {
  const { useMockData, theme } = useAppState();
  const isDark = theme === 'dark';

  return (
    <div className={`max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Emergency Helplines &amp; Contacts
            </h1>
            {useMockData && <DemoBadge theme={isDark ? 'dark' : 'light'} label="Verified Directory" />}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Authoritative, official government emergency response numbers across India.
          </p>
        </div>
        <div className={`rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-2 border ${
          isDark ? 'bg-red-950/40 border-red-500/40 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <PhoneCall className="h-4 w-4 animate-pulse" />
          Immediate Life Threat: Dial 112
        </div>
      </div>

      {/* Primary Emergency Banner */}
      <div className={`rounded-2xl border-2 border-red-500/40 p-5 sm:p-6 shadow-sm ${
        isDark ? 'glass-dark bg-gradient-to-r from-red-950/40 via-orange-950/20 to-transparent text-white' : 'glass-light bg-gradient-to-r from-red-500/10 via-orange-500/10 to-transparent'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shrink-0 shadow-md shadow-red-600/30">
              <Siren className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 font-mono">
                Single Unified National Helpline
              </span>
              <h2 className={`text-xl sm:text-2xl font-extrabold mt-0.5 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Dial 112 (National ERSS)
              </h2>
              <p className={`text-xs mt-1 max-w-lg ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                For immediate life-threatening danger, trapped persons, rapid flood surge, or medical emergencies. ResQVision is an operational support tool; 112 is the statutory dispatch line.
              </p>
            </div>
          </div>

          <a
            href="tel:112"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-red-600/25 transition shrink-0"
          >
            <Phone className="h-4 w-4" />
            Call 112 Directly
          </a>
        </div>
      </div>

      {/* Anti-Hallucination Contact Policy Notice (§9, §62) */}
      <div className={`rounded-2xl border p-4 text-xs space-y-1.5 ${
        isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-zinc-200 bg-zinc-50 text-zinc-600'
      }`}>
        <div className={`flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-zinc-800'}`}>
          <ShieldAlert className="h-4 w-4 text-orange-500" />
          <span>Anti-Hallucination Directory Standard:</span>
        </div>
        <p className="leading-relaxed">
          ResQVision displays only officially gazetted government control-room phone numbers. Private NGO phone numbers, unverified volunteer contact lists, and social-media helpline threads are strictly omitted to protect citizens from fraud and outdated information during disasters.
        </p>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OFFICIAL_HELPLINES.map(item => (
          <div
            key={item.number}
            className={`rounded-xl border p-4 flex flex-col justify-between transition shadow-sm ${
              isDark
                ? 'glass-dark border-white/10 hover:border-orange-500/50 text-white'
                : 'glass-light border-zinc-200/90 hover:border-orange-400/80 text-zinc-900'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-lg font-extrabold text-orange-500">
                  {item.number}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                  isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {item.hours}
                </span>
              </div>

              <h3 className={`text-xs font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>{item.name}</h3>
              <p className={`text-[11px] font-semibold mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{item.authority}</p>
              <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{item.description}</p>
            </div>

            <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-white/10' : 'border-zinc-100'}`}>
              <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-400'}`}>Toll-Free Government Line</span>
              <a
                href={`tel:${item.number.replace(/[^0-9+]/g, '')}`}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  isDark
                    ? 'text-orange-400 bg-orange-500/20 hover:bg-orange-500/30'
                    : 'text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100'
                }`}
              >
                <Phone className="h-3.5 w-3.5" />
                Call Now
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
