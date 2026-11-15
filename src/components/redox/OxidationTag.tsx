import React, { forwardRef, useMemo } from 'react'
import {
  parseChemicalFormula,
  resolveBadgePositions,
  formatTrueMinus,
  type PlacedBadge,
} from './geometry'

export const OXIDATION_TAG_SIZE = { width: 170, height: 80 } as const

export interface TagSpec {
  element?: string
  atomIndex?: number
  value: string
  tone?: 'ox' | 'red' | 'neutral' | 'accent'
}

export interface OxidationTagProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  formula: string
  charge?: string
  tags: readonly TagSpec[]
  tone?: 'ox' | 'red' | 'neutral' | 'accent'
  x?: number
  y?: number
  fontSize?: number
}

interface AtomLayout {
  element: string
  count?: string
  index: number
  charWidth: number
  startX: number
  elementCenterX: number
  endX: number
}

/** Returns approximate render width of element symbol in Inter sans */
function elementCharWidth(element: string, fontSize: number): number {
  let w = 0
  for (const ch of element) {
    if (ch >= 'A' && ch <= 'Z') {
      if (ch === 'M' || ch === 'W') w += fontSize * 0.88
      else if (ch === 'I' || ch === 'J') w += fontSize * 0.42
      else w += fontSize * 0.72
    } else if (ch >= 'a' && ch <= 'z') {
      if (ch === 'm' || ch === 'w') w += fontSize * 0.82
      else if (ch === 'i' || ch === 'l') w += fontSize * 0.32
      else if (ch === 'r' || ch === 't') w += fontSize * 0.42
      else w += fontSize * 0.56
    }
  }
  return w
}

