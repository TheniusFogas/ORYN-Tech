// api/test-db.js
// Endpoint TEMPORAR de diagnosticare — DELETE AFTER USE
import { getDB } from '../lib/db.js';
import { setCors, handleOptions } from '../lib/auth.js';

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const results = {
    diagnostics: {
      timestamp: new Date().toISOString(),
      raw_url_exists: !!process.env.SUPABASE_URL,
      raw_url_valid: (process.env.SUPABASE_URL || '').startsWith('https://'),
      raw_key_exists: !!process.env.SUPABASE_SERVICE_KEY,
    },
    db: 'WAITING',
    error: null
  };

  try {
    const db = getDB();
    const { data, error } = await db.from('pages').select('slug').limit(1);
    
    if (error) {
      results.db = 'ERROR';
      results.error = error.message;
    } else {
      results.db = 'CONNECTED';
      results.data_sample = data;
    }
  } catch (err) {
    results.db = 'CRASH';
    results.error = err.message;
  }

  res.status(200).json(results);
}
