'use client'

import { useRef, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  Beaker,
  Electrode,
  HydrogenElectrode,
  SaltBridge,
  VocabDefs,
  Voltmeter,
  Wire,
  meterTerminals,
} from '@/components/vocab'
import {
  LOG_Q_SPAN,
  NERNST_CELLS,
  TEMP_MAX_K,
  TEMP_MIN_K,
  cellPotentialAtLogQ,
  nernstCell,
  readNernst,
  slotConcentration,
  type NernstCell,
  type NernstCellId,
  type NernstReading,
  type NernstTerm,
} from '@/lib/chem/nernst-lab'
import { nernstLog10Slope } from '@/lib/chem/nernst'
import styles from './nernst-lab.module.css'

const CELL_OPTIONS = NERNST_CELLS.map((c) => ({ value: c.id, label: c.label }))

/** Drawing dressing for each cell: anode on the left, cathode on the right. */
const DRESSING = {
  daniell: {
    left: { material: 'zn', tint: 'clear', label: 'Zn²⁺(aq)' },
    right: { material: 'cu', tint: 'blue', label: 'Cu²⁺(aq)' },
    shE: false,
  },
  'cu-ag': {
    left: { material: 'cu', tint: 'blue', label: 'Cu²⁺(aq)' },
    right: { material: 'ag', tint: 'clear', label: 'Ag⁺(aq)' },
    shE: false,
  },
  'zn-she': {
    left: { material: 'zn', tint: 'clear', label: 'Zn²⁺(aq)' },
    right: { material: 'pt', tint: 'clear', label: 'H⁺(aq)' },
    shE: true,
  },
  concentration: {
    left: { material: 'cu', tint: 'blue', label: 'Cu²⁺(aq), anode' },
    right: { material: 'cu', tint: 'blue', label: 'Cu²⁺(aq), cathode' },
    shE: false,
  },
} as const

/** Plot frame in SVG units, and the log Q window it shows. */
const PLOT = { x0: 372, x1: 570, y0: 64, y1: 300 }

const LEFT_BEAKER = { x: 18, y: 150, width: 130, height: 180 }
const RIGHT_BEAKER = { x: 152, y: 150, width: 130, height: 180 }
const LEFT_X = 83
const RIGHT_X = 217
const ELECTRODE_TOP = 176
const ELECTRODE_LENGTH = 126
const METER = { x: 150, y: 76, width: 170, height: 70 }

/** Round a number to 3 decimals and write U+2212 for minus signs. */
function signed(x: number, digits: number): string {
  return x.toFixed(digits).replace('-', '−')
}

/** Three significant figures, as a concentration is shown. */
function conc(c: number): string {
  return c.toPrecision(3)
}

function tex(source: string, display: boolean): string {
  return katex.renderToString(source, { throwOnError: false, displayMode: display })
}

function speciesSymbolic(t: NernstTerm): string {
  return `[\\ce{${t.ce}}]${t.power === 1 ? '' : `^{${t.power}}`}`
}

function speciesValue(t: NernstTerm, c: number): string {
  return t.power === 1 ? conc(c) : `(${conc(c)})^{${t.power}}`
}

/** A number in TeX: fixed point for 0.01 to 1000, otherwise mantissa × 10^exponent. */
function sciTex(x: number): string {
  if (x >= 0.01 && x < 1000) return x.toPrecision(3)
  const [m, e] = x.toExponential(2).split('e')
  return `${m} \\times 10^{${Number(e)}}`
}

function plotX(logQ: number): number {
  return PLOT.x0 + ((logQ + LOG_Q_SPAN) / (2 * LOG_Q_SPAN)) * (PLOT.x1 - PLOT.x0)
}

