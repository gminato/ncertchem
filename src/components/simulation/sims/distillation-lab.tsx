'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { DistillationRig } from '@/components/organic/lab'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { batchDistillation, plateCount, vapourPressureMmHg, type BatchPoint } from '@/lib/chem/distillation-column'
import {
  BENZENE_ANTOINE,
  TOLUENE_ANTOINE,
  WATER_ANTOINE_HIGH,
  steamDistillation,
} from '@/lib/chem/purification'
import styles from './distillation-lab.module.css'

type Mixture = 'benzene-toluene' | 'toluene-water'

/** The batch stops when this fraction of the charge has distilled over. */
const MAX_COLLECT = 0.9
/** Charge distilled per second while heating runs. */
const RATE = 0.06
/** Height equivalent to a theoretical plate, cm. An assumed value for this illustration. */
const HETP_CM = 5
const COLUMN = { min: 5, max: 60, step: 5 }
const FEED = { min: 0.1, max: 0.9, step: 0.05 }

const PLOT = { x0: 74, x1: 500, y0: 28, y1: 250 }
const PLOT_T = { y0: 14, y1: 146, tMin: 75, tMax: 115 }
const px = (collected: number) => PLOT.x0 + (collected / MAX_COLLECT) * (PLOT.x1 - PLOT.x0)
const py = (xB: number) => PLOT.y1 - xB * (PLOT.y1 - PLOT.y0)
const pyT = (t: number) => PLOT_T.y1 - ((t - PLOT_T.tMin) / (PLOT_T.tMax - PLOT_T.tMin)) * (PLOT_T.y1 - PLOT_T.y0)
/** A temperature to 0.1 °C. */
const tenth = (t: number) => Math.round(t * 10) / 10

/** The first sample at or after a collected fraction (the last one if none). */
function pointAt(points: readonly BatchPoint[], collected: number): BatchPoint {
  return points.find((p) => p.collected >= collected) ?? points[points.length - 1]
}

function polyline(points: readonly BatchPoint[], y: (p: BatchPoint) => number): string {
  return points.map((p) => `${px(p.collected).toFixed(1)},${y(p).toFixed(1)}`).join(' ')
}

/** A value as a percentage with the U+2212 minus where needed. */
function percent(v: number): string {
  const p = v * 100
  if (p > 99.95 && p < 100) return '>99.9%'
  return `${Math.round(p)}%`
}

/**
 * A distillation lab. Benzene and toluene (an ideal pair) can be distilled in a batch through a
 * column of chosen height, or toluene can be steam distilled with water. The thermometer, vapour
 * and distillate follow the purification and column libs. The plot gives the benzene mole fraction
 * of the distillate against the volume collected, with and without the column.
 */
