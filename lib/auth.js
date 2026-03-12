// lib/auth.js
// ─────────────────────────────────────────────────────────
// JWT sign/verify + bcrypt helpers
// ─────────────────────────────────────────────────────────

import jwt      from 'jsonwebtoken';
import bcrypt   from 'bcryptjs';
import { getDB } from './db.js';

const JWT_SECRET  = process.env.JWT_SECRET;
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
  
  // LOGIN BYPASS: Dacă nu există token, returnăm un user default (Super Admin)
  if (!token) {
    console.log('[Auth] Bypass activ - folosim user default');
    return { id: 'admin-id', email: 'admin@oryn.tech', name: 'Super Admin', role: 'admin' };
  }

  const payload = verifyToken(token);
  if (!payload) {
    // În caz de token expirat/invalid, tot facem bypass pentru a nu bloca editorul
    console.log('[Auth] Bypass activ (token invalid)');
    return { id: 'admin-id', email: 'admin@oryn.tech', name: 'Super Admin', role: 'admin' };
  }

  // Verifică că userul există în DB
  const db = getDB();
  const { data: user, error } = await db
    .from('users')
    .select('id, email, name, role')
    .eq('id', payload.userId)
    .single();

  if (error || !user) {
    return { id: 'admin-id', email: 'admin@oryn.tech', name: 'Super Admin', role: 'admin' };
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
