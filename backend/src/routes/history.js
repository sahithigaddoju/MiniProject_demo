import express from 'express';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const history = db.workloads.map(batch => {
    const result = db.scheduleResults.find(r => r.batchId === batch.id);
    return {
      id: batch.id,
      filename: batch.filename,
      uploadedAt: batch.uploadedAt,
      status: batch.status,
      isEmergency: batch.isEmergency,
      workloadCount: batch.workloads.length,
      inputFileUrl: batch.fileUrl,
      outputFileUrl: result?.outputFileUrl || null,
      summary: result?.summary || null,
      scheduleId: result?.id || null,
    };
  });
  res.json(history.reverse());
});

export default router;
