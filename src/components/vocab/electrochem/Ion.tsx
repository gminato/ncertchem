import React, { forwardRef, Fragment } from 'react'
import { formulaRuns, frac, hash01, superscriptCharge } from './geometry'

export interface IonProps extends React.SVGAttributes<SVGGElement> {
  /** Centre of the ion label, in the parent's coordinates. */
  x?: number
  y?: number
  kind?: 'cation' | 'anion'
  /** Formula, digits become subscripts, e.g. "Zn" or "SO4". */
  formula: string
  /** Charge as typed, e.g. "2+", "-", or "2-". Shown as superscript. */
  charge: string
  fontSize?: number
}

/** Rough label width for sizing the pill. Good enough for the 13 to 16 px labels used here. */
function labelWidth(formula: string, charge: string, fontSize: number): number {
  const chars = formula.replace(/\d/g, '').length + formula.replace(/\D/g, '').length * 0.7 + charge.length * 0.7
  return chars * fontSize * 0.62 + 16
}

/** A labelled ion: a pill in the cation or anion token, with the formula and charge inside. */
export const Ion = forwardRef<SVGGElement, IonProps>(function Ion(
  { x = 0, y = 0, kind = 'cation', formula, charge, fontSize = 14, className, ...rest },
  ref
) {
  const w = labelWidth(formula, charge, fontSize)
  const h = fontSize + 12
  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={kind === 'cation' ? 'var(--ion-cation)' : 'var(--ion-anion)'} />
      <text x={x} y={y + fontSize * 0.36} textAnchor="middle" fontSize={fontSize} fontWeight={600} fill="var(--surface)">
        {formulaRuns(formula).map((r, i) => (
          <Fragment key={i}>
            {r.sub ? <tspan baselineShift="sub" fontSize="72%">{r.text}</tspan> : r.text}
          </Fragment>
        ))}
        {superscriptCharge(charge)}
      </text>
    </g>
  )
})

export interface GasBubblesProps extends React.SVGAttributes<SVGGElement> {
  /** Centre of the column's base. Bubbles rise from here. */
  x?: number
  y?: number
  width?: number
  height?: number
  count?: number
  /** Loop phase 0 to 1, set by the parent. */
  t?: number
  /** Gas formula drawn beside the column top, e.g. "H₂". */
  formula?: string
}

/** Rising gas bubbles. Positions come from a seeded hash, so the same `t` always gives the same frame. */
export const GasBubbles = forwardRef<SVGGElement, GasBubblesProps>(function GasBubbles(
  { x = 0, y = 0, width = 60, height = 120, count = 5, t = 0, formula, className, ...rest },
  ref
) {
  const bubbles = Array.from({ length: count }, (_, i) => {
    const phase = frac(t + i / count)
    const wobble = Math.sin(2 * Math.PI * (phase * 1.5 + hash01(i + 1)))
    return {
      cx: x + (hash01(i + 5) - 0.5) * width * 0.4 + wobble * width * 0.12,
      cy: y - phase * height,
      r: 3 + hash01(i + 11) * 2.4,
      opacity: 1 - phase * 0.5,
    }
  })
  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      {bubbles.map((b, i) => (
        <g key={i} opacity={b.opacity}>
          <circle cx={b.cx} cy={b.cy} r={b.r} fill="var(--glass-fill)" stroke="var(--fg-muted)" strokeWidth={1.2} />
          <circle cx={b.cx - b.r * 0.35} cy={b.cy - b.r * 0.35} r={b.r * 0.25} fill="var(--glass-sheen)" />
        </g>
      ))}
      {formula && (
        <text x={x + width / 2 + 14} y={y - height - 4} fontSize={15} fontWeight={600} fill="var(--fg)">
          {formulaRuns(formula).map((r, i) => (
            <Fragment key={i}>
              {r.sub ? <tspan baselineShift="sub" fontSize="72%">{r.text}</tspan> : r.text}
            </Fragment>
          ))}
        </text>
      )}
    </g>
  )
})
