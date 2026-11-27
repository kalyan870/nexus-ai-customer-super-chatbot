import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

export function createOrdersRouter(db) {
  const router = Router();

  router.get('/', authenticateToken(db), authorizeRoles('admin', 'agent'), async (req, res) => {
    res.json(await db.listOrders());
  });

  router.get('/:id', async (req, res) => {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({
      id: order.id,
      productName: order.productName,
      status: order.status,
      trackingNumber: order.trackingNumber,
      eta: order.eta
    });
  });

  return router;
}
