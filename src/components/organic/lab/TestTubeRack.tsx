import React, { forwardRef } from 'react'
import { Caption } from './primitives'
import { TestTube, type TestTubeProps } from './TestTube'

export type RackTube = TestTubeProps & {
  id: string
  /** Second label line under the tube, e.g. the test name. Drawn smaller than `label`. */
  sub?: string
}

export interface TestTubeRackProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** One entry per tube, drawn left to right and wrapped into rows of `columns`. */
  tubes: readonly RackTube[]
  /** Tubes per row. */
  columns?: number
  /** Spacing between tube centres in SVG units. Wide enough for the two-line labels. */
  spacing?: number
  /** Width of the drawing in SVG units, used to centre each row. */
  width?: number
  /** Progress applied to every tube's precipitate. */
  progress?: number
  title?: string
  x?: number
  y?: number
}

/** Height of one rack row in SVG units. Parents use it, with `width`, as the viewBox. */
export const TEST_TUBE_RACK_ROW_HEIGHT = 232

const TUBE_TOP = 16
const BOARD = { y: TUBE_TOP + 146, h: 14 }

/**
 * A rack of test tubes standing on a board, with a two-line label under each tube. Used for
 * Lassaigne's tests, where each colour or precipitate identifies one element.
 */
export const TestTubeRack = forwardRef<SVGGElement, TestTubeRackProps>(function TestTubeRack(
  { tubes, columns = 4, spacing = 88, width = 360, progress = 0, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const rows: RackTube[][] = []
  for (let i = 0; i < tubes.length; i += columns) rows.push(tubes.slice(i, i + columns))

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Test tube rack'} {...rest}>
      {rows.map((row, r) => {
        const rowY = r * TEST_TUBE_RACK_ROW_HEIGHT
        const span = (row.length - 1) * spacing
        const firstX = (width - span) / 2
        const cx = (i: number) => firstX + i * spacing
        const boardW = span + 40
        return (
          <g key={`row-${r}`} transform={`translate(0, ${rowY})`}>
            {row.map((tube, i) => {
              const { id, label, sub, ...tubeProps } = tube
              return <TestTube key={id} {...tubeProps} progress={progress} x={cx(i)} y={TUBE_TOP} />
            })}

            {/* Board the tubes stand in */}
            <rect x={firstX - 20} y={BOARD.y} width={boardW} height={BOARD.h} rx={4} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
            {row.map((tube, i) => (
              <ellipse key={`hole-${tube.id}`} cx={cx(i)} cy={BOARD.y + BOARD.h / 2} rx={15} ry={4} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1} />
            ))}

            {row.map((tube, i) => (
              <g key={`lb-${tube.id}`}>
                {tube.label && (
                  <Caption x={cx(i)} y={BOARD.y + BOARD.h + 20} size={15} fill="var(--fg)">
                    {tube.label}
                  </Caption>
                )}
                {tube.sub && (
                  <Caption x={cx(i)} y={BOARD.y + BOARD.h + 38} size={13}>
                    {tube.sub}
                  </Caption>
                )}
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )
})
