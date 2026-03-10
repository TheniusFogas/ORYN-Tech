// api/auth/verify.js
// ─────────────────────────────────────────────────────────
// GET /api/auth/verify
// Header: Authorization: Bearer <token>
// Returns: { valid: true, user } sau { valid: false }
//
// Folosit de admin frontend la fiecare load pentru a
// verifica dacă sesiunea e încă activă.
// ─────────────────────────────────────────────────────────

import { requireAuth, setCors, handleOptions } from '../../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return; // requireAuth a trimis deja răspunsul de eroare

  return res.status(200).json({ valid: true, user });
}
