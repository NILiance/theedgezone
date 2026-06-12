'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  connectDomain,
  refreshDomain,
  disconnectDomain,
  type DomainStatus,
} from '@/app/dashboard/sites/domain-actions'

interface Props {
  siteId: string
  slug: string
  status: string
  customDomain: string | null
  domainStatus: DomainStatus | null
}

export function DomainTab({ siteId, slug, status, customDomain, domainStatus }: Props) {
  const subdomain = `${slug}.mytalentsite.com`
  const previewUrl = `/site/${slug}`
  const hasDomain = Boolean(customDomain)

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Subdomain</p>
        <p className="mt-1 text-display text-lg font-bold">{subdomain}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {status === 'published' ? (
            <span className="text-success">Live</span>
          ) : (
            <span>Will go live when you click Publish</span>
          )}{' '}
          · always available regardless of custom domain.
        </p>
        <div className="mt-4">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center rounded-[var(--radius-sm)] border border-border bg-panel-elevated px-3 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-panel"
          >
            Open preview
          </a>
        </div>
      </section>

      {hasDomain ? (
        <ConnectedDomainPanel
          siteId={siteId}
          domain={customDomain!}
          domainStatus={domainStatus}
        />
      ) : (
        <ConnectDomainForm siteId={siteId} />
      )}

      <DnsInstructions />
    </div>
  )
}

function ConnectDomainForm({ siteId }: { siteId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const action = (fd: FormData) => {
    fd.set('site_id', siteId)
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await connectDomain(fd)
      if (res.ok) setSuccess(res.message ?? 'Saved.')
      else setError(res.message ?? 'Failed to connect domain')
    })
  }

  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <p className="text-eyebrow text-primary">Custom domain</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Connect a domain you already own. We&apos;ll attach it to Vercel and provision SSL once
        DNS is pointed at our edge.
      </p>
      <form action={action} className="mt-4 flex flex-wrap gap-2">
        <Input
          name="domain"
          placeholder="yourname.com"
          className="min-w-[200px] flex-1 font-mono"
          required
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Connecting…' : 'Connect'}
        </Button>
      </form>
      {success && <p className="mt-3 text-sm text-success">{success}</p>}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </section>
  )
}

function ConnectedDomainPanel({
  siteId,
  domain,
  domainStatus,
}: {
  siteId: string
  domain: string
  domainStatus: DomainStatus | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const refresh = () => {
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('domain', domain)
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const res = await refreshDomain(fd)
      if (res.ok) setInfo(res.message ?? 'Refreshed.')
      else setError(res.message ?? 'Refresh failed')
    })
  }

  const disconnect = () => {
    if (!confirm(`Disconnect ${domain}? The site stays at the subdomain.`)) return
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('domain', domain)
    setError(null)
    setInfo(null)
    startTransition(async () => {
      const res = await disconnectDomain(fd)
      if (res.ok) setInfo(res.message ?? 'Removed.')
      else setError(res.message ?? 'Remove failed')
    })
  }

  const certColor =
    domainStatus?.cert_status === 'ready'
      ? 'success'
      : domainStatus?.cert_status === 'provisioning'
      ? 'accent'
      : 'muted-foreground'
  const verified = domainStatus?.verified ?? false

  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-eyebrow text-primary">Custom domain</p>
          <p className="mt-1 text-display text-lg font-bold">{domain}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span
              className={`text-display rounded-full px-2 py-0.5 font-bold uppercase tracking-widest ${
                verified ? 'bg-success/20 text-success' : 'bg-panel-elevated text-muted-foreground'
              }`}
            >
              {verified ? 'DNS verified' : 'Awaiting DNS'}
            </span>
            <span
              className={`text-display rounded-full px-2 py-0.5 font-bold uppercase tracking-widest bg-${certColor}/20 text-${certColor}`}
            >
              SSL: {domainStatus?.cert_status ?? 'pending'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh} disabled={isPending}>
            {isPending ? 'Refreshing…' : 'Refresh status'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={disconnect}
            disabled={isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Disconnect
          </Button>
        </div>
      </div>

      {info && <p className="mt-3 text-sm text-success">{info}</p>}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {!domainStatus?.vercel.configured && (
        <p className="mt-4 rounded-[var(--radius-sm)] border border-accent/40 bg-accent/5 p-3 text-xs text-accent">
          Vercel API isn&apos;t configured on this deploy
          (<code className="font-mono">VERCEL_ACCESS_TOKEN</code> /{' '}
          <code className="font-mono">VERCEL_PROJECT_ID</code>). Domain is saved but SSL won&apos;t
          provision until those are set.
        </p>
      )}

      {domainStatus?.vercel.error && (
        <p className="mt-3 text-xs text-destructive">{domainStatus.vercel.error}</p>
      )}

      {domainStatus?.vercel.verification && domainStatus.vercel.verification.length > 0 && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-border bg-background p-4">
          <p className="text-eyebrow mb-2 text-muted-foreground">Ownership verification</p>
          {domainStatus.vercel.verification.map((v, i) => (
            <div key={i} className="mb-2 font-mono text-xs">
              <span className="text-primary">{v.type}</span>{' '}
              <span className="text-foreground">{v.domain}</span>{' '}
              <span className="text-muted-foreground">→</span>{' '}
              <span className="text-foreground">{v.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function DnsInstructions() {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <p className="text-eyebrow text-primary">DNS instructions</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Point your domain at our edge with one of these records:
      </p>
      <div className="mt-3 space-y-2">
        <div className="rounded-[var(--radius-sm)] border border-border bg-background p-3 font-mono text-xs">
          <p className="text-muted-foreground">Apex (yourname.com)</p>
          <p className="mt-1 text-foreground">A @ → 76.76.21.21</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-background p-3 font-mono text-xs">
          <p className="text-muted-foreground">Subdomain (www, app, etc.)</p>
          <p className="mt-1 text-foreground">CNAME &lt;sub&gt; → cname.vercel-dns.com</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        After updating DNS, click <strong>Refresh status</strong> above. Propagation usually takes
        a few minutes; SSL provisions automatically.
      </p>
    </section>
  )
}
