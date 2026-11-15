import { describe, expect, it } from 'vitest'
import {
  cellEmf,
  displacementOutcome,
  lookupPotential,
} from '@/lib/chem/electrode-potentials'
import { balanceRedox } from '@/lib/chem/redox-balance'

describe('MetalDisplacementLab Chemistry Model', () => {
  it('correctly predicts spontaneous displacement for Zn in Cu2+', () => {
    const outcome = displacementOutcome('Zn', 'Cu2+')
    const emf = cellEmf('Cu2+', 'Zn')
    expect(outcome).toBe('products strongly favoured')
    expect(emf).toBeCloseTo(1.10, 2)

    const skel = 'Zn + Cu2+ -> Zn2+ + Cu'
    const res = balanceRedox(skel, 'acidic')
    expect(res.isBalanced).toBe(true)
    expect(res.equationString).toBe('Zn + Cu2+ -> Zn2+ + Cu')
  })

  it('correctly predicts non-spontaneous reaction for Cu in Zn2+', () => {
    const outcome = displacementOutcome('Cu', 'Zn2+')
    const emf = cellEmf('Zn2+', 'Cu')
    expect(outcome).toBe('no visible reaction')
    expect(emf).toBeCloseTo(-1.10, 2)
  })

  it('correctly predicts spontaneous reaction for Cu in Ag+', () => {
    const outcome = displacementOutcome('Cu', 'Ag+')
    const emf = cellEmf('Ag+', 'Cu')
    expect(outcome).toBe('products strongly favoured')
    expect(emf).toBeCloseTo(0.46, 2)

    const skel = 'Cu + Ag+ -> Cu2+ + Ag'
    const res = balanceRedox(skel, 'acidic')
    expect(res.isBalanced).toBe(true)
    expect(res.equationString).toBe('Cu + 2Ag+ -> Cu2+ + 2Ag')
  })

  it('correctly predicts moderate equilibrium for Co in Ni2+', () => {
    const outcome = displacementOutcome('Co', 'Ni2+')
    const emf = cellEmf('Ni2+', 'Co')
    expect(outcome).toBe('moderate both ways')
    expect(emf).toBeCloseTo(0.03, 2)
  })

  it('correctly looks up standard reduction potentials from Table 7.1', () => {
    expect(lookupPotential('Mg')).toBe(-2.36)
    expect(lookupPotential('Zn')).toBe(-0.76)
    expect(lookupPotential('Fe')).toBe(-0.44)
    expect(lookupPotential('Pb')).toBe(-0.13)
    expect(lookupPotential('Cu')).toBe(0.34)
    expect(lookupPotential('Ag')).toBe(0.80)
  })
})