export const OxidationTag = forwardRef<SVGGElement, OxidationTagProps>(function OxidationTag(
  {
    formula,
    charge,
    tags,
    tone = 'neutral',
    x = 0,
    y = 0,
    fontSize = 22,
    className,
    ...rest
  },
  ref
) {
  const parts = useMemo(() => parseChemicalFormula(formula), [formula])

  // Accurate metric layout for elements, subscripts and charges
  const { atomLayouts, totalFormulaWidth } = useMemo(() => {
    let currentX = 0
    const layouts: AtomLayout[] = []

    for (const part of parts) {
      const elemWidth = elementCharWidth(part.element, fontSize)
      const subWidth = part.count ? part.count.length * (fontSize * 0.50) + 2 : 0
      const startX = currentX
      const elementCenterX = startX + elemWidth / 2
      const endX = startX + elemWidth + subWidth

      layouts.push({
        element: part.element,
        count: part.count,
        index: part.index,
        charWidth: elemWidth,
        startX,
        elementCenterX,
        endX,
      })

      currentX = endX + 8 // generous 8px spacing between atom groups
    }

    const chargeWidth = charge ? charge.length * (fontSize * 0.48) + 4 : 0
    return {
      atomLayouts: layouts,
      totalFormulaWidth: currentX + chargeWidth,
    }
  }, [parts, charge, fontSize])

  // Map tags to atom targets
  const placedBadges = useMemo(() => {
    const rawBadges = tags.map((t, idx) => {
      let targetLayout: AtomLayout | undefined
      if (t.atomIndex !== undefined) {
        targetLayout = atomLayouts[t.atomIndex]
      } else if (t.element) {
        targetLayout = atomLayouts.find((l) => l.element === t.element)
      }
      if (!targetLayout && atomLayouts.length > 0) {
        targetLayout = atomLayouts[Math.min(idx, atomLayouts.length - 1)]
      }

      const targetX = targetLayout ? targetLayout.elementCenterX : 0
      const badgeWidth = Math.max(34, t.value.length * 10 + 14)

      return {
        id: idx,
        targetX,
        width: badgeWidth,
        tag: t,
      }
    })

    const resolved = resolveBadgePositions(rawBadges, 8)
    const map = new Map<string | number, PlacedBadge>()
    for (const r of resolved) {
      map.set(r.id, r)
    }

    return rawBadges.map((b) => ({
      ...b,
      placed: map.get(b.id) ?? { id: b.id, x: b.targetX, targetX: b.targetX, nudged: false },
    }))
  }, [tags, atomLayouts])

  // Center formula horizontally around x=0
  const formulaOffsetX = -totalFormulaWidth / 2
  const formulaBaselineY = 20
  const badgeCenterY = -22
  const badgeHeight = 22

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      {...rest}
    >
      {/* Oxidation number badges above atoms */}
      {placedBadges.map(({ id, tag, placed, targetX, width }) => {
        const badgeTone = tag.tone ?? tone
        const strokeColor =
          badgeTone === 'ox'
            ? 'var(--ox)'
            : badgeTone === 'red'
              ? 'var(--red)'
              : badgeTone === 'accent'
                ? 'var(--accent)'
                : 'var(--border)'

        const textColor =
          badgeTone === 'ox'
            ? 'var(--ox)'
            : badgeTone === 'red'
              ? 'var(--red)'
              : badgeTone === 'accent'
                ? 'var(--accent)'
                : 'var(--fg-muted)'

        const badgeX = formulaOffsetX + placed.x
        const elemX = formulaOffsetX + targetX
        const badgeHalfWidth = width / 2
        const badgeBottom = badgeCenterY + badgeHeight / 2
        const targetTopY = formulaBaselineY - fontSize * 0.75

        return (
          <g key={id}>
            {/* Leader tick line from badge to atom */}
            {placed.nudged ? (
              <path
                d={`M ${badgeX} ${badgeBottom} L ${elemX} ${targetTopY}`}
                stroke={strokeColor}
                strokeWidth={1.2}
                strokeDasharray="2 2"
                opacity={0.8}
              />
            ) : (
              <line
                x1={badgeX}
                y1={badgeBottom}
                x2={badgeX}
                y2={targetTopY}
                stroke={strokeColor}
                strokeWidth={1.2}
                opacity={0.7}
              />
            )}

            {/* Badge pill */}
            <rect
              x={badgeX - badgeHalfWidth}
              y={badgeCenterY - badgeHeight / 2}
              width={width}
              height={badgeHeight}
              rx={5}
              fill="var(--surface-raised)"
              stroke={strokeColor}
              strokeWidth={1.5}
            />

            {/* Badge value (minimum 13px) */}
            <text
              x={badgeX}
              y={badgeCenterY + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={textColor}
              style={{ userSelect: 'none' }}
            >
              {formatTrueMinus(tag.value)}
            </text>
          </g>
        )
      })}

      {/* Chemical Formula line */}
      <text
        fontFamily="var(--font-sans)"
        fontSize={fontSize}
        fill="var(--fg)"
        fontWeight={500}
        dominantBaseline="alphabetic"
        style={{ userSelect: 'none' }}
      >
        {parts.map((p, idx) => {
          const layout = atomLayouts[idx]
          const elemX = formulaOffsetX + (layout ? layout.startX : 0)
          const elemWidth = layout ? layout.charWidth : fontSize * 0.7
          const subX = elemX + elemWidth + 1

          return (
            <React.Fragment key={idx}>
              <tspan x={elemX} y={formulaBaselineY}>
                {p.element}
              </tspan>
              {p.count && (
                <tspan
                  x={subX}
                  y={formulaBaselineY + Math.round(fontSize * 0.22)}
                  fontSize={Math.max(13, Math.round(fontSize * 0.72))}
                  fill="var(--fg-muted)"
                >
                  {p.count}
                </tspan>
              )}
            </React.Fragment>
          )
        })}

        {charge && (
          <tspan
            x={formulaOffsetX + totalFormulaWidth - (charge.length * (fontSize * 0.48) + 2)}
            y={formulaBaselineY - Math.round(fontSize * 0.44)}
            fontSize={Math.max(13, Math.round(fontSize * 0.72))}
            fill="var(--fg-muted)"
            fontWeight={600}
          >
            {formatTrueMinus(charge)}
          </tspan>
        )}
      </text>
    </g>
  )
})
