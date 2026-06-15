'use client'

import { useActionState, useState } from 'react'
import { generateArsenalAsset, type ArsenalGenState } from './arsenal-actions'

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
}

const FEATURED: CategoryDef[] = [
  {
    id: 'sport_uniform',
    label: 'Sport Uniforms',
    icon: '🏈',
    color: '#e91e63',
    blurb:
      'See your logo on jerseys, helmets, cleats and game gear — pick the piece you want a mockup of.',
    optionLabel: 'Item',
    options: [
      { val: 'home_jersey', name: 'Home Jersey' },
      { val: 'away_jersey', name: 'Away Jersey' },
      { val: 'full_uniform', name: 'Full Uniform Set' },
      { val: 'warm_up', name: 'Warm-Up' },
      { val: 'practice_jersey', name: 'Practice Jersey' },
      { val: 'alternate_jersey', name: 'Alt / City Edition' },
      { val: 'game_shorts', name: 'Game Shorts' },
      { val: 'compression', name: 'Compression Gear' },
      { val: 'team_jacket', name: 'Team Jacket' },
      { val: 'helmet', name: 'Helmet' },
      { val: 'cleats', name: 'Branded Cleats' },
      { val: 'letterman_jacket', name: 'Letterman Jacket' },
      { val: 'golf_polo', name: 'Golf Polo' },
    ],
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
]

export function ArsenalGrid({ brandId, hasFinal }: { brandId: string; hasFinal: boolean }) {
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
  return (
    <div className="space-y-6">
      <div>
        <p className="text-eyebrow text-primary">Featured</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Photo-real product mockups using your logo as the reference.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FEATURED.map((c) => (
            <CategoryCard key={c.id} brandId={brandId} def={c} featured />
          ))}
        </div>
      </div>
      <div>
        <p className="text-eyebrow text-primary">More categories</p>
        <p className="mt-1 text-sm text-muted-foreground">
          One-off branded assets you&rsquo;ll reach for again and again.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STANDARD.map((c) => (
            <CategoryCard key={c.id} brandId={brandId} def={c} />
          ))}
        </div>
      </div>
    </div>
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
  const [state, action, pending] = useActionState<ArsenalGenState, FormData>(
    generateArsenalAsset,
    {}
  )
  const [option, setOption] = useState(def.options?.[0]?.val ?? '')
  const [notes, setNotes] = useState('')
  const url = state.url
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
          Gemini renders this in ~30–60 seconds. Stay on the page.
        </p>
      )}
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
    </form>
  )
}
