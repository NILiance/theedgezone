/**
 * Static services catalog. Will be replaced by Postgres `products` /
 * `product_variants` queries in Phase 1.
 *
 * Data captured from the legacy theedgezone.com/services page.
 */

export type Audience = 'talent' | 'brand'
export type Status = 'popular' | 'new' | null

export interface Service {
  id: string
  title: string
  tagline: string
  description: string
  icon: string // emoji
  category: CategoryKey
  audience: Audience[]
  price: string
  status?: Status
  autoCreated?: boolean
  expertTeam?: boolean
}

export type CategoryKey =
  | 'digital-presence'
  | 'brand-design'
  | 'marketing-growth'
  | 'revenue-monetization'
  | 'professional-services'
  | 'education-development'
  | 'events-physical'
  | 'career-readiness'
  | 'health-wellness'

export const CATEGORIES: { key: CategoryKey; label: string; icon: string }[] = [
  { key: 'digital-presence', label: 'Digital Presence', icon: '🌐' },
  { key: 'brand-design', label: 'Brand & Design', icon: '🎨' },
  { key: 'marketing-growth', label: 'Marketing & Growth', icon: '📈' },
  { key: 'revenue-monetization', label: 'Revenue & Monetization', icon: '💰' },
  { key: 'professional-services', label: 'Professional Services', icon: '⚖️' },
  { key: 'education-development', label: 'Education & Development', icon: '🎓' },
  { key: 'events-physical', label: 'Events & Physical', icon: '🎪' },
  { key: 'career-readiness', label: 'Career Readiness', icon: '🚀' },
  { key: 'health-wellness', label: 'Health & Wellness', icon: '💪' },
]

export const GUIDED_PATHS = [
  { name: 'Get Your First Brand Deal', icon: '🤝', services: 4, color: 'hsl(43 49% 45%)' },
  { name: 'Build Your Brand Empire', icon: '👑', services: 5, color: 'hsl(43 80% 55%)' },
  { name: 'Make Money While You Sleep', icon: '💤', services: 4, color: 'hsl(210 70% 55%)' },
  { name: 'Protect Your Future', icon: '🛡️', services: 5, color: 'hsl(210 50% 45%)' },
  { name: 'Level Up Your Game', icon: '⚡', services: 4, color: 'hsl(35 90% 55%)' },
]

