/**
 * Order → module provisioning.
 *
 * When a paid order arrives via the Stripe webhook, this layer creates the
 * matching domain row (sites, brand_designs, …) and links it back to the
 * order via orders.provisioned_entity_id. The same primitives are reused
 * by the "create new" buttons in the dashboard so there's one source of
 * truth.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Supabase = SupabaseClient<Database>

export type ProvisionStatus = 'ready' | 'paid' | 'provisioning'

export interface ProvisionResult {
  status: ProvisionStatus
  entity_id?: string
}

export interface OrderForProvision {
  id: string
  user_id: string
  product_slug: string
}

/** Best-effort slugify used for site subdomains, brand slugs, etc. */
export function slugify(str: string, maxLen = 50): string {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
}

/**
 * Routes a paid order to the appropriate provisioning function. Products
 * that don't have a module to provision yet (digital business cards,
 * professional services, etc.) return 'paid' with no entity_id — the
 * order shows up in My Products but has no Open / View action beyond
 * the catalog page.
 */
export async function provisionOrder(
  supabase: Supabase,
  order: OrderForProvision
): Promise<ProvisionResult> {
  switch (order.product_slug) {
    case 'personal-website':
      return provisionSite(supabase, order.user_id, order.id)
    case 'personal-brand-design':
    case 'brand-lite':
      return provisionBrandDesign(supabase, order.user_id, order.id)
    case 'electronic-press-kit':
      return provisionEpk(supabase, order.user_id, order.id)
    default:
      return { status: 'paid' }
  }
}

/**
 * Creates a sites row + Home page + seed blocks for the user.
 * Slug derives from display_name; collisions get numeric suffixes.
 */
export async function provisionSite(
  supabase: Supabase,
  userId: string,
  orderId?: string
): Promise<ProvisionResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, brand_primary_color, brand_secondary_color, sport')
    .eq('id', userId)
    .maybeSingle()

  const baseName = profile?.display_name ?? 'me'
  let slug = slugify(baseName)
  if (!slug) slug = 'site'

  const { data: existing } = await supabase
    .from('sites')
    .select('slug')
    .eq('user_id', userId)
  const existingSlugs = new Set((existing ?? []).map((s) => s.slug))
  if (existingSlugs.has(slug)) {
    let suffix = (existing?.length ?? 0) + 1
    while (existingSlugs.has(`${slug}-${suffix}`)) suffix += 1
    slug = `${slug}-${suffix}`
  }

  const { data: site, error } = await supabase
    .from('sites')
    .insert({
      user_id: userId,
      order_id: orderId ?? null,
      slug,
      display_name: profile?.display_name ?? null,
      theme: {
        primary: profile?.brand_primary_color ?? '#C8A84E',
        secondary: profile?.brand_secondary_color ?? '#000000',
      },
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !site) {
    return { status: 'provisioning' }
  }

  const { data: home } = await supabase
    .from('site_pages')
    .insert({
      site_id: site.id,
      path: '/',
      title: 'Home',
      position: 0,
    })
    .select('id')
    .single()

  if (home) {
    await supabase.from('site_blocks').insert([
      {
        page_id: home.id,
        position: 0,
        block_type: 'hero',
        props: {
          title: profile?.display_name ?? 'My Brand',
          subtitle: profile?.sport ? `${profile.sport} · NIL Athlete` : 'NIL Athlete',
        },
      },
      {
        page_id: home.id,
        position: 1,
        block_type: 'stats',
        props: {
          items: [
            { value: '—', label: 'Followers' },
            { value: '—', label: 'Engagement' },
            { value: '—', label: 'Career stat' },
          ],
        },
      },
      {
        page_id: home.id,
        position: 2,
        block_type: 'text',
        props: {
          content:
            'Tell your story here. This block holds the headline narrative — what you stand for, what brands should know, how fans should engage.',
        },
      },
    ])
  }

  return { status: 'ready', entity_id: site.id }
}

