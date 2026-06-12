import Image from 'next/image'
import type { ThemeTokens } from '@/lib/site-builder/theme-presets'

export interface SiteBlock {
  id: string
  block_type: string
  position: number
  props: Record<string, unknown>
}

interface BlockRendererProps {
  block: SiteBlock
  theme: { primary: string; secondary: string } | ThemeTokens
  social?: Record<string, string>
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

export function BlockRenderer({ block, theme, social }: BlockRendererProps) {
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
      return <ContactFormBlock props={block.props} tokens={tokens} />
    case 'email_capture':
      return <EmailCaptureBlock props={block.props} tokens={tokens} />
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
              {s.icon && <div className="mb-1 text-3xl">{s.icon}</div>}
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
            <div className="text-3xl">{b.icon}</div>
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
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
}) {
  const title = getStr(props, 'title', 'Get in touch')
  const submitText = getStr(props, 'submit_text', 'Send message')
  const fields = getArr<string | { name?: string }>(props, 'fields')
  const fieldNames = fields.map((f) => (typeof f === 'string' ? f : f.name ?? ''))
  return (
    <Section maxWidth="640px">
      <h3
        className="mb-6 text-2xl font-bold"
        style={{ color: tokens.heading_color, fontFamily: tokens.font_heading }}
      >
        {title}
      </h3>
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
    </Section>
  )
}

function EmailCaptureBlock({
  props,
  tokens,
}: {
  props: Record<string, unknown>
  tokens: ThemeTokens
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
