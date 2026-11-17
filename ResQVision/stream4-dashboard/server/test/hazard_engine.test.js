import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DEMO_ACTIVE_DISASTERS } from '../../src/data/mockData.js';
import {
  buildHazardGeoJson,
  extractHazardTimeline,
  inferHazardCategory
} from '../../src/utils/hazardEngine.js';

describe('Multi-Hazard Animation Engine Verification', () => {
  test('earthquake can be placed inland and produces no arbitrary circle when shaking footprint is absent', () => {
    const quakeNoFootprint = {
      event_id: 'EQ-RAW-1',
      disaster_type: 'Earthquake',
      lat: 27.1,
      lng: 75.8,
      source: 'Test',
      critical_zones: []
    };
    assert.equal(inferHazardCategory(quakeNoFootprint), 'earthquake');
    const geo = buildHazardGeoJson([quakeNoFootprint], { earthquake: true }, null);
    assert.equal(geo.polygons.features.length, 0);
    assert.equal(geo.points.features.length, 1);
    assert.deepEqual(geo.points.features[0].geometry.coordinates, [75.8, 27.1]);
  });

  test('earthquake does NOT generate tsunami wavefronts', () => {
    const eq = DEMO_ACTIVE_DISASTERS.find(d => d.hazard_category === 'earthquake');
    const geo = buildHazardGeoJson([eq], { earthquake: true, tsunami: true }, null);
    assert.equal(
      geo.lines.features.some(f => f.properties.kind === 'tsunami_wavefront'),
      false
    );
  });

  test('cyclone separates observed vs forecast tracks and animates storm eye across timestamps', () => {
    const cyc = DEMO_ACTIVE_DISASTERS.find(d => d.hazard_category === 'cyclone');
    const frames = extractHazardTimeline([cyc], { cyclone: true });
    assert.equal(frames.length, 5);

    const early = buildHazardGeoJson([cyc], { cyclone: true }, frames[0].timestamp);
    const late = buildHazardGeoJson([cyc], { cyclone: true }, frames[4].timestamp);

    const earlyEye = early.points.features.find(f => f.properties.kind === 'cyclone_eye');
    const lateEye = late.points.features.find(f => f.properties.kind === 'cyclone_eye');
    assert.notDeepEqual(earlyEye.geometry.coordinates, lateEye.geometry.coordinates);

    assert.ok(early.lines.features.some(f => f.properties.kind === 'cyclone_observed_track'));
    assert.ok(early.lines.features.some(f => f.properties.kind === 'cyclone_forecast_track'));
    assert.ok(early.polygons.features.some(f => f.properties.kind === 'cyclone_cone'));
  });

  test('rainfall renders frame polygons when data exists and renders nothing when missing', () => {
    const rain = DEMO_ACTIVE_DISASTERS.find(d => d.hazard_category === 'rainfall');
    const frames = extractHazardTimeline([rain], { rainfall: true });
    assert.equal(frames.length, 4);

    const geoAtFrame2 = buildHazardGeoJson([rain], { rainfall: true }, frames[2].timestamp);
    assert.equal(geoAtFrame2.polygons.features[0].properties.intensity_mm_hr, 98);

    const noRainData = { event_id: 'RN-EMPTY', disaster_type: 'Heavy Rainfall', lat: 19, lng: 73 };
    const geoEmpty = buildHazardGeoJson([noRainData], { rainfall: true }, null);
    assert.equal(geoEmpty.polygons.features.length, 0);
  });

  test('tsunami keeps offshore ocean-origin wavefronts & coastal segments and stays off when disabled', () => {
    const tsu = DEMO_ACTIVE_DISASTERS.find(d => d.hazard_category === 'tsunami');
    const frames = extractHazardTimeline([tsu], { tsunami: true });
    assert.equal(frames.length, 4);

    const geo = buildHazardGeoJson([tsu], { tsunami: true }, frames[1].timestamp);
    assert.ok(geo.points.features.some(f => f.properties.kind === 'tsunami_origin'));
    assert.ok(geo.lines.features.some(f => f.properties.kind === 'tsunami_wavefront'));
    assert.ok(geo.lines.features.some(f => f.properties.kind === 'tsunami_coast_threat'));

    const offGeo = buildHazardGeoJson([tsu], { tsunami: false }, frames[1].timestamp);
    assert.equal(offGeo.lines.features.length, 0);
  });

  test('flood renders river corridor, inundation extent progression, and gauge markers', () => {
    const flood = DEMO_ACTIVE_DISASTERS.find(d => d.hazard_category === 'flood');
    const frames = extractHazardTimeline([flood], { flood: true });
    assert.equal(frames.length, 4);

    const geo = buildHazardGeoJson([flood], { flood: true }, frames[3].timestamp);
    assert.ok(geo.lines.features.some(f => f.properties.kind === 'flood_river_corridor'));
    assert.ok(geo.polygons.features.some(f => f.properties.kind === 'flood_inundation'));
    assert.equal(
      geo.points.features.filter(f => f.properties.kind === 'river_gauge').length,
      2
    );
  });
});
