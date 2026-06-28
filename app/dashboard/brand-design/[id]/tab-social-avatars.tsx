'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DownloadLink } from '@/components/download-link'
import { ARSENAL_EFFECTS } from '@/lib/arsenal-tab-options'
import { LogoStyleToggle } from './logo-style-toggle'
import {
  generateSocialAvatarsAction,
  type SocialAvatarsActionState,
} from './arsenal-tab-actions'

const PLATFORMS = [
  { key: 'instagram', name: 'Instagram', size: '320×320' },
  { key: 'tiktok', name: 'TikTok', size: '200×200' },
  { key: 'youtube', name: 'YouTube', size: '800×800' },
  { key: 'twitter', name: 'X / Twitter', size: '400×400' },
  { key: 'facebook', name: 'Facebook', size: '320×320' },
  { key: 'linkedin', name: 'LinkedIn', size: '400×400' },
]
const LABEL: Record<string, string> = Object.fromEntries(PLATFORMS.map((p) => [p.key, p.name]))

export function SocialAvatarsTab({
  brandId,
  hasFinal,
  logoUrl,
  transparentLogoUrl,
  brandPrimary,
}: {
  brandId: string
  hasFinal: boolean
  logoUrl: string
  transparentLogoUrl: string
  brandPrimary: string | null
}) {
  const [state, action, pending] = useActionState<SocialAvatarsActionState, FormData>(
    generateSocialAvatarsAction,
    {}
  )
  const [effect, setEffect] = useState('none')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [effectColor, setEffectColor] = useState(brandPrimary ?? '#1f6feb')
  const [logoStyle, setLogoStyle] = useState<'transparent' | 'regular'>('transparent')
  useRefreshOnNewUrl(state.url)

  if (!hasFinal) return <LockedNotice label="Social Avatars" />

  const hasEffect = effect !== 'none'
  const previewLogo = logoStyle === 'transparent' ? transparentLogoUrl || logoUrl : logoUrl

  return (
    <div>
      <h2 className="text-display text-center text-3xl font-black">Social Media Avatars</h2>
      <p className="mx-auto mt-2 max-w-3xl text-center text-sm text-muted-foreground">
        Your logo, perfectly sized for every platform. Pick a background, add an optional effect,
        and preview each avatar before you download.
      </p>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Controls + live preview */}
        <form action={action} className="grid gap-4">
          <input type="hidden" name="brand_id" value={brandId} />
          <input type="hidden" name="effect" value={effect} />
          <input type="hidden" name="bg_color" value={bgColor} />
          <input type="hidden" name="effect_color" value={effectColor} />
          <input type="hidden" name="logo_style" value={logoStyle} />

          {/* Live preview of the avatar */}
          <div className="mx-auto">
            <p className="text-display mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Preview
            </p>
            <div
              className="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-border shadow-inner"
              style={{
                background: hasEffect
                  ? `radial-gradient(circle at 30% 30%, ${effectColor}, ${bgColor})`
                  : bgColor,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {previewLogo ? (
                <img src={previewLogo} alt="Logo preview" className="h-[60%] w-[60%] object-contain" />
              ) : null}
            </div>
            {hasEffect && (
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Approximate — the real effect backdrop is rendered on generate.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-end justify-center gap-4 border-t border-border pt-4">
            <ColorPicker label="Background" value={bgColor} onChange={setBgColor} />
            {hasEffect && (
              <ColorPicker label="Effect" value={effectColor} onChange={setEffectColor} />
            )}
            <label className="block">
              <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Effect
              </span>
              <select
                value={effect}
                onChange={(e) => setEffect(e.target.value)}
                className="mt-1 block w-44 rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {ARSENAL_EFFECTS.map((eff) => (
                  <option key={eff.val} value={eff.val}>
                    {eff.name}
                  </option>
                ))}
              </select>
            </label>
            <LogoStyleToggle value={logoStyle} onChange={setLogoStyle} />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="text-display mx-auto rounded-[var(--radius-sm)] bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {pending ? 'Generating Avatars…' : 'Generate All Avatars'}
          </button>
          {state.error && <p className="text-center text-xs text-destructive">{state.error}</p>}
        </form>

        {/* Results — see every generated avatar */}
        <div>
          <p className="text-display mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {state.avatars?.length ? 'Your avatars' : 'Platform sizes'}
          </p>
          {state.avatars?.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {state.avatars.map((a) => (
                <div
                  key={a.key}
                  className="flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.url}
                    alt={LABEL[a.key] ?? a.key}
                    className="h-20 w-20 rounded-full border border-border object-cover"
                  />
                  <p className="text-display text-[11px] font-bold">{LABEL[a.key] ?? a.key}</p>
                  <DownloadLink
                    url={a.url}
                    filename={`${a.key}-avatar-${a.size}.png`}
                    className="text-[10px] uppercase tracking-widest text-accent hover:underline"
                  >
                    ⬇ PNG
                  </DownloadLink>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PLATFORMS.map((p) => (
                <div
                  key={p.key}
                  className="rounded-[var(--radius-sm)] border border-border bg-panel/40 p-3 text-center"
                >
                  <p className="text-display text-xs font-bold">{p.name}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.size}
                  </p>
                </div>
              ))}
            </div>
          )}

          {state.url && (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-[var(--radius)] border border-success/40 bg-success/5 p-4 text-center">
              <p className="text-display text-sm font-bold text-success">✓ Pack ready</p>
              <DownloadLink
                url={state.url}
                filename="social-avatars.zip"
                className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground"
              >
                ⬇ Download All ({state.count ?? 0} files)
              </DownloadLink>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-display block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-8 w-16 cursor-pointer rounded border border-border bg-background"
      />
    </label>
  )
}

function LockedNotice({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-8 text-center">
      <p className="text-eyebrow text-accent">🔒 {label} Locked</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a final logo first — every Arsenal asset is built around it.
      </p>
    </div>
  )
}

function useRefreshOnNewUrl(url: string | undefined) {
  const router = useRouter()
  const lastRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (url && url !== lastRef.current) {
      lastRef.current = url
      router.refresh()
    }
  }, [url, router])
}
