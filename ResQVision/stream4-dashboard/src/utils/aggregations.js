/**
 * Truthful Metric Aggregations
 * ResQVision Command Dashboard
 *
 * Adheres strictly to the metric calculations supported by Stream 3 data.
 * No fabricated metrics, no fake deltas, no invented trend curves.
 */

import { DAMAGE_SEVERITY } from './severityColors';

/**
 * Calculates the five primary KPIs
 */
export function calculateKpis(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return {
      activeIncidents: 0,
      mappedCriticalZones: 0,
      estimatedAffectedPopulation: 0,
      fullyDispatchedEvents: 0,
      hasPopulationData: false,
    };
  }

  let mappedCriticalZones = 0;
  let estimatedAffectedPopulation = 0;
  let fullyDispatchedEvents = 0;
  let hasPopulationData = false;

  for (const incident of incidents) {
    if (incident.critical_zones && Array.isArray(incident.critical_zones)) {
      mappedCriticalZones += incident.critical_zones.length;
    }

    if (typeof incident.affected_population_estimate === 'number' && Number.isFinite(incident.affected_population_estimate)) {
      estimatedAffectedPopulation += incident.affected_population_estimate;
      hasPopulationData = true;
    }

    if (incident.dispatch_status === 'fully_dispatched') {
      fullyDispatchedEvents += 1;
    }
  }

  return {
    activeIncidents: incidents.length,
    mappedCriticalZones,
    estimatedAffectedPopulation: hasPopulationData ? estimatedAffectedPopulation : null,
    fullyDispatchedEvents,
    hasPopulationData,
  };
}

/**
 * Aggregates damage classification distribution across all critical zones
 * For Chart 1: Damage Overview
 */
export function aggregateDamageOverview(incidents) {
  const counts = {
    destroyed: 0,
    major_damage: 0,
    unknown: 0,
  };

  let totalZones = 0;

  if (Array.isArray(incidents)) {
    for (const incident of incidents) {
      if (Array.isArray(incident.critical_zones)) {
        for (const zone of incident.critical_zones) {
          totalZones++;
          if (zone.damage_classification === 'destroyed') {
            counts.destroyed++;
          } else if (zone.damage_classification === 'major_damage') {
            counts.major_damage++;
          } else {
            counts.unknown++;
          }
        }
      }
    }
  }

  const chartData = [
    {
      name: DAMAGE_SEVERITY.destroyed.label,
      key: 'destroyed',
      value: counts.destroyed,
      color: DAMAGE_SEVERITY.destroyed.colorHex,
    },
    {
      name: DAMAGE_SEVERITY.major_damage.label,
      key: 'major_damage',
      value: counts.major_damage,
      color: DAMAGE_SEVERITY.major_damage.colorHex,
    },
    {
      name: DAMAGE_SEVERITY.unknown.label,
      key: 'unknown',
      value: counts.unknown,
      color: DAMAGE_SEVERITY.unknown.colorHex,
    },
  ].filter(item => item.value > 0);

  return {
    totalZones,
    counts,
    chartData,
  };
}

/**
 * Compares population impact across incidents
 * For Chart 2: Population Impact by Incident
 */
export function aggregatePopulationByIncident(incidents) {
  if (!Array.isArray(incidents)) return [];

  return incidents.map(incident => {
    const label = incident.location_name
      ? `${incident.location_name} (${incident.event_id.substring(0, 6)})`
      : `Event ${incident.event_id.substring(0, 8)}`;

    return {
      eventId: incident.event_id,
      label,
      population: typeof incident.affected_population_estimate === 'number'
        ? incident.affected_population_estimate
        : 0,
      damageScore: incident.damage_score_out_of_100,
      status: incident.dispatch_status_info?.label || 'Unknown',
    };
  });
}

/**
 * Counts critical zones by incident
 * For Chart 3: Critical Zones by Incident
 */
export function aggregateDamageByIncident(incidents) {
  if (!Array.isArray(incidents)) return [];

  return incidents.map(incident => {
    const label = incident.location_name
      ? `${incident.location_name} (${incident.event_id.substring(0, 6)})`
      : `Event ${incident.event_id.substring(0, 8)}`;

    const destroyedCount = (incident.critical_zones || []).filter(z => z.damage_classification === 'destroyed').length;
    const majorCount = (incident.critical_zones || []).filter(z => z.damage_classification === 'major_damage').length;
    const unknownCount = (incident.critical_zones || []).filter(z => z.damage_classification === 'unknown').length;

    return {
      eventId: incident.event_id,
      label,
      totalZones: incident.critical_zones_count || 0,
      destroyed: destroyedCount,
      majorDamage: majorCount,
      unknown: unknownCount,
      damageScore: incident.damage_score_out_of_100 || 0,
    };
  });
}
