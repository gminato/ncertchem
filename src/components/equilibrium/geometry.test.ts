import { describe, it, expect } from 'vitest'
import {
  clipCurve,
  concentrationAt,
  conversionMix,
  curvePath,
  formatSci,
  ionConcentrations,
  ionisedCount,
  kZone,
  logToPixel,
  mixHex,
  minSpacing,
  netDirection,
  particleLayout,
  phColorFromStops,
  phGradientStops,
  phStopPair,
  phTint,
  powerOfTen,
  qVersusKsp,
  rateState,
  ratesEqual,
  settleTime,
  superscript,
  surfaceCrossers,
  tiltAngle,
  trueMinus,
} from './geometry'

describe('log-scale mapping', () => {
  it('maps the ends of the exponent domain to the ends of the pixel range', () => {
    expect(logToPixel(1e-10, [-10, 10], [0, 400])).toBeCloseTo(0, 9)
    expect(logToPixel(1e10, [-10, 10], [0, 400])).toBeCloseTo(400, 9)
    expect(logToPixel(1, [-10, 10], [0, 400])).toBeCloseTo(200, 9)
  })

  it('adds equal distances for each factor of ten', () => {
    const a = logToPixel(1e-3, [-10, 10], [0, 400])
    const b = logToPixel(1e-2, [-10, 10], [0, 400])
    const c = logToPixel(1e-1, [-10, 10], [0, 400])
    expect(b - a).toBeCloseTo(c - b, 9)
    expect(b - a).toBeCloseTo(20, 9)
  })

  it('clamps values outside the domain', () => {
    expect(logToPixel(1e20, [-10, 10], [0, 100])).toBe(100)
    expect(logToPixel(1e-20, [-10, 10], [0, 100])).toBe(0)
  })
})

describe('K extent zones and Q direction', () => {
  it('reads K > 10^3 as products, K < 10^-3 as reactants, and anything between as both', () => {
    expect(kZone(1e4)).toBe('products')
    expect(kZone(1e-4)).toBe('reactants')
    expect(kZone(1)).toBe('both')
    expect(kZone(1e3)).toBe('both')
  })

  it('says which way the reaction goes from Q towards K', () => {
    expect(netDirection(1e-3, 50)).toBe('net forward')
    expect(netDirection(500, 50)).toBe('net reverse')
    expect(netDirection(50, 50)).toBe('at equilibrium')
    expect(netDirection(52, 50)).toBe('at equilibrium')
  })

  it('compares Q with Ksp for solubility', () => {
    expect(qVersusKsp(1e-12, 1e-10)).toBe('below')
    expect(qVersusKsp(1e-10, 1e-10)).toBe('equal')
    expect(qVersusKsp(1e-8, 1e-10)).toBe('above')
  })
})

describe('formatting', () => {
  it('uses a true minus sign and superscripts', () => {
    expect(superscript(-3)).toBe('⁻³')
    expect(powerOfTen(-10)).toBe('10⁻¹⁰')
    expect(trueMinus('-x')).toBe('−x')
  })

  it('formats scientific notation with ×10ⁿ', () => {
    expect(formatSci(0.0013)).toBe('1.3 × 10⁻³')
    expect(formatSci(4e4)).toBe('4.0 × 10⁴')
    expect(formatSci(0)).toBe('0')
    expect(formatSci(2)).toBe('2.0')
    expect(formatSci(50)).toBe('50')
    expect(formatSci(46.4)).toBe('46')
    expect(formatSci(-0.0013)).toBe('−1.3 × 10⁻³')
    expect(formatSci(-2)).toBe('−2.0')
  })

  it('carries a rounded mantissa of 10.0 into the exponent', () => {
    expect(formatSci(9.99e3, 1)).toBe('1.0 × 10⁴')
  })
})

describe('curves', () => {
  const pts: Array<[number, number]> = [
    [0, 0],
    [10, 10],
    [20, 10],
  ]

  it('clips a curve at a time and ends it exactly there', () => {
    const clipped = clipCurve(pts, 5)
    expect(clipped[clipped.length - 1]).toEqual([5, 5])
    expect(clipCurve(pts, 100)).toEqual(pts)
  })

  it('builds an SVG path through mapped points', () => {
    const d = curvePath(pts, (t) => t, (c) => 100 - c)
    expect(d).toBe('M0,100 L10,90 L20,90')
    expect(curvePath([[0, 1]], (t) => t, (c) => c)).toBe('')
  })

  it('interpolates concentration between samples and clamps at the ends', () => {
    expect(concentrationAt(pts, 5)).toBeCloseTo(5, 9)
    expect(concentrationAt(pts, -3)).toBe(0)
    expect(concentrationAt(pts, 99)).toBe(10)
  })

  it('finds the time at which a curve settles within a tolerance', () => {
    expect(settleTime(pts, 0.5)).toBe(10)
  })
})

