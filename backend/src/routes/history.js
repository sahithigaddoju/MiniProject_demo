import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  // The latest schedule result is always the authoritative merged result.
  // After emergency injection it replaces the previous entry (same batchId = anchor batch).
  // So we look up by batchId first, then fall back to the latest result for that batch.
  const latest = db.scheduleResults.length > 0
    ? db.scheduleResults[db.scheduleResults.length - 1]
    : null;

  const history = db.workloads.map(batch => {
    // Prefer an exact batchId match; if none, check if the latest result covers this batch
    const result =
      db.scheduleResults.find(r => r.batchId === batch.id) ||
      (latest?.batchId === batch.id ? latest : null);

    return {
      id:            batch.id,
      filename:      batch.filename,
      uploadedAt:    batch.uploadedAt,
      status:        batch.status,
      isEmergency:   batch.isEmergency || result?.isEmergency || false,
      workloadCount: batch.workloads.length,
      inputFileUrl:  batch.fileUrl,
      outputFileUrl: result?.outputFileUrl || null,
      summary:       result?.summary       || null,
      scheduleId:    result?.id            || null,
    };
  });

  // Only return batches that have been scheduled (hide pure-pending batches from history)
  res.json(history.filter(h => h.status === 'scheduled').reverse());
});

export default router;
