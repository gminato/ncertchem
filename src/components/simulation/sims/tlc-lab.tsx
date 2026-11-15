'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { ChromatographyColumn, ChromatographyPlate, type ChromatogramSpot, type ColumnBand, type VisualiseMode } from '@/components/organic/lab'
import type { SimulationProps } from '@/components/simulation/registry'
import { rf as rfFromDistances } from '@/lib/chem/purification'
import {
  ANALYTES,
  CANDIDATES,
  PLATE_BASELINE_Y,
  PLATE_SOLVENT_CM,
  PLATE_SOLVENT_PX,
  RF_READING_TOLERANCE,
  analyteById,
  candidateRfTable,
  columnArrival,
  matchRf,
  modelRf,
  solventLabel,
  type Analyte,
} from '@/lib/chem/chromatography'
import { useIsActive } from '@/components/simulation/useIsActive'
import styles from './tlc-lab.module.css'

type Technique = 'tlc' | 'column'
type AnalyteId = Analyte['id']

const MAX_SPOTS = 3
const DEVELOP_SECONDS = 2.4
const DEFAULT_SPOTTED: AnalyteId[] = ['red', 'blue', 'colourless']
const DEFAULT_SOLVENT = 0.4
const RULER_X = 262
const LANE_LEFT = 60
const MARKER_STEP_CM = 0.1
const MARKER_BIG_STEP_CM = 0.5

/** One letter per substance, drawn under its spot. The unknown is U so its identity is not in the name. */
const LETTER: Record<AnalyteId, string> = { red: 'R', blue: 'B', green: 'G', colourless: 'C', unknown: 'U' }

/** The illustrative model's identity of the unknown: the known substance with the same adsorption constant. */
function unknownIdentity(): Analyte | undefined {
  const u = analyteById('unknown')
  return CANDIDATES.find((c) => c.adsorption === u.adsorption)
}

const cmToY = (cm: number) => PLATE_BASELINE_Y - (cm / PLATE_SOLVENT_CM) * PLATE_SOLVENT_PX
const yToCm = (y: number) => ((PLATE_BASELINE_Y - y) / PLATE_SOLVENT_PX) * PLATE_SOLVENT_CM

/** Rf from the two marker distances, or null when the markers do not make a valid reading. */
function readRf(spotCm: number, frontCm: number): number | null {
  try {
    return rfFromDistances(spotCm, frontCm)
  } catch {
    return null
  }
}

/**
 * Thin layer and column chromatography with an illustrative adsorption model. Spot up to three
 * substances, choose the solvent strength, develop the plate, then read Rf with a ruler and match an
 * unknown against the standards run in the same solvent. The column mode elutes the same substances
 * into fraction tubes, in the order of their arrival at the bottom.
 */
