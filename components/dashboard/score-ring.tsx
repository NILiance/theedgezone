'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
  size?: number
  thickness?: number
  label?: string
  sublabel?: string
}

/**
 * Animated circular score ring. Sweeps from 0 → score on mount.
 * Color shifts from accent (low) → primary (high).
 */
export function ScoreRing({
  score,
  size = 200,
  thickness = 14,
  label = 'NILfluence',
  sublabel,
}: Props) {
  const [animated, setAnimated] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const duration = 1100
    let frame: number
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setAnimated(score * eased)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(100, animated)) / 100)
  const color = animated >= 80 ? '#22c55e' : animated >= 60 ? '#3aa7ff' : animated >= 40 ? '#fb923c' : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeOpacity={0.12}
          strokeWidth={thickness}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 80ms linear, stroke 320ms linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center text-center">
        <p className="text-display text-5xl font-black" style={{ color }}>
          {animated.toFixed(0)}
        </p>
        <p className="text-eyebrow mt-1 text-[10px] tracking-widest text-muted-foreground">
          {label}
        </p>
        {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
  )
}
