'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssetPicker } from '@/components/site/editor/asset-picker'
import { screenDef, type AppScreen } from '@/lib/app-screens'

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v))
const inputCls = 'w-full rounded-[var(--radius-sm)] border border-border bg-background px-2.5 py-1.5 text-sm'

/** Find-or-create the screen of `type`, applying `mutate` to its content. */
function upsertScreen(
  screens: AppScreen[],
  type: string,
  mutate: (content: Record<string, unknown>) => Record<string, unknown>
): AppScreen[] {
  const idx = screens.findIndex((s) => s.type === type)
  if (idx >= 0) {
    const next = [...screens]
    next[idx] = { ...next[idx]!, content: mutate((next[idx]!.content ?? {}) as Record<string, unknown>) }
    return next
  }
  const def = screenDef(type)
  if (!def) return screens
  const id = `${type}-${Math.random().toString(36).slice(2, 7)}`
  return [...screens, { id, title: def.defaultTitle, icon: def.icon, type, content: mutate(clone(def.defaultContent) as Record<string, unknown>) }]
}

function contentArray<T>(screens: AppScreen[], type: string, key: string): T[] {
  const s = screens.find((x) => x.type === type)
  const v = (s?.content as Record<string, unknown> | undefined)?.[key]
  return Array.isArray(v) ? (v as T[]) : []
}

/* ─────────────────────────── News & Blog ─────────────────────────── */

interface Post {
  title: string
  body: string
  date: string
  image: string
}

