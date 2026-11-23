import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import {
  BROMOBUTANES,
  DICHLOROBENZENES,
  HALIDE_STEP_COUNT,
  LAYERING_LIQUIDS,
  SOLVENT_HALOALKANE,
  alkylBpGroups,
  isGasAtRoomTemperature,
} from './halide-physical-steps'

describe('halide-physical Scrolly data', () => {
  it('has five Steps', () => {
    expect(HALIDE_STEP_COUNT).toBe(5)
  })

  it('orders each alkyl group RI > RBr > RCl > RF, and every halide above its parent alkane', () => {
    for (const group of alkylBpGroups()) {
      const [f, cl, br, i] = group.halides.map((h) => h.bpK)
      expect(i).toBeGreaterThan(br)
      expect(br).toBeGreaterThan(cl)
      expect(cl).toBeGreaterThan(f)
      expect(f).toBeGreaterThan(group.parent.bpK)
    }
  })

  it('keeps the parent-alkane boiling points and the 137 K Check 1 difference', () => {
    const methyl = alkylBpGroups().find((g) => g.alkyl === 'methyl')
    expect(methyl?.parent.bpK).toBe(112)
    const chloro = methyl?.halides.find((h) => h.halogen === 'Cl')
    expect((chloro?.bpK ?? 0) - (methyl?.parent.bpK ?? 0)).toBe(137)
  })

  it('shows gases below 298 K as the Section states (chloromethane, bromomethane, chloroethane gases; iodomethane a liquid)', () => {
    const methyl = alkylBpGroups().find((g) => g.alkyl === 'methyl')
    expect(isGasAtRoomTemperature(methyl?.halides[1].bpK ?? 0)).toBe(true)
    expect(isGasAtRoomTemperature(methyl?.halides[2].bpK ?? 0)).toBe(true)
    expect(isGasAtRoomTemperature(methyl?.halides[3].bpK ?? 0)).toBe(false)
    const ethyl = alkylBpGroups().find((g) => g.alkyl === 'ethyl')
    expect(isGasAtRoomTemperature(ethyl?.halides[1].bpK ?? 0)).toBe(true)
  })

  it('draws the C4H9Br isomers with the NCERT names and boiling points falling as shape gets compact', () => {
    for (const b of BROMOBUTANES) {
      expect(molecularFormula(b.graph)).toBe('C4H9Br')
      expect(iupacNameFromSmiles(b.smiles).toLowerCase()).toBe(b.name.toLowerCase())
    }
    const bps = BROMOBUTANES.map((b) => b.bpK)
    expect(bps).toEqual([375, 364, 346])
  })

  it('draws the dichlorobenzenes with their NCERT names; para melts highest', () => {
    for (const d of DICHLOROBENZENES) {
      expect(molecularFormula(d.graph)).toBe('C6H4Cl2')
      expect(iupacNameFromSmiles(d.smiles).toLowerCase()).toBe(d.name.toLowerCase())
    }
    const para = DICHLOROBENZENES.find((d) => d.isomer === 'para')
    expect(para?.mpK).toBe(323)
    expect(Math.max(...DICHLOROBENZENES.map((d) => d.mpK))).toBe(para?.mpK)
  })

  it('floats only n-propyl chloride among the Table 6.3 liquids', () => {
    const floating = LAYERING_LIQUIDS.filter((l) => l.floats).map((l) => l.ce)
    expect(floating).toEqual(['CH3CH2CH2Cl'])
  })

  it('draws the solvent haloalkane as 1-bromopropane', () => {
    expect(molecularFormula(SOLVENT_HALOALKANE.graph)).toBe('C3H7Br')
    expect(iupacNameFromSmiles(SOLVENT_HALOALKANE.smiles)).toBe('1-bromopropane')
  })
})
