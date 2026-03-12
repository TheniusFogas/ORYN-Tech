import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let _client = null;

export function getDB() {
  if (!_client) {
    const url = supabaseUrl || 'https://yjquviufzsfpqqcezbny.supabase.co';
    const key = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcXV2aXVmenNmcHFxY2V6Ym55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2OTA5MiwiZXhwIjoyMDg4NzQ1MDkyfQ.OP9sbsuhed6KUk8dwFSCcnC8Mm-xF3TBU5HXw9BFthk';

    if (!url || !key) {
      throw new Error('Supabase URL and Key are required');
    }
    _client = createClient(url, key);
  }
  return _client;
}

export default getDB;
