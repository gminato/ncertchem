import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { hydrocarbonFamily } from './hydrocarbon-family'

const family = (s: string) => hydrocarbonFamily(parseSmiles(s)).family

describe('hydrocarbonFamily', () => {
  it('sorts the open-chain and cyclic saturated hydrocarbons', () => {
    expect(family('CC')).toBe('Saturated')
    expect(family('C1CCCCC1')).toBe('Saturated')
  })

  it('sorts alkenes and alkynes, including a cyclic alkene', () => {
    expect(family('C=C')).toBe('Alkene')
    expect(family('CC(C)=C')).toBe('Alkene')
    expect(family('C1=CCCCC1')).toBe('Alkene')
    expect(family('CC#C')).toBe('Alkyne')
    expect(family('C#CCCC')).toBe('Alkyne')
  })

  it('sorts benzene and toluene as aromatic', () => {
    expect(family('C1=CC=CC=C1')).toBe('Aromatic')
    expect(family('CC1=CC=CC=C1')).toBe('Aromatic')
  })

  it('does not call a non-aromatic ring with double bonds aromatic: cyclohexa-1,3-diene is an alkene', () => {
    expect(family('C1=CC=CCC1')).toBe('Alkene')
  })

  it('refuses a molecule with an element other than carbon and hydrogen', () => {
    expect(() => hydrocarbonFamily(parseSmiles('CO'))).toThrow(RangeError)
  })
});
