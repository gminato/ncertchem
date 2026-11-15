'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { PVDiagram, PistonCylinder } from '@/components/thermo'
import { Label, VocabDefs } from '@/components/vocab'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import { CYLINDER_FULL_L, signedJoule, signedLitreBar } from '@/components/animations/unit5/work/work-steps'
import { Symbolised } from '@/components/animations/unit5/work/symbols'
import { BAR_PER_ATM, workFromLitreBar, type Work } from '@/lib/chem/pv-work'
import {
  externalPressureAt,
  nRTBar,
  processFor,
  pvPathAtm,
  totalWork,
  volumeAt,
  workFraction,
  workSoFar,
  type Direction,
  type StepCount,
} from '@/lib/chem/isothermal-steps'
import styles from './pv-work-lab.module.css'

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 840 × 380)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 840
const VIEW_HEIGHT = 400
const CYL = { x: 190, base: 336, width: 130, height: 250 }
/** The p–V diagram's group: PVDiagram is drawn in its own 380 × 262 units, scaled to fit. */
const PV = { x: 420, y: 36, scale: 1.08 }
/** Plot box of PVDiagram in its own units, used for the free-expansion end markers. */
const PLOT = { left: 60, right: 360, top: 26, bottom: 214 }
const V_MAX = 14
const P_MAX = 5.5

const CHOICES = ['1', '2', '4', '8', '16', 'reversible'] as const
type Choice = (typeof CHOICES)[number]

const STEP_OPTIONS: ReadonlyArray<{ value: Choice; label: string }> = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '4', label: '4' },
  { value: '8', label: '8' },
  { value: '16', label: '16' },
  { value: 'reversible', label: '∞ reversible' },
]

function toSteps(choice: Choice): StepCount {
  return choice === 'reversible' ? 'reversible' : Number(choice)
}

/** Time to play the whole process, in ms: the staircase takes longer the more steps it has. */
function playMs(steps: StepCount): number {
  return steps === 'reversible' ? 5000 : 800 + 350 * steps
}

function stepsWord(steps: StepCount): string {
  if (steps === 'reversible') return '∞ steps (reversible)'
  return steps === 1 ? '1 step' : `${steps} steps`
}

const pvX = (v: number) => PLOT.left + (v / V_MAX) * (PLOT.right - PLOT.left)
const pvY = (p: number) => PLOT.bottom - (p / P_MAX) * (PLOT.bottom - PLOT.top)

/** A work value as a readout: L bar, then J, with a true minus sign. */
function workText(w: Work): string {
  return `${signedLitreBar(w)} (${signedJoule(w)})`
}

/**
 * The pv-work-lab Simulation: an ideal gas expands or is compressed isothermally between 6.00 L
 * and 12.00 L at 300 K, in a chosen number of steps. The piston drops its weights step by step,
 * and the p–V diagram draws the staircase and shades the work. The readout gives w in L bar and
 * J, and the fraction of the reversible maximum (or the multiple of the reversible minimum).
 */
