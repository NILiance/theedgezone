/**
 * Brand Arsenal prompt builders — verbatim port of the legacy WP
 * generators at BrandDesign.php:3506-3805.
 *
 * Every prompt assumes Gemini is being handed the user's final logo as
 * the FIRST `inlineData` part (see lib/gemini-image.ts). The "logo_rule"
 * block enforces that Gemini composes around the logo rather than
 * redrawing it — that's the trick that produces clean, on-brand
 * results.
 */

export interface ArsenalContext {
  brandName: string
  /** Subtitle line: position + sport ("Quarterback · Football"). */
  positionLine?: string | null
  tagline?: string | null
  /** Free-text color description, e.g. "navy and gold". */
  colors: string
  /** Free-text vibe ("bold and modern"). */
  vibe?: string | null
  /** Free-text tone descriptor (set by admin). */
  tone?: string | null
  /** "light" or "dark" — drives background palette. */
  colorMode?: 'light' | 'dark'
  /** Style-word shortlist used in `brand_ctx`. */
  styleWords?: string
  /** Sport-specific visual hint. */
  sportVisual?: string | null
  /** Athletic position (separate from positionLine for prompt phrasing). */
  position?: string | null
  /** Sport label. */
  sport?: string | null
  /** Athlete contact info — only the categories that print it use these. */
  email?: string | null
  phone?: string | null
  website?: string | null
  school?: string | null
  socialHandles?: Record<string, string> | null
  /** Jersey number — used by uniforms/merch when item supports it. */
  jerseyNumber?: string | null
}

function bgTheme(mode: ArsenalContext['colorMode']): string {
  return mode === 'light' ? 'light/white background' : 'dark/black background'
}

function logoRule(colors: string): string {
  return (
    `RULES FOR THE LOGO AND COLORS:\n` +
    `- The attached image IS the logo. Use it EXACTLY as provided.\n` +
    `- Do NOT redraw, recreate, reinterpret, or modify the logo in any way.\n` +
    `- Do NOT change the logo's colors, shape, text, or proportions.\n` +
    `- Place the logo exactly as described below.\n` +
    `- The logo must remain crisp and clearly legible.\n` +
    `- Treat the logo as a sticker/overlay being placed onto the product or template.\n` +
    `- The ENTIRE design must use ONLY these exact colors from the logo: ${colors}. Do not introduce any other colors. All backgrounds, accents, borders, and decorative elements must be drawn from this palette.`
  )
}

function spellRule(name: string): string {
  return (
    `SPELLING CHECK: Before finalizing, carefully verify EVERY word and character. ` +
    `The name "${name}" must be spelled exactly as written — check each letter. ` +
    `All contact info, URLs, and text must be reproduced character-for-character with zero typos. ` +
    `If text appears blurry or illegible, regenerate it until it is sharp and correct.`
  )
}

function brandCtx(ctx: ArsenalContext): string {
  const sw = ctx.styleWords ?? 'bold, modern, dynamic'
  const vibe = ctx.vibe ?? 'professional'
  let s = `Brand: ${ctx.brandName}`
  if (ctx.positionLine) s += ` (${ctx.positionLine})`
  s += `. EXACT brand colors (use ONLY these): ${ctx.colors}. Style: ${sw}, ${vibe}.`
  if (ctx.sportVisual) s += ` ${ctx.sportVisual}`
  if (ctx.tone) s += ` Tone: ${ctx.tone}.`
  return s
}

// ── Aspect ratios per category — mirrors the legacy $ratio map. ──

export type ArsenalAspect = '1:1' | '16:9' | '9:16' | '3:4' | '4:3' | '10:16'

export interface ArsenalPromptResult {
  prompt: string
  aspect: ArsenalAspect
}

// ── Per-category builders ────────────────────────────────────────────────────

