import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Package, LifeBuoy, Shield, Plus, ThumbsUp, ThumbsDown,
  MessageSquare, Search, Home
} from 'lucide-react';
import { api } from './services/api';
import CinematicLanding from './components/CinematicLanding';
import TicketModal from './components/TicketModal';
import AgentConsole from './components/AgentConsole';

const PERSONAS = ['Support Specialist', 'Technical Engineer', 'Billing & Refunds', 'Sales Advisor'];

export default function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'chat' | 'console'
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Welcome to **NEXUS AI Customer Super Chatbot**. Track an order (e.g. `ORD-1001`), ask billing/API questions, or open a support ticket.',
      suggestions: ['Track order ORD-1001', 'Show pricing plans', 'Clerk & Neon integration', 'Create support ticket']
    }
  ]);
  const [input, setInput] = useState('');
  const [orderLookup, setOrderLookup] = useState('');
  const [statusInfo, setStatusInfo] = useState(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    api.getStatus().then(setStatusInfo).catch(() => {});
    api.getConversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const clean = (text || '').trim();
    if (!clean) return;
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: clean }]);
    setInput('');

    try {
      const res = await api.chat({ message: clean, conversationId, persona });
      if (res.conversationId && !conversationId) {
        setConversationId(res.conversationId);
        api.getConversations().then(setConversations).catch(() => {});
      }
      setMessages(prev => [...prev, {
        id: res.messageId,
        sender: 'bot',
        text: res.reply,
        card: res.card,
        suggestions: res.suggestions || [],
        rated: null
      }]);
      if (res.action === 'OPEN_TICKET') setIsTicketOpen(true);
    } catch {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, sender: 'bot', text: 'Connection issue—please try again.' }]);
    }
  };

  const handleRate = async (msgId, rating) => {
    try {
      await api.rateMessage(msgId, rating);
      setMessages(prev => prev.map(m => (m.id === msgId ? { ...m, rated: rating } : m)));
    } catch {}
  };

  const handleTrackOrder = (e) => {
    e.preventDefault();
    if (!orderLookup.trim()) return;
    sendMessage(`Track order ${orderLookup.trim().toUpperCase()}`);
    setOrderLookup('');
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([{
      id: 'welcome-new',
      sender: 'bot',
      text: `Started a fresh **${persona}** session. How can I assist you today?`,
      suggestions: ['Track order ORD-1001', 'Show pricing plans', 'Create support ticket']
    }]);
  };

  if (view === 'landing') {
    return (
      <>
        <CinematicLanding
          statusInfo={statusInfo}
          onLaunchChat={() => setView('chat')}
          onOpenTicket={() => { setView('chat'); setIsTicketOpen(true); }}
          onOpenConsole={() => setView('console')}
        />
        <TicketModal
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
          onCreated={(t) => setMessages(prev => [...prev, { id: `t-${t.id}`, sender: 'bot', text: `Support ticket **${t.id}** ("${t.subject}") is now open in our queue.` }])}
        />
      </>
    );
  }

  if (view === 'console') {
    return <AgentConsole onBack={() => setView('chat')} />;
  }

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 flex flex-col md:flex-row">
      {/* LEFT SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/70 p-4 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
              N
            </div>
            <div>
              <h1 className="font-black text-white tracking-wide text-sm">NEXUS AI</h1>
              <p className="text-[11px] text-emerald-400 font-medium">Customer Super Chatbot</p>
            </div>
          </div>
          <button onClick={startNewChat} className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300" title="New Chat">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Persona Switcher */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">AI Specialist Persona</span>
          <div className="grid grid-cols-1 gap-1.5">
            {PERSONAS.map(p => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                  persona === p
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900/50 text-slate-400 border-slate-800/60 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Order Lookup */}
        <form onSubmit={handleTrackOrder} className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Quick Order Tracker</span>
          <div className="flex gap-1.5">
            <input
              placeholder="ORD-1001"
              value={orderLookup}
              onChange={e => setOrderLookup(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
            />
            <button type="submit" className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white"><Search className="w-3.5 h-3.5" /></button>
          </div>
        </form>

        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Recent Sessions</span>
          {conversations.slice(0, 6).map(c => (
            <button
              key={c.id}
              onClick={async () => {
                const msgs = await api.getMessages(c.id);
                setConversationId(c.id);
                setPersona(c.persona);
                setMessages(msgs);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 bg-slate-900/40 hover:bg-slate-900 border border-slate-800/50 truncate flex items-center gap-2"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* MAIN CHAT WORKSPACE */}
      <main className="flex-1 flex flex-col h-screen">
        <header className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <Bot className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">{persona}</span>
            {statusInfo && (
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                {statusInfo.database} • {statusInfo.authMode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('landing')} className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300" title="Overview">
              <Home className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsTicketOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30">
              <LifeBuoy className="w-3.5 h-3.5" /> Support Ticket
            </button>
            <button onClick={() => setView('console')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Agent Console
            </button>
          </div>
        </header>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-emerald-600 to-sky-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}>
                <p>{m.text}</p>

                {/* Inline Order Tracking Card */}
                {m.card?.type === 'order' && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-sky-500/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-sky-400">
                      <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />{m.card.data.id}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{m.card.data.status}</span>
                    </div>
                    <div className="text-slate-300 font-semibold">{m.card.data.productName}</div>
                    <div className="text-slate-400 font-mono">Tracking: {m.card.data.trackingNumber} • ETA: {m.card.data.eta}</div>
                  </div>
                )}

                {m.suggestions?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                    {m.suggestions.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300">
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {m.sender === 'bot' && m.id && !m.id.startsWith('welcome') && !m.id.startsWith('e-') && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Helpful?</span>
                    <button onClick={() => handleRate(m.id, 1)} className={`p-1 rounded ${m.rated === 1 ? 'text-emerald-400' : 'hover:text-white'}`}><ThumbsUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleRate(m.id, -1)} className={`p-1 rounded ${m.rated === -1 ? 'text-rose-400' : 'hover:text-white'}`}><ThumbsDown className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Ask ${persona} about orders (ORD-1001), pricing, Clerk/Neon API, or support...`}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
            <button type="submit" disabled={!input.trim()} className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-40 inline-flex items-center gap-2">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </form>
      </main>

      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        onCreated={(t) => setMessages(prev => [...prev, { id: `t-${t.id}`, sender: 'bot', text: `Support ticket **${t.id}** ("${t.subject}") is now open in our queue.` }])}
      />
    </div>
  );
}
