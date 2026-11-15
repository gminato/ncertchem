'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { PistonCylinder } from '@/components/thermo/PistonCylinder'
import { SystemBoundary } from '@/components/thermo/SystemBoundary'
import { Label } from '@/components/vocab'
import { useTweenedSnapshot } from '@/components/animations/unit5/terms/useTweenedSnapshot'
import { BAR_PER_ATM } from '@/lib/chem/pv-work'
import {
  LAB_CV_J_PER_K,
  LAB_HEAT_STEP_J,
  LAB_P_EXT_MAX_BAR,
  LAB_P_EXT_MIN_BAR,
  LAB_P_EXT_STEP_BAR,
  LAB_V_MAX_L,
  LAB_V_MIN_L,
  applyHeat,
  gasPressureBar,
  initialLabState,
  ledgerDeltaU,
  movePiston,
  temperatureDeltaU,
  twoPathEnds,
  type LabState,
} from '@/lib/chem/first-law-lab'
import styles from './first-law-lab.module.css'

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 560 × 340)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 560
const VIEW_HEIGHT = 340
/** Inner width and travel of the cylinder, SVG units. The boundary wraps the cylinder exactly. */
const CYL = { width: 200, height: 180, bottom: 262 }
const CYL_CX = 280
const CYL_TOP = CYL.bottom - CYL.height
const CYL_MARGIN = 64
/** Centres for the two cylinders in the two-paths view. */
const PATH_CX = { a: 130, b: 430 }

/** Share of the cylinder's travel the gas fills at a given volume, from 0 (V_min) to 1 (V_max). */
function pistonFraction(volumeL: number): number {
  return Math.min(1, Math.max(0, (volumeL / LAB_V_MAX_L - 0.2) / 0.8))
}

/** Signed value with the U+2212 minus sign, in the given unit. */
function signed(value: number, unit: string, digits = 0): string {
  const rounded = Number(value.toFixed(digits))
  if (rounded === 0) return `0 ${unit}`
  const sign = rounded > 0 ? '+' : '−'
  return `${sign}${Math.abs(rounded).toFixed(digits)} ${unit}`
}

type Mode = 'free' | 'paths'
type Flow = 'heat-in' | 'heat-out' | 'piston-in' | 'piston-out' | null

const MODE_OPTIONS = [
  { value: 'free', label: 'Free play' },
  { value: 'paths', label: 'Two paths' },
] as const

/**
 * FirstLawLab: one mole of gas in a cylinder with a piston. The Learner adds or removes heat at
 * constant volume, lets the piston move against a set external pressure, insulates the walls, or
 * isolates the gas. A live ledger keeps q, w and ΔU = q + w with IUPAC signs, and checks it against
 * C_V ΔT. The two-paths view shows two routes from state A to state B with the same ΔU.
 */
