import { Idea, ConversationLog, UserStats, Signal, SignalType } from './types';

export const DEMO_IDEAS: Idea[] = [
  { id: 'di-01', user_id: 'demo', title: 'Lagos Transit Tracker MVP', description: 'Real-time bus tracking for danfo routes using crowdsourced GPS data from commuters.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Mobility', idea_type: 'product', status: 'in_progress', grade_novelty: 4.5, grade_feasibility: 3.5, grade_personal_fit: 4.0, grade_market_potential: 4.5, grade_urgency: 4.0, grade_overall: 4.1, next_steps: ['Partner with BRT operators', 'Launch beta in Ikeja'], blockers: [], ai_suggestions: 'Consider a Whatsapp bot interface for low-data users', ai_next_steps: ['Research existing transit data APIs', 'Prototype the route visualisation'], tags: ['fintech', 'mobile', 'web'], chat_date: '2025-11-03T14:22:00Z', created_at: '2025-11-03T14:22:00Z', updated_at: '2025-11-03T14:22:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-02', user_id: 'demo', title: 'Danfo Pay — NFC Payments', description: 'Tap-to-pay for informal transit. Offline-capable NFC card linked to mobile money.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Fintech', idea_type: 'product', status: 'prototyping', grade_novelty: 4.8, grade_feasibility: 3.0, grade_personal_fit: 3.5, grade_market_potential: 5.0, grade_urgency: 3.5, grade_overall: 3.9, next_steps: ['Build offline payment queue'], blockers: ['Hardware cost for NFC terminals'], ai_suggestions: 'USSD fallback for feature phones could unlock rural routes', ai_next_steps: ['Map Paystack NFC API', 'Test offline sync with IndexedDB'], tags: ['nfc', 'transit', 'mobile-money'], chat_date: '2025-10-17T09:45:00Z', created_at: '2025-10-17T09:45:00Z', updated_at: '2025-10-17T09:45:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-03', user_id: 'demo', title: 'Idea OS — Personal AI Dashboard', description: 'Visualise and analyse your own AI conversation history to surface patterns, productivity scores, and a builder profile.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Productivity', idea_type: 'product', status: 'in_progress', grade_novelty: 4.7, grade_feasibility: 4.5, grade_personal_fit: 5.0, grade_market_potential: 4.0, grade_urgency: 5.0, grade_overall: 4.6, next_steps: ['Launch waitlist', 'Add ChatGPT export support'], blockers: [], ai_suggestions: null, ai_next_steps: ['Build public demo mode', 'Polish profile scoring algorithm'], tags: ['saas', 'ai', 'analytics'], chat_date: '2025-12-01T10:00:00Z', created_at: '2025-12-01T10:00:00Z', updated_at: '2025-12-01T10:00:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-04', user_id: 'demo', title: 'JAMB Study App — AI Tutor', description: 'Adaptive exam preparation for Nigerian university entrance using spaced repetition and AI explanations.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'EdTech', idea_type: 'product', status: 'validated', grade_novelty: 3.5, grade_feasibility: 4.0, grade_personal_fit: 3.0, grade_market_potential: 4.5, grade_urgency: 4.0, grade_overall: 3.8, next_steps: ['Survey 50 SS3 students', 'Partner with prep centres'], blockers: ['Curriculum data licensing'], ai_suggestions: 'Focus on past question bank first — data moat before AI features', ai_next_steps: ['Scrape JAMB past questions (permissioned)', 'Build spaced repetition scheduler'], tags: ['edtech', 'nigeria', 'mobile'], chat_date: '2025-08-14T11:15:00Z', created_at: '2025-08-14T11:15:00Z', updated_at: '2025-08-14T11:15:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-05', user_id: 'demo', title: 'Freelance Invoice Parser', description: 'AI that reads PDF invoices and auto-populates accounting entries. Built for African freelancers billing in FX.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Fintech', idea_type: 'automation', status: 'completed', grade_novelty: 3.0, grade_feasibility: 4.5, grade_personal_fit: 4.5, grade_market_potential: 3.5, grade_urgency: 4.5, grade_overall: 4.0, next_steps: [], blockers: [], ai_suggestions: null, ai_next_steps: [], tags: ['automation', 'fintech', 'ai'], chat_date: '2025-11-22T08:00:00Z', created_at: '2025-11-22T08:00:00Z', updated_at: '2025-11-22T08:00:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-06', user_id: 'demo', title: 'WhatsApp Business Automation Flow', description: 'No-code builder for WhatsApp chatbot flows targeted at SMEs in West Africa.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'SaaS', idea_type: 'product', status: 'lightly_researched', grade_novelty: 3.0, grade_feasibility: 3.5, grade_personal_fit: 3.0, grade_market_potential: 4.0, grade_urgency: 2.5, grade_overall: 3.2, next_steps: ['Competitive analysis: Wati, Respond.io'], blockers: ['WhatsApp API rate limits'], ai_suggestions: 'SMS fallback would significantly expand TAM', ai_next_steps: [], tags: ['automation', 'sme', 'chat'], chat_date: '2025-11-10T16:00:00Z', created_at: '2025-11-10T16:00:00Z', updated_at: '2025-11-10T16:00:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-07', user_id: 'demo', title: 'Afro Design System', description: 'Component library inspired by African geometric patterns and typography. Open source.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Developer Tools', idea_type: 'community', status: 'paused', grade_novelty: 4.5, grade_feasibility: 3.5, grade_personal_fit: 4.0, grade_market_potential: 3.0, grade_urgency: 2.0, grade_overall: 3.4, next_steps: [], blockers: ['Need a design partner', 'Time bandwidth'], ai_suggestions: null, ai_next_steps: ['Find 2-3 designers from African design communities'], tags: ['design', 'open-source', 'community'], chat_date: '2025-10-05T15:45:00Z', created_at: '2025-10-05T15:45:00Z', updated_at: '2025-10-05T15:45:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-08', user_id: 'demo', title: 'Remote Jobs Board — Africa', description: 'Curated remote-first job listings for African tech talent. Salary in USD, remote-verified.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Marketplace', idea_type: 'side_quest', status: 'captured', grade_novelty: 2.5, grade_feasibility: 4.0, grade_personal_fit: 3.5, grade_market_potential: 3.5, grade_urgency: 3.0, grade_overall: 3.3, next_steps: ['Check Himalayas, remote.co for gap'], blockers: [], ai_suggestions: 'Differentiate via visa/banking guides for African devs', ai_next_steps: [], tags: ['jobs', 'africa', 'remote'], chat_date: '2025-06-25T09:30:00Z', created_at: '2025-06-25T09:30:00Z', updated_at: '2025-06-25T09:30:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-09', user_id: 'demo', title: 'Ajo Digital — Group Savings', description: 'Digital rotating savings (susu/ajo) with Paystack integration and automatic disbursement.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Fintech', idea_type: 'product', status: 'validated', grade_novelty: 3.5, grade_feasibility: 4.0, grade_personal_fit: 4.0, grade_market_potential: 4.5, grade_urgency: 3.5, grade_overall: 3.9, next_steps: ['Run a pilot with 10 friends'], blockers: [], ai_suggestions: 'Trust mechanics are key — add an identity layer early', ai_next_steps: ['Research CBN ROSCA regulations'], tags: ['fintech', 'savings', 'mobile-money'], chat_date: '2025-09-01T12:00:00Z', created_at: '2025-09-01T12:00:00Z', updated_at: '2025-09-01T12:00:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
  { id: 'di-10', user_id: 'demo', title: 'Build in Lagos Newsletter', description: 'Weekly newsletter covering Lagos startup news, funding rounds, and builder spotlights.', raw_source: null, source_type: 'claude_chat', source_ref: 'demo_mode', sector: 'Media', idea_type: 'content', status: 'completed', grade_novelty: 2.5, grade_feasibility: 4.5, grade_personal_fit: 4.5, grade_market_potential: 3.0, grade_urgency: 3.5, grade_overall: 3.6, next_steps: [], blockers: [], ai_suggestions: null, ai_next_steps: [], tags: ['content', 'community', 'newsletter'], chat_date: '2025-12-01T08:00:00Z', created_at: '2025-12-01T08:00:00Z', updated_at: '2025-12-01T08:00:00Z', parent_idea_id: null, user_complaints: [], rephrasing_suggestions: [] },
];

export const DEMO_CONV_PREFIX = 'demo-conv-';

export const DEMO_CONVERSATIONS_LOG: Omit<ConversationLog, 'id' | 'processed_at'>[] = [
  { user_id: 'favour', conversation_uuid: 'demo-conv-001', title: 'Building Lagos Transit Tracker MVP',         created_at: '2025-11-03T14:22:00Z', human_messages: 14, assistant_messages: 14, total_words: 4200,  human_words: 1300, assistant_words: 2900, code_blocks: 5,  code_lines: 142 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-002', title: 'Danfo Pay NFC Payment Architecture',         created_at: '2025-10-17T09:45:00Z', human_messages: 18, assistant_messages: 18, total_words: 5800,  human_words: 1700, assistant_words: 4100, code_blocks: 8,  code_lines: 267 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-003', title: 'Idea OS Data Model & Dashboard Design',      created_at: '2025-12-01T10:00:00Z', human_messages: 22, assistant_messages: 22, total_words: 7200,  human_words: 2100, assistant_words: 5100, code_blocks: 12, code_lines: 385 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-004', title: 'JAMB Study App Prompt Engineering',          created_at: '2025-08-14T11:15:00Z', human_messages: 9,  assistant_messages: 9,  total_words: 2900,  human_words: 920,  assistant_words: 1980, code_blocks: 2,  code_lines: 48  },
  { user_id: 'favour', conversation_uuid: 'demo-conv-005', title: 'Freelance Invoice Parser Full Build',        created_at: '2025-11-22T08:00:00Z', human_messages: 25, assistant_messages: 25, total_words: 8100,  human_words: 2400, assistant_words: 5700, code_blocks: 14, code_lines: 412 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-006', title: 'WhatsApp Business Automation Flow',          created_at: '2025-11-10T16:00:00Z', human_messages: 19, assistant_messages: 19, total_words: 6400,  human_words: 1900, assistant_words: 4500, code_blocks: 9,  code_lines: 298 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-007', title: 'African Tech Podcast Format Strategy',       created_at: '2025-09-20T16:30:00Z', human_messages: 7,  assistant_messages: 7,  total_words: 2100,  human_words: 680,  assistant_words: 1420, code_blocks: 0,  code_lines: 0   },
  { user_id: 'favour', conversation_uuid: 'demo-conv-008', title: 'Afro Design System Component Library',       created_at: '2025-10-05T15:45:00Z', human_messages: 16, assistant_messages: 16, total_words: 5200,  human_words: 1560, assistant_words: 3640, code_blocks: 10, code_lines: 326 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-009', title: 'Remote Jobs Board Tech Stack',               created_at: '2025-06-25T09:30:00Z', human_messages: 13, assistant_messages: 13, total_words: 4000,  human_words: 1200, assistant_words: 2800, code_blocks: 6,  code_lines: 178 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-010', title: 'Ajo Digital Paystack Integration',           created_at: '2025-09-01T12:00:00Z', human_messages: 21, assistant_messages: 21, total_words: 6900,  human_words: 2050, assistant_words: 4850, code_blocks: 11, code_lines: 357 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-011', title: 'Mental Health App Market Research',          created_at: '2025-05-12T10:00:00Z', human_messages: 8,  assistant_messages: 8,  total_words: 2600,  human_words: 820,  assistant_words: 1780, code_blocks: 0,  code_lines: 0   },
  { user_id: 'favour', conversation_uuid: 'demo-conv-012', title: 'Personal Finance Dashboard React Build',     created_at: '2025-03-10T09:00:00Z', human_messages: 28, assistant_messages: 28, total_words: 9200,  human_words: 2700, assistant_words: 6500, code_blocks: 16, code_lines: 523 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-013', title: 'Climate Data API & Visualisation',           created_at: '2025-09-11T11:30:00Z', human_messages: 11, assistant_messages: 11, total_words: 3500,  human_words: 1050, assistant_words: 2450, code_blocks: 4,  code_lines: 112 },
  { user_id: 'favour', conversation_uuid: 'demo-conv-014', title: 'Co-living Platform Business Model',          created_at: '2025-07-08T13:00:00Z', human_messages: 6,  assistant_messages: 6,  total_words: 1900,  human_words: 620,  assistant_words: 1280, code_blocks: 0,  code_lines: 0   },
  { user_id: 'favour', conversation_uuid: 'demo-conv-015', title: 'Build in Lagos Newsletter SEO Strategy',     created_at: '2025-12-01T08:00:00Z', human_messages: 15, assistant_messages: 15, total_words: 4800,  human_words: 1450, assistant_words: 3350, code_blocks: 3,  code_lines: 67  },
];

export const DEMO_SIGNALS: Omit<Signal, 'idea_id' | 'idea_title'>[] = [
  {
    id: 'demo-sig-001',
    user_id: 'favour',
    title: 'Ship to a narrow geography first, expand later',
    content: 'Every Lagos-specific product I\'ve ideated has more traction potential than global plays because the problem is acute and underserved. Starting narrow lets you find true product-market fit before scaling the complexity.',
    signal_type: 'strategy' as SignalType,
    created_at: '2025-11-15T10:00:00Z',
  },
  {
    id: 'demo-sig-002',
    user_id: 'favour',
    title: 'Payments are the unlock for African B2C',
    content: 'Across transit, savings, and freelance tools, the moment I add a Paystack or Flutterwave integration the idea becomes 10× more concrete. Payment infrastructure is the moat — don\'t build around it, build on top of it.',
    signal_type: 'pattern' as SignalType,
    created_at: '2025-10-22T09:30:00Z',
  },
  {
    id: 'demo-sig-003',
    user_id: 'favour',
    title: 'AI is a force multiplier, not a replacement',
    content: 'Every time I\'ve used Claude to draft architecture or suggest code patterns, the final output still needed my domain knowledge. The leverage is in the iteration speed, not in removing my thinking.',
    signal_type: 'principle' as SignalType,
    created_at: '2025-09-18T14:00:00Z',
  },
  {
    id: 'demo-sig-004',
    user_id: 'favour',
    title: 'WhatsApp-first beats app-first in Nigeria',
    content: 'Ideas that route through WhatsApp (automation, alerts, onboarding) consistently rank higher in viability scores. App install friction is real. If your MVP can live in a chat, start there.',
    signal_type: 'opportunity' as SignalType,
    created_at: '2025-11-05T11:00:00Z',
  },
  {
    id: 'demo-sig-005',
    user_id: 'favour',
    title: 'Trust deficit in digital services slows growth',
    content: 'Three separate ideas — co-living platform, digital Ajo, and mental health app — all face the same risk: users don\'t trust a new platform with their money or data. Credibility and social proof must be built in from day one.',
    signal_type: 'risk' as SignalType,
    created_at: '2025-10-03T16:30:00Z',
  },
  {
    id: 'demo-sig-006',
    user_id: 'favour',
    title: 'Beautiful defaults outperform configurable complexity',
    content: 'The design system I built with Claude was better when I asked for opinionated defaults and then trimmed, rather than building everything configurable from scratch. Constraint creates quality.',
    signal_type: 'lesson' as SignalType,
    created_at: '2025-08-29T08:00:00Z',
  },
  {
    id: 'demo-sig-007',
    user_id: 'favour',
    title: 'JAMB + education = perpetual demand',
    content: 'Every year brings a new cohort of students with high urgency and clear willingness to pay. Education-adjacent products in Nigeria have structural demand that doesn\'t need to be created — it needs to be intercepted.',
    signal_type: 'opportunity' as SignalType,
    created_at: '2025-07-20T13:00:00Z',
  },
  {
    id: 'demo-sig-008',
    user_id: 'favour',
    title: 'Prompt iteration is the new debugging',
    content: 'The fastest path to a better output isn\'t rewriting code — it\'s reframing the prompt. Treating prompts like code (version them, test edge cases, document what works) has become its own skill set.',
    signal_type: 'principle' as SignalType,
    created_at: '2025-12-01T07:30:00Z',
  },
];

export const DEMO_USER_STATS: UserStats = {
  user_id: 'favour',
  total_conversations: 15,
  total_words: 74800,
  total_human_words: 22450,
  total_assistant_words: 52350,
  total_code_blocks: 100,
  total_code_lines: 3115,
  first_conversation_at: '2025-03-10T09:00:00Z',
  last_conversation_at: '2025-12-01T10:00:00Z',
  updated_at: new Date().toISOString(),
};
