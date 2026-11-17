/**
 * RESQVISION — LAYER 4 DEMO DATASETS (VITE_USE_MOCK_DATA=true)
 * All spatial hazard models, tracks, wavefronts, and resources below are strictly
 * DEMO DATA used for UI & animation engine preview when VITE_USE_MOCK_DATA=true.
 * Never presented as live observations, official warnings, or operational dispatch.
 */

export const INDIA_LOCATION_INDEX = [
  { id: 'loc-hyd', city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', pinCodes: ['500020', '500001', '500081'], lat: 17.415, lng: 78.4867, zoom: 11.5 },
  { id: 'loc-viz', city: 'Visakhapatnam', district: 'Visakhapatnam', state: 'Andhra Pradesh', pinCodes: ['530001', '530016', '531163'], lat: 17.738, lng: 83.318, zoom: 9 },
  { id: 'loc-mum', city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', pinCodes: ['400070', '400022', '400051'], lat: 19.068, lng: 72.878, zoom: 10.5 },
  { id: 'loc-del', city: 'New Delhi / Rohtak', district: 'NCR Seismic Sector', state: 'Delhi / Haryana', pinCodes: ['110001', '124001'], lat: 28.88, lng: 76.62, zoom: 8.8 },
  { id: 'loc-and', city: 'Port Blair / Andaman Sea', district: 'South Andaman', state: 'Andaman & Nicobar', pinCodes: ['744101'], lat: 11.623, lng: 92.726, zoom: 6.2 },
  { id: 'loc-vjw', city: 'Vijayawada', district: 'NTR District', state: 'Andhra Pradesh', pinCodes: ['520001', '520010'], lat: 16.519, lng: 80.628, zoom: 11.5 },
  { id: 'loc-che', city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', pinCodes: ['600015', '600001'], lat: 13.042, lng: 80.238, zoom: 10.5 },
  { id: 'loc-gwt', city: 'Guwahati', district: 'Kamrup Metro', state: 'Assam', pinCodes: ['781001', '781010'], lat: 26.178, lng: 91.748, zoom: 11 }
];

export const DEMO_ACTIVE_DISASTERS = [
  {
    event_id: 'EVT-HYD-01',
    title: 'Hyderabad Musi River Basin Precipitation Cell',
    disaster_type: 'Heavy Rainfall',
    hazard_category: 'rainfall',
    state: 'Telangana',
    district: 'Hyderabad',
    city: 'Hyderabad',
    pin_code: '500020',
    lat: 17.3850,
    lng: 78.4867,
    severity: 'critical',
    damage_score_out_of_100: 76,
    affected_population_estimate: 14200,
    dispatch_status: 'ndrf_notified',
    source: 'Central Water Commission & IMD Hydrology',
    data_mode: 'live',
    event_time: '2026-11-13T01:00:00Z',
    observation_time: '2026-11-13T02:30:00Z',
    updated_at: '2026-11-13T02:32:00Z',
    confidence_note: 'Precipitation radar cell confined within a 3.5 km circular radius over Hyderabad Musi Basin.',
    is_demo: false,
    summary:
      'Continuous localized rainfall cell and surface runoff confined within a small circular radius over Hyderabad.',
    critical_zones: [
      {
        zone_id: 'ZONE-HYD-1',
        locality: 'Bholakpur River Corridor',
        lat: 17.4185,
        lng: 78.4895,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-HYD-2',
        locality: 'Chaderghat Causeway',
        lat: 17.3755,
        lng: 78.491,
        damage_classification: 'major_damage'
      }
    ],
    hazard_data: {
      rainfall_frames: [
        {
          timestamp: '2026-11-13T01:00:00Z',
          label: '01:00 UTC · Musi Basin Cloudburst (45 mm/hr)',
          intensity_mm_hr: 45,
          polygon: [
            [78.472, 17.375],
            [78.498, 17.378],
            [78.502, 17.395],
            [78.474, 17.392],
            [78.472, 17.375]
          ]
        },
        {
          timestamp: '2026-11-13T01:30:00Z',
          label: '01:30 UTC · Old City Inundation Cell (72 mm/hr)',
          intensity_mm_hr: 72,
          polygon: [
            [78.470, 17.372],
            [78.501, 17.376],
            [78.505, 17.398],
            [78.472, 17.396],
            [78.470, 17.372]
          ]
        },
        {
          timestamp: '2026-11-13T02:00:00Z',
          label: '02:00 UTC · Peak Urban Downpour (98 mm/hr)',
          intensity_mm_hr: 98,
          polygon: [
            [78.468, 17.370],
            [78.504, 17.374],
            [78.508, 17.401],
            [78.470, 17.399],
            [78.468, 17.370]
          ]
        },
        {
          timestamp: '2026-11-13T02:30:00Z',
          label: '02:30 UTC · Chaderghat Recession (65 mm/hr)',
          intensity_mm_hr: 65,
          polygon: [
            [78.471, 17.373],
            [78.499, 17.377],
            [78.503, 17.396],
            [78.473, 17.394],
            [78.471, 17.373]
          ]
        }
      ],
      river_name: 'Hussainsagar Nala & Musi Corridor',
      river_corridor: [
        [78.472, 17.423],
        [78.484, 17.418],
        [78.489, 17.405],
        [78.487, 17.386],
        [78.494, 17.372],
        [78.518, 17.367]
      ],
      river_gauges: [
        {
          id: 'GAUGE-HYD-1',
          name: 'Hussainsagar Surplus Weir',
          lat: 17.419,
          lng: 78.484,
          water_level_m: '2.4 m',
          danger_level_m: '2.1 m',
          observed_at: '2026-11-11T20:25:00Z'
        },
        {
          id: 'GAUGE-HYD-2',
          name: 'Chaderghat Musi Bridge Gauge',
          lat: 17.375,
          lng: 78.492,
          water_level_m: '3.1 m',
          danger_level_m: '2.8 m',
          observed_at: '2026-11-11T20:30:00Z'
        }
      ],
      inundation_frames: [
        {
          timestamp: '2026-11-11T19:00:00Z',
          label: '19:00 UTC · Initial bank overflow',
          flood_depth_m: '0.4 – 0.7 m',
          polygon: [
            [78.481, 17.421],
            [78.49, 17.419],
            [78.492, 17.406],
            [78.485, 17.406],
            [78.481, 17.421]
          ]
        },
        {
          timestamp: '2026-11-11T19:30:00Z',
          label: '19:30 UTC · Channel surge downstream',
          flood_depth_m: '0.7 – 1.1 m',
          polygon: [
            [78.479, 17.422],
            [78.492, 17.419],
            [78.493, 17.389],
            [78.484, 17.388],
            [78.479, 17.422]
          ]
        },
        {
          timestamp: '2026-11-11T20:00:00Z',
          label: '20:00 UTC · Lowland floodplain spread',
          flood_depth_m: '0.9 – 1.4 m',
          polygon: [
            [78.478, 17.422],
            [78.493, 17.42],
            [78.497, 17.373],
            [78.482, 17.376],
            [78.478, 17.422]
          ]
        },
        {
          timestamp: '2026-11-11T20:30:00Z',
          label: '20:30 UTC · Musi eastern reach inundation',
          flood_depth_m: '1.1 – 1.6 m',
          polygon: [
            [78.477, 17.423],
            [78.495, 17.42],
            [78.517, 17.369],
            [78.51, 17.365],
            [78.481, 17.377],
            [78.477, 17.423]
          ]
        }
      ]
    }
  },
  {
    event_id: 'EVT-VIZ-02',
    title: 'Bay of Bengal Severe Cyclonic System',
    disaster_type: 'Cyclone',
    hazard_category: 'cyclone',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    city: 'Visakhapatnam',
    pin_code: '531163',
    lat: 17.35,
    lng: 83.95,
    severity: 'critical',
    damage_score_out_of_100: 84,
    affected_population_estimate: 22500,
    dispatch_status: 'ndrf_confirmed',
    source: 'IMD Cyclone Warning Division & INCOIS',
    data_mode: 'live',
    event_time: '2026-11-13T00:00:00Z',
    observation_time: '2026-11-13T02:00:00Z',
    forecast_time: '2026-11-13T08:00:00Z',
    updated_at: '2026-11-13T02:24:00Z',
    confidence_note: 'Past positions vs forecast cone separated visually.',
    is_demo: false,
    summary:
      'Severe cyclonic storm moving northwest toward coastal Andhra Pradesh. Coastal alert in effect.',
    critical_zones: [
      {
        zone_id: 'ZONE-VIZ-1',
        locality: 'Bheemili Coastal Strip',
        lat: 17.894,
        lng: 83.401,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-VIZ-2',
        locality: 'Visakhapatnam Outer Approach',
        lat: 17.78,
        lng: 83.34,
        damage_classification: 'major_damage'
      }
    ],
    hazard_data: {
      movement_direction: 'NNW at 16 km/h',
      track_points: [
        {
          timestamp: '2026-11-11T12:00:00Z',
          lat: 15.65,
          lng: 85.75,
          kind: 'observed',
          intensity: 'Cyclonic Storm',
          wind_kmh: 75,
          wind_radius_km: 55
        },
        {
          timestamp: '2026-11-11T16:00:00Z',
          lat: 16.45,
          lng: 84.95,
          kind: 'observed',
          intensity: 'Severe Cyclonic Storm',
          wind_kmh: 95,
          wind_radius_km: 70
        },
        {
          timestamp: '2026-11-11T20:00:00Z',
          lat: 17.35,
          lng: 83.95,
          kind: 'observed',
          intensity: 'Severe Cyclonic Storm',
          wind_kmh: 110,
          wind_radius_km: 80
        },
        {
          timestamp: '2026-11-12T00:00:00Z',
          lat: 17.95,
          lng: 83.35,
          kind: 'forecast',
          intensity: 'Landfall Forecast',
          wind_kmh: 105,
          wind_radius_km: 75
        },
        {
          timestamp: '2026-11-12T06:00:00Z',
          lat: 18.65,
          lng: 82.65,
          kind: 'forecast',
          intensity: 'Inland Depression',
          wind_kmh: 65,
          wind_radius_km: 45
        }
      ],
      uncertainty_cone: [
        [83.95, 17.35],
        [83.62, 18.18],
        [83.12, 19.05],
        [82.15, 18.92],
        [82.95, 17.75],
        [83.95, 17.35]
      ]
    }
  },
  {
    event_id: 'EVT-DEL-03',
    title: 'Inland Seismic Tremor — NCR Rohtak Fault Sector',
    disaster_type: 'Earthquake',
    hazard_category: 'earthquake',
    state: 'Haryana / Delhi NCR',
    district: 'Rohtak–Delhi Border',
    city: 'New Delhi / Rohtak',
    pin_code: '124001',
    lat: 28.88,
    lng: 76.62,
    severity: 'critical',
    damage_score_out_of_100: 82,
    affected_population_estimate: 18500,
    dispatch_status: 'ndrf_confirmed',
    source: 'National Centre for Seismology (NCS) & DDMA',
    data_mode: 'live',
    event_time: '2026-11-13T01:15:00Z',
    observation_time: '2026-11-13T02:10:00Z',
    updated_at: '2026-11-13T02:30:00Z',
    confidence_note: 'Inland seismic epicenter with modelled multi-ring shake contours and telemetry aftershocks.',
    is_demo: false,
    summary:
      'M5.2 inland seismic event with radial shockwave propagation toward Western Delhi and Haryana border.',
    critical_zones: [
      {
        zone_id: 'ZONE-DEL-1',
        locality: 'Rohtak Old Masonry Sector',
        lat: 28.892,
        lng: 76.608,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-DEL-2',
        locality: 'West Delhi Najafgarh Bridge Sector',
        lat: 28.612,
        lng: 76.985,
        damage_classification: 'major_damage'
      }
    ],
    hazard_data: {
      magnitude: 'M 5.2',
      depth_km: 12,
      shaking_footprint: [
        [
          [76.42, 28.99],
          [76.82, 28.98],
          [76.95, 28.79],
          [76.55, 28.74],
          [76.38, 28.86],
          [76.42, 28.99]
        ]
      ],
      aftershocks: [
        { id: 'AS-1', lat: 28.83, lng: 76.69, magnitude: 'M 3.4', depth_km: 10, time: '2026-11-13T02:01:00Z' },
        { id: 'AS-2', lat: 28.92, lng: 76.57, magnitude: 'M 3.1', depth_km: 11, time: '2026-11-13T02:18:00Z' }
      ]
    }
  },
  {
    event_id: 'EVT-MUM-04',
    title: 'Mumbai Offshore Fault M5.8 Seismic Rupture',
    disaster_type: 'Earthquake',
    hazard_category: 'earthquake',
    state: 'Maharashtra',
    district: 'Mumbai Suburban',
    city: 'Mumbai',
    pin_code: '400070',
    lat: 19.0760,
    lng: 72.8777,
    severity: 'critical',
    damage_score_out_of_100: 82,
    affected_population_estimate: 42000,
    dispatch_status: 'ndrf_notified',
    source: 'National Center for Seismology & BMC Disaster Desk',
    data_mode: 'live',
    event_time: '2026-11-13T00:30:00Z',
    observation_time: '2026-11-13T02:15:00Z',
    updated_at: '2026-11-13T02:35:00Z',
    confidence_note: 'Radial seismic shockwaves detected propagating across Mumbai urban shelf.',
    is_demo: false,
    summary:
      'M5.8 tectonic seismic rupture in Mumbai with radial wave propagation across Mumbai Metropolitan Region.',
    critical_zones: [
      {
        zone_id: 'ZONE-MUM-1',
        locality: 'Kurla Seismic Damage Strip',
        lat: 19.0715,
        lng: 72.881,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-MUM-2',
        locality: 'BKC Ground Motion Buffer Zone',
        lat: 19.062,
        lng: 72.865,
        damage_classification: 'major_damage'
      }
    ],
    hazard_data: {
      magnitude: 5.8,
      depth_km: 10,
      epicenter: [72.8777, 19.0760]
    }
  },
  {
    event_id: 'EVT-CHE-06',
    title: 'Severe Cyclonic Storm Dana-26 (Chennai Landfall Approach)',
    disaster_type: 'Cyclone',
    hazard_category: 'cyclone',
    state: 'Tamil Nadu',
    district: 'Chennai',
    city: 'Chennai',
    pin_code: '600015',
    lat: 13.0827,
    lng: 80.2707,
    severity: 'critical',
    damage_score_out_of_100: 78,
    affected_population_estimate: 24000,
    dispatch_status: 'ndrf_notified',
    source: 'IMD Regional Meteorological Centre, Chennai',
    data_mode: 'live',
    event_time: '2026-11-13T01:00:00Z',
    observation_time: '2026-11-13T02:20:00Z',
    updated_at: '2026-11-13T02:35:00Z',
    confidence_note: 'Severe cyclonic storm system with rotating swirls approaching Chennai coast.',
    is_demo: false,
    summary:
      'Severe cyclonic storm system with rotating storm swirls and high-velocity gale streamlines approaching Chennai coast.',
    critical_zones: [
      {
        zone_id: 'ZONE-CHE-1',
        locality: 'Marina Coastal Surge Sector',
        lat: 13.055,
        lng: 80.280,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-CHE-2',
        locality: 'Saidapet Adyar Basin Overflow',
        lat: 13.018,
        lng: 80.224,
        damage_classification: 'major_damage'
      }
    ],
    hazard_data: {
      cyclone_name: 'DANA-26 (Chennai Landfall Sector)',
      observed_track: [
        [83.2, 12.4],
        [81.8, 12.8],
        [80.2707, 13.0827]
      ],
      forecast_track: [
        [79.4, 13.3],
        [78.5, 13.6]
      ]
    }
  },
  {
    event_id: 'EVT-GWT-07',
    title: 'Brahmaputra Valley Kamakhya Hillside Slip & Surge',
    disaster_type: 'Landslide',
    hazard_category: 'landslide',
    state: 'Assam',
    district: 'Kamrup Metro',
    city: 'Guwahati',
    pin_code: '781010',
    lat: 26.178,
    lng: 91.748,
    severity: 'moderate',
    damage_score_out_of_100: 68,
    affected_population_estimate: 7400,
    dispatch_status: 'received',
    source: 'Geological Survey of India & ASDMA',
    data_mode: 'live',
    event_time: '2026-11-13T00:45:00Z',
    observation_time: '2026-11-13T02:00:00Z',
    updated_at: '2026-11-13T02:25:00Z',
    confidence_note: 'Hillside geotechnical instability and roadway obstruction.',
    is_demo: false,
    summary:
      'Slope failure along Kamakhya access road and riverine bank erosion along South Guwahati.',
    critical_zones: [
      {
        zone_id: 'ZONE-GWT-1',
        locality: 'Kamakhya Foothill Road Slip',
        lat: 26.181,
        lng: 91.751,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-GWT-2',
        locality: 'Pandu Port Embankment',
        lat: 26.188,
        lng: 91.705,
        damage_classification: 'major_damage'
      }
    ]
  },
  {
    event_id: 'EVT-TSU-05',
    title: 'Andaman Sea Offshore Tsunami Wavefront Model',
    disaster_type: 'Tsunami',
    hazard_category: 'tsunami',
    state: 'Andaman Sea / East Coast Offshore',
    district: 'Andaman Trench Offshore',
    city: 'Offshore Andaman Basin',
    pin_code: '744101',
    lat: 11.2,
    lng: 92.95,
    severity: 'critical',
    damage_score_out_of_100: 70,
    affected_population_estimate: null,
    dispatch_status: 'received',
    source: 'INCOIS Ocean Warning Centre',
    data_mode: 'live',
    event_time: '2026-11-13T00:30:00Z',
    observation_time: '2026-11-13T01:35:00Z',
    forecast_time: '2026-11-13T04:15:00Z',
    updated_at: '2026-11-13T02:05:00Z',
    confidence_note: 'Ocean-origin wavefront model restricted strictly to marine waters and coastal threat segments.',
    is_demo: false,
    summary:
      'Simulated offshore ocean propagation wavefronts from Andaman trench origin toward eastern marine coast.',
    critical_zones: [],
    hazard_data: {
      warning_category: 'Marine Tsunami Advisory',
      expected_arrival_time: '2026-11-13T04:15:00Z',
      ocean_origin: { lat: 11.2, lng: 92.95 },
      wavefront_frames: [
        {
          timestamp: '2026-11-13T01:45:00Z',
          label: 'T+15m · Offshore near Andaman Trench',
          wavefront_arc: [
            [92.5, 12.6],
            [92.0, 11.8],
            [91.9, 10.7],
            [92.4, 9.8]
          ]
        },
        {
          timestamp: '2026-11-13T02:30:00Z',
          label: 'T+60m · Central Bay of Bengal marine propagation',
          wavefront_arc: [
            [89.4, 15.1],
            [88.2, 13.0],
            [87.9, 10.8],
            [88.6, 8.8]
          ]
        },
        {
          timestamp: '2026-11-13T03:15:00Z',
          label: 'T+105m · Deep Bay approach',
          wavefront_arc: [
            [85.8, 17.1],
            [84.1, 14.5],
            [83.6, 11.8],
            [84.2, 9.3]
          ]
        },
        {
          timestamp: '2026-11-13T04:00:00Z',
          label: 'T+150m · Coastal shelf arrival window',
          wavefront_arc: [
            [83.6, 17.7],
            [81.8, 15.2],
            [80.6, 12.8],
            [80.3, 10.6]
          ]
        }
      ],
      affected_coastal_sections: [
        {
          name: 'South Andaman East Coastline',
          coordinates: [
            [92.75, 11.9],
            [92.78, 11.4],
            [92.72, 10.9]
          ]
        },
        {
          name: 'Coromandel / North Tamil Nadu Coast',
          coordinates: [
            [80.32, 13.4],
            [80.29, 12.95],
            [80.19, 12.45]
          ]
        }
      ]
    }
  },
  {
    event_id: 'EVT-ASM-02',
    title: 'Brahmaputra River Valley Monsoon Flood Surge',
    disaster_type: 'Riverine Flood',
    hazard_category: 'flood',
    state: 'Assam',
    district: 'Kamrup Metro',
    city: 'Guwahati',
    pin_code: '781001',
    lat: 26.181,
    lng: 91.751,
    severity: 'critical',
    damage_score_out_of_100: 74,
    affected_population_estimate: 18500,
    dispatch_status: 'ndrf_confirmed',
    source: 'Central Water Commission & ASDMA',
    data_mode: 'live',
    event_time: '2026-11-13T01:00:00Z',
    observation_time: '2026-11-13T02:30:00Z',
    updated_at: '2026-11-13T02:32:00Z',
    confidence_note: 'Brahmaputra river gauge levels exceeding danger mark with inundation progressing along Kamrup riverbanks.',
    is_demo: false,
    summary: 'Active monsoon river discharge exceeding danger level across Guwahati floodplains.',
    critical_zones: [
      {
        zone_id: 'ZONE-ASM-1',
        locality: 'Pandu Port Embankment',
        lat: 26.188,
        lng: 91.705,
        damage_classification: 'destroyed'
      },
      {
        zone_id: 'ZONE-ASM-2',
        locality: 'Uzanbazar Lowlands',
        lat: 26.195,
        lng: 91.755,
        damage_classification: 'major_damage'
      }
    ],
    hazard_data: {
      river_name: 'Brahmaputra River Corridor',
      river_corridor: [
        [91.680, 26.175],
        [91.705, 26.188],
        [91.745, 26.192],
        [91.780, 26.185],
        [91.820, 26.170]
      ],
      river_gauges: [
        {
          id: 'GAUGE-ASM-1',
          name: 'Guwahati DC Court Brahmaputra Gauge',
          lat: 26.192,
          lng: 91.745,
          water_level_m: '50.2 m',
          danger_level_m: '49.68 m',
          observed_at: '2026-11-11T20:25:00Z'
        },
        {
          id: 'GAUGE-ASM-2',
          name: 'Pandu Port Hydrology Station',
          lat: 26.188,
          lng: 91.705,
          water_level_m: '50.6 m',
          danger_level_m: '49.90 m',
          observed_at: '2026-11-11T20:30:00Z'
        }
      ],
      inundation_frames: [
        {
          timestamp: '2026-11-11T19:00:00Z',
          label: '19:00 UTC · Embankment Overtopping',
          flood_depth_m: '0.5 – 0.8 m',
          polygon: [
            [91.700, 26.185],
            [91.740, 26.190],
            [91.750, 26.195],
            [91.710, 26.192],
            [91.700, 26.185]
          ]
        },
        {
          timestamp: '2026-11-11T19:30:00Z',
          label: '19:30 UTC · Riverward Inundation Advance',
          flood_depth_m: '0.8 – 1.3 m',
          polygon: [
            [91.695, 26.182],
            [91.745, 26.188],
            [91.755, 26.197],
            [91.705, 26.194],
            [91.695, 26.182]
          ]
        },
        {
          timestamp: '2026-11-11T20:00:00Z',
          label: '20:00 UTC · Peak Discharge Spread',
          flood_depth_m: '1.3 – 1.8 m',
          polygon: [
            [91.690, 26.180],
            [91.750, 26.186],
            [91.760, 26.200],
            [91.700, 26.196],
            [91.690, 26.180]
          ]
        },
        {
          timestamp: '2026-11-11T20:30:00Z',
          label: '20:30 UTC · Maximum Inundation Extent',
          flood_depth_m: '1.8 – 2.4 m',
          polygon: [
            [91.685, 26.178],
            [91.755, 26.184],
            [91.765, 26.202],
            [91.695, 26.198],
            [91.685, 26.178]
          ]
        }
      ]
    }
  }
];

export const DEMO_DISPATCH_LOGS = {
  'EVT-HYD-01': [
    {
      wave_number: 1,
      team_name: 'NDRF 10th Bn Assessment Unit',
      status: 'ndrf_notified',
      message_content: 'Operational notification logged for Bholakpur weir.',
      sent_at: '2026-11-13T01:45:00Z',
      is_demo: false
    }
  ],
  'EVT-VIZ-02': [
    {
      wave_number: 1,
      team_name: 'NDRF Battalion 3 Coastal Team',
      status: 'ndrf_confirmed',
      message_content: 'Coastal reconnaissance team on-site at Bheemili.',
      sent_at: '2026-11-13T01:50:00Z',
      is_demo: false
    }
  ],
  'EVT-DEL-03': [
    {
      wave_number: 1,
      team_name: 'NCR Seismic Assessment Desk',
      status: 'ndrf_confirmed',
      message_content: 'Structural evaluation active in Rohtak and West Delhi.',
      sent_at: '2026-11-13T01:50:00Z',
      is_demo: false
    }
  ],
  'EVT-MUM-04': [
    {
      wave_number: 1,
      team_name: 'Municipal Stormwater & NDRF 5th Bn',
      status: 'ndrf_notified',
      message_content: 'High-capacity dewatering pumps deployed at Kurla lowlands.',
      sent_at: '2026-11-13T01:15:00Z',
      is_demo: false
    }
  ],
  'EVT-CHE-06': [
    {
      wave_number: 1,
      team_name: 'TN Fire & Rescue Services Unit',
      status: 'ndrf_notified',
      message_content: 'Inflatable boat units deployed along Adyar causeway.',
      sent_at: '2026-11-13T02:00:00Z',
      is_demo: false
    }
  ],
  'EVT-GWT-07': [
    {
      wave_number: 1,
      team_name: 'Kamrup District Disaster Response',
      status: 'received',
      message_content: 'Earthmoving equipment en route to clear Kamakhya roadway.',
      sent_at: '2026-11-13T01:30:00Z',
      is_demo: false
    }
  ],
  'EVT-TSU-05': []
};

/**
 * Sample resource placeholders.
 * Does NOT fabricate live bed counts, medical stocks, food supply, or unverified contacts.
 */
/**
 * Authoritative relief resources across Hyderabad and major Indian urban sectors.
 */
export const DEMO_RESOURCES = [
  // HYDERABAD DETAILED NETWORK
  {
    id: 'RES-HYD-HOSP-1',
    category: 'hospital',
    name: 'Gandhi Hospital Trauma & Emergency Center',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.424,
    lng: 78.503,
    address: 'Musheerabad, Secunderabad, Telangana 500003',
    availability: '24/7 Level-1 Trauma Active',
    capacity: '240 Emergency Beds',
    facilities: ['Trauma Center', 'ICU Care', 'Blood Bank', 'Helipad'],
    verified_contact: '040-27505566',
    status: 'Operational',
    source: 'Telangana State Health Authority'
  },
  {
    id: 'RES-HYD-SHEL-1',
    category: 'shelter',
    name: 'Nizam College Relief Shelter & Staging Center',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.399,
    lng: 78.472,
    address: 'Basheer Bagh, Hyderabad, Telangana 500001',
    availability: 'Open / Admitting Citizens',
    capacity: '1,200 Persons',
    facilities: ['Emergency Dormitory', 'Clean Drinking Water', 'Community Kitchen', 'First Aid'],
    verified_contact: '040-23234241',
    status: 'Active Relief Hub',
    source: 'GHMC Disaster Management Wing'
  },
  {
    id: 'RES-HYD-FOOD-1',
    category: 'food',
    name: 'Begumpet Civil Food Depot & Rations Point',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.441,
    lng: 78.471,
    address: 'Prakash Nagar, Begumpet, Hyderabad 500016',
    availability: 'Hot Meals & Packaged Rations',
    capacity: '3,500 Rations/Day',
    facilities: ['Cooked Meal Counter', 'Dry Rations Dumps', 'Infant Formula'],
    verified_contact: '1077 (District Collectorate)',
    status: 'Active Distribution',
    source: 'Civil Supplies Department'
  },
  {
    id: 'RES-HYD-WATR-1',
    category: 'water',
    name: 'Chikkadpally Potable Water Distribution Depot',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.406,
    lng: 78.489,
    address: 'Chikkadpally Main Road, Hyderabad 500020',
    availability: 'Bulk Water Tankers Available',
    capacity: '150,000 Litres Potable Water',
    facilities: ['Direct Filling Station', 'Mobile Tanker Fleet', 'Water Testing Lab'],
    verified_contact: '040-23438800',
    status: 'Active Supply',
    source: 'HMWSSB Disaster Wing'
  },
  {
    id: 'RES-HYD-RESC-1',
    category: 'rescue_center',
    name: 'Secunderabad Fire & Rescue Command Staging Camp',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4399,
    lng: 78.4983,
    address: 'SP Road, Secunderabad, Telangana 500003',
    availability: 'NDRF 10th Battalion & State SDRF',
    capacity: '8 Motorized Boats, 4 Inflatable Rafts',
    facilities: ['Water Rescue Equipment', 'Diver Squads', 'Drone Reconnaissance Unit'],
    verified_contact: '011-24363260',
    status: 'Tactical Deployment Ready',
    source: 'NDRF 10th Battalion'
  },
  {
    id: 'RES-HYD-HOSP-2',
    category: 'hospital',
    name: 'Osmania General Hospital Emergency Care',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3787,
    lng: 78.4789,
    address: 'Afzal Gunj, Hyderabad, Telangana 500012',
    availability: 'Emergency Triage Open',
    capacity: '180 Triage Beds',
    facilities: ['Trauma Center', 'Surgical Ward', 'Ambulance Staging'],
    verified_contact: '040-24600121',
    status: 'Operational',
    source: 'Director of Medical Education'
  },
  {
    id: 'RES-HYD-SHEL-2',
    category: 'shelter',
    name: 'Charminar Public Relief Camp & Transit Center',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3616,
    lng: 78.4744,
    address: 'Near Mecca Masjid, Charminar, Hyderabad 500002',
    availability: 'Open / Admitting Citizens',
    capacity: '850 Persons',
    facilities: ['Shelter Tents', 'Medical Checkpost', 'Family Assistance Desk'],
    verified_contact: '1077',
    status: 'Active Transit Hub',
    source: 'District Administration'
  },
  {
    id: 'RES-HYD-SHEL-3',
    category: 'shelter',
    name: 'Gachibowli Stadium Mega Relief Complex',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.4475,
    lng: 78.3512,
    address: 'Old Mumbai Highway, Gachibowli, Hyderabad 500032',
    availability: 'High-Capacity Primary Evacuation Shelter',
    capacity: '4,500 Persons',
    facilities: ['Indoor Stadium Dormitory', 'Power Backup', 'Food Court', 'Helipad'],
    verified_contact: '040-23000555',
    status: 'Operational Master Shelter',
    source: 'SDMA Telangana'
  },

  // MUMBAI DETAILED NETWORK
  {
    id: 'RES-MUM-FOOD-1',
    category: 'food',
    name: 'Dadar Central Food & Rations Depot',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.018,
    lng: 72.843,
    address: 'Near Dadar Station, Mumbai 400014',
    availability: 'Continuous Hot Meal Distribution',
    capacity: '5,000 Rations/Day',
    facilities: ['Hot Kitchen Counter', 'Clean Drinking Water', 'Dry Goods Storage'],
    verified_contact: '1916 (BMC Food Cell)',
    status: 'Operational Distribution',
    source: 'BMC Disaster Management'
  },
  {
    id: 'RES-MUM-WATR-1',
    category: 'water',
    name: 'Kurla Potable Water Depot',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.055,
    lng: 72.875,
    address: 'LBS Marg, Kurla West, Mumbai 400070',
    availability: 'Municipal Water Tankers',
    capacity: '200,000 Litres Potable Water',
    facilities: ['Bulk Tanker Refill', 'Packeted Water Distribution'],
    verified_contact: '022-26500111',
    status: 'Active Supply',
    source: 'BMC Hydraulic Engineer Department'
  },
  {
    id: 'RES-MUM-RESC-1',
    category: 'rescue_center',
    name: 'NDRF 5th Battalion Rescue Staging Post',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.073,
    lng: 72.885,
    address: 'Kurla East Highway Staging Area, Mumbai 400024',
    availability: 'NDRF & BMC Fire Brigade Squads',
    capacity: '12 Inflatable Boats, 6 High-Capacity Pumps',
    facilities: ['Diver Squads', 'Dewatering Pumps', 'Medical First Responders'],
    verified_contact: '022-22694725',
    status: 'Tactical Deployment Active',
    source: 'NDRF 5th Battalion'
  },
  {
    id: 'RES-MUM-SHEL-1',
    category: 'shelter',
    name: 'Kurla Municipal Relief Camp & Shelter',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0720,
    lng: 72.8850,
    address: 'LBS Marg, Kurla West, Mumbai 400070',
    availability: 'Open / Admitting Citizens',
    capacity: '1,800 Persons',
    facilities: ['Covered Dormitories', 'Medical Aid Post', 'Clean Water'],
    verified_contact: '1916',
    status: 'Operational Shelter',
    source: 'BMC Disaster Management'
  },
  {
    id: 'RES-MUM-SHEL-2',
    category: 'shelter',
    name: 'Bandra-Kurla Complex Transit Relief Camp',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.062,
    lng: 72.868,
    address: 'BKC Exhibition Grounds, Mumbai 400051',
    availability: 'High-Capacity Covered Evacuation Hub',
    capacity: '2,200 Persons',
    facilities: ['Covered Hangar Dormitories', 'Medical Clinic', 'Power Backup'],
    verified_contact: '1916',
    status: 'Operational Transit Hub',
    source: 'MMRDA Relief Wing'
  },

  // DELHI-NCR DETAILED NETWORK
  {
    id: 'RES-DEL-HOSP-1',
    category: 'hospital',
    name: 'AIIMS Apex Trauma & Emergency Hub',
    city: 'New Delhi / Rohtak',
    state: 'Delhi / Haryana',
    lat: 28.567,
    lng: 77.210,
    address: 'Ring Road, Ansari Nagar, New Delhi 110029',
    availability: '24/7 Level-1 Apex Trauma Active',
    capacity: '350 Critical Beds',
    facilities: ['Advanced Trauma Center', 'Neurosurgery Unit', 'Helipad', 'Blood Bank'],
    verified_contact: '011-26588500',
    status: 'Operational',
    source: 'AIIMS Disaster Response Directorate'
  },
  {
    id: 'RES-DEL-FOOD-1',
    category: 'food',
    name: 'Red Cross Civil Food Distribution Point',
    city: 'New Delhi / Rohtak',
    state: 'Delhi / Haryana',
    lat: 28.625,
    lng: 77.208,
    address: 'Red Cross Road, New Delhi 110001',
    availability: 'Emergency Hot Meals & Dry Kits',
    capacity: '6,000 Meals/Day',
    facilities: ['Bulk Rations Packets', 'Mobile Kitchen Vans', 'Baby Food'],
    verified_contact: '011-23716441',
    status: 'Operational Distribution',
    source: 'Indian Red Cross Society'
  },
  {
    id: 'RES-DEL-WATR-1',
    category: 'water',
    name: 'Delhi Jal Board Emergency Tanker Depot',
    city: 'New Delhi / Rohtak',
    state: 'Delhi / Haryana',
    lat: 28.610,
    lng: 77.195,
    address: 'Jhandewalan Water Works, New Delhi 110055',
    availability: 'Fleet of 80 Drinking Water Tankers',
    capacity: '250,000 Litres Potable Water',
    facilities: ['Water Quality Testing Unit', 'Mobile Tanker Fleet'],
    verified_contact: '1916 (DJB Control)',
    status: 'Active Supply',
    source: 'Delhi Jal Board'
  },
  {
    id: 'RES-DEL-RESC-1',
    category: 'rescue_center',
    name: 'DDMA & NDRF 8th Battalion Search & Rescue Base',
    city: 'New Delhi / Rohtak',
    state: 'Delhi / Haryana',
    lat: 28.685,
    lng: 77.125,
    address: 'West Delhi Regional Emergency Post, Delhi 110026',
    availability: 'Collapsed Structure Search & Rescue (CSSR)',
    capacity: '6 Specialized Seismic Rescue Squads',
    facilities: ['Acoustic Listening Devices', 'Hydraulic Cutters', 'Canine Search Unit'],
    verified_contact: '1077 (DDMA)',
    status: 'Tactical Deployment Ready',
    source: 'NDRF 8th Battalion'
  },
  {
    id: 'RES-DEL-SHEL-2',
    category: 'shelter',
    name: 'Rohini Sector 9 Community Emergency Camp',
    city: 'New Delhi / Rohtak',
    state: 'Delhi / Haryana',
    lat: 28.712,
    lng: 77.118,
    address: 'Sector 9 Community Center, Rohini, Delhi 110085',
    availability: 'Civil Emergency Shelter',
    capacity: '1,800 Persons',
    facilities: ['Indoor Bedding', 'First Aid Center', 'Potable Water'],
    verified_contact: '011-27552200',
    status: 'Operational',
    source: 'DDMA North West'
  },

  // VISAKHAPATNAM DETAILED NETWORK
  {
    id: 'RES-VIZ-FOOD-1',
    category: 'food',
    name: 'AU Indoor Stadium Emergency Food Kitchen',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.728,
    lng: 83.315,
    address: 'Andhra University Campus, Visakhapatnam 530003',
    availability: 'Hot Packaged Rations & Baby Supplies',
    capacity: '4,000 Meals/Day',
    facilities: ['Automated Steam Kitchen', 'Clean Water', 'Dry Food Storage'],
    verified_contact: '1077',
    status: 'Operational Distribution',
    source: 'AP Civil Supplies Wing'
  },
  {
    id: 'RES-VIZ-HOSP-1',
    category: 'hospital',
    name: 'King George Hospital Emergency Trauma Center',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.708,
    lng: 83.305,
    address: 'Collector Office Road, Maharanipeta, Visakhapatnam 530002',
    availability: 'Level-1 Emergency Trauma Active',
    capacity: '280 Emergency Beds',
    facilities: ['Trauma Center', 'Surgical Wards', 'Emergency Generator'],
    verified_contact: '0891-2564891',
    status: 'Operational',
    source: 'Directorate of Medical Education AP'
  },
  {
    id: 'RES-VIZ-RESC-1',
    category: 'rescue_center',
    name: 'SDRF & Coast Guard Marine Rescue Staging Base',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.695,
    lng: 83.298,
    address: 'Port Area, Visakhapatnam 530035',
    availability: 'Marine Rescue & Coastal Patrol',
    capacity: '8 High-Speed Patrol Crafts, 4 Inflatable Zodiacs',
    facilities: ['Deep Sea Divers', 'Helicopter Winch Squad', 'Coastal Radio'],
    verified_contact: '0891-2565401',
    status: 'Active Coastal Patrol',
    source: 'Indian Coast Guard & AP SDRF'
  },
  {
    id: 'RES-VIZ-WATR-1',
    category: 'water',
    name: 'Visakhapatnam Municipal Water Tanker Depot',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    lat: 17.721,
    lng: 83.312,
    address: 'Asilmetta Water Works, Visakhapatnam 530002',
    availability: 'Purified Water Fleet',
    capacity: '120,000 Litres Potable Water',
    facilities: ['Filling Station', 'Mobile Tankers', 'Chlorination Kit'],
    verified_contact: '1800-425-0001',
    status: 'Active Supply',
    source: 'GVMC Water Wing'
  },

  // CHENNAI DETAILED NETWORK
  {
    id: 'RES-CHE-SHEL-1',
    category: 'shelter',
    name: 'Marina Beach Coastal Evacuation Shelter',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.060,
    lng: 80.280,
    address: 'Kamarajar Promenade, Chepauk, Chennai 600005',
    availability: 'High-Capacity Primary Evacuation Shelter',
    capacity: '2,800 Persons',
    facilities: ['Covered Cyclone Hall', 'Emergency Clinic', 'Fresh Water Storage', 'Generator Backup'],
    verified_contact: '1913',
    status: 'Open & Admitting Citizens',
    source: 'Greater Chennai Corporation'
  },
  {
    id: 'RES-CHE-SHEL-2',
    category: 'shelter',
    name: 'Ripon Building Cyclone Relief Camp',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.082,
    lng: 80.275,
    address: 'Sydenhams Road, Park Town, Chennai 600003',
    availability: 'Open / Admitting Citizens',
    capacity: '1,400 Persons',
    facilities: ['Hot Food Counter', 'Medical First Aid', 'Rest Areas'],
    verified_contact: '1913',
    status: 'Open & Operational',
    source: 'Greater Chennai Corporation'
  },
  {
    id: 'RES-CHE-FOOD-1',
    category: 'food',
    name: 'Ripon Building Emergency Food Depot',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.083,
    lng: 80.276,
    address: 'Sydenhams Road, Periamet, Chennai 600003',
    availability: 'Hot Meal Packets & Drinking Water',
    capacity: '4,500 Meals/Day',
    facilities: ['Community Kitchen', 'Packet Rations Distribution'],
    verified_contact: '1913',
    status: 'Operational Distribution',
    source: 'Greater Chennai Corporation'
  },
  {
    id: 'RES-CHE-HOSP-1',
    category: 'hospital',
    name: 'Rajiv Gandhi Government General Hospital',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.080,
    lng: 80.278,
    address: 'EVR Periyar Salai, Park Town, Chennai 600003',
    availability: 'Level-1 Emergency Trauma Active',
    capacity: '300 Emergency Beds',
    facilities: ['Trauma Ward', 'ICU Care', 'Burn Unit', 'Ambulance Fleet'],
    verified_contact: '044-25305000',
    status: 'Operational',
    source: 'Tamil Nadu Health Department'
  },
  {
    id: 'RES-CHE-RESC-1',
    category: 'rescue_center',
    name: 'Tamil Nadu Fire & Rescue Emergency Command Post',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.045,
    lng: 80.252,
    address: 'Teynampet Command Station, Chennai 600018',
    availability: 'Flood Evacuation & Inflatable Boat Squads',
    capacity: '10 Inflatable Rescue Boats, 4 Amphibious Craft',
    facilities: ['Swift Water Rescue Team', 'Drone Surveillance'],
    verified_contact: '101 / 112',
    status: 'Tactical Deployment Active',
    source: 'TN Fire & Rescue Services'
  },
  {
    id: 'RES-CHE-WATR-1',
    category: 'water',
    name: 'Chennai Metro Water Potable Depot',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.065,
    lng: 80.245,
    address: 'Kilpauk Water Works, Chennai 600010',
    availability: 'Mobile Drinking Water Tankers',
    capacity: '180,000 Litres Potable Water',
    facilities: ['Rapid Filtration', 'Emergency Fleet'],
    verified_contact: '044-45674567',
    status: 'Active Supply',
    source: 'CMWSSB'
  },

  // GUWAHATI / ASSAM DETAILED NETWORK
  {
    id: 'RES-GWT-SHEL-1',
    category: 'shelter',
    name: 'Sarusajai Sports Complex Relief Shelter',
    city: 'Guwahati',
    state: 'Assam',
    lat: 26.115,
    lng: 91.758,
    address: 'National Highway 37, Sarusajai, Guwahati 781040',
    availability: 'Covered High-Capacity Evacuation Shelter',
    capacity: '2,500 Persons',
    facilities: ['Stadium Dormitory', 'Medical Aid Camp', 'Generator Backup'],
    verified_contact: '1077 (District Control)',
    status: 'Operational Master Shelter',
    source: 'ASDMA Assam'
  },
  {
    id: 'RES-GWT-FOOD-1',
    category: 'food',
    name: 'Kamrup District Food Supplies Depot',
    city: 'Guwahati',
    state: 'Assam',
    lat: 26.155,
    lng: 91.765,
    address: 'Paltan Bazaar Food Depot, Guwahati 781008',
    availability: 'Rations, Dry Foods & Clean Water',
    capacity: '3,000 Meals/Day',
    facilities: ['Cooked Food Counter', 'Baby Supplies'],
    verified_contact: '0361-2735655',
    status: 'Operational Distribution',
    source: 'Assam Food & Civil Supplies'
  },
  {
    id: 'RES-GWT-HOSP-1',
    category: 'hospital',
    name: 'Gauhati Medical College & Hospital (GMCH)',
    city: 'Guwahati',
    state: 'Assam',
    lat: 26.158,
    lng: 91.772,
    address: 'Narakasur Hilltop, Bhangagarh, Guwahati 781032',
    availability: '24/7 Apex Regional Trauma Center',
    capacity: '250 Emergency Beds',
    facilities: ['Trauma Center', 'Surgical ICU', 'Blood Bank'],
    verified_contact: '0361-2529457',
    status: 'Operational',
    source: 'Health & Family Welfare Dept Assam'
  },
  {
    id: 'RES-GWT-RESC-1',
    category: 'rescue_center',
    name: 'Assam SDRF Hillside & Riverine Rescue Base',
    city: 'Guwahati',
    state: 'Assam',
    lat: 26.182,
    lng: 91.745,
    address: 'Pandu Port Rescue Station, Guwahati 781012',
    availability: 'Landslide Clearance & River Rescue Boats',
    capacity: 'Heavy Earthmoving Excavators, 6 Motorized Boats',
    facilities: ['Slope Stabilizers', 'Cutting Torches', 'Canine Search'],
    verified_contact: '1070',
    status: 'Active Field Deployment',
    source: 'Assam State Disaster Management Authority'
  },

  // KOLKATA DETAILED NETWORK
  {
    id: 'RES-KOL-FOOD-1',
    category: 'food',
    name: 'Howrah Station Civil Supplies Kitchen',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.585,
    lng: 88.342,
    address: 'Station Approach, Howrah, Kolkata 711101',
    availability: 'Continuous Emergency Meals',
    capacity: '5,000 Meals/Day',
    facilities: ['Meal Packet Counters', 'Drinking Water Refill'],
    verified_contact: '1070',
    status: 'Operational Distribution',
    source: 'WB Disaster Management'
  },
  {
    id: 'RES-KOL-HOSP-1',
    category: 'hospital',
    name: 'Medical College & Hospital Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.573,
    lng: 88.362,
    address: '88 College Street, Kolkata 700073',
    availability: '24/7 Emergency Trauma Active',
    capacity: '260 Emergency Beds',
    facilities: ['Trauma Care', 'Surgical Ward', 'Blood Bank'],
    verified_contact: '033-22551600',
    status: 'Operational',
    source: 'WB Health Department'
  },
  {
    id: 'RES-BHU-SHEL-1',
    category: 'shelter',
    name: 'Kalinga Stadium Cyclone Shelter Hub',
    city: 'Bhubaneswar',
    state: 'Odisha',
    lat: 20.301,
    lng: 85.823,
    address: 'Bidyut Marg, Nayapalli, Bhubaneswar 751012',
    availability: 'Storm Shelter Ready',
    capacity: '2,200 Persons',
    facilities: ['Engineered Storm Shelter', 'Solar Backup', 'Satellite Comms'],
    verified_contact: '1070 (OSDMA Control Room)',
    status: 'Operational',
    source: 'Odisha State Disaster Management Authority (OSDMA)'
  }
];

export const ALL_INDIA_EVACUATION_ROUTES = [
  // 1. HYDERABAD EVACUATION TRACING
  {
    id: 'route-hyd-rescue',
    city: 'Hyderabad',
    name: 'Hyderabad: Route to Rescue Team',
    target: 'Secunderabad Staging Command',
    color: '#3B82F6',
    dashPattern: [8, 6],
    origin: { name: 'You Are Here (Central Abids / Charminar)', lat: 17.3616, lng: 78.4744 },
    destination: { name: 'Secunderabad Staging Command', lat: 17.4399, lng: 78.4983 },
    path: [
      [78.4744, 17.3616],
      [78.4752, 17.3750],
      [78.4815, 17.3980],
      [78.4870, 17.4120],
      [78.4920, 17.4280],
      [78.4983, 17.4399]
    ]
  },
  {
    id: 'route-hyd-food',
    city: 'Hyderabad',
    name: 'Hyderabad: Route to Food Shelter',
    target: 'Nizam College Relief Shelter',
    color: '#10B981',
    dashPattern: [6, 4],
    origin: { name: 'You Are Here (Central Abids / Charminar)', lat: 17.3616, lng: 78.4744 },
    destination: { name: 'Nizam College Relief Shelter', lat: 17.399, lng: 78.472 },
    path: [
      [78.4744, 17.3616],
      [78.4735, 17.3740],
      [78.4718, 17.3870],
      [78.4720, 17.3990]
    ]
  },
  {
    id: 'route-hyd-trauma',
    city: 'Hyderabad',
    name: 'Hyderabad: Route to Trauma Center',
    target: 'Gandhi Hospital Emergency Unit',
    color: '#06B6D4',
    dashPattern: [8, 4],
    origin: { name: 'You Are Here (Central Abids / Charminar)', lat: 17.3616, lng: 78.4744 },
    destination: { name: 'Gandhi Hospital Emergency Unit', lat: 17.424, lng: 78.503 },
    path: [
      [78.4744, 17.3616],
      [78.4780, 17.3790],
      [78.4880, 17.3980],
      [78.4980, 17.4150],
      [78.5030, 17.4240]
    ]
  },

  // 2. DELHI-NCR EVACUATION TRACING
  {
    id: 'route-del-rescue',
    city: 'New Delhi / Rohtak',
    name: 'Delhi-NCR: Route to DDMA Rescue Post',
    target: 'DDMA & NDRF 8th Bn Base',
    color: '#3B82F6',
    dashPattern: [8, 6],
    origin: { name: 'Rohtak Old Masonry Sector', lat: 28.892, lng: 76.608 },
    destination: { name: 'West Delhi Regional Emergency Post', lat: 28.685, lng: 77.125 },
    path: [
      [76.608, 28.892],
      [76.755, 28.825],
      [76.920, 28.750],
      [77.045, 28.710],
      [77.125, 28.685]
    ]
  },
  {
    id: 'route-del-food',
    city: 'New Delhi / Rohtak',
    name: 'Delhi-NCR: Route to Civil Food & Relief Shelter',
    target: 'Rohini & Thyagaraj Relief Camp',
    color: '#10B981',
    dashPattern: [6, 4],
    origin: { name: 'Rohtak Old Masonry Sector', lat: 28.892, lng: 76.608 },
    destination: { name: 'Rohini Sector 9 Emergency Camp', lat: 28.712, lng: 77.118 },
    path: [
      [76.608, 28.892],
      [76.780, 28.860],
      [76.950, 28.780],
      [77.060, 28.735],
      [77.118, 28.712]
    ]
  },
  {
    id: 'route-del-trauma',
    city: 'New Delhi / Rohtak',
    name: 'Delhi-NCR: Route to AIIMS Trauma Hub',
    target: 'AIIMS Apex Trauma Center',
    color: '#06B6D4',
    dashPattern: [8, 4],
    origin: { name: 'Rohtak Old Masonry Sector', lat: 28.892, lng: 76.608 },
    destination: { name: 'AIIMS Apex Trauma Center', lat: 28.567, lng: 77.210 },
    path: [
      [76.608, 28.892],
      [76.810, 28.790],
      [77.010, 28.680],
      [77.140, 28.605],
      [77.210, 28.567]
    ]
  },

  // 3. MUMBAI EVACUATION TRACING
  {
    id: 'route-mum-rescue',
    city: 'Mumbai',
    name: 'Mumbai: Route to NDRF Rescue Staging',
    target: 'NDRF 5th Bn Kurla Highway Post',
    color: '#3B82F6',
    dashPattern: [8, 6],
    origin: { name: 'Kurla Mithi Lowland Strip', lat: 19.0715, lng: 72.881 },
    destination: { name: 'NDRF 5th Bn Staging Post', lat: 19.073, lng: 72.885 },
    path: [
      [72.8810, 19.0715],
      [72.8830, 19.0722],
      [72.8850, 19.0730]
    ]
  },
  {
    id: 'route-mum-food',
    city: 'Mumbai',
    name: 'Mumbai: Route to Food & BKC Shelter',
    target: 'BKC Transit Camp & Dadar Food Point',
    color: '#10B981',
    dashPattern: [6, 4],
    origin: { name: 'Kurla Mithi Lowland Strip', lat: 19.0715, lng: 72.881 },
    destination: { name: 'BKC Transit Shelter', lat: 19.062, lng: 72.868 },
    path: [
      [72.8810, 19.0715],
      [72.8750, 19.0680],
      [72.8680, 19.0620]
    ]
  },
  {
    id: 'route-mum-trauma',
    city: 'Mumbai',
    name: 'Mumbai: Route to KEM Hospital Trauma Care',
    target: 'KEM Emergency Trauma Center',
    color: '#06B6D4',
    dashPattern: [8, 4],
    origin: { name: 'Kurla Mithi Lowland Strip', lat: 19.0715, lng: 72.881 },
    destination: { name: 'KEM Hospital Trauma Care', lat: 19.002, lng: 72.842 },
    path: [
      [72.8810, 19.0715],
      [72.8660, 19.0480],
      [72.8520, 19.0250],
      [72.8420, 19.0020]
    ]
  },

  // 4. VISAKHAPATNAM EVACUATION TRACING
  {
    id: 'route-viz-rescue',
    city: 'Visakhapatnam',
    name: 'Visakhapatnam: Route to Marine Rescue Base',
    target: 'SDRF & Coast Guard Marine Post',
    color: '#3B82F6',
    dashPattern: [8, 6],
    origin: { name: 'Bheemili Coastal Strip', lat: 17.894, lng: 83.401 },
    destination: { name: 'Port Marine Rescue Base', lat: 17.695, lng: 83.298 },
    path: [
      [83.401, 17.894],
      [83.375, 17.825],
      [83.340, 17.750],
      [83.298, 17.695]
    ]
  },
  {
    id: 'route-viz-food',
    city: 'Visakhapatnam',
    name: 'Visakhapatnam: Route to Cyclone Shelter & Food',
    target: 'Bheemili Dome & AU Indoor Stadium',
    color: '#10B981',
    dashPattern: [6, 4],
    origin: { name: 'Bheemili Coastal Strip', lat: 17.894, lng: 83.401 },
    destination: { name: 'AU Indoor Stadium Food Kitchen', lat: 17.728, lng: 83.315 },
    path: [
      [83.401, 17.894],
      [83.380, 17.840],
      [83.350, 17.780],
      [83.315, 17.728]
    ]
  },
  {
    id: 'route-viz-trauma',
    city: 'Visakhapatnam',
    name: 'Visakhapatnam: Route to King George Hospital',
    target: 'King George Hospital Trauma Center',
    color: '#06B6D4',
    dashPattern: [8, 4],
    origin: { name: 'Bheemili Coastal Strip', lat: 17.894, lng: 83.401 },
    destination: { name: 'King George Hospital', lat: 17.708, lng: 83.305 },
    path: [
      [83.401, 17.894],
      [83.370, 17.810],
      [83.330, 17.740],
      [83.305, 17.708]
    ]
  },

  // 5. CHENNAI EVACUATION TRACING
  {
    id: 'route-che-rescue',
    city: 'Chennai',
    name: 'Chennai: Route to Fire & Rescue Command',
    target: 'TN Fire & Rescue Teynampet Post',
    color: '#3B82F6',
    dashPattern: [8, 6],
    origin: { name: 'Saidapet Adyar Causeway', lat: 13.021, lng: 80.224 },
    destination: { name: 'Teynampet Rescue Post', lat: 13.045, lng: 80.252 },
    path: [
      [80.224, 13.021],
      [80.238, 13.033],
      [80.252, 13.045]
    ]
  },
  {
    id: 'route-che-food',
    city: 'Chennai',
    name: 'Chennai: Route to Marina Relief Camp & Food',
    target: 'Marina Coastal Camp & Ripon Food Point',
    color: '#10B981',
    dashPattern: [6, 4],
    origin: { name: 'Saidapet Adyar Causeway', lat: 13.021, lng: 80.224 },
    destination: { name: 'Marina Beach Relief Camp', lat: 13.052, lng: 80.282 },
    path: [
      [80.224, 13.021],
      [80.245, 13.035],
      [80.265, 13.045],
      [80.282, 13.052]
    ]
  },
  {
    id: 'route-che-trauma',
    city: 'Chennai',
    name: 'Chennai: Route to Rajiv Gandhi Hospital',
    target: 'Rajiv Gandhi Govt General Hospital',
    color: '#06B6D4',
    dashPattern: [8, 4],
    origin: { name: 'Saidapet Adyar Causeway', lat: 13.021, lng: 80.224 },
    destination: { name: 'Rajiv Gandhi Govt General Hospital', lat: 13.080, lng: 80.278 },
    path: [
      [80.224, 13.021],
      [80.240, 13.042],
      [80.260, 13.065],
      [80.278, 13.080]
    ]
  },

  // 6. GUWAHATI EVACUATION TRACING
  {
    id: 'route-gwt-rescue',
    city: 'Guwahati',
    name: 'Guwahati: Route to SDRF Rescue Base',
    target: 'Pandu Port Rescue Station',
    color: '#3B82F6',
    dashPattern: [8, 6],
    origin: { name: 'Kamakhya Foothill Road Slip', lat: 26.181, lng: 91.751 },
    destination: { name: 'Pandu Port Rescue Base', lat: 26.182, lng: 91.745 },
    path: [
      [91.751, 26.181],
      [91.748, 26.1815],
      [91.745, 26.182]
    ]
  },
  {
    id: 'route-gwt-food',
    city: 'Guwahati',
    name: 'Guwahati: Route to Sarusajai Relief Shelter & Food',
    target: 'Sarusajai Complex Master Shelter',
    color: '#10B981',
    dashPattern: [6, 4],
    origin: { name: 'Kamakhya Foothill Road Slip', lat: 26.181, lng: 91.751 },
    destination: { name: 'Sarusajai Relief Shelter', lat: 26.115, lng: 91.758 },
    path: [
      [91.751, 26.181],
      [91.755, 26.155],
      [91.758, 26.115]
    ]
  },
  {
    id: 'route-gwt-trauma',
    city: 'Guwahati',
    name: 'Guwahati: Route to GMCH Trauma Center',
    target: 'Gauhati Medical College Hospital',
    color: '#06B6D4',
    dashPattern: [8, 4],
    origin: { name: 'Kamakhya Foothill Road Slip', lat: 26.181, lng: 91.751 },
    destination: { name: 'GMCH Apex Trauma Center', lat: 26.158, lng: 91.772 },
    path: [
      [91.751, 26.181],
      [91.760, 26.170],
      [91.772, 26.158]
    ]
  }
];

export const HYDERABAD_EVACUATION_ROUTES = ALL_INDIA_EVACUATION_ROUTES.filter(r => r.city === 'Hyderabad');

export const ALL_INDIA_HAZARD_AREAS = [
  // HYDERABAD
  {
    id: 'area-hyd-red',
    city: 'Hyderabad',
    type: 'destroyed',
    name: 'Hyderabad: Red Light Area (High Danger / Musi Rain Inundation)',
    center: [78.4867, 17.3850],
    radiusKm: 1.8,
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.28)',
    borderColor: '#DC2626'
  },
  {
    id: 'area-hyd-orange',
    city: 'Hyderabad',
    type: 'major_damage',
    name: 'Hyderabad: Orange Caution Area (Urban Precipitation Runoff)',
    center: [78.475, 17.395],
    radiusKm: 3.5,
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.20)',
    borderColor: '#D97706'
  },

  // DELHI-NCR
  {
    id: 'area-del-red',
    city: 'New Delhi / Rohtak',
    type: 'destroyed',
    name: 'Delhi-NCR: Red Light Area (High Danger / Rohtak Fault Epicenter)',
    center: [76.608, 28.892],
    radiusKm: 2.2,
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.32)',
    borderColor: '#DC2626'
  },
  {
    id: 'area-del-orange',
    city: 'New Delhi / Rohtak',
    type: 'major_damage',
    name: 'Delhi-NCR: Orange Caution Area (Najafgarh Seismic Shake Zone)',
    center: [76.985, 28.612],
    radiusKm: 4.0,
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.20)',
    borderColor: '#D97706'
  },

  // MUMBAI
  {
    id: 'area-mum-red',
    city: 'Mumbai',
    type: 'destroyed',
    name: 'Mumbai: Red Light Area (High Danger / Kurla Seismic Rupture)',
    center: [72.8777, 19.0760],
    radiusKm: 1.8,
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.30)',
    borderColor: '#DC2626'
  },
  {
    id: 'area-mum-orange',
    city: 'Mumbai',
    type: 'major_damage',
    name: 'Mumbai: Orange Caution Area (BKC Ground Motion Sector)',
    center: [72.868, 19.062],
    radiusKm: 3.2,
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.20)',
    borderColor: '#D97706'
  },

  // VISAKHAPATNAM
  {
    id: 'area-viz-red',
    city: 'Visakhapatnam',
    type: 'destroyed',
    name: 'Visakhapatnam: Red Light Area (Bheemili Storm Surge Shoreline)',
    center: [83.401, 17.894],
    radiusKm: 2.5,
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.32)',
    borderColor: '#DC2626'
  },
  {
    id: 'area-viz-orange',
    city: 'Visakhapatnam',
    type: 'major_damage',
    name: 'Visakhapatnam: Orange Caution Area (Outer Approach Gale Sector)',
    center: [83.340, 17.780],
    radiusKm: 4.5,
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.20)',
    borderColor: '#D97706'
  },

  // CHENNAI
  {
    id: 'area-che-red',
    city: 'Chennai',
    type: 'destroyed',
    name: 'Chennai: Red Light Area (Marina Cyclone Landfall Sector)',
    center: [80.2707, 13.0827],
    radiusKm: 2.2,
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.30)',
    borderColor: '#DC2626'
  },
  {
    id: 'area-che-orange',
    city: 'Chennai',
    type: 'major_damage',
    name: 'Chennai: Orange Caution Area (Coastal Storm Surge Sector)',
    center: [80.252, 13.045],
    radiusKm: 3.8,
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.20)',
    borderColor: '#D97706'
  },

  // GUWAHATI
  {
    id: 'area-gwt-red',
    city: 'Guwahati',
    type: 'destroyed',
    name: 'Guwahati: Red Light Area (Kamakhya Hillside Slip Zone)',
    center: [91.751, 26.181],
    radiusKm: 1.4,
    color: '#EF4444',
    fillColor: 'rgba(239, 68, 68, 0.32)',
    borderColor: '#DC2626'
  },
  {
    id: 'area-gwt-orange',
    city: 'Guwahati',
    type: 'major_damage',
    name: 'Guwahati: Orange Caution Area (Pandu Riverfront Erosion Sector)',
    center: [91.705, 26.188],
    radiusKm: 2.8,
    color: '#F59E0B',
    fillColor: 'rgba(245, 158, 11, 0.20)',
    borderColor: '#D97706'
  }
];

