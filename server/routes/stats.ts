import express from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get global stats
router.get('/', async (req, res) => {
  const stats = await db.getStats();
  res.json(stats);
});

// Increment stats (publicly accessible for now, or could be protected)
router.post('/increment', async (req, res) => {
  const { files, bytes, errors } = req.body;
  
  if (typeof files !== 'number' || typeof bytes !== 'number' || typeof errors !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const newStats = await db.incrementStats(files, bytes, errors);
  res.json(newStats);
});

// Increment visits
router.post('/visit', async (req, res) => {
  const newStats = await db.incrementVisits();
  res.json(newStats);
});

// Reset stats (admin only)
router.post('/reset', authMiddleware, async (req, res) => {
  // @ts-ignore - user is added by authMiddleware
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  console.log('Server: /api/stats/reset called by admin');
  const newStats = await db.resetStats();
  res.json(newStats);
});

export default router;
