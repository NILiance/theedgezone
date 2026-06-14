import type { InsightStats, InsightSummary } from '@/lib/insights'

function safe(text: string): string {
  return text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c)
}

export function insightsEmail({
  displayName,
  summary,
  stats,
}: {
  displayName: string | null
  summary: InsightSummary
  stats: InsightStats
}) {
  const subject = `Your Edge Zone week — ${stats.period_start} to ${stats.period_end}`
  const greeting = displayName ? safe(displayName).split(' ')[0] : 'there'
  const revenue = (stats.total_revenue_cents / 100).toFixed(2)
  const bullets = summary.bullets
    .map(
      (b) =>
        `<li style="margin:0 0 10px;color:#cbd5e1;line-height:1.55;">${safe(b)}</li>`
    )
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${safe(subject)}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0e14;color:#fafafa;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#111720;border:1px solid #1f2937;border-radius:14px;padding:36px;">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#3aa7ff;">Weekly insights</p>
    <h1 style="margin:0 0 6px;font-size:22px;color:#fafafa;line-height:1.25;">Hey ${greeting},</h1>
    <p style="margin:0 0 22px;font-size:18px;color:#fafafa;line-height:1.35;font-weight:700;">${safe(summary.headline)}</p>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:24px;">
      <div style="flex:1 1 140px;background:#0a0e14;border:1px solid #1f2937;border-radius:10px;padding:14px;">
        <p style="margin:0;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;">Page views</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#fafafa;">${stats.site_views_7d}</p>
        <p style="margin:4px 0 0;font-size:11px;color:${stats.views_delta_pct >= 0 ? '#34d399' : '#fb7185'};">${stats.views_delta_pct >= 0 ? '+' : ''}${stats.views_delta_pct}% vs prev</p>
      </div>
      <div style="flex:1 1 140px;background:#0a0e14;border:1px solid #1f2937;border-radius:10px;padding:14px;">
        <p style="margin:0;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;">Revenue</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#3aa7ff;">$${revenue}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">across tips, merch, tiers</p>
      </div>
      <div style="flex:1 1 140px;background:#0a0e14;border:1px solid #1f2937;border-radius:10px;padding:14px;">
        <p style="margin:0;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;">New subs</p>
        <p style="margin:6px 0 0;font-size:22px;font-weight:900;color:#fafafa;">${stats.new_subscribers}</p>
        <p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">email list growth</p>
      </div>
    </div>
    <ul style="margin:0 0 22px;padding-left:20px;">${bullets}</ul>
    <a href="https://theedgezone.com/dashboard" style="display:inline-block;background:#3aa7ff;color:#0a0e14;padding:10px 18px;border-radius:8px;font-weight:800;text-decoration:none;font-size:13px;text-transform:uppercase;letter-spacing:.12em;">Open dashboard →</a>
    <p style="margin:24px 0 0;color:#64748b;font-size:11px;line-height:1.55;">You're getting this because you have weekly insights turned on. <a href="https://theedgezone.com/dashboard/profile" style="color:#94a3b8;">Manage preferences</a>.</p>
  </div>
</body>
</html>`
  return { subject, html }
}
