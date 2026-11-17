import crypto from 'node:crypto';
import { CONFIG } from './config.js';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(keyHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function base64UrlEncode(input) {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signSessionToken(user) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'RVT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      agency: user.agency || null,
      iat: Date.now(),
      exp: Date.now() + CONFIG.tokenTtlMs
    })
  );
  const signature = crypto
    .createHmac('sha256', CONFIG.sessionSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', CONFIG.sessionSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const data = JSON.parse(base64UrlDecode(payload));
    if (!data.exp || Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const session = verifySessionToken(token);
  if (!session) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to the appropriate portal.'
    });
  }
  req.user = {
    id: session.sub,
    role: session.role,
    name: session.name,
    email: session.email,
    agency: session.agency
  };
  return next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        error: `Forbidden: ${role} portal permissions required.`
      });
    }
    return next();
  };
}

export async function authenticateWithSupabase(email, password) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return null;
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      role: data.user.user_metadata?.role,
      agency: data.user.user_metadata?.agency || null
    };
  } catch (err) {
    return null;
  }
}

export async function registerWithSupabase(name, email, password, role = 'citizen', agency = null) {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return null;
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.supabaseKey,
        'Authorization': `Bearer ${CONFIG.supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, agency }
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
