/**
 * Session Service using JWT
 * - 30-minute inactivity timeout
 * - Tracks last activity per token
 */

import jwt from 'jsonwebtoken';
import db from '../db.js';

const SECRET = process.env.JWT_SECRET || 'cloudopt-dev-secret';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 28800000; // 8 hours

export function createSession(admin) {
  const payload = { id: admin.id, email: admin.email, mobile: admin.mobile, role: admin.role };
  const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });
  db.sessions[token] = {
    adminId: admin.id,
    createdAt: new Date(),
    lastActivity: new Date(),
  };
  return token;
}

export function validateSession(token) {
  if (!token) return null;  // silent — unauthenticated requests are normal

  // Check JWT validity
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch (e) {
    console.warn('[Session] Rejected — JWT invalid:', e.message);
    return null;
  }

  // Check session exists in memory
  const session = db.sessions[token];
  if (!session) {
    // Session not in memory (e.g. server restarted) — re-register it from valid JWT
    console.warn('[Session] Token valid but session not in memory — re-registering');
    db.sessions[token] = {
      adminId: decoded.id,
      createdAt: new Date(),
      lastActivity: new Date(),
    };
    return db.admins.find(a => a.id === decoded.id) || null;
  }

  // Check inactivity timeout
  const inactive = Date.now() - new Date(session.lastActivity).getTime();
  if (inactive > SESSION_TIMEOUT) {
    console.warn('[Session] Rejected — inactivity timeout for admin:', decoded.id);
    delete db.sessions[token];
    return null;
  }

  // Refresh last activity
  session.lastActivity = new Date();

  return db.admins.find(a => a.id === decoded.id) || null;
}

export function destroySession(token) {
  delete db.sessions[token];
}
