import { describe, expect, it } from 'vitest'
import { LABEL_KNOCKOUT, SAWHORSE_BOND, SAWHORSE_H, SAWHORSE_DEPTH_DEG, newmanLayout, sawhorseLayout, sawhorseVectors, sawhorseViewBox, GLYPH_RADIUS, CLEARANCE, NEWMAN_UNITS, type DrawnBond, type Glyph } from './conformation-layout'
import { distToSegment } from '@/components/organic'

/** Clear distance between two glyphs: centre-to-centre minus both radii. */
const glyphGap = (a: Glyph, b: Glyph) => Math.hypot(a.x - b.x, a.y - b.y) - 2 * GLYPH_RADIUS

/** Clear distance from a glyph to a bond: centre-to-segment minus the glyph radius. */
const bondGap = (g: Glyph, bonds: readonly DrawnBond[]) => Math.min(...bonds.map((b) => distToSegment(g, b.seg))) - GLYPH_RADIUS

/** Samples of the dihedral covering every eclipse and every staggered angle, and the skew between them. */
const SAMPLES = Array.from({ length: 361 }, (_, i) => i)

describe('newmanLayout', () => {
  it('keeps every label at least CLEARANCE from every other label, at every dihedral', () => {
    for (const d of SAMPLES) {
      const { labels } = newmanLayout(d)
      for (let i = 0; i < labels.length; i++)
        for (let j = i + 1; j < labels.length; j++)
          expect(glyphGap(labels[i], labels[j]), `dihedral ${d}, labels ${i} and ${j}`).toBeGreaterThanOrEqual(CLEARANCE - 1e-6)
    }
  })

  it('keeps every label at least CLEARANCE from every bond, at every dihedral', () => {
    for (const d of SAMPLES) {
      const { labels, bonds } = newmanLayout(d)
      for (const l of labels) expect(bondGap(l, bonds), `dihedral ${d}`).toBeGreaterThanOrEqual(CLEARANCE - 1e-6)
    }
  })

  it('draws the rear circle at least 140 px across in its own units', () => {
    expect(2 * NEWMAN_UNITS.rim).toBeGreaterThanOrEqual(140 - 1e-9)
  })

  it('turns the rear bonds clear of the front bonds at eclipse', () => {
    const { bonds } = newmanLayout(0)
    const back = bonds.filter((b) => b.kind === 'back')
    expect(back.length).toBeGreaterThan(0)
    expect(back.length).toBeLessThanOrEqual(3)
  })

  it('rejects a non-finite angle', () => {
    expect(() => newmanLayout(Number.NaN)).toThrow(RangeError)
  })

  it('has six labels: three front and three back', () => {
    expect(newmanLayout(30).labels).toHaveLength(6)
  })

  it('uses the knock-out radius for every bond cut', () => {
    expect(LABEL_KNOCKOUT).toBe(GLYPH_RADIUS + CLEARANCE)
  })
})

describe('sawhorse projection', () => {
  const cos40 = Math.cos((SAWHORSE_DEPTH_DEG * Math.PI) / 180)
  const sin40 = Math.sin((SAWHORSE_DEPTH_DEG * Math.PI) / 180)

  it('differs at θ = 0 only by the depth term: each back bond minus its front partner is 2h along the depth direction', () => {
    const { front, back } = sawhorseVectors(0)
    front.forEach((f, i) => {
      expect(back[i].x - f.x).toBeCloseTo(2 * SAWHORSE_H * cos40, 9)
      expect(back[i].y - f.y).toBeCloseTo(-2 * SAWHORSE_H * sin40, 9)
    })
  })

  it('moves the back bonds apart from their front partners as the dihedral grows', () => {
    const at0 = sawhorseVectors(0)
    const at60 = sawhorseVectors(60)
    at60.back.forEach((b, i) => {
      const ex = b.x - at60.front[i].x - (at0.back[i].x - at0.front[i].x)
      const ey = b.y - at60.front[i].y - (at0.back[i].y - at0.front[i].y)
      expect(Math.hypot(ex, ey)).toBeGreaterThan(0.1)
    })
  })

  it('puts the back carbon up and to the right of the front carbon', () => {
    const l = sawhorseLayout(0)
    expect(l.backCarbon.x).toBeGreaterThan(l.frontCarbon.x)
    expect(l.backCarbon.y).toBeLessThan(l.frontCarbon.y)
  })
})

describe('sawhorseLayout', () => {
  it('has no C labels: the carbons are marked only by the bond junctions', () => {
    expect(sawhorseLayout(0).labels).toHaveLength(6)
  })

  it('keeps every H label clear of every bond, at every dihedral', () => {
    for (const d of SAMPLES) {
      const l = sawhorseLayout(d, SAWHORSE_BOND)
      const hs = l.labels.slice(0, 6)
      for (const h of hs) expect(bondGap(h, l.bonds), `dihedral ${d}`).toBeGreaterThanOrEqual(CLEARANCE - 1e-6)
    }
  })

  it('keeps every pair of H labels clear of each other', () => {
    for (const d of SAMPLES) {
      const hs = sawhorseLayout(d, SAWHORSE_BOND).labels.slice(0, 6)
      for (let i = 0; i < hs.length; i++)
        for (let j = i + 1; j < hs.length; j++)
          expect(glyphGap(hs[i], hs[j]), `dihedral ${d}, H ${i} and H ${j}`).toBeGreaterThanOrEqual(CLEARANCE - 1e-6)
    }
  })

  it('has a viewBox that holds the drawing at every dihedral', () => {
    const vb = sawhorseViewBox(SAWHORSE_BOND)
    for (const d of SAMPLES) {
      const l = sawhorseLayout(d, SAWHORSE_BOND)
      for (const g of l.labels) {
        expect(g.x).toBeGreaterThan(vb.x)
        expect(g.x).toBeLessThan(vb.x + vb.width)
        expect(g.y).toBeGreaterThan(vb.y)
        expect(g.y).toBeLessThan(vb.y + vb.height)
      }
    }
  })

  it('rejects a non-positive bond length', () => {
    expect(() => sawhorseLayout(0, 0)).toThrow(RangeError)
  })
})
