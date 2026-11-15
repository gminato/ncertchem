'use client'

import { needleAngle, phTint } from '@/components/equilibrium'
import { Label } from '@/components/vocab'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { PARTICLE_BOX, PARTICLE_POINTS, SLOTS, UNIT_MMOL, stateAt } from './buffer-steps'

export interface BufferActionProps {
  step: number
  reducedMotion: boolean
}

const VIEW = { width: 580, height: 500 }
const RADIUS = 6.5
/** Incoming particles per row: enough for the largest addition (18 units of 0.5 mmol). */
const INCOMING_SLOTS = 18
const INCOMING_Y = 326
const INCOMING_GAP = 27
const INCOMING_CX = VIEW.width / 2

const fmt = (mmol: number) => mmol.toFixed(1)

const METER_R = 70
const METER_CY = 120
const METER_CENTRES = [150, 430] as const

/** Points on a meter's arc, in degrees from the vertical, with 0 at the far left and 14 at the far right. */
function arcPoint(cx: number, deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: METER_CY + r * Math.sin(rad) }
}

/**
 * A needle meter from 0 to 14 that reads the pH to two places, as the prose does. The needle angle is
 * the one the equilibrium meter uses, so the two agree.
 */
function PHMeter({ cx, pH, label }: { cx: number; pH: number; label: string }) {
  const a = arcPoint(cx, -70, METER_R)
  const b = arcPoint(cx, 70, METER_R)
  const tip = arcPoint(cx, needleAngle(pH), METER_R - 12)
  return (
    <g>
      <path d={`M ${a.x} ${a.y} A ${METER_R} ${METER_R} 0 0 1 ${b.x} ${b.y}`} fill="none" stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
      <line x1={cx} y1={METER_CY} x2={tip.x} y2={tip.y} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={cx} cy={METER_CY} r={4} fill="var(--fg)" />
      <Label x={a.x - 6} y={a.y + 8} textAnchor="end" fontSize={14} fill="var(--fg-muted)">0</Label>
      <Label x={b.x + 6} y={b.y + 8} textAnchor="start" fontSize={14} fill="var(--fg-muted)">14</Label>
      <Label x={cx} y={METER_CY + 26} textAnchor="middle" fontSize={24} fontWeight={700} fill="var(--fg)">
        {pH.toFixed(2)}
      </Label>
      <Label x={cx} y={METER_CY + 52} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg-muted)">
        {label}
      </Label>
      <rect x={cx - 52} y={METER_CY + 70} width={104} height={50} rx={6} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={1.8} />
      <rect x={cx - 50} y={METER_CY + 92} width={100} height={26} fill={phTint(pH)} opacity={0.55} style={{ transition: 'fill 0.4s ease' }} />
    </g>
  )
}

/** The step's acid or base, the incoming particle colour, and its name. */
function incomingStyle(added: number) {
  return added >= 0
    ? { fill: 'var(--acid)', name: 'H₃O⁺' }
    : { fill: 'var(--base)', name: 'OH⁻' }
}

/**
 * The same strong acid or base in water and in a buffer, as meters, with the buffer's particles below.
 * A⁻ (filled) takes up the H₃O⁺ that arrives and becomes HA; HA (ring) takes up the OH⁻ and becomes A⁻.
 * Each particle stands for 0.5 mmol. Positions are fixed, so a particle changes role where it sits.
 */
