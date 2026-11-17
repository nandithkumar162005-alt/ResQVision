import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Activity,
  AlertTriangle,
  Building,
  Check,
  ChevronDown,
  CloudRain,
  Compass,
  Crosshair,
  Droplets,
  Eye,
  HeartPulse,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Radio,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  UtensilsCrossed,
  Waves,
  Wind,
  X
} from 'lucide-react';
import {
  buildHazardGeoJson,
  extractHazardTimeline,
  HAZARD_TYPES,
  inferHazardCategory
} from '../../utils/hazardEngine.js';
import {
  ALL_INDIA_EVACUATION_ROUTES,
  ALL_INDIA_HAZARD_AREAS,
  HYDERABAD_EVACUATION_ROUTES,
  HYDERABAD_HAZARD_AREAS,
  DEMO_RESOURCES
} from '../../data/mockData.js';
import { formatDateTime, formatRelativeTime, statusReadable } from '../../utils/format.js';

export const MAP_STYLES = {
  dark: {
    id: 'dark',
    label: 'Dark Tactical',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  },
  light: {
    id: 'light',
    label: 'Normal Map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  },
  terrain: {
    id: 'terrain',
    label: 'Normal Terrain',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'
  },
  satellite: {
    id: 'satellite',
    label: 'Satellite',
    style: {
      version: 8,
      sources: {
        'esri-world-imagery': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Imagery © Esri, Maxar, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'esri-world-imagery-layer',
          type: 'raster',
          source: 'esri-world-imagery',
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  }
};

export const INDIA_DISASTER_SECTORS = [
  {
    id: 'mumbai',
    city: 'Mumbai',
    label: 'Mumbai (M5.8 Seismic Fault Rupture)',
    shortBadge: 'Mumbai Earthquake',
    hazard: 'earthquake',
    badgeColor: '#EF4444',
    coords: [72.8777, 19.0760],
    zoom: 12.5,
    tag: 'Seismic Shockwave Epicenter M 5.8',
    description: 'Crustal shallow fault rupture with radial seismic shockwave propagation across the metropolitan corridor.'
  },
  {
    id: 'hyderabad',
    city: 'Hyderabad',
    label: 'Hyderabad (Heavy Precipitation & Flood)',
    shortBadge: 'Hyderabad Rainfall',
    hazard: 'rainfall',
    badgeColor: '#0284C7',
    coords: [78.4867, 17.3850],
    zoom: 13.0,
    tag: 'Severe Localized Rain Cell · 98 mm/hr',
    description: 'Intense cloudburst rain cell with circular surface inundation and Musi river causeway surge.'
  },
  {
    id: 'chennai',
    city: 'Chennai',
    label: 'Chennai (Cyclonic Storm Dana-26)',
    shortBadge: 'Chennai Cyclone',
    hazard: 'cyclone',
    badgeColor: '#9333EA',
    coords: [80.2707, 13.0827],
    zoom: 12.5,
    tag: 'Severe Cyclonic Storm Landfall Approach',
    description: 'Active rotating cyclone vortex with rotating gale swirls and coastal storm surge approaching Marina coast.'
  },
  {
    id: 'visakhapatnam',
    city: 'Visakhapatnam',
    label: 'Visakhapatnam (Coastal Surge Alert)',
    shortBadge: 'Vizag Coast Alert',
    hazard: 'flood',
    badgeColor: '#0D9488',
    coords: [83.2185, 17.6868],
    zoom: 12.5,
    tag: 'Coastal Storm Surge & Port Alert',
    description: 'High tidal wave action with SDRF and Indian Coast Guard boat patrols deployed.'
  },
  {
    id: 'assam',
    city: 'Guwahati',
    label: 'Assam & Brahmaputra (Monsoon Floods)',
    shortBadge: 'Assam Floods & Landslide',
    hazard: 'flood',
    badgeColor: '#0284C7',
    coords: [91.7362, 26.1445],
    zoom: 12.5,
    tag: 'Brahmaputra River Inundation & Kamakhya Landslide',
    description: 'River discharge exceeding danger mark with hillside debris clearance underway.'
  },
  {
    id: 'delhi',
    city: 'New Delhi / Rohtak',
    label: 'Delhi-NCR (M5.2 Seismic Epicenter)',
    shortBadge: 'Delhi-NCR Fault Line',
    hazard: 'earthquake',
    badgeColor: '#DC2626',
    coords: [77.1025, 28.7041],
    zoom: 12.5,
    tag: 'Shallow Fault Rupture M 5.2',
    description: 'Modified Mercalli VI ground shaking with DDMA rapid structural assessment deployed.'
  }
];

const RESOURCE_BADGES = {
  hospital: { short: 'H', bg: '#0284C7', label: 'Hospital' },
  shelter: { short: 'S', bg: '#16A34A', label: 'Shelter / Relief Camp' },
  food: { short: 'F', bg: '#EA580C', label: 'Food Distribution' },
  water: { short: 'W', bg: '#0D9488', label: 'Drinking Water' },
  rescue_center: { short: 'R', bg: '#7C3AED', label: 'Rescue Center' },
  road_closure: { short: 'X', bg: '#52525B', label: 'Road Closure' }
};

export function getEffectiveSector(activeSectorId, centerLng, centerLat) {
  if (activeSectorId) return activeSectorId;
  if (!Number.isFinite(centerLng) || !Number.isFinite(centerLat)) return 'hyderabad';
  let closest = 'hyderabad';
  let minDist = Infinity;
  INDIA_DISASTER_SECTORS.forEach(sec => {
    const dLng = sec.coords[0] - centerLng;
    const dLat = sec.coords[1] - centerLat;
    const dist = dLng * dLng + dLat * dLat;
    if (dist < minDist) {
      minDist = dist;
      closest = sec.id;
    }
  });
  return closest;
}

function matchesSector(itemCity, sectorId) {
  if (!sectorId) return true;
  const c = String(itemCity || '').toLowerCase();
  if (sectorId === 'visakhapatnam') return c.includes('visakhapatnam') || c.includes('vizag');
  if (sectorId === 'assam') return c.includes('guwahati') || c.includes('assam');
  if (sectorId === 'hyderabad') return c.includes('hyderabad');
  if (sectorId === 'delhi') return c.includes('delhi') || c.includes('rohtak');
  if (sectorId === 'mumbai') return c.includes('mumbai');
  if (sectorId === 'chennai') return c.includes('chennai');
  return true;
}

function createCirclePolygon(centerLng, centerLat, radiusKm, points = 36) {
  const coords = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i * 360) / points;
    const rad = (angle * Math.PI) / 180;
    const dx = radiusKm * Math.sin(rad);
    const dy = radiusKm * Math.cos(rad);
    const deltaLat = dy / 111.32;
    const deltaLng = dx / (111.32 * Math.cos((centerLat * Math.PI) / 180));
    coords.push([centerLng + deltaLng, centerLat + deltaLat]);
  }
  return coords;
}

function createPopupDom({ title, eyebrow, metaLines = [], dataMode, onViewDetails, theme }) {
  const isDark = theme === 'dark';
  const root = document.createElement('div');
  root.style.minWidth = '220px';
  root.style.maxWidth = '290px';
  root.style.padding = '4px';

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.alignItems = 'center';
  topRow.style.justifyContent = 'space-between';
  topRow.style.gap = '8px';

  const eye = document.createElement('span');
  eye.textContent = eyebrow || 'ResQVision Feed';
  eye.style.fontSize = '10px';
  eye.style.fontWeight = '800';
  eye.style.letterSpacing = '0.06em';
  eye.style.textTransform = 'uppercase';
  eye.style.color = '#EA580C';
  topRow.appendChild(eye);

  if (dataMode) {
    const tag = document.createElement('span');
    tag.textContent = dataMode === 'live' ? 'OPERATIONAL' : String(dataMode).toUpperCase();
    tag.style.fontSize = '9px';
    tag.style.fontWeight = '700';
    tag.style.padding = '1px 6px';
    tag.style.borderRadius = '999px';
    tag.style.background = isDark ? 'rgba(34, 197, 94, 0.25)' : '#DCFCE7';
    tag.style.color = isDark ? '#86EFAC' : '#166534';
    topRow.appendChild(tag);
  }
  root.appendChild(topRow);

  const heading = document.createElement('div');
  heading.textContent = title;
  heading.style.marginTop = '4px';
  heading.style.fontSize = '13px';
  heading.style.fontWeight = '800';
  heading.style.lineHeight = '1.3';
  heading.style.color = isDark ? '#FFFFFF' : '#0F172A';
  root.appendChild(heading);

  metaLines.filter(Boolean).forEach(line => {
    const p = document.createElement('div');
    p.textContent = line;
    p.style.marginTop = '4px';
    p.style.fontSize = '11px';
    p.style.color = isDark ? '#D4D4D8' : '#334155';
    root.appendChild(p);
  });

  if (onViewDetails) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'View Details';
    btn.style.marginTop = '8px';
    btn.style.width = '100%';
    btn.style.padding = '5px 8px';
    btn.style.borderRadius = '6px';
    btn.style.border = 'none';
    btn.style.background = '#EA580C';
    btn.style.color = '#FFFFFF';
    btn.style.fontSize = '11px';
    btn.style.fontWeight = '700';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', onViewDetails);
    root.appendChild(btn);
  }

  return root;
}

