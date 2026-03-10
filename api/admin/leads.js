// api/admin/leads.js
// ─────────────────────────────────────────────────────────
// GET /api/admin/leads   → lista lead-uri (auth required)
// Suportă: ?page=1&limit=20&search=email
// ─────────────────────────────────────────────────────────

import { getDB }                          from '../../lib/db.js';
import { requireAuth, setCors,
         handleOptions }                  from '../../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await requireAuth(req, res);
  if (!user) return;

  const db      = getDB();
  const page    = parseInt(req.query.page  || '1');
  const limit   = parseInt(req.query.limit || '20');
  const search  = req.query.search || '';
  const offset  = (page - 1) * limit;

  try {
    let query = db
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `email.ilike.%${search}%,firstname.ilike.%${search}%,lastname.ilike.%${search}%,business.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({
      leads: data,
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    });

  } catch (err) {
    console.error('[admin/leads] Error:', err);
    return res.status(500).json({ error: 'Eroare DB' });
  }
}
