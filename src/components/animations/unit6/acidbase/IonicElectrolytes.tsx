'use client'

import { IonisationBeaker } from '@/components/equilibrium'
import { strongAcidPH, weakAcid } from '@/lib/chem/acid-base'
import { NCERT_TABLE_6_6_KA } from '@/lib/chem/ncert-unit6-tables'
import { Tex } from '../qk/Tex'
import styles from './AcidBaseConcepts.module.css'

export interface IonicElectrolytesProps {
  step: number
  reducedMotion: boolean
}

export const ELECTROLYTE_STEP_COUNT = 3

/** Concentration of both acids in the picture, mol L⁻¹. */
export const ELECTROLYTE_C = 0.1

/** Ka of acetic acid from NCERT Table 6.6, read from the table rather than typed again. */
const KA_ACETIC = NCERT_TABLE_6_6_KA.rows.find((r) => r.formula === 'CH3COOH')!.ka

const WEAK = weakAcid(ELECTROLYTE_C, KA_ACETIC)
const STRONG_PH = strongAcidPH(ELECTROLYTE_C)
const REMAINING = ELECTROLYTE_C - WEAK.hConc

/** A number as LaTeX in the form a × 10^{n}, with three significant figures. */
function sci(value: number): string {
  const exponent = Math.floor(Math.log10(Math.abs(value)))
  const mantissa = value / 10 ** exponent
  return `${mantissa.toFixed(2)} \\times 10^{${exponent}}`
}


/** The two beakers are scaled and placed so their drawings fill the panel. */
const BEAKER_SCALE = 1.15
const WEAK_AT = { x: 22, y: 64 }
const STRONG_AT = { x: 282, y: 64 }

/** The Tex under the drawing, by Step. */
const PCT_WEAK = `${(WEAK.alpha * 100).toFixed(1)}\\%`

const CAPTIONS: string[][] = [
  [
    '\\ce{CH3COOH + H2O <=> H3O+ + CH3COO-}',
    `\\alpha = \\dfrac{[\\mathrm{H_3O^+}]}{c} = \\dfrac{${sci(WEAK.hConc)}}{${ELECTROLYTE_C.toFixed(2)}} = ${PCT_WEAK}`,
  ],
  [
    '\\ce{HCl + H2O -> H3O+ + Cl-}',
    `\\mathrm{pH} = -\\log(${ELECTROLYTE_C.toFixed(2)}) = ${STRONG_PH.toFixed(2)}`,
  ],
  [
    'K_a = \\dfrac{[\\mathrm{H_3O^+}][\\mathrm{CH_3COO^-}]}{[\\mathrm{CH_3COOH}]}',
    `= \\dfrac{(${sci(WEAK.hConc)})^{2}}{${REMAINING.toFixed(4)}} = ${sci(KA_ACETIC)}`,
  ],
]

const ARIA = [
  `Acetic acid, a weak electrolyte: about ${(WEAK.alpha * 100).toFixed(1)} percent of the molecules have ionised. Most stay as molecules.`,
  'Hydrochloric acid, a strong electrolyte: every molecule has ionised into ions.',
  'Both acids drawn together, with the acetic acid equilibrium written as a Ka expression.',
]

/**
 * Two beakers of 0.10 mol L⁻¹ acid, drawn with the same ionisation picture: acetic acid with
 * a small ionised share (from the library, from Table 6.6), and HCl with all molecules ionised.
 * The third Step writes the ionic equilibrium and its Ka expression.
 */
export function IonicElectrolytes({ step, reducedMotion }: IonicElectrolytesProps) {
  const index = Math.min(ELECTROLYTE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const weakEmphasis = index === 0 || index === 2 ? 1 : 0.3
  const strongEmphasis = index === 1 || index === 2 ? 1 : 0.3
  const fade = reducedMotion ? undefined : { transition: 'opacity 600ms ease' }

  return (
    <div className={styles.stage} data-testid="ionic-electrolytes" data-step={index}>
      <svg viewBox="0 0 580 360" role="img" aria-label={ARIA[index]} className={styles.svg}>
        <g opacity={weakEmphasis} style={fade}>
          <text x={152} y={60} textAnchor="middle" className={styles.label}>
            CH₃COOH
          </text>
          <text x={152} y={84} textAnchor="middle" className={styles.note}>
            weak electrolyte · {(WEAK.alpha * 100).toFixed(1)} % ionised
          </text>
          <g transform={`translate(${WEAK_AT.x} ${WEAK_AT.y}) scale(${BEAKER_SCALE})`}>
            <IonisationBeaker fractionIonised={WEAK.alpha} molecules={36} seed={7} />
          </g>
        </g>

        <g opacity={strongEmphasis} style={fade}>
          <text x={428} y={60} textAnchor="middle" className={styles.label}>
            HCl
          </text>
          <text x={428} y={84} textAnchor="middle" className={styles.note}>
            strong electrolyte · 100 % ionised
          </text>
          <g transform={`translate(${STRONG_AT.x} ${STRONG_AT.y}) scale(${BEAKER_SCALE})`}>
            <IonisationBeaker fractionIonised={1} molecules={36} seed={11} />
          </g>
        </g>
      </svg>

      <div className={styles.caption} data-testid="electrolyte-caption">
        {CAPTIONS[index].map((tex) => (
          <Tex key={tex} tex={tex} />
        ))}
      </div>
    </div>
  )
}
