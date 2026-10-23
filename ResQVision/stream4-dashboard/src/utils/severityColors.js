/**
 * Centralized Design System Severity and Status Tokens
 * ResQVision Command Dashboard
 *
 * Rules:
 * - red for destroyed / critical damage or urgent alerts
 * - amber/orange for major_damage / warnings
 * - neutral gray for unknown/missing classification
 * - green ONLY for verified positive / healthy states
 */

export const DAMAGE_SEVERITY = {
  destroyed: {
    key: 'destroyed',
    label: 'Destroyed',
    colorHex: '#ef4444',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
    dotClass: 'bg-red-500',
    description: 'Catastrophic structural failure or total destruction',
  },
  major_damage: {
    key: 'major_damage',
    label: 'Major Damage',
    colorHex: '#f59e0b',
    bgClass: 'bg-amber-500/15',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/30',
    dotClass: 'bg-amber-500',
    description: 'Severe structural compromise requiring heavy search and rescue',
  },
  unknown: {
    key: 'unknown',
    label: 'Unknown Severity',
    colorHex: '#64748b',
    bgClass: 'bg-slate-500/15',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
    dotClass: 'bg-slate-500',
    description: 'Awaiting satellite/field classification',
  },
};

export function getDamageSeverity(classification) {
  if (!classification || typeof classification !== 'string') {
    return DAMAGE_SEVERITY.unknown;
  }
  const normalized = classification.trim().toLowerCase();
  if (normalized === 'destroyed') return DAMAGE_SEVERITY.destroyed;
  if (normalized === 'major_damage') return DAMAGE_SEVERITY.major_damage;
  return DAMAGE_SEVERITY.unknown;
}

export const DISPATCH_STATUS = {
  received: {
    key: 'received',
    label: 'Received',
    colorHex: '#38bdf8',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-500/30',
    badgeText: 'Received',
    description: 'Disaster report acknowledged by Stream 3',
  },
  ndrf_notified: {
    key: 'ndrf_notified',
    label: 'NDRF Notified',
    colorHex: '#67D4F3',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-500/30',
    badgeText: 'NDRF Notified',
    description: 'Alert transmitted to NDRF dispatch teams',
  },
  ndrf_confirmed: {
    key: 'ndrf_confirmed',
    label: 'NDRF Confirmed',
    colorHex: '#34D399',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
    badgeText: 'NDRF Confirmed',
    description: 'NDRF unit acknowledged deployment readiness',
  },
  ndrf_denied: {
    key: 'ndrf_denied',
    label: 'NDRF Denied',
    colorHex: '#f43f5e',
    bgClass: 'bg-rose-500/15',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-500/30',
    badgeText: 'NDRF Denied',
    description: 'Verification rejected or assistance denied',
  },
  fully_dispatched: {
    key: 'fully_dispatched',
    label: 'Fully Dispatched',
    colorHex: '#a855f7',
    bgClass: 'bg-purple-500/15',
    textClass: 'text-purple-300',
    borderClass: 'border-purple-500/30',
    badgeText: 'Fully Dispatched',
    description: 'All configured dispatch waves completed (Incident may remain active)',
  },
  unknown: {
    key: 'unknown',
    label: 'Unknown Status',
    colorHex: '#64748b',
    bgClass: 'bg-slate-500/15',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
    badgeText: 'Unknown Status',
    description: 'Unrecognized dispatch workflow state',
  },
};

export function getDispatchStatusInfo(status) {
  if (!status || typeof status !== 'string') {
    return DISPATCH_STATUS.unknown;
  }
  const normalized = status.trim().toLowerCase();
  return DISPATCH_STATUS[normalized] || DISPATCH_STATUS.unknown;
}

export const TIMELINE_STATUS = {
  sent: {
    label: 'Sent',
    colorHex: '#38bdf8',
    bgClass: 'bg-sky-500/15',
    textClass: 'text-sky-300',
    borderClass: 'border-sky-500/30',
  },
  delivered: {
    label: 'Delivered',
    colorHex: '#06b6d4',
    bgClass: 'bg-cyan-500/15',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-500/30',
  },
  confirmed: {
    label: 'Confirmed',
    colorHex: '#34D399',
    bgClass: 'bg-emerald-500/15',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
  },
  failed: {
    label: 'Failed',
    colorHex: '#ef4444',
    bgClass: 'bg-red-500/15',
    textClass: 'text-red-400',
    borderClass: 'border-red-500/30',
  },
  unknown: {
    label: 'Unknown',
    colorHex: '#64748b',
    bgClass: 'bg-slate-500/15',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-500/30',
  },
};

export function getTimelineStatusInfo(status) {
  if (!status || typeof status !== 'string') {
    return TIMELINE_STATUS.unknown;
  }
  const normalized = status.trim().toLowerCase();
  return TIMELINE_STATUS[normalized] || TIMELINE_STATUS.unknown;
}
