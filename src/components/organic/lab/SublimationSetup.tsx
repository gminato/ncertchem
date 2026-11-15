import React, { forwardRef, useId } from 'react'
import { seededRandom } from './geometry'
import { Burner, Caption, Dot, FlameRow } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const SUBLIMATION_SETUP_SIZE = { width: 360, height: 312 } as const

const DISH = 'M70,226 Q80,262 180,262 Q280,262 290,226 Z'
const CONE = { mouthY: 200, mouthHalf: 92, stemY: 150, stemHalf: 14 }
const CRYSTAL_COUNT = 12
const POWDER_COUNT = 44

/** Half width of the funnel's cone at height y (between the mouth and the stem). */
function coneHalf(y: number): number {
  const t = Math.min(1, Math.max(0, (CONE.mouthY - y) / (CONE.mouthY - CONE.stemY)))
  return CONE.mouthHalf + (CONE.stemHalf - CONE.mouthHalf) * t
}

export interface SublimationSetupProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1. Solid sublimes off the dish and crystals grow on the cool funnel. */
  progress?: number
  /** Draws the burner under the dish. */
  heating?: boolean
  title?: string
  x?: number
  y?: number
}

/**
 * Sublimation: an impure solid in a china dish, heated under an inverted funnel with a cotton
 * plug. Pure solid vapour condenses as crystals on the cool funnel walls.
 */
export const SublimationSetup = forwardRef<SVGGElement, SublimationSetupProps>(function SublimationSetup(
  { progress = 0, heating = true, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const dishClip = `sub-dish-${uid}`
  const p = Math.min(1, Math.max(0, progress))

  // Powder left in the dish: about 40% of the solid has sublimed by progress 1.
  const rand = seededRandom(11)
  const powder = Array.from({ length: POWDER_COUNT }, () => ({ x: 100 + rand() * 160, y: 234 + rand() * 22 }))
  const powderShown = Math.round(POWDER_COUNT * (1 - 0.4 * p))

  // Crystals on the inner cone walls, growing and multiplying with progress.
  const crystalRand = seededRandom(29)
  const crystals = Array.from({ length: CRYSTAL_COUNT }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const cy = 194 - crystalRand() * 40
    const edge = coneHalf(cy) - 3
    const cx = 180 + side * edge * (0.45 + crystalRand() * 0.5)
    const size = (4.5 + crystalRand() * 4) * (0.5 + 0.5 * p)
    return { x: cx, y: cy, size }
  })
  const crystalsShown = Math.round(CRYSTAL_COUNT * p)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Sublimation of a solid under an inverted funnel'} {...rest}>
      <defs>
        <clipPath id={dishClip}>
          <path d={DISH} />
        </clipPath>
      </defs>

      {heating && (
        <g>
          <Burner x={132} y={276} width={96} height={10} />
          <FlameRow cx={180} y={306} width={70} count={4} />
          <Caption x={318} y={300} anchor="start">
            heat
          </Caption>
        </g>
      )}

      {/* China dish with the impure solid */}
      <path d={DISH} fill="var(--surface)" stroke="var(--glass)" strokeWidth={2} />
      <g clipPath={`url(#${dishClip})`}>
        <rect x={60} y={240} width={240} height={30} fill="var(--precipitate)" opacity={0.35} />
      </g>
      {powder.slice(0, powderShown).map((d, i) => (
        <Dot key={`pw-${i}`} x={d.x} y={d.y} r={2.6} fill="var(--precipitate)" />
      ))}
      <ellipse cx={180} cy={226} rx={110} ry={6} fill="none" stroke="var(--glass)" strokeWidth={1.4} />
      <Caption x={330} y={250} size={14}>
        solid
      </Caption>

      {/* Inverted funnel, cotton plug and cool walls */}
      <path
        d={`M88,${CONE.mouthY} L166,${CONE.stemY} V58 H194 V${CONE.stemY} L272,${CONE.mouthY} Z`}
        fill="var(--glass-fill)"
        stroke="var(--glass)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <ellipse cx={180} cy={CONE.mouthY} rx={CONE.mouthHalf} ry={7} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} />
      <rect x={164} y={34} width={32} height={22} rx={6} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.4} />
      <Caption x={206} y={44} anchor="start">
        cotton plug
      </Caption>
      <Caption x={66} y={176} anchor="end">
        crystals
      </Caption>

      {/* Crystals that have sublimed and re-condensed on the funnel */}
      {crystals.slice(0, crystalsShown).map((c, i) => (
        <path
          key={`cr-${i}`}
          d={`M${c.x},${c.y - c.size} L${c.x + c.size * 0.7},${c.y} L${c.x},${c.y + c.size} L${c.x - c.size * 0.7},${c.y} Z`}
          fill="var(--precipitate)"
          stroke="var(--glass)"
          strokeWidth={0.8}
        />
      ))}
    </g>
  )
})
