'use server'

import { revalidatePath } from 'next/cache'
import Anthropic from '@anthropic-ai/sdk'
import type SharpType from 'sharp'
import { renderTradingCard } from '@/lib/satori-card'
import { makeLogoTransparent } from '@/lib/logo-transparent'
import { buildEmailSignatureHtml, buildEmailSignaturePage } from '@/lib/email-signature-html'
import { requireUser } from '@/lib/auth'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { generateLogoAnimation, type LogoAnimationOptions } from '@/lib/brand-addons'
import { BRAND_VOICE_CONTENT_TYPES as BRAND_VOICE_CONTENT_TYPES_OPTIONS } from '@/lib/arsenal-tab-options'

const BUCKET = 'brand-assets'
const CLAUDE_MODEL = 'claude-sonnet-4-6'

// Lazy sharp so this module is safe to import from server components.
let sharpMod: typeof SharpType | null = null
async function getSharp(): Promise<typeof SharpType> {
  if (!sharpMod) sharpMod = (await import('sharp')).default
  return sharpMod
}

async function uploadToBucket(path: string, buf: Buffer, contentType: string): Promise<string> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(buf), { contentType, upsert: true })
  if (error) throw new Error(error.message)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

async function recordAddon(opts: {
  brandId: string
  kind: string
  url: string
  metadata: Record<string, unknown>
  bumpCredits?: boolean
}): Promise<{ error?: string }> {
  // Prefer the auth-bound client so RLS (owner-insert policy) governs
  // writes. Fall back to service-role if the env supplies one — keeps
  // background paths working without changes.
  const supabase = await createClient()
  const writer = createServiceClient() ?? supabase
  const { error } = await writer.from('brand_design_addons').insert({
    brand_design_id: opts.brandId,
    kind: opts.kind,
    url: opts.url,
    metadata: opts.metadata,
  })
  if (error) {
    return { error: `Couldn't save to Your Creations: ${error.message}` }
  }
  if (opts.bumpCredits) {
    const { data: brand } = await writer
      .from('brand_designs')
      .select('asset_credits_used')
      .eq('id', opts.brandId)
      .maybeSingle()
    await writer
      .from('brand_designs')
      .update({ asset_credits_used: (brand?.asset_credits_used ?? 0) + 1 })
      .eq('id', opts.brandId)
  }
  return {}
}

async function ownedBrand(brandId: string, userId: string) {
  const supabase = await createClient()
  const { data: brand } = await supabase
    .from('brand_designs')
    .select(
      'id, user_id, brand_name, sport, athletic_position, school, jersey_number, primary_color, secondary_color, final_logo_url, asset_credits_used, asset_credits_total'
    )
    .eq('id', brandId)
    .maybeSingle()
  if (!brand || brand.user_id !== userId) return null
  return brand
}

// ── Logo Animation ──────────────────────────────────────────────────────────

export type LogoAnimationActionState = { ok?: boolean; error?: string; url?: string }

export async function generateLogoAnimationAction(
  _prev: LogoAnimationActionState,
  form: FormData
): Promise<LogoAnimationActionState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const brand = await ownedBrand(brandId, user.id)
  if (!brand) return { error: 'Not your brand design' }
  if (!brand.final_logo_url) return { error: 'Pick a final logo first.' }

  const options: LogoAnimationOptions = {
    style: String(form.get('style') ?? 'zoom'),
    durationMs: Math.max(300, Math.min(8000, Number(form.get('duration_ms') ?? 1600))),
    loop: form.get('loop') === '1' || form.get('loop') === 'on',
  }
  try {
    const result = await generateLogoAnimation(brandId, options)
    const rec = await recordAddon({
      brandId,
      kind: 'logo_animation',
      url: result.url,
      metadata: options as unknown as Record<string, unknown>,
      bumpCredits: true,
    })
    if (rec.error) return { error: rec.error }
    revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true, url: result.url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Animation failed' }
  }
}

// ── Trading Card ────────────────────────────────────────────────────────────

