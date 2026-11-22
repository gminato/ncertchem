import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { parseSmiles, molecularFormula } from './molecule-parse'
import {
  DEFAULT_HALIDE_DESIGN,
  commonName,
  designFormula,
  designName,
  designNameSteps,
  designSmiles,
  isValidHalideDesign,
  type HalideDesign,
} from './halide-design'
import type { HalogenElement } from './haloalkanes'

const chain = (over: Partial<HalideDesign>): HalideDesign => ({ ...DEFAULT_HALIDE_DESIGN, ...over, shape: 'chain' })
const ring = (over: Partial<HalideDesign>): HalideDesign => ({ ...DEFAULT_HALIDE_DESIGN, ...over, shape: 'ring' })

describe('designSmiles', () => {
  it('writes the default design as 2-bromobutane', () => {
    expect(designSmiles(DEFAULT_HALIDE_DESIGN)).toBe('CC(Br)CC')
    expect(designName(DEFAULT_HALIDE_DESIGN)).toBe('2-bromobutane')
  })

  it('writes the ring patterns with the halogen on the right carbons', () => {
    expect(designSmiles(ring({ halogen: 'Cl', ringPattern: 'ortho' }))).toBe('ClC1=CC=CC=C1Cl')
    expect(designSmiles(ring({ halogen: 'Cl', ringPattern: 'meta' }))).toBe('ClC1=CC=CC(Cl)=C1')
    expect(designSmiles(ring({ halogen: 'Cl', ringPattern: 'para' }))).toBe('ClC1=CC=C(Cl)C=C1')
  })
})

describe('isValidHalideDesign', () => {
  it('keeps the chain and branch limits', () => {
    expect(isValidHalideDesign(chain({ chain: 7 }))).toBe(false)
    expect(isValidHalideDesign(chain({ chain: 4, halogenCarbon: 5 }))).toBe(false)
    expect(isValidHalideDesign(chain({ chain: 4, halogenCarbon: 2, methylCarbon: 1 }))).toBe(false)
    expect(isValidHalideDesign(chain({ chain: 4, halogenCarbon: 2, methylCarbon: 4 }))).toBe(false)
    expect(isValidHalideDesign(chain({ chain: 6, halogenCarbon: 2, methylCarbon: 4 }))).toBe(true)
  })
})

describe('every chain design', () => {
  const halogens: HalogenElement[] = ['F', 'Cl', 'Br', 'I']
  it('is named, and has the formula CnH(2n+1)X with one more carbon when there is a methyl', () => {
    for (const halogen of halogens) {
      for (let n = 1; n <= 6; n++) {
        for (let p = 1; p <= n; p++) {
          for (const methyl of [null, ...Array.from({ length: Math.max(0, n - 2) }, (_, k) => k + 2)]) {
            const d = chain({ halogen, chain: n, halogenCarbon: p, methylCarbon: methyl })
            const carbons = n + (methyl === null ? 0 : 1)
            const name = designName(d)
            expect(name, designSmiles(d)).toBeTruthy()
            const carbonPart = carbons === 1 ? 'C' : `C${carbons}`
            expect(designFormula(d)).toBe(`${carbonPart}H${2 * carbons + 1}${halogen}`)
            expect(molecularFormula(parseSmiles(designSmiles(d)))).toBe(designFormula(d))
            expect(designNameSteps(d).length, designSmiles(d)).toBeGreaterThan(0)
          }
        }
      }
    }
  })
})

describe('designName and commonName', () => {
  it('names the chain molecules as the namer does', () => {
    expect(designName(chain({ chain: 6, halogenCarbon: 2, methylCarbon: 4 }))).toBe('2-bromo-4-methylhexane')
    expect(designName(chain({ chain: 4, halogenCarbon: 2, methylCarbon: null }))).toBe('2-bromobutane')
  })

  it('gives the alkyl-group-plus-halide names where NCERT’s convention gives one', () => {
    expect(commonName(chain({ chain: 1, halogenCarbon: 1 }))).toBe('methyl bromide')
    expect(commonName(chain({ chain: 3, halogenCarbon: 1, halogen: 'Cl' }))).toBe('n-propyl chloride')
    expect(commonName(chain({ chain: 3, halogenCarbon: 2 }))).toBe('isopropyl bromide')
    expect(commonName(chain({ chain: 4, halogenCarbon: 2 }))).toBe('sec-butyl bromide')
    expect(commonName(chain({ chain: 5, halogenCarbon: 3 }))).toBeNull()
    expect(commonName(chain({ chain: 6, halogenCarbon: 2, methylCarbon: 4 }))).toBeNull()
  })

  it('gives o-, m- and p- common names for the dihalobenzenes and none for one halogen', () => {
    expect(commonName(ring({ ringPattern: 'mono' }))).toBeNull()
    expect(commonName(ring({ halogen: 'Cl', ringPattern: 'ortho' }))).toBe('o-dichlorobenzene')
    expect(commonName(ring({ halogen: 'Cl', ringPattern: 'para' }))).toBe('p-dichlorobenzene')
    expect(designName(ring({ halogen: 'Cl', ringPattern: 'meta' }))).toBe('1,3-dichlorobenzene')
  })

  it('agrees with the namer for every design it names', () => {
    const d = chain({ chain: 4, halogenCarbon: 2 })
    expect(designName(d)).toBe(iupacNameFromSmiles(designSmiles(d)))
  })
})
