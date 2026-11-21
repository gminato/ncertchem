'use client'

import { useEffect, useRef, useState } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Button, Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { Beaker, DcSource, Electrode, Ion, Wire, driftAlong, type ElectrodeMaterial, type Point } from '@/components/vocab'
import { FARADAY } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  PLATING_METALS,
  formatHalfUp,
  electronsPerIon,
  platingMetal,
  platingReadout,
  seriesReadout,
  type PlatingMetal,
  type PlatingMetalId,
} from '@/lib/chem/electroplating'
import styles from './electroplating-lab.module.css'

type Setup = 'single' | 'series'

const SETUP_OPTIONS = [
  { value: 'single', label: 'One cell' },
  { value: 'series', label: 'Two cells in series' },
] as const

const METAL_OPTIONS = PLATING_METALS.map((m) => ({ value: m.id, label: m.ion }))

const PLAY_MS = 8000
const SERIES_IDS: readonly [PlatingMetalId, PlatingMetalId] = ['Ag', 'Cu']

const MATERIAL: Record<PlatingMetalId, ElectrodeMaterial> = { Ag: 'ag', Cu: 'cu', Ni: 'ni' }
const OBJECT_MATERIAL: ElectrodeMaterial = 'fe'

/** Solution tint for each bath: Cu²⁺ blue, Ni²⁺ green, Ag⁺ clear. */
const SOLUTION_TINT: Record<PlatingMetalId, 'clear' | 'blue' | 'green'> = { Ag: 'clear', Cu: 'blue', Ni: 'green' }

const CATION_LANE_Y = 300
const ANION_LANE_Y = 332
/** Ion labels at 20 px: their subscripts render at 0.72 of that, 14.4 px. */
const ION_FONT = 20
const ELECTRODE_TOP = 150
const ELECTRODE_LENGTH = 130
const ELECTRODE_WIDTH = 18

interface CellGeom {
  readonly bx: number
  readonly bw: number
  readonly anodeX: number
  readonly cathodeX: number
}

// Electrodes sit outside the supply box (x 205–355), so no wire runs through it.
const SINGLE_GEOM: CellGeom = { bx: 150, bw: 280, anodeX: 165, cathodeX: 390 }
const SERIES_GEOM: readonly [CellGeom, CellGeom] = [
  { bx: 40, bw: 240, anodeX: 100, cathodeX: 210 },
  { bx: 300, bw: 240, anodeX: 370, cathodeX: 480 },
]
const SOURCE = { x: 205, y: 56, width: 150, height: 56 }

/** Lead runs sit low enough that the electron glow stays inside the viewBox. */
const WIRE_TOP_Y = 22
/** Source terminal posts sit 16 px above the supply box. */
const TERMINAL_Y = SOURCE.y - 16

const NUM = new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 })
const SUPER: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }

/** Scientific notation with superscript exponent, e.g. 3.11 × 10⁻³. */
function sci(x: number): string {
  if (x === 0) return '0'
  const e = Math.floor(Math.log10(x))
  const mantissa = (x / 10 ** e).toPrecision(3)
  return `${mantissa} × 10${String(e).split('').map((c) => SUPER[c]).join('')}`
}

function minutesText(s: number): string {
  return NUM.format(s / 60)
}

function cellEquations(metal: PlatingMetal): { cathode: string; anode: string } {
  const n = electronsPerIon(metal)
  const e = n === 1 ? 'e⁻' : `${n}e⁻`
  return {
    cathode: `${metal.ion}(aq) + ${e} → ${metal.id}(s)`,
    anode: `${metal.id}(s) → ${metal.ion}(aq) + ${e}`,
  }
}

