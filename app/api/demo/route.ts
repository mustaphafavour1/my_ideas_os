import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { DEMO_CONVERSATIONS_LOG, DEMO_USER_STATS, DEMO_CONV_PREFIX } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', 'favour')
      .eq('source_ref', DEMO_SOURCE_REF);
    return NextResponse.json({ active: (count ?? 0) > 0, count: count ?? 0 });
  } catch (err) {
    return NextResponse.json({ active: false, count: 0, error: (err as Error).message });
  }
}

const DEMO_SOURCE_REF = 'demo_mode';

const DEMO_IDEAS = [
  {
    title: 'Lagos Transit Tracker',
    description: 'A real-time tracking app for danfo buses and BRT in Lagos, helping commuters plan routes and estimate arrival times. Uses crowd-sourced location data from drivers and passengers to build a live map overlay.',
    sector: 'transportation',
    idea_type: 'product',
    status: 'in_progress',
    grade_novelty: 4,
    grade_feasibility: 3,
    grade_personal_fit: 4,
    grade_market_potential: 5,
    grade_urgency: 4,
    next_steps: ['Build MVP with 5 test drivers', 'Partner with LAMATA', 'Launch beta in Yaba'],
    blockers: ['Real-time GPS hardware cost', 'Driver buy-in'],
    ai_suggestions: 'Start with WhatsApp as the UX layer — drivers already have it. Pipe live pings into a WhatsApp bot and prove the model before investing in a native app.',
    tags: ['lagos', 'transport', 'mvp'],
    chat_date: '2025-11-03T14:22:00Z',
  },
  {
    title: 'Danfo Pay',
    description: 'A contactless payment system for Lagos danfo buses using NFC tags on seats and a USSD fallback. Eliminates the friction of exact change and enables trip analytics for bus owners.',
    sector: 'fintech',
    idea_type: 'product',
    status: 'prototyping',
    grade_novelty: 5,
    grade_feasibility: 3,
    grade_personal_fit: 3,
    grade_market_potential: 5,
    grade_urgency: 3,
    next_steps: ['Test NFC hardware compatibility on Android low-end devices', 'Design USSD flow for feature phones', 'Talk to 3 bus owners about unit economics'],
    blockers: ['Regulatory approval from CBN for transport payments', 'Hardware distribution at scale'],
    ai_suggestions: 'Pitch to Access Bank or GTBank — they have transport-sector initiatives and could co-fund a pilot in exchange for transaction data.',
    tags: ['fintech', 'lagos', 'payments'],
    chat_date: '2025-10-17T09:45:00Z',
  },
  {
    title: 'Idea OS',
    description: 'A personal idea intelligence dashboard that extracts, organises, and enriches ideas from Claude conversation exports. Tracks status, grades, AI suggestions, and blockers for every concept you explore.',
    sector: 'productivity',
    idea_type: 'product',
    status: 'in_progress',
    grade_novelty: 4,
    grade_feasibility: 5,
    grade_personal_fit: 5,
    grade_market_potential: 3,
    grade_urgency: 5,
    next_steps: ['Ship v1 to personal domain', 'Add analytics page charts', 'Enable public sharing of idea cards'],
    blockers: [],
    ai_suggestions: 'Add a "share card" feature that generates a beautifully formatted image of one idea — it doubles as a tool and a marketing artefact for Twitter/LinkedIn.',
    tags: ['personal-tool', 'ai', 'productivity'],
    chat_date: '2025-12-01T10:00:00Z',
  },
  {
    title: 'African Tech Founder Podcast',
    description: 'A podcast interviewing founders building tech products in Africa — with a focus on the unglamorous parts: fundraising locally, navigating regulations, and finding PMF without US-model playbooks.',
    sector: 'content',
    idea_type: 'content',
    status: 'captured',
    grade_novelty: 3,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 3,
    grade_urgency: 2,
    next_steps: ['List 10 potential guests', 'Check equipment I already own', 'Research top-performing African tech podcasts'],
    blockers: ['Time commitment alongside full-time work'],
    ai_suggestions: 'Start as a written interview series on Substack — lower production overhead, easier to distribute, and builds an audience before you commit to audio.',
    tags: ['content', 'africa', 'startup'],
    chat_date: '2025-09-20T16:30:00Z',
  },
  {
    title: 'AI Study Buddy for JAMB & WAEC',
    description: 'An AI-powered revision tool for Nigerian secondary school students preparing for JAMB and WAEC exams. Generates practice questions from past papers, explains wrong answers, and adapts difficulty to the student.',
    sector: 'education',
    idea_type: 'product',
    status: 'lightly_researched',
    grade_novelty: 3,
    grade_feasibility: 4,
    grade_personal_fit: 3,
    grade_market_potential: 5,
    grade_urgency: 3,
    next_steps: ['Digitise 10 years of JAMB past questions', 'Test Claude API for question generation quality', 'Survey 20 SS3 students on study habits'],
    blockers: ['Need authentic past question dataset', 'WhatsApp vs native app decision'],
    ai_suggestions: 'Launch as a WhatsApp chatbot first — zero install friction, works on any phone, and you can charge via airtime with Paystack. Native app comes later.',
    tags: ['education', 'nigeria', 'ai', 'exam-prep'],
    chat_date: '2025-08-14T11:15:00Z',
  },
  {
    title: 'Freelance Invoice Automation',
    description: 'A tool that automatically generates professional invoices from WhatsApp conversations with clients. The freelancer forwards the conversation summary and the tool extracts deliverables, rates, and due dates.',
    sector: 'business',
    idea_type: 'automation',
    status: 'in_progress',
    grade_novelty: 4,
    grade_feasibility: 5,
    grade_personal_fit: 5,
    grade_market_potential: 4,
    grade_urgency: 4,
    next_steps: ['Build WhatsApp webhook integration', 'Design invoice PDF template', 'Integrate Paystack payment link in invoice'],
    blockers: [],
    ai_suggestions: 'Bundle this with a simple recurring payment reminder — 80% of freelancer pain is chasing late payments, not generating invoices.',
    tags: ['freelance', 'automation', 'whatsapp'],
    chat_date: '2025-11-22T08:00:00Z',
  },
  {
    title: 'Co-living Platform for Lagos Young Professionals',
    description: 'A curated co-living network matching young professionals in Lagos with vetted housemates and furnished shared apartments. Takes the chaos out of house-hunting and reduces isolation for recent graduates.',
    sector: 'real-estate',
    idea_type: 'community',
    status: 'captured',
    grade_novelty: 3,
    grade_feasibility: 3,
    grade_personal_fit: 3,
    grade_market_potential: 4,
    grade_urgency: 2,
    next_steps: ['Research 3 existing co-living operators in Lagos', 'Calculate unit economics for a 5-room pilot apartment', 'Survey 50 young professionals on housing pain points'],
    blockers: ['Capital intensive', 'Landlord trust is a major friction'],
    ai_suggestions: 'Start as an aggregator — partner with existing furnished apartments and earn a placement fee. No real estate risk, and you learn the matching algorithm before owning supply.',
    tags: ['real-estate', 'lagos', 'community'],
    chat_date: '2025-07-08T13:00:00Z',
  },
  {
    title: 'Remote Jobs Board for West Africa',
    description: 'A curated jobs board focused on remote roles from global companies actively hiring in West Africa. Verified companies, transparent pay bands, and skills-based matching beyond just CVs.',
    sector: 'career',
    idea_type: 'product',
    status: 'validated',
    grade_novelty: 3,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 5,
    grade_urgency: 3,
    next_steps: ['Partner with 10 companies hiring remote in Nigeria', 'Build scraper for LinkedIn/Lever job feeds', 'Soft-launch to Slack communities for testers'],
    blockers: ['Competing with Turing, Toptal, and LinkedIn'],
    ai_suggestions: 'Differentiate by adding "Africa-friendly" badges — companies with async culture, USD pay via Payoneer/Stripe, and no timezone restrictions. That specificity is what makes you worth bookmarking.',
    tags: ['jobs', 'remote', 'africa'],
    chat_date: '2025-06-25T09:30:00Z',
  },
  {
    title: 'Afro Design System',
    description: 'An open-source UI component library and design system built with African product aesthetics in mind — vibrant color palettes, Afrocentric typography pairings, and mobile-first patterns informed by how most Africans access digital products.',
    sector: 'design',
    idea_type: 'framework',
    status: 'prototyping',
    grade_novelty: 5,
    grade_feasibility: 4,
    grade_personal_fit: 5,
    grade_market_potential: 3,
    grade_urgency: 2,
    next_steps: ['Define 5 core color themes inspired by African textiles', 'Build 20 base components in Figma and React', 'Open-source on GitHub and post on Product Hunt Africa'],
    blockers: ['Time to maintain an open-source project solo'],
    ai_suggestions: 'Partner with a design influencer in the Nigerian tech Twitter community to co-own the brand — shared maintenance and doubled distribution.',
    tags: ['design', 'open-source', 'africa'],
    chat_date: '2025-10-05T15:45:00Z',
  },
  {
    title: 'Mental Health App for Nigerian Professionals',
    description: 'A mental health platform designed for the specific stressors of Nigerian corporate life — job insecurity, family financial pressure, and the cultural stigma around seeking help. Includes journaling, AI check-ins, and access to certified local therapists.',
    sector: 'health-tech',
    idea_type: 'product',
    status: 'paused',
    grade_novelty: 4,
    grade_feasibility: 3,
    grade_personal_fit: 3,
    grade_market_potential: 4,
    grade_urgency: 3,
    next_steps: ['Partner with a licensed therapist as co-founder', 'Research NDLEA and health data regulations in Nigeria'],
    blockers: ['Mental health stigma makes top-of-funnel acquisition hard', 'Need clinical co-founder or advisor', 'Health data compliance complexity'],
    ai_suggestions: 'Reframe it as a "performance and resilience" tool for corporates — companies pay for employee wellness, avoiding the personal stigma barrier entirely.',
    tags: ['health-tech', 'nigeria', 'mental-health'],
    chat_date: '2025-05-12T10:00:00Z',
  },
  {
    title: 'Health Insurance Comparison Tool',
    description: 'A transparent comparison engine for Nigerian HMOs that shows real coverage details, user reviews, and network hospital lists — not just premium prices. Helps employees and SMEs pick the right plan without reading 40-page brochures.',
    sector: 'health-tech',
    idea_type: 'product',
    status: 'lightly_researched',
    grade_novelty: 4,
    grade_feasibility: 4,
    grade_personal_fit: 3,
    grade_market_potential: 4,
    grade_urgency: 3,
    next_steps: ['Scrape and standardise plan data from top 10 Nigerian HMOs', 'Build comparison matrix wireframe', 'Validate with 5 HR managers at SMEs'],
    blockers: ['HMOs may not cooperate with data transparency'],
    ai_suggestions: 'Earn from referral commissions — HMOs pay brokers 10-15% for each plan sold. Position as a comparison tool and act as a licensed broker.',
    tags: ['health-tech', 'insurance', 'nigeria'],
    chat_date: '2025-04-18T14:00:00Z',
  },
  {
    title: 'Personal Finance Dashboard',
    description: 'A personal money management dashboard that aggregates transactions from multiple Nigerian banks, categorises spending automatically, and gives weekly insights in plain language — no finance jargon.',
    sector: 'fintech',
    idea_type: 'product',
    status: 'completed',
    grade_novelty: 3,
    grade_feasibility: 5,
    grade_personal_fit: 5,
    grade_market_potential: 4,
    grade_urgency: 4,
    next_steps: [],
    blockers: [],
    ai_suggestions: 'Now that it works for you, open-source the transaction categorisation engine — it becomes a distribution channel as other developers build on top.',
    tags: ['fintech', 'personal-finance', 'completed'],
    chat_date: '2025-03-10T09:00:00Z',
  },
  {
    title: 'Ajo Digital (Savings Circle App)',
    description: 'A digital version of the traditional West African rotating savings club (ajo/esusu/susu) with formal group management, automated contributions via direct debit, and credit scoring built from reliable payment history.',
    sector: 'fintech',
    idea_type: 'product',
    status: 'prototyping',
    grade_novelty: 4,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 5,
    grade_urgency: 3,
    next_steps: ['Build group management prototype', 'Integrate Paystack direct debit API', 'Test with a real 10-person savings circle'],
    blockers: ['Trust is everything in savings circles — digital version needs to feel personal'],
    ai_suggestions: 'Add a "circle leader dashboard" with admin controls — the person who runs the ajo is the real customer, and tools that make them look good get them to recruit new circles for you.',
    tags: ['fintech', 'savings', 'community'],
    chat_date: '2025-09-01T12:00:00Z',
  },
  {
    title: 'WhatsApp Business Automation Suite',
    description: 'A no-code tool that lets Nigerian small business owners automate their WhatsApp customer conversations — product catalogues, order tracking, appointment booking, and payment collection — all inside WhatsApp.',
    sector: 'business',
    idea_type: 'automation',
    status: 'in_progress',
    grade_novelty: 3,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 5,
    grade_urgency: 4,
    next_steps: ['Integrate with WhatsApp Business API (Cloud)', 'Build no-code flow builder UI', 'Pilot with 5 fashion vendors in Lagos'],
    blockers: ['WhatsApp API pricing can eat SME margins'],
    ai_suggestions: 'Target fashion and food vendors first — they already use WhatsApp for sales but the manual work is killing them. One vertical deep beats all verticals shallow.',
    tags: ['whatsapp', 'sme', 'automation', 'nigeria'],
    chat_date: '2025-11-10T16:00:00Z',
  },
  {
    title: 'No-Code Academy Nigeria',
    description: 'An e-learning platform teaching Nigerians to build digital products using no-code tools like Webflow, Bubble, and Glide — with real business projects as coursework and a job placement track for graduates.',
    sector: 'education',
    idea_type: 'product',
    status: 'paused',
    grade_novelty: 3,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 4,
    grade_urgency: 2,
    next_steps: ['Redesign curriculum around 3 capstone projects', 'Partner with an employer for job placement track'],
    blockers: ['High learner dropout rate in online courses', 'Low perceived value of no-code vs traditional coding'],
    ai_suggestions: 'Bundle the course with a freelancing kit — a Notion client proposal template, a rate card, and a vetted client referral. Graduates earn faster, retention improves.',
    tags: ['education', 'no-code', 'nigeria'],
    chat_date: '2025-06-01T10:00:00Z',
  },
  {
    title: 'University Alumni Network Nigeria',
    description: 'A structured professional network for Nigerian university alumni that goes beyond Facebook groups — with verified profiles, mentorship matching, job referrals, and annual alumni reports for each institution.',
    sector: 'community',
    idea_type: 'community',
    status: 'captured',
    grade_novelty: 3,
    grade_feasibility: 3,
    grade_personal_fit: 3,
    grade_market_potential: 3,
    grade_urgency: 1,
    next_steps: ['Talk to 3 university alumni association presidents', 'Map the existing tools they use'],
    blockers: ['Alumni associations are often politically complex', 'Needs institutional buy-in to verify profiles'],
    ai_suggestions: 'Start with one university (your own) and go extremely deep — make it the definitive network for that institution before expanding. Breadth kills community products.',
    tags: ['community', 'education', 'nigeria'],
    chat_date: '2025-04-02T11:00:00Z',
  },
  {
    title: 'AI Nigerian Recipe Generator',
    description: 'An AI assistant that suggests Nigerian and West African recipes based on what ingredients you have at home, with substitutions for unavailable items and adaptations for diaspora cooking environments.',
    sector: 'food-tech',
    idea_type: 'experiment',
    status: 'lightly_researched',
    grade_novelty: 3,
    grade_feasibility: 5,
    grade_personal_fit: 3,
    grade_market_potential: 3,
    grade_urgency: 2,
    next_steps: ['Build a simple Claude API wrapper with 50 Nigerian recipes as context', 'Test with 10 diaspora users on Twitter'],
    blockers: [],
    ai_suggestions: 'Frame it as a diaspora product — Nigerians abroad struggling to cook jollof rice without West African ingredients are a passionate, vocal audience willing to pay.',
    tags: ['food-tech', 'ai', 'nigeria', 'experiment'],
    chat_date: '2025-10-28T19:00:00Z',
  },
  {
    title: 'Agritech Yield Forecasting Tool',
    description: 'A machine learning tool that predicts crop yields for smallholder farmers in Nigeria using satellite imagery, soil data, and local weather patterns — helping them access credit and sell forward contracts.',
    sector: 'agritech',
    idea_type: 'research',
    status: 'lightly_researched',
    grade_novelty: 5,
    grade_feasibility: 2,
    grade_personal_fit: 2,
    grade_market_potential: 5,
    grade_urgency: 2,
    next_steps: ['Review existing African agritech datasets', 'Talk to a domain expert (agronomist or agritech VC)'],
    blockers: ['No agricultural domain expertise', 'Data collection from rural areas is expensive and complex'],
    ai_suggestions: 'Partner with an agritech company already working with farmers (like Farmcrowdy or ThriveAgric) — they have the ground truth data, you build the model layer.',
    tags: ['agritech', 'ml', 'research'],
    chat_date: '2025-07-15T14:00:00Z',
  },
  {
    title: 'Mentorship Marketplace Africa',
    description: 'A paid mentorship platform connecting African professionals with experienced mentors in their field — structured 4-week programmes with clear outcomes, not open-ended chat access.',
    sector: 'education',
    idea_type: 'product',
    status: 'lightly_researched',
    grade_novelty: 3,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 4,
    grade_urgency: 2,
    next_steps: ['Define the structured programme format', 'Recruit 10 mentors as founding cohort', 'Price test with 3 potential mentees'],
    blockers: ['Mentor time is scarce and they are hard to retain', 'Quality control at scale'],
    ai_suggestions: 'Charge mentors a small listing fee instead of taking commission from sessions — this filters out low-commitment mentors and aligns incentives.',
    tags: ['education', 'mentorship', 'africa'],
    chat_date: '2025-08-30T10:00:00Z',
  },
  {
    title: 'African Creatives Marketplace',
    description: 'A curated marketplace for African graphic designers, illustrators, and visual artists to sell digital assets — templates, illustrations, Figma kits, and brand assets — to global buyers who want authentic African aesthetics.',
    sector: 'creative',
    idea_type: 'community',
    status: 'paused',
    grade_novelty: 4,
    grade_feasibility: 4,
    grade_personal_fit: 4,
    grade_market_potential: 4,
    grade_urgency: 2,
    next_steps: ['Identify 20 African designers to seed the marketplace', 'Define quality bar and review process'],
    blockers: ['Payment infrastructure challenges for Africa-to-world payouts', 'Chicken-and-egg: need buyers and sellers simultaneously'],
    ai_suggestions: 'Launch with a "Featured Collections" model — curate monthly themed packs (e.g. Afrobeats campaign kit) and sell them as limited editions. It bypasses the marketplace cold-start problem.',
    tags: ['creative', 'marketplace', 'africa', 'design'],
    chat_date: '2025-05-25T13:00:00Z',
  },
  {
    title: 'Climate Data Dashboard Africa',
    description: 'A public dashboard visualising climate and environmental data for African countries — deforestation rates, air quality by city, flood risk zones, and temperature trends — in an accessible, non-academic format.',
    sector: 'climate',
    idea_type: 'research',
    status: 'lightly_researched',
    grade_novelty: 4,
    grade_feasibility: 4,
    grade_personal_fit: 3,
    grade_market_potential: 2,
    grade_urgency: 3,
    next_steps: ['Identify free African climate data sources (World Bank, NASA POWER)', 'Build a prototype for one country with Recharts'],
    blockers: ['Monetisation path is unclear — this is more public good than business'],
    ai_suggestions: 'Position as a research tool for journalists and NGOs — they will amplify it organically, which builds credibility for grant applications.',
    tags: ['climate', 'data', 'africa', 'research'],
    chat_date: '2025-09-11T11:30:00Z',
  },
  {
    title: 'Build in Lagos Newsletter',
    description: 'A weekly newsletter covering the Lagos and Nigerian startup ecosystem — funding rounds, product launches, founder profiles, and the weekly job board — written for insiders, not outsiders looking in.',
    sector: 'content',
    idea_type: 'content',
    status: 'in_progress',
    grade_novelty: 3,
    grade_feasibility: 5,
    grade_personal_fit: 5,
    grade_market_potential: 3,
    grade_urgency: 3,
    next_steps: ['Write and ship issue #1 this week', 'Set up Substack + Ghost comparison for long-term', 'Reach 500 subscribers in first 3 months'],
    blockers: ['Consistency is harder than starting'],
    ai_suggestions: 'Add a "This Week in Lagos Jobs" section from day one — job content drives subscriptions faster than any other newsletter content type.',
    tags: ['content', 'newsletter', 'lagos', 'startup'],
    chat_date: '2025-12-01T08:00:00Z',
  },
];

