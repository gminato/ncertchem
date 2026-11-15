import { describe, expect, it } from 'vitest'
import { iupacName } from './iupac-organic'
import { parseSmiles } from './molecule-parse'
import { CARBON_HYBRIDS, SPOTTER_PRESETS, carbonHybrid, carbonIndices } from './carbon-shapes'

describe('hybridisation spotter presets', () => {
  it('offers at least ten molecules', () => {
    expect(SPOTTER_PRESETS.length).toBeGreaterThanOrEqual(10)
  })

  it('has unique ids', () => {
    const ids = SPOTTER_PRESETS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names every preset with the library, without throwing', () => {
    for (const p of SPOTTER_PRESETS) {
      expect(() => iupacName(parseSmiles(p.smiles)), p.id).not.toThrow()
    }
  })

  it('mixes sp³, sp² and sp carbons across the presets, and includes a molecule with a mix in one', () => {
    const seen = new Set<string>()
    let mixedCount = 0
    for (const p of SPOTTER_PRESETS) {
      const g = parseSmiles(p.smiles)
      const hybrids = carbonIndices(g).map((i) => carbonHybrid(g, i))
      hybrids.forEach((h) => seen.add(h))
      if (new Set(hybrids).size >= 2) mixedCount++
    }
    expect([...seen].sort()).toEqual([...CARBON_HYBRIDS].sort())
    expect(mixedCount).toBeGreaterThanOrEqual(10)
  })

  it('gives propene one sp³ carbon and two sp² carbons', () => {
    const g = parseSmiles('C=CC')
    const h = carbonIndices(g).map((i) => carbonHybrid(g, i))
    expect(h.filter((x) => x === 'sp2')).toHaveLength(2)
    expect(h.filter((x) => x === 'sp3')).toHaveLength(1)
  })
})
