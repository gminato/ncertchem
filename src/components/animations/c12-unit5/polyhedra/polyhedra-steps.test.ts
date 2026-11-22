import { describe, expect, it } from 'vitest'
import {
  NCERT_POLYHEDRA_COUNT,
  OCTAHEDRON_MESH,
  POLYHEDRA_STEP_COUNT,
  SQUARE_PLANAR_MESH,
  SQUARE_PYRAMIDAL_MESH,
  TETRAHEDRON_MESH,
  TRIGONAL_BIPYRAMIDAL_MESH,
  polyhedraStepInfo,
  project3D,
} from './polyhedra-steps'

describe('polyhedra-steps', () => {
  it('has 4 steps covering all 5 NCERT Fig. 5.1 polyhedra', () => {
    expect(POLYHEDRA_STEP_COUNT).toBe(4)
    expect(NCERT_POLYHEDRA_COUNT).toBe(5)
    expect(polyhedraStepInfo(0).visual).toBe('octahedral')
    expect(polyhedraStepInfo(1).visual).toBe('tetrahedral')
    expect(polyhedraStepInfo(2).visual).toBe('square-planar')
    expect(polyhedraStepInfo(3).visual).toBe('five-coordinate')
    expect(polyhedraStepInfo(-1).visual).toBe('octahedral')
    expect(polyhedraStepInfo(10).visual).toBe('five-coordinate')
  })

  it('has exact vertex and face counts for each polyhedron', () => {
    expect(OCTAHEDRON_MESH.vertices).toHaveLength(6)
    expect(OCTAHEDRON_MESH.faces).toHaveLength(8)
    expect(TETRAHEDRON_MESH.vertices).toHaveLength(4)
    expect(TETRAHEDRON_MESH.faces).toHaveLength(4)
    expect(SQUARE_PLANAR_MESH.vertices).toHaveLength(4)
    expect(TRIGONAL_BIPYRAMIDAL_MESH.vertices).toHaveLength(5)
    expect(SQUARE_PYRAMIDAL_MESH.vertices).toHaveLength(5)
  })

  it('projects the origin to the centre regardless of rotation', () => {
    const p = project3D({ x: 0, y: 0, z: 0 }, 1.2, 0.4, 270, 200, 120)
    expect(p.x).toBeCloseTo(270, 5)
    expect(p.y).toBeCloseTo(200, 5)
    expect(p.z).toBeCloseTo(0, 5)
  })
})
