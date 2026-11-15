import React from 'react'

/** Text with its δ set in the KaTeX italic symbol class (.sym), as the Visual Vocabulary asks. */
export function deltaText(text: string): React.ReactNode {
  return text.split(/(δ)/).map((part, i) =>
    part === 'δ' ? (
      <tspan key={i} className="sym">
        δ
      </tspan>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}
