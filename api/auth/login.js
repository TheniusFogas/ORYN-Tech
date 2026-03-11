// api/auth/login.js
// ─────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// Returns: { token, user: { id, email, name, role } }
// ─────────────────────────────────────────────────────────

import { getDB }                        from '../../lib/db.js';
import { verifyPassword, signToken,
         setCors, handleOptions }        from '../../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};

  // ── Validare input ─────────────────────────────────────
  if (!email || !password) {
    return res.status(400).json({ error: 'Email și parola sunt obligatorii' });
  }

  const emailClean = email.trim().toLowerCase();

  try {
    const db = getDB();
    
    // DEBUG — Foolproof environment check
    const url = process.env.SUPABASE_URL || 'https://yjquviufzsfpqqcezbny.supabase.co'; // Hardcoded fallback for emergency
    const key = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcXV2aXVmenNmcHFxY2V6Ym55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2OTA5MiwiZXhwIjoyMDg4NzQ1MDkyfQ.OP9sbsuhed6KUk8dwFSCcnC8Mm-xF3TBU5HXw9BFthk';

    // ── Caută userul în DB ─────────────────────────────
    // Folosim o încercare directă cu fetch dacă Supabase client eșuează
    let user = null;
    let error = null;

    try {
      const { data, error: dbErr } = await db
        .from('users')
        .select('id, email, name, role, password_hash')
        .eq('email', emailClean)
        .single();
      user = data;
      error = dbErr;
    } catch (e) {
      error = { message: 'Supabase Client Crash: ' + e.message };
    }

    if (error || !user) {
      return res.status(401).json({ 
        error: `Login Fail: ${error ? error.message : 'User inexistent'}. [E:${emailClean}] [U:${url.slice(0,25)}...]` 
      });
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: 'Contul folosește login cu Google' });
    }

    // ── Verifică parola ────────────────────────────────
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Parolă greșită pentru acest user' });
    }

    // ── Generează JWT ──────────────────────────────────
    const token = signToken({
      userId: user.id,
      email:  user.email,
      role:   user.role,
    });

    // ── Update last_login ──────────────────────────────
    await db
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return res.status(200).json({
      token,
      user: {
        id:    user.id,
        email: user.email,
        name:  user.name,
        role:  user.role,
      },
    });

  } catch (err) {
    console.error('[login] Error:', err);
    return res.status(500).json({ error: 'Eroare internă' });
  }
}
