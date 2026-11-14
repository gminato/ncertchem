'use client'

import { Label } from '@/components/vocab/Label'
import { G_EARTH, G_MOON } from '@/lib/chem/units'
import {
  MASS_KG,
  MASS_WEIGHT_STEPS,
  SPRING_REST,
  WEIGHT_EARTH_N,
  WEIGHT_EARTH_TEXT,
  WEIGHT_MOON_N,
  WEIGHT_MOON_TEXT,
  clampStep,
  snapshotForStep,
  springStretch,
} from './mass-weight-steps'
import { useSnapshotTween } from './useSnapshotTween'
import styles from './unit1.module.css'

export interface MassWeightProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const HOOK_Y = 130

/** A zigzag spring from (x, y0) down to (x, y1), with its ends on the axis. */
function springPath(x: number, y0: number, y1: number, coils = 9, amp = 11): string {
  const segments = coils * 2
  const points: string[] = [`M ${x} ${y0}`]
  for (let i = 1; i < segments; i++) {
    const px = x + (i % 2 === 1 ? amp : -amp)
    const py = y0 + ((y1 - y0) * i) / segments
    points.push(`L ${px.toFixed(2)} ${py.toFixed(2)}`)
  }
  points.push(`L ${x} ${y1}`)
  return points.join(' ')
}

/** A spring scale: a hook bar, a spring stretched by the weight, and the object. */
function SpringScale({
  x,
  weightN,
  blockWidth,
  blockHeight,
  massText,
}: {
  x: number
  weightN: number
  blockWidth: number
  blockHeight: number
  massText: string
}) {
  const blockTop = HOOK_Y + SPRING_REST + springStretch(weightN)
  return (
    <g>
      <line
        x1={x - 80}
        x2={x + 80}
        y1={HOOK_Y}
        y2={HOOK_Y}
        stroke="var(--fg-muted)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d={springPath(x, HOOK_Y, blockTop)}
        fill="none"
        stroke="var(--fg-muted)"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x={x - blockWidth / 2}
        y={blockTop}
        width={blockWidth}
        height={blockHeight}
        rx={8}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth={2}
      />
      <Label x={x} y={blockTop + blockHeight / 2} fontSize={18} fill="var(--fg)" style={{ fontWeight: 600 }}>
        {massText}
      </Label>
    </g>
  )
}

/**
 * MassWeight: the same 60 kg object, on Earth then on the Moon. A balance
 * compares the object with standard masses, so it reads 60 kg on both. A
 * spring scale measures weight, which is m × g, so it reads less on the Moon.
 */
