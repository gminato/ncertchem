import { describe, expect, it } from 'vitest'
import {
  isBalanced,
  balanceHalfReaction,
  balanceRedox,
  balanceByOxidationNumber,
  toMhchem,
} from './redox-balance'

describe('redox-balance.ts', () => {
  describe('isBalanced checker', () => {
    it('verifies balanced reactions in atoms and charge', () => {
      const b1 = isBalanced('2Mg + O2 -> 2MgO')
      expect(b1.balanced).toBe(true)

      const b2 = isBalanced('6Fe2+ + Cr2O72- + 14H+ -> 6Fe3+ + 2Cr3+ + 7H2O')
      expect(b2.balanced).toBe(true)
      expect(b2.chargeBalance.reactant).toBe(24) // 6*2 - 2 + 14 = 24
      expect(b2.chargeBalance.product).toBe(24) // 6*3 + 2*3 = 24
    })

    it('detects unbalanced atoms or charge', () => {
      const u1 = isBalanced('Mg + O2 -> MgO')
      expect(u1.balanced).toBe(false)
      expect(u1.atomBalance.O.balanced).toBe(false)

      const u2 = isBalanced('Fe2+ + Cr2O72- -> Fe3+ + Cr3+')
      expect(u2.balanced).toBe(false)
      expect(u2.chargeBalance.balanced).toBe(false)
    })
  })

  describe('balanceHalfReaction', () => {
    it('balances Cr2O72- -> Cr3+ in acidic medium (6 electrons)', () => {
      const res = balanceHalfReaction('Cr2O72- -> Cr3+', 'acidic')
      expect(res.halfType).toBe('reduction')
      expect(res.electrons).toBe(6)
      expect(res.equationString).toContain('6e-')
      expect(res.equationString).toContain('14H+')
      expect(res.equationString).toContain('7H2O')
    })

    it('balances Fe2+ -> Fe3+ (1 electron, oxidation)', () => {
      const res = balanceHalfReaction('Fe2+ -> Fe3+', 'acidic')
      expect(res.halfType).toBe('oxidation')
      expect(res.electrons).toBe(1)
      expect(res.equationString).toContain('e-')
    })

    it('balances MnO4- -> MnO2 in basic medium (3 electrons)', () => {
      const res = balanceHalfReaction('MnO4- -> MnO2', 'basic')
      expect(res.halfType).toBe('reduction')
      expect(res.electrons).toBe(3)
      expect(res.equationString).toContain('3e-')
      expect(res.equationString).toContain('4OH-')
      expect(res.equationString).toContain('2H2O')
    })

    it('balances 2I- -> I2 (2 electrons, oxidation)', () => {
      const res = balanceHalfReaction('I- -> I2', 'acidic')
      expect(res.halfType).toBe('oxidation')
      expect(res.electrons).toBe(2)
    })
  })

  describe('balanceRedox (Half-reaction method)', () => {
    it('Problem 7.8: Cr2O72- + SO32- in acid medium', () => {
      const res = balanceRedox('Cr2O72- + SO32- -> Cr3+ + SO42-', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.steps).toHaveLength(7)
      expect(res.equationString).toContain('Cr2O7')
      expect(res.equationString).toContain('3SO3')
      expect(res.equationString).toContain('8H+')
      expect(res.equationString).toContain('2Cr')
      expect(res.equationString).toContain('3SO4')
      expect(res.equationString).toContain('4H2O')
    })

    it('Problem 7.9: MnO4- + Br- in basic medium', () => {
      const res = balanceRedox('MnO4- + Br- -> MnO2 + BrO3-', 'basic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('2MnO4')
      expect(res.equationString).toContain('Br-')
      expect(res.equationString).toContain('H2O')
      expect(res.equationString).toContain('2MnO2')
      expect(res.equationString).toContain('BrO3')
      expect(res.equationString).toContain('2OH')
    })

    it('Problem 7.10: MnO4- + I- in basic medium', () => {
      const res = balanceRedox('MnO4- + I- -> MnO2 + I2', 'basic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('2MnO4')
      expect(res.equationString).toContain('6I')
      expect(res.equationString).toContain('4H2O')
      expect(res.equationString).toContain('2MnO2')
      expect(res.equationString).toContain('3I2')
      expect(res.equationString).toContain('8OH')
    })

    it('Eq. 7.58: Fe2+ + Cr2O72- in acidic medium', () => {
      const res = balanceRedox('Fe2+ + Cr2O72- -> Fe3+ + Cr3+', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('6Fe2+')
      expect(res.equationString).toContain('Cr2O72-')
      expect(res.equationString).toContain('14H+')
      expect(res.equationString).toContain('6Fe3+')
      expect(res.equationString).toContain('2Cr3+')
      expect(res.equationString).toContain('7H2O')
    })

    it('balances MnO4- + Fe2+ in acidic medium', () => {
      const res = balanceRedox('MnO4- + Fe2+ -> Mn2+ + Fe3+', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('MnO4-')
      expect(res.equationString).toContain('5Fe2+')
      expect(res.equationString).toContain('8H+')
      expect(res.equationString).toContain('Mn2+')
      expect(res.equationString).toContain('5Fe3+')
      expect(res.equationString).toContain('4H2O')
    })

    it('balances MnO4- + C2O42- in acidic medium', () => {
      const res = balanceRedox('MnO4- + C2O42- -> Mn2+ + CO2', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('2MnO4')
      expect(res.equationString).toContain('5C2O4')
      expect(res.equationString).toContain('16H+')
      expect(res.equationString).toContain('2Mn2+')
      expect(res.equationString).toContain('10CO2')
      expect(res.equationString).toContain('8H2O')
    })
  })

  describe('balanceByOxidationNumber (Oxidation-number method)', () => {
    it('Problem 7.8: Cr2O72- + SO32- with 5 NCERT steps', () => {
      const res = balanceByOxidationNumber('Cr2O72- + SO32- -> Cr3+ + SO42-', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.steps).toHaveLength(5)
      expect(res.equationString).toContain('Cr2O7')
      expect(res.equationString).toContain('3SO3')
      expect(res.equationString).toContain('8H+')
    })

    it('Problem 7.9: MnO4- + Br- in basic medium with 5 NCERT steps', () => {
      const res = balanceByOxidationNumber('MnO4- + Br- -> MnO2 + BrO3-', 'basic')
      expect(res.isBalanced).toBe(true)
      expect(res.steps).toHaveLength(5)
      expect(res.equationString).toContain('2MnO4')
      expect(res.equationString).toContain('Br-')
      expect(res.equationString).toContain('2OH')
    })
  })

  describe('Exercise balancing questions', () => {
    it('Exercise 7.18(b): MnO4- + SO2 -> Mn2+ + HSO4- in acidic', () => {
      const res = balanceRedox('MnO4- + SO2 -> Mn2+ + HSO4-', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('2MnO4')
      expect(res.equationString).toContain('5SO2')
      expect(res.equationString).toContain('5HSO4')
    })

    it('Exercise 7.18(c): H2O2 + Fe2+ in acidic', () => {
      const res = balanceRedox('H2O2 + Fe2+ -> Fe3+ + H2O', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('H2O2')
      expect(res.equationString).toContain('2Fe2+')
      expect(res.equationString).toContain('2Fe3+')
    })

    it('Exercise 7.18(d): Cr2O72- + SO2 in acidic', () => {
      const res = balanceRedox('Cr2O72- + SO2 -> Cr3+ + SO42-', 'acidic')
      expect(res.isBalanced).toBe(true)
      expect(res.equationString).toContain('Cr2O7')
      expect(res.equationString).toContain('3SO2')
      expect(res.equationString).toContain('2Cr3+')
      expect(res.equationString).toContain('3SO42-')
    })
  })

  describe('Item 6: toMhchem and equationMhchem display formatting', () => {
    it('formats species for mhchem unambiguously', () => {
      expect(toMhchem({ formula: 'C2O4', coefficient: 1, charge: -2 })).toBe('C2O4^2-')
      expect(toMhchem({ formula: 'Cr2O7', coefficient: 1, charge: -2 })).toBe('Cr2O7^2-')
      expect(toMhchem({ formula: 'Fe', coefficient: 1, charge: 3 })).toBe('Fe^3+')
      expect(toMhchem({ formula: 'H2O', coefficient: 1, state: 'l' })).toBe('H2O(l)')
      expect(toMhchem({ formula: 'e', coefficient: 1, charge: -1 })).toBe('e-')
      expect(toMhchem({ formula: 'e', coefficient: 6, charge: -1 })).toBe('6e-')
      expect(toMhchem({ formula: 'H', coefficient: 8, charge: 1 })).toBe('8H+')
      expect(toMhchem({ formula: 'Cr', coefficient: 2, charge: 3 })).toBe('2Cr^3+')

      // String inputs
      expect(toMhchem('C2O42-')).toBe('C2O4^2-')
      expect(toMhchem('Cr2O72-')).toBe('Cr2O7^2-')
      expect(toMhchem('Fe3+')).toBe('Fe^3+')
      expect(toMhchem('H2O(l)')).toBe('H2O(l)')
    })

    it('populates equationMhchem on BalancedHalfReactionResult and each BalanceStep', () => {
      const half = balanceHalfReaction('Cr2O72- -> Cr3+', 'acidic')
      expect(half.equationMhchem).toBe('Cr2O7^2- + 14H+(aq) + 6e- -> 2Cr^3+ + 7H2O(l)')
      for (const step of half.steps) {
        expect(step.equationMhchem).toBeDefined()
        expect(step.equationMhchem).toContain('->')
      }
    })

    it('populates equationMhchem on BalancedRedoxResult', () => {
      const res = balanceRedox('Cr2O72- + SO32- -> Cr3+ + SO42-', 'acidic')
      expect(res.equationMhchem).toBe('3SO3^2- + Cr2O7^2- + 8H+(aq) -> 3SO4^2- + 2Cr^3+ + 4H2O(l)')
      for (const step of res.steps) {
        expect(step.equationMhchem).toBeDefined()
      }

      const resOx = balanceByOxidationNumber('Cr2O72- + SO32- -> Cr3+ + SO42-', 'acidic')
      expect(resOx.equationMhchem).toBe('3SO3^2- + Cr2O7^2- + 8H+(aq) -> 3SO4^2- + 2Cr^3+ + 4H2O(l)')
    })
  })
})

describe('isBalanced with electrons in half-equations', () => {
  it('counts electrons as charge only', () => {
    const r = balanceHalfReaction('Cr2O7^2- -> Cr3+', 'acidic')
    expect(isBalanced({ reactants: r.reactants, products: r.products }).balanced).toBe(true)
  })
})
