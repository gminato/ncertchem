import { describe, expect, it } from 'vitest'
import { haloareneOutcome, startSpecies, type HaloProduct, type RouteId, type StartId } from './haloarene-maker'

const ARENES: StartId[] = ['benzene', 'toluene']
const AMINES: StartId[] = ['aniline', 'p-toluidine']

function products(start: StartId, route: RouteId): HaloProduct[] {
  const o = haloareneOutcome(start, route)
  if (o.kind !== 'products') throw new Error(`${start} + ${route} should give products`)
  return [...o.products]
}

describe('starting materials', () => {
  it('names and formulas come from the namer and the formula reader', () => {
    expect(startSpecies('benzene')).toMatchObject({ name: 'benzene', formula: 'C₆H₆' })
    expect(startSpecies('toluene')).toMatchObject({ name: 'methylbenzene', formula: 'C₇H₈' })
    expect(startSpecies('aniline')).toMatchObject({ name: 'aniline', formula: 'C₆H₇N' })
    expect(startSpecies('p-toluidine')).toMatchObject({ name: '4-methylaniline', formula: 'C₇H₉N' })
  })
})

describe('direct halogenation of arenes', () => {
  it('benzene gives one monohalobenzene for each halogen', () => {
    expect(products('benzene', 'cl2')).toMatchObject([{ role: 'single', name: 'chlorobenzene', formula: 'C₆H₅Cl' }])
    expect(products('benzene', 'br2')).toMatchObject([{ role: 'single', name: 'bromobenzene', formula: 'C₆H₅Br' }])
    expect(products('benzene', 'i2')).toMatchObject([{ role: 'single', name: 'iodobenzene', formula: 'C₆H₅I' }])
  })

  it('toluene gives only the ortho and para isomers, with names that carry those locants', () => {
    for (const route of ['cl2', 'br2', 'i2'] as const) {
      const [ortho, para] = products('toluene', route)
      expect(products('toluene', route)).toHaveLength(2)
      expect(ortho.role).toBe('ortho')
      expect(para.role).toBe('para')
      expect(ortho.name).toMatch(/-2-methylbenzene$/)
      expect(para.name).toMatch(/-4-methylbenzene$/)
      expect(ortho.formula).toBe(para.formula)
    }
    expect(products('toluene', 'cl2').map((p) => p.name)).toEqual(['1-chloro-2-methylbenzene', '1-chloro-4-methylbenzene'])
  })

  it('iodination names the oxidiser that removes HI', () => {
    const o = haloareneOutcome('benzene', 'i2')
    expect(o.kind).toBe('products')
    if (o.kind === 'products') {
      expect(o.condition).toMatch(/HNO₃/)
      expect(o.viaDiazonium).toBe(false)
    }
  })
})

describe('Sandmeyer route from amines', () => {
  it('aniline gives the chloro, bromo and iodo benzene', () => {
    expect(products('aniline', 'cu-cl')).toMatchObject([{ name: 'chlorobenzene', formula: 'C₆H₅Cl' }])
    expect(products('aniline', 'cu-br')).toMatchObject([{ name: 'bromobenzene', formula: 'C₆H₅Br' }])
    expect(products('aniline', 'ki')).toMatchObject([{ name: 'iodobenzene', formula: 'C₆H₅I' }])
  })

  it('p-toluidine keeps the methyl group para to the new halogen', () => {
    expect(products('p-toluidine', 'cu-cl')).toMatchObject([{ name: '1-chloro-4-methylbenzene', role: 'single' }])
    expect(products('p-toluidine', 'cu-br')).toMatchObject([{ name: '1-bromo-4-methylbenzene' }])
    expect(products('p-toluidine', 'ki')).toMatchObject([{ name: '1-iodo-4-methylbenzene', formula: 'C₇H₇I' }])
  })

  it('the Sandmeyer outcomes pass through a diazonium salt', () => {
    for (const start of AMINES) {
      for (const route of ['cu-cl', 'cu-br', 'ki'] as const) {
        const o = haloareneOutcome(start, route)
        expect(o.kind === 'products' && o.viaDiazonium).toBe(true)
      }
    }
  })
})

describe('verdicts', () => {
  it('fluorine is never drawn as a product', () => {
    for (const start of [...ARENES, ...AMINES]) {
      const o = haloareneOutcome(start, 'f2')
      expect(o.kind).toBe('verdict')
    }
  })

  it('an arene cannot take the Sandmeyer route, and an amine cannot take direct halogenation', () => {
    for (const start of ARENES) {
      for (const route of ['cu-cl', 'cu-br', 'ki'] as const) expect(haloareneOutcome(start, route).kind).toBe('verdict')
    }
    for (const start of AMINES) {
      for (const route of ['cl2', 'br2', 'i2'] as const) expect(haloareneOutcome(start, route).kind).toBe('verdict')
    }
  })

  it('every product has a formula that matches its name', () => {
    for (const start of [...ARENES, ...AMINES]) {
      for (const route of ['cl2', 'br2', 'i2', 'cu-cl', 'cu-br', 'ki'] as const) {
        const o = haloareneOutcome(start, route)
        if (o.kind !== 'products') continue
        for (const p of o.products) expect(p.formula).toMatch(/^C[₆₇]H[₅₇]/)
      }
    }
  })
})
