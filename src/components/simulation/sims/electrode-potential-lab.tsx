'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/controls'
import { Sub } from '@/components/animations/c12-unit1/ChemSvg'
import { PlotFrame, usePlotScale } from '@/components/vocab'
import { EnergyCycle, energyDomain, SERIES_TONE, type EnergyStep } from '@/components/vocab/dblock'
import { Beaker, beakerGeometry } from '@/components/vocab/electrochem'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  LAB_METALS,
  cycleSteps,
  labReadout,
  signedKj,
  signedVolt,
  type LabMetal,
  type LabMetalReadout,
} from '@/lib/chem/electrode-lab-model'
import styles from './electrode-potential-lab.module.css'

/** One vertical scale for every metal, so the cycles compare at a glance. */
const CYCLE_DOMAIN = energyDomain(...LAB_METALS.map((m) => cycleSteps(labReadout(m))))
const E_DOMAIN = { xMin: 0, xMax: 1, yMin: -2, yMax: 0.6 }
const E_TICKS = [-1.5, -1, -0.5, 0, 0.5]
const TONE_3D = SERIES_TONE['3d']

/**
 * Fixed bubble offsets (deterministic; no randomness in render). Origins sit in the liquid just below the strip
 * and beside it (|dx| clears the strip's half-width of 9), so they rise past the metal, not stuck to it.
 */
const BUBBLES = Array.from({ length: 8 }, (_, i) => ({
  dx: (i % 2 === 0 ? -1 : 1) * (13 + (i % 4) * 3),
  below: 6 + (i % 3) * 5,
  r: 2.5 + (i % 3) * 0.8,
  delay: i * 0.3,
}))

function tickLabel(v: number): string {
  if (v === 0) return '0'
  return v > 0 ? `+${v}` : `−${Math.abs(v)}`
}

function statusText(r: LabMetalReadout): { head: string; body: string } {
  if (r.gas === 'bubbles') {
    return {
      head: 'Bubbles of H₂',
      body: `E° is negative (${signedVolt(r.eStandard)} V), so ${r.symbol} reduces H⁺ to H₂ and bubbles form.`,
    }
  }
  if (r.gas === 'passive') {
    return {
      head: 'No bubbles in practice',
      body: `E° is negative (${signedVolt(r.eStandard)} V), but ${r.symbol} is passive in dilute acid, so no bubbles show.`,
    }
  }
  return {
    head: 'No bubbles',
    body: `E° is positive (${signedVolt(r.eStandard)} V), so ${r.symbol} does not reduce H⁺ to H₂.`,
  }
}

function gasWord(r: LabMetalReadout): string {
  if (r.gas === 'bubbles') return 'Bubbles'
  if (r.gas === 'passive') return 'None in practice'
  return 'None'
}

/** The E° bar from zero, drawn on the frame's scale, with the zero line labelled. */
function PotentialMark({ value }: { value: number }) {
  const s = usePlotScale()
  const { left, width } = s.box
  const zeroY = s.y(0)
  const endY = s.y(value)
  const barX = s.x(0.55)
  const barW = s.x(0.9) - s.x(0.55)
  return (
    <g>
      <line x1={left} x2={left + width} y1={zeroY} y2={zeroY} style={{ stroke: 'var(--fg)', strokeWidth: 2 }} />
      <rect
        x={barX}
        y={Math.min(zeroY, endY)}
        width={barW}
        height={Math.max(Math.abs(endY - zeroY), 1)}
        rx={3}
        style={{ fill: TONE_3D, fillOpacity: 0.85 }}
      />
      <text x={left + 4} y={zeroY - 8} textAnchor="start" fontSize={14} style={{ fill: 'var(--fg)' }}>
        H⁺/H₂ = 0 V
      </text>
      <text
        x={s.x(0.725)}
        y={value < 0 ? endY + 20 : endY - 10}
        textAnchor="middle"
        fontSize={14}
        style={{ fill: 'var(--fg)', fontWeight: 600 }}
      >
        {`${signedVolt(value)} V`}
      </text>
    </g>
  )
}

