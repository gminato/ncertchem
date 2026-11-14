import React, { forwardRef } from 'react'
import { Label } from './Label'

export interface OrbitalSpin {
  /** An electron with spin +½ (drawn up). */
  up: boolean
  /** An electron with spin −½ (drawn down). */
  down: boolean
}

export interface OrbitalBoxProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** One entry per box, so the length of this array is the number of orbitals in the subshell. */
  orbitals: readonly OrbitalSpin[]
  /** The subshell label, for example "2p". Shown to the left of the boxes. */
  label?: React.ReactNode
  /** Indices of boxes to emphasise, such as the one being filled next. */
  highlight?: readonly number[]
  /** 'violation' outlines the whole subshell in --caution. */
  state?: 'ok' | 'violation'
  x?: number
  y?: number
  /** Side of one square box, in SVG units. */
  size?: number
  /** Space between boxes. */
  gap?: number
  fontSize?: number
}

const LABEL_WIDTH = 30
const OUTLINE_PAD = 5
const ARROW_HALF_WIDTH = 4.2
const UP_X = 0.36
const DOWN_X = 0.64
const ARROW_TOP = 0.2
const ARROW_BOTTOM = 0.8

/** Total width of an OrbitalBox row, for layout. */
export function orbitalBoxWidth(
  count: number,
  { size = 36, gap = 6, hasLabel = true }: { size?: number; gap?: number; hasLabel?: boolean } = {}
): number {
  const boxes = count * size + Math.max(0, count - 1) * gap
  return hasLabel ? LABEL_WIDTH + boxes : boxes
}

/**
 * A subshell drawn as box-and-arrow notation: one square per orbital, with up
 * to two arrows in each box. Arrows are stroked SVG paths in --electron.
 */
export const OrbitalBox = forwardRef<SVGGElement, OrbitalBoxProps>(function OrbitalBox(
  {
    orbitals,
    label,
    highlight = [],
    state = 'ok',
    x = 0,
    y = 0,
    size = 36,
    gap = 6,
    fontSize = 14,
    className,
    style,
    ...rest
  },
  ref
) {
  const hasLabel = label !== undefined && label !== null && label !== false
  const originX = hasLabel ? LABEL_WIDTH : 0
  const rowWidth = orbitalBoxWidth(orbitals.length, { size, gap, hasLabel: false })
  const violation = state === 'violation'
  const radius = Math.max(2, size * 0.11)

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      style={style}
      data-state={state}
      {...rest}
    >
      {violation && (
        <rect
          x={originX - OUTLINE_PAD}
          y={-OUTLINE_PAD}
          width={rowWidth + OUTLINE_PAD * 2}
          height={size + OUTLINE_PAD * 2}
          rx={radius + 2}
          strokeWidth={1.6}
          style={{
            stroke: 'var(--caution)',
            fill: 'var(--caution-soft)',
          }}
          data-testid="orbital-violation"
        />
      )}

      {hasLabel && (
        <Label x={0} y={size / 2} textAnchor="start" fontSize={fontSize} fill="var(--fg-muted)">
          {label}
        </Label>
      )}

      {orbitals.map((orbital, i) => {
        const bx = originX + i * (size + gap)
        const isHighlighted = highlight.includes(i)
        return (
          <g key={`box-${i}`} data-testid="orbital-box" data-highlight={isHighlighted ? 'true' : undefined}>
            <rect
              x={bx}
              y={0}
              width={size}
              height={size}
              rx={radius}
              strokeWidth={isHighlighted ? 1.8 : 1.2}
              style={{
                stroke: isHighlighted ? 'var(--accent)' : 'var(--fg-subtle)',
                fill: isHighlighted ? 'var(--accent-soft)' : 'var(--surface-raised)',
              }}
            />
            {orbital.up && <SpinArrow x={bx + size * UP_X} size={size} direction="up" />}
            {orbital.down && <SpinArrow x={bx + size * DOWN_X} size={size} direction="down" />}
          </g>
        )
      })}
    </g>
  )
})

/**
 * A stroked arrow for one electron. The shaft runs from the bottom to the top
 * of the box, and the head is an open chevron, so it stays crisp at any size.
 */
function SpinArrow({ x, size, direction }: { x: number; size: number; direction: 'up' | 'down' }) {
  const top = size * ARROW_TOP
  const bottom = size * ARROW_BOTTOM
  const tipY = direction === 'up' ? top : bottom
  const tailY = direction === 'up' ? bottom : top
  const headY = direction === 'up' ? top + size * 0.2 : bottom - size * 0.2
  const head = `M${x - ARROW_HALF_WIDTH},${headY} L${x},${tipY} L${x + ARROW_HALF_WIDTH},${headY}`
  return (
    <g data-spin={direction === 'up' ? '+1/2' : '-1/2'}>
      <path
        d={`M${x},${tailY} L${x},${tipY}`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: 'var(--electron)' }}
      />
      <path
        d={head}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'var(--electron)' }}
      />
    </g>
  )
}
