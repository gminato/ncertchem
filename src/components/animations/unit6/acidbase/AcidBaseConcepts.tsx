'use client'

import { useEffect, useId, useRef, useState } from 'react'
import gsap from 'gsap'
import { Tex } from '../qk/Tex'
import { acidBaseTarget, ACID_BASE_STEP_COUNT, type AcidBaseTarget } from './acid-base-steps'
import styles from './AcidBaseConcepts.module.css'

export interface AcidBaseConceptsProps {
  step: number
  reducedMotion: boolean
}

const PILL = { w: 160, h: 56 }
const LEFT = 150
const RIGHT = 430
const TOP = 120
const BOTTOM = 250
const TWEEN_SECONDS = 0.9

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** The reaction shown under the drawing for each Step. */
const CAPTIONS = [
  '\\ce{HCl + H2O -> H3O+ + Cl-}',
  '\\ce{HCl + H2O -> H3O+ + Cl-}',
  '\\ce{NH3 + H2O <=> NH4+ + OH-}',
  '\\ce{BF3 + :NH3 -> BF3:NH3}',
] as const

const ARIA = [
  'HCl molecule above a water molecule, with the proton still on HCl.',
  'The proton has moved from HCl to water. H3O plus and Cl minus are shown.',
  'NH3 and water exchange a proton. Two conjugate pairs are shaded, one in each column.',
  'BF3 and NH3 side by side. The nitrogen lone pair curves towards boron, and a bond forms.',
] as const

/** A rounded species label. Tone shades the outline: acid-coloured, base-coloured or neutral. */
function Pill({
  x,
  y,
  label,
  tone = 'neutral',
  opacity = 1,
}: {
  x: number
  y: number
  label: string
  tone?: 'acid' | 'base' | 'neutral'
  opacity?: number
}) {
  const stroke = tone === 'acid' ? 'var(--acid)' : tone === 'base' ? 'var(--base)' : 'var(--fg-subtle)'
  return (
    <g opacity={opacity} className={styles.pill}>
      <rect
        x={x - PILL.w / 2}
        y={y - PILL.h / 2}
        width={PILL.w}
        height={PILL.h}
        rx={PILL.h / 2}
        style={{ fill: 'var(--surface)', stroke, strokeWidth: tone === 'neutral' ? 1.5 : 3 }}
      />
      <text x={x} y={y + 8} textAnchor="middle" className={styles.label}>
        {label}
      </text>
    </g>
  )
}

/**
 * Three cut-aways of acid-base chemistry, tweened between Steps: HCl giving its proton to
 * water, NH₃ and H₂O with two shaded conjugate pairs, and BF₃ accepting a lone pair from NH₃.
 * Every Step tweens each field from its current value to the Step's target.
 */
