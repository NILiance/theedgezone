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

// ── Electronic Press Kit ──────────────────────────────────────────────────
RICH_CONTENT['electronic-press-kit'] = {
  intro:
    'A fully branded EPK auto-generated from your Edge Zone profile and built on a drag-and-drop block system with 15 section types — Hero, Bio, Stats & Awards, Gallery, Video, Social Links, Sponsors, Testimonials, Schedule, Audio (highlight reels, interviews, podcasts), Press & Media (articles and mentions), Contact, Custom Text, Dividers, and multi-column layouts. Start with one of four professionally designed templates — Classic Press Kit (the standard layout agents and brands expect), Media Focused (leads with video), Stats Forward (big counters front and center for impact), or Agent Ready (formal layout with testimonials and representation card). Every block is individually reorderable and customizable — change layouts, toggle headshots, swap column counts, set CTA text, enable follower counts on social icons, and switch between card, table, or counter presentations for stats. Full theme control — primary and accent colors, 10 heading fonts (Playfair, Bebas Neue, Oswald, Archivo Black, and more), 10 body fonts, custom background styles, border radius. SEO built in — editable meta title, meta description, OG image, keywords, and noindex toggle. Your EPK publishes at yourname.TalentEPK.com, includes a printable QR code, and supports a downloadable press-kit PDF link.',
  stats: [
    { value: '200+', label: 'Talent Live' },
    { value: '97%', label: 'Satisfaction' },
    { value: '15', label: 'Block Types' },
    { value: '4', label: 'Templates' },
  ],
  includes: [
    {
      title: 'Block System',
      items: [
        '15 block types — Hero, Bio, Stats, Gallery, Video, Audio, Social, Sponsors, Testimonials, Schedule, Press & Media, Contact, Custom Text, Dividers, Columns',
        'Drag-and-drop block editor — reorder, customize layout per block',
        'Switch stats between card, table, or counter presentations',
        'Toggle headshots, swap column counts, set CTA text per block',
      ],
    },
    {
      title: 'Templates & Theme',
      items: [
        '4 professionally designed templates (Classic, Media Focused, Stats Forward, Agent Ready)',
        'Custom color & font controls (10 heading fonts, 10 body fonts)',
        'Background styles, border radius, theme presets',
        'Auto-populated from your Edge Zone profile',
      ],
    },
    {
      title: 'Media & Social',
      items: [
        'Sponsor / partner logo grid',
        'Testimonials from coaches & partners',
        'Upcoming schedule section',
        'Social reach with follower counts',
        'Highlight reels and audio playback',
        'Press & media mentions',
      ],
    },
    {
      title: 'SEO & Sharing',
      items: [
        'Built-in SEO (title, description, OG image, keywords)',
        'noindex toggle for private EPKs',
        'Published at yourname.TalentEPK.com',
        'QR code for in-person networking',
        'Downloadable press-kit PDF link',
        'Generate button for bio & copy assistance',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Purchase your plan', body: 'Pick monthly or annual. Cancel anytime.' },
    {
      n: 2,
      title: 'EPK auto-generated',
      body: 'Smart template picks the best layout based on your profile data.',
    },
    {
      n: 3,
      title: 'Drag-and-drop to fine-tune',
      body: 'Reorder, customize, swap templates, change theme — all live.',
    },
    {
      n: 4,
      title: 'Publish & share',
      body: 'Share your TalentEPK.com link with brands, agents, and media.',
    },
  ],
  faq: [
    {
      q: 'What is an EPK?',
      a: 'An Electronic Press Kit is your professional media package — think of it as a resume designed specifically for landing brand partnerships and media coverage.',
    },
    {
      q: 'Can I rearrange sections?',
      a: 'Yes — every block is drag-and-drop reorderable and individually customizable with its own layout options.',
    },
    {
      q: 'Can I use my own fonts and colors?',
      a: 'Yes. Pick from 10 heading and 10 body fonts, set full theme colors, adjust border radius, and control block-level styling.',
    },
    {
      q: 'Does it help with SEO?',
      a: 'Yes. Every EPK has editable meta title, meta description, Open Graph image, keywords, and a noindex toggle for privacy.',
    },
  ],
  pricing: [
    { label: 'Monthly', amount: '$9.99', period: 'per month' },
    { label: 'Annual', amount: '$8.33', period: 'per month, billed annually', savings: 'Save 17%' },
  ],
}

// ── Custom Mobile App ─────────────────────────────────────────────────────
RICH_CONTENT['create-a-mobile-app'] = {
  intro:
    'A complete drag-and-drop app builder with 24+ screen types you can mix and match — Home/Splash, Profile, About, Events, Contact, Gallery, Blog, Videos, Audio, Shop, Subscriptions, Fan Wall, Links, FAQ, Polls, Schedule, Podcast, Media Hub, Live (embed YouTube Live or Twitch with a LIVE badge), Shoutouts (paid video requests), Exclusive (subscription-gated content), Leaderboard (fan points ranking), Merch (print-on-demand grid), and Notification Settings. A full splash-screen designer with image upload, background effects (blur, color overlay, vignette, gradients), multiple name styles and sizes, overlay opacity control, and a toggleable navigation grid. An onboarding wizard walks you through setup in 9 steps and pre-fills every field from your Edge Zone profile. Complete theme control — primary/accent/background/card/text/heading/nav colors, 10+ font families, heading and body weights, border radius, icon-only/label-only/both nav styles, light/dark status bar. Built-in monetization — tiered subscriptions with Stripe Elements checkout, one-time product sales, paid shoutout requests, and a Merch screen that auto-pulls from your NIL Store. Publishing pipeline — live preview URL, PWA manifest, App Store metadata form, asset upload, Expo config generator for native shell wrapping, and a build-zip download ready for TestFlight/Play Console upload. You own your app, your fans, your data.',
  stats: [
    { value: '25+', label: 'Talent Apps' },
    { value: '96%', label: 'Satisfaction' },
    { value: '24+', label: 'Screen Types' },
    { value: 'PWA', label: 'Instant Launch' },
  ],
  includes: [
    {
      title: 'Visual App Builder',
      items: [
        'Drag-and-drop screen editor with live phone-frame preview',
        '24+ screen types (Home, Profile, Events, Shop, Subscriptions, Fan Wall, Blog, Podcast, Media Hub, Live, Shoutouts, Exclusive, Leaderboard, Merch, FAQ, Polls, Schedule, Links, Notifications, and more)',
        'Splash-screen designer with image upload, background effects (blur, overlay, vignette, gradients), name styles & sizes',
        '9-step onboarding wizard, pre-filled from your profile, skippable',
      ],
    },
    {
      title: 'Theme & Customization',
      items: [
        'Full theme control (colors, 10+ fonts, border radius, nav style, status bar)',
        'Icon-only / label-only / both nav styles',
        'Light or dark status bar per app',
        'Custom branding everywhere',
      ],
    },
    {
      title: 'Monetization',
      items: [
        'Tiered Stripe subscriptions with gated content',
        'One-time product sales & paid shoutout requests',
        'Built-in Merch screen — auto-publishes from your NIL Store & Edge Zone Print Shop',
        'Admin-configured ad system with CPM/CPC revenue share paid to talent',
        'Unified Payouts combining app, website, and store earnings',
      ],
    },
    {
      title: 'Engagement & Content',
      items: [
        'Blog, fan wall, polls, events calendar',
        'Push notification preferences',
        'Secure fan auth & token-based login',
        'Generate button for content assistance (bios, copy, posts)',
      ],
    },
    {
      title: 'Publishing Pipeline',
      items: [
        'PWA with manifest, service worker, offline support',
        'Privacy policy hosted automatically',
        'App Store & Google Play submission pipeline — metadata form, asset upload',
        'Expo config generator + build-zip download',
        'You own the app, the data, and the fan relationship',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Purchase', body: 'Your app is provisioned instantly with your branding.' },
    {
      n: 2,
      title: 'Onboarding',
      body: 'Walk through the 9-step setup (or skip it). We pre-fill from your profile.',
    },
    {
      n: 3,
      title: 'Design',
      body: 'Build screens, splash, and theme in the visual editor with live preview.',
    },
    { n: 4, title: 'Publish', body: 'Live PWA link for testing, build zip for App Store / Play.' },
  ],
  faq: [
    {
      q: 'How fast can I launch?',
      a: 'Your PWA goes live instantly. App Store and Play Store submissions are typically reviewed by Apple/Google within 1-3 days once you upload the build zip.',
    },
    {
      q: 'Do I need any coding skills?',
      a: 'None. The builder is fully visual with drag-and-drop screens, live preview, and guided content generation.',
    },
    {
      q: 'Can I sell subscriptions and merch?',
      a: 'Yes. Tiered subscriptions with gated content, one-time products, paid shoutouts, and an auto-populated merch grid are all built in, with Stripe Elements checkout.',
    },
    {
      q: 'How do I earn ad revenue?',
      a: 'Our ad system pays you a configured CPM/CPC share on impressions and clicks automatically — earnings appear in your unified Payouts balance. Opt out per placement if you prefer.',
    },
    {
      q: 'Who owns the app?',
      a: 'You do. You own the app, the user data, and the fan relationship — no middleman social algorithm.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$499', period: 'one-time payment' }],
}

// ── Personal Brand Design ─────────────────────────────────────────────────
RICH_CONTENT['personal-brand-design'] = {
  intro:
    'Every NIL deal, every sponsorship pitch, every social media post — it all starts with your brand. Without a professional identity, you are invisible to the brands writing checks. The Edge Zone Personal Brand Design gives you 20 logo concepts to explore, a built-in Text and Color Editor for pixel-perfect customization, and a complete brand package with every file format, brand guide, and tool you need — delivered in minutes, not months.',
  punchTitle: 'Your Complete Brand Identity — In 4 Steps',
  punchSub:
    'No design experience needed. No back-and-forth emails. No waiting weeks. Just you, your vision, and our design engine.',
  stats: [
    { value: '175+', label: 'Talent Branded' },
    { value: '94%', label: 'Satisfaction' },
    { value: '20', label: 'Concepts Included' },
    { value: 'Forever', label: 'Full Rights' },
  ],
  featureCards: [
    {
      title: 'Step 1 — Explore',
      body:
        'Our engine generates 20 unique logo concepts based on your sport, colors, style, and personality. Need more? Add batches of 10 for $5 each.',
    },
    {
      title: 'Step 2 — Shortlist & Refine',
      body:
        'Heart your top 1–5 concepts, then hit Refine. We generate focused variations of each favorite so you can compare and find the perfect direction.',
    },
    {
      title: 'Step 3 — Polish',
      body:
        'Fine-tune your chosen logo with the built-in editor. Change text, swap colors with Paint Bucket and Global Color Swap, match colors with the Eyedropper.',
    },
    {
      title: 'Step 4 — Delivered',
      body:
        'Your final logo in every format. Plus your complete Brand Guide, Typography, and instant access to the Brand Arsenal.',
    },
  ],
  includes: [
    {
      title: 'Logo Concepts & Generation',
      items: [
        '20 unique logo concepts included',
        'Shortlist favorites for focused refinement',
        'Add more concepts: $5 per 10 (up to 100)',
        'Side-by-side comparison tool',
      ],
    },
    {
      title: 'Text & Color Editor',
      items: [
        '50+ fonts — bold, athletic, modern, display, serif, condensed',
        'Adjustable text size, position, letter spacing, outline',
        'Paint Bucket — click to recolor any area',
        'Global Color Swap — replace a color everywhere at once',
        'Eyedropper — match any color from the logo',
        'Eraser — remove existing text or elements',
      ],
    },
    {
      title: 'Logo Files',
      items: [
        'PNG — Full size, 1024px, 512px, 256px, 128px icon',
        'Transparent PNG — no background',
        'JPG — white and black backgrounds',
        'SVG — true scalable vector format',
      ],
    },
    {
      title: 'Brand Guide',
      items: [
        'Color palette with hex codes',
        'Typography system — heading + body fonts',
        'Google Fonts links + CSS snippets',
        "Logo usage guidelines + do's and don'ts",
        'Downloadable 8-page PDF brand guide',
      ],
    },
    {
      title: 'Brand Arsenal (Included Free)',
      items: [
        'Logo Animation — 14 styles (neon, glitch, 3D flip, dissolve…)',
        'Autograph Trading Cards — preview + order printed cards',
        'Brand Voice — captions, bios, taglines, thank you messages',
        'Branded QR Code — with your logo centered',
        'Email Signature — 4 professional styles',
        'Social Media Avatars — resized for every platform',
      ],
    },
    {
      title: 'Print Shop',
      items: [
        'Order branded merchandise directly',
        'Your logo auto-overlaid on product previews',
        'Quantity pricing with Stripe checkout',
        'Ships directly to your door',
      ],
    },
  ],
  steps: [
    {
      n: 1,
      title: 'Set preferences',
      body: 'Sport, colors, style, personality, and inspiration.',
    },
    {
      n: 2,
      title: 'Explore',
      body: '20 logo concepts generated instantly — shortlist your favorites.',
    },
    {
      n: 3,
      title: 'Refine',
      body: 'See refined variations of each shortlisted concept.',
    },
    {
      n: 4,
      title: 'Polish & receive',
      body: 'Perfect colors, text, details — then download your complete brand identity package.',
    },
  ],
  faq: [
    {
      q: 'How many concepts do I get?',
      a: 'Your first 20 concepts are included with your purchase. Need more? Generate additional batches of 10 for $5 each, up to 100 total. Most talent find their direction within the first 20.',
    },
    {
      q: 'What is the Text & Color Editor?',
      a: 'After choosing your concept, the built-in editor lets you change text size, swap fonts, adjust colors, erase existing text, and even recolor specific elements using Paint Bucket and Global Color Swap tools. No design skills needed.',
    },
    {
      q: 'Can I change colors on specific parts of my logo?',
      a: 'Yes! The Paint Bucket tool lets you click any area to recolor it. The Global Color Swap tool lets you click a color and replace every instance of it across the entire logo.',
    },
    {
      q: 'What file formats do I get?',
      a: 'PNG in multiple sizes (1024px, 512px, 256px, 128px icon), transparent PNG, JPG on white and black backgrounds, and true SVG scalable vector.',
    },
    {
      q: 'What is the Brand Arsenal?',
      a: 'After your brand is complete, you unlock Logo Animation (14 styles including glitch, neon, 3D flip), Autograph Trading Cards (with print ordering), Brand Voice writer, Branded QR Codes, Email Signature generator, and Social Media Avatars.',
    },
    {
      q: 'Do I own the rights?',
      a: '100%. Full commercial rights to everything created. Use your brand anywhere — merch, social media, business cards, sponsorship materials, NIL deals.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$150', period: 'one-time payment' }],
}

// ── Online Store / Merch ──────────────────────────────────────────────────
RICH_CONTENT['create-an-online-store'] = {
  intro:
    'Launch a fully branded online store powered by direct integrations with major apparel and merchandise suppliers — S&S Activewear, SanMar, Alphabroder, Gemline, and more. Two ways to add products: (1) Print-on-Demand — pick a blank from the supplier catalog, drop your logo, and we generate a live mockup; (2) Wholesale resale — pick from pre-decorated inventory and set your own markup. Every order is automatically dispatched to our fulfillment partner, who handles printing, packing, and shipping. You set the prices, you keep the profit margin. Your store comes with a branded storefront at your own subdomain, automatic publishing into your mobile app and website, a real shopping cart with secure Stripe checkout, order tracking, and a unified payouts pipeline.',
  stats: [
    { value: '10+', label: 'Stores Live' },
    { value: '97%', label: 'Satisfaction' },
    { value: '500+', label: 'Supplier SKUs' },
    { value: '0', label: 'Inventory Needed' },
  ],
  includes: [
    {
      title: 'Branded Storefront',
      items: [
        'Branded storefront at your subdomain',
        'Auto-publish to your app & website',
        'Stripe checkout + order tracking',
        'Real shopping cart with cart abandonment recovery',
      ],
    },
    {
      title: 'Supplier Integrations',
      items: [
        'Direct supplier integrations (S&S, SanMar, Alphabroder, Gemline, +more)',
        'Print-on-Demand with live mockups',
        'Wholesale resale with custom markup',
        'No inventory to manage',
      ],
    },
    {
      title: 'Fulfillment & Payouts',
      items: [
        'Hands-off fulfillment (our partner prints, packs, ships)',
        'You set prices and keep the markup',
        'Unified payouts alongside other Edge Zone earnings',
        'Order status auto-synced to customer + dashboard',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Purchase your store', body: 'Storefront provisioned instantly.' },
    {
      n: 2,
      title: 'Browse supplier catalog',
      body: 'Upload your logo or pick pre-decorated inventory.',
    },
    {
      n: 3,
      title: 'Set prices',
      body: 'You control the markup. Cost is deducted from each sale automatically.',
    },
    {
      n: 4,
      title: 'Share & ship',
      body: 'Share your storefront link — orders ship automatically to your customers.',
    },
  ],
  faq: [
    {
      q: 'Do I hold inventory?',
      a: 'No. Every order is fulfilled on-demand by our partner directly to your customer.',
    },
    {
      q: 'Who pays for the apparel?',
      a: 'Cost is deducted from each sale automatically. You keep the markup as profit.',
    },
    {
      q: 'Will it show up in my app?',
      a: 'Yes — products auto-publish to your Apps For Talent merch screen and your website Shop section.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$99', period: 'one-time payment' }],
}

// ── Talent Podcast ────────────────────────────────────────────────────────
RICH_CONTENT['start-a-podcast'] = {
  intro:
    'A complete podcast branding package including professional cover art designed in your brand colors and style, a custom intro and outro audio production with music and voice-over, podcast trailer episode scripting, and show description copywriting. We handle full distribution setup to every major platform — Spotify, Apple Podcasts, Google Podcasts, Amazon Music, iHeart Radio, and more. You receive show notes templates, a guest booking and scheduling system, episode planning tools, recording tips and equipment recommendations for every budget level (you can start with just your phone), editing guidelines, a monetization strategy with sponsorship rate cards, and analytics tracking across all platforms. Whether you want to interview fellow talent, share your personal journey, discuss your sport, or explore topics you are passionate about, we get you from concept to published podcast.',
  stats: [
    { value: '40+', label: 'Shows Live' },
    { value: '95%', label: 'Satisfaction' },
    { value: '1-2 wks', label: 'Setup Time' },
    { value: '6+', label: 'Distribution Platforms' },
  ],
  includes: [
    {
      title: 'Branding & Production',
      items: [
        'Professional cover art designed in your brand colors',
        'Custom intro and outro audio production with music and voice-over',
        'Podcast trailer episode scripting',
        'Show description copywriting',
      ],
    },
    {
      title: 'Distribution',
      items: [
        'Spotify, Apple Podcasts, Google Podcasts',
        'Amazon Music, iHeart Radio',
        'RSS feed at PodcastForTalent.com',
        'Hosted automatically — no separate provider',
      ],
    },
    {
      title: 'Tools & Templates',
      items: [
        'Show notes templates',
        'Guest booking and scheduling system',
        'Episode planning tools',
        'Recording tips & equipment recommendations (phone-friendly)',
        'Editing guidelines',
      ],
    },
    {
      title: 'Growth & Monetization',
      items: [
        'Monetization strategy with sponsorship rate cards',
        'Analytics tracking across all platforms',
        'Content strategy guidance',
        'Audience growth tactics',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Choose your package', body: 'Monthly or annual. Cancel anytime.' },
    {
      n: 2,
      title: 'Branding produced',
      body: 'We design your brand and produce intro/outro audio assets.',
    },
    {
      n: 3,
      title: 'Distribution setup',
      body: 'Spotify, Apple, Google, Amazon, iHeart — handled for you.',
    },
    {
      n: 4,
      title: 'Record & publish',
      body: 'Start recording. We handle the publishing pipeline.',
    },
  ],
  faq: [
    {
      q: 'Do I need equipment?',
      a: 'We provide a recommended gear list for every budget. You can start with just a phone.',
    },
  ],
  pricing: [
    { label: 'Monthly', amount: '$49', period: 'per month' },
    { label: 'Annual', amount: '$33.25', period: 'per month, billed annually', savings: 'Save 32%' },
  ],
}

// ── Digital Business Cards ────────────────────────────────────────────────
RICH_CONTENT['digital-business-cards'] = {
  intro:
    'A professionally designed physical card featuring your custom branding, embedded with an NFC chip and printed QR code. When anyone taps the card against their smartphone (no app required — works on all modern iPhones and Android devices), your full digital profile opens instantly showing your name, title, photo, phone number, email, website link, social media profiles, EPK link, and any custom links you choose. You can update your digital profile anytime without reprinting cards. The card comes with a digital dashboard showing tap analytics — who tapped, when, and where. Cards are printed on premium PVC with a matte or glossy finish in your brand colors. For brands, team management features let you order branded cards for your entire organization with a unified company profile template.',
  stats: [
    { value: '500+', label: 'Users' },
    { value: '99%', label: 'Satisfaction' },
    { value: '5-7d', label: 'Ship Time' },
    { value: 'No App', label: 'Required' },
  ],
  includes: [
    {
      title: 'The Card',
      items: [
        'NFC-enabled chip + printed QR code',
        'Premium PVC, matte or glossy finish',
        'Custom branded design in your colors',
        'Multiple card design options',
        'Works on all modern iPhones and Android devices',
      ],
    },
    {
      title: 'Digital Profile',
      items: [
        'Full digital profile opens on tap (name, photo, contact info)',
        'Social media profiles + EPK link + custom links',
        'Update your profile anytime without reprinting',
        'Hosted at MyLinkedCard.com',
      ],
    },
    {
      title: 'Analytics & Brand Tools',
      items: [
        'Tap analytics dashboard (who, when, where)',
        'Contact sharing built in',
        'Team management for brand orders',
        'Unified company profile template for orgs',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Choose card design', body: 'Pick a layout and your finish.' },
    { n: 2, title: 'Upload branding', body: 'Your colors, logo, and details flow in from your profile.' },
    { n: 3, title: 'Ship in 5-7 days', body: 'Cards arrive premium-printed, ready to use.' },
    { n: 4, title: 'Tap to share', body: 'Tap any phone and your profile opens instantly. No app.' },
  ],
  faq: [
    {
      q: 'How does the NFC work?',
      a: 'Recipients tap your card with their phone — no app needed. Your profile opens instantly.',
    },
    {
      q: 'Can I update my profile after printing?',
      a: 'Yes. The card points to your hosted digital profile — update info anytime without reprinting.',
    },
    {
      q: 'Do I get analytics?',
      a: 'Yes — the dashboard shows every tap including when and where, so you know which networking sessions are working.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$49', period: 'one-time payment' }],
}

// ── Brand Lite ────────────────────────────────────────────────────────────
RICH_CONTENT['brand-lite'] = {
  intro:
    'Already have a logo? Brand Lite takes your existing logo and builds a complete professional brand package around it in minutes. Upload your logo and our engine extracts your brand colors, generates every file format you need (PNG in multiple sizes, transparent PNG, JPG on white and black backgrounds, true SVG vector), creates a professional Brand Guide PDF with your color palette, typography system, and logo usage rules, and unlocks the full Text & Color Editor for further customization. You also get access to the Print Shop for branded merchandise and trading cards. Your original logo is always preserved.',
  stats: [
    { value: 'Instant', label: 'Delivery' },
    { value: '∞', label: 'Commercial Rights' },
    { value: '4', label: 'Logo Formats' },
    { value: 'PNG/SVG', label: 'Upload Accepted' },
  ],
  includes: [
    {
      title: 'Upload & Extract',
      items: [
        'Upload your existing logo in PNG, JPG, or SVG format',
        'Automatic color extraction to build your brand palette',
        'Your original logo is always preserved',
      ],
    },
    {
      title: 'Complete File Package',
      items: [
        'PNG (1024, 512, 256, 128px)',
        'Transparent PNG — no background',
        'JPG — white and black backgrounds',
        'SVG — true scalable vector',
      ],
    },
    {
      title: 'Brand Guide & Editor',
      items: [
        'Brand Guide PDF — color palette with hex codes, typography, usage rules',
        'Full Text & Color Editor — adjust text, swap colors, erase elements, paint bucket, global color swap',
        'Print Shop access — order branded merch, trading cards, and more',
        'Full commercial rights — yours forever',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Purchase', body: 'Access your Brand Lite portal instantly.' },
    { n: 2, title: 'Upload', body: 'PNG, JPG, or SVG accepted.' },
    {
      n: 3,
      title: 'Auto-build',
      body: 'Colors extracted, brand kit assembled in seconds.',
    },
    { n: 4, title: 'Download & use', body: 'Complete brand package, ready to use everywhere.' },
  ],
  faq: [
    {
      q: 'What file formats can I upload?',
      a: 'PNG, JPG, or SVG. For best results, upload a high-resolution PNG or SVG with a transparent background.',
    },
    {
      q: 'What do I get?',
      a: 'Everything a full brand design gets except the concept generation: PNG files in multiple sizes, transparent PNG, JPGs on white/black, SVG vector, Brand Guide PDF, and Print Shop access.',
    },
    {
      q: 'Can I edit my logo after uploading?',
      a: 'Yes — the full Text & Color Editor lets you change text, swap colors, erase elements. Your original is always preserved.',
    },
    {
      q: 'Can I add this to my existing Brand Design?',
      a: 'Absolutely. If you already have a full Brand Design, Brand Lite adds your uploaded logo as an additional switchable logo in your Brand Arsenal.',
    },
    {
      q: 'Do I own the rights?',
      a: 'Yes. Your logo remains yours. All generated brand kit files are yours to use commercially, forever.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$49', period: 'one-time payment' }],
}

// ── Graphic Design Services ───────────────────────────────────────────────
RICH_CONTENT['graphic-design'] = {
  intro:
    'Professional graphic design services for businesses that need custom creative work. Per order: up to 5 custom design pieces created by our professional design team, tailored to your brand guidelines and specific requirements. Design types include social media graphics (posts, stories, covers, ads), marketing collateral (flyers, brochures, rack cards, postcards), event materials (banners, posters, programs, tickets, signage), digital advertisements (display ads, email headers, web banners), presentation decks, infographics, and any other visual content your brand needs. Each order includes unlimited revisions until you are 100% satisfied. You receive final files in every format needed — print-ready high-resolution PDFs, web-optimized PNGs and JPGs, and editable source files (PSD, Adobe Illustrator, or Figma). Rush delivery available for time-sensitive projects with guaranteed 24-hour turnaround.',
  stats: [
    { value: '80+', label: 'Brands Served' },
    { value: '96%', label: 'Satisfaction' },
    { value: '5', label: 'Pieces Per Order' },
    { value: '3-5d', label: 'Turnaround' },
  ],
  includes: [
    {
      title: 'Design Types',
      items: [
        'Social media graphics (posts, stories, covers, ads)',
        'Marketing collateral (flyers, brochures, rack cards, postcards)',
        'Event materials (banners, posters, programs, tickets, signage)',
        'Digital advertisements (display ads, email headers, web banners)',
        'Presentation decks + infographics',
      ],
    },
    {
      title: 'Process',
      items: [
        'Up to 5 design pieces per order',
        'Unlimited revisions until 100% satisfied',
        'Brand-consistent across all pieces (colors, fonts, identity)',
        'Rush delivery available (24-hour guarantee)',
      ],
    },
    {
      title: 'Files Delivered',
      items: [
        'Print-ready high-resolution PDFs',
        'Web-optimized PNGs and JPGs',
        'Editable source files (PSD, Adobe Illustrator, or Figma)',
        'Brand-consistent file naming and organization',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Submit brief', body: 'Tell us what you need and share your brand guidelines.' },
    { n: 2, title: 'Designers create concepts', body: 'Our team produces initial drafts within 3-5 days.' },
    { n: 3, title: 'Review & revise', body: 'Request revisions until every piece is perfect.' },
    { n: 4, title: 'Receive final files', body: 'Print-ready, web-ready, and editable source files.' },
  ],
  faq: [
    {
      q: 'How many designs per order?',
      a: 'Each order includes up to 5 design pieces. Bundles available for larger needs.',
    },
    {
      q: 'Do I get the source files?',
      a: 'Yes — every order includes editable PSD, Adobe Illustrator, or Figma source files so your team can iterate later.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$199', period: 'per order (up to 5 pieces)' }],
}

// ── Social Media Growth ───────────────────────────────────────────────────
RICH_CONTENT['social-media-growth'] = {
  intro:
    'A comprehensive audit of your current social media presence across all platforms (Instagram, TikTok, Twitter/X, YouTube, LinkedIn, Facebook, Snapchat). Based on the audit, our team develops a custom growth strategy for each platform including content theme recommendations specific to your sport and personality, optimal posting schedule based on when your audience is most active, hashtag research with sport-specific and trending tags, engagement optimization tactics, audience targeting strategies, and competitor analysis showing what is working for similar talent in your space. You receive detailed monthly analytics reports covering follower growth rate, engagement rate, reach and impressions, top-performing content, audience demographics, and actionable recommendations for the next month.',
  stats: [
    { value: '130+', label: 'Clients' },
    { value: '92%', label: 'Satisfaction' },
    { value: '7', label: 'Platforms Covered' },
    { value: 'Monthly', label: 'Reports' },
  ],
  includes: [
    {
      title: 'Strategy & Audit',
      items: [
        'Comprehensive audit across IG, TikTok, Twitter/X, YouTube, LinkedIn, Facebook, Snapchat',
        'Platform-specific growth strategies',
        'Content theme recommendations for your sport + personality',
        'Optimal posting schedule based on audience activity',
        'Competitor analysis (what works for similar talent)',
      ],
    },
    {
      title: 'Execution',
      items: [
        'Content calendar with planned posts',
        'Hashtag research (sport-specific + trending)',
        'Engagement optimization tactics',
        'Audience targeting strategies',
        'Trend identification + real-time content opportunities',
      ],
    },
    {
      title: 'Reporting',
      items: [
        'Monthly analytics report',
        'Follower growth rate, engagement rate, reach, impressions',
        'Top-performing content analysis',
        'Audience demographics breakdown',
        'Actionable recommendations for next month',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Audit', body: 'We analyze your current social presence in depth.' },
    { n: 2, title: 'Strategy', body: 'Custom growth strategy tailored to your sport + goals.' },
    { n: 3, title: 'Implementation', body: 'Execute the plan with calendar, hashtags, and tactics.' },
    { n: 4, title: 'Optimize', body: 'Monthly reports + adjustments as algorithms shift.' },
  ],
  faq: [
    {
      q: 'Which platforms do you support?',
      a: 'Instagram, TikTok, Twitter/X, YouTube, LinkedIn, and Facebook.',
    },
    {
      q: 'How does this differ from Social Media Management?',
      a: 'Growth is strategy + reporting — you still post. Management is full-service execution where our team posts on your behalf.',
    },
  ],
  pricing: [{ label: 'Monthly', amount: '$299', period: 'per month' }],
}

// ── Social Media Management ───────────────────────────────────────────────
RICH_CONTENT['social-media-management'] = {
  intro:
    'Full-service social media management where our team handles everything — content creation, posting, engagement, and strategy — so you can focus entirely on your sport and personal life. A dedicated social media manager learns your voice, brand, and goals. They create original content for all your platforms including graphics, captions, hashtags, and stories. You receive a visual content calendar for review and approval before anything is published. Your manager handles community engagement — responding to comments, DMs, and mentions in your voice. Monthly strategy calls to review performance, discuss upcoming events and opportunities, and plan content themes.',
  stats: [
    { value: '95+', label: 'Talent Managed' },
    { value: '94%', label: 'Satisfaction' },
    { value: 'Hands-off', label: 'For You' },
    { value: '1:1', label: 'Dedicated Manager' },
  ],
  includes: [
    {
      title: 'Dedicated Manager',
      items: [
        'Personal social media manager learns your voice + goals',
        'Intelligent content creation across platforms',
        'Graphics, captions, hashtags, stories — all produced for you',
        'Personalized coaching as you grow',
      ],
    },
    {
      title: 'Calendar & Approval',
      items: [
        'Visual content calendar for review',
        'Approval flow before anything is published',
        'Multi-platform scheduling',
        'Trend intelligence for real-time post opportunities',
      ],
    },
    {
      title: 'Engagement + Reporting',
      items: [
        'Community engagement (comments, DMs, mentions) in your voice',
        'Monthly strategy calls to review and plan',
        'Performance monitoring with engagement, follower growth, reach analytics',
        'Crisis monitoring with immediate alerts',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Onboarding', body: 'Brand audit + voice + goal alignment.' },
    { n: 2, title: 'Strategy', body: 'Content strategy + calendar built for review.' },
    { n: 3, title: 'Create + post', body: 'Smart content creation, scheduled, and posted.' },
    { n: 4, title: 'Monitor + optimize', body: 'Engagement + analytics + monthly tuning.' },
  ],
  faq: [
    {
      q: 'Do you post on my behalf?',
      a: 'Yes — that is the whole point. You approve a calendar; we handle creation, scheduling, posting, and engagement.',
    },
    {
      q: 'What if my voice changes?',
      a: 'Monthly strategy calls let us recalibrate. Your manager learns and adapts continuously.',
    },
  ],
  pricing: [{ label: 'Monthly', amount: '$499', period: 'per month' }],
}

// ── Press & Media Services ────────────────────────────────────────────────
RICH_CONTENT['press-media'] = {
  intro:
    'A dedicated PR strategist who crafts your narrative and identifies media opportunities. Services include professional press release writing and distribution to targeted journalist lists, proactive media outreach to sports reporters, business journalists, and industry publications, interview preparation coaching (talking points, message framing, media training), media monitoring tracking every mention of your name across online, print, and broadcast media, crisis communication planning and rapid response, and a comprehensive media contact database in your sport and industry. Each engagement starts with a strategy session to define your story angles, target publications, and goals.',
  stats: [
    { value: '55+', label: 'Stories Placed' },
    { value: '90%', label: 'Satisfaction' },
    { value: '1-2 wks', label: 'Per Engagement' },
    { value: '1:1', label: 'Strategist' },
  ],
  includes: [
    {
      title: 'Press & Distribution',
      items: [
        'Professional press release writing',
        'Distribution to targeted journalist lists',
        'Proactive media outreach (sports + business + industry pubs)',
        'Publication targeting',
      ],
    },
    {
      title: 'Coaching & Crisis',
      items: [
        'Interview preparation coaching',
        'Talking points + message framing',
        'Media training',
        'Crisis communication planning',
        'Rapid response support',
      ],
    },
    {
      title: 'Monitoring & Reporting',
      items: [
        'Media monitoring (online, print, broadcast)',
        'Coverage tracking and reporting',
        'Estimated media value calculations',
        'Sport-specific journalist database',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Strategy session', body: 'Define your story angles, target pubs, and goals.' },
    { n: 2, title: 'Press release crafted', body: 'Professional release written and reviewed.' },
    { n: 3, title: 'Targeted distribution', body: 'Sent to the right journalists in the right outlets.' },
    { n: 4, title: 'Track results', body: 'Coverage report with reach and media value.' },
  ],
  faq: [
    {
      q: 'What if my story isn\'t newsworthy yet?',
      a: 'Our strategists help you find the angle. Signed a deal? Launched a business? Achieved a milestone? Compelling personal story? We know how to frame it.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$199', period: 'per engagement' }],
}

// ── Legal Support Services ────────────────────────────────────────────────
RICH_CONTENT['legal-support'] = {
  intro:
    'Access to qualified attorneys for contract review (NIL agreements, brand deals, endorsement contracts, licensing deals, appearance agreements), contract drafting for your own business ventures, intellectual property protection strategy, trademark guidance, entity formation for NIL income (LLC, S-Corp), compliance guidance for NCAA, state, and conference NIL regulations, dispute resolution and mediation, cease and desist letters when your rights are infringed, and general legal counsel on demand. For brands, legal services include partnership agreement drafting, regulatory compliance, employment law guidance, and business transaction support. Every engagement starts with a consultation to understand your needs, followed by a clear scope and fee quote before any work begins. No surprise bills.',
  stats: [
    { value: '60+', label: 'Clients' },
    { value: '94%', label: 'Satisfaction' },
    { value: 'NIL', label: 'Specialists' },
    { value: 'No surprise', label: 'Fees' },
  ],
  includes: [
    {
      title: 'Contract & IP',
      items: [
        'NIL agreement review and drafting',
        'Brand deal + endorsement contracts',
        'Licensing + appearance agreements',
        'Intellectual property protection strategy',
        'Trademark guidance',
      ],
    },
    {
      title: 'Compliance & Disputes',
      items: [
        'NCAA, state, and conference NIL compliance',
        'Dispute resolution + mediation',
        'Cease and desist letters',
        'Entity formation (LLC, S-Corp for NIL income)',
      ],
    },
    {
      title: 'For Brands',
      items: [
        'Partnership agreement drafting',
        'Regulatory compliance',
        'Employment law guidance',
        'Business transaction support',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Describe your need', body: 'Brief consultation to understand the situation.' },
    { n: 2, title: 'Attorney matched', body: 'Paired with a specialist who understands NIL law.' },
    { n: 3, title: 'Clear scope + quote', body: 'No surprise bills. You approve before work starts.' },
    { n: 4, title: 'Resolution', body: 'Resolved + ongoing counsel as needed.' },
  ],
  faq: [
    {
      q: 'How is this different from a regular lawyer?',
      a: 'Our attorneys specialize in NIL — they understand NCAA, conference, and state-specific regulations that general practitioners often miss.',
    },
    {
      q: 'How much does it cost?',
      a: 'Free / Custom — pricing is based on scope. You get a clear quote before any work begins.',
    },
  ],
  pricing: [],
  ctaLabel: 'BOOK CONSULTATION →',
}

// ── Tax Services ──────────────────────────────────────────────────────────
RICH_CONTENT['tax-services'] = {
  intro:
    'Proactive tax planning consultations throughout the year — not just at filing time — to minimize your tax burden through legal strategies. Annual federal and state tax return preparation, including multi-state filing for talent who compete or earn income in multiple states. Quarterly estimated tax payment calculations to avoid underpayment penalties. Income classification guidance for NIL earnings (1099 vs W-2, hobby vs business income). Business expense identification and documentation guidance (travel, equipment, training, agent fees, branding costs). Entity structure analysis to determine if an LLC or S-Corp would save you money. IRS representation if you ever receive a notice or audit inquiry. Year-end tax projection showing your expected liability before December 31 so you can take action.',
  stats: [
    { value: '100+', label: 'Returns Filed' },
    { value: '96%', label: 'Satisfaction' },
    { value: '5-10d', label: 'Turnaround' },
    { value: 'Multi-state', label: 'Filing' },
  ],
  includes: [
    {
      title: 'Tax Preparation',
      items: [
        'Annual federal and state returns',
        'Multi-state filing for travelling talent',
        'Quarterly estimated tax payment calculations',
        'Secure document upload portal',
      ],
    },
    {
      title: 'Planning & Strategy',
      items: [
        'Proactive year-round planning consultations',
        'NIL income classification guidance (1099 vs W-2, hobby vs business)',
        'Business expense identification + documentation',
        'Entity structure analysis (LLC vs S-Corp)',
        'Year-end projection before Dec 31 with action items',
      ],
    },
    {
      title: 'Protection',
      items: [
        'IRS notice + audit representation',
        'Deduction optimization',
        'Underpayment penalty avoidance',
        'Year-round support — not just at filing time',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Upload docs', body: 'Securely upload via the document portal.' },
    { n: 2, title: 'Specialist reviews', body: 'Tax specialist analyzes for deductions + planning opportunities.' },
    { n: 3, title: 'Review + approve', body: 'You review the return before filing.' },
    { n: 4, title: 'File + refund', body: 'Filed on your behalf — refund tracked to your account.' },
  ],
  faq: [
    {
      q: 'What if I have income in multiple states?',
      a: 'We handle multi-state filing as standard — common for talent who compete or earn outside their home state.',
    },
    {
      q: 'Should I have an LLC?',
      a: 'Maybe. Our entity analysis looks at your income, expenses, and structure to figure out if LLC or S-Corp would save you real money.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$249', period: 'per return' }],
}

// ── Trademark Registration ────────────────────────────────────────────────
RICH_CONTENT['trademark-registration'] = {
  intro:
    'A comprehensive trademark search across the USPTO database, state registries, and common law sources to identify potential conflicts before filing. A detailed search report with our analysis and recommendation on registrability. If clear, we prepare and file your trademark application with the United States Patent and Trademark Office (USPTO), including proper identification of goods and services, specimen preparation, and class selection. We monitor the application through the entire process (typically 8-12 months), respond to any office actions or examiner questions, and navigate any opposition proceedings. Once registered, your trademark gives you nationwide priority, the right to use the registered trademark symbol, and the legal authority to enforce your brand against infringers. For talent, trademarking your name, jersey number phrase, celebration, or logo before signing NIL deals is critical.',
  stats: [
    { value: '30+', label: 'Filings' },
    { value: '92%', label: 'Satisfaction' },
    { value: '8-12mo', label: 'USPTO Process' },
    { value: 'Federal', label: 'Protection' },
  ],
  includes: [
    {
      title: 'Search & Strategy',
      items: [
        'Comprehensive USPTO + state + common law search',
        'Detailed search report with registrability analysis',
        'Brand protection strategy',
        'International filing options if you need broader coverage',
      ],
    },
    {
      title: 'Filing & Monitoring',
      items: [
        'Federal USPTO filing',
        'Proper goods and services identification',
        'Specimen preparation + class selection',
        'Office action responses',
        'Opposition proceeding navigation',
      ],
    },
    {
      title: 'After Registration',
      items: [
        'Registration management',
        'Cease & desist support when infringers appear',
        'Right to use ® symbol',
        'Nationwide legal priority',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Comprehensive search', body: 'USPTO + state + common law conflict check.' },
    { n: 2, title: 'File application', body: 'Filed with USPTO within 1-2 weeks of green light.' },
    { n: 3, title: 'Monitor + respond', body: '8-12 month USPTO process, we handle examiner questions.' },
    { n: 4, title: 'Registered', body: 'Federal registration + cease & desist support going forward.' },
  ],
  faq: [
    {
      q: 'What should I trademark?',
      a: 'For talent: your name, jersey number phrase, signature celebration, or logo. Trademarking these before NIL deals is critical.',
    },
    {
      q: 'How long does it take?',
      a: 'Filing happens within 1-2 weeks. USPTO review and registration typically takes 8-12 months.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$349', period: 'per filing' }],
}

// ── Affiliate Opportunities ───────────────────────────────────────────────
RICH_CONTENT['affiliate-opportunities'] = {
  intro:
    'Access to a curated marketplace of premium, NIL-compliant brands across categories including sports nutrition, apparel, technology, fitness equipment, lifestyle products, and financial services. For each brand you choose to partner with, you receive a unique affiliate link and tracking code that credits you for every sale driven by your promotion for a full 365 days after someone clicks your link. Share links on your social media, website, EPK, or anywhere your audience engages with you. Your real-time earnings dashboard shows total clicks, conversion rate, total sales generated, commission earned, and pending payouts. Commissions are paid monthly via direct deposit. Many talent earn $500-$5,000+ per month through affiliate partnerships.',
  stats: [
    { value: '300+', label: 'Talent Earning' },
    { value: '95%', label: 'Satisfaction' },
    { value: '365d', label: 'Conversion Window' },
    { value: 'Monthly', label: 'Payouts' },
  ],
  includes: [
    {
      title: 'Brand Marketplace',
      items: [
        'Curated, NIL-compliant brands across sports nutrition, apparel, tech, fitness, lifestyle, finance',
        'Premium brand selection (no spam)',
        'Custom storefront option',
        'Instant link generation per brand',
      ],
    },
    {
      title: 'Tracking & Earnings',
      items: [
        '365-day conversion tracking on every click',
        'Real-time earnings dashboard',
        'Total clicks + conversion rate + sales + commission tracking',
        'Monthly payouts via direct deposit',
        'Pending payout visibility',
      ],
    },
    {
      title: 'Sharing Tools',
      items: [
        'Share on social, website, EPK, anywhere',
        'Sport-specific brand recommendations',
        'Social sharing tools built in',
        'Hosted at NILAffiliates.com',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Browse brands', body: 'Curated marketplace of NIL-compliant partners.' },
    { n: 2, title: 'Generate links', body: 'Unique affiliate link + tracking code per brand.' },
    { n: 3, title: 'Share with your audience', body: 'Social, website, EPK — anywhere works.' },
    { n: 4, title: 'Earn', body: 'Commission on every sale, 365-day conversion window, paid monthly.' },
  ],
  faq: [
    {
      q: 'How much can I earn?',
      a: 'Many talent earn $500-$5,000+ per month through affiliate partnerships. Depends on your audience size and how active you are sharing.',
    },
    {
      q: 'What if someone clicks but buys later?',
      a: 'You get credit for any sale within 365 days of the initial click — among the longest conversion windows in affiliate marketing.',
    },
    {
      q: 'When do I get paid?',
      a: 'Monthly via direct deposit. Your dashboard shows total earned, paid out, and pending.',
    },
  ],
  pricing: [],
  ctaLabel: 'BROWSE BRANDS →',
}

// ── Digital Design Packs ──────────────────────────────────────────────────
RICH_CONTENT['custom-design-packs'] = {
  intro:
    '20+ pre-designed templates across multiple categories — social media posts (square, portrait, landscape), Instagram and TikTok stories, Facebook and LinkedIn covers, email newsletter headers, event promotional graphics, recruitment flyers, and sales collateral. Every template is customized with your exact brand colors, fonts, logo placement, and visual style. Templates are delivered in editable formats compatible with Canva, Adobe Creative Suite (Photoshop, Illustrator, InDesign), and Figma, plus print-ready PDF versions.',
  stats: [
    { value: '60+', label: 'Brands' },
    { value: '95%', label: 'Satisfaction' },
    { value: '20+', label: 'Templates' },
    { value: '2-3d', label: 'Delivery' },
  ],
  includes: [
    {
      title: 'Template Library',
      items: [
        '20+ pre-designed templates',
        'Social media (square, portrait, landscape, stories, covers)',
        'Email newsletter headers',
        'Event promo graphics + recruitment flyers + sales collateral',
      ],
    },
    {
      title: 'Customization',
      items: [
        'Customized with your brand colors, fonts, logo placement',
        'Editable source files (Canva, PSD, AI, InDesign, Figma)',
        'Print-ready PDFs included',
        'Placeholder text + images for fast content swaps',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Choose pack theme', body: 'Pick the library you need.' },
    { n: 2, title: 'Provide brand assets', body: 'Logo + colors + brand guidelines.' },
    { n: 3, title: 'Customized', body: 'We customize every template for your brand.' },
    { n: 4, title: 'Download + use', body: 'Use immediately across your channels.' },
  ],
  faq: [
    {
      q: 'What formats are included?',
      a: 'Canva, Adobe (PSD/AI/InDesign), Figma, plus print-ready PDF versions of every template.',
    },
  ],
  pricing: [{ label: 'One-time', amount: '$149', period: 'one-time payment' }],
}

// ── PPC & SEO Marketing ───────────────────────────────────────────────────
RICH_CONTENT['ppc-seo-marketing'] = {
  intro:
    'For PPC — Google Ads campaign setup and ongoing management including keyword research, ad copywriting, landing page recommendations, bid management, A/B testing of ad variations, conversion tracking setup, remarketing campaigns, and detailed ROI reporting. For SEO — a comprehensive technical site audit, keyword research and content strategy, on-page optimization (meta tags, headings, content structure, internal linking), content creation guidance, link building outreach, local SEO optimization, schema markup implementation, and monthly ranking reports showing your position for target keywords. Both services include a dedicated account manager, monthly performance reports with clear ROI metrics, and strategy calls.',
  stats: [
    { value: '70+', label: 'Clients' },
    { value: '91%', label: 'Satisfaction' },
    { value: 'Monthly', label: 'Reports' },
    { value: '1:1', label: 'Account Manager' },
  ],
  includes: [
    {
      title: 'PPC (Google Ads)',
      items: [
        'Campaign setup + ongoing management',
        'Keyword research + ad copywriting',
        'Landing page recommendations + A/B testing',
        'Bid management + remarketing campaigns',
        'Conversion tracking setup + ROI reporting',
      ],
    },
    {
      title: 'SEO',
      items: [
        'Technical site audit',
        'Keyword research + content strategy',
        'On-page optimization (meta tags, headings, structure, internal links)',
        'Link building outreach + local SEO + schema markup',
        'Monthly ranking reports for target keywords',
      ],
    },
    {
      title: 'Reporting',
      items: [
        'Dedicated account manager',
        'Monthly performance reports with ROI metrics',
        'Strategy calls to plan next steps',
        'Competitor analysis',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'SEO audit + keyword research', body: 'Deep technical + keyword analysis.' },
    { n: 2, title: 'Campaign strategy', body: 'Setup + creative + landing pages.' },
    { n: 3, title: 'Launch + optimize', body: 'A/B testing + ongoing tuning.' },
    { n: 4, title: 'Monthly reporting', body: 'Performance + recommendations.' },
  ],
  faq: [],
  pricing: [{ label: 'Monthly', amount: '$399', period: 'per month' }],
}

// ── Reputation & Reviews ──────────────────────────────────────────────────
RICH_CONTENT['reputation-review'] = {
  intro:
    'A complete review automation platform that sends perfectly timed review requests to your customers and clients via SMS text message and email after every transaction or interaction. The system uses smart routing — satisfied customers are guided to leave public reviews on Google, Yelp, Facebook, and industry-specific review sites, while anyone with a concern is routed to a private feedback form that comes directly to you before they post publicly. Your reputation dashboard shows review volume trends, average star rating over time, sentiment analysis, response rate tracking, and competitive benchmarking against similar businesses.',
  stats: [
    { value: '85+', label: 'Brands' },
    { value: '96%', label: 'Satisfaction' },
    { value: 'Auto', label: 'Review Requests' },
    { value: 'Smart', label: 'Routing' },
  ],
  includes: [
    {
      title: 'Review Automation',
      items: [
        'Automated SMS + email review requests after every transaction',
        'Smart routing: positive → public review sites, concerns → private feedback to you',
        'Multi-platform publishing (Google, Yelp, Facebook, industry sites)',
        'Negative review interception before they post',
      ],
    },
    {
      title: 'Dashboard + Response',
      items: [
        'Reputation monitoring dashboard with sentiment analysis',
        'Review volume + rating trends over time',
        'Automated review response templates',
        'Competitive benchmarking',
      ],
    },
    {
      title: 'Marketing Integration',
      items: [
        'Custom review widget for your website',
        'Builds social proof automatically',
        'Monthly reports with reputation health insights',
        'Hosted at ReviewThruster.com',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Connect business profiles', body: 'Google, Yelp, Facebook, industry sites.' },
    { n: 2, title: 'Set up review requests', body: 'SMS + email automation configured.' },
    { n: 3, title: 'Positive → public', body: 'Satisfied customers post on Google, Yelp, etc.' },
    { n: 4, title: 'Concerns → private', body: 'Routed to you before they go public.' },
  ],
  faq: [],
  pricing: [{ label: 'Monthly', amount: '$199', period: 'per month' }],
}

// ── Listings Management ───────────────────────────────────────────────────
RICH_CONTENT['listings-management'] = {
  intro:
    'A complete audit of your current listings across Google Business Profile, Apple Maps, Yelp, Facebook, Bing Places, Yahoo, Foursquare, Yellow Pages, Better Business Bureau, and 50+ additional directories. We claim and verify your profiles on every platform, optimize each listing with consistent name, address, phone number (NAP), business hours, photos, categories, descriptions, and service areas. Our system monitors all listings in real-time and automatically corrects any unauthorized changes. Duplicate listings are identified and suppressed.',
  stats: [
    { value: '65+', label: 'Brands' },
    { value: '94%', label: 'Satisfaction' },
    { value: '60+', label: 'Directories' },
    { value: 'Real-time', label: 'Monitoring' },
  ],
  includes: [
    {
      title: 'Listing Audit',
      items: [
        'Audit across 60+ directories',
        'Google Business Profile + Apple Maps + Yelp + Facebook + Bing + Yahoo + Foursquare + Yellow Pages + BBB',
        'Identify NAP inconsistencies',
        'Detect duplicate listings',
      ],
    },
    {
      title: 'Optimization + Sync',
      items: [
        'Claim and verify every profile',
        'NAP consistency across all platforms',
        'Hours, photos, categories, descriptions, service areas',
        'Duplicate suppression',
      ],
    },
    {
      title: 'Monitoring + Reporting',
      items: [
        'Real-time monitoring with automatic corrections',
        'Monthly listing health score reports',
        'Local SEO boost tracking',
        'Search visibility improvements',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Audit current listings', body: 'Identify gaps and inconsistencies.' },
    { n: 2, title: 'Claim + optimize', body: 'Profile control across every platform.' },
    { n: 3, title: 'Sync across directories', body: 'NAP consistency everywhere.' },
    { n: 4, title: 'Monitor + maintain', body: 'Auto-correction of unauthorized changes.' },
  ],
  faq: [],
  pricing: [
    { label: 'Monthly', amount: '$99', period: 'per month' },
    { label: 'Annual', amount: '$74.92', period: 'per month, billed annually', savings: 'Save 24%' },
  ],
}

// ── Market Research ───────────────────────────────────────────────────────
RICH_CONTENT['market-research'] = {
  intro:
    'Custom research design starting with a strategy session to define your objectives — whether you are evaluating potential NIL partnerships, testing product concepts, understanding fan preferences, measuring brand awareness, or benchmarking against competitors. Our team designs interactive, engaging survey instruments that achieve higher completion rates than traditional surveys through gamification elements. Surveys are deployed to your target audience segment with demographic targeting by age, location, sport interest, income level, and more.',
  stats: [
    { value: '20+', label: 'Studies' },
    { value: '92%', label: 'Satisfaction' },
    { value: '2-4w', label: 'Turnaround' },
    { value: 'Gamified', label: 'Surveys' },
  ],
  includes: [
    {
      title: 'Custom Research Design',
      items: [
        'Strategy session to define objectives',
        'Interactive, gamified survey instruments (higher completion rates)',
        'Custom question design',
        'Target audience demographics: age, location, sport, income',
      ],
    },
    {
      title: 'Insights + Reporting',
      items: [
        'Comprehensive insights report',
        'Statistical analysis + audience segmentation',
        'Competitive benchmarking + sentiment analysis',
        'Key findings + actionable strategic recommendations',
        'Raw data in spreadsheet for your own analysis',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Define objectives', body: 'Strategy session on what to learn.' },
    { n: 2, title: 'Design surveys', body: 'Gamified, interactive instruments.' },
    { n: 3, title: 'Deploy', body: 'Targeted audience segment.' },
    { n: 4, title: 'Insights report', body: 'Visual charts + strategic recommendations.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$299', period: 'per study' }],
}

// ── Philanthropic Support ─────────────────────────────────────────────────
RICH_CONTENT['philanthropic-support'] = {
  intro:
    'A cause alignment assessment identifying nonprofit organizations and social causes that authentically connect with your brand values, audience demographics, and personal passions. Nonprofit partnership facilitation including introductions, partnership agreement drafting, and relationship management. Co-branded campaign design covering messaging strategy, visual assets, event planning, and social media content calendars. Community engagement event planning and execution — charity games, autograph sessions, school visits, donation drives, and volunteer days. Impact measurement and reporting showing donations raised, volunteer hours, media coverage, social media engagement, and brand sentiment improvement.',
  stats: [
    { value: '20+', label: 'Programs' },
    { value: '96%', label: 'Satisfaction' },
    { value: 'Strategic', label: 'CSR' },
    { value: '1:1', label: 'Strategist' },
  ],
  includes: [
    {
      title: 'Cause Alignment + Partnerships',
      items: [
        'Cause alignment assessment',
        'Nonprofit introductions + partnership agreements',
        'Relationship management with charities',
        'Strategic CSR campaign design',
      ],
    },
    {
      title: 'Campaigns + Events',
      items: [
        'Co-branded campaign design (messaging + visual + content)',
        'Community engagement events (charity games, autograph sessions, school visits, donation drives)',
        'Event planning + execution',
        'Social media content calendars',
      ],
    },
    {
      title: 'Impact + PR',
      items: [
        'Impact measurement (donations, volunteer hours, media coverage)',
        'PR integration for charitable work',
        'Tax optimization guidance',
        'Storytelling support across your platforms',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Identify causes', body: 'Aligned with your brand + audience.' },
    { n: 2, title: 'Connect with nonprofits', body: 'We facilitate partnerships.' },
    { n: 3, title: 'Design co-branded campaign', body: 'Messaging + assets + events.' },
    { n: 4, title: 'Launch + measure impact', body: 'Track every metric that matters.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BOOK STRATEGY CALL →',
}

// ── Affiliate Marketing ───────────────────────────────────────────────────
RICH_CONTENT['affiliate-marketing'] = {
  intro:
    'Complete affiliate program infrastructure including a branded partner portal where affiliates can sign up, access marketing materials, generate tracking links, and view their earnings. Automated commission tracking with a 365-day cookie window (industry standard is 30 days — ours tracks conversions for a full year). Custom commission structures — flat rate per sale, percentage of revenue, tiered rates based on volume, or hybrid models. Real-time analytics dashboard showing clicks, conversions, revenue by partner, top-performing content, and commission payouts.',
  stats: [
    { value: '35+', label: 'Programs Live' },
    { value: '93%', label: 'Satisfaction' },
    { value: '365d', label: 'Cookie Window' },
    { value: 'Auto', label: 'Payouts' },
  ],
  includes: [
    {
      title: 'Partner Portal',
      items: [
        'Branded partner portal for affiliate sign-up',
        'Access to marketing materials + tracking links',
        'Affiliate earnings + leaderboard view',
        'Brand-aligned customization throughout',
      ],
    },
    {
      title: 'Tracking + Commission',
      items: [
        '365-day cookie tracking (12x industry standard)',
        'Custom commission structures (flat / % / tiered / hybrid)',
        'Real-time clicks + conversions + revenue analytics',
        'Top-performing content + partner insights',
      ],
    },
    {
      title: 'Payouts + Promotion',
      items: [
        'Automated monthly payouts (direct deposit / check)',
        'Branded promotional materials (banners, social, email templates, product links)',
        'Affiliate recruitment support',
        'Partner performance optimization',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Define commission structure', body: 'Flat, %, tiered — your call.' },
    { n: 2, title: 'We build your portal', body: 'Branded affiliate portal.' },
    { n: 3, title: 'Recruit partners', body: 'Onboard high-performing affiliates.' },
    { n: 4, title: 'Track + pay', body: 'Optimize performance, automate payouts.' },
  ],
  faq: [],
  pricing: [{ label: 'Monthly', amount: '$299', period: 'per month' }],
}

// ── TikTok Monetization ───────────────────────────────────────────────────
RICH_CONTENT['tiktok-monetization'] = {
  intro:
    'Complete TikTok Shop setup and optimization including product catalog integration, fulfillment configuration, and storefront design. A data-driven content strategy based on analysis of your top-performing content, audience demographics, trending sounds and formats in your niche, and optimal posting times. Creator-brand matching that connects you with brands actively seeking TikTok partnerships in your sport and audience demographic. Campaign management for sponsored content including rate negotiation, content briefs, approval workflows, and performance reporting. Revenue optimization covering TikTok Creator Fund enrollment, LIVE gifting strategy, and series/subscription content planning.',
  stats: [
    { value: '40+', label: 'Creators' },
    { value: '91%', label: 'Satisfaction' },
    { value: '2-3w', label: 'Setup' },
    { value: 'Weekly', label: 'Reviews' },
  ],
  includes: [
    {
      title: 'TikTok Shop',
      items: [
        'Complete Shop setup + optimization',
        'Product catalog integration',
        'Fulfillment configuration',
        'Storefront design',
      ],
    },
    {
      title: 'Content + Brand Matching',
      items: [
        'Data-driven content strategy (top performers, trending sounds, posting times)',
        'Creator-brand matching for sport + audience demographic',
        'Campaign management (briefs, approval, performance reporting)',
        'Rate negotiation for sponsored content',
      ],
    },
    {
      title: 'Revenue Streams',
      items: [
        'TikTok Creator Fund enrollment',
        'LIVE gifting strategy',
        'Series + subscription content planning',
        'Weekly analytics reviews (views, engagement, follower growth, shop sales, revenue)',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'TikTok account audit', body: 'Where you stand today.' },
    { n: 2, title: 'Shop + monetization setup', body: 'TikTok Shop, Creator Fund, LIVE.' },
    { n: 3, title: 'Content strategy', body: 'Data-driven calendar built for your niche.' },
    { n: 4, title: 'Launch + optimize', body: 'Weekly reviews, continuous tuning.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$499', period: 'one-time setup' }],
}

// ── Investor Assistance ───────────────────────────────────────────────────
RICH_CONTENT['investor-assistance'] = {
  intro:
    'A strategy session to define your funding requirements — amount, stage, preferred investor type (VC, angel, strategic, family office), and timeline. Access to our verified database of investors actively deploying capital in sports, media, technology, and consumer brands. Industry-matched investor leads with research briefs on each prospect showing their thesis, portfolio, check size, and warm connection paths. Professional pitch deck review with detailed feedback and redesign recommendations from investors and operators who have raised capital themselves. Warm introductions to qualified investors in our network.',
  stats: [
    { value: '10+', label: 'Raises' },
    { value: '88%', label: 'Satisfaction' },
    { value: '1-2w', label: 'Strategy' },
    { value: 'Warm', label: 'Intros' },
  ],
  includes: [
    {
      title: 'Strategy + Database',
      items: [
        'Funding strategy session (amount, stage, investor type, timeline)',
        'Verified database of active investors in sports, media, tech, consumer',
        'Industry-matched leads with research briefs',
        'Investor thesis + portfolio + check size visibility',
      ],
    },
    {
      title: 'Materials + Outreach',
      items: [
        'Professional pitch deck review',
        'Detailed feedback + redesign recommendations',
        'Investor outreach email templates + follow-up sequences',
        'Meeting preparation coaching',
      ],
    },
    {
      title: 'Closing Support',
      items: [
        'Warm introductions in our network',
        'Virtual deal room setup',
        'Term sheet review',
        'Negotiation guidance through your raise',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Define funding needs', body: 'Amount, stage, investor type, timeline.' },
    { n: 2, title: 'Research + match', body: 'Curated investor list with warm paths.' },
    { n: 3, title: 'Pitch + outreach', body: 'Deck review + outreach strategy.' },
    { n: 4, title: 'Through close', body: 'Term sheet review + negotiation guidance.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$999', period: 'engagement' }],
}

// ── Financial Advisory ────────────────────────────────────────────────────
RICH_CONTENT['financial-advisory'] = {
  intro:
    'A complimentary initial consultation to assess your current financial situation, income sources, expenses, debts, and goals. Your advisor creates a comprehensive financial plan covering monthly budgeting, NIL income structuring and tax optimization, investment strategy based on your risk tolerance and timeline, retirement planning (especially important since athletic careers have a limited window), debt management, insurance needs analysis, estate planning basics, and emergency fund strategy. For talent, we specialize in managing irregular income from multiple NIL deals, understanding tax obligations across multiple states, protecting wealth during and after your playing career.',
  stats: [
    { value: '75+', label: 'Clients' },
    { value: '95%', label: 'Satisfaction' },
    { value: 'Free', label: 'Initial Consult' },
    { value: 'Quarterly', label: 'Reviews' },
  ],
  includes: [
    {
      title: 'Financial Planning',
      items: [
        'Monthly budgeting',
        'NIL income structuring + tax optimization',
        'Investment strategy aligned to risk tolerance',
        'Retirement planning (critical for short-career talent)',
        'Debt management + emergency fund strategy',
      ],
    },
    {
      title: 'NIL-Specific',
      items: [
        'Managing irregular income from multiple deals',
        'Multi-state tax obligations',
        'Wealth protection during + after playing career',
        'Avoiding pitfalls common to professional talent',
      ],
    },
    {
      title: 'For Brands',
      items: [
        'Business financial planning',
        'Cash flow forecasting',
        'Growth financing options',
        'Profitability optimization',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Free consultation', body: 'Assess current situation + goals.' },
    { n: 2, title: 'Financial assessment', body: 'Detailed analysis of income, expenses, goals.' },
    { n: 3, title: 'Custom plan', body: 'Comprehensive plan covering every domain.' },
    { n: 4, title: 'Ongoing advisory', body: 'Quarterly reviews + adjustments.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BOOK FREE CONSULT →',
}

// ── Legal Document Creation ───────────────────────────────────────────────
RICH_CONTENT['legal-document-creation'] = {
  intro:
    'Custom legal documents generated by our platform and reviewed by licensed attorneys, tailored to your specific situation and state law requirements. Document types include NIL partnership agreements, brand endorsement contracts, licensing agreements, non-disclosure agreements (NDAs), independent contractor agreements, operating agreements for LLCs, partnership agreements, employment offer letters, consulting agreements, terms of service for websites, privacy policies, content licensing agreements, and appearance/event contracts. Each document is customized with your specific terms, parties, obligations, and protections — not generic fill-in-the-blank templates.',
  stats: [
    { value: '45+', label: 'Docs Drafted' },
    { value: '93%', label: 'Satisfaction' },
    { value: '3-5d', label: 'Turnaround' },
    { value: 'Attorney', label: 'Reviewed' },
  ],
  includes: [
    {
      title: 'NIL + Talent Docs',
      items: [
        'NIL partnership agreements',
        'Brand endorsement contracts + licensing agreements',
        'Appearance / event contracts',
        'Content licensing agreements',
      ],
    },
    {
      title: 'Business Docs',
      items: [
        'NDAs + independent contractor agreements',
        'LLC operating agreements + partnership agreements',
        'Employment offer letters + consulting agreements',
        'Terms of service + privacy policies for websites',
      ],
    },
    {
      title: 'Process',
      items: [
        'Custom drafted (not templates)',
        'State law compliant',
        'Attorney-reviewed',
        'Integrated e-signature',
        'Secure storage in your account',
        'Bulk pricing for multi-doc orders',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Select doc type', body: 'Pick from menu of common docs.' },
    { n: 2, title: 'Provide details', body: 'Parties, terms, specifics for your situation.' },
    { n: 3, title: 'Attorney drafts', body: 'Custom + state-compliant + reviewed.' },
    { n: 4, title: 'Sign + store', body: 'E-signature integrated, securely stored.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$149', period: 'per document' }],
}

// ── Insurance Services ────────────────────────────────────────────────────
RICH_CONTENT['insurance-services'] = {
  intro:
    'A complimentary risk assessment identifying your current coverage gaps and exposure areas. For talent — disability insurance protecting your earning potential if you are injured, loss-of-value insurance if an injury reduces your draft stock or NIL earning power, NIL income protection policies, health insurance navigation and enrollment assistance, personal liability coverage, property and auto insurance reviews, and umbrella policy recommendations. For brands — general liability insurance, professional liability (E&O), commercial property, workers compensation, event insurance for NIL activations, cyber liability, D&O coverage, and employment practices liability. Our advisors are independent — not tied to any single insurance company.',
  stats: [
    { value: '50+', label: 'Clients' },
    { value: '94%', label: 'Satisfaction' },
    { value: 'Free', label: 'Risk Assessment' },
    { value: 'Multi-carrier', label: 'Shopping' },
  ],
  includes: [
    {
      title: 'For Talent',
      items: [
        'Disability insurance — protects earning potential',
        'Loss-of-value insurance for draft / NIL impacts',
        'NIL income protection policies',
        'Health insurance navigation + enrollment',
        'Personal liability + property + auto + umbrella',
      ],
    },
    {
      title: 'For Brands',
      items: [
        'General liability + commercial property',
        'Professional liability (E&O)',
        'Workers comp + employment practices liability',
        'Event insurance for NIL activations',
        'Cyber liability + D&O coverage',
      ],
    },
    {
      title: 'Independent Advisors',
      items: [
        'Not tied to a single carrier',
        'Shop across dozens of carriers',
        'Best protection at competitive rates',
        'Complimentary risk assessment',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Free risk assessment', body: 'Identify coverage gaps + exposures.' },
    { n: 2, title: 'Custom recommendations', body: 'Coverage tailored to your situation.' },
    { n: 3, title: 'Compare plans + pricing', body: 'Multiple carriers shopped for you.' },
    { n: 4, title: 'Enroll + stay protected', body: 'Annual reviews + renewals handled.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BOOK RISK ASSESSMENT →',
}

// ── Bookkeeping Services ──────────────────────────────────────────────────
RICH_CONTENT['bookkeeping'] = {
  intro:
    'Dedicated bookkeeper who manages your financial records including bank and credit card transaction categorization, accounts receivable tracking (invoices sent, payments received from NIL deals), accounts payable management (bills, subscriptions, business expenses), monthly bank and credit card reconciliation, profit and loss statements, balance sheets, cash flow reports, and 1099 contractor tracking. For talent with multiple NIL income streams, we track each deal separately. For brands, we integrate with QuickBooks, Xero, or FreshBooks.',
  stats: [
    { value: '55+', label: 'Clients' },
    { value: '95%', label: 'Satisfaction' },
    { value: 'Monthly', label: 'Reports' },
    { value: 'Cloud', label: 'Dashboard' },
  ],
  includes: [
    {
      title: 'Daily Operations',
      items: [
        'Bank + credit card transaction categorization',
        'Accounts receivable (NIL deal invoices, payments)',
        'Accounts payable (bills, subscriptions, expenses)',
        'Monthly reconciliation',
      ],
    },
    {
      title: 'Financial Statements',
      items: [
        'Profit & loss statements',
        'Balance sheets',
        'Cash flow reports',
        '1099 contractor tracking',
      ],
    },
    {
      title: 'Talent + Brand',
      items: [
        'Per-deal tracking for multi-NIL income',
        'QuickBooks / Xero / FreshBooks integration for brands',
        'Cloud dashboard, anytime access',
        'Monthly summary by the 15th',
        'Year-end tax-ready package',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Connect accounts', body: 'Banks, credit cards, tools.' },
    { n: 2, title: 'We categorize + reconcile', body: 'Monthly close, every transaction.' },
    { n: 3, title: 'Monthly reports', body: 'P&L + balance sheet + cash flow.' },
    { n: 4, title: 'Tax-ready year-end', body: 'Clean books for your CPA.' },
  ],
  faq: [],
  pricing: [{ label: 'Monthly', amount: '$149', period: 'per month' }],
}

// ── Data Removal Services ─────────────────────────────────────────────────
RICH_CONTENT['data-removal'] = {
  intro:
    'An initial scan across 150+ data broker sites (Spokeo, WhitePages, BeenVerified, TruePeopleSearch, Intelius, Radaris, and many more) identifying where your personal data appears — including home address, phone numbers, email addresses, family member names, financial information, and property records. Our team submits individual removal requests to each site following their specific takedown procedures. You receive a detailed report showing what was found and what was removed. Because data brokers continuously re-collect information, our service includes ongoing monthly monitoring and re-removal as new listings appear.',
  stats: [
    { value: '40+', label: 'Clients' },
    { value: '93%', label: 'Satisfaction' },
    { value: '150+', label: 'Broker Sites' },
    { value: 'Monthly', label: 'Re-check' },
  ],
  includes: [
    {
      title: 'Personal Data Audit',
      items: [
        'Scan 150+ data brokers (Spokeo, WhitePages, BeenVerified, TruePeopleSearch, Intelius, Radaris, ...)',
        'Identify home address, phone, email, family names, financial info, property records',
        'Detailed exposure report',
      ],
    },
    {
      title: 'Removal',
      items: [
        'Individual removal requests per broker (per their takedown procedures)',
        'Removal report with what was found + what was removed',
        'Re-removal guarantee — brokers re-collect, we re-remove',
      ],
    },
    {
      title: 'Ongoing Monitoring',
      items: [
        'Monthly monitoring + re-removal',
        'Quarterly exposure score trending',
        'Essential for public-figure talent (stalking, identity theft, doxxing, social engineering)',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Scan broker sites', body: '150+ brokers checked initially.' },
    { n: 2, title: 'Identify exposed data', body: 'Detailed report of what\'s out there.' },
    { n: 3, title: 'Submit removal requests', body: 'One per broker, per their procedures.' },
    { n: 4, title: 'Monitor + re-remove', body: 'Monthly checks, exposure trending down.' },
  ],
  faq: [],
  pricing: [
    { label: 'Monthly', amount: '$99', period: 'per month' },
    { label: 'Annual', amount: '$74.92', period: 'per month, billed annually', savings: 'Save 24%' },
  ],
}

// ── Identity Theft Protection ─────────────────────────────────────────────
RICH_CONTENT['identity-theft-protection'] = {
  intro:
    'Continuous monitoring of your Social Security number, email addresses, phone numbers, and financial accounts across the dark web, public records, credit bureaus, and data breach databases. Real-time alerts sent via text and email when suspicious activity is detected — including new accounts opened in your name, credit inquiries you did not authorize, address changes on your accounts, court records filed using your identity, social media impersonation attempts, and dark web exposure. If you become a victim of identity theft, a dedicated recovery specialist is assigned to your case and handles everything. Identity theft insurance covers up to $1 million in expenses.',
  stats: [
    { value: '35+', label: 'Members' },
    { value: '95%', label: 'Satisfaction' },
    { value: '24/7', label: 'Monitoring' },
    { value: '$1M', label: 'Insurance' },
  ],
  includes: [
    {
      title: '24/7 Monitoring',
      items: [
        'SSN + email + phone + financial accounts monitored',
        'Dark web + public records + credit bureaus + breach databases',
        'New account openings + credit inquiries + address changes',
        'Court records + social media impersonation alerts',
      ],
    },
    {
      title: 'Real-Time Alerts',
      items: [
        'Text + email alerts on suspicious activity',
        'Bank account alerts',
        'Family plans available',
        'Aggregate dashboard',
      ],
    },
    {
      title: 'Recovery + Insurance',
      items: [
        'Dedicated recovery specialist per case',
        'Police report filing + creditor contact + dispute',
        'Credit bureau coordination',
        '$1M identity theft insurance for expenses + lost wages',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Enroll', body: 'Quick setup, monitoring begins instantly.' },
    { n: 2, title: 'Continuous scan', body: 'Dark web + credit + public records.' },
    { n: 3, title: 'Instant alerts', body: 'Text + email on any suspicious activity.' },
    { n: 4, title: 'Full recovery support', body: 'Specialist + $1M insurance if needed.' },
  ],
  faq: [],
  pricing: [{ label: 'Monthly', amount: '$149', period: 'per month' }],
}

// ── Student Loan Refinance ────────────────────────────────────────────────
RICH_CONTENT['student-loan-refinance'] = {
  intro:
    'A comprehensive review of your current student loan portfolio — federal and private, subsidized and unsubsidized, interest rates, terms, and servicers. Analysis of refinancing options from multiple lenders showing projected monthly payment changes, total interest savings, new terms, and trade-offs (such as losing federal loan protections). Evaluation of income-driven repayment plans (SAVE, PAYE, IBR, ICR) and whether they make sense for your situation. For talent earning NIL income, we model how your variable income affects repayment strategy. Clear, unbiased recommendations — we are not lenders.',
  stats: [
    { value: '30+', label: 'Clients' },
    { value: '91%', label: 'Satisfaction' },
    { value: 'Unbiased', label: 'No referral fees' },
    { value: 'Free', label: 'Pre-qual' },
  ],
  includes: [
    {
      title: 'Portfolio Review',
      items: [
        'Federal + private loan inventory',
        'Interest rates + terms + servicers',
        'Subsidized vs unsubsidized breakdown',
      ],
    },
    {
      title: 'Refinance Analysis',
      items: [
        'Multi-lender comparison',
        'Projected monthly payment changes',
        'Total interest savings calculations',
        'Trade-off analysis (lost federal protections)',
      ],
    },
    {
      title: 'Income-Driven + NIL Strategy',
      items: [
        'SAVE, PAYE, IBR, ICR plan evaluation',
        'Variable NIL income repayment modeling',
        'PSLF eligibility guidance if applicable',
        'Application assistance + ongoing support',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Check rates', body: 'No impact on your credit score.' },
    { n: 2, title: 'Compare lender offers', body: 'Multiple lenders compared apples-to-apples.' },
    { n: 3, title: 'Choose best option', body: 'Clear recommendation, no referral fees.' },
    { n: 4, title: 'Application assistance', body: 'We walk you through the process.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'CHECK RATES →',
}

// ── Prep For NIL Academy ──────────────────────────────────────────────────
RICH_CONTENT['prep-for-nil-academy'] = {
  intro:
    'A structured curriculum covering NIL regulations and compliance requirements (federal, state-by-state, and conference-specific rules), building and protecting your personal brand, evaluating NIL deals (what is fair market value for your audience size and engagement), contract negotiation fundamentals, social media monetization strategies by platform, tax obligations and financial planning for NIL income, working effectively with agents and advisors, disclosure requirements and FTC compliance, group licensing opportunities, and real case studies from successful talent entrepreneurs. Taught by NIL industry experts, sports attorneys, financial advisors, and successful talent brand builders.',
  stats: [
    { value: '250+', label: 'Students' },
    { value: '94%', label: 'Satisfaction' },
    { value: 'Self-paced', label: 'Courses' },
    { value: 'Certified', label: 'On Completion' },
  ],
  includes: [
    {
      title: 'Curriculum',
      items: [
        'NIL regulations + compliance (federal, state, conference)',
        'Personal brand building + protection',
        'Deal evaluation (fair market value by audience + engagement)',
        'Contract negotiation fundamentals',
        'Social media monetization by platform',
      ],
    },
    {
      title: 'Money + Advisors',
      items: [
        'Tax obligations + financial planning for NIL income',
        'Working with agents + advisors',
        'Disclosure requirements + FTC compliance',
        'Group licensing opportunities',
      ],
    },
    {
      title: 'Materials',
      items: [
        'Video lessons + downloadable guides',
        'Templates for deal evaluation',
        'Community forum to connect with other NIL-active talent',
        'Certificate of completion',
        'Expert Q&A sessions + new content monthly',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Pick learning path', body: 'Choose your starting point.' },
    { n: 2, title: 'Access courses', body: 'Video + eBooks + guides.' },
    { n: 3, title: 'Complete at your pace', body: 'Self-paced, mobile-friendly.' },
    { n: 4, title: 'Earn certifications', body: 'Recognized by institutions + brands.' },
  ],
  faq: [],
  pricing: [
    { label: 'Monthly', amount: '$9', period: 'per month' },
    { label: 'Annual', amount: '$6.58', period: 'per month, billed annually', savings: 'Save 27%' },
  ],
}

// ── Financial Wellness ────────────────────────────────────────────────────
RICH_CONTENT['financial-wellness'] = {
  intro:
    'A structured program delivered through interactive workshops, online video modules, and one-on-one coaching sessions. Curriculum covers budgeting fundamentals (how to create and stick to a budget when your income varies month to month), understanding taxes on NIL earnings, building and protecting your credit score, investment basics (compound interest, index funds, retirement accounts — starting early even with small amounts), savings strategies and emergency fund creation, understanding contracts before you sign them, avoiding common financial scams and predatory schemes targeting young talent, managing lifestyle inflation when money starts coming in, and setting long-term financial goals beyond your playing career.',
  stats: [
    { value: '80+', label: 'Students' },
    { value: '94%', label: 'Satisfaction' },
    { value: 'Ages 16-25', label: 'Designed For' },
    { value: '1-on-1', label: 'Coaching' },
  ],
  includes: [
    {
      title: 'Core Curriculum',
      items: [
        'Budgeting with variable income',
        'NIL income tax basics',
        'Credit score building + protection',
        'Investment basics (compound interest, index funds, retirement)',
        'Savings + emergency fund strategies',
      ],
    },
    {
      title: 'Protection',
      items: [
        'Understanding contracts before signing',
        'Avoiding scams targeting young talent',
        'Managing lifestyle inflation',
        'Setting long-term goals beyond playing career',
      ],
    },
    {
      title: 'Delivery + Support',
      items: [
        'Interactive workshops + video modules',
        '1-on-1 coaching sessions',
        'Personalized financial action plan',
        'Group workshops for teams + athletic departments',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Enroll', body: 'Individual or team enrollment.' },
    { n: 2, title: 'Workshops + online', body: 'Interactive + self-paced options.' },
    { n: 3, title: 'Build your plan', body: 'Personalized action plan from coach.' },
    { n: 4, title: 'Ongoing education', body: 'Support as your career + income evolve.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'ENROLL →',
}

// ── NIL Conferences ───────────────────────────────────────────────────────
RICH_CONTENT['nil-conferences'] = {
  intro:
    'Access to a full-day or multi-day conference featuring expert speakers on topics including NIL compliance updates (federal and state regulations), deal valuation and negotiation strategies, building talent personal brands, institutional NIL program best practices, brand marketing through talent partnerships, agent and advisor relationships, social media monetization, legal and tax considerations, and emerging trends in the NIL marketplace. Structured networking sessions connect talent with brands, institutions with service providers, and advisors with potential clients.',
  stats: [
    { value: '200+', label: 'Attendees' },
    { value: '97%', label: 'Satisfaction' },
    { value: 'In-person + Virtual', label: 'Options' },
    { value: 'Expert', label: 'Speakers' },
  ],
  includes: [
    {
      title: 'Content',
      items: [
        'NIL compliance updates (federal + state)',
        'Deal valuation + negotiation strategies',
        'Personal brand building for talent',
        'Institutional NIL program best practices',
        'Brand marketing through talent partnerships',
      ],
    },
    {
      title: 'Networking',
      items: [
        'Structured talent + brand sessions',
        'Institution + service provider connections',
        'Advisor + potential client matching',
        'Panel discussions with industry leaders',
      ],
    },
    {
      title: 'Materials + Certifications',
      items: [
        'Conference materials (slides, guides, contact directory)',
        'Certification opportunities on select workshop tracks',
        'In-person + virtual attendance options',
        'Group rates for teams + departments',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Browse events', body: 'Upcoming conferences + workshops.' },
    { n: 2, title: 'Register', body: 'In-person or virtual.' },
    { n: 3, title: 'Attend', body: 'Live sessions + networking.' },
    { n: 4, title: 'Network + learn', body: 'Take home actionable strategies.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BROWSE EVENTS →',
}

// ── Promotional Items ─────────────────────────────────────────────────────
RICH_CONTENT['promotional-items'] = {
  intro:
    'Access to a catalog of 500+ customizable products including apparel (t-shirts, hoodies, hats, polos, jerseys, jackets), drinkware (water bottles, tumblers, mugs), tech accessories (phone cases, chargers, earbuds, USB drives), bags (backpacks, drawstring bags, totes, duffle bags), writing instruments, stickers, magnets, keychains, lanyards, towels, blankets, and specialty items. Our design team creates professional mockups of your branded products at no extra charge. We handle production, quality control, packaging, and shipping.',
  stats: [
    { value: '120+', label: 'Brands' },
    { value: '97%', label: 'Satisfaction' },
    { value: '500+', label: 'Products' },
    { value: '25', label: 'Min Order' },
  ],
  includes: [
    {
      title: 'Product Catalog',
      items: [
        'Apparel (t-shirts, hoodies, hats, polos, jerseys, jackets)',
        'Drinkware (water bottles, tumblers, mugs)',
        'Tech accessories (phone cases, chargers, earbuds, USB)',
        'Bags (backpacks, drawstring, totes, duffles)',
        'Stickers, magnets, keychains, lanyards, towels, blankets',
      ],
    },
    {
      title: 'Service',
      items: [
        'Free professional mockups',
        'Design assistance available',
        'Production + QC + packaging + shipping',
        'Drop shipping for ongoing fulfillment',
        'Bulk pricing for larger orders',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Browse catalog', body: '500+ products.' },
    { n: 2, title: 'Select items + qty', body: 'Minimums vary by product (often just 25).' },
    { n: 3, title: 'Free mockups', body: 'We design your branded products.' },
    { n: 4, title: 'Approve + ship', body: 'Production + shipping handled.' },
  ],
  faq: [
    {
      q: 'What\'s the minimum order?',
      a: 'Minimums vary by product. Many items start at just 25 units.',
    },
  ],
  pricing: [],
  ctaLabel: 'BROWSE CATALOG →',
}

// ── Print Products ────────────────────────────────────────────────────────
RICH_CONTENT['print-products'] = {
  intro:
    'Business cards (standard, thick, or ultra-thick stock with matte, glossy, or spot UV finish), retractable banners and standing displays, vinyl banners for events, posters in any size, flyers and brochures (tri-fold, bi-fold, or flat), rack cards, postcards and mailers, stickers and labels (kiss-cut, die-cut, or sheet), table tents, door hangers, yard signs, window clings, vehicle magnets, and large-format signage. Our design team can create your artwork from scratch or prepare your existing files for print. Every product includes a digital proof for your approval before printing.',
  stats: [
    { value: '90+', label: 'Clients' },
    { value: '96%', label: 'Satisfaction' },
    { value: '5-10d', label: 'Standard' },
    { value: '24h', label: 'Rush Available' },
  ],
  includes: [
    {
      title: 'Product Range',
      items: [
        'Business cards (matte, glossy, spot UV, thick stock)',
        'Retractable banners + vinyl banners',
        'Posters in any size',
        'Flyers + brochures (tri-fold, bi-fold, flat)',
        'Rack cards + postcards + mailers',
      ],
    },
    {
      title: 'Specialty',
      items: [
        'Stickers + labels (kiss-cut, die-cut, sheet)',
        'Table tents + door hangers + yard signs',
        'Window clings + vehicle magnets',
        'Large-format signage',
      ],
    },
    {
      title: 'Service',
      items: [
        'Design from scratch or print-prep existing files',
        'Digital proof before printing',
        'Rush available — some products ship in 24h',
        'Professional-grade equipment + exact color matching',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Choose product', body: 'Pick what you need.' },
    { n: 2, title: 'Upload or design', body: 'Upload artwork or request design.' },
    { n: 3, title: 'Approve proof', body: 'Review digital proof before printing.' },
    { n: 4, title: 'Delivered', body: 'Standard 5-10d or rush available.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'ORDER PRINT →',
}

// ── 3D Replica Event Truck ────────────────────────────────────────────────
RICH_CONTENT['3d-replica-events'] = {
  intro:
    'Our fully branded mobile unit arrives at your event location — stadium, arena, campus, convention center, or any venue — wrapped in your company branding from the exterior signage to the interior experience. Inside, attendees step onto a scanning platform and receive a photorealistic 3D body scan in under 30 seconds. Within minutes, they receive a physical collectible replica figure (approximately 6 inches tall, full-color, high detail) plus a shareable digital 3D model they can post on social media. The social media component is where the real value lives — attendees organically post photos and videos of their replicas tagging your brand.',
  stats: [
    { value: '15+', label: 'Events' },
    { value: '99%', label: 'Satisfaction' },
    { value: '<30s', label: 'Per Scan' },
    { value: 'Unlimited', label: 'Scans Per Event' },
  ],
  includes: [
    {
      title: 'Mobile Studio',
      items: [
        'Self-contained mobile 3D scanning truck',
        'Exterior + interior fully branded',
        'Custom branding on packaging + collectibles',
        'Real-time processing + printing on-site',
      ],
    },
    {
      title: 'Attendee Experience',
      items: [
        'Photorealistic 3D body scan in under 30 seconds',
        '6-inch full-color physical collectible (delivered in minutes)',
        'Shareable digital 3D model for social',
        'Digital sharing station with branded frames + hashtags',
      ],
    },
    {
      title: 'Brand Value',
      items: [
        'Massive organic social media earned media',
        'Event staffing (scan operators + brand ambassadors)',
        'Lead capture for follow-up marketing',
        'Post-event analytics (scans, social mentions, reach, engagement)',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Book event date', body: 'Schedule the activation.' },
    { n: 2, title: 'Truck arrives branded', body: 'Wrapped in your brand identity.' },
    { n: 3, title: 'Attendees scanned', body: 'Photorealistic 3D in under 30 seconds.' },
    { n: 4, title: 'Instant collectibles + share', body: 'Physical + digital, viral by design.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BOOK ACTIVATION →',
}

// ── Resume Building ───────────────────────────────────────────────────────
RICH_CONTENT['resume-building'] = {
  intro:
    'A professionally written resume that translates your athletic experience into compelling business language — leadership, teamwork, time management, performance under pressure, goal setting, competitive drive, public speaking, media relations, and brand management become powerful professional qualifications. A customized cover letter template adaptable for different industries and roles. LinkedIn profile optimization including headline, summary, experience descriptions, skills, and recommendations strategy. Documents are formatted in ATS-compatible formats so they pass automated screening.',
  stats: [
    { value: '70+', label: 'Resumes Written' },
    { value: '93%', label: 'Satisfaction' },
    { value: '3-5d', label: 'Turnaround' },
    { value: 'ATS', label: 'Optimized' },
  ],
  includes: [
    {
      title: 'Resume',
      items: [
        'Translates athletic experience into business language',
        'ATS-compatible formatting',
        'Multiple format exports',
        'One round of revisions',
      ],
    },
    {
      title: 'Cover Letter + LinkedIn',
      items: [
        'Customized cover letter template (industry-adaptable)',
        'LinkedIn headline + summary + experience',
        'Skills + recommendations strategy',
        'Personal brand statement for networking + interviews',
      ],
    },
    {
      title: 'Career Coaching',
      items: [
        'Career coaching session included',
        'Interview tips',
        'Industry framing for your experience',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Submit background', body: 'Tell us about your career + goals.' },
    { n: 2, title: 'Writer crafts resume', body: 'Athletic-to-professional translation.' },
    { n: 3, title: 'Review + revise', body: 'One round of revisions included.' },
    { n: 4, title: 'Download formats', body: 'Multiple formats for any application.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$99', period: 'one-time payment' }],
}

// ── Interview Prep ────────────────────────────────────────────────────────
RICH_CONTENT['interview-prep'] = {
  intro:
    'Two 60-minute mock interview sessions conducted by professional career coaches who specialize in talent-to-professional transitions. Sessions simulate real interview scenarios including behavioral questions, situational questions, case studies, and industry-specific discussions. Detailed written feedback after each session covering your answer content, storytelling technique, body language, vocal delivery, eye contact, confidence level, and areas for improvement. Your coach helps you develop a library of compelling stories from your athletic career that demonstrate the qualities employers value most.',
  stats: [
    { value: '45+', label: 'Coached' },
    { value: '94%', label: 'Satisfaction' },
    { value: '2', label: '60-min Sessions' },
    { value: '50', label: 'Prep Questions' },
  ],
  includes: [
    {
      title: 'Mock Interviews',
      items: [
        'Two 60-minute mock sessions with career coach',
        'Real interview scenario simulation',
        'Behavioral + situational + case study questions',
        'Industry-specific discussion practice',
      ],
    },
    {
      title: 'Detailed Feedback',
      items: [
        'Written feedback after each session',
        'Answer content + storytelling technique',
        'Body language + vocal delivery + eye contact',
        'Confidence level + areas for improvement',
      ],
    },
    {
      title: 'Preparation Materials',
      items: [
        'Library of compelling stories from your athletic career',
        '50 most common interview questions + frameworks',
        'Smart questions to ask the interviewer',
        'Salary negotiation strategies',
        'Follow-up email templates',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Select interview type', body: 'Industry + role + format.' },
    { n: 2, title: 'Schedule sessions', body: 'Two 60-min mock interviews.' },
    { n: 3, title: 'Practice + feedback', body: 'Mock interview + detailed written feedback.' },
    { n: 4, title: 'Go in confident', body: 'Prepared with stories + frameworks.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$149', period: 'one-time payment' }],
}

// ── Business Formation ───────────────────────────────────────────────────
RICH_CONTENT['business-formation'] = {
  intro:
    'Consultation to determine the optimal entity structure — LLC, S-Corporation, C-Corporation, or sole proprietorship — based on your specific income level, liability exposure, tax situation, and growth plans. State registration and filing of formation documents (Articles of Organization or Incorporation). Federal EIN acquisition from the IRS. Operating agreement or corporate bylaws drafting customized to your situation. Registered agent service for your first year. Guidance on opening a business bank account.',
  stats: [
    { value: '50+', label: 'Entities Formed' },
    { value: '95%', label: 'Satisfaction' },
    { value: '1-2w', label: 'Filing' },
    { value: 'Year 1', label: 'Registered Agent' },
  ],
  includes: [
    {
      title: 'Entity Setup',
      items: [
        'Consultation on best entity type (LLC, S-Corp, C-Corp, sole prop)',
        'State filing of formation documents',
        'Federal EIN registration with IRS',
        'Operating agreement / corporate bylaws drafted',
      ],
    },
    {
      title: 'Year 1 Support',
      items: [
        'Registered agent service for first year',
        'Banking setup guidance',
        'Tax election filing',
        'Initial compliance calendar',
      ],
    },
    {
      title: 'Tax + Liability',
      items: [
        'Optimize self-employment tax (potentially save thousands)',
        'Limit personal liability',
        'Clean separation between personal + business',
        'Multi-state registration for brands if needed',
        'Industry-specific licensing requirements',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Consult on entity type', body: 'LLC, S-Corp, C-Corp, sole prop.' },
    { n: 2, title: 'We file documents', body: 'State + federal EIN + agreements.' },
    { n: 3, title: 'Receive formation docs', body: 'Operating agreement + bylaws + EIN.' },
    { n: 4, title: 'Banking + accounting', body: 'We guide you through setup.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$249', period: 'one-time payment' }],
}

// ── Admissions & Academic Success ────────────────────────────────────────
RICH_CONTENT['admissions-academic'] = {
  intro:
    'A dedicated admissions counselor experienced in the unique position of recruited talent navigating both academic admissions and athletic recruitment. Services include college selection strategy, application review and editing (essays, activities, supplements), standardized test strategy, financial aid and scholarship optimization, NCAA / NAIA / NJCAA eligibility guidance, recruiting timeline management, campus visit planning, transfer portal guidance, and communication coaching for conversations with college coaches.',
  stats: [
    { value: '25+', label: 'Students' },
    { value: '93%', label: 'Satisfaction' },
    { value: '1:1', label: 'Counselor' },
    { value: 'NCAA+NAIA+NJCAA', label: 'Eligibility' },
  ],
  includes: [
    {
      title: 'Admissions Strategy',
      items: [
        'College selection strategy (academic + athletic + financial fit)',
        'Application review + editing (essays, activities, supplements)',
        'Standardized test strategy + prep referrals',
        'Campus visit planning + evaluation criteria',
      ],
    },
    {
      title: 'Financial Aid',
      items: [
        'Scholarship search + optimization (athletic + academic + need-based)',
        'Minimize out-of-pocket cost',
        'Financial aid application guidance',
      ],
    },
    {
      title: 'Athletic + Transfer',
      items: [
        'NCAA, NAIA, NJCAA eligibility guidance',
        'Recruiting timeline management',
        'Transfer portal guidance for current talent',
        'Communication coaching with college coaches',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Free assessment', body: 'Initial call to map your situation.' },
    { n: 2, title: 'Custom academic plan', body: 'Aligned to athletic + academic goals.' },
    { n: 3, title: 'Ongoing support', body: 'Counselor available through application cycle.' },
    { n: 4, title: 'Results tracking', body: 'See your progression toward admit + commit.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BOOK ASSESSMENT →',
}

// ── Intelligent Job Search ────────────────────────────────────────────────
RICH_CONTENT['job-search-suite'] = {
  intro:
    'Professional resume and cover letter creation that translates your athletic experience into compelling business qualifications. Job search strategy development targeting industries, companies, and roles that align with your skills, interests, and values. Employer matching through our network of companies that actively recruit former talent. Structured interview preparation with mock interviews, feedback, and coaching. Salary research and negotiation strategy. LinkedIn profile optimization and networking strategy.',
  stats: [
    { value: '30+', label: 'Placed' },
    { value: '91%', label: 'Satisfaction' },
    { value: 'Instant', label: 'Start' },
    { value: 'Multi-industry', label: 'Network' },
  ],
  includes: [
    {
      title: 'Application Materials',
      items: [
        'Professional resume + cover letter',
        'Athletic experience → business language translation',
        'LinkedIn profile optimization',
        'Networking strategy',
      ],
    },
    {
      title: 'Search + Matching',
      items: [
        'Targeted industry + company + role strategy',
        'Employer matching from our network',
        'Talent-friendly companies that value athletic background',
        'Job application tracking tools',
      ],
    },
    {
      title: 'Interview + Negotiation',
      items: [
        'Structured interview preparation with mock interviews',
        'Salary research + negotiation strategy',
        'Career mentoring from target-industry professionals',
        'Weekly check-in calls to keep search on track',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Complete career profile', body: 'Interests + skills + goals.' },
    { n: 2, title: 'Intelligent matching', body: 'Our engine matches you with opportunities.' },
    { n: 3, title: 'Apply', body: 'Optimized materials for each application.' },
    { n: 4, title: 'Track + manage', body: 'Application tracking + weekly check-ins.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'START SEARCH →',
}

// ── Internships & Mentorships ────────────────────────────────────────────
RICH_CONTENT['internship-mentorship'] = {
  intro:
    'A career assessment identifying your interests, skills, strengths, and professional goals. Matching with internship opportunities in our network spanning finance, marketing, technology, media, sports management, real estate, consulting, and entrepreneurship. Each placement includes a structured learning plan with defined objectives and milestones. A dedicated industry mentor — an experienced professional in your field of interest — who provides one-on-one guidance, career advice, networking introductions, and honest feedback throughout your internship.',
  stats: [
    { value: '40+', label: 'Placements' },
    { value: '94%', label: 'Satisfaction' },
    { value: 'Flexible', label: 'For Current Talent' },
    { value: '1:1', label: 'Industry Mentor' },
  ],
  includes: [
    {
      title: 'Career Assessment',
      items: [
        'Interest + skill + strength + goal identification',
        'Industry matching across finance, marketing, tech, media, sports, real estate, consulting',
        'Structured learning plan with objectives + milestones',
      ],
    },
    {
      title: 'Mentorship',
      items: [
        'Dedicated industry mentor (experienced professional)',
        '1-on-1 guidance + career advice + introductions',
        'Honest feedback throughout internship',
        'Monthly check-ins + on-demand access',
      ],
    },
    {
      title: 'Career Planning',
      items: [
        'Flexible arrangements for current talent (remote, part-time, off-season, project-based)',
        'Resume + LinkedIn updates reflecting internship',
        'Post-internship evaluation + career planning session',
        'Head start on professional career while still competing',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Express interest + goals', body: 'Tell us where you want to go.' },
    { n: 2, title: 'Matched with opportunity', body: 'Network spans many industries.' },
    { n: 3, title: 'Interview + onboard', body: 'Structured learning plan in place.' },
    { n: 4, title: 'Grow with mentor', body: 'Industry guidance + introductions.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'GET MATCHED →',
}

// ── Performance Nutrition ────────────────────────────────────────────────
RICH_CONTENT['performance-nutrition'] = {
  intro:
    'A comprehensive nutritional assessment including current diet analysis, body composition measurement, training load evaluation, competition schedule review, and goal setting. Your certified sports nutritionist creates a detailed meal plan covering daily macronutrient targets, pre-workout fueling, post-workout recovery, game-day nutrition strategy, travel and away-game eating plans, supplement recommendations based on evidence, hydration protocols, and weekly grocery lists with meal prep guides. Your plan is adjusted every two weeks based on your feedback.',
  stats: [
    { value: '55+', label: 'Athletes' },
    { value: '94%', label: 'Satisfaction' },
    { value: '1wk', label: 'Plan Delivery' },
    { value: 'Bi-weekly', label: 'Adjustments' },
  ],
  includes: [
    {
      title: 'Nutritional Assessment',
      items: [
        'Current diet analysis',
        'Body composition measurement',
        'Training load + competition schedule evaluation',
        'Goal setting (build muscle, cut weight, endurance, recovery)',
      ],
    },
    {
      title: 'Meal Plan',
      items: [
        'Daily macros + calorie goals',
        'Pre-workout fueling protocols (timed to training)',
        'Post-workout recovery nutrition',
        'Game-day nutrition strategy (before, during, after)',
        'Travel + away-game eating plans',
      ],
    },
    {
      title: 'Support Materials',
      items: [
        'Supplement recommendations (evidence-based, not hype)',
        'Hydration protocols specific to your sport + climate',
        'Weekly grocery lists + meal prep guides',
        'Bi-weekly plan adjustments based on results',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Nutrition assessment', body: 'Comprehensive evaluation of current state.' },
    { n: 2, title: 'Custom plan delivered', body: 'Sport-specific, position-specific, goal-specific.' },
    { n: 3, title: 'Follow plan + support', body: 'Ongoing nutritionist support.' },
    { n: 4, title: 'Adjust based on results', body: 'Bi-weekly tuning to your results.' },
  ],
  faq: [],
  pricing: [{ label: 'One-time', amount: '$199', period: 'one-time setup + plan' }],
}

// ── Healthcare & Wellness ────────────────────────────────────────────────
RICH_CONTENT['healthcare-wellness'] = {
  intro:
    'Access to telehealth consultations with sports medicine physicians and general practitioners available 24/7 via video or phone. Mental health resources including confidential counseling referrals for performance anxiety, depression, transition stress, and other concerns talent commonly face. Wellness screening and preventive health assessments. Personalized health coaching for sleep optimization, stress management, and lifestyle habits. Insurance navigation assistance.',
  stats: [
    { value: '40+', label: 'Members' },
    { value: '92%', label: 'Satisfaction' },
    { value: '24/7', label: 'Telehealth' },
    { value: 'Vetted', label: 'Referral Network' },
  ],
  includes: [
    {
      title: 'Medical Access',
      items: [
        '24/7 telehealth with sports medicine + GP physicians',
        'Wellness screening + preventive assessments',
        'Insurance navigation + in-network provider matching',
        'Preventive care guidance + screenings + vaccinations',
      ],
    },
    {
      title: 'Mental Health',
      items: [
        'Confidential counseling referrals',
        'Performance anxiety + depression support',
        'Transition stress (post-career changes)',
        'Health coaching for sleep + stress + lifestyle',
      ],
    },
    {
      title: 'Recovery + Specialists',
      items: [
        'Injury recovery support — physical therapists + orthopedic + rehab',
        'Curated referral network (vetted sports medicine pros)',
        'Sports psychologists + chiropractors + massage + athletic trainers',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Complete wellness profile', body: 'Quick onboarding.' },
    { n: 2, title: 'Access resources', body: 'Telehealth + mental health + specialists.' },
    { n: 3, title: 'Schedule consultations', body: 'Video, phone, or in-person.' },
    { n: 4, title: 'Ongoing support', body: 'Wellness coaching + recovery support.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'ACCESS RESOURCES →',
}

// ── Performance Improvement ───────────────────────────────────────────────
RICH_CONTENT['performance-improvement'] = {
  intro:
    'A comprehensive performance assessment including functional movement screening, sport-specific skill evaluation, strength and power testing, speed and agility benchmarks, flexibility and mobility assessment, and video analysis of your competition performance. Based on the assessment, your specialist designs a fully customized training program covering strength and conditioning (periodized for your season), speed and agility development, power and explosiveness training, sport psychology, recovery protocols, injury prevention, and detailed progress tracking.',
  stats: [
    { value: '35+', label: 'Athletes' },
    { value: '93%', label: 'Satisfaction' },
    { value: '1:1', label: 'Specialist' },
    { value: 'Evidence-based', label: 'Methodology' },
  ],
  includes: [
    {
      title: 'Performance Assessment',
      items: [
        'Functional movement screening',
        'Sport-specific skill evaluation',
        'Strength + power + speed + agility testing',
        'Flexibility + mobility assessment',
        'Video analysis of competition performance',
      ],
    },
    {
      title: 'Custom Training Program',
      items: [
        'Strength + conditioning (periodized for your season)',
        'Speed + agility development (sport-specific drills)',
        'Power + explosiveness training',
        'Sport psychology (mental toughness, visualization, pre-comp routines)',
      ],
    },
    {
      title: 'Recovery + Prevention',
      items: [
        'Recovery protocols (sleep, active recovery, soft tissue, nutrition timing)',
        'Injury prevention (muscle imbalances + movement dysfunction)',
        'Progress tracking with regular reassessment',
        'Programs designed to complement (not conflict with) team training',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Initial evaluation', body: 'Comprehensive baseline.' },
    { n: 2, title: 'Custom program design', body: 'Built for your goals + season.' },
    { n: 3, title: 'Implement with coaching', body: 'Ongoing coaching support.' },
    { n: 4, title: 'Track + optimize', body: 'Measure + adjust the metrics that matter.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'BOOK ASSESSMENT →',
}

// ── Financial Wellness (Employees) ───────────────────────────────────────
RICH_CONTENT['financial-wellness-employees'] = {
  intro:
    'A turnkey employee benefit including one-on-one financial coaching sessions for each enrolled employee with a certified financial planner, retirement planning workshops and individual 401(k)/IRA optimization, personalized budgeting tools and spending analysis, student loan repayment guidance and refinancing support, tax preparation assistance and access to tax professionals, credit building education and monitoring, emergency savings programs, and regular financial wellness workshops. Financial stress is the number one cause of workplace distraction and absenteeism.',
  stats: [
    { value: '15+', label: 'Companies' },
    { value: '94%', label: 'Satisfaction' },
    { value: '25%', label: 'Stress Reduction' },
    { value: '18%', label: 'Retention Lift' },
  ],
  includes: [
    {
      title: 'Employee Benefits',
      items: [
        '1-on-1 coaching with certified financial planner',
        'Retirement planning workshops + 401(k)/IRA optimization',
        'Personalized budgeting tools + spending analysis',
        'Student loan repayment + refinancing support',
        'Credit building education + monitoring',
      ],
    },
    {
      title: 'Workshops + Tools',
      items: [
        'Regular wellness workshops (investing basics, homebuying, estate planning)',
        'Emergency savings programs',
        'Tax preparation assistance + access to tax professionals',
      ],
    },
    {
      title: 'Company Admin',
      items: [
        'Admin dashboard tracking enrollment + utilization + satisfaction',
        'Per-employee monthly pricing',
        'Simple setup',
        'Program ROI metrics',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Company enrollment', body: 'Quick org-level setup.' },
    { n: 2, title: 'Employee onboarding', body: 'Each employee enrolls individually.' },
    { n: 3, title: 'Access programs + coaching', body: 'Employees use what they need.' },
    { n: 4, title: 'Track utilization', body: 'Aggregate analytics for HR.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

// ── Legal Support (Employees) ─────────────────────────────────────────────
RICH_CONTENT['legal-support-employees'] = {
  intro:
    'Each enrolled employee receives access to a network of attorneys for personal legal needs including contract review, estate planning, real estate transactions, family law consultation, traffic and criminal matters, consumer disputes, landlord-tenant issues, identity theft resolution, and general legal advice. Consultations are confidential — employers never see what legal services employees use. The benefit includes a simple online portal for scheduling consultations and unlimited phone consultations on new legal matters.',
  stats: [
    { value: '10+', label: 'Companies' },
    { value: '93%', label: 'Satisfaction' },
    { value: 'Unlimited', label: 'Phone Consults' },
    { value: 'Confidential', label: 'For Employees' },
  ],
  includes: [
    {
      title: 'Personal Legal',
      items: [
        'Contract review',
        'Estate planning (wills, trusts, POAs, healthcare directives)',
        'Real estate (home buying, selling, lease review)',
        'Family law consultation (divorce, custody, adoption)',
      ],
    },
    {
      title: 'Daily Life Legal',
      items: [
        'Traffic + criminal matters',
        'Consumer disputes',
        'Landlord-tenant issues',
        'Identity theft resolution',
        'General legal advice',
      ],
    },
    {
      title: 'Access',
      items: [
        'Online portal for scheduling + document review',
        'Unlimited phone consultations on new matters',
        'Discounted rates on extended representation',
        'Confidential — HR never sees usage details',
        'HR dashboard for aggregate utilization',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Company enrollment', body: 'Quick org-level setup.' },
    { n: 2, title: 'Employees get access', body: 'Access code distributed to team.' },
    { n: 3, title: 'On-demand legal support', body: 'Employees use when needed.' },
    { n: 4, title: 'Track aggregate utilization', body: 'See engagement (not specifics).' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

// ── Identity Theft Protection (Employees) ────────────────────────────────
RICH_CONTENT['identity-theft-employees'] = {
  intro:
    'Enterprise identity theft monitoring and recovery as an employee benefit. Per enrolled employee: continuous monitoring of SSN, email addresses, and personal data across dark web marketplaces, data breach databases, public records, and credit bureau activity. Real-time alerts for suspicious activity. If any employee experiences identity theft, a dedicated recovery specialist handles the entire resolution process. Identity theft insurance covers up to $1 million in expenses per incident.',
  stats: [
    { value: '10+', label: 'Companies' },
    { value: '95%', label: 'Satisfaction' },
    { value: '$1M', label: 'Insurance Per Employee' },
    { value: 'Family Plans', label: 'Available' },
  ],
  includes: [
    {
      title: 'Continuous Monitoring',
      items: [
        'SSN + email + personal data on dark web + breach databases',
        'Public records + credit bureau activity',
        'Suspicious activity detection',
        'Family coverage available',
      ],
    },
    {
      title: 'Real-Time Alerts',
      items: [
        'New account openings',
        'Credit inquiries',
        'Address changes',
        'Dark web exposure',
      ],
    },
    {
      title: 'Recovery + Insurance',
      items: [
        'Dedicated recovery specialist per case',
        'Full resolution support (reports, creditors, disputes)',
        '$1M identity theft insurance per incident',
        'Confidential — only aggregate metrics shown to HR',
        'HR dashboard for enrollment + program utilization',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Company enrollment', body: 'Quick org-level setup.' },
    { n: 2, title: 'Employee enrollment', body: 'Each employee enrolls.' },
    { n: 3, title: 'Continuous monitoring', body: 'Always-on protection.' },
    { n: 4, title: 'Alerts + recovery', body: 'Real-time alerts + specialist on demand.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

// ── Data Removal (Employees) ──────────────────────────────────────────────
RICH_CONTENT['data-removal-employees'] = {
  intro:
    'For each enrolled employee, our system scans 150+ data broker sites identifying where their personal information is exposed — home addresses, phone numbers, email addresses, family member names, salary estimates, and other sensitive data. Individual removal requests are submitted to each broker. Ongoing monthly monitoring detects and removes new listings as they appear. Especially valuable for executives, public-facing employees, salespeople, and anyone handling sensitive company data.',
  stats: [
    { value: '10+', label: 'Companies' },
    { value: '93%', label: 'Satisfaction' },
    { value: '150+', label: 'Broker Sites' },
    { value: 'Quarterly', label: 'Reports' },
  ],
  includes: [
    {
      title: 'Employee Data Scans',
      items: [
        'Scan 150+ data brokers per employee',
        'Identify exposed addresses, phones, emails, family names, salary estimates',
        'Detailed exposure report per employee',
      ],
    },
    {
      title: 'Removal + Re-removal',
      items: [
        'Individual removal requests per broker',
        'Ongoing monthly monitoring',
        'Re-removal as new listings appear',
        'Re-removal guarantee',
      ],
    },
    {
      title: 'Risk Reduction',
      items: [
        'Quarterly privacy reports per employee',
        'Reduce phishing + social engineering risk',
        'Stalking + targeted attack mitigation',
        'HR dashboard for aggregate enrollment + effectiveness',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Company enrollment', body: 'Quick org-level setup.' },
    { n: 2, title: 'Employee data scan', body: 'Initial scan per employee.' },
    { n: 3, title: 'Submit removal requests', body: 'One per broker per employee.' },
    { n: 4, title: 'Monitor + maintain privacy', body: 'Ongoing protection.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

// ── Tax Services (Employees) ──────────────────────────────────────────────
RICH_CONTENT['tax-services-employees'] = {
  intro:
    'Professional tax preparation services offered as an employee benefit. Per enrolled employee: access to certified tax professionals who handle federal and state income tax return preparation, deduction identification and optimization, prior year amendment review, estimated tax payment calculations for employees with side income, and year-round tax planning support. For companies with employees in multiple states or with complex compensation structures, we handle multi-state filing requirements and compensation-specific tax issues.',
  stats: [
    { value: '15+', label: 'Companies' },
    { value: '96%', label: 'Satisfaction' },
    { value: '5-7d', label: 'Return Turnaround' },
    { value: 'Year-round', label: 'Support' },
  ],
  includes: [
    {
      title: 'Employee Tax Prep',
      items: [
        'Federal + state income tax return preparation',
        'Deduction identification + optimization',
        'Prior year amendment review',
        'Estimated tax calculations for side income',
        'Year-round tax planning support',
      ],
    },
    {
      title: 'Multi-State + Complex Comp',
      items: [
        'Multi-state filing for talent / brand employees who work across states',
        'Equity compensation tax issues',
        'Bonus + commission tax structuring',
        'Audit protection',
      ],
    },
    {
      title: 'Employee Experience',
      items: [
        'Secure portal for document upload + communication',
        '5-7 day return preparation',
        'Rush filing during tax season',
        'E-filing + direct deposit setup',
        'HR dashboard + bulk pricing',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Company enrollment', body: 'Quick org-level setup.' },
    { n: 2, title: 'Employees upload docs', body: 'Secure portal.' },
    { n: 3, title: 'Tax specialist prepares', body: 'Federal + state + planning.' },
    { n: 4, title: 'Review, approve, file', body: 'E-file + direct deposit.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

// ── Insurance Services (Employees) ────────────────────────────────────────
RICH_CONTENT['insurance-employees'] = {
  intro:
    'An independent insurance advisor who shops your coverage across multiple top-rated carriers to find the best combination of coverage and cost. Products include group health insurance (medical, dental, vision), life insurance and accidental death, short-term and long-term disability, supplemental insurance (accident, critical illness, hospital indemnity), HSA and FSA accounts, and workers compensation. We handle plan design consulting, carrier negotiations, open enrollment communication, COBRA administration, ACA compliance, and claims resolution assistance.',
  stats: [
    { value: '10+', label: 'Companies' },
    { value: '94%', label: 'Satisfaction' },
    { value: '2-4w', label: 'Setup' },
    { value: 'Multi-carrier', label: 'Shopping' },
  ],
  includes: [
    {
      title: 'Coverage Types',
      items: [
        'Group health (medical, dental, vision)',
        'Life insurance + accidental death',
        'Short + long-term disability',
        'Supplemental (accident, critical illness, hospital indemnity)',
        'HSA + FSA accounts',
        'Workers compensation',
      ],
    },
    {
      title: 'Plan Design',
      items: [
        'Plan design consulting (coverage vs budget)',
        'Carrier negotiations',
        'Multi-carrier shopping for best rates',
        'Custom benefit package design',
      ],
    },
    {
      title: 'Administration',
      items: [
        'Open enrollment communication + employee education',
        'Enrollment admin + new hire onboarding',
        'COBRA administration + ACA compliance',
        'Claims resolution assistance',
        'Annual plan review + renewal negotiations',
        'HR portal + voluntary benefits options',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Consultation', body: 'Define benefit needs + budget.' },
    { n: 2, title: 'Custom package design', body: 'Plans + carriers shopped for you.' },
    { n: 3, title: 'Open enrollment setup', body: 'Communication + education + onboarding.' },
    { n: 4, title: 'Ongoing admin support', body: 'Claims + renewals + compliance.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

// ── Legal Document Creation (Employees) ───────────────────────────────────
RICH_CONTENT['legal-docs-employees'] = {
  intro:
    'Personal legal document creation as an employee benefit. Per enrolled employee: access to an online platform for generating state-compliant legal documents including last will and testament, living will and healthcare directive, financial power of attorney, healthcare power of attorney, revocable living trust, rental and lease agreements, bill of sale, promissory notes, and other common personal legal documents. Each document is generated through a guided questionnaire that collects the specific details needed for their state and situation. Documents are reviewed for legal accuracy.',
  stats: [
    { value: '10+', label: 'Companies' },
    { value: '92%', label: 'Satisfaction' },
    { value: '5-7d', label: 'Delivery' },
    { value: 'State-compliant', label: 'Documents' },
  ],
  includes: [
    {
      title: 'Estate Planning Docs',
      items: [
        'Last will and testament',
        'Living will + healthcare directive',
        'Financial power of attorney',
        'Healthcare power of attorney',
        'Revocable living trust',
      ],
    },
    {
      title: 'Personal Contracts',
      items: [
        'Rental and lease agreements',
        'Bill of sale + promissory notes',
        'Real estate documents',
        'Other common personal legal documents',
      ],
    },
    {
      title: 'Process',
      items: [
        'Guided questionnaire (state + situation specific)',
        'Attorney review for legal accuracy',
        'Integrated e-signature for all parties',
        'Secure storage in employee portal',
        'Annual updates',
        'HR dashboard',
      ],
    },
  ],
  steps: [
    { n: 1, title: 'Company enrollment', body: 'Quick org-level setup.' },
    { n: 2, title: 'Employees request documents', body: 'Online portal access.' },
    { n: 3, title: 'Attorney prepares + reviews', body: 'State-compliant + accurate.' },
    { n: 4, title: 'Finalized + delivered', body: 'E-sign + securely stored.' },
  ],
  faq: [],
  pricing: [],
  ctaLabel: 'REQUEST QUOTE →',
}

export function getServiceContent(slug: string): ServiceRichContent | null {
  return RICH_CONTENT[slug] ?? null
}
