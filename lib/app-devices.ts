/**
 * Preview device frames — ported from the legacy ez-app-mgr.js DEVICES map.
 * Drives the device switcher (iPhone 15 Pro / Galaxy S24 / Pixel 8) in the
 * App Builder's live preview.
 */

export type DeviceId = 'iphone15' | 'galaxy' | 'pixel'
export type NotchStyle = 'dynamic-island' | 'punch-hole' | 'camera-bar'

export interface DeviceSpec {
  id: DeviceId
  label: string
  w: number
  h: number
  radius: number
  notch: NotchStyle
}

export const DEVICES: DeviceSpec[] = [
  { id: 'iphone15', label: 'iPhone 15 Pro', w: 280, h: 607, radius: 40, notch: 'dynamic-island' },
  { id: 'galaxy', label: 'Galaxy S24', w: 270, h: 585, radius: 32, notch: 'punch-hole' },
  { id: 'pixel', label: 'Pixel 8', w: 276, h: 612, radius: 36, notch: 'camera-bar' },
]

export const DEFAULT_DEVICE: DeviceId = 'iphone15'

export function deviceSpec(id: DeviceId): DeviceSpec {
  return DEVICES.find((d) => d.id === id) ?? DEVICES[0]!
}
