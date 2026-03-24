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

// POST /api/upload/emergency — inject a single emergency workload and schedule immediately
router.post('/emergency', requireAuth, (req, res) => {
  const w = req.body.workload;
  if (!w || !w.id || !w.cpu || !w.memory || !w.duration) {
    return res.status(400).json({ error: 'Missing required workload fields' });
  }

  const workload = normalizeCanonical(w, true);
  const batchId  = uuidv4();
  const entry    = {
    id:          batchId,
    filename:    `emergency_${w.id}.json`,
    storedName:  null,
    fileUrl:     null,
    workloads:   [workload],
    uploadedAt:  new Date().toISOString(),
    isEmergency: true,
    status:      'pending',
  };
  db.workloads.push(entry);

  const { results, summary } = scheduleWorkloads([workload], db.resources);
  const outputFilename = `output_${batchId}.json`;
  saveFile(outputFilename, JSON.stringify({ batchId, summary, results }, null, 2));

  db.scheduleResults.push({
    id:           uuidv4(),
    batchId,
    filename:     entry.filename,
    inputFileUrl: null,
    outputFileUrl:getFileUrl(outputFilename),
    results,
    summary,
    scheduledAt:  new Date().toISOString(),
  });
  entry.status = 'scheduled';

  console.log('[Emergency] Injected & scheduled:', w.id, summary);
  res.json({ message: 'Emergency workload injected and scheduled', batchId, summary });
});

export default router;
