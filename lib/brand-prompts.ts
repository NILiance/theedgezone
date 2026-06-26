/**
 * Logo prompt builder — verbatim port of the legacy WP plugin's
 * `nilbd_build_prompts` (BrandDesign.php:5680), simplified to a single
 * `vibe` descriptor instead of the legacy adj1/adj2/adj3 + design-style
 * chips combo (those were redundant in practice — concept variation
 * already comes from the 6 rotating STYLE_MODS, not from layering
 * three free-text adjectives).
 *
 * Why the structure: Mike already validated the legacy prompts produce
 * great logos with our designer. The letter-by-letter spelling block is
 * the killer feature — it reliably renders the athlete's name correctly
 * because we hand the model the spelling pre-broken-out.
 */

export interface BrandPrefs {
  name: string
  sport?: string | null
  position?: string | null
  jerseyNum?: string | null
  initials?: string | null
  /** Free-text "include in logo" list (e.g. "devil, football, crown"). */
  elements?: string | null
  /** Single vibe descriptor (e.g. "Tech & Modern" or "Bold"). */
  vibe?: string | null
  /** Free-text color description, e.g. "navy and gold" or "#7a0000 and #808080". */
  colors?: string | null
  /** Exact primary/secondary hex so the prompt can demand an exact match. */
  primaryColor?: string | null
  secondaryColor?: string | null
  /** 'variety' | 'light' | 'dark' | 'gradient' — drives background guidance. */
  backgroundPref?: string | null
  /** Free-text brand inspirations. */
  inspiration?: string | null
  /** Whether to include the athlete name as readable text in the logo. */
  includeName?: boolean
  /** Whether to include the initials in the logo. */
  includeInitials?: boolean
  /** Whether to include the jersey number in the logo. */
  includeJersey?: boolean
}

const STYLE_MODS: ReadonlyArray<ReadonlyArray<string>> = [
  ['minimalist', 'clean lines', 'geometric', 'sans-serif typography'],
  ['bold', 'high contrast', 'dynamic angles', 'athletic energy'],
  ['luxury', 'premium finish', 'refined', 'gold accents'],
  ['futuristic', 'tech-forward', 'gradient', 'sleek'],
  ['dynamic', 'motion-inspired', 'action lines', 'explosive power'],
  ['classic', 'timeless', 'traditional crest', 'heritage feel'],
]

/** Round 2 variation seeds — picked per `varIdx % 8`. */
export const REFINEMENT_SEEDS = [
  'refined and elevated',
  'bolder and more dynamic',
  'cleaner and more minimal',
  'more luxurious and premium',
  'sharper and more geometric',
  'versatile with alternate lockup',
  'edgier with street style influence',
  'timeless and classic',
] as const

function letterByLetter(s: string): string {
  // "MIKE RAMIREZ" → "M-I-K-E R-A-M-I-R-E-Z"
  return s
    .split(' ')
    .map((word) => Array.from(word).join('-'))
    .join(' ')
}

function buildSpellingBlock(nameUpper: string): string {
  const spelled = letterByLetter(nameUpper)
  return (
    `CRITICAL TEXT ACCURACY: The athlete's name is "${nameUpper}", ` +
    `spelled letter by letter: ${spelled}. ` +
    `If the name appears as text anywhere in the image, every letter must be spelled exactly as shown. ` +
    `Double-check the spelling before finalizing. Do not invent, abbreviate, or misspell the name.`
  )
}

function buildInitialsBlock(initialsUpper: string): string {
  if (!initialsUpper) return ''
  const spelled = letterByLetter(initialsUpper)
  return ` The initials are exactly "${initialsUpper}" (${spelled}) — render these letters precisely.`
}

function buildBackgroundGuidance(pref: string | null | undefined): string {
  switch (pref) {
    case 'light':
      return 'Background: clean light/white background (no gradients, no patterns).'
    case 'dark':
      return 'Background: deep dark/black background that makes the logo pop.'
    case 'gradient':
      return 'Background: subtle gradient in the brand colors — modern, premium feel.'
    case 'variety':
    default:
      return 'Background: choose whatever background suits this concept best (white, dark, or subtle gradient — pick what makes the logo strongest).'
  }
}

export interface LogoPromptOptions {
  prefs: BrandPrefs
  /** Round 1 = no reference image. Round 2 = refined with chosen R1 as ref. */
  round: 1 | 2
  /** 0-based concept index — drives which style mod set we pick. */
  conceptIndex: number
  /** Round 2 only — refinement vibe (use REFINEMENT_SEEDS[varIdx % 8]). */
  refinementSeed?: string
}

/**
 * Returns the exact text prompt to send to our designer. For Round 2 you
 * also pass the chosen R1 image as the first `inlineData` part — see
 * lib/gemini-image.ts.
 */
