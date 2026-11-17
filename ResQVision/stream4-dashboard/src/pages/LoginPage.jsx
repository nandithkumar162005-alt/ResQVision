import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
  Shield,
  ShieldAlert,
  User,
  UserCheck
} from 'lucide-react';
import BrandMark from '../components/shared/BrandMark.jsx';
import { DemoBadge } from '../components/shared/UiStates.jsx';
import { useAppState } from '../context/AppContext.jsx';

const ALLOWED_AGENCIES = [
  'NDMA / State Disaster Management Authority (SDMA)',
  'NDRF / SDRF',
  'District Administration',
  'Police',
  'Fire and Emergency Services',
  'Medical and Health Department',
  'Relief Organization (Authorized)'
];

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { loginCitizen, registerCitizen, loginGovernment, useMockData } = useAppState();

  const initialRole = searchParams.get('role') === 'government' ? 'government' : 'citizen';
  const [activeRole, setActiveRole] = useState(initialRole);

  // Sync state with URL if query param changes
  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'government' || r === 'citizen') {
      setActiveRole(r);
    }
  }, [searchParams]);

  // Citizen form state
  const [citizenMode, setCitizenMode] = useState('login'); // 'login' | 'register'
  const [citName, setCitName] = useState('');
  const [citEmail, setCitEmail] = useState('');
  const [citPassword, setCitPassword] = useState('');

  // Government form state
  const [govEmail, setGovEmail] = useState('');
  const [govPassword, setGovPassword] = useState('');
  const [govAgency, setGovAgency] = useState(ALLOWED_AGENCIES[1]); // Default NDRF / SDRF

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = role => {
    setActiveRole(role);
    setSearchParams({ role });
    setError('');
  };

  const fillCitizenDemo = () => {
    setCitizenMode('login');
    setCitName('Ananya Verma');
    setCitEmail('citizen@resqvision.local');
    setCitPassword('CitizenDemo!2026');
    setError('');
  };

  const fillGovDemo = () => {
    setGovEmail('officer@ndrf.resqvision.local');
    setGovPassword('OfficerDemo!2026');
    setGovAgency('NDRF / SDRF');
    setError('');
  };

  const handleCitizenSubmit = async e => {
    e.preventDefault();
    setError('');

    if (citizenMode === 'register' && (!citName.trim() || citName.trim().length < 2)) {
      setError('Please enter your full name.');
      return;
    }
    if (!citEmail.trim() || !citEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!citPassword || citPassword.length < (citizenMode === 'register' ? 8 : 4)) {
      setError(
        citizenMode === 'register'
          ? 'Password must be at least 8 characters long.'
          : 'Please enter your password.'
      );
      return;
    }

    setBusy(true);
    try {
      if (citizenMode === 'register') {
        await registerCitizen({ name: citName.trim(), email: citEmail.trim(), password: citPassword });
      } else {
        await loginCitizen({ email: citEmail.trim(), password: citPassword });
      }
      navigate('/citizen/map', { replace: true });
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setBusy(false);
    }
  };

  const handleGovSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!govEmail.trim() || !govEmail.includes('@')) {
      setError('Please provide a valid authorized government email.');
      return;
    }
    if (!govPassword || govPassword.length < 4) {
      setError('Please enter your official password.');
      return;
    }
    if (!govAgency) {
      setError('Please select your authorized agency.');
      return;
    }

    setBusy(true);
    try {
      await loginGovernment({
        email: govEmail.trim(),
        password: govPassword,
        agency: govAgency
      });
      navigate('/government/overview', { replace: true });
    } catch (err) {
      setError(err?.message || 'Government sign-in failed. Verify agency credentials.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#0C0F14] text-zinc-100 selection:bg-orange-500/30">
      {/* Background radial gradient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-orange-600/10 blur-[130px]" />
        <div className="absolute top-1/2 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <BrandMark theme="dark" />
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Welcome Landing
        </Link>
      </header>

      {/* Main Content Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md glass-dark rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
          {/* Title and Anti-Hallucination Disclaimer */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">ResQVision Unified Sign In</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Disaster Intelligence & Response Support Gateway
            </p>
            {useMockData && (
              <div className="mt-2.5 flex justify-center">
                <DemoBadge label="Development / Simulation Auth" />
              </div>
            )}
          </div>

          {/* Portal Switcher Tabs */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange('citizen')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                activeRole === 'citizen'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Citizen Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('government')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                activeRole === 'government'
                  ? 'bg-zinc-800 text-orange-400 ring-1 ring-orange-500/50 shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              Government Command
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* CITIZEN PORTAL LOGIN / REGISTER */}
          {activeRole === 'citizen' && (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-xs font-medium text-zinc-400">
                  {citizenMode === 'login' ? 'Existing Citizen Account' : 'Register New Citizen Profile'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode(m => (m === 'login' ? 'register' : 'login'));
                    setError('');
                  }}
                  className="text-xs font-medium text-orange-400 hover:text-orange-300 transition"
                >
                  {citizenMode === 'login' ? 'Create an account' : 'Already registered? Sign In'}
                </button>
              </div>

              <form onSubmit={handleCitizenSubmit} className="space-y-4">
                {citizenMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={citName}
                        onChange={e => setCitName(e.target.value)}
                        placeholder="e.g., Ananya Verma"
                        className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={citEmail}
                      onChange={e => setCitEmail(e.target.value)}
                      placeholder="citizen@resqvision.local"
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={citPassword}
                      onChange={e => setCitPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {citizenMode === 'register' && (
                    <p className="mt-1 text-[11px] text-zinc-500">Minimum 8 characters required.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition disabled:opacity-50"
                >
                  {busy ? 'Authenticating...' : citizenMode === 'register' ? 'Register Profile & Enter' : 'Sign In as Citizen'}
                </button>
              </form>

              {/* Citizen Demo Fill */}
              <div className="mt-5 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={fillCitizenDemo}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 transition"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Quick Fill Test Citizen Credentials
                </button>
              </div>

              {/* Anti-Hallucination Disclaimer Notice */}
              <div className="mt-4 rounded-xl bg-orange-500/5 border border-orange-500/20 p-2.5 text-[11px] text-orange-300/80 leading-relaxed">
                <strong>Safety Notice:</strong> An SOS submission registers your distress report for official government review. It does NOT guarantee automatic or immediate rescue dispatch. In immediate peril, dial 112.
              </div>
            </div>
          )}

          {/* GOVERNMENT COMMAND PORTAL LOGIN */}
          {activeRole === 'government' && (
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-medium text-zinc-400">
                  Authorized Agency Verification
                </span>
                <span className="text-[11px] text-orange-400">Strict RBAC</span>
              </div>

              <form onSubmit={handleGovSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Agency / Department</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <select
                      value={govAgency}
                      onChange={e => setGovAgency(e.target.value)}
                      className="w-full rounded-xl bg-[#14181F] border border-white/10 pl-9 pr-3 py-2 text-xs text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    >
                      {ALLOWED_AGENCIES.map(ag => (
                        <option key={ag} value={ag} className="bg-[#14181F] text-white">
                          {ag}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={govEmail}
                      onChange={e => setGovEmail(e.target.value)}
                      placeholder="officer@ndrf.resqvision.local"
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Official Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={govPassword}
                      onChange={e => setGovPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-10 py-2 text-sm text-white placeholder-zinc-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-orange-600 hover:bg-orange-500 active:bg-orange-700 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition disabled:opacity-50"
                >
                  {busy ? 'Verifying Agency...' : 'Sign In to Government Command'}
                </button>
              </form>

              {/* Gov Demo Fill */}
              <div className="mt-5 border-t border-white/5 pt-4">
                <button
                  type="button"
                  onClick={fillGovDemo}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 py-2 text-xs font-medium text-orange-400 hover:text-orange-300 transition"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Quick Fill Test Officer Credentials
                </button>
              </div>

              {/* Human-in-the-Loop Operational Mandate */}
              <div className="mt-4 rounded-xl bg-blue-500/5 border border-blue-500/20 p-2.5 text-[11px] text-blue-300/80 leading-relaxed">
                <strong>Human-in-the-Loop Protocol:</strong> ResQVision provides decision intelligence only. All operations, NDRF dispatch escalations, and tactical dispatches require authorized human officer verification.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-zinc-600 border-t border-white/5">
        ResQVision Operational Decision Support Platform • Anti-Hallucination Verified Baseline
      </footer>
    </div>
  );
}
