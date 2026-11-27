import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { hashPassword, verifyPassword, sanitizeUser } from '../utils/crypto.js';
import { authenticateToken, authorizeRoles, optionalAuth, signToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createRateLimiter } from '../middleware/rateLimit.js';

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128)
});

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  role: z.enum(['admin', 'agent', 'customer']).optional().default('customer')
});

export function createAuthRouter(db, options = {}) {
  const router = Router();
  const limiter = createRateLimiter({ windowMs: 60_000, max: options.authRateLimitMax ?? 20 });

  router.post('/login', limiter, validateBody(loginSchema), async (req, res) => {
    const user = await db.findUserByEmail(req.body.email);
    if (!user || !user.isActive || !verifyPassword(req.body.password, user.passwordHash)) {
      await db.createAuditLog({
        id: `AUD-${crypto.randomUUID().slice(0, 8)}`,
        userEmail: req.body.email.toLowerCase(),
        action: 'AUTH_LOGIN_FAILED',
        resource: 'auth',
        ipAddress: req.ip
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const safe = sanitizeUser(user);
    await db.createAuditLog({
      id: `AUD-${crypto.randomUUID().slice(0, 8)}`,
      userId: safe.id,
      userEmail: safe.email,
      userRole: safe.role,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: 'auth',
      ipAddress: req.ip
    });
    res.json({ token: signToken(safe), user: safe });
  });

  router.post('/register', limiter, optionalAuth(db), validateBody(registerSchema), async (req, res) => {
    const existingUsers = await db.listUsers();
    const isBootstrap = existingUsers.length === 0;
    const requestedRole = req.body.role || 'customer';

    // Non-customers (admin/agent) require admin authorization after bootstrap
    if (!isBootstrap && requestedRole !== 'customer' && req.user?.role !== 'admin') {
      return res.status(req.user ? 403 : 401).json({ error: 'Only administrators can assign agent or admin roles.' });
    }

    if (await db.findUserByEmail(req.body.email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = isBootstrap ? 'admin' : requestedRole;
    const user = await db.createUser({
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      email: req.body.email.toLowerCase(),
      passwordHash: hashPassword(req.body.password),
      fullName: req.body.fullName,
      role: assignedRole
    });

    res.status(201).json({ user, token: signToken(user) });
  });

  router.get('/me', authenticateToken(db), (req, res) => {
    res.json({ user: req.user });
  });

  router.get('/users', authenticateToken(db), authorizeRoles('admin'), async (req, res) => {
    res.json(await db.listUsers());
  });

  return router;
}
