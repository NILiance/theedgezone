'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateTheme } from '@/app/dashboard/sites/actions'
import { generateTheme } from '@/app/dashboard/sites/generate-actions'
import {
  HEADING_FONTS,
  BODY_FONTS,
  type ThemeTokens,
} from '@/lib/site-builder/theme-presets'

interface Props {
  siteId: string
  tokens: ThemeTokens
}

export function ThemeTab({ siteId, tokens }: Props) {
  const [draft, setDraft] = useState<ThemeTokens>(tokens)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [section, setSection] = useState<'colors' | 'typography' | 'layout' | 'css'>('colors')

  const save = () => {
    setError(null)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('tokens', JSON.stringify(draft))
    startTransition(async () => {
      try {
        await updateTheme(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  const setField = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) =>
    setDraft({ ...draft, [key]: value })

  const [vibe, setVibe] = useState('')
  const [genPending, startGen] = useTransition()
  const handleGenerate = () => {
    if (!vibe.trim()) return
    setError(null)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('vibe', vibe)
    startGen(async () => {
      const res = await generateTheme(fd)
      if (res.ok && res.data) {
        setDraft(res.data)
        setVibe('')
      } else {
        setError(res.message ?? 'Failed to generate theme')
      }
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Fine-tune your theme tokens. To start from a curated bundle, head to{' '}
        <strong>Templates</strong> — each template ships with its own colors, fonts, and layout.
      </p>

      <div className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-eyebrow text-primary">Generate from a vibe</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Describe how the site should feel — colors, mood, energy. We&apos;ll set the tokens.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g. moody neon athlete with electric teal accents"
            className="min-w-[200px] flex-1"
          />
          <Button onClick={handleGenerate} disabled={genPending || !vibe.trim()}>
            {genPending ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['colors', 'Colors'],
            ['typography', 'Typography'],
            ['layout', 'Layout'],
            ['css', 'Custom CSS'],
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

      {section === 'colors' && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ['primary', 'Primary'],
                ['secondary', 'Secondary'],
                ['accent', 'Accent'],
                ['bg_color', 'Background'],
                ['card_bg', 'Card background'],
                ['border_color', 'Border'],
                ['text_color', 'Text'],
                ['heading_color', 'Heading'],
                ['muted_color', 'Muted'],
                ['nav_bg', 'Nav background'],
                ['nav_text', 'Nav text'],
                ['hero_overlay_color', 'Hero overlay'],
              ] as const
            ).map(([key, label]) => (
              <ColorRow
                key={key}
                label={label}
                value={draft[key] as string}
                onChange={(v) => setField(key, v as ThemeTokens[typeof key])}
              />
            ))}
          </div>
          <div>
            <Label htmlFor="hero_overlay_opacity">
              Hero overlay opacity{' '}
              <span className="text-muted-foreground">({draft.hero_overlay_opacity})</span>
            </Label>
            <input
              id="hero_overlay_opacity"
              type="range"
              min={0}
              max={1}
              step={0.05}
              defaultValue={draft.hero_overlay_opacity}
              onChange={(e) => setField('hero_overlay_opacity', Number(e.target.value))}
              className="block w-full accent-primary"
            />
          </div>
          <div>
            <Label>Mode</Label>
            <select
              defaultValue={draft.mode}
              onChange={(e) => setField('mode', e.target.value as 'dark' | 'light')}
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      )}

      {section === 'typography' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <FontPicker
            label="Heading font"
            value={draft.font_heading}
            options={HEADING_FONTS}
            onChange={(v) => setField('font_heading', v)}
          />
          <FontPicker
            label="Body font"
            value={draft.font_body}
            options={BODY_FONTS}
            onChange={(v) => setField('font_body', v)}
          />
          <div>
            <Label>Heading weight</Label>
            <select
              defaultValue={draft.heading_weight}
              onChange={(e) => setField('heading_weight', Number(e.target.value))}
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              {[400, 500, 600, 700, 800, 900].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Body weight</Label>
            <select
              defaultValue={draft.body_weight}
              onChange={(e) => setField('body_weight', Number(e.target.value))}
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              {[300, 400, 500, 600].map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Base font size (px)</Label>
            <Input
              type="number"
              defaultValue={draft.base_font_size}
              onChange={(e) => setField('base_font_size', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Nav font size (px)</Label>
            <Input
              type="number"
              defaultValue={draft.nav_font_size}
              onChange={(e) => setField('nav_font_size', Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {section === 'layout' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Button style</Label>
            <select
              defaultValue={draft.button_style}
              onChange={(e) => setField('button_style', e.target.value as 'filled' | 'outline')}
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="filled">Filled</option>
              <option value="outline">Outline</option>
            </select>
          </div>
          <div>
            <Label>Button radius (px)</Label>
            <Input
              type="number"
              defaultValue={draft.button_radius}
              onChange={(e) => setField('button_radius', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Card radius (px)</Label>
            <Input
              type="number"
              defaultValue={draft.card_radius}
              onChange={(e) => setField('card_radius', Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Card shadow</Label>
            <select
              defaultValue={draft.card_shadow}
              onChange={(e) => setField('card_shadow', e.target.value as ThemeTokens['card_shadow'])}
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="none">None</option>
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>
          <div>
            <Label>Nav hover style</Label>
            <select
              defaultValue={draft.nav_hover_style}
              onChange={(e) =>
                setField('nav_hover_style', e.target.value as ThemeTokens['nav_hover_style'])
              }
              className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
            >
              <option value="background">Background</option>
              <option value="underline">Underline</option>
              <option value="glow">Glow</option>
              <option value="color-only">Color only</option>
            </select>
          </div>
          <div>
            <Label>Hero height</Label>
            <Input
              defaultValue={draft.hero_height}
              onChange={(e) => setField('hero_height', e.target.value)}
              placeholder="70vh"
            />
          </div>
          <div>
            <Label>Section padding</Label>
            <Input
              defaultValue={draft.section_padding}
              onChange={(e) => setField('section_padding', e.target.value)}
              placeholder="4rem"
            />
          </div>
          <div>
            <Label>Content width</Label>
            <Input
              defaultValue={draft.content_width}
              onChange={(e) => setField('content_width', e.target.value)}
              placeholder="1200px"
            />
          </div>
          <label className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              defaultChecked={draft.nav_sticky}
              onChange={(e) => setField('nav_sticky', e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">Sticky navigation</span>
          </label>
          <label className="flex items-center gap-2 self-end">
            <input
              type="checkbox"
              defaultChecked={draft.nav_transparent}
              onChange={(e) => setField('nav_transparent', e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm">Transparent nav over hero</span>
          </label>
        </div>
      )}

      {section === 'css' && (
        <div>
          <Label htmlFor="custom_css">Custom CSS</Label>
          <textarea
            id="custom_css"
            defaultValue={draft.custom_css ?? ''}
            onChange={(e) => setField('custom_css', e.target.value)}
            rows={12}
            className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
            placeholder="/* Anything here is injected into the public site head */"
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 border-t border-border pt-4">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? 'Saving…' : 'Save theme'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDraft(tokens)}
          disabled={isPending}
        >
          Revert
        </Button>
      </div>
    </div>
  )
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="color"
          defaultValue={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 cursor-pointer p-1"
        />
        <Input
          defaultValue={value || ''}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value)
          }}
          className="flex-1 font-mono text-xs"
        />
      </div>
    </div>
  )
}

function FontPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 text-sm"
        style={{ fontFamily: value }}
      >
        {options.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>
    </div>
  )
}
