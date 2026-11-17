import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, test } from 'node:test';
import { fetchActiveDisasters, fetchDispatchLog, USE_MOCK_DATA } from '../../src/services/api.js';

describe('Stream 3 API Contract Failure & Missing Field Tests', () => {
  let mockServer;
  let port;
  const originalFetch = globalThis.fetch;

  before(async () => {
    mockServer = http.createServer((req, res) => {
      if (req.url === '/html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<html>not json</html>');
      } else if (req.url === '/malformed') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: 'not-an-array' }));
      } else if (req.url === '/partial') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'success',
            data: [
              {
                event_id: 'EVT-PARTIAL-1',
                critical_zones: [{ lat: 17.4, lng: 78.4, damage_classification: 'unknown_value' }]
              }
            ]
          })
        );
      } else {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Upstream offline' }));
      }
    });
    await new Promise(resolve => {
      mockServer.listen(0, '127.0.0.1', () => {
        port = mockServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    if (mockServer) await new Promise(resolve => mockServer.close(resolve));
  });

  test('runs in live parser mode in Node and handles empty dispatch eventId', async () => {
    assert.equal(USE_MOCK_DATA, false);
    const emptyLog = await fetchDispatchLog('');
    assert.deepEqual(emptyLog.items, []);
  });

  test('rejects HTML non-JSON responses, HTTP 503 errors, and malformed schemas', async () => {
    globalThis.fetch = (_url, opts) => originalFetch(`http://127.0.0.1:${port}/html`, opts);
    await assert.rejects(() => fetchActiveDisasters(), /Malformed non-JSON response/);

    globalThis.fetch = (_url, opts) => originalFetch(`http://127.0.0.1:${port}/malformed`, opts);
    await assert.rejects(() => fetchActiveDisasters(), /Malformed \/api\/active-disasters payload/);

    globalThis.fetch = (_url, opts) => originalFetch(`http://127.0.0.1:${port}/down`, opts);
    await assert.rejects(() => fetchActiveDisasters(), /Upstream offline/);
  });

  test('normalizes partial records without fabricating missing population or valid classifications', async () => {
    globalThis.fetch = (_url, opts) => originalFetch(`http://127.0.0.1:${port}/partial`, opts);
    const result = await fetchActiveDisasters();
    assert.equal(result.items.length, 1);
    const ev = result.items[0];
    assert.equal(ev.event_id, 'EVT-PARTIAL-1');
    assert.equal(ev.affected_population_estimate, null);
    assert.equal(ev.updated_at, null);
    assert.equal(ev.critical_zones[0].damage_classification, null);
  });
});
