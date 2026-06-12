'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

/**
 * Per-block-type prop editors. Each component receives `props` and an
 * `onChange(newProps)` callback. They're rendered inside BlockEditor when
 * the user expands a block to edit it.
 */

export interface BlockFormProps {
  props: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
}

export function HeroForm({ props, onChange }: BlockFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="hero_title">Title</Label>
        <Input
          id="hero_title"
          defaultValue={(props.title as string) ?? ''}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
          placeholder="Headline"
        />
      </div>
      <div>
        <Label htmlFor="hero_subtitle">Subtitle</Label>
        <Input
          id="hero_subtitle"
          defaultValue={(props.subtitle as string) ?? ''}
          onChange={(e) => onChange({ ...props, subtitle: e.target.value })}
          placeholder="Tagline"
        />
      </div>
      <div>
        <Label htmlFor="hero_image">Background image URL</Label>
        <Input
          id="hero_image"
          defaultValue={(props.image_url as string) ?? ''}
          onChange={(e) => onChange({ ...props, image_url: e.target.value })}
          placeholder="https://…"
        />
      </div>
    </div>
  )
}

export function TextForm({ props, onChange }: BlockFormProps) {
  return (
    <div>
      <Label htmlFor="text_content">Body</Label>
      <textarea
        id="text_content"
        defaultValue={(props.content as string) ?? ''}
        onChange={(e) => onChange({ ...props, content: e.target.value })}
        rows={6}
        className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm leading-relaxed shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      />
    </div>
  )
}

export function StatsForm({ props, onChange }: BlockFormProps) {
  const items =
    ((props.items as Array<{ value: string; label: string }>) ?? []).map((i) => ({
      value: i.value ?? '',
      label: i.label ?? '',
    }))

  const update = (idx: number, key: 'value' | 'label', value: string) => {
    const next = items.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    onChange({ ...props, items: next })
  }

  const add = () =>
    onChange({ ...props, items: [...items, { value: '—', label: 'New stat' }] })

  const remove = (idx: number) =>
    onChange({ ...props, items: items.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_2fr_auto] gap-2">
          <Input
            defaultValue={item.value}
            onChange={(e) => update(idx, 'value', e.target.value)}
            placeholder="Value"
          />
          <Input
            defaultValue={item.label}
            onChange={(e) => update(idx, 'label', e.target.value)}
            placeholder="Label"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => remove(idx)}
            className="text-destructive"
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={add}>
        + Add stat
      </Button>
    </div>
  )
}

export function GalleryForm({ props, onChange }: BlockFormProps) {
  const images = (props.images as Array<{ url: string; alt?: string }>) ?? []
  const update = (idx: number, key: 'url' | 'alt', value: string) => {
    const next = images.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    onChange({ ...props, images: next })
  }
  const add = () => onChange({ ...props, images: [...images, { url: '', alt: '' }] })
  const remove = (idx: number) =>
    onChange({ ...props, images: images.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No images yet. Add an image URL below.
        </p>
      )}
      {images.map((img, idx) => (
        <div key={idx} className="grid grid-cols-[2fr_1fr_auto] gap-2">
          <Input
            defaultValue={img.url ?? ''}
            onChange={(e) => update(idx, 'url', e.target.value)}
            placeholder="https://…"
          />
          <Input
            defaultValue={img.alt ?? ''}
            onChange={(e) => update(idx, 'alt', e.target.value)}
            placeholder="Alt text"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => remove(idx)}
            className="text-destructive"
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={add}>
        + Add image
      </Button>
    </div>
  )
}

export function SponsorsForm({ props, onChange }: BlockFormProps) {
  const logos = (props.logos as Array<{ url: string; name: string }>) ?? []
  const update = (idx: number, key: 'url' | 'name', value: string) => {
    const next = logos.map((it, i) => (i === idx ? { ...it, [key]: value } : it))
    onChange({ ...props, logos: next })
  }
  const add = () => onChange({ ...props, logos: [...logos, { url: '', name: '' }] })
  const remove = (idx: number) =>
    onChange({ ...props, logos: logos.filter((_, i) => i !== idx) })

  return (
    <div className="space-y-3">
      {logos.map((logo, idx) => (
        <div key={idx} className="grid grid-cols-[2fr_1fr_auto] gap-2">
          <Input
            defaultValue={logo.url ?? ''}
            onChange={(e) => update(idx, 'url', e.target.value)}
            placeholder="https://logo.png"
          />
          <Input
            defaultValue={logo.name ?? ''}
            onChange={(e) => update(idx, 'name', e.target.value)}
            placeholder="Sponsor name"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => remove(idx)}
            className="text-destructive"
          >
            ×
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={add}>
        + Add sponsor
      </Button>
    </div>
  )
}

export function CtaForm({ props, onChange }: BlockFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="cta_title">Title</Label>
        <Input
          id="cta_title"
          defaultValue={(props.title as string) ?? ''}
          onChange={(e) => onChange({ ...props, title: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="cta_body">Body</Label>
        <textarea
          id="cta_body"
          defaultValue={(props.body as string) ?? ''}
          onChange={(e) => onChange({ ...props, body: e.target.value })}
          rows={3}
          className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="cta_label">Button label</Label>
          <Input
            id="cta_label"
            defaultValue={(props.button_label as string) ?? ''}
            onChange={(e) => onChange({ ...props, button_label: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="cta_href">Button URL</Label>
          <Input
            id="cta_href"
            defaultValue={(props.button_href as string) ?? '#'}
            onChange={(e) => onChange({ ...props, button_href: e.target.value })}
            placeholder="mailto:you@example.com"
          />
        </div>
      </div>
    </div>
  )
}

export function ContactForm({ props, onChange }: BlockFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="contact_email">Email</Label>
        <Input
          id="contact_email"
          type="email"
          defaultValue={(props.email as string) ?? ''}
          onChange={(e) => onChange({ ...props, email: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="contact_phone">Phone</Label>
        <Input
          id="contact_phone"
          defaultValue={(props.phone as string) ?? ''}
          onChange={(e) => onChange({ ...props, phone: e.target.value })}
        />
      </div>
    </div>
  )
}

export function VideoForm({ props, onChange }: BlockFormProps) {
  return (
    <div>
      <Label htmlFor="video_url">Embed URL</Label>
      <Input
        id="video_url"
        defaultValue={(props.url as string) ?? ''}
        onChange={(e) => onChange({ ...props, url: e.target.value })}
        placeholder="https://www.youtube.com/embed/…"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Use the iframe-embed URL (YouTube → Share → Embed; Vimeo → /video/).
      </p>
    </div>
  )
}

export function GenericForm({ props, onChange }: BlockFormProps) {
  return (
    <div>
      <Label htmlFor="raw_props">Raw JSON props</Label>
      <textarea
        id="raw_props"
        defaultValue={JSON.stringify(props, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value))
          } catch {
            /* keep last valid props */
          }
        }}
        rows={8}
        className="flex w-full rounded-[var(--radius-sm)] border border-border bg-background px-3 py-2 font-mono text-xs"
      />
    </div>
  )
}
