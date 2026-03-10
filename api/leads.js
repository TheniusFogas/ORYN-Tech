// api/leads.js
// ─────────────────────────────────────────────────────────
// POST /api/leads
// Body: { firstname, lastname, email, phone, business,
//         niche, leads_month, problem }
//
// Flow:
//   1. Validare input
//   2. Salvare în Supabase (leads table)
//   3. Forward la GHL webhook
//   4. Răspuns JSON
// ─────────────────────────────────────────────────────────

import { getDB }                  from '../lib/db.js';
import { sendToGHL }              from '../lib/ghl.js';
import { setCors, handleOptions } from '../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstname, lastname, email, phone,
    business, niche, leads_month, problem,
  } = req.body || {};

  // ── Validare minimă ────────────────────────────────────
  if (!firstname || !email) {
    return res.status(400).json({ error: 'Prenume și email sunt obligatorii' });
  }

  // Validare email basic
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Email invalid' });
  }

  const leadData = {
    firstname:    firstname.trim(),
    lastname:     (lastname  || '').trim(),
    email:        email.trim().toLowerCase(),
    phone:        (phone     || '').trim(),
    business:     (business  || '').trim(),
    niche:        (niche     || '').trim(),
    leads_month:  (leads_month || '').trim(),
    problem:      (problem   || '').trim(),
    source_page:  'trial',
    ip_address:   req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
  };

  try {
    const db = getDB();

    // ── 1. Salvare în DB ───────────────────────────────
    const { data: savedLead, error: dbError } = await db
      .from('leads')
      .insert(leadData)
      .select('id')
      .single();

    if (dbError) {
      console.error('[leads] DB insert error:', dbError);
      // Nu blocăm — încercăm oricum GHL
    }

    // ── 2. Forward la GHL ──────────────────────────────
    const ghlResult = await sendToGHL(leadData);

    // ── 3. Update status GHL în DB ────────────────────
    if (savedLead?.id) {
      await db
        .from('leads')
        .update({
          ghl_sent:    ghlResult.success,
          ghl_sent_at: ghlResult.success ? new Date().toISOString() : null,
          ghl_error:   ghlResult.error   || null,
        })
        .eq('id', savedLead.id);
    }

    // ── 4. Răspuns succes (chiar dacă GHL a picat) ────
    return res.status(200).json({
      success: true,
      message: 'Cererea ta a fost înregistrată! Te contactăm în curând.',
      leadId:  savedLead?.id || null,
      ghlSent: ghlResult.success,
    });

  } catch (err) {
    console.error('[leads] Unexpected error:', err);
    return res.status(500).json({ error: 'Eroare internă. Încearcă din nou.' });
  }
}
