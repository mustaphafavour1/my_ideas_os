'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { PLAN_AMOUNTS_USD } from '@/lib/planPricing';
import { useUsdToNgn } from '@/lib/useUsdToNgn';

/* ─── Contact config ─────────────────────────────────────────────────────── */
const CONTACT_LINKEDIN = 'https://linkedin.com/in/favourmustapha1';
const CONTACT_X        = 'https://x.com/headfavour';

/* ─── Animation helpers ─────────────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.07, ease },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function InView({ children, className = '', delay = 0, style }: {
  children: React.ReactNode; className?: string; delay?: number; style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Contact form modal ─────────────────────────────────────────────────── */
// Submits natively (no fetch/CORS) to Google's formResponse endpoint via a
// hidden-iframe-target form post — the standard headless-submission pattern.
// NOTE: field->entry mapping below is inferred from entry ID order in the
// prefill link you provided and has NOT been confirmed against the live
// form. Verify it (see chat) before treating submissions as reliable.
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSctPvWvt8XcO0UYIyw57ik240a9fsBEZKnMpC35O3vBrUEKtA/formResponse';
const GOOGLE_FORM_FIELDS = {
  name: 'entry.181480148',
  email: 'entry.463801258',
  company: 'entry.1926220507',
  teamSize: 'entry.1619198101',
  message: 'entry.19317049',
};

function ContactFormModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    formRef.current?.submit();
    setSubmitted(true);
  };

  const inputClass = 'w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-lg px-3 py-2.5 text-[13px] text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/40 transition-colors';
  const labelClass = 'block text-[11px] font-mono text-white/40 uppercase tracking-widest mb-1.5';

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative bg-[#111118] border border-[#1E1E2E] rounded-2xl overflow-hidden w-full max-w-lg"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.25, ease }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E2E]">
          <p className="text-[13px] font-semibold text-white">Send a message</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1E1E2E] text-white/40 hover:text-white transition-colors text-[13px]"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#4ADE80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-white mb-1">Message sent</p>
            <p className="text-[12px] text-white/50">We&apos;ll get back to you shortly.</p>
          </div>
        ) : (
          <form ref={formRef} action={GOOGLE_FORM_ACTION} method="POST" target="hidden_contact_iframe" onSubmit={handleSubmit} className="p-5 space-y-3.5">
            <div>
              <label className={labelClass}>Name</label>
              <input name={GOOGLE_FORM_FIELDS.name} value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Work email</label>
              <input type="email" name={GOOGLE_FORM_FIELDS.email} value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Company</label>
                <input name={GOOGLE_FORM_FIELDS.company} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Team size</label>
                <input name={GOOGLE_FORM_FIELDS.teamSize} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="e.g. 25" className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <textarea name={GOOGLE_FORM_FIELDS.message} value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} placeholder="What are you looking for?" className={`${inputClass} resize-none`} />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[13px] font-bold hover:bg-[#E6B830] transition-colors"
            >
              Send message
            </button>
          </form>
        )}

        <iframe name="hidden_contact_iframe" style={{ display: 'none' }} title="" />
      </motion.div>
    </motion.div>
  );
}

/* ─── Nav ──────────────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0A0A0F]/90 backdrop-blur-lg border-b border-[#1E1E2E]' : ''
      }`}
    >
      <div className="px-6 h-[62px] grid grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F7C948] flex items-center justify-center shrink-0">
            <span className="text-[#0A0A0F] font-bold text-[10px]">IO</span>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Idea OS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[['how-it-works', 'How it works'], ['features', 'Features'], ['for-businesses', 'For businesses'], ['pricing', 'Pricing'], ['export-guide', 'Export guide']].map(([id, label]) => (
            <a key={id} href={`#${id}`}
               className="text-[13px] text-white/40 hover:text-white/80 transition-colors">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-end">
          <a
            href="/demo"
            className="h-9 px-4 rounded-full border border-[#1E1E2E] text-white/60 text-[13px] font-medium hover:border-[#2A2A3A] hover:text-white/80 transition-colors hidden sm:flex items-center justify-center"
          >
            Visit demo
          </a>
          <a
            href="/login"
            className="h-9 px-5 rounded-full bg-[#F7C948] text-[#0A0A0F] text-[13px] font-semibold hover:bg-[#E6B830] transition-colors flex items-center justify-center"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── Number-scramble cycling word ──────────────────────────────────────── */
const CYCLING_WORDS = ['Visualized', 'Analysed', 'Optimized', 'Decoded', 'Understood'];
const DIGITS = '0123456789';

function CyclingWord() {
  const [wordIdx, setWordIdx] = useState(0);
  const [display, setDisplay] = useState(CYCLING_WORDS[0] + '.');

  useEffect(() => {
    const cycle = setInterval(() => setWordIdx((i) => (i + 1) % CYCLING_WORDS.length), 2800);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    const target = CYCLING_WORDS[wordIdx];
    let frame = 0;
    const totalFrames = 20;
    const t = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(target + '.');
        clearInterval(t);
        return;
      }
      const progress = frame / totalFrames;
      const scrambled = target
        .split('')
        .map((char, i) => {
          if (i < Math.floor(progress * target.length)) return char;
          return DIGITS[Math.floor(Math.random() * DIGITS.length)];
        })
        .join('');
      setDisplay(scrambled + '.');
    }, 25);
    return () => clearInterval(t);
  }, [wordIdx]);

  return <span className="text-[#F7C948] font-mono tabular-nums">{display}</span>;
}

