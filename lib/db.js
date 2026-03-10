// lib/db.js
// ─────────────────────────────────────────────────────────
// Supabase client — folosit în toate API functions
// Folosim SERVICE_KEY (nu anon key) pentru bypass RLS
// ─────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = process.env.SUPABASE_URL;
const supabaseKey     = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
}

// Singleton — Vercel refolosește instanța între invocări (warm starts)
let _client = null;

export function getDB() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _client;
}

export default getDB;
