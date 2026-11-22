import { describe, expect, it } from 'vitest'
import { balanceCheck, parseEquation } from './dblock'
import { CATALYST_REPRESENTATIVE_EQUATIONS } from './dblock-series-data'
import { CATALYST_PROCESSES, processById, propertyLabel, toMhchem } from './industrial-catalyst'

describe('industrial catalyst processes', () => {
  it('offers the five processes in the Simulation order', () => {
    expect(CATALYST_PROCESSES.map((p) => p.id)).toEqual(['contact', 'haber', 'ziegler', 'wacker', 'hydrogenation'])
  })

  it('takes Contact, Haber and Wacker equations from the lib, balanced', () => {
    expect(processById('contact').equation).toBe('2SO2 + O2 -> 2SO3')
    expect(processById('haber').equation).toBe('N2 + 3H2 -> 2NH3')
    expect(processById('wacker').equation).toBe('2C2H4 + O2 -> 2CH3CHO')
    for (const id of ['contact', 'haber', 'wacker'] as const) {
      const p = processById(id)
      expect(p.equationKind).toBe('overall')
      expect(balanceCheck(p.equation.replace(' -> ', ' → ')).balanced).toBe(true)
    }
  })

  it('uses the Wacker process with ethene, not ethyne (errata)', () => {
    const wacker = processById('wacker')
    expect(wacker.feeds.map((f) => f.label)).toContain('C₂H₄')
    expect(wacker.feeds.map((f) => f.label)).not.toContain('C₂H₂')
  })

  it('takes Ziegler and hydrogenation from the representative equations, labelled as such', () => {
    const ziegler = processById('ziegler')
    const hydro = processById('hydrogenation')
    expect(ziegler.equation).toBe(CATALYST_REPRESENTATIVE_EQUATIONS['Ziegler catalysts (polyethylene)'].mhchem)
    expect(hydro.equation).toBe(CATALYST_REPRESENTATIVE_EQUATIONS['Hydrogenation of fats'].mhchem)
    expect(ziegler.equationKind).toBe('representative')
    expect(hydro.equationKind).toBe('representative')
    expect(ziegler.equationNote).toMatch(/representative/)
    expect(hydro.equationNote).toMatch(/representative/)
  })

  it('assigns the property that matters: oxidation state for Contact and Wacker, adsorption otherwise', () => {
    expect(processById('contact').property).toBe('oxidation-state')
    expect(processById('wacker').property).toBe('oxidation-state')
    expect(processById('haber').property).toBe('surface-adsorption')
    expect(processById('ziegler').property).toBeNull()
    expect(processById('hydrogenation').property).toBe('surface-adsorption')
    expect(propertyLabel('oxidation-state')).toBe('Variable oxidation state')
    expect(propertyLabel('surface-adsorption')).toBe('Surface adsorption')
  })

  it('shows oxidation-state chips only for the two oxidation-state processes', () => {
    expect(processById('contact').oxidationStates).toEqual(['V(V)', 'V(IV)'])
    expect(processById('wacker').oxidationStates).toEqual(['Pd(II)', 'Pd(0)'])
    expect(processById('haber').oxidationStates).toBeNull()
  })

  it('gives feed and product species with subscripts and lib coefficients', () => {
    expect(processById('haber').feeds).toEqual([
      { label: 'N₂', count: 1, shape: 'molecule' },
      { label: 'H₂', count: 3, shape: 'molecule' },
    ])
    expect(processById('haber').products).toEqual([{ label: 'NH₃', count: 2, shape: 'molecule' }])
    expect(processById('contact').products[0]!.label).toBe('SO₃')
  })

  it('cites NCERT pages 113 and 114 for the lib-backed processes', () => {
    expect(processById('contact').page).toBe(113)
    expect(processById('wacker').page).toBe(114)
  })

  it('throws for an unknown process id', () => {
    expect(() => processById('nope' as never)).toThrow(RangeError)
  })
})

describe('toMhchem', () => {
  it('omits coefficients of 1 and keeps the arrow', () => {
    expect(toMhchem(parseEquation('N₂ + 3H₂ → 2NH₃'))).toBe('N2 + 3H2 -> 2NH3')
  })
})
