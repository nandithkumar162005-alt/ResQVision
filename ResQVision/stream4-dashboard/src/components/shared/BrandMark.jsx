export default function BrandMark({ theme = 'light', compact = false, showTagline = false }) {
  const isDark = theme === 'dark';
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
          isDark
            ? 'border-charcoal-700 bg-charcoal-850 text-white'
            : 'border-zinc-200 bg-zinc-900 text-white'
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
          <path
            d="M16 4L26 8.5V15.5C26 21.4 21.7 26.5 16 28C10.3 26.5 6 21.4 6 15.5V8.5L16 4Z"
            stroke="#F97316"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="16" cy="15.5" r="3.2" fill="#F97316" />
          <path
            d="M16 9.8V11.6M16 19.4V21.2M10.3 15.5H12.1M19.9 15.5H21.7"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {!compact && (
        <div className="min-w-0">
          <div
            className={`font-display text-base font-bold tracking-tight ${
              isDark ? 'text-zinc-100' : 'text-zinc-900'
            }`}
          >
            ResQ<span className="text-orange-500">Vision</span>
          </div>
          {showTagline ? (
            <p className={`truncate text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Disaster Intelligence. Faster Response. Safer Communities.
            </p>
          ) : (
            <p
              className={`text-[10px] font-medium uppercase tracking-wider ${
                isDark ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              Disaster Intelligence
            </p>
          )}
        </div>
      )}
    </div>
  );
}
