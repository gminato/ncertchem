'use client'

import { Label } from '@/components/vocab'
import { orbitRadiusPm } from '@/lib/chem/bohr'
import { deBroglieOnOrbitPm, waveClosesOnItself } from '@/lib/chem/wave-orbit'
import { useTweenedValues } from './useTweenedValues'
import { orbitTargets, ORBIT_STEP_COUNT } from './quantum-steps'
import styles from './visuals.module.css'

export interface DeBroglieOrbitProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 400
const VIEW_HEIGHT = 440
const CENTRE = { x: 200, y: 202 }
/** Samples around the orbit. Enough for a smooth wave even at n = 4. */
const SAMPLES = 360

/** Radial height of the wave: a little more on larger orbits, so it stays readable. */
const waveAmplitude = (radius: number) => 3 + 0.07 * radius

/**
 * The wave as a closed path around the orbit. Its displacement is
 * A cos(m θ), with m wavelengths around the circumference. When m is a whole
 * number the path returns to its start; when it is not, the two ends differ.
 */
function wavePath(radius: number, waves: number): string {
  const amp = waveAmplitude(radius)
  const points: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const theta = (i / SAMPLES) * 2 * Math.PI
    const rr = radius + amp * Math.cos(waves * theta)
    const x = CENTRE.x + rr * Math.cos(theta)
    const y = CENTRE.y + rr * Math.sin(theta)
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return points.join(' ')
}

/** The point on the wave where θ = 0, and the point where it returns after one turn. */
function seamEnds(radius: number, waves: number): { start: [number, number]; end: [number, number] } {
  const amp = waveAmplitude(radius)
  const at = (theta: number, rr: number): [number, number] => [
    CENTRE.x + rr * Math.cos(theta),
    CENTRE.y + rr * Math.sin(theta),
  ]
  return {
    start: at(0, radius + amp * Math.cos(0)),
    end: at(2 * Math.PI, radius + amp * Math.cos(waves * 2 * Math.PI)),
  }
}

const CAPTIONS: readonly string[] = [
  'n = 1: one wavelength fits the orbit',
  'n = 2: two wavelengths fit the orbit',
  'n = 3: three wavelengths fit the orbit',
  'n = 4: four wavelengths fit the orbit',
  '3.5 wavelengths: the wave cannot close',
]

/**
 * DeBroglieOrbit: the electron's wave drawn around its Bohr orbit. The orbit's
 * radius grows as n², and the wave closes on itself only when a whole number
 * of wavelengths fits; at 3.5 the two ends meet out of step and interfere.
 */
export function DeBroglieOrbit({ step, reducedMotion }: DeBroglieOrbitProps) {
  const targets = useTweenedValues(orbitTargets(step), reducedMotion, 0.9)
  const s = Math.min(ORBIT_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const nShown = s === 4 ? 3 : s + 1
  const closes = waveClosesOnItself(targets.waves)
  const ends = seamEnds(targets.radius, targets.waves)
  const showSeam = targets.seam > 0.5

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`Bohr orbit n = ${nShown} with a de Broglie wave drawn around it. ${CAPTIONS[s]}.`}
        data-testid="de-broglie-orbit"
        data-step={step}
        data-waves={targets.waves.toFixed(2)}
        data-closes={closes ? 'true' : 'false'}
      >
        <circle
          cx={CENTRE.x}
          cy={CENTRE.y}
          r={targets.radius}
          fill="none"
          strokeWidth={1.4}
          style={{ stroke: 'var(--orbit)' }}
        />
        <circle cx={CENTRE.x} cy={CENTRE.y} r={4} style={{ fill: 'var(--proton)' }} />

        <g opacity={targets.wave}>
          <path
            d={wavePath(targets.radius, targets.waves)}
            fill="none"
            strokeWidth={2.2}
            strokeLinejoin="round"
            style={{ stroke: 'var(--electron)' }}
          />
          <circle
            cx={CENTRE.x + targets.radius}
            cy={CENTRE.y}
            r={5}
            style={{ fill: 'var(--electron)' }}
          />
        </g>

        {showSeam && (
          <g data-testid="orbit-seam">
            <line
              x1={ends.start[0]}
              y1={ends.start[1]}
              x2={ends.end[0]}
              y2={ends.end[1]}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ stroke: 'var(--proton)' }}
            />
            <circle cx={ends.start[0]} cy={ends.start[1]} r={4} style={{ fill: 'var(--proton)' }} />
            <circle cx={ends.end[0]} cy={ends.end[1]} r={4} style={{ fill: 'var(--proton)' }} />
          </g>
        )}

        <Label x={CENTRE.x} y={412} fontSize={14} fill="var(--fg)">
          {CAPTIONS[s]}
        </Label>
        <Label x={CENTRE.x} y={432} fontSize={14} fill="var(--fg-muted)">
          <tspan className="sym">r</tspan>
          {` = ${orbitRadiusPm(nShown).toFixed(1)} pm;  2`}
          <tspan className="sym">πr</tspan>
          {' ÷ '}
          <tspan className="sym">λ</tspan>
          {` = ${s === 4 ? '3.5' : nShown}`}
        </Label>
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {`${CAPTIONS[s]}. Wavelength on this orbit: ${deBroglieOnOrbitPm(nShown).toFixed(1)} pm.`}
      </p>
    </div>
  )
}
