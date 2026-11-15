import { describe, expect, it } from 'vitest'
import { CENTRE_RADIUS, LIGAND_RADIUS, projectShape } from './hybrid-view'
import type { GeometryShape } from './vbt-steps'

const SHAPES: GeometryShape[] = ['BeCl2', 'BCl3', 'CH4', 'H2O', 'PCl5', 'SF6']
const ANCHOR = { x: 300, y: 300 }
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('projectShape', () => {
  it.each(SHAPES)('%s: no ligand sits on the centre or on another ligand', (shape) => {
    const atoms = projectShape(shape, ANCHOR)
    const centre = atoms.find((a) => a.kind === 'centre')!
    const ligands = atoms.filter((a) => a.kind === 'ligand')
    // Largest ligand radius after depth shading is 10% above LIGAND_RADIUS.
    const maxLigand = LIGAND_RADIUS * 1.1
    for (const l of ligands) {
      expect(dist(l, centre)).toBeGreaterThan(CENTRE_RADIUS + maxLigand)
    }
    for (const a of ligands) {
      for (const b of ligands) {
        if (a !== b) expect(dist(a, b)).toBeGreaterThan(2 * maxLigand)
      }
    }
  })

  it('PCl5 draws all five chlorines, with one equatorial behind the plane', () => {
    const ligands = projectShape('PCl5', ANCHOR).filter((a) => a.kind === 'ligand')
    expect(ligands).toHaveLength(5)
    expect(ligands.filter((a) => a.depth < 0).length).toBeGreaterThanOrEqual(1)
  })

  it('places the centre at the anchor', () => {
    const centre = projectShape('CH4', ANCHOR).find((a) => a.kind === 'centre')!
    expect(centre.x).toBeCloseTo(ANCHOR.x, 6)
    expect(centre.y).toBeCloseTo(ANCHOR.y, 6)
  })
})
