import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import {
  authenticate,
  authenticateWithSupabase,
  hashPassword,
  registerWithSupabase,
  requireRole,
  signSessionToken,
  verifyPassword
} from './auth.js';
import { CONFIG } from './config.js';
import { buildServerSosReceiptPdfBuffer } from './pdfGenerator.js';
import { DataStore } from './store.js';

const ALLOWED_AGENCIES = [
  'NDMA / State Disaster Management Authority (SDMA)',
  'NDRF / SDRF',
  'District Administration',
  'Police',
  'Fire and Emergency Services',
  'Medical and Health Department',
  'Relief Organization (Authorized)'
];

const SAFE_IMAGE_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

function detectImageMimeByMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

function sanitizeCitizenReportView(report) {
  const showOfficerNote =
    report.status === 'info_requested' ||
    report.status === 'operation_authorized' ||
    report.status === 'rejected' ||
    report.status === 'verified';
  return {
    reference: report.reference,
    submittedAt: report.submittedAt,
    emergencyType: report.emergencyType,
    locationText: report.locationText,
    state: report.state,
    district: report.district,
    lat: report.lat,
    lng: report.lng,
    locationSource: report.locationSource,
    peopleCount: report.peopleCount,
    description: report.description,
    contactName: report.contactName,
    contactPhone: report.contactPhone,
    photos: (report.photos || []).map(p => ({
      id: p.id,
      name: p.name,
      caption: p.caption,
      url: `/api/v1/attachments/${p.id}`
    })),
    status: report.status,
    statusLabel: report.statusLabel,
    officerNote: showOfficerNote
      ? report.officerNote
      : 'Submitted and recorded. Pending review by an authorized officer (not yet verified or dispatched).',
    authorizedUnit: report.status === 'operation_authorized' ? report.authorizedUnit : null,
    citizenUpdates: report.citizenUpdates || []
  };
}

function sanitizeGovernmentReportView(report) {
  return {
    ...report,
    photos: (report.photos || []).map(p => ({
      id: p.id,
      name: p.name,
      caption: p.caption,
      url: `/api/v1/attachments/${p.id}`
    }))
  };
}

