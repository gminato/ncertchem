'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { EquilibriumCurves, QKGauge, RateBars, type CurveSeries } from '@/components/equilibrium'
import { formatSci, type TimePoint } from '@/components/equilibrium/geometry'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  SPEED_CHOICES,
  approachPresets,
  concentrationsAt,
  rateConstants,
  ratesOf,
  runApproach,
  settledTimeOf,
  type ApproachPreset,
} from '@/lib/chem/approach-to-equilibrium'
import { predictDirection, reactionQuotient } from '@/lib/chem/equilibrium'
import styles from './approach-to-equilibrium.module.css'

const PRESETS = approachPresets()
const DRAW_MS = 2400
const SERIES_COLOURS = ['var(--el-N)', 'var(--i2)', 'var(--el-S)', 'var(--acid)']
const SPEED_LABELS = ['½×', '1×', '2×', '4×'] as const
const SPEED_VALUES = SPEED_CHOICES.map((s) => String(s))
const SAMPLE_EVERY = 20

/** Concentrations with the Unicode minus sign, two significant figures at least. */
function conc(value: number): string {
  if (value === 0) return '0'
  if (value >= 0.01) return value.toFixed(3)
  return value.toExponential(2).replace('-', '−')
}

/** A number to three significant figures, with a true minus sign; large or small values as × 10ⁿ. */
function sig3(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  if (value === 0) return '0'
  if (Math.abs(value) >= 0.01 && Math.abs(value) < 1000) return value.toPrecision(3).replace('-', '−')
  return formatSci(value, 2)
}

/** Q within 1 % of K counts as at equilibrium; otherwise the direction is named. */
const EQUILIBRIUM_TOLERANCE = 0.01

/** Q compared with K, in words for the readout. */
function verdictText(q: number, k: number): string {
  if (Math.abs(Math.log10(q / k)) < EQUILIBRIUM_TOLERANCE) {
    return 'Q = K (within 1 %): the mixture is at equilibrium, and the forward and reverse rates are equal.'
  }
  const direction = predictDirection(q, k)
  if (direction === 'forward') return 'Q < K, so the net reaction runs forward (reactants → products).'
  if (direction === 'reverse') return 'Q > K, so the net reaction runs in reverse (products → reactants).'
  return 'Q = K: at equilibrium.'
}

/**
 * Reaction, start side, speed and the starting amounts. The curves draw in over a fixed time window,
 * the rate bars show the forward and reverse rates at the current time, and the gauge moves the
 * reaction quotient Q towards K.
 */
