'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateArsenalAsset, type ArsenalGenState } from './arsenal-actions'
import { generateLogoOnPhotoAction, type LogoOnPhotoState } from './logo-on-photo-actions'
import {
  UNIFORM_SPORTS,
  UNIFORM_ITEMS_BY_SPORT,
  UNIFORM_ITEM_LABELS,
} from '@/lib/arsenal-prompts'

/**
 * Trigger a server-component re-render the moment a server-action returns
 * a fresh URL. `revalidatePath` alone doesn't re-render the page the talent
 * is currently on — they'd have to navigate away and back to see the new
 * asset in Your Creations. This hook closes that loop.
 */
function useRefreshOnNewUrl(currentUrl: string | undefined) {
  const router = useRouter()
  const lastRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (currentUrl && currentUrl !== lastRef.current) {
      lastRef.current = currentUrl
      router.refresh()
    }
  }, [currentUrl, router])
}

interface CategoryDef {
  id: string
  label: string
  icon: string
  color: string
  blurb: string
  /** Optional sub-picker list — value, name. */
  options?: Array<{ val: string; name: string }>
  /** Optional sub-picker placeholder label. */
  optionLabel?: string
  /** Optional secondary text input (e.g. uniform notes). */
  notesLabel?: string
  /** Special UI variant — 'uniforms' = sport + item two-step picker, 'logo_on_photo' = file upload. */
  variant?: 'uniforms' | 'logo_on_photo'
}

const FEATURED: CategoryDef[] = [
  {
    id: 'logo_on_photo',
    label: 'Logo On Your Photo',
    icon: '📸',
    color: '#00BCD4',
    blurb:
      'Upload a photo and stamp your logo anywhere — 10 placement spots + watermark mode.',
    variant: 'logo_on_photo',
  },
  {
    id: 'sport_uniform',
    label: 'Sport Uniforms',
    icon: '🏈',
    color: '#e91e63',
    blurb:
      'See your logo on jerseys, helmets, cleats and game gear — pick your sport then the specific piece.',
    variant: 'uniforms',
    notesLabel: 'Optional notes',
  },
  {
    id: 'merch_mockup',
    label: 'Merch Lab',
    icon: '👕',
    color: '#9b59b6',
    blurb: 'Photorealistic mockups: t-shirts, hoodies, hats, water bottles, posters, more.',
    optionLabel: 'Product',
    options: [
      { val: 'tshirt', name: 'T-Shirt' },
      { val: 'hoodie', name: 'Hoodie' },
      { val: 'crewneck', name: 'Crewneck' },
      { val: 'tank_top', name: 'Tank Top' },
      { val: 'hat', name: 'Snapback Hat' },
      { val: 'dad_hat', name: 'Dad Hat' },
      { val: 'beanie', name: 'Beanie' },
      { val: 'jersey', name: 'Sports Jersey' },
      { val: 'shorts', name: 'Shorts' },
      { val: 'joggers', name: 'Joggers' },
      { val: 'water_bottle', name: 'Water Bottle' },
      { val: 'tumbler', name: 'Tumbler' },
      { val: 'coffee_mug', name: 'Coffee Mug' },
      { val: 'phone_case', name: 'Phone Case' },
      { val: 'duffle_bag', name: 'Duffle Bag' },
      { val: 'backpack', name: 'Backpack' },
      { val: 'tote_bag', name: 'Tote Bag' },
      { val: 'stickers', name: 'Sticker Sheet' },
      { val: 'trading_card', name: 'Trading Card' },
      { val: 'towel', name: 'Rally Towel' },
      { val: 'lanyard', name: 'Lanyard' },
      { val: 'keychain', name: 'Keychain' },
      { val: 'pin', name: 'Enamel Pin' },
      { val: 'patch', name: 'Embroidered Patch' },
    ],
  },
]

