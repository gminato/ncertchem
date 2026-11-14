'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/controls/Button'
import { Segmented } from '@/components/controls/Segmented'
import { SimulationControls } from '../Simulation'
import type { SimulationProps } from '../registry'
import { Label } from '@/components/vocab/Label'
import { countSigFigs } from '@/lib/chem/sigfigs'
import {
  SAMPLE_RANGE,
  analyseReading,
  expectedReading,
  sampleTruth,
  type ReadingAnalysis,
} from '@/lib/chem/reading'
import styles from './sigfig-ruler.module.css'

/**
 * SigFigRuler (Flagship Simulation, Section 1.4). The Learner reads a graduated
 * instrument: a ruler in millimetres or a measuring cylinder in millilitres.
 * The object's end (or the liquid's meniscus) sits at a set position. The
 * Learner types a reading; the sim shows which digits the marks certify, which
 * one is estimated, the significant figures of the typed text, and whether the
 * reading is within half a division of the true position.
 */

type Instrument = 'ruler' | 'cylinder'
type Zoom = '1' | '2' | '4'

interface InstrumentSpec {
  label: string
  unit: string
  /** Full scale of the drawn instrument. */
  full: { min: number; max: number }
  /** Width of one graduation, in the instrument's unit. */
  division: number
  /** Range the sample positions are drawn from. */
  sample: { min: number; max: number }
}

const SPECS: Record<Instrument, InstrumentSpec> = {
  ruler: {
    label: 'Ruler (mm)',
    unit: 'mm',
    full: { min: 0, max: 100 },
    division: 1,
    sample: SAMPLE_RANGE,
  },
  cylinder: {
    label: 'Measuring cylinder (mL)',
    unit: 'mL',
    full: { min: 0, max: 25 },
    division: 1,
    sample: { min: 10, max: 24 },
  },
}

const INSTRUMENT_OPTIONS = [
  { value: 'ruler', label: 'Ruler' },
  { value: 'cylinder', label: 'Cylinder' },
] as const satisfies readonly { value: Instrument; label: string }[]

const ZOOM_OPTIONS = [
  { value: '1', label: '1×' },
  { value: '2', label: '2×' },
  { value: '4', label: '4×' },
] as const satisfies readonly { value: Zoom; label: string }[]

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 300
const RULER = { left: 40, width: 560, top: 196, height: 40 }
const CYLINDER = { left: 250, width: 140, bottom: 286, height: 262 }

/** Visible window of an instrument at a zoom level, centred on the sample. */
function windowFor(truth: number, full: { min: number; max: number }, zoom: number) {
  const span = (full.max - full.min) / zoom
  const lo = Math.min(full.max - span, Math.max(full.min, truth - span / 2))
  return { lo, hi: lo + span, span }
}

/** Spoken summary of the current state, for the live region. */
function summaryText(instrument: Instrument, typed: string, analysis: ReadingAnalysis): string {
  const unit = SPECS[instrument].unit
  switch (analysis.state) {
    case 'empty':
      return `Read the ${instrument} in ${unit} and type your reading.`
    case 'invalid':
      return 'That is not a plain number yet.'
    case 'no-estimate':
      return `You typed ${typed} ${unit}, which has ${analysis.sigFigs} significant figures. Add one estimated digit.`
    case 'too-fine':
      return `You typed ${typed} ${unit}. The marks cannot support a second decimal digit.`
    case 'estimated':
      return `You typed ${typed} ${unit}: ${analysis.sigFigs} significant figures. ${
        analysis.withinHalfDivision
          ? 'It is within half a division of the true position.'
          : 'It is more than half a division from the true position.'
      }`
  }
}

/** The Learner-facing guidance for the current state. */
function guidance(unit: string, analysis: ReadingAnalysis): string {
  switch (analysis.state) {
    case 'empty':
      return 'Record every digit the marks certify, then one estimated digit between the marks.'
    case 'invalid':
      return 'Type a plain number, such as 47.3.'
    case 'no-estimate':
      return 'You have recorded only the marks. Estimate one more digit between the last two marks and write it after the decimal point.'
    case 'too-fine':
      return `The marks are 1 ${unit} apart, so only one digit after the decimal point is an estimate. Drop the extra digits.`
    case 'estimated':
      return analysis.withinHalfDivision
        ? 'This is the right form: all certain digits plus one estimated digit, and it is within half a division.'
        : 'This has the right form, but it is more than half a division from the true position. Look at the marks again.'
  }
}

