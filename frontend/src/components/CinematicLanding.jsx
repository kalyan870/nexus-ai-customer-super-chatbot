import React, { useEffect, useRef } from 'react';
import { animate, stagger, createTimeline } from 'animejs';
import {
  Bot, Package, LifeBuoy, ShieldCheck, Lock, Sparkles,
  ArrowRight, ChevronRight, Radio, Cpu, ThumbsUp
} from 'lucide-react';

export default function CinematicLanding({ onLaunchChat, onOpenTicket, onOpenConsole, statusInfo }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const tl = createTimeline({ defaults: { ease: 'outExpo', duration: 850 } });
    tl.add('.nx-eyebrow', { opacity: [0, 1], translateY: [16, 0], duration: 600 })
      .add('.nx-word', { opacity: [0, 1], translateY: [30, 0], filter: ['blur(8px)', 'blur(0px)'], delay: stagger(70) }, '-=350')
      .add('.nx-sub', { opacity: [0, 1], translateY: [18, 0] }, '-=500')
      .add('.nx-cta', { opacity: [0, 1], translateY: [14, 0], scale: [0.96, 1], delay: stagger(85) }, '-=450')
      .add('.nx-stage', { opacity: [0, 1], translateY: [36, 0], scale: [0.97, 1] }, '-=450')
      .add('.nx-card', { opacity: [0, 1], translateY: [24, 0], delay: stagger(70) }, '-=550');

    const orb = animate('.nx-orb', {
      translateY: [-8, 8],
      scale: [0.98, 1.03],
      duration: 3400,
      alternate: true,
      loop: true,
      ease: 'inOutSine'
    });
    const ring = animate('.nx-ring', { rotate: 360, duration: 22000, loop: true, ease: 'linear' });

    return () => { tl.pause(); orb.pause(); ring.pause(); };
  }, []);

  const words = ['Autonomous', 'Customer', 'Support,', 'Orders', '&', 'Ticket', 'Triage.'];
  const features = [
    { icon: Bot, title: '4 Specialist AI Personas', desc: 'Route seamlessly between Support, Technical Engineering, Billing & Refunds, and Sales.', tone: 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10' },
    { icon: Package, title: 'Live Order Tracking Cards', desc: 'Instant ORD-1001 lookup with carrier tracking numbers and delivery ETAs right in chat.', tone: 'text-sky-400 border-sky-500/25 bg-sky-500/10' },
    { icon: LifeBuoy, title: 'Autonomous Ticket Escalation', desc: 'Create structured TKT-XXXX support tickets with priority and agent triage.', tone: 'text-amber-400 border-amber-500/25 bg-amber-500/10' },
    { icon: ShieldCheck, title: 'Backend Security Guardrails', desc: 'Prompt/SQL injection defense, secret redaction, X-Request-Id tracing & audit logs.', tone: 'text-cyan-400 border-cyan-500/25 bg-cyan-500/10' },
    { icon: Lock, title: 'Clerk + JWT RBAC & Turnstile', desc: 'Enterprise SSO/MFA via Clerk, scrypt hashing, and Cloudflare Turnstile bot protection.', tone: 'text-indigo-400 border-indigo-500/25 bg-indigo-500/10' },
    { icon: ThumbsUp, title: 'Real-Time CSAT Analytics', desc: 'Per-message satisfaction ratings feeding live CSAT scores in the Agent Console.', tone: 'text-rose-400 border-rose-500/25 bg-rose-500/10' }
  ];

  return (
    <div ref={rootRef} className="relative min-h-screen bg-[#070B12] text-slate-100 overflow-hidden bg-dot-grid">
      <div className="pointer-events-none absolute -top-44 left-1/2 -translate-x-1/2 w-[880px] h-[440px] rounded-full bg-gradient-to-b from-emerald-500/15 via-sky-500/10 to-transparent blur-3xl" />

      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center font-black text-white shadow-lg shadow-emerald-500/25">N</div>
          <span className="font-black tracking-wider text-white">NEXUS AI</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-emerald-400">SUPER CHATBOT</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onOpenConsole} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800">Agent Console</button>
          <button onClick={onLaunchChat} className="relative overflow-hidden btn-shimmer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-sky-600 shadow-lg shadow-emerald-600/25">
            <span>Open Chatbot</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-16 text-center">
        <div className="nx-eyebrow opacity-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300 mb-7">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>NEXUS Customer Super Chatbot</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">Clerk + Neon + Guardrails</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl mx-auto">
          {words.map((w, i) => (
            <span key={i} className={`nx-word opacity-0 inline-block mr-3 ${i < 3 ? 'bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-400 bg-clip-text text-transparent' : 'text-white'}`}>{w}</span>
          ))}
        </h1>

        <p className="nx-sub opacity-0 mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Resolve customer questions in seconds, track live orders, escalate priority tickets, and protect every endpoint with prompt-injection security guardrails.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <button onClick={onLaunchChat} className="nx-cta opacity-0 relative overflow-hidden btn-shimmer inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-sky-600 shadow-2xl shadow-emerald-500/25">
            <Sparkles className="w-4 h-4" /><span>Launch Super Chatbot</span><ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onOpenTicket} className="nx-cta opacity-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80">
            <LifeBuoy className="w-4 h-4 text-amber-400" /><span>Open Support Ticket</span>
          </button>
        </div>

        <div className="nx-stage opacity-0 mt-14 max-w-4xl mx-auto rounded-3xl p-[1px] bg-gradient-to-b from-emerald-500/40 via-slate-700/40 to-slate-900/20 shadow-[0_20px_80px_rgba(16,185,129,0.15)]">
          <div className="rounded-3xl bg-[#0A101B]/95 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
              <div className="nx-ring absolute inset-0 rounded-full border border-dashed border-emerald-500/40" />
              <div className="nx-orb w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 shadow-[0_0_45px_rgba(16,185,129,0.45)] flex items-center justify-center">
                <Bot className="w-9 h-9 text-white" />
              </div>
            </div>
            <div className="flex-1 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400"><Radio className="w-4 h-4 animate-pulse" />LIVE SUPPORT TELEMETRY</span>
                <span className="text-[11px] font-mono text-slate-400">{statusInfo ? `${statusInfo.database} • ${statusInfo.authMode}` : 'ONLINE'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">Sessions</div><div className="text-xl font-black text-white">{statusInfo?.stats?.totalConversations ?? 0}</div></div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">Open Tickets</div><div className="text-xl font-black text-amber-400">{statusInfo?.stats?.openTickets ?? 1}</div></div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">Orders</div><div className="text-xl font-black text-sky-400">{statusInfo?.stats?.totalOrders ?? 2}</div></div>
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800"><div className="text-[10px] text-slate-500 uppercase">CSAT</div><div className="text-xl font-black text-emerald-400">{statusInfo?.stats?.csatScore ?? 100}%</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Cpu className="w-5 h-5 text-emerald-400" />Platform Capabilities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} onClick={onLaunchChat} className="nx-card opacity-0 cursor-pointer p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${f.tone}`}><f.icon className="w-5 h-5" /></div>
              <h3 className="text-sm font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
