import { describe, expect, it } from 'vitest'
import { NCERT_STANDARD_POTENTIALS } from './ncert-c12-unit2-tables'
import {
  COUPLES,
  balancedOverall,
  coupleById,
  pairCouples,
  signed,
  unicodeLabel,
} from './half-cell-pairing'

describe('couples from Table 2.1', () => {
  it('has one couple per row with the table E° values', () => {
    expect(COUPLES).toHaveLength(NCERT_STANDARD_POTENTIALS.length)
    expect(coupleById('Cu2+/Cu').e0).toBe(0.34)
    expect(coupleById('Zn2+/Zn').e0).toBe(-0.76)
  })

  it('classifies metal, gas and ion couples and picks the electrode', () => {
    expect(coupleById('Cu2+/Cu')).toMatchObject({ kind: 'metal', electrode: 'cu', electrodeLabel: 'Cu' })
    expect(coupleById('Cl2/Cl-')).toMatchObject({ kind: 'gas', electrode: 'pt', gasCe: 'Cl2' })
    expect(coupleById('H+/H2')).toMatchObject({ kind: 'gas', electrode: 'pt', gasCe: 'H2' })
    expect(coupleById('Fe3+/Fe2+')).toMatchObject({ kind: 'ion', electrode: 'pt' })
    expect(coupleById('Au3+/Au').electrode).toBe('pt')
  })

  it('lists the charged solution species with their mhchem bodies', () => {
    expect(coupleById('Cu2+/Cu').solution.map((s) => s.ce)).toEqual(['Cu^{2+}(aq)'])
    expect(coupleById('Cu2+/Cu').tint).toBe('blue')
    expect(coupleById('Zn2+/Zn').tint).toBe('clear')
    expect(coupleById('MnO4-/Mn2+').tint).toBe('violet')
  })

  it('converts ids to Unicode labels', () => {
    expect(unicodeLabel('Cu2+/Cu')).toBe('Cu²⁺/Cu')
    expect(unicodeLabel('H2O2/H2O')).toBe('H₂O₂/H₂O')
    expect(unicodeLabel('Cr2O7 2-/Cr3+')).toBe('Cr₂O₇²⁻/Cr³⁺')
  })
})

describe('balancedOverall', () => {
  it('balances the Daniell cell with electrons cancelled', () => {
    const r = balancedOverall(coupleById('Cu2+/Cu'), coupleById('Zn2+/Zn'))
    expect(r.ce).toBe('Cu^{2+} + Zn(s) -> Cu(s) + Zn^{2+}')
    expect(r.electrons).toBe(2)
  })

  it('scales half-reactions to a common electron count', () => {
    const r = balancedOverall(coupleById('Ag+/Ag'), coupleById('Zn2+/Zn'))
    expect(r.ce).toBe('2Ag^+ + Zn(s) -> 2Ag(s) + Zn^{2+}')
    expect(r.electrons).toBe(2)
  })

  it('balances a permanganate couple against iron(II) with H+ and H2O', () => {
    const r = balancedOverall(coupleById('MnO4-/Mn2+'), coupleById('Fe3+/Fe2+'))
    expect(r.ce).toBe('MnO4^- + 8H+ + 5Fe^{2+} -> Mn^{2+} + 4H2O + 5Fe^{3+}')
    expect(r.electrons).toBe(5)
  })
})

describe('pairCouples', () => {
  it('puts the higher E° couple at the cathode and writes the Daniell cell', () => {
    const p = pairCouples(coupleById('Zn2+/Zn'), coupleById('Cu2+/Cu'))
    expect(p).not.toBeNull()
    expect(p?.cathode.id).toBe('Cu2+/Cu')
    expect(p?.anode.id).toBe('Zn2+/Zn')
    expect(p?.eCell).toBeCloseTo(1.1, 10)
    expect(p?.spontaneous).toBe(true)
    expect(p?.notation).toBe('Zn(s)|Zn^{2+}(aq)||Cu^{2+}(aq)|Cu(s)')
  })

  it('reverses the roles for the non-spontaneous direction', () => {
    const p = pairCouples(coupleById('Zn2+/Zn'), coupleById('Cu2+/Cu'), 'reversed')
    expect(p?.eCell).toBeCloseTo(-1.1, 10)
    expect(p?.spontaneous).toBe(false)
    expect(p?.anode.id).toBe('Cu2+/Cu')
    expect(p?.notation).toBe('Cu(s)|Cu^{2+}(aq)||Zn^{2+}(aq)|Zn(s)')
  })

  it('writes a gas electrode as Pt with the gas in the notation', () => {
    const p = pairCouples(coupleById('H+/H2'), coupleById('Ag+/Ag'))
    expect(p?.cathode.id).toBe('Ag+/Ag')
    expect(p?.eCell).toBeCloseTo(0.8, 10)
    expect(p?.notation).toBe('Pt|H2(g)|H^{+}(aq)||Ag^{+}(aq)|Ag(s)')
  })

  it('returns null for the same couple twice', () => {
    expect(pairCouples(coupleById('Cu2+/Cu'), coupleById('Cu2+/Cu'))).toBeNull()
  })

  it('gives E°cell = 0 when the potentials tie', () => {
    const p = pairCouples(coupleById('O2/H2O'), coupleById('MnO2/Mn2+'))
    expect(p?.eCell).toBeCloseTo(0, 10)
    expect(p?.spontaneous).toBe(false)
  })
})

describe('signed', () => {
  it('uses a true minus sign', () => {
    expect(signed(-0.76)).toBe('−0.76')
    expect(signed(1.1)).toBe('1.10')
  })
})

describe('solution ions', () => {
  it('reads a nitrate ion as NO3⁻, not NO with a 3- charge', () => {
    expect(coupleById('NO3-/NO').solution.map((s) => s.ce)).toEqual(['NO3^{-}(aq)', 'H^{+}(aq)'])
  })
})
