import { describe, expect, it } from 'vitest'
import {
  CURRENT_FLOW,
  ELECTRON_FLOW,
  assignElectrodes,
  cellNotation,
  equilibriumConstantFromE,
  gibbsFromCell,
  gibbsFromCellKJ,
  log10KFromE,
  standardCellPotential,
  standardGibbsFromK,
} from './electrochemical-cell'

describe('cellNotation', () => {
  it('writes the anode on the left with | and || (Daniell cell)', () => {
    expect(
      cellNotation({ electrode: 'Zn(s)', solution: 'Zn²⁺(aq)' }, { electrode: 'Cu(s)', solution: 'Cu²⁺(aq)' }),
    ).toBe('Zn(s)|Zn²⁺(aq)||Cu²⁺(aq)|Cu(s)')
  })
})

describe('standardCellPotential', () => {
  it('is E°(cathode) − E°(anode): Daniell cell 0.34 − (−0.76) = 1.10 V (Example 2.3)', () => {
    expect(standardCellPotential(0.34, -0.76)).toBeCloseTo(1.1, 9)
  })
})

describe('assignElectrodes', () => {
  it('reduces the higher E° couple at the cathode and gives a positive E°cell', () => {
    const a = assignElectrodes({ name: 'Zn2+/Zn', e0: -0.76 }, { name: 'Cu2+/Cu', e0: 0.34 })
    expect(a.cathode.name).toBe('Cu2+/Cu')
    expect(a.anode.name).toBe('Zn2+/Zn')
    expect(a.eCell).toBeCloseTo(1.1, 9)
  })

  it('gives E°cell = 0 for equal potentials', () => {
    const a = assignElectrodes({ name: 'x', e0: 0.5 }, { name: 'y', e0: 0.5 })
    expect(a.eCell).toBe(0)
  })
})

describe('electron and current direction', () => {
  it('electrons go anode to cathode, conventional current the other way', () => {
    expect(ELECTRON_FLOW).toEqual({ from: 'anode', to: 'cathode' })
    expect(CURRENT_FLOW).toEqual({ from: 'cathode', to: 'anode' })
  })
})

describe('gibbsFromCell (ΔrG = −nFE)', () => {
  it('Example 2.3: n = 2, E = 1.1 V gives −212.27 kJ mol⁻¹ (NCERT misprints −21227 J)', () => {
    expect(gibbsFromCell(2, 1.1)).toBeCloseTo(-212271.4, 0)
    expect(gibbsFromCellKJ(2, 1.1)).toBeCloseTo(-212.27, 2)
  })

  it('doubling n doubles ΔrG for the same E (extensive quantity)', () => {
    expect(gibbsFromCell(4, 1.1)).toBeCloseTo(2 * gibbsFromCell(2, 1.1), 6)
  })

  it('throws for a non-integer or zero n', () => {
    expect(() => gibbsFromCell(0, 1)).toThrow(RangeError)
    expect(() => gibbsFromCell(1.5, 1)).toThrow(RangeError)
  })
})

describe('equilibrium constant from E°cell', () => {
  it('Example 2.1 derivation: E° = 1.1 V, n = 2 gives K ≈ 2 × 10³⁷ (log K = 37.288)', () => {
    expect(log10KFromE(2, 1.1)).toBeCloseTo(37.288, 2)
    expect(equilibriumConstantFromE(2, 1.1) / 2e37).toBeCloseTo(0.97, 1)
  })

  it('Example 2.2: Cu + 2Ag⁺ with E° = 0.46 V gives K = 3.92 × 10¹⁵', () => {
    expect(log10KFromE(2, 0.46)).toBeCloseTo(15.593, 2)
    expect(equilibriumConstantFromE(2, 0.46) / 3.92e15).toBeCloseTo(1, 2)
  })

  it('exact form at 298 K differs from the 0.059 form, as documented', () => {
    const exact = log10KFromE(2, 0.46, 298)
    expect(exact).toBeCloseTo((2 * 96487 * 0.46) / (8.314 * 298 * Math.LN10), 6)
    expect(Math.abs(exact - log10KFromE(2, 0.46))).toBeGreaterThan(0.02)
  })
})

describe('standardGibbsFromK (ΔrG° = −RT ln K)', () => {
  it('is zero for K = 1 and negative for K > 1', () => {
    expect(standardGibbsFromK(1)).toBeCloseTo(0, 9)
    expect(standardGibbsFromK(1e10)).toBeLessThan(0)
  })

  it('reverses equilibriumConstantFromE for an exact-temperature round trip', () => {
    const k = equilibriumConstantFromE(2, 0.46, 298)
    expect(standardGibbsFromK(k, 298)).toBeCloseTo(-2 * 96487 * 0.46, -1)
  })

  it('throws for non-positive K', () => {
    expect(() => standardGibbsFromK(0)).toThrow(RangeError)
  })
})
