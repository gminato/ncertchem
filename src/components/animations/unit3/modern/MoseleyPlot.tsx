'use client'

import { moseleyLine, MOSELEY_SLOPE_SCALED } from '@/lib/chem/moseley'
import { MOSELEY_Z_RANGE, moseleyTarget } from './modern-steps'
import { orbitLabelPosition } from '@/components/vocab/placement'
import styles from './modern.module.css'

export interface MoseleyPlotProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 540, the Scrolly panel's aspect ratio)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const PLOT = { left: 104, right: 600, top: 84, bottom: 448 }
const X_DOMAIN: [number, number] = [0, 32]
const Y_DOMAIN: [number, number] = [0, 16]
const X_TICKS = [0, 5, 10, 15, 20, 25, 30]
const Y_TICKS = [0, 4, 8, 12, 16]

const xFor = (Z: number) =>
  PLOT.left + ((Z - X_DOMAIN[0]) / (X_DOMAIN[1] - X_DOMAIN[0])) * (PLOT.right - PLOT.left)
const yFor = (y: number) =>
  PLOT.bottom - ((y - Y_DOMAIN[0]) / (Y_DOMAIN[1] - Y_DOMAIN[0])) * (PLOT.bottom - PLOT.top)

const POINTS = moseleyLine(MOSELEY_Z_RANGE.min, MOSELEY_Z_RANGE.max).map((p) => ({
  Z: p.Z,
  x: xFor(p.Z),
  y: yFor(p.y),
}))

// Point labels sit below and to the right of the line, where nothing is drawn. The
// orbit helper puts each label on a ray from its point, so the leader line is radial.
const LABEL_POINTS = POINTS.map((p) => orbitLabelPosition(p.x, p.y, 0, 62, 34))

// The line runs from Z = 1 (where √ν = 0) to Z = 32, at the right edge of the plot.
const LINE_START = { x: xFor(1), y: yFor(0) }
const LINE_END = { x: xFor(32), y: yFor(31 * MOSELEY_SLOPE_SCALED) }
const LINE_D = `M ${LINE_START.x} ${LINE_START.y} L ${LINE_END.x} ${LINE_END.y}`

// The Z = 1 callout sits in the empty upper-left of the plot, with a vertical leader to the intercept.
const CALLOUT: { x: number; y: number; textAnchor: 'start' } = { x: PLOT.left + 12, y: PLOT.top + 70, textAnchor: 'start' }

/**
 * MoseleyPlot: the square root of the K-alpha frequency against atomic number. The
 * points are computed from the Kα approximation in moseley.ts, so the plot shows a model,
 * not measurements. Step 1 places the points, step 2 draws the straight line, and step 3
 * marks where the line meets the axis at Z = 1.
 */
export function MoseleyPlot({ step, reducedMotion }: MoseleyPlotProps) {
  const target = moseleyTarget(step)
  const transition = reducedMotion ? 'none' : undefined
  const gridTop = PLOT.top
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="Plot of the square root of the K-alpha frequency against atomic number, a straight line through Z = 1"
    >
      <g className={styles.axes}>
        {Y_TICKS.map((t) => (
          <g key={`y${t}`}>
            <line x1={PLOT.left} x2={PLOT.right} y1={yFor(t)} y2={yFor(t)} className={styles.grid} />
            <text x={PLOT.left - 12} y={yFor(t) + 5} textAnchor="end" className={styles.tick}>
              {t}
            </text>
          </g>
        ))}
        {X_TICKS.map((t) => (
          <g key={`x${t}`}>
            <line x1={xFor(t)} x2={xFor(t)} y1={gridTop} y2={PLOT.bottom} className={styles.gridFaint} />
            <text x={xFor(t)} y={PLOT.bottom + 22} textAnchor="middle" className={styles.tick}>
              {t}
            </text>
          </g>
        ))}
        <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} className={styles.axis} />
        <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} className={styles.axis} />
        <text x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 50} textAnchor="middle" className={styles.axisLabel}>
          <tspan className="sym">Z</tspan> (atomic number)
        </text>
        <text
          x={28}
          y={(PLOT.top + PLOT.bottom) / 2}
          textAnchor="middle"
          transform={`rotate(-90 28 ${(PLOT.top + PLOT.bottom) / 2})`}
          className={styles.axisLabel}
        >
          <tspan className="sym">√ν</tspan> / 10⁸ Hz<tspan dy="-6" fontSize="10">½</tspan>
        </text>
      </g>

      <path
        d={LINE_D}
        pathLength={1}
        className={styles.fitLine}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: target.lineProgress > 0 ? 0 : 1,
          transition: transition ?? 'stroke-dashoffset 1.1s ease-out',
        }}
      />

      {POINTS.map((p, i) => {
        const shown = i < target.points
        return (
          <g
            key={p.Z}
            className={styles.point}
            style={{
              opacity: shown ? 1 : 0,
              transition: transition ?? `opacity 0.35s ease ${i * 0.04}s`,
            }}
          >
            <circle cx={p.x} cy={p.y} r={6} className={styles.pointDot} />
            {i % 4 === 0 && (
              <>
                <line x1={p.x} y1={p.y} x2={LABEL_POINTS[i].x} y2={LABEL_POINTS[i].y} className={styles.leader} />
                <text x={LABEL_POINTS[i].x} y={LABEL_POINTS[i].y + 5} textAnchor={LABEL_POINTS[i].textAnchor} className={styles.pointLabel}>
                  Z {p.Z}
                </text>
              </>
            )}
          </g>
        )
      })}

      <g style={{ opacity: target.intercept ? 1 : 0, transition: transition ?? 'opacity 0.4s ease' }}>
        <circle cx={LINE_START.x} cy={LINE_START.y} r={5} className={styles.interceptDot} />
        <line x1={LINE_START.x} y1={LINE_START.y} x2={CALLOUT.x - 4} y2={CALLOUT.y - 5} className={styles.leader} />
        <text x={CALLOUT.x} y={CALLOUT.y} textAnchor={CALLOUT.textAnchor} className={styles.callout}>
          <tspan className="sym">Z</tspan> = 1: <tspan className="sym">√ν</tspan> = 0
        </text>
      </g>

      <text x={PLOT.left} y={VIEW_HEIGHT - 26} className={styles.note}>
        Kα approximation <tspan className="sym">ν</tspan> = ¾ <tspan className="sym">R</tspan>∞<tspan className="sym">c</tspan> (<tspan className="sym">Z</tspan> − 1)², computed here. Not measured data.
      </text>
      <text x={PLOT.left} y={VIEW_HEIGHT - 8} className={styles.note}>
        Slope √(3R∞c/4) ≈ {MOSELEY_SLOPE_SCALED.toFixed(3)} × 10⁸ Hz½ for each unit of <tspan className="sym">Z</tspan>.
      </text>
    </svg>
  )
}
