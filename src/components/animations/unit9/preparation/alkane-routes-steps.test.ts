import { describe, expect, it } from 'vitest'
import { ROUTE_STEP_COUNT, routeReactions, routeStep, subscript, wrapText } from './alkane-routes-steps'

describe('alkane-routes steps', () => {
  it('has six steps, four schemes and the Kolbe cell', () => {
    const kinds = Array.from({ length: ROUTE_STEP_COUNT }, (_, i) => routeStep(i).kind)
    expect(kinds).toEqual(['scheme', 'scheme', 'scheme', 'scheme', 'scheme', 'cell'])
  })

  it('clamps the step index', () => {
    expect(routeStep(-3).kind).toBe('scheme')
    expect(routeStep(99).kind).toBe('cell')
  })

  it('takes every reagent condition from the lib', () => {
    const r = routeReactions()
    expect(routeStep(0)).toMatchObject({ conditions: r.hydrogenate.conditions })
    expect(routeStep(5)).toMatchObject({ conditions: r.kolbe.conditions })
  })

  it('tracks the carbon count of the Wurtz mixture from the lib', () => {
    const s = routeStep(3)
    expect(s.kind).toBe('scheme')
    if (s.kind !== 'scheme') return
    expect(s.arithmetic).toBe('1 + 1 = 2, 1 + 4 = 5 and 4 + 4 = 8 carbons: one alkane per pair')
  })

  it('states one fewer carbon for decarboxylation', () => {
    expect(routeStep(4)).toMatchObject({ arithmetic: '4 carbons in the acid, 3 in the alkane: one carbon leaves as CO₂' })
  })

  it('doubles the alkyl part for Kolbe', () => {
    const s = routeStep(5)
    expect(s.kind).toBe('cell')
    if (s.kind !== 'cell') return
    expect(s.product).toBe('ethane')
    expect(s.arithmetic).toBe('2 × (2 − 1) = 2 carbons: each ethanoate loses CO₂, and two methyl radicals join')
  })

  it('lists the Wurtz products by name, from the lib', () => {
    const s = routeStep(3)
    expect(s).toMatchObject({ names: 'ethane, pentane, octane' })
  })

  it('wraps long text at words', () => {
    expect(wrapText('one two three four', 9)).toEqual(['one two', 'three', 'four'])
    expect(wrapText('supercalifragilistic', 5)).toEqual(['supercalifragilistic'])
  })

  it('writes formulas with subscripts', () => {
    expect(subscript('Na2CO3')).toBe('Na₂CO₃')
  })
})
