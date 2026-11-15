import React, { forwardRef, useId } from 'react'
import { liquidSurfaceY } from './geometry'
import { Burner, Caption, Dot, FlameRow, GlassTube, Stopper } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const DISTILLATION_RIG_SIZE = { width: 360, height: 390 } as const

export type DistillationMode = 'simple' | 'fractional' | 'reduced-pressure' | 'steam'

export interface DistillationRigProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  mode?: DistillationMode
  /** Liquid in the round-bottom flask, 0 to 1. */
  flaskLevel?: number
  /** Colour of the mixture in the flask. */
  flaskColor?: string
  /** Distillate level in the receiver, 0 to 1. */
  receiverLevel?: number
  /** Colour of the distillate. A second liquid, so it can differ from the mixture. */
  receiverColor?: string
  /** Thermometer reading in °C. The scale runs from 20 to 200 °C. */
  temperature?: number
  /** 0 to 1: vapour climbs the side arm (and the column in fractional mode) and drops fall into the receiver. */
  progress?: number
  /** Gauge text for reduced-pressure mode. */
  pressureLabel?: React.ReactNode
  /** Draws the burner flames under the flask. */
  heating?: boolean
  title?: string
  x?: number
  y?: number
}

const FLASK = { cx: 110, cy: 270, r: 60, neckX0: 98, neckX1: 122, neckTop: 150 }
const FLASK_PATH = `M${FLASK.neckX0},${FLASK.neckTop} V211.2 A${FLASK.r},${FLASK.r} 0 1 0 ${FLASK.neckX1},211.2 V${FLASK.neckTop} Z`
const CONDENSER = { x0: 186, x1: 296, y0: 148, y1: 172, tubeY: 160 }
const RECEIVER = { neckX0: 292, neckX1: 312, neckTop: 240, surfaceTop: 262, bottom: 344 }
const RECEIVER_PATH = `M${RECEIVER.neckX0},${RECEIVER.neckTop} V262 L264,334 Q260,344 272,344 H332 Q344,344 340,334 L${RECEIVER.neckX1},262 V${RECEIVER.neckTop} Z`
const THERMO = { x: 110, top: 20, scaleTop: 26, bulbY: 166, columnBulbY: 58 }

function thermometerY(temp: number, bulbY: number): number {
  const frac = Math.min(1, Math.max(0, (temp - 20) / 180))
  return bulbY - frac * (bulbY - THERMO.scaleTop)
}

/**
 * Simple, fractional, reduced-pressure and steam distillation as line-art glassware. Liquid
 * levels, the thermometer and the progress of the vapour and drops are all props, so a
 * Scrolly or Simulation can drive the rig with GSAP.
 */
