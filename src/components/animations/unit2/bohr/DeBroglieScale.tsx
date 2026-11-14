'use client'

import { Label } from '@/components/vocab'
import { BOHR_RADIUS_PM } from '@/lib/chem/constants'
import { PowerOfTen, Scientific, Sup, splitScientific } from './notation'
import { useTweenedValues } from './useTweenedValues'
import { BALL_WAVELENGTH_M, ELECTRON_WAVELENGTH_M, scaleRatio, scaleTargets } from './quantum-steps'
import styles from './visuals.module.css'

export interface DeBroglieScaleProps {
  step: number
  reducedMotion: boolean
}

// Log scale: the ruler runs from 10⁻³⁶ m to 10⁻⁸ m. The viewBox is sized for a
// ~570px visual panel, so every label is set at 14 units and reads at about 14px.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 300
const RULER = { left: 40, right: 520, y: 150, minExp: -36, maxExp: -8 }
const TICK_EXPONENTS = [-36, -28, -20, -12]

const xForExp = (exp: number) =>
  RULER.left + ((exp - RULER.minExp) / (RULER.maxExp - RULER.minExp)) * (RULER.right - RULER.left)

const BALL_X = xForExp(Math.log10(BALL_WAVELENGTH_M))
const ELECTRON_X = xForExp(Math.log10(ELECTRON_WAVELENGTH_M))
const BOHR_X = xForExp(Math.log10(BOHR_RADIUS_PM * 1e-12))

const ballSci = splitScientific(BALL_WAVELENGTH_M)
const electronSci = splitScientific(ELECTRON_WAVELENGTH_M)
const ratioSci = splitScientific(scaleRatio())

/**
 * DeBroglieScale: a log-scale ruler of wavelengths, with a cricket ball and an
 * electron marked on it. Each Step adds a marker, and the last one shows how
 * much longer the electron's wavelength is.
 */
export function DeBroglieScale({ step, reducedMotion }: DeBroglieScaleProps) {
  const targets = useTweenedValues(scaleTargets(step), reducedMotion, 0.7)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Logarithmic ruler of wavelengths from 10 to the minus 36 metres to 10 to the minus 8 metres, with a cricket ball near the left and an electron near the right"
        data-testid="de-broglie-scale"
        data-step={step}
      >
        <line
          x1={RULER.left}
          x2={RULER.right}
          y1={RULER.y}
          y2={RULER.y}
          strokeWidth={2}
          style={{ stroke: 'var(--orbit)' }}
        />

        {TICK_EXPONENTS.map((exp) => (
          <g key={`tick-${exp}`}>
            <line
              x1={xForExp(exp)}
              x2={xForExp(exp)}
              y1={RULER.y - 6}
              y2={RULER.y + 6}
              strokeWidth={1.2}
              style={{ stroke: 'var(--fg-subtle)' }}
            />
            <Label x={xForExp(exp)} y={RULER.y + 24} fontSize={14} fill="var(--fg-subtle)">
              <PowerOfTen exp={exp} /> m
            </Label>
          </g>
        ))}

        {/* Bohr radius: the size scale of an atom */}
        <g opacity={targets.bohr}>
          <line
            x1={BOHR_X}
            x2={BOHR_X}
            y1={RULER.y - 22}
            y2={RULER.y + 22}
            strokeWidth={3}
            strokeLinecap="round"
            style={{ stroke: 'var(--caution)' }}
          />
          <Label x={BOHR_X - 10} y={RULER.y - 36} textAnchor="end" fontSize={14} fill="var(--caution)">
            a<tspan dy="0.32em" fontSize="0.75em">0</tspan>
            <tspan dy="-0.32em"> = 52.9 pm (Bohr radius)</tspan>
          </Label>
        </g>

        {/* Cricket ball */}
        <g opacity={targets.ball}>
          <circle cx={BALL_X} cy={RULER.y} r={9} style={{ fill: 'var(--proton)' }} />
          <Label x={BALL_X - 10} y={RULER.y - 62} textAnchor="start" fontSize={14} fill="var(--fg)">
            Cricket ball, 0.16 kg at 40 m s<Sup>−1</Sup>
          </Label>
          <Label x={BALL_X - 10} y={RULER.y - 42} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
            λ ≈{' '}
            <Scientific mantissa={ballSci.mantissa} exp={ballSci.exp} unit="m" />
          </Label>
        </g>

        {/* Electron */}
        <g opacity={targets.electron}>
          <circle cx={ELECTRON_X} cy={RULER.y} r={6} style={{ fill: 'var(--electron)' }} />
          <Label x={ELECTRON_X + 10} y={RULER.y + 58} textAnchor="end" fontSize={14} fill="var(--fg)">
            Electron at 10<Sup>6</Sup> m s<Sup>−1</Sup>
          </Label>
          <Label x={ELECTRON_X + 10} y={RULER.y + 78} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
            λ ≈{' '}
            <Scientific mantissa={electronSci.mantissa} exp={electronSci.exp} unit="m" />
          </Label>
        </g>

        {/* How many times longer the electron's wavelength is */}
        <g opacity={targets.ratio}>
          <line
            x1={BALL_X}
            x2={ELECTRON_X}
            y1={62}
            y2={62}
            strokeWidth={1.2}
            style={{ stroke: 'var(--fg-subtle)' }}
          />
          <Label x={(BALL_X + ELECTRON_X) / 2} y={42} fontSize={14} fill="var(--fg)">
            {'The electron’s wavelength is about '}
            <Scientific mantissa={ratioSci.mantissa} exp={ratioSci.exp} />
            {' times the ball’s'}
          </Label>
        </g>
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {`Ruler of wavelengths. Cricket ball: ${ballSci.mantissa} times 10 to the ${ballSci.exp} metres. Electron at one million metres per second: ${electronSci.mantissa} times 10 to the ${electronSci.exp} metres.`}
      </p>
    </div>
  )
}
