import { describe, it, expect } from 'vitest';
import {
  getDamageSeverity,
  getDispatchStatusInfo,
  getTimelineStatusInfo,
  DAMAGE_SEVERITY,
  DISPATCH_STATUS,
} from '../utils/severityColors';

describe('severityColors utility', () => {
  it('correctly maps destroyed to red severity token', () => {
    const sev = getDamageSeverity('destroyed');
    expect(sev.colorHex).toBe('#ef4444');
    expect(sev.key).toBe('destroyed');
    expect(sev.label).toBe('Destroyed');
  });

  it('correctly maps major_damage to amber severity token', () => {
    const sev = getDamageSeverity('major_damage');
    expect(sev.colorHex).toBe('#f59e0b');
    expect(sev.key).toBe('major_damage');
    expect(sev.label).toBe('Major Damage');
  });

  it('maps unknown, null, or undefined to neutral gray token', () => {
    expect(getDamageSeverity(null).colorHex).toBe('#64748b');
    expect(getDamageSeverity(undefined).colorHex).toBe('#64748b');
    expect(getDamageSeverity('unknown').colorHex).toBe('#64748b');
    expect(getDamageSeverity('minor_scratches').colorHex).toBe('#64748b');
  });

  it('correctly maps all known dispatch status values', () => {
    expect(getDispatchStatusInfo('received').key).toBe('received');
    expect(getDispatchStatusInfo('ndrf_notified').key).toBe('ndrf_notified');
    expect(getDispatchStatusInfo('ndrf_confirmed').key).toBe('ndrf_confirmed');
    expect(getDispatchStatusInfo('ndrf_denied').key).toBe('ndrf_denied');
    expect(getDispatchStatusInfo('fully_dispatched').key).toBe('fully_dispatched');
    expect(getDispatchStatusInfo('fully_dispatched').label).toBe('Fully Dispatched');
  });

  it('maps unfamiliar dispatch status values to unknown status without throwing', () => {
    const unknown = getDispatchStatusInfo('random_custom_status');
    expect(unknown.key).toBe('unknown');
    expect(unknown.label).toBe('Unknown Status');
  });

  it('maps timeline statuses properly', () => {
    expect(getTimelineStatusInfo('sent').label).toBe('Sent');
    expect(getTimelineStatusInfo('confirmed').colorHex).toBe('#34D399');
    expect(getTimelineStatusInfo('failed').colorHex).toBe('#ef4444');
    expect(getTimelineStatusInfo('other').label).toBe('Unknown');
  });
});
