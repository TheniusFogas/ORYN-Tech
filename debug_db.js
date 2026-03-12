import { getDB } from './lib/db.js';

async function debug() {
  console.log('Testing DB connection...');
  const db = getDB();
  const { data, error } = await db.from('pages').select('id, slug, title');
  
  if (error) {
    console.error('DB Error:', error);
  } else {
    console.log('Pages in DB:', data);
  }
}

debug();
