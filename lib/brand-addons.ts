import Anthropic from '@anthropic-ai/sdk'
import type SharpType from 'sharp'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { renderLogoGif } from './logo-gif'

// Lazy-load sharp to keep this module importable from server-component
// pages even when sharp's native binding is unavailable at module init.
let sharpMod: typeof SharpType | null = null
async function getSharp(): Promise<typeof SharpType> {
  if (!sharpMod) sharpMod = (await import('sharp')).default
  return sharpMod
}

const MODEL = 'claude-sonnet-4-6'

let client: Anthropic | null = null
function getClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  return client
}

const BUCKET = 'brand-assets'

async function uploadToStorage(
  path: string,
  body: Buffer | string,
  contentType: string
): Promise<string> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const buf = typeof body === 'string' ? Buffer.from(body, 'utf8') : body
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, new Uint8Array(buf), {
      contentType,
      upsert: true,
    })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function fetchAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch ${url} → ${res.status}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] ?? c)
}

// ── Logo animation ──────────────────────────────────────────────────────────

export interface LogoAnimationOptions {
  /** 'fade' | 'slide_up' | 'slide_down' | 'zoom' | 'rotate' | 'bounce' | 'glitch' | 'reveal_wipe' */
  style?: string
  /** Duration in milliseconds. Default 1600. */
  durationMs?: number
  /** Continuous loop vs one-shot. */
  loop?: boolean
}

const ANIMATION_STYLES: Record<
  string,
  { name: string; keyframes: string; initial: string }
> = {
  fade: {
    name: 'Fade In',
    initial: 'opacity:0',
    keyframes:
      '0% { opacity: 0; } 100% { opacity: 1; }',
  },
  slide_up: {
    name: 'Slide Up',
    initial: 'opacity:0; transform: translateY(40px);',
    keyframes:
      '0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); }',
  },
  slide_down: {
    name: 'Slide Down',
    initial: 'opacity:0; transform: translateY(-40px);',
    keyframes:
      '0% { opacity: 0; transform: translateY(-40px); } 100% { opacity: 1; transform: translateY(0); }',
  },
  zoom: {
    name: 'Zoom In',
    initial: 'opacity:0; transform-origin: 256px 256px; transform: scale(0.5);',
    keyframes:
      '0% { opacity: 0; transform: scale(0.5); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); }',
  },
  rotate: {
    name: 'Rotate In',
    initial: 'opacity:0; transform-origin: 256px 256px; transform: rotate(-180deg) scale(0.7);',
    keyframes:
      '0% { opacity: 0; transform: rotate(-180deg) scale(0.7); } 100% { opacity: 1; transform: rotate(0deg) scale(1); }',
  },
  bounce: {
    name: 'Bounce',
    initial: 'opacity:0; transform-origin: 256px 256px; transform: scale(0.3);',
    keyframes:
      '0% { opacity: 0; transform: scale(0.3); } 50% { opacity: 1; transform: scale(1.15); } 70% { transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); }',
  },
  glitch: {
    name: 'Glitch',
    initial: 'opacity:0;',
    keyframes:
      '0% { opacity: 0; transform: translate(0,0); } 10% { opacity: 1; transform: translate(-4px,2px); filter: hue-rotate(45deg); } 20% { transform: translate(3px,-2px); filter: hue-rotate(-30deg); } 30% { transform: translate(-2px,1px); filter: none; } 40%,100% { opacity: 1; transform: translate(0,0); }',
  },
  reveal_wipe: {
    name: 'Reveal Wipe',
    initial: 'opacity:1; clip-path: inset(0 100% 0 0);',
    keyframes:
      '0% { clip-path: inset(0 100% 0 0); } 100% { clip-path: inset(0 0 0 0); }',
  },
  zoom_out: {
    name: 'Zoom Out',
    initial: 'opacity:0; transform-origin: 256px 256px; transform: scale(1.8);',
    keyframes:
      '0% { opacity: 0; transform: scale(1.8); } 100% { opacity: 1; transform: scale(1); }',
  },
  spin: {
    name: 'Spin In',
    initial: 'opacity:0; transform-origin: 256px 256px; transform: rotate(360deg) scale(0.4);',
    keyframes:
      '0% { opacity: 0; transform: rotate(360deg) scale(0.4); } 100% { opacity: 1; transform: rotate(0deg) scale(1); }',
  },
  pop: {
    name: 'Pop',
    initial: 'opacity:0; transform-origin: 256px 256px; transform: scale(0.2);',
    keyframes:
      '0% { opacity: 0; transform: scale(0.2); } 50% { opacity: 1; transform: scale(1.3); } 70% { transform: scale(0.92); } 100% { opacity: 1; transform: scale(1); }',
  },
  drop: {
    name: 'Drop In',
    initial: 'opacity:0; transform: translateY(-140px);',
    keyframes:
      '0% { opacity: 0; transform: translateY(-140px); } 60% { opacity: 1; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); }',
  },
  blur_in: {
    name: 'Blur In',
    initial: 'opacity:0; filter: blur(28px);',
    keyframes: '0% { opacity: 0; filter: blur(28px); } 100% { opacity: 1; filter: blur(0); }',
  },
}

