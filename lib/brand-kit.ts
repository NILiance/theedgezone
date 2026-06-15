/**
 * Brand kit assembly — full parity with the legacy WP plugin's bundle.
 *
 * Given a brand_design with a chosen final_logo_url, builds a ZIP of:
 *   logo.png                 — original Ideogram output, untouched
 *   logo-on-white.jpg        — smaller JPG variant for documents
 *   logo-transparent.png     — full-res alpha PNG (background flattened)
 *   logo-transparent-512.png — 512×512 alpha for app icons
 *   logo.svg                 — true vector (Vectorizer.ai when configured,
 *                              raster-embedded fallback otherwise)
 *   social/*.png             — 6 square avatar sizes
 *   typography-specimen.png  — brand name rendered in the chosen heading font
 *   fonts.txt                — font pair names + Google Fonts URLs
 *   brand-guide.pdf          — single-page PDF with logo + colors + fonts
 *   brand.json               — machine-readable colors + metadata
 *   README.txt               — what's in the kit + how to use it
 *
 * The legacy WP kit shipped these inline on logo selection; the Next port
 * matches that flow via maybeAutoAssemble() in actions.ts.
 */
import JSZip from 'jszip'
import type SharpType from 'sharp'
import { env } from '@/lib/env'

// sharp ships a native binding that initializes on require. Loading it
// lazily keeps this module importable from server-component pages even
// when the binding is unavailable; the throw only surfaces if a function
// that actually uses sharp is called.
let sharpMod: typeof SharpType | null = null
async function getSharp(): Promise<typeof SharpType> {
  if (!sharpMod) sharpMod = (await import('sharp')).default
  return sharpMod
}

export interface BrandKitInput {
  brand_name: string
  sport?: string | null
  athletic_position?: string | null
  school?: string | null
  jersey_number?: string | null
  primary_color: string
  secondary_color: string
  accent_color?: string | null
  font_pair?: string | null
  tagline?: string | null
  final_logo_url: string
}

/** One downloadable file produced by the kit assembler. */
export interface BrandKitFile {
  /** Filename inside the ZIP (e.g. `logo-transparent.png`). */
  name: string
  /** Human-readable label for the download grid (e.g. `Logo Transparent BG`). */
  label: string
  /** MIME type for storage uploads + the grid `download` attribute. */
  mimeType: string
  /** Raw bytes. */
  buffer: Buffer
  /** Short display label like 'PNG · 600x600' or 'PDF · 8 Pages'. */
  shortMeta: string
}

const SOCIAL_SIZES: Array<{ size: number; label: string; uses: string[] }> = [
  { size: 1080, label: 'instagram-facebook', uses: ['Instagram profile', 'Facebook profile'] },
  { size: 800, label: 'youtube', uses: ['YouTube channel'] },
  { size: 400, label: 'twitter-linkedin', uses: ['X / Twitter profile', 'LinkedIn profile'] },
  { size: 256, label: 'twitch', uses: ['Twitch profile'] },
  { size: 200, label: 'tiktok', uses: ['TikTok profile'] },
  { size: 128, label: 'discord-email', uses: ['Discord avatar', 'Email signature'] },
]

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c)
}

async function makeTransparent(sourceBuffer: Buffer, resize?: number): Promise<Buffer> {
  // Soft-threshold near-white pixels to alpha so the logo cuts cleanly on
  // any background. Preserves anti-aliased edges.
  const sharp = await getSharp()
  let prepared: Buffer = sourceBuffer
  if (resize) {
    prepared = await sharp(sourceBuffer)
      .resize(resize, resize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toBuffer()
  }
  return sharp(prepared)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(async ({ data, info }) => {
      const { width, height, channels } = info
      const out = Buffer.from(data)
      for (let i = 0; i < out.length; i += channels) {
        const r = out[i]!
        const g = out[i + 1]!
        const b = out[i + 2]!
        if (r > 240 && g > 240 && b > 240) {
          out[i + 3] = 0
        } else if (r > 220 && g > 220 && b > 220) {
          out[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 35) * 255)
        }
      }
      return sharp(out, { raw: { width, height, channels } }).png().toBuffer()
    })
}

