import React, { forwardRef } from 'react'
import { beakerGeometry } from '../electrochem/Beaker'
import { Label } from '../Label'
import { ION_COLOUR_TOKEN, type IonColourKey } from './tones'

const WALL = 4
const RADIUS = 12
const BEAKER_W = 84
const BEAKER_H = 150

export interface SolutionColourProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  /** Width of the drawing; the beaker is centred in it. */
  width?: number
  /** Which solution: the ion colour key from Table 4.8 or an oxoanion. */
  ion: IonColourKey
  /** Caption under the beaker, e.g. Cu²⁺(aq). Pass a ReactNode with Sub or Sup for real subscripts. */
  label?: React.ReactNode
  /** Draw a white beam entering from the left and the transmitted colour leaving on the right. */
  light?: boolean
  /** A solid deposit on the bottom, e.g. MnO₂ (ion key 'mno2'). */
  precipitate?: IonColourKey
  /** Liquid level, 0 to 1. */
  level?: number
}

/** A beaker of dilute solution tinted by an ion colour token, with optional light beams and a precipitate. */
export const SolutionColour = forwardRef<SVGGElement, SolutionColourProps>(function SolutionColour(
  { x = 0, y = 0, width = 170, ion, label, light = false, precipitate, level = 0.78, ...rest },
  ref
) {
  const bx = (width - BEAKER_W) / 2
  const by = 10
  const g = beakerGeometry({ x: bx, y: by, width: BEAKER_W, height: BEAKER_H, level })
  const r = RADIUS
  const glass = `M${g.left} ${g.rimY} V${g.bottomY - r} Q${g.left} ${g.bottomY} ${g.left + r} ${g.bottomY} H${g.right - r} Q${g.right} ${g.bottomY} ${g.right} ${g.bottomY - r} V${g.rimY}`
  const lx1 = g.innerLeft
  const lx2 = g.innerRight
  const lb = g.innerBottom
  const liquid = `M${lx1} ${g.liquidTop} H${lx2} V${lb - (r - WALL)} Q${lx2} ${lb} ${lx2 - (r - WALL)} ${lb} H${lx1 + (r - WALL)} Q${lx1} ${lb} ${lx1} ${lb - (r - WALL)} Z`
  const beamY = g.liquidTop + (g.innerBottom - g.liquidTop) * 0.5
  const colour = ION_COLOUR_TOKEN[ion]

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden="true" data-ion={ion} {...rest}>
      {light && (
        <>
          <line x1={0} y1={beamY} x2={g.left} y2={beamY} style={{ stroke: 'var(--db-beam)', strokeWidth: 4, strokeLinecap: 'round' }} />
          <line x1={g.right} y1={beamY} x2={width} y2={beamY} style={{ stroke: colour, strokeWidth: 6, strokeLinecap: 'round' }} data-testid="transmitted-beam" />
        </>
      )}
      <path d={liquid} style={{ fill: colour }} />
      {precipitate && (
        <path
          d={`M${lx1} ${lb - 12} H${lx2} V${lb - (r - WALL)} Q${lx2} ${lb} ${lx2 - (r - WALL)} ${lb} H${lx1 + (r - WALL)} Q${lx1} ${lb} ${lx1} ${lb - (r - WALL)} Z`}
          style={{ fill: ION_COLOUR_TOKEN[precipitate] }}
          data-testid="precipitate"
        />
      )}
      <path d={glass} style={{ fill: 'var(--glass-fill)', fillOpacity: 0.18, stroke: 'none' }} />
      <path d={glass} style={{ fill: 'none', stroke: 'var(--glass-wall)', strokeWidth: 2, strokeLinejoin: 'round' }} />
      <path
        d={`M${g.left + 12} ${g.rimY + 14} V${g.bottomY - 20}`}
        style={{ stroke: 'var(--glass-sheen)', strokeWidth: 3, strokeLinecap: 'round', fill: 'none' }}
      />
      {label !== undefined && (
        <Label x={width / 2} y={by + BEAKER_H + 30} textAnchor="middle" fontSize={15} fill="var(--fg)">
          {label}
        </Label>
      )}
    </g>
  )
})

/** Height of a SolutionColour drawing, for layouts. */
export const SOLUTION_COLOUR_HEIGHT = 10 + BEAKER_H + 40
