/**
 * Static services catalog. Mirrors the legacy theedgezone.com catalog as
 * captured in CAPTURES.md (admin → Pages + admin → Pricing).
 *
 * Will be replaced by Postgres `products` / `product_variants` queries in
 * the Marketplace phase, but the slug, category, audience, and pricing
 * shape stays the same.
 */

export type Audience = 'talent' | 'brand'

/** Target subgroup for brand-audience services. */
export type BrandSubgroup = 'general' | 'employees'

export type Status = 'popular' | 'new' | null

export interface Service {
  /** Stable URL slug — must match the legacy theedgezone.com slug. */
  id: string
  title: string
  tagline: string
  description: string
  icon: string
  category: CategoryKey
  audience: Audience[]
  /** For audience=brand entries, marks the "(Employees)" subset. */
  brandSubgroup?: BrandSubgroup
  /** Display price (e.g. "$29/mo", "$199", "Free / Custom"). */
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
  | 'employee-benefits'

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
  { key: 'employee-benefits', label: 'Employee Benefits', icon: '🧑‍💼' },
]

export const GUIDED_PATHS = [
  { name: 'Get Your First Brand Deal', icon: '🤝', services: 4, color: 'hsl(44 53% 55%)' },
  { name: 'Build Your Brand Empire', icon: '👑', services: 5, color: 'hsl(43 80% 60%)' },
  { name: 'Make Money While You Sleep', icon: '💤', services: 4, color: 'hsl(210 70% 55%)' },
  { name: 'Protect Your Future', icon: '🛡️', services: 5, color: 'hsl(210 50% 45%)' },
  { name: 'Level Up Your Game', icon: '⚡', services: 4, color: 'hsl(35 90% 55%)' },
  { name: 'Go Digital', icon: '💻', services: 4, color: 'hsl(190 70% 50%)' },
  { name: 'Create Content Like a Pro', icon: '🎬', services: 4, color: 'hsl(280 60% 60%)' },
  { name: 'Life After Sports', icon: '🌅', services: 5, color: 'hsl(15 75% 55%)' },
  { name: 'Get Financially Smart', icon: '💵', services: 5, color: 'hsl(140 55% 50%)' },
  { name: 'Legal Protection 101', icon: '⚖️', services: 4, color: 'hsl(0 60% 55%)' },
]

