'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

/* ─── Contact config (replace with real values) ─────────────────────────── */
const CONTACT_LINKEDIN = 'https://linkedin.com/in/YOUR_HANDLE';
const CONTACT_X        = 'https://x.com/YOUR_HANDLE';
const CONTACT_EMAIL    = 'hello@ideaos.co';
const CONTACT_FORM_URL = 'https://forms.gle/YOUR_GOOGLE_FORM_ID';

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

function InView({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
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
      <div className="max-w-6xl mx-auto px-6 h-[62px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F7C948] flex items-center justify-center shrink-0">
            <span className="text-[#0A0A0F] font-bold text-[10px]">IO</span>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Idea OS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[['how-it-works', 'How it works'], ['features', 'Features'], ['pricing', 'Pricing'], ['export-guide', 'Export guide']].map(([id, label]) => (
            <a key={id} href={`#${id}`}
               className="text-[13px] text-white/40 hover:text-white/80 transition-colors">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/demo"
            className="h-9 px-4 rounded-full border border-[#1E1E2E] text-white/60 text-[13px] font-medium hover:border-[#2A2A3A] hover:text-white/80 transition-colors hidden sm:flex items-center"
          >
            Visit demo
          </a>
          <a
            href="/login"
            className="h-9 px-5 rounded-full bg-[#F7C948] text-[#0A0A0F] text-[13px] font-semibold hover:bg-[#E6B830] transition-colors flex items-center"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── Cycling animated word ──────────────────────────────────────────────── */
const CYCLING_WORDS = ['Visualized', 'Analysed', 'Optimized', 'Decoded', 'Understood'];

function CyclingWord() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % CYCLING_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="inline-block overflow-hidden relative" style={{ minWidth: '8ch' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ y: 48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.38, ease }}
          className="text-[#F7C948] inline-block"
        >
          {CYCLING_WORDS[idx]}.
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/* ─── Animated line graph with floating insight chips ────────────────────── */
function AnimatedGraph() {
  const points = [12, 28, 18, 42, 35, 55, 48, 68, 62, 78, 72, 88];
  const w = 500, h = 180;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map((v) => h - (v / 100) * h);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');

  const chips = [
    { label: '↑ Productivity score', x: '62%', y: '12%', delay: 0.5 },
    { label: '47 ideas captured', x: '20%', y: '52%', delay: 0.8 },
    { label: '🔁 Recurring pattern', x: '72%', y: '60%', delay: 1.1 },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto h-[200px]">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F7C948" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#F7C948" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7C948" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#F7C948" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={`${path} L${w},${h} L0,${h} Z`}
          fill="url(#fillGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />
        <motion.path
          d={path}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.2 }}
        />
        {points.map((_, i) => (
          <motion.circle
            key={i}
            cx={xs[i]} cy={ys[i]} r={3}
            fill="#F7C948"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + (i / points.length) * 1.2, duration: 0.3 }}
          />
        ))}
      </svg>
      {chips.map((chip) => (
        <motion.div
          key={chip.label}
          className="absolute px-3 py-1.5 rounded-full bg-[#111118] border border-[#F7C948]/25 text-[10px] font-mono text-[#F7C948]/80 whitespace-nowrap pointer-events-none"
          style={{ left: chip.x, top: chip.y }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: chip.delay, duration: 0.4, ease }}
        >
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
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-[0.065]"
             style={{ background: 'radial-gradient(ellipse, #F7C948, transparent 70%)' }} />
      </div>

      <motion.div style={{ y }} className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F7C948]/20 bg-[#F7C948]/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F7C948] animate-pulse" />
            <span className="text-[#F7C948] text-[10px] font-mono uppercase tracking-widest">Now open · Start free</span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-[48px] sm:text-[68px] lg:text-[84px] font-bold text-white leading-[0.93] tracking-tight mb-5">
            Your AI journey,<br />
            <CyclingWord />
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-[15px] sm:text-[17px] text-white/45 max-w-md mx-auto mb-10 leading-relaxed">
            Turn your Claude conversations into a personal intelligence dashboard — ideas, patterns, and insights, all in one place.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-3 flex-wrap mb-6">
            <a
              href="/demo"
              className="h-12 px-7 rounded-xl border border-[#1E1E2E] text-white/70 text-[14px] font-medium hover:border-[#2A2A3A] hover:text-white transition-colors"
            >
              Visit demo
            </a>
            <a
              href="/login"
              className="h-12 px-8 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#E6B830] transition-colors"
            >
              Get started →
            </a>
          </motion.div>

          <motion.p variants={fadeUp} custom={4} className="text-white/20 text-[11px] font-mono">
            Free to try · No credit card · Works with Claude, ChatGPT, Gemini &amp; more
          </motion.p>
        </motion.div>
      </motion.div>

      <InView className="relative z-10 w-full max-w-3xl mx-auto mt-20 px-2">
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
];

function IsCard({ item, isNot }: { item: { emoji: string; text: string }; isNot: boolean }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`rounded-2xl p-6 border ${isNot ? 'border-[#1E1E2E] bg-[#0D0D14]' : 'border-[#F7C948]/15 bg-[#F7C948]/3'}`}
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

      <div className="grid sm:grid-cols-2 gap-12">
        <div>
          <p className="text-[10px] font-mono text-[#F7C948]/60 uppercase tracking-widest mb-5">It IS</p>
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {IS_CARDS.map((item, i) => (
              <div key={i} className={i === IS_CARDS.length - 1 && IS_CARDS.length % 2 !== 0 ? 'col-span-2 max-w-[calc(50%-6px)] mx-auto w-full' : ''}>
                <IsCard item={item} isNot={false} />
              </div>
            ))}
          </motion.div>
        </div>
        <div>
          <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-5">It&apos;s NOT</p>
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {ISNT_CARDS.map((item, i) => (
              <div key={i} className={i === ISNT_CARDS.length - 1 && ISNT_CARDS.length % 2 !== 0 ? 'col-span-2 max-w-[calc(50%-6px)] mx-auto w-full' : ''}>
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
    <section id="how-it-works" className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-16">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white">How it works</h2>
        </InView>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Loopy connector line behind cards */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 pointer-events-none -translate-y-1/2 px-16" style={{ zIndex: 0 }}>
            <svg viewBox="0 0 800 60" className="w-full" style={{ height: 60 }}>
              <path
                d="M0,30 C80,10 120,50 200,30 C280,10 320,50 400,30 C480,10 520,50 600,30 C680,10 720,50 800,30"
                fill="none" stroke="#1E1E2E" strokeWidth="1.5" strokeDasharray="6 4"
              />
            </svg>
          </div>

          {HOW_STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: i % 2 === 0 ? 0 : 24 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12, ease }}
              className="relative z-10"
              style={{ marginTop: i % 2 !== 0 ? 32 : 0 }}
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
    </section>
  );
}

/* ─── Origin story ───────────────────────────────────────────────────────── */
function TheJourney() {
  return (
    <section className="px-6 py-28 relative overflow-hidden">
      {/* Graph paper background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#F7C948 1px, transparent 1px), linear-gradient(90deg, #F7C948 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        <InView className="text-center mb-12">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">The origin story</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white leading-tight"
            style={{ transform: 'rotate(-0.5deg)' }}>
            It started as a<br />personal obsession
          </h2>
        </InView>

        <div className="space-y-6 text-[15px] sm:text-[16px] text-white/50 leading-relaxed relative">
          {/* Loopy connector between paragraphs */}
          <div className="absolute -left-8 top-0 bottom-0 pointer-events-none hidden sm:block" style={{ width: 24 }}>
            <svg viewBox="0 0 24 600" className="w-full h-full" preserveAspectRatio="none">
              <path d="M12,0 C4,80 20,120 12,200 C4,280 20,320 12,400 C4,480 20,520 12,600"
                fill="none" stroke="#1E1E2E" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          {[
            'I\'d been building with Claude every single day. Ideas in the morning, code reviews at night. But I had no idea how I was actually using it — what patterns I was falling into, which sessions were most productive, or where my ideas were coming from.',
            'One day I exported my conversations just to see what was in there. Thousands of messages. Hundreds of code blocks. Ideas scattered across dozens of chats that I\'d completely forgotten about.',
            'I wanted a mirror — something that could show me my own AI usage like a Spotify Wrapped for how I build. The peaks, the patterns, the productivity score. So I built it. For me first. Then people started asking to use it. This is Idea OS.',
          ].map((text, i) => (
            <InView key={i} delay={i * 0.1}>
              <p>{text}</p>
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

        {/* Title card centred at top + 5 feature cards */}
        <div className="relative">
          {/* Top title card */}
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

          {/* 5 feature cards */}
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {FEATURE_ITEMS.map((f) => (
              <motion.div key={f.title} variants={fadeUp}
                className="rounded-2xl border-0 bg-[#111118] p-7 hover:bg-[#131320] transition-colors group relative overflow-hidden">
                {/* Divider line at top instead of border */}
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

/* ─── Screenshot showcase ───────────────────────────────────────────────── */
const DESKTOP_SHOTS = [
  { file: 'desktop-dashboard.png', label: 'Dashboard' },
  { file: 'desktop-ideas.png',     label: 'Ideas' },
  { file: 'desktop-analytics.png', label: 'Analytics' },
  { file: 'desktop-profile.png',   label: 'Profile' },
  { file: 'desktop-insights.png',  label: 'Insights' },
];
const MOBILE_SHOTS = [
  { file: 'mobile-dashboard.png',  label: 'Dashboard' },
  { file: 'mobile-ideas.png',      label: 'Ideas' },
  { file: 'mobile-profile.png',    label: 'Profile' },
  { file: 'mobile-analytics.png',  label: 'Analytics' },
];

function ScreenshotCard({ file, label, isMobile, onClick }: {
  file: string; label: string; isMobile: boolean; onClick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const src = `/screenshots/${file}`;
  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden border border-[#1E1E2E] bg-[#111118] cursor-pointer hover:border-[#2A2A3A] transition-colors group ${
        isMobile ? 'w-[180px] sm:w-[210px]' : 'w-[480px] sm:w-[580px]'
      }`}
      style={{ aspectRatio: isMobile ? '9/19.5' : '16/10' }}
      onClick={onClick}
    >
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          <div className="w-10 h-10 rounded-xl bg-[#1E1E2E] flex items-center justify-center text-white/20 text-xl">◫</div>
          <p className="text-[10px] font-mono text-white/20 text-center">{label}</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)}
           className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
      {/* Hover overlay */}
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
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop');
  const [lightbox, setLightbox] = useState<string | null>(null);
  const shots = mode === 'desktop' ? DESKTOP_SHOTS : MOBILE_SHOTS;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on desktop
  useEffect(() => {
    if (mode !== 'desktop') return;
    const el = scrollRef.current;
    if (!el) return;
    let paused = false;
    const handleEnter = () => { paused = true; };
    const handleLeave = () => { paused = false; };
    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);
    const interval = setInterval(() => {
      if (paused) return;
      el.scrollBy({ left: 1, behavior: 'auto' });
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 10) el.scrollLeft = 0;
    }, 20);
    return () => {
      clearInterval(interval);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [mode]);

  return (
    <section className="py-24 overflow-hidden">
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
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
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="inline-flex rounded-xl border border-[#1E1E2E] bg-[#111118] p-1 gap-1">
              {(['desktop', 'mobile'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-5 py-2 rounded-lg text-[12px] font-mono transition-all capitalize ${
                    mode === m ? 'bg-[#F7C948] text-[#0A0A0F] font-semibold' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
            <a
              href="/demo"
              className="h-9 px-5 rounded-xl bg-[#F7C948]/10 border border-[#F7C948]/20 text-[#F7C948] text-[12px] font-semibold hover:bg-[#F7C948]/20 transition-colors"
            >
              Try the demo →
            </a>
          </div>
        </InView>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          ref={mode === 'desktop' ? scrollRef : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex gap-4 px-6 overflow-x-auto pb-4 ${mode === 'mobile' ? 'justify-center flex-wrap' : ''}`}
          style={{ scrollSnapType: mode === 'desktop' ? 'x mandatory' : undefined }}
        >
          {shots.map((s) => (
            <div key={s.file} style={{ scrollSnapAlign: 'start' }}>
              <ScreenshotCard {...s} isMobile={mode === 'mobile'} onClick={() => setLightbox(s.file)} />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>
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
        <div className="grid lg:grid-cols-[1fr_1fr] gap-16 items-start">
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

        {/* Centred agent tabs */}
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

        {/* 60% width centered content */}
        <div className="max-w-[60%] mx-auto min-w-[300px]">
          <AnimatePresence mode="wait">
            <motion.div key={active}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8">
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
    name: 'Demo',
    price: 'Free',
    period: 'forever',
    highlight: false,
    badge: null,
    features: [
      'Sample data dashboard (no real data)',
      'See the full UI and features',
      'Ideas, analytics, profile views',
      'No sign-up required',
    ],
    cta: 'Visit demo',
    ctaHref: '/demo',
  },
  {
    name: 'Trial',
    price: '$1',
    period: 'one-time',
    highlight: false,
    badge: 'Try it out',
    features: [
      'Analyse your last ~7 days of convos',
      'Up to 20 conversations per sync',
      'Full idea extraction & grading',
      'Builder profile snapshot',
      'Valid for 7 days',
    ],
    cta: 'Start trial',
    ctaHref: '/login',
  },
  {
    name: 'Full analysis',
    price: '$5',
    period: 'one-time',
    highlight: true,
    badge: 'Best value',
    features: [
      'Analyse up to 150 conversations',
      'Full idea intelligence & grouping',
      'Analytics & productivity score',
      'Signals engine & insights',
      'Export your data anytime',
    ],
    cta: 'Get full access',
    ctaHref: '/login',
  },
  {
    name: 'Monthly',
    price: '$10',
    period: '/month',
    highlight: false,
    badge: null,
    features: [
      'Everything in Full analysis',
      '4 syncs per month (weekly cadence)',
      'Incremental — only new convos',
      'Unlimited total conversations',
      'Priority support',
    ],
    cta: 'Subscribe',
    ctaHref: '/login',
  },
];

function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-14">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Simple pricing</p>
          <h2 className="text-[34px] sm:text-[44px] font-bold text-white mb-3">Try free, pay only if it&apos;s useful</h2>
          <p className="text-[14px] text-white/35">Start with the demo. Pay $1 to try with your own data. Go deeper from there.</p>
        </InView>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p, i) => (
            <InView key={p.name} delay={i * 0.08}
              className={`rounded-2xl border p-6 flex flex-col relative ${
                p.highlight
                  ? 'border-[#F7C948]/40 bg-[#F7C948]/5'
                  : 'border-[#1E1E2E] bg-[#111118]'
              }`}>
              {p.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono whitespace-nowrap ${
                  p.highlight ? 'bg-[#F7C948] text-[#0A0A0F]' : 'bg-[#1E1E2E] text-white/50'
                }`}>
                  {p.badge}
                </div>
              )}
              <div className="mb-5">
                <p className="text-[11px] font-mono text-white/40 mb-2">{p.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[34px] font-bold text-white leading-none">{p.price}</span>
                  <span className="text-[12px] text-white/30">{p.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12px] text-white/55">
                    <span className={`mt-0.5 shrink-0 text-[10px] ${p.highlight ? 'text-[#F7C948]' : 'text-white/25'}`}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={p.ctaHref}
                className={`w-full h-10 rounded-xl text-[12px] font-semibold transition-colors flex items-center justify-center ${
                  p.highlight
                    ? 'bg-[#F7C948] text-[#0A0A0F] hover:bg-[#E6B830]'
                    : 'border border-[#1E1E2E] text-white/60 hover:border-[#2A2A3A] hover:text-white/80'
                }`}
              >
                {p.cta}
              </a>
            </InView>
          ))}
        </div>
      </div>
    </section>
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
          className="grid sm:grid-cols-3 gap-4"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}
          variants={stagger}
        >
          {BIGGER_CARDS.map((card, i) => (
            <motion.div key={card.title} variants={fadeUp} custom={i}
              className="relative p-6 rounded-2xl bg-[#111118]"
              style={{ marginTop: i % 2 !== 0 ? 20 : 0 }}
            >
              {/* Camera-corner-bracket decoration */}
              {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, j) => (
                <div key={j} className={`absolute ${pos} w-3 h-3 pointer-events-none`}>
                  <svg viewBox="0 0 12 12" className="w-full h-full">
                    {j === 0 && <><line x1="0" y1="6" x2="0" y2="0" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /><line x1="0" y1="0" x2="6" y2="0" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /></>}
                    {j === 1 && <><line x1="12" y1="6" x2="12" y2="0" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /><line x1="12" y1="0" x2="6" y2="0" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /></>}
                    {j === 2 && <><line x1="0" y1="6" x2="0" y2="12" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /><line x1="0" y1="12" x2="6" y2="12" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /></>}
                    {j === 3 && <><line x1="12" y1="6" x2="12" y2="12" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /><line x1="12" y1="12" x2="6" y2="12" stroke="#F7C948" strokeWidth="1.5" strokeOpacity="0.3" /></>}
                  </svg>
                </div>
              ))}
              <h3 className="text-[14px] font-semibold text-white mb-3">{card.title}</h3>
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
  return (
    <section className="px-6 py-24 bg-[#0D0D14]">
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
              className="h-12 px-7 rounded-xl border border-[#1E1E2E] text-white/70 text-[14px] font-medium hover:border-[#2A2A3A] hover:text-white transition-colors">
              Visit demo
            </a>
            <a href="/login"
              className="h-12 px-8 rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[14px] font-semibold hover:bg-[#E6B830] transition-colors">
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
              <a href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                {CONTACT_EMAIL}
              </a>
              <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Send a message
              </a>
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
  // Prevent scroll-restoration flash
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
