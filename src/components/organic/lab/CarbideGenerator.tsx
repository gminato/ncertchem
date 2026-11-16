import React, { forwardRef } from 'react'
import { Caption, GlassTube } from './primitives'
import { seededRandom } from './geometry'
import { unitClamp } from '../hydrocarbon-geometry'

/** Size of the carbide generator, for a parent viewBox. */
export const CARBIDE_GENERATOR_SIZE = { width: 420, height: 340 } as const

export interface CarbideGeneratorProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1: water drips from the funnel onto the carbide; ethyne displaces the water from the gas jar. */
  progress?: number
  x?: number
  y?: number
}

/** The flask: a round bottom with a neck, closed by a stopper that the funnel stem passes through. */
const FLASK = { cx: 130, neckTop: 128, neckHalf: 16, bulbTop: 150, bottom: 276, bulbR: 66 }
/** The dropping funnel: its stem goes through the stopper into the flask. */
const FUNNEL = { topY: 40, halfTop: 30, stemBottom: 156, stemHalf: 4, stopcockY: 102 }
const STOPPER = { top: 116, bottom: 130, half: 18 }
/** The trough and the gas jar standing in it. */
const TROUGH = { x0: 246, x1: 394, surface: 236, bottom: 300 }
const JAR = { x0: 292, x1: 348, top: 128 }
const TUBE_Y = 118
const JAR_TUBE_END = 152

/**
 * Ethyne from calcium carbide: a flask of CaC₂ lumps closed by a stopper, with a dropping funnel
 * whose stopcocked stem runs through the stopper. Water drips onto the carbide, and the ethyne
 * is led by a delivery tube into a gas jar inverted in the water trough. The jar is full of water
 * at the start and the gas displaces it as the reaction proceeds.
 */
