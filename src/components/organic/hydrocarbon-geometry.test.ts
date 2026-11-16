import { describe, expect, it } from 'vitest'
import {
  NEWMAN,
  NEWMAN_FRONT_ANGLES,
  benzeneExoAngle,
  benzeneVertices,
  eclipseWeight,
  ethaneTorsionalEnergy,
  kekuleWeights,
  layoutReactionScheme,
  newmanBackAngles,
  newmanGeometry,
  plotX,
  plotY,
  relativeLocant,
  ringDistance,
  revealFraction,
  sawhorseGeometry,
  stageAt,
  stageOpacity,
  torsionalExtremes,
  formulaTextWidth,
  type PlotBox,
  type SchemePath,
  LABEL_CLEARANCE,
  LABEL_RADIUS,
  distToSegment,
  newmanRendered,
  sawhorseRendered,
} from './hydrocarbon-geometry'
import { SAWHORSE_BOND } from './Sawhorse'
import { PROPENE, TWO_BROMOPROPANE, ONE_BROMOPROPANE, arenium, nitrobenzene, BENZENE_KEKULE_A } from './hydrocarbon-fixture'

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
const angDiff = (a: number, b: number) => {
  const d = Math.abs((((a - b) % 360) + 540) % 360 - 180)
  return d
}

describe('Newman projection', () => {
  it('is staggered at 60 degrees: each back bond sits midway between two front bonds', () => {
    const back = newmanBackAngles(60)
    for (const b of back) {
      const nearest = Math.min(...NEWMAN_FRONT_ANGLES.map((f) => angDiff(b, f)))
      expect(nearest).toBeCloseTo(60, 6)
    }
  })

  it('is eclipsed at 0 with a small nudge so the back bonds stay visible', () => {
    const back = newmanBackAngles(0)
    back.forEach((b, i) => {
      expect(b - NEWMAN_FRONT_ANGLES[i]).toBeCloseTo(NEWMAN.eclipseNudge, 6)
    })
  })

  it('keeps every bond on its circle or ray for any angle, and the labels on their radii', () => {
    for (let d = 0; d <= 360; d += 13) {
      const g = newmanGeometry(d)
      for (const b of g.front) {
        expect(dist(b.from, { x: 0, y: 0 })).toBeCloseTo(0, 6)
        expect(dist(b.to, { x: 0, y: 0 })).toBeCloseTo(NEWMAN.frontLen, 6)
        expect(dist(b.label, { x: 0, y: 0 })).toBeCloseTo(NEWMAN.frontLabel, 6)
      }
      for (const b of g.back) {
        expect(dist(b.from, { x: 0, y: 0 })).toBeCloseTo(NEWMAN.rim, 6)
        expect(dist(b.to, { x: 0, y: 0 })).toBeCloseTo(NEWMAN.backLen, 6)
      }
    }
  })

  it('moves smoothly: adjacent samples differ by a small angle', () => {
    let prev = newmanBackAngles(0)
    for (let d = 1; d <= 360; d += 1) {
      const now = newmanBackAngles(d)
      now.forEach((a, i) => expect(angDiff(a, prev[i])).toBeLessThan(2))
      prev = now
    }
  })

  it('eclipse weight is 1 at eclipsed angles and 0 at staggered ones', () => {
    expect(eclipseWeight(0)).toBeCloseTo(1, 9)
    expect(eclipseWeight(120)).toBeCloseTo(1, 9)
    expect(eclipseWeight(60)).toBeCloseTo(0, 9)
    expect(eclipseWeight(180)).toBeCloseTo(0, 9)
  })
})

describe('Sawhorse projection', () => {
  it('places the front carbon at the origin and the back carbon up and to the right of it', () => {
    const g = sawhorseGeometry(0)
    expect(g.back.x).toBeGreaterThan(0)
    expect(g.back.y).toBeLessThan(0)
  })

  it('projects every bond at a plausible screen length (oblique foreshortening only) at every dihedral', () => {
    for (let d = 0; d <= 360; d += 9) {
      const g = sawhorseGeometry(d)
      for (const b of [...g.front, ...g.backBonds]) {
        const len = Math.hypot(b.to.x - b.from.x, b.to.y - b.from.y)
        expect(len).toBeGreaterThan(0.6)
        expect(len).toBeLessThan(1.25)
      }
    }
  })

  it('never lets two labels collide at any dihedral (centres at least 18 px apart)', () => {
    for (let d = 0; d <= 360; d += 1) {
      const g = sawhorseGeometry(d)
      const labels = [...g.front, ...g.backBonds].map((b) => ({ x: b.label.x * SAWHORSE_BOND, y: b.label.y * SAWHORSE_BOND }))
      for (let i = 0; i < labels.length; i++) {
        for (let j = i + 1; j < labels.length; j++) {
          expect(dist(labels[i], labels[j]), `dihedral ${d}, labels ${i} and ${j}`).toBeGreaterThan(18)
        }
      }
    }
  })
})