export function BufferAction({ step, reducedMotion }: BufferActionProps) {
  const state = stateAt(step)
  const pHWater = useTweenedNumber(state.pHWater, reducedMotion, 0.9)
  const pHBuffer = useTweenedNumber(state.pHBuffer, reducedMotion, 0.9)
  const incoming = incomingStyle(state.added)
  const transition = reducedMotion ? 'none' : 'opacity 0.5s ease'
  const nSalt = Math.round(state.saltMmol / UNIT_MMOL)
  const nAcid = Math.round(state.acidMmol / UNIT_MMOL)

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      width="100%"
      role="img"
      aria-label={`Buffer after ${Math.abs(state.added).toFixed(1)} mmol strong ${state.added >= 0 ? 'acid' : 'base'}: pH ${state.pHBuffer.toFixed(2)}; water: pH ${state.pHWater.toFixed(2)}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <Label x={VIEW.width / 2} y={24} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {`Added ${Math.abs(state.added).toFixed(1)} mmol strong ${state.added >= 0 ? 'acid' : 'base'}`}
      </Label>
      <PHMeter cx={METER_CENTRES[0]} pH={pHWater} label="water" />
      <PHMeter cx={METER_CENTRES[1]} pH={pHBuffer} label="buffer" />

      <Label x={VIEW.width / 2} y={280} fontSize={15} fontWeight={600} fill="var(--fg)" textAnchor="middle">
        {`Buffer now: A⁻ ${fmt(state.saltMmol)} mmol, HA ${fmt(state.acidMmol)} mmol, in 100 mL`}
      </Label>

      <Label x={INCOMING_CX} y={306} fontSize={14} fontWeight={600} fill="var(--fg-muted)" textAnchor="middle">
        {`Added ${incoming.name}: ${state.incomingUnits} particle${state.incomingUnits === 1 ? '' : 's'} of 0.5 mmol`}
      </Label>
      {Array.from({ length: INCOMING_SLOTS }, (_, i) => {
        const visible = i < state.incomingUnits
        // Visible dots sit centred on the drawing; hidden ones stay at their slot and fade.
        const row = visible ? state.incomingUnits : INCOMING_SLOTS
        return (
          <circle
            key={`in-${i}`}
            cx={INCOMING_CX + (i - (row - 1) / 2) * INCOMING_GAP}
            cy={INCOMING_Y}
            r={RADIUS}
            fill={incoming.fill}
            style={{ opacity: visible ? 1 : 0, transition }}
          />
        )
      })}

      <rect
        x={PARTICLE_BOX.x0 - 6}
        y={PARTICLE_BOX.y0 - 6}
        width={PARTICLE_BOX.x1 - PARTICLE_BOX.x0 + 12}
        height={PARTICLE_BOX.y1 - PARTICLE_BOX.y0 + 12}
        rx={16}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />

      {PARTICLE_POINTS.map((p, i) => {
        const isSalt = i < SLOTS
        const index = isSalt ? i : i - SLOTS
        const visible = index < (isSalt ? nSalt : nAcid)
        if (isSalt) {
          return (
            <circle
              key={`p-${i}`}
              cx={p.x}
              cy={p.y}
              r={RADIUS}
              fill="var(--accent)"
              style={{ opacity: visible ? 1 : 0, transition }}
            />
          )
        }
        return (
          <circle
            key={`p-${i}`}
            cx={p.x}
            cy={p.y}
            r={RADIUS}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2}
            style={{ opacity: visible ? 1 : 0, transition }}
          />
        )
      })}

      <g transform={`translate(0 ${PARTICLE_BOX.y1 + 30})`} fontSize={14}>
        <circle cx={58} cy={0} r={RADIUS} fill="var(--accent)" />
        <Label x={72} y={0} textAnchor="start" fontSize={14} fill="var(--fg)" fontWeight={600}>A⁻ (acetate)</Label>
        <circle cx={230} cy={0} r={RADIUS} fill="none" stroke="var(--fg)" strokeWidth={2} />
        <Label x={244} y={0} textAnchor="start" fontSize={14} fill="var(--fg)" fontWeight={600}>HA (acetic acid)</Label>
        <circle cx={418} cy={0} r={RADIUS} fill={incoming.fill} />
        <Label x={432} y={0} textAnchor="start" fontSize={14} fill="var(--fg)" fontWeight={600}>{`Added ${incoming.name}`}</Label>
      </g>
    </svg>
  )
}
