-- ══════════════════════════════════════════════════════
-- ORYNTECH — Supabase Schema
-- Rulează asta în: supabase.com → SQL Editor → New query
-- ══════════════════════════════════════════════════════

-- ─── EXTENSII ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS (admin accounts) ─────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT,                    -- NULL dacă e login cu Google
  name        TEXT,
  role        TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  google_id   TEXT UNIQUE,              -- pentru viitor Google OAuth
  avatar_url  TEXT,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index pe email pentru login rapid
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── PAGES (conținut pagini editat din admin) ────────────
CREATE TABLE IF NOT EXISTS pages (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,     -- ex: 'index', 'trial', 'tutorials'
  title       TEXT NOT NULL,
  content     JSONB DEFAULT '{}',       -- structura secțiunilor paginii
  meta_title  TEXT,
  meta_desc   TEXT,
  nav_location TEXT DEFAULT 'none' CHECK (nav_location IN ('header', 'footer', 'none')),
  nav_order   INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  updated_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: actualizează updated_at automat
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Pagini default (slug-urile existente)
INSERT INTO pages (slug, title, nav_location, nav_order) VALUES
  ('index',     'Homepage',     'header', 1),
  ('trial',     'Try for Free', 'header', 2),
  ('tutorials', 'Tutoriale',    'header', 3),
  ('admin',     'Admin',        'none',   0)
ON CONFLICT (slug) DO NOTHING;

-- ─── LEADS (formular trial) ──────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  firstname     TEXT NOT NULL,
  lastname      TEXT,
  email         TEXT NOT NULL,
  phone         TEXT,
  business      TEXT,
  niche         TEXT,
  leads_month   TEXT,                   -- ex: '50-100'
  problem       TEXT,                   -- biggest problem (textarea)
  source_page   TEXT DEFAULT 'trial',
  ip_address    TEXT,
  ghl_sent      BOOLEAN DEFAULT false,  -- confirmare că a ajuns la GHL
  ghl_sent_at   TIMESTAMPTZ,
  ghl_error     TEXT,                   -- mesaj de eroare dacă a picat
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email    ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created  ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_ghl_sent ON leads(ghl_sent);

-- ─── MEDIA (uploads imagini din admin) ──────────────────
CREATE TABLE IF NOT EXISTS media (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename    TEXT NOT NULL,
  original_name TEXT,
  url         TEXT NOT NULL,
  size        INTEGER,
  mime_type   TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SESSIONS (JWT blacklist pentru logout) ─────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Auto-cleanup sesiuni expirate (rulează periodic)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ─── ROW LEVEL SECURITY ─────────────────────────────────
-- Blochează accesul direct din frontend (totul trece prin API)
ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE media    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Doar service_role (backend) poate citi/scrie
CREATE POLICY "service only" ON users    USING (false);
CREATE POLICY "service only" ON leads    USING (false);
CREATE POLICY "service only" ON media    USING (false);
CREATE POLICY "service only" ON sessions USING (false);

-- Pages: public poate citi paginile publicate
CREATE POLICY "public read published" ON pages
  FOR SELECT USING (is_published = true);
CREATE POLICY "service write" ON pages
  FOR ALL USING (false);
