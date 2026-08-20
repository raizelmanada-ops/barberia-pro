// ==========================================================================
// POST /api/auth/verify-session
// Serverless Endpoint for Cryptographic Session Verification & Multi-Tenant Gate
// ==========================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySessionToken } from '../_lib/authUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ valid: false, error: 'Método no permitido.' });
  }

  try {
    // 1. Extract token from Authorization header or Cookie
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.barberia_session) {
      token = req.cookies.barberia_session;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (!token) {
      return res.status(401).json({
        valid: false,
        error: 'No se encontró token de sesión activo.'
      });
    }

    // 2. Cryptographic signature and expiration verification
    const session = verifySessionToken(token);
    if (!session) {
      return res.status(401).json({
        valid: false,
        error: 'Sesión inválida o expirada.'
      });
    }

    // 3. Multi-Tenant Authorization Check
    const targetBusinessId = req.query.targetBusinessId || (req.body && req.body.targetBusinessId);
    if (targetBusinessId && session.businessId !== targetBusinessId) {
      return res.status(403).json({
        valid: false,
        error: `[SECURITY VIOLATION] Intento de acceso no autorizado entre tenants (${session.businessId} intentó acceder a ${targetBusinessId}).`
      });
    }

    return res.status(200).json({
      valid: true,
      user: {
        id: session.userId,
        fullName: session.fullName,
        role: session.role,
        businessId: session.businessId,
        expiresAt: session.expiresAt
      }
    });
  } catch (error: any) {
    console.error('[API Auth Verify Error]', error);
    return res.status(500).json({
      valid: false,
      error: 'Error interno verificando la sesión.'
    });
  }
}
