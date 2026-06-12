/**
 * Generation helpers — wraps the Anthropic API for site-builder use.
 *
 * Per user feedback, no UI label says "AI" — these helpers are surfaced
 * as "Generate" / "Improve with prompt" / "Auto-fill". The internals
 * are an Anthropic Messages API call with a JSON-shaped response.
 *
 * All functions return either { ok: true, data } or { ok: false, error }
 * so callers can render an inline error instead of try/catch noise.
 */
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'

const MODEL = 'claude-sonnet-4-6'

let client: Anthropic | null = null
function getClient(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  return client
}

export function generationConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY)
}

interface GenOk<T> {
  ok: true
  data: T
}
interface GenErr {
  ok: false
  error: string
}
export type GenResult<T> = GenOk<T> | GenErr

/** Ask the model to return strict JSON matching `schemaDescription`. */
async function callJson<T>(
  prompt: string,
  schemaDescription: string,
  maxTokens = 4096
): Promise<GenResult<T>> {
  const c = getClient()
  if (!c) return { ok: false, error: 'ANTHROPIC_API_KEY missing' }

  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nReturn ONLY a JSON object matching this schema, no prose, no markdown fences:\n${schemaDescription}`,
        },
      ],
    })

    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('\n')
      .trim()

    // Strip code fences if the model added them despite the instruction.
    const stripped = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim()

    const parsed = JSON.parse(stripped) as T
    return { ok: true, data: parsed }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown generation error'
    return { ok: false, error: msg }
  }
}

// ── Block improvement ────────────────────────────────────────────────────

export interface BlockImprovementResult {
  props: Record<string, unknown>
  note?: string
}

export async function improveBlockProps(input: {
  blockType: string
  currentProps: Record<string, unknown>
  context: { siteName?: string; sport?: string; vibe?: string }
  userPrompt: string
}): Promise<GenResult<BlockImprovementResult>> {
  const prompt = `You are rewriting a single block of an athlete's personal website.

Block type: ${input.blockType}
Current props (JSON): ${JSON.stringify(input.currentProps)}
Site context: ${JSON.stringify(input.context)}
User instruction: ${input.userPrompt}

Produce an improved version of the block's props that:
- Preserves the schema of the current props (same keys, same types).
- Reflects the user's instruction in the copy.
- Sounds confident but not corny. No clichés.
- Keeps text reasonably short — hero headlines under 8 words, subheads under 18, body paragraphs under 4 sentences.`

  const schema = `{
  "props": <object with the same keys/types as the input props>,
  "note": "<one short sentence on what you changed>"
}`

  return callJson<BlockImprovementResult>(prompt, schema)
}

// ── SEO meta generation ───────────────────────────────────────────────────

export interface SeoMeta {
  meta_title: string
  meta_description: string
  keywords: string
  og_image?: string
}

export async function generateSeoMeta(input: {
  pageTitle: string
  pagePath: string
  bodySummary: string
}): Promise<GenResult<SeoMeta>> {
  const prompt = `You are writing SEO meta tags for a single page of an athlete's personal website.

Page title: ${input.pageTitle}
Page path: ${input.pagePath}
Page body summary: ${input.bodySummary}

Write:
- meta_title: ≤ 60 chars, include the page topic + athlete-style hook.
- meta_description: ≤ 158 chars, action-oriented, no keyword stuffing.
- keywords: 4–7 comma-separated keywords.

Skip og_image — that's set elsewhere.`

  const schema = `{
  "meta_title": "string",
  "meta_description": "string",
  "keywords": "comma,separated,terms"
}`

  return callJson<SeoMeta>(prompt, schema, 800)
}

// ── Theme tokens from a vibe prompt ──────────────────────────────────────

import type { ThemeTokens } from '@/lib/site-builder/theme-presets'

