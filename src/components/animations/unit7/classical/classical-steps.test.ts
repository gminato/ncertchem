import { describe, expect, it } from 'vitest'
import { analyseRedox } from '@/lib/chem/redox-analysis'
import {
  CLASSICAL_STEPS,
  CLASSICAL_STEP_COUNT,
  classicalStep,
  equationMhchem,
} from './classical-steps'

describe('classical-steps', () => {
  it('contains exactly 5 steps: four broadenings and the summary', () => {
    expect(CLASSICAL_STEP_COUNT).toBe(5)
    expect(CLASSICAL_STEPS).toHaveLength(5)
  })

  it('bounds steps within [0, 4] for negative or out-of-range inputs', () => {
    expect(classicalStep(-1).index).toBe(0)
    expect(classicalStep(10).index).toBe(4)
    expect(classicalStep(2.4).index).toBe(2)
  })

  it('gives every worked reaction exactly one oxidised and one reduced species, with a label each', () => {
    for (const step of CLASSICAL_STEPS.slice(0, 4)) {
      const roles = step.equation.filter((t) => t.role)
      expect(roles.map((t) => t.role).sort()).toEqual(['ox', 'red'])
      for (const t of roles) expect(t.label).toBeTruthy()
    }
  })

  it('writes the H2S step as H2S + Cl2 -> 2HCl + S (not the unbalanced 2H2S form)', () => {
    expect(equationMhchem(classicalStep(1).equation)).toBe('H2S(g) + Cl2(g) -> 2HCl(g) + S(s)')
  })

  it('agrees with the lib on which species are oxidised and reduced in each worked reaction', () => {
    const expectedOx = ['C', 'H2S', 'Ca', 'KI']
    const expectedRed = ['CuO', 'Cl2', 'Cl2', 'Cl2']
    for (let i = 0; i < 4; i++) {
      const eq = equationMhchem(CLASSICAL_STEPS[i].equation)
      const result = analyseRedox(eq.replace(/\\ce\{|\}/g, ''))
      expect(result.isRedox, eq).toBe(true)
      expect(result.oxidisedElements.length).toBeGreaterThan(0)
      const ox = CLASSICAL_STEPS[i].equation.find((t) => t.role === 'ox')!.mhchem
      const red = CLASSICAL_STEPS[i].equation.find((t) => t.role === 'red')!.mhchem
      expect(ox.replace(/^\d+/, '')).toContain(expectedOx[i])
      expect(red.replace(/^\d+/, '')).toContain(expectedRed[i])
    }
  })

  it('has a 4-row matrix in the final summary step', () => {
    const summary = classicalStep(4)
    expect(summary.matrixRows).toHaveLength(4)
    expect(summary.matrixRows?.[0].criterion).toContain('Oxygen')
    expect(summary.matrixRows?.[1].criterion).toContain('Hydrogen')
  })
})