export function SigFigRuler(_props: SimulationProps) {
  const [instrument, setInstrument] = useState<Instrument>('ruler')
  const [zoom, setZoom] = useState<Zoom>('1')
  const [sampleIndex, setSampleIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [revealed, setRevealed] = useState(false)
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const inputId = useId()
  const messageId = useId()

  const spec = SPECS[instrument]
  const truth = sampleTruth(sampleIndex, spec.sample.min, spec.sample.max)
  const analysis = analyseReading(typed, truth, spec.division)
  const zoomFactor = Number(zoom)
  const view = windowFor(truth, spec.full, zoomFactor)
  const summary = summaryText(instrument, typed, analysis)

  const resetReading = () => {
    setTyped('')
    setRevealed(false)
  }

  const changeInstrument = (next: Instrument) => {
    setInstrument(next)
    resetReading()
  }

  const newSample = () => {
    setSampleIndex((i) => i + 1)
    resetReading()
  }

  // Ruler geometry
  const rulerX = (v: number) => RULER.left + ((v - view.lo) / view.span) * RULER.width
  // Cylinder geometry
  const cylY = (v: number) => CYLINDER.bottom - ((v - view.lo) / view.span) * CYLINDER.height

  const labelStepRuler = view.span <= 60 ? 5 : 10
  const labelStepCylinder = view.span <= 13 ? 1 : 5

  const ticks: number[] = []
  for (let v = Math.ceil(view.lo); v <= Math.floor(view.hi) + 1e-9; v++) ticks.push(v)

  const expected = expectedReading(truth)
  const unit = spec.unit

  return (
    <div className={styles.root} data-testid="sigfig-ruler" data-instrument={instrument} data-state={analysis.state}>
      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Instrument"
            options={INSTRUMENT_OPTIONS}
            value={instrument}
            onChange={changeInstrument}
          />
          <Segmented label="Zoom" options={ZOOM_OPTIONS} value={zoom} onChange={setZoom} />
          <Button variant="secondary" onClick={newSample}>
            New sample
          </Button>
          <Button variant="secondary" onClick={() => setRevealed((r) => !r)} aria-pressed={revealed}>
            {revealed ? 'Hide the reading' : 'Show the reading'}
          </Button>
        </div>
      </SimulationControls>

      <div className={styles.stage}>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label={`${spec.label}, zoom ${zoom} times. ${summary}`}
        >
          <defs>
            <clipPath id={`${clipId}-view`}>
              <rect x={0} y={0} width={VIEW_WIDTH} height={VIEW_HEIGHT} />
            </clipPath>
            <clipPath id={`${clipId}-glass`}>
              <rect x={CYLINDER.left} y={0} width={CYLINDER.width} height={CYLINDER.bottom} />
            </clipPath>
          </defs>

          {instrument === 'ruler' ? (
            <g clipPath={`url(#${clipId}-view)`}>
              {/* Object: a rod that starts at zero and ends at the true position */}
              <rect
                x={rulerX(spec.full.min)}
                y={RULER.top - 58}
                width={Math.max(0, rulerX(truth) - rulerX(spec.full.min))}
                height={48}
                rx={6}
                fill="var(--accent-soft)"
                stroke="var(--accent)"
                strokeWidth={2}
                data-testid="sim-object"
              />
              <line
                x1={rulerX(truth)}
                x2={rulerX(truth)}
                y1={RULER.top - 58}
                y2={RULER.top + RULER.height}
                stroke="var(--accent)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              {/* Ruler body and graduations */}
              <rect
                x={RULER.left}
                y={RULER.top}
                width={RULER.width}
                height={RULER.height}
                rx={4}
                fill="var(--surface-raised)"
                stroke="var(--border)"
                strokeWidth={1.5}
              />
              {ticks.map((v) => {
                const x = rulerX(v)
                const len = v % 10 === 0 ? 20 : v % 5 === 0 ? 14 : 8
                return (
                  <line
                    key={`t${v}`}
                    x1={x}
                    x2={x}
                    y1={RULER.top + RULER.height}
                    y2={RULER.top + RULER.height - len}
                    stroke="var(--fg-subtle)"
                    strokeWidth={1}
                  />
                )
              })}
              {ticks
                .filter((v) => v % labelStepRuler === 0)
                .map((v) => (
                  <Label key={`l${v}`} x={rulerX(v)} y={RULER.top + RULER.height + 22} fontSize={15} fill="var(--fg-muted)">
                    {v}
                  </Label>
                ))}
              <Label x={RULER.left} y={RULER.top - 70} fontSize={15} textAnchor="start" fill="var(--fg-muted)">
                ruler, divisions 1 mm
              </Label>
            </g>
          ) : (
            <g clipPath={`url(#${clipId}-view)`}>
              <g clipPath={`url(#${clipId}-glass)`}>
                <rect
                  x={CYLINDER.left}
                  y={cylY(spec.full.max)}
                  width={CYLINDER.width}
                  height={cylY(spec.full.min) - cylY(spec.full.max)}
                  fill="var(--glass-fill)"
                />
                <rect
                  x={CYLINDER.left}
                  y={cylY(truth)}
                  width={CYLINDER.width}
                  height={Math.max(0, cylY(view.lo) - cylY(truth))}
                  fill="var(--liquid)"
                  data-testid="sim-object"
                />
              </g>
              <line
                x1={CYLINDER.left - 56}
                x2={CYLINDER.left + CYLINDER.width}
                y1={cylY(truth)}
                y2={cylY(truth)}
                stroke="var(--liquid-edge)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <rect
                x={CYLINDER.left}
                y={cylY(spec.full.max)}
                width={CYLINDER.width}
                height={cylY(spec.full.min) - cylY(spec.full.max)}
                fill="none"
                stroke="var(--glass-wall)"
                strokeWidth={2}
              />
              {ticks.map((v) => {
                const y = cylY(v)
                const len = v % 5 === 0 ? 22 : 12
                return (
                  <line
                    key={`t${v}`}
                    x1={CYLINDER.left + CYLINDER.width}
                    x2={CYLINDER.left + CYLINDER.width - len}
                    y1={y}
                    y2={y}
                    stroke="var(--glass-wall)"
                    strokeWidth={1.2}
                  />
                )
              })}
              {ticks
                .filter((v) => v % labelStepCylinder === 0)
                .map((v) => (
                  <Label
                    key={`l${v}`}
                    x={CYLINDER.left + CYLINDER.width + 12}
                    y={cylY(v)}
                    fontSize={15}
                    textAnchor="start"
                    fill="var(--fg-muted)"
                  >
                    {v}
                  </Label>
                ))}
              <Label x={CYLINDER.left} y={CYLINDER.bottom + 24} fontSize={15} fill="var(--fg-muted)">
                cylinder, divisions 1 mL
              </Label>
            </g>
          )}

          <Label x={VIEW_WIDTH - 12} y={24} fontSize={15} textAnchor="end" fill="var(--fg-muted)">
            zoom {zoom}×
          </Label>
        </svg>

        <div className={styles.entry}>
          <label htmlFor={inputId} className={styles.fieldLabel}>
            Your reading ({unit})
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={styles.input}
            value={typed}
            placeholder="e.g. 47.3"
            aria-describedby={messageId}
            onChange={(event) => setTyped(event.target.value)}
          />
          <span className={styles.unitTag}>{unit}</span>
        </div>

        <div className={styles.analysis} aria-live="polite" id={messageId}>
          <p className={styles.heading}>Record all certain digits plus one estimated digit.</p>

          <div className={styles.digitRow} aria-label="Digits in your reading">
            {analysis.state === 'empty' || analysis.state === 'invalid' ? (
              <span className={styles.muted}>No reading yet</span>
            ) : (
              <>
                {analysis.certain !== '' && (
                  <span className={styles.chipCertain} data-testid="digits-certain">
                    {analysis.certain}
                    <small> certain</small>
                  </span>
                )}
                {analysis.estimated !== '' && (
                  <span className={styles.chipEstimated} data-testid="digits-estimated">
                    {analysis.estimated}
                    <small> estimated</small>
                  </span>
                )}
                {analysis.beyond !== '' && (
                  <span className={styles.chipBeyond} data-testid="digits-beyond">
                    {analysis.beyond}
                    <small> beyond the marks</small>
                  </span>
                )}
              </>
            )}
          </div>

          <dl className={styles.facts}>
            <dt>Significant figures</dt>
            <dd data-testid="sig-figs">
              {typed.trim() !== '' && analysis.state !== 'invalid' ? `${countSigFigs(typed.trim())}` : '—'}
            </dd>
            <dt>Within half a division (±0.5 {unit})</dt>
            <dd data-testid="within-half-division">
              {analysis.withinHalfDivision === null ? '—' : analysis.withinHalfDivision ? 'Yes' : 'No'}
            </dd>
          </dl>

          <p className={styles.message} data-testid="guidance">
            {guidance(unit, analysis)}
          </p>

          {revealed && (
            <p className={styles.reveal} data-testid="reveal">
              The object ends at {truth.toFixed(2)} {unit}. Its reading to one estimated digit is{' '}
              <strong>
                {expected} {unit}
              </strong>
              , which has {countSigFigs(expected)} significant figures.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