export function createApp({
  dataDir = CONFIG.dataDir,
  uploadDir = CONFIG.uploadDir
} = {}) {
  const app = express();
  const store = new DataStore(dataDir);

  // CORS middleware for Vercel <-> Render cross-origin requests
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: CONFIG.maxUploadBytes,
      files: CONFIG.maxUploadCount
    }
  });

  // 1. Health & external dependency status
  app.get('/api/v1/health', async (_req, res) => {
    let stream3Reachable = false;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 1200);
      const r = await fetch(`${CONFIG.stream3BaseUrl}/api/active-disasters`, {
        signal: controller.signal
      });
      clearTimeout(t);
      stream3Reachable = r.ok;
    } catch {
      stream3Reachable = false;
    }

    res.json({
      status: 'ok',
      service: 'resqvision-layer3-backend',
      dependencies: {
        stream3: {
          url: CONFIG.stream3BaseUrl,
          reachable: stream3Reachable
        },
        image_assessment: {
          connected: Boolean(CONFIG.imageAssessmentUrl)
        },
        geospatial_resources: {
          connected: Boolean(CONFIG.geospatialFeedUrl)
        },
        external_gov_sso: {
          connected: false
        },
        external_cad_dispatch: {
          connected: false
        }
      }
    });
  });

  // 1b. Image verification (public): forwards the photo + optional claim to Stream 2, which runs the
  // authenticity analysis and cross-checks the claim against Open-Meteo weather and USGS earthquake data.
  const verifyHits = new Map();
  const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 } });
  app.post('/api/v1/verify-image', imageUpload.single('file'), async (req, res) => {
    const ip = req.ip || 'local';
    const now = Date.now();
    const recent = (verifyHits.get(ip) || []).filter((t) => now - t < 60_000);
    if (recent.length >= 20) {
      return res.status(429).json({ error: 'Too many checks. Please wait a minute.' });
    }
    recent.push(now);
    verifyHits.set(ip, recent);

    if (!CONFIG.imageAssessmentUrl) {
      return res.status(503).json({ error: 'Image verification service is not configured.' });
    }
    if (!req.file) return res.status(400).json({ error: 'Choose an image file to check.' });
    if (!/^image\//.test(req.file.mimetype)) {
      return res.status(400).json({ error: 'The file must be an image (JPEG, PNG or WebP).' });
    }
    const makeForm = () => {
      const f = new FormData();
      f.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname || 'upload');
      for (const k of ['lat', 'lng', 'taken_at', 'claimed_type']) {
        const v = String(req.body?.[k] ?? '').trim();
        if (v) f.append(k, v);
      }
      return f;
    };

    const isLocal = CONFIG.imageAssessmentUrl.includes('127.0.0.1') || CONFIG.imageAssessmentUrl.includes('localhost');
    const maxRetries = isLocal ? 0 : 2;
    let response = null;
    let body = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const r = await fetch(CONFIG.imageAssessmentUrl, {
          method: 'POST',
          body: makeForm(),
          signal: AbortSignal.timeout(attempt === 0 ? 30_000 : 45_000)
        });
        const parsed = await r.json().catch(() => null);

        if (r.ok) {
          return res.json(parsed);
        }

        // If client validation error (400 or 422), return immediately without retrying
        if (r.status === 400 || r.status === 422) {
          let detail = parsed?.detail || parsed?.error;
          if (Array.isArray(detail)) {
            detail = detail.map((d) => `${d.loc?.slice(-1)[0] || 'input'}: ${d.msg}`).join(', ');
          } else if (typeof detail === 'object' && detail !== null) {
            detail = JSON.stringify(detail);
          }
          return res.status(422).json({ error: detail || 'Invalid image or claim data provided.' });
        }

        response = r;
        body = parsed;

        // If 502/503/504 (e.g. Render free-tier container spinning up), wait and retry
        if (attempt < maxRetries && (r.status === 502 || r.status === 503 || r.status === 504)) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          break;
        }
      } catch (err) {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (response) {
      let detailMsg = body?.detail || body?.error;
      if (Array.isArray(detailMsg)) {
        detailMsg = detailMsg.map((d) => `${d.loc?.slice(-1)[0] || 'input'}: ${d.msg}`).join(', ');
      } else if (typeof detailMsg === 'object' && detailMsg !== null) {
        detailMsg = JSON.stringify(detailMsg);
      }

      if (response.status === 502 || response.status === 504 || response.status === 503) {
        return res.status(502).json({
          error: detailMsg || 'The AI image analysis service (Stream 2) is waking up from standby on Render. Please wait 10-15 seconds and try again.'
        });
      }
      return res.status(response.status).json({
        error: detailMsg || 'Image analysis service (Stream 2) returned an error. Please try again.'
      });
    }

    return res.status(503).json({ error: 'Cannot reach the image analysis service (Stream 2, port 8002). Is it running?' });
  });

  app.post('/api/v1/verify-message', express.json(), async (req, res) => {
    const text = String(req.body?.text || req.body?.message || '').trim();
    if (!text) {
      return res.status(400).json({ error: 'Text message is required for verification.' });
    }
    const messageVerifyUrl = CONFIG.imageAssessmentUrl.replace('/verify-image', '/verify-message');

    const isLocal = messageVerifyUrl.includes('127.0.0.1') || messageVerifyUrl.includes('localhost');
    const maxRetries = isLocal ? 0 : 2;
    let response = null;
    let body = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const r = await fetch(messageVerifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            emergency_type: req.body?.emergency_type,
            lat: req.body?.lat ? Number(req.body.lat) : null,
            lng: req.body?.lng ? Number(req.body.lng) : null,
            location_text: req.body?.location_text,
            people_count: req.body?.people_count ? Number(req.body.people_count) : null
          }),
          signal: AbortSignal.timeout(attempt === 0 ? 15_000 : 30_000)
        });
        const parsed = await r.json().catch(() => null);

        if (r.ok) {
          return res.json(parsed);
        }

        if (r.status === 400 || r.status === 422) {
          let detail = parsed?.detail || parsed?.error;
          if (Array.isArray(detail)) {
            detail = detail.map((d) => `${d.loc?.slice(-1)[0] || 'input'}: ${d.msg}`).join(', ');
          } else if (typeof detail === 'object' && detail !== null) {
            detail = JSON.stringify(detail);
          }
          return res.status(422).json({ error: detail || 'Invalid message verification request.' });
        }

        response = r;
        body = parsed;

        if (attempt < maxRetries && (r.status === 502 || r.status === 503 || r.status === 504)) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          break;
        }
      } catch (err) {
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (response) {
      let detailMsg = body?.detail || body?.error;
      if (Array.isArray(detailMsg)) {
        detailMsg = detailMsg.map((d) => `${d.loc?.slice(-1)[0] || 'input'}: ${d.msg}`).join(', ');
      } else if (typeof detailMsg === 'object' && detailMsg !== null) {
        detailMsg = JSON.stringify(detailMsg);
      }

      if (response.status === 502 || response.status === 504 || response.status === 503) {
        return res.status(502).json({
          error: detailMsg || 'The AI verification service (Stream 2) is waking up from standby on Render. Please wait 10 seconds and try again.'
        });
      }
      return res.status(response.status).json({
        error: detailMsg || 'Message analysis service (Stream 2) returned an error.'
      });
    }

    return res.status(503).json({ error: 'Cannot reach the message analysis service (Stream 2, port 8002). Is it running?' });
  });

  // 2. Authentication (Citizen & Government separated)
  app.post('/api/v1/auth/citizen/register', async (req, res) => {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'Full name (at least 2 characters) is required.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const created = await store.mutate(db => {
      if (db.users.some(u => u.email.toLowerCase() === email)) {
        return { conflict: true };
      }
      const user = {
        id: `USR-CIT-${crypto.randomUUID().slice(0, 8)}`,
        role: 'citizen',
        name,
        email,
        passwordHash: hashPassword(password),
        agency: null,
        isSeededTestAccount: false,
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
      return { user };
    });

    if (created.conflict) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Register with Supabase in background
    registerWithSupabase(name, email, password, 'citizen').catch(() => {});

    const token = signSessionToken(created.user);
    return res.status(201).json({
      token,
      user: {
        id: created.user.id,
        role: created.user.role,
        name: created.user.name,
        email: created.user.email
      }
    });
  });

  app.post('/api/v1/auth/citizen/login', async (req, res) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 1. Authenticate via Supabase Auth
    const sbUser = await authenticateWithSupabase(email, password);
    if (sbUser && (sbUser.role === 'citizen' || !sbUser.role)) {
      const citizenUser = {
        id: sbUser.id,
        role: 'citizen',
        name: sbUser.name || 'Verified Citizen',
        email: sbUser.email
      };
      const token = signSessionToken(citizenUser);
      return res.json({
        token,
        user: citizenUser,
        provider: 'supabase'
      });
    }

    // 2. Fallback to local store
    const db = await store.read();
    const user = db.users.find(
      u => u.role === 'citizen' && u.email.toLowerCase() === email
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid citizen credentials.' });
    }

    const token = signSessionToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  });

  app.post('/api/v1/auth/government/login', async (req, res) => {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || '');
    const agency = String(req.body?.agency || '').trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Official email and passcode are required.' });
    }

    // 1. Authenticate via Supabase Auth
    const sbUser = await authenticateWithSupabase(email, password);
    if (sbUser && (sbUser.role === 'government' || !sbUser.role)) {
      const resolvedAgency = ALLOWED_AGENCIES.includes(agency) ? agency : (sbUser.agency || 'NDRF / SDRF');
      const officerUser = {
        id: sbUser.id,
        role: 'government',
        name: sbUser.name || 'Commander Vikram Rao',
        email: sbUser.email,
        agency: resolvedAgency
      };
      const token = signSessionToken(officerUser);
      return res.json({
        token,
        user: officerUser,
        provider: 'supabase',
        authBoundaryNote: 'Authenticated via Supabase Auth.'
      });
    }

    // 2. Fallback to local store
    const db = await store.read();
    const user = db.users.find(
      u => u.role === 'government' && u.email.toLowerCase() === email
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid government/officer credentials.' });
    }

    const resolvedAgency = ALLOWED_AGENCIES.includes(agency) ? agency : user.agency;
    const tokenPayload = { ...user, agency: resolvedAgency };
    const token = signSessionToken(tokenPayload);

    return res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        agency: resolvedAgency
      },
      authBoundaryNote:
        'Local ResQVision RBAC session active. Production government SSO/PKI verification requires external institutional identity integration.'
    });
  });

  app.get('/api/v1/auth/me', authenticate, (req, res) => {
    res.json({ user: req.user });
  });

  // 3. Citizen SOS Submission, History, Reply, Receipt
  app.post(
    '/api/v1/sos',
    authenticate,
    requireRole('citizen'),
    upload.array('photos', CONFIG.maxUploadCount),
    async (req, res) => {
      const emergencyType = String(req.body?.emergencyType || '').trim();
      const locationText = String(req.body?.locationText || '').trim();
      const state = String(req.body?.state || '').trim();
      const district = String(req.body?.district || '').trim();
      const locationSource = req.body?.locationSource === 'gps' ? 'gps' : 'manual';
      const lat = Number(req.body?.lat);
      const lng = Number(req.body?.lng);
      const peopleCount = Number(req.body?.peopleCount);
      const description = String(req.body?.description || '').trim();
      const contactName = String(req.body?.contactName || '').trim();
      const contactPhone = String(req.body?.contactPhone || '').trim();
      const idempotencyKey = String(req.body?.idempotencyKey || '').trim() || null;

      if (!emergencyType) {
        return res.status(400).json({ error: 'Emergency type is required.' });
      }
      if (!locationText) {
        return res.status(400).json({ error: 'Location description/address is required.' });
      }
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return res.status(400).json({ error: 'Valid numeric coordinates (lat/lng) are required.' });
      }
      if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 500) {
        return res.status(400).json({ error: 'People needing help must be an integer (1-500).' });
      }
      if (!description || description.length < 10) {
        return res
          .status(400)
          .json({ error: 'Incident description must be at least 10 characters.' });
      }
      const phoneDigits = contactPhone.replace(/\D/g, '');
      if (!contactName || phoneDigits.length < 10) {
        return res
          .status(400)
          .json({ error: 'Valid contact name and 10+ digit phone number are required.' });
      }

      // Validate uploaded files via magic bytes
      const files = Array.isArray(req.files) ? req.files : [];
      const validatedFiles = [];
      for (const file of files) {
        const verifiedMime = detectImageMimeByMagicBytes(file.buffer);
        if (!verifiedMime) {
          return res.status(400).json({
            error: `Invalid image file "${file.originalname}". Only valid JPEG, PNG, or WebP images are accepted.`
          });
        }
        validatedFiles.push({
          originalName: path.basename(file.originalname || 'photo.jpg'),
          mime: verifiedMime,
          size: file.size,
          buffer: file.buffer
        });
      }

      // Persist files safely outside public directory
      await fs.mkdir(uploadDir, { recursive: true });
      const storedAttachments = [];
      for (const item of validatedFiles) {
        const attachmentId = `ATT-${crypto.randomUUID()}`;
        const ext = SAFE_IMAGE_EXT[item.mime] || '.bin';
        const storedFilename = `${attachmentId}${ext}`;
        await fs.writeFile(path.join(uploadDir, storedFilename), item.buffer);
        storedAttachments.push({
          id: attachmentId,
          citizenUserId: req.user.id,
          name: item.originalName,
          caption: `${item.originalName} (${Math.max(1, Math.round(item.size / 1024))} KB)`,
          mimeType: item.mime,
          sizeBytes: item.size,
          storedFilename,
          uploadedAt: new Date().toISOString()
        });
      }

      const now = new Date().toISOString();
      const dateTag = now.slice(0, 10).replaceAll('-', '');
      const reference = `SOS-RV-${dateTag}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      // 1. AI Image Authenticity Verification via Stream 2
      let imageAssessment = {
        available: false,
        cautionLabel: storedAttachments.length > 0 ? 'AI Verification Pending' : 'No photographs attached',
        summary: storedAttachments.length > 0
          ? `${storedAttachments.length} image attachment(s) stored.`
          : 'No photographs attached to this report.',
        confidenceCaveat: 'Automated assessment is an advisory tool; officer ground verification is required.'
      };

      if (validatedFiles.length > 0 && CONFIG.imageAssessmentUrl) {
        try {
          const form = new FormData();
          const firstItem = validatedFiles[0];
          form.append('file', new Blob([firstItem.buffer], { type: firstItem.mime }), firstItem.originalName);
          if (Number.isFinite(lat)) form.append('lat', String(lat));
          if (Number.isFinite(lng)) form.append('lng', String(lng));
          if (emergencyType) form.append('claimed_type', emergencyType);
          form.append('taken_at', now.slice(0, 10));

          const imgResp = await fetch(CONFIG.imageAssessmentUrl, {
            method: 'POST',
            body: form,
            signal: AbortSignal.timeout(3000)
          });
          if (imgResp.ok) {
            const imgData = await imgResp.json();
            const auth = imgData?.data || {};
            imageAssessment = {
              available: true,
              verdict: auth.verdict,
              label: auth.label,
              ai_probability: auth.ai_probability,
              confidence: auth.confidence,
              cautionLabel: `AI Image: ${auth.label || auth.verdict} (${auth.ai_probability}% AI Probability)`,
              summary: (auth.reasons || []).join('; ') || auth.summary?.headline || 'Image evaluated by ML forensics.',
              confidenceCaveat: auth.disclaimer || 'Use alongside NDRF ground confirmation before dispatch.',
              reasons: auth.reasons || []
            };
          }
        } catch {
          // Graceful fallback if Stream 2 is offline
        }
      }

      // 2. AI Distress Message Veracity Verification via Stream 2
      let messageVerification = {
        available: false,
        verdict: 'UNVERIFIED',
        authenticity_score: 70,
        label: 'Message Pending AI Review',
        summary: 'Distress message awaiting officer review.',
        signals: [],
        reasons: []
      };

      try {
        const msgVerifyUrl = CONFIG.imageAssessmentUrl.replace('/verify-image', '/verify-message');
        const msgResp = await fetch(msgVerifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: description,
            emergency_type: emergencyType,
            lat: Number.isFinite(lat) ? lat : null,
            lng: Number.isFinite(lng) ? lng : null,
            location_text: locationText,
            people_count: peopleCount
          }),
          signal: AbortSignal.timeout(3000)
        });
        if (msgResp.ok) {
          const msgData = await msgResp.json();
          if (msgData?.data) {
            messageVerification = {
              available: true,
              ...msgData.data
            };
          }
        }
      } catch {
        // Graceful fallback if Stream 2 is offline
      }

      const result = await store.mutate(db => {
        const tenMinAgo = Date.now() - 10 * 60 * 1000;
        const duplicate = db.sosReports.find(
          r =>
            r.citizenUserId === req.user.id &&
            ((idempotencyKey && r.idempotencyKey === idempotencyKey) ||
              (r.emergencyType === emergencyType &&
                r.locationText.toLowerCase() === locationText.toLowerCase() &&
                r.description.toLowerCase() === description.toLowerCase() &&
                new Date(r.submittedAt).getTime() >= tenMinAgo))
        );

        if (duplicate) {
          return { duplicate };
        }

        const report = {
          reference,
          idempotencyKey,
          citizenUserId: req.user.id,
          submittedAt: now,
          emergencyType,
          locationText,
          state,
          district,
          lat,
          lng,
          locationSource,
          peopleCount,
          description,
          contactName,
          contactPhone,
          photos: storedAttachments.map(a => ({
            id: a.id,
            name: a.name,
            caption: a.caption
          })),
          status: 'pending_review',
          statusLabel: 'Submitted — Pending Officer Review',
          officerNote:
            'Report stored on server. Pending human review by an authorized officer (not yet verified or dispatched).',
          reviewedBy: null,
          reviewedAt: null,
          authorizedUnit: null,
          imageAssessment,
          messageVerification,
          auditTrail: [
            {
              at: now,
              actor: `${req.user.name} (Citizen)`,
              action: `Submitted SOS ${reference} (${locationSource}). Stored in backend; awaiting officer review.`
            }
          ],
          citizenUpdates: [],
          is_demo: false
        };

        db.attachments.push(...storedAttachments);
        db.sosReports.unshift(report);
        db.notifications.unshift({
          id: `GNOT-${crypto.randomUUID().slice(0, 8)}`,
          targetRole: 'government',
          targetUserId: null,
          title: `New SOS ${reference} awaiting officer review`,
          detail: `${emergencyType} · ${locationText} (${peopleCount} person(s))`,
          reference,
          at: now,
          readBy: []
        });

        return { report };
      });

      if (result.duplicate) {
        // Remove unused newly written files if duplicate detected
        for (const att of storedAttachments) {
          await fs.unlink(path.join(uploadDir, att.storedFilename)).catch(() => {});
        }
        return res.status(409).json({
          error: 'Duplicate SOS submission detected within 10 minutes.',
          existingReference: result.duplicate.reference
        });
      }

      return res.status(201).json({
        report: sanitizeCitizenReportView(result.report)
      });
    }
  );

  app.get('/api/v1/citizen/sos', authenticate, requireRole('citizen'), async (req, res) => {
    const db = await store.read();
    const own = db.sosReports
      .filter(r => r.citizenUserId === req.user.id)
      .map(sanitizeCitizenReportView);
    res.json({ reports: own });
  });

  app.get(
    '/api/v1/citizen/sos/:reference',
    authenticate,
    requireRole('citizen'),
    async (req, res) => {
      const db = await store.read();
      const report = db.sosReports.find(r => r.reference === req.params.reference);
      if (!report) return res.status(404).json({ error: 'SOS report not found.' });
      if (report.citizenUserId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied to another citizen report.' });
      }
      return res.json({ report: sanitizeCitizenReportView(report) });
    }
  );

  app.post(
    '/api/v1/citizen/sos/:reference/reply',
    authenticate,
    requireRole('citizen'),
    async (req, res) => {
      const replyText = String(req.body?.replyText || '').trim();
      if (!replyText || replyText.length < 3) {
        return res.status(400).json({ error: 'Additional information text is required.' });
      }
      const now = new Date().toISOString();

      const updated = await store.mutate(db => {
        const report = db.sosReports.find(r => r.reference === req.params.reference);
        if (!report) return { status: 404 };
        if (report.citizenUserId !== req.user.id) return { status: 403 };
        report.citizenUpdates = report.citizenUpdates || [];
        report.citizenUpdates.push({ at: now, message: replyText });
        report.status = 'pending_review';
        report.statusLabel = 'Additional Info Provided — Pending Officer Review';
        report.auditTrail.push({
          at: now,
          actor: `${req.user.name} (Citizen)`,
          action: `Provided requested information: ${replyText}`
        });
        db.notifications.unshift({
          id: `GNOT-${crypto.randomUUID().slice(0, 8)}`,
          targetRole: 'government',
          targetUserId: null,
          title: `Citizen replied on ${report.reference}`,
          detail: replyText,
          reference: report.reference,
          at: now,
          readBy: []
        });
        return { status: 200, report };
      });

      if (updated.status === 404) return res.status(404).json({ error: 'Report not found.' });
      if (updated.status === 403) return res.status(403).json({ error: 'Forbidden.' });
      return res.json({ report: sanitizeCitizenReportView(updated.report) });
    }
  );

  app.get(
    '/api/v1/citizen/sos/:reference/receipt.pdf',
    authenticate,
    requireRole('citizen'),
    async (req, res) => {
      const db = await store.read();
      const report = db.sosReports.find(r => r.reference === req.params.reference);
      if (!report) return res.status(404).json({ error: 'SOS report not found.' });
      if (report.citizenUserId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden: cannot access another citizen receipt.' });
      }
      const pdfBuf = buildServerSosReceiptPdfBuffer(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.reference}-receipt.pdf"`
      );
      return res.send(pdfBuf);
    }
  );

  app.get(
    '/api/v1/citizen/notifications',
    authenticate,
    requireRole('citizen'),
    async (req, res) => {
      const db = await store.read();
      const items = db.notifications
        .filter(n => n.targetRole === 'citizen' && n.targetUserId === req.user.id)
        .map(n => ({
          id: n.id,
          title: n.title,
          detail: n.detail,
          at: n.at,
          read: (n.readBy || []).includes(req.user.id)
        }));
      res.json({ notifications: items });
    }
  );

  app.post(
    '/api/v1/citizen/notifications/read',
    authenticate,
    requireRole('citizen'),
    async (req, res) => {
      await store.mutate(db => {
        db.notifications.forEach(n => {
          if (n.targetRole === 'citizen' && n.targetUserId === req.user.id) {
            n.readBy = Array.from(new Set([...(n.readBy || []), req.user.id]));
          }
        });
      });
      res.json({ ok: true });
    }
  );

  // 4. Protected attachment retrieval (owning citizen OR government officer only)
  app.get('/api/v1/attachments/:attachmentId', authenticate, async (req, res) => {
    const db = await store.read();
    const att = db.attachments.find(a => a.id === req.params.attachmentId);
    if (!att) return res.status(404).json({ error: 'Attachment not found.' });

    const isAllowed =
      req.user.role === 'government' ||
      (req.user.role === 'citizen' && att.citizenUserId === req.user.id);

    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden: attachment access denied.' });
    }

    const fullPath = path.join(uploadDir, path.basename(att.storedFilename));
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ error: 'Stored attachment file missing on disk.' });
    }

    res.setHeader('Content-Type', att.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.sendFile(fullPath);
  });

  // 5. Government Portal Endpoints (requireRole('government'))
  app.get(
    '/api/v1/government/notifications',
    authenticate,
    requireRole('government'),
    async (req, res) => {
      const db = await store.read();
      const items = db.notifications
        .filter(n => n.targetRole === 'government')
        .map(n => ({
          id: n.id,
          title: n.title,
          detail: n.detail,
          at: n.at,
          read: (n.readBy || []).includes(req.user.id)
        }));
      res.json({ notifications: items });
    }
  );

  app.post(
    '/api/v1/government/notifications/read',
    authenticate,
    requireRole('government'),
    async (req, res) => {
      await store.mutate(db => {
        db.notifications.forEach(n => {
          if (n.targetRole === 'government') {
            n.readBy = Array.from(new Set([...(n.readBy || []), req.user.id]));
          }
        });
      });
      res.json({ ok: true });
    }
  );

  app.get('/api/v1/government/sos', authenticate, requireRole('government'), async (_req, res) => {
    const db = await store.read();
    res.json({
      reports: db.sosReports.map(sanitizeGovernmentReportView)
    });
  });

  app.post(
    '/api/v1/government/sos/:reference/review',
    authenticate,
    requireRole('government'),
    async (req, res) => {
      const action = String(req.body?.action || '').trim();
      const reason = String(req.body?.reason || '').trim();
      const infoRequest = String(req.body?.infoRequest || '').trim();
      const unit = String(req.body?.unit || '').trim();
      const notes = String(req.body?.notes || '').trim();

      if (!['verify', 'reject', 'request_info', 'authorize'].includes(action)) {
        return res.status(400).json({ error: 'Invalid officer review action.' });
      }
      if (action === 'reject' && !reason) {
        return res.status(400).json({ error: 'Rejection reason is required.' });
      }
      if (action === 'request_info' && !infoRequest) {
        return res.status(400).json({ error: 'Information prompt is required.' });
      }
      if (action === 'authorize' && !unit) {
        return res.status(400).json({ error: 'Assigned team or department is required.' });
      }

      const now = new Date().toISOString();
      const actorLabel = `${req.user.name} (${req.user.agency || 'Government'})`;

      const outcome = await store.mutate(db => {
        const report = db.sosReports.find(r => r.reference === req.params.reference);
        if (!report) return { notFound: true };

        let auditText = '';
        let citizenMsg = null;

        if (action === 'verify') {
          report.status = 'verified';
          report.statusLabel = 'Verified by Officer — Awaiting Operation Decision';
          report.officerNote = notes || 'Incident verified by duty officer.';
          auditText = `Accepted / verified by ${actorLabel}. ${report.officerNote}`;
        } else if (action === 'reject') {
          report.status = 'rejected';
          report.statusLabel = 'Rejected by Officer';
          report.officerNote = `Rejected: ${reason}${notes ? ` — ${notes}` : ''}`;
          auditText = `Rejected by ${actorLabel}. Reason: ${reason}`;
          citizenMsg = `Report closed: ${reason}`;
        } else if (action === 'request_info') {
          report.status = 'info_requested';
          report.statusLabel = 'Additional Information Requested';
          report.officerNote = infoRequest;
          auditText = `Requested additional info: ${infoRequest}`;
          citizenMsg = `Officer requested additional info: ${infoRequest}`;
        } else if (action === 'authorize') {
          report.status = 'operation_authorized';
          report.statusLabel = 'Verified — Operation Authorized';
          report.authorizedUnit = unit;
          report.officerNote = notes || `Authorized operation assigned to ${unit}.`;
          auditText = `Authorized operation via ${unit}. ${notes || ''}`.trim();
          citizenMsg = `Authorized team assigned: ${unit}`;

          const opRef = `OP-RV-${now.slice(0, 10).replaceAll('-', '')}-${crypto
            .randomBytes(2)
            .toString('hex')
            .toUpperCase()}`;
          db.rescueOperations.unshift({
            operation_ref: opRef,
            sos_ref: report.reference,
            location: report.locationText,
            team: unit,
            department: req.user.agency || 'Authorized Agency',
            authorized_by: actorLabel,
            authorized_at: now,
            started_at: now,
            completed_at: null,
            status: 'ongoing',
            outcome:
              notes ||
              'Operation authorized by officer in ResQVision. Real-world field dispatch confirmation requires external CAD/agency integration.',
            real_world_dispatch_confirmed: false,
            evidence: [],
            is_demo: false
          });
        }

        report.reviewedBy = actorLabel;
        report.reviewedAt = now;
        report.auditTrail.push({
          at: now,
          actor: actorLabel,
          action: auditText
        });

        if (citizenMsg) {
          db.notifications.unshift({
            id: `CNOT-${crypto.randomUUID().slice(0, 8)}`,
            targetRole: 'citizen',
            targetUserId: report.citizenUserId,
            title: `${report.reference} status updated`,
            detail: citizenMsg,
            reference: report.reference,
            at: now,
            readBy: []
          });
        }

        return { report };
      });

      if (outcome.notFound) {
        return res.status(404).json({ error: 'SOS report not found.' });
      }
      return res.json({ report: sanitizeGovernmentReportView(outcome.report) });
    }
  );

  // Rescue Operations & Evidence
  app.get(
    '/api/v1/government/operations',
    authenticate,
    requireRole('government'),
    async (_req, res) => {
      const db = await store.read();
      const ops = db.rescueOperations.map(op => ({
        ...op,
        evidence: (op.evidence || []).map(ev => ({
          ...ev,
          url: ev.attachmentId ? `/api/v1/attachments/${ev.attachmentId}` : ev.url
        }))
      }));
      const summary = ops.reduce(
        (acc, op) => {
          acc.total += 1;
          if (op.status === 'successful') acc.successful += 1;
          else if (op.status === 'ongoing') acc.ongoing += 1;
          else if (op.status === 'unsuccessful') acc.unsuccessful += 1;
          return acc;
        },
        { total: 0, successful: 0, ongoing: 0, unsuccessful: 0 }
      );
      res.json({ operations: ops, summary });
    }
  );

  app.post(
    '/api/v1/government/operations/:operationRef/update',
    authenticate,
    requireRole('government'),
    upload.array('evidence', CONFIG.maxUploadCount),
    async (req, res) => {
      const status = String(req.body?.status || '').trim();
      const outcomeText = String(req.body?.outcome || '').trim();
      const caption = String(req.body?.caption || '').trim();

      if (status && !['ongoing', 'successful', 'unsuccessful'].includes(status)) {
        return res.status(400).json({ error: 'Invalid operation status.' });
      }

      const files = Array.isArray(req.files) ? req.files : [];
      const validatedEvidenceFiles = [];
      for (const file of files) {
        const verifiedMime = detectImageMimeByMagicBytes(file.buffer);
        if (!verifiedMime) {
          return res.status(400).json({
            error: `Invalid evidence image "${file.originalname}". Only JPEG, PNG, or WebP supported.`
          });
        }
        validatedEvidenceFiles.push({
          originalName: path.basename(file.originalname || 'evidence.jpg'),
          mime: verifiedMime,
          size: file.size,
          buffer: file.buffer
        });
      }

      await fs.mkdir(uploadDir, { recursive: true });
      const savedAttachments = [];
      for (const item of validatedEvidenceFiles) {
        const attachmentId = `ATT-EVD-${crypto.randomUUID()}`;
        const ext = SAFE_IMAGE_EXT[item.mime] || '.bin';
        const storedFilename = `${attachmentId}${ext}`;
        await fs.writeFile(path.join(uploadDir, storedFilename), item.buffer);
        savedAttachments.push({
          id: attachmentId,
          citizenUserId: req.user.id,
          name: item.originalName,
          caption: caption || item.originalName,
          mimeType: item.mime,
          sizeBytes: item.size,
          storedFilename,
          uploadedAt: new Date().toISOString()
        });
      }

      const now = new Date().toISOString();
      const updated = await store.mutate(db => {
        const op = db.rescueOperations.find(o => o.operation_ref === req.params.operationRef);
        if (!op) return { notFound: true };

        if (status) {
          op.status = status;
          if (status === 'successful' || status === 'unsuccessful') {
            op.completed_at = op.completed_at || now;
          }
        }
        if (outcomeText) op.outcome = outcomeText;

        savedAttachments.forEach(att => {
          db.attachments.push(att);
          op.evidence.push({
            id: att.id,
            attachmentId: att.id,
            caption: att.caption,
            captured_at: now,
            uploaded_by: `${req.user.name} (${req.user.agency || 'Officer'})`
          });
        });

        // Propagate permitted status update to citizen report if linked
        if (op.sos_ref && status) {
          const linkedReport = db.sosReports.find(r => r.reference === op.sos_ref);
          if (linkedReport) {
            linkedReport.statusLabel = `Operation ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            linkedReport.officerNote = outcomeText || linkedReport.officerNote;
            db.notifications.unshift({
              id: `CNOT-${crypto.randomUUID().slice(0, 8)}`,
              targetRole: 'citizen',
              targetUserId: linkedReport.citizenUserId,
              title: `${linkedReport.reference} operation status: ${status}`,
              detail: outcomeText || `Rescue operation ${op.operation_ref} updated to ${status}.`,
              reference: linkedReport.reference,
              at: now,
              readBy: []
            });
          }
        }

        return { op };
      });

      if (updated.notFound) {
        return res.status(404).json({ error: 'Operation record not found.' });
      }
      return res.json({
        operation: {
          ...updated.op,
          evidence: (updated.op.evidence || []).map(ev => ({
            ...ev,
            url: ev.attachmentId ? `/api/v1/attachments/${ev.attachmentId}` : ev.url
          }))
        }
      });
    }
  );

  // Separate Casualty Figures Endpoint
  app.get(
    '/api/v1/government/casualties',
    authenticate,
    requireRole('government'),
    async (_req, res) => {
      const db = await store.read();
      res.json({ casualtyRecord: db.casualtyRecord });
    }
  );

  app.post(
    '/api/v1/government/casualties',
    authenticate,
    requireRole('government'),
    async (req, res) => {
      const count = req.body?.recorded_casualties_or_deaths;
      const verificationStatus = String(req.body?.verification_status || '').trim();
      const source = String(req.body?.source || '').trim();

      if (count != null && (!Number.isInteger(Number(count)) || Number(count) < 0)) {
        return res.status(400).json({ error: 'Casualty count must be a non-negative integer.' });
      }
      if (!['unverified_field_report', 'authority_verified'].includes(verificationStatus)) {
        return res.status(400).json({
          error: 'verification_status must be "unverified_field_report" or "authority_verified".'
        });
      }
      if (!source) {
        return res.status(400).json({ error: 'Casualty source attribution is required.' });
      }

      const now = new Date().toISOString();
      const updated = await store.mutate(db => {
        db.casualtyRecord = {
          recorded_casualties_or_deaths: count == null ? null : Number(count),
          verification_status: verificationStatus,
          source,
          updated_by: `${req.user.name} (${req.user.agency || 'Officer'})`,
          updated_at: now
        };
        return db.casualtyRecord;
      });

      return res.json({ casualtyRecord: updated });
    }
  );

  // Geospatial Resource & Evacuation Route Boundary
  app.get('/api/v1/resources', (_req, res) => {
    res.json({
      connected: Boolean(CONFIG.geospatialFeedUrl),
      resources: null,
      verified_evacuation_routes: [],
      rescue_units: [],
      message:
        'Authoritative external geospatial feeds (hospitals, shelters, food, water, road closures, verified evacuation routes) are not connected.'
    });
  });

  // Multer & global JSON error handler
  app.use((err, _req, res, _next) => {
    console.error('Unhandled route error:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Uploaded photograph exceeds 5 MB limit.' });
      }
      return res.status(400).json({ error: `Upload validation failed: ${err.message}` });
    }
    return res.status(500).json({ error: err?.message || 'Internal server error.' });
  });

  return app;
}
