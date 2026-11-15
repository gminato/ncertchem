import React, { forwardRef, useId } from 'react'
import { layerOrder, mixAmount, partitionProgress, partitionTopFraction, seededRandom, splitCount, type DensityLayer } from './geometry'
import { Caption, Dot } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const SEPARATING_FUNNEL_SIZE = { width: 320, height: 330 } as const

export interface FunnelLayer extends DensityLayer {
  /** Fill colour of the liquid, a CSS colour such as var(--liquid). Use a neutral tint, not the solute colour. */
  color: string
  /** Short name shown beside the layer, e.g. "water" or "ether". */
  label?: React.ReactNode
}

export interface SeparatingFunnelProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Two immiscible layers. The less dense one is drawn on top, whatever the order given. */
  layers: readonly [FunnelLayer, FunnelLayer]
  /** Solute partition ratio K = [solute] in the top layer / [solute] in the bottom layer. */
  partition?: number
  /** Number of extractions with fresh solvent of the same volume as the bottom layer. */
  extraction?: number
  /** 0 to 1. 0 is at rest. Mid-shake the layers mix; at 1 they have settled and the solute has partitioned. */
  shake?: number
  /** 0 to 1. The stopcock is open and the lower layer drains out. */
  drain?: number
  /** Colour of the solute dots. */
  soluteColor?: string
  /** Number of solute particles drawn. */
  particles?: number
  title?: string
  x?: number
  y?: number
}

const CX = 150
const TOP = 36
const BULB_HW = 84
const BULB_MAX_Y = 118
const SHOULDER = 212
const NECK_HW = 7
const STOP_BOTTOM = 246
const STOPPER = { y0: 12, hw: 22 }
const BOUNDARY = 118
const LOWER_BOTTOM = SHOULDER - 2

/**
 * Pear-shaped separating funnel: a wide bulb tapering to a neck, a stopper at the top and a
 * stem with the stopcock below. Right half is mirrored to the left.
 */
const BODY_PATH = `M${CX - BULB_HW},${TOP} H${CX + BULB_HW} C${CX + BULB_HW},${BULB_MAX_Y + 4} ${CX + 52},${SHOULDER - 30} ${CX + NECK_HW},${SHOULDER} V${SHOULDER + 16} H${CX - NECK_HW} V${SHOULDER} C${CX - 52},${SHOULDER - 30} ${CX - BULB_HW},${BULB_MAX_Y + 4} ${CX - BULB_HW},${TOP} Z`

/** Half width of the bulb at height y. Smooth from the widest point down to the neck. */
function bodyHalf(y: number): number {
  if (y <= BULB_MAX_Y) return BULB_HW
  if (y >= SHOULDER) return NECK_HW
  const t = (y - BULB_MAX_Y) / (SHOULDER - BULB_MAX_Y)
  const e = t * t * (3 - 2 * t)
  return BULB_HW + (NECK_HW - BULB_HW) * e
}

/** Maps a unit random pair to a point inside the funnel between y0 and y1, keeping clear of the walls. */
function pointIn(y0: number, y1: number, ry: number, rx: number): { x: number; y: number } {
  const y = y0 + ry * (y1 - y0)
  const hw = Math.max(0, bodyHalf(y) - 6)
  return { x: CX + (rx * 2 - 1) * hw, y }
}

/**
 * A separating funnel with two immiscible layers, solute dots partitioned between them, and a
 * stopcock. Shaking mixes the layers and then they settle. Extra extractions move more solute
 * into the top layer. Draining lowers the bottom layer through the open stopcock.
 */
