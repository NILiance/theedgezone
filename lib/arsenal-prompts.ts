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

// Optional visual effects the talent can layer onto generated assets.
const EFFECT_FRAGMENTS: Record<string, string> = {
  color_burst: 'a dynamic radial COLOR BURST of light rays emanating from behind the focal point',
  explosion: 'an energetic EXPLOSION / shatter burst of fragments and light radiating outward',
  gradient_glow: 'a smooth GRADIENT GLOW / aura behind the focal point, soft and premium',
  particles: 'floating PARTICLES, sparks and bokeh scattered through the composition',
  light_streaks: 'fast diagonal LIGHT STREAKS / motion lines for a sense of speed and energy',
  smoke: 'atmospheric SMOKE / FOG drifting through the background for a moody, cinematic feel',
  geometric: 'bold GEOMETRIC SHAPES (triangles, arcs, lines) as a modern decorative layer',
}

export function effectClause(effect?: string | null): string {
  const f = effect && effect !== 'none' ? EFFECT_FRAGMENTS[effect] : null
  return f
    ? `\n\nVISUAL EFFECT: incorporate ${f}, rendered using ONLY the brand colors. Keep it tasteful and on-brand — it must enhance, not overpower, the logo and text.`
    : ''
}

/** A full-bleed effect BACKGROUND (no logo/text) for compositing behind avatars. */
export function effectBackgroundPrompt(effect: string, colors: string): string {
  const f = EFFECT_FRAGMENTS[effect] ?? 'a dynamic abstract energy texture'
  return `Create a vibrant, abstract full-bleed background featuring ${f}, using ONLY these colors: ${colors}. NO text, NO words, NO logo — purely the effect/texture filling the entire square frame. High-energy, premium, suitable as a social-media avatar backdrop.`
}

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

// Templates (social posts, presentation slides) must ship as blank branded
// canvases — the talent adds their own copy. No baked-in text or placeholders.
const NO_TEXT_RULE =
  'CRITICAL — THIS IS A BLANK TEMPLATE: Do NOT render ANY text, words, letters, names, titles, captions, dates, numbers, placeholder text, lorem ipsum, or empty text boxes / placeholder rectangles anywhere in the image. Include ONLY the logo plus abstract branded graphic elements (shapes, gradients, lines, patterns). Leave generous clean negative space where the user will add their own text later.'

