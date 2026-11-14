import { describe, it, expect } from 'vitest'
import { balmerLines, clampLineStep, firstLine, levelEnergyEv, seriesFirstLines } from './line-spectra-steps'

describe('balmerLines', () => {
  it('gives the first four Balmer lines at 656.5, 486.3, 434.2 and 410.3 nm, all visible', () => {
    const lines = balmerLines()
    expect(lines.map((l) => l.nm)).toEqual([656.5, 486.3, 434.2, 410.3])
    expect(lines.every((l) => l.region === 'visible')).toBe(true)
    expect(lines.every((l) => l.series === 'Balmer')).toBe(true)
  })
})

describe('seriesFirstLines', () => {
  it('names the five series and puts each first line in the right region', () => {
    const lines = seriesFirstLines()
    expect(lines.map((l) => l.series)).toEqual(['Lyman', 'Balmer', 'Paschen', 'Brackett', 'Pfund'])
    expect(lines.map((l) => l.region)).toEqual(['ultraviolet', 'visible', 'infrared', 'infrared', 'infrared'])
  })

  it('gives the first Lyman line at 121.6 nm and the first Paschen line at 1875.6 nm', () => {
    expect(firstLine(1).nm).toBe(121.6)
    expect(firstLine(3).nm).toBe(1875.6)
    expect(firstLine(3).upper).toBe(4)
  })
})

describe('levelEnergyEv', () => {
  it('gives −13.61 eV for n = 1 and −3.40 eV for n = 2', () => {
    expect(levelEnergyEv(1)).toBeCloseTo(-13.61, 2)
    expect(levelEnergyEv(2)).toBeCloseTo(-3.4, 1)
  })
})

describe('clampLineStep', () => {
  it('keeps the step inside 0 to 3', () => {
    expect(clampLineStep(-3)).toBe(0)
    expect(clampLineStep(12)).toBe(3)
  })
})
