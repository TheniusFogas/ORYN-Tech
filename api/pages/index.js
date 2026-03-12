// api/pages/index.js
// ─────────────────────────────────────────────────────────
// GET  /api/pages       → lista tuturor paginilor (auth)
// POST /api/pages       → creează pagină nouă (auth)
// ─────────────────────────────────────────────────────────

import { getDB }                          from '../../lib/db.js';
import { requireAuth, setCors,
         handleOptions }                  from '../../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const db   = getDB();
    const user = await requireAuth(req, res);
    if (!user) return;

    // ── GET: lista pagini ──────────────────────────────────
    if (req.method === 'GET') {
      const { data, error } = await db
        .from('pages')
        .select('id, slug, title, nav_location, nav_order, is_published, updated_at')
        .order('nav_order', { ascending: true });

      if (error) return res.status(500).json({ error: 'Eroare DB: ' + error.message });
      return res.status(200).json(data);
    }

    // ── POST: pagină nouă ──────────────────────────────────
    if (req.method === 'POST') {
      const { slug, title, nav_location = 'none', nav_order = 99 } = req.body || {};

      if (!slug || !title) {
        return res.status(400).json({ error: 'slug și title sunt obligatorii' });
      }

      // Slug: doar litere mici, cifre, liniuțe
      const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const { data, error } = await db
        .from('pages')
        .insert({
          slug:         slugClean,
          title,
          nav_location,
          nav_order,
          content:      {},
          updated_by:   user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // unique violation
          return res.status(409).json({ error: 'Slug-ul există deja' });
        }
        return res.status(500).json({ error: 'Eroare la creare: ' + error.message });
      }

      return res.status(201).json({ success: true, page: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[API Pages] Global Error:', err);
    return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
}