export function presentationPrompt(ctx: ArsenalContext, effect?: string): ArsenalPromptResult {
  return {
    aspect: '16:9',
    prompt:
      `I am providing a logo image. Create a clean, professional 16:9 widescreen presentation TITLE-SLIDE TEMPLATE.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo cleanly in the composition and build a polished branded slide layout around it using ONLY these exact colors: ${ctx.colors}. ${bgTheme(ctx.colorMode)}. Clean ${ctx.vibe ?? 'professional'} aesthetic.\n\n` +
      NO_TEXT_RULE +
      effectClause(effect),
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
  style: string,
  effect?: string
): ArsenalPromptResult {
  const spec = SOCIAL_SPECS[platform] ?? SOCIAL_SPECS.instagram!
  return {
    aspect: spec.aspect,
    prompt:
      `I am providing a logo image. Create a ${spec.size} social media post TEMPLATE for the ${platform} platform.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Place the logo prominently in the design and build a professional ${style} branded template around it using ONLY these exact colors: ${ctx.colors}. Every element — backgrounds, borders, shapes, gradients — must use these colors. ${bgTheme(ctx.colorMode)}.\n\n` +
      NO_TEXT_RULE +
      effectClause(effect),
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
  full_uniform: { desc: 'complete game-day uniform set showing jersey, shorts/pants, and accessories together as a flat-lay or mannequin display', logoPos: 'on the chest of the jersey', aspect: '3:4' },
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
  headband_game: { desc: 'athletic headband ONLY — shown flat or on a head form, NO other clothing', logoPos: 'centered on the front of the headband', aspect: '16:9' },
  shooting_shirt: { desc: 'warm-up shooting shirt or short-sleeve athletic top', logoPos: 'on the left chest', aspect: '3:4' },
  track_suit: { desc: 'full track suit (jacket + pants) displayed together', logoPos: 'on the left chest of the jacket and down the leg', aspect: '3:4' },
  sideline_gear: { desc: 'sideline outfit — team polo or quarter-zip with cap', logoPos: 'on the left chest and on the cap', aspect: '3:4' },
  letterman_jacket: { desc: 'classic letterman jacket with leather sleeves and wool body', logoPos: 'large chenille patch on the left chest and school letter on the back', aspect: '3:4' },
  game_socks: { desc: 'athletic game socks, knee-high or crew length', logoPos: 'on the calf area of each sock', aspect: '1:1' },
  batting_gloves: { desc: 'baseball/softball batting gloves, pair displayed', logoPos: 'on the back of each glove', aspect: '1:1' },
  goalkeeper_kit: { desc: 'soccer goalkeeper jersey and gloves set, bright contrasting colors', logoPos: 'centered on the chest of the jersey', aspect: '3:4' },
  swim_cap: { desc: 'competition swim cap displayed on a head form', logoPos: 'centered on both sides of the cap', aspect: '1:1' },
  wrestling_singlet: { desc: 'wrestling singlet, front and back view', logoPos: 'centered on the chest', aspect: '3:4' },
  lacrosse_pinnie: { desc: 'lacrosse pinnie/practice jersey, mesh material', logoPos: 'centered on the chest', aspect: '3:4' },
  golf_polo: { desc: 'golf polo shirt, crisp collar, performance fabric', logoPos: 'on the left chest embroidered', aspect: '3:4' },
  tennis_skirt: { desc: 'tennis skirt and top set, athletic feminine cut', logoPos: 'on the left chest of the top', aspect: '3:4' },
  cheerleader: { desc: 'cheerleader uniform — shell top, skirt, and bow', logoPos: 'centered on the chest of the shell', aspect: '3:4' },
  dance_leotard: { desc: 'dance or gymnastics leotard, competition style', logoPos: 'small on the upper chest', aspect: '3:4' },
  boxing_robe: { desc: 'boxing robe and trunks set, satin material', logoPos: 'large on the back of the robe and on the waistband of trunks', aspect: '3:4' },
  ski_suit: { desc: 'ski or snowboard race suit, one-piece or jacket+pants', logoPos: 'on the chest and on the thigh', aspect: '3:4' },
}

export const UNIFORM_ITEM_KEYS = Object.keys(UNIFORM_ITEMS)

/**
 * Sport → list of item keys (subset of UNIFORM_ITEMS keys) that make sense
 * for that sport. The UI's two-step picker reads this map to filter the
 * item dropdown after a sport is chosen. Sports share a common base
 * (jerseys, warm-ups, etc.) plus their own specialty gear.
 */
export const UNIFORM_ITEMS_BY_SPORT: Record<string, string[]> = {
  Football: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'alternate_jersey',
    'practice_jersey',
    'helmet',
    'cleats',
    'compression',
    'team_jacket',
    'warm_up',
    'sideline_gear',
    'letterman_jacket',
    'game_socks',
    'shooting_shirt',
    'headband_game',
  ],
  Basketball: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'alternate_jersey',
    'practice_jersey',
    'shooting_shirt',
    'game_shorts',
    'warm_up',
    'team_jacket',
    'compression',
    'headband_game',
    'game_socks',
    'sideline_gear',
    'letterman_jacket',
  ],
  Baseball: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'alternate_jersey',
    'practice_jersey',
    'helmet',
    'cleats',
    'batting_gloves',
    'team_jacket',
    'warm_up',
    'game_socks',
    'letterman_jacket',
  ],
  Softball: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'practice_jersey',
    'helmet',
    'cleats',
    'batting_gloves',
    'team_jacket',
    'warm_up',
    'game_socks',
    'letterman_jacket',
  ],
  Soccer: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'alternate_jersey',
    'practice_jersey',
    'game_shorts',
    'cleats',
    'goalkeeper_kit',
    'warm_up',
    'team_jacket',
    'compression',
    'game_socks',
    'sideline_gear',
  ],
  Volleyball: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'practice_jersey',
    'game_shorts',
    'warm_up',
    'team_jacket',
    'compression',
    'game_socks',
    'headband_game',
    'shooting_shirt',
  ],
  'Track & Field': [
    'home_jersey',
    'shooting_shirt',
    'game_shorts',
    'track_suit',
    'warm_up',
    'compression',
    'cleats',
    'team_jacket',
    'sideline_gear',
    'letterman_jacket',
  ],
  Swimming: ['swim_cap', 'warm_up', 'team_jacket', 'track_suit', 'letterman_jacket'],
  Tennis: [
    'tennis_skirt',
    'home_jersey',
    'shooting_shirt',
    'game_shorts',
    'warm_up',
    'team_jacket',
    'headband_game',
    'sideline_gear',
  ],
  Lacrosse: [
    'full_uniform',
    'home_jersey',
    'away_jersey',
    'lacrosse_pinnie',
    'practice_jersey',
    'helmet',
    'cleats',
    'game_shorts',
    'warm_up',
    'team_jacket',
    'compression',
    'goalkeeper_kit',
    'game_socks',
  ],
  Hockey: [
    'home_jersey',
    'away_jersey',
    'alternate_jersey',
    'practice_jersey',
    'helmet',
    'warm_up',
    'team_jacket',
    'compression',
    'sideline_gear',
    'goalkeeper_kit',
  ],
  Wrestling: ['wrestling_singlet', 'warm_up', 'team_jacket', 'letterman_jacket'],
  Golf: ['golf_polo', 'shooting_shirt', 'team_jacket', 'warm_up', 'sideline_gear'],
  Gymnastics: ['dance_leotard', 'warm_up', 'team_jacket', 'letterman_jacket'],
  Rowing: ['compression', 'shooting_shirt', 'game_shorts', 'warm_up', 'team_jacket'],
  Boxing: ['boxing_robe', 'warm_up', 'team_jacket'],
  Skiing: ['ski_suit', 'warm_up', 'team_jacket', 'letterman_jacket'],
  Cheerleading: [
    'cheerleader',
    'warm_up',
    'team_jacket',
    'headband_game',
    'letterman_jacket',
  ],
  Dance: ['dance_leotard', 'warm_up', 'team_jacket', 'letterman_jacket'],
  Other: Object.keys(UNIFORM_ITEMS),
}

