import { describe, expect, it } from 'vitest'
import { acidModel, condensedChain, DEFAULT_SPEC, maxPosition, resolveSpec, type AcidSpec } from './acid-namer'
import { lonePairPoint } from '@/components/organic/frame'
import { skeletalFrame } from '@/components/organic/SkeletalFormula'
import { freeAngle } from '@/components/organic/layout'

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

describe('condensedChain: the line under the name', () => {
  const cond = (spec: Partial<AcidSpec>) => condensedChain({ ...chain(3), ...spec } as AcidSpec)

  it('reads from the COOH end, with the branch in brackets', () => {
    expect(cond({ carbons: 3 })).toBe('CH3CH2COOH')
    expect(cond({ carbons: 3, substituent: 'CH3', position: 2 })).toBe('CH3CH(CH3)COOH')
    expect(cond({ carbons: 3, substituent: 'Cl', position: 2 })).toBe('CH3CH(Cl)COOH')
    expect(cond({ carbons: 5, substituent: 'CH3', position: 3 })).toBe('CH3CH2CH(CH3)CH2COOH')
    expect(cond({ carbons: 1 })).toBe('HCOOH')
  })

  it('writes a second COOH at the start and the end of the chain', () => {
    expect(cond({ carbons: 2, diacid: true })).toBe('HOOCCOOH')
    expect(cond({ carbons: 6, substituent: 'Cl', position: 3, diacid: true })).toBe('HOOCCH2CH(Cl)CH2CH2COOH')
  })

  it('writes a branch on the terminal carbon as the longer chain it makes', () => {
    expect(cond({ carbons: 3, substituent: 'CH3', position: 3 })).toBe('CH3CH2CH2COOH')
    expect(cond({ carbons: 3, substituent: 'Cl', position: 3 })).toBe('ClCH2CH2COOH')
  })

  it('has as many carbons as the formula, for chain lengths 3 to 6 with and without each substituent', () => {
    for (let carbons = 3; carbons <= 6; carbons++) {
      for (const substituent of ['none', 'CH3', 'Cl'] as const) {
        for (const diacid of [false, true]) {
          for (let position = 2; position <= maxPosition({ ...chain(carbons), diacid }); position++) {
            const spec = { ...chain(carbons, substituent, position, diacid) }
            const m = acidModel(spec)
            const formulaC = Number(/C(?!l)(\d*)/.exec(m.formula)?.[1] || 1)
            const lineC = (m.condensed ?? '').replace(/Cl/g, '').match(/C/g)?.length ?? 0
            expect(lineC, `${m.name}: ${m.condensed}`).toBe(formulaC)
          }
        }
      }
    }
  })
})

describe('locant numbers sit beside their own carbons', () => {
  // Same scale as the simulation drawing (DRAW_SCALE), with the label placed as SkeletalFormula places it.
  it('each locant is nearest to the carbon it numbers, for every chain acid', () => {
    for (let carbons = 2; carbons <= 6; carbons++) {
      for (const substituent of ['none', 'CH3', 'Cl'] as const) {
        for (const diacid of [false, true]) {
          for (let position = 2; position <= maxPosition({ ...chain(carbons), diacid }); position++) {
            const m = acidModel(chain(carbons, substituent, position, diacid))
            const frame = skeletalFrame(m.graph, 62)
            for (const { atom, label } of m.locantAtoms) {
              const th = freeAngle(frame.points, frame.adj, atom, [])
              const at = lonePairPoint(frame.points[atom], th, 0.66 * 62)
              const nearest = frame.points.reduce(
                (best: number, p: { x: number; y: number }, i: number) => (Math.hypot(p.x - at.x, p.y - at.y) < Math.hypot(frame.points[best].x - at.x, frame.points[best].y - at.y) ? i : best),
                0,
              )
              expect(nearest, `${m.name} locant ${label}`).toBe(atom)
            }
          }
        }
      }
    }
  })
})
