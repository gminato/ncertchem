import React, { forwardRef, useId } from 'react'
import { liquidSurfaceY, seededRandom } from './geometry'
import { Caption } from './primitives'

/** Size of one test tube, origin at the top centre of the tube. */
export const TEST_TUBE_SIZE = { width: 28, height: 150 } as const

export interface TestTubePrecipitate {
  /** Colour of the solid, e.g. var(--agcl-white). */
  color: string
  /** 0 to 1: how much solid forms. */
  amount: number
  /** Adds a thin outline, needed for white and pale solids on a light page. */
  outline?: boolean
}

export interface TestTubeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Colour of the solution. Use a colour token such as var(--blood-red). */
  liquid?: string
  /** Fill height of the solution, 0 to 1. */
  liquidLevel?: number
  /** Solid formed in the tube. It is a cloud at progress 0 and settles to the bottom at progress 1. */
  precipitate?: TestTubePrecipitate
  /** 0 to 1: how far the precipitate has settled. */
  progress?: number
  /** Gas bubbles rising through the liquid. */
  bubbles?: number
  /** Label drawn under the tube (standalone use). Racks draw their own labels. */
  label?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

const TUBE = { w: 28, h: 150, top: 0, bottom: 148, r: 14 }
const TUBE_PATH = `M${-TUBE.w / 2},${TUBE.top} V${TUBE.h - TUBE.r} A${TUBE.r},${TUBE.r} 0 0 0 ${TUBE.w / 2},${TUBE.h - TUBE.r} V${TUBE.top} Z`
const MAX_SOLID = 46

/**
 * A test tube with a coloured solution, an optional precipitate that settles with `progress`,
 * and optional gas bubbles. Origin is at the top centre of the tube.
 */
export const TestTube = forwardRef<SVGGElement, TestTubeProps>(function TestTube(
  { liquid = 'var(--liquid)', liquidLevel = 0.62, precipitate, progress = 0, bubbles = 0, label, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const clip = `tt-${uid}`
  const p = Math.min(1, Math.max(0, progress))
  const surface = liquidSurfaceY(liquidLevel, TUBE.top + 22, TUBE.bottom)
  const amount = Math.min(1, Math.max(0, precipitate?.amount ?? 0))
  const solidH = amount * MAX_SOLID
  const rand = seededRandom(13 + Math.round(amount * 100))

  // A cloud fills the liquid at progress 0 and collapses onto the bottom at progress 1.
  const cloudTop = surface + 4
  const settledTop = TUBE.bottom - solidH
  const solidTop = cloudTop + (settledTop - cloudTop) * p
  const solidBottom = TUBE.bottom - 1
  const solidOpacity = 0.45 + 0.5 * p

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Test tube'} {...rest}>
      <defs>
        <clipPath id={clip}>
          <path d={TUBE_PATH} />
        </clipPath>
      </defs>

      <path d={TUBE_PATH} fill="var(--glass-fill)" />

      <g clipPath={`url(#${clip})`}>
        <rect x={-TUBE.w / 2} y={surface} width={TUBE.w} height={TUBE.bottom + 2 - surface} fill={liquid} opacity={0.85} />
        <line x1={-TUBE.w / 2} x2={TUBE.w / 2} y1={surface} y2={surface} stroke="var(--liquid-edge)" strokeWidth={1.2} />

        {amount > 0 && (
          <rect
            x={-TUBE.w / 2}
            y={solidTop}
            width={TUBE.w}
            height={Math.max(0, solidBottom - solidTop)}
            fill={precipitate?.color}
            opacity={solidOpacity}
            stroke={precipitate?.outline ? 'var(--fg-subtle)' : 'none'}
            strokeWidth={precipitate?.outline ? 0.6 : 0}
          />
        )}

        {Array.from({ length: bubbles }, (_, i) => {
          const bx = (rand() - 0.5) * (TUBE.w - 10)
          const t = (p + i / Math.max(1, bubbles)) % 1
          const by = TUBE.bottom - 10 - t * (TUBE.bottom - 10 - surface)
          return <circle key={`b-${i}`} cx={bx} cy={by} r={2.2} fill="none" stroke="var(--surface)" strokeWidth={1.2} opacity={0.9} />
        })}
      </g>

      <path d={TUBE_PATH} fill="none" stroke="var(--glass)" strokeWidth={1.8} strokeLinejoin="round" />
      <line x1={-TUBE.w / 2 - 2} x2={TUBE.w / 2 + 2} y1={TUBE.top} y2={TUBE.top} stroke="var(--glass)" strokeWidth={2.4} strokeLinecap="round" />

      {label && (
        <Caption x={0} y={TUBE.h + 18} size={15} fill="var(--fg)">
          {label}
        </Caption>
      )}
    </g>
  )
})
