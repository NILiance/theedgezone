'use client'

import { useState, useTransition } from 'react'
import {
  connectCustomDomain,
  refreshCustomDomain,
  disconnectCustomDomain,
  type DomainStatus,
} from '@/app/dashboard/custom-domain-actions'

type Result = { ok: boolean; message?: string }
type Action = (fd: FormData) => Promise<Result>

export function DomainManagerClient({
  targetType,
  entityId,
  subdomain,
  domain,
  status,
}: {
  targetType: string
  entityId: string
  subdomain: string
  domain: string | null
  status: DomainStatus | null
}) {
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<Result | null>(null)
  const [input, setInput] = useState('')

  const call = (action: Action, extra: Record<string, string>) => {
    const fd = new FormData()
    fd.set('target_type', targetType)
    fd.set('entity_id', entityId)
    for (const [k, v] of Object.entries(extra)) fd.set(k, v)
    start(async () => setMsg(await action(fd)))
  }

  const verified = status?.verified
  const tone = verified
    ? 'bg-success/20 text-success'
    : status?.cert_status === 'provisioning'
      ? 'bg-accent/20 text-accent'
      : 'bg-panel-elevated text-muted-foreground'

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-border bg-panel/40 p-5">
      <div>
        <p className="text-eyebrow text-primary">Custom domain</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your free address:{' '}
          <code className="text-foreground">{subdomain}</code>. Connect your own domain below.
        </p>
      </div>

      {!domain ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="store.yourbrand.com"
            className="flex-1 rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm font-mono"
          />
          <button
            type="button"
            disabled={pending || !input.trim()}
            onClick={() => call(connectCustomDomain, { domain: input.trim().toLowerCase() })}
            className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Connecting…' : 'Connect domain'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <code className="text-foreground">{domain}</code>
            <span
              className={`text-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${tone}`}
            >
              {verified ? 'Live' : status?.cert_status ?? 'pending'}
            </span>
          </p>

          {!verified && (
            <div className="rounded-[var(--radius-sm)] border border-border bg-background/40 p-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Add these DNS records at your registrar
              </p>
              <table className="mt-2 w-full text-xs">
                <tbody className="font-mono">
                  <tr>
                    <td className="py-1 pr-3 text-muted-foreground">Apex (@)</td>
                    <td className="py-1 pr-3">{status?.instructions.apex.record}</td>
                    <td className="py-1">{status?.instructions.apex.value}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-3 text-muted-foreground">Subdomain</td>
                    <td className="py-1 pr-3">{status?.instructions.subdomain.record}</td>
                    <td className="py-1">{status?.instructions.subdomain.value}</td>
                  </tr>
                  {status?.vercel.verification?.map((v, i) => (
                    <tr key={i}>
                      <td className="py-1 pr-3 text-muted-foreground">{v.domain}</td>
                      <td className="py-1 pr-3">{v.type}</td>
                      <td className="py-1 break-all">{v.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Use an A record for an apex domain (yourbrand.com) or a CNAME for a subdomain
                (store.yourbrand.com). After updating DNS, click Refresh.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => call(refreshCustomDomain, { domain })}
              className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              {pending ? 'Checking…' : 'Refresh status'}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => call(disconnectCustomDomain, { domain })}
              className="text-display rounded-[var(--radius-sm)] border border-destructive/40 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}

      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-success' : 'text-destructive'}`}>{msg.message}</p>
      )}
      {status && !status.vercel.configured && (
        <p className="text-[10px] text-muted-foreground">
          Note: automatic domain provisioning is off (no Vercel token configured). The mapping is
          saved; an admin can finish attaching the domain in Vercel.
        </p>
      )}
    </div>
  )
}
