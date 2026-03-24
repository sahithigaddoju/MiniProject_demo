/**
 * In-memory database with pre-approved admin whitelist.
 * In production, replace with MySQL/PostgreSQL.
 */

const db = {
  // ─── APPROVED ADMINS WHITELIST ───────────────────────────────────────────
  // ONLY these identifiers can receive OTPs and access the system
  admins: [
    {
      id: 1,
      mobile: '+919876543210',
      email: 'manager@datacenter.com',
      name: 'Raj Manager',
      role: 'Data Center Manager',
      approved: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      mobile: '+919812345678',
      email: 'engineer@datacenter.com',
      name: 'Priya Engineer',
      role: 'Ops Engineer',
      approved: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 3,
      mobile: '+919823456789',
      email: 'admin@datacenter.com',
      name: 'Vikram Admin',
      role: 'System Admin',
      approved: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 4,
      mobile: '+919834567890',
      email: 'ops@datacenter.com',
      name: 'Sneha Ops',
      role: 'Network Engineer',
      approved: true,
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 5,
      mobile: '+919845678901',
      email: 'security@datacenter.com',
      name: 'Arjun Security',
      role: 'Security Analyst',
      approved: true,
      createdAt: new Date('2024-01-01'),
    },
    // Demo admin for easy testing
    {
      id: 6,
      mobile: '+919999999999',
      email: 'demo@cloudopt.io',
      name: 'Demo Admin',
      role: 'Demo User',
      approved: true,
      createdAt: new Date('2024-01-01'),
    },
  ],

  // ─── OTP STORAGE (temporary, auto-cleaned) ───────────────────────────────
  // Structure: { identifier -> { otp, expiresAt, attempts, lockedUntil } }
  otps: {},

  // ─── ACTIVE SESSIONS ─────────────────────────────────────────────────────
  // Structure: { token -> { adminId, createdAt, lastActivity } }
  sessions: {},

  // ─── LOGIN AUDIT LOG ─────────────────────────────────────────────────────
  loginLogs: [],

  // ─── RATE LIMITING ───────────────────────────────────────────────────────
  // Structure: { identifier -> { count, resetAt } }
  rateLimits: {},

  // ─── APP DATA ────────────────────────────────────────────────────────────
  resources: {
    servers: 500,
    cpuPerServer: 16,
    memoryPerServer: 64,
  },
  workloads: [],
  scheduleResults: [],
};

export default db;