export type TradingCardActionState = { ok?: boolean; error?: string; url?: string }

const CARD_STYLES = ['vintage', 'modern', 'holographic', 'premium_gold', 'custom'] as const

function isHexColor(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s)
}
// Pick black/white text for contrast against the chosen card color.
function readableText(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#111111' : '#ffffff'
}

export async function generateTradingCardAction(
  _prev: TradingCardActionState,
  form: FormData
): Promise<TradingCardActionState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const brand = await ownedBrand(brandId, user.id)
  if (!brand) return { error: 'Not your brand design' }
  if (!brand.final_logo_url) return { error: 'Pick a final logo first.' }

  const photo = form.get('photo')
  const stats = String(form.get('stats') ?? '').trim()
  const tagline = String(form.get('tagline') ?? '').trim()
  const styleRaw = String(form.get('style') ?? 'modern')
  const style = (CARD_STYLES as readonly string[]).includes(styleRaw) ? styleRaw : 'modern'

  if (!(photo instanceof File) || photo.size === 0) {
    return { error: 'Upload an action photo to anchor the card.' }
  }

  try {
    const sharp = await getSharp()
    const photoBuf = Buffer.from(await photo.arrayBuffer())

    const W = 800
    const H = 1120
    // Frame color presets per style
    const palette: Record<
      string,
      { bg: string; border: string; accent: string; text: string }
    > = {
      vintage: { bg: '#1a0f08', border: '#caa86a', accent: '#caa86a', text: '#fff' },
      modern: {
        bg: brand.primary_color ?? '#0b1e3f',
        border: brand.secondary_color ?? '#ffd166',
        accent: brand.secondary_color ?? '#ffd166',
        text: '#fff',
      },
      holographic: { bg: '#0a0a0e', border: '#a78bfa', accent: '#22d3ee', text: '#fff' },
      premium_gold: { bg: '#101010', border: '#FFD700', accent: '#FFD700', text: '#fff' },
    }
    // Custom colors override the preset when the talent picks their own.
    const customBg = String(form.get('bg_color') ?? '')
    const customAccent = String(form.get('accent_color') ?? '')
    const p =
      style === 'custom'
        ? {
            bg: isHexColor(customBg) ? customBg : '#0b1e3f',
            border: isHexColor(customAccent) ? customAccent : '#ffd166',
            accent: isHexColor(customAccent) ? customAccent : '#ffd166',
            text: readableText(isHexColor(customBg) ? customBg : '#0b1e3f'),
          }
        : palette[style]!

    // Resize photo to a card window.
    const photoArea = await sharp(photoBuf)
      .resize(700, 700, { fit: 'cover' })
      .png()
      .toBuffer()

    // Editable from the card editor — fall back to the brand row.
    const fName = String(form.get('name') ?? '').trim()
    const fSub = String(form.get('subline') ?? '').trim()
    const fSchool = String(form.get('school') ?? '').trim()
    const name = (fName || brand.brand_name || 'ATHLETE').toUpperCase()
    const subline = fSub || [brand.athletic_position, brand.sport].filter(Boolean).join(' · ')
    const school = fSchool || brand.school || ''
    const handle = String(form.get('handle') ?? '').trim()
    const website = String(form.get('website') ?? '').trim()

    const cardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="20" ry="20" fill="none" stroke="${p.border}" stroke-width="6"/>
  <text x="${W / 2}" y="80" font-family="Impact, sans-serif" font-size="42" font-weight="900" text-anchor="middle" fill="${p.text}">${escapeXml(name)}</text>
  ${subline ? `<text x="${W / 2}" y="120" font-family="ui-monospace, monospace" font-size="20" text-anchor="middle" fill="${p.accent}">${escapeXml(subline)}</text>` : ''}
  ${school ? `<text x="${W / 2}" y="150" font-family="ui-monospace, monospace" font-size="14" text-anchor="middle" fill="#bbbbbb">${escapeXml(school)}</text>` : ''}
  <rect x="50" y="180" width="700" height="700" rx="12" fill="#000"/>
  <image href="data:image/png;base64,${photoArea.toString('base64')}" x="50" y="180" width="700" height="700" preserveAspectRatio="xMidYMid slice"/>
  ${stats ? `<text x="60" y="930" font-family="ui-monospace, monospace" font-size="16" fill="${p.accent}">STATS</text><text x="60" y="958" font-family="ui-monospace, monospace" font-size="22" fill="${p.text}">${escapeXml(stats)}</text>` : ''}
  ${tagline ? `<text x="60" y="1010" font-family="Impact, sans-serif" font-size="28" font-weight="800" font-style="italic" fill="${p.accent}">"${escapeXml(tagline)}"</text>` : ''}
  <text x="${W - 40}" y="${H - 30}" font-family="ui-monospace, monospace" font-size="11" text-anchor="end" fill="${p.accent}" opacity="0.7">${escapeXml(style.toUpperCase())} · ${new Date().getFullYear()}</text>
</svg>`

    // Render via satori (text → vector paths with a real font) so the card is
    // never tofu on serverless; produces a front + back side-by-side. Falls back
    // to the legacy single-side SVG if the font can't be fetched.
    const photoDataUrl = `data:image/png;base64,${photoArea.toString('base64')}`
    let logoDataUrl: string | undefined
    if (brand.final_logo_url) {
      try {
        const lr = await fetch(brand.final_logo_url)
        if (lr.ok) logoDataUrl = `data:image/png;base64,${Buffer.from(await lr.arrayBuffer()).toString('base64')}`
      } catch {
        /* logo optional on the back */
      }
    }
    let png = await renderTradingCard(
      { name, subline, school, stats, tagline, handle, website, photoDataUrl, logoDataUrl, styleLabel: style.toUpperCase() },
      { bg: p.bg, border: p.border, accent: p.accent, text: p.text },
      sharp
    )
    if (!png) png = await sharp(Buffer.from(cardSvg)).png().toBuffer()
    const path = `${brandId}/addons/trading-card-${style}-${Date.now()}.png`
    const url = await uploadToBucket(path, png, 'image/png')

    const rec = await recordAddon({
      brandId,
      kind: 'trading_card',
      url,
      metadata: { style, stats, tagline },
      bumpCredits: true,
    })
    if (rec.error) return { error: rec.error }
    revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true, url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Card render failed' }
  }
}

// ── Brand Voice (content generator) ─────────────────────────────────────────

export type BrandVoiceActionState = {
  ok?: boolean
  error?: string
  url?: string
  lines?: string[]
  contentType?: string
  tone?: string
}

// Use the client-safe lists in lib/arsenal-tab-options so client and
// server stay in sync without dragging server-only code into client
// bundles.
const BRAND_VOICE_CONTENT_TYPES = BRAND_VOICE_CONTENT_TYPES_OPTIONS

export async function generateBrandVoiceLinesAction(
  _prev: BrandVoiceActionState,
  form: FormData
): Promise<BrandVoiceActionState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const brand = await ownedBrand(brandId, user.id)
  if (!brand) return { error: 'Not your brand design' }

  const contentType = String(form.get('content_type') ?? 'social_captions')
  const tone = String(form.get('tone') ?? 'Professional')
  const context = String(form.get('context') ?? '').trim()

  if (!env.ANTHROPIC_API_KEY) {
    return { error: 'Coaching engine offline. Try again later.' }
  }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('brand_tagline, brand_audience, brand_vibe, socials')
    .eq('id', user.id)
    .maybeSingle()

  const profileBlock = [
    `Athlete: ${brand.brand_name}`,
    brand.sport ? `Sport: ${brand.sport}` : '',
    brand.athletic_position ? `Position: ${brand.athletic_position}` : '',
    brand.school ? `School: ${brand.school}` : '',
    (profile as { brand_tagline?: string | null } | null)?.brand_tagline
      ? `Tagline: "${(profile as { brand_tagline?: string | null }).brand_tagline}"`
      : '',
    (profile as { brand_audience?: string | null } | null)?.brand_audience
      ? `Audience: ${(profile as { brand_audience?: string | null }).brand_audience}`
      : '',
    (profile as { brand_vibe?: string | null } | null)?.brand_vibe
      ? `Vibe: ${(profile as { brand_vibe?: string | null }).brand_vibe}`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const labelMap = Object.fromEntries(BRAND_VOICE_CONTENT_TYPES.map((c) => [c.value, c.name]))
  const contentLabel = labelMap[contentType] ?? 'Social Captions'

  const prompt = `You're a brand copywriter for athletes. Write 6 short ${contentLabel.toLowerCase()} in a "${tone}" tone for the following athlete.

${profileBlock}

${context ? `Context for this batch: ${context}\n` : ''}
Constraints:
- Each line should stand alone — usable as a single copy-paste.
- No corporate fluff, no hashtag stacking unless the format calls for it.
- Match the tone consistently. Keep each line under 280 characters.

Output exactly 6 lines. Put each line on its own line. No numbering, no preamble, no markdown formatting — just the raw lines.`

  let lines: string[] = []
  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const res = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })
    const txt = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')
    lines = txt
      .split('\n')
      .map((l) => l.replace(/^\s*[-*\d.)\s]+/, '').trim())
      .filter((l) => l.length > 0)
      .slice(0, 8)
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 401 || status === 403) {
      return {
        error:
          'The content generator is temporarily unavailable. (Admin: ANTHROPIC_API_KEY is invalid or expired — update it in the Vercel project settings.)',
      }
    }
    return { error: err instanceof Error ? err.message : 'Generation failed' }
  }
  if (lines.length === 0) return { error: 'No lines were generated. Try a different context.' }

  // Save as a markdown doc the talent can revisit from Your Creations.
  const md = `# ${contentLabel} · ${tone}\n\n${context ? `> Context: ${context}\n\n` : ''}${lines.map((l) => `- ${l}`).join('\n')}\n`
  const path = `${brandId}/addons/brand-voice-${contentType}-${Date.now()}.md`
  const url = await uploadToBucket(path, Buffer.from(md, 'utf-8'), 'text/markdown')
  const rec = await recordAddon({
    brandId,
    kind: 'brand_voice_lines',
    url,
    metadata: { contentType, contentLabel, tone, context, lines },
    bumpCredits: true,
  })
  if (rec.error) return { error: rec.error }
  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, url, lines, contentType, tone }
}

