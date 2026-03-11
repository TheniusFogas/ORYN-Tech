// api/test-db.js
// Endpoint TEMPORAR de diagnosticare — DELETE AFTER USE
export default async function handler(req, res) {
  const results = {
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || 'MISSING',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 'PRESENT' : 'MISSING',
      JWT_SECRET: process.env.JWT_SECRET ? 'PRESENT' : 'MISSING',
    },
    nodeVersion: process.version,
    connection: null,
    users: null,
    error: null
  };

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || 'https://yjquviufzsfpqqcezbny.supabase.co';
    const key = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqcXV2aXVmenNmcHFxY2V6Ym55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE2OTA5MiwiZXhwIjoyMDg4NzQ1MDkyfQ.OP9sbsuhed6KUk8dwFSCcnC8Mm-xF3TBU5HXw9BFthk';
    
    const db = createClient(url, key);
    const { data, error } = await db.from('users').select('email, role');
    
    if (error) {
      results.error = error.message;
    } else {
      results.connection = 'SUCCESS';
      results.users = data;
    }
  } catch (err) {
    results.error = err.message;
  }

  res.status(200).json(results);
}
