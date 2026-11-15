import { Fragment } from 'react'

/**
 * Physics symbols in SVG caption text. Each one is wrapped in the global `.sym` class so it sets in
 * the maths italic, not the UI font. A subscript (p_ex, V_i) is lowered and the baseline restored.
 * Units, numbers and element symbols are left upright.
 */
const TOKEN = /(Δn_g|ΔU|ΔH|ΔV|p_ex|p_f|V_i|V_f|q_V|q_p|\bnRT\b|\bw\b|\bq\b|\bp\b|\bV\b|\bn\b|\bR\b|\bT\b|\bl\b)/

const SYMBOL_TOKENS = new Set(['Δn_g', 'ΔU', 'ΔH', 'ΔV', 'nRT', 'w', 'q', 'p', 'V', 'n', 'R', 'T', 'l'])
/** p, V or q with a subscript, such as p_ex or V_i (Δn_g is a symbol with its own subscript). */
const SUBSCRIPTED = /^[pVq]_[A-Za-z]+$/

export function Symbolised({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null
        if (SUBSCRIPTED.test(part)) {
          const [base, sub] = part.split('_')
          return (
            <Fragment key={i}>
              <tspan className="sym">{base}</tspan>
              <tspan className="sym" dy="4" fontSize="0.75em">
                {sub}
              </tspan>
              <tspan dy="-4" />
            </Fragment>
          )
        }
        if (SYMBOL_TOKENS.has(part)) {
          return (
            <tspan key={i} className="sym">
              {part}
            </tspan>
          )
        }
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
