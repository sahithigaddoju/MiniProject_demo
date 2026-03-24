/**
 * Authentication Routes
 *
 * POST /api/auth/start   — Validate admin + send OTP
 * POST /api/auth/verify  — Verify OTP + create session
 * POST /api/auth/logout  — Destroy session
 * GET  /api/auth/me      — Get current admin info
 */

import express from 'express';
import db from '../db.js';
import { generateOtp, storeOtp, verifyOtp } from '../services/otp.js';
import { sendSms, sendEmail } from '../services/notify.js';
import { createSession, destroySession } from '../services/session.js';
import { logAttempt } from '../services/audit.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function normalizeIdentifier(channel, value) {
  if (channel === 'mobile') {
    // Strip spaces/dashes, ensure +91 prefix
    let num = value.replace(/[\s\-()]/g, '');
    if (!num.startsWith('+')) num = '+91' + num.replace(/^0+/, '');
    return num;
  }
  return value.toLowerCase().trim();
}

function findAdmin(channel, identifier) {
  if (channel === 'mobile') {
    return db.admins.find(a => a.mobile === identifier && a.approved);
  }
  return db.admins.find(a => a.email === identifier && a.approved);
}

function getIp(req) {
  return req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
}

// ─── STEP 1: VALIDATE ADMIN + SEND OTP ───────────────────────────────────────
router.post('/start', async (req, res) => {
  const { channel, identifier: rawIdentifier } = req.body;
  const ip = getIp(req);

  if (!channel || !rawIdentifier) {
    return res.status(400).json({ error: 'Channel and identifier are required.' });
  }
  if (!['mobile', 'email'].includes(channel)) {
    return res.status(400).json({ error: 'Channel must be "mobile" or "email".' });
  }

  // Validate email format
  if (channel === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawIdentifier)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }
  }

  // Validate mobile format
  if (channel === 'mobile') {
    const digits = rawIdentifier.replace(/\D/g, '');
    if (digits.length < 10) {
      return res.status(400).json({ error: 'Invalid mobile number.' });
    }
  }

  const identifier = normalizeIdentifier(channel, rawIdentifier);

  // ⚠️ SECURITY: Check whitelist FIRST — never reveal OTP to non-admins
  const admin = findAdmin(channel, identifier);
  if (!admin) {
    logAttempt({ identifier, channel, action: 'otp_request', success: false, ip, reason: 'Not in whitelist' });
    return res.status(403).json({
      error: 'Access denied. You are not authorized to access this system. Contact your Data Center Manager.',
    });
  }

  // Generate and store OTP
  const otp = generateOtp();
  storeOtp(identifier, otp);

  // Send OTP via appropriate channel
  let sendResult;
  if (channel === 'mobile') {
    sendResult = await sendSms(identifier, otp);
  } else {
    sendResult = await sendEmail(identifier, otp, admin.name);
  }

  logAttempt({ identifier, channel, action: 'otp_request', success: true, ip });

  res.json({
    success: true,
    message: `OTP sent to your ${channel === 'mobile' ? 'mobile number' : 'email address'}.`,
    adminName: admin.name,
    expiresIn: 120,
    demoOtp: otp,
    demoNote: 'DEMO MODE: Use this OTP to login.',
  });
});

// ─── STEP 2: VERIFY OTP + CREATE SESSION ─────────────────────────────────────
router.post('/verify', (req, res) => {
  const { channel, identifier: rawIdentifier, otp } = req.body;
  const ip = getIp(req);

  if (!channel || !rawIdentifier || !otp) {
    return res.status(400).json({ error: 'Channel, identifier and OTP are required.' });
  }

  const identifier = normalizeIdentifier(channel, rawIdentifier);

  // Verify OTP
  const result = verifyOtp(identifier, otp.toString().trim());
  if (!result.success) {
    logAttempt({ identifier, channel, action: 'otp_verify', success: false, ip, reason: result.error });
    return res.status(401).json({ error: result.error });
  }

  // Find admin
  const admin = findAdmin(channel, identifier);
  if (!admin) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Create JWT session
  const token = createSession(admin);

  logAttempt({ identifier, channel, action: 'otp_verify', success: true, ip });

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile,
      role: admin.role,
    },
  });
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
router.post('/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  logAttempt({
    identifier: req.admin.email || req.admin.mobile,
    channel: 'session',
    action: 'logout',
    success: true,
    ip: getIp(req),
  });
  destroySession(token);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── GET CURRENT ADMIN ───────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const { id, name, email, mobile, role } = req.admin;
  res.json({ id, name, email, mobile, role });
});

export default router;
