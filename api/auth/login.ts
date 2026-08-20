// ==========================================================================
// POST /api/auth/login
// Serverless Endpoint for Staff / Owner PIN Authentication
// ==========================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyTenantPinServer, signSessionToken } from '../_lib/authUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow only POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Método no permitido. Utilice POST.' });
  }

  try {
    const { businessId, pin, targetRole } = req.body || {};

    if (!businessId || typeof businessId !== 'string') {
      return res.status(400).json({ success: false, error: 'businessId es requerido y debe ser válido.' });
    }

    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ success: false, error: 'PIN es requerido.' });
    }

    const role = targetRole === 'barber' ? 'barber' : 'owner';

    // Verify PIN cryptographic hash server-side
    const isValid = verifyTenantPinServer(businessId, pin);

    if (!isValid) {
      // Artificial delay to prevent brute-force attacks
      await new Promise(r => setTimeout(r, 400));
      return res.status(401).json({
        success: false,
        error: 'PIN de seguridad inválido para este establecimiento.'
      });
    }

    // Resolve user details
    const userId = role === 'owner' ? `owner_${businessId}` : `barber_${businessId}`;
    const fullName = businessId === 'biz_arizshop_01'
      ? (role === 'owner' ? 'Álvaro Ortiz' : 'Daniel Sánchez')
      : (role === 'owner' ? 'Propietario' : 'Barbero Colaborador');

    // Issue cryptographically signed token
    const token = signSessionToken({
      userId,
      fullName,
      role,
      businessId
    });

    // Set secure cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `barberia_session=${token}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=86400',
      isProd ? 'Secure' : ''
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    // -----------------------------------------------------------------------
    // AUTH BRIDGE: Generate Supabase JWT with business_id and role claims
    // This token is used by the Supabase client for RLS policy evaluation.
    // Signed with SUPABASE_JWT_SECRET — NEVER exposed to frontend bundle.
    // -----------------------------------------------------------------------
    let supabaseToken: string | null = null;
    const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
    if (SUPABASE_JWT_SECRET) {
      try {
        const crypto = await import('crypto');
        const now = Math.floor(Date.now() / 1000);
        const supabasePayload = {
          iss: 'supabase',
          ref: 'barberia-pro-prod',
          role: 'authenticated',
          // Custom claims read by RLS policies via request.jwt.claims
          business_id: businessId,
          user_role: role,
          user_id: userId,
          iat: now,
          exp: now + 86400, // 24 hours
        };
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const body = Buffer.from(JSON.stringify(supabasePayload)).toString('base64url');
        const sig = crypto.default
          .createHmac('sha256', SUPABASE_JWT_SECRET)
          .update(`${header}.${body}`)
          .digest('base64url');
        supabaseToken = `${header}.${body}.${sig}`;
      } catch (e) {
        console.warn('[Auth Bridge] Failed to sign Supabase JWT:', e);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa y sesión emitida por el servidor.',
      session: {
        token,
        supabaseToken,
        user: {
          id: userId,
          fullName,
          role,
          businessId
        },
        expiresInSeconds: 86400
      }
    });
  } catch (error: any) {
    console.error('[API Auth Login Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor durante la autenticación.'
    });
  }
}
