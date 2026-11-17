import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../app.js';

// Minimal valid 1x1 PNG bytes for attachment upload tests
const VALID_PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
  'hex'
);

let server;
let baseUrl;
let tempRoot;

before(async () => {
  tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'resqvision-e2e-'));
  const app = createApp({
    dataDir: path.join(tempRoot, 'data'),
    uploadDir: path.join(tempRoot, 'uploads')
  });
  await new Promise(resolve => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  if (tempRoot) {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

describe('ResQVision Layer 3 End-to-End API & RBAC Workflow', () => {
  let citizen1Token;
  let citizen2Token;
  let govToken;
  let sosRef;
  let attachmentUrl;
  let operationRef;

  test('health endpoint reports honest dependency status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.dependencies.image_assessment.connected, 'boolean');
    assert.equal(body.dependencies.geospatial_resources.connected, false);
    assert.equal(body.dependencies.external_gov_sso.connected, false);
    assert.equal(body.dependencies.external_cad_dispatch.connected, false);
  });

  test('unauthenticated requests to protected citizen/gov/attachment routes are rejected (401)', async () => {
    for (const p of [
      '/api/v1/citizen/sos',
      '/api/v1/government/sos',
      '/api/v1/government/operations',
      '/api/v1/attachments/ATT-FAKE'
    ]) {
      const res = await fetch(`${baseUrl}${p}`);
      assert.equal(res.status, 401, `Expected 401 on ${p}`);
    }
  });

  test('citizen registration, login, and role separation', async () => {
    const reg1 = await fetch(`${baseUrl}/api/v1/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Citizen One',
        email: 'c1@example.org',
        password: 'StrongPassword123'
      })
    });
    assert.equal(reg1.status, 201);
    const d1 = await reg1.json();
    citizen1Token = d1.token;
    assert.equal(d1.user.role, 'citizen');

    const reg2 = await fetch(`${baseUrl}/api/v1/auth/citizen/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Citizen Two',
        email: 'c2@example.org',
        password: 'StrongPassword123'
      })
    });
    assert.equal(reg2.status, 201);
    citizen2Token = (await reg2.json()).token;

    // Citizen cannot access government endpoints (403)
    const govRes = await fetch(`${baseUrl}/api/v1/government/sos`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    assert.equal(govRes.status, 403);
  });

  test('SOS submission rejects missing data and fake image magic bytes (400)', async () => {
    const badForm = new FormData();
    badForm.append('emergencyType', 'Flood / Rising Water');
    badForm.append('locationText', '');
    badForm.append('lat', '17.415');
    badForm.append('lng', '78.4867');
    badForm.append('peopleCount', '2');
    badForm.append('description', 'short');
    badForm.append('contactName', 'Citizen One');
    badForm.append('contactPhone', '123');
    const badRes = await fetch(`${baseUrl}/api/v1/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: badForm
    });
    assert.equal(badRes.status, 400);

    // Fake image file (plain text masquerading as image/png)
    const fakeImgForm = new FormData();
    fakeImgForm.append('emergencyType', 'Flood / Rising Water');
    fakeImgForm.append('locationText', 'Lane 4, Musheerabad');
    fakeImgForm.append('lat', '17.415');
    fakeImgForm.append('lng', '78.4867');
    fakeImgForm.append('peopleCount', '2');
    fakeImgForm.append('description', 'Water entering ground floor room rapidly');
    fakeImgForm.append('contactName', 'Citizen One');
    fakeImgForm.append('contactPhone', '+91 9876543210');
    fakeImgForm.append(
      'photos',
      new Blob(['not actually a png'], { type: 'image/png' }),
      'fake.png'
    );
    const fakeRes = await fetch(`${baseUrl}/api/v1/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: fakeImgForm
    });
    assert.equal(fakeRes.status, 400);
  });

  test('complete workflow: SOS submit + PNG upload -> duplicate guard -> receipt PDF -> gov review -> operation -> rescue history -> citizen history', async () => {
    // 1. Submit valid SOS with PNG attachment
    const form = new FormData();
    form.append('emergencyType', 'Flood / Rising Water');
    form.append('locationText', 'Bholakpur Lane 4, Musheerabad');
    form.append('lat', '17.4182');
    form.append('lng', '78.4891');
    form.append('locationSource', 'gps');
    form.append('peopleCount', '4');
    form.append('description', 'Water waist deep in ground floor rooms; need assistance.');
    form.append('contactName', 'Citizen One');
    form.append('contactPhone', '+91 9876543210');
    form.append('idempotencyKey', 'IDEM-TEST-1');
    form.append('photos', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'flood.png');

    const createRes = await fetch(`${baseUrl}/api/v1/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: form
    });
    assert.equal(createRes.status, 201);
    const createdBody = await createRes.json();
    sosRef = createdBody.report.reference;
    assert.match(sosRef, /^SOS-RV-/);
    assert.equal(createdBody.report.photos.length, 1);
    attachmentUrl = createdBody.report.photos[0].url;

    // 2. Duplicate submission rejected (409)
    const dupForm = new FormData();
    dupForm.append('emergencyType', 'Flood / Rising Water');
    dupForm.append('locationText', 'Bholakpur Lane 4, Musheerabad');
    dupForm.append('lat', '17.4182');
    dupForm.append('lng', '78.4891');
    dupForm.append('peopleCount', '4');
    dupForm.append('description', 'Water waist deep in ground floor rooms; need assistance.');
    dupForm.append('contactName', 'Citizen One');
    dupForm.append('contactPhone', '+91 9876543210');
    dupForm.append('idempotencyKey', 'IDEM-TEST-1');
    const dupRes = await fetch(`${baseUrl}/api/v1/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: dupForm
    });
    assert.equal(dupRes.status, 409);

    // 3. Citizen 1 can access own attachment and PDF receipt; Citizen 2 gets 403
    const attOwner = await fetch(`${baseUrl}${attachmentUrl}`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    assert.equal(attOwner.status, 200);
    assert.equal(attOwner.headers.get('content-type'), 'image/png');

    const attOther = await fetch(`${baseUrl}${attachmentUrl}`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    assert.equal(attOther.status, 403);

    const pdfOwner = await fetch(`${baseUrl}/api/v1/citizen/sos/${sosRef}/receipt.pdf`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    assert.equal(pdfOwner.status, 200);
    assert.equal(pdfOwner.headers.get('content-type'), 'application/pdf');
    const pdfText = await pdfOwner.text();
    assert.ok(pdfText.startsWith('%PDF-1.4'));
    assert.ok(pdfText.includes(sosRef));
    assert.ok(pdfText.includes('rescue assignment or dispatch.'));

    const pdfOther = await fetch(`${baseUrl}/api/v1/citizen/sos/${sosRef}/receipt.pdf`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    assert.equal(pdfOther.status, 403);

    // 4. Government login & verify government cannot hit citizen SOS submit (403)
    const govLogin = await fetch(`${baseUrl}/api/v1/auth/government/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'officer@ndrf.resqvision.local',
        password: 'OfficerDemo!2026',
        agency: 'NDRF / SDRF'
      })
    });
    assert.equal(govLogin.status, 200);
    govToken = (await govLogin.json()).token;

    const govHitCitizen = await fetch(`${baseUrl}/api/v1/citizen/sos`, {
      headers: { Authorization: `Bearer ${govToken}` }
    });
    assert.equal(govHitCitizen.status, 403);

    // 5. Government notification exists for new SOS + officer can inspect attachment
    const govNotifs = await (
      await fetch(`${baseUrl}/api/v1/government/notifications`, {
        headers: { Authorization: `Bearer ${govToken}` }
      })
    ).json();
    assert.ok(govNotifs.notifications.some(n => n.title.includes(sosRef)));

    const govAtt = await fetch(`${baseUrl}${attachmentUrl}`, {
      headers: { Authorization: `Bearer ${govToken}` }
    });
    assert.equal(govAtt.status, 200);

    // 6. Officer requests additional info -> Citizen replies -> Officer authorizes operation
    const reqInfo = await fetch(`${baseUrl}/api/v1/government/sos/${sosRef}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${govToken}` },
      body: JSON.stringify({
        action: 'request_info',
        infoRequest: 'Confirm floor number and whether boat access is clear.'
      })
    });
    assert.equal(reqInfo.status, 200);

    const citReply = await fetch(`${baseUrl}/api/v1/citizen/sos/${sosRef}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${citizen1Token}` },
      body: JSON.stringify({ replyText: '2nd floor terrace; main lane accessible by boat.' })
    });
    assert.equal(citReply.status, 200);

    const authOp = await fetch(`${baseUrl}/api/v1/government/sos/${sosRef}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${govToken}` },
      body: JSON.stringify({
        action: 'authorize',
        unit: 'NDRF Battalion Rapid Response Team',
        notes: 'Assigned boat team.'
      })
    });
    assert.equal(authOp.status, 200);
    const reviewedReport = (await authOp.json()).report;
    assert.equal(reviewedReport.status, 'operation_authorized');
    assert.equal(reviewedReport.auditTrail.length, 4);

    // 7. Rescue History has ongoing operation -> Officer updates outcome & uploads evidence
    const opsBefore = await (
      await fetch(`${baseUrl}/api/v1/government/operations`, {
        headers: { Authorization: `Bearer ${govToken}` }
      })
    ).json();
    assert.equal(opsBefore.summary.total, 1);
    assert.equal(opsBefore.summary.ongoing, 1);
    operationRef = opsBefore.operations[0].operation_ref;
    assert.equal(opsBefore.operations[0].real_world_dispatch_confirmed, false);

    const evdForm = new FormData();
    evdForm.append('status', 'successful');
    evdForm.append('outcome', '4 residents escorted to municipal relief camp.');
    evdForm.append('caption', 'Evacuation confirmation');
    evdForm.append('evidence', new Blob([VALID_PNG_BYTES], { type: 'image/png' }), 'evd.png');
    const opUpdate = await fetch(
      `${baseUrl}/api/v1/government/operations/${operationRef}/update`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${govToken}` },
        body: evdForm
      }
    );
    assert.equal(opUpdate.status, 200);
    const opAfter = (await opUpdate.json()).operation;
    assert.equal(opAfter.status, 'successful');
    assert.equal(opAfter.evidence.length, 1);
    assert.ok(opAfter.completed_at);

    // 8. Separate casualty recording stays independent from operation counts
    const casRes = await fetch(`${baseUrl}/api/v1/government/casualties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${govToken}` },
      body: JSON.stringify({
        recorded_casualties_or_deaths: 0,
        verification_status: 'authority_verified',
        source: 'District Medical Reconciliation Test'
      })
    });
    assert.equal(casRes.status, 200);
    assert.equal((await casRes.json()).casualtyRecord.recorded_casualties_or_deaths, 0);

    // 9. Citizen history reflects permitted status update
    const citHistory = await (
      await fetch(`${baseUrl}/api/v1/citizen/sos`, {
        headers: { Authorization: `Bearer ${citizen1Token}` }
      })
    ).json();
    assert.equal(citHistory.reports.length, 1);
    assert.equal(citHistory.reports[0].statusLabel, 'Operation Successful');
  });

  test('resources boundary endpoint honestly reports unconnected external feed', async () => {
    const res = await fetch(`${baseUrl}/api/v1/resources`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.connected, false);
    assert.equal(body.resources, null);
    assert.deepEqual(body.verified_evacuation_routes, []);
  });
});
