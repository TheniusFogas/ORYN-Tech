# ORYNTECH Platform — Documentație Proiect

> Ultima actualizare: Martie 2026

---

## Cuprins

1. [Tehnologii folosite](#tehnologii)
2. [Arhitectura sistemului](#arhitectura)
3. [Structura fișierelor](#structura)
4. [Ce a fost construit](#facut)
5. [Ce mai rămâne de făcut](#de-facut)
6. [Flux date](#flux)
7. [Setup rapid](#setup)

---

## 1. Tehnologii folosite {#tehnologii}

| Strat | Tehnologie | Rol |
|-------|-----------|-----|
| **Hosting** | Vercel | Deploy static + serverless functions |
| **Repo** | GitHub | Versionare cod |
| **Bază de date** | Supabase (PostgreSQL) | Leads, users, pages, media |
| **Auth** | JWT + bcrypt | Login admin user/parolă |
| **Backend** | Node.js 18 Serverless (Vercel Functions) | API endpoints |
| **Frontend** | HTML + CSS + Vanilla JS (ES Modules) | Toate paginile |
| **Fonturi** | Google Fonts — Outfit 300–800 | Design sistem |
| **Iconițe** | Material Symbols Rounded | UI icons |
| **Animații** | Canvas API (custom) | Globe 3D, comet, galaxy |
| **GHL** | GoHighLevel Webhook | CRM lead forwarding |
| **Email (plan)** | Resend.com | Notificări lead nou |
| **Upload (plan)** | Vercel Blob / Cloudinary | Media storage |

---

## 2. Arhitectura sistemului {#arhitectura}

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   /index.html        /oryntech-trial.html                   │
│   /oryntech-editor.html   /oryntech-tutorials.html          │
│                                                             │
│   public/admin/                                             │
│   ├── editor.js       ← State, drag-drop, undo/redo         │
│   ├── renderer.js     ← JSON schema → HTML                  │
│   ├── properties.js   ← Properties panel fields             │
│   └── widgets/definitions.js  ← 13 widget types             │
└───────────────────────────┬─────────────────────────────────┘
                            │ fetch() REST API
┌───────────────────────────▼─────────────────────────────────┐
│                    VERCEL (serverless)                       │
│                                                             │
│   /api/auth/login.js      POST  → JWT token                 │
│   /api/auth/register.js   POST  → primul cont admin         │
│   /api/auth/verify.js     GET   → validare sesiune          │
│                                                             │
│   /api/leads.js           POST  → salvare + GHL forward     │
│   /api/admin/leads.js     GET   → lista leads (auth)        │
│                                                             │
│   /api/pages/index.js     GET/POST → lista/creare pagini    │
│   /api/pages/[slug].js    GET/PUT  → citire/salvare pagină  │
│   /api/pages/render.js    GET      → server-side HTML       │
│                                                             │
│   lib/db.js      ← Supabase client singleton               │
│   lib/auth.js    ← JWT sign/verify, bcrypt, middleware      │
│   lib/ghl.js     ← GoHighLevel webhook helper               │
└───────────────────────────┬─────────────────────────────────┘
                            │ @supabase/supabase-js
┌───────────────────────────▼─────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                     │
│                                                             │
│   users     → conturi admin (email, password_hash, role)    │
│   pages     → conținut pagini (slug, title, content JSONB)  │
│   leads     → lead-uri capturate (email, phone, business…)  │
│   media     → fișiere uploadate (url, filename, size)       │
│   sessions  → JWT blacklist pentru logout                    │
└───────────────────────────┬─────────────────────────────────┘
                            │ POST webhook
┌───────────────────────────▼─────────────────────────────────┐
│              GOHIGHLEVEL (CRM extern)                       │
│   Primește lead-urile din formular → automations GHL        │
└─────────────────────────────────────────────────────────────┘
```

### Fluxul editorului

```
Editor UI (browser)
    │
    ├── Selectează widget din sidebar
    ├── Adaugă secțiune → editor.js (state)
    ├── Editează props → properties.js → editor.updateProps()
    ├── Canvas re-renderează → renderer.js → HTML
    │
    └── Save (Ctrl+S / buton)
            │
            └── PUT /api/pages/:slug
                    │
                    └── Supabase pages.content = { sections: [...] }
```

---

## 3. Structura fișierelor {#structura}

```
oryntech/
│
├── public/                          ← Fișiere statice (servite de Vercel)
│   ├── index.html                   ← Homepage / pricing page
│   ├── oryntech-trial.html          ← Lead capture (Try for Free)
│   ├── oryntech-tutorials.html      ← Pagina tutoriale
│   ├── oryntech-admin.html          ← Admin vechi (dashboard)
│   ├── oryntech-editor.html         ← Editor Webflow-like NOU ✨
│   │
│   └── admin/                       ← Modulele editorului (ES Modules)
│       ├── editor.js                ← Core: state, undo/redo, drag-drop
│       ├── renderer.js              ← JSON → HTML (shared editor + server)
│       ├── properties.js            ← Properties panel dinamic
│       └── widgets/
│           └── definitions.js       ← Schema toate widget-urile
│
├── api/                             ← Vercel Serverless Functions
│   ├── leads.js                     ← POST /api/leads
│   ├── auth/
│   │   ├── login.js                 ← POST /api/auth/login
│   │   ├── register.js              ← POST /api/auth/register
│   │   └── verify.js                ← GET  /api/auth/verify
│   ├── pages/
│   │   ├── index.js                 ← GET/POST /api/pages
│   │   ├── [slug].js                ← GET/PUT  /api/pages/:slug
│   │   └── render.js                ← GET /api/pages/:slug/render
│   └── admin/
│       └── leads.js                 ← GET /api/admin/leads
│
├── lib/                             ← Shared utilities
│   ├── db.js                        ← Supabase client
│   ├── auth.js                      ← JWT + bcrypt + CORS
│   └── ghl.js                       ← GHL webhook
│
├── supabase/
│   └── schema.sql                   ← Toate tabelele + RLS policies
│
├── vercel.json                      ← Routing + headers config
├── package.json                     ← Dependencies
├── .env.example                     ← Template variabile de mediu
├── .gitignore
└── README.md                        ← Setup pas cu pas
```

---

## 4. Ce a fost construit ✅ {#facut}

### Frontend — Pagini

- [x] **`index.html`** — Homepage complet cu hero, stats, features, pricing cards, FAQ, CTA, footer
- [x] **`oryntech-trial.html`** — Landing page lead capture cu formular conectat la `/api/leads`
- [x] **`oryntech-tutorials.html`** — Pagina tutoriale (conținut static)
- [x] **`oryntech-admin.html`** — Admin vechi cu login screen + JWT auth

### Frontend — Design sistem

- [x] Galaxy canvas animat (stele, nebule, shooting stars, mouse parallax)
- [x] Globe 3D animat (rețea de noduri, great-circle arcs, shooting star pulses)
- [x] Racheta orbitală cu perspectivă 3D și ocluzie
- [x] Cometa ORYN (text effect pe traiectorie Catmull-Rom)
- [x] Header fix cu logo animat, nav, login portal
- [x] Footer complet cu 4 coloane
- [x] Glassmorphism design system (`.gl.base`, `.gl.frost`, `.gl.rim`)
- [x] Responsive mobile (hamburger menu, breakpoints)

### Editor Webflow-like

- [x] **`oryntech-editor.html`** — Editor complet (accesat la `/editor`)
- [x] Login screen cu JWT auth
- [x] Topbar cu page selector, device switcher, undo/redo, save status, preview
- [x] Sidebar stânga — tab Widgets (categorii) + tab Pagini (structură)
- [x] Canvas cu secțiuni wrapper, toolbar per secțiune, drag zones
- [x] Panel dreapta — Properties dinamic + Page settings (meta, nav)
- [x] **Drag & drop** secțiuni (reordonare în canvas)
- [x] **Drag din sidebar** → adaugă widget pe canvas
- [x] **Undo/Redo** 50 pași (Ctrl+Z / Ctrl+Shift+Z)
- [x] **Select** secțiune → properties panel contextual
- [x] **Mutare** sus/jos via toolbar și context menu
- [x] **Duplicare** secțiuni
- [x] **Copy/Paste** secțiuni
- [x] **Ștergere** secțiune (toolbar + Delete key)
- [x] **Context menu** click dreapta (edit, move, duplicate, copy, paste, delete)
- [x] **Keyboard shortcuts** — Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, Delete, Escape
- [x] **Device preview** — Desktop / Tablet 768px / Mobile 390px
- [x] **Unsaved changes warning** la închiderea tab-ului
- [x] **Toast notifications** (succes, eroare, info)
- [x] **Save la Supabase** via `PUT /api/pages/:slug`
- [x] **Load din Supabase** via `GET /api/pages/:slug`
- [x] **Adăugare pagini noi** via modal

### Widgets implementate (13)

| Widget | Categorie | Proprietăți editabile |
|--------|-----------|----------------------|
| Spacer | Layout | height |
| Divider | Layout | style, color, margin |
| Columns | Layout | cols 1-6, gap, padding |
| Hero | Content | eyebrow, title, subtitle, CTA, align, padding |
| Text | Content | title, richtext, align, font size, padding |
| Image | Content | upload/URL, alt, caption, border-radius, padding |
| Video | Content | YouTube/Vimeo URL, aspect ratio, padding |
| Stats Bar | Components | items (value+label), columns 1-6, padding |
| Cards Grid | Components | title, cards (icon+title+desc), columns, padding |
| FAQ | Components | title, items (Q+A), padding |
| CTA Banner | Components | title, subtitle, CTA primar+secundar, bg style |
| Pricing | Components | planuri (preț, features, CTA, badge), padding |
| Testimonials | Components | items (text, autor, rating), columns, padding |
| Form | Components | câmpuri, submit text, webhook URL |
| HTML Custom | Components | cod HTML liber |

### Properties panel — tipuri de câmpuri

- [x] Text input
- [x] Textarea
- [x] Richtext (bold, italic, underline)
- [x] Code editor
- [x] Range slider cu valoare live
- [x] Toggle switch
- [x] Select dropdown
- [x] Color picker (text + visual picker)
- [x] Image upload + URL fallback
- [x] Icon picker (grid 40+ icoane + search text)
- [x] Columns picker (butoane 1-6)
- [x] **Repeater** — adaugă/șterge/editează arrays (Cards, FAQ, Stats, etc.)

### Backend API

- [x] `POST /api/auth/login` — autentificare email/parolă → JWT 7 zile
- [x] `POST /api/auth/register` — creare cont admin cu setup key
- [x] `GET  /api/auth/verify` — validare token JWT
- [x] `POST /api/leads` — captură lead → Supabase + GHL webhook
- [x] `GET  /api/admin/leads` — lista leads cu search + paginare (auth)
- [x] `GET  /api/pages` — lista pagini (auth)
- [x] `POST /api/pages` — creare pagină nouă (auth)
- [x] `GET  /api/pages/:slug` — citire conținut pagină
- [x] `PUT  /api/pages/:slug` — salvare conținut pagină (auth)
- [x] `GET  /api/pages/:slug/render` — server-side HTML rendering

### Baza de date

- [x] Tabel `users` — conturi admin cu bcrypt + role
- [x] Tabel `pages` — conținut JSONB + meta + nav + publish status
- [x] Tabel `leads` — date formular + IP + GHL status
- [x] Tabel `media` — fișiere uploadate
- [x] Tabel `sessions` — JWT blacklist
- [x] Row Level Security pe toate tabelele
- [x] Trigger `updated_at` automat pe `pages`
- [x] Funcție cleanup sesiuni expirate

### Config & DevOps

- [x] `vercel.json` — routing complet (API, pagini, editor)
- [x] `package.json` — dependențe (supabase-js, bcryptjs, jsonwebtoken)
- [x] `.env.example` — template cu toate variabilele necesare
- [x] `.gitignore`
- [x] `README.md` — ghid setup pas cu pas

---

## 5. Ce mai rămâne de făcut ⬜ {#de-facut}

### 🔴 Prioritate înaltă — necesar pentru launch

- [ ] **Creat proiect Supabase** și rulat `supabase/schema.sql` în SQL Editor
- [ ] **Setat env vars în Vercel**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `GHL_WEBHOOK_URL`, `ADMIN_SETUP_KEY`
- [ ] **Push pe GitHub** + conectat repo la Vercel → primul deploy
- [ ] **Creat primul cont admin** via `POST /api/auth/register` cu setup key
- [ ] **Script import pagini existente** — parsează HTML-urile actuale și le convertește în JSON schema → salvate în Supabase. Fără asta, editorul pornește cu pagini goale.
- [ ] **Testat end-to-end**: formular trial → `/api/leads` → Supabase → GHL

### 🟠 Prioritate medie — funcționalitate completă editor

- [ ] **`api/media/upload.js`** — endpoint upload imagini (folosit în properties panel)
- [ ] **Inline text editing** — dublu-click pe text direct în canvas pentru editare live
- [ ] **Drag din sidebar la poziție specifică** — acum se adaugă la final sau după selecție
- [ ] **Repeater drag-drop** — reordonare iteme în lista repeater (Cards, FAQ, Stats)
- [ ] **Google OAuth** — butonul există în UI, logica nu e conectată

### 🟡 Prioritate medie — admin dashboard

- [ ] **Dashboard leads** în `oryntech-admin.html` — tabel leads din Supabase, search, export CSV
- [ ] **Decizie `oryntech-admin.html`** — păstrat ca dashboard (leads + setări) sau eliminat în favoarea editorului?
- [ ] **Publish/Draft per pagină** — toggle is_published din editor

### 🟢 Nice-to-have — roadmap

- [ ] **`oryntech-tutorials.html`** — funcționalitate reală (video player, progres, module)
- [ ] **Email notificare** la lead nou via Resend.com
- [ ] **Dashboard analytics** simplu (leads/zi, surse, conversii)
- [ ] **Versionare pagini** — istoric modificări cu revert
- [ ] **Multi-user admin** — invitare colegi cu roluri diferite
- [ ] **Favicon + og:image** pe toate paginile
- [ ] **Meta tags SEO** dinamice per pagină (servite din Supabase)
- [ ] **Mobile nav editor** — editorul nu are versiune mobilă (by design)

---

## 6. Fluxul datelor {#flux}

### Lead capture (formular trial)

```
Vizitator completează formular
    → POST /api/leads { firstname, email, phone, business, niche... }
    → Validare input (email format, câmpuri required)
    → INSERT în Supabase leads table
    → POST la GHL webhook (async)
    → UPDATE leads.ghl_sent = true/false
    → Răspuns 200 { success: true } → UI afișează mesaj confirmare
```

### Admin login

```
Admin introduce email + parolă
    → POST /api/auth/login { email, password }
    → SELECT user din Supabase by email
    → bcrypt.compare(password, password_hash)
    → jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: '7d' })
    → localStorage.setItem('oryn_admin_token', token)
    → Redirect în editor / admin
```

### Salvare pagină din editor

```
Admin apasă Save (sau Ctrl+S)
    → editor.save(token)
    → PUT /api/pages/:slug { title, content: { sections: [...] } }
    → requireAuth middleware → verifyToken(JWT) → SELECT user
    → UPDATE pages SET content = $json, updated_by = $userId
    → Răspuns 200 { success: true }
    → UI: status indicator "Salvat" (verde)
```

### Vizitator accesează pagina

```
GET /oryntech-editor.html → editor UI static (fișier HTML)
    sau
GET /api/pages/index/render → server-side rendered HTML din Supabase
```

---

## 7. Setup rapid {#setup}

```bash
# 1. Clone & install
git clone https://github.com/YOUR_USERNAME/oryntech.git
cd oryntech
npm install

# 2. Supabase
# → supabase.com → New project → SQL Editor → rulează supabase/schema.sql

# 3. .env (copiat din .env.example)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/...
ADMIN_SETUP_KEY=cheie_secreta_setup

# 4. Deploy Vercel
vercel --prod
# → setează env vars în dashboard Vercel

# 5. Creare cont admin
curl -X POST https://YOUR_DOMAIN.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"setupKey":"ADMIN_SETUP_KEY","email":"admin@oryntech.ai","password":"Parola123!","name":"Admin"}'

# 6. Accesează editorul
# → https://YOUR_DOMAIN.vercel.app/editor
```

---

## Dependențe NPM

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2"
}
```

---

*Document generat automat pe baza sesiunilor de development — ORYNTECH Platform*
