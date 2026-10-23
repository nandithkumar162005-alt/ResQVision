import React from 'react';

/**
 * Original ResQVision Brand Identity
 * Monochromatic high-contrast geospatial beacon with concentric sensor-vision rings.
 */
export function ResQVisionLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rqv-gradient" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>

      {/* Outer sensor arc */}
      <path
        d="M6 18C6 11.3726 11.3726 6 18 6C24.6274 6 30 11.3726 30 18"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeDasharray="1 3"
        opacity="0.5"
      />

      {/* Middle radar sweep */}
      <path
        d="M10 18C10 13.5817 13.5817 10 18 10C22.4183 10 26 13.5817 26 18"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Tactical Beacon Pin Core */}
      <path
        d="M18 13C15.2386 13 13 15.2386 13 18C13 21.8 17.2 28.2 17.65 28.85C17.82 29.1 18.18 29.1 18.35 28.85C18.8 28.2 23 21.8 23 18C23 15.2386 20.7614 13 18 13Z"
        fill="url(#rqv-gradient)"
      />

      {/* Core focus aperture */}
      <circle cx="18" cy="18" r="2.5" fill="#08090C" />
      <circle cx="18" cy="18" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

export function ResQVisionWordmark({ className = '', subtitle = 'AI Disaster Intelligence' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-1.5 leading-none">
        <span className="font-bold text-base tracking-tight text-white">
          ResQ<span className="text-slate-300">Vision</span>
        </span>
        <span className="text-[10px] font-mono font-medium tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20 uppercase">
          Stream 4
        </span>
      </div>
      {subtitle && (
        <span className="text-[11px] font-medium text-slate-400 tracking-normal mt-0.5">
          {subtitle}
        </span>
      )}
    </div>
  );
}
