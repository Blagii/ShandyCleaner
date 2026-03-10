import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const SECRET_KEY = process.env.JWT_SECRET || 'shandy-cleaner-secret-key-change-me';

export const authMiddleware = async (req: any, res: any, next: any) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token || token === 'null' || token === 'undefined') {
    // console.log('Auth middleware: No valid token found');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    const user = await db.getUserById(decoded.id);
    if (!user) {
      console.log('Auth middleware: User not found for token');
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (e) {
    // console.log('Auth middleware: Invalid token', e);
    res.status(401).json({ error: 'Invalid token' });
  }
};