export async function POST() {
  try {
    const supabase = createServiceClient();

    const rows = DEMO_IDEAS.map((idea) => ({
      user_id: 'favour',
      source_type: 'manual' as const,
      source_ref: DEMO_SOURCE_REF,
      raw_source: null,
      ai_next_steps: [],
      ...idea,
    }));

    const { error } = await supabase.from('ideas').insert(rows);

    if (error) {
      console.error('Demo seed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('sync_log').insert({
      user_id: 'favour',
      source: 'demo_mode',
      ideas_found: rows.length,
      ideas_added: rows.length,
      ideas_updated: 0,
      notes: `Demo data seeded — ${rows.length} ideas across multiple sectors.`,
    });

    // Seed conversation stats (best-effort — pages fall back to static data if tables missing)
    try {
      const convRows = DEMO_CONVERSATIONS_LOG.map((c) => ({ ...c }));
      const { error: convErr } = await supabase.from('conversations_log').upsert(convRows, { onConflict: 'user_id,conversation_uuid' });
      if (convErr) console.warn('conversations_log upsert skipped:', convErr.message);

      const { data: existing } = await supabase.from('user_stats').select('*').eq('user_id', 'favour').single();
      const { error: statsErr } = await supabase.from('user_stats').upsert({
        user_id: 'favour',
        total_conversations: (existing?.total_conversations || 0) + DEMO_USER_STATS.total_conversations,
        total_words: (existing?.total_words || 0) + DEMO_USER_STATS.total_words,
        total_human_words: (existing?.total_human_words || 0) + DEMO_USER_STATS.total_human_words,
        total_assistant_words: (existing?.total_assistant_words || 0) + DEMO_USER_STATS.total_assistant_words,
        total_code_blocks: (existing?.total_code_blocks || 0) + DEMO_USER_STATS.total_code_blocks,
        total_code_lines: (existing?.total_code_lines || 0) + DEMO_USER_STATS.total_code_lines,
        first_conversation_at: existing?.first_conversation_at
          ? (DEMO_USER_STATS.first_conversation_at! < existing.first_conversation_at ? DEMO_USER_STATS.first_conversation_at : existing.first_conversation_at)
          : DEMO_USER_STATS.first_conversation_at,
        last_conversation_at: DEMO_USER_STATS.last_conversation_at,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (statsErr) console.warn('user_stats upsert skipped:', statsErr.message);
    } catch (e) {
      console.warn('Demo conversation stats seeding failed (non-fatal):', e);
    }

    return NextResponse.json({ seeded: rows.length });
  } catch (err) {
    console.error('Demo seed error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createServiceClient();

    const { error, count } = await supabase
      .from('ideas')
      .delete({ count: 'exact' })
      .eq('user_id', 'favour')
      .eq('source_ref', DEMO_SOURCE_REF);

    if (error) {
      console.error('Demo clear error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Remove demo conversations and recompute user_stats
    try {
      await supabase
        .from('conversations_log')
        .delete()
        .eq('user_id', 'favour')
        .like('conversation_uuid', `${DEMO_CONV_PREFIX}%`);

      // Recompute user_stats from remaining conversations
      const { data: remaining } = await supabase
        .from('conversations_log')
        .select('total_words, human_words, assistant_words, code_blocks, code_lines, created_at')
        .eq('user_id', 'favour');

      if (remaining && remaining.length > 0) {
        const totals = remaining.reduce(
          (acc: { total_conversations: number; total_words: number; total_human_words: number; total_assistant_words: number; total_code_blocks: number; total_code_lines: number }, r: { total_words: number; human_words: number; assistant_words: number; code_blocks: number; code_lines: number }) => ({
            total_conversations: acc.total_conversations + 1,
            total_words: acc.total_words + r.total_words,
            total_human_words: acc.total_human_words + r.human_words,
            total_assistant_words: acc.total_assistant_words + r.assistant_words,
            total_code_blocks: acc.total_code_blocks + r.code_blocks,
            total_code_lines: acc.total_code_lines + r.code_lines,
          }),
          { total_conversations: 0, total_words: 0, total_human_words: 0, total_assistant_words: 0, total_code_blocks: 0, total_code_lines: 0 }
        );
        const dates = remaining.map((r: { created_at: string }) => r.created_at).sort();
        await supabase.from('user_stats').upsert({
          user_id: 'favour',
          ...totals,
          first_conversation_at: dates[0],
          last_conversation_at: dates[dates.length - 1],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } else {
        await supabase.from('user_stats').delete().eq('user_id', 'favour');
      }
    } catch (statsErr) {
      console.warn('Demo conversation clear failed (non-fatal):', statsErr);
    }

    return NextResponse.json({ cleared: count ?? 0 });
  } catch (err) {
    console.error('Demo clear error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
