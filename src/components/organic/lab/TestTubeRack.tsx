import React, { forwardRef } from 'react'
import { Caption } from './primitives'
import { TestTube, type TestTubeProps } from './TestTube'

export interface TestTubeRackProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** One entry per tube, drawn left to right. Each tube's own `label` is drawn under the rack. */
  tubes: readonly (TestTubeProps & { id: string })[]
  /** Spacing between tube centres in SVG units. */
  spacing?: number
  /** Progress applied to every tube's precipitate. */
  progress?: number
  title?: string
  x?: number
  y?: number
}

const TUBE_TOP = 16
const TUBE_BOTTOM = TUBE_TOP + 148
const BOARD = { y: TUBE_BOTTOM - 2, h: 14 }

/**
 * A rack of test tubes standing on a board, with a label under each tube. Used for Lassaigne's
 * tests, where each colour or precipitate identifies one element.
 */
export const TestTubeRack = forwardRef<SVGGElement, TestTubeRackProps>(function TestTubeRack(
  { tubes, spacing = 42, progress = 0, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const n = tubes.length
  const width = (n - 1) * spacing + 40
  const firstX = 20
  const cx = (i: number) => firstX + i * spacing

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Test tube rack'} {...rest}>
      {tubes.map((tube, i) => {
        const { id, label, ...tubeProps } = tube
        return <TestTube key={id} {...tubeProps} progress={progress} x={cx(i)} y={TUBE_TOP} />
      })}

      {/* Board the tubes stand in */}
      <rect x={firstX - 18} y={BOARD.y} width={width + 4} height={BOARD.h} rx={4} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
      {tubes.map((tube, i) => (
        <ellipse key={`hole-${tube.id}`} cx={cx(i)} cy={BOARD.y + BOARD.h / 2} rx={15} ry={4} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1} />
      ))}

      {tubes.map((tube, i) =>
        tube.label ? (
          <Caption key={`lb-${tube.id}`} x={cx(i)} y={BOARD.y + BOARD.h + 22} size={15} fill="var(--fg)">
            {tube.label}
          </Caption>
        ) : null
      )}
    </g>
  )
})
