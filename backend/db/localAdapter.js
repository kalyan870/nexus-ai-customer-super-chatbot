import fs from 'fs';
import path from 'path';

export class LocalAdapter {
  constructor(dbFilePath) {
    this.dbFile = dbFilePath;
    this.mode = 'local-json';
    this.data = null;
  }

  async init() {
    if (this.dbFile !== ':memory:') {
      const dir = path.dirname(this.dbFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (fs.existsSync(this.dbFile)) {
        try {
          this.data = JSON.parse(fs.readFileSync(this.dbFile, 'utf-8'));
        } catch {
          this.data = null;
        }
      }
    }

    if (!this.data) {
      this.data = {
        users: [],
        conversations: [],
        messages: [],
        orders: [
          {
            id: 'ORD-1001',
            customerEmail: 'alex@enterprise.com',
            productName: 'NEXUS Enterprise AI Suite (Annual)',
            amountCents: 149000,
            status: 'Shipped',
            trackingNumber: '1Z999AA101928374',
            eta: 'Tomorrow by 5:00 PM',
            createdAt: new Date().toISOString()
          },
          {
            id: 'ORD-1002',
            customerEmail: 'maya@cloudscale.io',
            productName: 'Hardware Voice Terminal Pro',
            amountCents: 49900,
            status: 'Delivered',
            trackingNumber: '1Z999AA109911223',
            eta: 'Delivered',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
          }
        ],
        tickets: [
          {
            id: 'TKT-4012',
            customerName: 'Alex Morgan',
            customerEmail: 'alex@enterprise.com',
            category: 'Account & SSO',
            priority: 'High',
            subject: 'Clerk SAML Role Mapping',
            description: 'Need help mapping Clerk public_metadata.role to agent.',
            status: 'in_progress',
            assignedAgent: 'Elena Vance',
            resolutionNotes: null,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        knowledgeBase: [
          {
            id: 'kb-1',
            category: 'Billing & Plans',
            keywords: ['pricing', 'plan', 'cost', 'enterprise', 'pro', 'starter'],
            title: 'NEXUS AI Pricing & Enterprise Plans',
            content: 'Starter is \$49/mo (up to 2,500 chats), Pro is \$149/mo (unlimited chats, Clerk SSO, Neon PostgreSQL sync), and Enterprise includes custom SLA, dedicated Cloudflare Workers edge routing, and 24/7 engineering support.'
          },
          {
            id: 'kb-2',
            category: 'Refunds & SLA',
            keywords: ['refund', 'cancel', 'money back', 'guarantee', 'sla', 'uptime'],
            title: 'Refund Policy & 99.99% Uptime SLA',
            content: 'We offer a 30-day unconditional refund on all annual and monthly plans. Enterprise customers are covered by a 99.99% uptime SLA with automatic service credits.'
          },
          {
            id: 'kb-3',
            category: 'Technical & API',
            keywords: ['api', 'webhook', 'clerk', 'neon', 'sso', 'sdk', 'integration'],
            title: 'Clerk SSO, Neon DB & API Integration Guide',
            content: 'NEXUS integrates natively with Clerk JWTs (public_metadata.role), Neon serverless PostgreSQL, and Cloudflare Turnstile bot protection. REST endpoints are documented at /docs/API_DOCUMENTATION.md.'
          }
        ],
        auditLogs: []
      };
    }

    this.save();
  }

  save() {
    if (this.dbFile !== ':memory:') {
      fs.writeFileSync(this.dbFile, JSON.stringify(this.data, null, 2));
    }
  }

  // Users
  async findUserByEmail(email) {
    return this.data.users.find(u => u.email === email.toLowerCase()) || null;
  }
  async findUserById(id) {
    const u = this.data.users.find(item => item.id === id);
    if (!u) return null;
    const { passwordHash, ...safe } = u;
    return safe;
  }
  async createUser(user) {
    const rec = { ...user, email: user.email.toLowerCase(), isActive: true, createdAt: new Date().toISOString() };
    this.data.users.push(rec);
    this.save();
    const { passwordHash, ...safe } = rec;
    return safe;
  }
  async listUsers() {
    return this.data.users.map(({ passwordHash, ...safe }) => safe);
  }

  // Conversations & Messages
  async listConversations(userId = null) {
    return userId ? this.data.conversations.filter(c => c.userId === userId) : this.data.conversations;
  }
  async getConversation(id) {
    return this.data.conversations.find(c => c.id === id) || null;
  }
  async upsertConversation(conv) {
    const idx = this.data.conversations.findIndex(c => c.id === conv.id);
    if (idx === -1) {
      this.data.conversations.unshift({ ...conv, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else {
      this.data.conversations[idx] = { ...this.data.conversations[idx], ...conv, updatedAt: new Date().toISOString() };
    }
    this.save();
    return this.getConversation(conv.id);
  }
  async addMessage(msg) {
    const rec = { ...msg, csatRating: null, createdAt: new Date().toISOString() };
    this.data.messages.push(rec);
    this.save();
    return rec;
  }
  async listMessages(conversationId) {
    return this.data.messages.filter(m => m.conversationId === conversationId);
  }
  async rateMessage(messageId, rating) {
    const msg = this.data.messages.find(m => m.id === messageId);
    if (!msg) return null;
    msg.csatRating = rating;
    this.save();
    return msg;
  }

  // Orders
  async getOrder(id) {
    return this.data.orders.find(o => o.id.toUpperCase() === id.toUpperCase()) || null;
  }
  async listOrders() {
    return this.data.orders;
  }

  // Tickets
  async listTickets() { return this.data.tickets; }
  async createTicket(t) {
    this.data.tickets.unshift(t);
    this.save();
    return t;
  }
  async updateTicket(id, fields) {
    const idx = this.data.tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.tickets[idx] = { ...this.data.tickets[idx], ...fields, updatedAt: new Date().toISOString() };
    this.save();
    return this.data.tickets[idx];
  }
  async deleteTicket(id) {
    const idx = this.data.tickets.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.data.tickets.splice(idx, 1);
    this.save();
    return true;
  }

  // Knowledge Base
  async listKb() { return this.data.knowledgeBase; }
  async createKb(item) {
    this.data.knowledgeBase.push(item);
    this.save();
    return item;
  }
  async deleteKb(id) {
    const idx = this.data.knowledgeBase.findIndex(k => k.id === id);
    if (idx === -1) return false;
    this.data.knowledgeBase.splice(idx, 1);
    this.save();
    return true;
  }

  // Audit Logs
  async createAuditLog(entry) {
    this.data.auditLogs.unshift({ ...entry, createdAt: new Date().toISOString() });
    this.save();
  }
  async listAuditLogs(limit = 50) {
    return this.data.auditLogs.slice(0, limit);
  }

  // Stats
  async getStats() {
    const rated = this.data.messages.filter(m => m.csatRating !== null);
    const positive = rated.filter(m => m.csatRating === 1).length;
    return {
      totalConversations: this.data.conversations.length,
      totalMessages: this.data.messages.length,
      openTickets: this.data.tickets.filter(t => t.status !== 'resolved').length,
      totalTickets: this.data.tickets.length,
      totalOrders: this.data.orders.length,
      csatScore: rated.length ? Math.round((positive / rated.length) * 100) : 100
    };
  }

  async close() {}
}
