import { describe, expect, it } from 'vitest'
import { benzeneNodes, DRAWN_PAH, drawnPahs, namedOnly } from './carcinogens-steps'
import { NCERT_CARCINOGENS } from '@/lib/chem/ncert-unit9-tables'

describe('carcinogens Scrolly data', () => {
  it('draws 1,2-benzanthracene as C18H12 with four rings, and 1,2-benzpyrene as C20H12 with five', () => {
    const byName = Object.fromEntries(drawnPahs().map((p) => [p.name, p]))
    expect(byName['1,2-Benzanthracene']).toMatchObject({ formula: 'C18H12', rings: 4 })
    expect(byName['1,2-Benzpyrene']).toMatchObject({ formula: 'C20H12', rings: 5 })
  })

  it('names the three that are not drawn, so all five NCERT names appear', () => {
    expect(namedOnly()).toEqual(['3-Methylcholanthrene', '1,2,5,6-Dibenzanthracene', '9,10-Dimethyl-1,2-benzanthracene'])
    const all = [...Object.keys(DRAWN_PAH), ...namedOnly()].sort()
    expect(all).toEqual(NCERT_CARCINOGENS.map((c) => c.name).sort())
  })

  it('takes benzene and its balanced combustion from the lib', () => {
    const { graph, equation } = benzeneNodes()
    expect(graph.atoms.length).toBe(6)
    expect(equation).toBe('\\ce{2C6H6 + 15O2 -> 12CO2 + 6H2O}')
  })
})
