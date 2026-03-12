import { getDB } from '../../lib/db.js';
import { requireAuth, setCors, handleOptions } from '../../lib/auth.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Dezactivăm bodyParser pentru a folosi formidable
  },
};

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Metodă nepermisă' });
    }

    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file; // formidable v3+ returns arrays
    if (!file) {
      return res.status(400).json({ error: 'Niciun fișier încărcat' });
    }

    const db = getDB();
    const fileName = `${Date.now()}-${file.originalFilename || 'upload.png'}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    // 1. Upload la Supabase Storage (Bucketul 'media')
    const { data: uploadData, error: uploadError } = await db.storage
      .from('media')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'image/png',
        upsert: true
      });

    if (uploadError) {
      // Dacă bucketul nu există, încercăm să-l creăm (opțional, dar bun pentru robustez)
      if (uploadError.message.includes('bucket not found')) {
        await db.storage.createBucket('media', { public: true });
        // Reîncercăm upload-ul
        const { data: retryData, error: retryError } = await db.storage
          .from('media')
          .upload(fileName, fileBuffer, { contentType: file.mimetype || 'image/png' });
        
        if (retryError) throw retryError;
      } else {
        throw uploadError;
      }
    }

    const { data: publicUrlData } = db.storage.from('media').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    // 2. Înregistrare în tabela 'media'
    const { error: dbError } = await db.from('media').insert({
      filename: fileName,
      original_name: file.originalFilename,
      url: publicUrl,
      size: file.size,
      mime_type: file.mimetype,
      uploaded_by: user.id
    });

    if (dbError) throw dbError;

    res.status(200).json({ url: publicUrl });

  } catch (err) {
    console.error('[Upload] Error:', err);
    res.status(500).json({ error: 'Eroare la upload: ' + err.message });
  }
}