export function NewsTab({ screens, onScreens }: { screens: AppScreen[]; onScreens: (s: AppScreen[]) => void }) {
  const posts = contentArray<Post>(screens, 'blog', 'posts')
  const [editing, setEditing] = useState<number | null>(null)
  const setPosts = (next: Post[]) => onScreens(upsertScreen(screens, 'blog', (c) => ({ ...c, posts: next })))

  const add = () => {
    setPosts([{ title: '', body: '', date: '', image: '' }, ...posts])
    setEditing(0)
  }
  const patch = (i: number, p: Partial<Post>) => setPosts(posts.map((x, idx) => (idx === i ? { ...x, ...p } : x)))
  const remove = (i: number) => {
    setPosts(posts.filter((_, idx) => idx !== i))
    setEditing(null)
  }

  return (
    <div className="space-y-3">
      <Header title="News & Blog" onAdd={add} addLabel="+ New post" />
      {posts.length === 0 ? (
        <Empty icon="📰" title="No posts yet" sub="Create your first post to share news with your fans." />
      ) : (
        posts.map((p, i) => (
          <div key={i} className={`rounded-[var(--radius)] border bg-panel/40 ${editing === i ? 'border-primary/50' : 'border-border'}`}>
            <div className="flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-display truncate font-bold">{p.title || 'Untitled'}</p>
                {p.date && <p className="text-[10px] text-muted-foreground">{p.date}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(editing === i ? null : i)}>{editing === i ? 'Close' : 'Edit'}</Button>
              <button type="button" onClick={() => remove(i)} className="px-2 text-destructive">✕</button>
            </div>
            {editing === i && (
              <div className="space-y-2 border-t border-border p-3">
                <Field label="Title"><input value={p.title} onChange={(e) => patch(i, { title: e.target.value })} className={inputCls} /></Field>
                <Field label="Date"><input type="date" value={p.date} onChange={(e) => patch(i, { date: e.target.value })} className={inputCls} /></Field>
                <Field label="Content"><textarea rows={6} value={p.body} onChange={(e) => patch(i, { body: e.target.value })} className={inputCls} /></Field>
                <Field label="Image"><AssetPicker value={p.image} onChange={(v) => patch(i, { image: v })} accept="image/*" /></Field>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

/* ─────────────────────────── Media ─────────────────────────── */

export function MediaTab({ screens, onScreens }: { screens: AppScreen[]; onScreens: (s: AppScreen[]) => void }) {
  const images = contentArray<string>(screens, 'gallery', 'images')
  const videos = contentArray<{ title: string; url: string }>(screens, 'videos', 'items')
  const audio = contentArray<{ title: string; url: string }>(screens, 'audio', 'items')

  const setImages = (next: string[]) => onScreens(upsertScreen(screens, 'gallery', (c) => ({ ...c, images: next })))
  const setVideos = (next: { title: string; url: string }[]) => onScreens(upsertScreen(screens, 'videos', (c) => ({ ...c, items: next })))
  const setAudio = (next: { title: string; url: string }[]) => onScreens(upsertScreen(screens, 'audio', (c) => ({ ...c, items: next })))

  return (
    <div className="space-y-4">
      <h2 className="text-display text-2xl font-black">Media</h2>

      <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
        <p className="text-display font-bold">📸 Gallery images ({images.length})</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <AssetPicker value={img} onChange={(v) => setImages(images.map((x, idx) => (idx === i ? v : x)))} accept="image/*" />
              <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute right-1 top-1 rounded bg-background/80 px-1 text-destructive">✕</button>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="mt-2" onClick={() => setImages([...images, ''])}>+ Add image</Button>
      </section>

      <MediaRows label="🎬 Videos" placeholder="YouTube / Vimeo URL" rows={videos} onChange={setVideos} />
      <MediaRows label="🎵 Audio tracks" placeholder="Audio URL" rows={audio} onChange={setAudio} />
    </div>
  )
}

function MediaRows({ label, placeholder, rows, onChange }: { label: string; placeholder: string; rows: { title: string; url: string }[]; onChange: (r: { title: string; url: string }[]) => void }) {
  return (
    <section className="rounded-[var(--radius)] border border-border bg-panel/40 p-4">
      <p className="text-display font-bold">{label} ({rows.length})</p>
      <div className="mt-2 space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input value={r.title} onChange={(e) => onChange(rows.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} placeholder="Title" className={`${inputCls} flex-1`} />
            <input value={r.url} onChange={(e) => onChange(rows.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))} placeholder={placeholder} className={`${inputCls} flex-[2] font-mono text-xs`} />
            <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="text-destructive">✕</button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="outline" className="mt-2" onClick={() => onChange([...rows, { title: '', url: '' }])}>+ Add</Button>
    </section>
  )
}

/* ─────────────────────────── Events ─────────────────────────── */

interface Evt {
  title: string
  date: string
  time: string
  location: string
  description: string
  ticket_url: string
}

export function EventsTab({ screens, onScreens }: { screens: AppScreen[]; onScreens: (s: AppScreen[]) => void }) {
  const events = contentArray<Evt>(screens, 'events', 'events')
  const [editing, setEditing] = useState<number | null>(null)
  const setEvents = (next: Evt[]) => onScreens(upsertScreen(screens, 'events', (c) => ({ ...c, events: next })))

  const add = () => {
    setEvents([...events, { title: '', date: '', time: '', location: '', description: '', ticket_url: '' }])
    setEditing(events.length)
  }
  const patch = (i: number, p: Partial<Evt>) => setEvents(events.map((x, idx) => (idx === i ? { ...x, ...p } : x)))
  const remove = (i: number) => {
    setEvents(events.filter((_, idx) => idx !== i))
    setEditing(null)
  }

  return (
    <div className="space-y-3">
      <Header title="Events" onAdd={add} addLabel="+ Add event" />
      {events.length === 0 ? (
        <Empty icon="📅" title="No events yet" sub="Add upcoming games, appearances, or events." />
      ) : (
        events.map((ev, i) => (
          <div key={i} className={`rounded-[var(--radius)] border bg-panel/40 ${editing === i ? 'border-primary/50' : 'border-border'}`}>
            <div className="flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-display truncate font-bold">{ev.title || 'Event'}</p>
                <p className="text-[10px] text-muted-foreground">{[ev.date, ev.location && `📍 ${ev.location}`].filter(Boolean).join(' · ')}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setEditing(editing === i ? null : i)}>{editing === i ? 'Close' : 'Edit'}</Button>
              <button type="button" onClick={() => remove(i)} className="px-2 text-destructive">✕</button>
            </div>
            {editing === i && (
              <div className="space-y-2 border-t border-border p-3">
                <Field label="Event title"><input value={ev.title} onChange={(e) => patch(i, { title: e.target.value })} className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Date"><input type="date" value={ev.date} onChange={(e) => patch(i, { date: e.target.value })} className={inputCls} /></Field>
                  <Field label="Time"><input type="time" value={ev.time} onChange={(e) => patch(i, { time: e.target.value })} className={inputCls} /></Field>
                </div>
                <Field label="Location"><input value={ev.location} onChange={(e) => patch(i, { location: e.target.value })} className={inputCls} /></Field>
                <Field label="Description"><textarea rows={3} value={ev.description} onChange={(e) => patch(i, { description: e.target.value })} className={inputCls} /></Field>
                <Field label="Ticket URL (optional)"><input value={ev.ticket_url} onChange={(e) => patch(i, { ticket_url: e.target.value })} placeholder="https://…" className={`${inputCls} font-mono text-xs`} /></Field>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

/* ─────────────────────────── shared ─────────────────────────── */

function Header({ title, onAdd, addLabel }: { title: string; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-display text-2xl font-black">{title}</h2>
      <Button size="sm" onClick={onAdd}>{addLabel}</Button>
    </div>
  )
}
function Empty({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-border bg-panel/30 p-10 text-center">
      <p className="text-3xl">{icon}</p>
      <p className="text-display mt-2 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  )
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}
