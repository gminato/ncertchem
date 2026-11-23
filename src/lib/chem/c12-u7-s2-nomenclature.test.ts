import { describe, expect, it } from 'vitest'
import {
  ALCOHOL_PRESETS,
  getAlcoholNomenclature,
  getEtherPairNomenclature,
  getPhenolNomenclature,
  getSpecialEtherNomenclature,
  type EtherLeftGroup,
  type EtherRightGroup,
} from './c12-u7-s2-nomenclature'
import { parseSmiles } from './molecule-parse'

function joinTokens(entry: { iupacTokens: { text: string }[] }): string {
  return entry.iupacTokens.map((t) => t.text).join('')
}

describe('Section 7.2 nomenclature model', () => {
  it('covers all 11 alcohol skeletons with valid SMILES, NCERT names, and consistent IUPAC tokens', () => {
    expect(ALCOHOL_PRESETS).toHaveLength(11)
    for (const preset of ALCOHOL_PRESETS) {
      const entry = getAlcoholNomenclature(preset.id)
      expect(entry.iupacName).toBe(preset.label)
      expect(joinTokens(entry)).toBe(entry.iupacName)
      expect(() => parseSmiles(entry.smiles)).not.toThrow()
      expect(entry.steps).toHaveLength(3)
      // Every structure has at least one parent atom and one functional atom
      expect(entry.structure.atoms.some((a) => a.role === 'parent')).toBe(true)
      expect(entry.structure.atoms.some((a) => a.role === 'functional')).toBe(true)
    }

    expect(getAlcoholNomenclature('2-methylpropan-1-ol').commonName).toBe('Isobutyl alcohol')
    expect(getAlcoholNomenclature('2-methylpropan-2-ol').commonName).toBe('tert-Butyl alcohol')
    expect(getAlcoholNomenclature('ethane-1,2-diol').commonName).toBe('Ethylene glycol')
    expect(getAlcoholNomenclature('propane-1,2,3-triol').commonName).toBe('Glycerol')
    expect(getAlcoholNomenclature('cyclohexanol').commonName).toBeNull()
    expect(getAlcoholNomenclature('2-methylcyclopentanol').commonName).toBeNull()
  })

  it('covers phenol, o/m/p-cresols, and all three benzenediols', () => {
    const phenol = getPhenolNomenclature('none', 'ortho')
    expect(phenol.commonName).toBe('Phenol')
    expect(phenol.iupacName).toBe('Phenol')
    expect(phenol.molecularFormula).toBe('C₆H₆O')

    expect(getPhenolNomenclature('methyl', 'ortho')).toMatchObject({
      commonName: 'o-Cresol',
      iupacName: '2-Methylphenol',
      molecularFormula: 'C₇H₈O',
    })
    expect(getPhenolNomenclature('methyl', 'meta')).toMatchObject({
      commonName: 'm-Cresol',
      iupacName: '3-Methylphenol',
    })
    expect(getPhenolNomenclature('methyl', 'para')).toMatchObject({
      commonName: 'p-Cresol',
      iupacName: '4-Methylphenol',
    })

    expect(getPhenolNomenclature('hydroxyl', 'ortho')).toMatchObject({
      commonName: 'Catechol',
      iupacName: 'Benzene-1,2-diol',
      molecularFormula: 'C₆H₆O₂',
    })
    expect(getPhenolNomenclature('hydroxyl', 'meta')).toMatchObject({
      commonName: 'Resorcinol',
      iupacName: 'Benzene-1,3-diol',
    })
    expect(getPhenolNomenclature('hydroxyl', 'para')).toMatchObject({
      commonName: 'Hydroquinone',
      commonAlt: 'Quinol',
      iupacName: 'Benzene-1,4-diol',
    })
  })

  it('matches all 10 NCERT Table 7.2 ethers and handles every valid (R1, R2) combination', () => {
    const lefts: EtherLeftGroup[] = ['methyl', 'ethyl', 'isopropyl', 'phenyl']
    const rights: EtherRightGroup[] = ['methyl', 'ethyl', 'propyl', 'isopentyl', 'heptyl', 'phenyl']

    for (const r1 of lefts) {
      for (const r2 of rights) {
        if (r1 === 'phenyl' && r2 === 'phenyl') {
          expect(() => getEtherPairNomenclature(r1, r2)).toThrow()
          continue
        }
        const entry = getEtherPairNomenclature(r1, r2)
        expect(() => parseSmiles(entry.smiles)).not.toThrow()
        expect(joinTokens(entry)).toBe(entry.iupacName)
        expect(entry.steps).toHaveLength(3)
        expect(entry.commonName).toBeTruthy()
      }
    }

    // Specific Table 7.2 spot checks
    expect(getEtherPairNomenclature('methyl', 'methyl')).toMatchObject({
      commonName: 'Dimethyl ether',
      iupacName: 'Methoxymethane',
    })
    expect(getEtherPairNomenclature('ethyl', 'ethyl')).toMatchObject({
      commonName: 'Diethyl ether',
      iupacName: 'Ethoxyethane',
    })
    expect(getEtherPairNomenclature('methyl', 'propyl')).toMatchObject({
      commonName: 'Methyl n-propyl ether',
      iupacName: '1-Methoxypropane',
    })
    expect(getEtherPairNomenclature('phenyl', 'methyl')).toMatchObject({
      commonName: 'Methyl phenyl ether',
      commonAlt: 'Anisole',
      iupacName: 'Methoxybenzene',
      iupacAlt: 'Anisole',
    })
    expect(getEtherPairNomenclature('phenyl', 'ethyl')).toMatchObject({
      commonName: 'Ethyl phenyl ether',
      commonAlt: 'Phenetole',
      iupacName: 'Ethoxybenzene',
    })
    expect(getEtherPairNomenclature('phenyl', 'heptyl')).toMatchObject({
      commonName: 'Heptyl phenyl ether',
      iupacName: '1-Phenoxyheptane',
      parentRuleBadge: 'Heptyl (7 C) > Phenyl (6 C)',
    })
    expect(getEtherPairNomenclature('isopropyl', 'methyl')).toMatchObject({
      commonName: 'Methyl isopropyl ether',
      iupacName: '2-Methoxypropane',
      condensedFormula: '(CH₃)₂CHOCH₃',
    })
    for (const r2 of rights) {
      expect(getEtherPairNomenclature('isopropyl', r2).condensedFormula.startsWith('(CH₃)₂CHO')).toBe(true)
    }
    expect(getEtherPairNomenclature('phenyl', 'isopentyl')).toMatchObject({
      commonName: 'Phenyl isopentyl ether',
      iupacName: '3-Methylbutoxybenzene',
      iupacAlt: '(3-Methylbutoxy)benzene',
    })

    const dimethoxy = getSpecialEtherNomenclature('1,2-dimethoxyethane')
    expect(dimethoxy.iupacName).toBe('1,2-Dimethoxyethane')
    expect(dimethoxy.commonName).toBeNull()
    expect(joinTokens(dimethoxy)).toBe(dimethoxy.iupacName)

    const cycloEther = getSpecialEtherNomenclature('2-ethoxy-1,1-dimethylcyclohexane')
    expect(cycloEther.iupacName).toBe('2-Ethoxy-1,1-dimethylcyclohexane')
    expect(cycloEther.commonName).toBeNull()
    expect(joinTokens(cycloEther)).toBe(cycloEther.iupacName)
  })
})
