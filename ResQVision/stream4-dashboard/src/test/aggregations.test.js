import { describe, it, expect } from 'vitest';
import {
  calculateKpis,
  aggregateDamageOverview,
  aggregatePopulationByIncident,
  aggregateDamageByIncident,
} from '../utils/aggregations';

describe('aggregations utility', () => {
  const sampleIncidents = [
    {
      event_id: 'ev-1',
      dispatch_status: 'fully_dispatched',
      affected_population_estimate: 8300,
      damage_score_out_of_100: 75,
      critical_zones: [
        { damage_classification: 'destroyed' },
        { damage_classification: 'major_damage' },
      ],
      critical_zones_count: 2,
    },
    {
      event_id: 'ev-2',
      dispatch_status: 'ndrf_confirmed',
      affected_population_estimate: 4200,
      damage_score_out_of_100: 50,
      critical_zones: [
        { damage_classification: 'destroyed' },
      ],
      critical_zones_count: 1,
    },
    {
      event_id: 'ev-3',
      dispatch_status: 'received',
      affected_population_estimate: null, // missing population
      damage_score_out_of_100: 30,
      critical_zones: [],
      critical_zones_count: 0,
    },
  ];

  it('calculates KPIs accurately from incident list', () => {
    const kpis = calculateKpis(sampleIncidents);
    expect(kpis.activeIncidents).toBe(3);
    // critical_zones: 2 + 1 + 0 = 3
    expect(kpis.mappedCriticalZones).toBe(3);
    // population: 8300 + 4200 = 12500
    expect(kpis.estimatedAffectedPopulation).toBe(12500);
    // fully_dispatched: exactly 1
    expect(kpis.fullyDispatchedEvents).toBe(1);
    expect(kpis.hasPopulationData).toBe(true);
  });

  it('handles empty incidents array gracefully with zeros and nulls', () => {
    const kpis = calculateKpis([]);
    expect(kpis.activeIncidents).toBe(0);
    expect(kpis.mappedCriticalZones).toBe(0);
    expect(kpis.estimatedAffectedPopulation).toBe(0);
    expect(kpis.fullyDispatchedEvents).toBe(0);
    expect(kpis.hasPopulationData).toBe(false);
  });

  it('counts only valid critical zones and never arbitrary keys', () => {
    const incidents = [
      {
        event_id: 'ev-a',
        dispatch_status: 'received',
        critical_zones: [
          { damage_classification: 'destroyed' },
          { damage_classification: 'major_damage' },
          { damage_classification: 'unknown' },
        ],
      },
    ];
    const kpis = calculateKpis(incidents);
    expect(kpis.mappedCriticalZones).toBe(3);
  });

  it('counts fully_dispatched strictly without confusing with resolved or teams dispatched', () => {
    const incidents = [
      { event_id: '1', dispatch_status: 'fully_dispatched' },
      { event_id: '2', dispatch_status: 'ndrf_confirmed' },
      { event_id: '3', dispatch_status: 'resolved' }, // unfamiliar status, shouldn't be counted
      { event_id: '4', dispatch_status: 'fully_dispatched' },
    ];
    const kpis = calculateKpis(incidents);
    expect(kpis.fullyDispatchedEvents).toBe(2);
  });

  it('aggregates damage overview breakdown correctly', () => {
    const overview = aggregateDamageOverview(sampleIncidents);
    expect(overview.totalZones).toBe(3);
    expect(overview.counts.destroyed).toBe(2);
    expect(overview.counts.major_damage).toBe(1);
    expect(overview.counts.unknown).toBe(0);
    expect(overview.chartData).toHaveLength(2); // Only non-zero items
  });

  it('aggregates population impact and critical zones by incident', () => {
    const popData = aggregatePopulationByIncident(sampleIncidents);
    expect(popData).toHaveLength(3);
    expect(popData[0].population).toBe(8300);

    const dmgData = aggregateDamageByIncident(sampleIncidents);
    expect(dmgData).toHaveLength(3);
    expect(dmgData[0].destroyed).toBe(1);
    expect(dmgData[0].majorDamage).toBe(1);
  });
});
