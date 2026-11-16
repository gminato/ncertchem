import React, { forwardRef } from 'react'
import { Caption, GlassTube } from './primitives'
import { seededRandom } from './geometry'
import { unitClamp } from '../hydrocarbon-geometry'

/** Size of the carbide generator, for a parent viewBox. */
export const CARBIDE_GENERATOR_SIZE = { width: 380, height: 330 } as const

export interface CarbideGeneratorProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1: water drips from the funnel into the carbide and ethyne bubbles out through the delivery tube. */
  progress?: number
  x?: number
  y?: number
}

const FLASK = { cx: 120, neck: 86, bulbTop: 150, bottom: 262, bulbR: 66 }
const DRIP_X = FLASK.cx
const DRIP_Y = 58
const SURFACE_Y = 216
const TRAY_X = 302

/**
 * Ethyne from calcium carbide: a flask of CaC₂ lumps, water dripping from a dropping funnel, and
 * ethyne bubbling out of the delivery tube into water. The equation is written below.
 */
export const CarbideGenerator = forwardRef<SVGGElement, CarbideGeneratorProps>(function CarbideGenerator(
  { progress = 0, x = 0, y = 0, ...rest },
  ref
) {
  const p = unitClamp(progress)
  const rand = seededRandom(7)
  const lumps = Array.from({ length: 9 }, () => ({ x: FLASK.cx + (rand() - 0.5) * 84, y: 226 + rand() * 22, r: 6 + rand() * 5 }))
  const drops = Array.from({ length: 3 }, (_, i) => {
    const t = (p * 3 + i / 3) % 1
    return { cx: DRIP_X, cy: DRIP_Y + 18 + t * (SURFACE_Y - DRIP_Y - 26), o: p > 0 ? 1 : 0 }
  })
  const bubbles = Array.from({ length: 6 }, (_, i) => {
    const t = (p * 2 + i / 6) % 1
    return { cx: TRAY_X - 16 + (i % 3) * 16, cy: 268 - t * 92, o: p > 0 ? 0.9 : 0 }
  })
  const deliveryY = 120
  const tube = `M${FLASK.cx + 16},${FLASK.neck + 6} L${FLASK.cx + 16},${deliveryY} L${TRAY_X - 12},${deliveryY} L${TRAY_X - 12},236`
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Dropping funnel */}
      <path d={`M${DRIP_X - 34},${DRIP_Y - 26} L${DRIP_X + 34},${DRIP_Y - 26} L${DRIP_X + 8},${DRIP_Y + 8} L${DRIP_X + 8},${DRIP_Y + 18} L${DRIP_X - 8},${DRIP_Y + 18} L${DRIP_X - 8},${DRIP_Y + 8} Z`} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} strokeLinejoin="round" />
      <line x1={DRIP_X - 34} x2={DRIP_X + 34} y1={DRIP_Y - 26} y2={DRIP_Y - 26} stroke="var(--glass)" strokeWidth={3} strokeLinecap="round" />
      <Caption x={DRIP_X + 58} y={DRIP_Y - 12} anchor="start" size={16} fill="var(--fg)">
        H₂O
      </Caption>

      {/* Flask: a round bottom with a neck, containing the carbide and the water level */}
      <path
        d={`M${FLASK.cx - 16},${FLASK.neck} L${FLASK.cx - 16},${FLASK.bulbTop - 40} C${FLASK.cx - 16},${FLASK.bulbTop - 6} ${FLASK.cx - FLASK.bulbR},${FLASK.bulbTop - 6} ${FLASK.cx - FLASK.bulbR},${FLASK.bulbTop + 40} C${FLASK.cx - FLASK.bulbR},${FLASK.bottom - 6} ${FLASK.cx - 40},${FLASK.bottom} ${FLASK.cx},${FLASK.bottom} C${FLASK.cx + 40},${FLASK.bottom} ${FLASK.cx + FLASK.bulbR},${FLASK.bottom - 6} ${FLASK.cx + FLASK.bulbR},${FLASK.bulbTop + 40} C${FLASK.cx + FLASK.bulbR},${FLASK.bulbTop - 6} ${FLASK.cx + 16},${FLASK.bulbTop - 6} ${FLASK.cx + 16},${FLASK.bulbTop - 40} L${FLASK.cx + 16},${FLASK.neck}`}
        fill="var(--glass-fill)"
        stroke="var(--glass)"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {lumps.map((l, i) => (
        <circle key={`lump-${i}`} cx={l.x} cy={l.y} r={l.r} fill="var(--agcl-white)" stroke="var(--fg-subtle)" strokeWidth={1} />
      ))}
      <Caption x={FLASK.cx + 84} y={FLASK.bottom - 10} size={16} fill="var(--fg)">
        CaC₂
      </Caption>

      {/* Water drops falling onto the carbide */}
      {drops.map((d, i) => (
        <circle key={`drop-${i}`} cx={d.cx} cy={d.cy} r={3.6} fill="var(--energy-curve)" opacity={d.o * 0.8} />
      ))}

      {/* Delivery tube from the neck, across and down into the water trough */}
      <GlassTube d={tube} width={6} />

      {/* Trough of water with an inverted gas jar */}
      <rect x={TRAY_X - 50} y={236} width={100} height={70} rx={4} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.4} />
      <path d={`M${TRAY_X - 50},${236} L${TRAY_X + 50},${236}`} stroke="var(--liquid-edge)" strokeWidth={1.4} />
      <path d={`M${TRAY_X - 26},${150} L${TRAY_X - 26},${236} M${TRAY_X + 26},${150} L${TRAY_X + 26},${236}`} stroke="var(--glass)" strokeWidth={2} fill="none" />
      <path d={`M${TRAY_X - 26},${150} L${TRAY_X + 26},${150}`} stroke="var(--glass)" strokeWidth={2} />
      {bubbles.map((b, i) => (
        <circle key={`bub-${i}`} cx={b.cx} cy={b.cy} r={3.2} fill="none" stroke="var(--surface)" strokeWidth={1.4} opacity={b.o} />
      ))}
      <Caption x={TRAY_X + 34} y={164} anchor="start" size={16} fill="var(--fg)">
        C₂H₂
      </Caption>

      {/* Equation */}
      <Caption x={CARBIDE_GENERATOR_SIZE.width / 2} y={CARBIDE_GENERATOR_SIZE.height - 14} size={17} fill="var(--fg)">
        CaC₂ + 2H₂O → C₂H₂ + Ca(OH)₂
      </Caption>
    </g>
  )
})
