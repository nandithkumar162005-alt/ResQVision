/**
 * API Client for Stream 3 Service Integration
 * ResQVision Command Dashboard
 *
 * Implements strict error handling, timeout/abort support,
 * defensive normalization, and enforces separation between Mock Mode and Real API.
 */

import { normalizeActiveDisasters, normalizeDispatchLog } from '../utils/normalizeData';
import { MOCK_ACTIVE_DISASTERS, MOCK_DISPATCH_LOGS } from './mockData';

// Helper to sanitize base URL
export function getBaseUrl() {
  const envUrl = import.meta.env.VITE_STREAM3_BASE_URL || 'http://localhost:8003';
  return envUrl.replace(/\/+$/, '');
}

export function isMockMode() {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true';
}

// Development helper to toggle empty mock fixture for testing calm state
export function isZeroIncidentMockActive() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem('resqvision_zero_incident_mock') === 'true';
}

export function setZeroIncidentMockActive(active) {
  if (typeof window === 'undefined') return;
  if (active) {
    window.sessionStorage.setItem('resqvision_zero_incident_mock', 'true');
  } else {
    window.sessionStorage.removeItem('resqvision_zero_incident_mock');
  }
}

/**
 * Custom error class for API failures
 */
export class ApiError extends Error {
  constructor(message, { status = null, code = 'API_ERROR', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Base fetch wrapper with timeout and error classification
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const signal = options.signal || controller.signal;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (e) {
        // ignore parse error
      }
      throw new ApiError(`Stream 3 request failed with HTTP ${response.status}`, {
        status: response.status,
        code: 'HTTP_ERROR',
        details: errorBody,
      });
    }

    try {
      const data = await response.json();
      return data;
    } catch (parseErr) {
      throw new ApiError('Stream 3 returned malformed non-JSON response', {
        status: response.status,
        code: 'MALFORMED_JSON',
        details: parseErr.message,
      });
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(`Request to Stream 3 timed out after ${timeoutMs}ms`, {
        code: 'TIMEOUT',
      });
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(`Network failure communicating with Stream 3: ${err.message}`, {
      code: 'NETWORK_FAILURE',
      details: err.message,
    });
  }
}

/**
 * Endpoint A — Fetch Active Disasters
 * GET {VITE_STREAM3_BASE_URL}/api/active-disasters
 */
export async function getActiveDisasters({ signal } = {}) {
  if (isMockMode()) {
    // Artificial slight latency for realistic UI state handling
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (isZeroIncidentMockActive()) {
      return normalizeActiveDisasters([]);
    }

    return normalizeActiveDisasters(MOCK_ACTIVE_DISASTERS);
  }

  // Real Mode - STRICTLY calls Stream 3 API without silent mock fallback
  const baseUrl = getBaseUrl();
  const endpoint = `${baseUrl}/api/active-disasters`;

  const payload = await fetchWithTimeout(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  return normalizeActiveDisasters(payload);
}

/**
 * Endpoint B — Fetch Dispatch Log for an Event
 * GET {VITE_STREAM3_BASE_URL}/api/assessments/:event_id/dispatch-log
 */
export async function getDispatchLog(eventId, { signal } = {}) {
  if (!eventId) {
    return [];
  }

  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const mockLog = MOCK_DISPATCH_LOGS[eventId] || [];
    return normalizeDispatchLog(mockLog);
  }

  // Real Mode
  const baseUrl = getBaseUrl();
  const encodedId = encodeURIComponent(eventId);
  const endpoint = `${baseUrl}/api/assessments/${encodedId}/dispatch-log`;

  const payload = await fetchWithTimeout(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  });

  return normalizeDispatchLog(payload);
}
