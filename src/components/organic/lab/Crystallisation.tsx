import React, { forwardRef, useId } from 'react'
import { liquidSurfaceY, seededRandom } from './geometry'
import { Caption, Dot } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const CRYSTALLISATION_SIZE = { width: 360, height: 320 } as const

export type CrystallisationStage = 'cooling' | 'filtration'

export interface CrystallisationProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 'cooling': hot saturated solution in a beaker. 'filtration': the cooled crystals are filtered off. */
  stage?: CrystallisationStage
  /**
   * In 'cooling', how far the crystals have grown (0 to 1).
   * In 'filtration', how much filtrate has collected in the flask (0 to 1).
   */
  progress?: number
  /** Solution colour. Hot saturated solutions are shown in the same colour as the cold ones. */
  solutionColor?: string
  /** Solution temperature in °C, shown while cooling. */
  temperature?: number
  title?: string
  x?: number
  y?: number
}

const BEAKER = { x0: 70, x1: 230, top: 96, bottom: 292 }
const BEAKER_PATH = `M${BEAKER.x0},${BEAKER.top} V282 Q${BEAKER.x0},${BEAKER.bottom} 80,${BEAKER.bottom} H220 Q${BEAKER.x1},${BEAKER.bottom} ${BEAKER.x1},282 V${BEAKER.top}`
const FUNNEL_PATH = 'M120,60 L172,170 V200 H188 V170 L240,60 Z'
const PAPER_PATH = 'M126,66 L177,180 H183 L234,66 Z'
const FLASK = { neckX0: 166, neckX1: 194, neckTop: 236, bodyTop: 252, bottom: 308 }
const FLASK_PATH = `M${FLASK.neckX0},${FLASK.neckTop} V${FLASK.bodyTop} L120,300 Q114,${FLASK.bottom} 124,${FLASK.bottom} H236 Q246,${FLASK.bottom} 240,300 L${FLASK.neckX1},${FLASK.bodyTop} V${FLASK.neckTop} Z`

function diamond(cx: number, cy: number, s: number): string {
  return `M${cx},${cy - s} L${cx + s * 0.75},${cy} L${cx},${cy + s} L${cx - s * 0.75},${cy} Z`
}

/**
 * Recrystallisation in two stages. Cooling grows crystals in a beaker as the solution
 * gives up solute. Filtration separates them on filter paper and collects the filtrate.
 */
export const Crystallisation = forwardRef<SVGGElement, CrystallisationProps>(function Crystallisation(
  { stage = 'cooling', progress = 0, solutionColor = 'var(--cuso4-blue)', temperature = 60, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const beakerClip = `cr-beaker-${uid}`
  const flaskClip = `cr-flask-${uid}`
  const p = Math.min(1, Math.max(0, progress))

  if (stage === 'cooling') {
    const surface = liquidSurfaceY(0.72, BEAKER.top + 14, BEAKER.bottom - 4)
    const rand = seededRandom(5)
    const crystals = Array.from({ length: 9 }, (_, i) => ({
      x: 102 + (i % 3) * 30 + rand() * 10 + (i > 5 ? 8 : 0),
      y: 270 + (i % 2) * 4 + rand() * 6,
      s: (4 + rand() * 6) * (0.15 + 0.85 * p),
    }))
    const hot = temperature > 40

    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Hot saturated solution cooling in a beaker, with crystals growing'} {...rest}>
        <defs>
          <clipPath id={beakerClip}>
            <path d={BEAKER_PATH} />
          </clipPath>
        </defs>

        {/* Steam from the hot solution */}
        {hot && (
          <g fill="none" stroke="var(--heat)" strokeWidth={1.8} strokeLinecap="round" opacity={0.55}>
            <path d="M120,84 C112,74 126,66 118,56" />
            <path d="M146,84 C138,72 152,64 144,52" />
          </g>
        )}

        <path d={BEAKER_PATH} fill="var(--glass-fill)" />
        <g clipPath={`url(#${beakerClip})`}>
          <rect x={BEAKER.x0} y={surface} width={BEAKER.x1 - BEAKER.x0} height={BEAKER.bottom - surface} fill={solutionColor} opacity={0.3} />
          <rect x={BEAKER.x0} y={surface} width={BEAKER.x1 - BEAKER.x0} height={3} fill="var(--liquid-edge)" />
        </g>
        <path d={BEAKER_PATH} fill="none" stroke="var(--glass)" strokeWidth={2} strokeLinejoin="round" />

        {/* Crystals on the floor of the beaker */}
        {crystals.map((c, i) => (
          <path key={`cr-${i}`} d={diamond(c.x, c.y, c.s)} fill={solutionColor} stroke="var(--glass)" strokeWidth={0.8} opacity={0.95} />
        ))}

        <Caption x={250} y={106} anchor="start" size={15} fill="var(--fg)">
          {`${temperature} °C`}
        </Caption>
        <Caption x={250} y={126} anchor="start" size={14}>
          cooling
        </Caption>
      </g>
    )
  }

  // Filtration: funnel with filter paper, the crystal cake and the filtrate below.
  const rand = seededRandom(17)
  const cake = Array.from({ length: 16 }, () => ({ x: 140 + rand() * 80, y: 100 + rand() * 60, s: 2.8 + rand() * 2.2 }))
  const level = p * 0.6
  const surface = liquidSurfaceY(level, FLASK.bodyTop + 6, FLASK.bottom - 4)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Filtering crystals from the solution through filter paper'} {...rest}>
      <defs>
        <clipPath id={flaskClip}>
          <path d={FLASK_PATH} />
        </clipPath>
      </defs>

      {/* Funnel and filter paper */}
      <path d={FUNNEL_PATH} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} strokeLinejoin="round" />
      <line x1={120} x2={240} y1={60} y2={60} stroke="var(--glass)" strokeWidth={2.4} strokeLinecap="round" />
      <path d={PAPER_PATH} fill="var(--surface)" stroke="var(--fg-subtle)" strokeWidth={1.2} strokeLinejoin="round" />
      {cake.map((c, i) => (
        <path key={`ck-${i}`} d={diamond(c.x, c.y, c.s)} fill="var(--cuso4-blue)" opacity={0.85} />
      ))}

      {/* Drops of filtrate falling from the stem */}
      {p > 0 &&
        [0, 1].map((i) => {
          const t = (p * 2 + i / 2) % 1
          return <Dot key={`dp-${i}`} x={180} y={204 + t * (surface - 204)} r={2.6} fill="var(--liquid-edge)" />
        })}

      {/* Conical flask collecting the filtrate */}
      <path d={FLASK_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${flaskClip})`}>
        <rect x={110} y={surface} width={140} height={FLASK.bottom - surface} fill="var(--liquid)" />
      </g>
      <path d={FLASK_PATH} fill="none" stroke="var(--glass)" strokeWidth={2} strokeLinejoin="round" />

      <Caption x={100} y={94} anchor="end">
        filter paper
      </Caption>
      <Caption x={252} y={180} anchor="start" size={14}>
        crystals
      </Caption>
      <Caption x={252} y={284} anchor="start" size={14}>
        filtrate
      </Caption>
    </g>
  )
})
