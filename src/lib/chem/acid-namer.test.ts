import { describe, expect, it } from 'vitest'
import { acidModel, DEFAULT_SPEC, maxPosition, resolveSpec, type AcidSpec } from './acid-namer'

const chain = (carbons: number, substituent: AcidSpec['substituent'] = 'none', position = 2, diacid = false): AcidSpec => ({
  skeleton: 'chain',
  carbons,
  substituent,
  position,
  diacid,
})

describe('acidModel: the drawn molecules', () => {
  it('default is 3-methylpentanoic acid, C6H12O2 (Step 4)', () => {
    const m = acidModel(DEFAULT_SPEC)
    expect(m.formula).toBe('C6H12O2')
    expect(m.name).toBe('3-methylpentanoic acid')
    expect(m.commonName).toBeNull()
  })

  it('formic, acetic and butyric acids take their Table 8.3 common names', () => {
    expect(acidModel(chain(1)).commonName).toBe('formic acid')
    expect(acidModel(chain(1)).formula).toBe('CH2O2')
    expect(acidModel(chain(2)).commonName).toBe('acetic acid')
    expect(acidModel(chain(2)).name).toBe('ethanoic acid')
    expect(acidModel(chain(4)).commonName).toBe('butyric acid')
    expect(acidModel(chain(4)).formula).toBe('C4H8O2')
  })

  it('adipic acid (hexanedioic) is C6H10O4 with the second COOH at the far end', () => {
    const m = acidModel(chain(6, 'none', 2, true))
    expect(m.formula).toBe('C6H10O4')
    expect(m.name).toBe('hexanedioic acid')
  })

  it('benzoic and phthalic acids', () => {
    const benzoic = acidModel({ skeleton: 'ring', carbons: 1, substituent: 'none', position: 0, diacid: false })
    expect(benzoic.formula).toBe('C7H6O2')
    expect(benzoic.commonName).toBe('benzoic acid')
    const phthalic = acidModel({ skeleton: 'ring', carbons: 1, substituent: 'none', position: 0, diacid: true })
    expect(phthalic.formula).toBe('C8H6O4')
    expect(phthalic.name).toBe('benzene-1,2-dicarboxylic acid')
    expect(phthalic.commonName).toBe('phthalic acid')
  })

  it('a chlorine on C2 makes 2-chloro acids of the right formula', () => {
    const m = acidModel(chain(3, 'Cl', 2))
    expect(m.formula).toBe('C3H5ClO2')
    expect(m.name).toBe('2-chloropropanoic acid')
  })

  it('locant atoms are carbons, and the carboxyl atom is the COOH carbon', () => {
    const m = acidModel(DEFAULT_SPEC)
    expect(m.chainAtoms).toHaveLength(5)
    for (const atom of m.chainAtoms) expect(m.graph.atoms[atom].element).toBe('C')
    expect(m.graph.atoms[m.carboxylAtom].element).toBe('C')
    expect(m.locantAtoms.map((l) => l.label)).toEqual(['1', '2', '3', '4', '5'])
  })
})

describe('resolveSpec', () => {
  it('pulls the substituent position into range and drops it when no carbon can carry it', () => {
    expect(resolveSpec(chain(1, 'CH3', 4)).substituent).toBe('none')
    expect(resolveSpec(chain(4, 'CH3', 9)).position).toBe(4)
    expect(resolveSpec(chain(4, 'CH3', 0)).position).toBe(2)
  })

  it('a second COOH needs two carbons, and blocks the far end for a substituent', () => {
    expect(resolveSpec(chain(1, 'none', 2, true)).diacid).toBe(false)
    expect(maxPosition(resolveSpec(chain(5, 'none', 2, true)))).toBe(4)
  })
})

describe('every control combination', () => {
  it('names every acid with a formula and no throw', () => {
    let count = 0
    for (let carbons = 1; carbons <= 6; carbons++)
      for (const substituent of ['none', 'CH3', 'Cl'] as const)
        for (let position = 2; position <= 6; position++)
          for (const diacid of [false, true]) {
            const m = acidModel(chain(carbons, substituent, position, diacid))
            expect(m.name.length).toBeGreaterThan(0)
            expect(m.formula).toMatch(/^[A-Z]/)
            count++
          }
    expect(count).toBe(6 * 3 * 5 * 2)
  })
})