export function businessCardPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  const lines: string[] = [`Name (large, bold): ${ctx.brandName}`]
  if (ctx.positionLine) lines.push(`Title line: ${ctx.positionLine}`)
  if (ctx.tagline) lines.push(`Tagline (italic): "${ctx.tagline}"`)
  if (ctx.email) lines.push(`Email: ${ctx.email}`)
  if (ctx.phone) lines.push(`Phone: ${ctx.phone}`)
  if (ctx.website) lines.push(`Website: ${ctx.website}`)
  const socialBits: string[] = []
  if (ctx.socialHandles?.instagram) socialBits.push(`IG: ${ctx.socialHandles.instagram}`)
  if (ctx.socialHandles?.twitter) socialBits.push(`X: ${ctx.socialHandles.twitter}`)
  if (ctx.socialHandles?.tiktok) socialBits.push(`TT: ${ctx.socialHandles.tiktok}`)
  if (socialBits.length) lines.push(`Social: ${socialBits.join(' | ')}`)
  const cardText = lines.join('\n')

  return {
    aspect: '1:1',
    prompt:
      `I am providing a logo image. Create a premium, modern business card design (standard 3.5 x 2 inch proportions).\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `LAYOUT:\n` +
      `- Logo: upper-left corner, medium size\n` +
      `- All text on the right side and bottom area\n` +
      `- Clean, spacious layout with clear hierarchy\n\n` +
      `THIS EXACT TEXT MUST APPEAR ON THE CARD (render every line clearly and legibly):\n${cardText}\n\n` +
      `DESIGN:\n` +
      `- Use ONLY these colors: ${ctx.colors}\n` +
      `- ${bgTheme(ctx.colorMode)}\n` +
      `- Professional typography, no decorative fonts\n` +
      `- All text must be sharp, readable, and correctly spelled\n` +
      `- Show the front of the card only\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

export function emailSignaturePrompt(ctx: ArsenalContext): ArsenalPromptResult {
  const lines: string[] = [`Name (bold): ${ctx.brandName}`]
  if (ctx.positionLine) lines.push(ctx.positionLine)
  if (ctx.tagline) lines.push(`"${ctx.tagline}"`)
  if (ctx.email) lines.push(`Email: ${ctx.email}`)
  if (ctx.phone) lines.push(`Phone: ${ctx.phone}`)
  if (ctx.website) lines.push(`Web: ${ctx.website}`)
  const sigText = lines.join('\n')

  return {
    aspect: '16:9',
    prompt:
      `I am providing a logo image. Create a horizontal email signature graphic (600 x 200 pixels, landscape).\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `LAYOUT:\n` +
      `- Left 30%: Logo (centered vertically)\n` +
      `- Thin vertical divider line in brand color\n` +
      `- Right 70%: All text, left-aligned\n\n` +
      `THIS EXACT TEXT MUST APPEAR (render every line clearly):\n${sigText}\n\n` +
      `DESIGN:\n` +
      `- Use ONLY these colors: ${ctx.colors}\n` +
      `- ${bgTheme(ctx.colorMode)}\n` +
      `- Include small social media icons (Instagram, Twitter/X, TikTok) at the bottom-right\n` +
      `- Clean, corporate, professional\n` +
      `- All text sharp and legible\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

export function virtualBackgroundPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  return {
    aspect: '16:9',
    prompt:
      `I am providing a logo image. Create a professional virtual meeting background (1920x1080) for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo small and subtle in the bottom-right corner. The background should use ONLY these exact colors: ${ctx.colors} — subtle gradients or geometric patterns. ${bgTheme(ctx.colorMode)}. Professional, not distracting.`,
  }
}

export function phoneWallpaperPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  return {
    aspect: '9:16',
    prompt:
      `I am providing a logo image. Create a premium phone wallpaper (1170x2532 vertical, iPhone size) for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo large and centered. Surround it with bold design elements using ONLY these exact colors: ${ctx.colors}. ${bgTheme(ctx.colorMode)}. Clean, stylish, lockscreen-ready.`,
  }
}

export function storyHighlightPrompt(
  ctx: ArsenalContext,
  category: string
): ArsenalPromptResult {
  return {
    aspect: '1:1',
    prompt:
      `I am providing a logo image. Create a circular Instagram story highlight cover for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo centered inside a circle. The circular background must use ONLY these exact colors: ${ctx.colors}. Category theme: ${category}. Simple and clean, recognizable at small size.`,
  }
}

export function letterheadPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  const lines: string[] = [ctx.brandName]
  if (ctx.positionLine) lines.push(ctx.positionLine)
  if (ctx.email) lines.push(ctx.email)
  if (ctx.phone) lines.push(ctx.phone)
  if (ctx.website) lines.push(ctx.website)
  const lhText = lines.join('\n')

  return {
    aspect: '16:9',
    prompt:
      `I am providing a logo image. Create a professional letterhead design showing the TOP PORTION ONLY of an A4 page.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `LAYOUT (top 20% of page only):\n` +
      `- Top-left: Logo, medium size\n` +
      `- Top-right: Contact information, right-aligned, small professional font\n` +
      `- Below logo and contact: A thin horizontal line spanning the full page width in brand color\n` +
      `- Below the line: Leave blank (this is where letter body text would go)\n\n` +
      `THIS EXACT TEXT must appear right-aligned in the header:\n${lhText}\n\n` +
      `DESIGN:\n` +
      `- Use ONLY these colors: ${ctx.colors}\n` +
      `- ${bgTheme(ctx.colorMode)}\n` +
      `- Clean, corporate, minimal — suitable for formal correspondence\n` +
      `- Professional serif or clean sans-serif typography\n` +
      `- The design should look like a real letterhead template, not a poster\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

export function presentationPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  return {
    aspect: '16:9',
    prompt:
      `I am providing a logo image. Create a professional presentation title slide (16:9 widescreen) for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo centered with the athlete name "${ctx.brandName}" below it. Use ONLY these exact colors for accents: ${ctx.colors}. ${bgTheme(ctx.colorMode)}. Clean ${ctx.vibe ?? 'professional'} aesthetic. Ready-to-use title slide.\n\n` +
      `${spellRule(ctx.brandName)}`,
  }
}

export function thankYouCardPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  return {
    aspect: '10:16',
    prompt:
      `I am providing a logo image. Create a professional thank you card for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Design a 5x7 vertical thank you card with:\n` +
      `- The logo at the top, centered\n` +
      `- Bold "THANK YOU" text in brand colors: ${ctx.colors}\n` +
      `- A subtle tagline area below for a personal message\n` +
      `- ${bgTheme(ctx.colorMode)}\n` +
      `- Clean, premium feel with ${ctx.vibe ?? 'modern'} aesthetic\n` +
      `- Decorative border or accent elements using brand colors\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

export function mediaKitPrompt(ctx: ArsenalContext): ArsenalPromptResult {
  const lines: string[] = [ctx.brandName]
  if (ctx.positionLine) lines.push(ctx.positionLine)
  if (ctx.school) lines.push(ctx.school)
  if (ctx.email) lines.push(ctx.email)
  if (ctx.socialHandles) {
    for (const handle of Object.values(ctx.socialHandles)) {
      if (handle) lines.push(`@${handle.replace(/^@+/, '')}`)
    }
  }
  const mkText = lines.join('\n')

  return {
    aspect: '10:16',
    prompt:
      `I am providing a logo image. Create a professional media kit cover page for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Design a bold, magazine-style cover with:\n` +
      `- Large logo centered at top\n` +
      `- Athlete name "${ctx.brandName}" prominently displayed\n` +
      `- "MEDIA KIT" or "PRESS KIT" subtitle\n` +
      `- Contact info section:\n${mkText}\n` +
      `- Use ONLY these colors: ${ctx.colors}\n` +
      `- ${bgTheme(ctx.colorMode)}\n` +
      `- Modern ${ctx.vibe ?? 'professional'} aesthetic, agency-quality\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

// ── Social media (per-platform) ──────────────────────────────────────────────

const SOCIAL_SPECS: Record<string, { size: string; aspect: ArsenalAspect }> = {
  instagram: { size: '1080x1080 square', aspect: '1:1' },
  instagram_story: { size: '1080x1920 vertical story', aspect: '9:16' },
  tiktok: { size: '1080x1920 vertical', aspect: '9:16' },
  twitter: { size: '1200x675 landscape', aspect: '16:9' },
  youtube_banner: { size: '2560x1440 YouTube banner', aspect: '16:9' },
  linkedin: { size: '1200x627 landscape', aspect: '16:9' },
  facebook_cover: { size: '820x312 Facebook cover', aspect: '16:9' },
  twitch_banner: { size: '1200x480 Twitch banner', aspect: '16:9' },
  snapchat_geofilter: { size: '1080x2340 Snapchat geofilter', aspect: '9:16' },
}

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_SPECS) as Array<keyof typeof SOCIAL_SPECS>

export function socialMediaPrompt(
  ctx: ArsenalContext,
  platform: string,
  style: string
): ArsenalPromptResult {
  const spec = SOCIAL_SPECS[platform] ?? SOCIAL_SPECS.instagram!
  return {
    aspect: spec.aspect,
    prompt:
      `I am providing a logo image. Create a ${spec.size} social media post template for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo prominently in the center of the design. Build a professional ${style} branded template AROUND the logo using ONLY these exact colors: ${ctx.colors}. Every element — backgrounds, borders, shapes, gradients — must use these colors. ${bgTheme(ctx.colorMode)}. Leave space for optional text overlay. Platform: ${platform}.\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

// ── Merch mockup (per-product) ───────────────────────────────────────────────

const MERCH_LABELS: Record<string, string> = {
  tshirt: 't-shirt',
  hoodie: 'hoodie',
  hat: 'snapback cap',
  jersey: 'sports jersey',
  poster: 'poster/print',
  crewneck: 'crewneck sweatshirt',
  tank_top: 'tank top',
  dad_hat: 'dad hat',
  beanie: 'beanie',
  bucket_hat: 'bucket hat',
  shorts: 'athletic shorts',
  joggers: 'joggers/sweatpants',
  socks: 'athletic socks',
  headband: 'headband',
  wristband: 'wristband',
  phone_case: 'phone case',
  laptop_sleeve: 'laptop sleeve',
  duffle_bag: 'duffle bag',
  backpack: 'backpack',
  drawstring_bag: 'drawstring bag',
  tote_bag: 'tote bag',
  water_bottle: 'water bottle',
  tumbler: 'tumbler/cup',
  coffee_mug: 'coffee mug',
  stickers: 'sticker sheet',
  car_decal: 'car decal/window sticker',
  bumper_sticker: 'bumper sticker',
  trading_card: 'trading card',
  towel: 'rally towel',
  lanyard: 'lanyard',
  keychain: 'keychain',
  pin: 'enamel pin',
  patch: 'embroidered patch',
}

export const MERCH_ITEMS = Object.keys(MERCH_LABELS)

export function merchPrompt(
  ctx: ArsenalContext,
  item: string,
  tagline?: string | null
): ArsenalPromptResult {
  const ml = MERCH_LABELS[item] ?? item
  const jersey = ctx.jerseyNumber
  let mx = ''
  if (jersey && ['tshirt', 'hoodie', 'jersey', 'shorts'].includes(item)) {
    mx = ` Also show the number #${jersey}.`
  }
  if (tagline) mx += ` Include the tagline "${tagline}" as text.`

  return {
    aspect: '1:1',
    prompt:
      `I am providing a logo image. Create a photorealistic product mockup of a ${ml}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo on the front/center of the ${ml} as if it were screen-printed or embroidered. The ${ml} fabric color must be one of these exact brand colors: ${ctx.colors} (pick the darkest or most dominant). Realistic studio product photography, clean background, professional lighting.${mx}\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

// ── Sport uniforms (per-item) ────────────────────────────────────────────────

interface UniformItemConfig {
  desc: string
  logoPos: string
  aspect: ArsenalAspect
}

const UNIFORM_ITEMS: Record<string, UniformItemConfig> = {
  full_uniform: {
    desc: 'complete game-day uniform set showing jersey, shorts/pants, and accessories together as a flat-lay or mannequin display',
    logoPos: 'on the chest of the jersey',
    aspect: '3:4',
  },
  home_jersey: { desc: 'home game jersey (front view), crisp and clean', logoPos: 'centered on the chest', aspect: '3:4' },
  away_jersey: { desc: 'away/road game jersey (front view) in contrasting colors', logoPos: 'centered on the chest', aspect: '3:4' },
  warm_up: { desc: 'pre-game warm-up jacket or pullover with athletic cut', logoPos: 'on the left chest area', aspect: '3:4' },
  practice_jersey: { desc: 'practice/training jersey, more casual fit', logoPos: 'centered on the chest', aspect: '3:4' },
  alternate_jersey: { desc: 'alternate or city-edition jersey with unique colorway', logoPos: 'centered on the chest', aspect: '3:4' },
  game_shorts: { desc: 'game shorts or athletic pants ONLY — no jersey, just the bottoms', logoPos: 'on the left leg or waistband', aspect: '1:1' },
  compression: { desc: 'compression shirt and leggings set, skin-tight athletic fit', logoPos: 'small on the chest and on the thigh', aspect: '3:4' },
  team_jacket: { desc: 'team jacket, windbreaker, or zip-up — outerwear only', logoPos: 'on the left chest and large on the back', aspect: '3:4' },
  helmet: { desc: 'sports helmet ONLY (football or baseball style) — NO jersey, just the helmet on a clean surface', logoPos: 'on both sides of the helmet as decals', aspect: '1:1' },
  cleats: { desc: 'a pair of athletic cleats/shoes ONLY — NO clothing, just the footwear from a 3/4 angle', logoPos: 'on the tongue and heel of the shoe', aspect: '1:1' },
  letterman_jacket: { desc: 'classic letterman jacket with leather sleeves and wool body', logoPos: 'large chenille patch on the left chest and school letter on the back', aspect: '3:4' },
  golf_polo: { desc: 'golf polo shirt, crisp collar, performance fabric', logoPos: 'on the left chest embroidered', aspect: '3:4' },
}

export const UNIFORM_ITEM_KEYS = Object.keys(UNIFORM_ITEMS)

export function uniformPrompt(
  ctx: ArsenalContext,
  item: string,
  notes?: string | null
): ArsenalPromptResult {
  const cfg = UNIFORM_ITEMS[item] ?? {
    desc: `${item} athletic gear`,
    logoPos: 'prominently displayed',
    aspect: '3:4' as ArsenalAspect,
  }
  const sport = ctx.sport ?? 'sport'
  const jerseyText = ctx.jerseyNumber
    ? ` The number #${ctx.jerseyNumber} should be displayed prominently on the garment.`
    : ''
  const nameItems = [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'practice_jersey',
    'alternate_jersey',
  ]
  const nameText = nameItems.includes(item)
    ? ` The athlete name "${ctx.brandName}" should appear on the back.`
    : ''

  let prompt =
    `I am providing a logo image. Create a photorealistic product mockup of SPECIFICALLY a ${cfg.desc} for a ${sport} athlete.\n\n` +
    `${logoRule(ctx.colors)}\n\n` +
    `CRITICAL: Generate ONLY the specific item described above. Do NOT show a full uniform if only one piece is requested. For example, if asked for cleats, show ONLY cleats. If asked for a helmet, show ONLY the helmet.\n\n` +
    `SPORT: ${sport}\nATHLETE: ${ctx.brandName}\nITEM: ${cfg.desc}\nLOGO PLACEMENT: ${cfg.logoPos}\n\n` +
    `Place the brand logo ${cfg.logoPos}. The item should use the brand colors: ${ctx.colors} as the primary fabric/material colors.${jerseyText}${nameText}\n\n` +
    `Photorealistic product photography, professional studio lighting, clean white or neutral background. The item should look like a real piece of athletic equipment/apparel that could be purchased.`
  if (notes) prompt += `\n\nAdditional direction: ${notes}`
  prompt += `\n\n${spellRule(ctx.brandName)}\n\n${brandCtx(ctx)}`

  return { aspect: cfg.aspect, prompt }
}
