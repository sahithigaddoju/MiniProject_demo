import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import scheduleRoutes from './routes/schedule.js';
import resourceRoutes from './routes/resources.js';
import historyRoutes from './routes/history.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

const isDev = process.env.NODE_ENV !== 'production';

// ─── GLOBAL RATE LIMIT ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ─── AUTH RATE LIMIT ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/start', authLimiter);
app.use('/api/auth/verify', authLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/history', historyRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// ─── ERROR HANDLER ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

import db from './db.js';

app.listen(PORT, () => {
  console.log(`\n⚡ CloudOpt Backend running on port ${PORT}`);
  console.log(`📋 Approved admins: ${db.admins.length}`);
  console.log(`🔒 Auth mode: ${process.env.TWILIO_ACCOUNT_SID === 'DEMO_MODE' ? 'DEMO (OTP in console)' : 'PRODUCTION'}\n`);
}).on('error', console.error);