export function DistillationLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const [mixture, setMixture] = useState<Mixture>('benzene-toluene')
  const [feed, setFeed] = useState(0.5)
  const [columnCm, setColumnCm] = useState(20)
  const [collected, setCollected] = useState(0)
  const [running, setRunning] = useState(false)

  const plates = plateCount(columnCm, HETP_CM)
  const reset = () => {
    setCollected(0)
    setRunning(false)
  }

  // Heating: charge distils over at a steady rate while the lab is on screen.
  const finished = collected >= MAX_COLLECT
  const isRunning = running && !finished && !reducedMotion
  useEffect(() => {
    if (!running || finished || !active || reducedMotion) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setCollected((c) => Math.min(MAX_COLLECT, c + dt * RATE))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, finished, active, reducedMotion])

  const onHeat = () => {
    if (reducedMotion) {
      setCollected(MAX_COLLECT)
      return
    }
    if (finished) {
      setCollected(0)
      setRunning(true)
      return
    }
    setRunning((r) => !r)
  }

  const column = useMemo(
    () => batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, feed, plates),
    [feed, plates],
  )
  const simple = useMemo(
    () => batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, feed, 1),
    [feed],
  )
  const here = pointAt(column, collected)
  const steam = useMemo(() => {
    const r = steamDistillation(WATER_ANTOINE_HIGH, TOLUENE_ANTOINE, 760)
    const tC = r.boilingPointK - 273.15
    const pTol = vapourPressureMmHg(TOLUENE_ANTOINE, tC)
    return { tC, boilingPointK: r.boilingPointK, pTol, yTol: pTol / 760 }
  }, [])

  const isSteam = mixture === 'toluene-water'
  const progress = collected / MAX_COLLECT
  // The head thermometer reads the vapour leaving the column top; the flask has its own temperature.
  // Before any heating the head holds only air at room temperature (25 °C).
  const cold = collected === 0 && !isRunning
  const thermometer = cold ? 25 : tenth(isSteam ? steam.tC : here.headC)
  const stillC = tenth(here.boilingPointC)
  const heatLabel = isRunning ? 'Pause' : finished ? 'Heat again' : collected > 0 ? 'Resume' : 'Heat'

  const summary = isSteam
    ? `Toluene and water boil together at ${steam.tC.toFixed(1)} °C, below 100 °C. Toluene is ${percent(steam.yTol)} of the vapour by mole.`
    : `Head ${thermometer.toFixed(1)} °C, still ${stillC.toFixed(1)} °C. Still ${percent(here.stillX)} benzene by mole. Distillate ${percent(here.distillateX)} benzene after ${percent(collected / MAX_COLLECT)} of the charge is collected, with ${plates} plate${plates === 1 ? '' : 's'}.`

  return (
    <div className={styles.sim} data-testid="distillation-lab" ref={rootRef}>
      <div className={styles.topRow}>
        <Segmented<Mixture>
          label="Mixture"
          value={mixture}
          onChange={(v) => {
            setMixture(v)
            reset()
          }}
          options={[
            { value: 'benzene-toluene', label: 'Benzene and toluene' },
            { value: 'toluene-water', label: 'Toluene and water' },
          ]}
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.stage}>
          <svg viewBox="0 0 360 390" role="img" aria-label={summary} className={styles.rig} data-testid="distillation-rig">
            <DistillationRig
              mode={isSteam ? 'steam' : 'fractional'}
              temperature={thermometer}
              progress={progress}
              flaskLevel={0.8 - 0.6 * progress}
              receiverLevel={0.08 + 0.7 * progress}
              receiverColor="var(--liquid)"
              pressureLabel="760 mmHg"
            />
          </svg>
          <p className={styles.thermo} data-testid="thermometer">
            {isSteam ? (
              <>
                Thermometer <span className="sym">T</span> = {thermometer.toFixed(1)} °C
              </>
            ) : (
              <>
                Head thermometer <span className="sym">T</span> = {thermometer.toFixed(1)} °C
                <br />
                Still <span className="sym">T</span> = {stillC.toFixed(1)} °C
              </>
            )}
          </p>
        </div>

        <div className={styles.side}>
          {isSteam ? (
            <SteamPanel steam={steam} />
          ) : (
            <ColumnPlot column={column} simple={simple} here={here} collected={collected} plates={plates} />
          )}

          <div className={styles.readout} aria-live="polite" data-testid="distillation-readout">
            <Row label="Still">
              {isSteam ? 'Toluene and water together' : `${percent(here.stillX)} benzene by mole, boiling at ${stillC.toFixed(1)} °C`}
            </Row>
            {!isSteam && (
              <Row label="Head">
                {collected === 0 ? 'Vapour not yet at the head' : `${thermometer.toFixed(1)} °C, the dew point of the vapour leaving the column`}
              </Row>
            )}
            <Row label="Distillate">
              {isSteam
                ? `${percent(collected / MAX_COLLECT)} of the charge collected`
                : collected === 0
                  ? 'None collected yet'
                  : `${percent(here.distillateX)} benzene by mole, averaged over ${percent(collected / MAX_COLLECT)} of the charge`}
            </Row>
            <Row label="Column">
              {isSteam ? 'Steam and the organic liquid pass straight to the condenser' : `${plates} theoretical plate${plates === 1 ? '' : 's'} (${columnCm} cm at ${HETP_CM} cm per plate)`}
            </Row>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        {!isSteam && (
          <>
            <Slider
              label="Feed"
              value={feed}
              min={FEED.min}
              max={FEED.max}
              step={FEED.step}
              format={(v) => `${v.toFixed(2)} benzene`}
              onChange={(v) => {
                setFeed(v)
                reset()
              }}
            />
            <Slider
              label="Column"
              value={columnCm}
              min={COLUMN.min}
              max={COLUMN.max}
              step={COLUMN.step}
              unit="cm"
              format={(v) => `${v} cm`}
              onChange={(v) => {
                setColumnCm(v)
                reset()
              }}
            />
          </>
        )}
        <Slider
          label="Collected"
          value={collected}
          min={0}
          max={MAX_COLLECT}
          step={0.01}
          format={(v) => `${percent(v / MAX_COLLECT)} of charge`}
          onChange={(v) => {
            setRunning(false)
            setCollected(v)
          }}
        />
        <div className={styles.buttons}>
          <Button onClick={onHeat} aria-pressed={isRunning}>
            {reducedMotion ? 'Collect all' : heatLabel}
          </Button>
          <Button variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

