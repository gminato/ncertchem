import React, { forwardRef } from 'react'
import { TestTube } from './TestTube'
import { Caption } from './primitives'
import { unitClamp } from '../hydrocarbon-geometry'

/** Size of one reagent test, for a parent viewBox: the tube with room for its caption. */
export const REAGENT_TEST_SIZE = { width: 220, height: 230 } as const

export type ReagentKind = 'bromine' | 'baeyer'

export interface ReagentTestProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** `bromine`: bromine water, red-brown, decolourised by an alkene. `baeyer`: alkaline KMnO₄, purple, decolourised with brown MnO₂. */
  reagent: ReagentKind
  /** 0 before the test, 1 after it. */
  progress?: number
  /** Caption under the tube. */
  label?: string
  x?: number
  y?: number
}

/** Colour of the reagent before reaction: a token, mixed with clear liquid as the reaction proceeds. */
function liquidAt(reagent: ReagentKind, progress: number): string {
  const strength = Math.round((1 - unitClamp(progress)) * 100)
  const colour = reagent === 'bromine' ? 'var(--bromine)' : 'var(--kmno4)'
  return `color-mix(in srgb, ${colour} ${strength}%, transparent)`
}

/**
 * A test tube for an unsaturation test. The reagent's colour fades to clear with `progress`; in
 * Baeyer's test a brown precipitate of MnO₂ settles out as the purple goes.
 */
export const ReagentTest = forwardRef<SVGGElement, ReagentTestProps>(function ReagentTest(
  { reagent, progress = 0, label, x = 0, y = 0, ...rest },
  ref
) {
  const p = unitClamp(progress)
  const precipitate =
    reagent === 'baeyer' ? { color: 'var(--mno2)', amount: 0.55 * p } : undefined
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <TestTube
        liquid={liquidAt(reagent, p)}
        liquidLevel={0.7}
        precipitate={precipitate}
        progress={p}
        x={REAGENT_TEST_SIZE.width / 2}
        y={18}
        title={reagent === 'bromine' ? 'Bromine water test' : "Baeyer's test"}
      />
      {label && (
        <Caption x={REAGENT_TEST_SIZE.width / 2} y={REAGENT_TEST_SIZE.height - 14} size={16} fill="var(--fg)">
          {label}
        </Caption>
      )}
    </g>
  )
})