describe('torsional energy plot', () => {
  const box: PlotBox = { left: 10, top: 20, width: 360, height: 200, eMin: 0, eMax: 4 }

  it('maps 0 to 360 degrees across the width and energy onto the height, higher energy higher up', () => {
    expect(plotX(box, 0)).toBe(10)
    expect(plotX(box, 360)).toBe(370)
    expect(plotX(box, 180)).toBeCloseTo(190, 9)
    expect(plotY(box, 4)).toBe(20)
    expect(plotY(box, 0)).toBe(220)
    expect(plotY(box, 2)).toBeCloseTo(120, 9)
  })

  it('finds the eclipsed maxima and the staggered minima of ethane', () => {
    const { maxima, minima } = torsionalExtremes(ethaneTorsionalEnergy)
    expect(maxima).toEqual(expect.arrayContaining([0, 120, 240, 360]))
    expect(minima).toEqual(expect.arrayContaining([60, 180, 300]))
  })

  it('ethane energy: 12.5 kJ/mol barrier between eclipsed and staggered', () => {
    expect(ethaneTorsionalEnergy(0)).toBeCloseTo(12.5, 9)
    expect(ethaneTorsionalEnergy(60)).toBeCloseTo(0, 9)
  })
})

describe('reaction scheme layout', () => {
  const brHBr: SchemePath = [
    [{ formula: PROPENE }, { formula: 'HBr' }],
    { reagents: 'HBr', conditions: 'dark, no peroxide' },
    [
      { formula: TWO_BROMOPROPANE, tag: 'major' },
      { formula: ONE_BROMOPROPANE, tag: 'minor' },
    ],
  ]
  const twoStep: SchemePath = [
    [{ formula: 'CH≡CH' }],
    { reagents: 'H₂', conditions: 'Lindlar catalyst' },
    [{ formula: 'CH₂=CH₂' }],
    { reagents: 'H₂', conditions: 'Ni, 473 K' },
    [{ formula: 'CH₃–CH₃' }],
  ]

  for (const [name, path] of [
    ['propene + HBr', brHBr],
    ['two-step', twoStep],
  ] as const) {
    for (const width of [560, 600]) {
      it(`${name} fits a ${width} unit width in at most two rows`, () => {
        const layout = layoutReactionScheme(path, width)
        expect(layout.rows).toBeLessThanOrEqual(2)
        expect(layout.width).toBeLessThanOrEqual(width)
        for (const item of layout.items) {
          expect(item.x).toBeGreaterThanOrEqual(0)
          expect(item.x + item.width).toBeLessThanOrEqual(width + 0.5)
        }
      })
    }
  }

  it('keeps every element of the scheme once in the layout', () => {
    const layout = layoutReactionScheme(brHBr, 580)
    const speciesCount = layout.items.filter((i) => i.kind === 'species').length
    expect(speciesCount).toBe(2 + 2)
    expect(layout.items.filter((i) => i.kind === 'arrow').length).toBe(1)
    expect(layout.items.filter((i) => i.kind === 'plus').length).toBe(1 + 1)
  })

  it('text width grows with the number of characters', () => {
    expect(formulaTextWidth('HBr')).toBeLessThan(formulaTextWidth('CH₃CH₂CH₃'))
  })
})

