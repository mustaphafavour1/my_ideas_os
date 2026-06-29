'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

/* ─── Google Form config ────────────────────────────────────────────────────
   Replace these after creating your form in Gemini/Google Forms.
   FORM_ID: the long ID from the form URL.
   EMAIL_ENTRY: the entry.XXXXXXXXX field ID for the email question.
   ─────────────────────────────────────────────────────────────────────────── */
const FORM_ID = 'YOUR_FORM_ID';
const EMAIL_ENTRY = 'entry.YOUR_EMAIL_ENTRY_ID';

/* ─── Animation helpers ─────────────────────────────────────────────────── */
const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: easeOut },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

function InView({ children, className = '', delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Nav ──────────────────────────────────────────────────────────────── */
function Nav({ scrollToForm }: { scrollToForm: () => void }) {
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
            <span className="text-[#0A0A0F] font-bold text-[13px]">I</span>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Idea OS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[['features', 'Features'], ['how-it-works', 'How it works'], ['pricing', 'Pricing'], ['export-guide', 'Export guide']].map(([id, label]) => (
            <a key={id} href={`#${id}`}
               className="text-[13px] text-white/40 hover:text-white/80 transition-colors">
              {label}
            </a>
          ))}
        </div>
        <button
          onClick={scrollToForm}
          className="h-9 px-5 rounded-full bg-[#F7C948] text-[#0A0A0F] text-[13px] font-semibold hover:bg-[#E6B830] transition-colors"
        >
          Join waitlist
        </button>
      </div>
    </motion.nav>
  );
}

/* ─── Waitlist form (shared between Hero & bottom CTA) ─────────────────── */
function WaitlistForm({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ [EMAIL_ENTRY]: email, submit: 'Submit' }),
      });
    } catch {}
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-[#F7C948]/10 border border-[#F7C948]/25"
      >
        <div className="w-8 h-8 rounded-full bg-[#F7C948]/20 flex items-center justify-center">
          <span className="text-[#F7C948]">✓</span>
        </div>
        <div>
          <p className="text-white font-semibold text-[14px]">You&apos;re on the list!</p>
          <p className="text-white/40 text-[12px] font-mono">We&apos;ll email you when your spot is ready.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className={`flex ${size === 'lg' ? 'flex-col sm:flex-row' : 'flex-row'} gap-2.5 w-full max-w-md`}>
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className={`flex-1 ${size === 'lg' ? 'h-12' : 'h-10'} px-4 rounded-xl bg-[#111118] border border-[#1E1E2E] text-white placeholder:text-white/20 text-[14px] focus:outline-none focus:border-[#F7C948]/40 transition-colors`}
      />
      <button type="submit" disabled={loading}
        className={`${size === 'lg' ? 'h-12 px-8' : 'h-10 px-6'} rounded-xl bg-[#F7C948] text-[#0A0A0F] text-[13px] font-semibold hover:bg-[#E6B830] transition-colors disabled:opacity-60 whitespace-nowrap`}
      >
        {loading ? 'Joining…' : 'Get early access'}
      </button>
    </form>
  );
}

