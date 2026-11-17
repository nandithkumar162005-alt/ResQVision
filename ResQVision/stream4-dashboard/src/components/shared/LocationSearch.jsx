import { useMemo, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { INDIA_LOCATION_INDEX } from '../../data/mockData.js';

export default function LocationSearch({
  theme = 'light',
  disasters = [],
  onSelectLocation,
  placeholder = 'Search state, district, city, or PIN code…'
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const isDark = theme === 'dark';

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDIA_LOCATION_INDEX.slice(0, 6).map(item => ({ kind: 'place', ...item }));

    const placeHits = INDIA_LOCATION_INDEX.filter(item => {
      const hay = [item.city, item.district, item.state, ...(item.pinCodes || [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    }).map(item => ({ kind: 'place', ...item }));

    const eventHits = disasters
      .filter(ev => {
        const hay = [ev.event_id, ev.title, ev.city, ev.district, ev.state, ev.pin_code]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      })
      .map(ev => ({
        kind: 'disaster',
        id: ev.event_id,
        city: ev.city || ev.title,
        district: ev.district || '',
        state: ev.state || '',
        pinCodes: ev.pin_code ? [ev.pin_code] : [],
        lat: ev.lat,
        lng: ev.lng,
        zoom: 12,
        event: ev
      }));

    return [...eventHits, ...placeHits].slice(0, 8);
  }, [query, disasters]);

  const handleSelect = item => {
    setQuery(
      item.kind === 'disaster'
        ? `${item.city}${item.state ? `, ${item.state}` : ''} (${item.id})`
        : `${item.city}, ${item.state}`
    );
    setOpen(false);
    onSelectLocation(item);
  };

  const handleKeyDown = event => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(prev => (matches.length ? (prev + 1) % matches.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(prev => (matches.length ? (prev - 1 + matches.length) % matches.length : 0));
    } else if (event.key === 'Enter' && matches[activeIndex]) {
      event.preventDefault();
      handleSelect(matches[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search
          className={`pointer-events-none absolute left-3 h-4 w-4 ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 160)}
          onChange={e => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search location by state, district, city, or PIN code"
          aria-expanded={open}
          role="combobox"
          aria-autocomplete="list"
          className={`w-full rounded-xl border py-2 pl-9 pr-8 text-xs sm:text-sm transition ${
            isDark
              ? 'border-charcoal-700 bg-charcoal-850 text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500'
              : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:bg-white'
          }`}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setActiveIndex(0);
              inputRef.current?.focus();
            }}
            className={`absolute right-2 rounded p-1 ${
              isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="listbox"
          className={`absolute left-0 right-0 top-full z-40 mt-1.5 max-h-64 overflow-y-auto rounded-xl border p-1.5 shadow-xl ${
            isDark
              ? 'border-charcoal-700 bg-charcoal-900 text-zinc-100'
              : 'border-zinc-200 bg-white text-zinc-900'
          }`}
        >
          {matches.length === 0 ? (
            <div className={`px-3 py-4 text-center text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No matching state, district, city, or PIN code in current index.
            </div>
          ) : (
            matches.map((item, idx) => (
              <button
                key={`${item.kind}-${item.id}`}
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                onMouseDown={e => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${
                  idx === activeIndex
                    ? isDark
                      ? 'bg-charcoal-800 text-white'
                      : 'bg-orange-50 text-zinc-900'
                    : isDark
                    ? 'hover:bg-charcoal-800/70'
                    : 'hover:bg-zinc-100'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <MapPin
                    className={`h-3.5 w-3.5 shrink-0 ${
                      item.kind === 'disaster' ? 'text-red-500' : 'text-orange-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {item.city}
                      {item.district && item.district !== item.city ? ` · ${item.district}` : ''}
                    </div>
                    <div className={`truncate text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {item.state}
                      {item.pinCodes?.length ? ` · PIN ${item.pinCodes.join(', ')}` : ''}
                    </div>
                  </div>
                </div>
                {item.kind === 'disaster' && (
                  <span className="shrink-0 rounded bg-red-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-500">
                    EVENT
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
