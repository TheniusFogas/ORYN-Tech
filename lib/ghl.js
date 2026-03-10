// lib/ghl.js
// ─────────────────────────────────────────────────────────
// Trimite lead-uri către GoHighLevel webhook
// ─────────────────────────────────────────────────────────

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL;

/**
 * Trimite datele unui lead la GHL webhook
 * @param {Object} lead - datele din formular
 * @returns {{ success: boolean, status?: number, error?: string }}
 */
export async function sendToGHL(lead) {
  if (!GHL_WEBHOOK_URL) {
    console.warn('[GHL] GHL_WEBHOOK_URL not set — skipping');
    return { success: false, error: 'GHL_WEBHOOK_URL not configured' };
  }

  // Mapează câmpurile din formular la formatul așteptat de GHL
  const payload = {
    firstName:   lead.firstname  || '',
    lastName:    lead.lastname   || '',
    email:       lead.email      || '',
    phone:       lead.phone      || '',
    // Custom fields GHL — ajustează key-urile după cum ai setat în GHL
    customField: {
      business:    lead.business    || '',
      niche:       lead.niche       || '',
      leads_month: lead.leads_month || '',
      problem:     lead.problem     || '',
      source:      lead.source_page || 'trial',
    },
    tags:   ['oryntech-trial', lead.niche || 'general'],
    source: 'ORYNTech Website',
  };

  try {
    const response = await fetch(GHL_WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[GHL] Webhook error:', response.status, body);
      return { success: false, status: response.status, error: body };
    }

    return { success: true, status: response.status };
  } catch (err) {
    console.error('[GHL] Fetch error:', err.message);
    return { success: false, error: err.message };
  }
}
