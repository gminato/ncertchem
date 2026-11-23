import { describe, expect, it } from 'vitest'
import {
  ASPIRIN_REACTION,
  ESTERIFICATION_ROUTES,
  ESTERIFICATION_STEP_COUNT,
  ESTERIFICATION_STEP_TITLES,
} from './esterification-steps'

describe('esterification-acetylation Scrolly step data', () => {
  it('defines all 4 steps matching the MDX Scrolly', () => {
    expect(ESTERIFICATION_STEP_COUNT).toBe(4)
    expect(ESTERIFICATION_STEP_TITLES).toHaveLength(4)
  })

  it('includes all three acylating routes with exact NCERT catalysts and byproducts', () => {
    expect(ESTERIFICATION_ROUTES).toHaveLength(3)
    const chloride = ESTERIFICATION_ROUTES.find((r) => r.id === 'acyl-chloride')
    expect(chloride?.catalystOrBase).toBe('Pyridine')
    expect(chloride?.byproduct).toBe('HCl')

    const acid = ESTERIFICATION_ROUTES.find((r) => r.id === 'carboxylic-acid')
    expect(acid?.catalystOrBase).toContain('H₂SO₄')
    expect(acid?.byproduct).toBe('H₂O')
    expect(acid?.reversible).toBe(true)
  })

  it('captures NCERT Aspirin synthesis product, byproduct, and medicinal properties', () => {
    expect(ASPIRIN_REACTION.reagent).toBe('(CH₃CO)₂O')
    expect(ASPIRIN_REACTION.product).toContain('Aspirin')
    expect(ASPIRIN_REACTION.byproduct).toBe('CH₃COOH')
    expect(ASPIRIN_REACTION.properties).toEqual(['Analgesic', 'Anti-inflammatory', 'Antipyretic'])
  })
})