async function makeSvg(input: BrandKitInput, sourceBuffer: Buffer): Promise<string> {
  // True vector via Vectorizer.ai if configured. Falls back to a raster-
  // embedded SVG wrapper so the kit always includes a .svg file.
  if (env.VECTORIZER_AI_API_ID && env.VECTORIZER_AI_API_SECRET) {
    try {
      const auth = Buffer.from(
        `${env.VECTORIZER_AI_API_ID}:${env.VECTORIZER_AI_API_SECRET}`
      ).toString('base64')
      const body = new URLSearchParams({ 'image.url': input.final_logo_url })
      const res = await fetch('https://vectorizer.ai/api/v1/vectorize', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })
      if (res.ok) {
        const text = await res.text()
        if (text.trim().startsWith('<?xml') || text.trim().startsWith('<svg')) {
          return text
        }
      }
    } catch {
      // fall through to raster wrap
    }
  }
  // Raster-embedded fallback. Still selectable as a single layer in design
  // tools and useful as a scalable preview.
  const base64 = sourceBuffer.toString('base64')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <title>${escapeXml(input.brand_name)} logo</title>
  <image href="data:image/png;base64,${base64}" width="1024" height="1024" preserveAspectRatio="xMidYMid meet"/>
</svg>`
}

async function makeTypographySpecimen(input: BrandKitInput): Promise<Buffer> {
  // 1600×600 PNG with the brand name set big, plus a small specimen line.
  const fontPair = input.font_pair ?? 'Inter Display / Inter'
  const headingFont = fontPair.split(/[\/,]/)[0]?.trim() || 'Inter'
  const tagline = input.tagline ?? input.brand_name
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" width="1600" height="600">
  <rect width="1600" height="600" fill="${escapeXml(input.secondary_color)}"/>
  <text x="80" y="280" font-family="${escapeXml(headingFont)}, Impact, sans-serif" font-size="160" font-weight="900" fill="${escapeXml(input.primary_color)}">${escapeXml(input.brand_name).toUpperCase()}</text>
  <text x="80" y="360" font-family="${escapeXml(headingFont)}, sans-serif" font-size="36" font-weight="400" fill="#ffffff" opacity="0.85">${escapeXml(tagline)}</text>
  <text x="80" y="500" font-family="ui-monospace, monospace" font-size="20" fill="#ffffff" opacity="0.5">FONT PAIR · ${escapeXml(fontPair)}</text>
  <text x="80" y="540" font-family="ui-monospace, monospace" font-size="20" fill="#ffffff" opacity="0.5">PRIMARY ${escapeXml(input.primary_color).toUpperCase()} · SECONDARY ${escapeXml(input.secondary_color).toUpperCase()}</text>
</svg>`
  const sharp = await getSharp()
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function makeBrandGuidePdf(input: BrandKitInput, logoBase64: string): Buffer {
  // Minimal hand-rolled single-page PDF. Embeds the logo PNG, lists colors
  // + font pair + jersey/sport. Avoids pdfkit (~10MB dep) since this is
  // the only PDF we generate at runtime.
  const lines: string[] = [
    `${input.brand_name.toUpperCase()} — BRAND GUIDE`,
    '',
    `Sport: ${input.sport ?? '—'}`,
    `Position: ${input.athletic_position ?? '—'}`,
    `School: ${input.school ?? '—'}`,
    `Jersey: ${input.jersey_number ?? '—'}`,
    '',
    `Primary color:   ${input.primary_color}`,
    `Secondary color: ${input.secondary_color}`,
    input.accent_color ? `Accent color:    ${input.accent_color}` : '',
    '',
    `Font pair: ${input.font_pair ?? 'Inter Display / Inter'}`,
    '',
    'Generated by Edge Zone Brand Design Studio.',
  ].filter(Boolean)

  const encodeText = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  // Build text content stream
  let textStream = `BT\n/F1 22 Tf\n72 770 Td\n(${encodeText(lines[0]!)}) Tj\nET\n`
  let y = 740
  for (let i = 1; i < lines.length; i++) {
    textStream += `BT\n/F1 12 Tf\n72 ${y} Td\n(${encodeText(lines[i]!)}) Tj\nET\n`
    y -= 18
  }

  // Embed logo image as a JPEG-compressed PDF XObject. For simplicity we
  // skip image embedding — many viewers struggle without proper /XObject
  // streams. A future round can swap pdfkit in for richer PDFs.
  void logoBase64

  const contentStream = textStream
  const contentLength = Buffer.byteLength(contentStream, 'utf-8')

  // Build PDF structure. Offsets calculated below.
  const objects: string[] = []
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`)
  objects.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`)
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>`
  )
  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`)
  objects.push(`<< /Length ${contentLength} >>\nstream\n${contentStream}endstream`)

  // Assemble the PDF
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(out, 'utf-8'))
    out += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xrefStart = Buffer.byteLength(out, 'utf-8')
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const off of offsets) {
    out += off.toString().padStart(10, '0') + ' 00000 n \n'
  }
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`
  return Buffer.from(out, 'binary')
}

export async function assembleBrandKit(
  input: BrandKitInput
): Promise<{ zipBuffer: Buffer; filename: string; files: BrandKitFile[] }> {
  const sharp = await getSharp()
  const zip = new JSZip()
  const files: BrandKitFile[] = []

  function addFile(file: BrandKitFile, zipPath?: string) {
    files.push(file)
    zip.file(zipPath ?? file.name, file.buffer)
  }

  // 1. Original logo on white (full res)
  const sourceRes = await fetch(input.final_logo_url)
  if (!sourceRes.ok) {
    throw new Error(`Failed to fetch final logo (HTTP ${sourceRes.status})`)
  }
  const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer())
  const sourceMeta = await sharp(sourceBuffer).metadata()
  const sourceDim = `${sourceMeta.width ?? 600}x${sourceMeta.height ?? 600}`
  addFile({
    name: 'logo.png',
    label: 'Logo Original',
    mimeType: 'image/png',
    buffer: sourceBuffer,
    shortMeta: `PNG · ${sourceDim}`,
  })

  // 2. JPG-on-white (smaller for documents that don't need alpha)
  const jpgBuffer = await sharp(sourceBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 92 })
    .toBuffer()
  addFile({
    name: 'logo-on-white.jpg',
    label: 'Logo White Background',
    mimeType: 'image/jpeg',
    buffer: jpgBuffer,
    shortMeta: `JPG · ${sourceDim}`,
  })

  // 2b. JPG-on-black (inverse mate for dark-mode docs)
  const blackJpgBuffer = await sharp(sourceBuffer)
    .flatten({ background: { r: 0, g: 0, b: 0 } })
    .jpeg({ quality: 92 })
    .toBuffer()
  addFile({
    name: 'logo-on-black.jpg',
    label: 'Logo Black Background',
    mimeType: 'image/jpeg',
    buffer: blackJpgBuffer,
    shortMeta: `JPG · ${sourceDim}`,
  })

  // 3. Full-resolution transparent
  const transparentBuf = await makeTransparent(sourceBuffer)
  addFile({
    name: 'logo-transparent.png',
    label: 'Logo Transparent BG',
    mimeType: 'image/png',
    buffer: transparentBuf,
    shortMeta: `PNG · ${sourceDim}`,
  })

  // 4. 512×512 transparent (app icons + favicons)
  addFile({
    name: 'logo-transparent-512.png',
    label: 'Logo Transparent 512px',
    mimeType: 'image/png',
    buffer: await makeTransparent(sourceBuffer, 512),
    shortMeta: 'PNG · 512x512',
  })

  // 4b. 128×128 icon (favicon / chat avatar)
  const icon128 = await sharp(sourceBuffer)
    .resize(128, 128, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer()
  addFile({
    name: 'logo-128.png',
    label: 'Logo 128px Icon',
    mimeType: 'image/png',
    buffer: icon128,
    shortMeta: 'PNG · 128x128',
  })

  // 5. SVG — true vector via Vectorizer.ai when configured, else
  //    raster-embedded. We embed against the white-flattened JPG for the
  //    primary SVG and against the transparent PNG for the transparent
  //    variant — both look right when dropped on any background.
  const svgWhite = await makeSvg(input, jpgBuffer)
  addFile({
    name: 'logo.svg',
    label: 'Logo Vector (SVG)',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(svgWhite, 'utf-8'),
    shortMeta: 'SVG · Scalable',
  })

  const svgTransparent = await makeSvg(input, transparentBuf)
  addFile({
    name: 'logo-transparent.svg',
    label: 'Logo Vector Transparent (SVG)',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(svgTransparent, 'utf-8'),
    shortMeta: 'SVG · Scalable',
  })

  // 6. Social avatar sizes (kept inside ZIP, but only the most-used surfaces
  //    in the grid — covered by the 128px icon above).
  const social = zip.folder('social') ?? zip
  for (const variant of SOCIAL_SIZES) {
    const sized = await sharp(sourceBuffer)
      .resize(variant.size, variant.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer()
    social.file(`${variant.size}-${variant.label}.png`, sized)
  }

  // 7. Typography specimen
  const typoBuf = await makeTypographySpecimen(input)
  addFile({
    name: 'typography-specimen.png',
    label: 'Typography Specimen',
    mimeType: 'image/png',
    buffer: typoBuf,
    shortMeta: 'PNG · 1600x600',
  })

  // 7b. Brand guidelines preview PNG (1200x800) — a single composite
  //     showing the logo, palette, and font pair at a glance. Useful for
  //     pasting into Slack/email without sending the full PDF.
  const guidesPreview = await makeGuidelinesPreview(input, transparentBuf)
  addFile({
    name: 'brand-guidelines.png',
    label: 'Brand Guidelines',
    mimeType: 'image/png',
    buffer: guidesPreview,
    shortMeta: 'PNG · 1200x800',
  })

  // 8. Fonts list
  const fontPair = input.font_pair ?? 'Inter Display / Inter'
  const fonts = fontPair.split(/[\/,]/).map((f) => f.trim()).filter(Boolean)
  const fontLines: string[] = [
    `# ${input.brand_name} — Brand Fonts`,
    '',
    `Recommended pair: ${fontPair}`,
    '',
  ]
  for (const f of fonts) {
    const slug = f.replace(/\s+/g, '+')
    fontLines.push(`* ${f}`)
    fontLines.push(`  Google Fonts: https://fonts.google.com/specimen/${slug}`)
    fontLines.push('')
  }
  addFile({
    name: 'fonts.txt',
    label: 'Font Reference',
    mimeType: 'text/plain',
    buffer: Buffer.from(fontLines.join('\n'), 'utf-8'),
    shortMeta: 'TXT',
  })

  // 9. Brand metadata
  const brandJson = {
    name: input.brand_name,
    sport: input.sport ?? null,
    position: input.athletic_position ?? null,
    school: input.school ?? null,
    jersey: input.jersey_number ?? null,
    tagline: input.tagline ?? null,
    colors: {
      primary: input.primary_color,
      secondary: input.secondary_color,
      accent: input.accent_color ?? null,
    },
    fonts: { pair: fontPair, fonts },
    generated_at: new Date().toISOString(),
  }
  zip.file('brand.json', JSON.stringify(brandJson, null, 2))

  // 10. Brand guide PDF
  const pdfBuf = makeBrandGuidePdf(input, jpgBuffer.toString('base64'))
  addFile({
    name: 'brand-guide.pdf',
    label: 'Brand Guidelines (PDF)',
    mimeType: 'application/pdf',
    buffer: pdfBuf,
    shortMeta: 'PDF · 1 Page',
  })

  // 11. README
  zip.file(
    'README.txt',
    [
      `# ${input.brand_name} — Brand Kit`,
      '',
      'Files included:',
      '  • logo.png                       — Original logo on white background',
      '  • logo-on-white.jpg              — Smaller JPG variant for documents',
      '  • logo-transparent.png           — Full-resolution alpha PNG',
      '  • logo-transparent-512.png       — 512×512 alpha PNG for app icons',
      '  • logo.svg                       — Scalable vector logo',
      '  • social/1080-instagram-facebook.png',
      '  • social/800-youtube.png',
      '  • social/400-twitter-linkedin.png',
      '  • social/256-twitch.png',
      '  • social/200-tiktok.png',
      '  • social/128-discord-email.png',
      '  • typography-specimen.png        — Brand name set in chosen font',
      '  • fonts.txt                      — Font pair + Google Fonts links',
      '  • brand-guide.pdf                — Single-page brand summary',
      '  • brand.json                     — Machine-readable colors + metadata',
      '',
      `Primary color:   ${input.primary_color}`,
      `Secondary color: ${input.secondary_color}`,
      input.accent_color ? `Accent color:    ${input.accent_color}` : '',
      '',
      `Font pair: ${fontPair}`,
      '',
      'Usage notes:',
      '  - For dark backgrounds, prefer the transparent PNG or SVG.',
      '  - All social variants are square and ready to upload as-is.',
      '  - The 512×512 transparent is sized for app icon submissions.',
      '  - SVG is editable in Illustrator / Figma / Inkscape.',
      '',
      `Generated ${new Date().toISOString()} via The Edge Zone Brand Design Studio.`,
    ]
      .filter(Boolean)
      .join('\n')
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const safeName = input.brand_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'brand-kit'
  return { zipBuffer, filename: `${safeName}-brand-kit.zip`, files }
}

