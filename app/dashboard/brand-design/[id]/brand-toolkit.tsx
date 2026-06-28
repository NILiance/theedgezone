'use client'

import { useActionState, useMemo, useState } from 'react'
import { generateToolkitAction, type ToolkitGenState } from './toolkit-actions'
import { TOOLKIT_SECTIONS, TOOLKIT_SECTION_MAP } from '@/lib/brand-toolkit-prompts'

export interface ToolkitEntry {
  section_id: string
  content_md: string
  updated_at: string
}

/**
 * Personal Brand Toolkit — 10 cards. Click any to generate (or re-open)
 * its personalized coaching content. Matches the legacy WP layout.
 */
export function BrandToolkit({
  brandId,
  entries,
}: {
  brandId: string
  entries: ToolkitEntry[]
}) {
  const entriesById = useMemo(() => {
    const m = new Map<string, ToolkitEntry>()
    for (const e of entries) m.set(e.section_id, e)
    return m
  }, [entries])

  const [openSection, setOpenSection] = useState<string | null>(null)

  const handleOpen = (sectionId: string) => {
    setOpenSection((cur) => (cur === sectionId ? null : sectionId))
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-eyebrow text-primary">Personal Brand Toolkit</p>
          <p className="mt-1 text-sm text-muted-foreground">
            10 sections of personalized coaching — built from your sport, school, and goals.
            Click any card to generate or open the saved content.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLKIT_SECTIONS.map((s) => {
          const has = entriesById.has(s.id)
          const isOpen = openSection === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleOpen(s.id)}
              className={`flex flex-col gap-1 rounded-[var(--radius)] border bg-panel/40 p-4 text-left transition-colors hover:bg-panel/70 ${
                isOpen ? 'border-primary ring-2 ring-primary/40' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base"
                  style={{ background: `${s.color}22`, color: s.color }}
                  aria-hidden
                >
                  {s.icon}
                </span>
                <p className="text-display text-sm font-bold" style={{ color: s.color }}>
                  {s.label}
                </p>
                {has && (
                  <span className="text-display ml-auto rounded-full bg-success/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-success">
                    ✓ Saved
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{s.desc}</p>
              <p
                className="text-display mt-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: s.color, opacity: 0.7 }}
              >
                {has ? 'Open →' : 'Create →'}
              </p>
            </button>
          )
        })}
      </div>

      {openSection && (
        <ToolkitPanel
          brandId={brandId}
          sectionId={openSection}
          initialContent={entriesById.get(openSection)?.content_md ?? null}
          onClose={() => setOpenSection(null)}
        />
      )}
    </section>
  )
}

function ToolkitPanel({
  brandId,
  sectionId,
  initialContent,
  onClose,
}: {
  brandId: string
  sectionId: string
  initialContent: string | null
  onClose: () => void
}) {
  const section = TOOLKIT_SECTION_MAP[sectionId]
  const [state, action, pending] = useActionState<ToolkitGenState, FormData>(
    generateToolkitAction,
    {}
  )
  // Prefer the freshest content: the action result wins over the initial.
  const content = state.content ?? initialContent
  const fired = state.ok || pending
  const showError = !!state.error

  // If we already have cached content and the user just opened, trigger
  // a non-regenerate action to fetch the cached row consistently.
  // Otherwise the talent clicks Generate to populate.

  return (
    <div className="mt-4 rounded-[var(--radius)] border border-primary/40 bg-panel/30 p-1">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
        <p className="text-display text-sm font-bold" style={{ color: section?.color }}>
          <span className="mr-2" aria-hidden>
            {section?.icon}
          </span>
          {section?.label}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-display rounded-full bg-panel-elevated px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest hover:bg-panel"
        >
          ✕ Close
        </button>
      </div>

      <div className="rounded-[var(--radius-sm)] bg-background/40 p-4">
        {!content && !pending && !showError && (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Generate personalized coaching for{' '}
              <strong className="text-foreground">{section?.label}</strong>. We pull from your
              brand profile (sport, school, goals, handles) — it&rsquo;ll take ~15 seconds.
            </p>
            <form action={action}>
              <input type="hidden" name="brand_id" value={brandId} />
              <input type="hidden" name="section_id" value={sectionId} />
              <button
                type="submit"
                disabled={pending}
                className="text-display rounded-[var(--radius-sm)] bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
              >
                Generate {section?.label}
              </button>
            </form>
          </div>
        )}

        {pending && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Generating your{' '}
            <strong className="text-foreground">{section?.label}</strong>… this takes ~15 seconds,
            stay on the page.
          </p>
        )}

        {showError && (
          <div className="rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {state.error}
            <form action={action} className="mt-2">
              <input type="hidden" name="brand_id" value={brandId} />
              <input type="hidden" name="section_id" value={sectionId} />
              <button
                type="submit"
                className="text-display rounded-[var(--radius-sm)] bg-destructive px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-destructive-foreground"
              >
                Try again
              </button>
            </form>
          </div>
        )}

        {content && !pending && (
          <>
            {state.ok && (
              <div className="mb-3 rounded-[var(--radius-sm)] border border-success/40 bg-success/10 px-3 py-2 text-xs font-bold text-success">
                ✓ Your “{section?.label}” is ready — see it below.
              </div>
            )}
            <MarkdownView md={content} />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3">
              <form action={action}>
                <input type="hidden" name="brand_id" value={brandId} />
                <input type="hidden" name="section_id" value={sectionId} />
                <input type="hidden" name="regenerate" value="1" />
                <button
                  type="submit"
                  disabled={pending}
                  className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  ↻ Regenerate
                </button>
              </form>
              <CopyButton text={content} />
              <span className="ml-auto text-[10px] text-muted-foreground">
                Saved to your toolkit — close and reopen any time.
              </span>
            </div>
          </>
        )}
        {!fired && !content && (
          <></>
        )}
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* noop */
    }
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="text-display rounded-[var(--radius-sm)] border border-border bg-background px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
    >
      {copied ? '✓ Copied' : '📋 Copy markdown'}
    </button>
  )
}

/**
 * Lightweight markdown renderer — handles H2/H3/H4, paragraphs, bullets,
 * numbered lists, and fenced code blocks. Avoids pulling in a full md
 * dependency since Claude's output uses a constrained subset.
 */
function MarkdownView({ md }: { md: string }) {
  const blocks = useMemo(() => parseMarkdown(md), [md])
  return (
    <div className="prose-toolkit space-y-3 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'h1':
            return (
              <h2 key={i} className="text-display text-2xl font-black">
                {inlineFmt(block.text)}
              </h2>
            )
          case 'h2':
            return (
              <h3
                key={i}
                className="text-display mt-6 text-xl font-black tracking-tight text-primary"
              >
                {inlineFmt(block.text)}
              </h3>
            )
          case 'h3':
            return (
              <h4 key={i} className="text-display mt-4 text-base font-bold">
                {inlineFmt(block.text)}
              </h4>
            )
          case 'h4':
            return (
              <h5
                key={i}
                className="text-display text-eyebrow mt-3 text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >
                {inlineFmt(block.text)}
              </h5>
            )
          case 'ul':
            return (
              <ul key={i} className="ml-5 list-disc space-y-1">
                {block.items.map((it, j) => (
                  <li key={j}>{inlineFmt(it)}</li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="ml-5 list-decimal space-y-1">
                {block.items.map((it, j) => (
                  <li key={j}>{inlineFmt(it)}</li>
                ))}
              </ol>
            )
          case 'code':
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-panel/50 p-3 text-xs"
              >
                <code>{block.text}</code>
              </pre>
            )
          case 'quote':
            return (
              <blockquote
                key={i}
                className="border-l-2 border-accent/50 bg-accent/5 p-3 text-sm italic"
              >
                {inlineFmt(block.text)}
              </blockquote>
            )
          case 'hr':
            return <hr key={i} className="border-border" />
          case 'p':
          default:
            return <p key={i}>{inlineFmt(block.text)}</p>
        }
      })}
    </div>
  )
}

type Block =
  | { kind: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'quote'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'code'; text: string }
  | { kind: 'hr' }

function parseMarkdown(md: string): Block[] {
  const lines = md.split('\n')
  const out: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]!
    // Fenced code
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i]!.trim().startsWith('```')) {
        codeLines.push(lines[i]!)
        i++
      }
      i++
      out.push({ kind: 'code', text: codeLines.join('\n') })
      continue
    }
    // HR
    if (line.match(/^-{3,}|_{3,}$/)) {
      out.push({ kind: 'hr' })
      i++
      continue
    }
    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1]!.length as 1 | 2 | 3 | 4
      const text = h[2]!.replace(/\*\*/g, '')
      out.push({
        kind: (level === 1 ? 'h1' : level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4'),
        text,
      })
      i++
      continue
    }
    // Blockquote
    if (line.match(/^>\s?/)) {
      out.push({ kind: 'quote', text: line.replace(/^>\s?/, '') })
      i++
      continue
    }
    // Bullet list
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i]!.match(/^[-*]\s+/)) {
        items.push(lines[i]!.replace(/^[-*]\s+/, ''))
        i++
      }
      out.push({ kind: 'ul', items })
      continue
    }
    // Ordered list
    if (line.match(/^\d+[.)]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i]!.match(/^\d+[.)]\s+/)) {
        items.push(lines[i]!.replace(/^\d+[.)]\s+/, ''))
        i++
      }
      out.push({ kind: 'ol', items })
      continue
    }
    // Paragraph or blank
    if (line.trim()) {
      out.push({ kind: 'p', text: line })
    }
    i++
  }
  return out
}

/** Inline formatting: **bold**, *italic*, `code`, and [link](url). */
function inlineFmt(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = []
  let buf = ''
  let i = 0
  const flush = () => {
    if (buf) {
      tokens.push(buf)
      buf = ''
    }
  }
  while (i < text.length) {
    if (text.startsWith('**', i)) {
      const end = text.indexOf('**', i + 2)
      if (end > -1) {
        flush()
        tokens.push(
          <strong key={tokens.length} className="font-bold text-foreground">
            {text.slice(i + 2, end)}
          </strong>
        )
        i = end + 2
        continue
      }
    }
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1)
      if (end > -1) {
        flush()
        tokens.push(
          <code
            key={tokens.length}
            className="rounded bg-panel-elevated px-1 py-0.5 font-mono text-xs"
          >
            {text.slice(i + 1, end)}
          </code>
        )
        i = end + 1
        continue
      }
    }
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1)
      if (end > -1) {
        flush()
        tokens.push(
          <em key={tokens.length} className="italic">
            {text.slice(i + 1, end)}
          </em>
        )
        i = end + 1
        continue
      }
    }
    buf += text[i]
    i++
  }
  flush()
  return tokens
}
