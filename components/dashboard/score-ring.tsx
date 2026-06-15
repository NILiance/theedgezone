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
 * Color shifts based on score band. Text scales with `size` so the
 * number + label always fit inside the ring.
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
  const color =
    animated >= 80 ? '#22c55e' : animated >= 60 ? '#3aa7ff' : animated >= 40 ? '#fb923c' : '#ef4444'

  // Text scales with ring size so the number + label fit cleanly even at
  // 88px (dashboard heading badge) and 200px (calculator hero).
  const scoreFontSize = Math.round(size * 0.32)
  const labelFontSize = Math.max(7, Math.round(size * 0.06))
  const sublabelFontSize = Math.max(8, Math.round(size * 0.065))
  const showLabel = size >= 80
  const showSublabel = sublabel && size >= 140

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
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
      <div className="absolute flex flex-col items-center justify-center text-center leading-none">
        <span
          className="text-display font-black tabular-nums"
          style={{ color, fontSize: `${scoreFontSize}px`, lineHeight: 1 }}
        >
          {animated.toFixed(0)}
        </span>
        {showLabel && (
          <span
            className="text-eyebrow tracking-widest text-muted-foreground"
            style={{ fontSize: `${labelFontSize}px`, marginTop: Math.round(size * 0.04) }}
          >
            {label}
          </span>
        )}
        {showSublabel && (
          <span
            className="text-muted-foreground"
            style={{ fontSize: `${sublabelFontSize}px`, marginTop: 4 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
