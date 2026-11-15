import React, { forwardRef } from 'react'
import { conversionMix, particleLayout } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const IONISATION_BEAKER_SIZE = { width: 240, height: 252 } as const

const BEAKER = { x0: 40, x1: 200, top: 30, bottom: 206 }
const BOX = { x0: 60, x1: 180, y0: 60, y1: 192 }
const SPACING = 17

export interface IonisationBeakerProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Fraction of the acid molecules that have ionised, 0 to 1. Weak acids are small, strong acids 1. */
  fractionIonised: number
  /** Number of acid molecules drawn. More molecules give a finer picture of the fraction. */
  molecules?: number
  /** Extra A⁻ ions from a salt, added as a common ion. They are drawn but do not change the fraction. */
  commonIon?: number
  /** Seed for the particle positions. */
  seed?: number
  title?: string
  x?: number
  y?: number
}

/**
 * HA molecules in water, with each ionised molecule shown as an H₃O⁺ and A⁻ pair. The
 * conversion blends smoothly with `fractionIonised`, so the picture follows the number.
 */
export const IonisationBeaker = forwardRef<SVGGElement, IonisationBeakerProps>(function IonisationBeaker(
  { fractionIonised, molecules = 36, commonIon = 0, seed = 5, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const f = Math.min(1, Math.max(0, fractionIonised))
  const positions = particleLayout(molecules, BOX, seed, SPACING)
  const extra = commonIon > 0 ? particleLayout(commonIon, BOX, seed + 11, SPACING) : []

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? `Acid beaker with ${Math.round(f * 100)} percent ionised`} {...rest}>
      {/* Beaker */}
      <path
        d={`M ${BEAKER.x0} ${BEAKER.top} L ${BEAKER.x0} ${BEAKER.bottom - 14} Q ${BEAKER.x0} ${BEAKER.bottom} ${BEAKER.x0 + 14} ${BEAKER.bottom} L ${BEAKER.x1 - 14} ${BEAKER.bottom} Q ${BEAKER.x1} ${BEAKER.bottom} ${BEAKER.x1} ${BEAKER.bottom - 14} L ${BEAKER.x1} ${BEAKER.top}`}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect x={BEAKER.x0 + 1} y={BEAKER.top + 26} width={BEAKER.x1 - BEAKER.x0 - 2} height={BEAKER.bottom - BEAKER.top - 27} fill="var(--liquid)" />
      <line x1={BEAKER.x0} x2={BEAKER.x1} y1={BEAKER.top + 26} y2={BEAKER.top + 26} stroke="var(--liquid-edge)" strokeWidth={1.4} />

      {/* Acid molecules: hollow while un-ionised, fading out as they ionise */}
      {positions.map((p, i) => {
        const m = conversionMix(i, f, molecules)
        return (
          <g key={`ha-${i}`}>
            <circle cx={p.x} cy={p.y} r={6} fill="var(--surface)" stroke="var(--fg-muted)" strokeWidth={1.8} opacity={1 - m} style={{ transition: 'opacity 0.45s ease' }} />
            <g opacity={m} style={{ transition: 'opacity 0.45s ease' }}>
              <circle cx={p.x - 7} cy={p.y} r={4.8} fill="var(--acid)" stroke="var(--surface)" strokeWidth={1} />
              <circle cx={p.x + 7} cy={p.y} r={4.8} fill="var(--base)" stroke="var(--surface)" strokeWidth={1} />
            </g>
          </g>
        )
      })}

      {/* Common-ion A⁻ from a salt */}
      {extra.map((p, i) => (
        <circle key={`ca-${i}`} cx={p.x} cy={p.y} r={4.8} fill="var(--base)" stroke="var(--surface)" strokeWidth={1} opacity={0.75} />
      ))}

      {/* Legend */}
      <g transform="translate(0, 232)" fontFamily="var(--font-sans)" fontSize={14} style={{ userSelect: 'none' }}>
        <circle cx={34} cy={0} r={6} fill="var(--surface)" stroke="var(--fg-muted)" strokeWidth={1.8} />
        <text x={46} y={0.5} dominantBaseline="central" fill="var(--fg)">HA</text>
        <circle cx={100} cy={0} r={5} fill="var(--acid)" />
        <text x={112} y={0.5} dominantBaseline="central" fill="var(--fg)">H₃O⁺</text>
        <circle cx={182} cy={0} r={5} fill="var(--base)" />
        <text x={194} y={0.5} dominantBaseline="central" fill="var(--fg)">A⁻</text>
      </g>
    </g>
  )
})