// ── QR Code ─────────────────────────────────────────────────────────────────

export type QrActionState = { ok?: boolean; error?: string; url?: string }

// Turns the raw value the talent typed into the right QR payload for the
// chosen type, so they don't have to know mailto:/tel:/sms: prefixes.
function formatQrData(type: string, raw: string): string {
  const v = raw.trim()
  const digits = v.replace(/[^\d+]/g, '')
  const handle = v.replace(/^@/, '')
  const isUrl = /^https?:\/\//i.test(v)
  switch (type) {
    case 'email':
      return v.startsWith('mailto:') ? v : `mailto:${v}`
    case 'phone':
      return v.startsWith('tel:') ? v : `tel:${digits}`
    case 'sms':
      return v.startsWith('sms:') ? v : `sms:${digits}`
    case 'whatsapp':
      return `https://wa.me/${digits.replace(/^\+/, '')}`
    case 'instagram':
      return isUrl ? v : `https://instagram.com/${handle}`
    case 'tiktok':
      return isUrl ? v : `https://tiktok.com/@${handle}`
    case 'x':
      return isUrl ? v : `https://x.com/${handle}`
    case 'linktree':
      return isUrl ? v : `https://linktr.ee/${handle}`
    case 'youtube':
    case 'facebook':
    case 'url':
      return isUrl ? v : `https://${v}`
    case 'text':
    default:
      return v
  }
}

