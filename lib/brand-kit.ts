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
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
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

async function makeBrandGuidePdf(
  input: BrandKitInput,
  logoTransparentPngBuffer: Buffer
): Promise<Buffer> {
  // 8-page brand guide matching the legacy WP plugin's layout. Pages
  // alternate dark/light so primary-color section headers pop on both.
  // pdf-lib uses standard Type1 fonts (Helvetica family) — no font
  // embedding needed, which keeps the doc under ~150KB even with the
  // logo embedded.
  //
  // We accept the TRANSPARENT PNG so the logo composites onto whatever
  // page background it lands on. Dark Cover keeps a light tile so the
  // logo's dark elements still read; light Primary Logo page drops the
  // tile and lets the transparent logo sit directly on the page.
  const doc = await PDFDocument.create()
  doc.setTitle(`${input.brand_name} — Brand Guidelines`)
  doc.setAuthor('The Edge Zone')
  doc.setCreator('The Edge Zone Brand Design Studio')

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique)
  const logoImage = await doc.embedPng(new Uint8Array(logoTransparentPngBuffer))

  const W = 612 // Letter portrait width (in PDF points)
  const H = 792 // Letter portrait height
  const margin = 60

  // Brand-derived colors
  const primary = hexToRgb01(input.primary_color, [0.85, 0.1, 0.1])
  const secondary = hexToRgb01(input.secondary_color, [0.5, 0.5, 0.5])
  const accent = input.accent_color ? hexToRgb01(input.accent_color, primary) : primary
  const dark = rgb(0.04, 0.04, 0.06)
  const lightFg = rgb(0.91, 0.93, 0.96)
  const lightBg = rgb(1, 1, 1)
  const darkFg = rgb(0.06, 0.06, 0.1)
  const mutedDark = rgb(0.55, 0.55, 0.6)
  const mutedLight = rgb(0.66, 0.66, 0.72)

  const year = new Date().getFullYear()
  const brandLabel = `${input.brand_name.toUpperCase()} BRAND GUIDELINES`
  const subtitle = (() => {
    if (input.sport && input.athletic_position)
      return `${input.athletic_position.toUpperCase()} · ${input.sport.toUpperCase()} TALENT`
    if (input.sport) return `${input.sport.toUpperCase()} TALENT`
    if (input.athletic_position) return input.athletic_position.toUpperCase()
    return 'TALENT BRAND'
  })()

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  type Tone = 'dark' | 'light'

  function addPage(tone: Tone, pageNum: number, totalPages: number): PDFPage {
    const page = doc.addPage([W, H])
    if (tone === 'dark') {
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: dark })
    } else {
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: lightBg })
    }
    // Footer
    const footerText = `${brandLabel}  |  ${year}  |  Page ${pageNum} / ${totalPages}`
    const footerSize = 8
    const footerWidth = fontRegular.widthOfTextAtSize(footerText, footerSize)
    page.drawText(footerText, {
      x: (W - footerWidth) / 2,
      y: 36,
      size: footerSize,
      font: fontRegular,
      color: tone === 'dark' ? mutedLight : mutedDark,
    })
    return page
  }

  function drawSectionTitle(page: PDFPage, title: string, tone: Tone) {
    const fg = tone === 'dark' ? lightFg : darkFg
    page.drawText(title, {
      x: margin,
      y: H - margin - 28,
      size: 30,
      font: fontBold,
      color: fg,
    })
    // Red underline accent
    page.drawRectangle({
      x: margin,
      y: H - margin - 36,
      width: 200,
      height: 2,
      color: rgb(primary[0], primary[1], primary[2]),
    })
  }

  function drawWrappedText(
    page: PDFPage,
    text: string,
    opts: {
      x: number
      y: number
      maxWidth: number
      font?: PDFFont
      size?: number
      color?: ReturnType<typeof rgb>
      lineHeight?: number
    }
  ): number {
    const font = opts.font ?? fontRegular
    const size = opts.size ?? 11
    const color = opts.color ?? rgb(0.3, 0.3, 0.35)
    const lh = opts.lineHeight ?? size * 1.5
    const words = text.split(/\s+/)
    let line = ''
    let y = opts.y
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word
      if (font.widthOfTextAtSize(trial, size) > opts.maxWidth && line) {
        page.drawText(line, { x: opts.x, y, size, font, color })
        line = word
        y -= lh
      } else {
        line = trial
      }
    }
    if (line) {
      page.drawText(line, { x: opts.x, y, size, font, color })
      y -= lh
    }
    return y
  }

  function drawBulletList(
    page: PDFPage,
    items: string[],
    opts: {
      x: number
      y: number
      maxWidth: number
      bulletColor: ReturnType<typeof rgb>
      bullet?: string
      font?: PDFFont
      size?: number
      color?: ReturnType<typeof rgb>
      lineHeight?: number
    }
  ): number {
    const font = opts.font ?? fontRegular
    const size = opts.size ?? 11
    const color = opts.color ?? rgb(0.3, 0.3, 0.35)
    const lh = opts.lineHeight ?? size * 1.6
    let y = opts.y
    for (const item of items) {
      page.drawText(opts.bullet ?? '·', {
        x: opts.x,
        y,
        size,
        font: fontBold,
        color: opts.bulletColor,
      })
      drawWrappedText(page, item, {
        x: opts.x + 18,
        y,
        maxWidth: opts.maxWidth - 18,
        font,
        size,
        color,
        lineHeight: lh,
      })
      y -= lh + 2
    }
    return y
  }

  const TOTAL = 8

  // ---------------------------------------------------------------------
  // Page 1 — Cover (dark)
  // ---------------------------------------------------------------------
  {
    const page = addPage('dark', 1, TOTAL)
    // White tile w/ centered logo
    const tile = 240
    const tileX = (W - tile) / 2
    const tileY = H - 280
    page.drawRectangle({
      x: tileX,
      y: tileY,
      width: tile,
      height: tile,
      color: rgb(0.92, 0.92, 0.94),
    })
    const logoScale = Math.min(
      (tile - 40) / logoImage.width,
      (tile - 40) / logoImage.height
    )
    const logoW = logoImage.width * logoScale
    const logoH = logoImage.height * logoScale
    page.drawImage(logoImage, {
      x: tileX + (tile - logoW) / 2,
      y: tileY + (tile - logoH) / 2,
      width: logoW,
      height: logoH,
    })

    // Big brand name
    const nameSize = 42
    const nameText = input.brand_name.toUpperCase()
    const nameWidth = fontBold.widthOfTextAtSize(nameText, nameSize)
    page.drawText(nameText, {
      x: (W - nameWidth) / 2,
      y: tileY - 90,
      size: nameSize,
      font: fontBold,
      color: lightFg,
    })

    // "BRAND GUIDELINES" in primary color
    const guideText = 'BRAND GUIDELINES'
    const guideSize = 18
    const guideWidth = fontBold.widthOfTextAtSize(guideText, guideSize)
    page.drawText(guideText, {
      x: (W - guideWidth) / 2,
      y: tileY - 130,
      size: guideSize,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })

    // Subtitle (sport · position)
    const subSize = 11
    const subWidth = fontRegular.widthOfTextAtSize(subtitle, subSize)
    page.drawText(subtitle, {
      x: (W - subWidth) / 2,
      y: tileY - 160,
      size: subSize,
      font: fontRegular,
      color: mutedLight,
    })

    // Footer credit
    const credit = `Prepared by The Edge Zone  |  ${year}`
    const creditSize = 9
    const creditWidth = fontRegular.widthOfTextAtSize(credit, creditSize)
    page.drawText(credit, {
      x: (W - creditWidth) / 2,
      y: 96,
      size: creditSize,
      font: fontRegular,
      color: mutedLight,
    })
  }

  // ---------------------------------------------------------------------
  // Page 2 — Brand Identity (dark)
  // ---------------------------------------------------------------------
  {
    const page = addPage('dark', 2, TOTAL)
    drawSectionTitle(page, 'BRAND IDENTITY', 'dark')

    const sport = input.sport ?? 'NIL'
    const intro = `This brand guide defines the visual identity standards for ${input.brand_name}, ${sport.toLowerCase()} talent. Consistent use of these elements across all platforms and materials builds recognition, trust, and professional credibility. Every element in this guide — from the logo to the color palette to the typography — has been designed to work together as a cohesive system. Follow these guidelines whenever creating materials that represent the ${input.brand_name} brand.`
    let y = drawWrappedText(page, intro, {
      x: margin,
      y: H - margin - 80,
      maxWidth: W - margin * 2,
      color: mutedLight,
      lineHeight: 17,
    })

    y -= 28
    page.drawText('BRAND ATTRIBUTES', {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })
    y -= 24

    drawBulletList(
      page,
      [
        'Professional and polished in every application',
        'Confident without being arrogant',
        'Authentic to the talent and their sport',
        'Consistent across digital and physical media',
        'Versatile enough for social media, merchandise, and formal documents',
        'Memorable and instantly recognizable',
      ],
      {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        bulletColor: rgb(primary[0], primary[1], primary[2]),
        bullet: '–',
        color: mutedLight,
        lineHeight: 18,
      }
    )
  }

  // ---------------------------------------------------------------------
  // Page 3 — Primary Logo (light)
  // ---------------------------------------------------------------------
  {
    const page = addPage('light', 3, TOTAL)
    drawSectionTitle(page, 'PRIMARY LOGO', 'light')

    const intro = `The primary logo is the cornerstone of the brand identity. It should be used as the default representation in all communications and materials. Always maintain the clear space around the logo equal to at least the height of the letter forms within the mark.`
    let y = drawWrappedText(page, intro, {
      x: margin,
      y: H - margin - 80,
      maxWidth: W - margin * 2,
      color: rgb(0.3, 0.3, 0.35),
      lineHeight: 17,
    })

    // Big centered logo — sits directly on the white page background
    // (transparent PNG means no harsh white box around the mark).
    const area = 280
    const areaX = (W - area) / 2
    const areaY = y - 40 - area
    const scale = Math.min(area / logoImage.width, area / logoImage.height)
    page.drawImage(logoImage, {
      x: areaX + (area - logoImage.width * scale) / 2,
      y: areaY + (area - logoImage.height * scale) / 2,
      width: logoImage.width * scale,
      height: logoImage.height * scale,
    })

    y = areaY - 36
    page.drawText('CLEAR SPACE', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: darkFg,
    })
    y -= 18
    y = drawWrappedText(
      page,
      'Maintain a minimum clear space around all sides of the logo equal to the cap-height of the logotype. This ensures the logo is always legible and maintains its visual impact. No other graphic elements, text, or imagery should encroach on this protected area.',
      {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        color: rgb(0.3, 0.3, 0.35),
        lineHeight: 16,
      }
    )

    y -= 18
    page.drawText('MINIMUM SIZE', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: darkFg,
    })
    y -= 18
    drawWrappedText(
      page,
      'Print: No smaller than 1 inch (25mm) wide. Digital: No smaller than 120 pixels wide. Below these sizes, legibility of the mark deteriorates and the brand is not properly represented.',
      {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        color: rgb(0.3, 0.3, 0.35),
        lineHeight: 16,
      }
    )
  }

  // ---------------------------------------------------------------------
  // Page 4 — Logo Variations (dark)
  // ---------------------------------------------------------------------
  {
    const page = addPage('dark', 4, TOTAL)
    drawSectionTitle(page, 'LOGO VARIATIONS', 'dark')

    const intro =
      'The logo is provided in multiple formats and configurations to ensure proper usage across all applications. Select the appropriate version based on the context, background color, and size requirements.'
    let y = drawWrappedText(page, intro, {
      x: margin,
      y: H - margin - 80,
      maxWidth: W - margin * 2,
      color: mutedLight,
      lineHeight: 17,
    })

    const variations: Array<[string, string]> = [
      ['Full Color PNG', 'Primary version for most applications. Use on white or light backgrounds.'],
      ['Transparent PNG', 'For use on colored, photographic, or gradient backgrounds.'],
      ['White Background JPG', 'For applications that do not support transparency.'],
      ['Black Background JPG', 'For dark-themed applications and materials.'],
      ['Vector SVG', 'Infinitely scalable. Use for print, large format signage, and professional production.'],
      ['Icon Sizes (512, 256, 128)', 'Pre-sized versions for app icons, favicons, social avatars, and thumbnails.'],
    ]

    y -= 14
    for (const [label, desc] of variations) {
      page.drawText(label, {
        x: margin,
        y,
        size: 12,
        font: fontBold,
        color: rgb(primary[0], primary[1], primary[2]),
      })
      y -= 16
      y = drawWrappedText(page, desc, {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        color: mutedLight,
        lineHeight: 15,
        size: 10,
      })
      y -= 12
    }
  }

  // ---------------------------------------------------------------------
  // Page 5 — Color Palette (light)
  // ---------------------------------------------------------------------
  {
    const page = addPage('light', 5, TOTAL)
    drawSectionTitle(page, 'COLOR PALETTE', 'light')

    const intro =
      'These are the official brand colors. Use only these colors in all brand materials. Consistent color application builds recognition and trust. When printing, always use the CMYK values provided to ensure color accuracy.'
    let y = drawWrappedText(page, intro, {
      x: margin,
      y: H - margin - 80,
      maxWidth: W - margin * 2,
      color: rgb(0.3, 0.3, 0.35),
      lineHeight: 17,
    })

    y -= 30

    const swatchW = 220
    const swatchH = 130
    const swatchGap = 28

    function drawSwatch(label: string, hex: string, rgbVal: [number, number, number], cmykVal: [number, number, number, number]) {
      page.drawRectangle({
        x: margin,
        y: y - swatchH,
        width: swatchW,
        height: swatchH,
        color: rgb(rgbVal[0], rgbVal[1], rgbVal[2]),
      })
      const textX = margin + swatchW + 24
      page.drawText(label, { x: textX, y: y - 20, size: 16, font: fontBold, color: darkFg })
      page.drawText(`HEX: ${hex.toUpperCase()}`, {
        x: textX,
        y: y - 45,
        size: 10,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.35),
      })
      page.drawText(
        `RGB: ${Math.round(rgbVal[0] * 255)}, ${Math.round(rgbVal[1] * 255)}, ${Math.round(rgbVal[2] * 255)}`,
        {
          x: textX,
          y: y - 62,
          size: 10,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.35),
        }
      )
      page.drawText(
        `CMYK: ${cmykVal[0]}, ${cmykVal[1]}, ${cmykVal[2]}, ${cmykVal[3]}`,
        {
          x: textX,
          y: y - 79,
          size: 10,
          font: fontRegular,
          color: rgb(0.3, 0.3, 0.35),
        }
      )
      y -= swatchH + swatchGap
    }

    drawSwatch('PRIMARY COLOR', input.primary_color, primary, rgbToCmyk(primary))
    drawSwatch('SECONDARY COLOR', input.secondary_color, secondary, rgbToCmyk(secondary))

    y -= 8
    page.drawText('USAGE GUIDELINES', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: darkFg,
    })
    y -= 18
    drawWrappedText(
      page,
      'The primary color should dominate all brand materials — it is the signature color of the brand. The secondary color provides contrast and is used for accents, backgrounds, and supporting elements. Never introduce additional colors unless they are neutral (black, white, or gray). When the primary color appears on a dark background, use the full-saturation version. On light backgrounds, ensure sufficient contrast for readability.',
      {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        color: rgb(0.3, 0.3, 0.35),
        lineHeight: 15,
        size: 10,
      }
    )
  }

  // ---------------------------------------------------------------------
  // Page 6 — Typography (dark)
  // ---------------------------------------------------------------------
  {
    const page = addPage('dark', 6, TOTAL)
    drawSectionTitle(page, 'TYPOGRAPHY', 'dark')

    const fontPair = input.font_pair ?? 'Raleway / Roboto'
    const [headingName, bodyName] = fontPair.split(/[\/,]/).map((s) => s.trim())

    let y = H - margin - 80

    // HEADING FONT
    page.drawText('HEADING FONT', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })
    y -= 36
    page.drawText(headingName ?? 'Raleway', {
      x: margin,
      y,
      size: 40,
      font: fontBold,
      color: lightFg,
    })
    y -= 30
    page.drawText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 16
    page.drawText('abcdefghijklmnopqrstuvwxyz  0123456789', {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 24
    page.drawText('Use for: Headlines, titles, hero text, calls-to-action, navigation', {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 14
    page.drawText('Weights: Bold (700) for headlines, Regular (400) for subheadings', {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: mutedLight,
    })

    // BODY FONT
    y -= 40
    page.drawText('BODY FONT', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })
    y -= 36
    page.drawText(bodyName ?? 'Roboto', {
      x: margin,
      y,
      size: 40,
      font: fontRegular,
      color: lightFg,
    })
    y -= 30
    page.drawText('ABCDEFGHIJKLMNOPQRSTUVWXYZ', {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 16
    page.drawText('abcdefghijklmnopqrstuvwxyz  0123456789', {
      x: margin,
      y,
      size: 11,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 24
    page.drawText('Use for: Body text, paragraphs, captions, descriptions, UI text', {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 14
    page.drawText('Weights: Regular (400) for body, SemiBold (600) for emphasis', {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: mutedLight,
    })

    y -= 36
    page.drawText('FONT SOURCE', {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })
    y -= 16
    page.drawText('Both fonts are available free via Google Fonts for web and print use.', {
      x: margin,
      y,
      size: 10,
      font: fontRegular,
      color: mutedLight,
    })
    y -= 14
    page.drawText(`https://fonts.google.com — search ${headingName} and ${bodyName}`, {
      x: margin,
      y,
      size: 10,
      font: fontItalic,
      color: mutedLight,
    })
  }

  // ---------------------------------------------------------------------
  // Page 7 — Logo Usage Rules (light)
  // ---------------------------------------------------------------------
  {
    const page = addPage('light', 7, TOTAL)
    drawSectionTitle(page, 'LOGO USAGE RULES', 'light')

    let y = H - margin - 80
    page.drawText('DO', {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.0, 0.6, 0.35),
    })
    y -= 24
    y = drawBulletList(
      page,
      [
        'Use the logo in its original proportions — never stretch or compress',
        'Maintain clear space around the logo at all times',
        'Use the transparent PNG on colored or photographic backgrounds',
        'Use the full-color version on white or light neutral backgrounds',
        'Use the SVG vector file for any print or large-format application',
        'Ensure the logo is always clearly legible and not obscured',
        'Apply brand colors consistently across all materials and platforms',
        'Reference this guide when creating any new brand materials',
      ],
      {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        bulletColor: rgb(0.0, 0.6, 0.35),
        bullet: '+',
        color: rgb(0.3, 0.3, 0.35),
        size: 10,
        lineHeight: 16,
      }
    )

    y -= 24
    page.drawText("DON'T", {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })
    y -= 24
    drawBulletList(
      page,
      [
        'Stretch, compress, rotate, or distort the logo in any way',
        'Change the logo colors outside of the approved palette',
        'Place the logo on busy or low-contrast backgrounds where it is hard to read',
        'Add drop shadows, outlines, glows, or other effects to the logo',
        'Recreate or redraw the logo — always use the provided files',
        'Crop or partially obscure any part of the logo',
        'Place other text or graphics inside the logo clear space',
        'Use a low-resolution or pixelated version of the logo',
      ],
      {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        bulletColor: rgb(primary[0], primary[1], primary[2]),
        bullet: 'x',
        color: rgb(0.3, 0.3, 0.35),
        size: 10,
        lineHeight: 16,
      }
    )
  }

  // ---------------------------------------------------------------------
  // Page 8 — Digital Applications (dark)
  // ---------------------------------------------------------------------
  {
    const page = addPage('dark', 8, TOTAL)
    drawSectionTitle(page, 'DIGITAL APPLICATIONS', 'dark')

    const intro =
      'These specifications ensure the brand is represented consistently across all digital platforms and social media channels.'
    let y = drawWrappedText(page, intro, {
      x: margin,
      y: H - margin - 80,
      maxWidth: W - margin * 2,
      color: mutedLight,
      lineHeight: 17,
    })

    const sections: Array<[string, string]> = [
      [
        'SOCIAL MEDIA PROFILE PICTURE',
        'Use the icon-size (512×512 or 256×256) logo centered on brand primary color background. Ensure the mark is legible at small sizes.',
      ],
      [
        'SOCIAL MEDIA COVER PHOTO',
        'Use a clean composition with the full logo positioned in a safe zone (avoiding platform-specific cropping areas). Brand colors as background.',
      ],
      [
        'WEBSITE HEADER',
        'Use the horizontal logo version at a maximum height of 60px. Transparent PNG recommended for flexible background support.',
      ],
      [
        'EMAIL SIGNATURE',
        'Logo at 200px wide maximum. Include name, title, contact info, and social links below. Use brand fonts where supported.',
      ],
      [
        'MERCHANDISE & APPAREL',
        'Use vector SVG for all print production. For embroidery, provide the simplified icon-only mark. Minimum print size: 2 inches.',
      ],
      [
        'PRESENTATIONS & DOCUMENTS',
        'Place logo in the top-left or top-right corner at a consistent size. Use brand colors for headings and accent elements.',
      ],
      [
        'VIDEO & MOTION',
        'Use transparent PNG or SVG for overlays. Animate the logo subtly — no spinning, bouncing, or excessive motion.',
      ],
    ]

    y -= 18
    for (const [label, desc] of sections) {
      page.drawText(label, {
        x: margin,
        y,
        size: 10,
        font: fontBold,
        color: rgb(primary[0], primary[1], primary[2]),
      })
      y -= 14
      y = drawWrappedText(page, desc, {
        x: margin,
        y,
        maxWidth: W - margin * 2,
        color: mutedLight,
        size: 9.5,
        lineHeight: 13,
      })
      y -= 8
    }

    // Contact footer
    const contact = 'Questions? Contact support@theedgezone.com'
    const contactSize = 11
    const contactWidth = fontBold.widthOfTextAtSize(contact, contactSize)
    page.drawText(contact, {
      x: (W - contactWidth) / 2,
      y: 80,
      size: contactSize,
      font: fontBold,
      color: rgb(primary[0], primary[1], primary[2]),
    })
  }

  // Suppress unused (the prior implementation took base64; new takes Buffer)
  void accent

  const bytes = await doc.save()
  return Buffer.from(bytes)
}

// ── PDF color helpers ───────────────────────────────────────────────────

function hexToRgb01(hex: string, fallback: [number, number, number]): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) {
    const short = /^#?([0-9a-f]{3})$/i.exec(hex.trim())
    if (!short) return fallback
    const r = parseInt(short[1]![0]! + short[1]![0]!, 16) / 255
    const g = parseInt(short[1]![1]! + short[1]![1]!, 16) / 255
    const b = parseInt(short[1]![2]! + short[1]![2]!, 16) / 255
    return [r, g, b]
  }
  const r = parseInt(m[1]!.substring(0, 2), 16) / 255
  const g = parseInt(m[1]!.substring(2, 4), 16) / 255
  const b = parseInt(m[1]!.substring(4, 6), 16) / 255
  return [r, g, b]
}

function rgbToCmyk([r, g, b]: [number, number, number]): [number, number, number, number] {
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return [0, 0, 0, 100]
  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)
  return [Math.round(c * 100), Math.round(m * 100), Math.round(y * 100), Math.round(k * 100)]
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

  // 10. Brand guide PDF — 8 pages matching the legacy WP plugin.
  // Use the TRANSPARENT PNG so dark pages don't get a white box and
  // light pages let the page color show through the logo's negative
  // space.
  const pdfBuf = await makeBrandGuidePdf(input, transparentBuf)
  addFile({
    name: 'brand-guide.pdf',
    label: 'Brand Guidelines (PDF)',
    mimeType: 'application/pdf',
    buffer: pdfBuf,
    shortMeta: 'PDF · 8 Pages',
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