describe('rates', () => {
  const cfg = { forwardStart: 1, reverseStart: 0, equilibrium: 0.6 }

  it('starts with only the forward rate and ends with equal rates', () => {
    const start = rateState(0, cfg)
    expect(start.forward).toBeCloseTo(1, 9)
    expect(start.reverse).toBeCloseTo(0, 9)
    const end = rateState(1, cfg)
    expect(ratesEqual(end.forward, end.reverse)).toBe(true)
    expect(end.forward).toBeCloseTo(0.6, 9)
  })

  it('does not report equal rates before equilibrium', () => {
    const mid = rateState(0.5, cfg)
    expect(ratesEqual(mid.forward, mid.reverse)).toBe(false)
  })
})

describe('Le Chatelier tilt', () => {
  it('is level with no stress and tips towards the loaded pan', () => {
    expect(tiltAngle(0, 0)).toBe(0)
    expect(tiltAngle(-1, 0)).toBeLessThan(0)
    expect(tiltAngle(1, 0)).toBeGreaterThan(0)
  })

  it('re-levels partly as progress runs to 1 but keeps its sign', () => {
    const full = tiltAngle(1, 0, 9, 0.6)
    const settled = tiltAngle(1, 1, 9, 0.6)
    expect(full).toBeCloseTo(9, 9)
    expect(settled).toBeCloseTo(9 * 0.4, 9)
    expect(settled).toBeGreaterThan(0)
  })
})

describe('universal-indicator gradient', () => {
  it('finds the neighbouring stops and the blend weight', () => {
    expect(phStopPair(0)).toEqual({ lo: 0, hi: 2, t: 0 })
    const mid = phStopPair(7)
    expect(mid.lo).toBe(6)
    expect(mid.hi).toBe(8)
    expect(mid.t).toBeCloseTo(0.5, 9)
    expect(phStopPair(14).lo).toBe(12)
    expect(phStopPair(14).t).toBeCloseTo(1, 9)
  })

  it('clamps pH outside 0 to 14', () => {
    expect(phStopPair(-2).lo).toBe(0)
    expect(phStopPair(20).hi).toBe(14)
  })

  it('places the gradient stops evenly by pH', () => {
    const stops = phGradientStops()
    expect(stops).toHaveLength(8)
    expect(stops[0]).toEqual({ offset: 0, token: 'var(--ph-0)' })
    expect(stops[7].offset).toBeCloseTo(1, 9)
  })

  it('returns a CSS tint that follows the theme and is a pure stop at even pH', () => {
    expect(phTint(4)).toBe('var(--ph-4)')
    expect(phTint(7)).toContain('color-mix')
  })

  it('interpolates hex colours linearly', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(mixHex('#102030', '#102030', 0.7)).toBe('#102030')
    expect(mixHex('#000', '#fff', 1)).toBe('#ffffff')
  })

  it('blends stops for an in-between pH', () => {
    const stops = ['#000000', '#ffffff', '#000000']
    expect(phColorFromStops(0, stops)).toBe('#000000')
    expect(phColorFromStops(7, stops)).toBe('#ffffff')
    expect(phColorFromStops(3.5, stops)).toBe('#808080')
  })

  it('gives [H⁺] and [OH⁻] that multiply to Kw', () => {
    const { hPlus, oh } = ionConcentrations(4)
    expect(hPlus).toBeCloseTo(1e-4, 15)
    expect(hPlus * oh).toBeCloseTo(1e-14, 20)
  })
})

describe('ionisation', () => {
  it('converts the expected number of molecules', () => {
    expect(ionisedCount(0.013, 60)).toBe(1)
    expect(ionisedCount(1, 60)).toBe(60)
    expect(ionisedCount(2, 60)).toBe(60)
  })

  it('converts the first molecules first and blends the boundary one', () => {
    expect(conversionMix(0, 0.5, 4)).toBeCloseTo(1, 9)
    expect(conversionMix(1, 0.5, 4)).toBeCloseTo(1, 9)
    expect(conversionMix(2, 0.5, 4)).toBeCloseTo(0, 9)
    expect(conversionMix(0, 0.1, 4)).toBeCloseTo(0.4, 9)
  })
})

describe('particle layout', () => {
  const box = { x0: 0, y0: 0, x1: 200, y1: 120 }

  it('keeps particles apart by the requested spacing', () => {
    const pts = particleLayout(18, box, 7, 14)
    expect(pts).toHaveLength(18)
    expect(minSpacing(pts)).toBeGreaterThanOrEqual(14)
    pts.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(200)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(120)
    })
  })

  it('is deterministic for a given seed', () => {
    expect(particleLayout(10, box, 3, 12)).toEqual(particleLayout(10, box, 3, 12))
    expect(particleLayout(10, box, 3, 12)).not.toEqual(particleLayout(10, box, 4, 12))
  })

  it('keeps surface crossers close to the boundary', () => {
    const pts = surfaceCrossers(4, box, 60, 5, 10)
    pts.forEach((p) => {
      expect(Math.abs(p.y - 60)).toBeLessThanOrEqual(6)
    })
  })
})