export const SERVICES: Service[] = [
  // ── Digital Presence (talent) ────────────────────────────────────────────
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
    id: 'electronic-press-kit',
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
    id: 'create-a-mobile-app',
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
    id: 'start-a-podcast',
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
    price: '$150',
    status: 'popular',
    autoCreated: true,
  },
  {
    id: 'brand-lite',
    title: 'Brand Lite',
    tagline: 'Upload your logo. Get the full brand kit instantly.',
    description:
      'Already have a logo? Brand Lite takes your existing logo and builds a complete professional brand package around it in m…',
    icon: '🎨',
    category: 'brand-design',
    audience: ['talent', 'brand'],
    price: '$49',
    status: 'new',
    autoCreated: true,
  },
  {
    id: 'graphic-design',
    title: 'Graphic Design Services',
    tagline: 'Pro graphics for campaigns, social, and brand collateral.',
    description:
      'Custom graphic design for ad creatives, social posts, brand collateral, and event materials — delivered by our in-house …',
    icon: '🖌️',
    category: 'brand-design',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'custom-design-packs',
    title: 'Digital Design Packs',
    tagline: 'Pre-built design libraries for repeating brand needs.',
    description:
      'Pre-built libraries of templates and brand assets for social, ads, and campaigns. Plug-and-play for your team.',
    icon: '📦',
    category: 'brand-design',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Marketing & Growth ───────────────────────────────────────────────────
  {
    id: 'social-media-growth',
    title: 'Social Media Growth',
    tagline: 'Data-driven strategies to boost engagement and followers.',
    description:
      'Systematic, data-driven social media growth strategies designed for talent and brands in the NIL space.',
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
      'Full-service social media management where our team handles everything — content creation, posting, engagement, and stra…',
    icon: '📱',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$499/mo',
    expertTeam: true,
  },
  {
    id: 'ppc-seo-marketing',
    title: 'PPC & SEO Marketing',
    tagline: 'Drive targeted traffic. Dominate search. Maximize ROI.',
    description:
      'Drive targeted traffic and qualified leads through expertly managed paid advertising and search engine optimization.',
    icon: '🎯',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$399/mo',
    expertTeam: true,
  },
  {
    id: 'press-media',
    title: 'Press & Media Services',
    tagline: 'Get featured. Get noticed. Get the coverage you deserve.',
    description:
      'Professional public relations and media services to get your story covered by the right outlets.',
    icon: '📰',
    category: 'marketing-growth',
    audience: ['talent', 'brand'],
    price: '$199',
    expertTeam: true,
  },
  {
    id: 'reputation-review',
    title: 'Reputation & Reviews',
    tagline: 'Own your online reputation. Multiply 5-star reviews.',
    description:
      'Active reputation management across every review platform — generate, respond, and protect your brand image.',
    icon: '⭐',
    category: 'marketing-growth',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'listings-management',
    title: 'Listings Management',
    tagline: 'Be found everywhere. One source of truth across 100+ directories.',
    description:
      'Keep your business listings synchronized and accurate across Google, Yelp, Apple Maps, and 100+ directories.',
    icon: '🗂️',
    category: 'marketing-growth',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'market-research',
    title: 'Market Research',
    tagline: 'Know your audience. Validate your bets.',
    description:
      'Custom market research and audience insights from analysts who understand the NIL and sports landscape.',
    icon: '🔬',
    category: 'marketing-growth',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'philanthropic-support',
    title: 'Philanthropic Support',
    tagline: 'CSR campaigns that move the needle for talent and community.',
    description:
      'Design and execute philanthropic campaigns alongside athletes that amplify your brand purpose.',
    icon: '❤️',
    category: 'marketing-growth',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Revenue & Monetization ───────────────────────────────────────────────
  {
    id: 'create-an-online-store',
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
      'Earn passive income by promoting brands you genuinely use and believe in.',
    icon: '💸',
    category: 'revenue-monetization',
    audience: ['talent'],
    price: 'Free / Custom',
    status: 'new',
    autoCreated: true,
  },
  {
    id: 'affiliate-marketing',
    title: 'Affiliate Marketing',
    tagline: 'Tap influencer networks to scale brand awareness on commission.',
    description:
      'Build an affiliate program with talent and creators driving qualified, performance-based traffic to your brand.',
    icon: '🔗',
    category: 'revenue-monetization',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
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
    id: 'investor-assistance',
    title: 'Investor Assistance',
    tagline: 'Connect with capital. Get acquisition-ready.',
    description:
      'Get matched with the right investors and prepare your business for funding rounds, partnerships, or acquisition.',
    icon: '🏦',
    category: 'professional-services',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'financial-advisory',
    title: 'Financial Advisory',
    tagline: 'Expert financial guidance for talent and businesses.',
    description:
      'Personalized financial guidance from certified advisors who specialize in talent and sports businesses.',
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
      'Professional legal services from attorneys experienced in sports law and NIL compliance.',
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
      'Professional legal document drafting and e-signature services.',
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
      'Comprehensive insurance coverage guidance from independent advisors who shop multiple carriers.',
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
      'Year-round tax planning and annual return preparation from tax professionals who understand NIL income.',
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
      'Accurate, organized bookkeeping that gives you a clear picture of your finances every month.',
    icon: '📔',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$149/mo',
    expertTeam: true,
  },
  {
    id: 'trademark-registration',
    title: 'Trademark Registration',
    tagline: 'Protect your name, brand, and IP with federal trademark.',
    description:
      'Federal trademark registration to legally protect your name, logo, brand identity, and catchphrases.',
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
      'Systematic removal of your personal information from data broker websites and people-search engines.',
    icon: '🔒',
    category: 'professional-services',
    audience: ['talent', 'brand'],
    price: '$99/mo',
    expertTeam: true,
  },
  {
    id: 'identity-theft-protection',
    title: 'Identity Theft Protection',
    tagline: '24/7 identity monitoring and recovery support.',
    description:
      'Comprehensive identity monitoring and recovery services to protect your personal and financial information.',
    icon: '🔑',
    category: 'professional-services',
    audience: ['talent'],
    price: '$149/mo',
    expertTeam: true,
  },
  {
    id: 'student-loan-refinance',
    title: 'Student Loan Refinance',
    tagline: 'Lower your rate. Reduce your payments. Take control.',
    description:
      'Expert guidance on student loan refinancing options and repayment strategies.',
    icon: '🎓',
    category: 'professional-services',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Education & Development ──────────────────────────────────────────────
  {
    id: 'prep-for-nil-academy',
    title: 'Prep For NIL Academy',
    tagline: 'Structured NIL education. Courses, eBooks, and guides.',
    description:
      'Comprehensive education program that prepares you to navigate the NIL landscape with confidence and maximize your opport…',
    icon: '📚',
    category: 'education-development',
    audience: ['talent'],
    price: '$9/mo',
  },
  {
    id: 'financial-wellness',
    title: 'Financial Wellness',
    tagline: 'Financial literacy education for talent.',
    description:
      'Financial literacy education built specifically for student talent navigating NIL income for the first time.',
    icon: '💵',
    category: 'education-development',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'nil-conferences',
    title: 'NIL Conferences',
    tagline: 'Live education, networking, and strategic workshops.',
    description:
      'Live education, strategic networking, and hands-on workshops for everyone in the NIL ecosystem.',
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
      'Professional print products produced on premium materials with expert finishing.',
    icon: '🖨️',
    category: 'events-physical',
    audience: ['talent', 'brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: '3d-replica-events',
    title: '3D Replica Event Truck',
    tagline: 'A custom-wrapped event truck with 3D replicas of your athletes.',
    description:
      'Bring brand activations on the road with a custom-wrapped truck featuring 3D-printed replicas of your sponsored talent.',
    icon: '🚚',
    category: 'events-physical',
    audience: ['brand'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Career Readiness ─────────────────────────────────────────────────────
  {
    id: 'resume-building',
    title: 'Resume Building',
    tagline: 'Professional resumes that open doors beyond athletics.',
    description:
      'Professional resume and career document services designed specifically for student talent entering the workforce.',
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
      'Structured interview coaching to help you land the career opportunities you deserve.',
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
      'Complete business entity setup handled by professionals who understand the NIL landscape.',
    icon: '🏗️',
    category: 'career-readiness',
    audience: ['talent'],
    price: '$249',
    expertTeam: true,
  },
  {
    id: 'admissions-academic',
    title: 'Admissions & Academic Success',
    tagline: 'Navigate admissions, transfers, and academic planning.',
    description:
      'College admissions and academic planning services designed for student talent.',
    icon: '🎓',
    category: 'career-readiness',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'job-search-suite',
    title: 'Intelligent Job Search',
    tagline: 'Intelligent job matching for talent entering the workforce.',
    description:
      'A comprehensive career services platform for talent transitioning to the professional workforce.',
    icon: '🔍',
    category: 'career-readiness',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'internship-mentorship',
    title: 'Internships & Mentorships',
    tagline: 'Connect with opportunities and mentors in your field.',
    description:
      'Structured internship placements and mentorship connections for current and former talent.',
    icon: '🤝',
    category: 'career-readiness',
    audience: ['talent'],
    price: 'Free / Custom',
  },

  // ── Health & Wellness ────────────────────────────────────────────────────
  {
    id: 'performance-nutrition',
    title: 'Performance Nutrition',
    tagline: 'Fuel your performance. Personalized nutrition plans.',
    description:
      'Personalized sports nutrition plans designed for your specific sport, position, training schedule, and body composition goals.',
    icon: '🥗',
    category: 'health-wellness',
    audience: ['talent'],
    price: '$199',
    expertTeam: true,
  },
  {
    id: 'healthcare-wellness',
    title: 'Healthcare & Wellness',
    tagline: 'Comprehensive health resources and wellness support.',
    description:
      'Comprehensive health and wellness resources connecting you with providers who understand talent.',
    icon: '🩺',
    category: 'health-wellness',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'performance-improvement',
    title: 'Performance Improvement',
    tagline: 'Science-backed training and performance optimization.',
    description:
      'Science-backed athletic performance training and optimization from certified specialists.',
    icon: '💪',
    category: 'health-wellness',
    audience: ['talent'],
    price: 'Free / Custom',
    expertTeam: true,
  },

  // ── Employee Benefits (brand → employees) ────────────────────────────────
  {
    id: 'financial-wellness-employees',
    title: 'Financial Wellness (Employees)',
    tagline: 'Financial literacy benefits package for your workforce.',
    description:
      'Group financial-wellness benefits delivered to your employees — workshops, coaching, and tools.',
    icon: '💵',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'legal-support-employees',
    title: 'Legal Support (Employees)',
    tagline: 'Pre-paid legal services as an employee benefit.',
    description:
      'Group legal-support coverage for your employees — consultations, document review, and standard filings.',
    icon: '⚖️',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'identity-theft-employees',
    title: 'Identity Theft Protection (Employees)',
    tagline: 'Group identity monitoring and recovery support.',
    description:
      'Identity theft protection bundled as an employee benefit — monitoring, alerts, and recovery support.',
    icon: '🔑',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'data-removal-employees',
    title: 'Data Removal (Employees)',
    tagline: 'Group personal-data removal benefit.',
    description:
      'Systematic removal of employee personal information from data broker websites and people-search engines.',
    icon: '🔒',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'tax-services-employees',
    title: 'Tax Services (Employees)',
    tagline: 'Group tax preparation as an employee benefit.',
    description:
      'Year-round tax planning and annual return preparation delivered as a group benefit to your employees.',
    icon: '🧾',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'insurance-employees',
    title: 'Insurance Services (Employees)',
    tagline: 'Group insurance coverage benefits.',
    description:
      'Comprehensive group insurance coverage for your workforce.',
    icon: '🛡️',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
  {
    id: 'legal-docs-employees',
    title: 'Legal Document Creation (Employees)',
    tagline: 'Document creation services as an employee benefit.',
    description:
      'Custom legal document drafting and e-signature delivered as a group benefit to your workforce.',
    icon: '📄',
    category: 'employee-benefits',
    audience: ['brand'],
    brandSubgroup: 'employees',
    price: 'Free / Custom',
    expertTeam: true,
  },
]

export const SERVICES_STATS = [
  { value: SERVICES.length.toString(), label: 'Services' },
  { value: '15', label: 'Satellites' },
  { value: '2,500', label: 'Users Served' },
  { value: '96%', label: '% Satisfaction' },
]
