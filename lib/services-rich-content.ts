/**
 * Per-service rich content. Optional — services without an entry fall back
 * to a generic template that uses just lib/services-data.ts.
 *
 * Content captured from the legacy theedgezone.com/?ez_view=service&slug=X
 * pages where possible. Fill these in as we walk each service's legacy page.
 */

export interface ServiceStat {
  /** Single-line value e.g. "150+", "98%", "Instant". */
  value: string
  label: string
}

export interface FeatureCard {
  title: string
  body: string
}

export interface IncludesSection {
  title: string
  items: string[]
}

export interface ProcessStep {
  n: number
  title: string
  body: string
}

export interface ServiceFaqItem {
  q: string
  a: string
}

export interface PricingTier {
  /** Display label (e.g. "Monthly", "Annual"). */
  label: string
  amount: string
  period: string
  savings?: string
}

export interface ServiceRichContent {
  /** Long-form description that follows "What's Included". */
  intro?: string
  /** Big-text section title under the pricing card. */
  punchTitle?: string
  /** Sub-tagline under the punch title. */
  punchSub?: string
  /** 3 feature cards (Launch Instantly / Fully Customizable / etc.) */
  featureCards?: FeatureCard[]
  /** 4 stat tiles near the hero. */
  stats?: ServiceStat[]
  /** "Everything That Comes With" sections — each a heading + bullet list. */
  includes?: IncludesSection[]
  /** 4-step process. */
  steps?: ProcessStep[]
  /** Per-service FAQ. */
  faq?: ServiceFaqItem[]
  /** Pricing tiers shown in the pricing card. */
  pricing?: PricingTier[]
  /** Final CTA label override. */
  ctaLabel?: string
}

