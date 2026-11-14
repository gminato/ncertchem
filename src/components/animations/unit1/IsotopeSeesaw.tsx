'use client'

import gsap from 'gsap'
import { Atom, Label, VocabDefs } from '@/components/vocab'
import { CHLORINE_ISOTOPES, fractionAcrossIsotopes, averageAtomicMass } from '@/lib/chem/atomic-mass'
import { useStepState, clampStepIndex } from './useStepState'
import {
  ABUNDANCE_DOTS,
  ISOTOPE_STEP_COUNT,
  LIGHT_DOTS,
  averageText,
  snapshotForStep,
  stepDescription,
  weightedSumText,
  weightedTerms,
  type IsotopeSnapshot,
} from './isotope-steps'
import styles from './scene.module.css'

export interface IsotopeSeesawProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 420)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 420

/** Abundance grid: 10 x 10 dots at the left. */
const GRID = { left: 56, top: 96, spacing: 24, radius: 8.5 }

/** Mass axis for the seesaw: 34.9689 u at x = AXIS.left, 36.9659 u at x = AXIS.right. */
const AXIS = { left: 80, right: 560, y: 326 }
const PLANK_Y = 232
const PLANK_LENGTH = AXIS.right - AXIS.left
/** Block height per percentage point of abundance. */
const BLOCK_PER_PERCENT = 0.8
const BLOCK_WIDTH = 60
const PLANK_RADIUS = 3
const TILT_LIMIT_DEG = 18
/** Degrees of tilt per unit of torque (in u per arm). A visual choice only. */
const TILT_PER_TORQUE = 0.35

const MASS_MIN = CHLORINE_ISOTOPES[0].massU
const MASS_MAX = CHLORINE_ISOTOPES[1].massU
const massToX = (massU: number) => AXIS.left + fractionAcrossIsotopes(CHLORINE_ISOTOPES, massU) * PLANK_LENGTH

/**
 * Tilt of the plank, in degrees, from the torques about the pivot. Each isotope is a
 * weight equal to its abundance, at its mass along the axis. Left heavier gives a
 * negative angle in SVG, which lowers the left end. Zero torque is a level plank.
 */
function tiltDegrees(pivot: number): number {
  const span = MASS_MAX - MASS_MIN
  const leftArm = pivot * span
  const rightArm = (1 - pivot) * span
  const torque = CHLORINE_ISOTOPES[0].abundancePercent * leftArm - CHLORINE_ISOTOPES[1].abundancePercent * rightArm
  const raw = -torque * TILT_PER_TORQUE
  return Math.max(-TILT_LIMIT_DEG, Math.min(TILT_LIMIT_DEG, raw))
}

function build(step: number, state: IsotopeSnapshot, _prev: number | null, onFrame: () => void) {
  const target = snapshotForStep(step)
  const tl = gsap.timeline({ onUpdate: onFrame })
  tl.to(state, { pivot: target.pivot, duration: 1.4, ease: 'power2.inOut' }, 0)
  return tl
}

/**
 * IsotopeSeesaw: 100 chlorine atoms (about 76 of them 35Cl), then a seesaw whose pivot
 * slides to the abundance-weighted average. The plank stays level only at that point,
 * so the average sits closer to the more abundant isotope.
 */
