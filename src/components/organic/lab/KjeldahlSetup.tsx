import React, { forwardRef, useId } from 'react'
import { liquidSurfaceY, seededRandom } from './geometry'
import { Burner, Caption, Dot, GlassTube } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const KJELDAHL_SETUP_SIZE = { width: 360, height: 300 } as const

export type KjeldahlStage = 'digest' | 'distil' | 'titrate'

export interface KjeldahlSetupProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /**
   * 'digest': the sample is boiled with conc. H₂SO₄ in the Kjeldahl flask until the solution clears.
   * 'distil': alkali is added and NH₃ is distilled into a known volume of standard acid.
   * 'titrate': the excess acid in the receiver is titrated with standard alkali from the burette.
   */
  stage?: KjeldahlStage
  /** 0 to 1. Drives the fumes in 'digest' and the distillate in 'distil'. */
  progress?: number
  /** Burette delivery in mL, 0 to 25. Only used in 'titrate'. */
  titrantMl?: number
  /** Whether the end point has been reached. Changes the receiver colour. */
  endPoint?: boolean
  /** Colour of the digestion mixture in the flask. */
  mixtureColor?: string
  /** Colour of the receiver before the end point (excess acid with indicator). */
  startTint?: string
  /** Colour of the receiver at the end point. */
  endTint?: string
  title?: string
  x?: number
  y?: number
}

const FLASK = { cx: 70, cy: 226, r: 36, neck: 10 }
const FLASK_PATH = `M${FLASK.cx - FLASK.neck},96 V191.4 A${FLASK.r},${FLASK.r} 0 1 0 ${FLASK.cx + FLASK.neck},191.4 V96 Z`
const RECEIVER = { cx: 278, neckTop: 196, neckBottom: 214, bottomY: 268, halfBottom: 40 }
const RECEIVER_PATH = `M${RECEIVER.cx - 8},${RECEIVER.neckTop} V${RECEIVER.neckBottom} L${RECEIVER.cx - RECEIVER.halfBottom},${RECEIVER.bottomY} Q${RECEIVER.cx - RECEIVER.halfBottom - 4},${RECEIVER.bottomY + 6} ${RECEIVER.cx - RECEIVER.halfBottom + 6},${RECEIVER.bottomY + 6} H${RECEIVER.cx + RECEIVER.halfBottom - 6} Q${RECEIVER.cx + RECEIVER.halfBottom + 4},${RECEIVER.bottomY + 6} ${RECEIVER.cx + RECEIVER.halfBottom},${RECEIVER.bottomY} L${RECEIVER.cx + 8},${RECEIVER.neckBottom} V${RECEIVER.neckTop} Z`
const ROUTE = 'M70,96 H150 V240 H256'
const BURETTE = { x: 278, top: 40, bottom: 164, tipY: 182 }

const CAPTION: Record<KjeldahlStage, string> = {
  digest: 'Digest the sample with conc. H₂SO₄ until the solution clears',
  distil: 'Add alkali and distil NH₃ into standard acid',
  titrate: 'Titrate the excess acid with standard alkali',
}

/**
 * Kjeldahl's method for nitrogen: digestion, distillation of ammonia into a known volume of
 * standard acid, then back-titration of the acid left over. Liquid levels, the burette and the
 * end-point colour are all props.
 */
export const KjeldahlSetup = forwardRef<SVGGElement, KjeldahlSetupProps>(function KjeldahlSetup(
  {
    stage = 'digest',
    progress = 0,
    titrantMl = 0,
    endPoint = false,
    mixtureColor = 'var(--no2)',
    startTint = 'var(--ph-0)',
    endTint = 'var(--ph-8)',
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const flaskClip = `kj-flask-${uid}`
  const receiverClip = `kj-recv-${uid}`
  const rand = seededRandom(31)

  const p = Math.min(1, Math.max(0, progress))
  const delivered = Math.min(25, Math.max(0, titrantMl))
  const buretteSurface = BURETTE.top + (delivered / 25) * (BURETTE.bottom - BURETTE.top)
  const flaskSurface = 206
  const receiverSurface = liquidSurfaceY(0.42, RECEIVER.neckBottom, RECEIVER.bottomY + 4)
  const receiverColour = endPoint ? endTint : startTint
  const distilling = stage === 'distil'

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Kjeldahl setup for nitrogen'} {...rest}>
      <defs>
        <clipPath id={flaskClip}>
          <path d={FLASK_PATH} />
        </clipPath>
        <clipPath id={receiverClip}>
          <path d={RECEIVER_PATH} />
        </clipPath>
      </defs>

      {/* Heater under the Kjeldahl flask */}
      <Burner x={34} y={262} width={72} height={10} />

      {/* Kjeldahl flask with its digestion mixture */}
      <path d={FLASK_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${flaskClip})`}>
        <rect x={FLASK.cx - FLASK.r - 2} y={flaskSurface} width={FLASK.r * 2 + 4} height={300} fill={mixtureColor} opacity={0.75} />
      </g>
      <path d={FLASK_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.2} strokeLinejoin="round" />
      <Caption x={FLASK.cx} y={20} size={14}>
        sample + H₂SO₄
      </Caption>

      {/* Fumes at the neck during digestion */}
      {stage === 'digest' &&
        Array.from({ length: 4 }, (_, i) => {
          const t = (p + i / 4) % 1
          return <Dot key={`fume-${i}`} x={FLASK.cx + (rand() - 0.5) * 8} y={92 - t * 40} r={3 + t * 2} fill="var(--vapour)" />
        })}

      {/* Delivery route, with the distillate moving along it during distillation */}
      <GlassTube d={ROUTE} width={8} />
      {distilling && (
        <path d={ROUTE} fill="none" stroke="var(--vapour)" strokeWidth={5} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" />
      )}

      {/* Conical receiver with standard acid and indicator */}
      <path d={RECEIVER_PATH} fill="var(--glass-fill)" />
      <g clipPath={`url(#${receiverClip})`}>
        <rect x={RECEIVER.cx - 60} y={receiverSurface} width={120} height={RECEIVER.bottomY + 12 - receiverSurface} fill={receiverColour} opacity={0.8} />
      </g>
      <path d={RECEIVER_PATH} fill="none" stroke="var(--glass)" strokeWidth={2.2} strokeLinejoin="round" />
      <Caption x={RECEIVER.cx - 46} y={RECEIVER.bottomY - 4} anchor="end" size={14}>
        std. acid
      </Caption>

      {/* Burette with titrant, delivering into the receiver */}
      <GlassTube d={`M${BURETTE.x},${BURETTE.top} V${BURETTE.bottom}`} width={10} />
      <rect x={BURETTE.x - 4} y={buretteSurface} width={8} height={BURETTE.bottom - buretteSurface} fill="var(--liquid)" />
      <rect x={BURETTE.x - 7} y={BURETTE.bottom} width={14} height={6} rx={2} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.2} />
      <line x1={BURETTE.x} x2={BURETTE.x} y1={BURETTE.bottom + 6} y2={BURETTE.tipY} stroke="var(--glass)" strokeWidth={2.4} />
      {stage === 'titrate' && delivered > 0 && <Dot x={BURETTE.x} y={BURETTE.tipY + 6} r={2.6} fill="var(--liquid-edge)" />}
      <Caption x={BURETTE.x + 14} y={BURETTE.top + 6} anchor="start" size={14}>
        NaOH
      </Caption>

      <Caption x={180} y={288} size={14} fill="var(--fg-muted)">
        {CAPTION[stage]}
      </Caption>
    </g>
  )
})