export function ApproachToEquilibrium({ reducedMotion }: SimulationProps) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useIsActive(ref)
  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  const [presetId, setPresetId] = useState(PRESETS[0].id)
  const [start, setStart] = useState<'reactants' | 'products'>('reactants')
  const [speed, setSpeed] = useState<number>(1)
  const [amounts, setAmounts] = useState<Record<string, number>>(PRESETS[0].fromReactants)
  const [progress, setProgress] = useState(1)
  const [replay, setReplay] = useState(0)

  const preset: ApproachPreset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0]

  const choosePreset = (id: string) => {
    const next = PRESETS.find((p) => p.id === id) ?? PRESETS[0]
    setPresetId(next.id)
    setAmounts(start === 'reactants' ? next.fromReactants : next.fromProducts)
  }

  const chooseStart = (side: 'reactants' | 'products') => {
    setStart(side)
    setAmounts(side === 'reactants' ? preset.fromReactants : preset.fromProducts)
  }

  // The curves draw in again when the reaction, the start side, the speed or the replay button change.
  // Dragging a starting amount updates the picture at once.
  const key = `${presetId}|${start}|${speed}|${replay}`

  // Draw the curves in over DRAW_MS. Under reduced motion, or off screen, they are drawn in full.
  useEffect(() => {
    if (reducedMotion || !activeRef.current) {
      setProgress(1)
      return
    }
    setProgress(0)
    const began = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - began) / DRAW_MS)
      setProgress(p)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [key, reducedMotion])

  const run = useMemo(() => runApproach(preset, amounts, speed), [preset, amounts, speed])
  const { kf, kr } = useMemo(() => rateConstants(preset, speed), [preset, speed])
  const equilibrium = run.equilibrium.equilibrium
  const settleAt = useMemo(() => settledTimeOf(run, equilibrium, 0.01 * preset.concMax), [run, equilibrium, preset.concMax])

  const concMax = preset.concMax

  const series: CurveSeries[] = useMemo(
    () =>
      preset.species.map((s, i) => ({
        id: s.id,
        label: s.name,
        color: SERIES_COLOURS[i % SERIES_COLOURS.length],
        dash: i === 1 ? '7 5' : undefined,
        points: run.samples
          .filter((_, idx) => idx % SAMPLE_EVERY === 0)
          .map((sample) => [sample.time, sample.concentrations[s.id]] as TimePoint),
      })),
    [preset, run]
  )

  const t = progress * preset.tEnd
  const now = concentrationsAt(run.samples, t)
  const rawQ = reactionQuotient(preset.reaction, now)
  const q = Number.isNaN(rawQ) ? 0 : rawQ
  const rates = ratesOf(preset, kf, kr, now)
  // The bars share one scale: the larger of the two current rates fills the track, so both stay visible.
  const currentMax = Math.max(rates.forward, rates.reverse, 1e-12)

  const gaugeQ = Math.min(Math.max(q, 1e-12), 1e12)
  const rateUnit = 'mmol L⁻¹ s⁻¹'

  return (
    <div ref={ref} className={styles.wrap} data-testid="approach-sim">
      <svg
        className={styles.curves}
        viewBox="0 0 640 300"
        role="img"
        aria-label={`Concentrations against time for ${preset.label}, starting from the chosen mixture`}
        data-testid="approach-curves"
      >
        <EquilibriumCurves
          panels={[{ title: preset.label, series }]}
          timeMax={preset.tEnd}
          concMax={concMax}
          progress={progress}
          equilibriumAt={settleAt}
          xLabel={<tspan className="sym">t</tspan>}
          yLabel="concentration, mol L⁻¹"
          title="Concentration against time"
        />
      </svg>

      <div className={styles.row}>
        <svg className={styles.bars} viewBox="0 0 360 140" role="img" aria-label="Forward and reverse rates at the current time" data-testid="approach-rates">
          <RateBars
            progress={0}
            config={{ forwardStart: rates.forward * 1000, reverseStart: rates.reverse * 1000, equilibrium: currentMax * 1000 }}
            forwardLabel="Forward rate"
            reverseLabel="Reverse rate"
          />
        </svg>
        <svg className={styles.gauge} viewBox="0 0 560 180" role="img" aria-label={`Reaction quotient Q at ${sig3(q)} compared with K at ${sig3(preset.k)}`} data-testid="approach-gauge">
          <QKGauge K={preset.k} Q={gaugeQ} />
        </svg>
      </div>

      <p className={styles.summary} aria-live="polite" data-testid="approach-summary">
        <strong>t = {t.toFixed(2)} s.</strong> <span data-testid="approach-q">Q = {sig3(q)}</span>, <span data-testid="approach-k">K = {sig3(preset.k)}</span>.{' '}
        <span data-testid="approach-verdict">{verdictText(q, preset.k)}</span>{' '}
        <span className={styles.muted}>
          Rates: forward {(rates.forward * 1000).toFixed(2)}, reverse {(rates.reverse * 1000).toFixed(2)} {rateUnit}.
        </span>
      </p>

      <p className={styles.note}>
        kf = {sig3(kf)} ({preset.kfUnit}) and kr = kf / K = {sig3(kr)}. The constant K comes from {preset.kSource.toLowerCase()}. Equilibrium amounts are from the ICE solver, and the curves are integrated from the rate laws.
      </p>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Reaction"
            options={PRESETS.map((p) => ({ value: p.id, label: p.label }))}
            value={presetId}
            onChange={choosePreset}
          />
          <Segmented
            label="Start from"
            options={[
              { value: 'reactants', label: 'Reactants' },
              { value: 'products', label: 'Products' },
            ]}
            value={start}
            onChange={chooseStart}
          />
          <Segmented
            label="Speed"
            options={SPEED_VALUES.map((value, i) => ({ value, label: SPEED_LABELS[i] }))}
            value={String(speed)}
            onChange={(value) => setSpeed(Number(value))}
          />
          <div className={styles.amounts}>
            {preset.species.map((s) => (
              <Slider
                key={`${presetId}-${s.id}`}
                label={`Starting [${s.name}]`}
                value={amounts[s.id] ?? 0}
                min={0}
                max={preset.sliderMax}
                step={preset.sliderStep}
                unit="mol L⁻¹"
                format={(v) => `${conc(v)} mol L⁻¹`}
                onChange={(v) => setAmounts((prev) => ({ ...prev, [s.id]: v }))}
              />
            ))}
          </div>
          <div>
            <Button variant="secondary" onClick={() => setReplay((n) => n + 1)}>
              Replay the approach
            </Button>
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
