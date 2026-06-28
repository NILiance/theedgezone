/**
 * Email-signature HTML builder — shared by the client editor (live preview +
 * copy) and the server action (save), so the preview always matches the saved
 * file. Email-safe: table layout + inline styles, no external CSS.
 */
export interface EmailSigInput {
  name: string
  title?: string
  sport?: string
  school?: string
  email?: string
  phone?: string
  website?: string
  /** Display label → URL (e.g. { Instagram: 'https://...' }). */
  socials?: Record<string, string>
  logoUrl?: string
  /** Logo width/height in px (default 72, clamped 32–160). */
  logoSize?: number
  bg: string
  nameColor: string
  bodyColor: string
  linkColor: string
}

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildEmailSignatureHtml(i: EmailSigInput): string {
  const titleLine =
    i.title && i.sport
      ? `${esc(i.title)} · ${esc(i.sport)}`
      : i.title
        ? esc(i.title)
        : i.sport
          ? esc(i.sport)
          : ''
  const socials = Object.entries(i.socials ?? {}).filter(([, v]) => v)
  const logoPx = Math.max(32, Math.min(160, Math.round(i.logoSize ?? 72)))
  return `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,sans-serif;font-size:13px;color:${i.bodyColor};line-height:1.4;background:${i.bg};padding:12px;">
  <tr>
    ${i.logoUrl ? `<td style="padding-right:16px;border-right:3px solid ${i.nameColor};vertical-align:top;"><img src="${esc(i.logoUrl)}" width="${logoPx}" height="${logoPx}" alt="" style="display:block;border:0;"/></td>` : ''}
    <td style="padding-left:${i.logoUrl ? '16px' : '0'};vertical-align:top;">
      <p style="margin:0 0 2px;font-size:16px;font-weight:bold;color:${i.nameColor};">${esc(i.name)}</p>
      ${titleLine ? `<p style="margin:0 0 4px;color:${i.bodyColor};">${titleLine}</p>` : ''}
      ${i.school ? `<p style="margin:0 0 6px;color:${i.bodyColor};">${esc(i.school)}</p>` : ''}
      ${i.email ? `<p style="margin:0;"><a href="mailto:${esc(i.email)}" style="color:${i.linkColor};text-decoration:none;">${esc(i.email)}</a></p>` : ''}
      ${i.phone ? `<p style="margin:2px 0 0;color:${i.bodyColor};">${esc(i.phone)}</p>` : ''}
      ${i.website ? `<p style="margin:2px 0 0;"><a href="${esc(i.website)}" style="color:${i.linkColor};text-decoration:none;">${esc(i.website.replace(/^https?:\/\//, ''))}</a></p>` : ''}
      ${
        socials.length
          ? `<p style="margin:6px 0 0;">${socials
              .slice(0, 5)
              .map(
                ([k, v]) =>
                  `<a href="${esc(v)}" style="color:${i.linkColor};text-decoration:none;margin-right:8px;font-size:12px;">${esc(k)}</a>`
              )
              .join('')}</p>`
          : ''
      }
    </td>
  </tr>
</table>`
}

/** Standalone HTML page with a preview + the copy-paste block. */
export function buildEmailSignaturePage(html: string, bg: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Email signature</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f6f8;color:#111;padding:48px 24px;margin:0;}
.wrap{max-width:680px;margin:0 auto;}
.demo{background:${bg};padding:24px;border-radius:8px;border:1px solid #e5e7eb;}
.copy{background:#0a0e14;color:#fff;padding:16px;border-radius:8px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-all;}
h1{font-size:22px;font-weight:900;letter-spacing:-.01em;margin:0 0 8px;}
h2{font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#777;margin:32px 0 12px;}
p.lead{color:#555;line-height:1.5;}</style></head><body><div class="wrap">
<h1>Your email signature</h1>
<p class="lead">Paste this HTML into Gmail (Settings &rarr; General &rarr; Signature) or Outlook (File &rarr; Options &rarr; Mail &rarr; Signatures).</p>
<h2>Preview</h2>
<div class="demo">${html}</div>
<h2>HTML to copy</h2>
<div class="copy">${html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</div></body></html>`
}
