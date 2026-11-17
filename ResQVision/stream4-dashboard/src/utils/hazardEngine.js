/**
 * RESQVISION — MULTI-HAZARD GEOSPATIAL ANIMATION ENGINE
 *
 * Extensible hazard visualization adapters that strictly render ONLY from
 * available spatial/temporal data and preserve source, timing, and data mode.
 * Never fabricates cyclone paths, tsunami wavefronts, rainfall radar, or damage circles.
 */

export const HAZARD_TYPES = {
  earthquake: {
    id: 'earthquake',
    label: 'Earthquake',
    color: '#EF4444',
    legendNote: 'Pulsing epicentre; shaking footprint shown only when model provided'
  },
  cyclone: {
    id: 'cyclone',
    label: 'Cyclone',
    color: '#F97316',
    legendNote: 'Observed path (solid), forecast track & cone (dashed) when supplied'
  },
  rainfall: {
    id: 'rainfall',
    label: 'Heavy Rainfall',
    color: '#38BDF8',
    legendNote: 'Time-indexed precipitation intensity frames when radar exists'
  },
  tsunami: {
    id: 'tsunami',
    label: 'Tsunami',
    color: '#06B6D4',
    legendNote: 'Ocean-origin wavefront propagation & coastal threat sections only'
  },
  flood: {
    id: 'flood',
    label: 'Flood',
    color: '#2563EB',
    legendNote: 'River corridor, inundation geometry & river gauges when supplied'
  },
  landslide: {
    id: 'landslide',
    label: 'Landslide',
    color: '#B45309',
    legendNote: 'Reported slope positions & susceptible polygons when supplied'
  },
  wildfire: {
    id: 'wildfire',
    label: 'Wildfire',
    color: '#DC2626',
    legendNote: 'Reported fire perimeter & progression frames when supplied'
  },
  drought: {
    id: 'drought',
    label: 'Drought',
    color: '#CA8A04',
    legendNote: 'Regional drought severity polygons when supplied'
  }
};

export function inferHazardCategory(event) {
  if (event?.hazard_category && HAZARD_TYPES[event.hazard_category]) {
    return event.hazard_category;
  }
  const raw = String(event?.disaster_type || '').toLowerCase();
  if (raw.includes('quake') || raw.includes('seismic')) return 'earthquake';
  if (raw.includes('cyclone') || raw.includes('storm')) return 'cyclone';
  if (raw.includes('rain') || raw.includes('precip')) return 'rainfall';
  if (raw.includes('tsunami')) return 'tsunami';
  if (raw.includes('flood')) return 'flood';
  if (raw.includes('landslide') || raw.includes('mudslide')) return 'landslide';
  if (raw.includes('fire')) return 'wildfire';
  if (raw.includes('drought')) return 'drought';
  return 'flood';
}

/**
 * Collects sorted unique timeline frames across all enabled hazard overlays
 * that actually carry timestamped sequence data.
 */
