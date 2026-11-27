const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'nexus_auth_token';

function authHeaders(extra = {}) {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null;
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function handle(res, fallback) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || fallback);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  getToken: () => (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_KEY) : null),
  setToken: (t) => {
    if (typeof window !== 'undefined') {
      if (t) sessionStorage.setItem(TOKEN_KEY, t);
      else sessionStorage.removeItem(TOKEN_KEY);
    }
  },
  logout() { this.setToken(null); },

  async getStatus() {
    return handle(await fetch(`${BASE_URL}/status`), 'Status failed');
  },
  async login(email, password) {
    const d = await handle(await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }), 'Login failed');
    this.setToken(d.token);
    return d;
  },
  async register({ email, password, fullName, role = 'admin' }) {
    const d = await handle(await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, password, fullName, role })
    }), 'Register failed');
    if (d.token && !this.getToken()) this.setToken(d.token);
    return d;
  },
  async getMe() {
    return handle(await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() }), 'Unauthorized');
  },
  async chat({ message, conversationId, persona }) {
    return handle(await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ message, conversationId, persona })
    }), 'Chat failed');
  },
  async rateMessage(messageId, rating) {
    return handle(await fetch(`${BASE_URL}/chat/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, rating })
    }), 'Feedback failed');
  },
  async getConversations() {
    return handle(await fetch(`${BASE_URL}/chat/conversations`, { headers: authHeaders() }), 'Failed');
  },
  async getMessages(id) {
    return handle(await fetch(`${BASE_URL}/chat/conversations/${id}/messages`), 'Failed');
  },
  async getOrder(id) {
    return handle(await fetch(`${BASE_URL}/orders/${encodeURIComponent(id)}`), 'Order not found');
  },
  async createTicket(payload) {
    return handle(await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }), 'Ticket creation failed');
  },
  async getTickets() {
    return handle(await fetch(`${BASE_URL}/tickets`, { headers: authHeaders() }), 'Failed');
  },
  async updateTicket(id, fields) {
    return handle(await fetch(`${BASE_URL}/tickets/${id}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(fields)
    }), 'Update failed');
  },
  async getKb() {
    return handle(await fetch(`${BASE_URL}/kb`), 'Failed');
  },
  async getAnalytics() {
    return handle(await fetch(`${BASE_URL}/analytics`, { headers: authHeaders() }), 'Failed');
  }
};
