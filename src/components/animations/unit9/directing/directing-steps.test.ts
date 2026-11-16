import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_ORIENTING_GROUPS } from '@/lib/chem/ncert-unit9-tables'
import { groupColumns, groupLabel, extraRow, nitroSpecies, PHENOL, phenolAttacks, sigmaRow, DIRECTING_STEP_KINDS } from './directing-steps'
import { speciesForms, hybridOf } from '@/lib/chem/resonance-species'

describe('directing Scrolly data', () => {
  it('has five Steps in order', () => {
    expect(DIRECTING_STEP_KINDS).toEqual(['donor', 'withdrawer', 'sigma', 'extra', 'table'])
  })

  it('builds phenol contributors with the formula of phenol (C6H6O), and the oxonium form carries a + on O', () => {
    for (const s of PHENOL.forms) expect(molecularFormula(parseSmiles(s)).replace('+', '')).toMatch(/^C6H6O/)
    expect(speciesForms(PHENOL)).toHaveLength(3)
    expect(hybridOf(PHENOL).charges.map((c) => c.label)).toEqual(['δ−', 'δ−', 'δ−'])
  })

  it('draws the three σ-complexes with the NO₂ group and a net +1 charge', () => {
    const row = sigmaRow()
    expect(row.map((r) => r.label)).toEqual(['ortho attack', 'meta attack', 'para attack'])
    for (const r of row) expect(r.formula).toBe('C6H6NO3+') // phenol C6H6O plus NO2+
  })

  it('gives the oxonium contributor only for the ortho and para attacks', () => {
    const row = extraRow()
    expect(row.map((r) => r.oxonium)).toEqual([true, false, true])
  })

  it('takes the attacks from the lib positions', () => {
    const a = phenolAttacks()
    expect(a.ortho).toBeTypeOf('number')
    expect(a.meta).not.toBe(a.ortho)
    expect(nitroSpecies().id).toBe('nitrobenzene')
  })

  it('formats group labels with subscripts and a true minus sign', () => {
    expect(groupLabel('-NHCOCH3')).toBe('−NHCOCH₃')
    expect(groupLabel('-C2H5')).toBe('−C₂H₅')
  })

  it('sorts the NCERT groups into the three columns, and every group is in one', () => {
    const cols = groupColumns()
    const all = [...cols.activating, ...cols.halogens, ...cols.meta].map((g) => g.group)
    for (const g of NCERT_ORIENTING_GROUPS) expect(all).toContain(g.group)
    expect(cols.halogens.map((g) => g.group)).toEqual(['-F', '-Cl', '-Br', '-I'])
  })
})
