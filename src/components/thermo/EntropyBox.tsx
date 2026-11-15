import React, { forwardRef, useMemo } from 'react'
import { ParticleBox, type ParticleItem } from '../vocab/ParticleBox'
import { latticeField, spacedScatter, type Box, type Point } from './geometry'

/** Drawing size of one box, in SVG units. */
export const ENTROPY_BOX_SIZE = { width: 200, height: 160 } as const

const PARTICLES = 24
const RADIUS = 7
const INSET = 14
const ELEMENT = 'Xe'

export interface EntropyBoxProps extends Omit<React.SVGAttributes<SVGGElement>, 'children' | 'radius'> {
  /** 0 solid (an ordered lattice), 1 liquid (packed, no lattice), 2 gas (scattered). */
  state: 0 | 1 | 2
  width?: number
  height?: number
  x?: number
  y?: number
}

/**
 * A box of the same particles in three states, for entropy intuition. Order falls
 * and disorder rises from solid to liquid to gas. Positions come from a fixed seed,
 * so the same state always looks the same. There is no text; labels belong to the caller.
 */
export const EntropyBox = forwardRef<SVGGElement, EntropyBoxProps>(function EntropyBox(
  { state, width = ENTROPY_BOX_SIZE.width, height = ENTROPY_BOX_SIZE.height, x = 0, y = 0, ...rest },
  ref
) {
  const items: ParticleItem[] = useMemo(() => {
    const full: Box = { x0: INSET, y0: INSET, x1: width - INSET, y1: height - INSET }
    let pts: Point[]
    if (state === 0) {
      pts = latticeField(6, 4, full, 0.06, 3)
    } else if (state === 1) {
      // The liquid settles into the lower part of the box, packed but not ordered.
      const low: Box = { x0: INSET, y0: height * 0.4, x1: width - INSET, y1: height - INSET }
      pts = latticeField(6, 4, low, 0.3, 4)
    } else {
      pts = spacedScatter(PARTICLES, full, 9, 2 * RADIUS + 6)
    }
    return pts.map((p) => ({ kind: 'atom' as const, element: ELEMENT, x: p.x, y: p.y, r: RADIUS }))
  }, [state, width, height])

  return (
    <ParticleBox
      ref={ref}
      items={items}
      width={width}
      height={height}
      radius={14}
      x={x}
      y={y}
      defsPrefix="vocab"
      {...rest}
    />
  )
})
