import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { validateBody } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { verifyTurnstile } from '../middleware/turnstile.js';
import { PERSONAS, runSuperBot } from '../utils/superBotEngine.js';

const chatSchema = z.object({
  message: z.string().max(1000).optional().default(''),
  conversationId: z.string().max(64).optional().nullable(),
  persona: z.enum(PERSONAS).optional().default('Support Specialist')
});

const feedbackSchema = z.object({
  messageId: z.string().min(1).max(64),
  rating: z.union([z.literal(1), z.literal(-1)])
});

export function createChatRouter(db) {
  const router = Router();

  router.post('/', optionalAuth(db), verifyTurnstile(), validateBody(chatSchema), async (req, res) => {
    const convId = req.body.conversationId || `conv-${crypto.randomUUID().slice(0, 8)}`;
    const title = req.body.message ? req.body.message.slice(0, 48) : 'New Support Session';

    await db.upsertConversation({
      id: convId,
      userId: req.user?.id || null,
      persona: req.body.persona,
      title
    });

    if (req.body.message) {
      await db.addMessage({
        id: `msg-${crypto.randomUUID().slice(0, 8)}`,
        conversationId: convId,
        sender: 'user',
        text: req.body.message
      });
    }

    const botResult = await runSuperBot({
      message: req.body.message,
      persona: req.body.persona,
      db
    });

    const botMsg = await db.addMessage({
      id: `msg-${crypto.randomUUID().slice(0, 8)}`,
      conversationId: convId,
      sender: 'bot',
      text: botResult.text,
      intent: botResult.intent
    });

    res.json({
      conversationId: convId,
      messageId: botMsg.id,
      reply: botResult.text,
      intent: botResult.intent,
      persona: botResult.persona,
      action: botResult.action || null,
      card: botResult.card || null,
      suggestions: botResult.suggestions || []
    });
  });

  router.post('/feedback', validateBody(feedbackSchema), async (req, res) => {
    const updated = await db.rateMessage(req.body.messageId, req.body.rating);
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true, message: updated });
  });

  router.get('/conversations', optionalAuth(db), async (req, res) => {
    const list = await db.listConversations(req.user?.role === 'customer' ? req.user.id : null);
    res.json(list);
  });

  router.get('/conversations/:id/messages', async (req, res) => {
    res.json(await db.listMessages(req.params.id));
  });

  return router;
}
