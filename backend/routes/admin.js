import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

export function createAdminRouter(db) {
  const router = Router();

  router.get('/analytics', authenticateToken(db), authorizeRoles('admin', 'agent'), async (req, res) => {
    const stats = await db.getStats();
    res.json({ ...stats, databaseMode: db.mode });
  });

  router.get('/audit-logs', authenticateToken(db), authorizeRoles('admin'), async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    res.json(await db.listAuditLogs(limit));
  });

  return router;
}