export const LOGO_ANIMATION_STYLE_OPTIONS = Object.entries(ANIMATION_STYLES).map(
  ([key, def]) => ({ key, name: def.name })
)

export async function generateLogoAnimation(
  brandId: string,
  options: LogoAnimationOptions = {}
): Promise<{ url: string }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('final_logo_url, brand_name')
    .eq('id', brandId)
    .single()
  if (!brand?.final_logo_url) throw new Error('No final logo selected')

  const styleKey = options.style && ANIMATION_STYLES[options.style] ? options.style : 'zoom'
  const style = ANIMATION_STYLES[styleKey]!
  const duration = Math.max(300, Math.min(8000, options.durationMs ?? 1600))
  const loopMode = options.loop ? 'infinite' : 'forwards'

  const png = await fetchAsBuffer(brand.final_logo_url)
  const base64 = png.toString('base64')
  const dataUri = `data:image/png;base64,${base64}`

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" style="background:white;">
  <defs>
    <style>
      .logo {
        ${style.initial}
        animation: bd-anim ${duration}ms cubic-bezier(.2,.9,.2,1) ${options.loop ? 'infinite' : 'forwards'};
      }
      @keyframes bd-anim {
        ${style.keyframes}
      }
    </style>
  </defs>
  <image class="logo" href="${dataUri}" width="512" height="512" preserveAspectRatio="xMidYMid meet"/>
</svg>`

  // Also produce a standalone HTML page so the talent can open the
  // animation in a browser and screen-record it.
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(brand.brand_name ?? 'Logo')} — Animation: ${style.name}</title>
<style>html,body{margin:0;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;}
.box{width:min(80vh,80vw);aspect-ratio:1/1;}
.box svg{width:100%;height:100%;display:block;}
.controls{position:fixed;bottom:24px;display:flex;gap:8px;align-items:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#555;}
button{font-family:inherit;font-size:12px;padding:8px 14px;border:1px solid #d4d4d8;background:#fff;border-radius:6px;cursor:pointer;}
button:hover{background:#f3f4f6;}</style></head><body>
<div class="box">${svg}</div>
<div class="controls">
  <span>${escapeHtml(style.name)} · ${duration}ms ${options.loop ? '· looping' : ''}</span>
  <button onclick="location.reload()">↻ Replay</button>
</div>
</body></html>`

  const ts = Date.now()
  const htmlPath = `${brandId}/addons/logo-animation-${styleKey}-${ts}.html`
  // Keep the self-contained HTML page as a fallback (and for browsers /
  // screen-recording), but the primary deliverable is a real animated GIF so
  // Download yields a playable file (not code) and the Your Creations tile
  // shows it animating live.
  const htmlUrl = await uploadToStorage(htmlPath, html, 'text/html')
  void loopMode
  try {
    const gifBuf = await renderLogoGif(png, styleKey, {
      durationMs: duration,
      loop: options.loop,
    })
    const gifPath = `${brandId}/addons/logo-animation-${styleKey}-${ts}.gif`
    const gifUrl = await uploadToStorage(gifPath, gifBuf, 'image/gif')
    return { url: gifUrl }
  } catch {
    return { url: htmlUrl }
  }
}

