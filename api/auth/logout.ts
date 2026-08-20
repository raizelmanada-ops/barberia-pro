// ==========================================================================
// POST /api/auth/logout
// Serverless Endpoint for Session Revocation & Cookie Clearing
// ==========================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader(
    'Set-Cookie',
    'barberia_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  );
  return res.status(200).json({ success: true, message: 'Sesión cerrada exitosamente.' });
}
