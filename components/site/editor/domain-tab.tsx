'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  slug: string
  status: string
  customDomain?: string | null
}

export function DomainTab({ slug, status, customDomain }: Props) {
  const subdomain = `${slug}.mytalentsite.com`
  const previewUrl = `/site/${slug}`

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Subdomain</p>
        <p className="mt-1 text-display text-lg font-bold">{subdomain}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Your site is reachable at this subdomain once published.{' '}
          {status === 'published' ? (
            <span className="text-success">It is currently published.</span>
          ) : (
            <span>It will go live when you click Publish in the top right.</span>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
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

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">Custom domain</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect a domain you already own. We&apos;ll check DNS and issue an SSL certificate
          automatically once it&apos;s pointed at our edge.
        </p>
        <div className="mt-4">
          <Label htmlFor="custom_domain">Domain</Label>
          <Input
            id="custom_domain"
            defaultValue={customDomain ?? ''}
            placeholder="yourname.com"
            disabled
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Custom-domain provisioning ships in v2-C (Vercel domains API + DNS check).
          </p>
        </div>
      </section>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-5">
        <p className="text-eyebrow text-primary">DNS instructions</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Point your domain at our edge with one of:
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
              CNAME @ → cname.vercel-dns.com
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
              A    @ → 76.76.21.21
            </code>
          </li>
        </ul>
      </section>
    </div>
  )
}
