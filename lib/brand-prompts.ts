/**
 * Logo prompt builder — verbatim port of the legacy WP plugin's
 * `nilbd_build_prompts` (BrandDesign.php:5680).
 *
 * Why match exactly: Mike already validated these prompts produce great
 * logos with Gemini 2.5 Flash Image. The letter-by-letter spelling block
 * is the killer feature — Gemini reliably renders the athlete's name
 * correctly because we hand it the spelling pre-broken-out.
 */

export interface BrandPrefs {
  name: string
  sport?: string | null
  position?: string | null
  jerseyNum?: string | null
  initials?: string | null
  symbol?: string | null
  /** Free-text style adjectives. Default: 'bold' / 'modern' / 'dynamic'. */
  adj1?: string | null
  adj2?: string | null
  adj3?: string | null
  /** Free-text color description (e.g. 'navy and gold'). */
  colors?: string | null
  /** Free-text vibe (e.g. 'bold'). */
  vibe?: string | null
  /** Free-text brand inspirations. */
  inspiration?: string | null
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
 * Returns the exact text prompt to send to Gemini 2.5 Flash Image.
 * For Round 2 you also pass the chosen R1 image as the first `inlineData`
 * part on the API call — see lib/gemini-image.ts.
 */
export function buildLogoPrompt(opts: LogoPromptOptions): string {
  const { prefs, round, conceptIndex, refinementSeed } = opts
  const name = (prefs.name || 'Athlete').trim()
  const sport = (prefs.sport || 'athlete').trim()
  const jersey = (prefs.jerseyNum || '').trim()
  const initials = (prefs.initials || '').trim()
  const symbol = (prefs.symbol || '').trim()
  const adj1 = (prefs.adj1 || 'bold').trim()
  const adj2 = (prefs.adj2 || 'modern').trim()
  const adj3 = (prefs.adj3 || 'dynamic').trim()
  const colors = (prefs.colors || 'blue and black').trim()
  const vibe = (prefs.vibe || 'bold').trim()
  const inspo = (prefs.inspiration || '').trim()

  const nameUpper = name.toUpperCase()
  const initialsUpper = initials.toUpperCase()

  const spellingBlock = buildSpellingBlock(nameUpper)
  const initialsBlock = buildInitialsBlock(initialsUpper)

  const mod = STYLE_MODS[conceptIndex % STYLE_MODS.length]!
  let conceptStyle = `${adj1}, ${adj2}, ${adj3}, ${vibe} aesthetic, color palette of ${colors}, ${mod.join(', ')}`
  if (refinementSeed) conceptStyle += `, inspired by ${refinementSeed}`
  if (inspo) conceptStyle += `, influenced by brands like ${inspo}`

  // Athlete descriptor
  const athleteDesc =
    `${name}, personal brand identity` +
    (sport ? `. Incorporate subtle ${sport}-inspired visual elements.` : '')

  // Optional logo-element list
  const logoElements: string[] = []
  if (initialsUpper) {
    logoElements.push(`featuring the initials "${initialsUpper}" (spelled ${letterByLetter(initialsUpper)})`)
  }
  if (symbol) logoElements.push(`incorporating a ${symbol} motif`)
  if (jersey) logoElements.push(`optionally referencing jersey number ${jersey}`)
  const logoDetail = logoElements.length ? ` ${logoElements.join(', ')}.` : ''

  if (round === 1) {
    return (
      `IMPORTANT: Generate exactly ONE logo design centered on a pure white background. Do NOT show multiple logos, variations, or a logo sheet.\n\n` +
      `${spellingBlock}\n\n` +
      `Design a single professional logo for ${athleteDesc}. Style: ${conceptStyle}. ` +
      `Clean white background. Vector illustration style. One monogram, wordmark, or icon mark${logoDetail}${initialsBlock}. ` +
      `High quality brand identity design. Professional and polished. One logo only, centered. ` +
      `If the design includes the name "${nameUpper}" or initials, spell every character exactly correct.`
    )
  }

  // Round 2 — refined logo, expects chosen R1 as reference image
  return (
    `CRITICAL INSTRUCTION: Generate exactly ONE logo. The entire image must contain a SINGLE logo design centered on a pure white background. Do NOT create a logo sheet, do NOT show multiple versions side by side, do NOT show lockups or variations, do NOT show a primary and secondary version. ONE logo only.\n\n` +
    `${spellingBlock}\n\n` +
    `Design a single, refined professional logo for ${athleteDesc}. Style direction: ${conceptStyle}. ` +
    `Pure white background, vector illustration style${logoDetail}${initialsBlock}. ` +
    `This is ONE standalone logo — clean, centered, production-ready. ` +
    `All text must spell "${nameUpper}" exactly.`
  )
}
