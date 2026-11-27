import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { verifyTurnstile } from '../middleware/turnstile.js';

const createTicketSchema = z.object({
  customerName: z.string().min(2).max(120),
  customerEmail: z.union([z.string().email().max(255), z.literal('')]).optional().default(''),
  category: z.string().min(2).max(64).optional().default('Technical Support'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Medium'),
  subject: z.string().min(3).max(255),
  description: z.string().min(5).max(2000)
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']).optional(),
  assignedAgent: z.string().max(120).optional().nullable(),
  resolutionNotes: z.string().max(1000).optional().nullable()
});

export function createTicketsRouter(db) {
  const router = Router();

  router.post('/', verifyTurnstile(), validateBody(createTicketSchema), async (req, res) => {
    const ticket = await db.createTicket({
      id: `TKT-${crypto.randomInt(1000, 9999)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
      ...req.body,
      status: 'open',
      assignedAgent: null,
      resolutionNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, ticket });
  });

  router.get('/', authenticateToken(db), authorizeRoles('admin', 'agent'), async (req, res) => {
    res.json(await db.listTickets());
  });

  router.patch('/:id', authenticateToken(db), authorizeRoles('admin', 'agent'), validateBody(updateTicketSchema), async (req, res) => {
    const updated = await db.updateTicket(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Support ticket not found' });
    await db.createAuditLog({
      id: `AUD-${crypto.randomUUID().slice(0, 8)}`,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'TICKET_UPDATED',
      resource: `tickets/${req.params.id}`,
      details: req.body,
      ipAddress: req.ip
    });
    res.json({ success: true, ticket: updated });
  });

  router.delete('/:id', authenticateToken(db), authorizeRoles('admin'), async (req, res) => {
    const ok = await db.deleteTicket(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Support ticket not found' });
    res.json({ success: true });
  });

  return router;
}
