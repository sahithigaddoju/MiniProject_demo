/**
 * Session Service using JWT
 * - 30-minute inactivity timeout
 * - Tracks last activity per token
 */

import jwt from 'jsonwebtoken';
import db from '../db.js';

const SECRET = process.env.JWT_SECRET || 'cloudopt-dev-secret';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 1800000; // 30 min

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
  if (!token) return null;

  // Check JWT validity
  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch {
    return null;
  }

  // Check session exists
  const session = db.sessions[token];
  if (!session) return null;

  // Check inactivity timeout
  const inactive = Date.now() - new Date(session.lastActivity).getTime();
  if (inactive > SESSION_TIMEOUT) {
    delete db.sessions[token];
    return null;
  }

  // Refresh last activity
  session.lastActivity = new Date();

  // Return admin data
  return db.admins.find(a => a.id === decoded.id) || null;
}

export function destroySession(token) {
  delete db.sessions[token];
}