export function buildLogoPrompt(opts: LogoPromptOptions): string {
  const { prefs, round, conceptIndex, refinementSeed } = opts
  const name = (prefs.name || 'Athlete').trim()
  const sport = (prefs.sport || 'athlete').trim()
  const jersey = (prefs.jerseyNum || '').trim()
  const initials = (prefs.initials || '').trim()
  const elements = (prefs.elements || '').trim()
  const vibe = (prefs.vibe || 'Bold').trim()
  const colors = (prefs.colors || 'blue and black').trim()
  const inspo = (prefs.inspiration || '').trim()

  const nameUpper = name.toUpperCase()
  const initialsUpper = initials.toUpperCase()

  const spellingBlock = buildSpellingBlock(nameUpper)
  // Only inject initials when the talent actually opted in — otherwise the
  // model would render initials they never asked for.
  const initialsBlock =
    prefs.includeInitials && initialsUpper ? buildInitialsBlock(initialsUpper) : ''
  // LOGO concepts are always rendered on white — that's what the legacy
  // did and it lets the same logo drop into any future Arsenal asset
  // (which DO respect background pref). The talent's bg pref only
  // applies to derived assets (social, merch, etc.).
  const backgroundLine = 'Background: pure white background, no gradients, no patterns.'
  void buildBackgroundGuidance // kept for Arsenal prompts

  // Exact-color enforcement: hand the model the literal hex values and tell it
  // to use ONLY those, so the output matches the talent's chosen palette.
  const hexes = [prefs.primaryColor, prefs.secondaryColor]
    .map((c) => (c || '').trim())
    .filter((c) => /^#?[0-9a-fA-F]{3,8}$/.test(c))
    .map((c) => (c.startsWith('#') ? c.toUpperCase() : `#${c.toUpperCase()}`))
  const colorSpec = hexes.length
    ? `using ONLY this exact color palette — ${hexes.join(' and ')}${colors ? ` (${colors})` : ''} — match these hex values precisely and use no other colors (aside from white background and necessary black/white for contrast)`
    : `color palette of ${colors}`

  // Style mod rotation gives per-concept variety.
  const mod = STYLE_MODS[conceptIndex % STYLE_MODS.length]!
  let conceptStyle = `${vibe} aesthetic, ${colorSpec}, ${mod.join(', ')}`
  if (refinementSeed) conceptStyle += `, inspired by ${refinementSeed}`
  if (inspo) conceptStyle += `, influenced by brands like ${inspo}`

  const athleteDesc =
    `${name}, personal brand identity` +
    (sport ? `. Incorporate subtle ${sport}-inspired visual elements.` : '')

  // Build the optional include block based on the talent's toggle choices.
  const logoElements: string[] = []
  if (prefs.includeName !== false && name) {
    logoElements.push(`incorporating the athlete name "${nameUpper}" as readable wordmark text`)
  }
  if (prefs.includeInitials && initialsUpper) {
    logoElements.push(
      `featuring the initials "${initialsUpper}" (spelled ${letterByLetter(initialsUpper)})`
    )
  }
  if (prefs.includeJersey && jersey) {
    logoElements.push(`prominently displaying jersey number ${jersey}`)
  }
  if (elements) {
    logoElements.push(`incorporating these visual elements: ${elements}`)
  }
  const logoDetail = logoElements.length ? ` ${logoElements.join(', ')}.` : ''

  if (round === 1) {
    return (
      `IMPORTANT: Generate exactly ONE logo design centered on a PURE WHITE BACKGROUND (#FFFFFF). Do NOT show multiple logos, variations, or a logo sheet. Do NOT use any background other than pure white.\n\n` +
      `${spellingBlock}\n\n` +
      `Design a single professional logo for ${athleteDesc}. Style: ${conceptStyle}. ` +
      `${backgroundLine} The background must be solid white #FFFFFF — no gradients, no patterns, no texture, no off-white tones. Vector illustration style. One monogram, wordmark, or icon mark${logoDetail}${initialsBlock}. ` +
      `High quality brand identity design. Professional and polished. One logo only, centered on white. ` +
      `If the design includes the name "${nameUpper}" or initials, spell every character exactly correct.`
    )
  }

  // Round 2 — refined logo, expects chosen R1 as reference image
  return (
    `CRITICAL INSTRUCTION: Generate exactly ONE logo on a PURE WHITE BACKGROUND (#FFFFFF). The entire image must contain a SINGLE logo design centered on solid white. Do NOT create a logo sheet, do NOT show multiple versions side by side, do NOT show lockups or variations, do NOT show a primary and secondary version, do NOT use any background other than pure white. ONE logo only.\n\n` +
    `${spellingBlock}\n\n` +
    `Design a single, refined professional logo for ${athleteDesc}. Style direction: ${conceptStyle}. ` +
    `${backgroundLine} The background must be solid white #FFFFFF — no gradients, no patterns, no texture. Vector illustration style${logoDetail}${initialsBlock}. ` +
    `This is ONE standalone logo on white — clean, centered, production-ready. ` +
    `All text must spell "${nameUpper}" exactly.`
  )
}