export async function generateQrCodeAction(
  _prev: QrActionState,
  form: FormData
): Promise<QrActionState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const brand = await ownedBrand(brandId, user.id)
  if (!brand) return { error: 'Not your brand design' }

  const target = String(form.get('target') ?? '').trim()
  if (!target) return { error: 'Enter the URL or contact the QR should link to.' }
  const qrType = String(form.get('qr_type') ?? 'url')
  const data = formatQrData(qrType, target)
  const qrColor = sanitizeHex(String(form.get('qr_color') ?? '#000000'), '#000000')
  const bgColor = sanitizeHex(String(form.get('bg_color') ?? '#ffffff'), '#ffffff')
  const includeLogo = form.get('include_logo') === '1' || form.get('include_logo') === 'on'

  try {
    const apiUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=800x800&margin=12&format=png&ecc=H` +
      `&color=${qrColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}` +
      `&data=${encodeURIComponent(data)}`
    const res = await fetch(apiUrl)
    if (!res.ok) return { error: `QR service returned ${res.status}` }
    let png = Buffer.from(await res.arrayBuffer())

    if (includeLogo && brand.final_logo_url) {
      const sharp = await getSharp()
      const logoRes = await fetch(brand.final_logo_url)
      if (logoRes.ok) {
        const logoBuf = Buffer.from(await logoRes.arrayBuffer())
        // Auto-crop the logo's padding, then composite it directly over the QR
        // with its OWN transparency (no white box) — the QR shows through the
        // logo's clear areas. ECC=H keeps it scannable behind a ~22% patch.
        const transparent = { r: 0, g: 0, b: 0, alpha: 0 }
        const trimmed = await sharp(logoBuf).trim().png().toBuffer().catch(() => logoBuf)
        const logoSize = 168
        const sized = await sharp(trimmed)
          .resize(logoSize, logoSize, { fit: 'contain', background: transparent })
          .png()
          .toBuffer()
        // Knock out the logo's own white/solid background (brand-kit transparent
        // logo) so only the mark shows.
        const inner = await makeLogoTransparent(sized, sharp)
        // Clear the QR *behind* the logo with a rounded patch so the modules
        // don't show through and clutter it — the logo stays readable. At ~25%
        // center coverage the ECC=H QR is still scannable.
        const pad = 16
        const patchSize = logoSize + pad * 2
        const patchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${patchSize}" height="${patchSize}"><rect width="${patchSize}" height="${patchSize}" rx="28" ry="28" fill="${bgColor}"/></svg>`
        const patch = await sharp(Buffer.from(patchSvg)).png().toBuffer()
        png = Buffer.from(
          await sharp(png)
            .composite([
              { input: patch, gravity: 'center' },
              { input: inner, gravity: 'center' },
            ])
            .png()
            .toBuffer()
        )
      }
    }

    const path = `${brandId}/addons/qr-${Date.now()}.png`
    const url = await uploadToBucket(path, png, 'image/png')
    const rec = await recordAddon({
      brandId,
      kind: 'qr_code',
      url,
      metadata: { qrType, target, data, qrColor, bgColor, includeLogo },
      bumpCredits: true,
    })
    if (rec.error) return { error: rec.error }
    revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true, url }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'QR generation failed' }
  }
}

