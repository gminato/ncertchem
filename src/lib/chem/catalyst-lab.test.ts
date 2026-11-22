import { describe, expect, it } from 'vitest'
import { GAS_CONSTANT_J } from './kinetics'
import {
  catalysedKnots,
  catalystLab,
  cosinePath,
  equilibriumUnchanged,
  uncatalysedKnots,
  type CatalystLabInput,
} from './catalyst-lab'

const DEFAULT: CatalystLabInput = { eaUncatKJ: 60, loweringKJ: 10, dHKJ: -20, tempK: 298 }

describe('catalystLab', () => {
  it('gives the Prose values: 60 and 50 kJ mol⁻¹, backward 80 and 70, enhancement 56.6', () => {
    const r = catalystLab(DEFAULT)
    expect(r.eaFwdCatKJ).toBeCloseTo(50, 9)
    expect(r.eaBackUncatKJ).toBeCloseTo(80, 9)
    expect(r.eaBackCatKJ).toBeCloseTo(70, 9)
    expect(r.enhancementForward).toBeCloseTo(56.6, 1)
  })

  it('makes the forward and backward enhancements equal (both are e^(ΔEₐ/RT))', () => {
    const r = catalystLab(DEFAULT)
    expect(r.enhancementBackward).toBeCloseTo(r.enhancementForward, 9)
    expect(r.enhancementForward).toBeCloseTo(Math.exp(10000 / (GAS_CONSTANT_J * 298)), 9)
  })

  it('leaves K unchanged: k_f/k_b is the same with and without the catalyst', () => {
    for (const input of [
      DEFAULT,
      { eaUncatKJ: 90, loweringKJ: 20, dHKJ: 30, tempK: 350 },
      { eaUncatKJ: 120, loweringKJ: 0, dHKJ: -40, tempK: 250 },
      { eaUncatKJ: 65, loweringKJ: 7, dHKJ: 0, tempK: 400 },
    ]) {
      const r = catalystLab(input)
      expect(equilibriumUnchanged(r)).toBe(true)
      expect(r.kEqCat / r.kEqUncat).toBeCloseTo(1, 9)
    }
  })

  it('matches K = e^(−ΔrH/RT) from thermodynamics for the default case', () => {
    const r = catalystLab(DEFAULT)
    expect(r.kEqUncat).toBeCloseTo(Math.exp(20000 / (GAS_CONSTANT_J * 298)), 6)
    expect(r.kEqUncat).toBeGreaterThan(1000)
  })

  it('a catalyst multiplies k_f and k_b by the same factor', () => {
    const r = catalystLab(DEFAULT)
    expect(r.kFwdCat / r.kFwdUncat).toBeCloseTo(r.enhancementForward, 6)
    expect(r.kBackCat / r.kBackUncat).toBeCloseTo(r.enhancementBackward, 6)
  })
})

describe('catalysed route shape (Scrolly proportions)', () => {
  it('default case: first hump 30, valley 15, second hump 50 kJ mol⁻¹', () => {
    const c = catalysedKnots(DEFAULT)
    expect(c.map(([, e]) => e)).toEqual([0, 30, 15, 50, -20])
    expect(c.map(([x]) => x)).toEqual([0, 0.25, 0.5, 0.75, 1])
  })

  it('keeps the valley above both end levels and the first hump below the second, across the sliders', () => {
    for (let eaUncatKJ = 60; eaUncatKJ <= 120; eaUncatKJ += 10) {
      for (let loweringKJ = 0; loweringKJ <= 20; loweringKJ += 2) {
        for (let dHKJ = -40; dHKJ <= 30; dHKJ += 5) {
          const c = catalysedKnots({ eaUncatKJ, loweringKJ, dHKJ, tempK: 298 })
          const [, first, valley, second] = c.map(([, e]) => e)
          expect(valley).toBeGreaterThan(Math.max(0, dHKJ))
          expect(first).toBeGreaterThan(valley)
          expect(second).toBeGreaterThan(first)
          expect(second).toBeCloseTo(eaUncatKJ - loweringKJ, 9)
        }
      }
    }
  })
})

describe('path knots and cosinePath', () => {
  it('the catalysed route starts and ends at the uncatalysed end levels', () => {
    const u = uncatalysedKnots(DEFAULT)
    const c = catalysedKnots(DEFAULT)
    expect(c[0]).toEqual(u[0])
    expect(c[c.length - 1]).toEqual(u[u.length - 1])
  })

  it('the uncatalysed peak is exactly Eₐ, and the catalysed higher hump is exactly Eₐ − lowering', () => {
    const uPath = cosinePath(uncatalysedKnots(DEFAULT))
    expect(Math.max(...uPath.map(([, e]) => e))).toBeCloseTo(60, 9)
    const cPath = cosinePath(catalysedKnots(DEFAULT))
    expect(Math.max(...cPath.map(([, e]) => e))).toBeCloseTo(50, 9)
  })

  it('the cosine path ends exactly on its last knot and stays between the knots it joins', () => {
    const path = cosinePath([
      [0, 0],
      [0.5, 40],
      [1, -10],
    ])
    expect(path[0]).toEqual([0, 0])
    expect(path[path.length - 1]).toEqual([1, -10])
    for (const [x, e] of path) {
      if (x <= 0.5) expect(e).toBeGreaterThanOrEqual(-1e-9)
      expect(e).toBeLessThanOrEqual(40 + 1e-9)
    }
  })
})
