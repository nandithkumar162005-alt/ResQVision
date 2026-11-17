import {
  DEMO_ACTIVE_DISASTERS,
  DEMO_CASUALTY_RECORD,
  DEMO_DISPATCH_LOGS,
  DEMO_RESCUE_UNITS,
  DEMO_RESOURCES,
  DEMO_VERIFIED_EVACUATION_ROUTES,
  INITIAL_DEMO_RESCUE_OPERATIONS,
  INITIAL_DEMO_SOS_REPORTS
} from '../data/mockData.js';

export const USE_MOCK_DATA = import.meta.env?.VITE_USE_MOCK_DATA === 'true';

const LAYER3_BASE = (import.meta.env?.VITE_LAYER3_API_URL || '').replace(/\/+$/, '');
const STREAM3_BASE = (import.meta.env?.VITE_STREAM3_BASE_URL || '').replace(/\/+$/, '');

export function resolveUrl(path) {
  if (typeof path !== 'string' || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (path.startsWith('/api/v1') && LAYER3_BASE) {
    return `${LAYER3_BASE}${path}`;
  }
  if (path.startsWith('/api/') && STREAM3_BASE) {
    return `${STREAM3_BASE}${path}`;
  }
  return path;
}

/**
 * Confirmed Stream 3 read endpoints identified in the project brief.
 */
export const ENDPOINTS = {
  activeDisasters: import.meta.env?.VITE_ACTIVE_DISASTERS_PATH || '/api/active-disasters',
  dispatchLog: import.meta.env?.VITE_DISPATCH_LOG_PATH || '/api/assessments/:event_id/dispatch-log'
};

export const VALID_DISPATCH_STATUSES = [
  'received',
  'ndrf_notified',
  'ndrf_confirmed',
  'ndrf_denied',
  'fully_dispatched'
];

export const VALID_DAMAGE_CLASSIFICATIONS = ['destroyed', 'major_damage'];

async function fetchJsonStrict(url, options = {}) {
  const targetUrl = resolveUrl(url);
  let response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {})
      }
    });
  } catch (err) {
    throw new Error(`Unable to reach backend (${targetUrl}): ${err.message || 'Network error'}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!response.ok) {
    if (response.status === 404 && targetUrl.includes('/api/v1/') && !LAYER3_BASE) {
      throw new Error(
        'Backend service not connected (HTTP 404). Please set VITE_LAYER3_API_URL in your Vercel Environment Variables pointing to your Render backend, or set VITE_USE_MOCK_DATA=true for demo mode.'
      );
    }
    if (isJson) {
      const errBody = await response.json().catch(() => null);
      throw new Error(errBody?.error || `Backend endpoint ${url} returned HTTP ${response.status}.`);
    }
    throw new Error(`Backend endpoint ${url} returned HTTP ${response.status}.`);
  }

  if (!isJson) {
    throw new Error(`Malformed non-JSON response from ${url} (Content-Type: ${contentType || 'unknown'}).`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error(`Invalid JSON body returned by ${url}.`);
  }
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeActiveDisasters(payload) {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Malformed /api/active-disasters payload: expected JSON object or array.');
  }
  if (!Array.isArray(payload) && payload.status && payload.status !== 'success') {
    throw new Error(`Unexpected API status "${payload.status}" from /api/active-disasters.`);
  }
  const list = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(list)) {
    throw new Error(
      'Malformed /api/active-disasters payload: expected array or { status: "success", data: [] }.'
    );
  }

  return list.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Malformed disaster item at index ${idx}.`);
    }
    const zones = Array.isArray(item.critical_zones)
      ? item.critical_zones.map((z, zIdx) => {
          const rawClass = z?.damage_classification;
          const damageClassification = VALID_DAMAGE_CLASSIFICATIONS.includes(rawClass)
            ? rawClass
            : null;
          return {
            ...z,
            zone_id: z?.zone_id || `Z-${idx}-${zIdx}`,
            lat: Number.isFinite(Number(z?.lat)) ? Number(z.lat) : null,
            lng: Number.isFinite(Number(z?.lng)) ? Number(z.lng) : null,
            damage_classification: damageClassification,
            raw_damage_classification: rawClass || null
          };
        })
      : [];

    const firstValidZone = zones.find(z => z.lat != null && z.lng != null);
    const lat = Number.isFinite(Number(item.lat))
      ? Number(item.lat)
      : firstValidZone?.lat ?? null;
    const lng = Number.isFinite(Number(item.lng))
      ? Number(item.lng)
      : firstValidZone?.lng ?? null;

    return {
      ...item,
      event_id: item.event_id ? String(item.event_id) : `UNKNOWN-EVT-${idx + 1}`,
      title:
        item.title ||
        [item.disaster_type || item.hazard_type, item.district || item.city || item.state]
          .filter(Boolean)
          .join(' — ') ||
        item.event_id ||
        `Incident ${idx + 1}`,
      disaster_type: item.disaster_type || item.hazard_type || 'Type not supplied',
      affected_population_estimate:
        item.affected_population_estimate != null &&
        Number.isFinite(Number(item.affected_population_estimate))
          ? Number(item.affected_population_estimate)
          : null,
      dispatch_status: item.dispatch_status || null,
      source: item.source || 'Stream 3 API (source field not supplied)',
      updated_at: item.updated_at || item.last_updated || null,
      lat,
      lng,
      critical_zones: zones,
      is_demo: Boolean(item.is_demo)
    };
  });
}

