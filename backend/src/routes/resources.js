import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  res.json(db.resources);
});

router.post('/', requireAuth, (req, res) => {
  const { servers, cpuPerServer, memoryPerServer } = req.body;
  if (!servers || !cpuPerServer || !memoryPerServer)
    return res.status(400).json({ error: 'All fields required' });
  if (servers < 100 || servers > 5000)
    return res.status(400).json({ error: 'Servers must be between 100 and 5000' });
  if (cpuPerServer < 4 || cpuPerServer > 64)
    return res.status(400).json({ error: 'CPU cores per server must be between 4 and 64' });
  if (memoryPerServer < 8 || memoryPerServer > 256)
    return res.status(400).json({ error: 'Memory per server must be between 8 and 256 GB' });
  db.resources = { servers: +servers, cpuPerServer: +cpuPerServer, memoryPerServer: +memoryPerServer };
  console.log('[Resources] Updated:', db.resources, `→ Total CPU: ${db.resources.servers * db.resources.cpuPerServer}, Memory: ${db.resources.servers * db.resources.memoryPerServer} GB`);
  res.json({ message: 'Resources updated', resources: db.resources });
});

export default router;
