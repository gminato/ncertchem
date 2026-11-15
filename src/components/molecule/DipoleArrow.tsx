import React, { forwardRef } from 'react'
import { Label } from '../vocab/Label'

export interface DipoleArrowProps extends Omit<React.SVGAttributes<SVGGElement>, 'children' | 'from' | 'to'> {
  /** Tail of the arrow: the δ+ end. */
  from: { x: number; y: number }
  /** Head of the arrow: the δ− end. */
  to: { x: number; y: number }
  /** Text for the two ends. Defaults to δ+ and δ−. */
  positiveLabel?: React.ReactNode
  negativeLabel?: React.ReactNode
  x?: number
  y?: number
}

const HEAD_LENGTH = 9
const HEAD_HALF = 4.5
const CROSS_HALF = 6
const LABEL_OFFSET = 14

/**
 * A bond or net dipole in the chemists' convention: an arrow from the δ+ end to
 * the δ− end, with a crossed tail (a short bar across the tail, marking the
 * positive end). Labels sit beside each end.
 */
export const DipoleArrow = forwardRef<SVGGElement, DipoleArrowProps>(function DipoleArrow(
  { from, to, positiveLabel, negativeLabel, x = 0, y = 0, className, style, ...rest },
  ref
) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const nx = -uy
  const ny = ux

  const shaftEnd = { x: to.x - ux * HEAD_LENGTH, y: to.y - uy * HEAD_LENGTH }
  const headBase1 = { x: shaftEnd.x + nx * HEAD_HALF, y: shaftEnd.y + ny * HEAD_HALF }
  const headBase2 = { x: shaftEnd.x - nx * HEAD_HALF, y: shaftEnd.y - ny * HEAD_HALF }

  const posAt = { x: from.x - ux * LABEL_OFFSET + nx * 6, y: from.y - uy * LABEL_OFFSET + ny * 6 }
  const negAt = { x: to.x + ux * LABEL_OFFSET - nx * 6, y: to.y + uy * LABEL_OFFSET - ny * 6 }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      <line
        x1={from.x}
        y1={from.y}
        x2={shaftEnd.x}
        y2={shaftEnd.y}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: 'var(--dipole)' }}
      />
      {/* The crossed tail: a bar across the positive end */}
      <line
        x1={from.x + nx * CROSS_HALF}
        y1={from.y + ny * CROSS_HALF}
        x2={from.x - nx * CROSS_HALF}
        y2={from.y - ny * CROSS_HALF}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: 'var(--dipole)' }}
      />
      <path
        d={`M${to.x},${to.y} L${headBase1.x},${headBase1.y} L${headBase2.x},${headBase2.y} Z`}
        strokeWidth={1}
        strokeLinejoin="round"
        style={{ fill: 'var(--dipole)', stroke: 'var(--dipole)' }}
      />
      <Label x={posAt.x} y={posAt.y} fontSize={13} fill="var(--dipole)">
        {positiveLabel ?? (
          <>
            δ<tspan dy="-0.45em" fontSize="0.7em">+</tspan>
          </>
        )}
      </Label>
      <Label x={negAt.x} y={negAt.y} fontSize={13} fill="var(--dipole)">
        {negativeLabel ?? (
          <>
            δ<tspan dy="-0.45em" fontSize="0.7em">−</tspan>
          </>
        )}
      </Label>
    </g>
  )
})