function normalizeDispatchLog(payload) {
  if (payload == null || typeof payload !== 'object') {
    throw new Error('Malformed dispatch-log payload.');
  }
  const rows = Array.isArray(payload) ? payload : payload.data;
  if (!Array.isArray(rows)) {
    throw new Error('Malformed dispatch-log payload: expected array of dispatch entries.');
  }
  return rows.map((row, idx) => ({
    wave_number: row?.wave_number ?? idx + 1,
    team_name: row?.team_name || 'Team name not supplied',
    status: row?.status || 'unknown',
    status_recognized: VALID_DISPATCH_STATUSES.includes(row?.status),
    message_content: row?.message_content || '',
    sent_at: row?.sent_at || null,
    is_demo: Boolean(row?.is_demo)
  }));
}

export async function fetchActiveDisasters() {
  if (USE_MOCK_DATA) {
    return {
      items: DEMO_ACTIVE_DISASTERS,
      isMock: true,
      fetchedAt: new Date().toISOString()
    };
  }
  const json = await fetchJsonStrict(ENDPOINTS.activeDisasters);
  return {
    items: normalizeActiveDisasters(json),
    isMock: false,
    fetchedAt: new Date().toISOString()
  };
}

export async function fetchDispatchLog(eventId) {
  if (!eventId) return { items: [], isMock: USE_MOCK_DATA };
  if (USE_MOCK_DATA) {
    return {
      items: DEMO_DISPATCH_LOGS[eventId] || [],
      isMock: true
    };
  }
  const url = ENDPOINTS.dispatchLog.replace(':event_id', encodeURIComponent(eventId));
  const json = await fetchJsonStrict(url);
  return {
    items: normalizeDispatchLog(json),
    isMock: false
  };
}

export async function fetchGeospatialResources() {
  if (USE_MOCK_DATA) {
    return {
      resources: DEMO_RESOURCES,
      verifiedRoutes: DEMO_VERIFIED_EVACUATION_ROUTES,
      rescueUnits: DEMO_RESCUE_UNITS,
      isMock: true
    };
  }
  try {
    const json = await fetchJsonStrict('/api/v1/resources');
    return {
      resources: json.resources || null,
      verifiedRoutes: json.verified_evacuation_routes || [],
      rescueUnits: json.rescue_units || [],
      isMock: false,
      unavailableReason: json.connected ? '' : json.message
    };
  } catch {
    return {
      resources: null,
      verifiedRoutes: [],
      rescueUnits: [],
      isMock: false,
      unavailableReason:
        'Resource/geospatial and evacuation route feeds are not connected. No unverified markers are displayed.'
    };
  }
}