/* ─── App mockup (pure JSX, shown in hero) ──────────────────────────────── */
function AppMockup() {
  const navItems = ['Dashboard', 'Ideas', 'Analytics', 'Conversations', 'Profile'];
  return (
    <div className="rounded-2xl border border-[#1E1E2E] overflow-hidden"
         style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 120px rgba(247,201,72,0.07)' }}>
      {/* Browser chrome */}
      <div className="h-9 bg-[#0D0D14] border-b border-[#1E1E2E] flex items-center px-4 gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 mx-3 h-5 bg-[#1A1A28] rounded flex items-center justify-center">
          <span className="text-[9px] text-white/20 font-mono">app.ideaos.co/dashboard</span>
        </div>
      </div>
      {/* Layout */}
      <div className="flex bg-[#0A0A0F]" style={{ height: 360 }}>
        {/* Sidebar */}
        <div className="w-[52px] sm:w-[160px] bg-[#0A0A0F] border-r border-[#1E1E2E] p-3 flex flex-col gap-1 shrink-0">
          <div className="hidden sm:flex items-center gap-2 mb-3 px-1">
            <div className="w-5 h-5 rounded-md bg-[#F7C948] shrink-0" />
            <span className="text-[11px] font-semibold text-white">Idea OS</span>
          </div>
          {navItems.map((item, i) => (
            <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${i === 0 ? 'bg-[#F7C948]/10' : ''}`}>
              <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${i === 0 ? 'bg-[#F7C948]' : 'bg-[#2A2A3A]'}`} />
              <span className={`hidden sm:block text-[10px] ${i === 0 ? 'text-[#F7C948]' : 'text-[#3A3A55]'}`}>{item}</span>
            </div>
          ))}
        </div>
        {/* Main */}
        <div className="flex-1 p-4 overflow-hidden">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[['47', 'Ideas'], ['91%', 'AI Score'], ['4.1', 'Avg Grade'], ['18k', 'AI Words']].map(([v, l]) => (
              <div key={l} className="bg-[#111118] rounded-xl p-3 border border-[#1E1E2E]">
                <p className="text-[9px] text-[#3A3A55] mb-1">{l}</p>
                <p className="text-[16px] font-bold text-[#D0D0DA]">{v}</p>
              </div>
            ))}
          </div>
          {/* Ring cards row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[['AI Productivity', '91%', '#F7C948'], ['Avg Grade', '4.1/5', '#7A7AF0'], ['Completion', '68%', '#4ADE80']].map(([t, v, c]) => (
              <div key={t} className="bg-[#111118] rounded-xl p-3 border border-[#1E1E2E] flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0"
                     style={{ borderColor: c }}>
                  <span className="text-[8px] font-bold" style={{ color: c }}>{v}</span>
                </div>
                <span className="text-[9px] text-[#6A6A80] hidden sm:block">{t}</span>
              </div>
            ))}
          </div>
          {/* Ideas list */}
          <div className="bg-[#111118] rounded-xl border border-[#1E1E2E] overflow-hidden">
            {[
              ['AI Study Planner', 'product', 'in_progress'],
              ['Async voice notes', 'side_quest', 'captured'],
              ['Builder community', 'community', 'validated'],
            ].map(([title, type, status]) => (
              <div key={title} className="flex items-center gap-3 px-3 py-2.5 border-b border-[#1A1A28] last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F7C948] shrink-0" />
                <span className="text-[10px] text-[#D0D0DA] flex-1 truncate">{title}</span>
                <span className="hidden sm:block text-[8px] px-1.5 py-0.5 rounded bg-[#1A1A28] text-[#6A6A80]">{type}</span>
                <span className="text-[8px] text-[#3A3A55]">{status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ formRef }: { formRef: React.RefObject<HTMLDivElement | null> }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 0.4], [0, -60]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-20 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-[0.07]"
             style={{ background: 'radial-gradient(ellipse, #F7C948, transparent 70%)' }} />
      </div>

      <motion.div style={{ y }} className="relative z-10 text-center max-w-4xl mx-auto w-full">
        <motion.div variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#F7C948]/20 bg-[#F7C948]/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F7C948] animate-pulse" />
            <span className="text-[#F7C948] text-[10px] font-mono uppercase tracking-widest">Early Access — Limited Spots</span>
          </motion.div>

          <motion.h1 variants={fadeUp} custom={1}
            className="text-[52px] sm:text-[72px] lg:text-[90px] font-bold text-white leading-[0.92] tracking-tight mb-7">
            Your AI journey,<br />
            <span className="text-[#F7C948]">visualized.</span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2}
            className="text-[17px] sm:text-[19px] text-white/45 max-w-xl mx-auto mb-10 leading-relaxed">
            Idea OS turns your Claude conversations into a personal intelligence dashboard.
            Discover your builder DNA, track every idea, and understand how you actually use AI.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} ref={formRef} className="flex justify-center mb-4">
            <WaitlistForm size="lg" />
          </motion.div>
          <motion.p variants={fadeUp} custom={4} className="text-white/20 text-[11px] font-mono">
            Free to try · No credit card · Works with Claude, ChatGPT, Gemini &amp; more
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Mockup */}
      <InView className="relative z-10 w-full max-w-5xl mx-auto mt-16 px-2">
        <AppMockup />
        <div className="absolute -bottom-px inset-x-0 h-32 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #0A0A0F)' }} />
      </InView>
    </section>
  );
}