export function PVWorkLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)

  const [choice, setChoice] = useState<Choice>('4')
  const [direction, setDirection] = useState<Direction>('expansion')
  const [free, setFree] = useState(false)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)

  const steps = toSteps(choice)
  const process = processFor(free ? 'expansion' : direction)
  const s = progress

  // Playing advances the progress with time. The ref keeps the frame loop from reading a stale value.
  const progressRef = useRef(progress)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    if (!playing || !active) return
    let frame = 0
    let last = performance.now()
    const duration = playMs(steps)
    const tick = (now: number) => {
      const dt = now - last
      last = now
      const next = Math.min(1, progressRef.current + dt / duration)
      progressRef.current = next
      setProgress(next)
      if (next >= 1) {
        setPlaying(false)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, active, steps])

  const reset = () => {
    setPlaying(false)
    setProgress(0)
  }

  const play = () => {
    if (reducedMotion) {
      setPlaying(false)
      setProgress(1)
      return
    }
    if (progressRef.current >= 1) {
      progressRef.current = 0
      setProgress(0)
    }
    setPlaying(true)
  }

  const changeChoice = (next: Choice) => {
    setChoice(next)
    reset()
  }
  const changeDirection = (next: Direction) => {
    setDirection(next)
    reset()
  }
  const changeFree = (on: boolean) => {
    setFree(on)
    reset()
  }
  const scrub = (value: number) => {
    setPlaying(false)
    progressRef.current = value / 100
    setProgress(value / 100)
  }

  // Readouts for the current progress, and for the whole process.
  const whole = free ? workFromLitreBar(0) : totalWork(process, steps)
  const soFar = free ? workFromLitreBar(0) : workSoFar(process, steps, s)
  const fraction = free ? 0 : workFraction(process, steps)
  const pExtBar = free ? 0 : externalPressureAt(process, steps, s)
  const pExtAtm = pExtBar / BAR_PER_ATM
  const plates = Math.round(pExtAtm)
  const volume = free ? (s > 0 ? process.endL : process.startL) : volumeAt(process, steps, s)
  const nRT = nRTBar(process)
  const nRTAtm = nRT / BAR_PER_ATM
  const pathPoints = free ? [] : pvPathAtm(process, steps, s)

  const fractionText = (() => {
    if (free) return 'No work: the gas meets no pressure'
    if (steps === 'reversible') return 'Reversible: 100% of the reversible value, by definition'
    return direction === 'expansion'
      ? `${Math.round(fraction * 100)}% of the reversible maximum`
      : `${Math.round(fraction * 100)}% of the reversible minimum`
  })()

  const summary = free
    ? 'Free expansion into a vacuum: w = 0, q = 0 and ΔU = 0. Nothing pushes back on the gas.'
    : `${direction === 'expansion' ? 'Expansion' : 'Compression'} in ${stepsWord(steps)}. Work so far ${workText(soFar)}. Whole process ${workText(whole)}, ${fractionText.toLowerCase()}.`

  return (
    <div ref={rootRef} className={styles.sim}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={summary}
        className={styles.svg}
        data-testid="pv-work-lab-stage"
      >
        <VocabDefs />

        <PistonCylinder
          x={CYL.x}
          y={CYL.base}
          width={CYL.width}
          height={CYL.height}
          volume={volume / CYLINDER_FULL_L}
          externalPressure={plates}
          particles={18}
          seed={9}
        />
        <Label x={CYL.x} y={CYL.base + 24} fontSize={16} fill="var(--fg)">
          <Symbolised text={`V = ${volume.toFixed(2)} L`} />
        </Label>

        {/* p–V diagram: the staircase so far, shaded by its work, and the isotherm */}
        <g transform={`translate(${PV.x}, ${PV.y}) scale(${PV.scale})`}>
          <PVDiagram
            series={
              free
                ? []
                : [{ id: 'path', points: pathPoints, style: 'straight', tone: 'accent', label: stepsWord(steps) }]
            }
            shade="path"
            nRT={nRTAtm}
            vMax={V_MAX}
            pMax={P_MAX}
            vTicks={[2, 4, 6, 8, 10, 12, 14]}
            pTicks={[1, 2, 3, 4, 5]}
            title="p–V diagram of the isothermal change"
          />
          {free && (
            <g data-testid="free-markers">
              <circle cx={pvX(process.startL)} cy={pvY(nRT / process.startL / BAR_PER_ATM)} r={5} style={{ fill: 'var(--fg)' }} />
              <circle cx={pvX(process.endL)} cy={pvY(nRT / process.endL / BAR_PER_ATM)} r={5} style={{ fill: 'var(--fg)' }} />
            </g>
          )}
        </g>

        <Label x={20} y={VIEW_HEIGHT - 12} textAnchor="start" fontSize={16} fill="var(--fg-muted)" data-testid="lab-caption">
          <Symbolised
            text={
              free
                ? 'Free expansion: the gas fills the vacuum, and no weight is lifted.'
                : `p_ex = ${pExtAtm.toFixed(2)} atm now (weights drawn to whole atm)`
            }
          />
        </Label>
      </svg>

      <dl className={styles.readout}>
        <div className={styles.item}>
          <dt>Work so far, w</dt>
          <dd data-testid="work-so-far">{free ? '0 L bar (0 J)' : workText(soFar)}</dd>
        </div>
        <div className={styles.item}>
          <dt>Whole process</dt>
          <dd data-testid="work-whole">{workText(whole)}</dd>
        </div>
        <div className={styles.item}>
          <dt>Compared with reversible</dt>
          <dd data-testid="work-fraction">{fractionText}</dd>
        </div>
        <div className={styles.item}>
          <dt>Heat and internal energy</dt>
          <dd>
            ΔU = 0 for an ideal gas at constant T, so q = −w{free ? ' = 0' : ''}
          </dd>
        </div>
      </dl>

      <p className={styles.live} aria-live="polite" data-testid="pv-work-live">
        {summary}
      </p>

      <SimulationControls>
        <Segmented<Choice>
          label="Number of steps"
          options={STEP_OPTIONS}
          value={choice}
          onChange={changeChoice}
        />
        {!free && (
          <Segmented<Direction>
            label="Direction"
            options={[
              { value: 'expansion', label: 'Expansion' },
              { value: 'compression', label: 'Compression' },
            ]}
            value={direction}
            onChange={changeDirection}
          />
        )}
        <Toggle label="Free expansion into a vacuum" checked={free} onChange={changeFree} />
        <Button variant="primary" onClick={playing ? () => setPlaying(false) : play}>
          {playing ? 'Pause' : progress >= 1 ? 'Play again' : 'Play'}
        </Button>
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
        <Slider
          label="Progress"
          value={Math.round(progress * 100)}
          min={0}
          max={100}
          step={1}
          unit="%"
          onChange={scrub}
        />
      </SimulationControls>
    </div>
  )
}
