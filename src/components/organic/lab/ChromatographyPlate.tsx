import React, { forwardRef, useId } from 'react'
import { clamp01, frontY, rfFromDistances, spotY } from './geometry'
import { Caption } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const CHROMATOGRAPHY_PLATE_SIZE = { width: 340, height: 318 } as const

export interface ChromatogramSpot {
  id: string
  /** Retention factor, 0 to 1: distance moved by the spot divided by distance moved by the solvent. */
  rf: number
  /** Spot colour, a CSS colour such as var(--spot-1). Ignored while the spot is colourless and not visualised. */
  color?: string
  /** A colourless spot shows only after UV or iodine visualisation. */
  colourless?: boolean
}

export type ChromatographyKind = 'tlc' | 'paper'
export type VisualiseMode = 'none' | 'uv' | 'iodine'

export interface ChromatographyPlateProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  kind?: ChromatographyKind
  spots: readonly ChromatogramSpot[]
  /** Solvent front progress, 0 at the origin line and 1 at the top of the solvent run. */
  progress?: number
  /** 0 to 1. Spots widen and tail as they spread. */
  spread?: number
  /** Developing the plate: UV (fluorescent plate, spots quench it) or iodine vapour (spots brown). */
  visualise?: VisualiseMode
  /** Draws the measuring overlay: the solvent distance, the spot distance and the Rf value. */
  measure?: boolean
  /** Index into `spots` for the measuring overlay. */
  measureSpot?: number
  title?: string
  x?: number
  y?: number
}

const CM_PER_PX = 8 / 220
const SOLVENT_PX = 220
const BASELINE = 258
const TLC = { x0: 70, x1: 190, top: 24, bottom: 284 }
const PAPER = { x0: 104, x1: 156, top: 24, bottom: 274 }
/** Closed jar for paper chromatography. The lid holds the strip; the solvent pool sits under the origin. */
const JAR = { x0: 84, x1: 176, top: 22, bottom: 300, lidX0: 76, lidX1: 184, lidY: 12, lidH: 12 }
const SOLVENT_Y = 268
const IODINE = '#9A6A3A'

/**
 * Thin-layer or paper chromatography. Each spot moves Rf times the solvent distance, so the
 * solvent front and the spots are placed from the same progress value. A measuring overlay
 * shows the distances in cm and the Rf value.
 */
