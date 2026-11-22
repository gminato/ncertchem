import { describe, expect, it } from 'vitest'
import { ENERGY_PROFILE, MECHANISM_STEPS, VESSEL, mechanismFrame, mechanismStepIndex, smooth } from './mechanism-steps'

const GRID = Array.from({ length: 41 }, (_, i) => i / 40)

describe('molecularity Scrolly steps', () => {
  it('has the five Steps of the Section, in order, with unique ids', () => {
    expect(MECHANISM_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
    expect(new Set(MECHANISM_STEPS.map((s) => s.id)).size).toBe(5)
    expect(MECHANISM_STEPS.map((s) => s.id)).toEqual([
      'unimolecular',
      'bimolecular',
      'termolecular',
      'slow-step',
      'fast-step',
    ])
  })

  it('clamps out-of-range Step indices', () => {
    expect(mechanismStepIndex(-3)).toBe(0)
    expect(mechanismStepIndex(99)).toBe(4)
    expect(mechanismStepIndex(2.7)).toBe(2)
  })

  it('keeps every particle inside the vessel at every phase', () => {
    for (const spec of MECHANISM_STEPS) {
      for (const q of GRID) {
        const frame = mechanismFrame(spec.index, q)
        for (const d of frame.dots) {
          expect(Number.isFinite(d.x) && Number.isFinite(d.y)).toBe(true)
          expect(d.opacity).toBeGreaterThanOrEqual(0)
          expect(d.opacity).toBeLessThanOrEqual(1)
          expect(d.x - d.r).toBeGreaterThanOrEqual(0)
          expect(d.x + d.r).toBeLessThanOrEqual(VESSEL.width)
          expect(d.y - d.r).toBeGreaterThanOrEqual(0)
          expect(d.y + d.r).toBeLessThanOrEqual(VESSEL.height)
        }
      }
    }
  })

  it('shows reactants fully and products not at all at the start of every loop', () => {
    for (const spec of MECHANISM_STEPS) {
      const frame = mechanismFrame(spec.index, 0)
      const reactants = frame.dots.filter((d) => d.tone === 'reactant')
      const products = frame.dots.filter((d) => d.tone === 'product')
      expect(reactants.some((r) => r.opacity === 1)).toBe(true)
      for (const p of products) expect(p.opacity).toBe(0)
    }
  })

  it('places the two colliding HI molecules in contact (centres 2r apart) at the bimolecular collision', () => {
    const frame = mechanismFrame(1, 0.55)
    const [a, b] = frame.dots.filter((d) => d.id.startsWith('hi-'))
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(a.r + b.r, 6)
    expect(frame.bursts[0].opacity).toBeGreaterThan(0.9)
  })

  it('keeps the rest phase of each Step inside [0, 1)', () => {
    for (const spec of MECHANISM_STEPS) {
      expect(spec.restPhase).toBeGreaterThanOrEqual(0)
      expect(spec.restPhase).toBeLessThan(1)
    }
  })

  it('draws each reduced-motion rest frame with its outcome shown and no ghosted or live bursts', () => {
    for (const spec of MECHANISM_STEPS) {
      const frame = mechanismFrame(spec.index, spec.restPhase)
      for (const d of frame.dots) expect(d.opacity === 0 || d.opacity === 1).toBe(true)
      for (const b of frame.bursts) expect(b.opacity).toBe(0)
      const outcomes = frame.dots.filter((d) => d.opacity === 1 && (d.tone === 'product' || d.id.startsWith('io')))
      expect(outcomes.length).toBeGreaterThan(0)
    }
  })

  it('draws the slow step 1 barrier taller than step 2, so step 1 is rate-determining', () => {
    const [, tsSlow, , tsFast] = ENERGY_PROFILE
    expect(tsSlow).toBeGreaterThan(tsFast)
    expect(ENERGY_PROFILE[0]).toBeGreaterThan(ENERGY_PROFILE[4])
  })

  it('smoothstep is 0 below a, 1 above b, and monotone between', () => {
    expect(smooth(0.2, 0.4, 0.1)).toBe(0)
    expect(smooth(0.2, 0.4, 0.5)).toBe(1)
    expect(smooth(0.2, 0.4, 0.3)).toBeCloseTo(0.5, 9)
  })
})