describe('benzene ring positions', () => {
  it('puts all six vertices on the circle, 60 degrees apart, adjacent ones one radius apart', () => {
    const R = 92
    const v = benzeneVertices(R)
    v.forEach((p) => expect(Math.hypot(p.x, p.y)).toBeCloseTo(R, 9))
    v.forEach((p, i) => expect(dist(p, v[(i + 1) % 6])).toBeCloseTo(R, 9))
  })

  it('position 1 is the top; exo angles step clockwise by 60 degrees', () => {
    expect(benzeneExoAngle(1)).toBe(-90)
    expect(benzeneExoAngle(2)).toBe(-30)
    expect(benzeneExoAngle(4)).toBe(90)
  })

  it('o, m and p are the ring distances 1, 2 and 3 from the principal group', () => {
    expect(ringDistance(1, 4)).toBe(3)
    expect(ringDistance(1, 6)).toBe(1)
    expect(relativeLocant(2, 1)).toBe('o')
    expect(relativeLocant(3, 1)).toBe('m')
    expect(relativeLocant(4, 1)).toBe('p')
    expect(relativeLocant(1, 1)).toBe('')
  })

  it('Kekulé weights slide the double bonds from form A (mix 0) to form B (mix 1)', () => {
    expect(kekuleWeights(0)).toEqual([1, 0, 1, 0, 1, 0])
    expect(kekuleWeights(1)).toEqual([0, 1, 0, 1, 0, 1])
    expect(kekuleWeights(0.5).every((w) => w === 0.5)).toBe(true)
  })
})

describe('mechanism stages', () => {
  it('splits progress into equal stages and reports progress within each', () => {
    expect(stageAt(0, 3)).toEqual({ index: 0, t: 0 })
    const mid = stageAt(0.5, 3)
    expect(mid.index).toBe(1)
    expect(mid.t).toBeCloseTo(0.5, 9)
    expect(stageAt(1, 3)).toEqual({ index: 2, t: 1 })
  })

  it('clamps out-of-range progress', () => {
    expect(stageAt(-1, 3).index).toBe(0)
    expect(stageAt(5, 3)).toEqual({ index: 2, t: 1 })
  })

  it('current stage is fully visible, passed stages fade, future ones are hidden', () => {
    expect(stageOpacity(0.5, 3, 1)).toBe(1)
    expect(stageOpacity(0.5, 3, 0)).toBeCloseTo(0.7, 9)
    expect(stageOpacity(0.5, 3, 2)).toBeCloseTo(0.12, 9)
  })

  it('reveal fraction runs from 0 at start to 1 at end', () => {
    expect(revealFraction(0.2, 0.25, 0.75)).toBe(0)
    expect(revealFraction(0.5, 0.25, 0.75)).toBeCloseTo(0.5, 9)
    expect(revealFraction(0.9, 0.25, 0.75)).toBe(1)
  })
})

describe('fixture graphs', () => {
  it('benzene and nitrobenzene are rings of six carbons', () => {
    expect(BENZENE_KEKULE_A.atoms.length).toBe(6)
    expect(nitrobenzene().atoms.length).toBe(6 + 3)
  })

  it('the σ-complex carries the + on the chosen ring carbon and an sp³ carbon with H and the electrophile', () => {
    const g = arenium('NO2', 3)
    expect(g.atoms[3].charge).toBe(1)
    expect(g.atoms[0].hCount).toBe(1)
    const bondsOn0 = g.bonds.filter((b) => b.a === 0 || b.b === 0)
    expect(bondsOn0.every((b) => b.order === 1)).toBe(true)
  })
})

describe('label clearance in the conformation drawings', () => {
  const minGap = (segs: Array<{ a: { x: number; y: number }; b: { x: number; y: number } }>, labels: Array<{ x: number; y: number }>) => {
    let worst = Infinity
    for (const s of segs) for (const l of labels) worst = Math.min(worst, distToSegment(l, s) - LABEL_RADIUS)
    return worst
  }
  it('every Newman bond keeps at least 4 units clear of every label, at every 1°', () => {
    for (let d = 0; d < 360; d++) {
      const r = newmanRendered(d)
      const gap = minGap([...r.front, ...r.back], r.labels)
      expect(gap, `dihedral ${d}`).toBeGreaterThanOrEqual(LABEL_CLEARANCE - 1e-6)
    }
  })
  it('every sawhorse bond keeps at least 4 units clear of every label, at every 1°', () => {
    for (let d = 0; d < 360; d++) {
      const r = sawhorseRendered(d, SAWHORSE_BOND)
      const gap = minGap(r.segments, r.labels)
      expect(gap, `dihedral ${d}`).toBeGreaterThanOrEqual(LABEL_CLEARANCE - 1e-6)
    }
  })
})
