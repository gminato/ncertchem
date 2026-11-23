import { describe, expect, it } from 'vitest'
import {
  NCERT_S2_ENTITIES,
  NCERT_S2_LIGANDS,
  NCERT_S2_POLYHEDRA,
  coordinationNumber,
  isHomoleptic,
  oxidationNumber,
} from './ncert-c12-unit5-s2-tables'

describe('NCERT Unit 5 s2 ligands', () => {
  it('EDTA is hexadentate and en is didentate', () => {
    expect(NCERT_S2_LIGANDS.find((l) => l.formula === 'EDTA')?.donorAtoms).toBe(6)
    expect(NCERT_S2_LIGANDS.find((l) => l.formula === 'en')?.donorAtoms).toBe(2)
  })
  it('NO2 and SCN are ambidentate with 1 donor atom used at a time', () => {
    for (const f of ['NO2', 'SCN']) {
      const lig = NCERT_S2_LIGANDS.find((l) => l.formula === f)
      expect(lig?.kind).toBe('ambidentate')
      expect(lig?.donorAtoms).toBe(1)
    }
  })
})

describe('NCERT Unit 5 s2 entities', () => {
  it('coordination number matches the sum over ligands', () => {
    const donors = (f: string) => NCERT_S2_LIGANDS.find((l) => l.formula === f)?.donorAtoms ?? 1
    for (const e of NCERT_S2_ENTITIES) {
      const cn = coordinationNumber(e.ligands.map((l) => ({ donorAtoms: donors(l.ligand), count: l.count })))
      expect(cn, e.formula).toBe(e.coordinationNumber)
    }
  })
  it('oxidation number reproduces the stated metal charge', () => {
    const charge: Record<string, number> = { Cl: -1, NH3: 0, CO: 0, CN: -1, C2O4: -2, en: 0 }
    for (const e of NCERT_S2_ENTITIES) {
      const cs = e.ligands.flatMap((l) => Array(l.count).fill(charge[l.ligand]))
      expect(oxidationNumber(e.entityCharge, cs), e.formula).toBe(e.metalCharge)
    }
  })
  it('distinguishes homoleptic and heteroleptic complexes', () => {
    const homo = NCERT_S2_ENTITIES.find((e) => e.formula === '[Co(NH3)6]3+')!
    const hetero = NCERT_S2_ENTITIES.find((e) => e.formula === '[Co(NH3)4Cl2]+')!
    expect(isHomoleptic(homo)).toBe(true)
    expect(isHomoleptic(hetero)).toBe(false)
  })
  it('polyhedra of Fig. 5.1', () => {
    expect(NCERT_S2_POLYHEDRA.map((p) => p.coordinationNumber)).toEqual([6, 4, 4, 5, 5])
  })
})