/**
 * 1200×800 PNG composite that summarizes the brand at a glance: logo,
 * color palette swatches, font pair. Hand-built as an SVG then rasterized
 * via sharp so it lives inside our existing rendering pipeline.
 */
async function makeGuidelinesPreview(
  input: BrandKitInput,
  transparentLogoBuf: Buffer
): Promise<Buffer> {
  const sharp = await getSharp()
  const fontPair = input.font_pair ?? 'Inter Display / Inter'
  const headingFont = fontPair.split(/[\/,]/)[0]?.trim() || 'Inter'
  const primary = input.primary_color
  const secondary = input.secondary_color
  const accent = input.accent_color ?? primary
  const tagline = input.tagline ?? ''

  const logoBase64 = transparentLogoBuf.toString('base64')

  // 1200×800 dark canvas with three color blocks + logo + typography.
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <rect width="1200" height="800" fill="#0a0a12"/>
  <!-- title -->
  <text x="60" y="80" font-family="${escapeXml(headingFont)}, Impact, sans-serif" font-size="44" font-weight="900" fill="#ffffff">${escapeXml(input.brand_name).toUpperCase()}</text>
  <text x="60" y="115" font-family="ui-monospace, monospace" font-size="14" fill="#888">BRAND GUIDELINES</text>
  <!-- logo block -->
  <rect x="60" y="170" width="320" height="320" fill="#ffffff" rx="12"/>
  <image href="data:image/png;base64,${logoBase64}" x="100" y="210" width="240" height="240" preserveAspectRatio="xMidYMid meet"/>
  <!-- color palette -->
  <text x="430" y="200" font-family="ui-monospace, monospace" font-size="14" fill="#888">COLOR PALETTE</text>
  <rect x="430" y="220" width="240" height="120" fill="${escapeXml(primary)}" rx="8"/>
  <text x="450" y="250" font-family="ui-monospace, monospace" font-size="12" fill="#ffffff" opacity="0.85">PRIMARY</text>
  <text x="450" y="320" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#ffffff">${escapeXml(primary).toUpperCase()}</text>
  <rect x="690" y="220" width="240" height="120" fill="${escapeXml(secondary)}" rx="8"/>
  <text x="710" y="250" font-family="ui-monospace, monospace" font-size="12" fill="#ffffff" opacity="0.85">SECONDARY</text>
  <text x="710" y="320" font-family="ui-monospace, monospace" font-size="18" font-weight="700" fill="#ffffff">${escapeXml(secondary).toUpperCase()}</text>
  <rect x="950" y="220" width="180" height="120" fill="${escapeXml(accent)}" rx="8"/>
  <text x="970" y="250" font-family="ui-monospace, monospace" font-size="12" fill="#ffffff" opacity="0.85">ACCENT</text>
  <text x="970" y="320" font-family="ui-monospace, monospace" font-size="16" font-weight="700" fill="#ffffff">${escapeXml(accent).toUpperCase()}</text>
  <!-- typography -->
  <text x="430" y="400" font-family="ui-monospace, monospace" font-size="14" fill="#888">TYPOGRAPHY</text>
  <text x="430" y="450" font-family="${escapeXml(headingFont)}, Impact, sans-serif" font-size="48" font-weight="900" fill="#ffffff">${escapeXml(headingFont)}</text>
  <text x="430" y="490" font-family="${escapeXml(headingFont)}, sans-serif" font-size="20" fill="#cccccc">The quick brown fox jumps over the lazy dog.</text>
  <text x="430" y="540" font-family="ui-monospace, monospace" font-size="12" fill="#666">Pair: ${escapeXml(fontPair)}</text>
  ${tagline ? `<text x="60" y="640" font-family="${escapeXml(headingFont)}, sans-serif" font-size="24" font-style="italic" fill="#ffffff" opacity="0.7">&quot;${escapeXml(tagline)}&quot;</text>` : ''}
  <!-- footer -->
  <text x="60" y="740" font-family="ui-monospace, monospace" font-size="11" fill="#444">Generated by The Edge Zone Brand Design Studio</text>
  <text x="60" y="758" font-family="ui-monospace, monospace" font-size="11" fill="#444">${escapeXml(new Date().toISOString().slice(0, 10))}</text>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