export function ElectroplatingLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const t = useAmbientTime(reducedMotion)

  const [setup, setSetup] = useState<Setup>('single')
  const [metalId, setMetalId] = useState<PlatingMetalId>('Ag')
  const [currentA, setCurrentA] = useState<number>(0.5)
  const [timeMin, setTimeMin] = useState<number>(10)
  const [progress, setProgress] = useState<number>(1)
  const [running, setRunning] = useState<boolean>(false)

  // Advance the run while it plays and the Simulation is on screen.
  useEffect(() => {
    if (!running || !active || reducedMotion) return
    let last = performance.now()
    let p = progress
    let frame = 0
    const step = (now: number) => {
      // Clamp the frame gap: after a pause in a hidden tab, one long gap must not finish the run.
      const dt = Math.min(100, Math.max(0, now - last))
      p = Math.min(1, p + dt / PLAY_MS)
      last = now
      setProgress(p)
      if (p >= 1) {
        setRunning(false)
        return
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // progress is read once when the run starts; the loop owns it from then on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, active, reducedMotion])

  const totalS = timeMin * 60
  const elapsedS = totalS * progress
  const metal = platingMetal(metalId)
  const single = platingReadout(metal, currentA, elapsedS)
  const seriesMetals = SERIES_IDS.map((id) => platingMetal(id))
  const series = seriesReadout(seriesMetals, currentA, elapsedS)

  const cells =
    setup === 'single'
      ? [{ metal, geom: SINGLE_GEOM }]
      : [
          { metal: seriesMetals[0], geom: SERIES_GEOM[0] },
          { metal: seriesMetals[1], geom: SERIES_GEOM[1] },
        ]

  const handlePlay = () => {
    if (reducedMotion) {
      setProgress(1)
      return
    }
    if (running) {
      setRunning(false)
      return
    }
    if (progress >= 1) setProgress(0)
    setRunning(true)
  }

  const handleReset = () => {
    setRunning(false)
    setProgress(0)
  }

  const plating = progress * 0.6
  const first = cells[0]
  const last = cells[cells.length - 1]
  const anodeWire = [
    { x: SOURCE.x + SOURCE.width * 0.25, y: TERMINAL_Y },
    { x: SOURCE.x + SOURCE.width * 0.25, y: WIRE_TOP_Y },
    { x: first.geom.anodeX, y: WIRE_TOP_Y },
    { x: first.geom.anodeX, y: ELECTRODE_TOP },
  ]
  const cathodeWire = [
    { x: SOURCE.x + SOURCE.width * 0.75, y: TERMINAL_Y },
    { x: SOURCE.x + SOURCE.width * 0.75, y: WIRE_TOP_Y },
    { x: last.geom.cathodeX, y: WIRE_TOP_Y },
    { x: last.geom.cathodeX, y: ELECTRODE_TOP },
  ]
  const bridge: Point[] = [
    { x: cells[0].geom.cathodeX, y: ELECTRODE_TOP },
    { x: cells[0].geom.cathodeX, y: 142 },
    { x: cells[1]?.geom.anodeX ?? cells[0].geom.cathodeX, y: 142 },
    { x: cells[1]?.geom.anodeX ?? cells[0].geom.cathodeX, y: ELECTRODE_TOP },
  ]

  const current = `${NUM.format(currentA)} A`
  const summary =
    setup === 'single'
      ? `${current} for ${minutesText(elapsedS)} min: Q = ${NUM.format(single.charge)} C, ${sci(single.molesOfElectrons)} mol of electrons, ${NUM.format(single.massG)} g of ${metal.id} deposited.`
      : `Same charge through both cells: Q = ${NUM.format(series.charge)} C. Ag deposited ${NUM.format(series.masses[0])} g; Cu deposited ${NUM.format(series.masses[1])} g.`

  // Announce on state changes, and at each whole minute or 10 % of the run, never per frame.
  const runStep = `${Math.floor(elapsedS / 60)}-${Math.floor(progress * 10)}`
  const announceKey = `${setup}|${metalId}|${running}|${runStep}`
  const announced = useRef(false)
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    if (!announced.current) {
      announced.current = true
      return
    }
    const state = progress >= 1 ? 'Run finished.' : running ? 'Run in progress.' : 'Run paused.'
    setAnnouncement(`${state} ${summary}`)
    // summary is read at the moment the key changes; the key alone decides when to speak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announceKey])

  return (
    <div className={styles.sim} ref={rootRef}>
      <p role="status" aria-live="polite" className={styles.sr}>{announcement}</p>
      <div className={styles.controls}>
        <Segmented label="Setup" options={SETUP_OPTIONS} value={setup} onChange={setSetup} />
        {setup === 'single' && (
          <Segmented label="Metal ion in the bath" options={METAL_OPTIONS} value={metalId} onChange={setMetalId} />
        )}
        <div className={styles.sliderGrid}>
          <Slider
            label="Current"
            value={currentA}
            min={0.1}
            max={5}
            step={0.1}
            unit="A"
            onChange={setCurrentA}
          />
          <Slider
            label="Time"
            value={timeMin}
            min={1}
            max={60}
            step={1}
            unit="min"
            onChange={setTimeMin}
          />
          <Slider
            label="Run progress"
            value={Math.round(progress * 100)}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(v) => {
              setRunning(false)
              setProgress(v / 100)
            }}
          />
        </div>
        <div className={styles.buttons}>
          <Button onClick={handlePlay}>{running ? 'Pause' : progress >= 1 ? 'Play again' : 'Play'}</Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      <div className={`${styles.stage} ${setup === 'series' ? styles.stageSeries : ''}`}>
        <div className={styles.scroller}>
        <svg
          viewBox="0 0 580 364"
          role="img"
          aria-label={`Electroplating ${setup === 'single' ? `with ${metal.ion} in one cell` : 'with Ag⁺ and Cu²⁺ cells in series'}. ${summary}`}
          className={styles.svg}
        >
          <DcSource
            x={SOURCE.x}
            y={SOURCE.y}
            width={SOURCE.width}
            height={SOURCE.height}
            display={current}
          />
          <Wire corners={anodeWire} t={t} direction="reverse" electrons dots={3} currentArrow currentLabel="I" />
          <Wire corners={cathodeWire} t={t} direction="forward" electrons dots={3} />
          {cells.length === 2 && (
            <Wire corners={bridge} t={t} direction="reverse" electrons dots={3} />
          )}

          {cells.map((cell, i) => {
            const { geom } = cell
            const width = geom.bw
            const tint = SOLUTION_TINT[cell.metal.id]
            const cathodeDeposit = MATERIAL[cell.metal.id]
            return (
              <g key={`${cell.metal.id}-${i}`} data-cell={i}>
                <Beaker x={geom.bx} y={170} width={width} height={180} level={0.82} tint={tint} />
                {driftAlong(
                  [
                    { x: geom.bx + 30, y: CATION_LANE_Y },
                    { x: geom.bx + width - 30, y: CATION_LANE_Y },
                  ],
                  2,
                  t,
                  true
                ).map((p, k) => (
                  <Ion key={`c${k}`} x={p.x} y={p.y} kind="cation" formula={cell.metal.id} charge={cell.metal.charge} fontSize={ION_FONT} />
                ))}
                {driftAlong(
                  [
                    { x: geom.bx + 30, y: ANION_LANE_Y },
                    { x: geom.bx + width - 30, y: ANION_LANE_Y },
                  ],
                  2,
                  t,
                  false
                ).map((p, k) => (
                  <Ion key={`a${k}`} x={p.x} y={p.y} kind="anion" formula={cell.metal.anion.formula} charge={cell.metal.anion.charge} fontSize={ION_FONT} />
                ))}
                <Electrode
                  x={geom.anodeX}
                  top={ELECTRODE_TOP}
                  length={ELECTRODE_LENGTH}
                  width={ELECTRODE_WIDTH}
                  material={MATERIAL[cell.metal.id]}
                  thinning={plating}
                  polarity="+"
                  role="anode"
                />
                <Electrode
                  x={geom.cathodeX}
                  top={ELECTRODE_TOP}
                  length={ELECTRODE_LENGTH}
                  width={ELECTRODE_WIDTH}
                  material={OBJECT_MATERIAL}
                  depositMaterial={cathodeDeposit}
                  plating={plating}
                  polarity="−"
                  role="cathode"
                />
              </g>
            )
          })}
        </svg>
        </div>
      </div>

      <div className={styles.readouts} data-testid="sim-readout">
        <p className={styles.summary}>{summary}</p>
        {setup === 'single' ? (
          <dl className={styles.grid}>
            <div className={styles.tile}>
              <dt><span className="sym">Q</span> = <span className="sym">I</span> × <span className="sym">t</span></dt>
              <dd>{NUM.format(single.charge)} C</dd>
            </div>
            <div className={styles.tile}>
              <dt>n(e⁻) = <span className="sym">Q</span> / <span className="sym">F</span></dt>
              <dd>{sci(single.molesOfElectrons)} mol</dd>
            </div>
            <div className={styles.tile}>
              <dt><span className="sym">m</span> = (<span className="sym">Q</span>/<span className="sym">F</span>)(<span className="sym">M</span>/<span className="sym">n</span>)</dt>
              <dd>{NUM.format(single.massG)} g {metal.id}</dd>
            </div>
          </dl>
        ) : (
          <dl className={styles.grid}>
            <div className={styles.tile}>
              <dt><span className="sym">Q</span> through both cells</dt>
              <dd>{NUM.format(series.charge)} C</dd>
            </div>
            {seriesMetals.map((m, i) => (
              <div className={styles.tile} key={m.id}>
                <dt>{m.id} deposited (<span className="sym">M</span>/<span className="sym">n</span> = {formatHalfUp(m.molarMass / electronsPerIon(m), 2)})</dt>
                <dd>{NUM.format(series.masses[i])} g</dd>
              </div>
            ))}
          </dl>
        )}
        <ul className={styles.equations}>
          {cells.map((cell) => {
            const eq = cellEquations(cell.metal)
            return (
              <li key={cell.metal.id}>
                <span className={styles.tag}>Cathode (−)</span> {eq.cathode}
                <br />
                <span className={styles.tag}>Anode (+)</span> {eq.anode} <span className={styles.note}>(soluble anode replaces the ions removed)</span>
              </li>
            )
          })}
        </ul>
        <p className={styles.note}>
          Deposit thickness is a schematic drawing, scaled to the run. F = {FARADAY} C mol⁻¹.
        </p>
      </div>
    </div>
  )
}