export async function apiFetchResources() {
  const data = await fetchGeospatialResources();
  if (!data.resources && data.unavailableReason) {
    throw new Error(data.unavailableReason);
  }
  return data.resources || [];
}

export function getInitialLayer1Data() {
  if (!USE_MOCK_DATA) {
    return {
      sosReports: [],
      rescueOperations: [],
      casualtyRecord: null
    };
  }
  return {
    sosReports: INITIAL_DEMO_SOS_REPORTS,
    rescueOperations: INITIAL_DEMO_RESCUE_OPERATIONS,
    casualtyRecord: DEMO_CASUALTY_RECORD
  };
}

/* ==========================================================================
   Layer 3 Backend Service Calls (/api/v1/*)
   ========================================================================== */

export async function apiLoginCitizen({ email, password }) {
  if (USE_MOCK_DATA) {
    return {
      token: 'demo-citizen-session-token',
      user: {
        id: 'demo-citizen-id',
        email: email || 'citizen@resqvision.local',
        name: 'Demo Citizen',
        role: 'citizen'
      }
    };
  }
  return fetchJsonStrict('/api/v1/auth/citizen/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
}

export async function apiRegisterCitizen({ name, email, password }) {
  if (USE_MOCK_DATA) {
    return {
      token: 'demo-citizen-session-token',
      user: {
        id: 'demo-citizen-id',
        email: email || 'citizen@resqvision.local',
        name: name || 'Demo Citizen',
        role: 'citizen'
      }
    };
  }
  return fetchJsonStrict('/api/v1/auth/citizen/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
}

export async function apiLoginGovernment({ email, password, agency }) {
  if (USE_MOCK_DATA) {
    return {
      token: 'demo-government-session-token',
      user: {
        id: 'demo-officer-id',
        email: email || 'officer@ndrf.resqvision.local',
        name: 'NDRF Command Officer',
        role: 'government',
        agency: agency || 'NDRF / SDRF'
      }
    };
  }
  return fetchJsonStrict('/api/v1/auth/government/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, agency })
  });
}

export async function apiSubmitSos(payload, token) {
  if (USE_MOCK_DATA) {
    const reference = `SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      reference,
      status: 'pending_review',
      statusLabel: 'Pending Review',
      message: 'SOS submitted successfully (demo mode).'
    };
  }
  const form = new FormData();
  form.append('emergencyType', payload.emergencyType);
  form.append('locationText', payload.locationText);
  form.append('state', payload.state || '');
  form.append('district', payload.district || '');
  form.append('lat', String(payload.lat));
  form.append('lng', String(payload.lng));
  form.append('locationSource', payload.locationSource || 'manual');
  form.append('peopleCount', String(payload.peopleCount));
  form.append('description', payload.description);
  form.append('contactName', payload.contactName);
  form.append('contactPhone', payload.contactPhone);
  if (payload.idempotencyKey) {
    form.append('idempotencyKey', payload.idempotencyKey);
  }
  (payload.photos || []).forEach(photo => {
    if (photo.file instanceof File) {
      form.append('photos', photo.file, photo.file.name);
    }
  });

  return fetchJsonStrict('/api/v1/sos', {
    method: 'POST',
    headers: authHeaders(token),
    body: form
  });
}

export async function apiFetchCitizenSos(token) {
  if (USE_MOCK_DATA) {
    return { reports: INITIAL_DEMO_SOS_REPORTS };
  }
  return fetchJsonStrict('/api/v1/citizen/sos', {
    headers: authHeaders(token)
  });
}

export async function apiReplyCitizenSos(reference, replyText, token) {
  return fetchJsonStrict(`/api/v1/citizen/sos/${encodeURIComponent(reference)}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify({ replyText })
  });
}

