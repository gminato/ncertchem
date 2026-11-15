'use client'

import { SystemBoundary } from '@/components/thermo/SystemBoundary'
import { PistonCylinder } from '@/components/thermo/PistonCylinder'
import { Label } from '@/components/vocab'
import { Thermometer } from '@/components/vocab/Thermometer'
import { clampIndex, useTweenedSnapshot } from './useTweenedSnapshot'
import { JOULE_STEP_COUNT, formatSignedJoule, jouleLedgerForStep, jouleSnapshotForStep } from './joule-steps'
import styles from './terms.module.css'

export interface JouleAdiabaticProps {
  step: number
  reducedMotion: boolean
}

// Viewbox for the ~570 px Scrolly panel. The two insulated vessels together span about 70% of the
// width; every label is 14 units or larger.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 340
const LEFT_CX = 175
const RIGHT_CX = 385
const CY = 145
const FLASK = { width: 150, height: 170, margin: 16 }
const HALF_W = FLASK.width / 2
const HALF_H = FLASK.height / 2
const TOP = CY - HALF_H
const BOTTOM = CY + HALF_H
const SHAFT_DX = -26
const THERMO_DX = 34
const BULB_Y = BOTTOM - 20
const STEM = 130
const ROD_TOP_Y = TOP - 14
const ROD_TRAVEL = 120
const PISTON = { width: 130, height: 160, bottom: BOTTOM - 10 }
/** Work arrow geometry above a shaft: the tip of the far end and the near end, in SVG units. */
const ARROW_FAR = 18
const ARROW_NEAR = 40

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
 * A work arrow above a shaft or a piston. `down` true points into the vessel; false points away
 * from it. The arrow is faded by `strength`, so a Step that has no work draws nothing.
 */
function WorkArrow({ x, down, strength }: { x: number; down: boolean; strength: number }) {
  if (strength === 0) return null
  const tip = down ? ARROW_NEAR : ARROW_FAR
  const tail = down ? ARROW_FAR : ARROW_NEAR
  const baseY = down ? tip - 8 : tip + 8
  return (
    <g opacity={Math.min(1, Math.abs(strength))}>
      <line x1={x} y1={tail} x2={x} y2={baseY} strokeWidth={3} style={{ stroke: 'var(--work)' }} />
      <polygon points={`${x},${tip} ${x - 5},${baseY} ${x + 5},${baseY}`} style={{ fill: 'var(--work)' }} />
    </g>
  )
}

/** Gas temperature used for the tint at Step 4: the thermometer level mapped onto 330 K to 480 K. */
function gasTemperature(level: number): number {
  return 330 + ((level - 0.3) / 0.26) * 150
}

/**
 * JouleAdiabatic: Joule's experiments from Section 5.1.4(a). A paddle churns the water in one
 * insulated vessel, and an immersion rod (electrical work) heats the water in another. Each takes in
 * the same work, and the thermometers agree, so ΔU depends only on the two states. At Step 4 the left
 * vessel becomes an insulated gas that expands against a piston, doing work on its surroundings.
 */
