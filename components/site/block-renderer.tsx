import Image from 'next/image'

export interface SiteBlock {
  id: string
  block_type: string
  position: number
  props: Record<string, unknown>
}

interface BlockRendererProps {
  block: SiteBlock
  theme: { primary: string; secondary: string }
}

export function BlockRenderer({ block, theme }: BlockRendererProps) {
  switch (block.block_type) {
    case 'hero':
      return <HeroBlock props={block.props} theme={theme} />
    case 'text':
      return <TextBlock props={block.props} />
    case 'stats':
      return <StatsBlock props={block.props} theme={theme} />
    case 'gallery':
      return <GalleryBlock props={block.props} />
    case 'sponsors':
      return <SponsorsBlock props={block.props} />
    case 'cta':
      return <CtaBlock props={block.props} theme={theme} />
    case 'contact':
      return <ContactBlock props={block.props} />
    case 'video':
      return <VideoBlock props={block.props} />
    default:
      return null
  }
}

// ── Block components ────────────────────────────────────────────────────────

function HeroBlock({
  props,
  theme,
}: {
  props: Record<string, unknown>
  theme: { primary: string; secondary: string }
}) {
  const title = (props.title as string) ?? 'Headline'
  const subtitle = (props.subtitle as string) ?? ''
  const imageUrl = props.image_url as string | undefined
  return (
    <section
      className="relative px-6 py-24 text-center"
      style={{ background: theme.secondary, color: 'white' }}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover opacity-30"
          unoptimized
        />
      )}
      <div className="relative">
        <h1 className="text-display text-5xl font-black tracking-tight sm:text-7xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 text-lg" style={{ color: theme.primary }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

function TextBlock({ props }: { props: Record<string, unknown> }) {
  const content = (props.content as string) ?? ''
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="whitespace-pre-line leading-relaxed text-foreground">{content}</p>
    </section>
  )
}

function StatsBlock({
  props,
  theme,
}: {
  props: Record<string, unknown>
  theme: { primary: string; secondary: string }
}) {
  const items = (props.items as Array<{ value: string; label: string }>) ?? []
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="grid gap-6 sm:grid-cols-3">
        {items.map((s, i) => (
          <div key={i} className="text-center">
            <p
              className="text-display text-5xl font-black"
              style={{ color: theme.primary }}
            >
              {s.value}
            </p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function GalleryBlock({ props }: { props: Record<string, unknown> }) {
  const images = (props.images as Array<{ url: string; alt?: string }>) ?? []
  if (!images.length) return null
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-md">
            <Image
              src={img.url}
              alt={img.alt ?? ''}
              width={400}
              height={400}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function SponsorsBlock({ props }: { props: Record<string, unknown> }) {
  const logos = (props.logos as Array<{ url: string; name: string }>) ?? []
  if (!logos.length) return null
  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <p className="text-eyebrow mb-4 text-center text-muted-foreground">Partners</p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {logos.map((logo, i) => (
          <Image
            key={i}
            src={logo.url}
            alt={logo.name}
            width={120}
            height={60}
            className="h-12 w-auto object-contain opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0"
            unoptimized
          />
        ))}
      </div>
    </section>
  )
}

function CtaBlock({
  props,
  theme,
}: {
  props: Record<string, unknown>
  theme: { primary: string; secondary: string }
}) {
  const title = (props.title as string) ?? 'Get in touch'
  const body = (props.body as string) ?? ''
  const buttonLabel = (props.button_label as string) ?? 'Contact'
  const buttonHref = (props.button_href as string) ?? '#'
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="text-display text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
      {body && <p className="mt-4 text-muted-foreground">{body}</p>}
      <a
        href={buttonHref}
        className="text-display mt-8 inline-block rounded-full px-6 py-3 text-sm font-bold uppercase tracking-widest"
        style={{ background: theme.primary, color: theme.secondary }}
      >
        {buttonLabel}
      </a>
    </section>
  )
}

function ContactBlock({ props }: { props: Record<string, unknown> }) {
  const email = (props.email as string) ?? ''
  const phone = (props.phone as string) ?? ''
  return (
    <section className="mx-auto max-w-3xl px-6 py-12 text-center">
      <p className="text-eyebrow mb-3 text-muted-foreground">Contact</p>
      {email && <p className="text-foreground">{email}</p>}
      {phone && <p className="mt-1 text-foreground">{phone}</p>}
    </section>
  )
}

function VideoBlock({ props }: { props: Record<string, unknown> }) {
  const url = (props.url as string) ?? ''
  if (!url) return null
  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <div className="aspect-video overflow-hidden rounded-md">
        <iframe src={url} className="h-full w-full" allow="autoplay; encrypted-media" />
      </div>
    </section>
  )
}
