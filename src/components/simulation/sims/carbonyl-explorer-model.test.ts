import { describe, expect, it } from 'vitest'
import { NCERT_CARBONYLS } from '@/lib/chem/ncert-c12-unit5-s8-tables'
import {
  CARBONYL_OPTIONS,
  DEFAULT_CARBONYL_FORMULA,
  buildCarbonylReadout,
  selectCarbonyl,
} from './carbonyl-explorer-model'

describe('carbonyl-explorer model', () => {
  it('exposes all five NCERT Fig. 5.13 carbonyls and defaults to Ni(CO)4', () => {
    expect(CARBONYL_OPTIONS).toEqual(NCERT_CARBONYLS)
    expect(DEFAULT_CARBONYL_FORMULA).toBe('Ni(CO)4')
    expect(selectCarbonyl('unknown').formula).toBe('Ni(CO)4')
  })

  it('reports synergic status when both sigma and pi toggles are enabled', () => {
    const readout = buildCarbonylReadout({
      formula: 'Cr(CO)6',
      showSigma: true,
      showPi: true,
    })
    expect(readout.carbonyl.name).toBe('hexacarbonylchromium(0)')
    expect(readout.carbonyl.geometry).toBe('octahedral')
    expect(readout.isSynergic).toBe(true)
    expect(readout.bondStatusLabel).toBe('synergic: stronger M-CO bond')
    expect(readout.activeBondNotes.map((n) => n.kind)).toEqual(['sigma', 'pi'])
  })

  it('updates status label and active notes when toggles are switched individually or off', () => {
    const sigmaOnly = buildCarbonylReadout({
      formula: 'Fe(CO)5',
      showSigma: true,
      showPi: false,
    })
    expect(sigmaOnly.isSynergic).toBe(false)
    expect(sigmaOnly.bondStatusLabel).toBe('sigma donation only (C to M)')
    expect(sigmaOnly.activeBondNotes.map((n) => n.kind)).toEqual(['sigma'])

    const piOnly = buildCarbonylReadout({
      formula: '[Mn2(CO)10]',
      showSigma: false,
      showPi: true,
    })
    expect(piOnly.isSynergic).toBe(false)
    expect(piOnly.bondStatusLabel).toBe('pi back donation only (M to C)')
    expect(piOnly.activeBondNotes.map((n) => n.kind)).toEqual(['pi'])

    const neither = buildCarbonylReadout({
      formula: '[Co2(CO)8]',
      showSigma: false,
      showPi: false,
    })
    expect(neither.isSynergic).toBe(false)
    expect(neither.activeBondNotes).toHaveLength(0)
    expect(neither.carbonyl.bridgingCO).toBe(2)
    expect(neither.carbonyl.terminalCO).toBe(6)
    expect(neither.liveSummary).toContain('bridging CO: 2')
  })
})