function yAxis(cell: NernstCell, tempK: number): { lo: number; hi: number; ticks: number[] } {
  const ends = [-LOG_Q_SPAN, LOG_Q_SPAN].map((x) => cellPotentialAtLogQ(cell, x, tempK))
  const lo = Math.floor((Math.min(...ends, cell.e0Cell) - 0.05) / 0.2) * 0.2
  const hi = Math.ceil((Math.max(...ends, cell.e0Cell) + 0.05) / 0.2) * 0.2
  const ticks: number[] = []
  for (let v = Math.round(lo * 10) / 10; v <= hi + 1e-9; v += 0.2) ticks.push(Math.round(v * 10) / 10)
  return { lo, hi, ticks }
}

function plotY(e: number, axis: { lo: number; hi: number }): number {
  return PLOT.y1 - ((e - axis.lo) / (axis.hi - axis.lo)) * (PLOT.y1 - PLOT.y0)
}

function verdict(eCell: number): string {
  if (eCell > 1e-9) return 'Ecell > 0: the reaction goes as written.'
  if (eCell < -1e-9) return 'Ecell < 0: the cell runs in the reverse direction.'
  return 'Ecell = 0: equilibrium, with no net reaction.'
}

function liveSummary(cell: NernstCell, r: NernstReading, tempK: number): string {
  return `${cell.label} at ${tempK} K: Q = ${conc(r.q)}, log Q = ${signed(r.logQ, 2)}, Ecell = ${r.eCell.toFixed(3)} V. ${verdict(r.eCell)}`
}

