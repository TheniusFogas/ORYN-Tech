# ORYNTech Platform

Stack: Vercel + GitHub + Supabase (PostgreSQL) + Node.js Serverless Functions

---

## SETUP — Pas cu pas

### 1. Supabase — Creează proiectul

1. Mergi la [supabase.com](https://supabase.com) → **New project**
2. Alege un nume (ex: `oryntech`), setează o parolă DB puternică, regiunea **EU West**
3. Aștepți ~2 minute să se creeze
4. Mergi la **SQL Editor** → **New query**
5. Copiază tot conținutul din `supabase/schema.sql` și apasă **Run**
6. Mergi la **Settings → API** și copiază:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (secret) → `SUPABASE_SERVICE_KEY`

---

### 2. GitHub — Creează repo-ul

```bash
git init
git add .
git commit -m "Initial commit — ORYNTech"
git remote add origin https://github.com/USERNAME/oryntech.git
git push -u origin main
```

---

### 3. Vercel — Conectează repo-ul

1. Mergi la [vercel.com](https://vercel.com) → **Add New Project**
2. Importă repo-ul din GitHub
3. **Framework Preset:** Other
4. **Root Directory:** `.` (rădăcina)
5. Apasă **Deploy** (va pica prima dată — fără env vars)

---

### 4. Vercel — Setează Environment Variables

În Vercel → proiect → **Settings → Environment Variables**, adaugă:

| Cheie | Valoare |
|-------|---------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` (service_role key) |
| `JWT_SECRET` | string random 64+ chars (vezi mai jos) |
| `GHL_WEBHOOK_URL` | URL webhook din GoHighLevel |
| `ADMIN_SETUP_KEY` | orice string secret (folosit o singură dată) |

**Generare JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Apoi **Redeploy** din Vercel.

---

### 5. Creează primul cont admin

Fă un POST request (Postman / curl / browser fetch) la:

```
POST https://YOUR-DOMAIN.vercel.app/api/auth/register
Content-Type: application/json

{
  "setupKey": "ADMIN_SETUP_KEY_DIN_ENV",
  "email": "admin@oryntech.ai",
  "password": "ParolaSecreta123!",
  "name": "Admin ORYNTech"
}
```

Cu curl:
```bash
curl -X POST https://YOUR-DOMAIN.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"setupKey":"CHEIA_TA","email":"admin@oryntech.ai","password":"ParolaSecreta123!","name":"Admin"}'
```

Returnează un JWT token — ești logat.

---

### 6. Accesează Admin

Mergi la `https://YOUR-DOMAIN.vercel.app/oryntech-admin.html`  
Loghează-te cu email + parola create la pasul 5.

---

## Structura fișierelor

```
oryntech/
├── api/                    ← Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js        ← POST /api/auth/login
│   │   ├── register.js     ← POST /api/auth/register (setup)
│   │   └── verify.js       ← GET  /api/auth/verify
│   ├── pages/
│   │   ├── index.js        ← GET/POST /api/pages
│   │   └── [slug].js       ← GET/PUT  /api/pages/:slug
│   ├── admin/
│   │   └── leads.js        ← GET /api/admin/leads
│   └── leads.js            ← POST /api/leads (formular trial)
├── lib/
│   ├── db.js               ← Supabase client
│   ├── auth.js             ← JWT + bcrypt helpers
│   └── ghl.js              ← GHL webhook helper
├── public/                 ← Fișiere statice HTML
│   ├── index.html          ← Homepage
│   ├── oryntech-trial.html ← Try for Free
│   ├── oryntech-tutorials.html
│   └── oryntech-admin.html ← Admin panel
├── supabase/
│   └── schema.sql          ← Tabele DB (rulează în SQL Editor)
├── vercel.json             ← Routing config
├── package.json
├── .env.example            ← Template variabile (NU comite .env)
└── .gitignore
```

---

## API Endpoints

| Method | Endpoint | Auth | Descriere |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | ✗ | Login user/parolă |
| POST | `/api/auth/register` | Setup key | Creare cont admin |
| GET | `/api/auth/verify` | JWT | Verifică sesiunea |
| POST | `/api/leads` | ✗ | Captură lead + GHL |
| GET | `/api/pages` | JWT | Lista pagini |
| GET | `/api/pages/:slug` | ✗ | Citește pagina |
| PUT | `/api/pages/:slug` | JWT | Salvează pagina |
| GET | `/api/admin/leads` | JWT | Lead-uri (admin) |

---

## Logout admin

Apasă `Ctrl + Shift + L` în pagina de admin.

---

## Următorii pași (roadmap)

- [ ] Google OAuth (butonul e deja în UI)
- [ ] Upload imagini (Vercel Blob / Cloudinary)
- [ ] Dashboard leads în admin (tabel cu toate lead-urile)
- [ ] Editor vizual cu salvare reală în DB
- [ ] Email notificări la lead nou (Resend.com)
