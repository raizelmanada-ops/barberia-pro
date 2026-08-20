// ==========================================================================
// POST /api/auth/update-pin
// Serverless Endpoint for Secure Server-Side PIN Update (Owner Only)
// ==========================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySessionToken, updateTenantPinServer } from '../_lib/authUtils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Método no permitido. Utilice POST.' });
  }

  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.barberia_session) {
      token = req.cookies.barberia_session;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    const session = verifySessionToken(token);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Sesión no autenticada.' });
    }

    if (session.role !== 'owner') {
      return res.status(403).json({
        success: false,
        error: 'Permiso denegado. Solo el Propietario (Owner) puede modificar el PIN de seguridad.'
      });
    }

    const { newPin } = req.body || {};
    if (!newPin || typeof newPin !== 'string' || newPin.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: 'El nuevo PIN debe tener al menos 4 dígitos numéricos.'
      });
    }

    // Update PIN hash server-side for the tenant
    updateTenantPinServer(session.businessId, newPin.trim());

    return res.status(200).json({
      success: true,
      message: 'PIN de seguridad actualizado y hasheado criptográficamente en el servidor.'
    });
  } catch (error: any) {
    console.error('[API Auth Update-Pin Error]', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar el PIN de seguridad.'
    });
  }
}
