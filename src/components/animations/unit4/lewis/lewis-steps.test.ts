import { describe, expect, it } from 'vitest'
import { NCERT_NACL_LATTICE_ENTHALPY_KJ } from '@/lib/chem/ncert-unit4-tables'
import {
  BORN_HABER_STEP_COUNT,
  FORMATION_KJ,
  KOSSEL_STEP_COUNT,
  OCTET_EXAMPLE_KEYS,
  OCTET_STEP_COUNT,
  cycleFormationKj,
  kosselFrame,
  kosselShells,
  levelAtStep,
  octetFrame,
  staircase,
} from './lewis-steps'

describe('kosselFrame', () => {
  it('has four Steps: apart, transfer arrow, ions, attraction', () => {
    expect(KOSSEL_STEP_COUNT).toBe(4)
    expect(kosselFrame(0)).toEqual({ sodiumDot: true, transferred: false, arrow: false, attraction: false })
    expect(kosselFrame(1).arrow).toBe(true)
    expect(kosselFrame(2)).toEqual({ sodiumDot: false, transferred: true, arrow: false, attraction: false })
    expect(kosselFrame(3).attraction).toBe(true)
  })

  it('clamps out-of-range Steps', () => {
    expect(kosselFrame(-3)).toEqual(kosselFrame(0))
    expect(kosselFrame(99)).toEqual(kosselFrame(3))
  })

  it('reads the shells of Na, Na⁺, Cl and Cl⁻ from the configurations', () => {
    expect(kosselShells()).toEqual({ na: [2, 8, 1], naIon: [2, 8], cl: [2, 8, 7], clIon: [2, 8, 8] })
  })
})

describe('octetFrame', () => {
  it('has the four Section 4.1.5 examples, in order', () => {
    expect(OCTET_STEP_COUNT).toBe(4)
    expect(OCTET_EXAMPLE_KEYS).toEqual(['BeCl2', 'BCl3', 'NO', 'PCl5'])
  })

  it('focuses on the atom whose octet is not complete, and reads its electron count', () => {
    expect(octetFrame(0)).toMatchObject({ label: 'BeCl₂', focusIndex: 0, focus: { element: 'Be', electrons: 4, status: 'incomplete' } })
    expect(octetFrame(0).readout).toBe('Be: 4 electrons: incomplete octet')
    expect(octetFrame(1)).toMatchObject({ label: 'BCl₃', focus: { element: 'B', electrons: 6, status: 'incomplete' } })
    expect(octetFrame(2)).toMatchObject({ label: 'NO', focus: { element: 'N', status: 'odd-electron' } })
    expect(octetFrame(3)).toMatchObject({ label: 'PCl₅', focus: { element: 'P', electrons: 10, status: 'expanded' } })
  })

  it('clamps out-of-range Steps', () => {
    expect(octetFrame(7).key).toBe('PCl5')
    expect(octetFrame(-1).key).toBe('BeCl2')
  })
})

describe('Born–Haber staircase (NaCl)', () => {
  it('has the reference state and five bars', () => {
    expect(BORN_HABER_STEP_COUNT).toBe(6)
    expect(staircase()).toHaveLength(5)
  })

  it('builds the bars from NCERT values and standard data, in formation order', () => {
    const bars = staircase()
    expect(bars.map((b) => b.enthalpyKj)).toEqual([108.4, 121.3, 495.8, -348.7, -788])
    expect(bars[0].from).toBe(0)
    expect(bars[1].from).toBeCloseTo(108.4, 6)
    expect(bars[2].to).toBeCloseTo(725.5, 6)
    expect(bars[3].to).toBeCloseTo(376.8, 6)
  })

  it('takes the lattice formation step as −788 kJ mol⁻¹ (the separation value NCERT prints is +788)', () => {
    const last = staircase()[4]
    expect(NCERT_NACL_LATTICE_ENTHALPY_KJ).toBe(788)
    expect(last.enthalpyKj).toBe(-NCERT_NACL_LATTICE_ENTHALPY_KJ)
    expect(last.closing).toBe(true)
    expect(last.to).toBeCloseTo(FORMATION_KJ, 6)
  })

  it('closes on the standard enthalpy of formation of NaCl(s), −411.2 kJ mol⁻¹', () => {
    expect(cycleFormationKj()).toBeCloseTo(-411.2, 6)
    expect(FORMATION_KJ).toBe(-411.2)
  })

  it('draws the reference level at Step 0 and one more bar at each later Step', () => {
    expect(levelAtStep(0)).toBe(0)
    expect(levelAtStep(1)).toBeCloseTo(108.4, 6)
    expect(levelAtStep(3)).toBeCloseTo(229.7 + 495.8, 6)
    expect(levelAtStep(5)).toBeCloseTo(FORMATION_KJ, 6)
  })
})
