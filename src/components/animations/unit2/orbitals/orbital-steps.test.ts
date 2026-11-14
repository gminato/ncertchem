import { describe, expect, it } from 'vitest'
import {
  ORBITAL_STEP_COUNT,
  clampOrbitalStep,
  hydrogenLevelsEv,
  multiElectronOrder,
  radialCurvePoints,
  radialNodePm,
  radialPeak,
  stateForStep,
  subshellsOfShell,
} from './orbital-steps'

describe('stateForStep', () => {
  it('drills down the address one quantum number at a time, from n to m_s', () => {
    expect(stateForStep(0).address).toEqual({ n: 3, l: null, ml: null, ms: null })
    expect(stateForStep(1).address).toEqual({ n: 3, l: 1, ml: null, ms: null })
    expect(stateForStep(2).address).toEqual({ n: 3, l: 1, ml: 0, ms: null })
    expect(stateForStep(3).address).toEqual({ n: 3, l: 1, ml: 0, ms: 0.5 })
  })

  it('shows the radial probability at Step 4 and the energies at Step 5', () => {
    expect(stateForStep(4).view).toBe('radial')
    expect(stateForStep(5).view).toBe('energy')
    expect(ORBITAL_STEP_COUNT).toBe(6)
  })

  it('clamps out-of-range and non-finite steps', () => {
    expect(clampOrbitalStep(-3)).toBe(0)
    expect(clampOrbitalStep(99)).toBe(5)
    expect(clampOrbitalStep(Number.NaN)).toBe(0)
  })
})

describe('radial probability data', () => {
  it('puts the 1s peak at the Bohr radius, 52.9 pm', () => {
    const peak = radialPeak(1, 0)
    expect(peak.pm).toBeGreaterThan(51.5)
    expect(peak.pm).toBeLessThan(54.5)
    // r²R² for 1s is 4 r² e^(−2r), which peaks at 4e⁻² ≈ 0.541 a₀⁻¹ at r = 1 a₀.
    expect(peak.density).toBeCloseTo(4 * Math.exp(-2), 2)
  })

  it('finds the radial nodes: n − l − 1 of them for each orbital', () => {
    expect(radialNodePm(1, 0)).toHaveLength(0)
    expect(radialNodePm(2, 1)).toHaveLength(0)
    expect(radialNodePm(2, 0)).toHaveLength(1)
    expect(radialNodePm(3, 0)).toHaveLength(2)
    expect(radialNodePm(3, 1)).toHaveLength(1)
  })

  it('places the 2s node at r = 2 a₀ and the 3p node at r = 6 a₀', () => {
    const [twoS] = radialNodePm(2, 0)
    expect(twoS).toBeCloseTo(2 * 52.9, 0)
    const [threeP] = radialNodePm(3, 1)
    expect(threeP).toBeCloseTo(6 * 52.9, 0)
  })

  it('places the 3s nodes at the closed-form radii (9 ± 3√3)/2 a₀, i.e. 1.90 and 7.10 a₀', () => {
    // L₂⁽¹⁾(x) = x²/2 − 3x + 3 with x = 2r/3 vanishes at x = 3 ± √3, so r = (9 ± 3√3)/2.
    const [inner, outer] = radialNodePm(3, 0)
    expect(inner).toBeCloseTo(((9 - 3 * Math.sqrt(3)) / 2) * 52.9, 0)
    expect(outer).toBeCloseTo(((9 + 3 * Math.sqrt(3)) / 2) * 52.9, 0)
  })

  it('samples a curve from 0 to the requested distance', () => {
    const points = radialCurvePoints(2, 0, 1000, 100)
    expect(points[0].pm).toBe(0)
    expect(points[points.length - 1].pm).toBe(1000)
    expect(points[0].density).toBe(0)
  })
})

describe('energies and the Aufbau order', () => {
  it('gives the hydrogen levels in eV from the Bohr energies', () => {
    const levels = hydrogenLevelsEv()
    expect(levels[0].energyEv).toBeCloseTo(-13.6, 1)
    expect(levels[1].energyEv).toBeCloseTo(-3.4, 1)
    expect(levels[2].energyEv).toBeCloseTo(-1.51, 2)
  })

  it('lists the subshells of a shell in order of l', () => {
    expect(subshellsOfShell(3)).toEqual(['3s', '3p', '3d'])
  })

  it('orders multi-electron subshells by n + ℓ, then n: 4s before 3d, and 3d before 4p', () => {
    expect(multiElectronOrder()).toEqual(['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'])
  })
})
