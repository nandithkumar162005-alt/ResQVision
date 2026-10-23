import React from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Circular progress gauge matching Image 3 design
 */
export function CircularGauge({
  percentage = 74,
  size = 90,
  strokeWidth = 7,
  color = '#3B82F6',
  label = '',
  sublabel = '',
}) {
  const { isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const track = isDark ? '#1E2430' : '#E2E8F0';

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={track}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        {/* Center percentage value */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span
            className={`text-sm font-bold font-mono leading-none ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            {percentage}%
          </span>
        </div>
      </div>

      {label && (
        <span
          className={`text-[11px] font-mono font-medium mt-1.5 truncate max-w-[100px] ${
            isDark ? 'text-slate-300' : 'text-slate-800'
          }`}
        >
          {label}
        </span>
      )}
      {sublabel && (
        <span
          className={`text-[10px] font-mono truncate max-w-[100px] ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

/**
 * Large circular gauge for Affected Population (matching Image 3 top right card)
 */
export function LargePopulationGauge({
  population = 47400,
  percentage = 68,
  size = 140,
  strokeWidth = 10,
  color = '#3B82F6',
}) {
  const { isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const track = isDark ? '#1E2430' : '#E2E8F0';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`text-xl font-bold font-mono tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {population > 1000 ? `${(population / 1000).toFixed(1)}k` : population}
        </span>
        <span
          className={`text-[10px] uppercase font-mono tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          peoples
        </span>
      </div>
    </div>
  );
}
