import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { User, Shield, ArrowRight, X, AlertCircle } from 'lucide-react';
import { ResQVisionLogo } from '../components/ResQVisionLogo';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

const DISTRICT_OPTIONS = [
  {
    id: 'golaghat',
    label: 'Golaghat, Assam (Flood Warning • 26.40°N, 94.03°E)',
  },
  {
    id: 'kangra',
    label: 'Kangra, Himachal (Earthquake Epicenter • 32.22°N, 76.32°E)',
  },
  {
    id: 'puri',
    label: 'Puri, Odisha (Super Cyclone Alert • 19.81°N, 85.83°E)',
  },
  {
    id: 'andaman',
    label: 'Andaman Sea Rim (Tsunami Surge Alert • 11.62°N, 92.73°E)',
  },
  {
    id: 'marathwada',
    label: 'Beed, Maharashtra (Severe Drought Zone • 18.99°N, 75.76°E)',
  },
  {
    id: 'wayanad',
    label: 'Wayanad, Kerala (Mass Landslide Zone • 11.55°N, 76.13°E)',
  },
];

export function LoginPage({ initialRole = 'citizen', isModal = false, onClose = null, onRoleLoginSuccess = null }) {
  const { isAuthenticated, loginWithCredentials, isLoading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(initialRole); // 'citizen' | 'rescue'
  const [fullName, setFullName] = useState(initialRole === 'citizen' ? 'Ravi Das' : 'NDRF Duty Commander');
  const [email, setEmail] = useState(initialRole === 'citizen' ? 'ravi.das@email.com' : 'commander.ndrf@gov.in');
  const [district, setDistrict] = useState(DISTRICT_OPTIONS[0].label);

  const from = location.state?.from?.pathname || (role === 'rescue' ? '/dispatch' : '/overview');

  React.useEffect(() => {
    if (!isModal && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from, isModal]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const session = loginWithCredentials({
      name: fullName.trim() || (role === 'citizen' ? 'Ravi Das' : 'NDRF Officer'),
      email: email.trim() || 'user@resqvision.gov.in',
      role: role,
      location: district,
      isGoogle: false,
    });

    if (onRoleLoginSuccess) {
      onRoleLoginSuccess(session);
    } else {
      const destination = role === 'rescue' ? '/dispatch' : '/overview';
      navigate(destination, { replace: true });
    }
    if (onClose) onClose();
  };

  const handleGoogleSignIn = () => {
    const session = loginWithCredentials({
      name: role === 'citizen' ? 'Ravi Das' : 'Duty Commander',
      email: role === 'citizen' ? 'ravi.das@gmail.com' : 'commander.gov@gmail.com',
      role: role,
      location: district,
      isGoogle: true,
    });

    if (onRoleLoginSuccess) {
      onRoleLoginSuccess(session);
    } else {
      const destination = role === 'rescue' ? '/dispatch' : '/overview';
      navigate(destination, { replace: true });
    }
    if (onClose) onClose();
  };

  const containerClasses = isModal
    ? 'relative w-full max-w-[440px] rounded-2xl shadow-2xl p-6 sm:p-7 border transition-colors'
    : 'min-h-screen flex flex-col items-center justify-center p-4 relative select-none transition-colors';

  const modalBox = (
    <div
      className={`w-full max-w-[440px] rounded-2xl shadow-2xl relative z-10 p-6 sm:p-7 border transition-all duration-300 ${
        isDark
          ? 'bg-[#12141A] border-[#2B2E3A] text-white shadow-black/80'
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
      }`}
    >
      {/* Top action row: Theme toggle & Close */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle className="scale-90" />
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl border transition ${
              isDark
                ? 'border-[#272A36] text-slate-400 hover:text-white hover:bg-[#1A1D24]'
                : 'border-slate-200 text-slate-500 hover:text-black hover:bg-slate-100'
            }`}
            title="Close login modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Brand & ResQVision Title */}
      <div className="text-center mb-6 pt-1">
        <div className="flex justify-center mb-2.5">
          <ResQVisionLogo size={42} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-1 font-sans">
          ResQVision
        </h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {role === 'rescue'
            ? 'Rescue Team Operational Clearance & Tactical Login'
            : 'National Disaster Intelligence & Citizen Safety Portal'}
        </p>
      </div>

      {/* Role Switcher Pill Bar */}
      <div
        className={`grid grid-cols-2 gap-1.5 p-1 border rounded-xl mb-6 ${
          isDark ? 'bg-[#08090C] border-[#272A36]' : 'bg-slate-100 border-slate-200'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setRole('citizen');
            setFullName('Ravi Das');
            setEmail('ravi.das@email.com');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            role === 'citizen'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-[#161820]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Sign in as Citizen</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('rescue');
            setFullName('NDRF Duty Commander');
            setEmail('commander.ndrf@gov.in');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
            role === 'rescue'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark
              ? 'text-slate-400 hover:text-white hover:bg-[#161820]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Sign in as Rescue Team</span>
        </button>
      </div>

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ravi Das"
            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              isDark
                ? 'bg-[#08090C] border-[#272A36] text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
            required
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ravi.das@email.com"
            className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
              isDark
                ? 'bg-[#08090C] border-[#272A36] text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
            required
          />
        </div>

        <div>
          <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {role === 'citizen' ? 'Your Location / District' : 'Assigned Deployment Sector'}
          </label>
          <div className="relative">
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none cursor-pointer ${
                isDark
                  ? 'bg-[#08090C] border-[#272A36] text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {DISTRICT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.label} className={isDark ? 'bg-[#12141A] text-white' : 'bg-white text-slate-900'}>
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs tracking-wide rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 mt-5"
        >
          <span>
            {role === 'citizen' ? 'Sign In to Citizen Dashboard →' : 'Sign In to Rescue Console →'}
          </span>
        </button>
      </form>

      {/* OR Divider */}
      <div className="relative my-4 flex items-center justify-center">
        <div className={`border-t w-full absolute ${isDark ? 'border-[#272A36]' : 'border-slate-200'}`} />
        <span
          className={`px-3 text-[11px] font-mono relative uppercase ${
            isDark ? 'bg-[#12141A] text-slate-400' : 'bg-white text-slate-500'
          }`}
        >
          OR
        </span>
      </div>

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`w-full py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2.5 text-xs font-semibold border ${
          isDark
            ? 'bg-white hover:bg-slate-100 text-[#1F2937] border-white shadow-sm'
            : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
        }`}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign in with Google</span>
      </button>

      <div className="mt-4 pt-3 border-t text-center border-slate-700/30">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            navigate('/');
          }}
          className={`text-xs font-mono transition hover:underline ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
          }`}
        >
          ← Return to ResQVision Overview & Mission
        </button>
      </div>

      <div className="mt-3 text-center">
        <p className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          ResQVision Project • National Emergency Telemetry Grid
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
        {modalBox}
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 relative select-none transition-colors duration-300 ${
        isDark ? 'bg-[#08090C]' : 'bg-slate-100'
      }`}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#FFFFFF' : '#000000'} 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
      {modalBox}
    </div>
  );
}
