'use client'

import { Label } from '@/components/vocab/Label'
import {
  FACTORS,
  FACTOR_STEPS,
  RUNNING_VALUES,
  START_UNIT,
  START_VALUE,
  UNIT_NAMES,
  clampStep,
  quantityText,
  snapshotForStep,
} from './factor-steps'
import { useSnapshotTween } from './useSnapshotTween'
import styles from './unit1.module.css'

export interface UnitFactorsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const ROW1 = 170
const ROW2 = 330
const NUM_FONT = 44
const SMALL_FONT = 24
/** Column x positions shared by both rows. */
const X = { start: 112, times: 226, fracCentre: 322, equals: 420, result: 452 }

/**
 * UnitFactors: 2.5 h to seconds in two unit-factor steps. Each factor is a
 * fraction equal to 1. Units that appear on both the top and the bottom are
 * struck through and faded, so the Learner sees them cancel.
 */
export function UnitFactors({ step, reducedMotion }: UnitFactorsProps) {
  const activeStep = clampStep(step)
  const view = useSnapshotTween(snapshotForStep(activeStep), reducedMotion)
  const summary = `${FACTOR_STEPS[activeStep].name}. ${START_VALUE} ${START_UNIT} = ${RUNNING_VALUES[2]} ${UNIT_NAMES[1]}.`

  const fade = (c: number) => 1 - 0.75 * c

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={summary}
        data-testid="unit-factors"
        data-step={activeStep}
      >
        <Label x={VIEW_WIDTH / 2} y={58} fontSize={22} fill="var(--fg)" style={{ fontWeight: 600 }}>
          {FACTOR_STEPS[activeStep].name}
        </Label>

        {/* Row 1: start, then 60 min / 1 h, which gives 150 min */}
        <g data-testid="factor-row-1">
          <Label x={X.start} y={ROW1} fontSize={NUM_FONT} textAnchor="end" fill="var(--fg)">
            {quantityText(START_VALUE)}
          </Label>
          <g opacity={fade(view.c1)} data-testid="cancel-hours-start">
            <Label x={X.start + 8} y={ROW1} fontSize={NUM_FONT} textAnchor="start" fill="var(--fg)">
              {START_UNIT}
            </Label>
          </g>
          <line
            x1={X.start + 4}
            x2={X.start + 36}
            y1={ROW1 + 4}
            y2={ROW1 - 26}
            stroke="var(--proton)"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={view.c1}
          />

          <Label x={X.times} y={ROW1} fontSize={NUM_FONT} fill="var(--fg-muted)">
            ×
          </Label>

          <g opacity={view.f1}>
            <Label x={X.fracCentre} y={ROW1 - 30} fontSize={SMALL_FONT} fill="var(--fg)">
              {FACTORS[0]} {UNIT_NAMES[0]}
            </Label>
            <line x1={X.fracCentre - 66} x2={X.fracCentre + 66} y1={ROW1} y2={ROW1} stroke="var(--fg-muted)" strokeWidth={2.5} strokeLinecap="round" />
            <Label x={X.fracCentre - 8} y={ROW1 + 32} fontSize={SMALL_FONT} textAnchor="end" fill="var(--fg)">
              1
            </Label>
            <Label x={X.fracCentre + 2} y={ROW1 + 32} fontSize={SMALL_FONT} textAnchor="start" fill="var(--fg)" opacity={fade(view.c1)}>
              {START_UNIT}
            </Label>
            <line
              x1={X.fracCentre}
              x2={X.fracCentre + 24}
              y1={ROW1 + 42}
              y2={ROW1 + 20}
              stroke="var(--proton)"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={view.c1}
            />
          </g>

          <g opacity={view.f1}>
            <Label x={X.equals} y={ROW1} fontSize={NUM_FONT} fill="var(--fg-muted)">
              =
            </Label>
            <Label x={X.result} y={ROW1} fontSize={NUM_FONT} textAnchor="start" fill="var(--fg)">
              {quantityText(RUNNING_VALUES[1])} {UNIT_NAMES[0]}
            </Label>
          </g>
        </g>

        {/* Row 2: 150 min, then 60 s / 1 min, which gives 9000 s */}
        <g opacity={view.f2} data-testid="factor-row-2">
          <Label x={X.start} y={ROW2} fontSize={NUM_FONT} textAnchor="end" fill="var(--fg)">
            {quantityText(RUNNING_VALUES[1])}
          </Label>
          <g opacity={fade(view.c2)} data-testid="cancel-minutes-start">
            <Label x={X.start + 8} y={ROW2} fontSize={NUM_FONT} textAnchor="start" fill="var(--fg)">
              {UNIT_NAMES[0]}
            </Label>
          </g>
          <line
            x1={X.start + 4}
            x2={X.start + 84}
            y1={ROW2 + 4}
            y2={ROW2 - 26}
            stroke="var(--proton)"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={view.c2}
          />

          <Label x={X.times} y={ROW2} fontSize={NUM_FONT} fill="var(--fg-muted)">
            ×
          </Label>

          <Label x={X.fracCentre} y={ROW2 - 30} fontSize={SMALL_FONT} fill="var(--fg)">
            {FACTORS[1]} {UNIT_NAMES[1]}
          </Label>
          <line x1={X.fracCentre - 66} x2={X.fracCentre + 66} y1={ROW2} y2={ROW2} stroke="var(--fg-muted)" strokeWidth={2.5} strokeLinecap="round" />
          <Label x={X.fracCentre - 8} y={ROW2 + 32} fontSize={SMALL_FONT} textAnchor="end" fill="var(--fg)">
            1
          </Label>
          <Label x={X.fracCentre + 2} y={ROW2 + 32} fontSize={SMALL_FONT} textAnchor="start" fill="var(--fg)" opacity={fade(view.c2)}>
            {UNIT_NAMES[0]}
          </Label>
          <line
            x1={X.fracCentre}
            x2={X.fracCentre + 40}
            y1={ROW2 + 42}
            y2={ROW2 + 20}
            stroke="var(--proton)"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={view.c2}
          />

          <Label x={X.equals} y={ROW2} fontSize={NUM_FONT} fill="var(--fg-muted)">
            =
          </Label>
          <Label x={X.result} y={ROW2} fontSize={NUM_FONT} textAnchor="start" fill="var(--fg)">
            {quantityText(RUNNING_VALUES[2])} {UNIT_NAMES[1]}
          </Label>
        </g>

        <g opacity={view.fin} data-testid="factor-final">
          <Label x={VIEW_WIDTH / 2} y={460} fontSize={34} fill="var(--accent)" style={{ fontWeight: 600 }}>
            {START_VALUE} h = {quantityText(RUNNING_VALUES[2])} s
          </Label>
          <Label x={VIEW_WIDTH / 2} y={505} fontSize={16} fill="var(--fg-muted)">
            Each factor equals 1, so the quantity is unchanged and only its unit changes.
          </Label>
        </g>
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
