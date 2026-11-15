import React, { forwardRef } from 'react'
import { Burner, Caption, FlameRow, GlassTube } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const COMBUSTION_TRAIN_SIZE = { width: 360, height: 236 } as const

const TRAIN_Y = 110
const TUBE_PATH = `M44,${TRAIN_Y} H204`
const U_PATH = `M204,${TRAIN_Y} H212 V168 Q212,178 222,178 H236 Q246,178 246,168 V${TRAIN_Y} H258`

export interface CombustionTrainProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1. How far the oxygen and the combustion products have moved along the train. */
  progress?: number
  /** Mass gained by the calcium chloride U-tube (water absorbed), shown under the tube. */
  h2oGain?: React.ReactNode
  /** Mass gained by the potash bulbs (carbon dioxide absorbed), shown under the bulbs. */
  co2Gain?: React.ReactNode
  /** Draws the furnace and burner under the combustion tube. */
  heating?: boolean
  title?: string
  x?: number
  y?: number
}

/**
 * Liebig's method for carbon and hydrogen. Oxygen sweeps the sample through a hot tube of CuO,
 * then anhydrous CaCl₂ takes up the water and KOH takes up the carbon dioxide. Each absorber
 * shows its mass gain.
 */
export const CombustionTrain = forwardRef<SVGGElement, CombustionTrainProps>(function CombustionTrain(
  { progress = 0, h2oGain = '+0.36 g', co2Gain = '+1.32 g', heating = true, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const flowRoute = `M44,${TRAIN_Y} H258`
  const p = Math.min(1, Math.max(0, progress))

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Liebig combustion train for carbon and hydrogen'} {...rest}>
      {/* Oxygen cylinder and inlet */}
      <rect x={8} y={84} width={22} height={52} rx={6} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
      <Caption x={19} y={154} size={15} fill="var(--fg)">
        O₂
      </Caption>
      <line x1={30} x2={44} y1={TRAIN_Y} y2={TRAIN_Y} stroke="var(--glass)" strokeWidth={3} />

      {/* Furnace and burner around the combustion tube */}
      {heating && (
        <g>
          <rect x={92} y={84} width={64} height={52} rx={8} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
          <Burner x={100} y={148} width={48} height={8} />
          <FlameRow cx={124} y={176} width={34} count={3} />
        </g>
      )}
      <Caption x={124} y={70} size={14}>
        CuO
      </Caption>

      {/* Combustion tube with the boat and CuO packing */}
      <GlassTube d={TUBE_PATH} width={12} />
      <rect x={120} y={TRAIN_Y - 5} width={30} height={10} fill="var(--fg-subtle)" opacity={0.55} />
      <rect x={100} y={TRAIN_Y - 6} width={14} height={12} rx={2} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.2} />

      {/* U-tube of anhydrous CaCl₂ and the potash bulbs */}
      <GlassTube d={U_PATH} width={10} />
      <rect x={215} y={156} width={28} height={22} rx={4} fill="var(--precipitate)" />
      <Caption x={230} y={196} size={15} fill="var(--fg)">
        CaCl₂
      </Caption>
      <Caption x={230} y={214} size={15} fill="var(--fg)">
        {h2oGain}
      </Caption>

      <GlassTube d={`M258,${TRAIN_Y} H268`} width={10} />
      {[280, 303, 326].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={TRAIN_Y} r={12} fill="var(--liquid)" fillOpacity={0.55} stroke="var(--glass)" strokeWidth={1.8} />
        </g>
      ))}
      <GlassTube d={`M292,${TRAIN_Y} H314`} width={3} />
      <Caption x={303} y={140} size={15} fill="var(--fg)">
        KOH
      </Caption>
      <Caption x={303} y={158} size={15} fill="var(--fg)">
        {co2Gain}
      </Caption>

      {/* Gas flow along the whole train */}
      <path d={flowRoute} fill="none" stroke="var(--coolant)" strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} opacity={0.8} />
    </g>
  )
})
