import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes, { createDefaultAdmin } from '../server/routes/auth';
import usersRoutes from '../server/routes/users';
import statsRoutes from '../server/routes/stats';
import systemRoutes from '../server/routes/system';
import configRoutes from '../server/routes/config';
import historyRoutes from '../server/routes/history';
import { authMiddleware } from '../server/middleware/auth';
import { initDb } from '../server/database';
import { initTemplates } from '../server/services/templateService';

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json());
app.use(cookieParser());

let isInitialized = false;

app.use(async (req, res, next) => {
  if (!isInitialized) {
    try {
      await initDb();
      await createDefaultAdmin();
      await initTemplates();
      isInitialized = true;
    } catch (error) {
      console.error('Initialization error:', error);
      return next(error);
    }
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/system', authMiddleware, systemRoutes);
app.use('/api/config', configRoutes);
app.use('/api/history', authMiddleware, historyRoutes);

// Export the Vercel app
export default app;
