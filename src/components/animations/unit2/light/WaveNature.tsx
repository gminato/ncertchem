'use client'

import { EMWave, Label, SpectrumStrip, VocabDefs, spectrumX } from '@/components/vocab'
import { SPEED_OF_LIGHT } from '@/lib/chem/constants'
import { formatScientific } from '@/lib/chem/mole-bridge'
import type { EmRegion } from '@/lib/chem/radiation'
import {
  bandFraction,
  clampWaveStep,
  emRegionSpans,
  waveStepDescription,
  wavelengthFacts,
} from './wave-nature-steps'
import styles from './light.module.css'

export interface WaveNatureProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540

/** The log band of Step 2: x runs from BAND.left to BAND.right. */
const BAND = { left: 40, right: 600, top: 250, height: 50 }
const bandX = (wavelengthM: number) => BAND.left + bandFraction(wavelengthM) * (BAND.right - BAND.left)

/** Regions named above the band; the others are named below it, so neighbouring names do not collide. */
const REGION_NAME: Record<EmRegion, string> = {
  gamma: 'γ-rays',
  'x-ray': 'X-rays',
  ultraviolet: 'Ultraviolet',
  visible: 'Visible',
  infrared: 'Infrared',
  microwave: 'Microwave',
  radio: 'Radio',
}
const NAMED_ABOVE: ReadonlySet<EmRegion> = new Set<EmRegion>(['gamma', 'ultraviolet', 'infrared', 'radio'])

/** Decade ticks on the band: 1 pm to 1 km. */
const DECADE_TICKS: readonly { m: number; label: string }[] = [
  { m: 1e-12, label: '1 pm' },
  { m: 1e-9, label: '1 nm' },
  { m: 1e-6, label: '1 µm' },
  { m: 1e-3, label: '1 mm' },
  { m: 1, label: '1 m' },
  { m: 1e3, label: '1 km' },
]

/** Visible-range frequencies at the strip's ticks, from wavelengths in nm. */
const ZOOM = { left: 40, width: 560, top: 190, height: 44, range: [380, 750] as const }
const ZOOM_TICKS_NM = [400, 500, 600, 700] as const

function FieldLegend({ y }: { y: number }) {
  return (
    <g>
      <line x1={70} x2={110} y1={y} y2={y} strokeWidth={2.4} strokeLinecap="round" style={{ stroke: 'var(--accent)' }} />
      <Label x={122} y={y} textAnchor="start" fontSize={16}>
        <tspan className="sym">E</tspan> electric field, in phase with <tspan className="sym">B</tspan>
      </Label>
      <line
        x1={70}
        x2={110}
        y1={y + 36}
        y2={y + 36}
        strokeWidth={2.2}
        strokeLinecap="round"
        style={{ stroke: 'var(--field-b)' }}
      />
      <Label x={122} y={y + 36} textAnchor="start" fontSize={16}>
        <tspan className="sym">B</tspan> magnetic field, at right angles to <tspan className="sym">E</tspan>
      </Label>
    </g>
  )
}

/**
 * WaveNature: an electromagnetic wave (Step 0), two waves of one speed with
 * different wavelengths (Step 1), the whole spectrum on a log band with the
 * visible slice in its real colours (Step 2), and the visible range zoomed in
 * with frequencies and a wavenumber (Step 3).
 */
