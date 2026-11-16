import { describe, expect, it } from 'vitest'
import { alkeneSmiles, geometricIsomers } from './alkene-geometry'

describe('geometricIsomers', () => {
  it('gives cis and trans but-2-ene from a methyl and a hydrogen on each carbon', () => {
    const v = geometricIsomers(['CH3', 'H'], ['CH3', 'H'])
    expect(v.exists).toBe(true)
    const names = v.isomers.map((i) => i.name).sort()
    expect(names).toEqual(['cis-but-2-ene', 'trans-but-2-ene'])
  })

  it('makes the cis isomer polar and the trans isomer non-polar for but-2-ene', () => {
    const v = geometricIsomers(['CH3', 'H'], ['CH3', 'H'])
    const cis = v.isomers.find((i) => i.descriptor === 'cis')!
    const trans = v.isomers.find((i) => i.descriptor === 'trans')!
    expect(cis.polar).toBe(true)
    expect(trans.polar).toBe(false)
  })

  it('names 1,2-dichloroethene cis and trans, both polar only for the cis form', () => {
    const v = geometricIsomers(['Cl', 'H'], ['Cl', 'H'])
    expect(v.isomers.map((i) => i.name).sort()).toEqual(['cis-1,2-dichloroethene', 'trans-1,2-dichloroethene'])
    expect(v.isomers.find((i) => i.descriptor === 'cis')!.polar).toBe(true)
    expect(v.isomers.find((i) => i.descriptor === 'trans')!.polar).toBe(false)
  })

  it('has no geometrical isomers when one carbon carries two identical groups', () => {
    const v = geometricIsomers(['CH3', 'CH3'], ['CH3', 'H'])
    expect(v.exists).toBe(false)
    expect(v.isomers).toHaveLength(0)
    expect(v.reason).toContain('two CH₃')
  })

  it('has no geometrical isomers for 2-methylpropene (two methyls on one carbon)', () => {
    const v = geometricIsomers(['CH3', 'CH3'], ['H', 'H'])
    expect(v.exists).toBe(false)
  })

  it('uses E and Z when a carbon carries two different non-hydrogen groups', () => {
    const v = geometricIsomers(['Cl', 'CH3'], ['Br', 'H'])
    expect(v.exists).toBe(true)
    const descriptors = v.isomers.map((i) => i.descriptor).sort()
    expect(descriptors).toEqual(['E', 'Z'])
    expect(v.isomers.every((i) => i.name.startsWith('(E)-') || i.name.startsWith('(Z)-'))).toBe(true)
  })

  it('puts the higher-ranked groups on the same side for Z', () => {
    const v = geometricIsomers(['Cl', 'CH3'], ['Br', 'H'])
    const z = v.isomers.find((i) => i.descriptor === 'Z')!
    const up = z.placed.filter((p) => p.at.y > 0).map((p) => p.group).sort()
    expect(up).toEqual(['Br', 'Cl'])
  })

  it('builds the SMILES from the chosen groups', () => {
    expect(alkeneSmiles(['CH3', 'H'], ['CH3', 'H'])).toBe('C(C)=C(C)')
    expect(alkeneSmiles(['H', 'H'], ['Cl', 'Cl'])).toBe('C=C(Cl)(Cl)')
    expect(alkeneSmiles(['COOH', 'H'], ['H', 'H'])).toBe('C(C(=O)O)=C')
  })

  it('gives cis- and trans-pent-2-ene, but no isomers for but-1-ene or 2-methylbut-2-ene (Section 9.3 checks)', () => {
    expect(geometricIsomers(['CH3', 'H'], ['C2H5', 'H']).isomers.map((i) => i.name).sort()).toEqual([
      'cis-pent-2-ene',
      'trans-pent-2-ene',
    ])
    expect(geometricIsomers(['H', 'H'], ['CH3', 'H']).exists).toBe(false)
    expect(geometricIsomers(['CH3', 'CH3'], ['CH3', 'H']).exists).toBe(false)
  })
})
