/**
 * CSS approximation of each generated Arsenal effect, in the brand colours —
 * shared by the live previews (trading card, placement editors) so the on-screen
 * preview visibly changes per effect. The real backdrop is generated server-side.
 */
export function effectCss(effect: string, accent: string, bg: string): string {
  switch (effect) {
    case 'color_burst':
      return `radial-gradient(circle at 50% 38%, ${accent} 0%, ${bg} 58%)`
    case 'explosion':
      return `radial-gradient(circle at 50% 42%, ${accent} 0%, ${accent} 6%, ${bg} 46%), conic-gradient(from 0deg at 50% 42%, ${accent}66, ${bg}00 20%, ${accent}66 40%, ${bg}00 60%, ${accent}66 80%, ${bg}00)`
    case 'gradient_glow':
      return `linear-gradient(135deg, ${accent} 0%, ${bg} 72%)`
    case 'particles':
      return `radial-gradient(${accent}cc 1.5px, transparent 1.6px) 0 0 / 15px 15px, ${bg}`
    case 'light_streaks':
      return `repeating-linear-gradient(115deg, ${bg} 0 13px, ${accent}55 13px 17px)`
    case 'smoke':
      return `radial-gradient(130% 90% at 28% 18%, ${accent}88, ${bg} 68%)`
    case 'geometric':
      return `conic-gradient(from 30deg at 50% 50%, ${accent}, ${bg}, ${accent}, ${bg}, ${accent})`
    default:
      return bg
  }
}
