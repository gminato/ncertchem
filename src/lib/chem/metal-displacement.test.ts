import { describe, expect, it } from 'vitest'
import { displacementEquation, displayedEquationIsBalanced, splitCation, unicodeIon } from './metal-displacement'

describe('metal displacement equations', () => {
  it('balances Zn with Cu2+ and shows states and charges in mhchem', () => {
    const eq = displacementEquation('Zn', 'Cu2+')
    expect(eq.outcome).toBe('products strongly favoured')
    expect(eq.mhchem).toBe('Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)')
    expect(eq.noReactionReason).toBeNull()
  })

  it('balances the two-electron silver case with a coefficient of 2', () => {
    const eq = displacementEquation('Cu', 'Ag+')
    expect(eq.mhchem).toBe('Cu(s) + 2Ag+(aq) -> Cu^2+(aq) + 2Ag(s)')
  })

  it('uses an equilibrium arrow for Co in Ni2+ and keeps the balanced coefficients', () => {
    const eq = displacementEquation('Co', 'Ni2+')
    expect(eq.outcome).toBe('moderate both ways')
    expect(eq.mhchem).toBe('Co(s) + Ni^2+(aq) <=> Co^2+(aq) + Ni(s)')
  })

  it('returns no equation, but a reason, when the displacement is non-spontaneous', () => {
    const eq = displacementEquation('Cu', 'Zn2+')
    expect(eq.outcome).toBe('no visible reaction')
    expect(eq.mhchem).toBeNull()
    expect(eq.noReactionReason).toContain('−1.10 V')
    expect(eq.noReactionReason).toContain('Zn²⁺')
    expect(eq.noReactionReason).not.toContain('Zn2+')
  })

  it('balances every combination the lab offers (atoms and charge)', () => {
    const metals = ['Mg', 'Zn', 'Fe', 'Pb', 'Cu', 'Ag', 'Co']
    const cations = ['Cu2+', 'Ag+', 'Zn2+', 'Fe2+', 'Pb2+', 'Ni2+']
    for (const m of metals) {
      for (const c of cations) {
        expect(displayedEquationIsBalanced(m, c), `${m} in ${c}`).toBe(true)
      }
    }
  })

  it('writes ions in prose with superscript charges', () => {
    expect(unicodeIon('Zn2+')).toBe('Zn²⁺')
    expect(unicodeIon('Ag+')).toBe('Ag⁺')
  })

  it('splits cation keys', () => {
    expect(splitCation('Cu2+')).toEqual({ metal: 'Cu', charge: 2 })
    expect(splitCation('Ag+')).toEqual({ metal: 'Ag', charge: 1 })
  })
})
