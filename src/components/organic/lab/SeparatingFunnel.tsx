import React, { forwardRef, useId } from 'react'
import { coneHalfWidth, layerOrder, mixAmount, partitionProgress, partitionTopFraction, seededRandom, splitCount, type DensityLayer } from './geometry'
import { Caption, Dot } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const SEPARATING_FUNNEL_SIZE = { width: 320, height: 330 } as const

export interface FunnelLayer extends DensityLayer {
  /** Fill colour of the liquid, a CSS colour such as var(--liquid). */
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

const FUNNEL = { cx: 150, top: 34, shoulder: 214, hw: 84, neckHw: 22, stopY: 252 }
const FUNNEL_PATH = `M${FUNNEL.cx - FUNNEL.hw},${FUNNEL.top} H${FUNNEL.cx + FUNNEL.hw} L${FUNNEL.cx + FUNNEL.neckHw},${FUNNEL.shoulder} H${FUNNEL.cx - FUNNEL.neckHw} Z`
const BOUNDARY = 118
const LOWER_BOTTOM = FUNNEL.shoulder - 2

/** Half width of the funnel body at height y. */
function bodyHalf(y: number): number {
  return coneHalfWidth(y, FUNNEL.top, FUNNEL.hw, FUNNEL.shoulder, FUNNEL.neckHw)
}

/** Maps a unit random pair to a point inside the funnel between y0 and y1, keeping clear of the walls. */
function pointIn(y0: number, y1: number, ry: number, rx: number): { x: number; y: number } {
  const y = y0 + ry * (y1 - y0)
  const hw = Math.max(0, bodyHalf(y) - 6)
  return { x: FUNNEL.cx + (rx * 2 - 1) * hw, y }
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
      ? pointIn(FUNNEL.top + 8, boundaryTop - 4, rand(), rand())
      : pointIn(BOUNDARY + 4, LOWER_BOTTOM - 4, rand(), rand())
    // Settled dots in the lower layer are squeezed into the liquid that remains after draining.
    const squeezed = isTop
      ? settled
      : { x: settled.x, y: lowerSurface + ((settled.y - BOUNDARY) / (LOWER_BOTTOM - BOUNDARY)) * (LOWER_BOTTOM - lowerSurface) }
    const scatter = pointIn(FUNNEL.top + 8, LOWER_BOTTOM - 4, rand(), rand())
    const mix = mixAmount(s)
    dots.push({
      x: squeezed.x * (1 - mix) + scatter.x * mix,
      y: squeezed.y * (1 - mix) + scatter.y * mix,
    })
  }

  const topBoxY = FUNNEL.top
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Separating funnel with two layers'} {...rest}>
      <defs>
        <clipPath id={bodyClip}>
          <path d={FUNNEL_PATH} />
        </clipPath>
        <linearGradient id={mixGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={topLayer.color} />
          <stop offset="1" stopColor={lowerLayer.color} />
        </linearGradient>
      </defs>

      {/* Glass body */}
      <path d={FUNNEL_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${bodyClip})`}>
        <rect x={FUNNEL.cx - FUNNEL.hw} y={topBoxY} width={FUNNEL.hw * 2} height={boundaryTop - topBoxY} fill={topLayer.color} opacity={0.75} />
        {band > 0 && (
          <rect x={FUNNEL.cx - FUNNEL.hw} y={boundaryTop} width={FUNNEL.hw * 2} height={band} fill={`url(#${mixGrad})`} opacity={0.7} />
        )}
        <rect x={FUNNEL.cx - FUNNEL.hw} y={lowerSurface} width={FUNNEL.hw * 2} height={LOWER_BOTTOM - lowerSurface + 2} fill={lowerLayer.color} opacity={0.75} />
        {/* Surface lines so the separate layers read clearly at rest */}
        {band < 2 && <line x1={FUNNEL.cx - FUNNEL.hw} x2={FUNNEL.cx + FUNNEL.hw} y1={BOUNDARY} y2={BOUNDARY} stroke="var(--glass)" strokeWidth={1.4} />}
        {dots.map((dot, i) => (
          <Dot key={`sol-${i}`} x={dot.x} y={dot.y} r={3.4} fill={soluteColor} />
        ))}
      </g>
      <path d={FUNNEL_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.2} strokeLinejoin="round" />
      <line x1={FUNNEL.cx - FUNNEL.hw} x2={FUNNEL.cx + FUNNEL.hw} y1={FUNNEL.top} y2={FUNNEL.top} stroke="var(--glass)" strokeWidth={2.6} strokeLinecap="round" />

      {/* Stem and stopcock */}
      <rect x={FUNNEL.cx - 6} y={FUNNEL.shoulder - 1} width={12} height={FUNNEL.stopY - FUNNEL.shoulder} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.8} />
      <rect x={FUNNEL.cx - 12} y={FUNNEL.stopY - 4} width={24} height={10} rx={3} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
      <rect x={FUNNEL.cx - 17} y={FUNNEL.stopY - 1.5} width={34} height={5} rx={2.5} fill="var(--fg-muted)" transform={`rotate(${d > 0 ? 90 : 0} ${FUNNEL.cx} ${FUNNEL.stopY + 1})`} />

      {/* Drops leaving through the open stopcock */}
      {d > 0 &&
        [0, 1, 2].map((i) => {
          const t = (d * 2 + i / 3) % 1
          return <Dot key={`drop-${i}`} x={FUNNEL.cx} y={FUNNEL.stopY + 12 + t * 40} r={2.8} fill={lowerLayer.color} />
        })}

      {/* Layer names */}
      <Caption x={FUNNEL.cx + FUNNEL.hw + 12} y={80} anchor="start" size={15} fill="var(--fg)">
        {topLayer.label ?? topLayer.id}
      </Caption>
      <Caption x={FUNNEL.cx + FUNNEL.hw + 12} y={170} anchor="start" size={15} fill="var(--fg)">
        {lowerLayer.label ?? lowerLayer.id}
      </Caption>
      <Caption x={FUNNEL.cx + FUNNEL.hw + 12} y={262} anchor="start" size={14}>
        stopcock
      </Caption>
    </g>
  )
})
