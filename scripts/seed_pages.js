// scripts/seed_pages.js
import fs from 'fs';
import path from 'path';
// import 'dotenv/config'; - Using native node --env-file instead
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRORE: SUPABASE_URL sau SUPABASE_SERVICE_KEY lipsește din .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PAGES_TO_SEED = [
  { slug: 'index', file: 'public/index.html', title: 'Home - ORYN Tech' },
  { slug: 'trial', file: 'public/trial.html', title: 'Try for Free - ORYN Tech' },
  { slug: 'tutorials', file: 'public/tutorials.html', title: 'Academy - ORYN Tech' },
];

async function seed() {
  console.log("🚀 Starting seeding process...");

  for (const p of PAGES_TO_SEED) {
    console.log(`\n📄 Processing page: ${p.slug}...`);
    
    // Simplu: Punem tot conținutul body-ului într-un widget HTML pentru început, 
    // SAU încercăm să mapăm manual secțiunile principale dacă vrem să fim foarte "pro".
    // Dat fiind timpul și complexitatea regex-urilor necesare pentru a 'sparge' HTML-ul lor complex, 
    // cel mai sigur 'seeding' inițial este să importăm layout-ul lor actual ca widget-uri de tip 'html' (bucăți mari).
    
    // Însă, pentru 'Tutorials', userul a cerut specific editarea secțiunilor.
    // Voi face un seeder hibrid:
    
    let sections = [];

    if (p.slug === 'tutorials') {
      sections = [
        { id: 'w1', type: 'tut_hero', props: { 
          title: 'Învață. Automatizează.<br>Scalează.', 
          subtitle: 'Tutoriale pas-cu-pas pentru a stăpâni platforma ORYN și a-ți automatiza business-ul complet.',
          stats: [
            { value: '24', label: 'Tutoriale' },
            { value: '8h+', label: 'Conținut video' },
            { value: '6', label: 'Module' },
            { value: 'Free', label: 'Acces total' }
          ]
        }, order: 10 },
        { id: 'w2', type: 'tut_featured', props: { 
          label: 'Tutorial recomandat', 
          title: 'Configurarea completă a sistemului ORYN în 60 de minute',
          desc: 'De la zero la un sistem complet automatizat — CRM, pipelines, AI agents, follow-up automat și calendar booking. Totul configurat pas cu pas.',
          badgeText: 'Cel mai popular',
          metaItems: [
            { icon: 'schedule', text: '58 min' },
            { icon: 'signal_cellular_alt', text: 'Toate nivelurile' },
            { icon: 'visibility', text: '1.2k vizualizări' }
          ]
        }, order: 20 },
        { id: 'w3', type: 'tut_paths', props: {
          label: 'Parcursuri de învățare',
          paths: [
            { icon: 'rocket_launch', name: 'Începători', count: '6 tutoriale · 2h 30min' },
            { icon: 'smart_toy', name: 'AI Automation', count: '5 tutoriale · 2h 15min' },
            { icon: 'funnel', name: 'Funnels & Lead Capture', count: '4 tutoriale · 1h 45min' },
            { icon: 'calendar_month', name: 'Calendar & Booking', count: '3 tutoriale · 1h 10min' },
            { icon: 'mail', name: 'Email & SMS', count: '4 tutoriale · 1h 20min' },
            { icon: 'star', name: 'Reputație & Recenzii', count: '2 tutoriale · 45min' }
          ]
        }, order: 30 }
      ];
    } else if (p.slug === 'trial') {
      sections = [
        { id: 't1', type: 'trial_hero', props: {
           title1: 'Business-ul tău pe',
           title2: 'Pilot Automat.',
           subtitle: 'Lead-uri pierdute. Răspunsuri întârziate. Follow-up niciodată.<br><strong>Concurența ta se automatizează deja.</strong>',
           badges: [
             { text: 'Acces imediat' }, { text: 'AI activ 24/7' }, { text: 'Fără card' }, { text: '14 zile gratuit' }
           ],
           ctaText: 'Vreau Acces Gratuit →',
           ctaLink: '#trial'
        }, order: 10 },
        { id: 't2', type: 'index_stats', props: {
          items: [
            { value: '80%', label: 'Reducere no-show' },
            { value: '<60s', label: 'Răspuns lead-uri' },
            { value: '30+', label: 'Tool-uri AI' },
            { value: '24/7', label: 'Sistem activ' },
            { value: '0', label: 'Lead-uri pierdute' }
          ]
        }, order: 20 },
        { id: 't3', type: 'problems_grid', props: {
          title: 'Problemele care te <span class=\"g\">costă bani în fiecare zi</span>',
          items: [
            { icon: 'call_missed', title: 'Lead-uri pierdute la telefon', desc: 'N-ai răspuns. Au sunat la concurență.' },
            { icon: 'update', title: 'Follow-up inconsistent', desc: 'Uiți, nu ai timp, lead-urile se răcesc.' },
            { icon: 'forum', title: 'Haos în inbox-uri', desc: 'WhatsApp, email, Instagram — mesaje pierdute.' },
            { icon: 'event_busy', title: 'No-show-uri repetate', desc: 'Clienții nu apar. Fără reminder.' },
            { icon: 'loop', title: 'Task-uri repetitive', desc: 'Aceleași mesaje trimise manual de 10 ori pe zi.' },
            { icon: 'visibility_off', title: 'Zero vizibilitate', desc: 'Lead-urile intră, banii nu ies.' }
          ]
        }, order: 30 },
        { id: 't4', type: 'bridge_banner', props: {
          title: 'Există un sistem care rezolvă toate astea.<br>Fără angajați în plus. Fără haos.',
          subtitle: 'Un singur sistem centralizat: răspunde, urmărește, programează și convertește — automat, 24/7.<br>Testează gratuit 14 zile.'
        }, order: 40 },
        { id: 't5', type: 'before_after_table', props: {
          title: 'Ce se schimbă <span class=\"g\">din ziua 1</span>',
          beforeTitle: 'Fără sistem',
          afterTitle: 'Cu ORYNTECH',
          rows: [
            { before: 'Lead-urile nu răspund, nu mai suni', after: 'AI răspunde în secunde, tu închizi vânzările' },
            { before: 'Follow-up doar când îți amintești', after: 'Secvențe automate: nu dorm, nu uită, nu obosesc' },
            { before: 'Calendar plin de no-show-uri', after: 'Reminder automat — no-show-uri -80%' },
            { before: 'Nu știi ce funcționează', after: 'Dashboard live: lead-uri, conversii, venituri' },
            { before: 'Tu răspunzi manual la orice', after: 'Sistemul rulează. Tu te concentrezi pe creștere.' }
          ]
        }, order: 50 }
      ];
    } else if (p.slug === 'index') {
      sections = [
        { id: 'h1', type: 'home_hero', props: {
          title1: 'Print Money Like A',
          title2: 'F*cking Machine.',
          subtitle: 'Leads slipping. Replies late. Follow-ups skipped. Your competitors are automating. <strong>One payment. 30+ AI tools. A business that runs without you.</strong>',
          badges: [
            { text: '⚡ One-time payment' }, { text: '🤖 AI running 24/7' }, { text: '🔒 Zero hidden fees' }
          ]
        }, order: 10 },
        { id: 'h2', type: 'index_stats', props: {
          items: [
            { value: '30+', label: 'AI Tools' },
            { value: '1×', label: 'Payment' },
            { value: '24/7', label: 'AI Active' },
            { value: '$0', label: 'Hidden Fees' },
            { value: '∞', label: 'Leads Automated' }
          ]
        }, order: 20 },
        { id: 'h3', type: 'bento_pricing', props: {
          starter: {
            name: 'Starter Plan',
            price: '299',
            total: 'Billed today: <strong>$1,794</strong>',
            hook: 'Every core AI tool to stop the bleeding and put your business on autopilot from day one.',
            features: [
              { icon: 'smart_toy', name: 'Your AI Employee', desc: 'AI answers leads, books calls, qualifies clients — 24/7.' },
              { icon: 'call_missed', name: 'Missed Call? AI Texts Back', desc: 'Every missed call is a lost deal. AI fires a text before they dial your competitor.' }
            ]
          },
          scale: {
            name: 'Scale Plan',
            price: '199',
            total: 'Billed today: <strong>$2,388</strong>',
            hook: 'The closest legal thing to a money-printing machine — a complete AI system, built and launched for you.',
            features: [
              { icon: 'smart_toy', name: 'Your AI Employee', desc: 'AI answers leads, books calls, qualifies clients — 24/7.' }
            ],
            bonuses: [
              { icon: 'psychology', name: 'We Build Your AI Agents For You', desc: 'Custom AI bots trained on your business, tone, and offers.' }
            ]
          }
        }, order: 30 }
      ];
    }

    const { error } = await supabase
      .from('pages')
      .upsert({
        slug: p.slug,
        title: p.title,
        content: { sections },
        meta_title: p.title,
        meta_desc: 'ORYN Tech AI Automation Agency - ' + p.slug,
        updated_at: new Date().toISOString()
      }, { onConflict: 'slug' });

    if (error) {
      console.error(`❌ Error seeding ${p.slug}:`, error);
    } else {
      console.log(`✅ Seeded ${p.slug} with ${sections.length} sections.`);
    }
  }

  console.log("\n✨ Seeding complete!");
}

seed();