export async function generateThemeFromVibe(
  vibe: string,
  current: ThemeTokens
): Promise<GenResult<ThemeTokens>> {
  const prompt = `You are designing a complete theme bundle for an athlete's personal website.

Desired vibe: ${vibe}

Start from these current tokens (preserve structural defaults like fonts/sizes; you can change them):
${JSON.stringify(current, null, 2)}

Constraints:
- All color values must be 7-char hex like #1a2b3c.
- mode must be exactly "dark" or "light".
- button_style ∈ {"filled","outline"}.
- card_shadow ∈ {"none","sm","md","lg"}.
- nav_hover_style ∈ {"background","underline","glow","color-only"}.
- font_heading and font_body must be common Google Fonts.
- Make contrast WCAG AA: text_color vs bg_color should pass.
- Pick a primary that genuinely fits the vibe — not a default blue.`

  const schema = `{
  "mode": "dark"|"light",
  "primary": "#xxxxxx",
  "secondary": "#xxxxxx",
  "accent": "#xxxxxx",
  "bg_color": "#xxxxxx",
  "card_bg": "#xxxxxx",
  "border_color": "#xxxxxx",
  "text_color": "#xxxxxx",
  "heading_color": "#xxxxxx",
  "muted_color": "#xxxxxx",
  "nav_bg": "#xxxxxx",
  "nav_text": "#xxxxxx",
  "font_heading": "string",
  "font_body": "string",
  "heading_weight": 400|500|600|700|800|900,
  "body_weight": 300|400|500|600,
  "base_font_size": 14|15|16|17|18,
  "nav_font_size": 12|13|14|15,
  "button_style": "filled"|"outline",
  "button_radius": 0|2|4|6|8|12|16|24,
  "card_radius": 0|2|4|6|8|12|16|24,
  "card_shadow": "none"|"sm"|"md"|"lg",
  "nav_sticky": true|false,
  "nav_transparent": true|false,
  "nav_hover_style": "background"|"underline"|"glow"|"color-only",
  "hero_height": "string",
  "hero_overlay_color": "#xxxxxx",
  "hero_overlay_opacity": 0|0.1|0.2|0.3|0.4|0.5|0.6|0.7|0.8,
  "section_padding": "string",
  "content_width": "string"
}`

  return callJson<ThemeTokens>(prompt, schema, 2000)
}

// ── Page generation ──────────────────────────────────────────────────────

export interface GeneratedPage {
  title: string
  path: string
  blocks: Array<{ block_type: string; props: Record<string, unknown> }>
}

export async function generatePage(input: {
  pageType: string
  context: { siteName?: string; sport?: string; vibe?: string }
  userPrompt?: string
  availableBlockTypes: string[]
}): Promise<GenResult<GeneratedPage>> {
  const prompt = `You are generating a single page for an athlete's personal website.

Page type: ${input.pageType}
Site context: ${JSON.stringify(input.context)}
User instruction: ${input.userPrompt ?? '(none — use sensible defaults for this page type)'}
Allowed block types: ${input.availableBlockTypes.join(', ')}

Produce a page with 3–7 blocks. Mix block types thoughtfully (e.g., a Home page might be hero → stats → text → cta; an About page might be heading → text → achievements → testimonial).

Each block's props must match the standard schema for that block type. Common shapes:
- hero: { heading, subheading, cta_text, cta_url }
- text: { content, alignment, max_width }
- heading: { content, size: "h1"|"h2"|"h3"|"h4", alignment }
- stats: { title, stats: [{ icon, value, label }, …] }
- cta: { heading, subheading, button_text, button_url }
- faq: { title, items: [{ question, answer }, …] }
- testimonial: { title, testimonials: [{ name, role, quote }, …] }
- achievements: { title, badges: [{ icon, label, value }, …] }
- email_capture: { title, description, button_text }
- contact_form: { title, submit_text, fields: ["name","email","subject","message"] }

Keep copy tight and confident.`

  const schema = `{
  "title": "string",
  "path": "/string",
  "blocks": [
    { "block_type": "<one of allowed types>", "props": { ...block-specific... } },
    ...
  ]
}`

  return callJson<GeneratedPage>(prompt, schema, 4096)
}
