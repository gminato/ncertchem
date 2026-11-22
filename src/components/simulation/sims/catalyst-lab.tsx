'use client'

import { useRef, useState } from 'react'
import { Slider, Toggle } from '@/components/controls'
import { PlotCurve, PlotFrame, PlotLine, usePlotScale } from '@/components/vocab'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  catalysedKnots,
  catalystLab,
  cosinePath,
  equilibriumUnchanged,
  uncatalysedKnots,
  type CatalystLabInput,
  type CatalystLabResult,
} from '@/lib/chem/catalyst-lab'
import { formatSci, formatSig } from '@/lib/chem/kinetics'
import styles from './catalyst-lab.module.css'

const VIEW_W = 640
const VIEW_H = 380
const FRAME = { x: 84, y: 22, width: 530, height: 300 }
const DOMAIN = { xMin: 0, xMax: 1, yMin: -60, yMax: 140 }
const Y_TICKS = [-40, 0, 40, 80, 120]
const CATALYSED_ARROW_X = 0.25
const UNCATALYSED_ARROW_X = 0.5

const DEFAULTS = { eaUncatKJ: 60, loweringKJ: 10, dHKJ: -20, tempK: 298 }

function kJ(x: number): string {
  return `${formatSig(x, 3)} kJ mol⁻¹`
}

/** A vertical double-headed arrow between two pixel heights. */
function VArrow({ x, y1, y2, tone }: { x: number; y1: number; y2: number; tone: string }) {
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  const h = 6
  return (
    <g stroke={tone} fill={tone} strokeWidth={2.2}>
      <line x1={x} x2={x} y1={top + h} y2={bottom - h} />
      <path d={`M${x - h} ${top + h * 1.6} L${x} ${top} L${x + h} ${top + h * 1.6} Z`} stroke="none" />
      <path d={`M${x - h} ${bottom - h * 1.6} L${x} ${bottom} L${x + h} ${bottom - h * 1.6} Z`} stroke="none" />
    </g>
  )
}

interface OverlayProps {
  r: CatalystLabResult
  input: CatalystLabInput
  catalysed: boolean
}

/** Arrows and labels, drawn in data coordinates through the plot scale. */
function Overlay({ r, input, catalysed }: OverlayProps) {
  const s = usePlotScale()
  const catTone = 'var(--kin-catalyst)'
  const uncatTone = 'var(--kin-reactant)'
  const productsE = input.dHKJ
  const catPeak = r.eaFwdCatKJ
  const uncatPeak = input.eaUncatKJ
  return (
    <g>
      <text x={s.x(DOMAIN.xMin + 0.02)} y={s.y(0) + 20} fontSize={15} fill="var(--fg-muted)">
        reactants 0
      </text>
      <text x={s.x(0.98)} y={s.y(productsE) + 20} fontSize={15} fill="var(--fg-muted)" textAnchor="end">
        products {formatSig(productsE, 3)}
      </text>
      <VArrow x={s.x(UNCATALYSED_ARROW_X) + 10} y1={s.y(0)} y2={s.y(uncatPeak)} tone={uncatTone} />
      <text x={s.x(UNCATALYSED_ARROW_X) + 18} y={s.y(uncatPeak) - 10} fontSize={15} fill={uncatTone} className={styles.label}>
        Eₐ {formatSig(uncatPeak, 3)}
      </text>
      {catalysed && (
        <>
          <VArrow x={s.x(CATALYSED_ARROW_X) - 10} y1={s.y(0)} y2={s.y(catPeak)} tone={catTone} />
          <text x={s.x(CATALYSED_ARROW_X) - 18} y={s.y(catPeak) - 10} fontSize={15} fill={catTone} textAnchor="end" className={styles.label}>
            Eₐ {formatSig(catPeak, 3)}
          </text>
        </>
      )}
    </g>
  )
}

