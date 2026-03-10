import express from 'express';
import { db } from '../db';
import { authMiddleware } from '../middleware/auth';
import { sendMaintenanceAlert } from '../services/emailService';
import { templateService } from '../services/templateService';

const router = express.Router();

// Get all email templates (admin only)
router.get('/email-templates', async (req, res) => {
  console.log('GET /email-templates called');
  // @ts-ignore
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const templates = await templateService.getTemplates();
  console.log('Returning templates:', templates.length);
  res.json(templates);
});

// Update email template (admin only)
router.put('/email-templates/:id', async (req, res) => {
  // @ts-ignore
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { id } = req.params;
  const { subject, html } = req.body;

  if (!subject || !html) {
    return res.status(400).json({ error: 'Subject and HTML content are required' });
  }

  const updated = await templateService.updateTemplate(id, { subject, html });
  if (!updated) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(updated);
});

// Send maintenance alert (admin only)
router.post('/maintenance-alert', async (req, res) => {
  // @ts-ignore - user is added by authMiddleware
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // In a real app, we would iterate over all users with emails.
  // For this demo, we'll just log it and maybe send to the admin themselves or a test list.
  const allUsers = await db.getUsers();
  const users = allUsers.filter(u => u.email);
  
  if (users.length === 0) {
    return res.json({ message: 'No users with email found to notify.' });
  }

  console.log(`Sending maintenance alert to ${users.length} users...`);
  
  // Send in parallel (limit concurrency in production)
  const promises = users.map(user => 
    sendMaintenanceAlert(user.email!, message)
      .catch(err => console.error(`Failed to send to ${user.email}:`, err))
  );

  await Promise.all(promises);

  res.json({ message: `Alert sent to ${users.length} users.` });
});

export default router;
