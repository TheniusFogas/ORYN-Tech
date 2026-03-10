// admin/widgets/definitions.js
// ─────────────────────────────────────────────────────────
// Definițiile complete pentru fiecare tip de widget.
// Fiecare widget are:
//   - type: string ID unic
//   - label: nume afișat în UI
//   - icon: Material Symbol
//   - category: grupare în sidebar
//   - defaultProps: valorile implicite
//   - schema: definițiile câmpurilor editabile din Properties panel
// ─────────────────────────────────────────────────────────

export const WIDGET_DEFINITIONS = {

  // ── LAYOUT ──────────────────────────────────────────
  spacer: {
    type: 'spacer', label: 'Spațiu', icon: 'height', category: 'layout',
    defaultProps: { height: 48 },
    schema: [
      { key: 'height', label: 'Înălțime (px)', type: 'range', min: 8, max: 200, step: 8 },
    ],
  },

  divider: {
    type: 'divider', label: 'Separator', icon: 'horizontal_rule', category: 'layout',
    defaultProps: { style: 'solid', color: 'rgba(139,92,246,0.2)', marginY: 16 },
    schema: [
      { key: 'style',   label: 'Stil linie',     type: 'select', options: ['solid','dashed','dotted'] },
      { key: 'color',   label: 'Culoare',         type: 'color' },
      { key: 'marginY', label: 'Spațiu vertical', type: 'range', min: 0, max: 80 },
    ],
  },

  columns: {
    type: 'columns', label: 'Coloane', icon: 'view_column', category: 'layout',
    defaultProps: {
      cols: 2, gap: 24, paddingY: 32, paddingX: 40,
      cells: [
        { id: 'cell_1', content: 'Coloana 1 — adaugă conținut' },
        { id: 'cell_2', content: 'Coloana 2 — adaugă conținut' },
      ],
    },
    schema: [
      { key: 'cols',     label: 'Număr coloane', type: 'columns_picker', min: 1, max: 6 },
      { key: 'gap',      label: 'Spațiu între coloane', type: 'range', min: 0, max: 80 },
      { key: 'paddingY', label: 'Padding vertical',     type: 'range', min: 0, max: 120 },
      { key: 'paddingX', label: 'Padding orizontal',    type: 'range', min: 0, max: 120 },
    ],
  },

  // ── CONȚINUT ────────────────────────────────────────
  hero: {
    type: 'hero', label: 'Hero Section', icon: 'title', category: 'content',
    defaultProps: {
      eyebrow: 'ORYNTECH — AI Automation Agency',
      title: 'Titlul tău principal aici.',
      subtitle: 'Descriere scurtă și convingătoare care explică valoarea ta.',
      ctaText: 'Acțiune Principală',
      ctaLink: './trial.html',
      ctaIcon: 'rocket_launch',
      align: 'center',
      paddingY: 80,
      showEyebrow: true,
      showCta: true,
    },
    schema: [
      { key: 'eyebrow',     label: 'Eyebrow text',    type: 'text' },
      { key: 'showEyebrow', label: 'Afișează eyebrow', type: 'toggle' },
      { key: 'title',       label: 'Titlu principal',  type: 'textarea' },
      { key: 'subtitle',    label: 'Subtitlu',          type: 'textarea' },
      { key: 'ctaText',     label: 'Text buton CTA',   type: 'text' },
      { key: 'ctaLink',     label: 'Link buton CTA',   type: 'text' },
      { key: 'ctaIcon',     label: 'Icoană buton',     type: 'icon_picker' },
      { key: 'showCta',     label: 'Afișează CTA',     type: 'toggle' },
      { key: 'align',       label: 'Aliniere text',    type: 'select', options: ['left','center','right'] },
      { key: 'paddingY',    label: 'Padding vertical', type: 'range', min: 20, max: 160, step: 8 },
    ],
  },

  text: {
    type: 'text', label: 'Bloc Text', icon: 'text_fields', category: 'content',
    defaultProps: {
      title: '',
      content: 'Adaugă conținutul tău text aici.',
      align: 'left',
      fontSize: 15,
      paddingY: 32, paddingX: 40,
      showTitle: false,
    },
    schema: [
      { key: 'showTitle', label: 'Afișează titlu', type: 'toggle' },
      { key: 'title',     label: 'Titlu secțiune', type: 'text' },
      { key: 'content',   label: 'Conținut text',  type: 'richtext' },
      { key: 'align',     label: 'Aliniere',       type: 'select', options: ['left','center','right'] },
      { key: 'fontSize',  label: 'Mărime font',    type: 'range', min: 12, max: 24 },
      { key: 'paddingY',  label: 'Padding vertical',  type: 'range', min: 0, max: 120 },
      { key: 'paddingX',  label: 'Padding orizontal', type: 'range', min: 0, max: 120 },
    ],
  },

  image: {
    type: 'image', label: 'Imagine', icon: 'image', category: 'content',
    defaultProps: {
      src: '', alt: '', caption: '',
      width: '100%', borderRadius: 12,
      paddingY: 24, paddingX: 40,
      showCaption: false,
    },
    schema: [
      { key: 'src',          label: 'URL imagine',     type: 'image_upload' },
      { key: 'alt',          label: 'Alt text',        type: 'text' },
      { key: 'caption',      label: 'Legendă',         type: 'text' },
      { key: 'showCaption',  label: 'Afișează legendă', type: 'toggle' },
      { key: 'borderRadius', label: 'Border radius',   type: 'range', min: 0, max: 32 },
      { key: 'paddingY',     label: 'Padding vertical', type: 'range', min: 0, max: 80 },
      { key: 'paddingX',     label: 'Padding orizontal', type: 'range', min: 0, max: 80 },
    ],
  },

  video: {
    type: 'video', label: 'Video', icon: 'play_circle', category: 'content',
    defaultProps: {
      url: '', provider: 'youtube',
      aspectRatio: '16/9', borderRadius: 12,
      paddingY: 24, paddingX: 40,
    },
    schema: [
      { key: 'url',         label: 'URL Video (YouTube/Vimeo)', type: 'text' },
      { key: 'provider',    label: 'Provider', type: 'select', options: ['youtube','vimeo'] },
      { key: 'borderRadius', label: 'Border radius', type: 'range', min: 0, max: 24 },
      { key: 'paddingY',    label: 'Padding vertical',  type: 'range', min: 0, max: 80 },
      { key: 'paddingX',    label: 'Padding orizontal', type: 'range', min: 0, max: 80 },
    ],
  },

  // ── COMPONENTE ──────────────────────────────────────
  stats: {
    type: 'stats', label: 'Stats Bar', icon: 'bar_chart', category: 'components',
    defaultProps: {
      columns: 4,
      paddingY: 40, paddingX: 40,
      items: [
        { value: '30+',  label: 'AI Tools' },
        { value: '24/7', label: 'AI Active' },
        { value: '$0',   label: 'Extra staff' },
        { value: '100%', label: 'Automatizat' },
      ],
    },
    schema: [
      { key: 'columns',  label: 'Coloane',          type: 'columns_picker', min: 1, max: 6 },
      { key: 'paddingY', label: 'Padding vertical',  type: 'range', min: 0, max: 120 },
      { key: 'paddingX', label: 'Padding orizontal', type: 'range', min: 0, max: 120 },
      { key: 'items',    label: 'Statistici',        type: 'repeater',
        itemSchema: [
          { key: 'value', label: 'Valoare', type: 'text' },
          { key: 'label', label: 'Label',   type: 'text' },
        ]
      },
    ],
  },

  cards: {
    type: 'cards', label: 'Cards Grid', icon: 'grid_view', category: 'components',
    defaultProps: {
      title: 'Titlu secțiune',
      showTitle: true,
      columns: 3,
      paddingY: 40, paddingX: 40,
      cards: [
        { id: 'c1', icon: 'smart_toy',     title: 'Card 1', desc: 'Descriere card 1.' },
        { id: 'c2', icon: 'rocket_launch', title: 'Card 2', desc: 'Descriere card 2.' },
        { id: 'c3', icon: 'auto_awesome',  title: 'Card 3', desc: 'Descriere card 3.' },
      ],
    },
    schema: [
      { key: 'showTitle', label: 'Afișează titlu secțiune', type: 'toggle' },
      { key: 'title',     label: 'Titlu secțiune',          type: 'text' },
      { key: 'columns',   label: 'Coloane',                 type: 'columns_picker', min: 1, max: 6 },
      { key: 'paddingY',  label: 'Padding vertical',        type: 'range', min: 0, max: 120 },
      { key: 'paddingX',  label: 'Padding orizontal',       type: 'range', min: 0, max: 120 },
      { key: 'cards',     label: 'Carduri',                 type: 'repeater',
        itemSchema: [
          { key: 'icon',  label: 'Icoană',     type: 'icon_picker' },
          { key: 'title', label: 'Titlu card', type: 'text' },
          { key: 'desc',  label: 'Descriere',  type: 'textarea' },
        ]
      },
    ],
  },

  faq: {
    type: 'faq', label: 'FAQ', icon: 'help', category: 'components',
    defaultProps: {
      title: 'Întrebări frecvente',
      showTitle: true,
      paddingY: 40, paddingX: 40,
      items: [
        { id: 'f1', q: 'Întrebare 1?',  a: 'Răspuns la întrebarea 1.' },
        { id: 'f2', q: 'Întrebare 2?',  a: 'Răspuns la întrebarea 2.' },
        { id: 'f3', q: 'Întrebare 3?',  a: 'Răspuns la întrebarea 3.' },
      ],
    },
    schema: [
      { key: 'showTitle', label: 'Afișează titlu', type: 'toggle' },
      { key: 'title',     label: 'Titlu secțiune', type: 'text' },
      { key: 'paddingY',  label: 'Padding vertical',  type: 'range', min: 0, max: 120 },
      { key: 'paddingX',  label: 'Padding orizontal', type: 'range', min: 0, max: 120 },
      { key: 'items',     label: 'Întrebări', type: 'repeater',
        itemSchema: [
          { key: 'q', label: 'Întrebare', type: 'text' },
          { key: 'a', label: 'Răspuns',   type: 'textarea' },
        ]
      },
    ],
  },

  cta: {
    type: 'cta', label: 'CTA Banner', icon: 'ads_click', category: 'components',
    defaultProps: {
      title: 'Gata să automatizezi?',
      subtitle: 'Încearcă 14 zile gratuit — fără card, fără risc.',
      ctaText: 'Start Free Trial',
      ctaLink: './trial.html',
      ctaIcon: 'rocket_launch',
      secondaryText: '', secondaryLink: '', showSecondary: false,
      paddingY: 56,
      bgStyle: 'gradient',
    },
    schema: [
      { key: 'title',         label: 'Titlu',             type: 'text' },
      { key: 'subtitle',      label: 'Subtitlu',           type: 'textarea' },
      { key: 'ctaText',       label: 'Text buton primar',  type: 'text' },
      { key: 'ctaLink',       label: 'Link buton primar',  type: 'text' },
      { key: 'ctaIcon',       label: 'Icoană buton',       type: 'icon_picker' },
      { key: 'showSecondary', label: 'Buton secundar',     type: 'toggle' },
      { key: 'secondaryText', label: 'Text buton secundar', type: 'text' },
      { key: 'secondaryLink', label: 'Link buton secundar', type: 'text' },
      { key: 'bgStyle',       label: 'Fundal',             type: 'select', options: ['gradient','solid','transparent'] },
      { key: 'paddingY',      label: 'Padding vertical',   type: 'range', min: 24, max: 120, step: 8 },
    ],
  },

  pricing: {
    type: 'pricing', label: 'Pricing', icon: 'price_change', category: 'components',
    defaultProps: {
      title: 'Alege planul tău',
      subtitle: '',
      showTitle: true,
      paddingY: 56, paddingX: 40,
      plans: [
        {
          id: 'p1', name: '6 Luni', badge: '', highlighted: false,
          price: '299', currency: '$', period: '/lună',
          total: 'Total: $1,794',
          features: ['CRM complet', 'AI Agents', 'Automatizări nelimitate'],
          ctaText: 'Începe acum', ctaLink: './trial.html',
        },
        {
          id: 'p2', name: '12 Luni', badge: 'Recomandat', highlighted: true,
          price: '199', currency: '$', period: '/lună',
          total: 'Total: $2,388',
          features: ['Tot ce include 6 luni', 'Prioriry support', 'Onboarding dedicat'],
          ctaText: 'Cel mai bun preț', ctaLink: './trial.html',
        },
      ],
    },
    schema: [
      { key: 'showTitle', label: 'Afișează titlu', type: 'toggle' },
      { key: 'title',     label: 'Titlu secțiune', type: 'text' },
      { key: 'subtitle',  label: 'Subtitlu',       type: 'text' },
      { key: 'paddingY',  label: 'Padding vertical',  type: 'range', min: 0, max: 120 },
      { key: 'paddingX',  label: 'Padding orizontal', type: 'range', min: 0, max: 120 },
      { key: 'plans',     label: 'Planuri', type: 'repeater',
        itemSchema: [
          { key: 'name',        label: 'Nume plan',      type: 'text' },
          { key: 'badge',       label: 'Badge',          type: 'text' },
          { key: 'highlighted', label: 'Evidențiat',     type: 'toggle' },
          { key: 'price',       label: 'Preț',           type: 'text' },
          { key: 'currency',    label: 'Monedă',         type: 'text' },
          { key: 'period',      label: 'Perioadă',       type: 'text' },
          { key: 'total',       label: 'Total text',     type: 'text' },
          { key: 'ctaText',     label: 'Text CTA',       type: 'text' },
          { key: 'ctaLink',     label: 'Link CTA',       type: 'text' },
        ]
      },
    ],
  },

  testimonials: {
    type: 'testimonials', label: 'Testimoniale', icon: 'format_quote', category: 'components',
    defaultProps: {
      title: 'Ce spun clienții noștri',
      showTitle: true,
      columns: 3,
      paddingY: 48, paddingX: 40,
      items: [
        { id: 't1', name: 'Alexandru M.', role: 'CEO, Agenție Marketing', text: 'ORYN ne-a transformat complet procesul de vânzări. Lead-urile sunt urmărite automat.', avatar: '', rating: 5 },
        { id: 't2', name: 'Maria P.', role: 'Owner, Clinică Estetică', text: 'Calendarele noastre sunt pline și nu mai pierdem niciun apel. Fantastic.', avatar: '', rating: 5 },
        { id: 't3', name: 'Bogdan T.', role: 'Antreprenor', text: 'Am economisit 20h/săptămână pe follow-up-uri. ROI în prima lună.', avatar: '', rating: 5 },
      ],
    },
    schema: [
      { key: 'showTitle', label: 'Afișează titlu', type: 'toggle' },
      { key: 'title',     label: 'Titlu',          type: 'text' },
      { key: 'columns',   label: 'Coloane',         type: 'columns_picker', min: 1, max: 4 },
      { key: 'paddingY',  label: 'Padding vertical',  type: 'range', min: 0, max: 120 },
      { key: 'paddingX',  label: 'Padding orizontal', type: 'range', min: 0, max: 120 },
      { key: 'items',     label: 'Testimoniale', type: 'repeater',
        itemSchema: [
          { key: 'name',   label: 'Nume',     type: 'text' },
          { key: 'role',   label: 'Rol/Titlu', type: 'text' },
          { key: 'text',   label: 'Testimonial', type: 'textarea' },
          { key: 'rating', label: 'Rating (1-5)', type: 'range', min: 1, max: 5 },
        ]
      },
    ],
  },

  form: {
    type: 'form', label: 'Formular', icon: 'contact_mail', category: 'components',
    defaultProps: {
      title: 'Contactează-ne',
      subtitle: '',
      showTitle: true,
      submitText: 'Trimite',
      submitIcon: 'send',
      webhookUrl: '/api/leads',
      successMessage: 'Mulțumim! Te contactăm în curând.',
      paddingY: 48, paddingX: 40,
      fields: [
        { id: 'f1', name: 'firstname', label: 'Prenume', type: 'text', required: true, half: true },
        { id: 'f2', name: 'lastname',  label: 'Nume',    type: 'text', required: false, half: true },
        { id: 'f3', name: 'email',     label: 'Email',   type: 'email', required: true, half: false },
        { id: 'f4', name: 'phone',     label: 'Telefon', type: 'tel',  required: false, half: false },
        { id: 'f5', name: 'message',   label: 'Mesaj',   type: 'textarea', required: false, half: false },
      ],
    },
    schema: [
      { key: 'showTitle',      label: 'Afișează titlu',   type: 'toggle' },
      { key: 'title',          label: 'Titlu formular',   type: 'text' },
      { key: 'subtitle',       label: 'Subtitlu',          type: 'text' },
      { key: 'submitText',     label: 'Text buton submit', type: 'text' },
      { key: 'webhookUrl',     label: 'Webhook URL',       type: 'text' },
      { key: 'successMessage', label: 'Mesaj succes',      type: 'text' },
      { key: 'paddingY',       label: 'Padding vertical',  type: 'range', min: 0, max: 120 },
    ],
  },

  html: {
    type: 'html', label: 'HTML Custom', icon: 'code', category: 'components',
    defaultProps: {
      code: '<!-- Adaugă HTML personalizat aici -->',
      paddingY: 24, paddingX: 40,
    },
    schema: [
      { key: 'code',     label: 'Cod HTML', type: 'code' },
      { key: 'paddingY', label: 'Padding vertical',  type: 'range', min: 0, max: 80 },
      { key: 'paddingX', label: 'Padding orizontal', type: 'range', min: 0, max: 80 },
    ],
  },

  // ── LOCKED (animații complexe — nu editabile) ────────
  galaxy_header: {
    type: 'galaxy_header', label: 'Header Animat', icon: 'auto_awesome', category: 'locked',
    defaultProps: { locked: true },
    schema: [],
  },
};

// Categorii ordonate pentru sidebar
export const WIDGET_CATEGORIES = [
  { id: 'layout',     label: 'Layout',      icon: 'dashboard_customize' },
  { id: 'content',    label: 'Conținut',    icon: 'text_fields' },
  { id: 'components', label: 'Componente',  icon: 'widgets' },
  { id: 'locked',     label: 'Sistem',      icon: 'lock' },
];

export default WIDGET_DEFINITIONS;
