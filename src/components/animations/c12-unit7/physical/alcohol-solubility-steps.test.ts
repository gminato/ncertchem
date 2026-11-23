import { describe, expect, it } from 'vitest'
import {
  ALCOHOL_SOLUBILITY_STEP_COUNT,
  ALCOHOL_SOLUBILITY_STEP_TITLES,
  SOLUBILITY_STEP_COMPOUNDS,
} from './alcohol-solubility-steps'

describe('alcohol-water-solubility Scrolly steps', () => {
  it('matches the 3 MDX Steps', () => {
    expect(ALCOHOL_SOLUBILITY_STEP_COUNT).toBe(3)
    expect(ALCOHOL_SOLUBILITY_STEP_TITLES).toHaveLength(3)
  })

  it('tracks exact NCERT solubility labels across lower alcohols, butan-1-ol and phenol', () => {
    const byId = Object.fromEntries(SOLUBILITY_STEP_COMPOUNDS.map((c) => [c.id, c]))
    expect(byId['propan-1-ol'].hBondsWithWater).toBe(3)
    expect(byId['methanol'].statusLabel).toBe('Miscible in all proportions')
    expect(byId['ethanol'].statusLabel).toBe('Miscible in all proportions')
    expect(byId['butan-1-ol'].statusLabel).toBe('9 g per 100 mL water')
    expect(byId['phenol'].statusLabel).toBe('Limited solubility')
  })
})
