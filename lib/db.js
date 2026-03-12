import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let _client = null;

export function getDB() {
  if (!_client) {
    const rawUrl = (process.env.SUPABASE_URL || '').trim();
    const rawKey = (process.env.SUPABASE_SERVICE_KEY || '').trim();

    // FORCE FALLBACK: Se pare că URL-ul din Vercel dă "fetch failed"
    // Preferăm adresa hardcodată care știm că e bună pentru proiectul ai.oryn.one
    const url = 'https://yjquviufzsfpqqcezbny.supabase.co';
    const key = (rawKey.length > 50) 
      ? rawKey 
      : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcXV2aXVmenNmcHFxY2V6Ym55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2OTA5MiwiZXhwIjoyMDg4NzQ1MDkyfQ.OP9sbsuhed6KUk8dwFSCcnC8Mm-xF3TBU5HXw9BFthk';

    console.log('[DB] Connecting to:', url);
    _client = createClient(url, key);
  }
  return _client;
}

export default getDB;
