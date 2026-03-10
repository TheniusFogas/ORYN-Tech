// api/auth/register.js
// ─────────────────────────────────────────────────────────
// POST /api/auth/register
// Creare cont admin NOU — protejat cu ADMIN_SETUP_KEY
// Body: { setupKey, email, password, name }
//
// Folosești asta O SINGURĂ DATĂ pentru primul cont.
// Apoi din admin poți adăuga alți useri.
// ─────────────────────────────────────────────────────────

import { getDB }                        from '../../lib/db.js';
import { hashPassword, signToken,
         setCors, handleOptions }        from '../../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { setupKey, email, password, name } = req.body || {};

  // ── Verifică cheia de setup ────────────────────────────
  if (setupKey !== process.env.ADMIN_SETUP_KEY) {
    return res.status(403).json({ error: 'Setup key invalid' });
  }

  // ── Validare ───────────────────────────────────────────
  if (!email || !password) {
    return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Parola trebuie să aibă minim 8 caractere' });
  }

  const emailClean = email.trim().toLowerCase();

  try {
    const db = getDB();

    // ── Verifică dacă emailul există deja ─────────────
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', emailClean)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email deja înregistrat' });
    }

    // ── Hash parolă și creează userul ─────────────────
    const password_hash = await hashPassword(password);

    const { data: user, error } = await db
      .from('users')
      .insert({
        email: emailClean,
        password_hash,
        name:  name || emailClean.split('@')[0],
        role:  'superadmin',
      })
      .select('id, email, name, role')
      .single();

    if (error) throw error;

    // ── Returnează token direct (auto-login) ──────────
    const token = signToken({
      userId: user.id,
      email:  user.email,
      role:   user.role,
    });

    return res.status(201).json({
      message: 'Cont creat cu succes',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

  } catch (err) {
    console.error('[register] Error:', err);
    return res.status(500).json({ error: 'Eroare internă: ' + err.message });
  }
}
