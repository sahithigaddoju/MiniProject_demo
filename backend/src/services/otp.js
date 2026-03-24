/**
 * OTP Service
 * - Generates 6-digit OTPs
 * - 2-minute expiry
 * - Max 3 attempts before lockout
 * - 15-minute lockout after 3 failed attempts
 */

import db from '../db.js';

const OTP_EXPIRY_MS = process.env.NODE_ENV !== 'production'
  ? 30 * 60 * 1000   // 30 minutes in dev
  : 2  * 60 * 1000;  // 2 minutes in prod
const LOCKOUT_MS    = 15 * 60 * 1000;       // 15 minutes (prod)
const MAX_ATTEMPTS  = process.env.NODE_ENV !== 'production' ? 999 : 3;

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOtp(identifier, otp) {
  db.otps[identifier] = {
    otp,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    attempts: 0,
    lockedUntil: null,
  };
}

export function verifyOtp(identifier, inputOtp) {
  const record = db.otps[identifier];

  if (!record) {
    return { success: false, error: 'No OTP found. Please request a new one.' };
  }

  // Check lockout
  if (record.lockedUntil && new Date() < record.lockedUntil) {
    const remaining = Math.ceil((record.lockedUntil - Date.now()) / 60000);
    return { success: false, error: `Too many failed attempts. Try again in ${remaining} minute(s).` };
  }

  // Check expiry
  if (new Date() > record.expiresAt) {
    delete db.otps[identifier];
    return { success: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Check OTP match
  if (record.otp !== inputOtp) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      record.lockedUntil = new Date(Date.now() + LOCKOUT_MS);
      return { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' };
    }
    const left = MAX_ATTEMPTS - record.attempts;
    return { success: false, error: `Invalid OTP. ${left} attempt(s) remaining.` };
  }

  // Valid OTP — clean up
  delete db.otps[identifier];
  return { success: true };
}

export function clearOtp(identifier) {
  delete db.otps[identifier];
}
