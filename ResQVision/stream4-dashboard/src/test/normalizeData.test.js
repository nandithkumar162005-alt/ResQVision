import { describe, it, expect } from 'vitest';
import {
  normalizeActiveDisasters,
  normalizeDispatchLog,
  sortIncidents,
  normalizeCriticalZones,
  isValidLatLng,
} from '../utils/normalizeData';

describe('normalizeData utility', () => {
  describe('isValidLatLng', () => {
    it('accepts valid numeric coordinates', () => {
      expect(isValidLatLng(19.076, 72.8777)).toBe(true);
      expect(isValidLatLng(-45.0, 120.0)).toBe(true);
    });

    it('rejects invalid or non-numeric coordinates', () => {
      expect(isValidLatLng('19.0', '72.0')).toBe(false);
      expect(isValidLatLng(NaN, 72.0)).toBe(false);
      expect(isValidLatLng(100.0, 72.0)).toBe(false);
      expect(isValidLatLng(19.0, 200.0)).toBe(false);
      expect(isValidLatLng(null, undefined)).toBe(false);
    });
  });

  describe('normalizeActiveDisasters', () => {
    it('handles wrapped { status: "success", data: [...] } payload', () => {
      const payload = {
        status: 'success',
        data: [
          {
            event_id: 'ev-1',
            dispatch_status: 'received',
            damage_score_out_of_100: 65,
            affected_population_estimate: 5000,
            critical_zones: [
              { lat: 19.076, lng: 72.878, damage_classification: 'destroyed' },
            ],
          },
        ],
      };

      const result = normalizeActiveDisasters(payload);
      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe('ev-1');
      expect(result[0].dispatch_status).toBe('received');
      expect(result[0].damage_score_out_of_100).toBe(65);
      expect(result[0].affected_population_estimate).toBe(5000);
      expect(result[0].critical_zones).toHaveLength(1);
      expect(result[0].critical_zones[0].damage_classification).toBe('destroyed');
    });

    it('handles raw array payload', () => {
      const payload = [
        {
          event_id: 'ev-raw',
          dispatch_status: 'fully_dispatched',
          damage_score_out_of_100: 88,
          affected_population_estimate: 12000,
          critical_zones: [],
        },
      ];

      const result = normalizeActiveDisasters(payload);
      expect(result).toHaveLength(1);
      expect(result[0].event_id).toBe('ev-raw');
      expect(result[0].dispatch_status).toBe('fully_dispatched');
    });

    it('safely handles null, malformed, or empty inputs without crashing', () => {
      expect(normalizeActiveDisasters(null)).toEqual([]);
      expect(normalizeActiveDisasters(undefined)).toEqual([]);
      expect(normalizeActiveDisasters({})).toEqual([]);
      expect(normalizeActiveDisasters('some string')).toEqual([]);
      expect(normalizeActiveDisasters({ status: 'error', data: 'invalid' })).toEqual([]);
    });

    it('does not drop incidents with unknown status, treats them neutrally', () => {
      const payload = [
        {
          event_id: 'ev-unknown',
          dispatch_status: 'custom_unrecognized_status',
          critical_zones: [],
        },
      ];
      const result = normalizeActiveDisasters(payload);
      expect(result).toHaveLength(1);
      expect(result[0].dispatch_status).toBe('unknown');
      expect(result[0].dispatch_status_info.label).toBe('Unknown Status');
    });

    it('filters out invalid critical zone coordinates safely', () => {
      const zones = [
        { lat: 19.076, lng: 72.878, damage_classification: 'destroyed' },
        { lat: 'not-a-number', lng: 72.878, damage_classification: 'major_damage' },
        { lat: 95.0, lng: 72.878, damage_classification: 'destroyed' }, // out of lat range
      ];
      const normalized = normalizeCriticalZones(zones, 'test-ev');
      expect(normalized).toHaveLength(1);
      expect(normalized[0].damage_classification).toBe('destroyed');
    });
  });

  describe('sortIncidents', () => {
    it('prefers updated_at over created_at, sorts newest first', () => {
      const incidents = [
        { event_id: '1', created_at: '2026-10-15T10:00:00Z', updated_at: '2026-10-15T12:00:00Z', originalIndex: 0 },
        { event_id: '2', created_at: '2026-10-16T08:00:00Z', updated_at: '2026-10-16T14:00:00Z', originalIndex: 1 },
        { event_id: '3', created_at: '2026-10-16T10:00:00Z', updated_at: null, originalIndex: 2 },
      ];

      const { sorted, hasTimestampSorting } = sortIncidents(incidents);
      expect(hasTimestampSorting).toBe(true);
      // Newest is 2 (Oct 16 14:00), then 3 (Oct 16 10:00 created_at), then 1 (Oct 15 12:00)
      expect(sorted[0].event_id).toBe('2');
      expect(sorted[1].event_id).toBe('3');
      expect(sorted[2].event_id).toBe('1');
    });

    it('places undated incidents after timestamped ones, preserving original API order', () => {
      const incidents = [
        { event_id: 'no-time-1', created_at: null, updated_at: null, originalIndex: 0 },
        { event_id: 'time-1', created_at: '2026-10-15T10:00:00Z', updated_at: null, originalIndex: 1 },
        { event_id: 'no-time-2', created_at: null, updated_at: null, originalIndex: 2 },
      ];

      const { sorted } = sortIncidents(incidents);
      expect(sorted[0].event_id).toBe('time-1');
      expect(sorted[1].event_id).toBe('no-time-1');
      expect(sorted[2].event_id).toBe('no-time-2');
    });

    it('preserves API order and reports hasTimestampSorting=false if all records lack timestamps', () => {
      const incidents = [
        { event_id: 'a', created_at: null, updated_at: null, originalIndex: 0 },
        { event_id: 'b', created_at: null, updated_at: null, originalIndex: 1 },
      ];

      const { sorted, hasTimestampSorting } = sortIncidents(incidents);
      expect(hasTimestampSorting).toBe(false);
      expect(sorted[0].event_id).toBe('a');
      expect(sorted[1].event_id).toBe('b');
    });
  });

  describe('normalizeDispatchLog', () => {
    it('sorts dispatch logs chronologically by wave_number', () => {
      const rawLog = [
        { wave_number: 2, team_name: 'NDRF Wave 2', status: 'sent', sent_at: '2026-10-16T11:00:00Z' },
        { wave_number: 1, team_name: 'NDRF Recon', status: 'confirmed', sent_at: '2026-10-16T10:00:00Z' },
      ];

      const normalized = normalizeDispatchLog(rawLog);
      expect(normalized[0].wave_number).toBe(1);
      expect(normalized[1].wave_number).toBe(2);
    });

    it('safely handles empty or invalid dispatch log without errors', () => {
      expect(normalizeDispatchLog(null)).toEqual([]);
      expect(normalizeDispatchLog({})).toEqual([]);
      expect(normalizeDispatchLog('bad input')).toEqual([]);
    });
  });
});
