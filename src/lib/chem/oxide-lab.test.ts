import { describe, expect, it } from 'vitest'
import {
  OXIDE_LAB_REACTIONS,
  PERIOD_THREE_OXIDES,
  atomImbalance,
  labOxideNature,
  reactionToCe,
  sideCounts,
  type Reaction,
} from './oxide-lab'
import { elementBySymbol, groupOf, periodOf } from './periodic-data'
import { NCERT_TABLE_3_9_VALENCE_TRENDS } from './ncert-unit3-tables'
import { molarMass } from './formula'

describe('numbers used in the Section', () => {
  it('molar mass of P4O10 is 283.9 g mol⁻¹ (Section 3.7 Check)', () => {
    expect(molarMass('P4O10')).toBeCloseTo(283.9, 1)
  })
})

function reactionFor(formula: keyof typeof OXIDE_LAB_REACTIONS, kind: 'water' | 'acid' | 'base'): Reaction {
  const reaction = OXIDE_LAB_REACTIONS[formula][kind]
  if (!reaction) throw new Error(`no ${kind} reaction for ${formula}`)
  return reaction
}

describe('period 3 oxides', () => {
  it('lists seven oxides for Na to Cl, in atomic-number order', () => {
    expect(PERIOD_THREE_OXIDES.map((o) => o.symbol)).toEqual(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl'])
    expect(PERIOD_THREE_OXIDES.map((o) => o.Z)).toEqual([11, 12, 13, 14, 15, 16, 17])
    for (const o of PERIOD_THREE_OXIDES) {
      expect(periodOf(o.Z)).toBe(3)
      expect(elementBySymbol(o.symbol)?.Z).toBe(o.Z)
    }
  })

  it('gives each oxide formula that NCERT Table 3.9 lists for its group', () => {
    for (const o of PERIOD_THREE_OXIDES) {
      const group = groupOf(o.Z) as number
      const column = NCERT_TABLE_3_9_VALENCE_TRENDS.rows.find((r) => r.group === group)
      expect(column, `group ${group}`).toBeDefined()
      const listed = column!.oxides.flatMap((entry) => entry.split(', '))
      expect(listed).toContain(o.formula)
    }
  })

  it('runs from basic on the left to acidic on the right, with Al2O3 amphoteric', () => {
    expect(labOxideNature('Na2O')).toBe('basic')
    expect(labOxideNature('Al2O3')).toBe('amphoteric')
    expect(labOxideNature('Cl2O7')).toBe('acidic')
    expect(labOxideNature('SO3')).toBe('acidic')
  })
})

describe('oxide reactions', () => {
  const cases: { oxide: keyof typeof OXIDE_LAB_REACTIONS; kind: 'water' | 'acid' | 'base' }[] = []
  for (const oxide of Object.keys(OXIDE_LAB_REACTIONS) as (keyof typeof OXIDE_LAB_REACTIONS)[]) {
    for (const kind of ['water', 'acid', 'base'] as const) {
      if (OXIDE_LAB_REACTIONS[oxide][kind]) cases.push({ oxide, kind })
    }
  }

  it.each(cases)('$oxide with $kind is atom-balanced', ({ oxide, kind }) => {
    expect(atomImbalance(reactionFor(oxide, kind))).toEqual({})
  })

  it('gives every oxide at least one reaction shown in the lab', () => {
    for (const o of PERIOD_THREE_OXIDES) {
      const set = OXIDE_LAB_REACTIONS[o.formula]
      expect(set.water ?? set.acid ?? set.base).not.toBeNull()
    }
  })

  it('shows SiO2 as insoluble in water and reacting only with base', () => {
    expect(OXIDE_LAB_REACTIONS.SiO2.water).toBeNull()
    expect(OXIDE_LAB_REACTIONS.SiO2.acid).toBeNull()
    expect(OXIDE_LAB_REACTIONS.SiO2.base).not.toBeNull()
  })

  it('writes the water equations in mhchem form', () => {
    expect(reactionToCe(reactionFor('Na2O', 'water'))).toBe('\\ce{Na2O + H2O -> 2NaOH}')
    expect(reactionToCe(reactionFor('SO3', 'water'))).toBe('\\ce{SO3 + H2O -> H2SO4}')
    expect(reactionToCe(reactionFor('P4O10', 'water'))).toBe('\\ce{P4O10 + 6H2O -> 4H3PO4}')
    expect(reactionToCe(reactionFor('Cl2O7', 'water'))).toBe('\\ce{Cl2O7 + H2O -> 2HClO4}')
    expect(reactionToCe(reactionFor('MgO', 'water'))).toBe('\\ce{MgO + H2O -> Mg(OH)2}')
  })

  it('shows the amphoteric Al2O3 reacting with both acid and base, not water', () => {
    expect(OXIDE_LAB_REACTIONS.Al2O3.acid).not.toBeNull()
    expect(OXIDE_LAB_REACTIONS.Al2O3.base).not.toBeNull()
    expect(OXIDE_LAB_REACTIONS.Al2O3.water).toBeNull()
  })
})

describe('atom counting', () => {
  it('counts atoms with coefficients and parentheses', () => {
    expect(sideCounts([{ formula: 'Mg(OH)2', coefficient: 2 }])).toEqual({ Mg: 2, O: 4, H: 4 })
  })

  it('reports the imbalance of an unbalanced equation', () => {
    const bad: Reaction = {
      reactants: [{ formula: 'Na2O', coefficient: 1 }, { formula: 'H2O', coefficient: 1 }],
      products: [{ formula: 'NaOH', coefficient: 1 }],
    }
    expect(atomImbalance(bad)).toEqual({ Na: 1, O: 1, H: 1 })
  })
})
