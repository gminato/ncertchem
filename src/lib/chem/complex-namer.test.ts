import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COMPLEX,
  REVERSE_CHALLENGES,
  checkReverseMatch,
  evaluateComplex,
  type ComplexSpec,
} from './complex-namer'

describe('complex-namer chemistry engine', () => {
  it('evaluates the default [Co(NH3)4Cl2]Cl complex accurately', () => {
    const res = evaluateComplex(DEFAULT_COMPLEX)
    expect(res.entityCharge).toBe(1)
    expect(res.fullFormula).toBe('[Co(NH₃)₄Cl₂]Cl')
    expect(res.fullName).toBe('tetraamminedichloridocobalt(III) chloride')
    expect(res.balanced).toBe(true)
    expect(res.counterIonCount).toBe(1)
    expect(res.rules.find((r) => r.id === 'cation-first')?.active).toBe(true)
    expect(res.rules.find((r) => r.id === 'alphabetical')?.active).toBe(true)
    expect(res.rules.find((r) => r.id === 'anion-o')?.active).toBe(true)
    expect(res.rules.find((r) => r.id === 'special-neutral')?.active).toBe(true)
    expect(res.rules.find((r) => r.id === 'anion-ate')?.active).toBe(false)
  })

  it('builds anionic complexes with Latin -ate stems and cationic counter ions first', () => {
    const spec: ComplexSpec = {
      metal: 'Fe',
      oxidationState: 2,
      slots: [
        { formula: 'CN', count: 6 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'K',
    }
    const res = evaluateComplex(spec)
    expect(res.entityCharge).toBe(-4)
    expect(res.fullFormula).toBe('K₄[Fe(CN)₆]')
    expect(res.fullName).toBe('potassium hexacyanidoferrate(II)')
    expect(res.counterIonCount).toBe(4)
    expect(res.rules.find((r) => r.id === 'anion-ate')?.active).toBe(true)
  })

  it('handles bis/tris for numbered ligands and sulphate charge balancing via GCD', () => {
    const spec: ComplexSpec = {
      metal: 'Co',
      oxidationState: 3,
      slots: [
        { formula: 'en', count: 3 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'SO4',
    }
    const res = evaluateComplex(spec)
    expect(res.entityCharge).toBe(3)
    expect(res.entityCount).toBe(2)
    expect(res.counterIonCount).toBe(3)
    expect(res.fullFormula).toBe('[Co(en)₃]₂(SO₄)₃')
    expect(res.fullName).toBe('tris(ethane-1,2-diamine)cobalt(III) sulphate')
    expect(res.rules.find((r) => r.id === 'bis-prefix')?.active).toBe(true)
  })

  it('flags impossible counter ion charge and suggests the nearest balanced choice', () => {
    const spec: ComplexSpec = {
      metal: 'Co',
      oxidationState: 3,
      slots: [
        { formula: 'NH3', count: 6 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'K',
    }
    const res = evaluateComplex(spec)
    expect(res.balanced).toBe(false)
    expect(res.balanceNote).toContain('cannot be balanced')
    expect(res.nearestChoice?.counterIon).toBe('Cl')
  })

  it('handles neutral carbonyl complexes cleanly', () => {
    const spec: ComplexSpec = {
      metal: 'Ni',
      oxidationState: 0,
      slots: [
        { formula: 'CO', count: 4 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'none',
    }
    const res = evaluateComplex(spec)
    expect(res.entityCharge).toBe(0)
    expect(res.fullFormula).toBe('[Ni(CO)₄]')
    expect(res.fullName).toBe('tetracarbonylnickel(0)')
    expect(res.balanced).toBe(true)
  })

  it('verifies every reverse-mode challenge matches its own spec', () => {
    for (const ch of REVERSE_CHALLENGES) {
      const evaluated = evaluateComplex(ch.spec)
      expect(evaluated.fullName).toBe(ch.targetName)
      expect(checkReverseMatch(ch.spec, ch).matched).toBe(true)
    }
  })
})
