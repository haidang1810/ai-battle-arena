import { Router } from 'express';
import { getModelStats } from '../services/stats-service.js';

const router = Router();

/** Get aggregated stats for all models */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await getModelStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

export default router;
