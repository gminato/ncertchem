import { describe, expect, it } from 'vitest'
import { boltzmannStaggeredFraction, conformationName, ethaneTorsionalEnergy, newmanPositions, sawhorsePositions } from './conformations'

describe('ethaneTorsionalEnergy', () => {
  it('is 12.5 kJ/mol at the eclipsed 0° and 0 at the staggered 60°', () => {
    expect(ethaneTorsionalEnergy(0)).toBeCloseTo(12.5, 10)
    expect(ethaneTorsionalEnergy(60)).toBeCloseTo(0, 10)
  })
  it('has its maxima at the eclipsed angles and minima at the staggered ones', () => {
    expect(ethaneTorsionalEnergy(120)).toBeCloseTo(12.5, 10)
    expect(ethaneTorsionalEnergy(180)).toBeCloseTo(0, 10)
    expect(ethaneTorsionalEnergy(240)).toBeCloseTo(12.5, 10)
  })
  it('is periodic with period 120°', () => {
    for (const phi of [10, 37, 95]) {
      expect(ethaneTorsionalEnergy(phi + 120)).toBeCloseTo(ethaneTorsionalEnergy(phi), 10)
    }
  })
  it('is symmetric: E(φ) = E(−φ)', () => {
    expect(ethaneTorsionalEnergy(-30)).toBeCloseTo(ethaneTorsionalEnergy(30), 10)
  })
  it('rejects a non-finite angle', () => {
    expect(() => ethaneTorsionalEnergy(Number.NaN)).toThrow(RangeError)
  })
})

describe('conformationName', () => {
  it('names eclipsed, staggered and skew angles', () => {
    expect(conformationName(0)).toBe('eclipsed')
    expect(conformationName(120)).toBe('eclipsed')
    expect(conformationName(60)).toBe('staggered')
    expect(conformationName(180)).toBe('staggered')
    expect(conformationName(30)).toBe('skew')
  })
  it('handles negative angles', () => {
    expect(conformationName(-60)).toBe('staggered')
  })
})

describe('drawings', () => {
  it('Newman: at 0° front and back substituents coincide, at 60° they are 60° apart', () => {
    const eclipsed = newmanPositions(0)
    expect(eclipsed.front[0].x).toBeCloseTo(eclipsed.back[0].x, 10)
    const staggered = newmanPositions(60)
    expect(staggered.front[0].x).not.toBeCloseTo(staggered.back[0].x, 3)
    expect(staggered.front.length).toBe(3)
    expect(staggered.back.length).toBe(3)
  })
  it('Newman positions lie on the unit circle', () => {
    for (const p of [...newmanPositions(45).front, ...newmanPositions(45).back]) {
      expect(Math.hypot(p.x, p.y)).toBeCloseTo(1, 10)
    }
  })
  it('sawhorse: carbons sit on the bond axis with three substituents each', () => {
    const s = sawhorsePositions(60)
    expect(s.frontCarbon.x).toBe(0)
    expect(s.backCarbon.x).toBe(0)
    expect(s.front.length).toBe(3)
    expect(s.back.length).toBe(3)
  })
})

describe('boltzmannStaggeredFraction', () => {
  it('is 1/2 at very high temperature and approaches 1 at low temperature', () => {
    expect(boltzmannStaggeredFraction(1e9)).toBeCloseTo(0.5, 6)
    expect(boltzmannStaggeredFraction(50)).toBeGreaterThan(0.99)
  })
  it('is about 0.99 at 298 K for the 12.5 kJ/mol barrier', () => {
    const f = boltzmannStaggeredFraction(298)
    expect(f).toBeGreaterThan(0.99)
    expect(f).toBeLessThan(0.995)
  })
  it('falls as the temperature rises', () => {
    expect(boltzmannStaggeredFraction(500)).toBeLessThan(boltzmannStaggeredFraction(300))
  })
  it('rejects a non-positive temperature', () => {
    expect(() => boltzmannStaggeredFraction(0)).toThrow(RangeError)
    expect(() => boltzmannStaggeredFraction(-5)).toThrow(RangeError)
  })
})
