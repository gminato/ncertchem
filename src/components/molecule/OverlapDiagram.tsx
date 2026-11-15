import React, { forwardRef } from 'react'
import { Label } from '../vocab/Label'
import { lensPolygon, polygonPath, type Vec2 } from './geometry'
import { netOverlapSign, overlapOrbitals, overlapRegions, type OverlapKind, type OverlapOrbital, type OverlapPhase } from './overlap-geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const OVERLAP_SIZE = { width: 300, height: 200 } as const
const CENTRE: Vec2 = { x: OVERLAP_SIZE.width / 2, y: OVERLAP_SIZE.height / 2 }

export interface OverlapDiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The overlap type: s–s, s–p, p–p head-on (σ), or p–p side-on (π). */
  kind: OverlapKind
  /** Which lobes face each other: positive pairs like signs, negative pairs opposite signs, zero cancels. */
  phase?: OverlapPhase
  /** 0 is full overlap, 1 is far apart. Animations tween this value. */
  separation?: number
  /** Mark the overlap region with its sign (+, −, or 0). */
  showRegions?: boolean
  x?: number
  y?: number
}

function translate(orbital: OverlapOrbital): OverlapOrbital {
  const shift = (p: Vec2): Vec2 => ({ x: p.x + CENTRE.x, y: p.y + CENTRE.y })
  return {
    ...orbital,
    centre: shift(orbital.centre),
    lobes: orbital.lobes.map((lobe) => ({ ...lobe, centre: shift(lobe.centre) })),
  }
}

function centroid(points: readonly Vec2[]): Vec2 {
  const n = points.length || 1
  return {
    x: points.reduce((s, p) => s + p.x, 0) / n,
    y: points.reduce((s, p) => s + p.y, 0) / n,
  }
}

/**
 * Two atomic orbitals and the region where they overlap. Each lobe is shaded by
 * its phase: the positive phase in --orbital-pos and the negative in --orbital-neg.
 * Overlap regions are the lenses where lobes meet, shaded by the product of
 * their signs, so a cancelling pair reads as zero.
 */
export const OverlapDiagram = forwardRef<SVGGElement, OverlapDiagramProps>(function OverlapDiagram(
  { kind, phase = 'positive', separation = 0.45, showRegions = true, x = 0, y = 0, className, style, ...rest },
  ref
) {
  const pair = overlapOrbitals(kind, phase, separation).map(translate) as [OverlapOrbital, OverlapOrbital]
  const regions = overlapRegions(pair[0], pair[1], (c1, r1, c2, r2) => lensPolygon(c1, r1, c2, r2))
  const net = netOverlapSign(regions)
  const cluster = regions.length ? centroid(regions.map((r) => centroid(r.path))) : CENTRE

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} data-kind={kind} data-phase={phase} {...rest}>
      {pair.map((orbital, i) =>
        orbital.lobes.map((lobe, k) => (
          <circle
            key={`orb-${i}-${k}`}
            cx={lobe.centre.x}
            cy={lobe.centre.y}
            r={lobe.radius}
            strokeWidth={1}
            style={{
              fill: lobe.sign > 0 ? 'var(--orbital-pos)' : 'var(--orbital-neg)',
              fillOpacity: 0.28,
              stroke: lobe.sign > 0 ? 'var(--orbital-pos)' : 'var(--orbital-neg)',
              strokeOpacity: 0.85,
            }}
          />
        ))
      )}

      {showRegions &&
        regions.map((region, i) => (
          <path
            key={`region-${i}`}
            d={polygonPath(region.path)}
            style={{
              fill: region.sign > 0 ? 'var(--orbital-pos)' : 'var(--orbital-neg)',
              fillOpacity: 0.55,
            }}
            data-testid="overlap-region"
            data-sign={region.sign > 0 ? '+' : '-'}
          />
        ))}

      {showRegions && regions.length > 0 && (
        <Label x={cluster.x} y={cluster.y + 1} fontSize={16} fill="var(--fg)" halo data-testid="overlap-sign">
          {net > 0 ? '+' : net < 0 ? '−' : '0'}
        </Label>
      )}
    </g>
  )
})
