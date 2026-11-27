import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import { securityGuardrails } from './middleware/guardrails.js';
import { createAuthRouter } from './routes/auth.js';
import { createChatRouter } from './routes/chat.js';
import { createTicketsRouter } from './routes/tickets.js';
import { createOrdersRouter } from './routes/orders.js';
import { createKbRouter } from './routes/kb.js';
import { createAdminRouter } from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(db, options = {}) {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.allowedOrigins.includes(origin) ||
        (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) ||
        /^https:\/\/[a-z0-9.-]+\.(vercel\.app|netlify\.app|pages\.dev|workers\.dev|github\.io|web\.app|firebaseapp\.com)$/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }));

  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createRateLimiter({ windowMs: 60_000, max: options.apiRateLimitMax ?? 200 }));
  app.use('/api', securityGuardrails(db));

  const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
  }

  app.get('/api/status', async (req, res) => {
    const stats = await db.getStats();
    res.json({
      status: 'online',
      system: 'NEXUS AI Customer Super Chatbot',
      version: '1.0.0',
      database: db.mode,
      authMode: config.clerkSecretKey ? 'clerk+jwt' : 'local-jwt',
      turnstileEnabled: Boolean(config.cfTurnstileSecret),
      timestamp: new Date().toISOString(),
      stats
    });
  });

  app.use('/api/auth', createAuthRouter(db, options));
  app.use('/api/chat', createChatRouter(db));
  app.use('/api/tickets', createTicketsRouter(db));
  app.use('/api/orders', createOrdersRouter(db));
  app.use('/api/kb', createKbRouter(db));
  app.use('/api', createAdminRouter(db));

  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  app.get('*', (req, res) => {
    const indexHtml = path.join(FRONTEND_DIST, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.json({ message: 'NEXUS AI Customer Super Chatbot API Active.' });
    }
  });

  app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') return res.status(403).json({ error: 'CORS policy: Origin not allowed.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON payload.' });
    res.status(err.status || 500).json({ error: config.isProd ? 'Internal server error' : err.message });
  });

  return app;
}
