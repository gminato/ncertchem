import { describe, expect, it } from 'vitest'
import { alkyneFromVicinalDihalide, dibromobutaneExample, eliminateHX } from './alkyne-preparation'
import { parseSmiles } from './molecule-parse'
import { molecularFormula } from './molecule-parse'

describe('alkyne from a vicinal dihalide, two steps (NCERT 9.4.3)', () => {
  it('2,3-dibromobutane gives 2-bromobut-2-ene, then but-2-yne', () => {
    const r = dibromobutaneExample()
    expect(r.steps[0].reactant).toBe('2,3-dibromobutane')
    expect(r.steps[0].product).toBe('2-bromobut-2-ene')
    expect(r.steps[1].product).toBe('but-2-yne')
    expect(r.alkyne).toBe('but-2-yne')
  })

  it('step 1 is alcoholic KOH removing one HBr; step 2 is NaNH2 removing the second HBr', () => {
    const [s1, s2] = dibromobutaneExample().steps
    expect(s1.equation).toBe('\\ce{CH3CHBrCHBrCH3 + KOH -> CH3CH=CBrCH3 + KBr + H2O}')
    expect(s1.conditions).toBe('alcoholic KOH, heat')
    expect(s2.equation).toBe('\\ce{CH3CH=CBrCH3 + NaNH2 -> CH3C#CCH3 + NaBr + NH3}')
  })

  it('the intermediate keeps the bromine on an alkene carbon (vinylic), and the product is C4H6', () => {
    const r = dibromobutaneExample()
    expect(molecularFormula(r.steps[0].productGraph)).toBe('C4H7Br')
    expect(molecularFormula(r.alkyneGraph)).toBe('C4H6')
    const triple = r.alkyneGraph.bonds.filter((b) => b.order === 3)
    expect(triple).toHaveLength(1)
  })

  it('rejects two halogens that are not on adjacent carbons', () => {
    expect(() => alkyneFromVicinalDihalide(parseSmiles('BrCCC(Br)C'))).toThrow(RangeError)
  })

  it('refuses an elimination from a carbon that is not bonded to the halogen carbon', () => {
    const g = parseSmiles('CC(Br)C(Br)C')
    // Atom 2 is Br on carbon 1; carbon 5 (the far CH3) is not bonded to carbon 1.
    expect(() => eliminateHX(g, 2, 5)).toThrow(RangeError)
  })
})
