#!/usr/bin/env node
/**
 * Seed a fully-built demo site as Marcus Hill — a fictional D1 football
 * wide receiver — so prospects can see what the platform produces.
 *
 * Idempotent: re-running wipes Marcus's existing blocks/pages and rebuilds.
 *
 *   pnpm seed:demo
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

let env = {}
try {
  env = Object.fromEntries(
    readFileSync(envPath, 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      })
  )
} catch (err) {
  console.error(`Failed to read ${envPath}:`, err.message)
  process.exit(1)
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const DEMO_EMAIL = 'marcus@demo.theedgezone.com'
const DEMO_NAME = 'Marcus Hill'
const DEMO_SLUG = 'marcushill'

// Unsplash photo IDs that are stable and on-brand. ?w=1600 keeps payload sane.
const IMG = {
  heroAction: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1800&q=80',
  heroPortrait: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1800&q=80',
  stadiumTunnel: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1800&q=80',
  trainingDawn: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1800&q=80',
  weightRoom: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1800&q=80',
  gameNight: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1800&q=80',
  catch1: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=1200&q=80',
  catch2: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=1200&q=80',
  catch3: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=1200&q=80',
  catch4: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80',
  campusGroup: 'https://images.unsplash.com/photo-1543269664-647b9ba2b4a3?w=1800&q=80',
  merchTee: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=1200&q=80',
  merchHoodie: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80',
  merchHat: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1200&q=80',
  sponsorAdidas: 'https://placehold.co/300x150/000/fff?text=ADIDAS',
  sponsorGatorade: 'https://placehold.co/300x150/F26522/fff?text=GATORADE',
  sponsorRaisingCanes: 'https://placehold.co/300x150/c8102e/fff?text=Raising+Cane%27s',
  sponsorWhoop: 'https://placehold.co/300x150/000/00ff85?text=WHOOP',
}

async function ensureUser() {
  // Reuse existing or create fresh.
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 200 })
  const existing = list?.users?.find((u) => u.email === DEMO_EMAIL)
  if (existing) return existing.id
  const { data: created, error } = await supabase.auth.admin.createUser({
    email: DEMO_EMAIL,
    email_confirm: true,
    user_metadata: { display_name: DEMO_NAME },
    password: cryptoPassword(),
  })
  if (error) throw new Error(`createUser failed: ${error.message}`)
  return created.user.id
}

function cryptoPassword() {
  return 'Demo-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

async function upsertProfile(userId) {
  await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: DEMO_NAME,
        avatar_url: IMG.heroPortrait,
        bio: 'WR · #11 · D1 football. Building beyond the field — content, community, and gameday moments.',
        sport: 'Football',
        athletic_position: 'Wide Receiver',
        school: 'State University',
        conference: 'Big Atlantic',
        division: 'D1 FBS',
        jersey_number: '11',
        hometown: 'Charlotte, NC',
        height_inches: 74,
        weight_lbs: 196,
        brand_primary_color: '#E63946',
        brand_secondary_color: '#0a0a0a',
        brand_tagline: 'Catch the moment.',
        brand_voice: 'Direct, confident, specific. Player-first, never hype.',
        achievements:
          '2024 First-Team All-Conference\n2023 Bowl Game MVP\nAcademic All-American 2022, 2023',
        socials: {
          instagram: 'https://instagram.com/marcushill11',
          tiktok: 'https://tiktok.com/@marcushill11',
          twitter: 'https://x.com/marcushill11',
          youtube: 'https://youtube.com/@marcushill11',
        },
      },
      { onConflict: 'id' }
    )
    .throwOnError()
}

async function resetSite(userId) {
  // Find existing demo site for this user (if any) and wipe its pages/blocks/products.
  const { data: existing } = await supabase
    .from('sites')
    .select('id')
    .eq('user_id', userId)
    .eq('slug', DEMO_SLUG)
    .maybeSingle()

  if (existing) {
    await supabase.from('site_blocks').delete().in(
      'page_id',
      ((await supabase.from('site_pages').select('id').eq('site_id', existing.id)).data ?? []).map(
        (p) => p.id
      )
    )
    await supabase.from('site_pages').delete().eq('site_id', existing.id)
    await supabase.from('site_products').delete().eq('site_id', existing.id)
    await supabase.from('site_membership_tiers').delete().eq('site_id', existing.id)
    await supabase.from('site_support_rewards').delete().eq('site_id', existing.id)
    return existing.id
  }

  const { data: created, error } = await supabase
    .from('sites')
    .insert({
      user_id: userId,
      slug: DEMO_SLUG,
      display_name: DEMO_NAME,
      tagline: 'Catch the moment.',
      status: 'published',
      theme: {
        primary: '#E63946',
        secondary: '#0a0a0a',
        bg_color: '#0a0a0a',
        text_color: '#e7e7e7',
        heading_color: '#ffffff',
        muted_color: '#9aa1a8',
        card_bg: '#141414',
        border_color: '#262626',
        font_heading:
          'Inter Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        font_body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
        button_radius: '6px',
      },
      social: {
        instagram: 'https://instagram.com/marcushill11',
        tiktok: 'https://tiktok.com/@marcushill11',
        twitter: 'https://x.com/marcushill11',
        youtube: 'https://youtube.com/@marcushill11',
      },
      header: { variant: 'minimal' },
      footer: { variant: 'minimal' },
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) throw new Error(`create site failed: ${error.message}`)
  return created.id
}

async function addPage(siteId, path, title, blocks) {
  const { data: page } = await supabase
    .from('site_pages')
    .insert({ site_id: siteId, path, title })
    .select('id')
    .single()
  await supabase
    .from('site_blocks')
    .insert(
      blocks.map((b, i) => ({
        page_id: page.id,
        position: i,
        block_type: b.type,
        props: b.props ?? {},
      }))
    )
    .throwOnError()
}

async function seedProducts(siteId) {
  await supabase.from('site_products').insert([
    {
      site_id: siteId,
      name: '#11 Premium Tee',
      description: 'Heavyweight cotton tee with chest-print 11. Limited drop.',
      price_cents: 3500,
      currency: 'usd',
      image_url: IMG.merchTee,
      active: true,
      position: 0,
    },
    {
      site_id: siteId,
      name: 'Gameday Hoodie',
      description: '500gsm fleece. Embroidered logo on the chest, full back graphic.',
      price_cents: 6500,
      currency: 'usd',
      image_url: IMG.merchHoodie,
      active: true,
      position: 1,
    },
    {
      site_id: siteId,
      name: 'Snapback — Black/Red',
      description: 'Structured 6-panel snapback. 3D logo embroidery.',
      price_cents: 3000,
      currency: 'usd',
      image_url: IMG.merchHat,
      active: true,
      position: 2,
    },
  ]).throwOnError()
}

async function seedTiers(siteId) {
  await supabase
    .from('site_membership_tiers')
    .insert([
      {
        site_id: siteId,
        name: 'Sideline',
        description: 'Weekly behind-the-scenes posts + Discord access.',
        price_cents: 500,
        billing_interval: 'month',
        perks: ['Weekly BTS posts', 'Discord access', 'Early merch access'],
        active: true,
        position: 0,
      },
      {
        site_id: siteId,
        name: 'Field',
        description: 'Everything in Sideline + monthly Zoom + signed memorabilia twice a year.',
        price_cents: 2500,
        billing_interval: 'month',
        perks: [
          'All Sideline perks',
          'Monthly group Zoom',
          'Signed memorabilia (2x/yr)',
          'Early merch + 15% off',
        ],
        active: true,
        position: 1,
      },
      {
        site_id: siteId,
        name: 'Captain',
        description: 'VIP access — meet & greet at every home game, private messaging, custom drop.',
        price_cents: 9900,
        billing_interval: 'month',
        perks: [
          'All Field perks',
          'Home game meet & greet',
          'Private messaging',
          'Custom Captain-only merch',
        ],
        active: true,
        position: 2,
      },
    ])
    .throwOnError()
}

async function buildHome() {
  return [
    {
      type: 'hero',
      props: {
        heading: 'Marcus Hill · #11',
        subheading: 'WR · State University · Building what comes after Saturdays.',
        bg_image: IMG.stadiumTunnel,
        bg_position: 'center center',
        cta_text: 'Watch the reel',
        cta_url: '#highlights',
        overlay_color: '#000000',
        overlay_opacity: 0.55,
        height: '85vh',
        text_align: 'left',
      },
    },
    {
      type: 'stats',
      props: {
        title: 'By the numbers',
        layout: 'cards',
        bg_color: '#0d0d0d',
        text_color: '#ffffff',
        value_size: '6xl',
        value_weight: 'black',
        label_size: 'xs',
        label_case: 'uppercase',
        label_tracking: 'widest',
        stats: [
          { icon: 'emoji:🏆', value: '2024', label: 'First-team All-Conf', color: '#E63946' },
          { icon: 'emoji:🎯', value: '78', label: 'Career receptions', color: '#E63946' },
          { icon: 'emoji:⚡', value: '4.42', label: '40-yard dash', color: '#E63946' },
          { icon: 'emoji:📈', value: '14.8', label: 'Yards per catch', color: '#E63946' },
          { icon: 'emoji:🎓', value: '3.84', label: 'GPA', color: '#E63946' },
          { icon: 'emoji:👥', value: '52k', label: 'IG followers', color: '#E63946' },
        ],
      },
    },
    {
      type: 'text',
      props: {
        content:
          '<p>Charlotte-raised. Big Atlantic prospect. I&apos;m Marcus — a wide receiver at State University and a Communications major who&apos;s spent four years building a brand on and off the field.</p><p>This site is where game film, gameday content, my merch, and the people backing me all live. Pick a tier, grab a tee, or just scroll the gallery — every click helps me invest back into the next play.</p>',
        alignment: 'left',
        max_width: '720px',
        font_size: 'lg',
        font_weight: 'normal',
        font_family: 'body',
        line_height: 'relaxed',
        letter_spacing: 'normal',
      },
    },
    {
      type: 'gallery',
      props: {
        title: 'Recent moments',
        columns: 4,
        layout: 'grid',
        lightbox: true,
        images: [
          { url: IMG.catch1, alt: 'Sideline route' },
          { url: IMG.catch2, alt: 'End zone celebration' },
          { url: IMG.catch3, alt: 'Pre-game tunnel' },
          { url: IMG.catch4, alt: 'Practice catch' },
        ],
      },
    },
    {
      type: 'video',
      props: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '2024 highlight reel',
        aspect: '16x9',
        autoplay: false,
      },
    },
    {
      type: 'cta',
      props: {
        heading: 'Want me at your event?',
        subheading: 'Camps, clinics, autograph signings, appearances. NIL-compliant.',
        button_text: 'Book me',
        button_url: '/contact',
        bg_color: '#E63946',
        text_color: '#0a0a0a',
        bg_image: IMG.gameNight,
        bg_overlay_color: '#000000',
        bg_overlay_opacity: 0.55,
      },
    },
  ]
}

function buildAbout() {
  return [
    {
      type: 'heading',
      props: { content: 'About Marcus', level: 'h1', align: 'left' },
    },
    {
      type: 'text',
      props: {
        content:
          '<p>I grew up in Charlotte playing every sport that had a ball. Football stuck. By eighth grade I was running varsity routes; by senior year I had offers from every Big Atlantic school.</p><p>What people miss when they look at the stat line: the predawn workouts, the film sessions, the academic calendar squeezed between travel weeks. The grind doesn&apos;t make highlight reels — but it&apos;s why the highlight reel exists.</p><p>This site lets you walk that road with me. Welcome.</p>',
        alignment: 'left',
        max_width: '720px',
        font_size: 'base',
      },
    },
    {
      type: 'achievements',
      props: {
        title: 'Highlights',
        badges: [
          { icon: 'emoji:🏆', label: 'First-Team All-Conference', value: '2024' },
          { icon: 'emoji:🏅', label: 'Bowl Game MVP', value: '2023' },
          { icon: 'emoji:🎓', label: 'Academic All-American', value: '2022, 2023' },
          { icon: 'emoji:⚡', label: 'Combine 40-time: 4.42s', value: '' },
          { icon: 'emoji:🤝', label: 'Adidas roster', value: '2024 →' },
        ],
      },
    },
    {
      type: 'testimonial',
      props: {
        title: 'What coaches say',
        items: [
          {
            quote:
              'Marcus is the best route-runner I&apos;ve coached in 20 years. Plays smart, never misses a class.',
            name: 'Coach Daryl Wells',
            role: 'WR Coach, State University',
          },
          {
            quote: 'A natural leader who shows up early and stays late. Reliable. End of story.',
            name: 'Coach Tasha Reid',
            role: 'Offensive Coordinator',
          },
        ],
      },
    },
    {
      type: 'sponsors',
      props: {
        title: 'Brand partners',
        sponsors: [
          { name: 'Adidas', logo: IMG.sponsorAdidas, url: 'https://www.adidas.com' },
          { name: 'Gatorade', logo: IMG.sponsorGatorade, url: 'https://www.gatorade.com' },
          { name: "Raising Cane's", logo: IMG.sponsorRaisingCanes, url: 'https://www.raisingcanes.com' },
          { name: 'WHOOP', logo: IMG.sponsorWhoop, url: 'https://www.whoop.com' },
        ],
      },
    },
  ]
}

function buildSchedule() {
  return [
    {
      type: 'heading',
      props: { content: '2025 schedule', level: 'h1', align: 'left' },
    },
    {
      type: 'schedule',
      props: {
        title: 'Upcoming games',
        events: [
          { date: '2025-09-06', label: 'vs Pacific Coast', location: 'Home', result: '' },
          { date: '2025-09-13', label: '@ Eastern State', location: 'Away', result: '' },
          { date: '2025-09-20', label: 'vs Midwest U', location: 'Home', result: '' },
          { date: '2025-09-27', label: '@ Mountain Tech', location: 'Away', result: '' },
          { date: '2025-10-04', label: 'vs Capital A&M', location: 'Home', result: '' },
        ],
      },
    },
    {
      type: 'countdown',
      props: {
        title: 'Kickoff in',
        target_date: '2025-09-06T19:30:00-04:00',
        completed_label: 'Game day.',
      },
    },
    {
      type: 'event_countdown',
      props: {
        title: 'Next home game',
        events: [
          { name: 'vs Pacific Coast', date: '2025-09-06T19:30:00-04:00' },
          { name: 'vs Midwest U', date: '2025-09-20T19:30:00-04:00' },
        ],
      },
    },
    {
      type: 'map',
      props: {
        title: 'Stadium',
        address: 'State University Stadium, Capital City',
        embed_url:
          'https://www.openstreetmap.org/export/embed.html?bbox=-78.65,35.78,-78.62,35.81&layer=mapnik',
      },
    },
  ]
}

function buildShop() {
  return [
    { type: 'heading', props: { content: 'Shop', level: 'h1', align: 'left' } },
    {
      type: 'text',
      props: {
        content:
          '<p>Premium merch, limited drops. Every order helps fund film, training, and giving back to my high-school program.</p>',
        max_width: '720px',
      },
    },
    { type: 'merch', props: { title: 'Featured merch' } },
    {
      type: 'tip_jar',
      props: {
        title: 'Send a tip',
        description: 'Loved the latest game? Drop a tip and I&apos;ll shout you out on IG.',
        amounts: [5, 10, 25, 50],
        allow_custom: true,
      },
    },
    {
      type: 'shoutout_request',
      props: {
        title: 'Get a personalized shoutout',
        description: 'I&apos;ll record a short video for a friend, your team, or your business.',
        price_cents: 5000,
        delivery_days: 7,
      },
    },
    {
      type: 'membership_tiers',
      props: { title: 'Join the membership' },
    },
  ]
}

function buildFans() {
  return [
    { type: 'heading', props: { content: 'For the fans', level: 'h1', align: 'left' } },
    {
      type: 'email_capture',
      props: {
        title: 'Get my newsletter',
        description:
          'Weekly notes — what worked in the last game, what I&apos;m working on, where I&apos;ll be.',
        button_text: 'Sign me up',
      },
    },
    {
      type: 'guestbook',
      props: {
        title: 'Sign the guestbook',
        description: 'Drop a note. I read every one.',
      },
    },
    {
      type: 'fan_poll',
      props: {
        title: 'You decide',
        question: 'Which gloves should I wear vs Pacific Coast?',
        options: ['Stealth black', 'Red/black gradient', 'White out'],
      },
    },
    {
      type: 'supporters_wall',
      props: { title: 'Supporters wall', limit: 24 },
    },
    {
      type: 'fan_leaderboard',
      props: { title: 'Top supporters', limit: 10, show_amounts: true },
    },
    {
      type: 'social_feed',
      props: { title: 'Latest from IG', source: 'instagram' },
    },
  ]
}

function buildContact() {
  return [
    {
      type: 'heading',
      props: { content: 'Contact', level: 'h1', align: 'left' },
    },
    {
      type: 'text',
      props: {
        content:
          '<p>Press, bookings, and brand inquiries: drop me a note. I usually respond within 48 hours, faster during the off-season.</p>',
        max_width: '720px',
      },
    },
    {
      type: 'contact_form',
      props: {
        title: 'Send me a message',
        button_text: 'Send',
      },
    },
    {
      type: 'cta',
      props: {
        heading: 'Looking for representation?',
        subheading: 'My agent handles all NIL deals.',
        button_text: 'Email my agent',
        button_url: 'mailto:agent@demo.theedgezone.com',
        bg_color: '#141414',
        text_color: '#ffffff',
      },
    },
  ]
}

async function main() {
  console.log('› Ensuring demo user…')
  const userId = await ensureUser()
  console.log('  user_id:', userId)

  console.log('› Upserting profile…')
  await upsertProfile(userId)

  console.log('› Resetting site (wipes pages/blocks/products if rerunning)…')
  const siteId = await resetSite(userId)

  console.log('› Seeding products + tiers…')
  await seedProducts(siteId)
  await seedTiers(siteId)

  console.log('› Building pages…')
  await addPage(siteId, '/', 'Home', await buildHome())
  await addPage(siteId, '/about', 'About', buildAbout())
  await addPage(siteId, '/schedule', 'Schedule', buildSchedule())
  await addPage(siteId, '/shop', 'Shop', buildShop())
  await addPage(siteId, '/fans', 'For Fans', buildFans())
  await addPage(siteId, '/contact', 'Contact', buildContact())

  console.log('› Seeding orders, NILfluence calculation, EPK, podcast…')
  await seedOrders(userId)
  await seedNilfluence(userId)
  await seedEpk(userId)
  await seedPodcast(userId)
  await seedBusinessCard(userId)

  console.log('')
  console.log('Done. Public URLs:')
  console.log(`  https://theedgezone.vercel.app/site/${DEMO_SLUG}`)
  console.log(`  https://theedgezone.vercel.app/t/${DEMO_SLUG}`)
  console.log(`  https://${DEMO_SLUG}.mytalentsite.com (if DNS is wired)`)
}

async function seedOrders(userId) {
  // Clear prior demo orders, then insert a fresh set so My Products shows.
  await supabase.from('orders').delete().eq('user_id', userId).eq('product_slug', 'personal-website')
  await supabase.from('orders').delete().eq('user_id', userId).eq('product_slug', 'electronic-press-kit')
  await supabase.from('orders').delete().eq('user_id', userId).eq('product_slug', 'personal-brand-design')
  await supabase.from('orders').delete().eq('user_id', userId).eq('product_slug', 'start-a-podcast')
  await supabase.from('orders').delete().eq('user_id', userId).eq('product_slug', 'digital-business-cards')

  const now = new Date()
  const daysAgo = (n) => new Date(now.getTime() - n * 86400000).toISOString()

  await supabase.from('orders').insert([
    {
      user_id: userId,
      product_slug: 'personal-website',
      product_title: 'Personal Website',
      amount_cents: 14900,
      status: 'paid',
      purchased_at: daysAgo(45),
      plan: 'one_time',
    },
    {
      user_id: userId,
      product_slug: 'electronic-press-kit',
      product_title: 'Electronic Press Kit',
      amount_cents: 9900,
      status: 'paid',
      purchased_at: daysAgo(30),
      plan: 'one_time',
    },
    {
      user_id: userId,
      product_slug: 'personal-brand-design',
      product_title: 'Personal Brand Design',
      amount_cents: 39900,
      status: 'paid',
      purchased_at: daysAgo(60),
      plan: 'one_time',
    },
    {
      user_id: userId,
      product_slug: 'start-a-podcast',
      product_title: 'Start a Podcast',
      amount_cents: 19900,
      status: 'paid',
      purchased_at: daysAgo(14),
      plan: 'one_time',
    },
    {
      user_id: userId,
      product_slug: 'digital-business-cards',
      product_title: 'Digital Business Card',
      amount_cents: 4900,
      status: 'paid',
      purchased_at: daysAgo(7),
      plan: 'one_time',
    },
  ]).throwOnError()
}

async function seedNilfluence(userId) {
  await supabase.from('nilfluence_calculations').delete().eq('user_id', userId)
  const inputs = {
    nilfluence: {
      instagram: { followers: 52000, likes_per_post: 4100, comments_per_post: 180, shares_per_post: 95 },
      tiktok: { followers: 31000, likes_per_post: 8200, comments_per_post: 320, shares_per_post: 460 },
      twitter: { followers: 8400, likes_per_post: 210, comments_per_post: 18, shares_per_post: 32 },
      youtube: { followers: 6200, likes_per_post: 540, comments_per_post: 78, shares_per_post: 14 },
      athlete_popularity: 68,
      team_popularity: 78,
      market_size: 62,
      adjustment_factor: 5,
    },
    bms: { i: 0, d: 0, o: 0 },
  }
  // Match the live formula so the demo number looks plausible.
  const totalFollowers = 52000 + 31000 + 8400 + 6200
  const totalEng = 4100 + 180 + 95 + 8200 + 320 + 460 + 210 + 18 + 32 + 540 + 78 + 14
  const overallER = totalEng / totalFollowers
  const reachScore = Math.min(100, (Math.log10(totalFollowers + 1) / Math.log10(10_000_000)) * 100)
  const engagementScore = Math.min(100, overallER * 100 * 20)
  const popularityAvg = (68 + 78 + 62) / 3
  const score = Math.min(100, reachScore * 0.25 + engagementScore * 0.25 + popularityAvg * 0.5 + 5)
  const postValue = (totalFollowers / 1000) * (overallER * 10 * 100)

  await supabase.from('nilfluence_calculations').insert({
    user_id: userId,
    inputs,
    result: {
      nilfluence: {
        nilfluence_score: Number(score.toFixed(1)),
        total_followers: totalFollowers,
        total_engagement_rate: overallER,
        approximate_post_value: Number(postValue.toFixed(0)),
      },
      bms: { bms_100: 0 },
    },
  }).throwOnError()
}

async function seedEpk(userId) {
  await supabase.from('epks').delete().eq('user_id', userId)
  const { data: epk } = await supabase
    .from('epks')
    .insert({
      user_id: userId,
      slug: DEMO_SLUG,
      display_name: DEMO_NAME,
      tagline: 'Catch the moment.',
      status: 'published',
      theme: { primary: '#E63946', secondary: '#0a0a0a' },
      social: {
        instagram: 'https://instagram.com/marcushill11',
        tiktok: 'https://tiktok.com/@marcushill11',
        twitter: 'https://x.com/marcushill11',
        youtube: 'https://youtube.com/@marcushill11',
      },
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (!epk) return
  await supabase.from('epk_blocks').insert([
    { epk_id: epk.id, position: 0, block_type: 'hero', props: {
      heading: 'Marcus Hill · Press Kit',
      subheading: 'WR · State University · 2024 All-Conference',
      bg_image: IMG.heroAction,
      cta_text: 'Contact agent',
      cta_url: 'mailto:agent@demo.theedgezone.com',
      overlay_color: '#000', overlay_opacity: 0.5,
    } },
    { epk_id: epk.id, position: 1, block_type: 'stats', props: {
      title: 'Career snapshot',
      stats: [
        { icon: 'emoji:🏆', value: '2024', label: 'All-Conference' },
        { icon: 'emoji:🎯', value: '78', label: 'Receptions' },
        { icon: 'emoji:⚡', value: '4.42', label: '40-yd' },
        { icon: 'emoji:📈', value: '14.8', label: 'Yds/Catch' },
      ],
    } },
    { epk_id: epk.id, position: 2, block_type: 'text', props: {
      content: '<p>Four-year letterman. Communications major. NIL-active across IG, TikTok, YouTube. Bookings via agent.</p>',
    } },
    { epk_id: epk.id, position: 3, block_type: 'contact_form', props: { title: 'Inquire', button_text: 'Send' } },
  ]).throwOnError()
}

async function seedPodcast(userId) {
  await supabase.from('podcasts').delete().eq('user_id', userId)
  await supabase.from('podcasts').insert({
    user_id: userId,
    slug: DEMO_SLUG,
    title: 'On the Route',
    description: 'Weekly conversations on route-running, recovery, and life in the slot.',
    status: 'live',
    cover_url: IMG.weightRoom,
  }).throwOnError()
}

async function seedBusinessCard(userId) {
  await supabase.from('digital_business_cards').delete().eq('user_id', userId)
  await supabase.from('digital_business_cards').insert({
    user_id: userId,
    slug: DEMO_SLUG,
    display_name: DEMO_NAME,
    title: 'WR · #11',
    organization: 'State University · Big Atlantic',
    tagline: 'Catch the moment.',
    phone: '+1 (704) 555-0111',
    email: 'agent@demo.theedgezone.com',
    website: `https://theedgezone.vercel.app/site/${DEMO_SLUG}`,
    socials: {
      instagram: 'https://instagram.com/marcushill11',
      tiktok: 'https://tiktok.com/@marcushill11',
      twitter: 'https://x.com/marcushill11',
      youtube: 'https://youtube.com/@marcushill11',
    },
    primary_color: '#E63946',
    secondary_color: '#0a0a0a',
    status: 'published',
    published_at: new Date().toISOString(),
  }).throwOnError()
}

main().catch((err) => {
  console.error('seed failed:', err.message)
  process.exit(1)
})
