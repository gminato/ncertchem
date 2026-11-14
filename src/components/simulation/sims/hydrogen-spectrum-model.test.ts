import { describe, expect, it } from 'vitest'
import {
  jumpFrame,
  orbitRadiusFor,
  restLevelAfter,
  seriesBrackets,
  stripX,
} from './hydrogen-spectrum-model'
import { transitionReadout } from '@/lib/chem/hydrogen-spectrum'

describe('jumpFrame (emission)', () => {
  it('starts with the electron at its rest level and no photon', () => {
    const f = jumpFrame(0, 'emission', 1, 3, 2)
    expect(f.level).toBeCloseTo(1, 10)
    expect(f.photon).toBe(-1)
    expect(f.lineLit).toBe(0)
  })

  it('has the electron on the upper level before it drops, then on the lower level', () => {
    expect(jumpFrame(0.25, 'emission', 1, 3, 2).level).toBeCloseTo(3, 10)
    expect(jumpFrame(0.8, 'emission', 1, 3, 2).level).toBeCloseTo(2, 10)
  })

  it('launches the photon after the drop and lights the line at the end', () => {
    expect(jumpFrame(0.4, 'emission', 1, 3, 2).photon).toBe(-1)
    const mid = jumpFrame(0.8, 'emission', 1, 3, 2)
    expect(mid.photon).toBeGreaterThan(0)
    expect(mid.photon).toBeLessThan(1)
    expect(mid.lineLit).toBe(0)
    expect(jumpFrame(1, 'emission', 1, 3, 2).lineLit).toBe(1)
  })
})

describe('jumpFrame (absorption)', () => {
  it('sends the photon in from the strip (0) toward the atom (1), then absorbs it', () => {
    expect(jumpFrame(0.05, 'absorption', 1, 3, 2).photon).toBeLessThan(0.2)
    expect(jumpFrame(0.45, 'absorption', 1, 3, 2).photon).toBeGreaterThan(0.8)
    expect(jumpFrame(0.6, 'absorption', 1, 3, 2).photon).toBe(-1)
  })

  it('raises the electron from the lower to the upper level after absorption', () => {
    expect(jumpFrame(0.45, 'absorption', 1, 3, 2).level).toBeCloseTo(2, 10)
    expect(jumpFrame(0.9, 'absorption', 1, 3, 2).level).toBeCloseTo(3, 10)
  })

  it('darkens the line at absorption', () => {
    expect(jumpFrame(0.49, 'absorption', 1, 3, 2).lineLit).toBe(0)
    expect(jumpFrame(0.5, 'absorption', 1, 3, 2).lineLit).toBe(1)
  })
})

describe('restLevelAfter', () => {
  it('leaves the electron on the lower level after emission and the upper after absorption', () => {
    expect(restLevelAfter('emission', 4, 2)).toBe(2)
    expect(restLevelAfter('absorption', 4, 2)).toBe(4)
  })
})

describe('orbitRadiusFor', () => {
  it('grows as n squared', () => {
    expect(orbitRadiusFor(2, 120) / orbitRadiusFor(1, 120)).toBeCloseTo(4, 10)
    expect(orbitRadiusFor(6, 120)).toBeCloseTo(120, 10)
  })
})

describe('stripX', () => {
  it('places 656 nm to the right of 486 nm, on a strip of the given width', () => {
    expect(stripX(656, 760)).toBeGreaterThan(stripX(486, 760))
    expect(stripX(90, 760)).toBe(0)
    expect(stripX(2000, 760)).toBeCloseTo(760, 6)
  })
})

describe('seriesBrackets', () => {
  const line = (upper: number, lower: number) => {
    const r = transitionReadout(upper, lower)
    return { nm: r.wavelengthNm, series: r.series, onAxis: r.onAxis }
  }

  it('makes no brackets when no lines are drawn', () => {
    expect(seriesBrackets([])).toEqual([])
  })

  it('spans the Balmer lines it has, from the shortest to the longest', () => {
    const brackets = seriesBrackets([line(3, 2), line(6, 2), line(4, 2)])
    expect(brackets).toHaveLength(1)
    expect(brackets[0].series).toBe('Balmer')
    expect(brackets[0].fromNm).toBeCloseTo(410.2, 0)
    expect(brackets[0].toNm).toBeCloseTo(656.5, 0)
    expect(brackets[0].offScale).toBe(false)
  })

  it('marks a series with off-scale lines, such as Brackett 6 to 4', () => {
    const [b] = seriesBrackets([line(6, 4)])
    expect(b.series).toBe('Brackett')
    expect(b.offScale).toBe(true)
  })

  it('keeps one fixed row per series, in series order', () => {
    const rows = seriesBrackets([line(6, 5), line(2, 1), line(4, 3)]).map((b) => [b.series, b.row])
    expect(rows).toEqual([
      ['Lyman', 0],
      ['Paschen', 2],
      ['Pfund', 4],
    ])
  })
})
