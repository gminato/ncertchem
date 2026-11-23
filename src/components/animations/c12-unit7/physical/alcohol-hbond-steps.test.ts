import { describe, expect, it } from 'vitest'
import {
  ALCOHOL_HBOND_STEP_COUNT,
  ALCOHOL_HBOND_STEP_TITLES,
  BRANCHING_ISOMERS,
  CHAIN_LENGTH_BARS,
  COMPARABLE_MASS_BARS,
  HBOND_ETHANOL_ETHER_GAP_K,
  HBOND_ROOM_TEMP_K,
} from './alcohol-hbond-steps'

describe('alcohol-hbond-boiling Scrolly steps', () => {
  it('matches the 4 MDX Steps', () => {
    expect(ALCOHOL_HBOND_STEP_COUNT).toBe(4)
    expect(ALCOHOL_HBOND_STEP_TITLES).toHaveLength(4)
  })

  it('keeps exact NCERT comparable-mass boiling points and 103 K gap', () => {
    expect(HBOND_ROOM_TEMP_K).toBe(298)
    expect(HBOND_ETHANOL_ETHER_GAP_K).toBe(103)
    expect(COMPARABLE_MASS_BARS.map((c) => [c.name, c.bpK, c.molecularMassU])).toEqual([
      ['Propane', 231, 44],
      ['Methoxymethane', 248, 46],
      ['Ethanol', 351, 46],
    ])
  })

  it('orders chain-length alcohols strictly upward and branching qualitatively downward', () => {
    expect(CHAIN_LENGTH_BARS.map((c) => [c.name, c.bpK])).toEqual([
      ['Methanol', 337],
      ['Ethanol', 351],
      ['Butan-1-ol', 390],
    ])
    expect(BRANCHING_ISOMERS[0].bpK).toBe(390)
    expect(BRANCHING_ISOMERS[2].bpK).toBeNull()
    expect(BRANCHING_ISOMERS[0].surfaceContactRating).toBeGreaterThan(
      BRANCHING_ISOMERS[2].surfaceContactRating
    )
  })
})
