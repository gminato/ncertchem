import { describe, expect, it } from 'vitest'
import {
  ICE_SOLVER_PRESETS,
  changeText,
  reactionCe,
  solveIceProblem,
  texNumber,
  xEquationTex,
} from './ice-solver'
import { R_J_PER_MOL_K } from './pv-work'

const nocl = ICE_SOLVER_PRESETS[0]

describe('ICE solver presets', () => {
  it('has six presets with distinct ids, two of them pressure-based', () => {
    expect(ICE_SOLVER_PRESETS).toHaveLength(6)
    expect(new Set(ICE_SOLVER_PRESETS.map((p) => p.id)).size).toBe(6)
    expect(ICE_SOLVER_PRESETS.filter((p) => p.basis === 'pressure')).toHaveLength(2)
  })

  it('solves every preset to a reaction quotient equal to K, with no negative amount', () => {
    for (const preset of ICE_SOLVER_PRESETS) {
      const p = solveIceProblem({ ...preset, temperatureK: preset.temperatureK })
      expect(Math.abs(p.qEquilibrium - preset.k) / preset.k, preset.id).toBeLessThan(1e-6)
      for (const v of Object.values(p.ice.equilibrium)) expect(v, preset.id).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('solveIceProblem', () => {
  it('solves 2NO + Cl2 ⇌ 2NOCl with K = 2.0 to x = 0.5, leaving NO 1.0, Cl2 0.5 and NOCl 1.0', () => {
    const p = solveIceProblem({ reaction: nocl.reaction, initial: nocl.initial, k: nocl.k, basis: 'concentration', temperatureK: 298 })
    expect(p.ice.extent).toBeCloseTo(0.5, 6)
    expect(p.ice.equilibrium.NO).toBeCloseTo(1, 6)
    expect(p.ice.equilibrium.Cl2).toBeCloseTo(0.5, 6)
    expect(p.ice.equilibrium.NOCl).toBeCloseTo(1, 6)
    expect(p.qStart).toBeCloseTo(0, 12)
    expect(p.direction).toBe('forward')
    expect(p.verdict).toBe('appreciable-both')
  })

  it('gives ΔG° = −RT ln K at the chosen temperature', () => {
    const p = solveIceProblem({ reaction: nocl.reaction, initial: nocl.initial, k: 10, basis: 'concentration', temperatureK: 300 })
    expect(p.deltaG0KJ).toBeCloseTo((-R_J_PER_MOL_K * 300 * Math.log(10)) / 1000, 9)
  })

  it('reports forward when no product is present, and reverse when products start in excess', () => {
    const hi = ICE_SOLVER_PRESETS.find((x) => x.id === 'hi')!
    const p = solveIceProblem({ ...hi, temperatureK: 298 })
    expect(p.qStart).toBe(0)
    expect(p.direction).toBe('forward')
    const reverseStart = solveIceProblem({
      reaction: nocl.reaction,
      initial: { NO: 0.5, Cl2: 0.5, NOCl: 3 },
      k: 2,
      basis: 'concentration',
      temperatureK: 298,
    })
    expect(reverseStart.direction).toBe('reverse')
    expect(reverseStart.qStart).toBeCloseTo(72, 9)
  })

  it('throws a RangeError when Q is undefined (no reactant and no product present)', () => {
    expect(() =>
      solveIceProblem({ reaction: nocl.reaction, initial: { NO: 0, Cl2: 0, NOCl: 0 }, k: 2, basis: 'concentration', temperatureK: 298 })
    ).toThrow(RangeError)
  })
})

describe('text helpers', () => {
  it('writes the mhchem equation with the ⇌ arrow as <=>', () => {
    expect(reactionCe(nocl.reaction)).toBe('2NO(g) + Cl2(g) <=> 2NOCl(g)')
  })

  it('formats numbers for TeX with three significant figures or a power of ten', () => {
    expect(texNumber(2)).toBe('2.00')
    expect(texNumber(0.5)).toBe('0.500')
    expect(texNumber(0.00125)).toBe('1.25 \\times 10^{-3}')
    expect(texNumber(0)).toBe('0')
  })

  it('writes the change row with a true minus sign and a coefficient', () => {
    expect(changeText({ species: 'NO', coefficient: 2, phase: 'g' }, true)).toBe('−2x')
    expect(changeText({ species: 'Cl2', coefficient: 1, phase: 'g' }, true)).toBe('−x')
    expect(changeText({ species: 'NOCl', coefficient: 2, phase: 'g' }, false)).toBe('+2x')
  })

  it('builds the x-equation with the starting amounts substituted', () => {
    const tex = xEquationTex(nocl.reaction, nocl.initial, nocl.k, 'concentration')
    expect(tex).toContain('K_{c} = \\dfrac{\\left(2x\\right)^{2}}{')
    expect(tex).toContain('\\left(2.00 - 2x\\right)^{2}')
    expect(tex).toContain('\\left(1.00 - x\\right)')
    expect(tex.endsWith('= 2.00')).toBe(true)
  })
})