const STANDARD: CategoryDef[] = [
  {
    id: 'social_media',
    label: 'Social Media',
    icon: '📱',
    color: '#e67e22',
    blurb: 'Templates for IG, TikTok, YouTube banner, LinkedIn, Twitch, more.',
    optionLabel: 'Platform',
    options: [
      { val: 'instagram', name: 'Instagram Post (1:1)' },
      { val: 'instagram_story', name: 'Instagram Story' },
      { val: 'tiktok', name: 'TikTok' },
      { val: 'twitter', name: 'X / Twitter' },
      { val: 'youtube_banner', name: 'YouTube Banner' },
      { val: 'linkedin', name: 'LinkedIn' },
      { val: 'facebook_cover', name: 'Facebook Cover' },
      { val: 'twitch_banner', name: 'Twitch Banner' },
      { val: 'snapchat_geofilter', name: 'Snapchat Geofilter' },
    ],
  },
  {
    id: 'business_card',
    label: 'Business Card',
    icon: '💼',
    color: '#3498db',
    blurb: 'Premium 3.5×2 card with logo, name, contact info and socials.',
  },
  {
    id: 'email_signature_image',
    label: 'Email Signature',
    icon: '✉️',
    color: '#2ecc71',
    blurb: '600×200 horizontal signature graphic for Gmail / Outlook.',
  },
  {
    id: 'virtual_background',
    label: 'Virtual Background',
    icon: '💻',
    color: '#1abc9c',
    blurb: '1920×1080 Zoom / Teams / Meet background in your brand colors.',
  },
  {
    id: 'phone_wallpaper',
    label: 'Phone Wallpaper',
    icon: '📱',
    color: '#e74c3c',
    blurb: '1170×2532 iPhone lockscreen with logo and brand pattern.',
  },
  {
    id: 'story_highlight',
    label: 'Story Highlight Covers',
    icon: '⭐',
    color: '#f39c12',
    blurb: 'Circular IG highlight icons. Pick a category theme.',
    optionLabel: 'Theme',
    options: [
      { val: 'Sports', name: 'Sports' },
      { val: 'Lifestyle', name: 'Lifestyle' },
      { val: 'NIL Deals', name: 'NIL Deals' },
      { val: 'Training', name: 'Training' },
      { val: 'Gameday', name: 'Gameday' },
      { val: 'Personal', name: 'Personal' },
      { val: 'Faith', name: 'Faith' },
      { val: 'Family', name: 'Family' },
      { val: 'Recruiting', name: 'Recruiting' },
    ],
  },
  {
    id: 'letterhead',
    label: 'Letterhead',
    icon: '📄',
    color: '#3498db',
    blurb: 'A4 letterhead header — logo top-left, contact right-aligned.',
  },
  {
    id: 'presentation',
    label: 'Presentation Template',
    icon: '📊',
    color: '#9b59b6',
    blurb: '16:9 title slide ready to drop into Keynote / Google Slides.',
  },
  {
    id: 'thank_you_card',
    label: 'Thank You Card',
    icon: '💌',
    color: '#e91e63',
    blurb: 'Vertical 5×7 card with logo, bold "THANK YOU", brand accents.',
  },
  {
    id: 'media_kit',
    label: 'Media Kit Cover',
    icon: '📋',
    color: '#00BCD4',
    blurb: 'Magazine-style press kit cover — name, "MEDIA KIT" header, socials.',
  },
  {
    id: 'icon_generator',
    label: 'Icon Generator',
    icon: '💎',
    color: '#1abc9c',
    blurb: 'App icons, favicons, chat avatars, watch faces — same logo, every surface.',
    optionLabel: 'Surface',
    options: [
      { val: 'app_icon', name: 'iOS / Android App Icon' },
      { val: 'favicon', name: 'Browser Favicon' },
      { val: 'watch_face', name: 'Watch Face' },
      { val: 'chat_avatar', name: 'Chat / Discord Avatar' },
    ],
  },
  {
    id: 'game_day',
    label: 'Game Day',
    icon: '🏆',
    color: '#f1c40f',
    blurb: 'Matchup graphics, countdown posts, final-score templates, hype tiles.',
    optionLabel: 'Type',
    options: [
      { val: 'hype', name: 'Hype / Pre-Game' },
      { val: 'matchup', name: 'Matchup vs Opponent' },
      { val: 'countdown', name: 'Countdown / Kickoff' },
      { val: 'score_announcement', name: 'Final Score Template' },
    ],
  },
]

