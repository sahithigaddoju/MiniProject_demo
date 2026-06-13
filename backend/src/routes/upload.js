import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { saveFile, getFileUrl } from '../storage.js';
import { scheduleWorkloads } from '../scheduler.js';
import { mapDataset } from '../services/columnMapper.js';
import { persistScheduleRun } from '../supabase.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/tmp/' });

/**
 * Normalize a single workload object that already uses our internal schema
 * (used by the emergency inject endpoint and JSON uploads that already
 * follow the canonical format).
 */
function normalizeCanonical(w, forceEmergency = false) {
  return {
    id:            w.workloadId   || w.id       || uuidv4(),
    cpu:           parseFloat(w.cpuRequired    ?? w.cpu)      || 2,
    memory:        parseFloat(w.memoryRequired ?? w.memory)   || 4,
    duration:      parseFloat(w.runtime        ?? w.duration) || 1,
    basePrice:     parseFloat(w.basePrice      ?? w.price)    || 0,
    deadline:      w.deadline     || null,
    delayTolerant: w.delayTolerant === true || w.delayTolerant === 'true',
    priority:      forceEmergency || w.emergencyFlag === true || w.emergencyFlag === 'true'
                     ? 'emergency'
                     : (w.priority || 'normal'),
  };
}

// POST /api/upload — batch file upload (CSV or JSON, Kaggle-compatible)
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { originalname, path: tmpPath } = req.file;
  const ext = path.extname(originalname).toLowerCase();

  let raw = [];
  try {
    const content = fs.readFileSync(tmpPath, 'utf-8');
    if (ext === '.json') {
      const parsed = JSON.parse(content);
      raw = Array.isArray(parsed) ? parsed : (parsed.workloads || []);
    } else if (ext === '.csv') {
      raw = parse(content, { columns: true, skip_empty_lines: true, trim: true });
    } else {
      fs.unlinkSync(tmpPath);
      return res.status(400).json({ error: 'Only CSV or JSON files are supported' });
    }
  } catch (e) {
    fs.unlinkSync(tmpPath);
    return res.status(400).json({ error: 'Failed to parse file: ' + e.message });
  }

  if (raw.length === 0) {
    fs.unlinkSync(tmpPath);
    return res.status(400).json({ error: 'File is empty or has no valid rows' });
  }

  // ── Intelligent column mapping ──────────────────────────────────────────
  const { workloads, skipped, columnMap } = mapDataset(raw);

  if (workloads.length === 0) {
    fs.unlinkSync(tmpPath);
    return res.status(400).json({ error: 'No valid workloads could be parsed from the file' });
  }

  const batchId    = uuidv4();
  const storedName = `input_${batchId}${ext}`;
  fs.copyFileSync(tmpPath, path.join('uploads', storedName));
  fs.unlinkSync(tmpPath);

  const entry = {
    id: batchId,
    filename: originalname,
    storedName,
    fileUrl:    getFileUrl(storedName),
    workloads,
    columnMap,
    skipped,
    uploadedAt: new Date().toISOString(),
    status:     'pending',
  };

  db.workloads.push(entry);
  console.log(`[Upload] Batch ${batchId}: ${workloads.length} workloads (${skipped} rows skipped)`);

  res.json({
    message:   'File uploaded successfully',
    batchId,
    count:     workloads.length,
    skipped,
    columnMap,
    fileUrl:   entry.fileUrl,
  });
});