export const ChromatographyPlate = forwardRef<SVGGElement, ChromatographyPlateProps>(function ChromatographyPlate(
  {
    kind = 'tlc',
    spots,
    progress = 0,
    spread = 0,
    visualise = 'none',
    measure = false,
    measureSpot = 0,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const pattern = `cp-grain-${uid}`
  const p = clamp01(progress)
  const s = clamp01(spread)
  const area = kind === 'tlc' ? TLC : PAPER
  const cx0 = (area.x0 + area.x1) / 2
  // Labels sit left of the support; for paper they sit left of the jar.
  const labelX = kind === 'tlc' ? area.x0 - 10 : JAR.lidX0 - 6
  const colStep = kind === 'tlc' ? (area.x1 - area.x0) / (spots.length + 1) : 0

  const spotX = (i: number) => (kind === 'tlc' ? area.x0 + (i + 1) * colStep : cx0 + (i - (spots.length - 1) / 2) * 16)
  const front = frontY(BASELINE, p, SOLVENT_PX)
  const measured = spots[measureSpot]
  const measuredY = measured ? spotY(BASELINE, measured.rf, p, SOLVENT_PX) : BASELINE
  const measuredRf = measured ? rfFromDistances(BASELINE - measuredY, BASELINE - front) : 0
  const showSpot = (spot: ChromatogramSpot) => !spot.colourless || visualise !== 'none'
  const spotFill = (spot: ChromatogramSpot) => {
    if (!spot.colourless) return spot.color ?? 'var(--spot-1)'
    if (visualise === 'uv') return 'var(--fg)'
    if (visualise === 'iodine') return IODINE
    return 'transparent'
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Chromatography plate'} {...rest}>
      <defs>
        <pattern id={pattern} width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={2} cy={2} r={0.7} fill="var(--fg-subtle)" opacity={0.35} />
          <circle cx={5} cy={5} r={0.6} fill="var(--fg-subtle)" opacity={0.25} />
        </pattern>
      </defs>

      {/* Support: a TLC plate or a paper strip dipping into the solvent */}
      {kind === 'tlc' ? (
        <g>
          <rect x={area.x0} y={area.top} width={area.x1 - area.x0} height={area.bottom - area.top} rx={3} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.6} />
          <rect x={area.x0} y={area.top} width={area.x1 - area.x0} height={area.bottom - area.top} rx={3} fill={`url(#${pattern})`} />
        </g>
      ) : (
        <g>
          {/* Closed jar: glass body, solvent pool, the strip hanging from the lid, then the glass outline and lid */}
          <rect x={JAR.x0} y={JAR.top} width={JAR.x1 - JAR.x0} height={JAR.bottom - JAR.top} rx={8} fill="var(--glass-fill)" />
          <rect x={JAR.x0 + 2} y={SOLVENT_Y} width={JAR.x1 - JAR.x0 - 4} height={JAR.bottom - SOLVENT_Y - 2} fill="var(--liquid)" opacity={0.85} />
          <line x1={JAR.x0 + 2} x2={JAR.x1 - 2} y1={SOLVENT_Y} y2={SOLVENT_Y} stroke="var(--liquid-edge)" strokeWidth={1.2} />
          <rect x={area.x0} y={area.top} width={area.x1 - area.x0} height={area.bottom - area.top} rx={3} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.4} />
          <rect x={JAR.x0} y={JAR.top} width={JAR.x1 - JAR.x0} height={JAR.bottom - JAR.top} rx={8} fill="none" stroke="var(--glass)" strokeWidth={2} />
          <rect x={JAR.lidX0} y={JAR.lidY} width={JAR.lidX1 - JAR.lidX0} height={JAR.lidH} rx={4} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.6} />
        </g>
      )}

      {/* Visualisation tint over the whole support */}
      {visualise === 'uv' && <rect x={area.x0} y={area.top} width={area.x1 - area.x0} height={area.bottom - area.top} rx={3} fill="var(--ph-8)" opacity={0.3} />}
      {visualise === 'iodine' && <rect x={area.x0} y={area.top} width={area.x1 - area.x0} height={area.bottom - area.top} rx={3} fill="var(--caution)" opacity={0.12} />}

      {/* Origin and solvent front */}
      <line x1={area.x0} x2={area.x1} y1={BASELINE} y2={BASELINE} stroke="var(--fg-muted)" strokeWidth={1.2} strokeDasharray="4 3" />
      <Caption x={labelX} y={BASELINE} anchor="end">
        origin
      </Caption>
      {p > 0 && (
        <g>
          <line x1={area.x0} x2={area.x1} y1={front} y2={front} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="6 3" />
          <Caption x={labelX} y={front} anchor="end" fill="var(--accent)">
            front
          </Caption>
        </g>
      )}

      {/* Spots: each moves Rf times the solvent distance and widens as it spreads */}
      {spots.map((spot, i) => {
        if (!showSpot(spot)) return null
        const cy = spotY(BASELINE, spot.rf, p, SOLVENT_PX)
        const r = 5 + s * 4
        const ry = r * (1 + s * 0.7)
        return (
          <g key={spot.id}>
            <ellipse cx={spotX(i)} cy={cy} rx={r} ry={ry} fill={spotFill(spot)} stroke={visualise === 'none' ? 'none' : 'var(--surface)'} strokeWidth={0.8} opacity={0.95} />
            <Caption x={spotX(i)} y={kind === 'tlc' ? 302 : 310} size={15} fill="var(--fg)">
              {spot.id}
            </Caption>
          </g>
        )
      })}

      {/* Measuring overlay */}
      {measure && measured && (
        <g>
          <line x1={232} x2={232} y1={BASELINE} y2={front} stroke="var(--accent)" strokeWidth={1.4} />
          <line x1={226} x2={238} y1={BASELINE} y2={BASELINE} stroke="var(--accent)" strokeWidth={1.4} />
          <line x1={226} x2={238} y1={front} y2={front} stroke="var(--accent)" strokeWidth={1.4} />
          <line x1={262} x2={262} y1={BASELINE} y2={measuredY} stroke="var(--fg)" strokeWidth={1.4} />
          <line x1={256} x2={268} y1={measuredY} y2={measuredY} stroke="var(--fg)" strokeWidth={1.4} />
          <Caption x={274} y={(BASELINE + measuredY) / 2} anchor="start" fill="var(--fg)">
            {`${((BASELINE - measuredY) * CM_PER_PX).toFixed(1)} cm`}
          </Caption>
          <rect x={232} y={28} width={98} height={46} rx={6} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
          <Caption x={281} y={41} size={15} fill="var(--fg)">
            {`Rf = ${measuredRf.toFixed(2)}`}
          </Caption>
          <Caption x={281} y={59} size={13}>
            {`${((BASELINE - measuredY) * CM_PER_PX).toFixed(1)} ÷ ${((BASELINE - front) * CM_PER_PX).toFixed(1)} cm`}
          </Caption>
        </g>
      )}
    </g>
  )
})
