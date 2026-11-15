import { describe, expect, it } from 'vitest'
import {
  classifyTerm,
  countSpecies,
  electronCount,
  formatEquation,
  normalizeFormula,
  parseEquation,
  roleOf,
  rolesFromSkeleton,
  scaleEquation,
} from './balance-equation'

describe('balance-equation.ts', () => {
  it('normalizeFormula strips coefficient, state and charge but keeps subscripts', () => {
    expect(normalizeFormula('2CrO4^2-')).toBe('CrO4')
    expect(normalizeFormula('H+(aq)')).toBe('H')
    expect(normalizeFormula('H2O(l)')).toBe('H2O')
    expect(normalizeFormula('Cr(OH)3')).toBe('Cr(OH)3')
    expect(normalizeFormula('3e-')).toBe('e')
  })

  it('parseEquation splits a composite half-reaction string into labelled rows', () => {
    const rows = parseEquation('Oxidation: Cr(OH)3 -> CrO4^2- | Reduction: ClO- -> Cl-')
    expect(rows).toHaveLength(2)
    expect(rows[0].label).toBe('Oxidation')
    expect(rows[0].reactants[0].formula).toBe('Cr(OH)3')
    expect(rows[1].products[0].formula).toBe('Cl')
  })

  it('formatEquation round-trips a lib equation', () => {
    const eq = '2MnO4- + 5C2O4^2- + 16H+(aq) -> 2Mn^2+ + 10CO2 + 8H2O(l)'
    expect(formatEquation(parseEquation(eq))).toBe(eq)
  })

  it('scaleEquation multiplies coefficients, including the electron term', () => {
    expect(scaleEquation('Cr(OH)3 + 5OH-(aq) -> CrO4^2- + 4H2O(l) + 3e-', 2)).toBe(
      '2Cr(OH)3 + 10OH-(aq) -> 2CrO4^2- + 8H2O(l) + 6e-',
    )
  })

  it('electronCount reads the electron coefficient of a half-reaction', () => {
    expect(electronCount('ClO- + H2O(l) + 2e- -> Cl- + 2OH-(aq)')).toBe(2)
    expect(electronCount('Cr(OH)3 -> CrO4^2-')).toBe(0)
  })

  it('countSpecies sums a formula across both sides', () => {
    expect(countSpecies('5C2O4^2- + 2MnO4- -> 10CO2 + 2Mn^2+', 'MnO4')).toBe(2)
    expect(countSpecies('5C2O4^2- + 2MnO4- -> 10CO2 + 2Mn^2+', 'CO2')).toBe(10)
  })

  it('classifyTerm marks new species and changed coefficients against the previous row', () => {
    const prev = parseEquation('2MnO4- + 5C2O4^2- -> 2Mn^2+ + 10CO2')[0]
    const next = parseEquation('2MnO4- + 5C2O4^2- + 16H+(aq) -> 2Mn^2+ + 10CO2')[0]
    expect(classifyTerm(next.reactants[2], 'reactants', prev)).toBe('new')
    expect(classifyTerm(next.reactants[0], 'reactants', prev)).toBe('same')
    const changed = parseEquation('4MnO4- -> Mn^2+')[0]
    expect(classifyTerm(changed.reactants[0], 'reactants', prev)).toBe('coefficient')
    expect(classifyTerm(next.reactants[0], 'reactants', undefined)).toBe('same')
  })

  it('rolesFromSkeleton colours the oxidised and reduced species of the skeleton', () => {
    const roles = rolesFromSkeleton('MnO4- + C2O4^2- -> Mn^2+ + CO2')
    expect(roleOf('MnO4', roles)).toBe('red')
    expect(roleOf('C2O4', roles)).toBe('ox')
    expect(roleOf('H2O', roles)).toBeNull()
  })
})
