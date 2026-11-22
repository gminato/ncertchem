import { describe, expect, it } from 'vitest'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  FACTS,
  SUBSTRATE_SMILES,
  substrateBetaHydrogens,
  substrateSites,
  zaitsevRows,
} from './elimination-steps'

describe('elimination Scrolly substrate', () => {
  it('finds the α carbon and the two β carbons of 2-bromopentane', () => {
    const g = parseSmiles(SUBSTRATE_SMILES)
    const s = substrateSites(g)
    expect(g.atoms[s.bromine].element).toBe('Br')
    expect(g.atoms[s.alpha].element).toBe('C')
    expect(new Set([s.c1, s.c3]).size).toBe(2)
    expect(s.c4).not.toBe(s.alpha)
    expect(s.c5).not.toBe(s.c3)
  })

  it('counts five β-hydrogens across the two alkenes (2 + 3)', () => {
    expect(substrateBetaHydrogens()).toBe(5)
  })
})

describe('Zaitsev rows', () => {
  it('puts pent-2-ene first with 2 alkyl groups, the Zaitsev product, and NCERT 81 %', () => {
    const rows = zaitsevRows()
    expect(rows[0]).toMatchObject({ name: 'pent-2-ene', alkylGroups: 2, zaitsev: true, percent: 81 })
  })

  it('gives pent-1-ene one alkyl group and NCERT 19 %', () => {
    const rows = zaitsevRows()
    expect(rows[1]).toMatchObject({ name: 'pent-1-ene', alkylGroups: 1, zaitsev: false, percent: 19 })
  })
})

describe('reagent facts', () => {
  it('names ethane C2H6 and butane C4H10 from the libs', () => {
    expect(FACTS.ethane()).toMatchObject({ name: 'ethane', formula: 'C2H6' })
    expect(FACTS.butane()).toMatchObject({ name: 'butane', formula: 'C4H10' })
  })

  it('names bromoethane C2H5Br', () => {
    expect(FACTS.bromoethane()).toMatchObject({ name: 'bromoethane', formula: 'C2H5Br' })
  })
})
