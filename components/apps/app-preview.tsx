'use client'

import type { CSSProperties } from 'react'
import type { AppTheme } from '@/lib/app-theme'
import { type AppScreen, type NavItem, screenEmoji, screenPattern, MAX_NAV_ITEMS } from '@/lib/app-screens'
import { type DeviceId, type NotchStyle, deviceSpec, DEVICES } from '@/lib/app-devices'

/**
 * Live phone-frame preview of a talent's app. Renders the active screen + the
 * bottom tab bar straight from the in-editor state, so the builder updates as
 * you type — the legacy App Builder's signature iframe preview, reproduced
 * client-side (no round-trip).
 */
export function AppPreview({
  theme,
  appName,
  iconUrl,
  screens,
  nav,
  activeId,
  onSelect,
  device = 'iphone15',
  onDevice,
}: {
  theme: AppTheme
  appName: string
  iconUrl?: string
  screens: AppScreen[]
  nav: NavItem[]
  activeId: string | null
  onSelect: (id: string) => void
  device?: DeviceId
  onDevice?: (d: DeviceId) => void
}) {
  const spec = deviceSpec(device)
  const active = screens.find((s) => s.id === activeId) ?? screens[0] ?? null
  const navItems = (nav.length ? nav : autoNav(screens)).filter((n) => n.visible).slice(0, MAX_NAV_ITEMS)
  const isHome = active?.type === 'home'

  const frame: CSSProperties = {
    width: spec.w,
    height: spec.h,
    background: theme.bg_color,
    color: theme.text_color,
    fontFamily: `'${theme.font_body}', system-ui, sans-serif`,
    borderRadius: spec.radius,
  }

  return (
    <div className="mx-auto" style={{ width: spec.w }}>
      {onDevice && (
        <div className="mb-3 flex justify-center gap-1">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onDevice(d.id)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors ${
                device === d.id ? 'bg-foreground text-background' : 'bg-panel-elevated text-muted-foreground hover:text-foreground'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative shadow-2xl ring-[6px] ring-black" style={frame}>
        <Notch style={spec.notch} />
        <div className="flex h-full flex-col overflow-hidden" style={{ borderRadius: Math.max(0, spec.radius - 6) }}>
          {/* status bar */}
          <div
            className="flex shrink-0 items-center justify-between px-5 pt-3 pb-1 text-[10px] font-semibold"
            style={{ color: theme.heading_color }}
          >
            <span>9:41</span>
            <span>● ● ●</span>
          </div>

          {/* header (hidden on the home splash) */}
          {!isHome && (
            <div
              className="flex shrink-0 items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: `1px solid ${theme.card_bg}` }}
            >
              {iconUrl ? (
                <img src={iconUrl} alt="" className="h-6 w-6 rounded-md object-cover" />
              ) : (
                <div className="h-6 w-6 rounded-md" style={{ background: theme.primary }} />
              )}
              <span
                className="truncate text-sm"
                style={{
                  color: theme.heading_color,
                  fontFamily: `'${theme.font_heading}', system-ui, sans-serif`,
                  fontWeight: Number(theme.heading_weight) || 700,
                }}
              >
                {active?.title || appName}
              </span>
            </div>
          )}

          {/* screen body */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {active ? (
              <ScreenBody screen={active} theme={theme} appName={appName} screens={screens} onSelect={onSelect} />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-xs" style={{ color: theme.muted_color }}>
                Add a screen to see it here.
              </div>
            )}
          </div>

          {/* bottom tab bar */}
          {navItems.length > 0 && (
            <div
              className="flex shrink-0 items-stretch justify-around px-1 pb-4 pt-2"
              style={{ background: theme.nav_bg, borderTop: `1px solid ${theme.card_bg}` }}
            >
              {navItems.map((n) => {
                const on = active?.id === n.screen_id
                return (
                  <button
                    key={n.screen_id}
                    type="button"
                    onClick={() => onSelect(n.screen_id)}
                    className="flex flex-1 flex-col items-center gap-0.5 py-0.5"
                    style={{ color: on ? theme.nav_active : theme.nav_text }}
                  >
                    {theme.nav_style !== 'labels_only' && <span className="text-base leading-none">{n.icon}</span>}
                    {theme.nav_style !== 'icons_only' && (
                      <span className="max-w-full truncate text-[9px] font-semibold">{n.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Builds a sensible default nav from the first screens when none is set. */
export function autoNav(screens: AppScreen[]): NavItem[] {
  return screens.slice(0, MAX_NAV_ITEMS).map((s) => ({
    screen_id: s.id,
    label: s.title,
    icon: screenEmoji(s.icon),
    visible: true,
  }))
}

function ScreenBody({
  screen,
  theme,
  appName,
  screens,
  onSelect,
}: {
  screen: AppScreen
  theme: AppTheme
  appName: string
  screens: AppScreen[]
  onSelect: (id: string) => void
}) {
  const c = (screen.content ?? {}) as Record<string, unknown>
  const radius = theme.border_radius
  const card: CSSProperties = { background: theme.card_bg, borderRadius: radius }
  const heading: CSSProperties = {
    color: theme.heading_color,
    fontFamily: `'${theme.font_heading}', system-ui, sans-serif`,
    fontWeight: Number(theme.heading_weight) || 700,
  }

  if (screen.type === 'home') return <HomeScreen content={c} theme={theme} appName={appName} screens={screens} onSelect={onSelect} />

  if (screen.type === 'blog' || screen.type === 'news') {
    const posts = Array.isArray(c.posts) ? (c.posts as Record<string, string>[]) : []
    return (
      <div className="space-y-3 p-4">
        {posts.length === 0 && <p className="text-xs" style={{ color: theme.muted_color }}>Posts appear here.</p>}
        {posts.map((p, i) => (
          <div key={i} className="overflow-hidden" style={card}>
            {p.image && <img src={p.image} alt="" className="h-28 w-full object-cover" />}
            <div className="p-3">
              <p className="text-sm font-bold" style={heading}>{p.title || 'Untitled'}</p>
              {p.date && <p className="text-[10px]" style={{ color: theme.muted_color }}>{p.date}</p>}
              {p.body && <p className="mt-1 line-clamp-3 text-xs" style={{ color: theme.text_color }}>{p.body}</p>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (screen.type === 'events') {
    const events = Array.isArray(c.events) ? (c.events as Record<string, string>[]) : []
    return (
      <div className="space-y-2 p-4">
        {events.length === 0 && <p className="text-xs" style={{ color: theme.muted_color }}>Events appear here.</p>}
        {events.map((ev, i) => (
          <div key={i} className="px-3 py-2.5" style={card}>
            <p className="text-xs font-bold" style={heading}>{ev.title || 'Event'}</p>
            <p className="text-[10px]" style={{ color: theme.muted_color }}>
              {[ev.date, ev.time, ev.location && `📍 ${ev.location}`].filter(Boolean).join(' · ')}
            </p>
          </div>
        ))}
      </div>
    )
  }

  const pattern = screenPattern(screen.type)
  const items = Array.isArray(c.items) ? (c.items as Record<string, string>[]) : []
  const images = Array.isArray(c.images) ? (c.images as string[]) : []

  if (pattern === 'profile') {
    const stats = Array.isArray(c.stats) ? (c.stats as Record<string, string>[]) : []
    return (
      <div className="space-y-3 p-4">
        {typeof c.image === 'string' && c.image ? (
          <img src={c.image} alt="" className="h-40 w-full object-cover" style={{ borderRadius: radius }} />
        ) : (
          <div className="h-40 w-full" style={{ background: theme.primary, opacity: 0.25, borderRadius: radius }} />
        )}
        {Boolean(c.headline) && <p className="text-lg" style={heading}>{String(c.headline)}</p>}
        {Boolean(c.bio) && <p className="text-xs leading-relaxed" style={{ color: theme.text_color }}>{String(c.bio)}</p>}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="p-2 text-center" style={card}>
                <p className="text-base font-black" style={{ color: theme.primary }}>{s.value || '—'}</p>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: theme.muted_color }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {Boolean(c.achievements) && (
          <div className="space-y-1">
            {String(c.achievements).split('\n').filter(Boolean).map((a, i) => (
              <p key={i} className="text-xs" style={{ color: theme.text_color }}>🏅 {a}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (pattern === 'text') {
    return (
      <div className="space-y-2 p-4">
        {String(c.body || '')
          .split('\n')
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: theme.text_color }}>{p}</p>
          ))}
        {!c.body && <p className="text-xs" style={{ color: theme.muted_color }}>Your text appears here.</p>}
      </div>
    )
  }

  if (pattern === 'links') {
    return (
      <div className="space-y-2 p-4">
        {(items.length ? items : [{}, {}]).map((it, i) => (
          <div key={i} className="flex items-center justify-between px-3 py-3" style={card}>
            <span className="truncate text-xs font-semibold" style={{ color: theme.heading_color }}>
              {it.label || it.title || 'Link'}
            </span>
            <span style={{ color: theme.muted_color }}>→</span>
          </div>
        ))}
      </div>
    )
  }

  if (pattern === 'video') {
    return (
      <div className="space-y-3 p-4">
        {(items.length ? items : [{}]).map((it, i) => (
          <div key={i} style={card} className="overflow-hidden">
            <div className="flex h-24 items-center justify-center" style={{ background: '#000', color: '#fff' }}>▶</div>
            <p className="px-3 py-2 text-xs font-semibold" style={{ color: theme.heading_color }}>{it.title || 'Video'}</p>
          </div>
        ))}
      </div>
    )
  }

  if (pattern === 'gallery') {
    return (
      <div className="grid grid-cols-2 gap-2 p-4">
        {(images.length ? images : ['', '', '', '']).map((img, i) =>
          img ? (
            <img key={i} src={img} alt="" className="h-24 w-full object-cover" style={{ borderRadius: radius }} />
          ) : (
            <div key={i} className="h-24 w-full" style={{ background: theme.card_bg, borderRadius: radius }} />
          )
        )}
      </div>
    )
  }

  if (pattern === 'web') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <span className="text-3xl">{screenEmoji(screen.icon)}</span>
        <p className="text-xs font-semibold" style={{ color: theme.heading_color }}>{screen.title}</p>
        <p className="text-[10px]" style={{ color: theme.muted_color }}>
          {typeof c.url === 'string' && c.url ? c.url : 'Embedded page'}
        </p>
      </div>
    )
  }

  // list
  return (
    <div className="space-y-2 p-4">
      {(items.length ? items : [{}, {}]).map((it, i) => (
        <div key={i} className="px-3 py-2.5" style={card}>
          <p className="text-xs font-semibold" style={{ color: theme.heading_color }}>{it.title || 'Item'}</p>
          {(it.subtitle || it.detail) && (
            <p className="text-[10px]" style={{ color: theme.muted_color }}>{[it.subtitle, it.detail].filter(Boolean).join(' · ')}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function HomeScreen({
  content,
  theme,
  appName,
  screens,
  onSelect,
}: {
  content: Record<string, unknown>
  theme: AppTheme
  appName: string
  screens: AppScreen[]
  onSelect: (id: string) => void
}) {
  const splash = (Array.isArray(content.splash_images) ? (content.splash_images as string[]) : []).filter(Boolean)
  const effects = (content.effects ?? {}) as Record<string, unknown>
  const name = (content.heading as string) || appName
  const showName = content.show_name !== false
  const showGrid = content.show_nav_grid !== false
  const announcements = Array.isArray(content.announcements) ? (content.announcements as Record<string, string>[]) : []
  const pos = (content.name_position as string) || 'center'
  const justify =
    pos === 'top' || pos === 'upper-third' ? 'flex-start' : pos === 'bottom' || pos === 'lower-third' ? 'flex-end' : 'center'

  const tintAmt = Number(effects.tint_amount ?? 0)
  const gradient = String(effects.gradient ?? '')
  const gridScreens = screens.filter((s) => s.type !== 'home').slice(0, 6)

  return (
    <div>
      {/* full-bleed splash with name + nav-grid overlay */}
      <div className="relative flex min-h-[440px] flex-col overflow-hidden">
        {splash[0] ? (
          <img src={splash[0]} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: Number(effects.blur) ? `blur(${Number(effects.blur)}px)` : undefined }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${theme.primary}, ${theme.secondary})` }} />
        )}
        {tintAmt > 0 && <div className="absolute inset-0" style={{ background: String(effects.tint ?? '#000'), opacity: tintAmt }} />}
        {gradient === 'bottom-fade' && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)' }} />}
        {gradient === 'top-fade' && <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 55%)' }} />}
        {Number(effects.vignette) > 0 && (
          <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 70px rgba(0,0,0,${Number(effects.vignette)})` }} />
        )}

        {/* splash carousel arrows */}
        {splash.length > 1 && (
          <>
            <div className="absolute left-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-sm text-black">‹</div>
            <div className="absolute right-2 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-sm text-black">›</div>
          </>
        )}

        {/* name */}
        {showName && (
          <div className="relative z-10 flex flex-1 flex-col p-5" style={{ justifyContent: justify }}>
            <p
              className="leading-none"
              style={{
                color: String(effects.text_color ?? '#fff'),
                fontFamily: `'${theme.font_heading}', system-ui, sans-serif`,
                fontSize: `${(Number(content.name_size) || 100) * 0.32}px`,
                fontWeight: nameWeight(String(content.name_style ?? 'bold')),
                fontStyle: String(content.name_style) === 'script' ? 'italic' : 'normal',
                textTransform: String(content.name_style) === 'display' ? 'uppercase' : 'none',
                textShadow: effects.text_effect === 'shadow' ? '0 2px 12px rgba(0,0,0,0.6)' : undefined,
              }}
            >
              {name}
            </p>
          </div>
        )}

        {/* nav-grid overlay */}
        {showGrid && gridScreens.length > 0 && (
          <div className="relative z-10 grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 px-6 pb-7 pt-4">
            {gridScreens.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className="truncate text-left text-sm font-bold uppercase tracking-wide"
                style={{ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* announcements */}
      {announcements.filter((a) => a.title || a.body).length > 0 && (
        <div className="space-y-2 p-4">
          {announcements
            .filter((a) => a.title || a.body)
            .map((a, i) => (
              <div key={i} className="p-3" style={{ background: theme.card_bg, borderRadius: theme.border_radius }}>
                {a.title && <p className="text-xs font-bold" style={{ color: theme.heading_color }}>{a.title}</p>}
                {a.body && <p className="mt-0.5 text-[11px]" style={{ color: theme.muted_color }}>{a.body}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function Notch({ style }: { style: NotchStyle }) {
  if (style === 'punch-hole') {
    return <div className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-full bg-black" style={{ width: 10, height: 10 }} />
  }
  if (style === 'camera-bar') {
    return <div className="absolute left-1/2 top-1.5 z-30 -translate-x-1/2 rounded-full bg-black" style={{ width: 50, height: 6 }} />
  }
  // dynamic-island
  return <div className="absolute left-1/2 top-2 z-30 -translate-x-1/2 rounded-full bg-black" style={{ width: 90, height: 22 }} />
}

function nameWeight(style: string): number {
  if (style === 'minimal') return 300
  if (style === 'display' || style === 'bold') return 900
  if (style === 'serif' || style === 'script') return 600
  return 800
}
