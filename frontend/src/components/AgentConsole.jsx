import React, { useState, useEffect } from 'react';
import { Shield, Lock, LogOut, CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function AgentConsole({ onBack }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [err, setErr] = useState('');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);

  const load = async () => {
    try {
      const [t, s] = await Promise.all([api.getTickets(), api.getAnalytics()]);
      setTickets(t);
      setStats(s);
    } catch (e) {
      if (e.status === 401) { api.logout(); setUser(null); }
    }
  };

  useEffect(() => {
    if (!api.getToken()) { setChecked(true); return; }
    api.getMe().then(r => { setUser(r.user); setChecked(true); load(); }).catch(() => { api.logout(); setChecked(true); });
  }, []);

  const authSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = mode === 'login' ? await api.login(form.email, form.password) : await api.register({ ...form, role: 'admin' });
      setUser(res.user);
      load();
    } catch (e) {
      setErr(e.message);
    }
  };

  const resolveTicket = async (id, status) => {
    await api.updateTicket(id, { status });
    load();
  };

  if (!checked) return <div className="min-h-screen bg-[#070B12] flex items-center justify-center text-slate-400">Checking session...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070B12] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-7 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-bold text-white">Agent &amp; Admin Console</h2>
                <p className="text-xs text-slate-400">Protected by Clerk / JWT RBAC</p>
              </div>
            </div>
            <button onClick={onBack} className="text-xs text-slate-400 hover:text-white underline">Back to Chat</button>
          </div>
          {err && <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-300"><AlertCircle className="w-4 h-4" />{err}</div>}
          <form onSubmit={authSubmit} className="space-y-3.5">
            {mode === 'register' && <input required placeholder="Full Name" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />}
            <input required type="email" placeholder="agent@nexus.ai" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />
            <input required minLength={8} type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white">
              {mode === 'login' ? 'Sign In' : 'Create Initial Admin'}
            </button>
          </form>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-center text-xs text-emerald-400 hover:underline">
            {mode === 'login' ? 'First time setup? Bootstrap Admin' : 'Already registered? Sign In'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-400" />NEXUS Agent Triage Console</h1>
          <p className="text-xs text-slate-400">Signed in as {user.fullName} ({user.role.toUpperCase()})</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { api.logout(); setUser(null); }} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">Sign Out</button>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white"><LogOut className="w-3.5 h-3.5" />Back to Chatbot</button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800"><div className="text-xs text-slate-400">Conversations</div><div className="text-2xl font-black mt-1">{stats.totalConversations}</div></div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800"><div className="text-xs text-slate-400">Open Tickets</div><div className="text-2xl font-black text-amber-400 mt-1">{stats.openTickets}</div></div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800"><div className="text-xs text-slate-400">Orders Tracked</div><div className="text-2xl font-black text-sky-400 mt-1">{stats.totalOrders}</div></div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800"><div className="text-xs text-slate-400">CSAT Score</div><div className="text-2xl font-black text-emerald-400 mt-1">{stats.csatScore}%</div></div>
        </div>
      )}

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 font-bold text-sm">Support Ticket Queue</div>
        <div className="divide-y divide-slate-800">
          {tickets.map(t => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-400 font-bold">{t.id}</span>
                  <span className="text-sm font-bold text-white">{t.subject}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">{t.priority}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{t.customerName} • {t.category} • {t.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{t.status}</span>
                {t.status !== 'resolved' && (
                  <button onClick={() => resolveTicket(t.id, 'resolved')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
