import React, { forwardRef, useId } from 'react'
import { seededRandom } from './geometry'
import { Caption, Dot, FlameRow } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const FUSION_TUBE_SIZE = { width: 340, height: 300 } as const

export type FusionStage = 'sample' | 'fuse' | 'plunge' | 'extract'

export interface FusionTubeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /**
   * 'sample': sodium pellet and the compound in the ignition tube.
   * 'fuse': the tube is heated in the flame until the mixture glows and fuses.
   * 'plunge': the hot tube is dropped into water in a china dish, with a sharp crack of steam.
   * 'extract': the sodium fusion extract (the solution) is filtered and tested.
   */
  stage?: FusionStage
  /** 0 to 1. Drives the glow in 'fuse' and the steam in 'plunge'. */
  progress?: number
  /** Colour of the extract in the dish during 'extract'. */
  extractColor?: string
  title?: string
  x?: number
  y?: number
}

const TUBE = { cx: 110, top: 40, bottom: 226, w: 16 }
const DISH = { cx: 250, cy: 252, rx: 74, top: 246 }
const DISH_PATH = `M${DISH.cx - DISH.rx},${DISH.top} Q${DISH.cx - DISH.rx + 8},${DISH.cy + 22} ${DISH.cx},${DISH.cy + 22} Q${DISH.cx + DISH.rx - 8},${DISH.cy + 22} ${DISH.cx + DISH.rx},${DISH.top} Z`

const CAPTION: Record<FusionStage, string> = {
  sample: 'Sodium pellet and compound in the ignition tube',
  fuse: 'Heat until the mixture glows and fuses',
  plunge: 'Plunge the hot tube into water in a china dish',
  extract: 'Filter the extract and test it',
}

/**
 * Lassaigne's sodium fusion. The organic compound is fused with a sodium pellet in an ignition
 * tube, then the hot tube is plunged into water and the solution is tested.
 */
export const FusionTube = forwardRef<SVGGElement, FusionTubeProps>(function FusionTube(
  { stage = 'sample', progress = 0, extractColor = 'var(--liquid)', title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const dishClip = `ft-dish-${uid}`
  const p = Math.min(1, Math.max(0, progress))
  const rand = seededRandom(23)

  const heated = stage === 'fuse'
  const plunged = stage === 'plunge'
  const tubeTransform = plunged ? 'translate(140, 22)' : undefined
  const tubeX = TUBE.cx - TUBE.w / 2
  const tubeH = TUBE.bottom - TUBE.top
  const glowOpacity = heated ? 0.25 + 0.5 * p : 0

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Sodium fusion in an ignition tube'} {...rest}>
      <defs>
        <clipPath id={dishClip}>
          <path d={DISH_PATH} />
        </clipPath>
      </defs>

      {/* Flame under the tube, larger when fusing */}
      {(heated || stage === 'sample') && (
        <g opacity={stage === 'sample' ? 0.35 : 1}>
          <FlameRow cx={TUBE.cx} y={256} width={heated ? 44 : 30} count={3} />
        </g>
      )}

      {/* China dish with water, used for plunging and the extract */}
      {(plunged || stage === 'extract') && (
        <g>
          <path d={DISH_PATH} fill="var(--surface)" stroke="var(--glass)" strokeWidth={2} />
          <g clipPath={`url(#${dishClip})`}>
            <rect x={DISH.cx - DISH.rx} y={stage === 'extract' ? DISH.top + 4 : DISH.top + 4} width={DISH.rx * 2} height={30} fill={stage === 'extract' ? extractColor : 'var(--liquid)'} opacity={0.7} />
          </g>
          <ellipse cx={DISH.cx} cy={DISH.top} rx={DISH.rx} ry={4} fill="none" stroke="var(--glass)" strokeWidth={1.4} />
        </g>
      )}

      {/* Steam puffs when the tube meets the water */}
      {plunged &&
        Array.from({ length: 4 }, (_, i) => {
          const t = (p + i / 4) % 1
          const sx = TUBE.cx + 30 + (rand() - 0.5) * 20
          return <Dot key={`st-${i}`} x={sx + 14} y={230 - t * 56} r={3 + t * 2} fill="var(--vapour)" />
        })}

      {/* The ignition tube (hidden during extraction) */}
      {stage !== 'extract' && (
        <g transform={tubeTransform}>
          <rect x={tubeX} y={TUBE.top} width={TUBE.w} height={tubeH} rx={TUBE.w / 2} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} />
          <rect x={tubeX + 3} y={TUBE.top + 2} width={TUBE.w - 6} height={tubeH - 4} rx={5} fill="none" stroke="var(--glass)" strokeWidth={0.8} opacity={0.5} />
          {/* Compound and sodium at the bottom */}
          <rect x={tubeX + 2} y={TUBE.bottom - 36} width={TUBE.w - 4} height={34} rx={4} fill="var(--precipitate)" opacity={stage === 'fuse' ? 0.4 + 0.5 * p : 0.85} />
          <ellipse cx={TUBE.cx} cy={TUBE.bottom - 6} rx={5.5} ry={3.5} fill="var(--metal-ag)" stroke="var(--glass)" strokeWidth={0.8} />
          {glowOpacity > 0 && (
            <rect x={tubeX + 2} y={TUBE.bottom - 36} width={TUBE.w - 4} height={34} rx={4} fill="var(--flame)" opacity={glowOpacity} />
          )}
        </g>
      )}

      {/* Labels for the parts that matter */}
      {stage === 'sample' && (
        <g>
          <Caption x={TUBE.cx - 36} y={186} anchor="end">
            compound
          </Caption>
          <Caption x={TUBE.cx - 36} y={214} anchor="end">
            Na pellet
          </Caption>
        </g>
      )}
      {stage === 'extract' && (
        <Caption x={DISH.cx} y={DISH.cy + 42} size={15} fill="var(--fg)">
          extract
        </Caption>
      )}

      <Caption x={170} y={288} size={14} fill="var(--fg-muted)">
        {CAPTION[stage]}
      </Caption>
    </g>
  )
})
