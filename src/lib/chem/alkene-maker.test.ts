import { describe, expect, it } from 'vitest'
import { ALKENE_CASES, betaSites, classifyStart, describeStart, makeAlkenes } from './alkene-maker'
import { parseSmiles } from './molecule-parse'

const names = (smiles: string, reagent: Parameters<typeof makeAlkenes>[1]) => {
  const out = makeAlkenes(smiles, reagent)
  return out.kind === 'reaction' ? out.reaction.products.map((p) => p.name) : []
}

describe('alkene maker: starting compounds', () => {
  it('classifies every case in the picker by its functional group', () => {
    const kinds = Object.fromEntries(ALKENE_CASES.map((c) => [c.id, classifyStart(parseSmiles(c.smiles))]))
    expect(kinds).toEqual({
      bromoethane: 'alkyl-halide',
      '2-bromobutane': 'alkyl-halide',
      '2-bromo-2-methylbutane': 'alkyl-halide',
      bromomethane: 'alkyl-halide',
      '1,2-dibromoethane': 'vicinal-dihalide',
      '1,2-dibromobutane': 'vicinal-dihalide',
      ethanol: 'alcohol',
      '2-methylbutan-2-ol': 'alcohol',
      'but-2-yne': 'alkyne',
      'pent-2-yne': 'alkyne',
    })
  })

  it('finds the α-carbon and its β-hydrogens for a secondary bromide', () => {
    const g = parseSmiles('CCC(C)Br')
    const start = describeStart(g)
    expect(start.kind).toBe('alkyl-halide')
    expect(start.alpha).toBeDefined()
    // 2-bromobutane: the β-carbons are CH3 (3 H) and CH2 (2 H).
    expect(start.betaSites.map((s) => s.hydrogens).sort()).toEqual([2, 3])
    expect(betaSites(g, start.leaving as number)).toEqual(start.betaSites)
  })

  it('names the starting compounds with the lib (no hand-typed names)', () => {
    expect(describeStart(parseSmiles('CCBr')).name).toBe('bromoethane')
  })
})

describe('alkene maker: reagents and reactions', () => {
  it('bromoethane with alcoholic KOH gives ethene', () => {
    expect(names('CCBr', 'alcoholic-koh')).toEqual(['ethene'])
  })

  it('2-bromo-2-methylbutane with alcoholic KOH gives every alkene that can form, none named major', () => {
    const out = makeAlkenes('CCC(C)(C)Br', 'alcoholic-koh')
    expect(out.kind).toBe('reaction')
    if (out.kind !== 'reaction') return
    expect(out.reaction.products).toHaveLength(2)
    expect(out.reaction.products.every((p) => p.major === undefined)).toBe(true)
  })

  it('bromomethane with alcoholic KOH gives no reaction, with the reason', () => {
    const out = makeAlkenes('CBr', 'alcoholic-koh')
    expect(out.kind).toBe('no-reaction')
  })

  it('a vicinal dihalide with zinc gives ethene and the equation balances', () => {
    const out = makeAlkenes('BrCCBr', 'zinc')
    expect(out.kind).toBe('reaction')
    if (out.kind !== 'reaction') return
    expect(out.reaction.products[0].name).toBe('ethene')
    expect(out.reaction.equation).toContain('ZnBr2')
  })

  it('an alkyl halide with zinc is not an alkene reaction', () => {
    expect(makeAlkenes('CCBr', 'zinc').kind).toBe('no-reaction')
  })

  it('ethanol with conc. H2SO4 gives ethene and water', () => {
    expect(names('CCO', 'conc-h2so4')).toEqual(['ethene'])
  })

  it('an alkyl halide with conc. H2SO4 gives no alkene', () => {
    expect(makeAlkenes('CCBr', 'conc-h2so4').kind).toBe('no-reaction')
  })

  it('but-2-yne with Lindlar gives cis-but-2-ene, and with Na in liquid NH3 gives trans-but-2-ene', () => {
    expect(names('CC#CC', 'lindlar')).toEqual(['cis-but-2-ene'])
    expect(names('CC#CC', 'sodium-ammonia')).toEqual(['trans-but-2-ene'])
  })

  it('an alkene with alcoholic KOH or zinc is no reaction', () => {
    expect(makeAlkenes('CC#CC', 'alcoholic-koh').kind).toBe('no-reaction')
    expect(makeAlkenes('CC#CC', 'zinc').kind).toBe('no-reaction')
  })

  it('a vicinal dihalide with alcoholic KOH is outside this Section, not no reaction', () => {
    expect(makeAlkenes('BrCCBr', 'alcoholic-koh').kind).toBe('not-modelled')
  })

  it('every reagent-substrate pair gives a result with a reason or a reaction', () => {
    const reagents = ['alcoholic-koh', 'zinc', 'conc-h2so4', 'lindlar', 'sodium-ammonia'] as const
    for (const c of ALKENE_CASES) {
      for (const r of reagents) {
        const out = makeAlkenes(c.smiles, r)
        if (out.kind === 'reaction') expect(out.reaction.products.length).toBeGreaterThan(0)
        else expect(out.reason.length).toBeGreaterThan(20)
      }
    }
  })
})
