import Image from 'next/image'
import type { ThemeTokens } from '@/lib/site-builder/theme-presets'
import { parseIcon } from '@/lib/site-builder/emoji-library'
import {
  GuestbookForm,
  PollForm,
  EmailCaptureForm,
  ContactForm,
} from '@/components/site/public-forms'
import {
  TipJarCheckout,
  MerchBuyButton,
  TierJoinButton,
  ShoutoutForm as ShoutoutCheckoutForm,
} from '@/components/site/checkout-buttons'

export interface SiteBlock {
  id: string
  block_type: string
  position: number
  props: Record<string, unknown>
}

export interface SiteData {
  siteId?: string
  products?: Array<{ id: string; name: string; description: string | null; price_cents: number; currency: string; image_url: string | null }>
  tiers?: Array<{ id: string; name: string; description: string | null; price_cents: number; billing_interval: string; perks: string[] }>
  rewards?: Array<{ id: string; name: string; description: string | null; image_url: string | null; unlock_amount_cents: number; reward_type: string }>
  guestbookEntries?: Array<{ id: string; display_name: string; message: string; created_at: string; block_id: string | null }>
}

interface BlockRendererProps {
  block: SiteBlock
  theme: { primary: string; secondary: string } | ThemeTokens
  social?: Record<string, string>
  siteData?: SiteData
  interactive?: boolean
}

function isFullTokens(t: BlockRendererProps['theme']): t is ThemeTokens {
  return typeof (t as ThemeTokens).bg_color === 'string'
}

function asTokens(t: BlockRendererProps['theme']): ThemeTokens {
  if (isFullTokens(t)) return t
  // Promote the (primary, secondary) pair to a minimal ThemeTokens shape so
  // downstream blocks don't need to branch.
  return {
    mode: 'dark',
    primary: t.primary,
    secondary: t.secondary,
    accent: t.primary,
    bg_color: t.secondary,
    card_bg: '#171717',
    border_color: '#262626',
    text_color: '#ffffff',
    heading_color: '#ffffff',
    muted_color: '#a3a3a3',
    nav_bg: t.secondary,
    nav_text: '#ffffff',
    font_heading: 'Inter',
    font_body: 'Inter',
    heading_weight: 900,
    body_weight: 400,
    base_font_size: 16,
    nav_font_size: 13,
    button_style: 'filled',
    button_radius: 8,
    card_radius: 12,
    card_shadow: 'md',
    nav_sticky: true,
    nav_transparent: false,
    nav_hover_style: 'background',
    hero_height: '70vh',
    hero_overlay_color: '#000000',
    hero_overlay_opacity: 0.4,
    section_padding: '4rem',
    content_width: '1200px',
  }
}

