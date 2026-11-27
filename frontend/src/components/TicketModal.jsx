import React, { useState } from 'react';
import { X, LifeBuoy, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function TicketModal({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    category: 'Technical Support',
    priority: 'Medium',
    subject: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.createTicket(form);
      setTicket(res.ticket);
      onCreated?.(res.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setTicket(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <LifeBuoy className="w-5 h-5" />
            <span className="text-white">Open Support Ticket</span>
          </div>
          <button onClick={close} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {ticket ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Ticket Created: <span className="font-mono text-emerald-400">{ticket.id}</span></h3>
            <p className="text-xs text-slate-400">{ticket.subject} • Priority: {ticket.priority}</p>
            <button onClick={close} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3.5">
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-950/50 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Your Name *" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />
              <input type="email" placeholder="Email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} className="px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white">
                <option>Technical Support</option>
                <option>Order &amp; Shipping</option>
                <option>Billing &amp; Refunds</option>
                <option>Account &amp; SSO</option>
              </select>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white">
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
            <input required minLength={3} placeholder="Subject *" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />
            <textarea required minLength={5} rows={3} placeholder="Describe your issue *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-white" />
            <button disabled={loading} type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white disabled:opacity-50">
              {loading ? 'Submitting...' : 'Create Support Ticket'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
