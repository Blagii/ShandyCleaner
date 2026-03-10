import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from '../db';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from 'express-rate-limit';
import { sendWelcomeEmail, sendVerificationCode } from '../services/emailService';
import dns from 'dns';
import util from 'util';
import { authMiddleware } from '../middleware/auth';

const resolveMx = util.promisify(dns.resolveMx);

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'shandy-cleaner-secret-key-change-me';

// In-memory store for verification codes (email -> { code, expires })
const verificationCodes = new Map<string, { code: string, expires: number }>();

// Warn if using default secret in production
if (process.env.NODE_ENV === 'production' && SECRET_KEY === 'shandy-cleaner-secret-key-change-me') {
  console.warn('WARNING: Using default JWT_SECRET in production. Please set JWT_SECRET environment variable.');
}

// Rate limiter for login/register to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
  }
});

// Initialize default admin user if none exists
export const createDefaultAdmin = async () => {
  try {
    const admin = await db.getUserByUsername('admin');
    if (!admin) {
      // Default password is 'admin' but should be changed immediately
      const hashedPassword = await bcrypt.hash('admin', 10);
      await db.createUser({
        id: uuidv4(),
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      console.log('Default admin user created (admin/admin)');
    }
  } catch (error) {
    console.error('Failed to create default admin:', error);
  }
};

router.post('/send-verification', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check if domain has MX records (basic existence check)
  const domain = email.split('@')[1];
  try {
    const addresses = await resolveMx(domain);
    if (!addresses || addresses.length === 0) {
      return res.status(400).json({ error: 'Invalid email domain (no mail server found)' });
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid email domain (DNS lookup failed)' });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  verificationCodes.set(email, { code, expires });

  try {
    console.log(`[DEV] Verification Code: ${code} for email: ${email}`);
    await sendVerificationCode(email, code);
    res.json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

router.post('/register', authLimiter, async (req, res) => {
  const { username, password, email, code } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  // Verify code if provided (enforce it for email users)
  if (email) {
    if (!code) {
      return res.status(400).json({ error: 'Verification code required' });
    }

    const stored = verificationCodes.get(email);
    if (!stored) {
      return res.status(400).json({ error: 'Verification code not found or expired. Please request a new one.' });
    }

    if (Date.now() > stored.expires) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Clean up code
    verificationCodes.delete(email);
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
    role: 'editor', // Default role for public registration
    createdAt: new Date().toISOString()
  };

  await db.createUser(newUser);
  
  // Send welcome email if email is provided
  if (email) {
    // Fire and forget - don't block response
    sendWelcomeEmail(email, username).catch(err => console.error('Failed to send welcome email:', err));
  }
  
  // Auto login after register
  const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, SECRET_KEY, { expiresIn: '1h' });
  
  res.cookie('token', token, { 
    httpOnly: true, 
    secure: true, // Required for SameSite=None
    sameSite: 'none', // Required for cross-origin iframe
    maxAge: 3600000 // 1 hour
  });
  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email } });
});

router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  const user = await db.getUserByUsername(username);
  if (!user) {
    // Use generic error message to prevent username enumeration
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
  
  res.cookie('token', token, { 
    httpOnly: true, 
    secure: true, // Required for SameSite=None
    sameSite: 'none', // Required for cross-origin iframe
    maxAge: 3600000 // 1 hour
  });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'none' 
  });
  res.json({ message: 'Logged out' });
});

router.get('/me', authMiddleware, (req: any, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

export default router;