export const SeparatingFunnel = forwardRef<SVGGElement, SeparatingFunnelProps>(function SeparatingFunnel(
  {
    layers,
    partition = 3,
    extraction = 1,
    shake = 0,
    drain = 0,
    soluteColor = 'var(--i2)',
    particles = 26,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const bodyClip = `sf-body-${uid}`
  const mixGrad = `sf-mix-${uid}`

  const order = layerOrder(layers)
  const topLayer = order[0]
  const lowerLayer = order[1]
  const s = Math.min(1, Math.max(0, shake))
  const d = Math.min(1, Math.max(0, drain))

  // Mixing band around the boundary, opening during the shake and closing as it settles.
  const band = 34 * mixAmount(s)
  const boundaryTop = BOUNDARY - band / 2
  const boundaryBottom = BOUNDARY + band / 2
  const lowerSurface = boundaryBottom + d * (LOWER_BOTTOM - boundaryBottom)

  // Solute: partitioned between the layers once settled, and scattered while mixing.
  const topFraction = partitionTopFraction(partition, 1, 1, Math.max(0, extraction)) * partitionProgress(s)
  const { top: topCount, bottom: bottomCount } = splitCount(particles, topFraction)
  const rand = seededRandom(41)
  const dots: { x: number; y: number }[] = []
  for (let i = 0; i < topCount + bottomCount; i++) {
    const isTop = i < topCount
    const settled = isTop
      ? pointIn(TOP + 8, boundaryTop - 4, rand(), rand())
      : pointIn(BOUNDARY + 4, LOWER_BOTTOM - 4, rand(), rand())
    // Settled dots in the lower layer are squeezed into the liquid that remains after draining.
    const squeezed = isTop
      ? settled
      : { x: settled.x, y: lowerSurface + ((settled.y - BOUNDARY) / (LOWER_BOTTOM - BOUNDARY)) * (LOWER_BOTTOM - lowerSurface) }
    const scatter = pointIn(TOP + 8, LOWER_BOTTOM - 4, rand(), rand())
    const mix = mixAmount(s)
    dots.push({
      x: squeezed.x * (1 - mix) + scatter.x * mix,
      y: squeezed.y * (1 - mix) + scatter.y * mix,
    })
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Separating funnel with two layers'} {...rest}>
      <defs>
        <clipPath id={bodyClip}>
          <path d={BODY_PATH} />
        </clipPath>
        <linearGradient id={mixGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={topLayer.color} />
          <stop offset="1" stopColor={lowerLayer.color} />
        </linearGradient>
      </defs>

      {/* Stopper, then the glass body */}
      <rect x={CX - STOPPER.hw} y={STOPPER.y0} width={STOPPER.hw * 2} height={TOP - STOPPER.y0 + 2} rx={4} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.6} />

      <path d={BODY_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${bodyClip})`}>
        <rect x={CX - BULB_HW - 2} y={TOP} width={(BULB_HW + 2) * 2} height={boundaryTop - TOP} fill={topLayer.color} opacity={0.7} />
        {band > 0 && (
          <rect x={CX - BULB_HW - 2} y={boundaryTop} width={(BULB_HW + 2) * 2} height={band} fill={`url(#${mixGrad})`} opacity={0.7} />
        )}
        <rect x={CX - BULB_HW - 2} y={lowerSurface} width={(BULB_HW + 2) * 2} height={LOWER_BOTTOM - lowerSurface + 2} fill={lowerLayer.color} opacity={0.7} />
        {/* Surface line so the two layers read clearly at rest */}
        {band < 2 && <line x1={CX - BULB_HW} x2={CX + BULB_HW} y1={BOUNDARY} y2={BOUNDARY} stroke="var(--glass)" strokeWidth={1.4} />}
        {dots.map((dot, i) => (
          <Dot key={`sol-${i}`} x={dot.x} y={dot.y} r={3.4} fill={soluteColor} />
        ))}
      </g>
      <path d={BODY_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.2} strokeLinejoin="round" />

      {/* Stem and stopcock */}
      <rect x={CX - NECK_HW + 1} y={SHOULDER + 14} width={(NECK_HW - 1) * 2} height={STOP_BOTTOM - SHOULDER - 14} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.8} />
      <rect x={CX - 12} y={STOP_BOTTOM - 4} width={24} height={10} rx={3} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
      <rect
        x={CX - 17}
        y={STOP_BOTTOM - 1.5}
        width={34}
        height={5}
        rx={2.5}
        fill="var(--fg-muted)"
        transform={`rotate(${d > 0 ? 90 : 0} ${CX} ${STOP_BOTTOM + 1})`}
      />

      {/* Drops leaving through the open stopcock */}
      {d > 0 &&
        [0, 1, 2].map((i) => {
          const t = (d * 2 + i / 3) % 1
          return <Dot key={`drop-${i}`} x={CX} y={STOP_BOTTOM + 12 + t * 40} r={2.8} fill={lowerLayer.color} />
        })}

      {/* Layer names and the stopcock label, beside the tap */}
      <Caption x={CX + BULB_HW + 14} y={92} anchor="start" size={15} fill="var(--fg)">
        {topLayer.label ?? topLayer.id}
      </Caption>
      <Caption x={CX + BULB_HW + 14} y={176} anchor="start" size={15} fill="var(--fg)">
        {lowerLayer.label ?? lowerLayer.id}
      </Caption>
      <Caption x={CX + 26} y={STOP_BOTTOM + 2} anchor="start" size={14}>
        stopcock
      </Caption>
    </g>
  )
})
