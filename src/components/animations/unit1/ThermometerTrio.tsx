'use client'

import { useSnapshotTween } from './useSnapshotTween'
import { Label } from '@/components/vocab/Label'
import { Thermometer } from '@/components/vocab/Thermometer'
import { celsiusToFahrenheit, celsiusToKelvin } from '@/lib/chem/units'
import {
  THERMOMETER_STEPS,
  TICK_LEVELS,
  clampStep,
  levelForCelsius,
  readoutsFor,
  signed,
  snapshotForStep,
} from './thermometer-steps'
import styles from './unit1.module.css'

export interface ThermometerTrioProps {
  step: number
  reducedMotion: boolean
}

// Geometry (SVG viewBox 640 x 540)
const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
/** Bulb centres, one per scale: °C, K, °F. */
const COLUMNS = [
  { x: 100, scale: 'C' },
  { x: 320, scale: 'K' },
  { x: 540, scale: 'F' },
] as const
const BULB_Y = 430
const STEM_HEIGHT = 290
const BULB_R = 24
const STEM_W = 14
const LABEL_FONT = 16
const TITLE_FONT = 20

/** Readout for one scale at a temperature in °C. */
function readoutText(scale: (typeof COLUMNS)[number]['scale'], celsius: number): string {
  if (scale === 'C') return readoutsFor(celsius).c
  if (scale === 'K') return `${signed(celsiusToKelvin(celsius), 2)} K`
  return `${signed(celsiusToFahrenheit(celsius), 1)} °F`
}

/**
 * ThermometerTrio: three thermometers, in °C, K and °F, with the same liquid
 * column. Scrolling through the Steps moves the temperature from the ice point
 * to the boiling point (and to −40 °C, where the °C and °F readings agree).
 */
export function ThermometerTrio({ step, reducedMotion }: ThermometerTrioProps) {
  const activeStep = clampStep(step)
  const view = useSnapshotTween(snapshotForStep(activeStep), reducedMotion)
  const celsius = view.celsius
  const level = levelForCelsius(celsius)
  const columnY = BULB_Y - level * STEM_HEIGHT
  const current = THERMOMETER_STEPS[activeStep]
  const summary = COLUMNS.map((col) => `${col.scale}: ${readoutText(col.scale, celsius)}`).join(', ')

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`${current.name}. ${summary}.`}
        data-testid="thermometer-trio"
        data-step={activeStep}
      >
        <Label x={VIEW_WIDTH / 2} y={44} fontSize={20} fill="var(--fg)" style={{ fontWeight: 600 }}>
          {current.name}
        </Label>

        {COLUMNS.map((col) => (
          <g key={col.scale}>
            <Label x={col.x} y={100} fontSize={TITLE_FONT} fill="var(--fg)" style={{ fontWeight: 600 }}>
              {col.scale === 'C' ? '°C' : col.scale === 'K' ? 'K' : '°F'}
            </Label>
            <Thermometer
              x={col.x}
              y={BULB_Y}
              level={level}
              height={STEM_HEIGHT}
              bulbRadius={BULB_R}
              stemWidth={STEM_W}
              ticks={TICK_LEVELS}
            />
            <Label
              x={col.x + STEM_W / 2 + 22}
              y={columnY}
              fontSize={LABEL_FONT}
              textAnchor="start"
              fill="var(--fg)"
              halo
              data-testid={`reading-${col.scale}`}
            >
              {readoutText(col.scale, celsius)}
            </Label>
          </g>
        ))}

        <Label x={VIEW_WIDTH / 2} y={500} fontSize={15}>
          K = °C + 273.15   ·   °F = (9/5) °C + 32
        </Label>
      </svg>
      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