function ColumnPlot({
  column,
  simple,
  here,
  collected,
  plates,
}: {
  column: readonly BatchPoint[]
  simple: readonly BatchPoint[]
  here: BatchPoint
  collected: number
  plates: number
}) {
  return (
    <div className={styles.plotCard}>
      <svg viewBox="0 0 530 296" role="img" aria-label={`Benzene in the distillate against the fraction of the charge collected, with ${plates} plates and with simple distillation`} className={styles.plot} data-testid="distillate-plot">
        <line x1={PLOT.x0} y1={PLOT.y1} x2={PLOT.x1} y2={PLOT.y1} className={styles.axis} />
        <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0} y2={PLOT.y1} className={styles.axis} />
        {[0, 0.5, 1].map((v) => (
          <text key={v} x={PLOT.x0 - 6} y={py(v) + 4} textAnchor="end" className={styles.tick}>
            {v.toFixed(1)}
          </text>
        ))}
        {[0, 0.3, 0.6, 0.9].map((c) => (
          <text key={c} x={px(c)} y={PLOT.y1 + 18} textAnchor="middle" className={styles.tick}>
            {c.toFixed(1)}
          </text>
        ))}
        <text x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y1 + 42} textAnchor="middle" className={styles.axisLabel}>
          Fraction of charge collected
        </text>
        <text x={18} y={(PLOT.y0 + PLOT.y1) / 2} textAnchor="middle" transform={`rotate(-90 18 ${(PLOT.y0 + PLOT.y1) / 2})`} className={styles.axisLabel}>
          Benzene in distillate
        </text>
        <polyline points={polyline(simple, (p) => py(p.distillateX))} className={styles.simpleCurve} />
        <polyline points={polyline(column, (p) => py(p.distillateX))} className={styles.columnCurve} />
        <line x1={px(collected)} y1={PLOT.y0} x2={px(collected)} y2={PLOT.y1} className={styles.marker} />
        <circle cx={px(collected)} cy={py(here.distillateX)} r={5} className={styles.dot} />
      </svg>
      <svg viewBox="0 0 530 170" role="img" aria-label={`Head temperature against the fraction of the charge collected, with ${plates} plates and with simple distillation`} className={styles.plot} data-testid="head-plot">
        <line x1={PLOT.x0} y1={PLOT_T.y1} x2={PLOT.x1} y2={PLOT_T.y1} className={styles.axis} />
        <line x1={PLOT.x0} y1={PLOT_T.y0} x2={PLOT.x0} y2={PLOT_T.y1} className={styles.axis} />
        {[80, 90, 100, 110].map((t) => (
          <g key={t}>
            <line x1={PLOT.x0} y1={pyT(t)} x2={PLOT.x1} y2={pyT(t)} className={styles.grid} />
            <text x={PLOT.x0 - 6} y={pyT(t) + 4} textAnchor="end" className={styles.tick}>
              {t}
            </text>
          </g>
        ))}
        <text x={18} y={(PLOT_T.y0 + PLOT_T.y1) / 2} textAnchor="middle" transform={`rotate(-90 18 ${(PLOT_T.y0 + PLOT_T.y1) / 2})`} className={styles.axisLabel}>
          Head °C
        </text>
        {[0, 0.3, 0.6, 0.9].map((c) => (
          <text key={c} x={px(c)} y={PLOT_T.y1 + 16} textAnchor="middle" className={styles.tick}>
            {c.toFixed(1)}
          </text>
        ))}
        <text x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT_T.y1 + 34} textAnchor="middle" className={styles.axisLabel}>
          Fraction of charge collected
        </text>
        <polyline points={polyline(simple, (p) => pyT(p.headC))} className={styles.simpleCurve} />
        <polyline points={polyline(column, (p) => pyT(p.headC))} className={styles.columnCurve} />
        <line x1={px(collected)} y1={PLOT_T.y0} x2={px(collected)} y2={PLOT_T.y1} className={styles.marker} />
        <circle cx={px(collected)} cy={pyT(here.headC)} r={5} className={styles.dot} />
      </svg>
      <p className={styles.legend}>
        <span className={styles.swatchColumn} /> with the column <span className={styles.swatchSimple} /> simple distillation
      </p>
    </div>
  )
}

function SteamPanel({ steam }: { steam: { tC: number; pTol: number; yTol: number } }) {
  const width = 520
  const tolWidth = (steam.pTol / 760) * width
  return (
    <div className={styles.plotCard} data-testid="steam-panel">
      <svg viewBox="0 0 530 116" role="img" aria-label={`Partial pressures in the steam: toluene ${steam.pTol.toFixed(0)} mmHg and water the rest, adding to 760 mmHg`} className={styles.plot}>
        <text x={4} y={20} className={styles.axisLabel}>
          Pressures at {steam.tC.toFixed(1)} °C (mmHg)
        </text>
        <rect x={4} y={34} width={width} height={36} className={styles.waterBar} />
        <rect x={4} y={34} width={tolWidth} height={36} className={styles.tolBar} />
        <text x={4 + tolWidth / 2} y={57} textAnchor="middle" className={styles.barLabel}>
          toluene {steam.pTol.toFixed(0)}
        </text>
        <text x={4 + width - 10} y={57} textAnchor="end" className={styles.barLabel}>
          water {(760 - steam.pTol).toFixed(0)}
        </text>
        <text x={4} y={100} className={styles.axisLabel}>
          Sum = 760 mmHg, so the pair boils at {steam.tC.toFixed(1)} °C.
        </text>
      </svg>
    </div>
  )
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  )
}