export async function apiDownloadServerReceiptPdf(reference, token) {
  const targetUrl = resolveUrl(`/api/v1/citizen/sos/${encodeURIComponent(reference)}/receipt.pdf`);
  const response = await fetch(
    targetUrl,
    {
      headers: authHeaders(token)
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error || `Unable to download receipt (HTTP ${response.status}).`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${reference}-receipt.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function apiFetchCitizenNotifications(token) {
  return fetchJsonStrict('/api/v1/citizen/notifications', {
    headers: authHeaders(token)
  });
}

export async function apiMarkCitizenNotificationsRead(token) {
  return fetchJsonStrict('/api/v1/citizen/notifications/read', {
    method: 'POST',
    headers: authHeaders(token)
  });
}

export async function apiFetchGovernmentNotifications(token) {
  return fetchJsonStrict('/api/v1/government/notifications', {
    headers: authHeaders(token)
  });
}

export async function apiMarkGovernmentNotificationsRead(token) {
  return fetchJsonStrict('/api/v1/government/notifications/read', {
    method: 'POST',
    headers: authHeaders(token)
  });
}

export async function apiFetchGovernmentSos(token) {
  if (USE_MOCK_DATA) {
    return { reports: INITIAL_DEMO_SOS_REPORTS };
  }
  return fetchJsonStrict('/api/v1/government/sos', {
    headers: authHeaders(token)
  });
}

export async function apiReviewGovernmentSos(reference, body, token) {
  return fetchJsonStrict(`/api/v1/government/sos/${encodeURIComponent(reference)}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body)
  });
}

export async function apiFetchGovernmentOperations(token) {
  if (USE_MOCK_DATA) {
    return { operations: INITIAL_DEMO_RESCUE_OPERATIONS };
  }
  return fetchJsonStrict('/api/v1/government/operations', {
    headers: authHeaders(token)
  });
}

export async function apiUpdateGovernmentOperation(operationRef, payload, token) {
  const form = new FormData();
  if (payload.status) form.append('status', payload.status);
  if (payload.outcome) form.append('outcome', payload.outcome);
  if (payload.caption) form.append('caption', payload.caption);
  (payload.files || []).forEach(file => {
    if (file instanceof File) form.append('evidence', file, file.name);
  });

  return fetchJsonStrict(
    `/api/v1/government/operations/${encodeURIComponent(operationRef)}/update`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: form
    }
  );
}

export async function apiFetchGovernmentCasualties(token) {
  if (USE_MOCK_DATA) {
    return DEMO_CASUALTY_RECORD;
  }
  return fetchJsonStrict('/api/v1/government/casualties', {
    headers: authHeaders(token)
  });
}

export async function apiSaveGovernmentCasualties(body, token) {
  return fetchJsonStrict('/api/v1/government/casualties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
    body: JSON.stringify(body)
  });
}

/**
 * Image verification: sends the photo (and an optional claim) to the Layer 3 backend, which forwards it to
 * Stream 2. Returns { ...authenticity, context, summary }. Throws Error(message) with a plain-language reason.
 */
export async function apiVerifyImage(file, claim = {}) {
  const form = new FormData();
  form.append('file', file);
  for (const [k, v] of Object.entries(claim)) {
    if (v !== undefined && v !== null && String(v).trim() !== '') form.append(k, String(v).trim());
  }
  let res;
  try {
    res = await fetch(resolveUrl('/api/v1/verify-image'), { method: 'POST', body: form });
  } catch {
    throw new Error('Could not reach the ResQVision backend (port 8004). Is it running?');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Verification failed (${res.status}).`);
  return body.data;
}

/** NDRF ground verification: confirm or deny an assessment on Stream 3 (confirm releases waves 2 to 5). */
export async function apiVerifyAssessment(eventId, confirmed) {
  let res;
  try {
    res = await fetch(resolveUrl(`/api/assessments/${encodeURIComponent(eventId)}/verify`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ confirmed: Boolean(confirmed) })
    });
  } catch {
    throw new Error('Could not reach the dispatch service (Stream 3, port 8003).');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.detail === 'string' ? body.detail : `Request failed (${res.status}).`);
  return body;
}