export function AcidBaseConcepts({ step, reducedMotion }: AcidBaseConceptsProps) {
  const index = Math.min(ACID_BASE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const markerId = `ab-arrow-${useId().replace(/:/g, '')}`
  const [view, setView] = useState<AcidBaseTarget>(() => acidBaseTarget(index))
  const current = useRef<AcidBaseTarget>(acidBaseTarget(index))

  useEffect(() => {
    const to = acidBaseTarget(index)
    if (reducedMotion) {
      // Reduced motion cuts straight to the target; the render below reads the target directly.
      current.current = to
      return
    }
    const tween = gsap.to(current.current, {
      ...to,
      duration: TWEEN_SECONDS,
      ease: 'power2.inOut',
      onUpdate: () => setView({ ...current.current }),
    })
    return () => {
      tween.kill()
    }
  }, [index, reducedMotion])

  const v = reducedMotion ? acidBaseTarget(index) : view
  const dotX = lerp(236, 344, v.proton)
  const dotY = 120 - 46 * Math.sin(Math.PI * v.proton)
  const c1 = lerp(150, 210, v.adduct)
  const c2 = lerp(430, 410, v.adduct)
  const mid = lerp(290, 310, v.adduct)

  return (
    <div className={styles.stage} data-testid="acid-base-concepts" data-step={index}>
      <svg viewBox="0 0 580 360" role="img" aria-label={ARIA[index]} className={styles.svg}>
        <defs>
          <marker id={markerId} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" style={{ fill: 'var(--fg-muted)' }} />
          </marker>
        </defs>

        {/* Scene A: HCl gives its proton to water */}
        <g opacity={v.hcl} aria-hidden={v.hcl < 0.5}>
          <text x={290} y={32} textAnchor="middle" className={styles.header}>
            HCl gives its proton to H₂O
          </text>
          <Pill x={LEFT} y={TOP} label="HCl" tone="acid" opacity={1} />
          <Pill x={RIGHT} y={TOP} label="H₂O" tone="base" opacity={1} />
          <circle cx={dotX} cy={dotY} r={10} className={styles.proton} />
          <text x={dotX} y={dotY - 18} textAnchor="middle" className={styles.protonLabel}>
            H⁺
          </text>
          <g opacity={0.22 + 0.78 * v.products}>
            <line
              x1={LEFT}
              y1={TOP + PILL.h / 2 + 6}
              x2={LEFT}
              y2={BOTTOM - PILL.h / 2 - 6}
              className={styles.arrow}
              markerEnd={`url(#${markerId})`}
              opacity={v.products}
            />
            <line
              x1={RIGHT}
              y1={TOP + PILL.h / 2 + 6}
              x2={RIGHT}
              y2={BOTTOM - PILL.h / 2 - 6}
              className={styles.arrow}
              markerEnd={`url(#${markerId})`}
              opacity={v.products}
            />
            <Pill x={LEFT} y={BOTTOM} label="Cl⁻" tone="neutral" />
            <Pill x={RIGHT} y={BOTTOM} label="H₃O⁺" tone="acid" />
            <text x={LEFT} y={BOTTOM + 48} textAnchor="middle" className={styles.note}>
              conjugate base of HCl
            </text>
            <text x={RIGHT} y={BOTTOM + 48} textAnchor="middle" className={styles.note}>
              conjugate acid of H₂O
            </text>
          </g>
        </g>

        {/* Scene B: NH3 and H2O exchange a proton, with two conjugate pairs */}
        <g opacity={v.nh3}>
          <text x={290} y={32} textAnchor="middle" className={styles.header}>
            H₂O gives a proton to NH₃
          </text>
          <rect
            x={56}
            y={70}
            width={188}
            height={226}
            rx={22}
            style={{ fill: 'var(--base)', fillOpacity: 0.14 * v.pairs }}
          />
          <rect
            x={336}
            y={70}
            width={188}
            height={226}
            rx={22}
            style={{ fill: 'var(--acid)', fillOpacity: 0.14 * v.pairs }}
          />
          <Pill x={LEFT} y={TOP} label="NH₃" tone="base" />
          <Pill x={RIGHT} y={TOP} label="H₂O" tone="acid" />
          <Pill x={LEFT} y={BOTTOM} label="NH₄⁺" tone="base" />
          <Pill x={RIGHT} y={BOTTOM} label="OH⁻" tone="acid" />
          <text x={290} y={196} textAnchor="middle" className={styles.equilibrium}>
            ⇌
          </text>
          <text x={LEFT} y={328} textAnchor="middle" className={styles.note}>
            pair: NH₃ and NH₄⁺
          </text>
          <text x={RIGHT} y={328} textAnchor="middle" className={styles.note}>
            pair: H₂O and OH⁻
          </text>
        </g>

        {/* Scene C: BF3 accepts a lone pair from NH3 */}
        <g opacity={v.bf3}>
          <text x={290} y={32} textAnchor="middle" className={styles.header}>
            BF₃ accepts a lone pair from NH₃
          </text>
          <path
            d={`M ${c2 - 22} 142 Q ${mid} 40 ${mid - 6} 142`}
            className={styles.arrow}
            markerEnd={`url(#${markerId})`}
            opacity={v.bf3}
          />
          <text x={mid} y={80} textAnchor="middle" className={styles.note} opacity={v.bf3}>
            electron pair
          </text>
          <line
            x1={c1 + PILL.w / 2}
            y1={170}
            x2={c2 - PILL.w / 2}
            y2={170}
            className={styles.bond}
            opacity={v.adduct}
          />
          <Pill x={c1} y={170} label="BF₃" tone="neutral" />
          <Pill x={c2} y={170} label="NH₃" tone="base" />
          <text x={c1} y={226} textAnchor="middle" className={styles.note}>
            B has six electrons
          </text>
          <text x={c2} y={226} textAnchor="middle" className={styles.note}>
            N has a lone pair
          </text>
          <text x={mid} y={292} textAnchor="middle" className={styles.header} opacity={v.adduct}>
            F₃B←NH₃: a dative bond
          </text>
        </g>
      </svg>

      <div className={styles.caption} data-testid="acid-base-caption">
        <Tex tex={CAPTIONS[index]} />
      </div>
    </div>
  )
}
