import { sectionsForSlug, SECTION_LABELS } from '@/lib/profile-sections-by-product'

interface Args {
  displayName: string | null
  productTitle: string
  productSlug: string
  siteUrl: string
}

/**
 * Post-purchase email: confirms the order and pushes the user to finish
 * the profile sections we'll use to build their product.
 */
export function postPurchaseEmail({ displayName, productTitle, productSlug, siteUrl }: Args) {
  const greeting = displayName ? displayName.split(' ')[0] : 'there'
  const subject = `You're in — let's build your ${productTitle}`
  const sections = sectionsForSlug(productSlug)
    .map((s) => `<li style="margin:6px 0;color:#cbd5e1;line-height:1.5;">${SECTION_LABELS[s]}</li>`)
    .join('')

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escape(subject)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0e14;color:#fafafa;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#111720;border:1px solid #1f2937;border-radius:14px;padding:36px;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3aa7ff;">Order confirmed</p>
    <h1 style="margin:0 0 14px;font-size:24px;color:#fafafa;line-height:1.25;">Hey ${escape(greeting)}, you're in.</h1>
    <p style="margin:0 0 18px;font-size:14px;color:#cbd5e1;line-height:1.55;">
      Thanks for picking up <strong style="color:#fafafa;">${escape(productTitle)}</strong>. Before
      we build it, take 5 minutes to finish the profile sections below — the more we know about
      you, the better we can pre-build. You can still choose <em>Start From Scratch</em> in the
      editor if you'd rather customize every detail yourself.
    </p>

    <div style="background:#0a0e14;border:1px solid #1f2937;border-radius:10px;padding:18px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;">Sections to finish</p>
      <ul style="margin:0;padding-left:18px;">${sections}</ul>
    </div>

    <a href="${siteUrl}/dashboard/profile" style="display:inline-block;background:#3aa7ff;color:#0a0e14;padding:12px 22px;border-radius:8px;font-weight:800;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:.12em;">Open profile →</a>
    <p style="margin:24px 0 0;color:#64748b;font-size:11px;line-height:1.55;">
      Or skip ahead and just pick <em>Start From Scratch</em> in the editor: <a href="${siteUrl}/dashboard" style="color:#94a3b8;">your dashboard</a>.
    </p>
  </div>
</body></html>`
  return { subject, html }
}

function escape(s: string): string {
  return s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c] ?? c)
}
