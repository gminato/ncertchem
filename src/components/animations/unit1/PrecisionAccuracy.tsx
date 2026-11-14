'use client'

import { Label } from '@/components/vocab/Label'
import {
  TARGET_STEPS,
  TRUE_MASS_G,
  clampStep,
  meanText,
  snapshotForStep,
  spreadText,
} from './precision-targets'
import { useSnapshotTween } from './useSnapshotTween'
import styles from './unit1.module.css'

export interface PrecisionAccuracyProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const CX = 320
const CY = 216
const RADIUS = 150
const DART_R = 7
const RINGS = [0.25, 0.5, 0.75, 1]

/**
 * PrecisionAccuracy: one target per Step. The darts are the four readings, the
 * bullseye is the true mass (5.00 g), and the red cross is the mean of the
 * readings. Darts glide from one target to the next.
 */
export function PrecisionAccuracy({ step, reducedMotion }: PrecisionAccuracyProps) {
  const activeStep = clampStep(step)
  const target = TARGET_STEPS[activeStep]
  const view = useSnapshotTween(snapshotForStep(activeStep), reducedMotion)
  const summary = `${target.name}. Readings ${target.readings.map((r) => r.toFixed(2)).join(', ')} g. Mean ${meanText(target)} g, true mass ${TRUE_MASS_G.toFixed(2)} g.`

  const cross = (x: number, y: number) => ({ x: CX + x * RADIUS, y: CY + y * RADIUS })
  const mean = cross(view.mx, view.my)
  const armLength = 14

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={summary}
        data-testid="precision-accuracy"
        data-step={activeStep}
      >
        <Label x={CX} y={44} fontSize={22} fill="var(--fg)" style={{ fontWeight: 600 }}>
          {target.name}
        </Label>

        {/* Rings, outermost first so the inner rings sit on top */}
        {[...RINGS].reverse().map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r * RADIUS}
            fill={r === 1 ? 'var(--surface-raised)' : r === 0.25 ? 'var(--accent-soft)' : 'none'}
            stroke="var(--border)"
            strokeWidth={r === 1 ? 2 : 1.2}
          />
        ))}
        <circle cx={CX} cy={CY} r={3} fill="var(--fg-muted)" />

        {/* The four darts */}
        {target.darts.map((_, i) => {
          const p = cross(view[`d${i}x`], view[`d${i}y`])
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={DART_R}
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth={2}
            />
          )
        })}

        {/* Mean of the readings */}
        <g data-testid="precision-mean" stroke="var(--proton)" strokeWidth={3} strokeLinecap="round">
          <line x1={mean.x - armLength} x2={mean.x + armLength} y1={mean.y} y2={mean.y} />
          <line x1={mean.x} x2={mean.x} y1={mean.y - armLength} y2={mean.y + armLength} />
        </g>

        <Label x={CX} y={CY + RADIUS + 34} fontSize={16} fill="var(--fg-muted)">
          Bullseye: true mass {TRUE_MASS_G.toFixed(2)} g · red cross: mean
        </Label>
        <Label x={CX} y={CY + RADIUS + 66} fontSize={18} fill="var(--fg)">
          Readings: {target.readings.map((r) => r.toFixed(2)).join(' · ')} g
        </Label>
        <Label x={CX} y={CY + RADIUS + 98} fontSize={18} fill="var(--fg)">
          Mean {meanText(target)} g · range {spreadText(target)} g
        </Label>
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
