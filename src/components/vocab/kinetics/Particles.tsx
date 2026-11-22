'use client'

import React, { forwardRef, useId, type ReactNode, type SVGAttributes } from 'react'
import { Molecule, type MoleculeStyle } from '../Molecule'
import { TONE_VAR, type PlotTone } from './Plot'

export type ParticleTone = PlotTone

export interface ParticleProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** Centre, in the parent's coordinates. */
  x?: number
  y?: number
  r?: number
  tone?: ParticleTone
  /** Caption under the sphere. Pass it already formatted, with Sub and Sup if needed. */
  label?: ReactNode
}

/** A shaded sphere for one particle, with a sheen that stays the same across both themes. */
export const Particle = forwardRef<SVGGElement, ParticleProps>(function Particle(
  { x = 0, y = 0, r = 14, tone = 'neutral', label, ...rest },
  ref
) {
  const gid = `kin-sphere-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      <defs>
        <radialGradient id={gid} cx="35%" cy="32%" r="70%">
          <stop offset="0%" stopColor="var(--kin-sheen)" />
          <stop offset="38%" stopColor={TONE_VAR[tone]} />
          <stop offset="100%" stopColor={TONE_VAR[tone]} stopOpacity={0.72} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r} fill={`url(#${gid})`} stroke={TONE_VAR[tone]} strokeOpacity={0.5} strokeWidth={1} />
      {label !== undefined && (
        <text x={x} y={y + r + 20} textAnchor="middle" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  )
})

export interface MoleculeSpriteProps {
  /** A key of MOLECULE_LAYOUTS, e.g. "O2", "NH3", "CO2". Unknown formulas draw nothing. */
  formula: string
  x?: number
  y?: number
  scale?: number
  style?: MoleculeStyle
  defsPrefix?: string
}

/** A small multi-atom molecule, drawn with the shared vocab Molecule so colours match every Section. */
export function MoleculeSprite({ formula, x = 0, y = 0, scale = 1, style = 'space-filling', defsPrefix }: MoleculeSpriteProps) {
  return <Molecule formula={formula} x={x} y={y} scale={scale} style={style} defsPrefix={defsPrefix ?? `kin-${formula}`} />
}

export interface CollisionFlashProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  /** Length of the longest ray. */
  size?: number
  /** An effective collision (energy and orientation right) bursts in amber; an ineffective one stays faint and dashed. */
  effective?: boolean
}

/** A small burst marking one collision. Deterministic: eight rays, no randomness. */
export const CollisionFlash = forwardRef<SVGGElement, CollisionFlashProps>(function CollisionFlash(
  { x = 0, y = 0, size = 20, effective = true, ...rest },
  ref
) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4
    const inner = size * (effective ? 0.36 : 0.42)
    const outer = effective ? (i % 2 === 0 ? size : size * 0.7) : size * 0.8
    return {
      x1: x + Math.cos(a) * inner,
      y1: y + Math.sin(a) * inner,
      x2: x + Math.cos(a) * outer,
      y2: y + Math.sin(a) * outer,
    }
  })
  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      {effective && <circle cx={x} cy={y} r={size * 0.3} fill="var(--kin-flash)" fillOpacity={0.35} />}
      {rays.map((r, i) => (
        <line
          key={i}
          x1={r.x1}
          y1={r.y1}
          x2={r.x2}
          y2={r.y2}
          stroke={effective ? 'var(--kin-flash)' : 'var(--fg-muted)'}
          strokeWidth={effective ? 2.6 : 1.6}
          strokeLinecap="round"
          strokeDasharray={effective ? undefined : '3 3'}
          strokeOpacity={effective ? 1 : 0.7}
        />
      ))}
    </g>
  )
})

export interface ReactionBoxProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  width?: number
  height?: number
  radius?: number
  /** Caption under the vessel. */
  caption?: ReactNode
  /** Particles, positioned by the caller in the vessel's own coordinates (0,0 at its top-left). */
  children?: ReactNode
}

/** A sealed vessel cross-section. Its children are drawn in box coordinates and clipped to the walls. */
export const ReactionBox = forwardRef<SVGGElement, ReactionBoxProps>(function ReactionBox(
  { x = 0, y = 0, width = 240, height = 200, radius = 14, caption, children, ...rest },
  ref
) {
  const cid = `kin-vessel-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      <defs>
        <clipPath id={cid}>
          <rect x={x} y={y} width={width} height={height} rx={radius} />
        </clipPath>
      </defs>
      <rect x={x} y={y} width={width} height={height} rx={radius} fill="var(--glass-fill)" />
      <g clipPath={`url(#${cid})`}>
        <g transform={`translate(${x} ${y})`}>{children}</g>
      </g>
      <rect x={x} y={y} width={width} height={height} rx={radius} fill="none" stroke="var(--glass-wall)" strokeWidth={2.4} />
      <path
        d={`M${x + 10} ${y + radius + 4} V${y + height - radius - 6}`}
        stroke="var(--glass-sheen)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      {caption !== undefined && (
        <text x={x + width / 2} y={y + height + 24} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {caption}
        </text>
      )}
    </g>
  )
})
