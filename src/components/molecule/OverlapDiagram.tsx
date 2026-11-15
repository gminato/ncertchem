import React, { forwardRef } from 'react'
import { Label } from '../vocab/Label'
import { lensPolygon, polygonPath, type Vec2 } from './geometry'
import { netOverlapSign, overlapOrbitals, overlapRegions, type OverlapKind, type OverlapOrbital, type OverlapPhase } from './overlap-geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const OVERLAP_SIZE = { width: 300, height: 200 } as const
const CENTRE: Vec2 = { x: OVERLAP_SIZE.width / 2, y: OVERLAP_SIZE.height / 2 }
const NUCLEUS_RADIUS = 2.8
const BADGE_RADIUS = 9
const NET_BADGE_AT: Vec2 = { x: 268, y: 26 }

export interface OverlapDiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The overlap type: s–s, s–p, p–p head-on (σ), or p–p side-on (π). */
  kind: OverlapKind
  /** Which lobes face each other: positive pairs like signs, negative pairs opposite signs, zero cancels. */
  phase?: OverlapPhase
  /** 0 is as close as the lobes can get; 1 is far apart. Animations tween this value. */
  separation?: number
  /** Mark the overlap regions with their sign, and the net sign in a badge outside. */
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

/** A round badge with a sign, sitting on a drawing so the sign stays legible on any shading. */
function SignBadge({ at, sign, radius = BADGE_RADIUS, testId }: { at: Vec2; sign: '+' | '−' | '0'; radius?: number; testId?: string }) {
  return (
    <g data-testid={testId}>
      <circle cx={at.x} cy={at.y} r={radius} strokeWidth={1.2} style={{ fill: 'var(--surface)', stroke: 'var(--fg-muted)' }} />
      <Label x={at.x} y={at.y + 0.5} fontSize={radius * 1.45} fill="var(--fg)">
        {sign}
      </Label>
    </g>
  )
}

/**
 * Two atomic orbitals and the region where they overlap. An s orbital is one disc; a p
 * orbital is a dumbbell of two lobes with its nucleus (a dot) at the join. Each lobe is shaded
 * by its phase: positive in --orbital-pos and negative in --orbital-neg. The overlap regions
 * are the lenses where facing lobes meet, shaded by the product of their signs and badged
 * with that sign. The net sign sits in a badge outside the drawing.
 */
export const OverlapDiagram = forwardRef<SVGGElement, OverlapDiagramProps>(function OverlapDiagram(
  { kind, phase = 'positive', separation = 0.45, showRegions = true, x = 0, y = 0, className, style, ...rest },
  ref
) {
  const pair = overlapOrbitals(kind, phase, separation).map(translate) as [OverlapOrbital, OverlapOrbital]
  const regions = overlapRegions(pair[0], pair[1], (c1, r1, c2, r2) => lensPolygon(c1, r1, c2, r2))
  const net = netOverlapSign(regions)
  const netSign = net > 0 ? '+' : net < 0 ? '−' : '0'

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} data-kind={kind} data-phase={phase} {...rest}>
      {pair.map((orbital, i) =>
        orbital.lobes.map((lobe, k) => (
          <circle
            key={`orb-${i}-${k}`}
            cx={lobe.centre.x}
            cy={lobe.centre.y}
            r={lobe.radius}
            strokeWidth={1.2}
            style={{
              fill: lobe.sign > 0 ? 'var(--orbital-pos)' : 'var(--orbital-neg)',
              fillOpacity: 0.3,
              stroke: lobe.sign > 0 ? 'var(--orbital-pos)' : 'var(--orbital-neg)',
              strokeOpacity: 0.9,
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
              fillOpacity: 0.6,
            }}
            data-testid="overlap-region"
            data-sign={region.sign > 0 ? '+' : '-'}
          />
        ))}

      {/* Nuclei: small dots at each orbital's centre */}
      {pair.map((orbital, i) => (
        <circle key={`nucleus-${i}`} cx={orbital.centre.x} cy={orbital.centre.y} r={NUCLEUS_RADIUS} style={{ fill: 'var(--fg)' }} />
      ))}

      {showRegions &&
        regions.map((region, i) => {
          const c = centroid(region.path)
          return <SignBadge key={`badge-${i}`} at={c} sign={region.sign > 0 ? '+' : '−'} radius={7.5} />
        })}

      {showRegions && regions.length > 0 && (
        <SignBadge at={NET_BADGE_AT} sign={netSign} radius={11} testId="overlap-sign" />
      )}
    </g>
  )
})
