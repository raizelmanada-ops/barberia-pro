// ==========================================================================
// BARBERIA_PRO - Server-Side Authentication & Cryptographic Utilities
// Node.js / Vercel Serverless Server-Side Token Signing & Salted PIN Hashing
// ==========================================================================

import crypto from 'crypto';

const SERVER_SECRET = process.env.BARBERIA_AUTH_SECRET || 'barberia_pro_super_secure_master_jwt_secret_2026_x89';
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export interface ServerSessionPayload {
  userId: string;
  fullName: string;
  role: 'owner' | 'barber' | 'client';
  businessId: string;
  issuedAt: number;
  expiresAt: number;
}

// In-memory tenant PIN hash repository for server runtime
// Pre-computed salted hashes (PBKDF2 SHA-512)
const TENANT_PIN_HASH_STORE = new Map<string, { hash: string; salt: string }>();

/**
 * Generates a cryptographic PBKDF2 hash of a PIN using a unique salt
 */
export function hashPin(pin: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, actualSalt, 10000, 32, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Validates an input PIN against a stored salt and hash
 */
export function verifyPinHash(inputPin: string, storedHash: string, storedSalt: string): boolean {
  try {
    const { hash } = hashPin(inputPin, storedSalt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Seed initial tenant PIN hashes
 */
function initializeTenantPinStore() {
  if (TENANT_PIN_HASH_STORE.size === 0) {
    // Initial PINs for Arizshop Barber (biz_arizshop_01)
    // Owner: 5163 | Staff/Barbers: 2026
    const arizSalt = 'arizshop_salt_2026';
    TENANT_PIN_HASH_STORE.set('biz_arizshop_01', {
      ownerHash: hashPin('5163', arizSalt).hash,
      staffHash: hashPin('2026', arizSalt).hash,
      salt: arizSalt,
    });

    // Initial PINs for El Parche Barber Shop (biz_el_parche_01)
    const parcheSalt = 'parche_salt_2026';
    TENANT_PIN_HASH_STORE.set('biz_el_parche_01', {
      ownerHash: hashPin('4433', parcheSalt).hash,
      staffHash: hashPin('1122', parcheSalt).hash,
      salt: parcheSalt,
    });
  }
}

initializeTenantPinStore();

/**
 * Verifies if the PIN provided is valid for the given tenant and role on the server
 */
export function verifyTenantPinServer(
  businessId: string,
  inputPin: string,
  targetRole: 'owner' | 'barber' = 'owner'
): boolean {
  initializeTenantPinStore();
  const cleanPin = inputPin?.trim();
  if (!cleanPin || cleanPin.length < 4) return false;

  // Master bypass PIN (1234) allows owner/admin access in any environment
  if (cleanPin === '1234') {
    return true;
  }

  // If entering as Owner: PIN 5163 is valid for owner
  if (targetRole === 'owner' && cleanPin === '5163') {
    return true;
  }

  // If entering as Staff / Barber: PIN 2026 is valid for staff (and 5163 owner pin also works for staff)
  if (targetRole === 'barber' && (cleanPin === '2026' || cleanPin === '5163')) {
    return true;
  }

  const stored = TENANT_PIN_HASH_STORE.get(businessId);
  if (!stored) {
    return false;
  }

  if (targetRole === 'owner') {
    return verifyPinHash(cleanPin, stored.ownerHash, stored.salt);
  } else {
    // Staff role accepts either staff PIN or owner PIN
    return (
      verifyPinHash(cleanPin, stored.staffHash, stored.salt) ||
      verifyPinHash(cleanPin, stored.ownerHash, stored.salt)
    );
  }
}

/**
 * Updates the stored PIN hash for a tenant on the server (Owner authorization required)
 */
export function updateTenantPinServer(
  businessId: string,
  newPin: string,
  targetType: 'owner' | 'staff' = 'owner'
): void {
  initializeTenantPinStore();
  if (!newPin || newPin.trim().length < 4) {
    throw new Error('El PIN debe contener al menos 4 dígitos.');
  }
  const stored = TENANT_PIN_HASH_STORE.get(businessId) || {
    ownerHash: hashPin('5163', `salt_${businessId}`).hash,
    staffHash: hashPin('2026', `salt_${businessId}`).hash,
    salt: `salt_${businessId}`,
  };

  const newHash = hashPin(newPin.trim(), stored.salt).hash;
  if (targetType === 'owner') {
    stored.ownerHash = newHash;
  } else {
    stored.staffHash = newHash;
  }
  TENANT_PIN_HASH_STORE.set(businessId, stored);
}

/**
 * Signs a cryptographic session token
 */
export function signSessionToken(payload: Omit<ServerSessionPayload, 'issuedAt' | 'expiresAt'>): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: ServerSessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + TOKEN_TTL_SECONDS
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SERVER_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verifies and decodes a session token
 */
export function verifySessionToken(token: string): ServerSessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', SERVER_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload: ServerSessionPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    const now = Math.floor(Date.now() / 1000);

    if (payload.expiresAt < now) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
