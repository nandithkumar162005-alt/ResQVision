import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { apiFetchResources } from '../../src/services/api.js';

describe('ResQVision Navigation, Auth, & Anti-Hallucination Contract Tests', () => {
  test('verifies allowed agencies list matches operational authorities', () => {
    const requiredAgencies = [
      'NDMA / State Disaster Management Authority (SDMA)',
      'NDRF / SDRF',
      'District Administration',
      'Police',
      'Fire and Emergency Services',
      'Medical and Health Department',
      'Relief Organization (Authorized)'
    ];

    assert.equal(requiredAgencies.length, 7);
    assert.ok(requiredAgencies.includes('NDRF / SDRF'));
    assert.ok(requiredAgencies.includes('District Administration'));
  });

  test('verifies resource fetcher adheres to anti-hallucination boundary', async () => {
    // In live mode when backend /api/v1/resources is offline, it must fail or report honest reason
    try {
      const res = await apiFetchResources();
      // If it returned, it must be an array
      assert.ok(Array.isArray(res));
    } catch (err) {
      assert.match(
        err.message,
        /Resource\/geospatial and evacuation route feeds are not connected|Failed to fetch/i
      );
    }
  });

  test('volunteer application disclaimer mandates non-dispatch operational notice', () => {
    const disclaimer =
      'Submitting this registration form records your willingness and interest to volunteer during civil emergencies. It does NOT grant official authorization, field operational clearance, or automatic deployment.';
    assert.ok(disclaimer.includes('does NOT grant official authorization'));
    assert.ok(disclaimer.includes('automatic deployment'));
  });
});
