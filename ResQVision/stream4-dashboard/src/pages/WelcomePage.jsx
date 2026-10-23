import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Radio,
  Users,
  Compass,
  CloudRain,
  Activity,
  Wind,
  Sun,
  Waves,
  Mountain,
  LogIn,
  AlertTriangle,
  ArrowRight,
  Eye,
  CheckCircle2,
  ExternalLink,
  Shield,
  LifeBuoy,
  Cpu,
  Layers,
  MapPin,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { ResQVisionLogo } from '../components/ResQVisionLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../auth/AuthProvider';
import { useTheme } from '../context/ThemeContext';
import { LoginPage } from '../auth/LoginPage';
import { formatNumber } from '../utils/formatters';

export function WelcomePage() {
  const { isDark } = useTheme();
  const { isAuthenticated, isRescueTeam, logout } = useAuth();
  const navigate = useNavigate();

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalRole, setLoginModalRole] = useState('citizen');

  const handleOpenLogin = (role = 'citizen') => {
    setLoginModalRole(role);
    setShowLoginModal(true);
  };

  const PRIMARY_DISASTERS = [
    {
      title: 'Riverine Floods & Cloudbursts',
      tag: 'FLOOD',
      image: '/disasters/flood-inundation.jpg',
      description: 'Continuous torrential downpours exceeding 240mm/hr trigger river breaches across the Godavari and Brahmaputra basins.',
      metric: 'Surge: +3.8m above flood stage',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    },
    {
      title: 'Tectonic Fault Earthquakes',
      tag: 'EARTHQUAKE',
      image: '/disasters/earthquake-damage.jpg',
      description: 'Shallow crustal ruptures along Himalayan Thrust faults and intraplate Delhi-NCR fault lines causing structural masonry fractures.',
      metric: 'Intensity: M6.2 Richter • Depth 12km',
      color: 'text-red-400 border-red-500/30 bg-red-500/10',
    },
    {
      title: 'Very Severe Cyclonic Storms',
      tag: 'CYCLONE',
      image: '/disasters/cyclone-whirlpool.jpg',
      description: 'Destructive oceanic cyclonic vortex with eyewall gale winds reaching 175 km/h, deep ocean whirlpool currents, and torrential rainfall.',
      metric: 'Eyewall: 175 km/h • Storm Maya-26',
      color: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
    },
    {
      title: 'Coastal Tidal Surges & Tsunamis',
      tag: 'TSUNAMI',
      image: '/disasters/cyclone-landfall.jpg',
      description: 'Deep-sea tectonic subduction and intense storm pressure trigger fast-moving sea surges approaching coastal communities.',
      metric: 'Wave Surge: +4.2m Oceanic Crest',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    },
    {
      title: 'Western Ghats Mountain Landslides',
      tag: 'LANDSLIDE',
      image: '/disasters/landslide-debris.jpg',
      description: 'Torrential cloudbursts trigger slope liquefaction and heavy debris flows severing mountain highways and isolated villages.',
      metric: 'Debris Flow: 48 km/h • 310mm Downpour',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    },
    {
      title: 'Agricultural Droughts & Heatwaves',
      tag: 'DROUGHT',
      image: '/disasters/drought-aridity.jpg',
      description: 'Extreme thermal desiccation, 44°C temperatures, and acute aquifer depletion across the Marathwada and Kutch basins.',
      metric: 'Heat Index: 43.8°C • Moisture -78%',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 select-none ${
        isDark ? 'bg-[#08090C] text-white' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* 1. TOP AUTHORITATIVE HEADER */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          isDark ? 'bg-[#0E1015]/95 border-[#20232E]' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <ResQVisionLogo className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black tracking-tight">ResQVision</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  NATIONAL PLATFORM
                </span>
              </div>
              <p className={`text-[11px] truncate hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Unified Natural Disaster Early Warning & Rescue Coordination Grid
              </p>
            </div>
          </div>

          {/* Navigation Anchors & Auth Controls */}
          <div className="flex items-center gap-3">
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono">
              <a href="#what-is-resqvision" className="hover:text-blue-400 transition">
                What Is ResQVision
              </a>
              <a href="#use-cases" className="hover:text-blue-400 transition">
                Use Cases
              </a>
              <a href="#disasters" className="hover:text-blue-400 transition">
                Disasters Covered
              </a>
            </nav>

            <ThemeToggle />

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(isRescueTeam ? '/rescue' : '/overview')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition ${
                    isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-black'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Enter {isRescueTeam ? 'Rescue Console' : 'Citizen Portal'}</span>
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-mono transition border ${
                    isDark
                      ? 'border-[#272A36] text-slate-400 hover:text-white hover:bg-[#1E212B]'
                      : 'border-slate-300 text-slate-600 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenLogin('citizen')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isDark
                      ? 'border-[#2A2E3D] text-slate-300 hover:text-white hover:bg-[#181B24]'
                      : 'border-slate-300 text-slate-700 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  Citizen Portal
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenLogin('rescue')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition ${
                    isDark
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Rescue Team Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH USER GLOBE GRAPHIC */}
      <section className={`relative overflow-hidden py-12 sm:py-20 border-b ${isDark ? 'border-slate-800/40 bg-[#06070B]' : 'border-slate-200 bg-slate-50'}`}>
        {/* Subtle Ambient Globe Backdrop */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: "url('/disasters/welcome-globe.jpg')" }}
        />
        <div className={`absolute inset-0 pointer-events-none ${
          isDark
            ? 'bg-gradient-to-r from-[#06070B] via-[#06070B]/90 to-transparent'
            : 'bg-gradient-to-r from-slate-50 via-slate-50/90 to-transparent'
        }`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Mission & Core Value */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>OFFICIAL NATURAL DISASTER RESPONSE ARCHITECTURE</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Unified Disaster Early Warning & Rapid Tactical Relief Network
              </h1>

              <p className={`text-base sm:text-lg leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                ResQVision bridges the critical <strong>0–180 minute golden hour window</strong> between catastrophic disaster onset—cyclones, cloudburst floods, earthquakes, tsunamis, landslides, and droughts—and life-saving emergency rescue deployment.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated) navigate('/overview');
                    else handleOpenLogin('citizen');
                  }}
                  className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Enter Citizen Portal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isAuthenticated && isRescueTeam) navigate('/dispatch');
                    else handleOpenLogin('rescue');
                  }}
                  className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition border ${
                    isDark
                      ? 'bg-red-600/20 hover:bg-red-600/30 border-red-500/40 text-red-200'
                      : 'bg-red-50 hover:bg-red-100 border-red-300 text-red-700'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Rescue Team Command Console</span>
                </button>
              </div>

              {/* Key Highlights Quick Bullets */}
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t text-xs font-mono ${isDark ? 'border-slate-800/40 text-slate-300' : 'border-slate-200 text-slate-700'}`}>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>1-Epicenter Precision</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Radar ShakeMap Contours</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Zero Commercial API Cost</span>
                </div>
              </div>
            </div>

            {/* Right Column: Globe Visual (User Graphic) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 sm:w-88 max-w-full">
                {/* Atmosphere Glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/40 via-cyan-500/30 to-indigo-500/30 blur-3xl transform scale-110 pointer-events-none" />

                {/* Earth Globe Image */}
                <div className="relative rounded-full overflow-hidden border-4 border-cyan-400/30 shadow-[0_0_50px_rgba(37,99,235,0.35)] aspect-square bg-[#050811]">
                  <img
                    src="/disasters/welcome-globe.jpg"
                    alt="ResQVision Planetary Natural Disaster Surveillance Globe"
                    className="w-full h-full object-cover transform hover:scale-105 transition duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Floating Disaster Badges */}
                <div className="absolute -bottom-3 -left-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-red-500/40 text-red-300 text-xs font-mono font-bold shadow-xl flex items-center gap-2 backdrop-blur-md">
                  <Activity className="w-4 h-4 text-red-400 animate-pulse" />
                  <span>M6.2 Seismic Faults</span>
                </div>

                <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-teal-500/40 text-teal-300 text-xs font-mono font-bold shadow-xl flex items-center gap-2 backdrop-blur-md">
                  <Wind className="w-4 h-4 text-teal-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>175 km/h Cyclones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION: WHAT RESQVISION ACTUALLY IS */}
      <section id="what-is-resqvision" className={`py-16 sm:py-24 border-b ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-blue-500 font-bold flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              <span>Core Identity & Mission</span>
            </h2>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              What ResQVision Actually Is
            </h3>
            <p className={`text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              ResQVision is an <strong>authoritative disaster operational telemetry platform</strong> built to solve the failure of communication between affected citizens, early-warning meteorological networks, and tactical rescue taskforces.
            </p>
          </div>

          {/* 3 Core Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20 font-bold font-mono">
                01
              </div>
              <h4 className="text-base font-bold mb-2">Single Epicenter Clarity</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Standard platforms clutter incident maps with dozens of overlapping pins. ResQVision enforces <strong>strictly ONE primary epicenter mark per state</strong>, surrounded by 4-band radar intensity contours to instantly convey ground reality.
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20 font-bold font-mono">
                02
              </div>
              <h4 className="text-base font-bold mb-2">Two Synchronized Portals</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                A public-facing <strong>Citizen Portal</strong> for direct emergency SOS beacons, shelter routing, and safety checklists; and an authenticated <strong>Rescue Team Console</strong> for multi-wave NDRF dispatch, drone recon, and boat deployments.
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 font-bold font-mono">
                03
              </div>
              <h4 className="text-base font-bold mb-2">Zero Commercial API Reliance</h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Built with zero external API dependencies or commercial keys. Maps, spatial projections, and disaster simulations operate seamlessly in disconnected, disaster-struck regions with full Dark/Light theme adaptability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: EVERY USE CASE DETAILED */}
      <section id="use-cases" className={`py-16 sm:py-24 border-b ${isDark ? 'bg-[#0A0C10] border-slate-800/40' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-red-500 font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Operational Capabilities</span>
            </h2>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Comprehensive Platform Use Cases
            </h3>
            <p className={`text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Every tool and view in ResQVision serves a precise tactical or humanitarian function during natural disaster events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Use Case 1 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold">1. Citizen Emergency SOS & Shelter Routing</h4>
                  <span className="text-[10px] font-mono text-blue-500 font-bold uppercase">Citizen Portal Core Feature</span>
                </div>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Enables trapped residents to broadcast emergency SOS requests tagged with exact GPS latitude and longitude coordinates. Automatically calculates driving and walking routes to the nearest certified cyclone storm shelters, elevated relief schools, and medical trauma centers.
              </p>
              <ul className={`space-y-1.5 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                  <span>Immediate GPS-based SOS beacon broadcast</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                  <span>Offline-ready safety advisories for all 6 disasters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-500" />
                  <span>Official IMD and CWC alert bulletin streaming</span>
                </li>
              </ul>
            </div>

            {/* Use Case 2 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold">2. Multi-Wave Tactical Rescue Dispatch</h4>
                  <span className="text-[10px] font-mono text-red-500 font-bold uppercase">Rescue Team Command Feature</span>
                </div>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Empowers NDRF Duty Commanders and State Disaster Management Authorities to coordinate staged operations: Wave 1 (Rapid Motorboat / Helicopter Extraction), Wave 2 (Field Surgical & Triage Squads), and Wave 3 (Air-Dropped Rations and Potable Water Supplies).
              </p>
              <ul className={`space-y-1.5 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-red-500" />
                  <span>Real-time wave status logging (Confirmed, Delivered)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-red-500" />
                  <span>Equipment readiness tracking (Inflatable boats, Bailey bridges)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-red-500" />
                  <span>Inter-agency telemetry: Navy, Coast Guard, ITBP & Army</span>
                </li>
              </ul>
            </div>

            {/* Use Case 3 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold">3. Multi-Band Radar & ShakeMap Contours</h4>
                  <span className="text-[10px] font-mono text-amber-500 font-bold uppercase">GIS Spatial Intelligence</span>
                </div>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Visualizes real-time Doppler radar reflectivity and seismic ShakeMap intensity rings (Red Core, Orange Severe, Yellow Moderate, Green Monitored) around primary event epicenters, providing commanders with immediate spatial hazard boundaries.
              </p>
              <ul className={`space-y-1.5 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500" />
                  <span>4-level concentric hazard intensity contours</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500" />
                  <span>Live animated rain streaks, wind spirals & seismic pulses</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-amber-500" />
                  <span>Multi-layer base maps: Satellite, Terrain, Street, Dark</span>
                </li>
              </ul>
            </div>

            {/* Use Case 4 */}
            <div
              className={`p-6 rounded-2xl border transition-all ${
                isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold">4. Drone Aerial Recon & Damage Scoring</h4>
                  <span className="text-[10px] font-mono text-purple-500 font-bold uppercase">Tactical Verification</span>
                </div>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Integrates authenticated drone reconnaissance imagery with automated structural damage scoring (0–100 scale), allowing teams to classify zones into Destroyed, Major Damage, or Supervised without manual field surveys.
              </p>
              <ul className={`space-y-1.5 text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500" />
                  <span>Aerial drone reconnaissance image dossier</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500" />
                  <span>Exposed population estimation by sector</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-500" />
                  <span>Damage score breakdown by incident classification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECTION: SUPPORTED DISASTERS (REAL CURATED IMAGES) */}
      <section id="disasters" className={`py-16 sm:py-24 border-b ${isDark ? 'border-slate-800/40' : 'border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Full Hazard Catalog</span>
            </h2>
            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Supported Natural Disasters
            </h3>
            <p className={`text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              ResQVision monitors and models all six primary natural disaster classifications with dedicated meteorological telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRIMARY_DISASTERS.map((disaster, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] flex flex-col ${
                  isDark ? 'bg-[#12141A] border-[#222530]' : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Real Disaster Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={disaster.image}
                    alt={disaster.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${disaster.color}`}>
                      {disaster.tag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-base font-bold mb-1.5">{disaster.title}</h4>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {disaster.description}
                    </p>
                  </div>

                  <div className={`pt-3 border-t text-[11px] font-mono font-bold ${disaster.color.split(' ')[0]}`}>
                    {disaster.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. READY TO RESPOND CALL TO ACTION */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div
            className={`rounded-3xl p-8 sm:p-12 border text-center space-y-6 relative overflow-hidden ${
              isDark ? 'bg-[#10131A] border-[#272A36]' : 'bg-white border-slate-200 shadow-xl'
            }`}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <ResQVisionLogo className="w-8 h-8" />
            </div>

            <h3 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to Coordinate or Request Relief?
            </h3>

            <p className={`max-w-2xl mx-auto text-sm sm:text-base leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Select your role to access immediate shelter advisories, emergency SOS transmission, or multi-wave tactical dispatch command.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated) navigate('/overview');
                  else handleOpenLogin('citizen');
                }}
                className={`px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition ${
                  isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Launch Citizen Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isAuthenticated && isRescueTeam) navigate('/dispatch');
                  else handleOpenLogin('rescue');
                }}
                className={`px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition ${
                  isDark ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Rescue Team Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. GOVERNMENT PARTNER AUTHORITIES BANNER & FOOTER */}
      <section className={`border-t py-10 transition-colors ${
        isDark ? 'bg-[#050608] border-[#1E212B]' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="text-center space-y-1">
            <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              National Disaster Management Agencies & Meteorological Partners
            </span>
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
              Multi-agency data feeds & emergency command integration (NDMA, IMD, CWC, INCOIS, FSI, DGRE / DRDO)
            </p>
          </div>

          {/* User's First Image: Partner Logos Banner on Black / White Background */}
          <div className={`p-4 sm:p-6 rounded-2xl border shadow-xl flex items-center justify-center overflow-hidden transition-colors ${
            isDark ? 'bg-black border-[#272A36]' : 'bg-white border-slate-300'
          }`}>
            <img
              src="/disasters/gov-partners-banner.png"
              alt="Government of India - National Disaster Management Authority, IMD, Central Water Commission, INCOIS, FSI, DRDO DGRE, Emergency Helpline 1078"
              className="max-h-24 sm:max-h-28 w-auto object-contain select-none"
            />
          </div>
        </div>
      </section>

      {/* FOOTER WITH ALL RIGHTS RESERVED */}
      <footer
        className={`border-t py-8 transition-colors ${
          isDark ? 'bg-[#0A0C10] border-[#1E212B] text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ResQVisionLogo className="w-5 h-5" />
            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>ResQVision Project</span>
            <span>• Stream 4 Operational Command</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              © 2026 ResQVision. All Rights Reserved.
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-500">
              National Disaster Response Architecture
            </span>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <LoginPage
          isModal={true}
          initialRole={loginModalRole}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
