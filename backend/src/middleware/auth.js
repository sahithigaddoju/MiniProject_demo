import { validateSession } from '../services/session.js';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const admin = validateSession(token);
  if (!admin) {
    return res.status(401).json({ error: 'Session expired. Please login again.' });
  }
  req.admin = admin;
  next();
}
