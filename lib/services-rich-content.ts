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

export function getServiceContent(slug: string): ServiceRichContent | null {
  return RICH_CONTENT[slug] ?? null
}
