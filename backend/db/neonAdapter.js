import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class NeonAdapter {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
    this.mode = 'neon-postgres';
  }

  async init() {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await this.pool.query(sql);

    const { rows: ordCount } = await this.pool.query('SELECT COUNT(*)::int AS c FROM orders');
    if (ordCount[0].c === 0) {
      await this.pool.query(
        `INSERT INTO orders (id, customer_email, product_name, amount_cents, status, tracking_number, eta)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        ['ORD-1001', 'alex@enterprise.com', 'NEXUS Enterprise AI Suite (Annual)', 149000, 'Shipped', '1Z999AA101928374', 'Tomorrow by 5:00 PM']
      );
    }

    const { rows: kbCount } = await this.pool.query('SELECT COUNT(*)::int AS c FROM knowledge_base');
    if (kbCount[0].c === 0) {
      await this.pool.query(
        `INSERT INTO knowledge_base (id, category, keywords, title, content)
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        ['kb-1', 'Billing & Plans', ['pricing', 'plan', 'cost', 'enterprise'], 'NEXUS AI Pricing & Enterprise Plans', 'Starter is $49/mo, Pro is $149/mo, and Enterprise includes custom SLA and 24/7 engineering support.']
      );
    }
  }

  async findUserByEmail(email) {
    const { rows } = await this.pool.query(
      `SELECT id, clerk_id AS "clerkId", email, password_hash AS "passwordHash", full_name AS "fullName", role, is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  async findUserById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, clerk_id AS "clerkId", email, full_name AS "fullName", role, is_active AS "isActive", created_at AS "createdAt"
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async createUser(u) {
    const { rows } = await this.pool.query(
      `INSERT INTO users (id, clerk_id, email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, clerk_id AS "clerkId", email, full_name AS "fullName", role, is_active AS "isActive", created_at AS "createdAt"`,
      [u.id, u.clerkId || null, u.email.toLowerCase(), u.passwordHash, u.fullName, u.role]
    );
    return rows[0];
  }

  async listUsers() {
    const { rows } = await this.pool.query(
      `SELECT id, clerk_id AS "clerkId", email, full_name AS "fullName", role, is_active AS "isActive", created_at AS "createdAt"
       FROM users ORDER BY created_at DESC`
    );
    return rows;
  }

  async listConversations(userId = null) {
    const { rows } = userId
      ? await this.pool.query(`SELECT id, user_id AS "userId", persona, title, created_at AS "createdAt", updated_at AS "updatedAt" FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC`, [userId])
      : await this.pool.query(`SELECT id, user_id AS "userId", persona, title, created_at AS "createdAt", updated_at AS "updatedAt" FROM conversations ORDER BY updated_at DESC`);
    return rows;
  }

  async getConversation(id) {
    const { rows } = await this.pool.query(`SELECT id, user_id AS "userId", persona, title, created_at AS "createdAt", updated_at AS "updatedAt" FROM conversations WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  async upsertConversation(c) {
    const { rows } = await this.pool.query(
      `INSERT INTO conversations (id, user_id, persona, title)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET persona = EXCLUDED.persona, updated_at = NOW()
       RETURNING id, user_id AS "userId", persona, title, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [c.id, c.userId || null, c.persona || 'Support Specialist', c.title || 'New Support Session']
    );
    return rows[0];
  }

  async addMessage(m) {
    const { rows } = await this.pool.query(
      `INSERT INTO messages (id, conversation_id, sender, text, intent)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, conversation_id AS "conversationId", sender, text, intent, csat_rating AS "csatRating", created_at AS "createdAt"`,
      [m.id, m.conversationId, m.sender, m.text, m.intent || null]
    );
    return rows[0];
  }

  async listMessages(conversationId) {
    const { rows } = await this.pool.query(
      `SELECT id, conversation_id AS "conversationId", sender, text, intent, csat_rating AS "csatRating", created_at AS "createdAt"
       FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conversationId]
    );
    return rows;
  }

  async rateMessage(messageId, rating) {
    const { rows } = await this.pool.query(
      `UPDATE messages SET csat_rating = $1 WHERE id = $2
       RETURNING id, conversation_id AS "conversationId", sender, text, intent, csat_rating AS "csatRating", created_at AS "createdAt"`,
      [rating, messageId]
    );
    return rows[0] || null;
  }

  async getOrder(id) {
    const { rows } = await this.pool.query(
      `SELECT id, customer_email AS "customerEmail", product_name AS "productName", amount_cents AS "amountCents", status, tracking_number AS "trackingNumber", eta, created_at AS "createdAt"
       FROM orders WHERE UPPER(id) = UPPER($1)`,
      [id]
    );
    return rows[0] || null;
  }

  async listOrders() {
    const { rows } = await this.pool.query(
      `SELECT id, customer_email AS "customerEmail", product_name AS "productName", amount_cents AS "amountCents", status, tracking_number AS "trackingNumber", eta, created_at AS "createdAt"
       FROM orders ORDER BY created_at DESC`
    );
    return rows;
  }

  async listTickets() {
    const { rows } = await this.pool.query(
      `SELECT id, customer_name AS "customerName", customer_email AS "customerEmail", category, priority, subject, description, status, assigned_agent AS "assignedAgent", resolution_notes AS "resolutionNotes", created_at AS "createdAt", updated_at AS "updatedAt"
       FROM tickets ORDER BY created_at DESC`
    );
    return rows;
  }

  async createTicket(t) {
    const { rows } = await this.pool.query(
      `INSERT INTO tickets (id, customer_name, customer_email, category, priority, subject, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, customer_name AS "customerName", customer_email AS "customerEmail", category, priority, subject, description, status, assigned_agent AS "assignedAgent", resolution_notes AS "resolutionNotes", created_at AS "createdAt", updated_at AS "updatedAt"`,
      [t.id, t.customerName, t.customerEmail, t.category, t.priority, t.subject, t.description, t.status || 'open']
    );
    return rows[0];
  }

  async updateTicket(id, fields) {
    const map = { status: 'status', assignedAgent: 'assigned_agent', resolutionNotes: 'resolution_notes' };
    const updates = [];
    const values = [];
    let idx = 1;
    for (const [k, col] of Object.entries(map)) {
      if (fields[k] !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push(fields[k]);
      }
    }
    if (updates.length === 0) return null;
    updates.push(`updated_at = NOW()`);
    values.push(id);
    const { rows } = await this.pool.query(
      `UPDATE tickets SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, customer_name AS "customerName", customer_email AS "customerEmail", category, priority, subject, description, status, assigned_agent AS "assignedAgent", resolution_notes AS "resolutionNotes", created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );
    return rows[0] || null;
  }

  async deleteTicket(id) {
    const { rowCount } = await this.pool.query('DELETE FROM tickets WHERE id = $1', [id]);
    return rowCount > 0;
  }

  async listKb() {
    const { rows } = await this.pool.query('SELECT id, category, keywords, title, content FROM knowledge_base ORDER BY id ASC');
    return rows;
  }

  async createKb(k) {
    const { rows } = await this.pool.query(
      `INSERT INTO knowledge_base (id, category, keywords, title, content) VALUES ($1,$2,$3,$4,$5) RETURNING id, category, keywords, title, content`,
      [k.id, k.category, k.keywords, k.title, k.content]
    );
    return rows[0];
  }

  async deleteKb(id) {
    const { rowCount } = await this.pool.query('DELETE FROM knowledge_base WHERE id = $1', [id]);
    return rowCount > 0;
  }

  async createAuditLog(entry) {
    await this.pool.query(
      `INSERT INTO audit_logs (id, user_id, user_email, user_role, action, resource, details, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [entry.id, entry.userId || null, entry.userEmail || null, entry.userRole || null, entry.action, entry.resource, JSON.stringify(entry.details || {}), entry.ipAddress || null]
    );
  }

  async listAuditLogs(limit = 50) {
    const { rows } = await this.pool.query(
      `SELECT id, user_id AS "userId", user_email AS "userEmail", user_role AS "userRole", action, resource, details, ip_address AS "ipAddress", created_at AS "createdAt"
       FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async getStats() {
    const [c, m, t, o, r] = await Promise.all([
      this.pool.query('SELECT COUNT(*)::int AS c FROM conversations'),
      this.pool.query('SELECT COUNT(*)::int AS c FROM messages'),
      this.pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status != 'resolved')::int AS open FROM tickets`),
      this.pool.query('SELECT COUNT(*)::int AS c FROM orders'),
      this.pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE csat_rating = 1)::int AS pos FROM messages WHERE csat_rating IS NOT NULL`)
    ]);
    return {
      totalConversations: c.rows[0].c,
      totalMessages: m.rows[0].c,
      openTickets: t.rows[0].open,
      totalTickets: t.rows[0].total,
      totalOrders: o.rows[0].c,
      csatScore: r.rows[0].total ? Math.round((r.rows[0].pos / r.rows[0].total) * 100) : 100
    };
  }

  async close() {
    await this.pool.end();
  }
}
