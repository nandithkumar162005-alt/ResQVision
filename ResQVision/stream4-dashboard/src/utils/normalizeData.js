/**
 * Centralized Data Normalization Layer
 * ResQVision Command Dashboard
 *
 * Ensures defense against malformed API payloads, unexpected shapes,
 * missing optional fields, and handles sorting & filtering according to specifications.
 */

import { getDamageSeverity, getDispatchStatusInfo } from './severityColors';

/**
 * Validates whether lat/lng are within valid geographic bounds
 */
export function isValidLatLng(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Validates if coordinates are plausibly within the Indian sub-continental operational scope
 * (Broad bounding scope: lat 6.0 to 37.5, lng 68.0 to 97.5)
 */
export function isWithinIndiaScope(lat, lng) {
  if (!isValidLatLng(lat, lng)) return false;
  return lat >= 6.0 && lat <= 38.0 && lng >= 68.0 && lng <= 98.0;
}

/**
 * Normalizes an array of critical zones defensively
 */
export function normalizeCriticalZones(zonesRaw, eventId) {
  if (!Array.isArray(zonesRaw)) {
    return [];
  }

  return zonesRaw.reduce((acc, zone, index) => {
    if (!zone || typeof zone !== 'object') return acc;

    const lat = typeof zone.lat === 'number' ? zone.lat : parseFloat(zone.lat);
    const lng = typeof zone.lng === 'number' ? zone.lng : parseFloat(zone.lng);

    if (!isValidLatLng(lat, lng)) {
      return acc;
    }

    const classification = typeof zone.damage_classification === 'string'
      ? zone.damage_classification.trim().toLowerCase()
      : 'unknown';

    const severityInfo = getDamageSeverity(classification);
    const locality = typeof zone.locality === 'string' ? zone.locality : null;

    acc.push({
      id: `${eventId}-zone-${index}`,
      index: index + 1,
      lat,
      lng,
      locality,
      isIndiaScope: isWithinIndiaScope(lat, lng),
      damage_classification: severityInfo.key,
      severityInfo,
    });
    return acc;
  }, []);
}

/**
 * Defensively normalizes active disaster events from API or mock
 */
export function normalizeActiveDisasters(payload) {
  if (!payload) {
    return [];
  }

  // Handle both wrapped { status: 'success', data: [...] } and raw array
  let rawList = [];
  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (payload && Array.isArray(payload.data)) {
    rawList = payload.data;
  } else {
    return [];
  }

  return rawList.reduce((acc, item, originalIndex) => {
    if (!item || typeof item !== 'object') return acc;

    const eventId = String(item.event_id || `event-${originalIndex}`).trim();
    const dispatchStatusRaw = String(item.dispatch_status || 'unknown').trim().toLowerCase();
    const dispatchStatusInfo = getDispatchStatusInfo(dispatchStatusRaw);

    const rawScore = item.damage_score_out_of_100;
    const numScore = typeof rawScore === 'number' ? rawScore : parseFloat(rawScore);
    const damageScore = Number.isFinite(numScore) && numScore >= 0 && numScore <= 100 ? numScore : null;

    const rawPop = item.affected_population_estimate;
    const numPop = typeof rawPop === 'number' ? rawPop : parseInt(rawPop, 10);
    const affectedPopulation = Number.isFinite(numPop) && numPop >= 0 ? numPop : null;

    const criticalZones = normalizeCriticalZones(item.critical_zones, eventId);

    // Optional future/metadata fields - do NOT invent if not supplied
    const disasterType = item.disaster_type && typeof item.disaster_type === 'string'
      ? item.disaster_type.trim()
      : null;

    const locationName = item.location_name && typeof item.location_name === 'string'
      ? item.location_name.trim()
      : null;

    const eventStatus = item.event_status && typeof item.event_status === 'string'
      ? item.event_status.trim()
      : null;

    // Timestamp fields
    const createdAt = item.created_at && !isNaN(new Date(item.created_at).getTime())
      ? new Date(item.created_at).toISOString()
      : null;

    const updatedAt = item.updated_at && !isNaN(new Date(item.updated_at).getTime())
      ? new Date(item.updated_at).toISOString()
      : null;

    // Check if any zones are out of India scope
    const hasOutOfScopeZones = criticalZones.some(z => !z.isIndiaScope);

    // Optional visual and risk telemetry metadata
    const imageUrl = item.image_url && typeof item.image_url === 'string' ? item.image_url : null;
    const satelliteImageUrl = item.satellite_image_url && typeof item.satellite_image_url === 'string' ? item.satellite_image_url : null;
    const agency = item.agency && typeof item.agency === 'string' ? item.agency : null;
    const severityLabel = item.severity_label && typeof item.severity_label === 'string' ? item.severity_label : null;
    const riskLevel = item.risk_level && typeof item.risk_level === 'string' ? item.risk_level.toUpperCase() : 'MEDIUM';
    const inundationPct = typeof item.inundation_percentage === 'number' ? item.inundation_percentage : null;
    const structuralStrain = typeof item.structural_strain === 'number' ? item.structural_strain : null;
    const stateName = item.state_name && typeof item.state_name === 'string' ? item.state_name : null;
    const hazardCategory = item.hazard_category && typeof item.hazard_category === 'string' ? item.hazard_category : null;
    const alertLevel = item.alert_level && typeof item.alert_level === 'string' ? item.alert_level : null;
    const stormTag = item.storm_tag && typeof item.storm_tag === 'string' ? item.storm_tag : null;
    const weatherTelemetry = item.weather_telemetry && typeof item.weather_telemetry === 'object' ? item.weather_telemetry : null;

    acc.push({
      event_id: eventId,
      dispatch_status: dispatchStatusInfo.key,
      dispatch_status_info: dispatchStatusInfo,
      damage_score_out_of_100: damageScore,
      affected_population_estimate: affectedPopulation,
      critical_zones: criticalZones,
      critical_zones_count: criticalZones.length,
      disaster_type: disasterType,
      location_name: locationName,
      state_name: stateName,
      hazard_category: hazardCategory,
      alert_level: alertLevel,
      storm_tag: stormTag,
      weather_telemetry: weatherTelemetry,
      event_status: eventStatus,
      created_at: createdAt,
      updated_at: updatedAt,
      originalIndex,
      hasOutOfScopeZones,
      image_url: imageUrl,
      satellite_image_url: satelliteImageUrl,
      agency,
      severity_label: severityLabel,
      risk_level: riskLevel,
      inundation_percentage: inundationPct,
      structural_strain: structuralStrain,
    });

    return acc;
  }, []);
}

/**
 * Sorts incidents:
 * - Newest activity first using updated_at when valid
 * - Fall back to created_at
 * - Records with no valid timestamp go after timestamped records and preserve original API order
 * - If no valid timestamps exist for any event, preserves API order
 */
export function sortIncidents(incidents) {
  if (!Array.isArray(incidents) || incidents.length === 0) {
    return { sorted: [], hasTimestampSorting: false };
  }

  const anyValidTimestamps = incidents.some(
    item => Boolean(item.updated_at || item.created_at)
  );

  if (!anyValidTimestamps) {
    return {
      sorted: [...incidents],
      hasTimestampSorting: false,
    };
  }

  const sorted = [...incidents].sort((a, b) => {
    const timeA = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : null);
    const timeB = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : null);

    if (timeA !== null && timeB !== null) {
      return timeB - timeA; // Descending (newest first)
    }
    if (timeA !== null && timeB === null) {
      return -1; // a comes first
    }
    if (timeA === null && timeB !== null) {
      return 1; // b comes first
    }
    // Both missing timestamps: preserve original API order
    return a.originalIndex - b.originalIndex;
  });

  return {
    sorted,
    hasTimestampSorting: true,
  };
}

