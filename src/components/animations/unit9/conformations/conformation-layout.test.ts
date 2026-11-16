import { describe, expect, it } from 'vitest'
import { LABEL_KNOCKOUT, SAWHORSE_BOND, newmanLayout, sawhorseDirections, sawhorseLayout, sawhorseViewBox, SAWHORSE_AXIS_RATIO, GLYPH_RADIUS, CLEARANCE, NEWMAN_UNITS, type DrawnBond, type Glyph } from './conformation-layout'
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

/** The signed angle from a to b, in degrees in (−180, 180]. */
const angleBetween = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180

describe('sawhorse bond directions', () => {
  it('draws each back bond parallel to the front bond it hides at 0° (eclipsed)', () => {
    const { front, back } = sawhorseDirections(0)
    front.forEach((f, i) => expect(Math.abs(angleBetween(f, back[i]))).toBeLessThanOrEqual(1))
  })

  it('turns each back bond 60° from its front partner at 60° (staggered)', () => {
    const { front, back } = sawhorseDirections(60)
    front.forEach((f, i) => expect(Math.abs(Math.abs(angleBetween(f, back[i])) - 60)).toBeLessThanOrEqual(1))
  })

  it('lines each back bond up with some front bond at 0°, 120° and 240°', () => {
    for (const d of [0, 120, 240]) {
      const { front, back } = sawhorseDirections(d)
      back.forEach((b) => expect(Math.min(...front.map((f) => Math.abs(angleBetween(f, b))))).toBeLessThanOrEqual(1))
    }
  })
})

describe('sawhorseLayout', () => {
  it('makes the C–C bond 1.6 times the C–H bond length', () => {
    expect(SAWHORSE_AXIS_RATIO).toBe(1.6)
  })

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
