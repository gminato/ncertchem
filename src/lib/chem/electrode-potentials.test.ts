import { describe, expect, it } from 'vitest'
import {
  lookupPotential,
  strongerOxidant,
  strongerReductant,
  cellEmf,
  canReduce,
  liberatesHydrogenFromAcid,
  displacementOutcome,
  canDisplaceHalogen,
  ACTIVITY_SERIES_METALS,
  HALOGEN_DISPLACEMENT_ORDER,
  COBALT_REDUCTION_POTENTIAL,
} from './electrode-potentials'

describe('electrode-potentials.ts', () => {
  describe('lookups on Table 7.1', () => {
    it('retrieves standard reduction potentials by couple or element', () => {
      expect(lookupPotential('F2/F-')).toBe(2.87)
      expect(lookupPotential('Zn2+/Zn')).toBe(-0.76)
      expect(lookupPotential('Zn')).toBe(-0.76)
      expect(lookupPotential('Cu2+/Cu')).toBe(0.34)
      expect(lookupPotential('Cu')).toBe(0.34)
      expect(lookupPotential('Ag+/Ag')).toBe(0.8)
      expect(lookupPotential('2H+/H2')).toBe(0.0)
      expect(lookupPotential('H2')).toBe(0.0)
      expect(lookupPotential('Li+/Li')).toBe(-3.05)
    })

    it('retrieves Cobalt with non-NCERT citation flag', () => {
      expect(COBALT_REDUCTION_POTENTIAL.e0).toBe(-0.28)
      expect(COBALT_REDUCTION_POTENTIAL.source).toBe('standard tables, not NCERT')
      expect(lookupPotential('Co2+/Co')).toBe(-0.28)
      expect(lookupPotential('Co')).toBe(-0.28)
    })

    it('throws RangeError for unknown couple', () => {
      expect(() => lookupPotential('Unknown/Element')).toThrow(RangeError)
    })
  })

  describe('strongerOxidant and strongerReductant', () => {
    it('determines stronger oxidising agent (higher E0)', () => {
      expect(strongerOxidant('F2/F-', 'Cl2/Cl-')).toBe('F2/F-')
      expect(strongerOxidant('Cu2+/Cu', 'Zn2+/Zn')).toBe('Cu2+/Cu')
      expect(strongerOxidant('Ag+/Ag', 'Cu2+/Cu')).toBe('Ag+/Ag')
    })

    it('determines stronger reducing agent (lower E0)', () => {
      expect(strongerReductant('Zn', 'Cu')).toBe('Zn')
      expect(strongerReductant('Li', 'Na')).toBe('Li')
      expect(strongerReductant('Fe', 'Cu')).toBe('Fe')
    })
  })

  describe('cellEmf and canReduce', () => {
    it('computes Daniell cell emf as 1.10 V (Cu cathode, Zn anode)', () => {
      const emf = cellEmf('Cu2+/Cu', 'Zn2+/Zn')
      expect(emf).toBeCloseTo(1.1, 2)
    })

    it('computes Cu-Ag cell emf as 0.46 V', () => {
      const emf = cellEmf('Ag+/Ag', 'Cu2+/Cu')
      expect(emf).toBeCloseTo(0.46, 2)
    })

    it('determines spontaneity with canReduce', () => {
      // Zn can reduce Cu2+ (E0cell = 0.34 - (-0.76) = 1.10 > 0)
      expect(canReduce('Zn', 'Cu2+')).toBe(true)
      // Cu cannot reduce Zn2+ (E0cell = -0.76 - 0.34 = -1.10 < 0)
      expect(canReduce('Cu', 'Zn2+')).toBe(false)
      // Cu can reduce Ag+ (E0cell = 0.80 - 0.34 = 0.46 > 0)
      expect(canReduce('Cu', 'Ag+')).toBe(true)
    })

    it('identifies metals that liberate H2 from acid (E0 < 0)', () => {
      expect(liberatesHydrogenFromAcid('Zn')).toBe(true)
      expect(liberatesHydrogenFromAcid('Mg')).toBe(true)
      expect(liberatesHydrogenFromAcid('Al')).toBe(true)
      expect(liberatesHydrogenFromAcid('Fe')).toBe(true)

      expect(liberatesHydrogenFromAcid('Cu')).toBe(false)
      expect(liberatesHydrogenFromAcid('Ag')).toBe(false)
      expect(liberatesHydrogenFromAcid('Au')).toBe(false)
    })
  })

  describe('displacementOutcome (matching Section 7.2.1)', () => {
    it('predicts "products strongly favoured" for Zn/Cu2+ and Cu/Ag+', () => {
      expect(displacementOutcome('Zn', 'Cu2+')).toBe('products strongly favoured')
      expect(displacementOutcome('Cu', 'Ag+')).toBe('products strongly favoured')
    })

    it('predicts "no visible reaction" for Cu/Zn2+', () => {
      expect(displacementOutcome('Cu', 'Zn2+')).toBe('no visible reaction')
    })

    it('predicts "moderate both ways" for Co/Ni2+', () => {
      expect(displacementOutcome('Co', 'Ni2+')).toBe('moderate both ways')
    })
  })

  describe('Activity series & Halogen displacement', () => {
    it('orders metals by decreasing reducing power', () => {
      expect(ACTIVITY_SERIES_METALS[0]).toBe('Li')
      expect(ACTIVITY_SERIES_METALS[ACTIVITY_SERIES_METALS.length - 1]).toBe('Au')
      expect(ACTIVITY_SERIES_METALS).toContain('Zn')
      expect(ACTIVITY_SERIES_METALS).toContain('Cu')
      expect(ACTIVITY_SERIES_METALS.indexOf('Zn')).toBeLessThan(ACTIVITY_SERIES_METALS.indexOf('Cu'))
      expect(ACTIVITY_SERIES_METALS.indexOf('Cu')).toBeLessThan(ACTIVITY_SERIES_METALS.indexOf('Ag'))
    })

    it('orders halogens F2 > Cl2 > Br2 > I2', () => {
      expect(HALOGEN_DISPLACEMENT_ORDER).toEqual(['F2', 'Cl2', 'Br2', 'I2'])
      expect(canDisplaceHalogen('Cl2', 'Br-')).toBe(true)
      expect(canDisplaceHalogen('Cl2', 'I-')).toBe(true)
      expect(canDisplaceHalogen('Br2', 'I-')).toBe(true)
      expect(canDisplaceHalogen('Br2', 'Cl-')).toBe(false)
      expect(canDisplaceHalogen('I2', 'Cl-')).toBe(false)
    })
  })
})
