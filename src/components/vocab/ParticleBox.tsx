import React, { forwardRef, useId } from 'react'
import { Atom } from './Atom'
import { Molecule, type MoleculeStyle } from './Molecule'

export type ParticleItem =
  | {
      kind: 'molecule'
      formula: string
      /** Centre of the molecule, in box coordinates (0,0 is the top-left corner). */
      x: number
      y: number
      style?: MoleculeStyle
      scale?: number
    }
  | {
      kind: 'atom'
      element: string
      x: number
      y: number
      r?: number
    }

export interface ParticleBoxProps extends Omit<React.SVGAttributes<SVGGElement>, 'style'> {
  /** Positions of the particles. The box draws them and clips them to its walls. */
  items: ParticleItem[]
  width?: number
  height?: number
  /** Corner radius of the glassy wall. */
  radius?: number
  x?: number
  y?: number
  defsPrefix?: string
}

/**
 * A container of particles, drawn as a rounded glassy wall. It is purely
 * presentational: callers pass the positions, and items are clipped to the box.
 */
export const ParticleBox = forwardRef<SVGGElement, ParticleBoxProps>(function ParticleBox(
  {
    items,
    width = 300,
    height = 200,
    radius = 16,
    x = 0,
    y = 0,
    defsPrefix = 'vocab',
    className,
    ...rest
  },
  ref
) {
  // useId is stable between server and client, unlike Math.random.
  const clipId = `${defsPrefix}-box-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} {...rest}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} />
        </clipPath>
      </defs>

      {/* Glass fill and wall */}
      <rect
        x={0.75}
        y={0.75}
        width={width - 1.5}
        height={height - 1.5}
        rx={radius}
        ry={radius}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={1.5}
      />

      {/* Particles, clipped to the inside of the wall */}
      <g clipPath={`url(#${clipId})`}>
        {items.map((item, i) =>
          item.kind === 'molecule' ? (
            <Molecule
              key={`m-${i}`}
              formula={item.formula}
              x={item.x}
              y={item.y}
              style={item.style}
              scale={item.scale}
              defsPrefix={defsPrefix}
            />
          ) : (
            <Atom
              key={`a-${i}`}
              element={item.element}
              x={item.x}
              y={item.y}
              r={item.r}
              defsPrefix={defsPrefix}
            />
          )
        )}
      </g>

      {/* A faint, short glare in the top-left corner, fading along its length */}
      <path
        d={`M ${radius * 0.3} ${radius * 1.6} Q ${radius * 0.3} ${radius * 0.4} ${radius * 1.6} ${radius * 0.3}`}
        fill="none"
        stroke="var(--glass-sheen)"
        strokeOpacity={0.35}
        strokeWidth={1.5}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
})