export function IsotopeSeesaw({ step, reducedMotion }: IsotopeSeesawProps) {
  const active = clampStepIndex(step, ISOTOPE_STEP_COUNT)
  const view = useStepState<IsotopeSnapshot>({
    step,
    stepCount: ISOTOPE_STEP_COUNT,
    reducedMotion,
    snapshot: snapshotForStep,
    build,
  })

  const pivotX = AXIS.left + view.pivot * PLANK_LENGTH
  const angle = tiltDegrees(view.pivot)
  const [light, heavy] = CHLORINE_ISOTOPES
  const lightBlock = light.abundancePercent * BLOCK_PER_PERCENT
  const heavyBlock = heavy.abundancePercent * BLOCK_PER_PERCENT
  const averageX = massToX(averageAtomicMass(CHLORINE_ISOTOPES))
  const terms = weightedTerms()

  const dots = Array.from({ length: ABUNDANCE_DOTS }, (_, i) => {
    const col = i % 10
    const row = Math.floor(i / 10)
    return {
      key: i,
      x: GRID.left + col * GRID.spacing,
      y: GRID.top + row * GRID.spacing,
      heavy: i >= LIGHT_DOTS,
    }
  })

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="A grid of 100 chlorine atoms, about 76 of them 35Cl, and a seesaw whose pivot sits at the average atomic mass, 35.45 u."
        data-testid="isotope-seesaw"
        data-step={active}
      >
        <VocabDefs idPrefix="is" />

        {active === 0 && (
          <g className={styles.reveal}>
            {dots.map((dot) => (
              <g key={dot.key} opacity={dot.heavy ? 0.4 : 1}>
                <Atom element="Cl" x={dot.x} y={dot.y} r={GRID.radius} defsPrefix="is" />
              </g>
            ))}
            <Label x={56} y={GRID.top - 26} textAnchor="start" fontSize={16} fill="var(--fg-muted)">
              100 chlorine atoms
            </Label>
            <g transform="translate(330 130)">
              <Atom element="Cl" x={0} y={0} r={9} defsPrefix="is" />
              <Label x={24} y={0} textAnchor="start" fontSize={17} fill="var(--fg)">
                ³⁵Cl{' '}
                · {light.abundancePercent} %
              </Label>
              <Label x={24} y={26} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
                mass {light.massU} u
              </Label>
            </g>
            <g transform="translate(330 186)">
              <Atom element="Cl" x={0} y={0} r={9} defsPrefix="is" />
              <Label x={24} y={0} textAnchor="start" fontSize={17} fill="var(--fg)">
                ³⁷Cl · {heavy.abundancePercent} %
              </Label>
              <Label x={24} y={26} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
                mass {heavy.massU} u
              </Label>
            </g>
            <Label x={330} y={262} textAnchor="start" fontSize={16} fill="var(--fg-muted)">
              about {LIGHT_DOTS} of every 100 atoms are ³⁵Cl
            </Label>
          </g>
        )}

        {active >= 1 && (
          <g>
            {/* Mass axis, with the two isotopes at its ends */}
            <line
              x1={AXIS.left}
              x2={AXIS.right}
              y1={AXIS.y}
              y2={AXIS.y}
              strokeWidth={1.2}
              style={{ stroke: 'var(--fg-subtle)' }}
            />
            {[35.0, 35.5, 36.0, 36.5].map((m) => (
              <g key={m}>
                <line
                  x1={massToX(m)}
                  x2={massToX(m)}
                  y1={AXIS.y}
                  y2={AXIS.y + 6}
                  strokeWidth={1.2}
                  style={{ stroke: 'var(--fg-subtle)' }}
                />
                <Label x={massToX(m)} y={AXIS.y + 22} fontSize={14} fill="var(--fg-subtle)">
                  {m.toFixed(1)}
                </Label>
              </g>
            ))}
            <Label x={AXIS.left} y={AXIS.y + 46} fontSize={15} fill="var(--fg-muted)">
              {light.massU} u
            </Label>
            <Label x={AXIS.right} y={AXIS.y + 46} fontSize={15} fill="var(--fg-muted)">
              {heavy.massU} u
            </Label>

            {/* Average marker */}
            <line
              x1={averageX}
              x2={averageX}
              y1={PLANK_Y + 40}
              y2={AXIS.y}
              strokeWidth={1.2}
              strokeDasharray="4 4"
              style={{ stroke: 'var(--orbit-active)' }}
            />

            {/* Seesaw: the plank and its two blocks rotate about the pivot */}
            <g transform={`rotate(${angle.toFixed(3)} ${pivotX.toFixed(3)} ${PLANK_Y})`}>
              <rect
                x={AXIS.left}
                y={PLANK_Y - PLANK_RADIUS}
                width={PLANK_LENGTH}
                height={PLANK_RADIUS * 2}
                rx={PLANK_RADIUS}
                style={{ fill: 'var(--fg-muted)' }}
              />
              <rect
                x={AXIS.left - BLOCK_WIDTH / 2}
                y={PLANK_Y - PLANK_RADIUS - lightBlock}
                width={BLOCK_WIDTH}
                height={lightBlock}
                rx={6}
                style={{ fill: 'var(--el-Cl)', opacity: 0.9 }}
              />
              <rect
                x={AXIS.right - BLOCK_WIDTH / 2}
                y={PLANK_Y - PLANK_RADIUS - heavyBlock}
                width={BLOCK_WIDTH}
                height={heavyBlock}
                rx={6}
                style={{ fill: 'var(--el-Cl)', opacity: 0.45 }}
              />
            </g>

            {/* Pivot: a fixed triangle at the current pivot position */}
            <path
              d={`M ${pivotX.toFixed(3)} ${PLANK_Y + 4} L ${(pivotX - 16).toFixed(3)} ${PLANK_Y + 40} L ${(pivotX + 16).toFixed(3)} ${PLANK_Y + 40} Z`}
              style={{ fill: 'var(--fg-subtle)' }}
            />

            {/* Labels for the two isotopes, fixed above the ends of the plank */}
            <Label x={AXIS.left} y={112} fontSize={16} fill="var(--fg)">
              ³⁵Cl · {light.abundancePercent} %
            </Label>
            <Label x={AXIS.right} y={112} fontSize={16} fill="var(--fg)">
              ³⁷Cl · {heavy.abundancePercent} %
            </Label>
            <Label x={averageX} y={AXIS.y + 74} fontSize={18} fill="var(--orbit-active)">
              average {averageText()} u
            </Label>
          </g>
        )}

        {active === 2 && (
          <g className={styles.reveal}>
            <Label x={320} y={36} fontSize={16} fill="var(--fg)">
              {terms[0].label} = {terms[0].term} u
            </Label>
            <Label x={320} y={60} fontSize={16} fill="var(--fg)">
              {terms[1].label} = {terms[1].term} u
            </Label>
            <Label x={320} y={86} fontSize={17} fill="var(--orbit-active)">
              sum = {weightedSumText()} u
            </Label>
          </g>
        )}

        {active === 3 && (
          <g className={styles.reveal}>
            <Label x={320} y={40} fontSize={20} fill="var(--orbit-active)">
              average atomic mass of Cl = {averageText()} u
            </Label>
            <Label x={320} y={68} fontSize={15} fill="var(--fg-muted)">
              NCERT&apos;s worked examples use 35.5 u for chlorine.
            </Label>
          </g>
        )}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(active)}
      </p>
    </div>
  )
}
