import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/epk/[id]/pdf
 *
 * Returns an HTML page that auto-triggers the browser's print dialog with
 * "Save as PDF" pre-targeted. Avoids puppeteer/chromium dependency (~50MB)
 * — works on every device, including mobile, and the user sees an exact
 * what-you-see-is-what-you-get of the print view.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()
  const { data: epk } = await supabase
    .from('epks')
    .select('id, slug, user_id, display_name')
    .eq('id', id)
    .maybeSingle()
  if (!epk || epk.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const epkUrl = `${siteUrl}/epk/${epk.slug}?print=1`
  const filename = `${(epk.display_name ?? epk.slug).replace(/[^a-z0-9-]+/gi, '-')}-press-kit.pdf`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${epk.display_name ?? 'Press Kit'} — Print to PDF</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0a0e14; color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrap { display: flex; flex-direction: column; height: 100vh; }
  .bar { padding: 12px 16px; border-bottom: 1px solid #1f2937; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
  .bar p { margin: 0; font-size: 13px; }
  .bar code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; background: #111720; padding: 2px 6px; border-radius: 4px; }
  .bar button { background: #3aa7ff; color: #0a0e14; padding: 8px 14px; border-radius: 6px; font-weight: 800; border: none; cursor: pointer; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
  iframe { flex: 1; border: 0; width: 100%; background: white; }
  @media print { .bar { display: none; } iframe { height: 100vh; } }
</style></head>
<body>
<div class="wrap">
  <div class="bar">
    <p>Press kit preview · save as <code>${filename}</code></p>
    <button onclick="window.frames[0].focus(); window.frames[0].print();">Print / Save as PDF</button>
  </div>
  <iframe src="${epkUrl}" id="epkframe"></iframe>
</div>
<script>
  document.getElementById('epkframe').addEventListener('load', function() {
    setTimeout(function() {
      try { window.frames[0].focus(); window.frames[0].print(); } catch (e) {}
    }, 800);
  });
</script>
</body></html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
