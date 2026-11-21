import React, { forwardRef } from 'react'
import { Electron } from '../Electron'
import { flowFractions, pointAlong, type FlowDirection, type Point } from './geometry'

export interface WireProps extends React.SVGAttributes<SVGGElement> {
  /** Corners of the wire, in the parent's coordinates. Dots run from the first point to the last when `direction` is forward. */
  corners: readonly Point[]
  /** Loop phase 0 to 1, set by the parent. */
  t?: number
  /** Show electron dots moving along the wire. */
  electrons?: boolean
  /** Number of electron dots. */
  dots?: number
  /** Direction the electrons move along the points. */
  direction?: FlowDirection
  /** Draw a conventional-current arrow beside the wire. It points opposite to the electrons. */
  currentArrow?: boolean
  /** Caption for the conventional-current arrow. Pass it already formatted. */
  currentLabel?: string
  strokeWidth?: number
}

/** Direction the conventional-current arrow points: opposite to electron flow. */
export function conventionalSign(direction: FlowDirection): 1 | -1 {
  return direction === 'forward' ? -1 : 1
}

/**
 * A wire with optional electron dots, drawn with the site's Electron. The
 * conventional current is a separate, dashed-look arrow, so the two never blur.
 */
export const Wire = forwardRef<SVGGElement, WireProps>(function Wire(
  {
    corners,
    t = 0,
    electrons = true,
    dots = 3,
    direction = 'forward',
    currentArrow = false,
    currentLabel,
    strokeWidth = 4,
    className,
    ...rest
  },
  ref
) {
  const d = corners.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  const dotPositions = electrons ? flowFractions(dots, t, direction).map((f) => pointAlong(corners, f)) : []
  const mid = pointAlong(corners, 0.5)
  const sign = conventionalSign(direction)
  const rad = (mid.angle * Math.PI) / 180
  const ux = Math.cos(rad) * sign
  const uy = Math.sin(rad) * sign
  // Normal pointing "above" the wire, so the arrow sits clear of the stroke
  const nx = uy
  const ny = -ux
  const off = 22
  const cx = mid.x + nx * off
  const cy = mid.y + ny * off
  const half = 20
  const tailX = cx - ux * half
  const tailY = cy - uy * half
  const tipX = cx + ux * half
  const tipY = cy + uy * half
  const head = 6
  const headA = { x: tipX - ux * head + nx * 4, y: tipY - uy * head + ny * 4 }
  const headB = { x: tipX - ux * head - nx * 4, y: tipY - uy * head - ny * 4 }

  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      <path d={d} fill="none" stroke="var(--glass-wall)" strokeWidth={strokeWidth + 2} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke="var(--fg-subtle)" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      {dotPositions.map((p, i) => (
        <Electron key={i} x={p.x} y={p.y} size={9} />
      ))}
      {currentArrow && (
        <g>
          <line x1={tailX} y1={tailY} x2={tipX} y2={tipY} stroke="var(--current)" strokeWidth={2.4} strokeLinecap="round" />
          <path
            d={`M${tipX} ${tipY} L${headA.x} ${headA.y} M${tipX} ${tipY} L${headB.x} ${headB.y}`}
            stroke="var(--current)"
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
          {currentLabel && (
            <text x={cx + nx * 14} y={cy + ny * 14 + 5} textAnchor="middle" fontSize={14} fill="var(--current)" fontWeight={600}>
              {currentLabel}
            </text>
          )}
        </g>
      )}
    </g>
  )
})
