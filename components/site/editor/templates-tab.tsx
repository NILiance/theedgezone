'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { SITE_TEMPLATES, templateTokens } from '@/lib/site-builder/site-templates'
import { LAYOUTS } from '@/lib/site-builder/layouts'
import { applySiteTemplate, setLayout } from '@/app/dashboard/sites/actions'

interface Props {
  siteId: string
  currentLayout: string
  currentTemplateId: string | null
}

const CATEGORIES = [
  { id: 'athlete', label: 'Athlete' },
  { id: 'creator', label: 'Creator' },
  { id: 'brand', label: 'Brand' },
  { id: 'classic', label: 'Classic' },
] as const

export function TemplatesTab({ siteId, currentLayout, currentTemplateId }: Props) {
  const [view, setView] = useState<'templates' | 'layouts'>('templates')
  const [category, setCategory] = useState<string>('athlete')
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)
  const [pendingLayout, setPendingLayout] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const filtered = SITE_TEMPLATES.filter((t) => t.category === category)

  const confirmApplyTemplate = (templateId: string) => {
    if (
      !confirm(
        'Applying this template overwrites your current theme, layout, header, footer, and pages. Continue?'
      )
    )
      return
    setError(null)
    setPendingTemplate(templateId)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('template_id', templateId)
    startTransition(async () => {
      try {
        await applySiteTemplate(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Apply failed')
      } finally {
        setPendingTemplate(null)
      }
    })
  }

  const applyLayout = (layoutId: string) => {
    setError(null)
    setPendingLayout(layoutId)
    const fd = new FormData()
    fd.set('site_id', siteId)
    fd.set('layout_id', layoutId)
    startTransition(async () => {
      try {
        await setLayout(fd)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Apply failed')
      } finally {
        setPendingLayout(null)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel-elevated/50 p-1">
        {(
          [
            ['templates', 'Site templates'],
            ['layouts', 'Layouts'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`text-display rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
              view === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-panel hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {view === 'templates' && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            Bundles of theme + layout + pages, designed for specific audiences. Applying replaces
            all your pages and your theme — preview first if you have unsaved content.
          </p>
          <div className="mb-4 flex flex-wrap gap-1 rounded-[var(--radius-sm)] bg-panel/40 p-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                  category === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-panel'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => {
              const tokens = templateTokens(t)
              const isActive = currentTemplateId === t.id
              const isApplying = pendingTemplate === t.id && isPending
              return (
                <div
                  key={t.id}
                  className={`overflow-hidden rounded-[var(--radius)] border bg-panel/40 ${
                    isActive ? 'border-primary' : 'border-border'
                  }`}
                >
                  <div
                    className="flex h-32 flex-col items-center justify-center px-4 text-center"
                    style={{
                      background: tokens.bg_color,
                      color: tokens.heading_color,
                      fontFamily: tokens.font_heading,
                    }}
                  >
                    <p className="text-display text-2xl font-black">{t.name}</p>
                    <p className="mt-1 text-xs opacity-70" style={{ fontFamily: tokens.font_body }}>
                      {t.pages.length} pages · {t.layout}
                    </p>
                  </div>
                  <div className="flex gap-1 p-2">
                    {[tokens.primary, tokens.secondary, tokens.accent, tokens.card_bg].map(
                      (c, i) => (
                        <div
                          key={i}
                          className="h-3 flex-1 rounded-sm"
                          style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      )
                    )}
                  </div>
                  <div className="border-t border-border bg-panel-elevated/30 p-3">
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                      Pages: {t.pages.map((p) => p.title).join(', ')}
                    </p>
                    <Button
                      size="sm"
                      variant={isActive ? 'outline' : 'default'}
                      onClick={() => confirmApplyTemplate(t.id)}
                      disabled={isPending}
                      className="mt-3 w-full"
                    >
                      {isApplying ? 'Applying…' : isActive ? 'Current' : 'Apply template'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'layouts' && (
        <div>
          <p className="mb-3 text-sm text-muted-foreground">
            A layout controls page chrome (nav position, hero style, footer style). Non-destructive
            — your content stays.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAYOUTS.map((l) => {
              const isActive = currentLayout === l.id
              const isApplying = pendingLayout === l.id && isPending
              return (
                <div
                  key={l.id}
                  className={`overflow-hidden rounded-[var(--radius)] border bg-panel/40 ${
                    isActive ? 'border-primary' : 'border-border'
                  }`}
                >
                  <pre className="whitespace-pre p-3 font-mono text-[9px] leading-tight text-muted-foreground">
                    {l.wireframe}
                  </pre>
                  <div className="border-t border-border bg-panel-elevated/30 p-3">
                    <p className="text-display text-sm font-bold">{l.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
                    <Button
                      size="sm"
                      variant={isActive ? 'outline' : 'default'}
                      onClick={() => applyLayout(l.id)}
                      disabled={isPending}
                      className="mt-3 w-full"
                    >
                      {isApplying ? 'Applying…' : isActive ? 'Current' : 'Use layout'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