/* ─── Smooth full-width animated graph ───────────────────────────────────── */
function AnimatedGraph() {
  const w = 1000, h = 220, pad = 16;

  // Very low baseline left ~80%, then dramatic 4× spike on the right
  const pts = [4, 9, 6, 13, 5, 11, 8, 14, 6, 12, 9, 15, 11, 17, 14, 97, 86, 93];
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * w);
  const ys = pts.map((v) => h - pad - (v / 100) * (h - pad * 2));

  let linePath = `M${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx = (xs[i - 1] + xs[i]) / 2;
    linePath += ` C${cpx},${ys[i - 1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  const fillPath = `${linePath} L${w},${h} L0,${h} Z`;

  // spike starts at index 15 (~83% of width)
  const chips = [
    // before the spike
    { label: '🔁 Recurring pattern', x: '14%', y: '28%', delay: 0.6 },
    { label: '🔥 14-day streak',     x: '3%',  y: '62%', delay: 0.9 },
    { label: '↗ +32% this month',   x: '48%', y: '10%', delay: 1.2 },
    // immediately before the bump (~80%)
    { label: '→ Started using Idea OS', x: '69%', y: '44%', delay: 1.5 },
    // after the spike — Idea OS features
    { label: '↑ Productivity score', x: '82%', y: '4%',  delay: 1.8 },
    { label: '47 ideas captured',    x: '80%', y: '20%', delay: 2.1 },
    { label: '✦ 3 signals saved',   x: '85%', y: '36%', delay: 2.4 },
  ];

  return (
    <div className="relative w-full h-[50vh] sm:h-[60vh] overflow-hidden">
      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 h-16 z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, #0A0A0F, transparent)' }} />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-20 z-10 pointer-events-none"
           style={{ background: 'linear-gradient(to top, #0A0A0F, transparent)' }} />

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F7C948" stopOpacity="0.08" />
            <stop offset="74%" stopColor="#F7C948" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F7C948" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7C948" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#F7C948" stopOpacity="0" />
          </linearGradient>
          <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Area fill */}
        <motion.path d={fillPath} fill="url(#fillGrad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }} />

        {/* Main line */}
        <motion.path d={linePath} fill="none" stroke="url(#lineGrad)"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 2.0, ease: 'easeInOut', delay: 0.2 }} />

        {/* Hidden path for animateMotion */}
        <path id="travel-path" d={linePath} fill="none" stroke="none" />

        {/* Single traveling glowing dot */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.5 }}>
          <circle r="3" fill="#F7C948" filter="url(#dot-glow)">
            <animateMotion dur="16s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#travel-path" />
            </animateMotion>
          </circle>
        </motion.g>
      </svg>

      {chips.map((chip) => (
        <motion.div key={chip.label}
          className="absolute z-20 px-3 py-1.5 rounded-full bg-[#111118] border border-[#F7C948]/25 text-[10px] font-mono text-[#F7C948]/80 whitespace-nowrap pointer-events-none"
          style={{ left: chip.x, top: chip.y }}
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: chip.delay, duration: 0.4, ease }}>
          {chip.label}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.35], [0, -50]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-36 pb-10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[22%] left-[25%] w-[700px] h-[400px] opacity-[0.06]"
             style={{ background: 'radial-gradient(ellipse, #F7C948, transparent 70%)', filter: 'blur(120px)' }} />
      </div>

      <motion.div style={{ y }} className="relative z-10 w-full px-6">
        <motion.div variants={stagger} initial="hidden" animate="visible">
            <motion.h1 variants={fadeUp} custom={0}
              className="font-bold text-white leading-[1.05] tracking-tight mb-5"
              style={{ fontSize: 'clamp(32px, 5.5vw, 64px)', transform: 'rotate(-0.3deg)' }}>
              Your AI journey, <CyclingWord />
            </motion.h1>

            <motion.p variants={fadeUp} custom={1}
              className="text-[15px] sm:text-[16px] text-white/45 max-w-md mb-10 leading-relaxed">
              Turn your AI conversations into a personal intelligence dashboard — ideas, patterns, and insights, all in one place.
            </motion.p>

            <motion.div variants={fadeUp} custom={2} className="flex items-center gap-3 flex-wrap mb-6">
              <a
                href="/demo"
                className="h-12 px-7 rounded-xl border border-[#1E1E2E] text-white/70 text-[14px] font-medium hover:border-[#2A2A3A] hover:text-white transition-colors flex items-center justify-center"
              >
                Visit demo
              </a>
              <a
                href="/login"
                className="h-12 px-8 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#E6B830] transition-colors flex items-center justify-center"
              >
                Get started →
              </a>
            </motion.div>

            <motion.p variants={fadeUp} custom={3} className="text-white/20 text-[11px] font-mono">
              Free to try · No credit card · Works with Claude, ChatGPT, Gemini &amp; more
            </motion.p>
          </motion.div>
      </motion.div>

      {/* Full-width graph */}
      <InView className="relative z-10 w-full mt-16">
        <AnimatedGraph />
        <div className="absolute -bottom-px inset-x-0 h-24 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0F)' }} />
      </InView>
    </section>
  );
}

/* ─── What it is / What it's not ─────────────────────────────────────────── */
const IS_CARDS = [
  { emoji: '◎', text: 'An intelligent dashboard that analyses & optimises your AI journey' },
  { emoji: '⚡', text: 'A personal productivity and usage insights tool for AI builders' },
  { emoji: '◆', text: 'An idea tracker and knowledge vault for AI-assisted work' },
  { emoji: '↗', text: 'A pattern detector — see how your prompting style evolves over time' },
  { emoji: '⊕', text: 'A builder profile that shows how you use AI, in data' },
];
const ISNT_CARDS = [
  { emoji: '✕', text: 'Another AI agent or chatbot — we don\'t generate content for you' },
  { emoji: '✕', text: 'A replacement for Claude, ChatGPT, or any AI tool' },
  { emoji: '✕', text: 'A data collector — your conversation text stays on your device' },
  { emoji: '✕', text: 'A social platform — your data is private and yours alone' },
  { emoji: '✕', text: 'A tool for casual users — built exclusively for active AI builders' },
];

