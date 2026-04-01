import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { scheduleWorkloads } from '../scheduler.js';
import { saveFile, getFileUrl } from '../storage.js';
import { persistScheduleRun } from '../supabase.js';

const router = express.Router();

// ─── DASHBOARD APIs (must be before /:id to avoid param conflict) ─────────────

/**
 * All dashboard APIs are derived STRICTLY from the latest scheduler run.
 * No fake data, no sine waves, no cross-batch accumulation for totals.
 * "Latest run" = the most recent entry in db.scheduleResults.
 */

// GET /api/schedule/dashboard/metrics
router.get('/dashboard/metrics', requireAuth, (req, res) => {
  if (db.scheduleResults.length === 0) {
    return res.json({ cpuUtilization: 0, energyConsumed: 0, revenue: 0, rejectedCount: 0 });
  }

  // Use the LATEST batch result only
  const latest = db.scheduleResults[db.scheduleResults.length - 1];
  const s = latest.summary;

  console.log('[Dashboard/metrics] latest summary:', s);
  res.json({
    cpuUtilization: parseFloat(s.cpuUtilization ?? 0),
    energyConsumed: parseFloat(s.totalEnergy    ?? 0),
    revenue:        parseFloat(s.totalRevenue   ?? 0),
    rejectedCount:  (s.rejected ?? 0) + (s.preempted ?? 0),
  });
});

// GET /api/schedule/dashboard/trends
router.get('/dashboard/trends', requireAuth, (req, res) => {
  if (db.scheduleResults.length === 0) return res.json([]);

  const latest   = db.scheduleResults[db.scheduleResults.length - 1];
  const accepted = latest.results.filter(r => r.status === 'Accepted');

  if (accepted.length === 0) return res.json([]);

  // Aggregate into at most 15 buckets so the chart stays clean regardless
  // of how many workloads were scheduled.
  const TARGET_BUCKETS = Math.min(15, accepted.length);
  const bucketSize     = Math.ceil(accepted.length / TARGET_BUCKETS);

  const points = [];
  for (let i = 0; i < TARGET_BUCKETS; i++) {
    const slice  = accepted.slice(i * bucketSize, (i + 1) * bucketSize);
    if (slice.length === 0) break;
    const energy  = slice.reduce((s, r) => s + (r.energy  ?? 0), 0);
    const revenue = slice.reduce((s, r) => s + (r.revenue ?? 0), 0);
    points.push({
      label:     `B${i + 1}`,          // "B1" … "B15" — clean X-axis labels
      timestamp: new Date(new Date(latest.scheduledAt).getTime() + i * 60000).toISOString(),
      energy:    parseFloat(energy.toFixed(3)),
      revenue:   parseFloat(revenue.toFixed(3)),
    });
  }

  console.log(`[Dashboard/trends] ${accepted.length} workloads → ${points.length} buckets`);
  res.json(points);
});

// GET /api/schedule/dashboard/workload-status
router.get('/dashboard/workload-status', requireAuth, (req, res) => {
  // Always count pending uploads regardless of whether scheduling has run
  const pending = db.workloads
    .filter(b => b.status === 'pending')
    .reduce((s, b) => s + b.workloads.length, 0);

  if (db.scheduleResults.length === 0) {
    return res.json({ total: pending, scheduled: 0, rejected: 0, preempted: 0, pending });
  }

  const latest = db.scheduleResults[db.scheduleResults.length - 1];
  const s      = latest.summary;
  const data   = {
    total:     (s.total ?? 0) + pending,
    scheduled: s.accepted  ?? 0,
    rejected:  s.rejected  ?? 0,
    preempted: s.preempted ?? 0,
    pending,
  };
  console.log('[Dashboard/workload-status]', data);
  res.json(data);
});

// ─── SCHEDULE ROUTES ──────────────────────────────────────────────────────────

// Run scheduling on a batch
router.post('/run/:batchId', requireAuth, (req, res) => {
  const batch = db.workloads.find(w => w.id === req.params.batchId);
  if (!batch) return res.status(404).json({ error: 'Batch not found' });

  const { results, summary } = scheduleWorkloads(batch.workloads, db.resources);

  const outputFilename = `output_${batch.id}.json`;
  saveFile(outputFilename, JSON.stringify({ batchId: batch.id, summary, results }, null, 2));

  const scheduleEntry = {
    id: uuidv4(),
    batchId: batch.id,
    filename: batch.filename,
    inputFileUrl: batch.fileUrl,
    outputFileUrl: getFileUrl(outputFilename),
    results,
    summary,
    scheduledAt: new Date().toISOString(),
  };

  db.scheduleResults.push(scheduleEntry);
  batch.status = 'scheduled';

  // Persist to Supabase (fire-and-forget)
  persistScheduleRun(scheduleEntry);

  console.log('[Scheduler] Batch', batch.id, 'done:', summary);
  res.json(scheduleEntry);
});

// Get all schedule results
router.get('/', requireAuth, (req, res) => {
  res.json(db.scheduleResults);
});

// Get latest schedule result
router.get('/latest', requireAuth, (req, res) => {
  if (db.scheduleResults.length === 0) return res.json(null);
  res.json(db.scheduleResults[db.scheduleResults.length - 1]);
});

// Dashboard stats (legacy)
router.get('/stats/overview', requireAuth, (req, res) => {
  const totalWorkloads = db.workloads.reduce((s, b) => s + b.workloads.length, 0);
  const totalRevenue = db.scheduleResults.reduce((s, r) => s + parseFloat(r.summary?.totalRevenue || 0), 0);
  const totalEnergy  = db.scheduleResults.reduce((s, r) => s + parseFloat(r.summary?.totalEnergy  || 0), 0);
  const accepted     = db.scheduleResults.reduce((s, r) => s + (r.summary?.accepted || 0), 0);
  res.json({
    totalWorkloads,
    activeServers: db.resources.servers,
    totalRevenue: totalRevenue.toFixed(2),
    totalEnergy:  totalEnergy.toFixed(2),
    accepted,
    batches: db.scheduleResults.length,
  });
});

// GET /api/schedule/export/:id — download results as CSV (same columns as website table)
router.get('/export/:id', requireAuth, (req, res) => {
  const entry = req.params.id === 'latest'
    ? db.scheduleResults[db.scheduleResults.length - 1]
    : db.scheduleResults.find(s => s.id === req.params.id);

  if (!entry) return res.status(404).json({ error: 'Not found' });

  const headers = ['Workload ID','CPU','Memory (GB)','Server','Status','Priority','Price ($)','Energy Cost','Profit','Start Time','End Time','Reason'];
  const rows = entry.results.map(r => [
    r.workloadId,
    r.cpu,
    r.memory,
    r.server,
    r.status,
    r.priority,
    r.predictedPrice ?? r.revenue ?? 0,
    r.energyCost,
    r.profit,
    r.startTime !== '-' ? new Date(r.startTime).toLocaleString() : '-',
    r.endTime   !== '-' ? new Date(r.endTime).toLocaleString()   : '-',
    r.reason,
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const filename = `schedule_${entry.scheduledAt.slice(0,10)}_${entry.id.slice(0,8)}.csv`;
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// Get specific schedule result (keep last — /:id catches everything)
router.get('/:id', requireAuth, (req, res) => {
  const entry = db.scheduleResults.find(s => s.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  res.json(entry);
});

export default router;