export default function ResQMap({
  theme = 'dark',
  defaultStyle = 'dark',
  disasters = [],
  resources = DEMO_RESOURCES,
  verifiedRoutes = [],
  rescueUnits = [],
  showRescueUnits = true,
  markers = null, // Custom tab markers (e.g. Shelter Tab, Operations, etc.)
  selectedMarkerId = null,
  onSelectMarker = null,
  activeEventHazardHint = null,
  focusTarget = null,
  onSelectDetail,
  heightClass = 'h-[500px] sm:h-[580px] lg:h-[640px]',
  className = '',
  pickMode = false,
  pickedCoords = null,
  onPickLocation,
  allowFullscreen = true,
  titleLabel = 'ResQVision Geospatial Tactical Map'
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const pickMarkerRef = useRef(null);
  const onPickRef = useRef(onPickLocation);
  onPickRef.current = onPickLocation;
  const onSelectDetailRef = useRef(onSelectDetail);
  onSelectDetailRef.current = onSelectDetail;
  const onSelectMarkerRef = useRef(onSelectMarker);
  onSelectMarkerRef.current = onSelectMarker;

  const isDark = theme === 'dark';

  // Active focused disaster sector (null = All India Overview)
  const [activeSector, setActiveSector] = useState(null);
  const [currentZoom, setCurrentZoom] = useState(4.5);
  const [mapCenter, setMapCenter] = useState([79.5, 21.5]);

  // Dropdown menus
  const [sectorMenuOpen, setSectorMenuOpen] = useState(false);
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // Map style state (dark / light / satellite)
  const [mapStyle, setMapStyle] = useState(() => (theme === 'dark' ? 'dark' : 'light'));
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [tileNotice, setTileNotice] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync theme
  useEffect(() => {
    setMapStyle(current => {
      if (current === 'satellite') return 'satellite';
      if (current === 'terrain') return 'terrain';
      return isDark ? 'dark' : 'light';
    });
  }, [isDark]);

  // Clean layer toggles inside compact dropdown
  const [layerToggles, setLayerToggles] = useState({
    satellite: false,
    radarAndWeather: true,
    hazardZones: true,
    shelters: true,
    evacuationTracing: true
  });

  const [hazardOverlays, setHazardOverlays] = useState({
    flood: true,
    cyclone: true,
    earthquake: true,
    rainfall: true,
    tsunami: false,
    landslide: true,
    wildfire: false,
    drought: false
  });

  // Dynamic evacuation tracing GeoJSON
  const isZoomedIn = activeSector !== null || currentZoom >= 7.6;
  const effectiveSector = useMemo(
    () => getEffectiveSector(activeSector, mapCenter[0], mapCenter[1]),
    [activeSector, mapCenter]
  );

  const tracingGeoJson = useMemo(() => {
    if (!layerToggles.evacuationTracing || !isZoomedIn) {
      return { type: 'FeatureCollection', features: [] };
    }
    const filtered = ALL_INDIA_EVACUATION_ROUTES.filter(r => matchesSector(r.city, effectiveSector));
    const features = filtered.map(r => ({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: r.path },
      properties: {
        id: r.id,
        city: r.city,
        name: r.name,
        target: r.target,
        color: r.color
      }
    }));
    return { type: 'FeatureCollection', features };
  }, [layerToggles.evacuationTracing, isZoomedIn, effectiveSector]);

  // Dynamic hazard danger areas GeoJSON (Red Light, Orange Caution & Blue Inundation Radial Circles)
  const hazardAreasGeoJson = useMemo(() => {
    if (!layerToggles.hazardZones) {
      return { type: 'FeatureCollection', features: [] };
    }
    const features = [];
    const filtered = ALL_INDIA_HAZARD_AREAS.filter(area => matchesSector(area.city, effectiveSector));
    filtered.forEach(area => {
      const polygonCoords = createCirclePolygon(area.center[0], area.center[1], area.radiusKm);
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [polygonCoords] },
        properties: {
          id: area.id,
          city: area.city,
          type: area.type,
          name: area.name,
          color: area.color,
          fillColor: area.fillColor,
          borderColor: area.borderColor
        }
      });
    });

    // Blue Inundation / Flood Radial Zone (Blue Circle)
    if (layerToggles.radarAndWeather && (effectiveSector === 'hyderabad' || !activeSector)) {
      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [createCirclePolygon(78.4867, 17.3850, 3.8)] },
        properties: {
          id: 'hyd-rain-circle-boundary',
          city: 'Hyderabad',
          type: 'rainfall_boundary',
          name: 'Hyderabad: Blue Inundation Radial Zone (Musi Basin)',
          fillColor: 'rgba(2, 132, 199, 0.22)',
          borderColor: '#0284C7'
        }
      });
    }

    return { type: 'FeatureCollection', features };
  }, [layerToggles.hazardZones, layerToggles.radarAndWeather, effectiveSector, activeSector]);

  // Fly to sector
  const flyToSector = sector => {
    const map = mapRef.current;
    if (!map) return;
    setActiveSector(sector.id);
    setSectorMenuOpen(false);
    map.flyTo({
      center: sector.coords,
      zoom: sector.zoom,
      duration: 1400
    });
  };

  const flyToIndiaOverview = () => {
    const map = mapRef.current;
    if (!map) return;
    setActiveSector(null);
    setSectorMenuOpen(false);
    map.flyTo({
      center: [79.5, 21.5],
      zoom: 4.4,
      duration: 1200
    });
  };

  // Initialize MapLibre
  useEffect(() => {
    if (!canvasRef.current) return;
    let initialCenter = [79.5, 21.5];
    let initialZoom = 4.4;

    if (pickedCoords && Number.isFinite(pickedCoords.lat) && Number.isFinite(pickedCoords.lng)) {
      initialCenter = [pickedCoords.lng, pickedCoords.lat];
      initialZoom = 13.0;
    } else if (focusTarget && Number.isFinite(focusTarget.lat) && Number.isFinite(focusTarget.lng)) {
      initialCenter = [focusTarget.lng, focusTarget.lat];
      initialZoom = focusTarget.zoom || 12.0;
    } else if (Array.isArray(markers) && markers.length > 0) {
      const first = markers[0];
      if (Number.isFinite(Number(first.lng)) && Number.isFinite(Number(first.lat))) {
        initialCenter = [Number(first.lng), Number(first.lat)];
        initialZoom = 12.0;
      }
    }

    const styleDef = MAP_STYLES[mapStyle]?.style || MAP_STYLES.dark.style;
    const map = new maplibregl.Map({
      container: canvasRef.current,
      style: styleDef,
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 3,
      maxZoom: 18,
      attributionControl: false
    });

    mapRef.current = map;

    map.on('zoom', () => {
      const z = map.getZoom();
      setCurrentZoom(z);
      // Instant continuous scaling of Chennai cyclone swirl on zoom frames
      const swirlEl = document.getElementById('rv-chennai-swirl-container');
      if (swirlEl) {
        const nextSize = Math.min(320, Math.max(48, Math.round(48 * Math.pow(1.24, Math.max(0, z - 4)))));
        swirlEl.style.width = `${nextSize}px`;
        swirlEl.style.height = `${nextSize}px`;
      }
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      setMapCenter([c.lng, c.lat]);
    });

    map.on('load', () => {
      setStyleLoaded(true);
      setTileNotice('');
    });

    map.on('error', err => {
      console.warn('MapLibre notice:', err?.error?.message || err);
      if (err?.error?.status === 404 || err?.error?.status === 401) {
        setTileNotice('Notice: Vector tiles loading via public Carto mirror.');
      }
    });

    if (pickMode) {
      map.on('click', e => {
        const { lng, lat } = e.lngLat;
        onPickRef.current?.({
          lat: Number(lat.toFixed(5)),
          lng: Number(lng.toFixed(5))
        });
      });
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (popupRef.current) popupRef.current.remove();
      if (pickMarkerRef.current) pickMarkerRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map style on theme or satellite switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const styleDef = MAP_STYLES[mapStyle]?.style || (isDark ? MAP_STYLES.dark.style : MAP_STYLES.light.style);
    setStyleLoaded(false);
    map.setStyle(styleDef);
    map.once('style.load', () => {
      setStyleLoaded(true);
    });
  }, [mapStyle, isDark]);

  // GeoJSON layers updater
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const upsertGeoJson = (sourceId, data) => {
      const src = map.getSource(sourceId);
      if (src) {
        src.setData(data);
      } else {
        map.addSource(sourceId, { type: 'geojson', data });
      }
    };

    // 1. Evacuation Tracing Corridors
    upsertGeoJson('rv-tracing-routes', tracingGeoJson);
    if (!map.getLayer('rv-tracing-routes-casing')) {
      map.addLayer({
        id: 'rv-tracing-routes-casing',
        type: 'line',
        source: 'rv-tracing-routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });
    }
    if (!map.getLayer('rv-tracing-routes-line')) {
      map.addLayer({
        id: 'rv-tracing-routes-line',
        type: 'line',
        source: 'rv-tracing-routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-dasharray': [3, 2]
        }
      });
    }

    // 2. Hazard Areas (Red Light Area & Orange Caution Area)
    upsertGeoJson('rv-india-hazard-areas', hazardAreasGeoJson);
    if (!map.getLayer('rv-india-hazard-areas-fill')) {
      map.addLayer({
        id: 'rv-india-hazard-areas-fill',
        type: 'fill',
        source: 'rv-india-hazard-areas',
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': 0.35
        }
      });
    }
    if (!map.getLayer('rv-india-hazard-areas-stroke')) {
      map.addLayer({
        id: 'rv-india-hazard-areas-stroke',
        type: 'line',
        source: 'rv-india-hazard-areas',
        paint: {
          'line-color': ['get', 'borderColor'],
          'line-width': 2.5
        }
      });
    }
  }, [styleLoaded, tracingGeoJson, hazardAreasGeoJson]);

  // Main Geospatial Markers Renderer
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const openPopup = (lngLat, popupOpts) => {
      if (popupRef.current) popupRef.current.remove();
      const dom = createPopupDom({
        ...popupOpts,
        theme,
        onViewDetails: popupOpts.detailPayload
          ? () => {
              onSelectDetailRef.current?.(popupOpts.detailPayload);
              popupRef.current?.remove();
            }
          : null
      });
      popupRef.current = new maplibregl.Popup({
        offset: 12,
        closeButton: true,
        className: theme === 'dark' ? 'rv-map-popup-dark' : 'rv-map-popup-light'
      })
        .setLngLat(lngLat)
        .setDOMContent(dom)
        .addTo(map);
    };

    // CASE A: Custom Tab Markers (Shelter Tab, Operations Page, Resources Page)
    if (Array.isArray(markers) && markers.length > 0) {
      markers.forEach(m => {
        const mLat = Number(m.lat);
        const mLng = Number(m.lng);
        if (!Number.isFinite(mLat) || !Number.isFinite(mLng)) return;

        const isSelected = selectedMarkerId && String(selectedMarkerId) === String(m.id);
        const badgeMeta = RESOURCE_BADGES[m.category] || {
          short: m.category ? m.category[0].toUpperCase() : 'S',
          bg: m.badgeColor || '#EA580C',
          label: m.category || 'Relief Asset'
        };

        const pinBtn = document.createElement('button');
        pinBtn.type = 'button';
        pinBtn.className = `flex items-center justify-center rounded-lg border-2 border-white text-white font-extrabold cursor-pointer transition-all shadow-md ${
          isSelected ? 'ring-4 ring-orange-500 scale-125 z-30' : 'hover:scale-110'
        }`;
        pinBtn.style.width = isSelected ? '30px' : '24px';
        pinBtn.style.height = isSelected ? '30px' : '24px';
        pinBtn.style.background = m.badgeColor || badgeMeta.bg;
        pinBtn.style.fontSize = isSelected ? '13px' : '11px';
        pinBtn.textContent = badgeMeta.short;

        pinBtn.addEventListener('click', e => {
          e.stopPropagation();
          onSelectMarkerRef.current?.(m);
          openPopup([mLng, mLat], {
            eyebrow: badgeMeta.label,
            title: m.title || m.name,
            dataMode: 'live',
            metaLines: [
              m.subtitle,
              m.details?.Address ? `Address: ${m.details.Address}` : null,
              m.details?.Capacity ? `Capacity: ${m.details.Capacity}` : null,
              m.details?.Availability ? `Status: ${m.details.Availability}` : null
            ],
            detailPayload: { kind: 'marker', marker: m }
          });
        });

        markersRef.current.push(
          new maplibregl.Marker({ element: pinBtn, anchor: 'center' })
            .setLngLat([mLng, mLat])
            .addTo(map)
        );
      });
      return;
    }

    // CASE B: Picked Coords / SOS Inspection Mode
    if (pickedCoords && Number.isFinite(pickedCoords.lat) && Number.isFinite(pickedCoords.lng)) {
      const sosPin = document.createElement('div');
      sosPin.className = 'relative flex items-center justify-center cursor-pointer';

      const pulse = document.createElement('div');
      pulse.className = 'absolute -inset-2 rounded-full bg-red-600/40 animate-ping';

      const core = document.createElement('div');
      core.className =
        'relative flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-xl border-2 border-white';
      core.innerHTML = '<span>SOS INCIDENT LOCATION</span>';

      sosPin.appendChild(pulse);
      sosPin.appendChild(core);

      sosPin.addEventListener('click', e => {
        e.stopPropagation();
        openPopup([pickedCoords.lng, pickedCoords.lat], {
          eyebrow: 'Emergency SOS Incident',
          title: 'Reported Citizen Emergency Location',
          dataMode: 'live',
          metaLines: [
            `Coordinates: ${pickedCoords.lat.toFixed(4)}° N, ${pickedCoords.lng.toFixed(4)}° E`,
            'Nearest Emergency Safe Haven & NDRF Staging Units alerted.'
          ]
        });
      });

      markersRef.current.push(
        new maplibregl.Marker({ element: sosPin, anchor: 'center' })
          .setLngLat([pickedCoords.lng, pickedCoords.lat])
          .addTo(map)
      );

      // Also render nearby shelters within 15km
      if (Array.isArray(resources)) {
        resources
          .filter(r => {
            const dLat = Math.abs(Number(r.lat) - pickedCoords.lat);
            const dLng = Math.abs(Number(r.lng) - pickedCoords.lng);
            return dLat < 0.2 && dLng < 0.2;
          })
          .forEach(res => {
            const rLat = Number(res.lat);
            const rLng = Number(res.lng);
            if (!Number.isFinite(rLat) || !Number.isFinite(rLng)) return;

            const badgeMeta = RESOURCE_BADGES[res.category] || { short: 'S', bg: '#16A34A', label: 'Shelter' };
            const sBtn = document.createElement('button');
            sBtn.type = 'button';
            sBtn.className =
              'flex items-center justify-center rounded-lg border-2 border-white text-white font-bold text-[10px] shadow-md transition hover:scale-110';
            sBtn.style.width = '22px';
            sBtn.style.height = '22px';
            sBtn.style.background = badgeMeta.bg;
            sBtn.textContent = badgeMeta.short;

            sBtn.addEventListener('click', e => {
              e.stopPropagation();
              openPopup([rLng, rLat], {
                eyebrow: badgeMeta.label,
                title: res.name,
                dataMode: 'live',
                metaLines: [
                  res.address || `${res.district || ''}, ${res.state || ''}`,
                  res.capacity ? `Capacity: ${res.capacity}` : null,
                  res.availability ? `Availability: ${res.availability}` : null
                ]
              });
            });

            markersRef.current.push(
              new maplibregl.Marker({ element: sBtn, anchor: 'center' })
                .setLngLat([rLng, rLat])
                .addTo(map)
            );
          });
      }
      return;
    }

    // CASE C: All India Disaster Sectors & Dynamic Hazard Animations
    // 1. ALL 6 Disaster Sectors are ALWAYS mounted to the map at their exact geographic coordinates
    // Fixed zero-offset anchor: container is exactly 0x0px so MapLibre pins it to the exact GPS point.
    // Tags never displace on zoom, and never move with mouse movement.
    INDIA_DISASTER_SECTORS.forEach(sec => {
      const container = document.createElement('div');
      container.className = 'rv-map-pin-root';
      container.style.cssText =
        'position: absolute; width: 0px; height: 0px; pointer-events: none; user-select: none;';

      // Weather / Hazard Animation Elements (Centered at 0, 0)
      if (layerToggles.radarAndWeather) {
        // MUMBAI: Earthquake Hazard Warning Light (Small, confined strictly to epicenter)
        if (sec.id === 'mumbai') {
          const hazardLight = document.createElement('div');
          hazardLight.style.cssText =
            'position: absolute; left: 0px; top: 0px; transform: translate(-50%, -50%); width: 28px; height: 28px; pointer-events: none; display: flex; align-items: center; justify-content: center;';
          hazardLight.innerHTML = `
            <div class="rv-hazard-strobe-halo" style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background: rgba(239, 68, 68, 0.35); border: 1.5px solid #EF4444;"></div>
            <div class="rv-hazard-core-light" style="position: absolute; width: 14px; height: 14px; border-radius: 9999px; background: #EF4444; border: 2px solid #FFFFFF; box-shadow: 0 0 10px #EF4444, 0 0 16px rgba(245, 158, 11, 0.9);"></div>
            <div style="position: absolute; width: 5px; height: 5px; border-radius: 9999px; background: #FFFFFF;"></div>
          `;
          container.appendChild(hazardLight);
        }

        // HYDERABAD: Rainfall in Small Circular Radius with Falling Raindrops
        else if (sec.id === 'hyderabad') {
          const rainBox = document.createElement('div');
          rainBox.style.cssText =
            'position: absolute; left: 0px; top: 0px; transform: translate(-50%, -50%); pointer-events: none; width: 68px; height: 68px; border-radius: 9999px; border: 1.5px dashed #0284C7; background: radial-gradient(circle, rgba(2, 132, 199, 0.22) 0%, rgba(2, 132, 199, 0.04) 80%); overflow: hidden; display: flex; align-items: center; justify-content: center;';
          rainBox.innerHTML = `
            <div class="rv-rain-ripple-ring" style="position: absolute; width: 34px; height: 34px; border-radius: 9999px; border: 1.5px solid rgba(56, 189, 248, 0.85);"></div>
            <div class="rv-rain-ripple-ring" style="position: absolute; width: 52px; height: 52px; border-radius: 9999px; border: 1.5px solid rgba(14, 165, 233, 0.65); animation-delay: 0.8s;"></div>
            <div class="rv-raindrop" style="position: absolute; top: 4px; left: 14px; width: 2px; height: 10px; background: linear-gradient(to bottom, transparent, #38BDF8); border-radius: 2px; animation-duration: 0.85s;"></div>
            <div class="rv-raindrop" style="position: absolute; top: 2px; left: 30px; width: 2px; height: 12px; background: linear-gradient(to bottom, transparent, #38BDF8); border-radius: 2px; animation-duration: 0.75s; animation-delay: 0.25s;"></div>
            <div class="rv-raindrop" style="position: absolute; top: 6px; left: 46px; width: 2px; height: 11px; background: linear-gradient(to bottom, transparent, #0284C7); border-radius: 2px; animation-duration: 0.95s; animation-delay: 0.45s;"></div>
            <div class="rv-raindrop" style="position: absolute; top: 3px; left: 56px; width: 2px; height: 9px; background: linear-gradient(to bottom, transparent, #38BDF8); border-radius: 2px; animation-duration: 0.8s; animation-delay: 0.15s;"></div>
            <div style="position: absolute; width: 7px; height: 7px; border-radius: 9999px; background: #0284C7; border: 1.5px solid white;"></div>
          `;
          container.appendChild(rainBox);
        }

        // CHENNAI: Cyclone Swirls Animation ONLY (Rotating spiral swirls as in layers tab)
        else if (sec.id === 'chennai') {
          const swirlBox = document.createElement('div');
          swirlBox.className = 'rv-cyclone-spin';
          swirlBox.style.cssText =
            'position: absolute; left: 0px; top: 0px; transform: translate(-50%, -50%); pointer-events: none; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;';
          swirlBox.innerHTML = `
            <svg viewBox="0 0 100 100" style="width: 34px; height: 34px; filter: drop-shadow(0 0 6px rgba(168, 85, 247, 0.9));">
              <path d="M 50,50 A 24,24 0 0,0 78,24 A 36,36 0 0,1 50,50" fill="#9333EA" />
              <path d="M 50,50 A 24,24 0 0,0 22,76 A 36,36 0 0,1 50,50" fill="#A855F7" />
              <path d="M 50,50 A 24,24 0 0,0 24,22 A 36,36 0 0,1 50,50" fill="#C084FC" />
              <path d="M 50,50 A 24,24 0 0,0 76,78 A 36,36 0 0,1 50,50" fill="#7E22CE" />
              <circle cx="50" cy="50" r="6" fill="#EF4444" stroke="#FFFFFF" stroke-width="2" />
            </svg>
          `;
          container.appendChild(swirlBox);
        }
      }

      // Sleek Disaster Tag / Badge (Anchored directly above 0, 0; pointer points to exact coordinate)
      const badgeWrapper = document.createElement('div');
      badgeWrapper.style.cssText =
        'position: absolute; left: 0px; bottom: 8px; transform: translate(-50%, 0); pointer-events: auto; cursor: pointer; display: flex; flex-direction: column; align-items: center; white-space: nowrap;';

      const badge = document.createElement('div');
      badge.className =
        'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xl border-2 border-white transition hover:scale-105';
      badge.style.background = sec.badgeColor;
      badge.innerHTML = `<span>${sec.shortBadge}</span>`;

      const pointer = document.createElement('div');
      pointer.style.width = '0px';
      pointer.style.height = '0px';
      pointer.style.borderLeft = '4px solid transparent';
      pointer.style.borderRight = '4px solid transparent';
      pointer.style.borderTop = `6px solid ${sec.badgeColor}`;
      pointer.style.marginTop = '-1px';

      badgeWrapper.appendChild(badge);
      badgeWrapper.appendChild(pointer);
      container.appendChild(badgeWrapper);

      // On click: fly to sector and open detailed operational popup
      badgeWrapper.addEventListener('click', e => {
        e.stopPropagation();
        if (!isZoomedIn || activeSector !== sec.id) {
          flyToSector(sec);
        } else {
          openPopup(sec.coords, {
            eyebrow: sec.tag,
            title: sec.label,
            dataMode: 'live',
            metaLines: [
              sec.description,
              `Coordinates: ${sec.coords[1].toFixed(4)}° N, ${sec.coords[0].toFixed(4)}° E`,
              'All verified relief camps, food shelters, and evacuation routes active in this sector.'
            ]
          });
        }
      });

      markersRef.current.push(
        new maplibregl.Marker({ element: container, anchor: 'center' })
          .setLngLat(sec.coords)
          .addTo(map)
      );
    });

    // 2. Zoomed-in Sector Mode: Display local shelters, safe havens, and evacuation routes
    if (isZoomedIn) {
      // Evacuation Route Destination Badges (Safe Havens)
      if (layerToggles.evacuationTracing) {
        const activeRoutes = ALL_INDIA_EVACUATION_ROUTES.filter(r => matchesSector(r.city, effectiveSector));
        activeRoutes.forEach(route => {
          const destCoords = route.destination
            ? [route.destination.lng, route.destination.lat]
            : route.path[route.path.length - 1];
          const isRescue = route.color === '#3B82F6';
          const isFood = route.color === '#10B981';
          const badgeText = isRescue ? 'RESCUE' : isFood ? 'FOOD SHELTER' : 'TRAUMA';

          const destBtn = document.createElement('button');
          destBtn.type = 'button';
          destBtn.className =
            'rounded-full px-2.5 py-0.5 text-[9px] font-extrabold text-white shadow-lg border border-white cursor-pointer transition hover:scale-105';
          destBtn.style.background = route.color;
          destBtn.textContent = badgeText;

          destBtn.addEventListener('click', e => {
            e.stopPropagation();
            openPopup(destCoords, {
              eyebrow: 'Designated Safe Haven',
              title: route.target,
              dataMode: 'live',
              metaLines: [
                `Sector: ${route.city}`,
                `Route: ${route.name}`,
                `Coordinates: ${destCoords[1].toFixed(4)}° N, ${destCoords[0].toFixed(4)}° E`,
                'Corridor inspected and operational.'
              ]
            });
          });

          markersRef.current.push(
            new maplibregl.Marker({ element: destBtn, anchor: 'center' })
              .setLngLat(destCoords)
              .addTo(map)
          );
        });
      }

      // Local Resources (Shelters, Food, Hospitals, Water) for this Sector
      if (layerToggles.shelters && Array.isArray(resources)) {
        const localResources = resources.filter(res => matchesSector(res.city, effectiveSector));
        localResources.forEach(res => {
          const rLat = Number(res.lat);
          const rLng = Number(res.lng);
          if (!Number.isFinite(rLat) || !Number.isFinite(rLng)) return;

          const badgeMeta = RESOURCE_BADGES[res.category] || { short: 'S', bg: '#16A34A', label: 'Shelter' };

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.setAttribute('aria-label', `${badgeMeta.label}: ${res.name}`);
          btn.className =
            'flex items-center justify-center rounded-lg border-2 border-white text-white font-extrabold text-[10.5px] shadow-md transition hover:scale-110 cursor-pointer';
          btn.style.width = '24px';
          btn.style.height = '24px';
          btn.style.background = badgeMeta.bg;
          btn.textContent = badgeMeta.short;

          btn.addEventListener('click', e => {
            e.stopPropagation();
            openPopup([rLng, rLat], {
              eyebrow: badgeMeta.label,
              title: res.name,
              dataMode: 'live',
              metaLines: [
                res.address || `${res.district || ''}, ${res.state || ''}`,
                res.capacity ? `Capacity: ${res.capacity}` : null,
                res.availability ? `Availability: ${res.availability}` : null,
                res.verified_contact ? `Helpline: ${res.verified_contact}` : null
              ],
              detailPayload: { kind: 'resource', resource: res }
            });
          });

          markersRef.current.push(
            new maplibregl.Marker({ element: btn, anchor: 'center' })
              .setLngLat([rLng, rLat])
              .addTo(map)
          );
        });
      }
    }
  }, [
    isZoomedIn,
    effectiveSector,
    activeSector,
    currentZoom,
    mapCenter,
    markers,
    selectedMarkerId,
    pickedCoords,
    resources,
    layerToggles.radarAndWeather,
    layerToggles.shelters,
    layerToggles.evacuationTracing,
    theme
  ]);

  // Handle selectedMarkerId flyTo (e.g. from Shelter list selection)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedMarkerId || !Array.isArray(markers)) return;
    const target = markers.find(m => String(m.id) === String(selectedMarkerId));
    if (target && Number.isFinite(Number(target.lat)) && Number.isFinite(Number(target.lng))) {
      map.flyTo({
        center: [Number(target.lng), Number(target.lat)],
        zoom: 13.5,
        duration: 900
      });
    }
  }, [selectedMarkerId, markers]);

  // Handle focusTarget flyTo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    const lat = Number(focusTarget.lat);
    const lng = Number(focusTarget.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.flyTo({
      center: [lng, lat],
      zoom: focusTarget.zoom || 12.5,
      duration: 800
    });
  }, [focusTarget]);

  // Toggle Fullscreen
  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        if (wrapperRef.current?.requestFullscreen) {
          await wrapperRef.current.requestFullscreen();
          return;
        }
      } catch {
        // Fallback
      }
      setIsFullscreen(true);
      setTimeout(() => mapRef.current?.resize(), 120);
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return;
        }
      } catch {
        // Fallback
      }
      setIsFullscreen(false);
      setTimeout(() => mapRef.current?.resize(), 120);
    }
  };

  const glassPill = isDark
    ? 'bg-[#12161F]/90 backdrop-blur-md text-white border border-white/15'
    : 'bg-white/95 backdrop-blur-md text-slate-900 border border-slate-300 shadow-md';

  const isTabMode = Boolean(Array.isArray(markers) || pickedCoords || pickMode);

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden border transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none'
          : `w-full rounded-2xl ${className || heightClass}`
      } ${isDark ? 'border-white/10 bg-[#0B0D10]' : 'border-slate-300 bg-white shadow-sm'}`}
    >
      {/* MapLibre Canvas */}
      <div
        ref={canvasRef}
        className={`h-full w-full ${pickMode ? 'cursor-crosshair' : ''}`}
        aria-label={titleLabel}
      />

      {/* TOP CONTROLS: Clean Dropdowns (No Clutter!) */}
      {!isTabMode && (
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-20 flex items-center justify-between gap-2">
          {/* Left: Disaster Sector Selector Dropdown */}
          <div className="pointer-events-auto relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSectorMenuOpen(v => !v);
                setLayersMenuOpen(false);
              }}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${glassPill} hover:border-orange-500`}
            >
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              <span>
                {activeSector
                  ? INDIA_DISASTER_SECTORS.find(s => s.id === activeSector)?.shortBadge || 'Disaster Sector'
                  : 'All India Overview'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {/* Back to All India Pill */}
            {activeSector && (
              <button
                type="button"
                onClick={flyToIndiaOverview}
                title="Return to National India Overview"
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition shadow-sm ${glassPill} hover:text-orange-500`}
              >
                <RotateCcw className="h-3 w-3 text-orange-400" />
                <span>All India</span>
              </button>
            )}

            {/* Sector Dropdown Menu */}
            {sectorMenuOpen && (
              <div
                className={`absolute left-0 top-10 z-30 w-72 rounded-2xl p-2 shadow-2xl border ${
                  isDark
                    ? 'bg-[#12161F]/95 backdrop-blur-xl border-white/15 text-white'
                    : 'bg-white/95 backdrop-blur-xl border-slate-300 text-slate-900'
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-orange-500 font-bold">
                  Select Disaster Location (Zooms In)
                </div>
                <button
                  type="button"
                  onClick={flyToIndiaOverview}
                  className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold transition text-left ${
                    !activeSector
                      ? 'bg-orange-500 text-white'
                      : isDark
                      ? 'hover:bg-white/10'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5 text-orange-400" />
                  <span>All India (National Overview)</span>
                </button>
                <div className="my-1 border-t border-white/10 dark:border-white/10" />
                {INDIA_DISASTER_SECTORS.map(sec => {
                  const isCur = activeSector === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => flyToSector(sec)}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition text-left ${
                        isCur
                          ? 'bg-orange-500 text-white font-bold'
                          : isDark
                          ? 'hover:bg-white/10'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{sec.shortBadge.split(' ')[0]}</span>
                        <span>{sec.label}</span>
                      </div>
                      {isCur && <Check className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Base Map Toggle & Layers Dropdown & Zoom Buttons */}
          <div className="pointer-events-auto relative flex items-center gap-1.5">
            {/* Quick Map Base Style Toggle Button (Dark / Normal / Terrain / Satellite) */}
            <div className={`hidden sm:flex items-center rounded-xl p-0.5 shadow-sm ${glassPill}`}>
              <button
                type="button"
                onClick={() => setMapStyle('dark')}
                title="Switch to Dark Tactical Map"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'dark'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('light')}
                title="Switch to Normal Light Map"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'light'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('terrain')}
                title="Switch to Normal Terrain Map"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'terrain'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Terrain
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                title="Switch to Satellite Imagery"
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  mapStyle === 'satellite'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : isDark
                    ? 'text-zinc-400 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Layers Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLayersMenuOpen(v => !v);
                  setSectorMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-sm ${glassPill} hover:border-orange-500`}
              >
                <Layers className="h-3.5 w-3.5 text-orange-500" />
                <span>Layers</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {layersMenuOpen && (
                <div
                  className={`absolute right-0 top-10 z-30 w-64 rounded-2xl p-2.5 shadow-2xl border space-y-2 ${
                    isDark
                      ? 'bg-[#12161F]/95 backdrop-blur-xl border-white/15 text-white'
                      : 'bg-white/95 backdrop-blur-xl border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-orange-500 font-bold">
                    Base Map Style
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/10 dark:bg-white/5 border border-white/10 text-[10.5px] font-bold">
                    <button
                      type="button"
                      onClick={() => setMapStyle('dark')}
                      className={`px-1.5 py-1 rounded-lg transition text-center cursor-pointer ${
                        mapStyle === 'dark'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : isDark
                          ? 'text-zinc-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('light')}
                      className={`px-1.5 py-1 rounded-lg transition text-center cursor-pointer ${
                        mapStyle === 'light'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : isDark
                          ? 'text-zinc-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('terrain')}
                      className={`px-1.5 py-1 rounded-lg transition text-center cursor-pointer ${
                        mapStyle === 'terrain'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : isDark
                          ? 'text-zinc-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Terrain
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapStyle('satellite')}
                      className={`px-1.5 py-1 rounded-lg transition text-center cursor-pointer ${
                        mapStyle === 'satellite'
                          ? 'bg-orange-600 text-white shadow-sm'
                          : isDark
                          ? 'text-zinc-400 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Satellite
                    </button>
                  </div>

                  <div className="my-1 border-t border-white/10 dark:border-white/10" />

                  <div className="px-1 text-[10px] font-mono uppercase tracking-wider text-orange-500 font-bold">
                    Geospatial Layers
                  </div>

                  {/* Radar & Weather */}
                  <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                      Radar &amp; Storm Swirl
                    </span>
                    <input
                      type="checkbox"
                      checked={layerToggles.radarAndWeather}
                      onChange={e => setLayerToggles(t => ({ ...t, radarAndWeather: e.target.checked }))}
                      className="rounded accent-orange-500"
                    />
                  </label>

                  {/* Red/Orange Hazard Zones */}
                  <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                      Danger Zones (Red/Orange)
                    </span>
                    <input
                      type="checkbox"
                      checked={layerToggles.hazardZones}
                      onChange={e => setLayerToggles(t => ({ ...t, hazardZones: e.target.checked }))}
                      className="rounded accent-orange-500"
                    />
                  </label>

                  {/* Shelters & Relief Points */}
                  <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <Building className="h-3.5 w-3.5 text-emerald-400" />
                      Shelters &amp; Relief Hubs
                    </span>
                    <input
                      type="checkbox"
                      checked={layerToggles.shelters}
                      onChange={e => setLayerToggles(t => ({ ...t, shelters: e.target.checked }))}
                      className="rounded accent-orange-500"
                    />
                  </label>

                  {/* Evacuation Tracing */}
                  <label className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <Navigation className="h-3.5 w-3.5 text-amber-400" />
                      Evacuation Tracing
                    </span>
                    <input
                      type="checkbox"
                      checked={layerToggles.evacuationTracing}
                      onChange={e => setLayerToggles(t => ({ ...t, evacuationTracing: e.target.checked }))}
                      className="rounded accent-orange-500"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Standard Zoom Buttons */}
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              title="Zoom In"
              className={`h-7 w-7 flex items-center justify-center rounded-xl font-bold shadow-sm ${glassPill}`}
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              title="Zoom Out"
              className={`h-7 w-7 flex items-center justify-center rounded-xl font-bold shadow-sm ${glassPill}`}
            >
              -
            </button>

            {/* Fullscreen Expand */}
            {allowFullscreen && (
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
                className={`h-7 w-7 flex items-center justify-center rounded-xl shadow-sm ${glassPill}`}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-orange-400" /> : <Maximize2 className="h-3.5 w-3.5 text-orange-400" />}
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM CONTROLS: Clean Legend Popover & Coordinates HUD */}
      {!isTabMode && (
        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between gap-2">
          {/* Bottom Left: Compact Legend Toggle Button */}
          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={() => setLegendOpen(v => !v)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-bold shadow-sm transition ${glassPill} hover:border-orange-500`}
            >
              <Info className="h-3.5 w-3.5 text-orange-500" />
              <span>Legend</span>
            </button>

            {legendOpen && (
              <div
                className={`absolute bottom-8 left-0 z-30 w-64 rounded-2xl p-3 shadow-2xl border space-y-2 text-xs ${
                  isDark
                    ? 'bg-[#12161F]/95 backdrop-blur-xl border-white/15 text-white'
                    : 'bg-white/95 backdrop-blur-xl border-slate-300 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between border-b pb-1 border-white/10">
                  <span className="font-bold text-orange-500 text-[11px]">Map Legend</span>
                  <button type="button" onClick={() => setLegendOpen(false)}>
                    <X className="h-3.5 w-3.5 opacity-60" />
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-600/30 border-2 border-red-600 shrink-0" />
                    <span><strong>Red Zone:</strong> High Danger / Zero Entry (Red Circle)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-amber-500/30 border-2 border-dashed border-amber-500 shrink-0" />
                    <span><strong>Orange Zone:</strong> Major Damage Caution (Orange Circle)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-sky-500/30 border-2 border-sky-500 shrink-0" />
                    <span><strong>Blue Zone:</strong> Inundation / Flood Basin (Blue Circle)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded bg-emerald-600 text-white font-extrabold text-[8px] flex items-center justify-center shrink-0">S</span>
                    <span><strong>Shelters &amp; Safe Havens</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-4 rounded border-b-2 border-dashed border-emerald-500 shrink-0" />
                    <span><strong>Evacuation Tracing Corridor</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Right: Clean Coordinates & Active Sector Badge */}
          <div className={`pointer-events-auto rounded-xl px-2.5 py-1 text-[10.5px] font-mono font-bold shadow-sm ${glassPill}`}>
            {activeSector ? (
              <span>
                Sector: {INDIA_DISASTER_SECTORS.find(s => s.id === activeSector)?.city || 'Active Sector'}
              </span>
            ) : (
              <span>National Surveillance Overview</span>
            )}
          </div>
        </div>
      )}

      {tileNotice && (
        <div className="pointer-events-none absolute right-3 top-14 z-20 max-w-xs rounded-xl border border-amber-400/40 bg-amber-950/90 px-3 py-1.5 text-[11px] text-amber-200 shadow-lg">
          {tileNotice}
        </div>
      )}
    </div>
  );
}