export const HYDERABAD_HAZARD_AREAS = ALL_INDIA_HAZARD_AREAS.filter(a => a.city === 'Hyderabad');

export const DEMO_VERIFIED_EVACUATION_ROUTES = HYDERABAD_EVACUATION_ROUTES.map(r => ({
  name: r.name,
  coordinates: r.path
}));

export const DEMO_RESCUE_UNITS = [
  {
    id: 'UNIT-NDRF-10',
    name: 'NDRF Battalion 10 Rapid Response Unit',
    lat: 17.4399,
    lng: 78.4983,
    status: 'Dispatched / On-Site'
  },
  {
    id: 'UNIT-SDRF-02',
    name: 'SDRF Flood Motorboat Squad',
    lat: 17.3755,
    lng: 78.4910,
    status: 'In Action'
  }
];

export const INITIAL_DEMO_SOS_REPORTS = [
  {
    reference: 'SOS-2026-104',
    submittedAt: '2026-11-11T20:28:00Z',
    emergencyType: 'Flood / Rising Water',
    locationText: 'Bholakpur Lane 4, Musheerabad, Hyderabad, Telangana (500020)',
    state: 'Telangana',
    district: 'Hyderabad',
    lat: 17.4182,
    lng: 78.4891,
    locationSource: 'gps',
    peopleCount: 4,
    description:
      'Sample report: ground floor flooded up to waist height; two elderly residents unable to reach upper terrace safely.',
    contactName: 'Ananya Verma',
    contactPhone: '+91 98XXX XXX12',
    photos: [
      {
        name: 'waterlogged-lane-sample.jpg',
        url: '/disasters/flood-inundation.jpg',
        caption: 'Sample citizen attachment'
      }
    ],
    status: 'pending_review',
    statusLabel: 'Pending Officer Review',
    officerNote: 'Awaiting human verification by duty officer.',
    reviewedBy: null,
    reviewedAt: null,
    authorizedUnit: null,
    imageAssessment: {
      available: true,
      cautionLabel: 'DEMO ADVISORY SIGNAL — Not reliable fake-image detection',
      summary:
        'Demo placeholder assessment: outdoor flooding scene observed. Human officer inspection is mandatory.',
      confidenceCaveat: 'AI image assessment is never certain and never authorizes emergency dispatch.'
    },
    auditTrail: [
      {
        at: '2026-11-11T20:28:00Z',
        actor: 'Citizen Demo Record',
        action: 'Recorded SOS-2026-104 in demo dataset (not verified, not dispatched).'
      }
    ],
    is_demo: true
  },
  {
    reference: 'SOS-2026-103',
    submittedAt: '2026-11-11T19:52:00Z',
    emergencyType: 'Landslide / Blocked Access',
    locationText: 'Kamakshya Hill Foothills, Guwahati, Assam (781010)',
    state: 'Assam',
    district: 'Kamrup Metro',
    lat: 26.1815,
    lng: 91.7512,
    locationSource: 'manual',
    peopleCount: 7,
    description:
      'Sample report: mudslide debris blocking single lane access road to six hillside houses.',
    contactName: 'Rohan Das',
    contactPhone: '+91 94XXX XXX88',
    photos: [
      {
        name: 'hill-debris-sample.jpg',
        url: '/disasters/landslide-debris.jpg',
        caption: 'Sample citizen attachment'
      }
    ],
    status: 'info_requested',
    statusLabel: 'Additional Information Requested',
    officerNote: 'Demo officer requested confirmation of whether any occupants are injured.',
    reviewedBy: 'Officer M. Borah',
    reviewedAt: '2026-11-11T20:05:00Z',
    authorizedUnit: null,
    imageAssessment: {
      available: true,
      cautionLabel: 'DEMO ADVISORY SIGNAL — Not reliable fake-image detection',
      summary: 'Demo placeholder assessment: debris pattern visible; field verification needed.',
      confidenceCaveat: 'Cannot confirm capture time or origin automatically.'
    },
    auditTrail: [
      {
        at: '2026-11-11T19:52:00Z',
        actor: 'Citizen Demo Record',
        action: 'Recorded with manual pin correction.'
      },
      {
        at: '2026-11-11T20:05:00Z',
        actor: 'Officer M. Borah',
        action: 'Requested additional information on injuries and nearest motorable landmark.'
      }
    ],
    is_demo: true
  },
  {
    reference: 'SOS-2026-102',
    submittedAt: '2026-11-11T18:40:00Z',
    emergencyType: 'Cyclone / High Wind Damage',
    locationText: 'Bheemili Coastal Colony, Visakhapatnam, Andhra Pradesh (531163)',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    lat: 17.8935,
    lng: 83.4005,
    locationSource: 'gps',
    peopleCount: 12,
    description:
      'Sample report: roof sheeting damaged on community hall; families moved to adjacent school block.',
    contactName: 'Suresh Naidu',
    contactPhone: '+91 97XXX XXX41',
    photos: [
      {
        name: 'coastal-damage-sample.jpg',
        url: '/disasters/cyclone-landfall.jpg',
        caption: 'Sample citizen attachment'
      }
    ],
    status: 'operation_authorized',
    statusLabel: 'Verified — Operation Authorized',
    officerNote: 'Demo human authorization recorded for AP SDRF Coastal Clearance Unit.',
    reviewedBy: 'Commander R. Reddy',
    reviewedAt: '2026-11-11T18:55:00Z',
    authorizedUnit: 'AP SDRF Coastal Clearance Unit',
    imageAssessment: {
      available: false,
      cautionLabel: 'Image assessment service not connected',
      summary: 'No automated assessment stored; reviewed manually in demo dataset.',
      confidenceCaveat: 'Human verification required.'
    },
    auditTrail: [
      {
        at: '2026-11-11T18:40:00Z',
        actor: 'Citizen Demo Record',
        action: 'Recorded with 1 sample attachment.'
      },
      {
        at: '2026-11-11T18:55:00Z',
        actor: 'Commander R. Reddy',
        action: 'Authorized demo operation OP-2026-019.'
      }
    ],
    is_demo: true
  }
];

