import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes, { createDefaultAdmin } from './server/routes/auth';
import usersRoutes from './server/routes/users';
import statsRoutes from './server/routes/stats';
import systemRoutes from './server/routes/system';
import configRoutes from './server/routes/config';
import historyRoutes from './server/routes/history';
import { authMiddleware } from './server/middleware/auth';
import { initDb } from './server/database';
import { initTemplates, templateService } from './server/services/templateService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  await initDb();
  await createDefaultAdmin();
  await initTemplates();
  
  const app = express();
  app.set('trust proxy', 1); // Trust first proxy
  const PORT = process.env.PORT || 3000;

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now as it conflicts with Vite/React scripts
    crossOriginEmbedderPolicy: false,
  }));

  app.use(express.json());
  app.use(cookieParser());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', authMiddleware, usersRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/system', authMiddleware, systemRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/history', authMiddleware, historyRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
