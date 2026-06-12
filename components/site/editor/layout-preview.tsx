'use client'

import type { LayoutDef } from '@/lib/site-builder/layouts'

/**
 * Visual mockup of a structural layout. Renders a tiny stylized version
 * of the page chrome — nav position, hero shape, content blocks, footer
 * style — so the user can see at a glance which layout matches their
 * vibe instead of squinting at ASCII art.
 */
export function LayoutPreview({ layout, active }: { layout: LayoutDef; active?: boolean }) {
  const sidebar = layout.nav_position === 'sidebar'
  const navTop = layout.nav_position === 'top'
  const navFloat = layout.nav_position === 'floating'

  const navAlignClass =
    layout.nav_align === 'center' ? 'justify-center' : layout.nav_align === 'right' ? 'justify-end' : 'justify-start'

  return (
    <div
      className={`aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-sm)] border bg-gradient-to-br from-slate-900 to-slate-950 ${
        active ? 'border-primary' : 'border-border'
      }`}
    >
      <div className="flex h-full flex-col">
        {navTop && (
          <div className={`flex items-center gap-2 border-b border-white/10 px-3 py-2 ${navAlignClass}`}>
            <div className="h-2.5 w-12 rounded-sm bg-primary" />
            <div className="ml-auto flex gap-1.5">
              <div className="h-1.5 w-6 rounded-sm bg-white/40" />
              <div className="h-1.5 w-6 rounded-sm bg-white/40" />
              <div className="h-1.5 w-6 rounded-sm bg-white/40" />
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {sidebar && (
            <div className="flex w-1/4 flex-col gap-1.5 border-r border-white/10 p-2">
              <div className="h-2 w-3/4 rounded-sm bg-primary" />
              <div className="mt-2 h-1.5 w-full rounded-sm bg-white/40" />
              <div className="h-1.5 w-2/3 rounded-sm bg-white/40" />
              <div className="h-1.5 w-3/4 rounded-sm bg-white/40" />
              <div className="h-1.5 w-1/2 rounded-sm bg-white/40" />
            </div>
          )}

          <div className="flex flex-1 flex-col">
            {navFloat && (
              <div className="absolute right-2 top-2 z-10 flex gap-1">
                <div className="h-1.5 w-4 rounded-sm bg-white/40" />
                <div className="h-1.5 w-4 rounded-sm bg-white/40" />
              </div>
            )}

            {/* Hero */}
            {renderHero(layout)}

            {/* Body */}
            <div className="flex-1 space-y-1.5 p-3">
              {layout.content_flow === 'magazine' ? (
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="col-span-2 space-y-1">
                    <div className="h-1.5 w-full rounded-sm bg-white/40" />
                    <div className="h-1.5 w-4/5 rounded-sm bg-white/40" />
                    <div className="h-1.5 w-3/4 rounded-sm bg-white/40" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-6 w-full rounded-sm bg-white/20" />
                    <div className="h-1.5 w-full rounded-sm bg-white/30" />
                  </div>
                </div>
              ) : layout.content_flow === 'sidebar' ? (
                <div className="space-y-1">
                  <div className="h-1.5 w-3/4 rounded-sm bg-white/40" />
                  <div className="h-1.5 w-full rounded-sm bg-white/40" />
                  <div className="h-1.5 w-2/3 rounded-sm bg-white/40" />
                  <div className="h-1.5 w-full rounded-sm bg-white/40" />
                </div>
              ) : layout.content_flow === 'wide' ? (
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="h-6 rounded-sm bg-white/20" />
                  <div className="h-6 rounded-sm bg-white/20" />
                  <div className="h-6 rounded-sm bg-white/20" />
                </div>
              ) : (
                <div className="mx-auto w-3/4 space-y-1">
                  <div className="h-1.5 w-full rounded-sm bg-white/40" />
                  <div className="h-1.5 w-4/5 rounded-sm bg-white/40" />
                  <div className="h-1.5 w-3/4 rounded-sm bg-white/40" />
                </div>
              )}
            </div>

            {/* Footer */}
            {renderFooter(layout)}
          </div>
        </div>
      </div>
    </div>
  )
}

function renderHero(layout: LayoutDef) {
  switch (layout.hero_style) {
    case 'full-bleed':
      return (
        <div className="relative flex h-1/2 items-center justify-center bg-gradient-to-br from-primary/40 to-primary/20">
          <div className="space-y-1.5 text-center">
            <div className="mx-auto h-2.5 w-24 rounded-sm bg-white" />
            <div className="mx-auto h-1.5 w-16 rounded-sm bg-white/60" />
          </div>
        </div>
      )
    case 'split':
      return (
        <div className="flex h-1/2">
          <div className="flex-1 bg-gradient-to-br from-primary/40 to-primary/20" />
          <div className="flex flex-1 flex-col justify-center gap-1 p-2">
            <div className="h-2 w-full rounded-sm bg-white" />
            <div className="h-1.5 w-3/4 rounded-sm bg-white/60" />
            <div className="mt-1.5 h-2.5 w-1/2 rounded-sm bg-primary" />
          </div>
        </div>
      )
    case 'card':
      return (
        <div className="flex h-1/3 items-end justify-center p-2">
          <div className="grid w-full grid-cols-3 gap-1">
            <div className="aspect-square rounded-sm bg-white/30" />
            <div className="aspect-square rounded-sm bg-white/30" />
            <div className="aspect-square rounded-sm bg-white/30" />
          </div>
        </div>
      )
    case 'minimal':
      return (
        <div className="flex h-1/4 items-center justify-center">
          <div className="h-2 w-24 rounded-sm bg-white/80" />
        </div>
      )
    case 'none':
    default:
      return null
  }
}

function renderFooter(layout: LayoutDef) {
  switch (layout.footer_style) {
    case 'columns':
      return (
        <div className="grid grid-cols-3 gap-1.5 border-t border-white/10 p-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-1 w-1/2 rounded-sm bg-primary/60" />
              <div className="h-1 w-full rounded-sm bg-white/30" />
              <div className="h-1 w-3/4 rounded-sm bg-white/30" />
            </div>
          ))}
        </div>
      )
    case 'stacked':
      return (
        <div className="border-t border-white/10 p-2">
          <div className="space-y-1">
            <div className="h-1.5 w-1/3 rounded-sm bg-white/30" />
            <div className="h-1.5 w-1/2 rounded-sm bg-white/30" />
          </div>
        </div>
      )
    case 'logo-bar':
      return (
        <div className="flex items-center justify-center gap-3 border-t border-white/10 p-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-2 w-6 rounded-sm bg-white/30" />
          ))}
        </div>
      )
    case 'minimal':
    default:
      return (
        <div className="flex justify-center border-t border-white/10 p-1.5">
          <div className="h-1 w-12 rounded-sm bg-white/30" />
        </div>
      )
  }
}
