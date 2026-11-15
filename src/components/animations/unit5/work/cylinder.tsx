import { pistonGasFraction } from '@/components/thermo'

/**
 * Piston geometry for the work drawings. PistonCylinder draws its weights as whole plates, so the
 * Unit 5 work visuals draw the weight as one block whose height is proportional to p_ex, and use
 * PistonCylinder with no plates. These numbers match PistonCylinder's own piston and travel.
 */
const PISTON_H = 10
const WALL_T = 3

/** Drawing height of one bar of external pressure, in SVG units. */
export const WEIGHT_PX_PER_BAR = 15

export interface CylinderGeometry {
  x: number
  base: number
  width: number
  height: number
  /** Gas volume at the top of the cylinder, in litres (the drawing's full scale). */
  fullL: number
}

/** SVG y of the piston's lower face for a gas volume, as PistonCylinder places it. */
export function pistonTopY(geo: CylinderGeometry, volumeL: number): number {
  const travel = geo.height - PISTON_H - 2
  const gasHeight = pistonGasFraction(volumeL / geo.fullL) * travel
  return geo.base - gasHeight - PISTON_H
}

/** A weight of p_ex bar, sitting on the piston. Its height is proportional to the pressure. */
export function WeightBlock({ geo, volumeL, pBar }: { geo: CylinderGeometry; volumeL: number; pBar: number }) {
  const top = pistonTopY(geo, volumeL)
  const h = pBar * WEIGHT_PX_PER_BAR
  const inner = geo.width - 2 * (WALL_T + 4)
  return (
    <rect
      data-testid="weight-block"
      x={geo.x - inner / 2}
      y={top - h}
      width={inner}
      height={h}
      rx={2}
      style={{ fill: 'var(--surface-raised)', stroke: 'var(--fg-subtle)' }}
      strokeWidth={1.2}
    />
  )
}
