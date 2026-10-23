import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ease-out select-none group cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isDark
          ? 'bg-[#12141A] hover:bg-[#1C1F28] border-[#272A36] hover:border-slate-400 text-slate-300 hover:text-white focus:ring-white shadow-md hover:shadow-white/5'
          : 'bg-white hover:bg-slate-100 border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 focus:ring-slate-900 shadow-sm hover:shadow-md'
      } ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label={`Toggle theme: Currently ${theme} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon (displayed in dark mode to switch to light, or vice-versa) */}
        <Sun
          className={`w-4 h-4 transition-all duration-300 transform ${
            isDark
              ? 'opacity-0 rotate-90 scale-50 absolute'
              : 'opacity-100 rotate-0 scale-100 text-amber-500 group-hover:rotate-45'
          }`}
        />
        {/* Moon Icon */}
        <Moon
          className={`w-4 h-4 transition-all duration-300 transform ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-slate-200 group-hover:-rotate-12 group-hover:scale-110'
              : 'opacity-0 -rotate-90 scale-50 absolute'
          }`}
        />
      </div>

      {showLabel && (
        <span className="text-xs font-mono font-semibold transition-colors duration-200">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}

      {/* Subtle hover pulse indicator dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full transition-transform duration-300 group-hover:scale-125 ${
          isDark ? 'bg-white' : 'bg-slate-900'
        }`}
      />
    </button>
  );
}
