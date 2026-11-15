import React, { forwardRef } from 'react'
import { Caption } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const CARIUS_TUBE_SIZE = { width: 300, height: 300 } as const

export type CariusStage = 'load' | 'heat' | 'settle' | 'filter'

export interface CariusTubeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /**
   * 'load': the sample, fuming HNO₃ and AgNO₃ are sealed in the tube.
   * 'heat': the sealed tube is heated in a furnace to oxidise the sample.
   * 'settle': the silver halide, sulphate or phosphate settles at the bottom (progress drives it).
   * 'filter': the precipitate is filtered off, washed and weighed.
   */
  stage?: CariusStage
  /** 0 to 1. Furnace glow in 'heat' and how much precipitate has settled in 'settle'. */
  progress?: number
  /** Colour of the precipitate, e.g. var(--agcl-white) for AgCl or var(--agbr-pale-yellow) for AgBr. */
  precipitateColor?: string
  /** Name shown beside the precipitate, e.g. "AgCl" or "AgBr". */
  precipitateLabel?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

const TUBE_PATH = 'M130,58 Q130,40 150,40 Q170,40 170,58 V236 Q170,250 156,250 H144 Q130,250 130,236 Z'
const FURNACE = { x0: 108, x1: 192, y0: 206, y1: 268 }
const LIQUID_TOP = 196
const LIQUID_BOTTOM = 246
const SETTLE_MAX = 34

const CAPTION: Record<CariusStage, string> = {
  load: 'Seal sample with fuming HNO₃ and AgNO₃',
  heat: 'Heat in a furnace to oxidise the sample',
  settle: 'The silver salt settles out',
  filter: 'Filter, wash and weigh the precipitate',
}

/**
 * Carius's method for halogen, sulphur and phosphorus. The sample is oxidised in a sealed tube
 * with fuming nitric acid, the halide is precipitated with AgNO₃, and the solid is weighed.
 */
export const CariusTube = forwardRef<SVGGElement, CariusTubeProps>(function CariusTube(
  { stage = 'load', progress = 0, precipitateColor = 'var(--agcl-white)', precipitateLabel = 'AgCl', title, x = 0, y = 0, className, ...rest },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  const heated = stage === 'heat'
  const settling = stage === 'settle'
  const filtering = stage === 'filter'
  const solidH = settling ? SETTLE_MAX * p : 0
  const glow = heated ? 0.2 + 0.45 * p : 0

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Carius tube for halogen estimation'} {...rest}>
      <Caption x={16} y={20} anchor="start" size={14} fill="var(--fg-muted)">
        {CAPTION[stage]}
      </Caption>

      {/* Furnace, glowing while heating */}
      <rect x={FURNACE.x0} y={FURNACE.y0} width={FURNACE.x1 - FURNACE.x0} height={FURNACE.y1 - FURNACE.y0} rx={10} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
      {glow > 0 && <rect x={FURNACE.x0 + 4} y={FURNACE.y0 + 4} width={FURNACE.x1 - FURNACE.x0 - 8} height={FURNACE.y1 - FURNACE.y0 - 8} rx={7} fill="var(--flame)" opacity={glow} />}
      <Caption x={150} y={288} size={14}>
        furnace
      </Caption>

      {/* Sealed tube */}
      <path d={TUBE_PATH} fill="var(--glass-fill)" />
      {!filtering && (
        <g>
          <rect x={138} y={LIQUID_TOP} width={24} height={LIQUID_BOTTOM - LIQUID_TOP} fill="var(--liquid)" opacity={0.85} />
          {heated && <rect x={138} y={LIQUID_TOP - 16} width={24} height={16} fill="var(--no2)" opacity={0.25 + 0.3 * p} />}
          {solidH > 0 && <rect x={138} y={LIQUID_BOTTOM - solidH} width={24} height={solidH} fill={precipitateColor} stroke="var(--fg-subtle)" strokeWidth={0.5} />}
        </g>
      )}
      <path d={TUBE_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.4} strokeLinejoin="round" />
      <circle cx={150} cy={36} r={3.5} fill="var(--glass)" />
      <Caption x={184} y={52} anchor="start" size={14}>
        sealed
      </Caption>
      {settling && p > 0.6 && (
        <Caption x={200} y={LIQUID_BOTTOM - 10} anchor="start" size={15} fill="var(--fg)">
          {precipitateLabel}
        </Caption>
      )}

      {/* Gooch crucible with the filtered precipitate */}
      {filtering && (
        <g>
          <path d="M212,172 H280 L266,222 H226 Z" fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.8} strokeLinejoin="round" />
          <rect x={228} y={204} width={36} height={14} fill={precipitateColor} stroke="var(--fg-subtle)" strokeWidth={0.5} />
          <Caption x={246} y={242} size={15} fill="var(--fg)">
            {precipitateLabel}
          </Caption>
        </g>
      )}
    </g>
  )
})
