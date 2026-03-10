/**
 * scripts/import_pages.js
 * 
 * This script parses existing static HTML files and converts them into
 * the JSON schema expected by the ORYNTECH editor.
 * 
 * Usage: node scripts/import_pages.js
 */

import fs from 'fs';
import path from 'path';
import { getDB } from '../lib/db.js';
import crypto from 'crypto';

// Configuration: mapping slugs to file paths
const PAGES_TO_IMPORT = [
  { slug: 'index', title: 'Homepage', path: 'public/index.html', nav_location: 'header', nav_order: 1 },
  { slug: 'trial', title: 'Try for Free', path: 'public/oryntech-trial.html', nav_location: 'header', nav_order: 2 },
  { slug: 'tutorials', title: 'Tutoriale', path: 'public/oryntech-tutorials.html', nav_location: 'header', nav_order: 3 },
];

async function importPages() {
  const db = getDB();
  
  for (const page of PAGES_TO_IMPORT) {
    console.log(`Importing page: ${page.slug}...`);
    
    try {
      const filePath = path.resolve(process.cwd(), page.path);
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        continue;
      }
      
      const html = fs.readFileSync(filePath, 'utf8');
      
      // Initial import: wrap the content as a 'HTML Custom' widget
      // This ensures we don't lose the complex styling while building the system.
      const sections = [{
        id: crypto.randomUUID(),
        type: 'html',
        props: {
          html: html
        }
      }];

      const { error } = await db
        .from('pages')
        .upsert({
          slug: page.slug,
          title: page.title,
          content: { sections },
          nav_location: page.nav_location,
          nav_order: page.nav_order,
          is_published: true
        }, { onConflict: 'slug' });

      if (error) {
        console.error(`Error importing ${page.slug}:`, error);
      } else {
        console.log(`Successfully imported ${page.slug}`);
      }
    } catch (err) {
      console.error(`Failed to read ${page.path}:`, err);
    }
  }
}

// Ensure database connection variables are present before running
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the environment.');
  process.exit(1);
}

importPages();