export const CarbideGenerator = forwardRef<SVGGElement, CarbideGeneratorProps>(function CarbideGenerator(
  { progress = 0, x = 0, y = 0, ...rest },
  ref
) {
  const p = unitClamp(progress)
  const rand = seededRandom(7)
  const lumps = Array.from({ length: 9 }, () => ({ x: FLASK.cx + (rand() - 0.5) * 84, y: 240 + rand() * 18, r: 6 + rand() * 5 }))
  const drops = Array.from({ length: 3 }, (_, i) => {
    const t = (p * 3 + i / 3) % 1
    const top = FUNNEL.stemBottom + 2
    const bottom = 232
    return { cx: FLASK.cx, cy: top + t * (bottom - top), o: p > 0 ? 0.9 : 0 }
  })
  // The water in the jar falls from the top of the jar to the trough surface as gas replaces it.
  const waterLevel = JAR.top + p * (TROUGH.surface - JAR.top)
  const bubbles = Array.from({ length: 5 }, (_, i) => {
    const t = (p * 2 + i / 5) % 1
    return { cx: (JAR.x0 + JAR.x1) / 2 + (i % 2 === 0 ? -6 : 6), cy: JAR_TUBE_END - t * Math.max(8, JAR_TUBE_END - waterLevel), o: p > 0 && p < 1 ? 0.9 : 0 }
  })

  // Delivery tube: from the stopper's right side, along and into the jar.
  const tube = `M${FLASK.cx + STOPPER.half - 2},${TUBE_Y} L${(JAR.x0 + JAR.x1) / 2},${TUBE_Y} L${(JAR.x0 + JAR.x1) / 2},${JAR_TUBE_END}`

  const flaskPath = `M${FLASK.cx - FLASK.neckHalf},${FLASK.neckTop} L${FLASK.cx - FLASK.neckHalf},${FLASK.bulbTop - 40} C${FLASK.cx - FLASK.neckHalf},${FLASK.bulbTop - 6} ${FLASK.cx - FLASK.bulbR},${FLASK.bulbTop - 6} ${FLASK.cx - FLASK.bulbR},${FLASK.bulbTop + 40} C${FLASK.cx - FLASK.bulbR},${FLASK.bottom - 6} ${FLASK.cx - 40},${FLASK.bottom} ${FLASK.cx},${FLASK.bottom} C${FLASK.cx + 40},${FLASK.bottom} ${FLASK.cx + FLASK.bulbR},${FLASK.bottom - 6} ${FLASK.cx + FLASK.bulbR},${FLASK.bulbTop + 40} C${FLASK.cx + FLASK.bulbR},${FLASK.bulbTop - 6} ${FLASK.cx + FLASK.neckHalf},${FLASK.bulbTop - 6} ${FLASK.cx + FLASK.neckHalf},${FLASK.bulbTop - 40} L${FLASK.cx + FLASK.neckHalf},${FLASK.neckTop}`

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Stopper, drawn before the funnel stem so the stem reads as passing through it */}
      <rect x={FLASK.cx - STOPPER.half} y={STOPPER.top} width={STOPPER.half * 2} height={STOPPER.bottom - STOPPER.top} rx={3} fill="var(--fg-muted)" />
      {/* Dropping funnel: the cone above the stopper and the stopcocked stem through it */}
      <path d={`M${FLASK.cx - FUNNEL.halfTop},${FUNNEL.topY} L${FLASK.cx + FUNNEL.halfTop},${FUNNEL.topY} L${FLASK.cx + FUNNEL.stemHalf},${FUNNEL.stopcockY - 14} L${FLASK.cx + FUNNEL.stemHalf},${FUNNEL.stemBottom} L${FLASK.cx - FUNNEL.stemHalf},${FUNNEL.stemBottom} L${FLASK.cx - FUNNEL.stemHalf},${FUNNEL.stopcockY - 14} Z`} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} strokeLinejoin="round" />
      <line x1={FLASK.cx - FUNNEL.halfTop} x2={FLASK.cx + FUNNEL.halfTop} y1={FUNNEL.topY} y2={FUNNEL.topY} stroke="var(--glass)" strokeWidth={3} strokeLinecap="round" />
      {/* Stopcock: a bar across the stem, with its knob */}
      <rect x={FLASK.cx - 12} y={FUNNEL.stopcockY - 4} width={24} height={8} rx={2} fill="var(--fg-muted)" />
      <rect x={FLASK.cx + 12} y={FUNNEL.stopcockY - 6} width={9} height={12} rx={2} fill="var(--fg-muted)" />
      <Caption x={FLASK.cx + FUNNEL.halfTop + 14} y={FUNNEL.topY + 6} anchor="start" size={16} fill="var(--fg)">
        H₂O
      </Caption>

      {/* Flask, with its stopper; the stem passes through the stopper into the neck */}
      <path d={flaskPath} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2.4} strokeLinejoin="round" />
      {lumps.map((l, i) => (
        <circle key={`lump-${i}`} cx={l.x} cy={l.y} r={l.r} fill="var(--agcl-white)" stroke="var(--fg-subtle)" strokeWidth={1} />
      ))}
      <Caption x={FLASK.cx + 84} y={FLASK.bottom - 12} size={16} fill="var(--fg)">
        CaC₂
      </Caption>

      {/* Water drips from the stem tip onto the carbide */}
      {drops.map((d, i) => (
        <circle key={`drop-${i}`} cx={d.cx} cy={d.cy} r={3.6} fill="var(--energy-curve)" opacity={d.o} />
      ))}

      {/* Delivery tube from the stopper, along, and into the gas jar */}
      <GlassTube d={tube} width={6} />

      {/* Trough of water */}
      <rect x={TROUGH.x0} y={TROUGH.surface} width={TROUGH.x1 - TROUGH.x0} height={TROUGH.bottom - TROUGH.surface} rx={4} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.4} />
      <line x1={TROUGH.x0} x2={TROUGH.x1} y1={TROUGH.surface} y2={TROUGH.surface} stroke="var(--liquid-edge)" strokeWidth={1.4} />

      {/* Inverted gas jar: water inside falls from the top as the ethyne fills it */}
      <rect x={JAR.x0 + 2} y={waterLevel} width={JAR.x1 - JAR.x0 - 4} height={TROUGH.surface - waterLevel} fill="var(--liquid)" />
      <path d={`M${JAR.x0},${TROUGH.surface} L${JAR.x0},${JAR.top} L${JAR.x1},${JAR.top} L${JAR.x1},${TROUGH.surface}`} fill="none" stroke="var(--glass)" strokeWidth={2.4} strokeLinejoin="round" />
      {bubbles.map((b, i) => (
        <circle key={`bub-${i}`} cx={b.cx} cy={b.cy} r={3.2} fill="none" stroke="var(--surface)" strokeWidth={1.4} opacity={b.o} />
      ))}
      <Caption x={(TROUGH.x0 + TROUGH.x1) / 2} y={TROUGH.bottom - 14} size={16} fill="var(--fg)">
        C₂H₂
      </Caption>

      {/* Equation */}
      <Caption x={CARBIDE_GENERATOR_SIZE.width / 2} y={CARBIDE_GENERATOR_SIZE.height - 12} size={17} fill="var(--fg)">
        CaC₂ + 2H₂O → C₂H₂ + Ca(OH)₂
      </Caption>
    </g>
  )
})