export function CatalystLab(_props: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  useIsActive(rootRef)

  const [eaUncatKJ, setEaUncat] = useState(DEFAULTS.eaUncatKJ)
  const [loweringKJ, setLowering] = useState(DEFAULTS.loweringKJ)
  const [dHKJ, setDH] = useState(DEFAULTS.dHKJ)
  const [tempK, setTemp] = useState(DEFAULTS.tempK)
  const [catalysed, setCatalysed] = useState(true)

  const input: CatalystLabInput = { eaUncatKJ, loweringKJ, dHKJ, tempK }
  const r = catalystLab(input)
  const unchanged = equilibriumUnchanged(r)

  const uncatPath = cosinePath(uncatalysedKnots(input))
  const catPath = cosinePath(catalysedKnots(input))

  // With the catalyst off, the readouts show the uncatalysed route (enhancement exactly 1).
  const eaFwd = catalysed ? r.eaFwdCatKJ : eaUncatKJ
  const eaBack = catalysed ? r.eaBackCatKJ : r.eaBackUncatKJ
  const enhancement = catalysed ? r.enhancementForward : 1
  const enhancementBack = catalysed ? r.enhancementBackward : 1

  const summary = catalysed
    ? `At ${tempK} K, with the catalyst, Eₐ falls from ${kJ(eaUncatKJ)} to ${kJ(eaFwd)}. Forward and backward rates both rise by a factor of ${formatSig(enhancement, 3)}. ΔrH stays ${kJ(dHKJ)}. K is ${formatSci(r.kEqCat, 3)} with the catalyst and ${formatSci(r.kEqUncat, 3)} without it${unchanged ? ', so K is unchanged.' : '.'}`
    : `At ${tempK} K, catalyst off: Eₐ is ${kJ(eaUncatKJ)} and the rate factor is 1. K is ${formatSci(r.kEqUncat, 3)}.`

  return (
    <div className={styles.sim} ref={rootRef} data-testid="catalyst-lab">
      <div className={styles.controls}>
        <Toggle label="Catalyst on" checked={catalysed} onChange={setCatalysed} />
        <div className={styles.sliderGrid}>
          <Slider label="Uncatalysed Eₐ" value={eaUncatKJ} min={60} max={120} step={1} unit="kJ mol⁻¹" format={(v) => v.toFixed(0)} onChange={setEaUncat} />
          <Slider label="Catalyst lowers Eₐ by" value={loweringKJ} min={0} max={20} step={1} unit="kJ mol⁻¹" format={(v) => v.toFixed(0)} onChange={setLowering} />
          <Slider label="ΔrH" value={dHKJ} min={-40} max={30} step={1} unit="kJ mol⁻¹" format={(v) => v.toFixed(0)} onChange={setDH} />
          <Slider label="Temperature T" value={tempK} min={250} max={400} step={1} unit="K" format={(v) => v.toFixed(0)} onChange={setTemp} />
        </div>
      </div>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label="Energy profile: the uncatalysed hump, and the catalysed two-hump route between the same end levels">
          <PlotFrame
            x={FRAME.x}
            y={FRAME.y}
            width={FRAME.width}
            height={FRAME.height}
            domain={DOMAIN}
            xTicks={[]}
            yTicks={Y_TICKS}
            xTitle="reaction coordinate"
            yTitle="Energy / kJ mol⁻¹"
          >
            <PlotLine from={{ x: 0, y: 0 }} to={{ x: 1, y: 0 }} tone="neutral" dashed width={1.4} />
            <PlotLine from={{ x: 0, y: dHKJ }} to={{ x: 1, y: dHKJ }} tone="neutral" dashed width={1.4} />
            <PlotCurve points={uncatPath} tone="reactant" width={3} />
            {catalysed && <PlotCurve points={catPath} tone="catalyst" width={3} />}
            <Overlay r={r} input={input} catalysed={catalysed} />
          </PlotFrame>
        </svg>
      </div>

      <dl className={styles.readout}>
        <div className={styles.row}>
          <dt>Eₐ forward</dt>
          <dd>{kJ(eaFwd)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Eₐ backward</dt>
          <dd>{kJ(eaBack)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Rate factor, forward and backward</dt>
          <dd>×{formatSig(enhancement, 3)} and ×{formatSig(enhancementBack, 3)}</dd>
        </div>
        <div className={styles.row}>
          <dt>ΔrH</dt>
          <dd>{kJ(dHKJ)} (unchanged)</dd>
        </div>
        <div className={styles.row}>
          <dt>K = k_f / k_b, without catalyst</dt>
          <dd>{formatSci(r.kEqUncat, 3)}</dd>
        </div>
        <div className={styles.row}>
          <dt>K = k_f / k_b, with catalyst</dt>
          <dd>
            {formatSci(r.kEqCat, 3)} {unchanged ? '(K unchanged)' : '(K changed)'}
          </dd>
        </div>
      </dl>

      <p className={styles.live} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
