/**
 * NIL Stores — customizable storefront content model.
 *
 * A store renders an ordered list of `StoreSection`s (between the hero and the
 * footer) plus a `StoreTheme` (fonts on top of the base primary/secondary
 * colors). Stored on stores.sections / stores.theme. Kept framework-agnostic so
 * both the public renderer and the editor share one source of truth.
 */

export type StoreSectionType =
  | 'about'
  | 'featured'
  | 'gallery'
  | 'banner'
  | 'testimonials'
  | 'custom_html'
  | 'products'

export interface StoreTestimonial {
  text: string
  author?: string
}

export interface StoreSection {
  id: string
  type: StoreSectionType
  heading?: string
  body?: string
  align?: 'left' | 'center' | 'right'
  bg?: string // section background (CSS color); blank = white
  /** banner / gallery imagery */
  image_url?: string
  images?: string[]
  cta_text?: string
  cta_url?: string
  /** featured: which products to spotlight (store_products ids) */
  product_ids?: string[]
  /** testimonials */
  quotes?: StoreTestimonial[]
  /** custom_html */
  html?: string
}

export interface StoreTheme {
  heading_font?: string
  body_font?: string
}

export const STORE_SECTION_KINDS: { type: StoreSectionType; label: string; hint: string }[] = [
  { type: 'about', label: 'About / Text', hint: 'A heading + paragraph — your story, shipping info, etc.' },
  { type: 'featured', label: 'Featured products', hint: 'Spotlight a few hand-picked products.' },
  { type: 'gallery', label: 'Gallery / Lookbook', hint: 'A grid of images.' },
  { type: 'banner', label: 'Banner / CTA', hint: 'Full-width image with a headline + button.' },
  { type: 'testimonials', label: 'Testimonials', hint: 'Customer quotes.' },
  { type: 'products', label: 'Product grid', hint: 'The full catalog grid (auto-added if omitted).' },
  { type: 'custom_html', label: 'Custom HTML', hint: 'Drop in your own HTML/embed.' },
]

/** Web-safe + Google font stacks offered for the storefront. `google` is the
 *  family name to load from Google Fonts (omit for system fonts). */
export const STORE_FONTS: { value: string; label: string; stack: string; google?: string }[] = [
  { value: 'system', label: 'System (clean)', stack: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  { value: 'inter', label: 'Inter', stack: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400;600;800' },
  { value: 'poppins', label: 'Poppins', stack: "'Poppins', system-ui, sans-serif", google: 'Poppins:wght@400;600;800' },
  { value: 'montserrat', label: 'Montserrat', stack: "'Montserrat', system-ui, sans-serif", google: 'Montserrat:wght@400;600;800' },
  { value: 'oswald', label: 'Oswald', stack: "'Oswald', system-ui, sans-serif", google: 'Oswald:wght@400;600;700' },
  { value: 'bebas', label: 'Bebas Neue', stack: "'Bebas Neue', system-ui, sans-serif", google: 'Bebas+Neue' },
  { value: 'anton', label: 'Anton', stack: "'Anton', system-ui, sans-serif", google: 'Anton' },
  { value: 'archivo', label: 'Archivo Black', stack: "'Archivo Black', system-ui, sans-serif", google: 'Archivo+Black' },
  { value: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', Georgia, serif", google: 'Playfair+Display:wght@400;700;900' },
  { value: 'spacegrotesk', label: 'Space Grotesk', stack: "'Space Grotesk', system-ui, sans-serif", google: 'Space+Grotesk:wght@400;600;700' },
]

export function fontStack(value: string | undefined): string {
  return STORE_FONTS.find((f) => f.value === value)?.stack ?? STORE_FONTS[0].stack
}

/** Google Fonts <link> href for the chosen heading + body fonts (or null). */
export function googleFontsHref(theme: StoreTheme | null | undefined): string | null {
  const families = [theme?.heading_font, theme?.body_font]
    .map((v) => STORE_FONTS.find((f) => f.value === v)?.google)
    .filter((g): g is string => Boolean(g))
  const unique = Array.from(new Set(families))
  if (unique.length === 0) return null
  return `https://fonts.googleapis.com/css2?${unique.map((f) => `family=${f}`).join('&')}&display=swap`
}

/** Coerce arbitrary jsonb into a clean StoreSection[]. */
export function normalizeSections(raw: unknown): StoreSection[] {
  if (!Array.isArray(raw)) return []
  const out: StoreSection[] = []
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue
    const o = r as Record<string, unknown>
    const type = String(o.type ?? '') as StoreSectionType
    if (!STORE_SECTION_KINDS.some((k) => k.type === type)) continue
    out.push({
      id: String(o.id ?? Math.random().toString(36).slice(2)),
      type,
      heading: typeof o.heading === 'string' ? o.heading : undefined,
      body: typeof o.body === 'string' ? o.body : undefined,
      align: o.align === 'left' || o.align === 'right' ? o.align : 'center',
      bg: typeof o.bg === 'string' ? o.bg : undefined,
      image_url: typeof o.image_url === 'string' ? o.image_url : undefined,
      images: Array.isArray(o.images) ? o.images.filter((i): i is string => typeof i === 'string') : undefined,
      cta_text: typeof o.cta_text === 'string' ? o.cta_text : undefined,
      cta_url: typeof o.cta_url === 'string' ? o.cta_url : undefined,
      product_ids: Array.isArray(o.product_ids)
        ? o.product_ids.filter((i): i is string => typeof i === 'string')
        : undefined,
      quotes: Array.isArray(o.quotes)
        ? o.quotes
            .filter((q): q is Record<string, unknown> => Boolean(q) && typeof q === 'object')
            .map((q) => ({ text: String(q.text ?? ''), author: q.author ? String(q.author) : undefined }))
            .filter((q) => q.text)
        : undefined,
      html: typeof o.html === 'string' ? o.html : undefined,
    })
  }
  return out
}
