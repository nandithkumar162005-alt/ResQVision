import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  RotateCcw,
  Locate,
  Layers,
  Maximize2,
  Minimize2,
  CloudRain,
  Wind,
  Droplets,
  Check,
  Activity,
  Waves,
  Sun,
  Mountain,
  Play,
  Pause,
  FastForward,
} from 'lucide-react';
import { MapLegend } from './MapLegend';
import { getDamageSeverity, getDispatchStatusInfo } from '../utils/severityColors';
import { formatNumber, shortenId } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';
import { DisasterDropoutCard } from './DisasterDropoutCard';

const DEFAULT_CENTER = [22.0, 79.0]; // India centroid
const DEFAULT_ZOOM = 4.8;

// Available Tile Layers: Exactly Satellite, Terrain, and Land (zero API requirements)
const MAP_MODES = {
  SATELLITE: {
    id: 'SATELLITE',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&q=80',
    description: 'Orbital satellite imagery with states, districts & city names',
  },
  TERRAIN: {
    id: 'TERRAIN',
    name: 'Terrain',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    overlayUrl: null,
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=120&q=80',
    description: 'Elevation contours, mountain relief & river valleys',
  },
  LAND: {
    id: 'LAND',
    name: 'Land',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    overlayUrl: null,
    thumbnail: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=120&q=80',
    description: 'Clear land boundaries, transport roads & settlements',
  },
};

// SVG Disaster Symbols for GDACS-style pin badges (as shown in reference image)
function getDisasterSymbolSvg(category = '', disasterType = '') {
  const t = (category + ' ' + disasterType).toLowerCase();

  if (t.includes('cyclone') || t.includes('storm') || t.includes('gale')) {
    // Cyclone Hurricane Swirl
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 22 12a10 10 0 0 0-10-10Z"/>
        <path d="M12 12c-2.5 0-4-1.5-4-3s1.5-3 4-3 4 1.5 4 3-1.5 3-4 3Z"/>
        <circle cx="12" cy="12" r="2" fill="#FFFFFF"/>
      </svg>
    `;
  }
  if (t.includes('flood') || t.includes('rain')) {
    // Heavy Rain & Submerged House
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
        <path d="M16 14v6"/>
        <path d="M8 14v6"/>
        <path d="M12 16v6"/>
      </svg>
    `;
  }
  if (t.includes('earthquake') || t.includes('seismic')) {
    // Earthquake Seismograph Waveform
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="2 12 5 12 8 4 12 20 15 9 18 14 22 12"/>
      </svg>
    `;
  }
  if (t.includes('drought') || t.includes('aridity') || t.includes('heat')) {
    // Drought Cracked Soil & Wilting Plant
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a5 5 0 0 0-5 5v1"/>
        <path d="M17 7a5 5 0 0 0-5-5"/>
        <path d="M12 8v14"/>
        <path d="M7 16l5-4 5 4"/>
        <path d="M3 22h18"/>
      </svg>
    `;
  }
  if (t.includes('tsunami')) {
    // Tsunami Ocean Tidal Wave
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12c2.5-3 5.5-3 8 0 2.5 3 5.5 3 8 0 1.5-1.8 3-2.3 4-2"/>
        <path d="M2 17c2.5-3 5.5-3 8 0 2.5 3 5.5 3 8 0 1.5-1.8 3-2.3 4-2"/>
      </svg>
    `;
  }
  if (t.includes('landslide')) {
    // Landslide Mountain Slope
    return `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
        <circle cx="16" cy="18" r="1.5" fill="#FFFFFF"/>
        <circle cx="12" cy="19" r="1" fill="#FFFFFF"/>
      </svg>
    `;
  }

  // Default alert triangle
  return `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `;
}

// Create GDACS-Style Disaster Pin Badge Marker
function createTacticalMarkerIcon(incident, isSelected) {
  const isRed = incident.alert_level === 'RED' || incident.risk_level === 'CRITICAL';
  const badgeColor = isRed ? '#DC2626' : '#EA580C'; // Red Alert vs Orange Warning
  const symbolSvg = getDisasterSymbolSvg(incident.hazard_category, incident.disaster_type);
  const stormTag = incident.storm_tag || null;
  const stateLabel = incident.state_name || '';

  const scale = isSelected ? 1.2 : 1.0;

  const html = `
    <div class="gdacs-disaster-pin" style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transform: scale(${scale});
      transform-origin: bottom center;
    ">
      ${
        stormTag
          ? `
        <div style="
          background-color: #0F172A;
          color: #FFFFFF;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1.5px solid #FFFFFF;
          box-shadow: 0 4px 8px rgba(0,0,0,0.7);
          margin-bottom: 2px;
          white-space: nowrap;
        ">
          ${stormTag}
        </div>
      `
          : ''
      }

      <!-- GDACS Pin Badge Container with Pointed Bottom -->
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        background-color: ${badgeColor};
        border-radius: 8px 8px 4px 4px;
        border: 2px solid #FFFFFF;
        box-shadow: 0 8px 16px rgba(0,0,0,0.65);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${symbolSvg}

        <!-- Pointed triangular bottom tip -->
        <div style="
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid ${badgeColor};
        "></div>
      </div>

      <!-- Ground Epicenter Target Pulse Dot -->
      <div style="
        width: 8px;
        height: 8px;
        border-radius: 9999px;
        background-color: ${badgeColor};
        border: 1.5px solid #FFFFFF;
        margin-top: 5px;
        box-shadow: 0 0 10px ${badgeColor};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'resq-gdacs-marker',
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -52],
  });
}