/**
 * Normalizes dispatch log array for an event
 */
export function normalizeDispatchLog(payload) {
  if (!payload) return [];

  let rawList = [];
  if (Array.isArray(payload)) {
    rawList = payload;
  } else if (payload && Array.isArray(payload.data)) {
    rawList = payload.data;
  } else {
    return [];
  }

  const normalized = rawList.reduce((acc, row, idx) => {
    if (!row || typeof row !== 'object') return acc;

    const waveNum = typeof row.wave_number === 'number' ? row.wave_number : parseInt(row.wave_number, 10);
    const waveNumber = Number.isFinite(waveNum) ? waveNum : idx + 1;

    const teamName = String(row.team_name || 'Emergency Response Team').trim();
    const status = String(row.status || 'unknown').trim().toLowerCase();

    const sentAt = row.sent_at && !isNaN(new Date(row.sent_at).getTime())
      ? new Date(row.sent_at).toISOString()
      : null;

    const messageContent = typeof row.message_content === 'string'
      ? row.message_content.trim()
      : null;

    acc.push({
      id: `wave-${waveNumber}-${idx}`,
      wave_number: waveNumber,
      team_name: teamName,
      status,
      sent_at: sentAt,
      message_content: messageContent,
      originalIndex: idx,
    });

    return acc;
  }, []);

  // Sort chronological by wave_number and sent_at
  return normalized.sort((a, b) => {
    if (a.wave_number !== b.wave_number) {
      return a.wave_number - b.wave_number;
    }
    if (a.sent_at && b.sent_at) {
      return new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime();
    }
    return a.originalIndex - b.originalIndex;
  });
}