/* ─── What it is / What it's not ─────────────────────────────────────────── */
function WhatItIs() {
  return (
    <section className="px-6 py-24 max-w-5xl mx-auto">
      <InView className="text-center mb-14">
        <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Clarity first</p>
        <h2 className="text-[38px] sm:text-[48px] font-bold text-white">What Idea OS is — and isn&apos;t</h2>
      </InView>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* IS */}
        <InView delay={0.1} className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8">
          <div className="w-10 h-10 rounded-xl bg-[#F7C948]/10 flex items-center justify-center mb-5">
            <span className="text-[20px]">✓</span>
          </div>
          <h3 className="text-[18px] font-semibold text-white mb-4">It IS</h3>
          <ul className="space-y-3">
            {[
              'A read-only dashboard that analyses your past conversations',
              'A personal productivity and usage insights tool',
              'An idea tracker and knowledge vault for AI-assisted work',
              'A builder profile that shows how you use AI over time',
              'A pattern detector — see how your prompting style evolves',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[14px] text-white/60">
                <span className="text-[#F7C948] mt-0.5 shrink-0">→</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </InView>

        {/* IS NOT */}
        <InView delay={0.2} className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5">
            <span className="text-[20px]">✕</span>
          </div>
          <h3 className="text-[18px] font-semibold text-white mb-4">It&apos;s NOT</h3>
          <ul className="space-y-3">
            {[
              'Another AI agent or chatbot — we don\'t generate content for you',
              'A replacement for Claude, ChatGPT, or any AI tool',
              'A data collector — we never read or store your conversation text',
              'A productivity coach or task manager',
              'A social platform — your data is private and yours alone',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-[14px] text-white/60">
                <span className="text-white/20 mt-0.5 shrink-0">✕</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </InView>
      </div>
    </section>
  );
}

/* ─── How it works ──────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      n: '01', title: 'Export your conversations',
      body: 'Download your conversation history from Claude, ChatGPT, Gemini, or any AI tool you use. It takes about 30 seconds.',
      icon: '↓',
    },
    {
      n: '02', title: 'Upload once, analyse forever',
      body: 'Drop your export file into Idea OS. We process everything locally — your conversation text never leaves your device or touches our servers.',
      icon: '⚡',
    },
    {
      n: '03', title: 'Unlock your AI builder profile',
      body: 'See your productivity score, idea evolution, usage patterns, signals, and a personalised analysis of how you actually build with AI.',
      icon: '◎',
    },
  ];

  return (
    <section id="how-it-works" className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-16">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Simple by design</p>
          <h2 className="text-[38px] sm:text-[48px] font-bold text-white">How it works</h2>
        </InView>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <InView key={s.n} delay={i * 0.12} className="relative">
              <div className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8 h-full">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-[11px] font-mono text-[#F7C948]/40">{s.n}</span>
                  <div className="w-9 h-9 rounded-xl border border-[#F7C948]/20 bg-[#F7C948]/5 flex items-center justify-center text-[#F7C948] text-[16px]">
                    {s.icon}
                  </div>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-[14px] text-white/45 leading-relaxed">{s.body}</p>
              </div>
              {i < 2 && (
                <div className="hidden sm:block absolute top-1/2 -right-3 z-10 text-[#2A2A3A] text-xl">→</div>
              )}
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── The Journey ───────────────────────────────────────────────────────── */
function TheJourney() {
  return (
    <section className="px-6 py-28 max-w-4xl mx-auto">
      <InView className="text-center mb-3">
        <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest">The origin story</p>
      </InView>

      <InView delay={0.1}>
        <h2 className="text-[36px] sm:text-[48px] font-bold text-white text-center mb-14 leading-tight">
          It started as a personal<br />obsession
        </h2>
      </InView>

      <div className="space-y-6 text-[16px] sm:text-[17px] text-white/50 leading-relaxed max-w-2xl mx-auto">
        {[
          { text: 'I\'d been building with Claude every single day. Ideas in the morning, code reviews at night. But I had no idea how I was actually using it — what patterns I was falling into, which sessions were most productive, or where my ideas were coming from.', delay: 0.1 },
          { text: 'One day I exported my conversations just to see what was in there. Thousands of messages. Hundreds of code blocks. Ideas scattered across dozens of chats that I\'d completely forgotten about.', delay: 0.2 },
          { text: 'I wanted a mirror. Something that could show me my own AI usage like a Spotify Wrapped for how I build — the peaks, the patterns, the productivity score that tells me if I\'m actually getting better.', delay: 0.25 },
          { text: 'So I built it. For me first. Then people started asking to use it. This is Idea OS.', delay: 0.3 },
        ].map(({ text, delay }) => (
          <InView key={delay} delay={delay}>
            <p>{text}</p>
          </InView>
        ))}
      </div>
    </section>
  );
}

/* ─── Features ──────────────────────────────────────────────────────────── */
function Features() {
  const features = [
    { icon: '◎', title: 'AI Builder Profile', body: 'Your productivity score, AI personality type, temperament, usage patterns — a complete picture of how you build with AI.' },
    { icon: '⚡', title: 'Idea Intelligence', body: 'Capture, grade, and track every idea from your AI conversations. See which sectors you focus on and which ideas keep getting revisited.' },
    { icon: '↗', title: 'Productivity Analytics', body: 'Code lines written, conversation volume, word breakdowns, time trends — understand your real output across weeks and months.' },
    { icon: '◆', title: 'Signals Engine', body: 'Surface recurring patterns, strategic principles, and insights from across your work. Build a personal knowledge layer that grows with you.' },
    { icon: '⊕', title: 'Insights Connector', body: 'See which ideas are semantically connected. Spot the threads across conversations you might have missed.' },
    { icon: '↻', title: 'Multi-tool Support', body: 'Export from Claude, ChatGPT, Gemini, and more. Idea OS merges all your AI work into one unified dashboard.' },
  ];

  return (
    <section id="features" className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-16">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">What you get</p>
          <h2 className="text-[38px] sm:text-[48px] font-bold text-white">The cool features</h2>
        </InView>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i}
              className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-7 hover:border-[#F7C948]/20 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-[#F7C948]/8 border border-[#F7C948]/15 flex items-center justify-center text-[#F7C948] text-[18px] mb-5 group-hover:bg-[#F7C948]/12 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-[16px] font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-[13px] text-white/40 leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
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

function ScreenshotCard({ file, label, isMobile }: { file: string; label: string; isMobile: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const src = `/screenshots/${file}`;
  return (
    <div className={`relative shrink-0 rounded-xl overflow-hidden border border-[#1E1E2E] bg-[#111118] ${
      isMobile ? 'w-[200px] sm:w-[230px]' : 'w-[420px] sm:w-[520px]'
    }`}
    style={{ aspectRatio: isMobile ? '9/19.5' : '16/10' }}>
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
          <div className="w-10 h-10 rounded-xl bg-[#1E1E2E] flex items-center justify-center text-white/20 text-xl">◫</div>
          <p className="text-[10px] font-mono text-white/20 text-center">{label}</p>
          <p className="text-[9px] font-mono text-white/12 text-center break-all">/screenshots/{file}</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} onLoad={() => setLoaded(true)} onError={() => setLoaded(false)}
           className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
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
  const shots = mode === 'desktop' ? DESKTOP_SHOTS : MOBILE_SHOTS;

  return (
    <section className="py-24 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        <InView className="text-center mb-10">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">In the wild</p>
          <h2 className="text-[38px] sm:text-[48px] font-bold text-white mb-6">See it in action</h2>
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
        </InView>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={mode}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex gap-4 px-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#1E1E2E]"
          style={{ scrollSnapType: 'x mandatory' }}>
          {shots.map((s) => (
            <div key={s.file} style={{ scrollSnapAlign: 'start' }}>
              <ScreenshotCard {...s} isMobile={mode === 'mobile'} />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-[11px] font-mono text-white/20 mt-6 px-6">
        Scroll to see more →
      </p>
    </section>
  );
}

/* ─── Privacy ───────────────────────────────────────────────────────────── */
function Privacy() {
  const points = [
    { icon: '◑', title: 'Zero conversation storage', body: 'Your raw conversation text is processed locally and never stored on our servers. We only store statistical metadata — word counts, code lines, dates.' },
    { icon: '⊞', title: 'No training on your data', body: 'Nothing you upload is used to train any AI model. Your ideas and conversations are not our data.' },
    { icon: '↗', title: 'Export and delete anytime', body: 'You own your data. Download everything or delete your account instantly — no waiting periods, no dark patterns.' },
  ];

  return (
    <section className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-14">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">We take this seriously</p>
          <h2 className="text-[38px] sm:text-[48px] font-bold text-white mb-4">Privacy by design</h2>
          <p className="text-[16px] text-white/40 max-w-xl mx-auto">
            Your conversations are some of the most sensitive data you have. We designed Idea OS from day one so that data stays with you.
          </p>
        </InView>

        <div className="grid sm:grid-cols-3 gap-5">
          {points.map((p, i) => (
            <InView key={p.title} delay={i * 0.1}
              className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8">
              <div className="w-10 h-10 rounded-xl bg-[#F7C948]/8 flex items-center justify-center text-[#F7C948] text-xl mb-5">
                {p.icon}
              </div>
              <h3 className="text-[16px] font-semibold text-white mb-2">{p.title}</h3>
              <p className="text-[13px] text-white/40 leading-relaxed">{p.body}</p>
            </InView>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ───────────────────────────────────────────────────────────── */
function Pricing() {
  const plans = [
    {
      name: 'Free Trial',
      price: '$0',
      period: 'forever',
      highlight: false,
      badge: null,
      features: [
        'Last 7 days of conversation analysis',
        'AI builder profile card',
        'Basic usage stats',
        'AI personality type',
        '1 export per week',
        'Idea capture (up to 10 ideas)',
      ],
      cta: 'Start free',
    },
    {
      name: 'Builder',
      price: '$10',
      period: '/month',
      highlight: true,
      badge: 'Most popular',
      features: [
        'Full conversation history (unlimited)',
        'AI productivity score + trends',
        'Unlimited idea tracking & grading',
        'Insights engine (pattern detection)',
        'Signals board',
        'Analytics & charts with time filters',
        'Weekly AI digest email',
        'Multi-tool support (Claude + ChatGPT + Gemini)',
        'Priority sync',
      ],
      cta: 'Join waitlist',
    },
    {
      name: 'Family',
      price: '$50',
      period: '/month',
      highlight: false,
      badge: 'Up to 5 users',
      features: [
        'Everything in Builder',
        'Up to 5 user accounts',
        'Family/team overview dashboard',
        'Shared signals board',
        'Bulk conversation sync',
        'Usage comparison across members',
        'Dedicated support',
      ],
      cta: 'Join waitlist',
    },
  ];

  return (
    <section id="pricing" className="px-6 py-24 max-w-5xl mx-auto">
      <InView className="text-center mb-14">
        <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Simple pricing</p>
        <h2 className="text-[38px] sm:text-[48px] font-bold text-white mb-4">Start free, grow as you build</h2>
        <p className="text-[15px] text-white/40">Try the last 7 days for free. Unlock the full picture for $10/mo.</p>
      </InView>

      <div className="grid sm:grid-cols-3 gap-5">
        {plans.map((p, i) => (
          <InView key={p.name} delay={i * 0.1}
            className={`rounded-2xl border p-8 flex flex-col relative ${
              p.highlight
                ? 'border-[#F7C948]/40 bg-[#F7C948]/5'
                : 'border-[#1E1E2E] bg-[#111118]'
            }`}>
            {p.badge && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-mono ${
                p.highlight ? 'bg-[#F7C948] text-[#0A0A0F]' : 'bg-[#1E1E2E] text-white/50'
              }`}>
                {p.badge}
              </div>
            )}
            <div className="mb-6">
              <p className="text-[12px] font-mono text-white/40 mb-2">{p.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[42px] font-bold text-white leading-none">{p.price}</span>
                <span className="text-[13px] text-white/30">{p.period}</span>
              </div>
            </div>

            <ul className="space-y-2.5 flex-1 mb-8">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-[13px] text-white/55">
                  <span className={`mt-0.5 shrink-0 text-[11px] ${p.highlight ? 'text-[#F7C948]' : 'text-white/25'}`}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full h-11 rounded-xl text-[13px] font-semibold transition-colors ${
                p.highlight
                  ? 'bg-[#F7C948] text-[#0A0A0F] hover:bg-[#E6B830]'
                  : 'border border-[#1E1E2E] text-white/60 hover:border-[#2A2A3A] hover:text-white/80'
              }`}
            >
              {p.cta}
            </button>
          </InView>
        ))}
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
      'Click "Export data" → "Confirm export" in the modal',
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
      'Scroll down and enable "Google AI" or "Gemini Apps Activity"',
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
    note: 'Full Grok export support coming soon',
  },
  {
    id: 'copilot', name: 'Copilot', color: '#0078D4',
    steps: [
      'Go to account.microsoft.com',
      'Navigate to Privacy → Export your data',
      'Select "Copilot" and request an export',
      'Download your data archive when ready',
      'Note: Microsoft Copilot export is currently limited — enhanced support coming soon',
    ],
    note: 'Enhanced Copilot support coming soon',
  },
  {
    id: 'perplexity', name: 'Perplexity', color: '#20808D',
    steps: [
      'Go to perplexity.ai and sign in',
      'Navigate to Settings',
      'Look for "Export" in the Data section (Pro users)',
      'Note: Perplexity export is in beta — Idea OS support is in progress',
    ],
    note: 'Perplexity support coming soon',
  },
];

function ExportGuide() {
  const [active, setActive] = useState('claude');
  const guide = EXPORT_GUIDES.find((g) => g.id === active)!;

  return (
    <section id="export-guide" className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-5xl mx-auto">
        <InView className="text-center mb-12">
          <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-3">Works with every major AI tool</p>
          <h2 className="text-[38px] sm:text-[48px] font-bold text-white">How to export your conversations</h2>
        </InView>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {EXPORT_GUIDES.map((g) => (
            <button key={g.id} onClick={() => setActive(g.id)}
              className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all ${
                active === g.id
                  ? 'text-[#0A0A0F] font-semibold'
                  : 'border border-[#1E1E2E] text-white/40 hover:text-white/70 hover:border-[#2A2A3A]'
              }`}
              style={active === g.id ? { backgroundColor: g.color } : {}}>
              {g.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-[#1E1E2E] bg-[#111118] p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: guide.color }} />
              <h3 className="text-[17px] font-semibold text-white">Exporting from {guide.name}</h3>
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
                  <p className="text-[14px] text-white/60 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ─── Future of AI ──────────────────────────────────────────────────────── */
function FutureOfAI() {
  return (
    <section className="px-6 py-28 max-w-4xl mx-auto text-center">
      <InView>
        <p className="text-[10px] font-mono text-[#F7C948] uppercase tracking-widest mb-4">A bigger picture</p>
        <h2 className="text-[38px] sm:text-[52px] font-bold text-white mb-8 leading-tight">
          The future is AI-native builders
        </h2>
      </InView>
      <div className="space-y-6 text-[16px] sm:text-[17px] text-white/45 leading-relaxed max-w-2xl mx-auto">
        <InView delay={0.1}>
          <p>The most valuable skill in the next decade won&apos;t be knowing how to code. It&apos;ll be knowing how to think, prompt, and build alongside AI at a sustained, high level.</p>
        </InView>
        <InView delay={0.15}>
          <p>The builders who win will be the ones who understand their own patterns — what they&apos;re building toward, where they get stuck, how their prompting evolves. That&apos;s the mirror Idea OS holds up.</p>
        </InView>
        <InView delay={0.2}>
          <p>This is just the beginning. Real-time sync, cross-tool intelligence, team collaboration, and AI coaching layers are all on the roadmap — built on the foundation of understanding how <em>you</em> work.</p>
        </InView>
      </div>
    </section>
  );
}

/* ─── Final CTA ─────────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section className="px-6 py-24 bg-[#0D0D14]">
      <div className="max-w-3xl mx-auto text-center">
        <InView>
          <div className="inline-flex w-16 h-16 rounded-2xl bg-[#F7C948] items-center justify-center text-[#0A0A0F] font-bold text-[28px] mb-8">
            I
          </div>
          <h2 className="text-[38px] sm:text-[52px] font-bold text-white mb-5 leading-tight">
            Ready to see your<br />AI journey?
          </h2>
          <p className="text-[16px] text-white/40 mb-10 max-w-lg mx-auto">
            Join the waitlist for early access. Free to try — no credit card needed.
          </p>
          <div className="flex justify-center">
            <WaitlistForm size="lg" />
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
            <span className="text-[#0A0A0F] font-bold text-[11px]">I</span>
          </div>
          <span className="text-white/60 text-[13px]">Idea OS</span>
        </div>
        <p className="text-[12px] text-white/20 font-mono">© 2025 Idea OS. Built by a builder, for builders.</p>
        <div className="flex gap-6">
          {['Privacy', 'Terms', 'Contact'].map((l) => (
            <a key={l} href="#" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────────── */
export function WaitlistPage() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = useCallback(() => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="bg-[#0A0A0F] min-h-screen text-white">
      <Nav scrollToForm={scrollToForm} />
      <Hero formRef={formRef} />
      <WhatItIs />
      <HowItWorks />
      <TheJourney />
      <Features />
      <Screenshots />
      <Privacy />
      <ExportGuide />
      <Pricing />
      <FutureOfAI />
      <FinalCTA />
      <Footer />
    </div>
  );
}
