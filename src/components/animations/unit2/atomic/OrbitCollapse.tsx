'use client'

import { Electron, EnergyLevel, Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from '../subatomic/useStepTween'
import { clampIndex } from '../subatomic/notation'
import styles from '../subatomic/subatomic.module.css'

export interface OrbitCollapseProps {
  step: number
  reducedMotion: boolean
}

/** Number of Steps in the OrbitCollapse animation. */
export const ORBIT_COLLAPSE_STEP_COUNT = 4

const VIEW_W = 640
const VIEW_H = 540
const C = { x: 320, y: 240 }
const R0 = 150
const R_NUCLEUS = 14
/** Total turns of the spiral: 3 turns to the halfway point, then 3 more to the nucleus. */
const THETA_END = 6 * Math.PI
/** Exponential decay rate chosen so that the radius falls from R0 to R_NUCLEUS over THETA_END. */
const DECAY = Math.log(R0 / R_NUCLEUS) / THETA_END

interface CollapseState {
  /** Angle swept along the spiral (rad). */
  theta: number
  /** Radiation shells on (0 to 1). */
  radiation: number
  /** Phase of the expanding radiation shells (0 to 1). */
  waves: number
}

function stateForStep(step: number): CollapseState {
  switch (clampIndex(step, ORBIT_COLLAPSE_STEP_COUNT)) {
    case 1:
      return { theta: 0, radiation: 1, waves: 0.5 }
    case 2:
      return { theta: 3 * Math.PI, radiation: 0.5, waves: 1 }
    case 3:
      return { theta: THETA_END, radiation: 0.5, waves: 1.5 }
    default:
      return { theta: 0, radiation: 0, waves: 0 }
  }
}

const CAPTIONS = [
  'A stable orbit: the electron keeps circling the nucleus.',
  'An accelerating charge radiates electromagnetic waves.',
  'Losing energy, the orbit shrinks into a spiral.',
  'Classical prediction: the electron falls in within about 10⁻⁸ s.',
]

/** Radius on the spiral after sweeping angle `theta`. */
export function spiralRadius(theta: number): number {
  return R0 * Math.exp(-DECAY * theta)
}

/**
 * OrbitCollapse: the classical picture of an electron that radiates while it
 * orbits. It loses energy, spirals inward and reaches the nucleus. The spiral
 * is qualitative: it shows the claim, not a computed orbit.
 */
export function OrbitCollapse({ step, reducedMotion }: OrbitCollapseProps) {
  const activeStep = clampIndex(step, ORBIT_COLLAPSE_STEP_COUNT)
  const s = useStepTween(activeStep, stateForStep, reducedMotion, 1.1)

  const r = spiralRadius(s.theta)
  const ex = C.x + r * Math.cos(s.theta)
  const ey = C.y + r * Math.sin(s.theta)

  // Trail of the spiral from the start to the current angle.
  const trail: string[] = []
  const samples = 240
  for (let i = 0; i <= samples; i++) {
    const t = (s.theta * i) / samples
    const rr = spiralRadius(t)
    trail.push(`${(C.x + rr * Math.cos(t)).toFixed(2)},${(C.y + rr * Math.sin(t)).toFixed(2)}`)
  }

  // Radiation shells expand from the nucleus, fading as they go.
  const shells = [0, 1 / 3, 2 / 3].map((offset) => {
    const frac = (s.waves + offset) % 1
    return { radius: 40 + frac * 200, opacity: (1 - frac) * s.radiation * 0.7 }
  })

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label="Classical picture of an electron orbiting a nucleus. It radiates energy as it orbits, spirals inward, and falls into the nucleus."
        data-testid="orbit-collapse"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="orb" />

        {shells.map((shell, i) => (
          <circle
            key={`shell-${i}`}
            cx={C.x}
            cy={C.y}
            r={shell.radius}
            fill="none"
            strokeWidth={2}
            style={{ stroke: 'var(--orbital-pos)' }}
            opacity={shell.opacity}
          />
        ))}

        <EnergyLevel variant="orbit" r={R0} x={C.x} y={C.y} active={false} style={{ opacity: Math.max(0, 1 - s.theta / Math.PI) }} />

        {s.theta > 0.01 && (
          <polyline
            points={trail.join(' ')}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            style={{ stroke: 'var(--electron)' }}
            opacity={0.8}
          />
        )}

        <circle cx={C.x} cy={C.y} r={R_NUCLEUS + 16} fill="url(#orb-nucleus-halo)" />
        <circle cx={C.x} cy={C.y} r={R_NUCLEUS} style={{ fill: 'var(--proton)' }} />
        <Label x={C.x} y={C.y + R0 + 34} fontSize={15} textAnchor="middle" fill="var(--fg-muted)" halo>
          nucleus
        </Label>

        <Electron x={ex} y={ey} size={16} defsPrefix="orb" />

        <Label x={VIEW_W / 2} y={470} fontSize={17} textAnchor="middle" fill="var(--fg)">
          {CAPTIONS[activeStep]}
        </Label>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {CAPTIONS[activeStep]}
      </p>
    </div>
  )
}
