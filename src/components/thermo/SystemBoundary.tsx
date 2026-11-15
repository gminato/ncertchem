import React, { forwardRef, useId, useMemo } from 'react'
import { scatterField, type Point } from './geometry'
import styles from './thermo.module.css'

export type BoundaryKind = 'open' | 'closed' | 'isolated'
export type FlowDirection = 'in' | 'out'

export interface SystemBoundaryProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /**
   * `open`: gaps in every wall, so matter and energy cross.
   * `closed`: a solid wall, so only energy crosses.
   * `isolated`: a double insulated wall (a thermos). Matter, heat and work are not drawn.
   */
  kind: BoundaryKind
  /** Size of the system region in SVG units. */
  width?: number
  height?: number
  /** Width of the surroundings around the system. */
  margin?: number
  /** Matter crossing the boundary. Only drawn for `open` systems. */
  matter?: 'none' | FlowDirection | 'both'
  /** Heat (q) crossing the boundary, drawn as warm wavy arrows. Not drawn for `isolated`. */
  heat?: 'none' | FlowDirection
  /** Work (w) crossing the boundary, drawn as a piston-push arrow. Not drawn for `isolated`. */
  work?: 'none' | FlowDirection
  /** Particles drawn inside the system, placed deterministically. */
  particles?: number
  /** Moves the flow arrows along their direction. Off by default. */
  animated?: boolean
  x?: number
  y?: number
}

const GAP_FRACTION = 0.3
const WAVE_PERIOD = 12
const PARTICLE_SPACING = 14
const ARROW_HEAD = 6
const WALL = 'var(--fg-muted)'

/** The points of an arrow head whose tip is at (tx, ty) and which points along (dx, dy). */
function arrowHead(tx: number, ty: number, dx: number, dy: number, size = ARROW_HEAD): string {
  const bx = tx - dx * size
  const by = ty - dy * size
  const px = -dy * size * 0.55
  const py = dx * size * 0.55
  return `${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}`
}

