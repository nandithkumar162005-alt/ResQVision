export function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return Number(value).toLocaleString('en-IN');
}

export function formatRelativeTime(value) {
  if (!value) return 'Timestamp unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Timestamp unavailable';
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  if (
    !Number.isFinite(Number(lat1)) ||
    !Number.isFinite(Number(lng1)) ||
    !Number.isFinite(Number(lat2)) ||
    !Number.isFinite(Number(lng2))
  ) {
    return null;
  }
  const R = 6371;
  const dLat = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
  const dLng = ((Number(lng2) - Number(lng1)) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((Number(lat1) * Math.PI) / 180) *
      Math.cos((Number(lat2) * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return (2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

export function statusReadable(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}