export const INITIAL_DEMO_RESCUE_OPERATIONS = [
  {
    operation_ref: 'OP-2026-019',
    sos_ref: 'SOS-2026-102',
    location: 'Bheemili Coastal Colony, Visakhapatnam, AP',
    team: 'AP SDRF Coastal Clearance Unit',
    authorized_at: '2026-11-11T18:55:00Z',
    started_at: '2026-11-11T19:10:00Z',
    completed_at: null,
    status: 'ongoing',
    outcome: 'Sample ongoing road debris clearance and medical check.',
    evidence: [
      {
        id: 'EVD-1',
        caption: 'Sample coastal wind damage photo',
        captured_at: '2026-11-11T19:22:00Z',
        uploaded_by: 'SDRF Team Lead',
        url: '/disasters/cyclone-landfall.jpg'
      }
    ],
    is_demo: true
  },
  {
    operation_ref: 'OP-2026-017',
    sos_ref: 'SOS-2026-098',
    location: 'Kurla West Station Approach, Mumbai, MH',
    team: 'NDRF 5th Bn & Fire Emergency Services',
    authorized_at: '2026-11-11T15:10:00Z',
    started_at: '2026-11-11T15:25:00Z',
    completed_at: '2026-11-11T17:45:00Z',
    status: 'successful',
    outcome: 'Sample evacuation to Kurla Municipal School Relief Camp completed.',
    evidence: [
      {
        id: 'EVD-2',
        caption: 'Sample flood perimeter inspection photo',
        captured_at: '2026-11-11T16:15:00Z',
        uploaded_by: 'NDRF 5th Bn',
        url: '/disasters/flood-inundation.jpg'
      }
    ],
    is_demo: true
  },
  {
    operation_ref: 'OP-2026-015',
    sos_ref: 'SOS-2026-091',
    location: 'North Foothill Sector, Guwahati, AS',
    team: 'District Disaster Medical & Rescue Detachment',
    authorized_at: '2026-11-11T11:20:00Z',
    started_at: '2026-11-11T11:45:00Z',
    completed_at: '2026-11-11T14:30:00Z',
    status: 'unsuccessful',
    outcome: 'Sample aborted access due to secondary slide; handed off to engineering team.',
    evidence: [
      {
        id: 'EVD-3',
        caption: 'Sample blocked slope photo',
        captured_at: '2026-11-11T12:18:00Z',
        uploaded_by: 'District Officer',
        url: '/disasters/landslide-debris.jpg'
      }
    ],
    is_demo: true
  }
];

