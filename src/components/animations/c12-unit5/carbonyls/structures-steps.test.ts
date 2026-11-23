import { describe, expect, it } from 'vitest'
import { NCERT_CARBONYLS } from '@/lib/chem/ncert-c12-unit5-s8-tables'
import { CARBONYL_LAYOUTS, carbonylLayout } from './carbonyl-geometry'
import {
  CO_CARBONYL,
  MN_CARBONYL,
  SINGLE_METAL_CARBONYLS,
  STRUCTURES_STEP_COUNT,
  bridgeCountCaption,
  structuresStepVisual,
} from './structures-steps'

describe('carbonyl-structures Scrolly data (Class 12 Unit 5 Section 5.6)', () => {
  it('maps steps 0..2 cleanly and clamps out-of-range indices', () => {
    expect(STRUCTURES_STEP_COUNT).toBe(3)
    expect(structuresStepVisual(-2)).toBe('single-metal')
    expect(structuresStepVisual(0)).toBe('single-metal')
    expect(structuresStepVisual(1)).toBe('mn-dimer')
    expect(structuresStepVisual(2)).toBe('co-bridged')
    expect(structuresStepVisual(99)).toBe('co-bridged')
  })

  it('includes the three single-metal carbonyls and both dinuclear carbonyls from NCERT Fig. 5.13', () => {
    expect(SINGLE_METAL_CARBONYLS.map((c) => c.formula)).toEqual(['Ni(CO)4', 'Fe(CO)5', 'Cr(CO)6'])
    expect(MN_CARBONYL.formula).toBe('[Mn2(CO)10]')
    expect(CO_CARBONYL.formula).toBe('[Co2(CO)8]')
  })

  it('matches every carbonyl layout atom and ligand count against NCERT_CARBONYLS', () => {
    for (const c of NCERT_CARBONYLS) {
      const layout = carbonylLayout(c.formula)
      expect(CARBONYL_LAYOUTS[c.formula]).toBeDefined()
      expect(layout.metals).toHaveLength(c.metalCount)
      expect(layout.terminals).toHaveLength(c.terminalCO)
      expect(layout.bridges).toHaveLength(c.bridgingCO)
      expect(layout.terminals.length + layout.bridges.length).toBe(c.totalCO)
      expect(Boolean(layout.metalBond)).toBe(c.hasMetalMetalBond)
    }
  })

  it('formats the bridging + terminal CO count caption for [Co2(CO)8]', () => {
    expect(bridgeCountCaption(CO_CARBONYL)).toBe('2 bridging + 6 terminal = 8 CO groups')
  })
})