// ── Email Signature ─────────────────────────────────────────────────────────

export type EmailSigActionState = { ok?: boolean; error?: string; url?: string }

export async function generateEmailSigAction(
  _prev: EmailSigActionState,
  form: FormData
): Promise<EmailSigActionState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const brand = await ownedBrand(brandId, user.id)
  if (!brand) return { error: 'Not your brand design' }

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, athletic_position, sport, school, phone, website_url, socials')
    .eq('id', user.id)
    .maybeSingle()
  const { data: userRes } = await supabase.auth.admin
    .getUserById(user.id)
    .catch(() => ({ data: null }))
  const email =
    (userRes && 'user' in userRes ? userRes?.user?.email : undefined) ?? user.email ?? ''

  const name = String(form.get('name') ?? '').trim() || profile?.display_name || brand.brand_name || ''
  const title = String(form.get('title') ?? '').trim() || profile?.athletic_position || ''
  const sport = String(form.get('sport') ?? '').trim() || profile?.sport || ''
  const school = String(form.get('school') ?? '').trim() || profile?.school || ''
  const phone = String(form.get('phone') ?? '').trim() || profile?.phone || ''
  const website = String(form.get('website') ?? '').trim() || profile?.website_url || ''
  const sigEmail = String(form.get('email') ?? '').trim() || email
  const bg = sanitizeHex(String(form.get('bg_color') ?? '#ffffff'), '#ffffff')
  const nameColor = sanitizeHex(
    String(form.get('name_color') ?? brand.primary_color ?? '#111111'),
    '#111111'
  )
  const bodyColor = sanitizeHex(String(form.get('body_color') ?? '#444444'), '#444444')
  const linkColor = sanitizeHex(
    String(form.get('link_color') ?? brand.primary_color ?? '#3aa7ff'),
    '#3aa7ff'
  )
  // Socials from the editor's handle fields, else the profile.
  const socialFromForm: Record<string, string> = {}
  const addSocial = (label: string, base: string, field: string) => {
    const v = String(form.get(field) ?? '').trim()
    if (v) socialFromForm[label] = /^https?:\/\//i.test(v) ? v : `${base}${v.replace(/^@/, '')}`
  }
  addSocial('Instagram', 'https://instagram.com/', 'ig')
  addSocial('X', 'https://x.com/', 'x')
  addSocial('TikTok', 'https://tiktok.com/@', 'tiktok')
  addSocial('LinkedIn', 'https://linkedin.com/in/', 'linkedin')
  const socials = Object.keys(socialFromForm).length
    ? socialFromForm
    : ((profile?.socials as Record<string, string> | null) ?? {})

  const html = buildEmailSignatureHtml({
    name,
    title,
    sport,
    school,
    email: sigEmail,
    phone,
    website,
    socials,
    logoUrl: brand.final_logo_url ?? undefined,
    bg,
    nameColor,
    bodyColor,
    linkColor,
  })
  const wrapper = buildEmailSignaturePage(html, bg)

  const path = `${brandId}/addons/email-signature-${Date.now()}.html`
  const url = await uploadToBucket(path, Buffer.from(wrapper, 'utf-8'), 'text/html')
  const rec = await recordAddon({
    brandId,
    kind: 'email_signature',
    url,
    metadata: { title, phone, website, bg, nameColor, bodyColor, linkColor },
    bumpCredits: true,
  })
  if (rec.error) return { error: rec.error }
  revalidatePath(`/dashboard/brand-design/${brandId}`)
  return { ok: true, url }
}