export function WaveNature({ step, reducedMotion }: WaveNatureProps) {
  const active = clampWaveStep(step)
  const enter = reducedMotion ? undefined : styles.enter
  const spans = emRegionSpans()

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={waveStepDescription(active)}
        data-testid="wave-nature"
        data-step={active}
      >
        <VocabDefs idPrefix="wave" />

        {active === 0 && (
          <g className={enter}>
            <EMWave x={70} y={236} length={500} wavelength={130} amplitude={92} />
            <FieldLegend y={416} />
            <Label x={70} y={500} textAnchor="start" fontSize={16}>
              Both fields travel together in the direction of the arrow.
            </Label>
          </g>
        )}

        {active === 1 && (
          <g className={enter}>
            <Label x={70} y={116} textAnchor="start" fontSize={16}>
              <tspan className="sym">λ</tspan> = 650 nm, <tspan className="sym">ν</tspan> ={' '}
              {formatScientific(wavelengthFacts(650).frequencyHz, 3)} Hz
            </Label>
            <EMWave x={70} y={190} length={500} wavelength={150} amplitude={56} />
            <Label x={70} y={306} textAnchor="start" fontSize={16}>
              <tspan className="sym">λ</tspan> = 400 nm, <tspan className="sym">ν</tspan> ={' '}
              {formatScientific(wavelengthFacts(400).frequencyHz, 3)} Hz
            </Label>
            <EMWave x={70} y={380} length={500} wavelength={75} amplitude={56} />
            <Label x={70} y={468} textAnchor="start" fontSize={16}>
              <tspan className="sym">c</tspan> = <tspan className="sym">ν</tspan>{' '}
              <tspan className="sym">λ</tspan> = {formatScientific(SPEED_OF_LIGHT, 3)} m s⁻¹ for both
            </Label>
            <Label x={70} y={500} textAnchor="start" fontSize={15}>
              Not to scale: the drawn wavelengths are in a 2 : 1 ratio.
            </Label>
          </g>
        )}

        {active === 2 && (
          <g className={enter}>
            {spans.map((span) => {
              const x1 = bandX(span.startM)
              const x2 = bandX(span.endM)
              const mid = (x1 + x2) / 2
              const above = NAMED_ABOVE.has(span.region)
              return (
                <g key={`${span.region}-${span.startM}`}>
                  {span.region === 'visible' ? (
                    <g>
                      <SpectrumStrip
                        x={x1}
                        y={BAND.top}
                        width={x2 - x1}
                        height={BAND.height}
                        rangeNm={[380, 750]}
                        mode="continuous"
                        ticks={[]}
                        idPrefix="wave-band"
                      />
                      <rect
                        x={x1 - 5}
                        y={BAND.top - 6}
                        width={x2 - x1 + 10}
                        height={BAND.height + 12}
                        rx={8}
                        fill="none"
                        strokeWidth={1.6}
                        style={{ stroke: 'var(--fg)' }}
                      />
                    </g>
                  ) : (
                    <rect
                      x={x1}
                      y={BAND.top}
                      width={x2 - x1}
                      height={BAND.height}
                      style={{ fill: 'var(--border)' }}
                    />
                  )}
                  <Label
                    x={mid}
                    y={above ? BAND.top - 16 : BAND.top + BAND.height + 58}
                    fontSize={16}
                    {...(span.region === 'visible' ? { fill: 'var(--fg)' } : {})}
                  >
                    {REGION_NAME[span.region]}
                  </Label>
                </g>
              )
            })}
            {DECADE_TICKS.map((tick) => {
              const x = bandX(tick.m)
              return (
                <g key={tick.label}>
                  <line
                    x1={x}
                    x2={x}
                    y1={BAND.top + BAND.height}
                    y2={BAND.top + BAND.height + 6}
                    className={styles.axis}
                  />
                  <Label x={x} y={BAND.top + BAND.height + 26} fontSize={15} fill="var(--fg-subtle)">
                    {tick.label}
                  </Label>
                </g>
              )
            })}
            <Label x={320} y={440} fontSize={16}>
              Wavelength <tspan className="sym">λ</tspan>, on a log scale. Visible light is boxed.
            </Label>
            <Label x={320} y={470} fontSize={16}>
              Every region is the same kind of wave, travelling at the same speed.
            </Label>
          </g>
        )}

        {active === 3 && (
          <g className={enter}>
            <SpectrumStrip
              x={ZOOM.left}
              y={ZOOM.top}
              width={ZOOM.width}
              height={ZOOM.height}
              rangeNm={ZOOM.range}
              mode="continuous"
              ticks={ZOOM_TICKS_NM}
              tickFontSize={16}
              idPrefix="wave-zoom"
            />
            {ZOOM_TICKS_NM.map((nm) => {
              const x = ZOOM.left + spectrumX(nm, ZOOM.width, ZOOM.range)
              return (
                <Label key={`f-${nm}`} x={x} y={ZOOM.top + ZOOM.height + 58} fontSize={15}>
                  {formatScientific(wavelengthFacts(nm).frequencyHz, 3)} Hz
                </Label>
              )
            })}
            <line
              x1={ZOOM.left + spectrumX(500, ZOOM.width, ZOOM.range)}
              x2={ZOOM.left + spectrumX(500, ZOOM.width, ZOOM.range)}
              y1={ZOOM.top - 8}
              y2={ZOOM.top + ZOOM.height + 8}
              className={styles.guide}
            />
            <Label x={320} y={372} fontSize={18}>
              At 500 nm, the wavenumber 1/<tspan className="sym">λ</tspan> ={' '}
              {formatScientific(wavelengthFacts(500).wavenumberPerCm, 3)} cm⁻¹
            </Label>
            <Label x={320} y={416} fontSize={16}>
              Visible light spans about {formatScientific(4.0e14, 2)} Hz to {formatScientific(7.5e14, 2)} Hz.
            </Label>
          </g>
        )}
      </svg>
    </div>
  )
}