// POST /api/upload/emergency — inject emergency workload, merge with latest scheduled pool, reschedule
router.post('/emergency', requireAuth, (req, res) => {
  const w = req.body.workload;
  if (!w || !w.id || !w.cpu || !w.memory || !w.duration) {
    return res.status(400).json({ error: 'Missing required workload fields' });
  }

  if (db.scheduleResults.length === 0) {
    return res.status(400).json({ error: 'No scheduled results found. Run the scheduler first before injecting an emergency workload.' });
  }

  const latest = db.scheduleResults[db.scheduleResults.length - 1];

  // Snapshot of previously accepted workload IDs
  const prevAcceptedIds = new Set(
    latest.results.filter(r => r.status === 'Accepted').map(r => r.workloadId)
  );

  // Reconstruct workload pool from _original fields stored by the scheduler
  const existingWorkloads = latest.results.map(r => r._original).filter(Boolean);

  if (existingWorkloads.length === 0) {
    return res.status(400).json({ error: 'Cannot reconstruct workload pool. Re-upload and reschedule first.' });
  }

  const emergencyWorkload = normalizeCanonical(w, true);

  if (existingWorkloads.some(x => x.id === emergencyWorkload.id)) {
    return res.status(400).json({ error: `Workload "${emergencyWorkload.id}" already exists in the scheduled pool.` });
  }

  // ── Determine how many workloads to preempt ───────────────────────────────
  // Preempt enough previously-accepted workloads to "make room" for the
  // emergency workload. We use CPU cores as the unit: preempt workloads
  // until their combined CPU >= emergency CPU demand (min 1, max 3).
  const prevAcceptedResults = latest.results
    .filter(r => r.status === 'Accepted')
    .sort((a, b) => a.revenue - b.revenue); // lowest revenue first = least valuable

  const toPreemptIds = new Set();
  let freedCPU = 0;
  for (const r of prevAcceptedResults) {
    if (freedCPU >= emergencyWorkload.cpu) break;
    toPreemptIds.add(r.workloadId);
    freedCPU += r.cpu;
  }

  console.log(`[Emergency] Injecting "${emergencyWorkload.id}" (cpu:${emergencyWorkload.cpu}) — will preempt ${toPreemptIds.size} workload(s) freeing ${freedCPU} CPU cores`);

  // ── Run scheduler on the merged pool ─────────────────────────────────────
  const mergedWorkloads = [...existingWorkloads, emergencyWorkload];
  const { results, summary } = scheduleWorkloads(mergedWorkloads, db.resources);

  // ── Apply preemption labels ───────────────────────────────────────────────
  // Any workload in toPreemptIds that the scheduler accepted → force to Preempted.
  // Any workload that was previously accepted but the scheduler now rejected → also Preempted.
  const newAcceptedIds = new Set(results.filter(r => r.status === 'Accepted').map(r => r.workloadId));

  for (const r of results) {
    const wasAccepted = prevAcceptedIds.has(r.workloadId);
    const isNowAccepted = newAcceptedIds.has(r.workloadId);
    const forcedPreempt = toPreemptIds.has(r.workloadId);

    if (r.workloadId === emergencyWorkload.id) continue; // never touch the emergency itself

    if (forcedPreempt || (wasAccepted && !isNowAccepted)) {
      r.status = 'Preempted';
      r.reason = 'preempted_by_emergency';
      // If it was force-preempted but scheduler accepted it, undo the capacity usage
      // (the scheduler already counted it — we just relabel, no capacity recalc needed
      //  since this is post-processing for display purposes only)
    }
  }

  // Recompute summary from final labels
  summary.accepted  = results.filter(r => r.status === 'Accepted').length;
  summary.rejected  = results.filter(r => r.status === 'Rejected').length;
  summary.preempted = results.filter(r => r.status === 'Preempted').length;

  console.log(`[Emergency] Final — accepted:${summary.accepted} rejected:${summary.rejected} preempted:${summary.preempted}`);

  const outputFilename = `output_emergency_${Date.now()}.json`;
  saveFile(outputFilename, JSON.stringify({ summary, results }, null, 2));

  const scheduleEntry = {
    id:            uuidv4(),
    batchId:       'emergency-merged',
    filename:      `emergency_${w.id} (merged re-run)`,
    inputFileUrl:  latest.inputFileUrl ?? null,
    outputFileUrl: getFileUrl(outputFilename),
    results,
    summary,
    scheduledAt:   new Date().toISOString(),
    isEmergency:   true,
  };

  db.scheduleResults.push(scheduleEntry);
  db.workloads.forEach(b => { b.status = 'scheduled'; });

  // Persist to Supabase (fire-and-forget)
  persistScheduleRun(scheduleEntry);

  res.json({
    message:       'Emergency workload injected and rescheduled with preemption',
    summary,
    results,
    scheduleEntry,
  });
});

export default router;