export function NernstLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const t = useAmbientTime(reducedMotion || !active)

  const [cellId, setCellId] = useState<NernstCellId>('daniell')
  const cell = nernstCell(cellId)
  const [readings, setReadings] = useState<[number, number]>([
    cell.sliders[0].defaultValue,
    cell.sliders[1].defaultValue,
  ])
  const [tempK, setTempK] = useState<number>(298)

  const r = readNernst(cell, readings, tempK)
  const dress = DRESSING[cellId]
  const axis = yAxis(cell, tempK)
  const e0 = cell.e0Cell
  const slope = nernstLog10Slope(cell.n, tempK)

  const products = cell.products.map((term) => ({ term, c: r.concentrations[term.slot] }))
  const reactants = cell.reactants.map((term) => ({ term, c: r.concentrations[term.slot] }))

  const generalEq = tex('E = E^\\circ_{\\text{cell}} - \\frac{RT}{nF}\\ln Q', true)
  const reactionHtml = tex(`\\ce{${cell.reaction}}`, true)
  const notationHtml = tex(`\\ce{${cell.notation}}`, true)
  const qSymbolic = `Q = \\frac{${products.map((p) => speciesSymbolic(p.term)).join(' \\cdot ') || '1'}}{${reactants.map((p) => speciesSymbolic(p.term)).join(' \\cdot ') || '1'}}`
  const qSubstituted = `Q = \\frac{${products.map((p) => speciesValue(p.term, p.c)).join(' \\cdot ') || '1'}}{${reactants.map((p) => speciesValue(p.term, p.c)).join(' \\cdot ') || '1'}}`
  const qValueTex = `Q = ${sciTex(r.q)}`
  const qHtml = tex(qSymbolic, true)
  const qSubHtml = tex(qSubstituted, true)
  const qValueHtml = tex(qValueTex, true)
  const substitutedEq = `E = ${e0.toFixed(3)}\\ \\text{V} - ${slope.toFixed(5)}\\ \\text{V} \\times (${signed(r.logQ, 3)})`
  const resultEq = `E = ${r.eCell.toFixed(3)}\\ \\text{V}`
  const substitutedHtml = tex(substitutedEq, true)
  const resultHtml = tex(resultEq, true)

  const meterValue = r.eCell
  const terminals = meterTerminals(METER.x, METER.y, METER.height)
  const leftLead = [
    { x: terminals.plus.x, y: terminals.plus.y },
    { x: terminals.plus.x, y: ELECTRODE_TOP - 20 },
    { x: LEFT_X, y: ELECTRODE_TOP - 20 },
    { x: LEFT_X, y: ELECTRODE_TOP },
  ]
  const rightLead = [
    { x: terminals.minus.x, y: terminals.minus.y },
    { x: terminals.minus.x, y: ELECTRODE_TOP - 20 },
    { x: RIGHT_X, y: ELECTRODE_TOP - 20 },
    { x: RIGHT_X, y: ELECTRODE_TOP },
  ]

  const markerX = plotX(r.logQ)
  const markerY = plotY(r.eCell, axis)
  const linePts = [-LOG_Q_SPAN, LOG_Q_SPAN].map((x) => ({
    x: plotX(x),
    y: plotY(cellPotentialAtLogQ(cell, x, tempK), axis),
  }))

  const onCellChange = (id: NernstCellId) => {
    const next = nernstCell(id)
    setCellId(id)
    setReadings([next.sliders[0].defaultValue, next.sliders[1].defaultValue])
  }

  return (
    <div className={styles.sim} ref={rootRef}>
      <div className={styles.controls}>
        <Segmented label="Galvanic cell" options={CELL_OPTIONS} value={cellId} onChange={onCellChange} />
        <div className={styles.sliderGrid}>
          {cell.sliders.map((s, i) => (
            <Slider
              key={`${cell.id}-${i}`}
              label={s.label}
              value={readings[i]}
              min={s.min}
              max={s.max}
              step={0.1}
              unit={s.kind === 'pH' ? '' : 'mol L⁻¹'}
              format={(v) => (s.kind === 'pH' ? v.toFixed(1) : conc(slotConcentration(s, v)))}
              onChange={(v) => setReadings((prev) => (i === 0 ? [v, prev[1]] : [prev[0], v]))}
            />
          ))}
          <Slider
            label="Temperature T"
            value={tempK}
            min={TEMP_MIN_K}
            max={TEMP_MAX_K}
            step={1}
            unit="K"
            format={(v) => v.toFixed(0)}
            onChange={setTempK}
          />
        </div>
      </div>

      <div className={styles.stage}>
        <svg viewBox="0 0 600 400" role="img" aria-label={`${cell.label} with its voltmeter and the Nernst plot`}>
          <VocabDefs idPrefix="nernstlab" />

          <Voltmeter
            x={METER.x}
            y={METER.y}
            width={METER.width}
            height={METER.height}
            value={meterValue}
            range={[-0.5, 1.5]}
            unit="V"
            decimals={2}
            caption="Voltmeter"
          />
          <Wire corners={leftLead} />
          <Wire corners={rightLead} />

          <Beaker {...LEFT_BEAKER} level={0.72} tint={dress.left.tint} label={dress.left.label} />
          {dress.shE ? (
            <HydrogenElectrode
              {...RIGHT_BEAKER}
              t={t}
              label={dress.right.label}
              gasLabel="H₂ (1 bar)"
            />
          ) : (
            <Beaker {...RIGHT_BEAKER} level={0.72} tint={dress.right.tint} label={dress.right.label} />
          )}

          <Electrode
            x={LEFT_X}
            top={ELECTRODE_TOP}
            length={ELECTRODE_LENGTH}
            material={dress.left.material}
            polarity="−"
          />
          {!dress.shE && (
            <Electrode
              x={RIGHT_X}
              top={ELECTRODE_TOP}
              length={ELECTRODE_LENGTH}
              material={dress.right.material}
              polarity="+"
            />
          )}

          <SaltBridge
            start={{ x: 112, y: 300 }}
            finish={{ x: 188, y: 300 }}
            apex={158}
            plugs
            t={t}
            ions={!reducedMotion}
            ionCount={3}
            cationsTo="to"
          />

          <g aria-hidden="true">
            <line
              x1={PLOT.x0}
              x2={PLOT.x1}
              y1={PLOT.y1}
              y2={PLOT.y1}
              className={styles.axis}
            />
            <line x1={PLOT.x0} x2={PLOT.x0} y1={PLOT.y0} y2={PLOT.y1} className={styles.axis} />
            {axis.ticks.map((v) => (
              <g key={`y${v}`}>
                <line x1={PLOT.x0 - 4} x2={PLOT.x0} y1={plotY(v, axis)} y2={plotY(v, axis)} className={styles.axis} />
                <text x={PLOT.x0 - 8} y={plotY(v, axis) + 5} textAnchor="end" className={styles.tick}>
                  {signed(v, 1)}
                </text>
              </g>
            ))}
            {[-10, -5, 0, 5, 10].map((x) => (
              <g key={`x${x}`}>
                <line x1={plotX(x)} x2={plotX(x)} y1={PLOT.y1} y2={PLOT.y1 + 4} className={styles.axis} />
                <text x={plotX(x)} y={PLOT.y1 + 22} textAnchor="middle" className={styles.tick}>
                  {signed(x, 0)}
                </text>
              </g>
            ))}
            <line x1={plotX(0)} x2={plotX(0)} y1={PLOT.y0} y2={PLOT.y1} className={styles.guide} />
            {axis.lo < 0 && axis.hi > 0 && (
              <line x1={PLOT.x0} x2={PLOT.x1} y1={plotY(0, axis)} y2={plotY(0, axis)} className={styles.guide} />
            )}
            <line x1={linePts[0].x} y1={linePts[0].y} x2={linePts[1].x} y2={linePts[1].y} className={styles.curve} />
            <circle cx={plotX(0)} cy={plotY(e0, axis)} r={4} className={styles.intercept} />
            <text x={plotX(0) + 8} y={plotY(e0, axis) - 8} className={styles.tickStrong}>
              E°cell
            </text>
            <circle cx={markerX} cy={markerY} r={8} className={styles.marker} />
            <text x={PLOT.x0} y={PLOT.y0 - 14} className={styles.tickStrong}>
              E / V
            </text>
            <text x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y1 + 46} textAnchor="middle" className={styles.tickStrong}>
              log₁₀ Q
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.cellRow}>
          <div className={styles.notation} dangerouslySetInnerHTML={{ __html: notationHtml }} />
          <div className={styles.reaction} dangerouslySetInnerHTML={{ __html: reactionHtml }} />
        </div>

        <div className={styles.equations}>
          <div className={styles.eqBlock}>
            <span className={styles.eqLabel}>Nernst equation</span>
            <div dangerouslySetInnerHTML={{ __html: generalEq }} />
          </div>
          <div className={styles.eqBlock}>
            <span className={styles.eqLabel}>Reaction quotient</span>
            <div dangerouslySetInnerHTML={{ __html: qHtml }} />
            <div dangerouslySetInnerHTML={{ __html: qSubHtml }} />
            <div dangerouslySetInnerHTML={{ __html: qValueHtml }} />
          </div>
          <div className={styles.eqBlock}>
            <span className={styles.eqLabel}>With the numbers</span>
            <div dangerouslySetInnerHTML={{ __html: substitutedHtml }} />
            <div dangerouslySetInnerHTML={{ __html: resultHtml }} />
          </div>
        </div>

        <div className={styles.results}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Ecell</span>
            <span className={styles.statValue}>{r.eCell.toFixed(3)} V</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Q</span>
            <span className={styles.statValue}>{conc(r.q)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>log Q</span>
            <span className={styles.statValue}>{signed(r.logQ, 2)}</span>
          </div>
          <p className={styles.verdictNote}>{verdict(r.eCell)}</p>
        </div>
        <p className={styles.note}>
          Left is the anode (−), right the cathode (+). The salt bridge is KNO₃ in agar. At 298 K the slope is {nernstLog10Slope(1, 298).toFixed(5)}/n V. NCERT rounds it to 0.059/n V.
          Pure solids and the H₂ at 1 bar have unit activity, so they are left out of Q.
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary(cell, r, tempK)}
      </p>
    </div>
  )
}