export const SERVICES: Service[] = [
  // ── Digital Presence ─────────────────────────────────────────────────────
  {
    id: 'personal-website',
    title: 'Personal Website',
    tagline: 'Your digital home. Built for you. Launched in minutes.',
    description:
      'Your personal website is the hub of your entire NIL brand — the one place you fully control where brands, media, agents…',
    icon: '🌐',
    category: 'digital-presence',
    audience: ['talent'],
    price: '$29/mo',
    status: 'popular',
    autoCreated: true,
  },
  {
    id: 'epk',
    title: 'Electronic Press Kit',
    tagline: 'Your professional media kit. The key to unlocking brand deals.',
    description:
      'An Electronic Press Kit (EPK) is the single most important tool for landing brand deals and media coverage — your profes…',
    icon: '📋',
    category: 'digital-presence',
    audience: ['talent'],
    price: '$9.99/mo',
    status: 'popular',
    autoCreated: true,
  },
  {
    id: 'mobile-app',
    title: 'Custom Mobile App',
    tagline: 'Your own branded app. Built visually. Published to the App Store & Google Play.',
    description:
      'Build your own fully branded mobile app through a visual editor with a live phone-frame preview — no developers, no wait…',
    icon: '📱',
    category: 'digital-presence',
    audience: ['talent'],
    price: '$499',
    status: 'popular',
    autoCreated: true,
  },
  {
    id: 'digital-business-cards',
    title: 'Digital Business Cards',
    tagline: 'NFC-powered networking. One tap, infinite connections.',
    description:
      'Replace paper business cards with a premium NFC-powered smart card that shares your complete digital profile with a sing…',
    icon: '💳',
    category: 'digital-presence',
    audience: ['talent'],
    price: '$49',
    autoCreated: true,
  },
  {
    id: 'talent-podcast',
    title: 'Talent Podcast',
    tagline: 'Launch your show. Amplify your voice beyond the game.',
    description:
      'Launch a professional podcast that positions you as a thought leader and expands your brand beyond the field of play. He…',
    icon: '🎙️',
    category: 'digital-presence',
    audience: ['talent'],
    price: '$49/mo',
    status: 'new',
    autoCreated: true,
  },

  // ── Brand & Design ───────────────────────────────────────────────────────
  {
    id: 'personal-brand-design',
    title: 'Personal Brand Design',
    tagline: 'The only brand identity platform built specifically for talent.',
    description:
      '20 concepts included, built-in editor, complete brand package. Yours forever.',
    icon: '🎨',
    category: 'brand-design',
    audience: ['talent'],
    price: '$199',
    status: 'popular',
    autoCreated: true,
  },
  {
    id: 'brand-lite',
    title: 'Brand Lite',
    tagline: 'Upload your logo. Get the full brand kit instantly.',
    description:
      'Already have a logo? Generate the complete brand kit from it instantly.',
    icon: '🎨',
    category: 'brand-design',
    audience: ['talent', 'brand'],
    price: '$49',
    status: 'new',
    autoCreated: true,
  },

  // ── Marketing & Growth ───────────────────────────────────────────────────
  {
    id: 'social-media-growth',
    title: 'Social Media Growth',
    tagline: 'Data-driven strategies to boost engagement and followers.',
    description:
      'Systematic, data-driven social media growth strategies designed for talent and brands in the NIL space. Here is …',
    icon: '📊',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$299/mo',
    status: 'popular',
    expertTeam: true,
  },
  {
    id: 'social-media-management',
    title: 'Social Media Management',
    tagline: 'Intelligent content creation. Total brand control.',
    description:
      'Full-service social media management where our team handles everything — content creation, posting,…',
    icon: '📱',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$499/mo',
    expertTeam: true,
  },
  {
    id: 'ppc-seo',
    title: 'PPC & SEO Marketing',
    tagline: 'Drive targeted traffic. Dominate search. Maximize ROI.',
    description:
      'Drive targeted traffic and qualified leads through expertly managed paid advertising and search engine optimization.',
    icon: '🎯',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$799/mo',
    expertTeam: true,
  },
  {
    id: 'press-media',
    title: 'Press & Media Services',
    tagline: 'Get featured. Get noticed. Get the coverage you deserve.',
    description:
      'Professional public relations and media services to get your story covered by the right outlets. Here is exactly what yo…',
    icon: '📰',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$199',
    expertTeam: true,
  },

  // ── Revenue & Monetization ───────────────────────────────────────────────
  {
    id: 'online-store',
    title: 'Online Store / Merch',
    tagline: 'Your branded shop. Real apparel from real suppliers. Hands-off fulfillment.',
    description:
      'Launch a fully branded online store powered by direct integrations with major apparel and merchandise suppliers — S&S Ac…',
    icon: '🛒',
    category: 'revenue-monetization',
    audience: ['talent'],
    price: '$99',
    status: 'new',
    autoCreated: true,
  },
  {
    id: 'affiliate-opportunities',
    title: 'Affiliate Opportunities',
    tagline: 'Earn passive income from brands you already love.',
    description:
      'Earn passive income by promoting brands you genuinely use and believe in. Here is exactly what you get: Access to a cura…',
    icon: '💸',
    category: 'revenue-monetization',
    audience: ['talent'],
    price: 'Free / Custom',
    status: 'new',
    autoCreated: true,
  },
  {
    id: 'tiktok-monetization',
    title: 'TikTok Monetization',
    tagline: 'Transform views into revenue. TikTok Shop, scaled.',
    description:
      'Turn your TikTok following into consistent revenue through TikTok Shop, brand partnerships, and optimized content strate…',
    icon: '🎵',
    category: 'revenue-monetization',
    audience: ['talent', 'brand'],
    price: '$499',
    status: 'new',
    expertTeam: true,
  },

  // ── Professional Services ────────────────────────────────────────────────
  {
    id: 'financial-advisory',
    title: 'Financial Advisory',
    tagline: 'Expert financial guidance for talent and businesses.',
    description:
      'Personalized financial guidance from certified advisors who specialize in talent and sports businesses. Here is exactly…',
    icon: '📊',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'legal-support',
    title: 'Legal Support Services',
    tagline: 'Contract review, IP protection, and legal peace of mind.',
    description:
      'Professional legal services from attorneys experienced in sports law and NIL compliance. Here is exactly what you get: A…',
    icon: '⚖️',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'legal-document-creation',
    title: 'Legal Document Creation',
    tagline: 'Professional legal documents, fast and affordable.',
    description:
      'Professional legal document drafting and e-signature services. Here is exactly what you get: Custom legal documents gene…',
    icon: '📄',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$149',
    expertTeam: true,
  },
  {
    id: 'insurance-services',
    title: 'Insurance Services',
    tagline: 'Comprehensive coverage tailored for talent and businesses.',
    description:
      'Comprehensive insurance coverage guidance from independent advisors who shop multiple carriers. Here is exactly what you…',
    icon: '🛡️',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'tax-services',
    title: 'Tax Services',
    tagline: 'NIL-specific tax preparation and planning.',
    description:
      'Year-round tax planning and annual return preparation from tax professionals who understand NIL income. Here is exactly …',
    icon: '🧾',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$249',
    expertTeam: true,
  },
  {
    id: 'bookkeeping',
    title: 'Bookkeeping Services',
    tagline: 'Clean books. Clear picture. Every transaction tracked.',
    description:
      'Accurate, organized bookkeeping that gives you a clear picture of your finances every month. Here is exactly what you ge…',
    icon: '📔',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$149/mo',
    expertTeam: true,
  },
  {
    id: 'trademark',
    title: 'Trademark Registration',
    tagline: 'Protect your name, brand, and IP with federal trademark.',
    description:
      'Federal trademark registration to legally protect your name, logo, brand identity, and catchphrases. Here is exactly wha…',
    icon: '™️',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$349',
    expertTeam: true,
  },
  {
    id: 'data-removal',
    title: 'Data Removal Services',
    tagline: 'Remove your personal data from the internet. Privacy restored.',
    description:
      'Systematic removal of your personal information from data broker websites and people-search engines. Here is exactly wha…',
    icon: '🔒',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$99/mo',
    expertTeam: true,
  },
  {
    id: 'identity-theft',
    title: 'Identity Theft Protection',
    tagline: '24/7 identity monitoring and recovery support.',
    description:
      'Comprehensive identity monitoring and recovery services to protect your personal and financial information. Here is exac…',
    icon: '🔑',
    category: 'professional-services',
    audience: ['talent'],
    price: '$149/mo',
    expertTeam: true,
  },
  {
    id: 'student-loan',
    title: 'Student Loan Refinance',
    tagline: 'Lower your rate. Reduce your payments. Take control.',
    description:
      'Expert guidance on student loan refinancing options and repayment strategies. Here is exactly what you get: A comprehens…',
    icon: '🎓',
    category: 'professional-services',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Education & Development ──────────────────────────────────────────────
  {
    id: 'prep-nil-academy',
    title: 'Prep For NIL Academy',
    tagline: 'Structured NIL education. Courses, eBooks, and guides.',
    description:
      'Comprehensive education program that prepares you to navigate the NIL landscape with confidence and maximize…',
    icon: '📚',
    category: 'education-development',
    audience: ['talent'],
    price: '$49/mo',
  },
  {
    id: 'financial-wellness',
    title: 'Financial Wellness',
    tagline: 'Financial literacy education for talent.',
    description:
      'Financial literacy education built specifically for student talent navigating NIL income for the first time. Here is exa…',
    icon: '💵',
    category: 'education-development',
    audience: ['talent'],
    price: '$29/mo',
  },
  {
    id: 'nil-conferences',
    title: 'NIL Conferences',
    tagline: 'Live education, networking, and strategic workshops.',
    description:
      'Live education, strategic networking, and hands-on workshops for everyone in the NIL ecosystem. Here is…',
    icon: '🎤',
    category: 'education-development',
    audience: ['talent', 'brand'],
    price: '$199',
  },

  // ── Events & Physical ────────────────────────────────────────────────────
  {
    id: 'promotional-items',
    title: 'Promotional Items',
    tagline: 'Custom merch, giveaways, and branded gear for any campaign.',
    description:
      'Custom branded merchandise and promotional products for events, fan engagement, giveaways, and brand awareness campaigns…',
    icon: '🎁',
    category: 'events-physical',
    audience: ['talent', 'brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'print-products',
    title: 'Print Products',
    tagline: 'Banners, cards, flyers, signage — professional print for NIL.',
    description:
      'Professional print products produced on premium materials with expert finishing. Here is exactly what you get: Business …',
    icon: '🖨️',
    category: 'events-physical',
    audience: ['talent', 'brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Career Readiness ─────────────────────────────────────────────────────
  {
    id: 'resume-building',
    title: 'Resume Building',
    tagline: 'Professional resumes that open doors beyond athletics.',
    description:
      'Professional resume and career document services designed specifically for student talent entering the workforce. Here i…',
    icon: '📝',
    category: 'career-readiness',
    audience: ['talent'],
    price: '$99',
    expertTeam: true,
  },
  {
    id: 'interview-prep',
    title: 'Interview Prep',
    tagline: 'Ace interviews for internships, jobs, and brand partnerships.',
    description:
      'Structured interview coaching to help you land the career opportunities you deserve. Here is exactly what you get: Two 6…',
    icon: '🎙️',
    category: 'career-readiness',
    audience: ['talent'],
    price: '$149',
    expertTeam: true,
  },
  {
    id: 'business-formation',
    title: 'Business Formation',
    tagline: 'LLC, S-Corp, or sole prop — we set up your business right.',
    description:
      'Complete business entity setup handled by professionals who understand the NIL landscape. Here is exactly what you get: …',
    icon: '🏗️',
    category: 'career-readiness',
    audience: ['talent'],
    price: '$249',
    expertTeam: true,
  },
  {
    id: 'admissions-success',
    title: 'Admissions & Academic Success',
    tagline: 'Navigate admissions, transfers, and academic planning.',
    description:
      'College admissions and academic planning services designed for student talent. Here is exactly what you get: A dedicated…',
    icon: '🎓',
    category: 'career-readiness',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'job-search',
    title: 'Intelligent Job Search',
    tagline: 'Intelligent job matching for talent entering the workforce.',
    description:
      'A comprehensive career services platform for talent transitioning to the professional workforce. Here is exactly what yo…',
    icon: '🔍',
    category: 'career-readiness',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'internships',
    title: 'Internships & Mentorships',
    tagline: 'Connect with opportunities and mentors in your field.',
    description:
      'Structured internship placements and mentorship connections for current and former talent. Here is exactly what you get:…',
    icon: '🤝',
    category: 'career-readiness',
    audience: ['talent'],
    price: 'Free / Custom',
  },
]

export const SERVICES_STATS = [
  { value: SERVICES.length.toString(), label: 'Services' },
  { value: '15', label: 'Satellites' },
  { value: '2,500', label: 'Users Served' },
  { value: '96%', label: '% Satisfaction' },
]
