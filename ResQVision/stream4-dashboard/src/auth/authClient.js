/**
 * Authentication Client Boundary
 * ResQVision Command & Citizen Safety Portal
 * 
 * Supports AEGIS role-based access:
 * - Citizen Portal (Safety alerts, SOS emergency requests, shelter routing)
 * - Rescue Team Console (Tactical telemetry, disaster dispatch, drone feeds)
 */

const SESSION_STORAGE_KEY = 'resqvision_active_session';

export function isRealAuthConfigured() {
  return false;
}

export function canUseDemoAuth() {
  return true;
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    return null;
  }
}

export function loginWithCredentials({
  name = 'Ravi Das',
  email = 'ravi.das@email.com',
  role = 'citizen', // 'citizen' or 'rescue'
  location = 'Golaghat (Critical • 26.40°N, 94.03°E)',
  isGoogle = false,
} = {}) {
  const session = {
    username: email.split('@')[0] || 'user',
    displayName: name || (role === 'citizen' ? 'Ravi Das' : 'Officer In-Charge'),
    email: email,
    role: role, // 'citizen' or 'rescue'
    location: location,
    isGoogle: !!isGoogle,
    isDemo: true,
    loginTime: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

export function switchRole(newRole) {
  const current = getStoredSession();
  if (!current) return null;
  const updated = {
    ...current,
    role: newRole,
  };
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function loginWithDemo() {
  return loginWithCredentials({
    name: 'Ravi Das',
    email: 'ravi.das@email.com',
    role: 'citizen',
    location: 'Golaghat (Critical • 26.40°N, 94.03°E)',
  });
}

export function logout() {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
