/**
 * Audit Logger — logs all login attempts (success + failure)
 */

import db from '../db.js';

export function logAttempt({ identifier, channel, action, success, ip, reason = '' }) {
  const entry = {
    id: db.loginLogs.length + 1,
    identifier,
    channel,   // 'mobile' | 'email'
    action,    // 'otp_request' | 'otp_verify' | 'logout'
    success,
    ip: ip || 'unknown',
    reason,
    timestamp: new Date().toISOString(),
  };
  db.loginLogs.push(entry);
  const icon = success ? '✅' : '❌';
  console.log(`[AUDIT] ${icon} ${action} | ${channel}:${identifier} | ${reason || 'OK'} | IP:${entry.ip}`);
}

export function getLogs() {
  return db.loginLogs.slice().reverse();
}
