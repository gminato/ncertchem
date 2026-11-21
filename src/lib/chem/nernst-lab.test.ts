import { describe, expect, it } from 'vitest'
import { electrodePotential, hydrogenElectrodePotential, nernstLog10Slope } from './nernst'
import {
  NERNST_CELLS,
  cellPotentialAtLogQ,
  nernstCell,
  readNernst,
  slotConcentration,
  standardPotentialOf,
} from './nernst-lab'

describe('Nernst Lab cells', () => {
  it('takes standard potentials from Table 2.1', () => {
    expect(standardPotentialOf('Zn2+/Zn')).toBe(-0.76)
    expect(standardPotentialOf('Cu2+/Cu')).toBe(0.34)
    expect(standardPotentialOf('Ag+/Ag')).toBe(0.8)
  })

  it('gives E°cell from the couples: Daniell 1.10 V, Cu–Ag 0.46 V, Zn vs SHE 0.76 V, concentration 0 V', () => {
    expect(nernstCell('daniell').e0Cell).toBeCloseTo(1.1, 10)
    expect(nernstCell('cu-ag').e0Cell).toBeCloseTo(0.46, 10)
    expect(nernstCell('zn-she').e0Cell).toBeCloseTo(0.76, 10)
    expect(nernstCell('concentration').e0Cell).toBe(0)
  })

  it('has n = 2 for all four cells and anode-left notation', () => {
    for (const cell of NERNST_CELLS) expect(cell.n).toBe(2)
    expect(nernstCell('daniell').notation.startsWith('Zn(s) |')).toBe(true)
  })

  it('reads 1.10 V for the Daniell cell at unit concentrations', () => {
    const r = readNernst(nernstCell('daniell'), [0, 0])
    expect(r.q).toBeCloseTo(1, 10)
    expect(r.eCell).toBeCloseTo(1.1, 10)
  })

  it('raises Ecell when [Cu²⁺] rises and lowers it when [Zn²⁺] rises (Daniell)', () => {
    const cell = nernstCell('daniell')
    const base = readNernst(cell, [0, 0]).eCell
    expect(readNernst(cell, [0, 1]).eCell).toBeGreaterThan(base)
    expect(readNernst(cell, [1, 0]).eCell).toBeLessThan(base)
  })

  it('uses the Daniell Q = [Zn²⁺]/[Cu²⁺] and the 298 K slope per decade', () => {
    const cell = nernstCell('daniell')
    const r = readNernst(cell, [-1, 0], 298)
    expect(r.q).toBeCloseTo(0.1, 10)
    expect(r.slope).toBeCloseTo(nernstLog10Slope(2, 298), 12)
    expect(r.eCell).toBeCloseTo(1.1 + nernstLog10Slope(2, 298), 9)
  })

  it('uses Q = [Cu²⁺]/[Ag⁺]² for the copper–silver cell', () => {
    const r = readNernst(nernstCell('cu-ag'), [0, -1])
    expect(r.q).toBeCloseTo(100, 6)
    expect(r.eCell).toBeCloseTo(0.46 - nernstLog10Slope(2, 298) * 2, 9)
  })

  it('makes the zinc–SHE cell agree with two separate electrode potentials', () => {
    const cell = nernstCell('zn-she')
    const zn = 0.4 // Zn²⁺ at 10^0.4 mol L⁻¹
    const pH = 2.5
    const r = readNernst(cell, [zn, pH], 310)
    const eH = hydrogenElectrodePotential(pH, 310)
    const eZn = electrodePotential(-0.76, 2, 10 ** zn, 310)
    expect(r.eCell).toBeCloseTo(eH - eZn, 9)
  })

  it('reads [H⁺] = 10^−pH on the pH slider', () => {
    expect(slotConcentration(nernstCell('zn-she').sliders[1], 2)).toBeCloseTo(0.01, 12)
    expect(slotConcentration(nernstCell('zn-she').sliders[0], -2)).toBeCloseTo(0.01, 12)
  })

  it('gives a positive Ecell for the concentration cell when the anode side is more dilute', () => {
    const r = readNernst(nernstCell('concentration'), [-2, -1])
    expect(r.eCell).toBeGreaterThan(0)
    expect(r.eCell).toBeCloseTo(nernstLog10Slope(2, 298), 9)
  })

  it('matches the plotted line E = E°cell − slope × log Q at every point', () => {
    const cell = nernstCell('daniell')
    const r = readNernst(cell, [0.6, -2.4], 330)
    expect(cellPotentialAtLogQ(cell, r.logQ, 330)).toBeCloseTo(r.eCell, 9)
    expect(cellPotentialAtLogQ(cell, 0, 330)).toBeCloseTo(cell.e0Cell, 12)
  })

  it('grows the Ecell gain on dilution with temperature, since RT/nF grows with T', () => {
    const cell = nernstCell('daniell')
    const cold = readNernst(cell, [0, 1], 273).eCell
    const hot = readNernst(cell, [0, 1], 373).eCell
    expect(hot).toBeGreaterThan(cold)
  })
})
