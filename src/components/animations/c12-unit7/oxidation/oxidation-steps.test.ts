import { describe, expect, it } from 'vitest'
import {
  ALPHA_H_SUMMARY,
  COPPER_573K_TRACKS,
  COPPER_TEMPERATURE_K,
  OXIDATION_STEPS,
  PCC_ALLYLIC_EXAMPLE,
} from './oxidation-steps'

describe('alcohol oxidation pathways Scrolly steps', () => {
  it('defines 4 oxidation and copper-catalysis steps', () => {
    expect(OXIDATION_STEPS).toHaveLength(4)
  })

  it('records 2, 1, 0 α-hydrogens across 1°, 2°, and 3° alcohols', () => {
    expect(ALPHA_H_SUMMARY.map((a) => a.alphaH)).toEqual([2, 1, 0])
  })

  it('uses NCERT PCC allylic alcohol example preserving C=C', () => {
    expect(PCC_ALLYLIC_EXAMPLE.substrate).toBe('CH₃-CH=CH-CH₂OH')
    expect(PCC_ALLYLIC_EXAMPLE.product).toBe('CH₃-CH=CH-CHO')
  })

  it('records 573 K heated copper split between dehydrogenation and dehydration', () => {
    expect(COPPER_TEMPERATURE_K).toBe(573)
    expect(COPPER_573K_TRACKS.map((r) => r.reactionKind)).toEqual([
      'Dehydrogenation',
      'Dehydrogenation',
      'Dehydration (0 α-H)',
    ])
    expect(COPPER_573K_TRACKS[2].byProduct).toBe('H₂O')
  })
})
