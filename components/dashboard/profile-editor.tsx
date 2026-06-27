'use client'

import { useActionState, useState } from 'react'
import {
  saveBasics,
  saveAthletic,
  saveBrand,
  saveStory,
  saveSocial,
  saveContacts,
  saveGoals,
  type SectionState,
} from '@/app/dashboard/profile/actions'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type SectionKey =
  | 'basics'
  | 'athletic'
  | 'brand'
  | 'story'
  | 'social'
  | 'contacts'
  | 'goals'

interface SectionMeta {
  key: SectionKey
  label: string
  pct: number
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

const SPORTS = [
  'Football','Basketball','Baseball','Softball','Soccer','Track & Field',
  'Swimming','Tennis','Golf','Volleyball','Wrestling','Lacrosse','Hockey',
  'Gymnastics','Cheer/Dance','Esports','Other',
]

const GOALS: { key: string; label: string; icon: string }[] = [
  { key: 'brand_deals', icon: '🤝', label: 'Attract brand partnerships' },
  { key: 'merch', icon: '🏪', label: 'Sell products or merchandise' },
  { key: 'following', icon: '📈', label: 'Grow my following' },
  { key: 'budget_nil', icon: '💡', label: 'Enhance my NIL on a budget' },
  { key: 'personal_brand', icon: '🎨', label: 'Build a personal brand' },
  { key: 'digital_identity', icon: '🌐', label: 'Establish a digital identity' },
  { key: 'content', icon: '📱', label: 'Create content for social media' },
  { key: 'learn_nil', icon: '📚', label: 'Learn about NIL' },
  { key: 'performance', icon: '⚡', label: 'Enhance athletic performance' },
  { key: 'health', icon: '💚', label: 'Mental and physical health' },
  { key: 'protect_nil', icon: '🛡️', label: 'Protect my NIL' },
  { key: 'finance', icon: '💰', label: 'Financial guidance' },
  { key: 'contracts', icon: '📝', label: 'Help with contract negotiation' },
  { key: 'nil_deal', icon: '📋', label: 'Prepare for an NIL deal' },
  { key: 'after_sports', icon: '🎓', label: 'Prepare for life after sports' },
  { key: 'network', icon: '🤝', label: 'Network with other talent' },
]

interface ProfileEditorProps {
  initialSection: SectionKey
  sectionPercents: Record<SectionKey, number>
  profile: {
    display_name: string | null
    avatar_url: string | null
    email: string
    phone: string | null
    street_address: string | null
    city: string | null
    us_state: string | null
    website_url: string | null
    weight_lbs: number | null
    hometown: string | null
    height_inches: number | null
    sport: string | null
    athletic_position: string | null
    school: string | null
    conference: string | null
    division: string | null
    jersey_number: string | null
    date_of_birth: string | null
    brand_primary_color: string | null
    brand_secondary_color: string | null
    brand_accent_color: string | null
    brand_neutral_color: string | null
    brand_tagline: string | null
    brand_voice: string | null
    brand_style_seed: string | null
    brand_mood: string | null
    brand_audience: string | null
    brand_font_pair: string | null
    brand_values: string[]
    brand_inspiration_urls: string[]
    brand_avoid: string | null
    brand_initials: string | null
    brand_vibe: string | null
    brand_bg_pref: string | null
    brand_elements: string | null
    brand_include_name: boolean | null
    brand_include_initials: boolean | null
    brand_include_jersey: boolean | null
    bio: string | null
    achievements: string | null
    socials: Record<string, string>
    social_metrics?: Record<string, { followers?: number; er?: number }> | null
    selected_goals: string[]
    agency_name: string | null
    agent_name: string | null
    agent_email: string | null
    agent_phone: string | null
  }
}

export function ProfileEditor({ initialSection, sectionPercents, profile }: ProfileEditorProps) {
  const [active, setActive] = useState<SectionKey>(initialSection)

  const sections: SectionMeta[] = [
    { key: 'basics', label: 'Basics', pct: sectionPercents.basics },
    { key: 'athletic', label: 'Athletic', pct: sectionPercents.athletic },
    { key: 'brand', label: 'Brand', pct: sectionPercents.brand },
    { key: 'story', label: 'Story', pct: sectionPercents.story },
    { key: 'social', label: 'Social', pct: sectionPercents.social },
    { key: 'contacts', label: 'Contacts', pct: sectionPercents.contacts },
    { key: 'goals', label: 'Goals', pct: sectionPercents.goals },
  ]

  return (
    <div>
      {/* Section tabs with completion % */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={cn(
              'text-display rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
              active === s.key
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-panel/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
            {s.pct > 0 && (
              <span className="ml-2 opacity-70">{s.pct}%</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === 'basics' && <BasicsForm profile={profile} />}
        {active === 'athletic' && <AthleticForm profile={profile} />}
        {active === 'brand' && <BrandForm profile={profile} />}
        {active === 'story' && <StoryForm profile={profile} />}
        {active === 'social' && <SocialForm profile={profile} />}
        {active === 'contacts' && <ContactsForm profile={profile} />}
        {active === 'goals' && <GoalsForm profile={profile} />}
      </div>
    </div>
  )
}

function SectionShell({
  state,
  pending,
  children,
  saveLabel = 'Save section',
}: {
  state: SectionState
  pending: boolean
  children: React.ReactNode
  saveLabel?: string
}) {
  return (
    <div className="space-y-6 rounded-[var(--radius)] border border-border bg-panel/40 p-6">
      {children}
      {state?.error && <Alert variant="destructive">{state.error}</Alert>}
      {state?.success && <Alert variant="success">{state.success}</Alert>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving...' : saveLabel}
        </Button>
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ── BASICS ────────────────────────────────────────────────────────────────
function BasicsForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveBasics, undefined)
  const heightFeet =
    profile.height_inches != null ? Math.floor(profile.height_inches / 12) : ''
  const heightInches =
    profile.height_inches != null ? profile.height_inches % 12 : ''

  return (
    <form action={action}>
      <SectionShell state={state} pending={pending}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" required>
            <Input name="display_name" defaultValue={profile.display_name ?? ''} required maxLength={80} />
          </FormField>
          <FormField label="Email">
            <Input value={profile.email} disabled />
          </FormField>
          <FormField label="Phone">
            <Input name="phone" defaultValue={profile.phone ?? ''} />
          </FormField>
          <FormField label="Website URL">
            <Input name="website_url" type="url" defaultValue={profile.website_url ?? ''} placeholder="https://" />
          </FormField>
          <FormField label="Street address">
            <Input name="street_address" defaultValue={profile.street_address ?? ''} />
          </FormField>
          <FormField label="City">
            <Input name="city" defaultValue={profile.city ?? ''} />
          </FormField>
          <FormField label="State">
            <select
              name="us_state"
              defaultValue={profile.us_state ?? ''}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Hometown">
            <Input name="hometown" defaultValue={profile.hometown ?? ''} />
          </FormField>
          <FormField label="Weight (lbs)">
            <Input name="weight_lbs" type="number" min={0} max={1000} defaultValue={profile.weight_lbs ?? ''} />
          </FormField>
          <FormField label="Height (ft / in)">
            <div className="flex gap-2">
              <select
                name="height_feet"
                defaultValue={heightFeet}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">ft</option>
                {[4, 5, 6, 7].map((f) => (
                  <option key={f} value={f}>{f}&apos;</option>
                ))}
              </select>
              <select
                name="height_inches_only"
                defaultValue={heightInches}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">in</option>
                {Array.from({ length: 12 }, (_, i) => i).map((i) => (
                  <option key={i} value={i}>{i}&quot;</option>
                ))}
              </select>
            </div>
          </FormField>
          <FormField label="Profile photo URL">
            <Input name="avatar_url" type="url" defaultValue={profile.avatar_url ?? ''} placeholder="https://" />
          </FormField>
        </div>
      </SectionShell>
    </form>
  )
}

// ── ATHLETIC ──────────────────────────────────────────────────────────────
function AthleticForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveAthletic, undefined)
  return (
    <form action={action}>
      <SectionShell state={state} pending={pending}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Sport">
            <select
              name="sport"
              defaultValue={profile.sport ?? ''}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Position">
            <Input name="athletic_position" defaultValue={profile.athletic_position ?? ''} />
          </FormField>
          <FormField label="School">
            <Input name="school" defaultValue={profile.school ?? ''} />
          </FormField>
          <FormField label="Conference">
            <Input name="conference" defaultValue={profile.conference ?? ''} />
          </FormField>
          <FormField label="Division">
            <Input name="division" defaultValue={profile.division ?? ''} placeholder="D1 / D2 / D3 / NAIA / NJCAA" />
          </FormField>
          <FormField label="Jersey number">
            <Input name="jersey_number" defaultValue={profile.jersey_number ?? ''} />
          </FormField>
          <FormField label="Date of birth">
            <Input name="date_of_birth" type="date" defaultValue={profile.date_of_birth ?? ''} />
          </FormField>
        </div>
      </SectionShell>
    </form>
  )
}

// ── BRAND ─────────────────────────────────────────────────────────────────
function BrandForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveBrand, undefined)
  const VIBE_OPTIONS = [
    'Tech & Modern',
    'Bold',
    'Premium',
    'Futuristic',
    'Classic',
    'Vintage',
    'Streetwear',
    'Playful',
  ]
  return (
    <form action={action}>
      <SectionShell state={state} pending={pending}>
        <div className="space-y-6">
          {/* Logo Designer Preferences — mirrors the Brand Preferences
              panel on /dashboard/brand-design/[id]. Editing here saves
              the same columns; both surfaces stay in lockstep. */}
          <div>
            <p className="text-eyebrow text-primary">Logo designer preferences</p>
            <p className="mt-1 text-xs text-muted-foreground">
              These power the Brand Design Studio. Editing them here or on the studio page
              writes to the same fields.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <FormField label="Initials for logo">
                <Input
                  name="brand_initials"
                  defaultValue={profile.brand_initials ?? ''}
                  maxLength={5}
                  placeholder="MR"
                />
              </FormField>
              <FormField label="Brand vibe">
                <select
                  name="brand_vibe"
                  defaultValue={profile.brand_vibe ?? VIBE_OPTIONS[0]}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  {VIBE_OPTIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Background preference">
                <select
                  name="brand_bg_pref"
                  defaultValue={profile.brand_bg_pref ?? 'variety'}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="variety">Variety (Best Match)</option>
                  <option value="light">Light / White</option>
                  <option value="dark">Dark / Black</option>
                  <option value="gradient">Gradient</option>
                </select>
              </FormField>
              <FormField label="Include these elements in the logo">
                <Input
                  name="brand_elements"
                  defaultValue={profile.brand_elements ?? ''}
                  placeholder="devil, football, crown…"
                />
              </FormField>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="brand_include_name"
                  defaultChecked={profile.brand_include_name ?? true}
                  className="h-4 w-4 cursor-pointer"
                />
                <span>Include my name in the logo</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="brand_include_initials"
                  defaultChecked={profile.brand_include_initials ?? false}
                  className="h-4 w-4 cursor-pointer"
                />
                <span>Include my initials</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name="brand_include_jersey"
                  defaultChecked={profile.brand_include_jersey ?? false}
                  className="h-4 w-4 cursor-pointer"
                />
                <span>Include my jersey number</span>
              </label>
            </div>
          </div>

          {/* Colors */}
          <div>
            <p className="text-eyebrow text-primary">Brand colors</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Picked here power your Brand Design, EPK, Site, App, and Business Cards. Hex codes.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ColorField
                name="brand_primary_color"
                label="Primary"
                defaultValue={profile.brand_primary_color ?? '#C8A84E'}
              />
              <ColorField
                name="brand_secondary_color"
                label="Secondary"
                defaultValue={profile.brand_secondary_color ?? '#000000'}
              />
              <ColorField
                name="brand_accent_color"
                label="Accent (optional)"
                defaultValue={profile.brand_accent_color ?? ''}
              />
              <ColorField
                name="brand_neutral_color"
                label="Neutral (optional)"
                defaultValue={profile.brand_neutral_color ?? ''}
              />
            </div>
          </div>

          {/* Voice */}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Brand tagline">
              <Input
                name="brand_tagline"
                defaultValue={profile.brand_tagline ?? ''}
                maxLength={160}
                placeholder="One sentence — what you stand for."
              />
            </FormField>
            <FormField label="Style seed">
              <Input
                name="brand_style_seed"
                defaultValue={profile.brand_style_seed ?? ''}
                placeholder="e.g. minimalist, retro racing, bold collegiate"
              />
            </FormField>
            <FormField label="Brand mood">
              <Input
                name="brand_mood"
                defaultValue={profile.brand_mood ?? ''}
                placeholder="e.g. energetic, contemplative, defiant"
              />
            </FormField>
            <FormField label="Audience">
              <Input
                name="brand_audience"
                defaultValue={profile.brand_audience ?? ''}
                placeholder="Who you're speaking to (age, fanbase, region)"
              />
            </FormField>
            <FormField label="Font pair">
              <Input
                name="brand_font_pair"
                defaultValue={profile.brand_font_pair ?? ''}
                placeholder="e.g. Inter / Impact, Playfair / Inter"
              />
            </FormField>
          </div>

          {/* Long-form */}
          <FormField label="Brand voice">
            <textarea
              name="brand_voice"
              defaultValue={profile.brand_voice ?? ''}
              rows={3}
              maxLength={2000}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Confident, playful, technical, family-first…"
            />
          </FormField>
          <FormField label="Brand values">
            <textarea
              name="brand_values"
              defaultValue={(profile.brand_values ?? []).join(', ')}
              rows={2}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Comma-separated — e.g. discipline, community, joy, craft"
            />
          </FormField>
          <FormField label="Inspiration links">
            <textarea
              name="brand_inspiration_urls"
              defaultValue={(profile.brand_inspiration_urls ?? []).join('\n')}
              rows={3}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
              placeholder="One URL per line — moodboard pins, brands you admire, etc."
            />
          </FormField>
          <FormField label="What to avoid">
            <textarea
              name="brand_avoid"
              defaultValue={profile.brand_avoid ?? ''}
              rows={2}
              maxLength={2000}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              placeholder="Colors, motifs, words, or styles you never want associated with you"
            />
          </FormField>
        </div>
      </SectionShell>
    </form>
  )
}

function ColorField({
  name,
  label,
  defaultValue,
}: {
  name: string
  label: string
  defaultValue: string
}) {
  const [value, setValue] = useState(defaultValue)
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(value)
  return (
    <FormField label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isValid ? value : '#000000'}
          onChange={(e) => setValue(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-border"
        />
        <Input
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
    </FormField>
  )
}

// ── STORY ─────────────────────────────────────────────────────────────────
function StoryForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveStory, undefined)
  return (
    <form action={action}>
      <SectionShell state={state} pending={pending}>
        <FormField label="Bio">
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ''}
            rows={6}
            maxLength={4000}
            className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Tell your story — who you are, what drives you, what makes you different."
          />
        </FormField>
        <FormField label="Achievements">
          <textarea
            name="achievements"
            defaultValue={profile.achievements ?? ''}
            rows={6}
            maxLength={4000}
            className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Awards, championships, recognitions, milestones."
          />
        </FormField>
      </SectionShell>
    </form>
  )
}

// ── SOCIAL ────────────────────────────────────────────────────────────────
function SocialForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveSocial, undefined)
  const metrics = profile.social_metrics ?? {}
  const scoring = [
    { key: 'instagram', label: 'Instagram', icon: '📷', followerLabel: 'Followers' },
    { key: 'tiktok', label: 'TikTok', icon: '🎵', followerLabel: 'Followers' },
    { key: 'twitter', label: 'X / Twitter', icon: '🐦', followerLabel: 'Followers' },
    { key: 'youtube', label: 'YouTube', icon: '▶️', followerLabel: 'Subscribers' },
  ]
  const other = [
    { key: 'facebook', label: 'Facebook', icon: '📘' },
    { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
    { key: 'snapchat', label: 'Snapchat', icon: '👻' },
  ]
  return (
    <form action={action}>
      <SectionShell state={state} pending={pending} saveLabel="Save social profile">
        <p className="text-sm text-muted-foreground">
          Add your handle, follower count, and engagement rate for each platform. We use live data
          when your accounts are connected, and these numbers otherwise — they power your NILfluence
          score.
        </p>
        <div className="mt-4 space-y-3">
          {scoring.map((s) => (
            <div
              key={s.key}
              className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3"
            >
              <p className="text-display text-sm font-bold">
                {s.icon} {s.label}
              </p>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <FormField label="Handle">
                  <Input
                    name={s.key}
                    defaultValue={profile.socials[s.key] ?? ''}
                    placeholder="@yourhandle"
                  />
                </FormField>
                <FormField label={s.followerLabel}>
                  <Input
                    name={`${s.key}_followers`}
                    type="number"
                    min={0}
                    defaultValue={metrics[s.key]?.followers ?? ''}
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Engagement rate (%)">
                  <Input
                    name={`${s.key}_er`}
                    type="number"
                    min={0}
                    step={0.1}
                    defaultValue={metrics[s.key]?.er ?? ''}
                    placeholder="0"
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
        <p className="text-eyebrow mt-5 text-muted-foreground">Other handles</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          {other.map((s) => (
            <FormField key={s.key} label={`${s.icon} ${s.label} handle`}>
              <Input
                name={s.key}
                defaultValue={profile.socials[s.key] ?? ''}
                placeholder="@yourhandle"
              />
            </FormField>
          ))}
        </div>
      </SectionShell>
    </form>
  )
}

// ── CONTACTS ──────────────────────────────────────────────────────────────
function ContactsForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveContacts, undefined)
  return (
    <form action={action}>
      <SectionShell state={state} pending={pending}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Agency name">
            <Input name="agency_name" defaultValue={profile.agency_name ?? ''} />
          </FormField>
          <FormField label="Agent name">
            <Input name="agent_name" defaultValue={profile.agent_name ?? ''} />
          </FormField>
          <FormField label="Agent email">
            <Input name="agent_email" type="email" defaultValue={profile.agent_email ?? ''} />
          </FormField>
          <FormField label="Agent phone">
            <Input name="agent_phone" defaultValue={profile.agent_phone ?? ''} />
          </FormField>
        </div>
      </SectionShell>
    </form>
  )
}

// ── GOALS ─────────────────────────────────────────────────────────────────
function GoalsForm({ profile }: { profile: ProfileEditorProps['profile'] }) {
  const [state, action, pending] = useActionState<SectionState, FormData>(saveGoals, undefined)
  const [selected, setSelected] = useState<Set<string>>(new Set(profile.selected_goals))

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <form action={action}>
      <SectionShell state={state} pending={pending} saveLabel="Save goals">
        <p className="text-sm text-muted-foreground">
          Select all goals that apply. We use these to personalize your roadmap and
          recommend services.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {GOALS.map((goal) => {
            const isActive = selected.has(goal.key)
            return (
              <label
                key={goal.key}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border bg-background/40 p-3 text-sm transition-colors',
                  isActive ? 'border-primary text-foreground' : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                <input
                  type="checkbox"
                  name="goal"
                  value={goal.key}
                  checked={isActive}
                  onChange={() => toggle(goal.key)}
                  className="accent-primary"
                />
                <span className="text-lg">{goal.icon}</span>
                <span>{goal.label}</span>
              </label>
            )
          })}
        </div>
      </SectionShell>
    </form>
  )
}