function IsCard({ item, isNot }: { item: { emoji: string; text: string }; isNot: boolean }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl p-6 border h-full ${isNot ? 'border-[#1E1E2E] bg-[#0D0D14]' : 'border-[#F7C948]/15 bg-[#F7C948]/3'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[14px] mb-4 ${isNot ? 'bg-white/5 text-white/30' : 'bg-[#F7C948]/10 text-[#F7C948]'}`}>
        {item.emoji}
      </div>
      <p className="text-[13px] text-white/60 leading-relaxed">{item.text}</p>
    </motion.div>
  );
}

function WhatItIs() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#1E1E2E] to-transparent mb-20" />

      <InView className="text-center mb-14">
        <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Clarity first</p>
        <h2 className="text-[34px] sm:text-[44px] font-bold text-white">What Idea OS is — and isn&apos;t</h2>
      </InView>

      {/* 3-col: IS | dashed divider | ISNT */}
      <div className="grid sm:grid-cols-[1fr_1px_1fr] gap-0">
        {/* IS column */}
        <div className="sm:pr-10">
          <p className="text-[10px] font-mono text-[#F7C948]/60 uppercase tracking-widest mb-5">It IS</p>
          <motion.div
            className="grid grid-cols-2 gap-3"
            style={{ gridAutoRows: '1fr' }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {IS_CARDS.map((item, i) => (
              <div key={i} className={i === IS_CARDS.length - 1 && IS_CARDS.length % 2 !== 0 ? 'col-span-2 mx-auto max-w-[calc(50%-6px)] w-full' : ''}>
                <IsCard item={item} isNot={false} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Dashed vertical divider */}
        <div className="hidden sm:flex flex-col items-center py-4">
          <svg width="1" height="100%" viewBox="0 0 1 400" preserveAspectRatio="none" className="h-full min-h-[300px]">
            <line x1="0.5" y1="0" x2="0.5" y2="400"
              stroke="#1E1E2E" strokeWidth="1" strokeDasharray="6 5" />
          </svg>
        </div>

        {/* ISNT column */}
        <div className="sm:pl-10 mt-10 sm:mt-0">
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-5">It&apos;s NOT</p>
          <motion.div
            className="grid grid-cols-2 gap-3"
            style={{ gridAutoRows: '1fr' }}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {ISNT_CARDS.map((item, i) => (
              <div key={i} className={i === ISNT_CARDS.length - 1 && ISNT_CARDS.length % 2 !== 0 ? 'col-span-2 mx-auto max-w-[calc(50%-6px)] w-full' : ''}>
                <IsCard item={item} isNot />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── How it works ──────────────────────────────────────────────────────── */
const HOW_STEPS = [
  { n: '01', title: 'Export your conversations', body: 'Download your history from Claude, ChatGPT, Gemini — any AI tool. Takes about 30 seconds.' },
  { n: '02', title: 'Drop the file', body: 'Upload your export JSON. We batch-analyse everything and extract every idea, pattern, and insight in minutes.' },
  { n: '03', title: 'See your builder profile', body: 'Your productivity score, idea evolution, conversation stats, signals — a complete mirror of how you actually build.' },
  { n: '04', title: 'Keep it current', body: 'Re-sync anytime to add new conversations. We skip what\'s already been processed so it stays fast.' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#0D0D14] overflow-hidden">
      <div className="max-w-[1320px] mx-auto px-6">
        <InView className="text-center mb-20">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white">How it works</h2>
        </InView>

        {/* Desktop layout: flex with large spacing */}
        <div className="hidden lg:block relative">
          {/* 3 standalone loopy connector SVGs between the 4 cards */}
          {[25, 50, 75].map((pct, j) => (
            <div
              key={j}
              className="absolute top-0 pointer-events-none"
              style={{
                left: `${pct}%`,
                transform: 'translateX(-50%)',
                width: 80,
                /* vertically centre between the two row heights */
                top: j % 2 === 0 ? 60 : 100,
              }}
            >
              <svg viewBox="0 0 80 50" className="w-full" style={{ height: 50 }}>
                <path
                  d="M0,25 C20,5 30,45 40,25 C50,5 60,45 80,25"
                  fill="none" stroke="#1E1E2E" strokeWidth="1.5" strokeDasharray="5 4"
                />
              </svg>
            </div>
          ))}

          <div className="flex items-start justify-between gap-8">
            {HOW_STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12, ease }}
                className="w-[22%] shrink-0"
                style={{ marginTop: i % 2 !== 0 ? 64 : 0 }}
              >
                <div className="rounded-2xl bg-[#111118] border border-[#1E1E2E] p-6 font-mono relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(247,201,72,0.2), transparent)' }} />
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] text-[#F7C948]/40">{s.n}</span>
                    <div className="w-px h-3 bg-[#1E1E2E]" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-sm bg-[#F7C948]/30" />
                      <div className="w-2 h-2 rounded-sm bg-[#1E1E2E]" />
                      <div className="w-2 h-2 rounded-sm bg-[#1E1E2E]" />
                    </div>
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mb-2 font-sans">{s.title}</h3>
                  <p className="text-[12px] text-white/40 leading-relaxed font-sans">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile/tablet layout */}
        <div className="lg:hidden grid sm:grid-cols-2 gap-5">
          {HOW_STEPS.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.12, ease }}>
              <div className="rounded-2xl bg-[#111118] border border-[#1E1E2E] p-6 font-mono relative overflow-hidden h-full">
                <div className="absolute inset-x-0 top-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(247,201,72,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] text-[#F7C948]/40">{s.n}</span>
                  <div className="w-px h-3 bg-[#1E1E2E]" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-sm bg-[#F7C948]/30" />
                    <div className="w-2 h-2 rounded-sm bg-[#1E1E2E]" />
                    <div className="w-2 h-2 rounded-sm bg-[#1E1E2E]" />
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2 font-sans">{s.title}</h3>
                <p className="text-[12px] text-white/40 leading-relaxed font-sans">{s.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Origin story ───────────────────────────────────────────────────────── */
const JOURNEY_PARAS = [
  { text: 'I build with Claude every day — ideas in the morning, code at night. But I had no clue how I was actually using it or what patterns I was repeating.', rotate: '-3deg' },
  { text: 'One day I exported my conversations and found thousands of messages, hundreds of code blocks, and ideas I\'d completely forgotten about.', rotate: '3deg' },
  { text: 'I wanted a Spotify Wrapped for how I build with AI. So I built it. For myself first. Then people started asking. This is Idea OS.', rotate: '-3deg' },
];

function TheJourney() {
  return (
    <section className="px-6 py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#F7C948 1px, transparent 1px), linear-gradient(90deg, #F7C948 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <InView className="text-center mb-16">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">The origin story</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white leading-tight"
            style={{ transform: 'rotate(-0.5deg)' }}>
            It started as a<br />personal obsession
          </h2>
        </InView>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {JOURNEY_PARAS.map((para, i) => (
            <InView key={i} delay={i * 0.1} style={{ marginTop: i % 2 !== 0 ? 32 : 0 }}>
              <p
                className="text-[13px] sm:text-[16px] leading-relaxed"
                style={{
                  fontFamily: 'var(--font-edu-sa)',
                  color: '#5B9BD5',
                  transform: `rotate(${para.rotate})`,
                  display: 'inline-block',
                }}
              >
                {para.text}
              </p>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ──────────────────────────────────────────────────────────── */
const FEATURE_ITEMS = [
  { icon: '◎', title: 'AI Builder Profile', body: 'Your productivity score, AI personality type, temperament, usage patterns — a complete picture of how you build with AI.' },
  { icon: '⚡', title: 'Idea Intelligence', body: 'Capture, grade, and track every idea from your AI conversations. See which sectors you focus on and which ideas keep coming back.' },
  { icon: '↗', title: 'Productivity Analytics', body: 'Code lines written, conversation volume, word breakdowns, time trends — understand your real output across weeks and months.' },
  { icon: '◆', title: 'Signals Engine', body: 'Surface recurring patterns, strategic principles, and insights from across your work. Build a personal knowledge layer that grows with you.' },
  { icon: '⊕', title: 'Insights Connector', body: 'See which ideas are related. Spot the threads across conversations you might have missed. Group sub-ideas under parent projects.' },
];

function Features() {
  return (
    <section id="features" className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-16">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">What you get</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white">The features</h2>
        </InView>

        <div className="relative">
          {/* Title card centred above */}
          <div className="flex justify-center mb-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease }}
              className="rounded-2xl bg-[#F7C948]/8 border border-[#F7C948]/20 px-8 py-5 text-center max-w-sm w-full"
            >
              <p className="text-[11px] font-mono text-[#F7C948]/60 uppercase tracking-widest mb-1">Built for builders</p>
              <p className="text-[17px] font-semibold text-white">Everything in one dashboard</p>
            </motion.div>
          </div>

          {/* 5 feature cards — last one centred in its row */}
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {FEATURE_ITEMS.map((f, idx) => (
              <motion.div key={f.title} variants={fadeUp}
                className={`rounded-2xl border-0 bg-[#111118] p-7 hover:bg-[#131320] transition-colors group relative overflow-hidden ${
                  idx === FEATURE_ITEMS.length - 1 && FEATURE_ITEMS.length % 3 !== 0
                    ? 'sm:col-span-2 sm:mx-auto sm:max-w-[calc(50%-8px)] sm:w-full lg:col-span-1 lg:max-w-none lg:w-auto lg:col-start-2'
                    : ''
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(247,201,72,0.15), transparent)' }} />
                <div className="w-10 h-10 rounded-xl bg-[#F7C948]/8 flex items-center justify-center text-[#F7C948] text-[18px] mb-5">
                  {f.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-[12px] text-white/40 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── For Businesses ─────────────────────────────────────────────────────── */
const BIZ_FEATURES = [
  { icon: '◎', title: 'Team-wide AI intelligence', body: 'See how every person on your team builds with AI — usage patterns, productivity scores, and idea generation across the whole org.' },
  { icon: '⚡', title: 'Per-member analytics', body: 'Break down conversations, code output, and ideas by team member. Spot your highest-leverage contributors and the patterns that drive them.' },
  { icon: '◆', title: 'Enterprise export support', body: 'Works with Claude Team & Enterprise exports. Auto-detects the format, groups conversations by member, and surfaces team-level insights.' },
  { icon: '↗', title: 'Bring your own API key', body: 'No extra cost for AI analysis — connect your organisation\'s existing API key. Your data never flows through our servers unencrypted.' },
  { icon: '⊕', title: 'Idea intelligence across teams', body: 'Spot duplicate work, recurring strategic signals, and cross-team patterns your team would never see by looking at individual conversations alone.' },
  { icon: '⛨', title: 'Privacy by design', body: 'Conversation text is processed and never stored. We keep statistical metadata only — so compliance stays clean and your IP stays yours.' },
];

function ForBusinesses() {
  return (
    <section id="for-businesses" className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <InView className="mb-16">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">For teams & enterprises</p>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2 className="text-[34px] sm:text-[44px] font-bold text-white leading-tight max-w-lg">
              Turn your team&apos;s AI usage into a competitive edge
            </h2>
            <p className="text-[14px] text-white/40 leading-relaxed max-w-sm">
              Most companies know their teams use AI. Idea OS shows you exactly <em>how</em> — and where the leverage is.
            </p>
          </div>
        </InView>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {BIZ_FEATURES.map((f) => (
            <motion.div key={f.title} variants={fadeUp}
              className="rounded-2xl bg-[#111118] border border-[#1E1E2E] p-6 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(247,201,72,0.12), transparent)' }} />
              <div className="w-9 h-9 rounded-xl bg-[#F7C948]/8 flex items-center justify-center text-[#F7C948] text-[16px] mb-4">
                {f.icon}
              </div>
              <h3 className="text-[13px] font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>

        <InView className="flex flex-col sm:flex-row items-center gap-4 justify-center">
          <a
            href="/login"
            className="h-11 px-7 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[13px] font-semibold hover:bg-[#E6B830] transition-colors flex items-center justify-center"
          >
            Set up for your team →
          </a>
          <a
            href="#pricing"
            className="h-11 px-7 rounded-xl border border-[#1E1E2E] text-white/60 text-[13px] font-medium hover:border-[#2A2A3A] hover:text-white/80 transition-colors flex items-center justify-center"
          >
            See enterprise pricing
          </a>
        </InView>
      </div>
    </section>
  );
}

/* ─── Screenshot showcase ───────────────────────────────────────────────── */
const DESKTOP_SHOTS = [
  { file: 'desktop-dashboard.png', label: 'Dashboard' },
  { file: 'desktop-ideas.png',     label: 'Ideas' },
  { file: 'desktop-analytics.png', label: 'Analytics' },
  { file: 'desktop-profile.png',   label: 'Profile' },
];

const MOBILE_SHOTS = [
  { file: 'mobile-dashboard.png',  label: 'Dashboard' },
  { file: 'mobile-ideas.png',      label: 'Ideas' },
  { file: 'mobile-analytics.png',  label: 'Analytics' },
  { file: 'mobile-profile.png',    label: 'Profile' },
];

function ScreenshotCard({ file, label, onClick, mobile = false }: {
  file: string; label: string; onClick: () => void; mobile?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const src = `/screenshots/${file}`;

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden border border-[#1E1E2E] bg-[#111118] cursor-pointer hover:border-[#2A2A3A] transition-colors group ${
        mobile ? 'w-[220px] sm:w-[260px]' : 'w-[480px] sm:w-[580px]'
      }`}
      style={{ aspectRatio: mobile ? '9/19' : '16/10' }}
      onClick={onClick}
    >
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          <div className="w-10 h-10 rounded-xl bg-[#1E1E2E] flex items-center justify-center text-white/20 text-xl">◫</div>
          <p className="text-[10px] font-mono text-white/20 text-center">{label}</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt={label}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-white/80 text-[14px]">⊕</span>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-12 pointer-events-none"
           style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))' }} />
      <div className="absolute bottom-3 left-3">
        <span className="text-[10px] font-mono text-white/50">{label}</span>
      </div>
    </div>
  );
}

function Screenshots() {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const fn = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const shots = useMemo(() => (isMobile && MOBILE_SHOTS.length ? MOBILE_SHOTS : DESKTOP_SHOTS), [isMobile]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleEnter = () => { pausedRef.current = true; };
    const handleLeave = () => { pausedRef.current = false; };
    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);

    let animId: number;
    let lastTime = 0;
    const speed = 0.08; // px per ms — very gentle drift

    function step(ts: number) {
      if (!pausedRef.current && el) {
        const dt = lastTime ? ts - lastTime : 0;
        el.scrollLeft += speed * dt;
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
          el.scrollLeft = 0;
        }
      }
      lastTime = ts;
      animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, []);

  return (
    <section className="py-24 overflow-hidden">
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 cursor-pointer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/screenshots/${lightbox}`} alt="" className="w-full rounded-2xl border border-[#1E1E2E]" />
              <button
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                onClick={() => setLightbox(null)}
              >✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6">
        <InView className="text-center mb-10">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">In the wild</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white mb-4">See it in action</h2>
          <a
            href="/demo"
            className="inline-flex h-9 px-5 rounded-xl bg-[#F7C948]/10 border border-[#F7C948]/20 text-[#F7C948] text-[12px] font-semibold hover:bg-[#F7C948]/20 transition-colors items-center justify-center"
          >
            Try the demo →
          </a>
        </InView>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 px-6 overflow-x-auto pb-4 select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {shots.map((s) => (
          <div key={s.file} className="shrink-0">
            <ScreenshotCard {...s} mobile={isMobile} onClick={() => setLightbox(s.file)} />
          </div>
        ))}
        {/* Duplicate for seamless loop */}
        {shots.map((s) => (
          <div key={`dup-${s.file}`} className="shrink-0">
            <ScreenshotCard {...s} mobile={isMobile} onClick={() => setLightbox(s.file)} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── Privacy ───────────────────────────────────────────────────────────── */
const PRIVACY_CARDS = [
  { icon: '◑', title: 'Zero conversation storage', body: 'Your raw conversation text is processed and never stored on our servers. We only keep statistical metadata — word counts, code lines, dates.' },
  { icon: '⊞', title: 'No training on your data', body: 'Nothing you upload is used to train any AI model. Your ideas and conversations are not our data.' },
  { icon: '↗', title: 'Export and delete anytime', body: 'You own your data. Download everything or delete your account instantly — no waiting periods, no dark patterns.' },
  { icon: '⛨', title: 'Auth without password', body: 'Magic link sign-in only — no passwords to manage or compromise. Your account is as secure as your email inbox.' },
];

function Privacy() {
  return (
    <section className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-center">
          <InView>
            <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-4">We take this seriously</p>
            <h2 className="text-[34px] sm:text-[44px] font-bold text-white mb-6 leading-tight">Privacy by design</h2>
            <p className="text-[15px] text-white/40 leading-relaxed max-w-md">
              Your conversations are some of the most sensitive data you have. We designed Idea OS from day one so that data stays with you.
            </p>
          </InView>
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {PRIVACY_CARDS.map((p) => (
              <motion.div key={p.title} variants={fadeUp}
                className="bg-[#111118] border border-[#1E1E2E] rounded-2xl p-5">
                <div className="w-8 h-8 rounded-lg bg-[#F7C948]/8 flex items-center justify-center text-[#F7C948] text-[14px] mb-3">
                  {p.icon}
                </div>
                <h3 className="text-[13px] font-semibold text-white mb-1.5">{p.title}</h3>
                <p className="text-[11px] text-white/35 leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Export guide ──────────────────────────────────────────────────────── */
const EXPORT_GUIDES = [
  {
    id: 'claude', name: 'Claude', color: '#FF7B3D',
    steps: [
      'Go to claude.ai and sign in to your account',
      'Click your profile picture → Settings',
      'Under "Privacy & Security", click "Export data"',
      'Click "Export conversations" and confirm',
      'Check your email — you\'ll receive a download link within minutes',
      'Download the .zip file and extract it',
      'Upload the conversations.json file to Idea OS',
    ],
  },
  {
    id: 'chatgpt', name: 'ChatGPT', color: '#10A37F',
    steps: [
      'Go to chat.openai.com and sign in',
      'Click your profile in the bottom-left → Settings',
      'Go to "Data controls" tab',
      'Click "Export data" → "Confirm export"',
      'Check your email for the download link (can take up to 24 hours)',
      'Download and extract the zip file',
      'Upload the conversations.json file to Idea OS',
    ],
  },
  {
    id: 'gemini', name: 'Gemini', color: '#4285F4',
    steps: [
      'Go to takeout.google.com (Google Takeout)',
      'Click "Deselect all" to start fresh',
      'Enable "Google AI" or "Gemini Apps Activity"',
      'Click "Next step" → choose delivery method (email link recommended)',
      'Click "Create export" — this can take a few hours',
      'Download and extract the archive when the email arrives',
      'Locate the Gemini conversation data and upload to Idea OS',
    ],
  },
  {
    id: 'grok', name: 'Grok', color: '#1DA1F2',
    steps: [
      'Go to x.com and sign in',
      'Navigate to Settings → Privacy and safety → Your account → Download an archive of your data',
      'Select your data categories and request a download',
      'Note: Grok-specific export is limited — full Grok support is coming soon to Idea OS',
    ],
    note: 'Support coming soon',
  },
  {
    id: 'copilot', name: 'Copilot', color: '#0078D4',
    steps: [
      'Go to account.microsoft.com',
      'Navigate to Privacy → Export your data',
      'Select "Copilot" and request an export',
      'Download your data archive when ready',
    ],
    note: 'Enhanced support coming soon',
  },
  {
    id: 'perplexity', name: 'Perplexity', color: '#20808D',
    steps: [
      'Go to perplexity.ai and sign in',
      'Navigate to Settings → Data section (Pro users)',
      'Look for "Export" option',
    ],
    note: 'Support coming soon',
  },
];

function ExportGuide() {
  const [active, setActive] = useState('claude');
  const guide = EXPORT_GUIDES.find((g) => g.id === active)!;

  return (
    <section id="export-guide" className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-12">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Works with every major AI tool</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white">How to export your conversations</h2>
        </InView>

        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {EXPORT_GUIDES.map((g) => (
            <button key={g.id} onClick={() => setActive(g.id)}
              className={`px-4 py-2 rounded-xl text-[12px] font-medium transition-all ${
                active === g.id
                  ? 'text-[#0A0A0F] font-semibold'
                  : 'border border-[#1E1E2E] text-white/40 hover:text-white/70 hover:border-[#2A2A3A]'
              }`}
              style={active === g.id ? { backgroundColor: g.color } : {}}>
              {g.name}
            </button>
          ))}
        </div>

        {/* Fixed-height wrapper so switching tabs doesn't shift content below */}
        <div className="max-w-[60%] mx-auto min-w-[300px]" style={{ height: 460, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8 h-full overflow-hidden">
              <div className="flex items-center gap-3 mb-7">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: guide.color }} />
                <h3 className="text-[16px] font-semibold text-white">Exporting from {guide.name}</h3>
                {guide.note && (
                  <span className="ml-auto px-3 py-1 rounded-full bg-[#1E1E2E] text-[10px] font-mono text-white/40">
                    {guide.note}
                  </span>
                )}
              </div>
              <ol className="space-y-4">
                {guide.steps.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-[11px] font-mono text-white/20 mt-0.5 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-[13px] text-white/60 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ───────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: 'Demo',       price: 'Free', period: 'forever',
    highlight: false,   badge: null,   note: null,
    checkout: null,     ctaHref: '/demo',
    cta: 'Visit demo',
    features: ['Sample data dashboard — no real data', 'Full UI preview across all features', 'No sign-up required'],
  },
  {
    name: 'Free',       price: 'Free', period: 'own API key',
    highlight: false,   badge: 'Privacy-first',
    note: 'We never receive or store your API key — it lives only in your browser.',
    checkout: null,     ctaHref: '/login',
    cta: 'Get started',
    features: ['Use your own Claude API key', 'Unlimited conversations', 'Full analysis & idea extraction', 'API key stays in your browser only'],
  },
  {
    name: 'One-time',   price: '$3',   period: 'one-time',
    highlight: true,    badge: 'Best value', note: null,
    checkout: 'one-time', ctaHref: null,
    cta: 'Get full access',
    features: ['Analyse up to 150 conversations', 'Full idea intelligence & grading', 'Analytics & productivity score', 'Signals engine & insights', 'Export your data anytime'],
  },
  {
    name: 'Monthly',    price: '$10',  period: '/month',
    highlight: false,   badge: null,   note: null,
    checkout: 'monthly', ctaHref: null,
    cta: 'Subscribe',
    features: ['Everything in One-time', '4 syncs per month (weekly)', 'Incremental — new convos only', 'Unlimited total conversations', 'Priority support'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: 'contact us',
    highlight: false,   badge: null,   note: null,
    checkout: null,     ctaHref: null,    contactForm: true,
    cta: 'Contact us',
    features: ['Team conversation analytics', 'Per-member insights & breakdowns', 'Bring your own API key', 'SSO & admin controls', 'Dedicated support'],
  },
];

function CheckoutModal({ plan, onClose }: { plan: { name: string; price: string; checkout: string }; onClose: () => void }) {
  const [gateway, setGateway] = useState<'lemonsqueezy' | 'paystack'>('lemonsqueezy');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const { formatNgn } = useUsdToNgn();

  useEffect(() => {
    import('@/lib/supabase').then(({ getSupabase }) => {
      getSupabase().auth.getSession().then(({ data }) => {
        if (data.session) setIsAuthed(true);
      });
    });
  }, []);

  const usdAmount = PLAN_AMOUNTS_USD[plan.checkout];
  const displayPrice = gateway === 'paystack' && usdAmount ? formatNgn(usdAmount) : plan.price;

  const handleSubmit = async () => {
    if (!isAuthed && !email.trim()) return;
    setStage('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/payment/${gateway}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.checkout, ...(isAuthed ? {} : { email: email.trim() }) }),
      });
      const data = await res.json();
      const url = data.authorization_url || data.url;
      if (url) { window.location.href = url; return; }
      if (data.details) console.error(`[Idea OS] ${gateway} checkout error:`, data.details);
      setErrorMsg(data.error || 'Could not start checkout.');
      setStage('error');
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStage('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#111118] border border-[#1E1E2E] rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[11px] font-mono text-[#F7C948] uppercase tracking-widest mb-1">{plan.name} plan</p>
            <p className="text-[26px] font-bold text-white leading-none">{displayPrice}</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors mt-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Gateway tabs */}
        <div className="flex gap-2 mb-1.5">
          {(['lemonsqueezy', 'paystack'] as const).map((g) => (
            <button key={g} onClick={() => setGateway(g)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-colors border ${
                gateway === g ? 'bg-[#F7C948]/10 border-[#F7C948]/40 text-[#F7C948]' : 'border-[#1E1E2E] text-white/40 hover:text-white/60'
              }`}>
              {g === 'lemonsqueezy' ? 'Pay in USD' : 'Pay in Naira'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-white/25 font-mono mb-4">
          {gateway === 'paystack' ? 'Charged in Naira — cards, bank transfer, USSD' : 'Supports cards worldwide, PayPal'}
        </p>

        {!isAuthed && (
          <div className="mb-4">
            <label className="block text-[11px] font-mono text-white/40 uppercase tracking-widest mb-1.5">Your email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder="you@example.com"
              className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-lg px-3 py-2.5 text-sm text-[#F0F0F5] placeholder-[#3A3A55] focus:outline-none focus:border-[#F7C948]/40 transition-colors"
              autoFocus
            />
          </div>
        )}

        {errorMsg && <p className="text-[11px] text-[#F87171] mb-3">{errorMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={stage === 'loading' || (!isAuthed && !email.trim())}
          className="w-full h-11 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[13px] font-bold hover:bg-[#E6B830] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {stage === 'loading' ? (
            <><div className="w-4 h-4 border-2 border-[#0A0A0F]/30 border-t-[#0A0A0F] rounded-full animate-spin" /> Redirecting to payment…</>
          ) : (
            `Pay ${displayPrice}`
          )}
        </button>
        {!isAuthed && (
          <p className="text-[10px] text-white/25 text-center mt-3">
            After payment, we&apos;ll email you a sign-in link to access your dashboard.
          </p>
        )}
      </div>
    </div>
  );
}

function Pricing() {
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: string; checkout: string } | null>(null);
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <section id="pricing" className="px-6 py-24 bg-[#0D0D14]">
        <div className="max-w-6xl mx-auto">
          <InView className="text-center mb-14">
            <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Simple pricing</p>
            <h2 className="text-[34px] sm:text-[44px] font-bold text-white mb-3">Try Free First and Pay for More Access</h2>
            <p className="text-[14px] text-white/35">Start with the demo or your own API key. Pay $3 for full access. Scale from there.</p>
          </InView>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PLANS.map((p, i) => (
              <InView key={p.name} delay={i * 0.07}
                className={`rounded-2xl border p-6 flex flex-col relative ${
                  i === PLANS.length - 1 && PLANS.length % 3 !== 0
                    ? 'sm:col-span-2 sm:mx-auto sm:max-w-[calc(50%-8px)] sm:w-full lg:col-span-1 lg:max-w-none lg:w-auto xl:col-span-1'
                    : ''
                } ${p.highlight ? 'border-[#F7C948]/40 bg-[#F7C948]/5' : 'border-[#1E1E2E] bg-[#111118]'}`}>
                {p.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono whitespace-nowrap ${
                    p.highlight ? 'bg-[#F7C948] text-[#0A0A0F]' : 'bg-[#1E1E2E] text-white/50'
                  }`}>{p.badge}</div>
                )}
                <div className="mb-5">
                  <p className="text-[11px] font-mono text-white/40 mb-2">{p.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[30px] font-bold text-white leading-none">{p.price}</span>
                    <span className="text-[11px] text-white/30">{p.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-[12px] text-white/55">
                      <span className={`mt-0.5 shrink-0 text-[10px] ${p.highlight ? 'text-[#F7C948]' : 'text-white/25'}`}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.note && <p className="text-[10px] text-white/30 font-mono leading-relaxed mb-4 italic">{p.note}</p>}

                {(p as { comingSoon?: boolean }).comingSoon ? (
                  <span className="w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center border border-[#1E1E2E] text-white/25 cursor-not-allowed select-none">
                    Coming soon
                  </span>
                ) : (p as { contactForm?: boolean }).contactForm ? (
                  <button
                    onClick={() => setShowContact(true)}
                    className="w-full h-10 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center cursor-pointer border border-[#1E1E2E] text-white/60 hover:border-[#2A2A3A] hover:text-white/80"
                  >{p.cta}</button>
                ) : p.checkout ? (
                  <button
                    onClick={() => setCheckoutPlan({ name: p.name, price: p.price, checkout: p.checkout! })}
                    className={`w-full h-10 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center cursor-pointer ${
                      p.highlight ? 'bg-[#F7C948] text-[#0A0A0F] hover:bg-[#E6B830]' : 'border border-[#1E1E2E] text-white/60 hover:border-[#2A2A3A] hover:text-white/80'
                    }`}>{p.cta}</button>
                ) : (
                  <a href={p.ctaHref ?? '#'}
                    className={`w-full h-10 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center ${
                      p.highlight ? 'bg-[#F7C948] text-[#0A0A0F] hover:bg-[#E6B830]' : 'border border-[#1E1E2E] text-white/60 hover:border-[#2A2A3A] hover:text-white/80'
                    }`}>{p.cta}</a>
                )}
              </InView>
            ))}
          </div>
        </div>
      </section>

      {checkoutPlan && <CheckoutModal plan={checkoutPlan} onClose={() => setCheckoutPlan(null)} />}
      <AnimatePresence>
        {showContact && <ContactFormModal onClose={() => setShowContact(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ─── Bigger picture ─────────────────────────────────────────────────────── */
const BIGGER_CARDS = [
  { title: 'The most valuable skill', body: 'In the next decade — knowing how to think, prompt, and build alongside AI at a sustained, high level.' },
  { title: 'Know your patterns', body: 'The builders who win will be the ones who understand their own patterns — what they\'re building toward and where they get stuck.' },
  { title: 'Just the beginning', body: 'Real-time sync, cross-tool intelligence, team collaboration, AI coaching — all coming, built on understanding how you work.' },
];

function FutureOfAI() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-14">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-4">A bigger picture</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white leading-tight">
            The future is AI-native builders
          </h2>
        </InView>

        <motion.div
          className="grid sm:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-10"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {BIGGER_CARDS.map((card, i) => (
            <motion.div key={card.title} variants={fadeUp} custom={i}
              className="relative rounded-2xl aspect-[4/3] flex flex-col justify-center p-8"
            >
              {/* Prominent corner brackets — 3× size */}
              <div className="absolute top-0 left-0 w-9 h-9 pointer-events-none">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <line x1="0" y1="20" x2="0" y2="0" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                  <line x1="0" y1="0" x2="20" y2="0" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                </svg>
              </div>
              <div className="absolute top-0 right-0 w-9 h-9 pointer-events-none">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <line x1="36" y1="20" x2="36" y2="0" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                  <line x1="36" y1="0" x2="16" y2="0" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                </svg>
              </div>
              <div className="absolute bottom-0 left-0 w-9 h-9 pointer-events-none">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <line x1="0" y1="16" x2="0" y2="36" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                  <line x1="0" y1="36" x2="20" y2="36" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                </svg>
              </div>
              <div className="absolute bottom-0 right-0 w-9 h-9 pointer-events-none">
                <svg viewBox="0 0 36 36" className="w-full h-full">
                  <line x1="36" y1="16" x2="36" y2="36" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                  <line x1="36" y1="36" x2="16" y2="36" stroke="#F7C948" strokeWidth="2.5" strokeOpacity="0.7" />
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-[12px] text-white/45 leading-relaxed">{card.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Contact CTA ─────────────────────────────────────────────────────────── */
function ContactCTA() {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="px-6 py-24 bg-[#0D0D14]">
      <AnimatePresence>
        {showForm && <ContactFormModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto text-center">
        <InView>
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#F7C948] items-center justify-center text-[#0A0A0F] font-bold text-[18px] mb-8">
            IO
          </div>
          <h2 className="text-[34px] sm:text-[48px] font-bold text-white mb-5 leading-tight">
            Ready to see your<br />AI journey?
          </h2>
          <p className="text-[15px] text-white/40 mb-10 max-w-md mx-auto">
            Start with the demo — no sign-up needed. Or get started with your own data.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-14">
            <a href="/demo"
              className="h-12 px-7 rounded-xl border border-[#1E1E2E] text-white/70 text-[14px] font-medium hover:border-[#2A2A3A] hover:text-white transition-colors flex items-center justify-center">
              Visit demo
            </a>
            <a href="/login"
              className="h-12 px-8 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#E6B830] transition-colors flex items-center justify-center">
              Get started →
            </a>
          </div>

          {/* Contact links */}
          <div className="border-t border-[#1A1A28] pt-10">
            <p className="text-[11px] font-mono text-[#3A3A55] uppercase tracking-widest mb-6">Get in touch</p>
            <div className="flex items-center justify-center gap-5 flex-wrap">
              <a href={CONTACT_LINKEDIN} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5zM8 19H5V8h3v11zM6.5 6.73c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zM20 19h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97V19h-3V8h2.89v1.5h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59V19z"/>
                </svg>
                LinkedIn
              </a>
              <a href={CONTACT_X} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.734-8.836L1.524 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X (Twitter)
              </a>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Send a message
              </button>
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}

/* ─── Footer ────────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="px-6 py-10 border-t border-[#1E1E2E]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#F7C948] flex items-center justify-center">
            <span className="text-[#0A0A0F] font-bold text-[8px]">IO</span>
          </div>
          <span className="text-white/60 text-[13px]">Idea OS</span>
        </div>
        <p className="text-[12px] text-white/20 font-mono">© {new Date().getFullYear()} Idea OS. Built by a builder, for builders.</p>
        <div className="flex gap-6">
          <a href="#how-it-works" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">How it works</a>
          <a href="/login" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">Get started</a>
        </div>
      </div>
    </footer>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────────── */
export function WaitlistPage() {
  useCallback(() => {}, []);

  return (
    <div
      data-landing=""
      className="bg-[#0A0A0F] min-h-screen text-white"
      style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' } as React.CSSProperties}
    >
      <Nav />
      <Hero />
      <WhatItIs />
      <HowItWorks />
      <TheJourney />
      <Features />
      <ForBusinesses />
      <Screenshots />
      <Privacy />
      <ExportGuide />
      <Pricing />
      <FutureOfAI />
      <ContactCTA />
      <Footer />
    </div>
  );
}
