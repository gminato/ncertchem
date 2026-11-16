import React, { forwardRef, useMemo } from 'react'
import { SkeletalFormula } from './SkeletalFormula'
import {
  SCHEME_FONT,
  SCHEME_TEXT_SPECIES,
  layoutReactionScheme,
  revealFraction,
  type SchemePath,
} from './hydrocarbon-geometry'

/** Size of a reaction scheme laid out to `maxWidth`, for a parent viewBox. */
export function reactionSchemeSize(sequence: SchemePath, maxWidth: number) {
  const layout = layoutReactionScheme(sequence, maxWidth)
  return { width: maxWidth, height: Math.ceil(layout.height) }
}

export interface ReactionSchemeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Groups of species (joined with '+') and arrows, starting and ending with a group. */
  sequence: SchemePath
  /** Width the scheme must fit. Structures scale down and wrap onto a second row if needed. */
  maxWidth: number
  /** 0 to 1: reveals the stages in order, one element after another. */
  progress?: number
  /** Bond-length scales to try, largest first. Defaults to the layout's own list. */
  scales?: readonly number[]
  x?: number
  y?: number
}

/**
 * A chemical equation drawn with its structures: species with '+' between them, reaction arrows
 * with reagents above and conditions below, tags under products, and atoms that react washed
 * in the highlight colour. Rows wrap only at arrows. Origin is the top left of the scheme.
 */
export const ReactionScheme = forwardRef<SVGGElement, ReactionSchemeProps>(function ReactionScheme(
  { sequence, maxWidth, progress = 1, scales, x = 0, y = 0, ...rest },
  ref
) {
  const layout = useMemo(() => layoutReactionScheme(sequence, maxWidth, scales), [sequence, maxWidth, scales])
  const count = Math.max(1, sequence.length)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {layout.items.map((item, i) => {
        const op = revealFraction(progress, item.element / count, (item.element + 1) / count)
        const cx = item.x + item.width / 2
        if (item.kind === 'plus') {
          return (
            <text key={`p-${i}`} x={cx} y={item.y} textAnchor="middle" dominantBaseline="central" fontSize={SCHEME_TEXT_SPECIES} fontFamily="var(--font-sans)" fill="var(--fg)" opacity={op}>
              +
            </text>
          )
        }
        if (item.kind === 'arrow' && item.arrow) {
          const a = item.arrow
          const x0 = item.x
          const x1 = item.x + item.width
          // Arrowhead barbs: the tip at xTip, the barbs 11 px back along the arrow (dir +1 right, -1 left).
          const head = (xTip: number, dir: 1 | -1, yy: number) => {
            const bx = xTip - 11 * dir
            return `M${bx},${yy - 6} L${xTip},${yy} L${bx},${yy + 6}`
          }
          return (
            <g key={`a-${i}`} opacity={op}>
              {a.equilibrium ? (
                <>
                  <line x1={x0} x2={x1 - 2} y1={item.y - 4} y2={item.y - 4} stroke="var(--fg-muted)" strokeWidth={2} />
                  <path d={head(x1, 1, item.y - 4)} stroke="var(--fg-muted)" strokeWidth={2} fill="none" strokeLinecap="round" />
                  <line x1={x1} x2={x0 + 2} y1={item.y + 4} y2={item.y + 4} stroke="var(--fg-muted)" strokeWidth={2} />
                  <path d={head(x0, -1, item.y + 4)} stroke="var(--fg-muted)" strokeWidth={2} fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1={x0} x2={x1 - 2} y1={item.y} y2={item.y} stroke="var(--fg-muted)" strokeWidth={2} />
                  <path d={head(x1, 1, item.y)} stroke="var(--fg-muted)" strokeWidth={2} fill="none" strokeLinecap="round" />
                </>
              )}
              {a.reagents && (
                <text x={cx} y={item.y - 20} textAnchor="middle" dominantBaseline="central" fontSize={SCHEME_FONT} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {a.reagents}
                </text>
              )}
              {a.conditions && (
                <text x={cx} y={item.y + 22} textAnchor="middle" dominantBaseline="central" fontSize={SCHEME_FONT} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {a.conditions}
                </text>
              )}
            </g>
          )
        }
        if (!item.species) return null
        const s = item.species
        const tag = s.tag
        return (
          <g key={`s-${i}`} opacity={op}>
            {typeof s.formula === 'string' ? (
              <text x={cx} y={item.y} textAnchor="middle" dominantBaseline="central" fontSize={SCHEME_TEXT_SPECIES} fontFamily="var(--font-sans)" fill="var(--fg)">
                {s.formula}
              </text>
            ) : (
              <g transform={`translate(${cx}, ${item.y})`}>
                <SkeletalFormula graph={s.formula} scale={layout.scale} highlightAtoms={s.highlightAtoms ?? []} />
              </g>
            )}
            {tag && (
              <text x={cx} y={item.y + layout.structHeight / 2 + 20} textAnchor="middle" dominantBaseline="central" fontSize={15} fontStyle="italic" fontFamily="var(--font-sans)" fill={tag === 'major' ? 'var(--accent)' : 'var(--fg-subtle)'}>
                {tag}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
})
