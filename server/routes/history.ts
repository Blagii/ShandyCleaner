import express from 'express';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get history
router.get('/', async (req: any, res) => {
  try {
    const history = await db.getHistory(req.user.id);
    res.json(history);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Add history item
router.post('/', async (req: any, res) => {
  const { mode, originalCode, cleanedCode, fileName } = req.body;
  
  if (!mode || !originalCode || !cleanedCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const item = {
      id: uuidv4(),
      user_id: req.user.id,
      mode,
      original_code: originalCode,
      cleaned_code: cleanedCode,
      file_name: fileName,
      created_at: new Date().toISOString()
    };
    
    await db.addHistory(item);
    res.status(201).json(item);
  } catch (error) {
    console.error('Failed to save history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// Clear history
router.delete('/', async (req: any, res) => {
  try {
    await db.clearHistory(req.user.id);
    res.json({ message: 'History cleared' });
  } catch (error) {
    console.error('Failed to clear history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;
