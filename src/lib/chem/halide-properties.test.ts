import { describe, expect, it } from 'vitest'
import { ALKYL_GROUPS, HALIDE_HALOGENS, halideProperties } from './halide-properties'

describe('halideProperties', () => {
  it('covers every alkyl group and halogen pair', () => {
    for (const alkyl of ALKYL_GROUPS) for (const h of HALIDE_HALOGENS) expect(() => halideProperties(alkyl, h)).not.toThrow()
  })

  it('takes boiling points and parent alkanes from the data lib', () => {
    const p = halideProperties('methyl', 'Cl')
    expect(p.unicode).toBe('CH₃Cl')
    expect(p.bpK).toBe(249)
    expect(p.parent).toEqual({ unicode: 'CH₄', bpK: 112 })
  })

  it('marks gases below 298 K and liquids above it', () => {
    expect(halideProperties('methyl', 'Cl').phase).toBe('gas')
    expect(halideProperties('ethyl', 'Cl').phase).toBe('gas')
    expect(halideProperties('ethyl', 'Br').phase).toBe('liquid')
    expect(halideProperties('methyl', 'I').phase).toBe('liquid')
  })

  it('gives Table 6.3 densities only for the compounds the table lists', () => {
    expect(halideProperties('n-propyl', 'Br').density).toEqual({ gPerMl: 1.335, printed: '1.335' })
    expect(halideProperties('n-propyl', 'F').density).toBeNull()
    expect(halideProperties('methyl', 'Cl').density).toBeNull()
    expect(halideProperties('methyl', 'Cl').layer).toBeNull()
  })

  it('sinks the dense haloalkanes and floats n-propyl chloride', () => {
    expect(halideProperties('n-propyl', 'Br').layer).toBe('sinks')
    expect(halideProperties('n-propyl', 'I').layer).toBe('sinks')
    expect(halideProperties('n-propyl', 'Cl').layer).toBe('floats')
  })
})
