import { describe, expect, it } from 'vitest'
import { sameSpeciesBalance } from './hess'
import {
  HESS_PUZZLES,
  equationToCe,
  routeEquation,
  routeMatchesTarget,
  runningTotalsKJ,
  solutionRoute,
  unmatchedSpecies,
  type RouteTerm,
} from './hess-puzzles'

describe('hess-builder puzzles (Section 5.4(e))', () => {
  it('has four puzzles of rising difficulty', () => {
    expect(HESS_PUZZLES.map((p) => p.difficulty)).toEqual([1, 2, 3, 4])
  })

  it.each(HESS_PUZZLES.map((p) => [p.id, p] as const))('%s: the solution route gives the target balance', (_id, puzzle) => {
    const { route } = solutionRoute(puzzle)
    const net = routeEquation(puzzle, route)
    expect(net).not.toBeNull()
    expect(sameSpeciesBalance(net!, puzzle.target)).toBe(true)
    expect(routeMatchesTarget(puzzle, route)).toBe(true)
  })

  it('oxidising CO: ΔH = −393.51 − (−110.53) = −282.98 ≈ −283.0 kJ mol⁻¹, with one reversal', () => {
    const { route, deltaHKJ } = solutionRoute(HESS_PUZZLES[0])
    expect(route).toEqual([
      { index: 0, factor: 1 },
      { index: 1, factor: -1 },
    ])
    expect(deltaHKJ).toBeCloseTo(-282.98, 6)
  })

  it('HBr: two moles of HBr give ΔH = 2 × (−36.40) = −72.8 kJ mol⁻¹ (NCERT prints −178.3)', () => {
    const { route, deltaHKJ } = solutionRoute(HESS_PUZZLES[1])
    expect(route).toEqual([{ index: 0, factor: 2 }])
    expect(deltaHKJ).toBeCloseTo(-72.8, 6)
  })

  it('Fe2O3 + 3CO: ΔH = 3(−393.51) − 3(−110.53) − (−824.2) = −24.74 kJ mol⁻¹, and the water equation is a distractor', () => {
    const puzzle = HESS_PUZZLES[2]
    const { route, deltaHKJ } = solutionRoute(puzzle)
    expect(route).toEqual([
      { index: 0, factor: 3 },
      { index: 1, factor: -3 },
      { index: 2, factor: -1 },
    ])
    expect(deltaHKJ).toBeCloseTo(-24.74, 2)
    expect(route.some((term) => term.index === 3)).toBe(false)
  })

  it('benzene formation from combustion data: ΔfH = +48.51 kJ mol⁻¹ (NCERT prints the sign wrong)', () => {
    const { route, deltaHKJ } = solutionRoute(HESS_PUZZLES[3])
    expect(route).toEqual([
      { index: 0, factor: -1 },
      { index: 1, factor: 6 },
      { index: 2, factor: 3 },
    ])
    expect(deltaHKJ).toBeCloseTo(48.51, 2)
    expect(deltaHKJ).toBeGreaterThan(0)
  })
})

describe('route state for the builder', () => {
  const benzene = HESS_PUZZLES[3]
  const partial: RouteTerm[] = [
    { index: 0, factor: -1 },
    { index: 1, factor: 6 },
  ]

  it('an empty route matches nothing and lists every species of the target as unmatched', () => {
    expect(routeMatchesTarget(benzene, [])).toBe(false)
    expect(unmatchedSpecies(benzene, [])).toEqual(['C(graphite)', 'C6H6(l)', 'H2(g)'])
  })

  it('a partial route reports the species it has not yet cancelled', () => {
    const left = unmatchedSpecies(benzene, partial)
    expect(left).toContain('H2O(l)')
    expect(left).toContain('O2(g)')
    expect(routeMatchesTarget(benzene, partial)).toBe(false)
  })

  it('running totals accumulate ΔH term by term', () => {
    const totals = runningTotalsKJ(benzene, solutionRoute(benzene).route)
    expect(totals[0]).toBeCloseTo(3267.0, 6)
    expect(totals[1]).toBeCloseTo(3267.0 - 2361.0, 6)
    expect(totals[totals.length - 1]).toBeCloseTo(48.51, 2)
  })

  it('a route with a wrong multiplier does not match the target', () => {
    const wrong: RouteTerm[] = [
      { index: 0, factor: -1 },
      { index: 1, factor: 3 },
      { index: 2, factor: 3 },
    ]
    expect(routeMatchesTarget(benzene, wrong)).toBe(false)
  })

  it('writes equations in mhchem notation, with fractions and C(s)', () => {
    expect(equationToCe(HESS_PUZZLES[3].target)).toBe('6 C(s) + 3 H2(g) -> C6H6(l)')
    expect(equationToCe(HESS_PUZZLES[0].target)).toBe('CO(g) + 1/2 O2(g) -> CO2(g)')
  })
})