export const DistillationRig = forwardRef<SVGGElement, DistillationRigProps>(function DistillationRig(
  {
    mode = 'simple',
    flaskLevel = 0.55,
    flaskColor = 'var(--liquid-edge)',
    receiverLevel = 0.25,
    receiverColor = 'var(--fwd)',
    temperature = 25,
    progress = 0,
    pressureLabel = '12 mmHg',
    heating = true,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const flaskClip = `dr-flask-${uid}`
  const receiverClip = `dr-recv-${uid}`
  const steamClip = `dr-steam-${uid}`

  const p = Math.min(1, Math.max(0, progress))
  const fractional = mode === 'fractional'
  const steam = mode === 'steam'
  const reduced = mode === 'reduced-pressure'

  const bulbY = fractional ? THERMO.columnBulbY : THERMO.bulbY
  const mercuryTop = thermometerY(temperature, bulbY)
  const surfaceY = liquidSurfaceY(flaskLevel, 212, 330)
  const recvSurfaceY = liquidSurfaceY(receiverLevel, RECEIVER.surfaceTop, RECEIVER.bottom)

  const armPath = fractional ? 'M128,48 H172 V160 H180' : `M${FLASK.neckX1},168 L180,${CONDENSER.tubeY}`
  const dripX = 302
  const dropCount = 3

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Distillation apparatus'} {...rest}>
      <defs>
        <clipPath id={flaskClip}>
          <path d={FLASK_PATH} />
        </clipPath>
        <clipPath id={receiverClip}>
          <path d={RECEIVER_PATH} />
        </clipPath>
        <clipPath id={steamClip}>
          <circle cx={60} cy={80} r={26} />
        </clipPath>
      </defs>

      {/* Heat source */}
      {heating && (
        <g>
          <Burner x={74} y={338} width={72} height={12} />
          <FlameRow cx={110} y={372} width={56} count={3} />
        </g>
      )}

      {/* Round-bottom flask with liquid */}
      <path d={FLASK_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${flaskClip})`}>
        <rect x={FLASK.cx - FLASK.r - 2} y={surfaceY} width={FLASK.r * 2 + 4} height={340 - surfaceY} fill={flaskColor} opacity={0.8} />
      </g>
      <line x1={FLASK.cx - 40} x2={FLASK.cx + 40} y1={surfaceY} y2={surfaceY} stroke="var(--liquid-edge)" strokeWidth={1.4} clipPath={`url(#${flaskClip})`} />
      <path d={FLASK_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.2} strokeLinejoin="round" />

      {/* Neck stopper (simple, reduced pressure and steam) or fractionating column */}
      {fractional ? (
        <g>
          <rect x={96} y={60} width={28} height={FLASK.neckTop - 60 + 2} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.8} />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={97} x2={123} y1={70 + i * 9} y2={70 + i * 9} stroke="var(--glass)" strokeWidth={1.2} opacity={0.7} />
          ))}
          {/* Vapour front climbs the column with progress */}
          <rect x={98} y={FLASK.neckTop - 96 * p} width={24} height={96 * p} fill="var(--vapour)" />
          <rect x={88} y={42} width={44} height={12} rx={4} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
        </g>
      ) : (
        <Stopper x={96} y={136} width={28} height={16} />
      )}

      {/* Thermometer, through the stopper or column head */}
      <g>
        <rect x={THERMO.x - 4} y={THERMO.top} width={8} height={bulbY - THERMO.top} rx={3} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.2} />
        <rect x={THERMO.x - 1.5} y={mercuryTop} width={3} height={bulbY - mercuryTop} fill="var(--proton)" />
        <circle cx={THERMO.x} cy={bulbY + 4} r={6.5} fill="var(--proton)" stroke="var(--glass)" strokeWidth={1.2} />
        <Caption x={124} y={THERMO.top + 6} anchor="start" size={14} fill="var(--fg)">
          {`${temperature} °C`}
        </Caption>
      </g>

      {/* Side arm, with vapour drawn along it by progress */}
      <GlassTube d={armPath} width={11} />
      <path d={armPath} fill="none" stroke="var(--vapour)" strokeWidth={6} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />

      {/* Liebig condenser: a jacket with coolant and an inner tube */}
      <rect x={CONDENSER.x0} y={CONDENSER.y0} width={CONDENSER.x1 - CONDENSER.x0} height={CONDENSER.y1 - CONDENSER.y0} rx={10} fill="var(--glass-fill)" stroke="var(--coolant)" strokeWidth={1.6} />
      <GlassTube d={`M180,${CONDENSER.tubeY} H${dripX}`} width={10} />
      <path d={`M194,${CONDENSER.y1} V204`} stroke="var(--coolant)" strokeWidth={3} strokeLinecap="round" />
      <path d={`M288,${CONDENSER.y0} V118`} stroke="var(--coolant)" strokeWidth={3} strokeLinecap="round" />
      <Caption x={194} y={218} size={14} fill="var(--coolant)">
        water in
      </Caption>
      <Caption x={288} y={108} size={14} fill="var(--coolant)">
        water out
      </Caption>

      {/* Drip from the condenser into the receiver */}
      <GlassTube d={`M${dripX},${CONDENSER.tubeY} V${RECEIVER.neckTop}`} width={8} />

      {/* Receiver with distillate */}
      <path d={RECEIVER_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${receiverClip})`}>
        <rect x={250} y={recvSurfaceY} width={100} height={RECEIVER.bottom - recvSurfaceY} fill={receiverColor} opacity={0.8} />
      </g>
      <path d={RECEIVER_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.2} strokeLinejoin="round" />

      {/* Drops falling from the drip tip */}
      {p > 0 &&
        Array.from({ length: dropCount }, (_, i) => {
          const t = (p * 2 + i / dropCount) % 1
          const dropY = 176 + t * (recvSurfaceY - 176)
          return <Dot key={i} x={dripX} y={dropY} r={2.8} fill={receiverColor} />
        })}

      {/* Reduced pressure: vacuum line and pressure gauge */}
      {reduced && (
        <g>
          <GlassTube d="M312,252 H340 V64" width={8} />
          <rect x={236} y={20} width={104} height={44} rx={6} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.6} />
          <Caption x={288} y={36} size={13} fill="var(--fg-muted)">
            vacuum
          </Caption>
          <Caption x={288} y={52} size={15} fill="var(--fg)">
            {pressureLabel}
          </Caption>
        </g>
      )}

      {/* Steam generator feeding the mixture */}
      {steam && (
        <g>
          <circle cx={60} cy={80} r={26} fill="var(--glass-fill)" />
          <rect x={30} y={76} width={60} height={60} fill="var(--liquid)" clipPath={`url(#${steamClip})`} />
          <circle cx={60} cy={80} r={26} fill="none" stroke="var(--glass)" strokeWidth={2.2} />
          <GlassTube d="M60,106 L42,122 V302 H66" width={6} />
          <Caption x={60} y={40} size={14}>
            steam
          </Caption>
          {Array.from({ length: 4 }, (_, i) => {
            const t = (p + i / 4) % 1
            return <Dot key={i} x={42} y={122 + t * 180} r={2.6} fill="var(--vapour)" />
          })}
        </g>
      )}
    </g>
  )
})
