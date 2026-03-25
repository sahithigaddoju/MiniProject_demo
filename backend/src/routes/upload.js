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

  // ── Require a prior scheduling run ───────────────────────────────────────
  if (db.scheduleResults.length === 0) {
    return res.status(400).json({ error: 'No scheduled results found. Run the scheduler first before injecting an emergency workload.' });
  }

  const latest = db.scheduleResults[db.scheduleResults.length - 1];

  // ── Reconstruct full workload pool from the latest result's _original fields ──
  // Every result row carries _original (set by scheduler.js) so we can fully
  // re-run the scheduler with correct basePrice, duration, delayTolerant etc.
  const existingWorkloads = latest.results
    .map(r => r._original)
    .filter(Boolean);

  if (existingWorkloads.length === 0) {
    return res.status(400).json({ error: 'Cannot reconstruct workload pool from latest result. Re-upload and reschedule first.' });
  }

  // ── Build and add the emergency workload ─────────────────────────────────
  const emergencyWorkload = normalizeCanonical(w, true);

  // Guard against duplicate injection
  const alreadyExists = existingWorkloads.some(x => x.id === emergencyWorkload.id);
  if (alreadyExists) {
    return res.status(400).json({ error: `Workload "${emergencyWorkload.id}" already exists in the scheduled pool.` });
  }

  const mergedWorkloads = [...existingWorkloads, emergencyWorkload];

  console.log(`[Emergency] Injecting "${emergencyWorkload.id}" — pool: ${existingWorkloads.length} existing + 1 emergency = ${mergedWorkloads.length} total`);

  // ── Re-run scheduler on the full merged pool ──────────────────────────────
  const { results, summary } = scheduleWorkloads(mergedWorkloads, db.resources);

  console.log(`[Emergency] Re-schedule — accepted: ${summary.accepted}, rejected: ${summary.rejected}, preempted: ${summary.preempted}`);

  const outputFilename = `output_emergency_${Date.now()}.json`;
  saveFile(outputFilename, JSON.stringify({ summary, results }, null, 2));

  // ── Push a new entry — keeps full history intact ──────────────────────────
  const scheduleEntry = {
    id:            uuidv4(),
    batchId:       'emergency-merged',
    filename:      `emergency_${w.id} (merged re-run)`,
    inputFileUrl:  latest.inputFileUrl  ?? null,
    outputFileUrl: getFileUrl(outputFilename),
    results,
    summary,
    scheduledAt:   new Date().toISOString(),
    isEmergency:   true,
  };

  db.scheduleResults.push(scheduleEntry);

  // Mark all workload batches as scheduled
  db.workloads.forEach(b => { b.status = 'scheduled'; });

  res.json({
    message:       'Emergency workload injected and full reschedule complete',
    summary,
    results,
    scheduleEntry,
  });
});

export default router;
