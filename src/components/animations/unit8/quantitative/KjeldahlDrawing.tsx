import { Caption, GlassTube } from '@/components/organic/lab/primitives'

/** Native size of the drawing. Parents scale it with a transform. */
export const KJELDAHL_DRAWING_SIZE = { width: 360, height: 300 } as const

export interface KjeldahlDrawingProps {
  /** Burette delivery in mL, 0 to 25. */
  titrantMl: number
  /** True once the indicator has changed colour at the end point. */
  endPoint: boolean
  title?: string
}

/** Flask of the digest or distillate, centre and radius (native units). */
const FLASK = { cx: 70, cy: 190, r: 40, neck: 9 }
const FLASK_PATH = `M${FLASK.cx - FLASK.neck},40 V151 A${FLASK.r},${FLASK.r} 0 1 0 ${FLASK.cx + FLASK.neck},151 V40`
/** Liquid in the flask below y = 160: where the circle meets y = 160. */
const FLASK_LIQUID = 'M43.5,160 L96.5,160 A40,40 0 1 1 43.5,160 Z'
/** Receiver, a conical flask at the right: neck x 254 to 266, base x 222 to 298 at y 262. */
const RECEIVER_PATH = 'M254,175 V205 L222,262 H298 L266,205 V175 Z'
const RECEIVER_LIQUID = 'M236.6,236 H283.4 L298,262 H222 Z'
const BURETTE = { x: 300, top: 30, bottom: 150, tip: 158 }
const BURETTE_MAX_ML = 25

/**
 * Kjeldahl's back-titration: the flask holding the digest, the distillate running into the
 * receiver, and the burette of standard alkali above the receiver. The label of the flask sits
 * directly under it. The receiver changes colour at the end point.
 */
export function KjeldahlDrawing({ titrantMl, endPoint, title }: KjeldahlDrawingProps) {
  const delivered = Math.min(BURETTE_MAX_ML, Math.max(0, titrantMl))
  const level = BURETTE.top + (delivered / BURETTE_MAX_ML) * (BURETTE.bottom - BURETTE.top)
  const receiverTint = endPoint ? 'var(--ph-8)' : 'var(--ph-0)'

  return (
    <g role="img" aria-label={title ?? 'Kjeldahl back-titration'}>
      {/* Flask holding the digest, with its label under it */}
      <path d={FLASK_PATH} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={3} strokeLinejoin="round" />
      <path d={FLASK_LIQUID} fill="var(--liquid)" opacity={0.85} />
      <Caption x={FLASK.cx} y={256} size={15} fill="var(--fg)">
        sample + H₂SO₄
      </Caption>

      {/* Delivery tube from the flask neck into the receiver neck */}
      <GlassTube d="M70,40 H260 V172" width={8} />

      {/* Receiver with its indicator liquid */}
      <path d={RECEIVER_PATH} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={3} strokeLinejoin="round" />
      <path d={RECEIVER_LIQUID} fill={receiverTint} opacity={0.8} style={{ transition: 'fill 300ms ease' }} />
      <Caption x={260} y={290} size={15} fill="var(--fg)">
        standard acid
      </Caption>

      {/* Burette of standard alkali */}
      <rect x={BURETTE.x - 6} y={BURETTE.top} width={12} height={BURETTE.bottom - BURETTE.top} rx={3} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.6} />
      <rect x={BURETTE.x - 4.5} y={level} width={9} height={BURETTE.bottom - level} fill="var(--liquid)" opacity={0.7} />
      <line x1={BURETTE.x} y1={BURETTE.bottom} x2={BURETTE.x} y2={BURETTE.tip} stroke="var(--glass)" strokeWidth={2} />
      {delivered > 0 && !endPoint && <circle cx={BURETTE.x} cy={BURETTE.tip + 14} r={3.2} fill="var(--liquid-edge, var(--coolant))" />}
      <Caption x={BURETTE.x} y={22} size={15} fill="var(--fg)">
        NaOH
      </Caption>
      <Caption x={BURETTE.x} y={176} size={14} fill="var(--fg-muted)">
        {delivered.toFixed(2)} mL
      </Caption>
    </g>
  )
}
