import { describe, expect, it } from 'vitest'
import {
  ACIDITY_ORDERS,
  ACIDITY_STEP_COUNT,
  ACIDITY_STEP_TITLES,
  RESONANCE_COUNTS,
  SUBSTITUENT_PKA_ITEMS,
} from './acidity-steps'

describe('alcohol-phenol-acidity Scrolly step data', () => {
  it('defines all 5 steps matching the MDX Scrolly', () => {
    expect(ACIDITY_STEP_COUNT).toBe(5)
    expect(ACIDITY_STEP_TITLES).toHaveLength(5)
  })

  it('tracks all 5 phenol and phenoxide resonance contributors with 3 ring charge sites', () => {
    expect(RESONANCE_COUNTS.neutralPhenolForms).toBe(5)
    expect(RESONANCE_COUNTS.phenoxideForms).toBe(5)
    expect(RESONANCE_COUNTS.phenoxideRingChargeSites).toBe(3)
  })

  it('orders Table 7.3 substituent bars cleanly from p-NO2 (7.1) to ethanol (15.9)', () => {
    expect(SUBSTITUENT_PKA_ITEMS[0].pKa).toBe(7.1)
    expect(SUBSTITUENT_PKA_ITEMS[SUBSTITUENT_PKA_ITEMS.length - 1].pKa).toBe(15.9)
    for (let i = 1; i < SUBSTITUENT_PKA_ITEMS.length; i++) {
      expect(SUBSTITUENT_PKA_ITEMS[i].pKa).toBeGreaterThanOrEqual(SUBSTITUENT_PKA_ITEMS[i - 1].pKa)
    }
    expect(ACIDITY_ORDERS.bronsted).toBe('Phenols > Water > Alcohols')
  })
})
