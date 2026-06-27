'use client'

import { useState, type CSSProperties } from 'react'
import type { AppTheme } from '@/lib/app-theme'
import { type AppScreen, type NavItem, screenEmoji, screenPattern, MAX_NAV_ITEMS } from '@/lib/app-screens'
import type { AppProduct } from '@/lib/app-commerce'

/**
 * The live, hosted app — a full-screen mobile web app (installable PWA) that
 * renders a talent's configured screens/nav/theme/content. This is the runtime
 * fans actually use; the in-builder preview + the Expo WebView point here.
 */
export function PublicApp({
  theme,
  appName,
  iconUrl,
  screens,
  nav,
  products,
}: {
  theme: AppTheme
  appName: string
  iconUrl?: string
  screens: AppScreen[]
  nav: NavItem[]
  products: AppProduct[]
}) {
  const home = screens.find((s) => s.type === 'home')
  const [activeId, setActiveId] = useState<string | null>(home?.id ?? screens[0]?.id ?? null)
  const active = screens.find((s) => s.id === activeId) ?? screens[0] ?? null
  const navItems = (nav.length ? nav : autoNav(screens)).filter((n) => n.visible).slice(0, MAX_NAV_ITEMS)
  const isHome = active?.type === 'home'

  const shell: CSSProperties = {
    background: theme.bg_color,
    color: theme.text_color,
    fontFamily: `'${theme.font_body}', system-ui, sans-serif`,
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden" style={shell}>
      {!isHome && (
        <header className="flex shrink-0 items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${theme.card_bg}` }}>
          {iconUrl ? (
            <img src={iconUrl} alt="" className="h-7 w-7 rounded-md object-cover" />
          ) : (
            <div className="h-7 w-7 rounded-md" style={{ background: theme.primary }} />
          )}
          <span className="truncate text-base" style={{ color: theme.heading_color, fontFamily: `'${theme.font_heading}', system-ui, sans-serif`, fontWeight: Number(theme.heading_weight) || 700 }}>
            {active?.title || appName}
          </span>
        </header>
      )}

      <main className="min-h-0 flex-1 overflow-y-auto">
        {active ? (
          <Screen screen={active} theme={theme} appName={appName} screens={screens} products={products} onSelect={setActiveId} />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm" style={{ color: theme.muted_color }}>
            This app has no screens yet.
          </div>
        )}
      </main>

      {navItems.length > 0 && (
        <nav className="flex shrink-0 items-stretch justify-around px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2" style={{ background: theme.nav_bg, borderTop: `1px solid ${theme.card_bg}` }}>
          {navItems.map((n) => {
            const on = active?.id === n.screen_id
            return (
              <button key={n.screen_id} type="button" onClick={() => setActiveId(n.screen_id)} className="flex flex-1 flex-col items-center gap-0.5 py-0.5" style={{ color: on ? theme.nav_active : theme.nav_text }}>
                {theme.nav_style !== 'labels_only' && <span className="text-lg leading-none">{n.icon}</span>}
                {theme.nav_style !== 'icons_only' && <span className="max-w-full truncate text-[10px] font-semibold">{n.label}</span>}
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

function autoNav(screens: AppScreen[]): NavItem[] {
  return screens.slice(0, MAX_NAV_ITEMS).map((s) => ({ screen_id: s.id, label: s.title, icon: screenEmoji(s.icon), visible: true }))
}

function Screen({
  screen,
  theme,
  appName,
  screens,
  products,
  onSelect,
}: {
  screen: AppScreen
  theme: AppTheme
  appName: string
  screens: AppScreen[]
  products: AppProduct[]
  onSelect: (id: string) => void
}) {
  const c = (screen.content ?? {}) as Record<string, unknown>
  const radius = theme.border_radius
  const card: CSSProperties = { background: theme.card_bg, borderRadius: radius }
  const heading: CSSProperties = { color: theme.heading_color, fontFamily: `'${theme.font_heading}', system-ui, sans-serif`, fontWeight: Number(theme.heading_weight) || 700 }

  if (screen.type === 'home') return <Home content={c} theme={theme} appName={appName} screens={screens} onSelect={onSelect} />

  if (screen.type === 'blog' || screen.type === 'news') {
    const posts = Array.isArray(c.posts) ? (c.posts as Record<string, string>[]) : []
    return (
      <div className="space-y-4 p-4">
        {posts.length === 0 && <Placeholder theme={theme}>No posts yet.</Placeholder>}
        {posts.map((p, i) => (
          <article key={i} className="overflow-hidden" style={card}>
            {p.image && <img src={p.image} alt="" className="h-44 w-full object-cover" />}
            <div className="p-4">
              <h2 className="text-lg" style={heading}>{p.title || 'Untitled'}</h2>
              {p.date && <p className="mt-0.5 text-xs" style={{ color: theme.muted_color }}>{p.date}</p>}
              {p.body && <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: theme.text_color }}>{p.body}</p>}
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (screen.type === 'events') {
    const events = Array.isArray(c.events) ? (c.events as Record<string, string>[]) : []
    return (
      <div className="space-y-3 p-4">
        {events.length === 0 && <Placeholder theme={theme}>No events yet.</Placeholder>}
        {events.map((ev, i) => (
          <div key={i} className="p-4" style={card}>
            <p className="font-bold" style={heading}>{ev.title || 'Event'}</p>
            <p className="mt-1 text-xs" style={{ color: theme.muted_color }}>{[ev.date, ev.time, ev.location && `📍 ${ev.location}`].filter(Boolean).join(' · ')}</p>
            {ev.description && <p className="mt-2 text-sm" style={{ color: theme.text_color }}>{ev.description}</p>}
            {ev.ticket_url && (
              <a href={ev.ticket_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-bold" style={{ background: theme.primary, color: theme.secondary }}>Get tickets →</a>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (screen.type === 'shop' || screen.type === 'merch') {
    const list = products.filter((p) => p.active !== false)
    return (
      <div className="p-4">
        {list.length === 0 ? (
          <Placeholder theme={theme}>No products yet.</Placeholder>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <div key={p.id} className="overflow-hidden" style={card}>
                {p.image ? <img src={p.image} alt="" className="aspect-square w-full object-cover" /> : <div className="aspect-square w-full" style={{ background: theme.bg_color }} />}
                <div className="p-2">
                  <p className="truncate text-xs font-bold" style={heading}>{p.name || 'Product'}</p>
                  <p className="text-sm font-black" style={{ color: theme.primary }}>${p.price || '0'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const pattern = screenPattern(screen.type)
  const items = Array.isArray(c.items) ? (c.items as Record<string, string>[]) : []
  const images = Array.isArray(c.images) ? (c.images as string[]) : []

  if (pattern === 'profile') {
    const stats = Array.isArray(c.stats) ? (c.stats as Record<string, string>[]) : []
    const details = [['Height', c.height], ['Weight', c.weight], ['Hometown', c.hometown], ['Class', c.class_year]].filter(([, v]) => v) as [string, string][]
    return (
      <div className="space-y-4 p-4">
        {typeof c.image === 'string' && c.image && <img src={c.image} alt="" className="h-56 w-full object-cover" style={{ borderRadius: radius }} />}
        {Boolean(c.headline) && <p className="text-xl" style={heading}>{String(c.headline)}</p>}
        {Boolean(c.bio) && <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: theme.text_color }}>{String(c.bio)}</p>}
        {details.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {details.map(([k, v]) => (
              <div key={k} className="p-2 text-center" style={card}>
                <p className="text-sm font-bold" style={{ color: theme.heading_color }}>{v}</p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: theme.muted_color }}>{k}</p>
              </div>
            ))}
          </div>
        )}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s, i) => (
              <div key={i} className="p-3 text-center" style={card}>
                <p className="text-xl font-black" style={{ color: theme.primary }}>{s.value || '—'}</p>
                <p className="text-[10px] uppercase tracking-wide" style={{ color: theme.muted_color }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
        {Boolean(c.achievements) && (
          <div className="space-y-1">
            {String(c.achievements).split('\n').filter(Boolean).map((a, i) => (
              <p key={i} className="text-sm" style={{ color: theme.text_color }}>🏅 {a}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (pattern === 'text') {
    return (
      <div className="space-y-3 p-5">
        {String(c.body || '').split('\n').filter(Boolean).map((p, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: theme.text_color }}>{p}</p>
        ))}
        {!c.body && <Placeholder theme={theme}>Coming soon.</Placeholder>}
      </div>
    )
  }

  if (pattern === 'links') {
    return (
      <div className="space-y-2.5 p-4">
        {items.filter((it) => it.label || it.url).map((it, i) => (
          <a key={i} href={it.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3.5" style={card}>
            <span className="truncate text-sm font-semibold" style={{ color: theme.heading_color }}>{it.label || it.title || 'Link'}</span>
            <span style={{ color: theme.muted_color }}>→</span>
          </a>
        ))}
      </div>
    )
  }

  if (pattern === 'video') {
    return (
      <div className="space-y-3 p-4">
        {items.filter((it) => it.url || it.title).map((it, i) => (
          <a key={i} href={it.url || '#'} target="_blank" rel="noopener noreferrer" className="block overflow-hidden" style={card}>
            <div className="flex h-36 items-center justify-center text-3xl" style={{ background: '#000', color: '#fff' }}>▶</div>
            <p className="px-3 py-2.5 text-sm font-semibold" style={{ color: theme.heading_color }}>{it.title || 'Video'}</p>
          </a>
        ))}
      </div>
    )
  }

  if (pattern === 'gallery') {
    return (
      <div className="grid grid-cols-2 gap-2 p-4">
        {images.filter(Boolean).map((img, i) => (
          <img key={i} src={img} alt="" className="aspect-square w-full object-cover" style={{ borderRadius: radius }} />
        ))}
        {images.filter(Boolean).length === 0 && <div className="col-span-2"><Placeholder theme={theme}>No photos yet.</Placeholder></div>}
      </div>
    )
  }

  if (pattern === 'web') {
    return typeof c.url === 'string' && c.url ? (
      <iframe src={c.url} className="h-full w-full border-0" title={screen.title} />
    ) : (
      <Placeholder theme={theme}>No page linked.</Placeholder>
    )
  }

  // list
  return (
    <div className="space-y-2.5 p-4">
      {items.filter((it) => it.title || it.subtitle).map((it, i) => (
        <div key={i} className="px-4 py-3" style={card}>
          <p className="text-sm font-semibold" style={{ color: theme.heading_color }}>{it.title || 'Item'}</p>
          {(it.subtitle || it.detail) && <p className="text-xs" style={{ color: theme.muted_color }}>{[it.subtitle, it.detail].filter(Boolean).join(' · ')}</p>}
        </div>
      ))}
      {items.filter((it) => it.title || it.subtitle).length === 0 && <Placeholder theme={theme}>Nothing here yet.</Placeholder>}
    </div>
  )
}

function Home({ content, theme, appName, screens, onSelect }: { content: Record<string, unknown>; theme: AppTheme; appName: string; screens: AppScreen[]; onSelect: (id: string) => void }) {
  const splash = (Array.isArray(content.splash_images) ? (content.splash_images as string[]) : []).filter(Boolean)
  const effects = (content.effects ?? {}) as Record<string, unknown>
  const name = (content.heading as string) || appName
  const showName = content.show_name !== false
  const showGrid = content.show_nav_grid !== false
  const announcements = Array.isArray(content.announcements) ? (content.announcements as Record<string, string>[]) : []
  const gridScreens = screens.filter((s) => s.type !== 'home').slice(0, 6)
  const gradient = String(effects.gradient ?? '')
  const tintAmt = Number(effects.tint_amount ?? 0)

  return (
    <div>
      <div className="relative flex min-h-[65vh] flex-col overflow-hidden">
        {splash[0] ? (
          <img src={splash[0]} alt="" className="absolute inset-0 h-full w-full object-cover" style={{ filter: Number(effects.blur) ? `blur(${Number(effects.blur)}px)` : undefined }} />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${theme.primary}, ${theme.secondary})` }} />
        )}
        {tintAmt > 0 && <div className="absolute inset-0" style={{ background: String(effects.tint ?? '#000'), opacity: tintAmt }} />}
        {gradient === 'bottom-fade' && <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)' }} />}
        {gradient === 'top-fade' && <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 55%)' }} />}
        {Number(effects.vignette) > 0 && <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 80px rgba(0,0,0,${Number(effects.vignette)})` }} />}

        {showName && (
          <div className="relative z-10 flex flex-1 flex-col justify-center p-6">
            <p className="leading-none" style={{ color: String(effects.text_color ?? '#fff'), fontFamily: `'${theme.font_heading}', system-ui, sans-serif`, fontSize: `${(Number(content.name_size) || 100) * 0.42}px`, fontWeight: 900, textShadow: '0 2px 14px rgba(0,0,0,0.6)' }}>
              {name}
            </p>
          </div>
        )}

        {showGrid && gridScreens.length > 0 && (
          <div className="relative z-10 grid shrink-0 grid-cols-2 gap-x-8 gap-y-4 px-7 pb-8 pt-4">
            {gridScreens.map((s) => (
              <button key={s.id} type="button" onClick={() => onSelect(s.id)} className="truncate text-left text-base font-bold uppercase tracking-wide" style={{ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                {s.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {announcements.filter((a) => a.title || a.body).length > 0 && (
        <div className="space-y-3 p-4">
          {announcements.filter((a) => a.title || a.body).map((a, i) => (
            <div key={i} className="p-4" style={{ background: theme.card_bg, borderRadius: theme.border_radius }}>
              {a.title && <p className="font-bold" style={{ color: theme.heading_color }}>{a.title}</p>}
              {a.body && <p className="mt-1 text-sm" style={{ color: theme.muted_color }}>{a.body}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Placeholder({ theme, children }: { theme: AppTheme; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-sm" style={{ color: theme.muted_color }}>
      {children}
    </div>
  )
}
