'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { updateAppPublish } from '../actions'
import { generateAppPrivacyPolicy } from './ai-actions'
import type { AppTheme } from '@/lib/app-theme'

const STATUS_LABELS: Record<string, string> = {
  none: 'Not started',
  info_collected: 'Info collected',
  dev_enrolled: 'Developer enrolled',
  submitted: 'Submitted',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  live: 'Live 🎉',
}
const STATUSES = Object.keys(STATUS_LABELS)

/** Publish tab — store status tracking, privacy-policy generation, Expo config. */
export function PublishTab({
  appId,
  appName,
  packageId,
  theme,
  storeListing,
}: {
  appId: string
  appName: string
  packageId: string
  theme: AppTheme
  storeListing: Record<string, unknown>
}) {
  const sl = storeListing
  const [appleStatus, setAppleStatus] = useState(String(sl.apple_status ?? 'none'))
  const [googleStatus, setGoogleStatus] = useState(String(sl.google_status ?? 'none'))
  const [appleLink, setAppleLink] = useState(String(sl.apple_store_link ?? ''))
  const [googleLink, setGoogleLink] = useState(String(sl.google_store_link ?? ''))
  const [privacy, setPrivacy] = useState(String(sl.privacy_policy_text ?? ''))
  const [genBusy, setGenBusy] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<string | null>(null)

  const slug = (appName || 'my-app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-app'
  const appJson = JSON.stringify(
    {
      expo: {
        name: appName,
        slug,
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        splash: { image: './assets/splash.png', resizeMode: 'contain', backgroundColor: theme.primary },
        ios: { bundleIdentifier: packageId || 'com.yourname.app', supportsTablet: false },
        android: { package: packageId || 'com.yourname.app' },
      },
    },
    null,
    2
  )

  const save = () => {
    setStatus(null)
    const fd = new FormData()
    fd.set('app_id', appId)
    fd.set(
      'patch',
      JSON.stringify({
        apple_status: appleStatus,
        google_status: googleStatus,
        apple_store_link: appleLink,
        google_store_link: googleLink,
        privacy_policy_text: privacy,
      })
    )
    startTransition(async () => {
      const r = await updateAppPublish(fd)
      setStatus(r.ok ? 'Saved.' : r.message ?? 'Save failed')
    })
  }

  const gen = async () => {
    setGenBusy(true)
    const r = await generateAppPrivacyPolicy(appId)
    setGenBusy(false)
    if (r.ok && r.text) setPrivacy(r.text)
  }

  const selectCls = 'mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm'

  return (
    <div className="space-y-5">
      {/* Status */}
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-eyebrow text-primary">Submission status</p>
        <p className="mt-1 text-xs text-muted-foreground">Track where each store sits in review.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-xs text-muted-foreground">🍎 Apple App Store</span>
            <select value={appleStatus} onChange={(e) => setAppleStatus(e.target.value)} className={selectCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <input value={appleLink} onChange={(e) => setAppleLink(e.target.value)} placeholder="App Store link (when live)" className={`${selectCls} font-mono text-xs`} />
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">🤖 Google Play</span>
            <select value={googleStatus} onChange={(e) => setGoogleStatus(e.target.value)} className={selectCls}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <input value={googleLink} onChange={(e) => setGoogleLink(e.target.value)} placeholder="Play Store link (when live)" className={`${selectCls} font-mono text-xs`} />
          </div>
        </div>
      </section>

      {/* Privacy policy */}
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <div className="flex items-center justify-between">
          <p className="text-eyebrow text-primary">Privacy policy</p>
          <button type="button" onClick={gen} disabled={genBusy} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 disabled:opacity-50">
            {genBusy ? 'Generating…' : '✨ Generate'}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Both stores require a hosted privacy policy. Generate one, edit as needed, then host it and paste the URL in Store submission.
        </p>
        <textarea
          rows={10}
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
          placeholder="Generate or paste your privacy policy (HTML)…"
          className="mt-2 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-[11px]"
        />
      </section>

      {/* Expo config */}
      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-eyebrow text-primary">Expo build config</p>
            <p className="mt-1 text-xs text-muted-foreground">This <code>app.json</code> ships in your Expo ZIP. Run <code>eas build</code> then <code>eas submit</code>.</p>
          </div>
          <a href={`/api/apps/${appId}/build`}>
            <Button size="sm" variant="outline">⬇ Download Expo ZIP</Button>
          </a>
        </div>
        <pre className="mt-3 overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-background p-3 text-[10px] leading-relaxed text-muted-foreground">
          {appJson}
        </pre>
      </section>

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button onClick={save} disabled={isPending}>{isPending ? 'Saving…' : 'Save publish info'}</Button>
        {status && <p className={`text-xs ${status === 'Saved.' ? 'text-success' : 'text-destructive'}`}>{status}</p>}
      </div>
    </div>
  )
}
