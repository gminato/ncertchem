'use client'

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Segmented, Slider } from '@/components/controls'
import { PlotCurve, PlotFrame, PlotLine, PlotPoint, usePlotScale, type PlotTone } from '@/components/vocab'
import { formatSci, formatSig } from '@/lib/chem/kinetics'
import {
  RATE_SLOPE_MIN_SPAN,
  RATE_SLOPE_STOICH,
  RATE_SLOPE_T_MAX,
  chordReadout,
  clampChord,
  concA,
  concB,
  stoichiometryById,
  tangentReadout,
  type RateSlopeStoichiometry,
} from '@/lib/chem/rate-slope'
import styles from './rate-slope-explorer.module.css'

type StoichId = RateSlopeStoichiometry['id']
type Handle = 'start' | 'end' | 'tangent'

/** Plot frame inside the SVG viewBox (viewBox units). Time runs 0 to RATE_SLOPE_T_MAX; [A] runs 0 to C_MAX. */
const VIEW = { w: 560, h: 340 }
const FRAME = { x: 70, y: 16, width: 462, height: 252 }
const C_MAX = 0.1
const STOICH_OPTIONS = RATE_SLOPE_STOICH.map((s) => ({ value: s.id, label: s.label }))

function px(t: number): number {
  return FRAME.x + (t / RATE_SLOPE_T_MAX) * FRAME.width
}

function py(c: number): number {
  return FRAME.y + FRAME.height * (1 - c / C_MAX)
}

/**
 * A marker with a 16-unit label. The shared PlotPoint sets its label at 15, so the marker
 * comes from PlotPoint and the label is drawn here, at the same offsets, with the frame halo.
 */
function LabelledPoint({ at, tone, label, side }: { at: { x: number; y: number }; tone: PlotTone; label: string; side: 'ne' | 'sw' }) {
  const s = usePlotScale()
  const off = 14
  const dx = side === 'ne' ? off : -off
  const dy = side === 'ne' ? -off + 2 : off + 10
  return (
    <>
      <PlotPoint at={at} tone={tone} />
      <text
        x={s.x(at.x) + dx}
        y={s.y(at.y) + dy}
        textAnchor={side === 'ne' ? 'start' : 'end'}
        fontSize={16}
        fill="var(--fg)"
        stroke="var(--surface)"
        strokeWidth={4}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {label}
      </text>
    </>
  )
}

function tex(source: string): string {
  return katex.renderToString(source, { throwOnError: false, displayMode: false })
}

/** A rate in mol L⁻¹ s⁻¹, three significant figures, U+2212 for the minus sign. */
function rateText(x: number): string {
  return `${formatSci(x, 3)} mol L⁻¹ s⁻¹`
}

