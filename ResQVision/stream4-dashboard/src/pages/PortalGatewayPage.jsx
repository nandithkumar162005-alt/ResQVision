import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle2,
  FileCheck,
  Globe2,
  HeartPulse,
  History,
  Layers,
  Lock,
  LogIn,
  Map as MapIcon,
  MapPin,
  Phone,
  Radio,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sparkles,
  Truck,
  UserCheck,
  Waves
} from 'lucide-react';
import BrandMark from '../components/shared/BrandMark.jsx';
import ResQMap from '../components/shared/ResQMap.jsx';
import { DemoBadge } from '../components/shared/UiStates.jsx';
import { useAppState } from '../context/AppContext.jsx';
import { useActiveDisasters } from '../hooks/useDashboardData.js';

const SUPPORTED_DISASTERS_CATALOG = [
  {
    id: 'flood',
    title: 'Riverine Floods & Cloudbursts',
    badge: 'FLOOD',
    badgeClass: 'bg-sky-600/80 text-white border-sky-400/40',
    image: '/disasters/flood-inundation.jpg',
    description:
      'Continuous torrential downpours exceeding 240mm/hr trigger river breaches across the Godavari and Brahmaputra basins.',
    stat: 'Surge: +3.8m above flood stage',
    statClass: 'text-sky-500 dark:text-sky-400'
  },
  {
    id: 'earthquake',
    title: 'Tectonic Fault Earthquakes',
    badge: 'EARTHQUAKE',
    badgeClass: 'bg-red-600/80 text-white border-red-400/40',
    image: '/disasters/earthquake-damage.jpg',
    description:
      'Shallow crustal ruptures along Himalayan Thrust faults and intraplate Delhi-NCR fault lines causing structural masonry fractures.',
    stat: 'Intensity: M6.2 Richter • Depth 12km',
    statClass: 'text-red-500 dark:text-red-400'
  },
  {
    id: 'cyclone',
    title: 'Very Severe Cyclonic Storms',
    badge: 'CYCLONE',
    badgeClass: 'bg-teal-600/80 text-white border-teal-400/40',
    image: '/disasters/cyclone-whirlpool.jpg',
    description:
      'Destructive oceanic cyclonic vortex with eyewall gale winds reaching 175 km/h, deep ocean whirlpool currents, and torrential rainfall.',
    stat: 'Eyewall: 175 km/h • Storm Maya-26',
    statClass: 'text-teal-600 dark:text-teal-400'
  },
  {
    id: 'tsunami',
    title: 'Coastal Tidal Surges & Tsunamis',
    badge: 'TSUNAMI',
    badgeClass: 'bg-indigo-600/80 text-white border-indigo-400/40',
    image: '/disasters/cyclone-landfall.jpg',
    description:
      'Deep-sea tectonic subduction and intense storm pressure trigger fast-moving sea surges approaching coastal communities.',
    stat: 'Wave Surge: +4.2m Oceanic Crest',
    statClass: 'text-cyan-600 dark:text-cyan-400'
  },
  {
    id: 'landslide',
    title: 'Western Ghats Mountain Landslides',
    badge: 'LANDSLIDE',
    badgeClass: 'bg-amber-600/80 text-white border-amber-400/40',
    image: '/disasters/landslide-debris.jpg',
    description:
      'Torrential cloudbursts trigger slope liquefaction and heavy debris flows severing mountain highways and isolated villages.',
    stat: 'Debris Flow: 48 km/h • 310mm Downpour',
    statClass: 'text-fuchsia-600 dark:text-purple-400'
  },
  {
    id: 'drought',
    title: 'Agricultural Droughts & Heatwaves',
    badge: 'DROUGHT',
    badgeClass: 'bg-yellow-600/80 text-white border-yellow-400/40',
    image: '/disasters/drought-aridity.jpg',
    description:
      'Extreme thermal desiccation, 44°C temperatures, and acute aquifer depletion across the Marathwada and Kutch basins.',
    stat: 'Heat Index: 43.8°C • Moisture -78%',
    statClass: 'text-amber-600 dark:text-amber-400'
  }
];