export function DisasterMap({
  incidents = [],
  selectedIncidentId = null,
  selectedZoneId = null,
  onSelectIncident = null,
  onSelectZone = null,
  onViewDetails = null,
  className = '',
  height = '560px',
}) {
  const { isDark } = useTheme();
  const mapContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  const currentOverlayLayersRef = useRef([]);
  const markersLayerRef = useRef(null);
  const footprintsLayerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // States
  const [activeMode, setActiveMode] = useState('SATELLITE');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showFootprints, setShowFootprints] = useState(true);
  const [mouseCoords, setMouseCoords] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Weather dynamic animations toggles
  const [enableRainAnimation, setEnableRainAnimation] = useState(true);
  const [enableWindAnimation, setEnableWindAnimation] = useState(true);

  // Layer switching helper - Completely clean without API notice
  const applyTileLayers = useCallback((modeKey, map) => {
    if (!map) return;
    const mode = MAP_MODES[modeKey] || MAP_MODES.SATELLITE;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }

    if (currentOverlayLayersRef.current && currentOverlayLayersRef.current.length > 0) {
      currentOverlayLayersRef.current.forEach((l) => map.removeLayer(l));
      currentOverlayLayersRef.current = [];
    }

    const baseLayer = L.tileLayer(mode.url, {
      maxZoom: 19,
      attribution: '', // No API marks or external warnings
    });
    baseLayer.addTo(map);
    currentTileLayerRef.current = baseLayer;

    if (mode.overlayUrl) {
      const overlayLayer = L.tileLayer(mode.overlayUrl, {
        maxZoom: 19,
        opacity: 0.95,
        zIndex: 5,
        attribution: '',
      });
      overlayLayer.addTo(map);
      currentOverlayLayersRef.current.push(overlayLayer);
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Zero API attribution bar
    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false, // Explicitly removes "API required" or any third-party attribution
      preferCanvas: true,
    });

    applyTileLayers(activeMode, map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    footprintsLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('mousemove', (e) => {
      setMouseCoords({
        lat: e.latlng.lat.toFixed(4),
        lng: e.latlng.lng.toFixed(4),
      });
    });

    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [applyTileLayers, activeMode]);

  // Handle layer mode change
  const handleSwitchLayer = (modeKey) => {
    if (!mapInstanceRef.current || activeMode === modeKey) return;
    applyTileLayers(modeKey, mapInstanceRef.current);
    setActiveMode(modeKey);
    setShowLayerMenu(false);
  };

  // Reset to default India viewport
  const handleResetToIndia = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM, {
      animate: true,
      duration: 0.8,
    });
  }, []);

  // Fit viewport to all valid incident coordinates
  const handleFitIncidents = useCallback(() => {
    if (!mapInstanceRef.current || incidents.length === 0) return;

    const latLngs = [];
    incidents.forEach((inc) => {
      const primaryZone = (inc.critical_zones || [])[0];
      if (primaryZone && Number.isFinite(primaryZone.lat) && Number.isFinite(primaryZone.lng)) {
        latLngs.push([primaryZone.lat, primaryZone.lng]);
      }
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 12,
        animate: true,
      });
    } else {
      handleResetToIndia();
    }
  }, [incidents, handleResetToIndia]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  // Render ONLY ONE Spot Per Disaster on the Map!
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !footprintsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    footprintsLayerRef.current.clearLayers();

    // Determine target incidents to display
    // If an incident is specifically selected, display ONLY that one spot. Otherwise display each disaster's single epicenter spot!
    const targetIncidents = selectedIncidentId
      ? incidents.filter((i) => i.event_id === selectedIncidentId)
      : incidents;

    targetIncidents.forEach((incident) => {
      const isEventSelected = incident.event_id === selectedIncidentId;
      // Extract ONLY ONE primary spot (epicenter)
      const primarySpot = (incident.critical_zones || [])[0];
      if (!primarySpot || !Number.isFinite(primarySpot.lat) || !Number.isFinite(primarySpot.lng)) return;

      // Draw Multi-Band Radar / ShakeMap Hazard Contours (as shown in reference radar image)
      if (showFootprints) {
        const isDestroyed = primarySpot.damage_classification === 'destroyed';
        const baseRadius = isDestroyed ? 12000 : 8000;

        // Band 4 (Outer Monitored Green Contour)
        const ring4 = L.circle([primarySpot.lat, primarySpot.lng], {
          radius: baseRadius * 4.5,
          color: '#10B981',
          weight: 1.2,
          opacity: 0.55,
          fillColor: '#10B981',
          fillOpacity: 0.04,
          dashArray: '6, 6',
        });
        footprintsLayerRef.current.addLayer(ring4);

        // Band 3 (Moderate Hazard Yellow Contour)
        const ring3 = L.circle([primarySpot.lat, primarySpot.lng], {
          radius: baseRadius * 3.0,
          color: '#EAB308',
          weight: 1.4,
          opacity: 0.65,
          fillColor: '#EAB308',
          fillOpacity: 0.07,
          dashArray: '5, 5',
        });
        footprintsLayerRef.current.addLayer(ring3);

        // Band 2 (Severe Warning Orange Contour)
        const ring2 = L.circle([primarySpot.lat, primarySpot.lng], {
          radius: baseRadius * 1.8,
          color: '#F97316',
          weight: 1.6,
          opacity: 0.75,
          fillColor: '#F97316',
          fillOpacity: isEventSelected ? 0.18 : 0.12,
          dashArray: '4, 4',
        });
        footprintsLayerRef.current.addLayer(ring2);

        // Band 1 (Epicenter Core Red Contour)
        const ring1 = L.circle([primarySpot.lat, primarySpot.lng], {
          radius: baseRadius,
          color: '#EF4444',
          weight: 2,
          opacity: 0.9,
          fillColor: '#EF4444',
          fillOpacity: isEventSelected ? 0.28 : 0.20,
        });
        footprintsLayerRef.current.addLayer(ring1);
      }

      // Add ONLY ONE primary spot marker per state with GDACS Pin Badge
      const severity = primarySpot.severityInfo || getDamageSeverity(primarySpot.damage_classification);
      const icon = createTacticalMarkerIcon(incident, isEventSelected);

      const marker = L.marker([primarySpot.lat, primarySpot.lng], {
        icon,
        riseOnHover: true,
        zIndexOffset: isEventSelected ? 1000 : 200,
      });

      // Rich GDACS Dropout Popup
      const weather = incident.weather_telemetry || {};
      const isRedAlert = incident.alert_level === 'RED' || incident.risk_level === 'CRITICAL';
      const cat = (incident.hazard_category || '').toLowerCase();
      const popupDiv = document.createElement('div');
      popupDiv.className = `p-1 text-xs font-sans max-w-xs ${isDark ? 'text-white' : 'text-slate-900'}`;
      
      let weatherAnimationSummary = '';
      if (cat === 'flood' || (incident.disaster_type || '').toLowerCase().includes('rain') || (incident.disaster_type || '').toLowerCase().includes('flood')) {
        weatherAnimationSummary = `
          <div style="background: rgba(30, 58, 138, 0.35); border: 1px solid rgba(96, 165, 250, 0.4); border-radius: 8px; padding: 6px 8px; margin: 6px 0; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 5px; color: #93C5FD;">
              <span>🌧️</span>
              <span>Downpour: <strong>${weather.rainfall_rate_mm_hr || 245} mm/hr</strong></span>
            </div>
            ${weather.water_level_m ? `<span style="background: rgba(59, 130, 246, 0.3); padding: 1px 5px; border-radius: 4px; color: #BFDBFE;">+${weather.water_level_m}m</span>` : ''}
          </div>
        `;
      } else if (cat === 'earthquake' || (incident.disaster_type || '').toLowerCase().includes('earthquake')) {
        weatherAnimationSummary = `
          <div style="background: rgba(127, 29, 29, 0.35); border: 1px solid rgba(248, 113, 113, 0.4); border-radius: 8px; padding: 6px 8px; margin: 6px 0; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 5px; color: #FCA5A5;">
              <span>⚡</span>
              <span>Magnitude: <strong>${weather.magnitude_richter || 6.2}M</strong></span>
            </div>
            <span style="background: rgba(239, 68, 68, 0.3); padding: 1px 5px; border-radius: 4px; color: #FECACA;">Depth: ${weather.depth_km || 12}km</span>
          </div>
        `;
      } else if (cat === 'cyclone' || (incident.disaster_type || '').toLowerCase().includes('cyclone')) {
        weatherAnimationSummary = `
          <div style="background: rgba(19, 78, 74, 0.35); border: 1px solid rgba(45, 212, 191, 0.4); border-radius: 8px; padding: 6px 8px; margin: 6px 0; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 5px; color: #5EEAD4;">
              <span>🌀</span>
              <span>Eyewall: <strong>${weather.wind_speed_kmh || 175} km/h</strong></span>
            </div>
            <span style="background: rgba(20, 184, 166, 0.3); padding: 1px 5px; border-radius: 4px; color: #99F6E4;">${incident.storm_tag || 'CYCLONE'}</span>
          </div>
        `;
      } else if (cat === 'drought' || (incident.disaster_type || '').toLowerCase().includes('drought')) {
        weatherAnimationSummary = `
          <div style="background: rgba(120, 53, 15, 0.35); border: 1px solid rgba(251, 146, 60, 0.4); border-radius: 8px; padding: 6px 8px; margin: 6px 0; display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 11px;">
            <div style="display: flex; align-items: center; gap: 5px; color: #FDBA74;">
              <span>☀️</span>
              <span>Heat: <strong>${weather.temperature_c || 43.8}°C</strong></span>
            </div>
            <span style="background: rgba(249, 115, 22, 0.3); padding: 1px 5px; border-radius: 4px; color: #FED7AA;">Deficit: ${weather.soil_moisture_deficit_pct || 78}%</span>
          </div>
        `;
      }

      popupDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid ${isDark ? '#2B2E3A' : '#E2E8F0'};">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 9999px; background-color: ${isRedAlert ? '#EF4444' : '#F97316'}; display: inline-block;"></span>
            <span style="font-weight: 800; text-transform: uppercase; font-family: monospace; font-size: 11px; color: ${isRedAlert ? '#EF4444' : '#F97316'};">
              ${incident.state_name || 'STATE'}: ${incident.alert_level || 'ALERT'}
            </span>
          </div>
          <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-family: monospace; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}; border: 1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};">
            ${incident.event_id}
          </span>
        </div>

        <div style="font-weight: 700; font-size: 12.5px; line-height: 1.3; margin-bottom: 3px;">
          ${incident.disaster_type}
        </div>
        
        <div style="font-size: 11px; color: ${isDark ? '#94A3B8' : '#64748B'}; margin-bottom: 4px; line-height: 1.3;">
          ${incident.location_name}
        </div>

        ${weatherAnimationSummary}

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: ${isDark ? 'rgba(8, 9, 12, 0.85)' : 'rgba(241, 245, 249, 0.85)'}; padding: 6px; border-radius: 6px; margin-bottom: 6px; font-size: 10px; font-family: monospace; border: 1px solid ${isDark ? '#272A36' : '#CBD5E1'};">
          <div>
            <span style="color: ${isDark ? '#94A3B8' : '#64748B'};">Damage Index:</span>
            <span style="font-weight: 700; margin-left: 4px; color: #EF4444;">${incident.damage_score_out_of_100 || '—'}/100</span>
          </div>
          <div>
            <span style="color: ${isDark ? '#94A3B8' : '#64748B'};">Exposed:</span>
            <span style="font-weight: 700; margin-left: 4px;">${formatNumber(incident.affected_population_estimate)}</span>
          </div>
        </div>
      `;

      if (onViewDetails) {
        const btn = document.createElement('button');
        btn.className = `w-full py-1.5 px-3 rounded-lg font-semibold text-[11px] font-sans transition flex items-center justify-center gap-1 shadow-sm ${
          isDark
            ? 'bg-white hover:bg-slate-200 text-black'
            : 'bg-slate-900 hover:bg-black text-white'
        }`;
        btn.innerHTML = '<span>Inspect Operational Dossier</span>';
        btn.onclick = () => onViewDetails(incident.event_id);
        popupDiv.appendChild(btn);
      }

      marker.bindPopup(popupDiv, { maxWidth: 300, minWidth: 240 });

      marker.on('click', () => {
        if (onSelectIncident) onSelectIncident(incident.event_id);
        if (onSelectZone) onSelectZone(primarySpot.id);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [incidents, selectedIncidentId, showFootprints, onSelectIncident, onSelectZone, onViewDetails, isDark]);

  // Center on selected incident
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedIncidentId) return;
    const incident = incidents.find((i) => i.event_id === selectedIncidentId);
    if (!incident || !incident.critical_zones || incident.critical_zones.length === 0) return;

    const spot = incident.critical_zones[0];
    if (Number.isFinite(spot.lat) && Number.isFinite(spot.lng)) {
      mapInstanceRef.current.flyTo([spot.lat, spot.lng], 9.5, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedIncidentId, incidents]);

  // Dynamic Weather Simulation on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let tick = 0;
    const raindrops = Array.from({ length: 60 }, () => ({
      xOff: (Math.random() - 0.5) * 160,
      yOff: Math.random() * 160,
      speed: 4 + Math.random() * 5,
      length: 8 + Math.random() * 10,
    }));

    const windParticles = Array.from({ length: 45 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 20 + Math.random() * 90,
      speed: 0.02 + Math.random() * 0.03,
      size: 1.5 + Math.random() * 2,
    }));

    const animateWeather = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      const map = mapInstanceRef.current;
      if (map) {
        // Ground Event Dynamic Physics Animations (Rain, Wind, Seismic)
        incidents.forEach((incident) => {
          const type = (incident.disaster_type || '').toLowerCase();
          const isRainOrFlood = type.includes('flood') || type.includes('tsunami');
          const isWindOrCyclone = type.includes('cyclone') || type.includes('gale') || type.includes('storm');

          const primarySpot = (incident.critical_zones || [])[0];
          if (!primarySpot || !Number.isFinite(primarySpot.lat) || !Number.isFinite(primarySpot.lng)) return;

          const pt = map.latLngToContainerPoint([primarySpot.lat, primarySpot.lng]);
          if (pt.x < -100 || pt.x > width + 100 || pt.y < -100 || pt.y > height + 100) return;

          if (enableRainAnimation && isRainOrFlood) {
            const rippleCount = 3;
            for (let i = 0; i < rippleCount; i++) {
              const phase = (tick * 0.04 + i * (1 / rippleCount)) % 1;
              const radius = 12 + phase * 65;
              const alpha = Math.max(0, (1 - phase) * 0.55);

              ctx.beginPath();
              ctx.ellipse(pt.x, pt.y, radius, radius * 0.55, 0, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.fillStyle = `rgba(59, 130, 246, ${alpha * 0.12})`;
              ctx.fill();
            }

            ctx.strokeStyle = 'rgba(219, 234, 254, 0.65)';
            ctx.lineWidth = 1.2;
            raindrops.forEach((drop) => {
              const rx = pt.x + drop.xOff;
              const ry = pt.y + ((drop.yOff + tick * drop.speed) % 160) - 80;
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx - 2, ry + drop.length);
              ctx.stroke();
            });
          }

          if (enableWindAnimation && isWindOrCyclone) {
            ctx.save();
            windParticles.forEach((wp) => {
              const currentAngle = wp.angle + tick * wp.speed;
              const wx = pt.x + Math.cos(currentAngle) * wp.dist;
              const wy = pt.y + Math.sin(currentAngle) * (wp.dist * 0.7);

              const tailX = pt.x + Math.cos(currentAngle - 0.25) * (wp.dist - 2);
              const tailY = pt.y + Math.sin(currentAngle - 0.25) * ((wp.dist - 2) * 0.7);

              ctx.beginPath();
              ctx.moveTo(tailX, tailY);
              ctx.lineTo(wx, wy);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
              ctx.lineWidth = wp.size;
              ctx.stroke();

              ctx.beginPath();
              ctx.arc(wx, wy, wp.size * 0.8, 0, Math.PI * 2);
              ctx.fillStyle = '#FFFFFF';
              ctx.fill();
            });

            const spiralPhase = (tick * 0.03) % 1;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 25 + spiralPhase * 40, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - spiralPhase) * 0.4})`;
            ctx.setLineDash([8, 12]);
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
          }

          if (type.includes('earthquake')) {
            const shockwaveCount = 3;
            for (let i = 0; i < shockwaveCount; i++) {
              const phase = (tick * 0.03 + i * (1 / shockwaveCount)) % 1;
              const radius = 10 + phase * 75;
              const alpha = Math.max(0, (1 - phase) * 0.6);
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
              ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`;
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animateWeather);
    };

    animationFrameRef.current = requestAnimationFrame(animateWeather);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [incidents, enableRainAnimation, enableWindAnimation]);

  const activeModeDetails = MAP_MODES[activeMode] || MAP_MODES.SATELLITE;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border shadow-2xl select-none group ${
        isDark ? 'border-[#272A36] bg-[#0E1015]' : 'border-slate-200 bg-slate-100'
      } ${className}`}
      style={{ height }}
    >
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Synchronized Dynamic Weather Animation Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* TOP-LEFT: Map Mode Selector & Weather Controls */}
      <div className="absolute top-3.5 left-3.5 z-20 flex flex-wrap items-center gap-2">
        {/* Layer Mode Dropdown Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-medium shadow-xl transition backdrop-blur-md border ${
              isDark
                ? 'bg-[#12141A]/95 hover:bg-[#1A1D24] text-white border-[#2B2E3A]'
                : 'bg-white/95 hover:bg-slate-50 text-slate-900 border-slate-300'
            }`}
            title="Switch map base layer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold">{activeModeDetails.name}</span>
          </button>

          {showLayerMenu && (
            <div
              className={`absolute top-full left-0 mt-2 w-64 border rounded-xl shadow-2xl p-2 z-30 space-y-1 backdrop-blur-md ${
                isDark ? 'bg-[#12141A] border-[#2B2E3A]' : 'bg-white border-slate-200'
              }`}
            >
              <div
                className={`px-2 py-1 text-[10px] font-mono uppercase tracking-wider border-b mb-1 ${
                  isDark ? 'text-slate-400 border-[#272A36]' : 'text-slate-500 border-slate-200'
                }`}
              >
                Select Base Layer
              </div>
              {Object.values(MAP_MODES).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSwitchLayer(mode.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                    activeMode === mode.id
                      ? isDark
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'bg-slate-900 text-white font-semibold shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-[#1A1D24]'
                      : 'text-slate-700 hover:text-black hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={mode.thumbnail}
                      alt={mode.name}
                      className="w-8 h-8 rounded-md object-cover border border-slate-700/30"
                    />
                    <div>
                      <div className="font-medium">{mode.name}</div>
                      <div
                        className={`text-[10px] truncate max-w-[140px] ${
                          activeMode === mode.id
                            ? isDark ? 'text-slate-700' : 'text-slate-300'
                            : isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {mode.description}
                      </div>
                    </div>
                  </div>
                  {activeMode === mode.id && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rain Animation Toggle */}
        <button
          type="button"
          onClick={() => setEnableRainAnimation(!enableRainAnimation)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition shadow-lg backdrop-blur-md ${
            enableRainAnimation
              ? isDark
                ? 'bg-[#1E293B] text-white border-slate-400'
                : 'bg-slate-900 text-white border-slate-900'
              : isDark
              ? 'bg-[#12141A]/90 text-slate-400 border-[#272A36] hover:text-white'
              : 'bg-white/90 text-slate-600 border-slate-200 hover:text-black'
          }`}
          title="Toggle animated rain & water ripples"
        >
          <CloudRain className="w-3.5 h-3.5" />
          <span>Rain & Water</span>
          <span className={`w-1.5 h-1.5 rounded-full ${enableRainAnimation ? 'bg-blue-400' : 'bg-slate-400'}`} />
        </button>

        {/* Cyclone Wind Toggle */}
        <button
          type="button"
          onClick={() => setEnableWindAnimation(!enableWindAnimation)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition shadow-lg backdrop-blur-md ${
            enableWindAnimation
              ? isDark
                ? 'bg-[#1E293B] text-white border-slate-400'
                : 'bg-slate-900 text-white border-slate-900'
              : isDark
              ? 'bg-[#12141A]/90 text-slate-400 border-[#272A36] hover:text-white'
              : 'bg-white/90 text-slate-600 border-slate-200 hover:text-black'
          }`}
          title="Toggle animated cyclone streamlines"
        >
          <Wind className="w-3.5 h-3.5" />
          <span>Gale Streamlines</span>
          <span className={`w-1.5 h-1.5 rounded-full ${enableWindAnimation ? 'bg-white' : 'bg-slate-400'}`} />
        </button>

        {/* Footprint toggle */}
        <button
          type="button"
          onClick={() => setShowFootprints(!showFootprints)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition shadow-lg backdrop-blur-md ${
            showFootprints
              ? isDark
                ? 'bg-[#1E293B] text-white border-slate-400'
                : 'bg-slate-900 text-white border-slate-900'
              : isDark
              ? 'bg-[#12141A]/90 text-slate-400 border-[#272A36] hover:text-white'
              : 'bg-white/90 text-slate-600 border-slate-200 hover:text-black'
          }`}
          title="Toggle hazard radius footprint"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Single Epicenter Footprint</span>
        </button>
      </div>

      {/* TOP-RIGHT: Viewport Controls */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleFitIncidents}
          className={`p-2 rounded-xl border transition shadow-xl backdrop-blur-md ${
            isDark
              ? 'bg-[#12141A]/95 hover:bg-[#1A1D24] text-slate-300 hover:text-white border-[#2B2E3A]'
              : 'bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-black border-slate-300'
          }`}
          title="Fit all disaster epicenter spots"
        >
          <Locate className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetToIndia}
          className={`p-2 rounded-xl border transition shadow-xl backdrop-blur-md ${
            isDark
              ? 'bg-[#12141A]/95 hover:bg-[#1A1D24] text-slate-300 hover:text-white border-[#2B2E3A]'
              : 'bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-black border-slate-300'
          }`}
          title="Reset to National India View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className={`p-2 rounded-xl border transition shadow-xl backdrop-blur-md ${
            isDark
              ? 'bg-[#12141A]/95 hover:bg-[#1A1D24] text-slate-300 hover:text-white border-[#2B2E3A]'
              : 'bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-black border-slate-300'
          }`}
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* BOTTOM-LEFT: Legend & Coords */}
      <div className="absolute bottom-4 left-3.5 z-20 flex flex-col gap-2 max-w-xs pointer-events-auto">
        <MapLegend />

        {mouseCoords && (
          <div
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono backdrop-blur-md inline-flex items-center gap-2 w-fit ${
              isDark
                ? 'bg-[#08090C]/90 border-[#272A36] text-slate-400'
                : 'bg-white/90 border-slate-300 text-slate-700 shadow-sm'
            }`}
          >
            <span>TACTICAL GRID:</span>
            <span className="font-bold">
              {mouseCoords.lat}°N, {mouseCoords.lng}°E
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