export function RateSlopeExplorer() {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef<Handle | null>(null)

  const [stoichId, setStoichId] = useState<StoichId>('A-B')
  const [[t1, t2], setChord] = useState<[number, number]>([0, 500])
  const [tt, setTt] = useState(250)

  const s = stoichiometryById(stoichId)
  const chord = chordReadout(s, t1, t2)
  const tan = tangentReadout(s, tt)
  const chordStartY = concA(t1)
  const chordEndY = concA(t2)

  /** Time under a pointer, in whole seconds, from the SVG's own coordinate system. */
  function timeAt(e: ReactPointerEvent<SVGElement>): number {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (svg === null || svg === undefined || !ctm) return 0
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return Math.round(((p.x - FRAME.x) / FRAME.width) * RATE_SLOPE_T_MAX)
  }

  function moveHandle(h: Handle, t: number) {
    if (h === 'start') setChord(clampChord(t, t2))
    else if (h === 'end') setChord(clampChord(t1, t))
    else setTt(Math.min(Math.max(t, 0), RATE_SLOPE_T_MAX))
  }

  function startDrag(h: Handle, e: ReactPointerEvent<SVGElement>) {
    dragging.current = h
    svgRef.current?.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const h = dragging.current
    if (h !== null) moveHandle(h, timeAt(e))
  }

  function endDrag() {
    dragging.current = null
  }

  const summary =
    `Chord from ${t1} s to ${t2} s: average rate of reaction ${rateText(chord.rate)}. ` +
    `Tangent at ${tt} s: instantaneous rate of reaction ${rateText(tan.rate)}.`

  return (
    <div className={styles.root} data-rate-slope>
      <div className={styles.equation} dangerouslySetInnerHTML={{ __html: tex(`\\ce{${s.ce}}`) }} />

      <div className={styles.stage}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label="Concentration of A falling and of B rising with time, with a chord for the average rate and a tangent for the instantaneous rate"
          className={styles.svg}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <PlotFrame
            x={FRAME.x}
            y={FRAME.y}
            width={FRAME.width}
            height={FRAME.height}
            domain={{ xMin: 0, xMax: RATE_SLOPE_T_MAX, yMin: 0, yMax: C_MAX }}
            xTicks={[0, 100, 200, 300, 400, 500, 600]}
            yTicks={[0, 0.02, 0.04, 0.06, 0.08, 0.1]}
            yTickFormat={(v) => v.toFixed(2)}
            xTitle="t / s"
            yTitle={<>[A] / mol L⁻¹</>}
          >
            <PlotCurve fn={concA} from={0} to={RATE_SLOPE_T_MAX} samples={180} tone="reactant" />
            <PlotCurve fn={(t) => concB(s, t)} from={0} to={RATE_SLOPE_T_MAX} samples={180} tone="product" />
            <PlotLine from={{ x: t1, y: chordStartY }} to={{ x: t2, y: chordEndY }} tone="accent" width={2.4} />
            <PlotLine through={{ x: tt, y: tan.cA }} slope={tan.slopeA} tone="neutral" dashed />
            <LabelledPoint at={{ x: t1, y: chordStartY }} tone="accent" label="t₁" side="ne" />
            <LabelledPoint at={{ x: t2, y: chordEndY }} tone="accent" label="t₂" side="ne" />
            <LabelledPoint at={{ x: tt, y: tan.cA }} tone="product" label="t" side="sw" />
          </PlotFrame>

          {/* Drag handles sit over the markers: wide, transparent targets on the same points. */}
          <g>
            <circle
              className={styles.handle}
              cx={px(t1)}
              cy={py(chordStartY)}
              r={16}
              onPointerDown={(e) => startDrag('start', e)}
            />
            <circle
              className={styles.handle}
              cx={px(t2)}
              cy={py(chordEndY)}
              r={16}
              onPointerDown={(e) => startDrag('end', e)}
            />
            <circle
              className={styles.handle}
              cx={px(tt)}
              cy={py(tan.cA)}
              r={16}
              onPointerDown={(e) => startDrag('tangent', e)}
            />
          </g>
        </svg>
      </div>

      <div className={styles.legend} aria-hidden="true">
        <span>
          <i className={styles.swatchReactant} /> [A] (reactant)
        </span>
        <span>
          <i className={styles.swatchProduct} /> [B] (product)
        </span>
      </div>

      <div className={styles.controls}>
        <Segmented<StoichId>
          label="Stoichiometry"
          options={STOICH_OPTIONS}
          value={stoichId}
          onChange={(v) => setStoichId(v)}
        />
        <Slider
          label="Chord start, t₁"
          value={t1}
          min={0}
          max={RATE_SLOPE_T_MAX - RATE_SLOPE_MIN_SPAN}
          step={1}
          unit="s"
          onChange={(v) => setChord(clampChord(v, t2))}
        />
        <Slider
          label="Chord end, t₂"
          value={t2}
          min={RATE_SLOPE_MIN_SPAN}
          max={RATE_SLOPE_T_MAX}
          step={1}
          unit="s"
          onChange={(v) => setChord(clampChord(t1, v))}
        />
        <Slider
          label="Tangent time, t"
          value={tt}
          min={0}
          max={RATE_SLOPE_T_MAX}
          step={1}
          unit="s"
          onChange={(v) => setTt(v)}
        />
      </div>

      <div className={styles.readouts}>
        <section className={styles.card} aria-label="Average rate over the chord">
          <h3 className={styles.cardHeading}>
            Average rate, {t1} s to {t2} s
          </h3>
          <dl className={styles.rows}>
            <div>
              <dt>Disappearance of <span className="sym">A</span></dt>
              <dd>{rateText(chord.disappearanceA)}</dd>
            </div>
            <div>
              <dt>Rate of reaction</dt>
              <dd>{rateText(chord.rate)}</dd>
            </div>
            <div>
              <dt>Appearance of <span className="sym">B</span></dt>
              <dd>{rateText(chord.appearanceB)}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.card} aria-label="Instantaneous rate at the tangent">
          <h3 className={styles.cardHeading}>
            Instantaneous rate at {tt} s
          </h3>
          <dl className={styles.rows}>
            <div>
              <dt>Concentration <span className="sym">[A]</span></dt>
              <dd>{formatSig(tan.cA, 3)} mol L⁻¹</dd>
            </div>
            <div>
              <dt>Slope of the tangent, <span className="sym">d[A]/dt</span></dt>
              <dd>{`−${formatSci(-tan.slopeA, 3)} mol L⁻¹ s⁻¹`}</dd>
            </div>
            <div>
              <dt>Rate of reaction</dt>
              <dd>{rateText(tan.rate)}</dd>
            </div>
            <div>
              <dt>Appearance of <span className="sym">B</span></dt>
              <dd>{rateText(tan.appearanceB)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
