import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dns from 'node:dns';

// Fix pentru Node 18+ și probleme de DNS (IPv6 vs IPv4)
if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://yjquviufzsfpqqcezbny.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcXV2aXVmenNmcHFxY2V6Ym55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2OTA5MiwiZXhwIjoyMDg4NzQ1MDkyfQ.OP9sbsuhed6KUk8dwFSCcnC8Mm-xF3TBU5HXw9BFthk';

let _client = null;

export function getDB() {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: (...args) => fetch(...args),
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _client;
}

export default getDB;