/** A horizontal wave from x0 to x1 with one period every `WAVE_PERIOD` units. */
function wavePath(x0: number, x1: number, y: number, amp: number): string {
  const dir = Math.sign(x1 - x0) || 1
  const step = WAVE_PERIOD / 8
  const pts: string[] = []
  let i = 0
  for (let x = x0; dir > 0 ? x <= x1 : x >= x1; x += dir * step, i++) {
    const phase = (2 * Math.PI * (x - x0)) / (WAVE_PERIOD * dir)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${(y + amp * Math.sin(phase)).toFixed(2)}`)
  }
  return pts.join(' ')
}

/** The parts of the segment a→b that remain once a gap of `gapLen` is cut from its middle. */
function wallSegments(a: Point, b: Point, gapLen: number): string[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const half = gapLen > 0 ? Math.min(0.49, gapLen / (2 * len)) : 0
  const at = (t: number) =>
    `${(a.x + (b.x - a.x) * t).toFixed(2)},${(a.y + (b.y - a.y) * t).toFixed(2)}`
  if (half === 0) return [`M${at(0)} L${at(1)}`]
  return [`M${at(0)} L${at(0.5 - half)}`, `M${at(0.5 + half)} L${at(1)}`]
}

/**
 * A system (a vessel or a region) inside its surroundings, with its boundary drawn
 * as open, closed or isolated. Flows use one vocabulary everywhere: particles for
 * matter, warm wavy arrows for heat (q) and a piston-push arrow for work (w).
 * Like the other vocabulary parts it has no text; labels belong to the caller.
 */
export const SystemBoundary = forwardRef<SVGGElement, SystemBoundaryProps>(function SystemBoundary(
  {
    kind,
    width = 120,
    height = 90,
    margin = 40,
    matter = 'none',
    heat = 'none',
    work = 'none',
    particles = 0,
    animated = false,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const idBase = useId().replace(/[^a-zA-Z0-9]/g, '')
  const hatchId = `thermo-hatch-${idBase}`
  const left = -width / 2
  const right = width / 2
  const top = -height / 2
  const bottom = height / 2
  const isolated = kind === 'isolated'
  const open = kind === 'open'

  // Matter only crosses open boundaries; energy never crosses an isolated one.
  const matterFlow = open ? matter : 'none'
  const heatFlow = isolated ? 'none' : heat
  const workFlow = isolated ? 'none' : work

  const dots = useMemo(
    () =>
      particles > 0
        ? scatterField(particles, { x0: left + 12, y0: top + 12, x1: right - 12, y1: bottom - 12 }, 11)
        : [],
    [particles, left, right, top, bottom]
  )

  const gapW = width * GAP_FRACTION
  const gapH = height * GAP_FRACTION
  const flowClass = animated ? styles.flow : undefined

  // Open walls: each side has a gap in its middle; the bottom is kept solid.
  const openWall = [
    ...wallSegments({ x: left, y: top }, { x: right, y: top }, gapW),
    ...wallSegments({ x: right, y: top }, { x: right, y: bottom }, gapH),
    ...wallSegments({ x: right, y: bottom }, { x: left, y: bottom }, 0),
    ...wallSegments({ x: left, y: bottom }, { x: left, y: top }, gapH),
  ].join(' ')

  const matterPasses: Array<{ x: number; dir: FlowDirection }> = []
  if (matterFlow === 'in' || matterFlow === 'both') matterPasses.push({ x: -gapW * 0.18, dir: 'in' })
  if (matterFlow === 'out' || matterFlow === 'both') matterPasses.push({ x: gapW * 0.18, dir: 'out' })

  // Matter particles: one lattice that repeats every PARTICLE_SPACING, clipped to the
  // column above the gap so that the loop never shows a pop at its ends.
  const matterY0 = top - margin - 2 * PARTICLE_SPACING
  const matterYs: number[] = []
  for (let yy = matterY0; yy <= top + 4 + PARTICLE_SPACING; yy += PARTICLE_SPACING) matterYs.push(yy)

  // Heat runs from the outside (tail) to just inside the wall (tip) on the left.
  const heatIn = heatFlow === 'in'
  const heatSx = heatIn ? 1 : -1
  const heatOuter = left - margin * 0.82
  const heatInner = left + 6
  const heatTail = heatIn ? heatOuter : heatInner
  const heatTip = heatIn ? heatInner : heatOuter

  // Work is a piston pushing along the right wall: the bar sits at the tail, where the force acts.
  const workIn = workFlow === 'in'
  const workSx = workIn ? -1 : 1
  const workOuter = right + margin * 0.82
  const workInner = right - 4
  const workTail = workIn ? workOuter : workInner
  const workTip = workIn ? workInner : workOuter

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} {...rest}>
      {/* Surroundings */}
      <rect
        x={left - margin}
        y={top - margin}
        width={width + 2 * margin}
        height={height + 2 * margin}
        rx={14}
        style={{ fill: 'var(--surface)', stroke: 'var(--border)' }}
        strokeWidth={1}
      />

      {/* Walls and the system's interior */}
      {isolated ? (
        <g>
          <defs>
            <pattern id={hatchId} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={5} style={{ stroke: 'var(--glass-wall)' }} strokeWidth={1} />
            </pattern>
          </defs>
          <rect
            x={left - 6}
            y={top - 6}
            width={width + 12}
            height={height + 12}
            rx={12}
            fill={`url(#${hatchId})`}
            style={{ stroke: WALL }}
            strokeWidth={1.8}
          />
          <rect
            x={left}
            y={top}
            width={width}
            height={height}
            rx={8}
            style={{ fill: 'var(--glass-fill)', stroke: WALL }}
            strokeWidth={1.8}
          />
        </g>
      ) : open ? (
        <g>
          <rect x={left} y={top} width={width} height={height} style={{ fill: 'var(--glass-fill)' }} />
          <path d={openWall} fill="none" style={{ stroke: WALL }} strokeWidth={2} strokeLinecap="round" />
        </g>
      ) : (
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={8}
          style={{ fill: 'var(--glass-fill)', stroke: WALL }}
          strokeWidth={2.2}
        />
      )}

      {/* Particles inside the system */}
      {dots.map((d, i) => (
        <circle
          key={`p-${i}`}
          cx={d.x}
          cy={d.y}
          r={4.5}
          style={{ fill: 'var(--el-other)', stroke: 'var(--surface)' }}
          strokeWidth={1}
        />
      ))}

      {/* Matter: particles that pass through the top gap */}
      {matterPasses.map((pass) => {
        const clipId = `thermo-matter-${idBase}-${pass.dir}`
        const dy = pass.dir === 'in' ? PARTICLE_SPACING : -PARTICLE_SPACING
        const headTip = pass.dir === 'in' ? top + 8 : top - margin + 4
        const headDir = pass.dir === 'in' ? 1 : -1
        return (
          <g key={`matter-${pass.dir}`}>
            <defs>
              <clipPath id={clipId}>
                <rect x={pass.x - 10} y={top - margin} width={20} height={margin + 8} />
              </clipPath>
            </defs>
            <line
              x1={pass.x}
              y1={top - margin + 4}
              x2={pass.x}
              y2={top + 4}
              strokeWidth={1.2}
              strokeDasharray="2 3"
              style={{ stroke: WALL }}
            />
            <polygon points={arrowHead(pass.x, headTip, 0, headDir)} style={{ fill: WALL }} />
            <g clipPath={`url(#${clipId})`}>
              <g className={flowClass} style={{ ['--flow-dy' as string]: `${dy}px` } as React.CSSProperties}>
                {matterYs.map((yy) => (
                  <circle key={`mp-${pass.dir}-${yy}`} cx={pass.x} cy={yy} r={3.2} style={{ fill: 'var(--el-other)' }} />
                ))}
              </g>
            </g>
          </g>
        )
      })}

      {/* Heat: a warm wavy arrow crossing the left wall */}
      {heatFlow !== 'none' && (
        <g>
          <g className={flowClass} style={{ ['--flow-dx' as string]: `${heatSx * WAVE_PERIOD}px` } as React.CSSProperties}>
            <path
              d={wavePath(heatTail, heatTip - heatSx * ARROW_HEAD, 0, 3.2)}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              style={{ stroke: 'var(--heat)' }}
            />
          </g>
          <polygon points={arrowHead(heatTip, 0, heatSx, 0)} style={{ fill: 'var(--heat)' }} />
        </g>
      )}

      {/* Work: a piston bar and a shaft pushing along the right wall */}
      {workFlow !== 'none' && (
        <g>
          <line
            x1={workTail}
            y1={0}
            x2={workTip - workSx * 8}
            y2={0}
            strokeWidth={3}
            style={{ stroke: 'var(--work)' }}
          />
          <polygon points={arrowHead(workTip, 0, workSx, 0, 8)} style={{ fill: 'var(--work)' }} />
          <line
            x1={workTail}
            y1={-14}
            x2={workTail}
            y2={14}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ stroke: 'var(--work)' }}
          />
        </g>
      )}
    </g>
  )
})