export const UNIFORM_SPORTS = Object.keys(UNIFORM_ITEMS_BY_SPORT)

/** Human label for an item key — used by the UI without hard-coding strings. */
export const UNIFORM_ITEM_LABELS: Record<string, string> = {
  full_uniform: 'Full Uniform Set',
  home_jersey: 'Home Jersey',
  away_jersey: 'Away Jersey',
  warm_up: 'Warm-Up / Pre-Game',
  practice_jersey: 'Practice Jersey',
  alternate_jersey: 'Alternate / City Edition',
  game_shorts: 'Game Shorts',
  compression: 'Compression Gear',
  team_jacket: 'Team Jacket / Windbreaker',
  helmet: 'Helmet',
  cleats: 'Branded Cleats',
  headband_game: 'Game Headband',
  shooting_shirt: 'Shooting / Warm-Up Shirt',
  track_suit: 'Track Suit',
  sideline_gear: 'Sideline Gear',
  letterman_jacket: 'Letterman Jacket',
  game_socks: 'Game Socks',
  batting_gloves: 'Batting Gloves',
  goalkeeper_kit: 'Goalkeeper Kit',
  swim_cap: 'Swim Cap',
  wrestling_singlet: 'Wrestling Singlet',
  lacrosse_pinnie: 'Lacrosse Pinnie',
  golf_polo: 'Golf Polo',
  tennis_skirt: 'Tennis Skirt / Dress',
  cheerleader: 'Cheerleader Uniform',
  dance_leotard: 'Dance / Gymnastics Leotard',
  boxing_robe: 'Boxing Robe / Trunks',
  ski_suit: 'Ski / Snowboard Suit',
}

/**
 * Icon Generator — produces a clean iconographic version of the logo
 * suitable for app icons, favicons, watch faces, and other tiny surfaces.
 */
export function iconGeneratorPrompt(
  ctx: ArsenalContext,
  variant: string
): ArsenalPromptResult {
  const variantLabel: Record<string, string> = {
    app_icon: 'iOS-style rounded square app icon, the logo centered with subtle drop shadow',
    favicon: 'simple flat favicon, the logo reduced to its essential mark on a clean square',
    watch_face: 'circular watch face icon, the logo centered with a thin ring around it',
    chat_avatar: 'circular chat/Discord avatar, the logo centered with a slight gradient background',
  }
  const desc = variantLabel[variant] ?? variantLabel.app_icon!
  return {
    aspect: '1:1',
    prompt:
      `I am providing a logo image. Create a 1024x1024 ${desc} for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Use ONLY these colors: ${ctx.colors}. Treat the logo as the centerpiece — do not modify it. ` +
      `Backgrounds, gradients, and accents must draw from the brand palette. Clean, premium, instantly recognizable.\n\n` +
      `${brandCtx(ctx)}`,
  }
}

/**
 * Game Day — gameday hype social post with the logo + game info area.
 */
export function gameDayPrompt(
  ctx: ArsenalContext,
  variant: string
): ArsenalPromptResult {
  const variantDesc: Record<string, string> = {
    matchup: 'matchup graphic showing two team logos side by side with VS in the middle and a "GAME DAY" header',
    countdown: 'countdown-to-kickoff graphic with the logo and big "GAME DAY" type and game date placeholder',
    score_announcement: 'final score announcement template with the logo, big "FINAL SCORE" text, and placeholder numbers',
    hype: 'high-energy game day hype graphic with motion lines, the logo centered, and "GAME DAY" type',
  }
  const desc = variantDesc[variant] ?? variantDesc.hype!
  return {
    aspect: '1:1',
    prompt:
      `I am providing a logo image. Create a 1080x1080 ${desc} for ${ctx.brandName}.\n\n` +
      `${logoRule(ctx.colors)}\n\n` +
      `Use ONLY these colors: ${ctx.colors}. ${bgTheme(ctx.colorMode)}. Bold, sports-broadcast aesthetic. ` +
      `Leave enough negative space for the talent to overlay opponent name or score by hand.\n\n` +
      `${spellRule(ctx.brandName)}\n\n` +
      `${brandCtx(ctx)}`,
  }
}

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
