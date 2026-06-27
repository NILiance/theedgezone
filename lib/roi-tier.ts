export interface RoiTier {
  label: string
  /** Hex color for the label, readable on the dark theme. */
  color: string
}

/**
 * Rates the ROI margin — (revenue − athlete cost) / revenue — into a tier.
 * Thresholds: ≥60% Exceptional, ≥40% Good, ≥20% Average, else Below Average.
 */
export function roiTier(roiMargin: number): RoiTier {
  const pct = roiMargin * 100
  if (pct >= 60) return { label: 'Exceptional', color: '#10b981' }
  if (pct >= 40) return { label: 'Good', color: '#84cc16' }
  if (pct >= 20) return { label: 'Average', color: '#f59e0b' }
  return { label: 'Below Average', color: '#ef4444' }
}

export const ROI_DISCLAIMER =
  'These numbers are estimates — your actual results could be higher or lower depending on many factors.'