// ── Brand voice doc ─────────────────────────────────────────────────────────

export async function generateBrandVoiceDoc(brandId: string): Promise<{ url: string }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('brand_name, sport, athletic_position, school, primary_color, secondary_color, style_seed, user_id')
    .eq('id', brandId)
    .single()
  if (!brand) throw new Error('Brand not found')
  const { data: profile } = await supabase
    .from('profiles')
    .select('bio, brand_voice, brand_tagline')
    .eq('id', brand.user_id)
    .maybeSingle()

  const c = getClient()
  let doc: { tagline: string; voice: string; do_use: string[]; dont_use: string[]; sample_post: string }
  if (c) {
    const prompt = `Write a one-page brand voice document for an athlete's personal brand. Be specific, not generic.

Athlete brand:
- Name: ${brand.brand_name ?? 'Unnamed'}
- Sport: ${brand.sport ?? 'TBD'}
- Position: ${brand.athletic_position ?? 'TBD'}
- School: ${brand.school ?? 'TBD'}
- Style seed: ${brand.style_seed ?? 'TBD'}
- Profile bio: ${profile?.bio ?? '—'}
- Stated voice: ${profile?.brand_voice ?? '—'}
- Stated tagline: ${profile?.brand_tagline ?? '—'}

Return JSON:
{
  "tagline": "one-line tagline (≤ 8 words, confident, no clichés)",
  "voice": "two short paragraphs describing the voice — tone, attitude, what it sounds like out loud",
  "do_use": ["5 phrases or sentence patterns this brand sounds like"],
  "dont_use": ["5 phrases or patterns this brand avoids"],
  "sample_post": "one sample social-media post (under 240 chars) in this voice"
}`
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')
      .trim()
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()
    doc = JSON.parse(stripped)
  } else {
    doc = {
      tagline: profile?.brand_tagline ?? 'Your tagline here',
      voice: profile?.brand_voice ?? 'Confident, focused, specific. Talks like a player, not a brochure.',
      do_use: ['Direct verbs', 'Concrete numbers', 'Short sentences', 'First person plural in team moments', 'Quietly confident statements'],
      dont_use: ['Hype clichés ("to the moon")', 'Generic mottos ("never give up")', 'Buzzwords ("synergy")', 'Hashtag stacking', 'Empty inspirational quotes'],
      sample_post: 'Showed up. Did the reps. See you on Saturday.',
    }
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(brand.brand_name ?? 'Brand')} — Brand Voice</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#fff; color:#111; margin:0; padding:48px 32px; }
  .wrap { max-width:640px; margin:0 auto; }
  h1 { font-size:32px; font-weight:900; letter-spacing:-.01em; margin:0 0 4px; }
  .eyebrow { color:${escapeHtml(brand.primary_color ?? '#3aa7ff')}; font-weight:800; text-transform:uppercase; letter-spacing:.18em; font-size:11px; }
  h2 { font-size:14px; text-transform:uppercase; letter-spacing:.18em; color:${escapeHtml(brand.primary_color ?? '#3aa7ff')}; margin:36px 0 12px; }
  .tag { font-size:22px; font-weight:700; line-height:1.3; padding:18px; background:#f5f6f8; border-left:4px solid ${escapeHtml(brand.primary_color ?? '#3aa7ff')}; margin:24px 0; }
  ul { padding-left:20px; }
  li { margin:6px 0; line-height:1.5; }
  .sample { background:#0a0e14; color:#fff; padding:20px; border-radius:8px; font-style:italic; line-height:1.5; }
  .meta { color:#777; font-size:11px; margin-top:40px; padding-top:16px; border-top:1px solid #e5e7eb; }
</style></head>
<body><div class="wrap">
  <p class="eyebrow">Brand voice</p>
  <h1>${escapeHtml(brand.brand_name ?? 'Brand')}</h1>
  <p class="tag">${escapeHtml(doc.tagline)}</p>
  <h2>How it sounds</h2>
  <p style="line-height:1.6;white-space:pre-line;">${escapeHtml(doc.voice)}</p>
  <h2>Use</h2>
  <ul>${doc.do_use.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
  <h2>Avoid</h2>
  <ul>${doc.dont_use.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
  <h2>Sample post</h2>
  <p class="sample">${escapeHtml(doc.sample_post)}</p>
  <p class="meta">Generated by Edge Zone · ${new Date().toISOString().slice(0, 10)}</p>
</div></body></html>`

  const path = `${brandId}/addons/brand-voice.html`
  const url = await uploadToStorage(path, html, 'text/html')
  return { url }
}

// ── QR code ─────────────────────────────────────────────────────────────────

export async function generateQrCode(brandId: string): Promise<{ url: string }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('user_id, brand_name')
    .eq('id', brandId)
    .single()
  if (!brand) throw new Error('Brand not found')
  const { data: site } = await supabase
    .from('sites')
    .select('slug, custom_domain')
    .eq('user_id', brand.user_id)
    .maybeSingle()
  const root = process.env.NEXT_PUBLIC_SITES_ROOT_DOMAIN ?? 'mytalentsite.com'
  const target = site
    ? site.custom_domain
      ? `https://${site.custom_domain}`
      : `https://${site.slug}.${root}`
    : `https://theedgezone.com`

  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&margin=8&data=${encodeURIComponent(target)}`
  const png = await fetchAsBuffer(apiUrl)
  const path = `${brandId}/addons/qr-code.png`
  const url = await uploadToStorage(path, png, 'image/png')
  return { url }
}

// ── Email signature ─────────────────────────────────────────────────────────

export async function generateEmailSignature(brandId: string): Promise<{ url: string }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('brand_name, primary_color, secondary_color, final_logo_url, user_id')
    .eq('id', brandId)
    .single()
  if (!brand) throw new Error('Brand not found')
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, sport, school, athletic_position, agent_email, website_url, socials, phone')
    .eq('id', brand.user_id)
    .maybeSingle()
  const { data: usersRes } = await supabase.auth.admin.getUserById(brand.user_id)
  const email = usersRes?.user?.email ?? ''
  const socials = (profile?.socials as Record<string, string> | null) ?? {}
  const primary = brand.primary_color ?? '#3aa7ff'

  const html = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:#111;line-height:1.4;">
  <tr>
    ${brand.final_logo_url ? `<td style="padding-right:16px;border-right:3px solid ${escapeHtml(primary)};vertical-align:top;"><img src="${escapeHtml(brand.final_logo_url)}" width="68" height="68" alt="" style="display:block;border:0;"/></td>` : ''}
    <td style="padding-left:16px;vertical-align:top;">
      <p style="margin:0 0 2px;font-size:16px;font-weight:bold;color:#111;">${escapeHtml(profile?.display_name ?? '')}</p>
      ${profile?.athletic_position || profile?.sport ? `<p style="margin:0 0 4px;color:#555;">${escapeHtml(profile?.athletic_position ?? '')} · ${escapeHtml(profile?.sport ?? '')}</p>` : ''}
      ${profile?.school ? `<p style="margin:0 0 6px;color:#555;">${escapeHtml(profile.school)}</p>` : ''}
      ${email ? `<p style="margin:0;"><a href="mailto:${escapeHtml(email)}" style="color:${escapeHtml(primary)};text-decoration:none;">${escapeHtml(email)}</a></p>` : ''}
      ${profile?.phone ? `<p style="margin:2px 0 0;color:#555;">${escapeHtml(profile.phone)}</p>` : ''}
      ${profile?.website_url ? `<p style="margin:2px 0 0;"><a href="${escapeHtml(profile.website_url)}" style="color:${escapeHtml(primary)};text-decoration:none;">${escapeHtml(profile.website_url.replace(/^https?:\/\//, ''))}</a></p>` : ''}
      ${
        Object.entries(socials)
          .filter(([, v]) => v)
          .slice(0, 4)
          .map(
            ([k, v]) => `<a href="${escapeHtml(v)}" style="color:#555;text-decoration:none;margin-right:8px;font-size:12px;">${escapeHtml(k)}</a>`
          )
          .join('') ?
          `<p style="margin:6px 0 0;">${Object.entries(socials).filter(([, v]) => v).slice(0, 4).map(([k, v]) => `<a href="${escapeHtml(v)}" style="color:#555;text-decoration:none;margin-right:8px;font-size:12px;">${escapeHtml(k)}</a>`).join('')}</p>` : ''
      }
    </td>
  </tr>
</table>`

  const wrapper = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Email signature</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f6f8;color:#111;padding:48px 24px;margin:0;}
.wrap{max-width:600px;margin:0 auto;}
.demo{background:#fff;padding:32px;border-radius:8px;border:1px solid #e5e7eb;}
.copy{background:#0a0e14;color:#fff;padding:16px;border-radius:8px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-all;}
h1{font-size:22px;font-weight:900;letter-spacing:-.01em;margin:0 0 8px;}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#777;margin:32px 0 12px;}
p.lead{color:#555;line-height:1.5;}
</style></head><body><div class="wrap">
<h1>Your email signature</h1>
<p class="lead">Copy the HTML below into your email client's signature settings (Gmail → Settings → General → Signature; Outlook → File → Options → Mail → Signatures).</p>
<h2>Preview</h2>
<div class="demo">${html}</div>
<h2>HTML to copy</h2>
<div class="copy">${escapeHtml(html)}</div>
</div></body></html>`

  const path = `${brandId}/addons/email-signature.html`
  const url = await uploadToStorage(path, wrapper, 'text/html')
  return { url }
}

// ── Social avatars (per-platform pack) ──────────────────────────────────────

const PLATFORMS = [
  { key: 'instagram', size: 320, bg: '#000', circle: true },
  { key: 'tiktok', size: 200, bg: '#000', circle: true },
  { key: 'youtube', size: 800, bg: '#000', circle: true },
  { key: 'twitter', size: 400, bg: '#000', circle: true },
  { key: 'facebook', size: 320, bg: '#fff', circle: true },
  { key: 'linkedin', size: 400, bg: '#fff', circle: true },
]

export async function generateSocialAvatars(
  brandId: string,
  effect?: string
): Promise<{ url: string; count: number }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('final_logo_url, primary_color, secondary_color')
    .eq('id', brandId)
    .single()
  if (!brand?.final_logo_url) throw new Error('No final logo selected')

  const JSZip = (await import('jszip')).default
  const sharp = await getSharp()
  const zip = new JSZip()
  const logoBuf = await fetchAsBuffer(brand.final_logo_url)

  // Optional generated effect background — one Gemini call, composited behind
  // the logo at every size. Falls back to the plain solid-colour avatars.
  let effectBg: Buffer | null = null
  if (effect && effect !== 'none') {
    try {
      const { generateArsenalImage } = await import('@/lib/gemini-image')
      const { effectBackgroundPrompt } = await import('@/lib/arsenal-prompts')
      const colors =
        [brand.primary_color, brand.secondary_color].filter(Boolean).join(', ') || 'bold brand colors'
      const res = await generateArsenalImage({
        brandId,
        prompt: effectBackgroundPrompt(effect, colors),
        category: 'avatar_effect',
      })
      effectBg = await fetchAsBuffer(res.url)
    } catch (err) {
      console.error('[avatars effect bg]', err instanceof Error ? err.message : err)
    }
  }

  // On an effect background, knock out the logo's own background so the effect
  // shows around it.
  let logoSource = logoBuf
  if (effectBg) {
    const { makeLogoTransparent } = await import('@/lib/logo-transparent')
    logoSource = await makeLogoTransparent(logoBuf, sharp).catch(() => logoBuf)
  }

  for (const p of PLATFORMS) {
    const targetSize = p.size
    const logoSize = Math.round(targetSize * (effectBg ? 0.6 : 0.72))
    const resizedLogo = await sharp(logoSource)
      .resize(logoSize, logoSize, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()

    let canvas
    if (effectBg) {
      const bg = await sharp(effectBg).resize(targetSize, targetSize, { fit: 'cover' }).png().toBuffer()
      canvas = sharp(bg)
    } else {
      canvas = sharp({
        create: {
          width: targetSize,
          height: targetSize,
          channels: 4,
          background:
            p.bg === '#fff' ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 1 },
        },
      }).png()
    }

    canvas = canvas.composite([
      {
        input: resizedLogo,
        top: Math.round((targetSize - logoSize) / 2),
        left: Math.round((targetSize - logoSize) / 2),
      },
    ])
    const composed = await canvas.png().toBuffer()
    zip.file(`${p.key}_${targetSize}x${targetSize}.png`, composed)
  }

  const zipBuf = await zip.generateAsync({ type: 'nodebuffer' })
  const path = `${brandId}/addons/social-avatars.zip`
  const url = await uploadToStorage(path, zipBuf, 'application/zip')
  return { url, count: PLATFORMS.length }
}

// ── Trading card ────────────────────────────────────────────────────────────

export async function generateTradingCard(brandId: string): Promise<{ url: string }> {
  const supabase = createServiceClient()
  if (!supabase) throw new Error('Service role key missing')
  const { data: brand } = await supabase
    .from('brand_designs')
    .select('brand_name, primary_color, secondary_color, final_logo_url, athletic_position, school, sport, user_id')
    .eq('id', brandId)
    .single()
  if (!brand) throw new Error('Brand not found')
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, sport, athletic_position, school, jersey_number, hometown, height_inches, weight_lbs, achievements')
    .eq('id', brand.user_id)
    .maybeSingle()

  const primary = brand.primary_color ?? '#3aa7ff'
  const secondary = brand.secondary_color ?? '#fff200'
  const name = profile?.display_name ?? brand.brand_name ?? 'Athlete'
  const position = profile?.athletic_position ?? brand.athletic_position ?? ''
  const sport = profile?.sport ?? brand.sport ?? ''
  const school = profile?.school ?? brand.school ?? ''
  const jersey = profile?.jersey_number ?? ''
  const hometown = profile?.hometown ?? ''
  const ht = profile?.height_inches ? `${Math.floor(profile.height_inches / 12)}'${profile.height_inches % 12}"` : ''
  const wt = profile?.weight_lbs ? `${profile.weight_lbs} lbs` : ''

  const W = 750
  const H = 1050
  const photoHref = profile?.avatar_url ? escapeHtml(profile.avatar_url) : null
  const logoHref = brand.final_logo_url ? escapeHtml(brand.final_logo_url) : null

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${escapeHtml(primary)}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${escapeHtml(secondary)}" stop-opacity="0.95"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="white" stop-opacity="0.0"/>
      <stop offset="50%" stop-color="white" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="white" stop-opacity="0.0"/>
    </linearGradient>
    <clipPath id="cardClip"><rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="32"/></clipPath>
  </defs>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="32" fill="url(#bg)"/>
  <g clip-path="url(#cardClip)">
    <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="url(#shine)"/>
    ${photoHref ? `<image href="${photoHref}" x="60" y="60" width="${W - 120}" height="640" preserveAspectRatio="xMidYMid slice"/>` : ''}
    <rect x="20" y="${H - 360}" width="${W - 40}" height="340" fill="rgba(0,0,0,0.85)"/>
  </g>
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="32" fill="none" stroke="white" stroke-width="3" opacity="0.4"/>
  ${logoHref ? `<image href="${logoHref}" x="${W - 140}" y="40" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>` : ''}
  ${jersey ? `<text x="60" y="120" font-family="Impact, sans-serif" font-size="120" font-weight="900" fill="white" opacity="0.85">#${escapeHtml(jersey)}</text>` : ''}
  <text x="60" y="${H - 260}" font-family="Impact, sans-serif" font-size="58" font-weight="900" fill="white">${escapeHtml(name).toUpperCase()}</text>
  <text x="60" y="${H - 210}" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${escapeHtml(secondary)}" letter-spacing="4">${escapeHtml((position + ' · ' + sport).toUpperCase())}</text>
  <text x="60" y="${H - 175}" font-family="Arial, sans-serif" font-size="20" fill="white" opacity="0.9">${escapeHtml(school)}</text>
  <g transform="translate(60, ${H - 130})">
    ${hometown ? `<text x="0" y="0" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" letter-spacing="2">HOMETOWN</text><text x="0" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="white">${escapeHtml(hometown)}</text>` : ''}
    ${ht ? `<text x="220" y="0" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" letter-spacing="2">HT</text><text x="220" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="white">${escapeHtml(ht)}</text>` : ''}
    ${wt ? `<text x="320" y="0" font-family="Arial, sans-serif" font-size="14" fill="white" opacity="0.7" letter-spacing="2">WT</text><text x="320" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="white">${escapeHtml(wt)}</text>` : ''}
  </g>
  <text x="${W - 60}" y="${H - 50}" font-family="Arial, sans-serif" font-size="12" fill="white" opacity="0.5" text-anchor="end" letter-spacing="2">EDGE ZONE</text>
</svg>`

  const path = `${brandId}/addons/trading-card.svg`
  const url = await uploadToStorage(path, svg, 'image/svg+xml')
  return { url }
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

export type AddonKind =
  | 'logo_animation'
  | 'brand_voice_doc'
  | 'qr_code'
  | 'email_signature'
  | 'social_avatars'
  | 'trading_card'

export async function generateAddon(
  brandId: string,
  kind: AddonKind
): Promise<{ ok: true; url: string; metadata?: Record<string, unknown> } | { ok: false; error: string }> {
  try {
    let result: { url: string; metadata?: Record<string, unknown> }
    switch (kind) {
      case 'logo_animation':
        result = await generateLogoAnimation(brandId)
        break
      case 'brand_voice_doc':
        result = await generateBrandVoiceDoc(brandId)
        break
      case 'qr_code':
        result = await generateQrCode(brandId)
        break
      case 'email_signature':
        result = await generateEmailSignature(brandId)
        break
      case 'social_avatars': {
        const r = await generateSocialAvatars(brandId)
        result = { url: r.url, metadata: { count: r.count } }
        break
      }
      case 'trading_card':
        result = await generateTradingCard(brandId)
        break
    }
    const supabase = createServiceClient()
    if (!supabase) return { ok: false, error: 'Service role key missing' }
    const { error } = await supabase.from('brand_design_addons').insert({
      brand_design_id: brandId,
      kind,
      url: result.url,
      metadata: result.metadata ?? {},
    })
    if (error) return { ok: false, error: `Couldn't save: ${error.message}` }
    return { ok: true, url: result.url, metadata: result.metadata }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
