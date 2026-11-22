import { describe, expect, it } from 'vitest'
import { LAB_METALS, cycleSteps, labReadout, signedKj, signedVolt } from './electrode-lab-model'

describe('electrode lab model', () => {
  it('gives Table 4.4 cycle totals for every metal, all positive', () => {
    const sums = Object.fromEntries(LAB_METALS.map((m) => [m, labReadout(m).sum]))
    expect(sums).toEqual({ Ti: 568, V: 684, Cr: 718, Mn: 643, Fe: 743, Co: 750, Ni: 798, Cu: 921, Zn: 711 })
    expect(Math.min(...Object.values(sums))).toBeGreaterThan(0)
  })

  it('makes Cu the largest cycle total in the series', () => {
    const top = LAB_METALS.reduce((a, b) => (labReadout(b).sum > labReadout(a).sum ? b : a))
    expect(top).toBe('Cu')
  })

  it('splits the cycle into atomisation, IE1 + IE2 and hydration (Cu: 339, 2703, −2121)', () => {
    const cu = labReadout('Cu')
    expect(cycleSteps(cu)).toEqual([339, 2703, -2121])
    expect(cu.atomisation + cu.ionisation + cu.hydration).toBe(cu.sum)
  })

  it('bubbles only for a negative E°, never for Cu, and not for passive Ti and V', () => {
    expect(labReadout('Cu').gas).toBe('none-positive')
    expect(labReadout('Zn').gas).toBe('bubbles')
    expect(labReadout('Ni').gas).toBe('bubbles')
    expect(labReadout('Ti').gas).toBe('passive')
    expect(labReadout('V').gas).toBe('passive')
  })

  it('formats signs with a real minus', () => {
    expect(signedKj(921)).toBe('+921')
    expect(signedKj(-2121)).toBe('−2121')
    expect(signedVolt(0.34)).toBe('+0.34')
    expect(signedVolt(-1.63)).toBe('−1.63')
  })
})