export function FirstLawLab({ reducedMotion }: SimulationProps) {
  const titleId = useId()
  const [mode, setMode] = useState<Mode>('free')
  const [insulated, setInsulated] = useState(false)
  const [isolated, setIsolated] = useState(false)
  const [lab, setLab] = useState<LabState>(() => initialLabState())
  const [pExt, setPExt] = useState(1.5)
  const [flow, setFlow] = useState<Flow>(null)
  const [message, setMessage] = useState('')
  const flowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (flowTimer.current) clearTimeout(flowTimer.current)
    }
  }, [])

  const showFlow = (next: Flow) => {
    if (flowTimer.current) clearTimeout(flowTimer.current)
    setFlow(next)
    flowTimer.current = setTimeout(() => setFlow(null), 1200)
  }

  const heatBlocked = insulated || isolated
  const addHeat = (sign: 1 | -1) => {
    if (heatBlocked) return
    setLab((s) => applyHeat(s, sign * LAB_HEAT_STEP_J))
    showFlow(sign > 0 ? 'heat-in' : 'heat-out')
    setMessage(`${sign > 0 ? 'Heat added' : 'Heat removed'}: q = ${signed(sign * LAB_HEAT_STEP_J, 'J')}. The volume is held, so w = 0.`)
  }

  const releasePiston = () => {
    if (isolated) return
    const result = movePiston(lab, pExt)
    if (!result.ok) {
      setMessage(result.reason)
      return
    }
    setLab(result.state)
    showFlow(result.workJ >= 0 ? 'piston-in' : 'piston-out')
    setMessage(
      `The piston settled at ${pExt.toFixed(1)} bar. Work w = ${signed(result.workJ, 'J')}, and no heat crossed (q = 0).`
    )
  }

  const reset = () => {
    setLab(initialLabState())
    setFlow(null)
    setMessage('Back to the start: 300 K and 1 bar. The ledger is empty.')
  }

  // The cylinder's volume and temperature tween from their live values to the lab's state.
  const drawn = useTweenedSnapshot(
    { volumeL: lab.volumeL, temperatureK: lab.temperatureK },
    reducedMotion,
    0.8
  )

  const q = lab.q
  const w = lab.w
  const dU = ledgerDeltaU(lab)
  const dUT = temperatureDeltaU(lab)
  const pressure = gasPressureBar(lab)
  const routes = twoPathEnds()

  const boundaryKind = isolated ? 'isolated' : 'closed'
  const heatFlow = !heatBlocked && flow === 'heat-in' ? 'in' : !heatBlocked && flow === 'heat-out' ? 'out' : 'none'
  const workFlow = !isolated && flow === 'piston-in' ? 'in' : !isolated && flow === 'piston-out' ? 'out' : 'none'

  const summary =
    mode === 'free'
      ? `Gas at ${lab.temperatureK.toFixed(1)} kelvin and ${pressure.toFixed(2)} bar, volume ${lab.volumeL.toFixed(1)} litres. Since the start: heat q ${signed(q, 'J')}, work w ${signed(w, 'J')}, ΔU ${signed(dU, 'J')}.`
      : `Route 1: q ${signed(routes[0].path.q, 'J')}, w ${signed(routes[0].path.w, 'J')}. Route 2: q ${signed(routes[1].path.q, 'J')}, w ${signed(routes[1].path.w, 'J')}. Both give ΔU ${signed(routes[0].deltaUJ, 'J')}.`

  // Two-paths drawing: state A is the start, state B is where both routes end.
  const startState = initialLabState()

  return (
    <div className={styles.sim} data-testid="first-law-lab" data-mode={mode} data-isolated={isolated ? 'true' : 'false'}>
      <div className={styles.layout}>
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>
            {mode === 'free'
              ? 'A gas in a cylinder with a piston, inside a boundary. Arrows show heat and work crossing the boundary when they happen.'
              : 'Two cylinders, state A and state B, with the same volume. Two arcs show two routes between them.'}
          </title>
          {mode === 'free' ? (
            <g>
              <SystemBoundary
                kind={boundaryKind}
                x={CYL_CX}
                y={CYL.bottom - CYL.height / 2}
                width={CYL.width}
                height={CYL.height}
                margin={CYL_MARGIN}
                heat={heatFlow}
                work={workFlow}
                animated={heatFlow !== 'none' || workFlow !== 'none'}
              />
              <PistonCylinder
                x={CYL_CX}
                y={CYL.bottom}
                width={CYL.width}
                height={CYL.height}
                volume={pistonFraction(drawn.volumeL)}
                temperature={drawn.temperatureK}
                externalPressure={pExt / BAR_PER_ATM}
                particles={14}
                heatSource={heatFlow === 'in' ? 'flame' : 'none'}
                insulated={insulated || isolated}
                seed={7}
              />
              <Label x={CYL_CX} y={CYL.bottom + 46} fontSize={14} fill="var(--fg)">
                <tspan className="sym">p</tspan>
                <tspan className="sym" dy="4" fontSize={11}>ext</tspan>
                <tspan dy="-4"> = {pExt.toFixed(1)} bar</tspan>
              </Label>
              {heatFlow !== 'none' && (
                <Label x={CYL_CX - CYL.width / 2 - CYL_MARGIN - 36} y={CYL_TOP - 10} fontSize={15} fill="var(--heat)">
                  <tspan className="sym">q</tspan> {heatFlow === 'in' ? 'in' : 'out'}
                </Label>
              )}
              {workFlow !== 'none' && (
                <Label x={CYL_CX + CYL.width / 2 + CYL_MARGIN + 36} y={CYL_TOP - 10} fontSize={15} fill="var(--work)">
                  <tspan className="sym">w</tspan> {workFlow === 'in' ? 'in' : 'out'}
                </Label>
              )}
            </g>
          ) : (
            <PathsDrawing
              startK={startState.temperatureK}
              endK={routes[0].endTemperatureK}
              volumeL={startState.volumeL}
            />
          )}
        </svg>

        <div className={styles.ledger} aria-label="Energy ledger">
          {mode === 'free' ? (
            <>
              <LedgerRow label={<><span className="sym">q</span> heat</>} value={signed(q, 'J')} tone="heat" />
              <LedgerRow label={<><span className="sym">w</span> work</>} value={signed(w, 'J')} tone="work" />
              <LedgerRow
                label={<>Δ<span className="sym">U</span> = <span className="sym">q</span> + <span className="sym">w</span></>}
                value={signed(dU, 'J')}
                tone="total"
              />
              <LedgerRow
                label={<>Check: <span className="sym">C</span><sub className={styles.sub}>V</sub> Δ<span className="sym">T</span></>}
                value={signed(dUT, 'J')}
                tone="check"
              />
              <div className={styles.state}>
                <span>
                  <span className="sym">T</span> = {lab.temperatureK.toFixed(1)} K
                </span>
                <span>
                  <span className="sym">p</span> = {pressure.toFixed(2)} bar
                </span>
                <span>
                  <span className="sym">V</span> = {lab.volumeL.toFixed(1)} L
                </span>
              </div>
            </>
          ) : (
            <table className={styles.table}>
              <caption className={styles.caption}>From state A to state B</caption>
              <thead>
                <tr>
                  <th scope="col">Route</th>
                  <th scope="col">Route 1</th>
                  <th scope="col">Route 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row"><span className="sym">q</span></th>
                  <td className={styles.heat}>{signed(routes[0].path.q, 'J')}</td>
                  <td className={styles.heat}>{signed(routes[1].path.q, 'J')}</td>
                </tr>
                <tr>
                  <th scope="row"><span className="sym">w</span></th>
                  <td className={styles.work}>{signed(routes[0].path.w, 'J')}</td>
                  <td className={styles.work}>{signed(routes[1].path.w, 'J')}</td>
                </tr>
                <tr>
                  <th scope="row">Δ<span className="sym">U</span></th>
                  <td className={styles.total}>{signed(routes[0].deltaUJ, 'J')}</td>
                  <td className={styles.total}>{signed(routes[1].deltaUJ, 'J')}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className={styles.message} aria-live="polite">
        {mode === 'free' ? message : ''}
      </p>
      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented<Mode> label="Mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
          {mode === 'free' && (
            <>
              <div className={styles.row}>
                <Toggle
                  label="Insulated walls (adiabatic)"
                  checked={insulated}
                  onChange={setInsulated}
                  disabled={isolated}
                />
                <Toggle label="Isolated: nothing crosses" checked={isolated} onChange={setIsolated} />
              </div>
              <div className={styles.row}>
                <Button variant="secondary" onClick={() => addHeat(1)} disabled={heatBlocked}>
                  Add 200 J of heat
                </Button>
                <Button variant="secondary" onClick={() => addHeat(-1)} disabled={heatBlocked}>
                  Remove 200 J of heat
                </Button>
              </div>
              <div className={styles.row}>
                <Slider
                  label="External pressure, from the weights"
                  value={pExt}
                  min={LAB_P_EXT_MIN_BAR}
                  max={LAB_P_EXT_MAX_BAR}
                  step={LAB_P_EXT_STEP_BAR}
                  unit="bar"
                  onChange={setPExt}
                  disabled={isolated}
                />
                <Button onClick={releasePiston} disabled={isolated}>
                  Let the piston move
                </Button>
                <Button variant="secondary" onClick={reset}>
                  Reset
                </Button>
              </div>
            </>
          )}
          {mode === 'paths' && (
            <p className={styles.note}>
              Both routes start at state A (300 K, 1 bar) and keep the volume fixed. Route 1 has no heat, so its ΔU is all work.
            </p>
          )}
          <p className={styles.note}>
            The piston stays between {LAB_V_MIN_L} and {LAB_V_MAX_L} litres. A piston move is quick, so no heat crosses during it.
            For this gas <span className="sym">C</span><sub className={styles.sub}>V</sub> = {LAB_CV_J_PER_K.toFixed(2)} J K⁻¹, so the
            temperature changes by (<span className="sym">q</span> + <span className="sym">w</span>) / <span className="sym">C</span><sub className={styles.sub}>V</sub>.
          </p>
        </div>
      </SimulationControls>
    </div>
  )
}

function LedgerRow({
  label,
  value,
  tone,
}: {
  label: ReactNode
  value: string
  tone: 'heat' | 'work' | 'total' | 'check'
}) {
  return (
    <div className={`${styles.ledgerRow} ${styles[tone]}`}>
      <span className={styles.ledgerLabel}>{label}</span>
      <span className={styles.ledgerValue}>{value}</span>
    </div>
  )
}

/** The two-paths drawing: state A and state B as two cylinders, with two arcs between them. */
function PathsDrawing({ startK, endK, volumeL }: { startK: number; endK: number; volumeL: number }) {
  const arrowId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const cylTop = CYL.bottom - CYL.height
  const topY = cylTop + 26
  // Route 1 rises from the rim of A over the top to the rim of B. Route 2 dips through the gap.
  const rimA = { x: PATH_CX.a, y: cylTop - 4 }
  const rimB = { x: PATH_CX.b, y: cylTop - 4 }
  const wallA = { x: PATH_CX.a + CYL.width / 2 + 4, y: cylTop + 110 }
  const wallB = { x: PATH_CX.b - CYL.width / 2 - 4, y: cylTop + 110 }
  const midX = (PATH_CX.a + PATH_CX.b) / 2
  return (
    <g>
      <defs>
        <marker id={`arrow1-${arrowId}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--accent)' }} />
        </marker>
        <marker id={`arrow2-${arrowId}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" style={{ fill: 'var(--fg-muted)' }} />
        </marker>
      </defs>
      <PistonCylinder
        x={PATH_CX.a}
        y={CYL.bottom}
        width={CYL.width}
        height={CYL.height}
        volume={pistonFraction(volumeL)}
        temperature={startK}
        seed={7}
      />
      <PistonCylinder
        x={PATH_CX.b}
        y={CYL.bottom}
        width={CYL.width}
        height={CYL.height}
        volume={pistonFraction(volumeL)}
        temperature={endK}
        seed={7}
      />
      <Label x={PATH_CX.a} y={CYL.bottom + 24} fontSize={15} fill="var(--fg)">
        state <tspan className="sym">A</tspan>
      </Label>
      <Label x={PATH_CX.b} y={CYL.bottom + 24} fontSize={15} fill="var(--fg)">
        state <tspan className="sym">B</tspan>
      </Label>
      <Label x={PATH_CX.a} y={topY - 14} fontSize={14} fill="var(--fg-muted)">
        {startK.toFixed(0)} K
      </Label>
      <Label x={PATH_CX.b} y={topY - 14} fontSize={14} fill="var(--fg-muted)">
        {endK.toFixed(0)} K
      </Label>
      <path
        d={`M${rimA.x},${rimA.y} C${rimA.x + 40},${20} ${rimB.x - 40},${20} ${rimB.x},${rimB.y}`}
        fill="none"
        strokeWidth={3}
        markerEnd={`url(#arrow1-${arrowId})`}
        style={{ stroke: 'var(--accent)' }}
      />
      <path
        d={`M${wallA.x},${wallA.y} Q${midX},${wallA.y + 160} ${wallB.x},${wallB.y}`}
        fill="none"
        strokeWidth={3}
        strokeDasharray="7 5"
        markerEnd={`url(#arrow2-${arrowId})`}
        style={{ stroke: 'var(--fg-muted)' }}
      />
      <Label x={midX} y={17} fontSize={15} fill="var(--accent)">
        Route 1
      </Label>
      <Label x={midX} y={304} fontSize={15} fill="var(--fg-muted)">
        Route 2
      </Label>
    </g>
  )
}