export function MassWeight({ step, reducedMotion }: MassWeightProps) {
  const activeStep = clampStep(step)
  const view = useSnapshotTween(snapshotForStep(activeStep), reducedMotion)
  const summary = MASS_WEIGHT_STEPS[activeStep].name

  // Balance (Earth)
  const beamY = 190
  const panY = 300

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`${summary}. Mass ${MASS_KG} kg is the same everywhere. Weight is ${WEIGHT_EARTH_TEXT} N on Earth and ${WEIGHT_MOON_TEXT} N on the Moon.`}
        data-testid="mass-weight"
        data-step={activeStep}
      >
        {/* Balance: Earth, mass readout */}
        <g opacity={view.balance} data-testid="mass-weight-balance">
          <Label x={320} y={60} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
            Earth · g = {G_EARTH} m s<Label.Sup>−2</Label.Sup>
          </Label>
          <path d={`M 320 ${beamY} L 300 240 L 340 240 Z`} fill="var(--fg-subtle)" />
          <rect x={250} y={240} width={140} height={10} rx={4} fill="var(--fg-subtle)" />
          <line x1={140} x2={500} y1={beamY} y2={beamY} stroke="var(--fg-muted)" strokeWidth={5} strokeLinecap="round" />
          <circle cx={320} cy={beamY} r={6} fill="var(--fg-muted)" />
          {[140, 500].map((cx) => (
            <g key={cx}>
              <line x1={cx} x2={cx - 30} y1={beamY} y2={panY} stroke="var(--fg-subtle)" strokeWidth={1.5} />
              <line x1={cx} x2={cx + 30} y1={beamY} y2={panY} stroke="var(--fg-subtle)" strokeWidth={1.5} />
              <path
                d={`M ${cx - 50} ${panY} L ${cx + 50} ${panY}`}
                stroke="var(--fg-muted)"
                strokeWidth={3}
                strokeLinecap="round"
              />
            </g>
          ))}
          {/* The object on the left pan */}
          <rect x={112} y={panY - 44} width={56} height={44} rx={6} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
          <Label x={140} y={panY - 22} fontSize={16} fill="var(--fg)" style={{ fontWeight: 600 }}>
            {MASS_KG} kg
          </Label>
          {/* Standard masses on the right pan */}
          <rect x={470} y={panY - 44} width={60} height={44} rx={6} fill="var(--surface-raised)" stroke="var(--fg-subtle)" strokeWidth={1.5} />
          <Label x={500} y={panY - 22} fontSize={16} fill="var(--fg)">
            {MASS_KG} kg
          </Label>
          <Label x={500} y={panY + 24} fontSize={15} fill="var(--fg-muted)">
            standards
          </Label>

          <Label x={320} y={380} fontSize={22} fill="var(--fg)" style={{ fontWeight: 600 }}>
            Balance reads {MASS_KG} kg
          </Label>
          <Label x={320} y={412} fontSize={16}>
            Both pans feel the same g, so the beam stays level.
          </Label>
        </g>

        {/* Spring scale: Moon, weight */}
        <g opacity={view.moon} data-testid="mass-weight-moon">
          <Label x={320} y={60} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
            Moon · g = {G_MOON} m s<Label.Sup>−2</Label.Sup>
          </Label>
          <SpringScale x={320} weightN={WEIGHT_MOON_N} blockWidth={120} blockHeight={64} massText={`${MASS_KG} kg`} />
          <Label x={320} y={330} fontSize={22} fill="var(--fg)" style={{ fontWeight: 600 }}>
            Spring scale reads {WEIGHT_MOON_TEXT} N
          </Label>
          <Label x={320} y={362} fontSize={16}>
            Weight is m × g. The mass is still {MASS_KG} kg.
          </Label>
        </g>

        {/* Both weights, side by side */}
        <g opacity={view.compare} data-testid="mass-weight-compare">
          <Label x={170} y={100} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
            Earth
          </Label>
          <Label x={470} y={100} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
            Moon
          </Label>
          <SpringScale x={170} weightN={WEIGHT_EARTH_N} blockWidth={110} blockHeight={56} massText={`${MASS_KG} kg`} />
          <SpringScale x={470} weightN={WEIGHT_MOON_N} blockWidth={110} blockHeight={56} massText={`${MASS_KG} kg`} />
          <Label x={170} y={HOOK_Y + SPRING_REST + springStretch(WEIGHT_EARTH_N) + 80} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
            {WEIGHT_EARTH_TEXT} N
          </Label>
          <Label x={470} y={HOOK_Y + SPRING_REST + springStretch(WEIGHT_MOON_N) + 80} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
            {WEIGHT_MOON_TEXT} N
          </Label>
          <Label x={320} y={470} fontSize={16}>
            Earth: {MASS_KG} kg × {G_EARTH} m s<Label.Sup>−2</Label.Sup> = {WEIGHT_EARTH_TEXT} N
          </Label>
          <Label x={320} y={500} fontSize={16}>
            Moon: {MASS_KG} kg × {G_MOON} m s<Label.Sup>−2</Label.Sup> = {WEIGHT_MOON_TEXT} N
          </Label>
        </g>
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {summary}. Mass {MASS_KG} kg on both planets. Weight {WEIGHT_EARTH_TEXT} N on Earth, {WEIGHT_MOON_TEXT} N on the Moon.
      </p>
    </div>
  )
}