// ── Social Avatars (delegates to existing generator) ─────────────────────────

export type SocialAvatarsActionState = { ok?: boolean; error?: string; url?: string; count?: number }

export async function generateSocialAvatarsAction(
  _prev: SocialAvatarsActionState,
  form: FormData
): Promise<SocialAvatarsActionState> {
  const user = await requireUser()
  const brandId = String(form.get('brand_id') ?? '')
  if (!brandId) return { error: 'Missing brand id' }
  const brand = await ownedBrand(brandId, user.id)
  if (!brand) return { error: 'Not your brand design' }
  if (!brand.final_logo_url) return { error: 'Pick a final logo first.' }

  const effect = String(form.get('effect') ?? 'none')
  try {
    const { generateSocialAvatars } = await import('@/lib/brand-addons')
    const result = await generateSocialAvatars(brandId, effect)
    const rec = await recordAddon({
      brandId,
      kind: 'social_avatars',
      url: result.url,
      metadata: { count: result.count, effect },
      bumpCredits: true,
    })
    if (rec.error) return { error: rec.error }
    revalidatePath(`/dashboard/brand-design/${brandId}`)
    return { ok: true, url: result.url, count: result.count }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Avatar pack failed' }
  }
}

// ── helpers ────────────────────────────────────────────────────────────────

function sanitizeHex(v: string, fallback: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v
  if (/^#[0-9a-fA-F]{3}$/.test(v)) return v
  return fallback
}

function esc(s: string): string {
  return s.replace(/[<>&"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : '&quot;'
  )
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  )
}
