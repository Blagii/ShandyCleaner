import express from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { sendAccountUpdateEmail } from '../services/emailService';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

// Update API Key
router.put('/me/api-key', async (req: any, res) => {
  const { apiKey, provider } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is required' });
  }

  const validProviders = ['gemini', 'anthropic'];
  const targetProvider = provider || 'gemini'; // Default to gemini for backward compatibility if needed

  if (!validProviders.includes(targetProvider)) {
    return res.status(400).json({ error: 'Invalid provider' });
  }

  try {
    await db.updateUserApiKey(req.user.id, targetProvider as 'gemini' | 'anthropic', apiKey);
    res.json({ message: 'API Key updated' });
  } catch (error) {
    console.error('Failed to update API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Get API Keys
router.get('/me/api-keys', async (req: any, res) => {
  try {
    const apiKeys = await db.getUserApiKeys(req.user.id);
    res.json({ apiKeys });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

router.get('/', isAdmin, async (req, res) => {
  const users = (await db.getUsers()).map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json(users);
});

router.post('/', isAdmin, async (req, res) => {
  const { username, password, role, email } = req.body;
  
  if (!username || !password || !role || !email) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const existing = await db.getUserByUsername(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: uuidv4(),
    username,
    email,
    passwordHash: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };

  await db.createUser(newUser);
  res.status(201).json({ id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email });
});

router.put('/:id', isAdmin, async (req: any, res) => {
  const { id } = req.params;
  const { username, password, role, email } = req.body;
  
  const user = await db.getUserById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const changes: string[] = [];
  const updates: Partial<User> = {};

  if (username && username !== user.username) {
    const existing = await db.getUserByUsername(username);
    if (existing && existing.id !== id) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    updates.username = username;
    changes.push(`Username changed to ${username}`);
  }

  if (email && email !== user.email) {
    updates.email = email;
    changes.push(`Email changed to ${email}`);
  }

  if (role && role !== user.role) {
    updates.role = role;
    changes.push(`Role changed to ${role}`);
  }

  if (password) {
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }
    updates.passwordHash = await bcrypt.hash(password, 10);
    changes.push('Password updated');
  }

  if (Object.keys(updates).length > 0) {
    await db.updateUser(id, updates);
    
    // Send email notification if there are changes and user has an email
    const recipientEmail = updates.email || user.email;
    if (recipientEmail && changes.length > 0) {
      // Don't await email sending to avoid blocking response
      sendAccountUpdateEmail(recipientEmail, updates.username || user.username, changes)
        .catch(err => console.error('Failed to send update email:', err));
    }
  }

  const updatedUser = await db.getUserById(id);
  res.json({ 
    id: updatedUser?.id, 
    username: updatedUser?.username, 
    role: updatedUser?.role, 
    email: updatedUser?.email 
  });
});

router.delete('/:id', isAdmin, async (req: any, res) => {
  const { id } = req.params;
  
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const deleted = await db.deleteUser(id);
  if (!deleted) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ message: 'User deleted' });
});

export default router;
