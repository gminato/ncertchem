import { describe, expect, it } from 'vitest'
import {
  ANION_LIGAND_ROWS,
  CHARGE_BALANCE_EXAMPLE,
  METAL_ENDING_PAIRS,
  NAMING_STEPS,
  NEUTRAL_SPECIAL_ROWS,
  namingStepId,
} from './naming-steps'

describe('naming-steps', () => {
  it('maps 6 steps and clamps out-of-range indices', () => {
    expect(NAMING_STEPS).toHaveLength(6)
    expect(namingStepId(-1)).toBe('formula')
    expect(namingStepId(0)).toBe('formula')
    expect(namingStepId(1)).toBe('name')
    expect(namingStepId(2)).toBe('sorting')
    expect(namingStepId(3)).toBe('charge-names')
    expect(namingStepId(4)).toBe('charge-balance')
    expect(namingStepId(5)).toBe('metal-ending')
    expect(namingStepId(99)).toBe('metal-ending')
  })

  it('uses the NCERT anionic -o ligands and four special neutral ligands', () => {
    expect(ANION_LIGAND_ROWS.map((r) => r.fullName)).toEqual([
      'chlorido',
      'cyanido',
      'hydroxido',
      'oxalato',
    ])
    expect(NEUTRAL_SPECIAL_ROWS.map((r) => r.name)).toEqual([
      'aqua',
      'ammine',
      'carbonyl',
      'nitrosyl',
    ])
  })

  it('balances K4[Fe(CN)6] to Fe(+2) and zero net salt charge', () => {
    expect(CHARGE_BALANCE_EXAMPLE.metalState).toBe(2)
    expect(CHARGE_BALANCE_EXAMPLE.metalState + CHARGE_BALANCE_EXAMPLE.ligandTotal).toBe(
      CHARGE_BALANCE_EXAMPLE.entityCharge,
    )
    expect(CHARGE_BALANCE_EXAMPLE.counterTotal + CHARGE_BALANCE_EXAMPLE.entityCharge).toBe(0)
  })

  it('pairs iron(II)/ferrate(II) and silver(I)/argentate(I) with unchanged Roman numerals', () => {
    expect(METAL_ENDING_PAIRS[0].cationLabel).toBe('iron(II)')
    expect(METAL_ENDING_PAIRS[0].anionLabel).toBe('ferrate(II)')
    expect(METAL_ENDING_PAIRS[1].cationLabel).toBe('silver(I)')
    expect(METAL_ENDING_PAIRS[1].anionLabel).toBe('argentate(I)')
  })
})
