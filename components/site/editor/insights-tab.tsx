'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  upsertShortLink,
  deleteShortLink,
  upsertAffiliate,
  deleteAffiliate,
  generateAffiliateMagicLink,
} from '@/app/dashboard/sites/actions'

export interface PageViewRollup {
  date: string
  count: number
}

export interface TopPage {
  path: string
  views: number
}

export interface Subscriber {
  id: string
  email: string
  source: string | null
  created_at: string
}

export interface ShortLink {
  id: string
  slug: string
  target_url: string
  title: string | null
  clicks: number
  last_clicked_at: string | null
}

export interface Affiliate {
  id: string
  name: string
  email: string | null
  code: string
  lifetime_revenue_cents: number
  signups: number
  clicks: number
  active: boolean
}

interface Props {
  siteId: string
  siteSlug: string
  totalViews: number
  uniqueVisitors: number
  rollup: PageViewRollup[]
  topPages: TopPage[]
  subscribers: Subscriber[]
  shortLinks: ShortLink[]
  affiliates: Affiliate[]
}

export function InsightsTab({
  siteId,
  siteSlug,
  totalViews,
  uniqueVisitors,
  rollup,
  topPages,
  subscribers,
  shortLinks,
  affiliates,
}: Props) {
  const [section, setSection] = useState<'analytics' | 'subs' | 'links' | 'affiliates'>(
    'analytics'
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['analytics', 'Analytics'],
            ['subs', `Subscribers (${subscribers.length})`],
            ['links', `Short links (${shortLinks.length})`],
            ['affiliates', `Affiliates (${affiliates.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              section === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {section === 'analytics' && (
        <AnalyticsPanel
          totalViews={totalViews}
          uniqueVisitors={uniqueVisitors}
          rollup={rollup}
          topPages={topPages}
        />
      )}
      {section === 'subs' && <SubscribersPanel siteSlug={siteSlug} subscribers={subscribers} />}
      {section === 'links' && (
        <ShortLinksPanel siteId={siteId} siteSlug={siteSlug} shortLinks={shortLinks} />
      )}
      {section === 'affiliates' && (
        <AffiliatesPanel siteId={siteId} siteSlug={siteSlug} affiliates={affiliates} />
      )}
    </div>
  )
}

// ── Analytics ──────────────────────────────────────────────────────────────

function AnalyticsPanel({
  totalViews,
  uniqueVisitors,
  rollup,
  topPages,
}: {
  totalViews: number
  uniqueVisitors: number
  rollup: PageViewRollup[]
  topPages: TopPage[]
}) {
  const maxCount = Math.max(1, ...rollup.map((r) => r.count))
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Views (30d)" value={totalViews.toLocaleString()} />
        <StatTile label="Unique visitors" value={uniqueVisitors.toLocaleString()} />
        <StatTile
          label="Top page"
          value={topPages[0]?.path ?? '—'}
          sub={topPages[0] ? `${topPages[0].views} views` : undefined}
        />
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Daily views (last 30 days)</p>
        {rollup.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No views yet. Once the site is published, traffic shows up here.
          </p>
        ) : (
          <div className="mt-4 flex h-32 items-end gap-1">
            {rollup.map((d) => (
              <div
                key={d.date}
                className="flex-1 rounded-sm bg-primary/30 transition-colors hover:bg-primary"
                style={{ height: `${(d.count / maxCount) * 100}%` }}
                title={`${d.date}: ${d.count} views`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Top pages</p>
        {topPages.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No traffic yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {topPages.slice(0, 10).map((p) => (
              <li key={p.path} className="flex items-center justify-between gap-3 text-sm">
                <code className="text-foreground">{p.path}</code>
                <span className="text-muted-foreground">{p.views.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <p className="text-eyebrow text-muted-foreground">{label}</p>
      <p className="text-display mt-2 text-3xl font-black text-primary">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ── Subscribers ────────────────────────────────────────────────────────────

function SubscribersPanel({
  siteSlug,
  subscribers,
}: {
  siteSlug: string
  subscribers: Subscriber[]
}) {
  const exportCsv = () => {
    const header = 'email,source,created_at\n'
    const rows = subscribers
      .map((s) =>
        [s.email, s.source ?? '', s.created_at]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${siteSlug}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Captured by the Email Capture block on your public site.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={exportCsv}
          disabled={subscribers.length === 0}
        >
          Export CSV
        </Button>
      </div>
      {subscribers.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No subscribers yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Source</th>
                <th className="px-4 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">{s.email}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {s.source ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Short links ────────────────────────────────────────────────────────────

function ShortLinksPanel({
  siteId,
  siteSlug,
  shortLinks,
}: {
  siteId: string
  siteSlug: string
  shortLinks: ShortLink[]
}) {
  const [editing, setEditing] = useState<ShortLink | 'new' | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('Delete this short link?')) return
    const fd = new FormData()
    fd.set('link_id', id)
    startTransition(async () => {
      try {
        await deleteShortLink(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  if (editing) {
    return (
      <ShortLinkEditor
        siteId={siteId}
        siteSlug={siteSlug}
        link={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Branded URLs that redirect — track clicks per link.
        </p>
        <Button size="sm" onClick={() => setEditing('new')}>
          + New link
        </Button>
      </div>
      {shortLinks.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No short links yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-panel/40">
          <table className="w-full text-sm">
            <thead className="bg-panel-elevated/50 text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left">Slug</th>
                <th className="px-4 py-2 text-left">Target</th>
                <th className="px-4 py-2 text-right">Clicks</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shortLinks.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs text-primary">
                    {siteSlug}.mytalentsite.com/go/{l.slug}
                  </td>
                  <td className="max-w-[260px] truncate px-4 py-2 text-xs text-muted-foreground">
                    {l.target_url}
                  </td>
                  <td className="px-4 py-2 text-right text-xs">{l.clicks}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(l)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(l.id)}
                      disabled={isPending}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ShortLinkEditor({
  siteId,
  siteSlug,
  link,
  onClose,
}: {
  siteId: string
  siteSlug: string
  link: ShortLink | null
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [shortSlug, setShortSlug] = useState(link?.slug ?? '')

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await upsertShortLink(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `https://${siteSlug}.mytalentsite.com/go/${shortSlug || link?.slug || ''}`
  )}`

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="site_id" value={siteId} />
      {link?.id && <input type="hidden" name="link_id" value={link.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="link_slug">Slug</Label>
          <Input
            id="link_slug"
            name="slug"
            defaultValue={link?.slug ?? ''}
            onChange={(e) => setShortSlug(e.target.value.toLowerCase())}
            placeholder="merch"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Resolves to <span className="font-mono">{siteSlug}.mytalentsite.com/go/{shortSlug || 'slug'}</span>
          </p>
        </div>
        <div>
          <Label htmlFor="link_title">Title (optional)</Label>
          <Input id="link_title" name="title" defaultValue={link?.title ?? ''} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="link_target">Target URL</Label>
          <Input
            id="link_target"
            name="target_url"
            type="url"
            defaultValue={link?.target_url ?? ''}
            placeholder="https://…"
            required
          />
        </div>
        {(shortSlug || link?.slug) && (
          <div className="sm:col-span-2">
            <Label>QR code</Label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR code" className="h-40 w-40 rounded-md border border-border" />
            <p className="mt-1 text-xs text-muted-foreground">
              Right-click → Save image to download.
            </p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : link ? 'Save link' : 'Create link'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ── Affiliates ─────────────────────────────────────────────────────────────

function AffiliatesPanel({
  siteId,
  siteSlug,
  affiliates,
}: {
  siteId: string
  siteSlug: string
  affiliates: Affiliate[]
}) {
  const [editing, setEditing] = useState<Affiliate | 'new' | null>(null)
  const [generated, setGenerated] = useState<{ id: string; url: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = (id: string) => {
    if (!confirm('Delete this affiliate?')) return
    const fd = new FormData()
    fd.set('affiliate_id', id)
    startTransition(async () => {
      try {
        await deleteAffiliate(fd)
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed')
      }
    })
  }

  const handleMagicLink = (id: string) => {
    const fd = new FormData()
    fd.set('affiliate_id', id)
    setGenerated(null)
    startTransition(async () => {
      const res = await generateAffiliateMagicLink(fd)
      if (res.ok && res.url) setGenerated({ id, url: res.url })
      else alert(res.message ?? 'Failed to generate link')
    })
  }

  if (editing) {
    return (
      <AffiliateEditor
        siteId={siteId}
        affiliate={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Partners get a referral code + dashboard link. Attribution lives in cookies on the
          public site.
        </p>
        <Button size="sm" onClick={() => setEditing('new')}>
          + Add affiliate
        </Button>
      </div>
      {affiliates.length === 0 ? (
        <p className="rounded-[var(--radius-sm)] border border-border bg-panel/40 px-4 py-10 text-center text-sm text-muted-foreground">
          No affiliates yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {affiliates.map((a) => (
            <div key={a.id} className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
              <p className="text-display font-bold">{a.name}</p>
              {a.email && <p className="text-xs text-muted-foreground">{a.email}</p>}
              <p className="mt-2 font-mono text-xs text-primary">
                ?ref={a.code}
              </p>
              <p className="text-xs text-muted-foreground">
                Share link:{' '}
                <span className="font-mono">
                  {siteSlug}.mytalentsite.com?ref={a.code}
                </span>
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center text-xs">
                <div>
                  <p className="text-display text-lg font-black text-primary">{a.clicks}</p>
                  <p className="text-muted-foreground">clicks</p>
                </div>
                <div>
                  <p className="text-display text-lg font-black text-primary">{a.signups}</p>
                  <p className="text-muted-foreground">signups</p>
                </div>
                <div>
                  <p className="text-display text-lg font-black text-primary">
                    ${(a.lifetime_revenue_cents / 100).toFixed(0)}
                  </p>
                  <p className="text-muted-foreground">revenue</p>
                </div>
              </div>
              {generated?.id === a.id && (
                <div className="mt-3 break-all rounded-[var(--radius-sm)] border border-success/40 bg-success/5 p-2 font-mono text-[10px]">
                  {generated.url}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMagicLink(a.id)}
                  disabled={isPending}
                >
                  Magic link
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(a.id)}
                  disabled={isPending}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AffiliateEditor({
  siteId,
  affiliate,
  onClose,
}: {
  siteId: string
  affiliate: Affiliate | null
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const action = (fd: FormData) => {
    setError(null)
    startTransition(async () => {
      try {
        await upsertAffiliate(fd)
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="site_id" value={siteId} />
      {affiliate?.id && <input type="hidden" name="affiliate_id" value={affiliate.id} />}
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        ← Back
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="affiliate_name">Name</Label>
          <Input id="affiliate_name" name="name" defaultValue={affiliate?.name ?? ''} required />
        </div>
        <div>
          <Label htmlFor="affiliate_email">Email (for magic links)</Label>
          <Input
            id="affiliate_email"
            type="email"
            name="email"
            defaultValue={affiliate?.email ?? ''}
          />
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            name="active"
            defaultChecked={affiliate?.active ?? true}
            className="h-4 w-4 accent-primary"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : affiliate ? 'Save affiliate' : 'Add affiliate'}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
