// lib/auth.js
// ─────────────────────────────────────────────────────────
// JWT sign/verify + bcrypt helpers
// ─────────────────────────────────────────────────────────

import jwt      from 'jsonwebtoken';
import bcrypt   from 'bcryptjs';
import { getDB } from './db.js';

const JWT_SECRET  = process.env.JWT_SECRET || '318144fc95b91f1fc61883685834e58bfcbea191539fd4035d511cc5c166bfa605f0a5798ff44286a9be044e4bbc203e1df025451e581eef6647d662387ae32c';
const JWT_EXPIRES = '7d'; // token valabil 7 zile

// ── Hash parolă (la creare cont) ───────────────────────
export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

// ── Verifică parolă (la login) ─────────────────────────
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// ── Generează JWT ──────────────────────────────────────
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ── Verifică JWT (returnează payload sau null) ─────────
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ── Extrage token din header Authorization ─────────────
export function extractToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// ── Middleware: verifică JWT și atașează user la req ───
// Folosit în API routes protejate
export async function requireAuth(req, res) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Autentificare necesară' });
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Token invalid sau expirat' });
    return null;
  }

  // Verifică că userul există în DB
  const db = getDB();
  const { data: user, error } = await db
    .from('users')
    .select('id, email, name, role')
    .eq('id', payload.userId)
    .single();

  if (error || !user) {
    res.status(401).json({ error: 'User inexistent' });
    return null;
  }

  return user; // { id, email, name, role }
}

// ── CORS headers helper ────────────────────────────────
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── Handle OPTIONS preflight ───────────────────────────
export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.status(200).end();
    return true;
  }
  return false;
}