export function TlcLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const svgRef = useRef<SVGSVGElement>(null)

  const [technique, setTechnique] = useState<Technique>('tlc')
  const [spotted, setSpotted] = useState<AnalyteId[]>(DEFAULT_SPOTTED)
  const [s, setS] = useState(DEFAULT_SOLVENT)
  const [visualise, setVisualise] = useState<VisualiseMode>('none')
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [measureId, setMeasureId] = useState<AnalyteId>('blue')
  const [frontCm, setFrontCm] = useState(PLATE_SOLVENT_CM)
  const [spotCm, setSpotCm] = useState(4)
  const [revealed, setRevealed] = useState(false)
  const progressRef = useRef(0)
  const dragging = useRef<'front' | 'spot' | null>(null)

  const setP = (value: number) => {
    progressRef.current = value
    setProgress(value)
  }

  // The solvent front rises while `running`. The loop pauses when the simulation is off screen and
  // resumes from where it stopped. Under reduced motion `develop` jumps straight to the end instead.
  useEffect(() => {
    if (!running || !active || reducedMotion) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const next = Math.min(1, progressRef.current + dt / DEVELOP_SECONDS)
      setP(next)
      if (next >= 1) setRunning(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, active, reducedMotion])

  const spotAnalytes = spotted.map(analyteById)
  const effectiveMeasure: AnalyteId = spotted.includes(measureId) ? measureId : (spotted[0] ?? 'blue')
  const measured = spotted.length > 0 ? analyteById(effectiveMeasure) : null

  const plateSpots: ChromatogramSpot[] = spotAnalytes.map((a) => ({
    id: LETTER[a.id],
    rf: modelRf(a.adsorption, s),
    color: a.colourless ? undefined : a.color,
    colourless: a.colourless,
  }))

  const columnBands: ColumnBand[] = spotAnalytes
    .map((a) => ({ id: LETTER[a.id], color: a.colourless ? 'var(--fg-subtle)' : a.color, arrival: columnArrival(a.adsorption, s) }))
    .sort((a, b) => a.arrival - b.arrival)

  const toggleSpot = (id: AnalyteId, on: boolean) => {
    setSpotted((prev) => {
      if (on) return prev.includes(id) || prev.length >= MAX_SPOTS ? prev : [...prev, id]
      return prev.filter((x) => x !== id)
    })
    if (on) setRevealed(false)
  }

  const develop = () => {
    if (reducedMotion) {
      setP(1)
      return
    }
    if (progressRef.current >= 1) setP(0)
    setRunning(true)
  }

  const reset = () => {
    setRunning(false)
    setP(0)
  }

  // Ruler markers, in cm from the origin. A pointer drag converts the pointer to plate coordinates.
  const pointerToCm = (event: ReactPointerEvent<SVGSVGElement> | PointerEvent) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const local = pt.matrixTransform(ctm.inverse())
    return Math.min(PLATE_SOLVENT_CM, Math.max(0, yToCm(local.y)))
  }

  const onSvgPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const which = dragging.current
    if (!which) return
    const cm = pointerToCm(event)
    if (cm === null) return
    if (which === 'front') setFrontCm(cm)
    else setSpotCm(cm)
  }

  const endDrag = () => {
    dragging.current = null
  }

  const keyNudge = (which: 'front' | 'spot') => (event: KeyboardEvent<SVGGElement>) => {
    const step = event.shiftKey ? MARKER_BIG_STEP_CM : MARKER_STEP_CM
    let delta = 0
    if (event.key === 'ArrowUp' || event.key === 'ArrowRight') delta = step
    else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') delta = -step
    else return
    event.preventDefault()
    const clampCm = (v: number) => Math.min(PLATE_SOLVENT_CM, Math.max(0, Math.round(v * 100) / 100))
    if (which === 'front') setFrontCm((c) => clampCm(c + delta))
    else setSpotCm((c) => clampCm(c + delta))
  }

  const rf = measured ? readRf(spotCm, frontCm) : null
  const modelForMeasured = measured ? modelRf(measured.adsorption, s) : null
  const agrees = rf !== null && modelForMeasured !== null && Math.abs(rf - modelForMeasured) <= RF_READING_TOLERANCE
  const unknownMatches = measured?.id === 'unknown' && rf !== null ? matchRf(rf, s) : []
  const identity = unknownIdentity()
  const solventCm = progress * PLATE_SOLVENT_CM
  const table = candidateRfTable(s)

  const summary =
    technique === 'tlc'
      ? `Thin layer plate: solvent front at ${solventCm.toFixed(1)} cm, solvent strength ${s.toFixed(2)} (${solventLabel(s)}). ` +
        (rf !== null && measured
          ? `Measured Rf for ${measured.label} is ${rf.toFixed(2)}.`
          : 'Move the ruler markers to measure an Rf.')
      : `Column: ${columnBands.map((b, i) => `F${i + 1} ${b.id}`).join(', ') || 'nothing spotted'}; eluent progress ${Math.round(progress * 100)} %.`

  const spotRows = spotAnalytes.length === 0 ? <p className={styles.note}>Choose up to three substances to spot.</p> : null

  return (
    <div ref={rootRef} className={styles.sim} data-testid="tlc-lab" data-technique={technique}>
      <div className={styles.toolbar}>
        <Segmented
          label="Technique"
          value={technique}
          onChange={(v) => {
            setTechnique(v)
            setRunning(false)
          }}
          options={[
            { value: 'tlc', label: 'Thin layer' },
            { value: 'column', label: 'Column' },
          ]}
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.stage}>
          {technique === 'tlc' ? (
            <svg
              ref={svgRef}
              viewBox="0 0 340 318"
              role="img"
              aria-label={`Thin layer plate with ${spotAnalytes.length} spots, solvent front at ${solventCm.toFixed(1)} cm`}
              className={styles.svg}
              onPointerMove={onSvgPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              data-testid="tlc-plate"
            >
              <ChromatographyPlate kind="tlc" spots={plateSpots} progress={progress} visualise={visualise} title="Thin layer plate" />
              <Ruler frontCm={frontCm} spotCm={spotCm} spotColor={measured?.colourless ? 'var(--fg)' : measured?.color ?? 'var(--fg)'} spotLabel={measured ? LETTER[measured.id] : '·'} dragging={dragging} keyNudge={keyNudge} />
            </svg>
          ) : (
            <svg viewBox="0 0 340 344" role="img" aria-label={`Column with ${columnBands.length} bands`} className={styles.svg} data-testid="tlc-column">
              <ChromatographyColumn bands={columnBands} progress={progress} title="Column" />
            </svg>
          )}
          <p className={styles.caption}>
            Affinities are illustrative numbers chosen for this lab. They are not measured values for these substances.
          </p>
        </div>

        <div className={styles.side}>
          <fieldset className={styles.group}>
            <legend>Substances to spot (up to {MAX_SPOTS})</legend>
            <div className={styles.toggles}>
              {ANALYTES.map((a) => {
                const on = spotted.includes(a.id)
                return (
                  <Toggle
                    key={a.id}
                    label={a.id === 'unknown' ? 'Unknown (identity hidden)' : a.label}
                    checked={on}
                    disabled={!on && spotted.length >= MAX_SPOTS}
                    onChange={(v) => toggleSpot(a.id, v)}
                  />
                )
              })}
            </div>
            {spotRows}
          </fieldset>

          <div className={styles.controls}>
            <Slider
              label="Solvent strength"
              value={s}
              min={0}
              max={1}
              step={0.01}
              format={(v) => `${v.toFixed(2)} · ${solventLabel(v)}`}
              onChange={(v) => {
                setS(v)
                setRevealed(false)
              }}
            />
            {technique === 'tlc' && (
              <Segmented
                label="Visualise colourless spots"
                value={visualise}
                onChange={setVisualise}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'uv', label: 'UV lamp' },
                  { value: 'iodine', label: 'Iodine' },
                ]}
              />
            )}
            <Slider
              label={technique === 'tlc' ? 'Solvent front' : 'Eluent progress'}
              value={progress}
              min={0}
              max={1}
              step={0.01}
              format={(v) => (technique === 'tlc' ? `${(v * PLATE_SOLVENT_CM).toFixed(1)} cm` : `${Math.round(v * 100)} %`)}
              onChange={(v) => {
                setRunning(false)
                setP(v)
              }}
            />
            <div className={styles.buttons}>
              <Button onClick={develop}>{technique === 'tlc' ? 'Develop plate' : 'Elute column'}</Button>
              <Button variant="secondary" onClick={reset}>
                Reset
              </Button>
            </div>
          </div>

          {technique === 'tlc' && spotted.length > 0 && (
            <div className={styles.readout} aria-live="polite" data-testid="tlc-readout">
              <div className={styles.row}>
                <span className={styles.rowLabel}>Measure spot</span>
                <Segmented
                  label="Spot to measure"
                  value={effectiveMeasure}
                  onChange={setMeasureId}
                  options={spotAnalytes.map((a) => ({ value: a.id, label: LETTER[a.id] }))}
                />
              </div>
              <p className={styles.note}>
                Drag the orange front marker to the solvent front, and the spot marker to the centre of spot {measured ? LETTER[measured.id] : ''}. Arrow keys nudge a focused marker.
              </p>
              <div className={styles.row}>
                <span className={styles.rowLabel}>Distances</span>
                <span data-testid="distances">
                  spot {spotCm.toFixed(1)} cm, front {frontCm.toFixed(1)} cm
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.rowLabel}>
                  <span className="sym">Rf</span> = spot ÷ front
                </span>
                <strong data-testid="rf-reading">{rf === null ? 'Move the spot marker above the origin' : rf.toFixed(2)}</strong>
              </div>
              {measured && rf !== null && modelForMeasured !== null && (
                <p className={styles.note} data-testid="rf-check">
                  {agrees
                    ? `Within ${RF_READING_TOLERANCE.toFixed(2)} of the model value for ${measured.id === 'unknown' ? 'this spot' : measured.label} (${modelForMeasured.toFixed(2)}).`
                    : `Not yet within ${RF_READING_TOLERANCE.toFixed(2)} of the model value (${modelForMeasured.toFixed(2)}). Check the front and spot markers.`}
                </p>
              )}
              {measured?.id === 'unknown' && rf !== null && (
                <div className={styles.identify} data-testid="identify">
                  <p className={styles.note}>
                    Standards in this solvent: {table.map((t) => `${t.analyte.label} ${t.rf.toFixed(2)}`).join(' · ')}.
                  </p>
                  <p>
                    {unknownMatches.length === 0
                      ? 'No standard matches this Rf within 0.03. Re-measure, or run the standards in this solvent.'
                      : `Closest standard: ${unknownMatches.map((m) => m.analyte.label).join(' or ')}.`}
                  </p>
                  <Button variant="secondary" onClick={() => setRevealed(true)}>
                    Reveal the unknown
                  </Button>
                  {revealed && identity && <p data-testid="reveal">The unknown is the {identity.label.toLowerCase()} in this model.</p>}
                </div>
              )}
            </div>
          )}

          {technique === 'column' && (
            <div className={styles.readout} aria-live="polite" data-testid="column-readout">
              <p className={styles.note}>Fraction tubes fill in the order the bands leave the column. Colourless bands are drawn in grey, because a colourless band cannot be seen on the column.</p>
              {columnBands.length === 0 && <p className={styles.note}>Spot at least one substance.</p>}
              {columnBands.map((b, i) => (
                <div key={b.id} className={styles.bandRow}>
                  <span className={styles.rowLabel}>F{i + 1}</span>
                  <span>
                    {b.id} ({analyteOfLetter(b.id)}), arrives at {Math.round(b.arrival * 100)} % of the column
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

function analyteOfLetter(letter: string): string {
  const id = (Object.keys(LETTER) as AnalyteId[]).find((k) => LETTER[k] === letter)
  return id ? analyteById(id).label : letter
}

/** The draggable ruler along the right of the plate: a scale in cm with a front marker and a spot marker. */
function Ruler({
  frontCm,
  spotCm,
  spotColor,
  spotLabel,
  dragging,
  keyNudge,
}: {
  frontCm: number
  spotCm: number
  spotColor: string
  spotLabel: string
  dragging: { current: 'front' | 'spot' | null }
  keyNudge: (which: 'front' | 'spot') => (event: KeyboardEvent<SVGGElement>) => void
}) {
  const frontY = cmToY(frontCm)
  const spotY = cmToY(spotCm)
  const ticks = Array.from({ length: PLATE_SOLVENT_CM * 2 + 1 }, (_, i) => i / 2)
  const start = (which: 'front' | 'spot') => (event: ReactPointerEvent<SVGGElement>) => {
    dragging.current = which
    const svg = event.currentTarget.ownerSVGElement
    svg?.setPointerCapture?.(event.pointerId)
    event.preventDefault()
  }
  return (
    <g data-testid="ruler">
      <line x1={RULER_X} x2={RULER_X} y1={PLATE_BASELINE_Y} y2={cmToY(PLATE_SOLVENT_CM)} stroke="var(--fg-muted)" strokeWidth={1.2} />
      {ticks.map((cm) => (
        <g key={cm}>
          <line x1={RULER_X} x2={RULER_X + (Number.isInteger(cm) ? 8 : 4)} y1={cmToY(cm)} y2={cmToY(cm)} stroke="var(--fg-muted)" strokeWidth={1} />
          {Number.isInteger(cm) && (
            <text x={RULER_X + 12} y={cmToY(cm)} dominantBaseline="central" fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              {`${cm} cm`}
            </text>
          )}
        </g>
      ))}

      <line x1={LANE_LEFT} x2={RULER_X} y1={frontY} y2={frontY} stroke="var(--accent)" strokeWidth={1.4} strokeDasharray="5 3" />
      <line x1={LANE_LEFT} x2={RULER_X} y1={spotY} y2={spotY} stroke={spotColor} strokeWidth={1.4} strokeDasharray="2 3" />

      <g
        role="slider"
        tabIndex={0}
        aria-label="Solvent front marker"
        aria-valuemin={0}
        aria-valuemax={PLATE_SOLVENT_CM}
        aria-valuenow={Number(frontCm.toFixed(2))}
        aria-valuetext={`${frontCm.toFixed(1)} cm`}
        onPointerDown={start('front')}
        onKeyDown={keyNudge('front')}
        style={{ cursor: 'ns-resize' }}
        data-testid="front-marker"
      >
        <circle cx={RULER_X} cy={frontY} r={7} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} />
      </g>
      <g
        role="slider"
        tabIndex={0}
        aria-label={`Spot ${spotLabel} marker`}
        aria-valuemin={0}
        aria-valuemax={PLATE_SOLVENT_CM}
        aria-valuenow={Number(spotCm.toFixed(2))}
        aria-valuetext={`${spotCm.toFixed(1)} cm`}
        onPointerDown={start('spot')}
        onKeyDown={keyNudge('spot')}
        style={{ cursor: 'ns-resize' }}
        data-testid="spot-marker"
      >
        <circle cx={RULER_X - 16} cy={spotY} r={7} fill={spotColor} stroke="var(--surface)" strokeWidth={1.5} />
      </g>
    </g>
  )
}
