/**
 * Formatter Utilities for ResQVision
 * Adheres to en-IN number formatting and Asia/Kolkata (IST) timestamps.
 */

/**
 * Format numbers using Indian numbering system (en-IN).
 * Examples: 1,00,000 / 8,300
 */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '—';
  }
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format timestamp into Asia/Kolkata (IST).
 * Returns 'Timestamp unavailable' if invalid or missing. Never invents a timestamp.
 */
export function formatTimestamp(timestampStr) {
  if (!timestampStr) {
    return 'Timestamp unavailable';
  }

  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) {
    return 'Timestamp unavailable';
  }

  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);

    return `${formatted} IST`;
  } catch (err) {
    return 'Timestamp unavailable';
  }
}

/**
 * Format UTC string for tooltip comparison
 */
export function formatUTCTimestamp(timestampStr) {
  if (!timestampStr) return 'Unavailable';
  const date = new Date(timestampStr);
  if (isNaN(date.getTime())) return 'Unavailable';
  return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
}

/**
 * Format relative elapsed time since last sync
 */
export function formatRelativeSyncAge(date) {
  if (!date) return 'Never';
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

/**
 * Format geographic coordinates to 4 decimal places with hemisphere
 */
export function formatCoordinate(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return 'Coordinates unavailable';
  }
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lngStr}`;
}

/**
 * Truncate long UUIDs / IDs cleanly
 */
export function shortenId(id, head = 8, tail = 4) {
  if (!id || typeof id !== 'string') return '—';
  if (id.length <= head + tail + 2) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}


/**
 * Safe display label for an incident's type. Stream 3 may not provide disaster_type
 * (or location_name) - never crash on null, fall back to something readable.
 */
export function incidentTypeLabel(inc) {
  const t = inc && typeof inc.disaster_type === 'string' ? inc.disaster_type.split('(')[0].trim() : '';
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : 'Disaster';
}

export function incidentLocationLabel(inc) {
  const n = inc && typeof inc.location_name === 'string' ? inc.location_name.split('-')[0].trim() : '';
  if (n) return n;
  const z = inc && Array.isArray(inc.critical_zones) && inc.critical_zones[0];
  if (z && Number.isFinite(z.lat) && Number.isFinite(z.lng)) {
    return `${Math.abs(z.lat).toFixed(2)}\u00b0${z.lat >= 0 ? 'N' : 'S'}, ${Math.abs(z.lng).toFixed(2)}\u00b0${z.lng >= 0 ? 'E' : 'W'}`;
  }
  return 'Location pending';
}
