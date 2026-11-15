import { describe, expect, it } from 'vitest'
import {
  EXPLORER_COUPLES,
  analyseGalvanicCell,
} from './electrode-cell-model'
import { cellEmf, lookupPotential } from '@/lib/chem/electrode-potentials'

describe('electrode-cell-model', () => {
  it('contains expected NCERT Table 7.1 couples with matching potentials', () => {
    for (const c of EXPLORER_COUPLES) {
      expect(c.e0).toBe(lookupPotential(c.coupleStr))
    }
  })

  it('correctly models standard Daniell cell (Zn + Cu)', () => {
    const cell = analyseGalvanicCell('zn', 'cu')
    expect(cell.cathode.id).toBe('cu')
    expect(cell.anode.id).toBe('zn')
    expect(cell.e0Cathode).toBeCloseTo(0.34, 2)
    expect(cell.e0Anode).toBeCloseTo(-0.76, 2)
    expect(cell.e0Cell).toBeCloseTo(1.10, 2)
    expect(cell.e0Cell).toBe(cellEmf('Cu2+/Cu', 'Zn2+/Zn'))
    expect(cell.overallReaction).toBe('Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)')
    expect(cell.oxidant).toBe('Cu²⁺(aq)')
    expect(cell.reductant).toBe('Zn(s)')
    expect(cell.cellNotation).toContain('Zn(s)')
    expect(cell.cellNotation).toContain('Cu(s)')
  })

  it('balances electrons when stoichiometric multipliers differ (Zn + Ag)', () => {
    const cell = analyseGalvanicCell('zn', 'ag')
    expect(cell.cathode.id).toBe('ag')
    expect(cell.anode.id).toBe('zn')
    expect(cell.e0Cathode).toBeCloseTo(0.80, 2)
    expect(cell.e0Anode).toBeCloseTo(-0.76, 2)
    expect(cell.e0Cell).toBeCloseTo(1.56, 2)
    expect(cell.electronsTransferred).toBe(2)
    expect(cell.overallReaction).toBe('Zn(s) + 2Ag⁺(aq) → Zn²⁺(aq) + 2Ag(s)')
  })

  it('balances electron LCM for 3-electron and 2-electron couples (Al + Cu)', () => {
    const cell = analyseGalvanicCell('al', 'cu')
    expect(cell.cathode.id).toBe('cu')
    expect(cell.anode.id).toBe('al')
    expect(cell.e0Cathode).toBeCloseTo(0.34, 2)
    expect(cell.e0Anode).toBeCloseTo(-1.66, 2)
    expect(cell.e0Cell).toBeCloseTo(2.00, 2)
    expect(cell.electronsTransferred).toBe(6)
    expect(cell.overallReaction).toBe('2Al(s) + 3Cu²⁺(aq) → 2Al³⁺(aq) + 3Cu(s)')
  })

  it('correctly models Standard Hydrogen Electrode combinations (Mg + SHE)', () => {
    const cell = analyseGalvanicCell('mg', 'she')
    expect(cell.cathode.id).toBe('she')
    expect(cell.anode.id).toBe('mg')
    expect(cell.e0Cathode).toBeCloseTo(0.00, 2)
    expect(cell.e0Anode).toBeCloseTo(-2.36, 2)
    expect(cell.e0Cell).toBeCloseTo(2.36, 2)
    expect(cell.overallReaction).toBe('Mg(s) + 2H⁺(aq) → Mg²⁺(aq) + H₂(g)')
  })

  it('handles identical couples gracefully', () => {
    const cell = analyseGalvanicCell('cu', 'cu')
    expect(cell.isIdentical).toBe(true)
    expect(cell.e0Cell).toBe(0)
    expect(cell.overallReaction).toContain('Identical')
  })
})