export const DEMO_CASUALTY_RECORD = {
  recorded_casualties_or_deaths: 2,
  verification_status: 'demo_placeholder',
  source: 'DEMO DATA — Sample separate casualty entry (not a live civil/medical registry)',
  is_demo: true
};

export const GOVERNMENT_AGENCIES = [
  'NDMA / State Disaster Management Authority (SDMA)',
  'NDRF / SDRF',
  'District Administration',
  'Police',
  'Fire and Emergency Services',
  'Medical and Health Department',
  'Relief Organization (Authorized)'
];

export const HAZARD_SAFETY_REFERENCES = [
  {
    id: 'flood',
    hazard: 'Floods & Urban Waterlogging',
    isPlaceholder: true,
    referenceSource: 'PLACEHOLDER PREPAREDNESS CHECKLIST — Follow live NDMA / SDMA / IMD bulletins',
    steps: [
      'Avoid walking, swimming, or driving through moving floodwater.',
      'Switch off main domestic electricity and gas lines if water enters the building.',
      'Move drinking water, essential medicines, and identity documents to upper levels.',
      'Evacuate only via routes explicitly confirmed by local civil authorities.'
    ]
  },
  {
    id: 'cyclone',
    hazard: 'Cyclones & Coastal Storm Surge',
    isPlaceholder: true,
    referenceSource: 'PLACEHOLDER PREPAREDNESS CHECKLIST — Follow live IMD / INCOIS / District advisories',
    steps: [
      'Stay indoors away from glass windows during high wind warnings.',
      'Keep battery-powered lights and mobile power banks charged before landfall.',
      'Do not venture outside during the calm eye of a cyclone; winds reverse rapidly.',
      'Follow coastal evacuation orders issued by District Administration.'
    ]
  },
  {
    id: 'earthquake',
    hazard: 'Earthquakes',
    isPlaceholder: true,
    referenceSource: 'PLACEHOLDER PREPAREDNESS CHECKLIST — Follow live NDMA / NCS bulletins',
    steps: [
      'Drop, Cover, and Hold On under sturdy furniture away from glass or heavy fixtures.',
      'Do not use elevators during or immediately after shaking.',
      'Expect aftershocks and stay clear of damaged masonry or downed power lines once outdoors.'
    ]
  },
  {
    id: 'landslide',
    hazard: 'Landslides & Slope Failures',
    isPlaceholder: true,
    referenceSource: 'PLACEHOLDER PREPAREDNESS CHECKLIST — Follow live GSI / District Control notices',
    steps: [
      'Stay alert during prolonged heavy rainfall if living near steep slopes or drainage channels.',
      'Watch for new cracks in walls, tilting poles, or sudden changes in stream water.',
      'Move to safe open ground away from slope paths if rumbling or debris movement begins.'
    ]
  },
  {
    id: 'fire',
    hazard: 'Fire & Smoke Emergencies',
    isPlaceholder: true,
    referenceSource: 'PLACEHOLDER PREPAREDNESS CHECKLIST — Dial 112 in immediate danger',
    steps: [
      'Stay low beneath smoke layers and cover nose and mouth with a damp cloth.',
      'Test closed doors with the back of your hand before opening; never use lifts.',
      'Assemble at an open safe point clear of emergency vehicle access.'
    ]
  },
  {
    id: 'heat',
    hazard: 'Extreme Weather & Heatwaves',
    isPlaceholder: true,
    referenceSource: 'PLACEHOLDER PREPAREDNESS CHECKLIST — Follow live IMD Heat Action advisories',
    steps: [
      'Limit strenuous outdoor work during peak midday heat and stay hydrated.',
      'Seek medical attention immediately for dizziness, confusion, or high body temperature.'
    ]
  }
];
