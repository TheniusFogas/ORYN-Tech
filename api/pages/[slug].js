// api/pages/[slug].js
// ─────────────────────────────────────────────────────────
// GET  /api/pages/:slug  → returnează conținutul paginii
// PUT  /api/pages/:slug  → salvează conținutul (auth required)
// ─────────────────────────────────────────────────────────

import { getDB }                          from '../../lib/db.js';
import { requireAuth, setCors,
         handleOptions }                  from '../../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'Slug lipsă' });
  }

  const db = getDB();

  // ── GET: citește pagina (public) ───────────────────────
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('pages')
      .select('slug, title, content, meta_title, meta_desc, nav_location, updated_at')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Pagina nu există' });
    }

    return res.status(200).json(data);
  }

  // ── PUT: salvează pagina (admin only) ─────────────────
  if (req.method === 'PUT') {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { title, content, meta_title, meta_desc, nav_location } = req.body || {};

    const updateData = {
      updated_by: user.id,
    };

    if (title       !== undefined) updateData.title        = title;
    if (content     !== undefined) updateData.content      = content;
    if (meta_title  !== undefined) updateData.meta_title   = meta_title;
    if (meta_desc   !== undefined) updateData.meta_desc    = meta_desc;
    if (nav_location !== undefined) updateData.nav_location = nav_location;

    const { data, error } = await db
      .from('pages')
      .update(updateData)
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('[pages PUT] Error:', error);
      return res.status(500).json({ error: 'Eroare la salvare' });
    }

    return res.status(200).json({ success: true, page: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
