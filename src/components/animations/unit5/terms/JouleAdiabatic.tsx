'use client'

import { SystemBoundary } from '@/components/thermo/SystemBoundary'
import { Label } from '@/components/vocab'
import { Thermometer } from '@/components/vocab/Thermometer'
import { clampIndex, useTweenedSnapshot } from './useTweenedSnapshot'
import { JOULE_STEP_COUNT, formatSignedJoule, jouleLedgerForStep, jouleSnapshotForStep } from './joule-steps'
import styles from './terms.module.css'

export interface JouleAdiabaticProps {
  step: number
  reducedMotion: boolean
}

// Viewbox for the ~570 px Scrolly panel. Two insulated thermoses sit side by side; every label is
// 14 units or larger.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 340
const LEFT_CX = 140
const RIGHT_CX = 420
const CY = 150
const FLASK = { width: 130, height: 150, margin: 20 }
const TOP = CY - FLASK.height / 2
const BOTTOM = CY + FLASK.height / 2
const SHAFT_DX = -26
const THERMO_DX = 34
const BULB_Y = 205
const STEM = 115
const ROD_TOP_Y = TOP - 14
const ROD_TRAVEL = 120

/** A paddle wheel of two blades crossed at the shaft, rotated by `spin` radians. */
function Paddle({ spin }: { spin: number }) {
  const deg = (spin * 180) / Math.PI
  return (
    <g transform={`rotate(${deg})`}>
      <rect x={-22} y={-3} width={44} height={6} rx={2} style={{ fill: 'var(--fg-muted)' }} />
      <rect x={-3} y={-22} width={6} height={44} rx={2} style={{ fill: 'var(--fg-muted)' }} />
    </g>
  )
}

/**
 * A work arrow above a shaft. `down` true points into the water; false points away from it. The
 * arrow is faded by `strength`, so a Step that has no work draws nothing.
 */
function WorkArrow({ x, down, strength }: { x: number; down: boolean; strength: number }) {
  if (strength === 0) return null
  const far = 30
  const near = 58
  const tip = down ? near : far
  const tail = down ? far : near
  const baseY = down ? tip - 8 : tip + 8
  return (
    <g opacity={Math.min(1, Math.abs(strength))}>
      <line x1={x} y1={tail} x2={x} y2={baseY} strokeWidth={3} style={{ stroke: 'var(--work)' }} />
      <polygon points={`${x},${tip} ${x - 5},${baseY} ${x + 5},${baseY}`} style={{ fill: 'var(--work)' }} />
    </g>
  )
}

/**
 * JouleAdiabatic: Joule's two experiments from Section 5.1.4(a). A paddle churns the water in one
 * insulated thermos, and an immersion rod (electrical work) heats the water in another. Each takes
 * in the same work, and the thermometers agree, so ΔU depends only on the two states.
 */
export function JouleAdiabatic({ step, reducedMotion }: JouleAdiabaticProps) {
  const index = clampIndex(step, JOULE_STEP_COUNT)
  const view = useTweenedSnapshot(jouleSnapshotForStep(index), reducedMotion)
  const ledger = jouleLedgerForStep(index)
  const motion = reducedMotion ? undefined : styles.enter

  const leftShaftX = LEFT_CX + SHAFT_DX
  const rightShaftX = RIGHT_CX + SHAFT_DX
  const rodBottomY = TOP + 10 + view.rodDepth * ROD_TRAVEL

  const thermoside = (cx: number, level: number) => (
    <Thermometer x={cx + THERMO_DX} y={BULB_Y} level={level} height={STEM} bulbRadius={9} stemWidth={9} />
  )

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label={`Joule's experiments. Left: a paddle churns water in an insulated thermos. Right: an immersion rod heats water in another. Both thermometers end at the same reading. Step ${index + 1} of ${JOULE_STEP_COUNT}.`}
      data-testid="thermo-joule"
      data-step={index}
    >
      <g key={`left-${index}`} className={motion}>
        <SystemBoundary kind="isolated" x={LEFT_CX} y={CY} width={FLASK.width} height={FLASK.height} margin={FLASK.margin} />
        <rect
          x={LEFT_CX - FLASK.width / 2}
          y={TOP}
          width={FLASK.width}
          height={FLASK.height}
          style={{ fill: 'var(--liquid)' }}
        />
        <line x1={leftShaftX} y1={TOP} x2={leftShaftX} y2={CY} strokeWidth={2.5} style={{ stroke: 'var(--fg-muted)' }} />
        <g transform={`translate(${leftShaftX}, ${CY})`}>
          <Paddle spin={view.spin} />
        </g>
        <WorkArrow x={leftShaftX} down={ledger.leftWJ >= 0} strength={view.leftArrow} />
        {thermoside(LEFT_CX, view.leftLevel)}
        <Label x={LEFT_CX + THERMO_DX} y={TOP + 16} fontSize={14} fill="var(--fg)">
          <tspan className="sym">T</tspan>
        </Label>
        <Label x={LEFT_CX} y={BOTTOM + 36} fontSize={14} fill="var(--fg)">
          paddle
        </Label>
      </g>

      <g key={`right-${index}`} className={motion}>
        <SystemBoundary kind="isolated" x={RIGHT_CX} y={CY} width={FLASK.width} height={FLASK.height} margin={FLASK.margin} />
        <rect
          x={RIGHT_CX - FLASK.width / 2}
          y={TOP}
          width={FLASK.width}
          height={FLASK.height}
          style={{ fill: 'var(--liquid)' }}
        />
        {view.rodDepth > 0.01 && (
          <g>
            <line x1={rightShaftX} y1={ROD_TOP_Y} x2={rightShaftX} y2={rodBottomY - 12} strokeWidth={3} style={{ stroke: 'var(--fg-muted)' }} />
            <rect x={rightShaftX - 5} y={rodBottomY - 12} width={10} height={12} rx={2} style={{ fill: 'var(--work)' }} />
          </g>
        )}
        <WorkArrow x={rightShaftX} down strength={view.rightArrow} />
        {thermoside(RIGHT_CX, view.rightLevel)}
        <Label x={RIGHT_CX + THERMO_DX} y={TOP + 16} fontSize={14} fill="var(--fg)">
          <tspan className="sym">T</tspan>
        </Label>
        <Label x={RIGHT_CX} y={BOTTOM + 36} fontSize={14} fill="var(--fg)">
          electrical rod
        </Label>
      </g>

      <Label x={LEFT_CX} y={282} fontSize={15} fill="var(--work)">
        <tspan className="sym">w</tspan> = {formatSignedJoule(ledger.leftWJ)}
      </Label>
      <Label x={RIGHT_CX} y={282} fontSize={15} fill="var(--work)">
        <tspan className="sym">w</tspan> = {formatSignedJoule(ledger.rightWJ)}
      </Label>

      <Label x={VIEW_WIDTH / 2} y={318} fontSize={15} fill="var(--fg)">
        {index === 0 && <>Both start in the same state A</>}
        {index === 1 && (
          <>
            Paddle: <tspan className="sym">ΔU</tspan> = {formatSignedJoule(ledger.leftDeltaUJ)}
          </>
        )}
        {index === 2 && <>Rod: the same work gives the same rise</>}
        {index === 3 && (
          <>
            Both end in state B: <tspan className="sym">ΔU</tspan> = {formatSignedJoule(ledger.leftDeltaUJ)}
          </>
        )}
        {index === 4 && (
          <>
            Paddle reversed: <tspan className="sym">ΔU</tspan> = {formatSignedJoule(ledger.leftDeltaUJ)}
          </>
        )}
      </Label>
    </svg>
  )
}