export default function PortalGatewayPage() {
  const { useMockData, citizenUser, governmentUser } = useAppState();
  const { data: disasterRes, error: disasterError } = useActiveDisasters();
  const disasters = disasterRes?.items || [];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0B0D10] text-zinc-100 selection:bg-orange-500/30">
      {/* Background radial gradients & glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-orange-600/10 blur-[150px]" />
        <div className="absolute top-1/3 -right-40 h-[700px] w-[700px] rounded-full bg-blue-600/10 blur-[180px]" />
        <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[160px]" />
      </div>

      {/* Top Glass Navigation Bar */}
      <header className="glass-dark sticky top-0 z-40 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <BrandMark theme="dark" showTagline />

          {/* Quick nav links & Combined Sign In */}
          <div className="flex items-center gap-3 sm:gap-4">
            <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-zinc-300">
              <a href="#how-it-works" className="hover:text-orange-400 transition">How it Works</a>
              <a href="#two-experiences" className="hover:text-orange-400 transition">Portals</a>
              <a href="#capabilities" className="hover:text-orange-400 transition">Capabilities</a>
              <Link to="/verify" className="font-bold text-orange-400 hover:text-orange-300 transition">Verify Image</Link>
            </nav>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-orange-600/20 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>

            <div className="hidden sm:block">
              {useMockData ? (
                <DemoBadge theme="dark" label="DEMO MODE" />
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  LIVE MODE
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          SECTION 1: HERO
          Split text / satellite map composition, Earth/satellite visual feel
         ========================================================================= */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:pt-14 lg:pb-20">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left Text Column (5 cols) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-300">
              <Globe2 className="h-3.5 w-3.5 text-orange-400" />
              <span>ResQVision Disaster Intelligence</span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
              Disaster Intelligence.{' '}
              <span className="text-orange-500">Faster Response.</span>{' '}
              Safer Communities.
            </h1>

            <p className="text-sm leading-relaxed text-zinc-300 sm:text-base">
              ResQVision delivers real-time hazard intelligence, structured citizen distress reporting, and human-in-the-loop operational response coordination across India.
            </p>

            {/* Action CTAs: Equal Size & High Contrast */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                to={citizenUser ? '/citizen/map' : '/login?role=citizen'}
                className="w-full sm:w-1/2 h-12 flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold px-5 text-sm shadow-lg transition"
              >
                <UserCheck className="h-4 w-4 text-orange-600 shrink-0" />
                <span className="truncate">Enter Citizen Portal</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>

              <Link
                to={governmentUser ? '/government/overview' : '/login?role=government'}
                className="w-full sm:w-1/2 h-12 flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold px-5 text-sm shadow-lg shadow-orange-600/25 transition"
              >
                <ShieldCheck className="h-4 w-4 text-white shrink-0" />
                <span className="truncate">Access Government Command</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>

            {/* Combined Sign In link */}
            <div className="pt-1 text-center sm:text-left">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-orange-400 transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                Have an existing account? Access Unified Sign In &rarr;
              </Link>
            </div>
          </div>

          {/* Right Map Visual Column (7 cols) */}
          <div className="lg:col-span-7">
            <div className="glass-dark overflow-hidden rounded-2xl p-3 border border-white/10 shadow-2xl">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                  <span>National Situational Surveillance Preview</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                  <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                  <span>{disasters.length} Monitored Zone(s)</span>
                </div>
              </div>

              <ResQMap
                theme="dark"
                defaultStyle="dark"
                disasters={disasters}
                heightClass="h-[360px] sm:h-[420px]"
                allowFullscreen={false}
                showHazardOverlayControls
                titleLabel="ResQVision situational map"
              />

              <div className="mt-2.5 px-2 py-1 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Map Layers: USGS Earthquakes • IMD Cyclones • CWC River Gauges</span>
                <span className="text-orange-400/90 font-mono">MapLibre GL Vector</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: HOW RESQVISION WORKS
          Detection / Intelligence -> Assessment -> Human Verification -> Coordinated Response
          Strict human-in-the-loop requirement, no autonomous dispatch
         ========================================================================= */}
      <section id="how-it-works" className="relative z-10 border-t border-white/10 bg-black/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
              Operational Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              How ResQVision Works
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              A transparent, human-in-the-loop disaster intelligence workflow designed for zero false dispatch assurances.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 font-mono font-bold text-sm">
                  01
                </div>
                <Globe2 className="h-5 w-5 text-zinc-500" />
              </div>
              <h3 className="text-sm font-bold text-white">Detection & Intelligence</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Aggregates seismic epicentres, cyclone tracks, and precipitation radar from verified government meteorological sources.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-sm">
                  02
                </div>
                <Waves className="h-5 w-5 text-zinc-500" />
              </div>
              <h3 className="text-sm font-bold text-white">Spatial Assessment</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Applies geographically constrained hazard footprints, affected population exposure estimates, and structural damage layers.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-dark rounded-2xl p-5 border border-orange-500/30 bg-orange-500/5 space-y-3 relative ring-1 ring-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white font-mono font-bold text-sm">
                  03
                </div>
                <UserCheck className="h-5 w-5 text-orange-400" />
              </div>
              <h3 className="text-sm font-bold text-white">Human Officer Verification</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Mandatory human decision:</strong> Officers review citizen photographs, authenticity advisory, and coordinates before any dispatch.
              </p>
            </div>

            {/* Step 4 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/5 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-sm">
                  04
                </div>
                <Truck className="h-5 w-5 text-zinc-500" />
              </div>
              <h3 className="text-sm font-bold text-white">Coordinated Response</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Authorized tasking to NDRF, SDRF, fire, and medical teams with immutable audit logs and verified rescue history updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TWO EXPERIENCES
          Citizen Portal (Light Theme) vs Government / Rescue Portal (Dark Theme)
         ========================================================================= */}
      <section id="two-experiences" className="relative z-10 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
              Role-Separated Portals
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Two Tailored Experiences
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Purpose-built interfaces for affected citizens and authorized government incident commanders.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Experience 1: Citizen Portal */}
            <div className="glass-light rounded-3xl p-6 sm:p-8 text-zinc-900 border border-zinc-200 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-zinc-900">Citizen Portal</h3>
                      <p className="text-xs text-zinc-500">Accessible Light-Themed Safety Interface</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[10px] font-bold text-orange-800 uppercase">
                    Civilian
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mb-6">
                  Empowering citizens with actionable disaster situation maps, verified relief resource finder (shelters, food, water, medical), structured Emergency SOS submission, and official PDF receipts.
                </p>

                <div className="grid grid-cols-2 gap-2.5 text-xs mb-6">
                  <div className="rounded-xl bg-zinc-100/80 p-3 border border-zinc-200/60">
                    <span className="font-semibold text-zinc-800 block text-xs">Interactive Hazard Map</span>
                    <span className="text-[11px] text-zinc-500">Search zones & situation estimates</span>
                  </div>
                  <div className="rounded-xl bg-zinc-100/80 p-3 border border-zinc-200/60">
                    <span className="font-semibold text-zinc-800 block text-xs">Relief Resources</span>
                    <span className="text-[11px] text-zinc-500">Shelters, food, and medical centers</span>
                  </div>
                  <div className="rounded-xl bg-zinc-100/80 p-3 border border-zinc-200/60">
                    <span className="font-semibold text-zinc-800 block text-xs">Emergency SOS Report</span>
                    <span className="text-[11px] text-zinc-500">GPS pin + photo verification</span>
                  </div>
                  <div className="rounded-xl bg-zinc-100/80 p-3 border border-zinc-200/60">
                    <span className="font-semibold text-zinc-800 block text-xs">PDF Submission Receipt</span>
                    <span className="text-[11px] text-zinc-500">Cryptographic proof of distress report</span>
                  </div>
                </div>
              </div>

              <Link
                to={citizenUser ? '/citizen/map' : '/login?role=citizen'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-orange-600 text-white font-bold py-3 text-xs transition shadow-md"
              >
                <span>{citizenUser ? 'Open Citizen Dashboard' : 'Sign In as Citizen'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Experience 2: Government Portal */}
            <div className="glass-dark rounded-3xl p-6 sm:p-8 text-zinc-100 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">Government Command</h3>
                      <p className="text-xs text-zinc-400">High-Contrast Charcoal Tactical Console</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-800 border border-white/10 px-3 py-1 text-[10px] font-bold text-orange-400 uppercase">
                    Authorized RBAC
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
                  Providing authorized emergency officers (NDMA, NDRF, SDMA, Police, Fire, District Admin) with live incident triage, cautious AI image inspection, human operation authorization, and audit logs.
                </p>

                <div className="grid grid-cols-2 gap-2.5 text-xs mb-6">
                  <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="font-semibold text-white block text-xs">Live Tactical Map</span>
                    <span className="text-[11px] text-zinc-400">Damage layers & rescue units</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="font-semibold text-white block text-xs">SOS Incident Queue</span>
                    <span className="text-[11px] text-zinc-400">Officer triage & image inspection</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="font-semibold text-white block text-xs">Authorized Operations</span>
                    <span className="text-[11px] text-zinc-400">Task NDRF & medical units</span>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3 border border-white/5">
                    <span className="font-semibold text-white block text-xs">Verified Rescue History</span>
                    <span className="text-[11px] text-zinc-400">Strictly separated casualty audit</span>
                  </div>
                </div>
              </div>

              <Link
                to={governmentUser ? '/government/overview' : '/login?role=government'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 text-xs transition shadow-lg shadow-orange-600/25"
              >
                <span>{governmentUser ? 'Open Command Console' : 'Sign In as Government Officer'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: SUPPORTED NATURAL DISASTERS
          6 Comprehensive Disaster Classification Cards with Meteorological Telemetry
         ========================================================================= */}
      <section id="disasters-catalog" className="relative z-10 border-t border-white/10 bg-black/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase mb-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>FULL HAZARD CATALOG</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Supported Natural Disasters
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              ResQVision monitors and models all six primary natural disaster classifications with dedicated meteorological telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUPPORTED_DISASTERS_CATALOG.map(disaster => (
              <div
                key={disaster.id}
                className="group overflow-hidden rounded-2xl bg-white text-zinc-900 border border-zinc-200 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  {/* Image with Category Badge */}
                  <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                    <img
                      src={disaster.image}
                      alt={disaster.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    <span
                      className={`absolute top-3 left-3 rounded-md px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase border shadow-md backdrop-blur-md ${disaster.badgeClass}`}
                    >
                      {disaster.badge}
                    </span>
                  </div>

                  {/* Text Content */}
                  <div className="p-5 space-y-2.5">
                    <h3 className="font-display text-base sm:text-lg font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">
                      {disaster.title}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {disaster.description}
                    </p>
                  </div>
                </div>

                {/* Metric / Stat Footer */}
                <div className="px-5 pb-5 pt-2 border-t border-zinc-100">
                  <div className={`text-[11px] font-mono font-semibold ${disaster.statClass}`}>
                    {disaster.stat}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PRODUCT PREVIEW
          Show selected previews: disaster map, resources, Emergency SOS, response workflow
         ========================================================================= */}
      <section id="capabilities" className="relative z-10 border-t border-white/10 bg-black/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Engineered for Accuracy & Speed
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Every feature adheres to the anti-hallucination ground truth contract.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Preview Card 1 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="rounded-xl bg-orange-500/10 p-3 w-fit text-orange-400 mb-3">
                  <MapIcon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Disaster Map & Hazards</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Geographically grounded multi-hazard engine with earthquake epicentres, cyclone tracks, and flood corridors.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
                MapLibre GL Vector • Carto & Esri
              </div>
            </div>

            {/* Preview Card 2 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="rounded-xl bg-blue-500/10 p-3 w-fit text-blue-400 mb-3">
                  <Building className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Relief Resources Finder</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Consistent MAP + LIST pattern for shelters, food depots, medical units, and water supplies near affected zones.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
                Near You Mode • Civil Registry
              </div>
            </div>

            {/* Preview Card 3 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="rounded-xl bg-red-500/10 p-3 w-fit text-red-400 mb-3">
                  <Siren className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Emergency SOS Alert</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  GPS coordinate capture, magic-byte validated photo attachments, and instant downloadable PDF submission receipts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
                PDF-1.4 Spec • Non-Dispatch Disclaimer
              </div>
            </div>

            {/* Preview Card 4 */}
            <div className="glass-dark rounded-2xl p-5 border border-white/10 flex flex-col justify-between">
              <div>
                <div className="rounded-xl bg-emerald-500/10 p-3 w-fit text-emerald-400 mb-3">
                  <History className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Rescue History & Audit</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Strict separation of operational counts from verified casualty records. Immutable officer triage audit trail.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-zinc-500 font-mono">
                Stream 4 Dispatch Log Contract
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FOOTER
          Footer with product information, emergency 112 note, operational disclaimer
         ========================================================================= */}
      <footer className="relative z-10 border-t border-white/10 bg-[#08090C] py-8 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandMark theme="dark" />
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <Link to="/login" className="hover:text-orange-400 transition">Unified Sign In</Link>
              <Link to="/verify" className="hover:text-orange-400 transition">Verify an Image</Link>
              <Link to="/citizen/volunteer" className="hover:text-orange-400 transition">Volunteer With Us</Link>
              <Link to="/citizen/safety" className="hover:text-orange-400 transition">Safety Information</Link>
              <Link to="/privacy" className="hover:text-orange-400 transition">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-orange-400 transition">Terms &amp; Conditions</Link>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-amber-200/90 text-[11px] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Operational Disclaimer:</strong> ResQVision is an AI-powered operational decision-support tool. It does NOT possess autonomous emergency dispatch authority. A citizen SOS submission registers distress information for authorized human officer review. In any life-threatening emergency, dial <strong>112 (National Emergency Response Support System)</strong> directly.
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-4 text-[11px] text-zinc-600">
            <span>&copy; {new Date().getFullYear()} ResQVision Project. All rights reserved.</span>
            <span>Version 1.0.0 (Layer 4 Advanced Glassmorphism Release)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
