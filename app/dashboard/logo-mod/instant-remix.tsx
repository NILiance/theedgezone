'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { generateLogoMods, saveLogoMod } from './actions'

export function InstantRemix() {
  const router = useRouter()
  const [logoUrl, setLogoUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [variations, setVariations] = useState<string[]>([])
  const [chosen, setChosen] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const generate = async () => {
    setMsg(null)
    setVariations([])
    setChosen(null)
    setBusy(true)
    try {
      const res = await generateLogoMods({ logo_url: logoUrl, prompt })
      if (res.ok && res.variations?.length) setVariations(res.variations)
      else setMsg(res.message ?? 'Nothing came back — try a different prompt.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setBusy(false)
    }
  }

  const useIt = () => {
    if (!chosen) return
    setMsg(null)
    startTransition(async () => {
      const res = await saveLogoMod({ logo_url: logoUrl, chosen_url: chosen, prompt })
      if (res.ok) {
        setMsg('Saved! Find it below + in My Assets.')
        setVariations([])
        setChosen(null)
        router.refresh()
      } else {
        setMsg(res.message ?? 'Could not save')
      }
    })
  }

  return (
    <div className="space-y-4 rounded-[var(--radius)] border border-primary/30 bg-panel/40 p-5">
      <div>
        <p className="text-eyebrow text-primary">Instant remix</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your logo, describe the change, and our in-house designer makes variations on the
          spot — pick the one you like.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="block text-xs text-muted-foreground">Your current logo</span>
          <div className="mt-1">
            <AssetPicker value={logoUrl} onChange={setLogoUrl} accept="image/*" />
          </div>
        </div>
        <label className="block text-sm">
          <span className="block text-xs text-muted-foreground">What should change?</span>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. make it gold + black, flatten to a single color, add a sharper edge…"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={generate} disabled={busy || !logoUrl}>
          {busy ? 'Generating…' : 'Generate variations'}
        </Button>
        {msg && <span className="text-[11px] text-muted-foreground">{msg}</span>}
      </div>

      {variations.length > 0 && (
        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {variations.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setChosen(v)}
                className={`overflow-hidden rounded-[var(--radius-sm)] border-2 bg-white ${
                  chosen === v ? 'border-primary' : 'border-border'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v} alt="Variation" className="aspect-square w-full object-contain p-2" />
              </button>
            ))}
          </div>
          <div className="mt-3">
            <Button onClick={useIt} disabled={!chosen || isPending}>
              {isPending ? 'Saving…' : 'Use this logo'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
