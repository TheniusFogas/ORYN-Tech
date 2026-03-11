import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let _client = null;

export function getDB() {
  if (!_client) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    _client = createClient(supabaseUrl, supabaseKey);
  }
  return _client;
}

export default getDB;
