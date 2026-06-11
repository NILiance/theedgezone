'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
  /** When false, render the literal text without counting (e.g. "24/7"). */
  animate?: boolean
  literal?: string
}

/**
 * Counts from 0 up to `end` when scrolled into view. Uses requestAnimationFrame
 * with an ease-out curve. Falls back to rendering `literal` if `animate=false`.
 */
export function CountUp({
  end,
  suffix = '',
  prefix = '',
  duration = 1600,
  decimals = 0,
  animate = true,
  literal,
}: CountUpProps) {
  const [value, setValue] = useState(0)
  const [hasRun, setHasRun] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!animate || hasRun) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setHasRun(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [animate, hasRun])

  useEffect(() => {
    if (!animate || !hasRun) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(end * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animate, hasRun, end, duration])

  if (!animate) {
    return <span ref={ref}>{literal ?? `${prefix}${end}${suffix}`}</span>
  }

  const formatted =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.floor(value).toLocaleString('en-US')

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
