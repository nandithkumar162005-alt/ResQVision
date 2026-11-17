import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createApp } from '../app.js';
import { CONFIG } from '../config.js';

let api, stub, root, seen;
before(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), 'rv-img-'));
  stub = http.createServer((req, res) => {
    let n = 0;
    req.on('data', (c) => (n += c.length));
    req.on('end', () => {
      seen = { url: req.url, bytes: n, type: req.headers['content-type'] };
      res.setHeader('content-type', 'application/json');
      if (req.url.includes('/verify-message')) {
        res.end(JSON.stringify({ status: 'success', data: { verdict: 'GENUINE_EMERGENCY', authenticity_score: 95, is_genuine: true, urgency: 'HIGH' } }));
      } else {
        res.end(JSON.stringify({ status: 'success', data: { verdict: 'UNCERTAIN', summary: { level: 'grey' } } }));
      }
    });
  });
  await new Promise((r) => stub.listen(0, '127.0.0.1', r));
  CONFIG.imageAssessmentUrl = `http://127.0.0.1:${stub.address().port}/verify-image`;
  const app = createApp({ dataDir: path.join(root, 'd'), uploadDir: path.join(root, 'u') });
  api = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
});
after(async () => { api.close(); stub.close(); await fs.rm(root, { recursive: true, force: true }); });

const url = () => `http://127.0.0.1:${api.address().port}/api/v1/verify-image`;
const png = () => new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' });

describe('POST /api/v1/verify-image', () => {
  test('rejects a request with no file', async () => {
    const r = await fetch(url(), { method: 'POST', body: new FormData() });
    assert.equal(r.status, 400);
  });
  test('rejects a non-image file', async () => {
    const f = new FormData(); f.append('file', new Blob(['hi'], { type: 'text/plain' }), 'a.txt');
    assert.equal((await fetch(url(), { method: 'POST', body: f })).status, 400);
  });
  test('forwards the image and the claim to Stream 2 and returns its answer', async () => {
    const f = new FormData(); f.append('file', png(), 'a.png'); f.append('claimed_type', 'flood'); f.append('lat', '17.4');
    const r = await fetch(url(), { method: 'POST', body: f });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).data.verdict, 'UNCERTAIN');
    assert.equal(seen.url, '/verify-image');
    assert.match(seen.type, /multipart\/form-data/);
    assert.ok(seen.bytes > 8);
  });
  test('says so plainly when Stream 2 is not running', async () => {
    const old = CONFIG.imageAssessmentUrl; CONFIG.imageAssessmentUrl = 'http://127.0.0.1:1/verify-image';
    const f = new FormData(); f.append('file', png(), 'a.png');
    const r = await fetch(url(), { method: 'POST', body: f });
    CONFIG.imageAssessmentUrl = old;
    assert.equal(r.status, 503);
    assert.match((await r.json()).error, /Stream 2/);
  });
});

describe('POST /api/v1/verify-message', () => {
  const msgUrl = () => `http://127.0.0.1:${api.address().port}/api/v1/verify-message`;

  test('rejects a request with empty message', async () => {
    const r = await fetch(msgUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '   ' })
    });
    assert.equal(r.status, 400);
  });

  test('forwards the distress message and returns analysis from Stream 2', async () => {
    const r = await fetch(msgUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Water level reached second floor, 4 family members trapped on terrace!',
        claimed_type: 'flood',
        lat: 17.385,
        lon: 78.486
      })
    });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.status, 'success');
    assert.equal(body.data.verdict, 'GENUINE_EMERGENCY');
    assert.equal(body.data.is_genuine, true);
    assert.equal(body.data.authenticity_score, 95);
  });
});