export function ArsenalGrid({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
  // The grid renders compact tile chips. Clicking a tile opens an inline
  // panel below the grid with that category's form. Only one panel is
  // open at a time — clicking another tile swaps it. Matches the legacy
  // WP "click a category, form opens below" flow.
  const [openId, setOpenId] = useState<string | null>(null)

  if (!hasFinal) {
    return (
      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
        <p className="text-eyebrow text-accent">🔒 Locked</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a final logo first — every Arsenal asset is composed around it.
        </p>
      </div>
    )
  }

  const all = [...FEATURED, ...STANDARD]
  const openDef = openId ? all.find((c) => c.id === openId) ?? null : null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Featured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Photo-real product mockups using your logo as the reference. Click any to open the
          generator.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {FEATURED.map((c) => (
            <CategoryTile
              key={c.id}
              def={c}
              featured
              active={openId === c.id}
              onClick={() => setOpenId((cur) => (cur === c.id ? null : c.id))}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="text-eyebrow text-primary">More categories</p>
        <p className="mt-1 text-sm text-muted-foreground">
          One-off branded assets you&rsquo;ll reach for again and again.
        </p>
        <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {STANDARD.map((c) => (
            <CategoryTile
              key={c.id}
              def={c}
              active={openId === c.id}
              onClick={() => setOpenId((cur) => (cur === c.id ? null : c.id))}
            />
          ))}
        </div>
      </div>

      {openDef && (
        <div className="rounded-[var(--radius)] border border-primary/40 bg-panel/40 p-1">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-display text-sm font-bold" style={{ color: openDef.color }}>
              <span className="mr-2" aria-hidden>
                {openDef.icon}
              </span>
              {openDef.label}
            </p>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="text-display rounded-full bg-panel-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
              aria-label="Close"
            >
              ✕ Close
            </button>
          </div>
          <div className="px-2 pb-2">
            <CategoryCard brandId={brandId} def={openDef} featured={FEATURED.includes(openDef)} />
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryTile({
  def,
  featured,
  active,
  onClick,
}: {
  def: CategoryDef
  featured?: boolean
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-[var(--radius)] border bg-panel/40 p-3 text-center transition-colors hover:bg-panel/70 ${
        active ? 'border-primary ring-2 ring-primary/40' : 'border-border'
      } ${featured ? 'p-5' : ''}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-md ${
          featured ? 'h-14 w-14 text-3xl' : 'h-9 w-9 text-base'
        }`}
        style={{ background: `${def.color}22`, color: def.color }}
        aria-hidden
      >
        {def.icon}
      </span>
      <p
        className={`text-display font-bold leading-tight ${featured ? 'text-base' : 'text-[11px]'}`}
        style={{ color: def.color }}
      >
        {def.label}
      </p>
      {featured && (
        <p className="text-[11px] leading-snug text-muted-foreground">{def.blurb}</p>
      )}
    </button>
  )
}

function CategoryCard({
  brandId,
  def,
  featured,
}: {
  brandId: string
  def: CategoryDef
  featured?: boolean
}) {
  // Specialty variants route to dedicated forms — keeps hooks out of the
  // branching path so rules-of-hooks stays happy.
  if (def.variant === 'logo_on_photo') {
    return <LogoOnPhotoCard brandId={brandId} def={def} featured={featured} />
  }
  if (def.variant === 'uniforms') {
    return <UniformsCard brandId={brandId} def={def} featured={featured} />
  }
  return <StandardCategoryCard brandId={brandId} def={def} featured={featured} />
}

function StandardCategoryCard({
  brandId,
  def,
  featured,
}: {
  brandId: string
  def: CategoryDef
  featured?: boolean
}) {
  const [state, action, pending] = useActionState<ArsenalGenState, FormData>(
    generateArsenalAsset,
    {}
  )
  const [option, setOption] = useState(def.options?.[0]?.val ?? '')
  const [notes, setNotes] = useState('')
  const url = state.url
  useRefreshOnNewUrl(url)
  return (
    <form
      action={action}
      className={`flex flex-col gap-3 rounded-[var(--radius)] border bg-panel/40 p-4 ${
        featured ? 'border-accent/40' : 'border-border'
      }`}
    >
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="hidden" name="category" value={def.id} />
      <input type="hidden" name="option" value={option} />
      <input type="hidden" name="notes" value={notes} />
      <CategoryHeader def={def} />

      {def.options && def.options.length > 0 && (
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {def.optionLabel ?? 'Option'}
          </span>
          <select
            value={option}
            onChange={(e) => setOption(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            {def.options.map((o) => (
              <option key={o.val} value={o.val}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {def.notesLabel && (
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {def.notesLabel}
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. add red trim, retro feel"
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          />
        </label>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {pending ? 'Generating…' : url ? 'Regenerate' : 'Generate'}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-display rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-success"
          >
            ⬇ Download
          </a>
        )}
      </div>
      {pending && (
        <p className="text-[10px] text-muted-foreground">
          Our designer renders this in ~30–60 seconds. Stay on the page.
        </p>
      )}
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </form>
  )
}

function CategoryHeader({ def }: { def: CategoryDef }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base"
        style={{ background: `${def.color}22`, color: def.color }}
      >
        {def.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-display font-bold" style={{ color: def.color }}>
          {def.label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{def.blurb}</p>
      </div>
    </div>
  )
}

/**
 * Sport Uniforms — two-step picker. The talent picks a sport, then the
 * item dropdown narrows to that sport's gear (football has 15 items,
 * golf has 5, etc.). Mirrors the legacy WP picker layout.
 */
function UniformsCard({
  brandId,
  def,
  featured,
}: {
  brandId: string
  def: CategoryDef
  featured?: boolean
}) {
  const [state, action, pending] = useActionState<ArsenalGenState, FormData>(
    generateArsenalAsset,
    {}
  )
  const [sport, setSport] = useState(UNIFORM_SPORTS[0]!)
  const itemKeys = UNIFORM_ITEMS_BY_SPORT[sport] ?? []
  const [item, setItem] = useState(itemKeys[0] ?? '')
  // When sport changes, snap the item to the first one in the new list if
  // the current one isn't valid for the new sport.
  const onSportChange = (next: string) => {
    setSport(next)
    const list = UNIFORM_ITEMS_BY_SPORT[next] ?? []
    if (!list.includes(item)) setItem(list[0] ?? '')
  }
  const [notes, setNotes] = useState('')
  const url = state.url
  useRefreshOnNewUrl(url)
  return (
    <form
      action={action}
      className={`flex flex-col gap-3 rounded-[var(--radius)] border bg-panel/40 p-4 ${
        featured ? 'border-accent/40' : 'border-border'
      }`}
    >
      <input type="hidden" name="brand_id" value={brandId} />
      <input type="hidden" name="category" value={def.id} />
      <input type="hidden" name="option" value={item} />
      <input type="hidden" name="notes" value={notes} />
      <input type="hidden" name="sport" value={sport} />
      <CategoryHeader def={def} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sport
          </span>
          <select
            value={sport}
            onChange={(e) => onSportChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            {UNIFORM_SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Item ({itemKeys.length})
          </span>
          <select
            value={item}
            onChange={(e) => setItem(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            {itemKeys.map((k) => (
              <option key={k} value={k}>
                {UNIFORM_ITEM_LABELS[k] ?? k}
              </option>
            ))}
          </select>
        </label>
      </div>

      {def.notesLabel && (
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {def.notesLabel}
          </span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. add red trim, retro feel"
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          />
        </label>
      )}

      <div className="flex items-center justify-between gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {pending ? 'Generating…' : url ? 'Regenerate' : 'Generate'}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-display rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-success"
          >
            ⬇ Download
          </a>
        )}
      </div>
      {pending && (
        <p className="text-[10px] text-muted-foreground">
          Our designer renders this in ~30–60 seconds. Stay on the page.
        </p>
      )}
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}

/**
 * Logo On Your Photo — uploads a user photo, composites the talent's
 * final logo over it at the chosen placement + size, returns a saved
 * URL. NOT a generative call — sharp does the compositing server-side.
 */
const PLACEMENTS = [
  { val: 'top_left', name: 'Top Left' },
  { val: 'top_center', name: 'Top Center' },
  { val: 'top_right', name: 'Top Right' },
  { val: 'center_left', name: 'Center Left' },
  { val: 'center', name: 'Center' },
  { val: 'center_right', name: 'Center Right' },
  { val: 'bottom_left', name: 'Bottom Left' },
  { val: 'bottom_center', name: 'Bottom Center' },
  { val: 'bottom_right', name: 'Bottom Right' },
  { val: 'watermark', name: 'Watermark (Semi-transparent)' },
]

const SIZES = [
  { val: 'small', name: 'Small (10%)' },
  { val: 'medium', name: 'Medium (20%)' },
  { val: 'large', name: 'Large (35%)' },
]

function LogoOnPhotoCard({
  brandId,
  def,
  featured,
}: {
  brandId: string
  def: CategoryDef
  featured?: boolean
}) {
  const [state, action, pending] = useActionState<LogoOnPhotoState, FormData>(
    generateLogoOnPhotoAction,
    {}
  )
  const [placement, setPlacement] = useState(PLACEMENTS[8]!.val) // bottom_right
  const [size, setSize] = useState(SIZES[1]!.val)
  const url = state.url
  useRefreshOnNewUrl(url)
  return (
    <form
      action={action}
      className={`flex flex-col gap-3 rounded-[var(--radius)] border bg-panel/40 p-4 ${
        featured ? 'border-accent/40' : 'border-border'
      }`}
    >
      <input type="hidden" name="brand_id" value={brandId} />
      <CategoryHeader def={def} />

      <label className="block">
        <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Your photo (PNG / JPG)
        </span>
        <input
          type="file"
          name="photo"
          accept="image/png,image/jpeg"
          required
          className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs file:mr-3 file:rounded file:border-0 file:bg-primary/20 file:px-2 file:py-1 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:text-primary"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Placement
          </span>
          <select
            name="placement"
            value={placement}
            onChange={(e) => setPlacement(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            {PLACEMENTS.map((p) => (
              <option key={p.val} value={p.val}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Logo size
          </span>
          <select
            name="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          >
            {SIZES.map((s) => (
              <option key={s.val} value={s.val}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-display rounded-[var(--radius-sm)] bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {pending ? 'Compositing…' : url ? 'Re-composite' : 'Place logo on photo'}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="text-display rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-success"
          >
            ⬇ Download
          </a>
        )}
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
