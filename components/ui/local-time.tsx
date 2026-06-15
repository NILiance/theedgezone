'use client'

import { useEffect, useState } from 'react'

/**
 * Renders a timestamp in the viewer's local timezone. SSR shows the ISO
 * fallback so layout stays stable; client effect swaps in the localized
 * string after hydration. Use anywhere we surface created_at / updated_at.
 */
interface Props {
  value: string | number | Date
  mode?: 'date' | 'time' | 'datetime' | 'relative'
}

export function LocalTime({ value, mode = 'datetime' }: Props) {
  const [text, setText] = useState<string>(() => isoFallback(value))

  useEffect(() => {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return
    switch (mode) {
      case 'date':
        setText(d.toLocaleDateString())
        break
      case 'time':
        setText(d.toLocaleTimeString())
        break
      case 'relative':
        setText(relativeTime(d))
        break
      default:
        setText(d.toLocaleString())
    }
  }, [value, mode])

  return <span suppressHydrationWarning>{text}</span>
}

function isoFallback(value: string | number | Date): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 16).replace('T', ' ')
  } catch {
    return ''
  }
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const min = Math.round(diffMs / 60_000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  return d.toLocaleDateString()
}