export function ElectrodePotentialLab({ reducedMotion }: SimulationProps) {
  const [metal, setMetal] = useState<LabMetal>('Cu')
  const r = labReadout(metal)
  const cycleSpecies = [`${metal}(s)`, `${metal}(g)`, `${metal}²⁺(g)`, `${metal}²⁺(aq)`]
  const steps: EnergyStep[] = [
    { name: <>Δ<Sub>a</Sub>H</>, value: r.atomisation, text: signedKj(r.atomisation) },
    { name: 'IE₁+IE₂', value: r.ionisation, text: signedKj(r.ionisation) },
    { name: <>Δ<Sub>hyd</Sub>H</>, value: r.hydration, text: signedKj(r.hydration) },
  ]
  const status = statusText(r)
  const geo = beakerGeometry({ x: 20, y: 30, width: 160, height: 150, level: 0.78 })
  const rodBottom = geo.liquidTop + 46
  const bubblesOn = r.gas === 'bubbles'

  const stageRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(stageRef)
  const playing = bubblesOn && !reducedMotion && active

  const liveSummary = `${metal}: cycle total ${signedKj(r.sum)} kJ mol⁻¹ from Table 4.4. E°(${metal}²⁺/${metal}) = ${signedVolt(r.eStandard)} V. ${status.head}.`

  return (
    <div className={styles.sim} ref={stageRef}>
      <div className={styles.controls}>
        <div role="group" aria-label="Metal" className={styles.chips}>
          {LAB_METALS.map((m) => (
            <Button
              key={m}
              variant={m === metal ? 'primary' : 'secondary'}
              aria-pressed={m === metal}
              className={styles.chip}
              onClick={() => setMetal(m)}
            >
              {m}
            </Button>
          ))}
        </div>
      </div>

      <div className={styles.scenes}>
        <svg className={styles.scene} viewBox="0 0 300 340" role="img" aria-label={`Energy cycle for ${metal}(s) to ${metal}²⁺(aq), in kJ mol⁻¹`}>
          <EnergyCycle
            x={0}
            y={8}
            width={296}
            height={320}
            domain={CYCLE_DOMAIN}
            species={cycleSpecies}
            steps={steps}
            net={{ name: 'Total', value: r.sum, text: signedKj(r.sum) }}
          />
        </svg>

        <svg className={styles.scene} viewBox="0 0 300 340" role="img" aria-label={`Potential E° of ${metal}²⁺ to ${metal} on a scale with zero at the hydrogen electrode`}>
          <text x={20} y={16} fontSize={14} style={{ fill: 'var(--fg)' }}>
            E°({metal}²⁺/{metal})
          </text>
          <PlotFrame
            x={74}
            y={28}
            width={210}
            height={290}
            domain={E_DOMAIN}
            xTicks={[]}
            yTicks={E_TICKS}
            yTickFormat={tickLabel}
            yTitle="E° / V"
          >
            <PotentialMark value={r.eStandard} />
          </PlotFrame>
        </svg>
      </div>

      <div className={styles.lab}>
        <svg className={styles.beaker} viewBox="0 0 200 214" role="img" aria-label={`Beaker of dilute acid with a ${metal} strip; ${status.head.toLowerCase()}`}>
          <Beaker x={20} y={30} width={160} height={150} level={0.78} tint="clear" label="H⁺(aq), dilute" />
          <rect
            x={geo.centreX - 9}
            y={8}
            width={18}
            height={rodBottom - 8}
            rx={3}
            style={{ fill: TONE_3D }}
          />
          <text x={geo.centreX + 16} y={24} fontSize={14} style={{ fill: 'var(--fg)' }}>
            {metal}(s)
          </text>
          {bubblesOn &&
            BUBBLES.map((b, i) => (
              <circle
                key={i}
                className={reducedMotion ? undefined : styles.bubble}
                cx={geo.centreX + b.dx}
                cy={rodBottom + b.below}
                r={b.r}
                style={{
                  fill: 'var(--fg-muted)',
                  fillOpacity: 0.35,
                  stroke: 'var(--fg-muted)',
                  strokeWidth: 1,
                  animationDelay: `${b.delay}s`,
                  animationPlayState: playing ? 'running' : 'paused',
                }}
              />
            ))}
        </svg>

        <div className={styles.status}>
          <p className={styles.statusHead}>{status.head}</p>
          <p className={styles.statusBody}>{status.body}</p>
        </div>
      </div>

      <div className={styles.readout}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Cycle total (Table 4.4)</span>
          <span className={styles.statValue}>{signedKj(r.sum)} kJ mol⁻¹</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            <span className="sym">E</span>° of {metal}²⁺/{metal}
          </span>
          <span className={styles.statValue}>{signedVolt(r.eStandard)} V</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Hydrogen from dilute acid</span>
          <span className={styles.statValue}>{gasWord(r)}</span>
        </div>
      </div>

      <p className={styles.note}>
        Every cycle total is positive, because the atomisation and ionisation terms outweigh hydration for every metal in the row. Compare metals by their totals and by E°, not by the sign of the total: only the sign of E° decides the bubbles. The cycle uses one scale for all nine metals.
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}