export function JouleAdiabatic({ step, reducedMotion }: JouleAdiabaticProps) {
  const index = clampIndex(step, JOULE_STEP_COUNT)
  const view = useTweenedSnapshot(jouleSnapshotForStep(index), reducedMotion)
  const ledger = jouleLedgerForStep(index)
  const motion = reducedMotion ? undefined : styles.enter
  const expanding = index === 4

  const leftShaftX = LEFT_CX + SHAFT_DX
  const rightShaftX = RIGHT_CX + SHAFT_DX
  const rodBottomY = TOP + 10 + view.rodDepth * ROD_TRAVEL

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label={
        expanding
          ? `Joule's experiments, last Step. An insulated gas in a cylinder expands and pushes its piston out, doing 750 joules of work on its surroundings. Its thermometer falls back to state A. Step ${index + 1} of ${JOULE_STEP_COUNT}.`
          : `Joule's experiments. Left: a paddle churns water in an insulated vessel. Right: an immersion rod heats water in another. Both thermometers end at the same reading. Step ${index + 1} of ${JOULE_STEP_COUNT}.`
      }
      data-testid="thermo-joule"
      data-step={index}
    >
      {expanding ? (
        <g key="left-gas" className={motion}>
          <PistonCylinder
            x={LEFT_CX}
            y={PISTON.bottom}
            width={PISTON.width}
            height={PISTON.height}
            volume={view.pistonPos}
            temperature={gasTemperature(view.leftLevel)}
            insulated
            particles={12}
            seed={9}
          />
          <WorkArrow x={LEFT_CX} down={false} strength={view.leftArrow} />
          <Label x={LEFT_CX} y={BOTTOM + 32} fontSize={14} fill="var(--fg)">
            insulated gas
          </Label>
        </g>
      ) : (
        <g key="left-water" className={motion}>
          <SystemBoundary kind="isolated" x={LEFT_CX} y={CY} width={FLASK.width} height={FLASK.height} margin={FLASK.margin} />
          <rect x={LEFT_CX - HALF_W} y={TOP} width={FLASK.width} height={FLASK.height} style={{ fill: 'var(--liquid)' }} />
          <line x1={leftShaftX} y1={TOP} x2={leftShaftX} y2={CY} strokeWidth={2.5} style={{ stroke: 'var(--fg-muted)' }} />
          <g transform={`translate(${leftShaftX}, ${CY})`}>
            <Paddle spin={view.spin} />
          </g>
          <WorkArrow x={leftShaftX} down={ledger.leftWJ >= 0} strength={view.leftArrow} />
          <Thermometer x={LEFT_CX + THERMO_DX} y={BULB_Y} level={view.leftLevel} height={STEM} bulbRadius={9} stemWidth={9} />
          <Label x={LEFT_CX + THERMO_DX} y={TOP + 8} fontSize={14} fill="var(--fg)">
            <tspan className="sym">T</tspan>
          </Label>
          <Label x={LEFT_CX} y={BOTTOM + 32} fontSize={14} fill="var(--fg)">
            paddle
          </Label>
        </g>
      )}

      <g key="right-rod" className={motion}>
        <SystemBoundary kind="isolated" x={RIGHT_CX} y={CY} width={FLASK.width} height={FLASK.height} margin={FLASK.margin} />
        <rect x={RIGHT_CX - HALF_W} y={TOP} width={FLASK.width} height={FLASK.height} style={{ fill: 'var(--liquid)' }} />
        {view.rodDepth > 0.01 && (
          <g>
            <line x1={rightShaftX} y1={ROD_TOP_Y} x2={rightShaftX} y2={rodBottomY - 12} strokeWidth={3} style={{ stroke: 'var(--fg-muted)' }} />
            <rect x={rightShaftX - 5} y={rodBottomY - 12} width={10} height={12} rx={2} style={{ fill: 'var(--work)' }} />
          </g>
        )}
        <WorkArrow x={rightShaftX} down strength={view.rightArrow} />
        <Thermometer x={RIGHT_CX + THERMO_DX} y={BULB_Y} level={view.rightLevel} height={STEM} bulbRadius={9} stemWidth={9} />
        <Label x={RIGHT_CX + THERMO_DX} y={TOP + 8} fontSize={14} fill="var(--fg)">
          <tspan className="sym">T</tspan>
        </Label>
        <Label x={RIGHT_CX} y={BOTTOM + 32} fontSize={14} fill="var(--fg)">
          electrical rod
        </Label>
      </g>

      <Label x={LEFT_CX} y={284} fontSize={15} fill="var(--work)">
        <tspan className="sym">w</tspan> = {formatSignedJoule(ledger.leftWJ)}
      </Label>
      <Label x={RIGHT_CX} y={284} fontSize={15} fill="var(--work)">
        <tspan className="sym">w</tspan> = {formatSignedJoule(ledger.rightWJ)}
      </Label>

      <Label x={VIEW_WIDTH / 2} y={320} fontSize={15} fill="var(--fg)">
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
            Gas expands: <tspan className="sym">ΔU</tspan> = <tspan className="sym">w</tspan>
            <tspan className="sym" dy="4" fontSize={11}>ad</tspan>
            <tspan dy="-4"> = {formatSignedJoule(ledger.leftDeltaUJ)}</tspan>
          </>
        )}
      </Label>
    </svg>
  )
}