export function BlockRenderer({ block, theme, social, siteData, interactive }: BlockRendererProps) {
  const tokens = asTokens(theme)
  switch (block.block_type) {
    case 'hero':
      return <HeroBlock props={block.props} tokens={tokens} />
    case 'heading':
      return <HeadingBlock props={block.props} tokens={tokens} />
    case 'text':
      return <TextBlock props={block.props} tokens={tokens} />
    case 'image':
      return <ImageBlock props={block.props} />
    case 'gallery':
      return <GalleryBlock props={block.props} />
    case 'video':
      return <VideoBlock props={block.props} />
    case 'cta':
      return <CtaBlock props={block.props} tokens={tokens} />
    case 'faq':
      return <FaqBlock props={block.props} tokens={tokens} />
    case 'stats':
      return <StatsBlock props={block.props} tokens={tokens} />
    case 'achievements':
      return <AchievementsBlock props={block.props} tokens={tokens} />
    case 'testimonial':
      return <TestimonialBlock props={block.props} tokens={tokens} />
    case 'sponsors':
      return <SponsorsBlock props={block.props} />
    case 'links':
      return <LinksBlock props={block.props} tokens={tokens} />
    case 'schedule':
      return <ScheduleBlock props={block.props} tokens={tokens} />
    case 'contact_form':
      return (
        <ContactFormBlock
          props={block.props}
          tokens={tokens}
          siteId={siteData?.siteId}
          blockId={block.id}
          interactive={interactive}
        />
      )
    case 'email_capture':
      return (
        <EmailCaptureBlock
          props={block.props}
          tokens={tokens}
          siteId={siteData?.siteId}
          interactive={interactive}
        />
      )
    case 'event_countdown':
    case 'countdown':
      return <CountdownBlock props={block.props} tokens={tokens} />
    case 'booking':
      return <BookingBlock props={block.props} />
    case 'map':
      return <MapBlock props={block.props} />
    case 'social_feed':
      return <SocialFeedBlock props={block.props} social={social} tokens={tokens} />
    case 'social_embed':
      return <SocialEmbedBlock props={block.props} />
    case 'blog_feed':
      return <BlogFeedStubBlock props={block.props} />
    case 'columns':
      return <ColumnsBlock props={block.props} tokens={tokens} />
    case 'spacer':
      return <SpacerBlock props={block.props} />
    case 'divider':
      return <DividerBlock tokens={tokens} />
    case 'html':
      return <HtmlBlock props={block.props} />
    case 'navigation':
      return <NavStubBlock props={block.props} />

    // ── Fan blocks ──────────────────────────────────────────────────────
    case 'tip_jar':
      return (
        <TipJarBlock
          props={block.props}
          tokens={tokens}
          siteId={siteData?.siteId}
          blockId={block.id}
          interactive={interactive}
        />
      )
    case 'fan_poll':
      return (
        <FanPollBlock
          props={block.props}
          tokens={tokens}
          siteId={siteData?.siteId}
          blockId={block.id}
          interactive={interactive}
        />
      )
    case 'guestbook':
      return (
        <GuestbookBlock
          props={block.props}
          tokens={tokens}
          siteId={siteData?.siteId}
          blockId={block.id}
          entries={siteData?.guestbookEntries?.filter((e) => !e.block_id || e.block_id === block.id)}
          interactive={interactive}
        />
      )
    case 'supporters_wall':
      return <SupportersWallBlock props={block.props} tokens={tokens} />
    case 'fan_leaderboard':
      return <FanLeaderboardBlock props={block.props} tokens={tokens} />
    case 'milestones':
      return <MilestonesBlock props={block.props} tokens={tokens} />
    case 'supporter_streak':
      return <SupporterStreakBlock props={block.props} tokens={tokens} />
    case 'content_drip':
      return <ContentDripBlock props={block.props} tokens={tokens} />
    case 'referral':
      return <ReferralBlock props={block.props} tokens={tokens} />
    case 'activity_feed':
      return <ActivityFeedBlock props={block.props} tokens={tokens} />
    case 'revenue_ticker':
      return <RevenueTickerBlock props={block.props} tokens={tokens} />
    case 'fan_portal':
      return <FanPortalBlock props={block.props} tokens={tokens} />
    case 'my_purchases':
      return <FanScopedBlock title={getStr(block.props, 'title', 'My purchases')} note="Your recent orders will appear here once you sign in." tokens={tokens} />
    case 'my_rewards':
      return <FanScopedBlock title={getStr(block.props, 'title', 'My rewards')} note="Rewards you've unlocked will appear here." tokens={tokens} />
    case 'my_card':
      return <FanScopedBlock title={getStr(block.props, 'title', 'My supporter card')} note="Your personalized supporter card will render here." tokens={tokens} />
    case 'my_membership':
      return <FanScopedBlock title={getStr(block.props, 'title', 'My membership')} note="Membership status + manage subscription." tokens={tokens} />
    case 'my_activity':
      return <FanScopedBlock title={getStr(block.props, 'title', 'My activity')} note="Lifetime support summary across orders, tips, and engagement." tokens={tokens} />
    case 'my_referrals':
      return <FanScopedBlock title={getStr(block.props, 'title', 'My referrals')} note="Your referral link + earnings breakdown." tokens={tokens} />
    case 'gift_tip':
      return <GiftTipBlock props={block.props} tokens={tokens} />
    case 'rewards_showcase':
      return <RewardsShowcaseBlock props={block.props} tokens={tokens} rewards={siteData?.rewards} />

    // ── Revenue blocks ──────────────────────────────────────────────────
    case 'merch':
      return (
        <MerchBlock
          props={block.props}
          tokens={tokens}
          products={siteData?.products}
          siteId={siteData?.siteId}
          interactive={interactive}
        />
      )
    case 'shoutout_request':
      return (
        <ShoutoutRequestBlock
          props={block.props}
          tokens={tokens}
          siteId={siteData?.siteId}
          blockId={block.id}
          interactive={interactive}
        />
      )
    case 'membership_tiers':
      return (
        <MembershipTiersBlock
          props={block.props}
          tokens={tokens}
          tiers={siteData?.tiers}
          siteId={siteData?.siteId}
          interactive={interactive}
        />
      )

    default:
      return null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStr(p: Record<string, unknown>, k: string, d = ''): string {
  const v = p[k]
  return typeof v === 'string' ? v : d
}
function getNum(p: Record<string, unknown>, k: string, d = 0): number {
  const v = p[k]
  return typeof v === 'number' ? v : d
}
function getBool(p: Record<string, unknown>, k: string, d = false): boolean {
  const v = p[k]
  return typeof v === 'boolean' ? v : d
}
function getArr<T>(p: Record<string, unknown>, k: string): T[] {
  const v = p[k]
  return Array.isArray(v) ? (v as T[]) : []
}

function Section({
  children,
  bg,
  pad = true,
  maxWidth = '1200px',
}: {
  children: React.ReactNode
  bg?: string
  pad?: boolean
  maxWidth?: string
}) {
  return (
    <section style={{ background: bg ?? 'transparent' }} className={pad ? 'px-6 py-12' : ''}>
      <div className="mx-auto" style={{ maxWidth }}>
        {children}
      </div>
    </section>
  )
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

function HeroBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const heading = getStr(props, 'heading', 'Your Name')
  const subheading = getStr(props, 'subheading')
  const bgImage = getStr(props, 'bg_image')
  const bgPosition = getStr(props, 'bg_position', 'center center')
  const ctaText = getStr(props, 'cta_text')
  const ctaUrl = getStr(props, 'cta_url')
  const overlayColor = getStr(props, 'overlay_color', '#000000')
  const overlayOpacity = getNum(props, 'overlay_opacity', 0.4)
  const height = getStr(props, 'height', '70vh')
  const textAlign = getStr(props, 'text_align', 'center') as 'left' | 'center' | 'right'

  return (
    <section
      className="relative flex items-center"
      style={{
        minHeight: height,
        background: bgImage ? undefined : tokens.secondary,
      }}
    >
      {bgImage && (
        <Image
          src={bgImage}
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: bgPosition }}
          unoptimized
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: overlayColor, opacity: bgImage ? overlayOpacity : 0 }}
      />
      <div
        className="relative w-full px-6 py-16"
        style={{ textAlign }}
      >
        <div className="mx-auto" style={{ maxWidth: '1100px' }}>
          <h1
            className="text-5xl font-black tracking-tight sm:text-7xl"
            style={{
              fontFamily: tokens.font_heading,
              color: tokens.heading_color,
              fontWeight: tokens.heading_weight,
            }}
          >
            {heading}
          </h1>
          {subheading && (
            <p
              className="mt-6 text-lg"
              style={{ color: tokens.primary, fontFamily: tokens.font_body }}
            >
              {subheading}
            </p>
          )}
          {ctaText && ctaUrl && (
            <a
              href={ctaUrl}
              className="mt-8 inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
              style={{
                background: tokens.button_style === 'filled' ? tokens.primary : 'transparent',
                color: tokens.button_style === 'filled' ? tokens.secondary : tokens.primary,
                border: `2px solid ${tokens.primary}`,
                borderRadius: tokens.button_radius,
                fontFamily: tokens.font_heading,
              }}
            >
              {ctaText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function HeadingBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const content = getStr(props, 'content', 'Section heading')
  const size = getStr(props, 'size', 'h2') as 'h1' | 'h2' | 'h3' | 'h4'
  const alignment = getStr(props, 'alignment', 'left') as 'left' | 'center' | 'right'
  const sizeClass = {
    h1: 'text-5xl sm:text-6xl',
    h2: 'text-3xl sm:text-4xl',
    h3: 'text-2xl sm:text-3xl',
    h4: 'text-xl sm:text-2xl',
  }[size]
  const style = {
    textAlign: alignment,
    fontFamily: tokens.font_heading,
    color: tokens.heading_color,
    fontWeight: tokens.heading_weight,
  } as const
  const cls = `${sizeClass} font-black tracking-tight`
  return (
    <Section>
      {size === 'h1' ? (
        <h1 className={cls} style={style}>{content}</h1>
      ) : size === 'h2' ? (
        <h2 className={cls} style={style}>{content}</h2>
      ) : size === 'h3' ? (
        <h3 className={cls} style={style}>{content}</h3>
      ) : (
        <h4 className={cls} style={style}>{content}</h4>
      )}
    </Section>
  )
}

function TextBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const content = getStr(props, 'content', '')
  const alignment = getStr(props, 'alignment', 'left') as 'left' | 'center' | 'right'
  const maxWidth = getStr(props, 'max_width', '720px')
  return (
    <section className="px-6 py-12">
      <div
        className="mx-auto leading-relaxed"
        style={{
          maxWidth,
          textAlign: alignment,
          color: tokens.text_color,
          fontFamily: tokens.font_body,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  )
}

function ImageBlock({ props }: { props: Record<string, unknown> }) {
  const url = getStr(props, 'url')
  const alt = getStr(props, 'alt')
  const caption = getStr(props, 'caption')
  const maxWidth = getStr(props, 'max_width', '960px')
  const alignment = getStr(props, 'alignment', 'center') as 'left' | 'center' | 'right'
  const radius = getNum(props, 'border_radius', 8)
  if (!url) return null
  return (
    <section className="px-6 py-8">
      <div
        className="mx-auto"
        style={{
          maxWidth,
          marginLeft: alignment === 'left' ? 0 : 'auto',
          marginRight: alignment === 'right' ? 0 : 'auto',
        }}
      >
        <Image
          src={url}
          alt={alt}
          width={1200}
          height={800}
          className="h-auto w-full object-cover"
          style={{ borderRadius: radius }}
          unoptimized
        />
        {caption && (
          <p className="mt-2 text-center text-xs text-muted-foreground">{caption}</p>
        )}
      </div>
    </section>
  )
}

function GalleryBlock({ props }: { props: Record<string, unknown> }) {
  const title = getStr(props, 'title')
  const columns = Math.min(6, Math.max(1, getNum(props, 'columns', 3)))
  const images = getArr<{ url: string; alt?: string }>(props, 'images')
  if (!images.length && !title) return null
  return (
    <Section>
      {title && <h3 className="mb-6 text-2xl font-bold">{title}</h3>}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {images.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-md">
            {img.url && (
              <Image
                src={img.url}
                alt={img.alt ?? ''}
                width={400}
                height={400}
                className="h-full w-full object-cover"
                unoptimized
              />
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

function VideoBlock({ props }: { props: Record<string, unknown> }) {
  const url = getStr(props, 'url')
  const title = getStr(props, 'title')
  const aspectRatio = getStr(props, 'aspect_ratio', '16/9')
  if (!url) return null
  const embed = normalizeVideoEmbed(url)
  return (
    <Section>
      {title && <h3 className="mb-4 text-2xl font-bold">{title}</h3>}
      <div className="overflow-hidden rounded-md" style={{ aspectRatio }}>
        <iframe src={embed} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
    </Section>
  )
}

function CtaBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const heading = getStr(props, 'heading', 'Ready to work together?')
  const subheading = getStr(props, 'subheading')
  const buttonText = getStr(props, 'button_text', 'Contact me')
  const buttonUrl = getStr(props, 'button_url', '#contact')
  const bgColor = getStr(props, 'bg_color', tokens.card_bg)
  const textColor = getStr(props, 'text_color', tokens.heading_color)
  return (
    <section style={{ background: bgColor }} className="px-6 py-16 text-center">
      <div className="mx-auto max-w-3xl">
        <h2
          className="text-3xl font-black tracking-tight sm:text-4xl"
          style={{ color: textColor, fontFamily: tokens.font_heading }}
        >
          {heading}
        </h2>
        {subheading && <p className="mt-4" style={{ color: textColor }}>{subheading}</p>}
        <a
          href={buttonUrl}
          className="mt-8 inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest"
          style={{
            background: tokens.primary,
            color: tokens.secondary,
            borderRadius: tokens.button_radius,
            fontFamily: tokens.font_heading,
          }}
        >
          {buttonText}
        </a>
      </div>
    </section>
  )
}

function FaqBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Frequently asked')
  const items = getArr<{ question: string; answer: string }>(props, 'items')
  return (
    <Section maxWidth="800px">
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((it, i) => (
          <details
            key={i}
            className="group rounded-md border p-4"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            <summary
              className="cursor-pointer text-base font-bold"
              style={{ color: tokens.heading_color }}
            >
              {it.question}
            </summary>
            <p className="mt-3 text-sm" style={{ color: tokens.text_color }}>
              {it.answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  )
}

function StatIcon({ icon }: { icon?: string }) {
  const parsed = parseIcon(icon)
  if (parsed.kind === 'none') return null
  if (parsed.kind === 'emoji' && !parsed.value) return null
  if (parsed.kind === 'image' && !parsed.value) return null
  if (parsed.kind === 'emoji') return <div className="mb-1 text-3xl">{parsed.value}</div>
  return (
    <div className="mb-2 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={parsed.value} alt="" className="h-12 w-12 object-contain" />
    </div>
  )
}

function BadgeIcon({ icon }: { icon?: string }) {
  const parsed = parseIcon(icon)
  if (parsed.kind === 'none') return <div className="h-12 w-12" />
  if (parsed.kind === 'emoji' && !parsed.value) return <div className="h-12 w-12" />
  if (parsed.kind === 'image' && !parsed.value) return <div className="h-12 w-12" />
  if (parsed.kind === 'emoji') return <div className="text-3xl">{parsed.value}</div>
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={parsed.value} alt="" className="h-12 w-12 shrink-0 object-contain" />
  )
}

function StatsBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title')
  const layout = getStr(props, 'layout', 'cards')
  const bgColor = getStr(props, 'bg_color')
  const textColor = getStr(props, 'text_color')
  const stats = getArr<{ icon?: string; label: string; value: string; color?: string }>(props, 'stats')
  return (
    <section style={{ background: bgColor || 'transparent' }} className="px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {title && (
          <h3
            className="mb-8 text-center text-2xl font-bold"
            style={{ color: textColor || tokens.heading_color, fontFamily: tokens.font_heading }}
          >
            {title}
          </h3>
        )}
        <div
          className={
            layout === 'bar'
              ? 'flex flex-wrap justify-around gap-6'
              : layout === 'minimal'
              ? 'grid grid-cols-2 gap-6 sm:grid-cols-4'
              : 'grid gap-6 sm:grid-cols-3'
          }
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={
                layout === 'cards'
                  ? 'rounded-md border p-6 text-center'
                  : 'text-center'
              }
              style={
                layout === 'cards'
                  ? { borderColor: tokens.border_color, background: tokens.card_bg }
                  : undefined
              }
            >
              <StatIcon icon={s.icon} />
              <p
                className="text-5xl font-black"
                style={{ color: s.color || tokens.primary, fontFamily: tokens.font_heading }}
              >
                {s.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-widest" style={{ color: tokens.muted_color }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AchievementsBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Achievements')
  const badges = getArr<{ icon: string; label: string; value: string; color?: string }>(props, 'badges')
  return (
    <Section>
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((b, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md border p-4"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            <BadgeIcon icon={b.icon} />
            <div>
              <p className="text-sm font-bold" style={{ color: tokens.heading_color }}>
                {b.label}
              </p>
              <p className="text-xs" style={{ color: b.color || tokens.muted_color }}>
                {b.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function TestimonialBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'What they say')
  const items = getArr<{ name: string; role: string; quote: string }>(props, 'testimonials')
  return (
    <Section>
      <h3
        className="mb-8 text-center text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="grid gap-6 sm:grid-cols-2">
        {items.map((t, i) => (
          <blockquote
            key={i}
            className="rounded-md border p-6"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            <p className="text-base leading-relaxed" style={{ color: tokens.text_color }}>
              &ldquo;{t.quote}&rdquo;
            </p>
            <footer className="mt-4 text-xs">
              <span className="font-bold" style={{ color: tokens.heading_color }}>
                {t.name}
              </span>
              {t.role && <span style={{ color: tokens.muted_color }}> · {t.role}</span>}
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  )
}

function SponsorsBlock({ props }: { props: Record<string, unknown> }) {
  const title = getStr(props, 'title', 'Partners')
  const columns = Math.min(6, Math.max(2, getNum(props, 'columns', 4)))
  const sponsors = getArr<{ name: string; logo: string }>(props, 'sponsors')
  if (!sponsors.length) return null
  return (
    <Section>
      <p className="text-eyebrow mb-4 text-center text-muted-foreground">{title}</p>
      <div
        className="grid items-center gap-6"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {sponsors.map((s, i) => (
          <div key={i} className="flex items-center justify-center">
            {s.logo && (
              <Image
                src={s.logo}
                alt={s.name}
                width={120}
                height={60}
                className="h-12 w-auto object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                unoptimized
              />
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

function LinksBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title')
  const subtitle = getStr(props, 'subtitle')
  const style = getStr(props, 'style', 'rounded')
  const openNewTab = getBool(props, 'open_new_tab', true)
  const links = getArr<{ label: string; url: string }>(props, 'links')
  const radiusMap: Record<string, number> = { rounded: 8, pill: 999, square: 0 }
  return (
    <Section maxWidth="560px">
      {title && (
        <h3
          className="text-center text-2xl font-bold"
          style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="mt-1 text-center text-sm" style={{ color: tokens.muted_color }}>
          {subtitle}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {links.map((l, i) => (
          <a
            key={i}
            href={l.url || '#'}
            target={openNewTab ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="block px-6 py-3 text-center text-sm font-bold uppercase tracking-widest transition hover:opacity-90"
            style={{
              background: tokens.primary,
              color: tokens.secondary,
              borderRadius: style === 'underline' ? 0 : radiusMap[style] ?? 8,
              fontFamily: tokens.font_heading,
              borderBottom: style === 'underline' ? `2px solid ${tokens.primary}` : undefined,
            }}
          >
            {l.label}
          </a>
        ))}
      </div>
    </Section>
  )
}

function ScheduleBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Schedule')
  const events = getArr<{ date: string; time: string; title: string; location: string; description: string }>(
    props,
    'events'
  )
  return (
    <Section>
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <ul className="divide-y" style={{ borderColor: tokens.border_color }}>
        {events.map((e, i) => (
          <li
            key={i}
            className="flex flex-wrap items-baseline justify-between gap-4 py-4"
            style={{ borderColor: tokens.border_color }}
          >
            <div>
              <p className="text-display text-xs uppercase tracking-widest" style={{ color: tokens.muted_color }}>
                {e.date} {e.time && `· ${e.time}`}
              </p>
              <p className="mt-1 text-base font-bold" style={{ color: tokens.heading_color }}>
                {e.title}
              </p>
              {e.description && (
                <p className="mt-1 text-sm" style={{ color: tokens.text_color }}>
                  {e.description}
                </p>
              )}
            </div>
            {e.location && (
              <p className="text-sm" style={{ color: tokens.muted_color }}>
                {e.location}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  )
}

function ContactFormBlock({
  props,
  tokens,
  siteId,
  blockId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  siteId?: string
  blockId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Get in touch')
  const submitText = getStr(props, 'submit_text', 'Send message')
  const fields = getArr<string | { name?: string }>(props, 'fields')
  const fieldNames = fields
    .map((f) => (typeof f === 'string' ? f : f.name ?? ''))
    .filter(Boolean)

  return (
    <Section maxWidth="640px">
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      {interactive && siteId ? (
        <ContactForm
          siteId={siteId}
          blockId={blockId}
          fields={fieldNames}
          submitText={submitText}
          tokens={tokens}
        />
      ) : (
        <StaticContactForm fieldNames={fieldNames} submitText={submitText} tokens={tokens} />
      )}
    </Section>
  )
}

function StaticContactForm({
  fieldNames,
  submitText,
  tokens,
}: {
  fieldNames: string[]
  submitText: string
  tokens: ThemeTokens
}) {
  return (
    <form className="space-y-3" method="post">
      {fieldNames.map((name) =>
        name === 'message' ? (
          <textarea
            key={name}
            name={name}
            rows={5}
            placeholder="Your message…"
            className="w-full rounded-md border p-3 text-sm"
            style={{
              borderColor: tokens.border_color,
              background: tokens.card_bg,
              color: tokens.text_color,
            }}
          />
        ) : (
          <input
            key={name}
            type={name === 'email' ? 'email' : 'text'}
            name={name}
            placeholder={name.charAt(0).toUpperCase() + name.slice(1)}
            className="w-full rounded-md border p-3 text-sm"
            style={{
              borderColor: tokens.border_color,
              background: tokens.card_bg,
              color: tokens.text_color,
            }}
          />
        )
      )}
      <button
        type="submit"
        className="px-6 py-3 text-sm font-bold uppercase tracking-widest"
        style={{
          background: tokens.primary,
          color: tokens.secondary,
          borderRadius: tokens.button_radius,
          fontFamily: tokens.font_heading,
        }}
      >
        {submitText}
      </button>
    </form>
  )
}

function EmailCaptureBlock({
  props,
  tokens,
  siteId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  siteId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Join my newsletter')
  const description = getStr(props, 'description')
  const buttonText = getStr(props, 'button_text', 'Subscribe')
  return (
    <Section maxWidth="640px">
      <div className="text-center">
        <h3
          className="text-2xl font-bold"
          style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
        >
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm" style={{ color: tokens.muted_color }}>
            {description}
          </p>
        )}
      </div>
      {interactive && siteId ? (
        <EmailCaptureForm siteId={siteId} buttonText={buttonText} tokens={tokens} />
      ) : (
        <form className="mt-6 flex gap-2" method="post">
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-md border p-3 text-sm"
            style={{
              borderColor: tokens.border_color,
              background: tokens.card_bg,
              color: tokens.text_color,
            }}
          />
          <button
            type="submit"
            className="px-6 py-3 text-sm font-bold uppercase tracking-widest"
            style={{
              background: tokens.primary,
              color: tokens.secondary,
              borderRadius: tokens.button_radius,
              fontFamily: tokens.font_heading,
            }}
          >
            {buttonText}
          </button>
        </form>
      )}
    </Section>
  )
}

function CountdownBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title') || getStr(props, 'event_name')
  const targetDate = getStr(props, 'target_date') || getStr(props, 'event_date')
  const eventUrl = getStr(props, 'event_url')
  const description = getStr(props, 'description')
  const completeMessage = getStr(props, 'complete_message', 'It’s time!')
  // SSR-friendly: render the target as a data attribute; a client script can
  // hydrate it later. For now show the date statically.
  return (
    <Section maxWidth="800px">
      <div className="text-center">
        {title && (
          <h3
            className="text-2xl font-bold"
            style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
          >
            {title}
          </h3>
        )}
        {targetDate && (
          <p
            className="mt-4 text-5xl font-black tracking-tight"
            style={{ color: tokens.primary, fontFamily: tokens.font_heading }}
            data-countdown-target={targetDate}
          >
            {new Date(targetDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
        {description && (
          <p className="mt-3 text-sm" style={{ color: tokens.muted_color }}>
            {description}
          </p>
        )}
        {eventUrl && (
          <a
            href={eventUrl}
            className="mt-6 inline-block px-6 py-3 text-sm font-bold uppercase tracking-widest"
            style={{
              background: tokens.primary,
              color: tokens.secondary,
              borderRadius: tokens.button_radius,
              fontFamily: tokens.font_heading,
            }}
          >
            Event details
          </a>
        )}
        <p hidden>{completeMessage}</p>
      </div>
    </Section>
  )
}

function BookingBlock({ props }: { props: Record<string, unknown> }) {
  const embedUrl = getStr(props, 'embed_url')
  if (!embedUrl) return null
  return (
    <Section maxWidth="1100px">
      <div className="overflow-hidden rounded-md" style={{ minHeight: 700 }}>
        <iframe src={embedUrl} className="h-[700px] w-full" />
      </div>
    </Section>
  )
}

function MapBlock({ props }: { props: Record<string, unknown> }) {
  const embedCode = getStr(props, 'embed_code')
  if (!embedCode) return null
  return (
    <Section>
      <div
        className="overflow-hidden rounded-md"
        dangerouslySetInnerHTML={{ __html: embedCode }}
      />
    </Section>
  )
}

function SocialFeedBlock({
  props,
  social,
  tokens,
}: {
  props: Record<string, unknown>
  social?: Record<string, string>
  tokens: ThemeTokens
}) {
  const style = getStr(props, 'style', 'icons')
  const entries = Object.entries(social ?? {})
  if (!entries.length) {
    return (
      <Section>
        <p className="text-center text-sm" style={{ color: tokens.muted_color }}>
          Add social handles in Site Settings → Social to populate this block.
        </p>
      </Section>
    )
  }
  return (
    <Section maxWidth="800px">
      <div className={style === 'cards' ? 'grid gap-4 sm:grid-cols-3' : 'flex flex-wrap justify-center gap-6'}>
        {entries.map(([platform, url]) => (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={
              style === 'cards'
                ? 'rounded-md border p-4 text-center transition hover:opacity-90'
                : 'inline-flex h-12 w-12 items-center justify-center rounded-full transition hover:opacity-90'
            }
            style={
              style === 'cards'
                ? { borderColor: tokens.border_color, background: tokens.card_bg }
                : { background: tokens.primary, color: tokens.secondary }
            }
          >
            {style === 'cards' ? (
              <>
                <p className="text-sm font-bold capitalize" style={{ color: tokens.heading_color }}>
                  {platform}
                </p>
                <p className="text-xs" style={{ color: tokens.muted_color }}>
                  Follow
                </p>
              </>
            ) : (
              <span className="text-xs font-bold uppercase">{platform.slice(0, 2)}</span>
            )}
          </a>
        ))}
      </div>
    </Section>
  )
}

function SocialEmbedBlock({ props }: { props: Record<string, unknown> }) {
  const embedCode = getStr(props, 'embed_code')
  const embedUrl = getStr(props, 'embed_url')
  if (embedCode) {
    return (
      <Section maxWidth="640px">
        <div dangerouslySetInnerHTML={{ __html: embedCode }} />
      </Section>
    )
  }
  if (embedUrl) {
    return (
      <Section maxWidth="640px">
        <iframe src={embedUrl} className="w-full" style={{ minHeight: 600 }} />
      </Section>
    )
  }
  return null
}

function BlogFeedStubBlock({ props }: { props: Record<string, unknown> }) {
  const title = getStr(props, 'title', 'Recent posts')
  return (
    <Section>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground">
        Blog feed will appear here once posts are published.
      </p>
    </Section>
  )
}

function ColumnsBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const count = Math.min(4, Math.max(2, getNum(props, 'column_count', 2)))
  const columnData = getArr<{ blocks?: SiteBlock[] }>(props, 'column_data')
  return (
    <Section>
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>
            {(columnData[i]?.blocks ?? []).map((b: SiteBlock) => (
              <BlockRenderer key={b.id} block={b} theme={tokens} />
            ))}
          </div>
        ))}
      </div>
    </Section>
  )
}

function SpacerBlock({ props }: { props: Record<string, unknown> }) {
  const height = getNum(props, 'height', 48)
  return <div style={{ height }} />
}

function DividerBlock({ tokens }: { tokens: ThemeTokens }) {
  return (
    <Section>
      <hr style={{ borderColor: tokens.border_color }} />
    </Section>
  )
}

function HtmlBlock({ props }: { props: Record<string, unknown> }) {
  const content = getStr(props, 'content', '')
  return (
    <Section>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Section>
  )
}

function NavStubBlock({ props }: { props: Record<string, unknown> }) {
  const title = getStr(props, 'title')
  return (
    <Section>
      {title && <p className="mb-3 text-eyebrow text-muted-foreground">{title}</p>}
      <p className="text-sm text-muted-foreground">
        Site navigation will render here when the page is viewed publicly.
      </p>
    </Section>
  )
}

// ─── Fan / revenue blocks ────────────────────────────────────────────────────

function FanCardShell({
  title,
  tokens,
  children,
  centered = false,
}: {
  title?: string
  tokens: ThemeTokens
  children: React.ReactNode
  centered?: boolean
}) {
  return (
    <Section maxWidth="640px">
      {title && (
        <h3
          className={`mb-4 text-2xl font-bold ${centered ? 'text-center' : ''}`}
          style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
        >
          {title}
        </h3>
      )}
      <div
        className="rounded-md border p-6"
        style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
      >
        {children}
      </div>
    </Section>
  )
}

function FanScopedBlock({
  title,
  note,
  tokens,
}: {
  title: string
  note: string
  tokens: ThemeTokens
}) {
  return (
    <FanCardShell title={title} tokens={tokens}>
      <p className="text-sm" style={{ color: tokens.muted_color }}>
        {note}
      </p>
    </FanCardShell>
  )
}

function TipJarBlock({
  props,
  tokens,
  siteId,
  blockId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  siteId?: string
  blockId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Send a tip')
  const description = getStr(props, 'description')
  const amountsRaw = getArr<{ value?: number } | number>(props, 'amounts')
  const amounts = amountsRaw
    .map((a) => (typeof a === 'number' ? a : Number(a.value ?? 0)))
    .filter((n) => n > 0)
  const allowCustom = getBool(props, 'allow_custom', true)
  return (
    <FanCardShell title={title} tokens={tokens} centered>
      {description && (
        <p className="mb-4 text-sm" style={{ color: tokens.muted_color }}>
          {description}
        </p>
      )}
      {interactive && siteId && blockId ? (
        <TipJarCheckout
          siteId={siteId}
          blockId={blockId}
          amounts={amounts}
          allowCustom={allowCustom}
          tokens={tokens}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {amounts.map((amt) => (
              <button
                key={amt}
                type="button"
                className="rounded-md px-4 py-3 text-sm font-bold transition hover:opacity-90"
                style={{
                  background: tokens.primary,
                  color: tokens.secondary,
                  borderRadius: tokens.button_radius,
                  fontFamily: tokens.font_heading,
                }}
              >
                ${amt}
              </button>
            ))}
          </div>
          {allowCustom && (
            <p className="mt-3 text-xs text-center" style={{ color: tokens.muted_color }}>
              Live preview shows the static UI. Real checkout fires on the published site.
            </p>
          )}
        </>
      )}
    </FanCardShell>
  )
}

function FanPollBlock({
  props,
  tokens,
  siteId,
  blockId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  siteId?: string
  blockId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title')
  const question = getStr(props, 'question', 'What should I post next?')
  const optsRaw = props.options
  const options: string[] = Array.isArray(optsRaw)
    ? (optsRaw as Array<string | { text?: string }>)
        .map((o) => (typeof o === 'string' ? o : o.text ?? ''))
        .filter(Boolean)
    : typeof optsRaw === 'string'
    ? optsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : []
  return (
    <FanCardShell title={title} tokens={tokens}>
      <p className="text-base font-bold" style={{ color: tokens.heading_color }}>
        {question}
      </p>
      {interactive && siteId && blockId ? (
        <PollForm siteId={siteId} blockId={blockId} options={options} tokens={tokens} />
      ) : (
        <ul className="mt-3 space-y-2">
          {options.map((opt, i) => (
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition hover:opacity-90"
                style={{
                  borderColor: tokens.border_color,
                  background: tokens.bg_color,
                  color: tokens.text_color,
                }}
              >
                <span>{opt}</span>
                <span className="text-xs" style={{ color: tokens.muted_color }}>
                  Vote →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </FanCardShell>
  )
}

function GuestbookBlock({
  props,
  tokens,
  siteId,
  blockId,
  entries,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  siteId?: string
  blockId?: string
  entries?: Array<{ id: string; display_name: string; message: string; created_at: string }>
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Guestbook')
  const description = getStr(props, 'description')
  const moderationRequired = getBool(props, 'moderation_required', false)
  const recent = (entries ?? []).slice(0, 5)
  return (
    <FanCardShell title={title} tokens={tokens}>
      {description && (
        <p className="mb-4 text-sm" style={{ color: tokens.muted_color }}>
          {description}
        </p>
      )}
      {interactive && siteId ? (
        <GuestbookForm
          siteId={siteId}
          blockId={blockId}
          moderationRequired={moderationRequired}
          tokens={tokens}
        />
      ) : (
        <form className="space-y-3">
          <input
            name="display_name"
            placeholder="Your name"
            className="w-full rounded-md border p-3 text-sm"
            style={{
              borderColor: tokens.border_color,
              background: tokens.bg_color,
              color: tokens.text_color,
            }}
          />
          <textarea
            name="message"
            rows={3}
            placeholder="Leave a note…"
            className="w-full rounded-md border p-3 text-sm"
            style={{
              borderColor: tokens.border_color,
              background: tokens.bg_color,
              color: tokens.text_color,
            }}
          />
          <button
            type="button"
            className="rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest"
            style={{
              background: tokens.primary,
              color: tokens.secondary,
              borderRadius: tokens.button_radius,
              fontFamily: tokens.font_heading,
            }}
          >
            Sign
          </button>
        </form>
      )}
      {recent.length > 0 && (
        <ul className="mt-6 space-y-3 border-t pt-4" style={{ borderColor: tokens.border_color }}>
          {recent.map((e) => (
            <li key={e.id}>
              <p className="text-sm" style={{ color: tokens.text_color }}>
                {e.message}
              </p>
              <p className="text-xs" style={{ color: tokens.muted_color }}>
                — {e.display_name}
              </p>
            </li>
          ))}
        </ul>
      )}
    </FanCardShell>
  )
}

function SupportersWallBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'My supporters')
  const description = getStr(props, 'description')
  return (
    <Section maxWidth="900px">
      <div className="text-center">
        <h3
          className="text-2xl font-bold"
          style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm" style={{ color: tokens.muted_color }}>
            {description}
          </p>
        )}
      </div>
      <div
        className="mt-6 rounded-md border p-6 text-center"
        style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
      >
        <p className="text-sm" style={{ color: tokens.muted_color }}>
          Recent supporters will appear here once orders/tips come in.
        </p>
      </div>
    </Section>
  )
}

function FanLeaderboardBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Top supporters')
  return (
    <Section maxWidth="640px">
      <h3
        className="mb-4 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div
        className="rounded-md border"
        style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
      >
        <p className="px-6 py-8 text-center text-sm" style={{ color: tokens.muted_color }}>
          Leaderboard fills in as supporters contribute.
        </p>
      </div>
    </Section>
  )
}

function MilestonesBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Milestones')
  const milestones = getArr<{ target: number; title: string; reward: string }>(props, 'milestones')
  return (
    <Section maxWidth="800px">
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <ol className="space-y-3">
        {milestones.map((m, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-md border p-4"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
              style={{
                background: tokens.primary,
                color: tokens.secondary,
                fontFamily: tokens.font_heading,
              }}
            >
              <span className="text-xs font-black">{i + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-base font-bold" style={{ color: tokens.heading_color }}>
                {m.title}{' '}
                <span style={{ color: tokens.muted_color }}>· {m.target.toLocaleString()}</span>
              </p>
              <p className="text-sm" style={{ color: tokens.text_color }}>
                {m.reward}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function SupporterStreakBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Longest streaks')
  return (
    <FanCardShell title={title} tokens={tokens}>
      <p className="text-sm" style={{ color: tokens.muted_color }}>
        Supporter streaks will populate based on consecutive months of support.
      </p>
    </FanCardShell>
  )
}

function ContentDripBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Members-only drops')
  return (
    <FanCardShell title={title} tokens={tokens}>
      <p className="text-sm" style={{ color: tokens.muted_color }}>
        Scheduled content drops will appear here once a supporter signs in.
      </p>
    </FanCardShell>
  )
}

function ReferralBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Refer a friend')
  const description = getStr(props, 'description')
  return (
    <FanCardShell title={title} tokens={tokens}>
      {description && (
        <p className="mb-4 text-sm" style={{ color: tokens.muted_color }}>
          {description}
        </p>
      )}
      <button
        type="button"
        className="rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest"
        style={{
          background: tokens.primary,
          color: tokens.secondary,
          borderRadius: tokens.button_radius,
          fontFamily: tokens.font_heading,
        }}
      >
        Get my referral link
      </button>
    </FanCardShell>
  )
}

function ActivityFeedBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Latest activity')
  return (
    <Section maxWidth="640px">
      <h3
        className="mb-4 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <ul
        className="divide-y rounded-md border"
        style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
      >
        <li className="px-4 py-3 text-sm" style={{ color: tokens.text_color }}>
          Live activity will appear here once supporters engage.
        </li>
      </ul>
    </Section>
  )
}

function RevenueTickerBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const label = getStr(props, 'label', 'Raised so far')
  const currency = getStr(props, 'currency', 'USD')
  return (
    <Section maxWidth="640px">
      <div
        className="rounded-md border p-6 text-center"
        style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
      >
        <p
          className="text-eyebrow"
          style={{ color: tokens.muted_color, fontFamily: tokens.font_heading }}
        >
          {label}
        </p>
        <p
          className="mt-2 text-5xl font-black"
          style={{ color: tokens.primary, fontFamily: tokens.font_heading }}
        >
          {currency === 'USD' ? '$' : ''}0
          <span className="text-2xl" style={{ color: tokens.muted_color }}>
            {currency !== 'USD' && ` ${currency}`}
          </span>
        </p>
        <p className="mt-1 text-xs" style={{ color: tokens.muted_color }}>
          Updates live as fans support.
        </p>
      </div>
    </Section>
  )
}

function FanPortalBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'My account')
  const showRewards = getBool(props, 'show_rewards', true)
  const showOrders = getBool(props, 'show_orders', true)
  const showMembership = getBool(props, 'show_membership', true)
  return (
    <Section>
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showOrders && <PortalCard title="Orders" body="Recent purchases" tokens={tokens} />}
        {showRewards && <PortalCard title="Rewards" body="Unlocked perks" tokens={tokens} />}
        {showMembership && <PortalCard title="Membership" body="Status + manage" tokens={tokens} />}
      </div>
    </Section>
  )
}

function PortalCard({
  title,
  body,
  tokens,
}: {
  title: string
  body: string
  tokens: ThemeTokens
}) {
  return (
    <div
      className="rounded-md border p-5"
      style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
    >
      <p
        className="text-display text-sm font-bold uppercase tracking-widest"
        style={{ color: tokens.primary, fontFamily: tokens.font_heading }}
      >
        {title}
      </p>
      <p className="mt-2 text-sm" style={{ color: tokens.text_color }}>
        {body}
      </p>
      <p className="mt-3 text-xs" style={{ color: tokens.muted_color }}>
        Sign in to see your data.
      </p>
    </div>
  )
}

function GiftTipBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Gift a tip')
  const description = getStr(props, 'description')
  return (
    <FanCardShell title={title} tokens={tokens}>
      {description && (
        <p className="mb-4 text-sm" style={{ color: tokens.muted_color }}>
          {description}
        </p>
      )}
      <div className="space-y-2">
        <input
          placeholder="Recipient name"
          className="w-full rounded-md border p-3 text-sm"
          style={{
            borderColor: tokens.border_color,
            background: tokens.bg_color,
            color: tokens.text_color,
          }}
        />
        <input
          type="email"
          placeholder="Recipient email"
          className="w-full rounded-md border p-3 text-sm"
          style={{
            borderColor: tokens.border_color,
            background: tokens.bg_color,
            color: tokens.text_color,
          }}
        />
        <textarea
          rows={2}
          placeholder="Message"
          className="w-full rounded-md border p-3 text-sm"
          style={{
            borderColor: tokens.border_color,
            background: tokens.bg_color,
            color: tokens.text_color,
          }}
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            className="flex-1 rounded-md border p-3 text-sm"
            style={{
              borderColor: tokens.border_color,
              background: tokens.bg_color,
              color: tokens.text_color,
            }}
          />
          <button
            type="button"
            className="rounded-md px-6 text-sm font-bold"
            style={{
              background: tokens.primary,
              color: tokens.secondary,
              borderRadius: tokens.button_radius,
              fontFamily: tokens.font_heading,
            }}
          >
            Send gift
          </button>
        </div>
      </div>
    </FanCardShell>
  )
}

function RewardsShowcaseBlock({
  props,
  tokens,
  rewards,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  rewards?: Array<{
    id: string
    name: string
    description: string | null
    image_url: string | null
    unlock_amount_cents: number
    reward_type: string
  }>
}) {
  const title = getStr(props, 'title', 'Rewards you can unlock')
  if (!rewards || rewards.length === 0) {
    return (
      <Section>
        <h3
          className="mb-6 text-2xl font-bold"
          style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
        >
          {title}
        </h3>
        <div
          className="rounded-md border p-8 text-center"
          style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
        >
          <p className="text-sm" style={{ color: tokens.muted_color }}>
            Add rewards in the Revenue tab to populate this block.
          </p>
        </div>
      </Section>
    )
  }
  return (
    <Section>
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((r) => (
          <article
            key={r.id}
            className="overflow-hidden rounded-md border"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            {r.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.image_url} alt={r.name} className="aspect-video w-full object-cover" />
            ) : (
              <div
                className="flex aspect-video items-center justify-center text-xs uppercase tracking-widest"
                style={{ color: tokens.muted_color, fontFamily: tokens.font_heading }}
              >
                {r.reward_type}
              </div>
            )}
            <div className="p-4">
              <p className="text-display font-bold" style={{ color: tokens.heading_color }}>
                {r.name}
              </p>
              {r.description && (
                <p className="mt-1 text-xs" style={{ color: tokens.muted_color }}>
                  {r.description}
                </p>
              )}
              <p className="mt-2 text-xs uppercase tracking-widest" style={{ color: tokens.primary, fontFamily: tokens.font_heading }}>
                Unlocks at ${(r.unlock_amount_cents / 100).toFixed(2)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

function MerchBlock({
  props,
  tokens,
  products,
  siteId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  products?: Array<{
    id: string
    name: string
    description: string | null
    price_cents: number
    currency: string
    image_url: string | null
  }>
  siteId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Shop merch')
  if (!products || products.length === 0) {
    return (
      <Section>
        <h3
          className="mb-6 text-2xl font-bold"
          style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
        >
          {title}
        </h3>
        <div
          className="rounded-md border p-8 text-center"
          style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
        >
          <p className="text-sm" style={{ color: tokens.muted_color }}>
            Add products in the Revenue tab to populate this block.
          </p>
        </div>
      </Section>
    )
  }
  return (
    <Section>
      <h3
        className="mb-6 text-center text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-md border"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-xs" style={{ color: tokens.muted_color }}>
                No image
              </div>
            )}
            <div className="p-4">
              <p className="text-display font-bold" style={{ color: tokens.heading_color }}>
                {p.name}
              </p>
              {p.description && (
                <p className="mt-1 text-xs" style={{ color: tokens.muted_color }}>
                  {p.description}
                </p>
              )}
              <p className="mt-3 text-xl font-black" style={{ color: tokens.primary, fontFamily: tokens.font_heading }}>
                ${(p.price_cents / 100).toFixed(2)}
              </p>
              <div className="mt-3">
                {interactive && siteId ? (
                  <MerchBuyButton
                    siteId={siteId}
                    productId={p.id}
                    label="Buy now"
                    tokens={tokens}
                  />
                ) : (
                  <button
                    type="button"
                    className="w-full rounded-md px-4 py-2 text-xs font-bold uppercase tracking-widest"
                    style={{
                      background: tokens.primary,
                      color: tokens.secondary,
                      borderRadius: tokens.button_radius,
                      fontFamily: tokens.font_heading,
                    }}
                  >
                    Buy now
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

function ShoutoutRequestBlock({
  props,
  tokens,
  siteId,
  blockId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  siteId?: string
  blockId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Get a personalized shoutout')
  const description = getStr(props, 'description')
  const priceCents = getNum(props, 'price_cents', 5000)
  const deliveryDays = getNum(props, 'delivery_days', 7)
  return (
    <FanCardShell title={title} tokens={tokens}>
      {description && (
        <p className="mb-4 text-sm" style={{ color: tokens.muted_color }}>
          {description}
        </p>
      )}
      <p
        className="text-3xl font-black"
        style={{ color: tokens.primary, fontFamily: tokens.font_heading }}
      >
        ${(priceCents / 100).toFixed(2)}
        <span className="ml-2 text-sm font-normal" style={{ color: tokens.muted_color }}>
          per video · {deliveryDays}-day delivery
        </span>
      </p>
      {interactive && siteId && blockId ? (
        <ShoutoutCheckoutForm
          siteId={siteId}
          blockId={blockId}
          priceCents={priceCents}
          label="Request a shoutout"
          tokens={tokens}
        />
      ) : (
        <button
          type="button"
          className="mt-4 rounded-md px-6 py-3 text-sm font-bold uppercase tracking-widest"
          style={{
            background: tokens.primary,
            color: tokens.secondary,
            borderRadius: tokens.button_radius,
            fontFamily: tokens.font_heading,
          }}
        >
          Request a shoutout
        </button>
      )}
    </FanCardShell>
  )
}

function MembershipTiersBlock({
  props,
  tokens,
  tiers,
  siteId,
  interactive,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
  tiers?: Array<{
    id: string
    name: string
    description: string | null
    price_cents: number
    billing_interval: string
    perks: string[]
  }>
  siteId?: string
  interactive?: boolean
}) {
  const title = getStr(props, 'title', 'Join the membership')
  const list =
    tiers && tiers.length > 0
      ? tiers
      : [
          { id: 's', name: 'Supporter', description: null, price_cents: 300, billing_interval: 'month', perks: ['Behind-the-scenes posts'] },
          { id: 'i', name: 'Insider', description: null, price_cents: 1000, billing_interval: 'month', perks: ['Everything in Supporter', 'Monthly Q&A', 'Discord access'] },
          { id: 'v', name: 'VIP', description: null, price_cents: 2500, billing_interval: 'month', perks: ['Everything in Insider', 'Quarterly video call', 'Signed gear'] },
        ]
  return (
    <Section>
      <h3
        className="mb-6 text-center text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <div
            key={t.id}
            className="rounded-md border p-6"
            style={{ borderColor: tokens.border_color, background: tokens.card_bg }}
          >
            <p
              className="text-display text-sm font-bold uppercase tracking-widest"
              style={{ color: tokens.primary, fontFamily: tokens.font_heading }}
            >
              {t.name}
            </p>
            <p
              className="mt-2 text-3xl font-black"
              style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
            >
              ${(t.price_cents / 100).toFixed(0)}
              <span className="ml-1 text-sm font-normal" style={{ color: tokens.muted_color }}>
                /{t.billing_interval}
              </span>
            </p>
            {t.description && (
              <p className="mt-2 text-xs" style={{ color: tokens.muted_color }}>
                {t.description}
              </p>
            )}
            <ul className="mt-4 space-y-1 text-sm" style={{ color: tokens.text_color }}>
              {t.perks.map((p, i) => (
                <li key={i}>✓ {p}</li>
              ))}
            </ul>
            {interactive && siteId && tiers && tiers.length > 0 ? (
              <TierJoinButton siteId={siteId} tierId={t.id} label="Join" tokens={tokens} />
            ) : (
              <button
                type="button"
                className="mt-4 w-full rounded-md px-4 py-2 text-sm font-bold uppercase tracking-widest"
                style={{
                  background: tokens.primary,
                  color: tokens.secondary,
                  borderRadius: tokens.button_radius,
                  fontFamily: tokens.font_heading,
                }}
              >
                Join
              </button>
            )}
          </div>
        ))}
      </div>
      {(!tiers || tiers.length === 0) && (
        <p className="mt-3 text-center text-xs" style={{ color: tokens.muted_color }}>
          Add tiers in the Revenue tab to replace these examples.
        </p>
      )}
    </Section>
  )
}

/** Convert a YouTube watch URL / Vimeo URL to an embed URL. */
function normalizeVideoEmbed(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean)[0]
      if (id) return `https://player.vimeo.com/video/${id}`
    }
  } catch {
    /* ignore */
  }
  return url
}
