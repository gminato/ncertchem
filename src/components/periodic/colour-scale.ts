/**
 * Pure colour mapping for heatmaps. Interpolation happens in OKLab, which is
 * close to perceptually uniform, so equal steps in the data look like equal
 * steps on screen.
 */

export type Rgb = readonly [number, number, number]

/** A scale maps a value to a CSS colour, or to null when the value is missing. */
export type ColourScale = (value: number | null) => string | null

/** Sentinel fill for the hatched "no data" cell. Pass it as a cell's `fill`. */
export const MISSING_FILL = 'missing'

/**
 * Viridis, five stops. Lightness rises monotonically from the deep purple to
 * the pale yellow, so the ramp reads the same in light and dark themes.
 */
export const SEQUENTIAL_VIRIDIS: readonly string[] = [
  '#440154',
  '#3B528B',
  '#21918C',
  '#5EC962',
  '#FDE725',
]

/**
 * Diverging ramp for signed values. Both sides run from the neutral midpoint
 * outwards. The neutral grey sits mid-luminance so it works on both themes.
 */
export const DIVERGING_NEUTRAL = '#9A968D'
export const DIVERGING_NEGATIVE: readonly string[] = [DIVERGING_NEUTRAL, '#4F9FB0', '#1B5E7A']
export const DIVERGING_POSITIVE: readonly string[] = [DIVERGING_NEUTRAL, '#E9A56B', '#B5461C']

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) throw new Error(`Expected a #rrggbb colour, got ${hex}`)
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]: Rgb): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return Math.min(255, Math.max(0, c * 255))
}

export type Oklab = readonly [number, number, number]

export function rgbToOklab(rgb: Rgb): Oklab {
  const [r, g, b] = rgb.map(srgbToLinear) as [number, number, number]
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToRgb([L, a, b]: Oklab): Rgb {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3)
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3)
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3)
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bl)]
}

/** Interpolates a list of hex stops at t in [0, 1], in OKLab. */
export function rampColour(stops: readonly string[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t))
  if (stops.length === 1) return stops[0]
  const scaled = clamped * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(scaled))
  const local = scaled - i
  const a = rgbToOklab(hexToRgb(stops[i]))
  const b = rgbToOklab(hexToRgb(stops[i + 1]))
  const mixed: Oklab = [
    a[0] + (b[0] - a[0]) * local,
    a[1] + (b[1] - a[1]) * local,
    a[2] + (b[2] - a[2]) * local,
  ]
  return rgbToHex(oklabToRgb(mixed))
}

/** Perceptual lightness (OKLab L) of a hex colour, from 0 to 1. */
export function lightnessOf(hex: string): number {
  return rgbToOklab(hexToRgb(hex))[0]
}

/**
 * A sequential scale over [min, max]. Values outside the domain are clamped.
 * A null value gives null, and the caller draws a hatched cell.
 */
export function sequentialScale(
  domain: readonly [number, number],
  stops: readonly string[] = SEQUENTIAL_VIRIDIS
): ColourScale {
  const [min, max] = domain
  return (value) => {
    if (value === null || Number.isNaN(value)) return null
    const span = max - min
    const t = span === 0 ? 0.5 : (value - min) / span
    return rampColour(stops, t)
  }
}

/**
 * A diverging scale. Values below the midpoint walk the negative ramp, values
 * above it walk the positive ramp, and the midpoint itself is the neutral.
 * Both ramps start at the neutral and move outwards.
 */
export function divergingScale(
  domain: readonly [number, number],
  midpoint: number,
  negative: readonly string[] = DIVERGING_NEGATIVE,
  positive: readonly string[] = DIVERGING_POSITIVE
): ColourScale {
  const [min, max] = domain
  return (value) => {
    if (value === null || Number.isNaN(value)) return null
    if (value === midpoint) return negative[0]
    if (value < midpoint) {
      const span = midpoint - min
      const t = span === 0 ? 0 : (midpoint - value) / span
      return rampColour(negative, t)
    }
    const span = max - midpoint
    const t = span === 0 ? 0 : (value - midpoint) / span
    return rampColour(positive, t)
  }
}

/**
 * The full low-to-high gradient for a diverging scale, for use in a legend.
 */
export function divergingRamp(
  negative: readonly string[] = DIVERGING_NEGATIVE,
  positive: readonly string[] = DIVERGING_POSITIVE
): string[] {
  return [...[...negative].reverse(), ...positive.slice(1)]
}

/**
 * Black or white text, whichever has the higher WCAG contrast against the fill.
 */
export function contrastText(fill: string): '#1F2023' | '#FFFFFF' {
  const [r, g, b] = hexToRgb(fill).map(srgbToLinear) as [number, number, number]
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const contrastWithWhite = 1.05 / (luminance + 0.05)
  const contrastWithInk = (luminance + 0.05) / (0.0205 + 0.05)
  return contrastWithInk >= contrastWithWhite ? '#1F2023' : '#FFFFFF'
}