export function extractHazardTimeline(disasters = [], enabledOverlays = {}) {
  const frameMap = new Map();

  disasters.forEach(event => {
    const cat = inferHazardCategory(event);
    if (enabledOverlays[cat] === false) return;
    const hd = event.hazard_data;
    if (!hd) return;

    if (cat === 'cyclone' && Array.isArray(hd.track_points)) {
      hd.track_points.forEach(pt => {
        if (!pt.timestamp) return;
        frameMap.set(pt.timestamp, {
          timestamp: pt.timestamp,
          hazard: 'cyclone',
          kind: pt.kind || event.data_mode || 'observed',
          label: pt.intensity || event.title,
          source: event.source
        });
      });
    }

    if (cat === 'rainfall' && Array.isArray(hd.rainfall_frames)) {
      hd.rainfall_frames.forEach(fr => {
        if (!fr.timestamp) return;
        frameMap.set(fr.timestamp, {
          timestamp: fr.timestamp,
          hazard: 'rainfall',
          kind: fr.frame_type || event.data_mode || 'observed',
          label: fr.label || `${fr.intensity_mm_hr} mm/hr`,
          source: event.source
        });
      });
    }

    if (cat === 'tsunami' && Array.isArray(hd.wavefront_frames)) {
      hd.wavefront_frames.forEach(fr => {
        if (!fr.timestamp) return;
        frameMap.set(fr.timestamp, {
          timestamp: fr.timestamp,
          hazard: 'tsunami',
          kind: event.data_mode || 'modelled',
          label: fr.label || 'Ocean wavefront propagation',
          source: event.source
        });
      });
    }

    if (cat === 'flood' && Array.isArray(hd.inundation_frames)) {
      hd.inundation_frames.forEach(fr => {
        if (!fr.timestamp) return;
        frameMap.set(fr.timestamp, {
          timestamp: fr.timestamp,
          hazard: 'flood',
          kind: event.data_mode || 'observed',
          label: fr.label || 'Flood extent',
          source: event.source
        });
      });
    }
  });

  return Array.from(frameMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function pickFrameAtOrBefore(frames, activeTimestamp) {
  if (!Array.isArray(frames) || !frames.length) return null;
  if (!activeTimestamp) return frames[frames.length - 1];
  const targetMs = new Date(activeTimestamp).getTime();
  let chosen = frames[0];
  for (const frame of frames) {
    if (new Date(frame.timestamp).getTime() <= targetMs) {
      chosen = frame;
    }
  }
  return chosen;
}

/**
 * Builds separate GeoJSON feature collections per hazard geometry type
 * for the selected animation timestamp.
 */
export function buildHazardGeoJson(disasters = [], enabledOverlays = {}, activeTimestamp = null) {
  const polygons = [];
  const lines = [];
  const points = [];

  disasters.forEach(event => {
    const cat = inferHazardCategory(event);
    if (enabledOverlays[cat] === false) return;
    const hd = event.hazard_data || {};

    if (cat === 'earthquake') {
      if (Number.isFinite(Number(event.lat)) && Number.isFinite(Number(event.lng))) {
        points.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(event.lng), Number(event.lat)] },
          properties: {
            kind: 'earthquake_epicentre',
            event_id: event.event_id,
            title: event.title,
            magnitude: hd.magnitude || 'Not supplied',
            depth_km: hd.depth_km != null ? `${hd.depth_km} km` : 'Not supplied'
          }
        });
      }
      if (Array.isArray(hd.shaking_footprint)) {
        hd.shaking_footprint.forEach(ring => {
          polygons.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [ring] },
            properties: {
              kind: 'earthquake_footprint',
              fillColor: '#EF4444',
              fillOpacity: 0.14,
              strokeColor: '#F87171',
              strokeWidth: 1.5
            }
          });
        });
      }
      if (Array.isArray(hd.aftershocks)) {
        hd.aftershocks.forEach(as => {
          if (!Number.isFinite(Number(as.lat)) || !Number.isFinite(Number(as.lng))) return;
          points.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [Number(as.lng), Number(as.lat)] },
            properties: {
              kind: 'aftershock',
              title: `Aftershock ${as.magnitude || ''}`,
              event_id: event.event_id
            }
          });
        });
      }
    }

    if (cat === 'cyclone' && Array.isArray(hd.track_points) && hd.track_points.length > 0) {
      const observedCoords = hd.track_points
        .filter(p => p.kind !== 'forecast')
        .map(p => [Number(p.lng), Number(p.lat)]);
      const forecastCoords = hd.track_points
        .filter(p => p.kind === 'forecast')
        .map(p => [Number(p.lng), Number(p.lat)]);

      if (observedCoords.length >= 2) {
        lines.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: observedCoords },
          properties: {
            kind: 'cyclone_observed_track',
            strokeColor: '#F97316',
            strokeWidth: 3,
            dashed: false
          }
        });
      }
      if (observedCoords.length >= 1 && forecastCoords.length >= 1) {
        lines.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [observedCoords[observedCoords.length - 1], ...forecastCoords]
          },
          properties: {
            kind: 'cyclone_forecast_track',
            strokeColor: '#FBBF24',
            strokeWidth: 2.5,
            dashed: true
          }
        });
      }
      if (Array.isArray(hd.uncertainty_cone) && hd.uncertainty_cone.length >= 3) {
        polygons.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [hd.uncertainty_cone] },
          properties: {
            kind: 'cyclone_cone',
            fillColor: '#F59E0B',
            fillOpacity: 0.16,
            strokeColor: '#FBBF24',
            strokeWidth: 1.4
          }
        });
      }
      const activePt = pickFrameAtOrBefore(hd.track_points, activeTimestamp);
      if (activePt) {
        points.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [Number(activePt.lng), Number(activePt.lat)] },
          properties: {
            kind: 'cyclone_eye',
            event_id: event.event_id,
            title: `${event.title} (${activePt.kind})`,
            intensity: activePt.intensity || '',
            wind_kmh: activePt.wind_kmh || null
          }
        });
      }
    }

    if (cat === 'rainfall' && Array.isArray(hd.rainfall_frames)) {
      const frame = pickFrameAtOrBefore(hd.rainfall_frames, activeTimestamp);
      if (frame && Array.isArray(frame.polygon)) {
        const mm = Number(frame.intensity_mm_hr || 0);
        const color = mm >= 80 ? '#7C3AED' : mm >= 50 ? '#0284C7' : '#38BDF8';
        polygons.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [frame.polygon] },
          properties: {
            kind: 'rainfall_swath',
            fillColor: color,
            fillOpacity: 0.28,
            strokeColor: color,
            strokeWidth: 1.6,
            intensity_mm_hr: mm
          }
        });
      }
    }

    if (cat === 'tsunami') {
      if (hd.ocean_origin) {
        points.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(hd.ocean_origin.lng), Number(hd.ocean_origin.lat)]
          },
          properties: {
            kind: 'tsunami_origin',
            event_id: event.event_id,
            title: 'Offshore Tsunami Origin'
          }
        });
      }
      if (Array.isArray(hd.wavefront_frames)) {
        const frame = pickFrameAtOrBefore(hd.wavefront_frames, activeTimestamp);
        if (frame && Array.isArray(frame.wavefront_arc)) {
          lines.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: frame.wavefront_arc },
            properties: {
              kind: 'tsunami_wavefront',
              strokeColor: '#06B6D4',
              strokeWidth: 3.2,
              dashed: false
            }
          });
        }
      }
      if (Array.isArray(hd.affected_coastal_sections)) {
        hd.affected_coastal_sections.forEach(seg => {
          if (!Array.isArray(seg.coordinates)) return;
          lines.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: seg.coordinates },
            properties: {
              kind: 'tsunami_coast_threat',
              strokeColor: '#EF4444',
              strokeWidth: 4,
              dashed: false
            }
          });
        });
      }
    }

    if (cat === 'flood') {
      if (Array.isArray(hd.river_corridor) && hd.river_corridor.length >= 2) {
        lines.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: hd.river_corridor },
          properties: {
            kind: 'flood_river_corridor',
            strokeColor: '#3B82F6',
            strokeWidth: 3,
            dashed: false
          }
        });
      }
      if (Array.isArray(hd.inundation_frames)) {
        const frame = pickFrameAtOrBefore(hd.inundation_frames, activeTimestamp);
        if (frame && Array.isArray(frame.polygon)) {
          polygons.push({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [frame.polygon] },
            properties: {
              kind: 'flood_inundation',
              fillColor: '#2563EB',
              fillOpacity: 0.25,
              strokeColor: '#60A5FA',
              strokeWidth: 1.6
            }
          });
        }
      }
      if (Array.isArray(hd.river_gauges)) {
        hd.river_gauges.forEach(g => {
          if (!Number.isFinite(Number(g.lat)) || !Number.isFinite(Number(g.lng))) return;
          points.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [Number(g.lng), Number(g.lat)] },
            properties: {
              kind: 'river_gauge',
              title: g.name,
              water_level_m: g.water_level_m,
              danger_level_m: g.danger_level_m
            }
          });
        });
      }
    }

    // Extensible fallback for landslides / wildfires / drought geometries if supplied
    if ((cat === 'landslide' || cat === 'wildfire' || cat === 'drought') && Array.isArray(hd.polygons)) {
      hd.polygons.forEach(poly => {
        polygons.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [poly] },
          properties: {
            kind: `${cat}_zone`,
            fillColor: HAZARD_TYPES[cat].color,
            fillOpacity: 0.2,
            strokeColor: HAZARD_TYPES[cat].color,
            strokeWidth: 1.5
          }
        });
      });
    }
  });

  return {
    polygons: { type: 'FeatureCollection', features: polygons },
    lines: { type: 'FeatureCollection', features: lines },
    points: { type: 'FeatureCollection', features: points }
  };
}
