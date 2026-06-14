/**
 * Brand kit assembly.
 *
 * Given a brand_design with a chosen final_logo_url, build a ZIP of:
 *   1. logo.png            — original Ideogram output, untouched
 *   2. logo-transparent.png — alpha PNG (background removed by sharp threshold)
 *   3. social/*.png        — 6 square avatar sizes for common platforms
 *   4. brand.json          — color tokens + brand metadata
 *   5. README.txt          — what's in the kit + how to use it
 *
 * Returns the ZIP buffer for the caller to upload (typically to Drive).
 */
import JSZip from 'jszip'
import sharp from 'sharp'

export interface BrandKitInput {
  brand_name: string
  sport?: string | null
  athletic_position?: string | null
  school?: string | null
  jersey_number?: string | null
  primary_color: string
  secondary_color: string
  final_logo_url: string
}

const SOCIAL_SIZES: Array<{ size: number; label: string; uses: string[] }> = [
  { size: 1080, label: 'instagram-facebook', uses: ['Instagram profile', 'Facebook profile'] },
  { size: 800, label: 'youtube', uses: ['YouTube channel'] },
  { size: 400, label: 'twitter-linkedin', uses: ['X / Twitter profile', 'LinkedIn profile'] },
  { size: 256, label: 'twitch', uses: ['Twitch profile'] },
  { size: 200, label: 'tiktok', uses: ['TikTok profile'] },
  { size: 128, label: 'discord-email', uses: ['Discord avatar', 'Email signature'] },
]

export async function assembleBrandKit(
  input: BrandKitInput
): Promise<{ zipBuffer: Buffer; filename: string }> {
  const zip = new JSZip()

  // 1. Original logo
  const sourceRes = await fetch(input.final_logo_url)
  if (!sourceRes.ok) {
    throw new Error(`Failed to fetch final logo (HTTP ${sourceRes.status})`)
  }
  const sourceBuffer = Buffer.from(await sourceRes.arrayBuffer())
  zip.file('logo.png', sourceBuffer)

  // 2. Transparent variant — flatten near-white pixels to alpha.
  //    Ideogram outputs on solid white; threshold the input through sharp.
  const transparentBuffer = await sharp(sourceBuffer)
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
        // Near-white pixels → transparent. Soft threshold preserves anti-alias.
        if (r > 240 && g > 240 && b > 240) {
          out[i + 3] = 0 // fully transparent
        } else if (r > 220 && g > 220 && b > 220) {
          out[i + 3] = Math.round(((255 - Math.max(r, g, b)) / 35) * 255)
        }
      }
      return sharp(out, { raw: { width, height, channels } }).png().toBuffer()
    })
  zip.file('logo-transparent.png', transparentBuffer)

  // 3. Social avatar sizes — each one a centered crop on a primary-tinted background
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

  // 4. Brand metadata
  const brandJson = {
    name: input.brand_name,
    sport: input.sport ?? null,
    position: input.athletic_position ?? null,
    school: input.school ?? null,
    jersey: input.jersey_number ?? null,
    colors: {
      primary: input.primary_color,
      secondary: input.secondary_color,
    },
    generated_at: new Date().toISOString(),
  }
  zip.file('brand.json', JSON.stringify(brandJson, null, 2))

  // 5. README
  zip.file(
    'README.txt',
    [
      `# ${input.brand_name} — Brand Kit`,
      '',
      'Files included:',
      '  • logo.png                       — Original logo on white background',
      '  • logo-transparent.png           — Logo on transparent background (PNG with alpha)',
      '  • social/1080-instagram-facebook.png',
      '  • social/800-youtube.png',
      '  • social/400-twitter-linkedin.png',
      '  • social/256-twitch.png',
      '  • social/200-tiktok.png',
      '  • social/128-discord-email.png',
      '  • brand.json                     — Colors + metadata for designers',
      '',
      `Primary color:   ${input.primary_color}`,
      `Secondary color: ${input.secondary_color}`,
      '',
      'Usage notes:',
      '  - For dark backgrounds, prefer the transparent PNG.',
      '  - All social variants are square and ready to upload as-is.',
      '  - For print or vector apps, request the SVG upgrade in the studio.',
      '',
      `Generated ${new Date().toISOString()} via The Edge Zone Brand Design Studio.`,
    ].join('\n')
  )

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
  const safeName = input.brand_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'brand-kit'
  return { zipBuffer, filename: `${safeName}-brand-kit.zip` }
}