export const RICH_CONTENT: Record<string, ServiceRichContent> = {
  // ── Personal Website (fully captured from legacy detail page) ───────────
  'personal-website': {
    intro:
      'Our engine analyzes your Edge Zone profile and instantly generates a fully designed website that looks great on any device — with your bio, highlights, stats, social feeds, media gallery, sponsor showcase, and contact form. You get a full visual editor to customize every element — colors, fonts, layout, images, and content blocks. Your site launches at yourname.MyTalentSite.com with the option to connect your own custom domain (e.g., www.yourname.com) on any plan. Every site is built to show up in Google searches, includes secure hosting, embedded social media feeds, an analytics dashboard showing visitor counts and traffic sources, and automatic mobile optimization. You can add unlimited pages, embed video highlights, display your Electronic Press Kit, showcase brand partnerships, and update everything anytime through your dashboard. This is not a template — it is a smart-designed site built around your specific sport, achievements, and brand identity.',
    punchTitle: 'Your Brand. Your Site. Your Rules.',
    punchSub:
      'Everything you need to own your online presence — fan support, merch, memberships, rewards, and more. No code. No designers. Launch in minutes.',
    stats: [
      { value: '150+', label: 'Talent Live' },
      { value: '60s', label: 'Launch Time' },
      { value: '40+', label: 'Content Blocks' },
      { value: '$0', label: 'Setup Cost' },
    ],
    featureCards: [
      {
        title: 'Launch Instantly',
        body:
          'Your site is generated from your profile in seconds. Multi-page, looks great on every device, and built to show up in search results. Connect your own custom domain on any plan.',
      },
      {
        title: 'Fully Customizable',
        body:
          '40+ content blocks. Drag-and-drop editor. Choose colors, fonts, layouts, images. Add unlimited pages. Update everything from your dashboard.',
      },
      {
        title: 'Built-In Revenue',
        body:
          'Sell merch, accept tips, offer memberships, personalized shoutouts. Secure payment processing built right in. Your money, your way.',
      },
    ],
    includes: [
      {
        title: 'Site Builder',
        items: [
          'Multi-page website with visual editor',
          '10+ page layouts to choose from',
          '40+ content blocks (hero, gallery, stats, and more)',
          'Custom colors, fonts, and images',
          'Looks great on phones, tablets, and desktops',
          'Navigation with dropdown submenus',
        ],
      },
      {
        title: 'Merch Store',
        items: [
          'Unlimited products with images and descriptions',
          'Size, color, and style options with price adjustments',
          'Secure checkout with order tracking',
          'Supporters see purchases in their portal',
        ],
      },
      {
        title: 'Fan Engagement',
        items: [
          'Guestbook for fan messages',
          'Polls and leaderboards',
          'Referral program',
          'Email signup with built-in spam protection',
          'Blog with rich content support',
        ],
      },
      {
        title: 'Fan Support System',
        items: [
          'Tip jar with custom tiers',
          'Membership plans with recurring billing',
          'Personalized shoutout requests',
          'Collectible supporter cards with unique serial numbers',
          'Supporter streak tracking',
        ],
      },
      {
        title: 'Reward System',
        items: [
          '16 branded reward templates (certificates, trading cards, etc.)',
          'Monthly reward calendar for subscribers',
          'Voice memos, exclusive photos, digital autograph',
          'Choose what each tier unlocks (community, video, photos)',
          'Upload downloadable rewards (documents, audio, video)',
        ],
      },
      {
        title: 'Platform Features',
        items: [
          'Custom domain support (e.g., www.yourname.com)',
          'Built to show up in Google search results',
          'Fan portal with order history, rewards, and activity',
          'Lock pages so only supporters can see them',
          'Contact form with built-in spam protection',
          'Secure, fast, and always online',
        ],
      },
    ],
    steps: [
      {
        n: 1,
        title: 'Purchase Your Plan',
        body:
          'Pick monthly or annual. Custom domain support included on every plan. Cancel anytime.',
      },
      {
        n: 2,
        title: 'Site Generated',
        body:
          'Your multi-page website is built from your profile in under 60 seconds. Pages, content, and layout — ready to go.',
      },
      {
        n: 3,
        title: 'Customize Everything',
        body:
          'Use the visual editor to tweak colors, fonts, images, blocks, and pages. Add your merch, set up fan support, and configure rewards.',
      },
      {
        n: 4,
        title: 'Go Live',
        body:
          'Your site launches at yourname.MyTalentSite.com. Connect your own custom domain (like www.yourname.com) anytime.',
      },
    ],
    faq: [
      {
        q: 'What makes this different from Wix or Squarespace?',
        a: 'Your site is smart-designed for talent — built from your athletic profile with sport-specific blocks, fan support, merch, and rewards out of the box. No generic templates.',
      },
      {
        q: 'Can I sell merch on my site?',
        a: 'Yes. The built-in merch store supports unlimited products, variants, secure checkout, and order tracking — no third-party integration needed.',
      },
      {
        q: 'How do fan memberships work?',
        a: 'Create tiered membership plans with recurring billing. Each tier unlocks gated content, perks, and rewards you configure.',
      },
      {
        q: 'What are collectible supporter cards?',
        a: 'Digital collectible cards with unique serial numbers that your fans earn as supporters. Acts like a fan-loyalty NFT without the crypto overhead.',
      },
      {
        q: 'Can I gate content for supporters only?',
        a: 'Yes. Any page or block can be locked to a supporter tier — only paying members see it.',
      },
      {
        q: 'Do I need any technical skills?',
        a: 'No. Everything works through a visual editor. Your site is generated and ready out of the box.',
      },
      {
        q: 'Can I use my own domain?',
        a: 'Yes, on every plan. Connect a custom domain like www.yourname.com or buy one directly through our Namecheap integration.',
      },
    ],
    pricing: [
      { label: 'Monthly', amount: '$29', period: 'per month' },
      { label: 'Annual', amount: '$23.25', period: 'per month, billed annually', savings: 'Save 20%' },
    ],
  },
}

export function getServiceContent(slug: string): ServiceRichContent | null {
  return RICH_CONTENT[slug] ?? null
}