/**
 * Creates an EPK row + seed blocks reflecting the talent's profile —
 * hero, stats, schedule, contact CTA. Returns the EPK id so the caller
 * can link to the editor.
 */
export async function provisionEpk(
  supabase: Supabase,
  userId: string,
  orderId?: string
): Promise<ProvisionResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, sport, athletic_position, school, brand_primary_color, brand_secondary_color'
    )
    .eq('id', userId)
    .maybeSingle()

  const baseName = profile?.display_name ?? 'me'
  let slug = slugify(baseName)
  if (!slug) slug = 'epk'

  const { data: existing } = await supabase
    .from('epks')
    .select('slug')
    .eq('user_id', userId)
  const existingSlugs = new Set((existing ?? []).map((s) => s.slug))
  if (existingSlugs.has(slug)) {
    let suffix = (existing?.length ?? 0) + 1
    while (existingSlugs.has(`${slug}-${suffix}`)) suffix += 1
    slug = `${slug}-${suffix}`
  }

  const { data: epk, error } = await supabase
    .from('epks')
    .insert({
      user_id: userId,
      order_id: orderId ?? null,
      slug,
      display_name: profile?.display_name ?? null,
      tagline: profile?.sport
        ? `${profile.sport} · ${profile.athletic_position ?? 'NIL Athlete'}`
        : 'NIL Athlete',
      theme: {
        primary: profile?.brand_primary_color ?? '#C8A84E',
        secondary: profile?.brand_secondary_color ?? '#000000',
      },
      status: 'draft',
    })
    .select('id')
    .single()

  if (error || !epk) return { status: 'provisioning' }

  await supabase.from('epk_blocks').insert([
    {
      epk_id: epk.id,
      position: 0,
      block_type: 'hero',
      props: {
        heading: profile?.display_name ?? 'Press Kit',
        subheading: profile?.sport
          ? `${profile.sport} · ${profile.school ?? ''}`.trim().replace(/·\s*$/, '')
          : 'For brand + media inquiries',
        cta_text: 'Inquiries',
        cta_url: '#contact',
        height: '60vh',
      },
    },
    {
      epk_id: epk.id,
      position: 1,
      block_type: 'stats',
      props: {
        title: 'At a glance',
        layout: 'cards',
        stats: [
          { value: '—', label: 'Followers' },
          { value: '—', label: 'Engagement' },
          { value: '—', label: 'Career stat' },
        ],
      },
    },
    {
      epk_id: epk.id,
      position: 2,
      block_type: 'text',
      props: {
        content:
          'Use this section to introduce yourself to brands and media: positioning, what you stand for, why now.',
        max_width: '720px',
      },
    },
    {
      epk_id: epk.id,
      position: 3,
      block_type: 'contact_form',
      props: {
        title: 'Inquiries',
        submit_text: 'Send',
        fields: ['name', 'email', 'subject', 'message'],
      },
    },
  ])

  return { status: 'ready', entity_id: epk.id }
}

/** Creates a brand_designs row pre-filled from the user's profile. */
export async function provisionBrandDesign(
  supabase: Supabase,
  userId: string,
  orderId?: string
): Promise<ProvisionResult> {
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'display_name, sport, athletic_position, school, brand_primary_color, brand_secondary_color, jersey_number'
    )
    .eq('id', userId)
    .maybeSingle()

  const { data: brand, error } = await supabase
    .from('brand_designs')
    .insert({
      user_id: userId,
      order_id: orderId ?? null,
      brand_name: profile?.display_name ?? null,
      sport: profile?.sport ?? null,
      athletic_position: profile?.athletic_position ?? null,
      school: profile?.school ?? null,
      jersey_number: profile?.jersey_number ?? null,
      primary_color: profile?.brand_primary_color ?? '#C8A84E',
      secondary_color: profile?.brand_secondary_color ?? '#000000',
      status: 'concept',
    })
    .select('id')
    .single()

  if (error || !brand) return { status: 'provisioning' }
  return { status: 'ready', entity_id: brand.id }
}
