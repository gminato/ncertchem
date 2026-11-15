import { Fragment } from 'react'

/**
 * Hybrid, σ and π symbols inside SVG caption text. Each one is wrapped in the global `.sym`
 * class so it sets in the maths italic, not the UI font. A p with a subscript (p_y, p_z) is set
 * with the subscript lowered, and the baseline restored after it.
 */
const TOKEN = /(sp³d²|sp³d|sp³|sp²|sp|σ|π|p_y|p_z)/
const SYMBOL_TOKENS = new Set(['sp³d²', 'sp³d', 'sp³', 'sp²', 'sp', 'σ', 'π'])

export function Symbolised({ text }: { text: string }) {
  const parts = text.split(TOKEN)
  return (
    <>
      {parts.map((part, i) => {
        if (part === '') return null
        if (part === 'p_y' || part === 'p_z') {
          return (
            <Fragment key={i}>
              <tspan className="sym">p</tspan>
              <tspan className="sym" dy="4" fontSize="0.75em">
                {part[2]}
              </tspan>
              <tspan dy="-4" />
            </Fragment>
          )
        }
        if (SYMBOL_TOKENS.has(part)) return <tspan key={i} className="sym">{part}</tspan>
        return <Fragment key={i}>{part}</Fragment>
      })}
    </>
  )
}
