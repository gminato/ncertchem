'use client'

import React, { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { classicalStep, CLASSICAL_STEP_COUNT, type EquationToken } from './classical-steps'
import styles from './RedoxClassical.module.css'

export interface RedoxClassicalProps {
  step: number
  reducedMotion: boolean
}

const STAGE_NAMES = ['Oxygen', 'Hydrogen', 'Electronegative element', 'Electropositive element'] as const

/** Renders one mhchem fragment with KaTeX. The strings come from the tested step data. */
function Ce({ mhchem }: { mhchem: string }) {
  const html = useMemo(
    () => katex.renderToString(`\\ce{${mhchem}}`, { throwOnError: false }),
    [mhchem],
  )
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function Species({ token }: { token: EquationToken }) {
  if (token.mhchem === '+' || token.mhchem === '->') {
    return <span className={styles.operator}><Ce mhchem={token.mhchem} /></span>
  }
  const formulaClass =
    token.role === 'ox' ? styles.formulaOx : token.role === 'red' ? styles.formulaRed : ''
  const labelClass = token.role === 'ox' ? styles.labelOx : styles.labelRed
  return (
    <span className={styles.item}>
      <span className={`${styles.formula} ${formulaClass}`}>
        <Ce mhchem={token.mhchem} />
      </span>
      {token.role && token.label ? (
        <span className={`${styles.label} ${labelClass}`}>{token.label}</span>
      ) : null}
    </span>
  )
}

/**
 * RedoxClassical Scrolly Animation for Section 7.1.
 *
 * Four worked reactions show the classical widening of oxidation and reduction.
 * The oxidised species is underlined in --ox and the reduced one in --red, each with a label.
 * The layout is HTML inside the SVG so the text wraps instead of clipping.
 *
 * ViewBox 580 × 430, rendered at about 570 px wide.
 */
export function RedoxClassical({ step, reducedMotion: _reducedMotion }: RedoxClassicalProps) {
  const index = Math.min(CLASSICAL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = classicalStep(index)
  const isSummary = index === CLASSICAL_STEP_COUNT - 1

  const ariaEquation = data.equation
    .filter((t) => t.role)
    .map((t) => `${t.mhchem} (${t.role === 'ox' ? 'oxidised' : 'reduced'}: ${t.label})`)
    .join('; ')

  return (
    <svg
      viewBox="0 0 580 430"
      role="img"
      aria-label={`Classical redox, ${data.stageNumber}: ${data.title}. ${data.oxRule}; ${data.redRule}.${ariaEquation ? ` ${ariaEquation}.` : ''}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="redox-classical-svg"
    >
      <foreignObject x={0} y={0} width={580} height={430}>
        <div className={styles.stage}>
          <div className={styles.header}>
            <span className={styles.badge}>{data.stageNumber}</span>
            <h3 className={styles.title}>{data.title}</h3>
          </div>

          {!isSummary && (
            <div className={styles.rules}>
              <div className={`${styles.rule} ${styles.ruleOx}`}>
                <span className={styles.kicker}>OXIDATION</span>
                <span className={styles.ruleText}>{data.oxRule.replace(/^Oxidation:\s*/, '')}</span>
              </div>
              <div className={`${styles.rule} ${styles.ruleRed}`}>
                <span className={styles.kicker}>REDUCTION</span>
                <span className={styles.ruleText}>{data.redRule.replace(/^Reduction:\s*/, '')}</span>
              </div>
            </div>
          )}

          {isSummary ? (
            <div className={styles.card}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>CRITERION</th>
                    <th className={styles.thOx}>OXIDATION</th>
                    <th className={styles.thRed}>REDUCTION</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matrixRows?.map((row) => (
                    <tr key={row.criterion}>
                      <td>{row.criterion}</td>
                      <td className={styles.tdOx}>{row.oxidation}</td>
                      <td className={styles.tdRed}>{row.reduction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={styles.takeaway} style={{ marginTop: 12 }}>
                Every oxidation needs a partner that accepts what is given up, so oxidation and reduction always happen together.
              </p>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.equation}>
                {data.equation.map((token, i) => (
                  <Species key={i} token={token} />
                ))}
              </div>
            </div>
          )}

          {!isSummary && (
            <div className={styles.ladder} aria-hidden="true">
              {STAGE_NAMES.map((name, i) => (
                <div key={name} className={`${styles.rung} ${i === index ? styles.rungActive : ''}`}>
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      </foreignObject>
    </svg>
  )
}
