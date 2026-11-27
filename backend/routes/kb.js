import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const kbSchema = z.object({
  category: z.string().min(2).max(64),
  keywords: z.array(z.string().min(1).max(40)).min(1),
  title: z.string().min(3).max(255),
  content: z.string().min(5).max(2000)
});

export function createKbRouter(db) {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await db.listKb());
  });

  router.post('/', authenticateToken(db), authorizeRoles('admin'), validateBody(kbSchema), async (req, res) => {
    const item = await db.createKb({ id: `kb-${crypto.randomUUID().slice(0, 6)}`, ...req.body });
    res.status(201).json(item);
  });

  router.delete('/:id', authenticateToken(db), authorizeRoles('admin'), async (req, res) => {
    const ok = await db.deleteKb(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Knowledge base article not found' });
    res.json({ success: true });
  });

  return router;
}
