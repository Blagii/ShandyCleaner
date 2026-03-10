import express from 'express';
import { query } from '../database';

const router = express.Router();

// Store connected clients for SSE
let clients: { id: number; res: express.Response }[] = [];

// Helper to get config value
const getConfig = async (key: string, defaultValue: any) => {
  const [rows]: any = await query('SELECT setting_value FROM config WHERE setting_key = ?', [key]);
  if (rows.length > 0) {
    try {
      return JSON.parse(rows[0].setting_value);
    } catch (e) {
      return rows[0].setting_value;
    }
  }
  return defaultValue;
};

// Helper to set config value
const setConfig = async (key: string, value: any) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  await query(
    'INSERT INTO config (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
    [key, stringValue, stringValue]
  );
};

// SSE Endpoint for real-time updates
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };
  clients.push(newClient);

  // Send initial ping to keep connection alive
  res.write(`: connected\n\n`);

  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// Get all config
router.get('/', async (req, res) => {
  try {
    const [rows]: any = await query('SELECT * FROM config');
    const config: any = {};
    rows.forEach((row: any) => {
      try {
        config[row.setting_key] = JSON.parse(row.setting_value);
      } catch (e) {
        config[row.setting_key] = row.setting_value;
      }
    });
    res.json(config);
  } catch (error) {
    console.error('Failed to fetch config:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// Update config
router.put('/', async (req, res) => {
  const updates = req.body;
  try {
    for (const [key, value] of Object.entries(updates)) {
      await setConfig(key, value);
    }

    // Notify all connected clients
    clients.forEach(client => {
      client.res.write(`data: ${JSON.stringify(updates)}\n\n`);
    });

    res.json({ message: 'Configuration updated' });
  } catch (error) {
    console.error('Failed to update config:', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

export default router;
