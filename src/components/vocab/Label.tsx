import React, { forwardRef } from 'react'

export interface LabelProps extends React.SVGAttributes<SVGTextElement> {
  x?: number
  y?: number
  sub?: React.ReactNode
  sup?: React.ReactNode
  fontSize?: number | string
  children?: React.ReactNode
}

export function LabelSub({ children }: { children: React.ReactNode }) {
  return (
    <tspan dy="0.32em" fontSize="0.75em" fill="currentColor">
      {children}
    </tspan>
  )
}

export function LabelSup({ children }: { children: React.ReactNode }) {
  return (
    <tspan dy="-0.45em" fontSize="0.75em" fill="currentColor">
      {children}
    </tspan>
  )
}

const LabelComponent = forwardRef<SVGTextElement, LabelProps>(function Label(
  {
    x = 0,
    y = 0,
    sub,
    sup,
    fontSize = 12,
    textAnchor = 'middle',
    dominantBaseline = 'central',
    children,
    className,
    style,
    ...rest
  },
  ref
) {
  return (
    <text
      ref={ref}
      x={x}
      y={y}
      fill="var(--fg-muted)"
      fontFamily="var(--font-sans)"
      fontSize={fontSize}
      textAnchor={textAnchor}
      dominantBaseline={dominantBaseline}
      style={{
        fontVariant: 'all-small-caps',
        fontVariantCaps: 'all-small-caps',
        letterSpacing: '0.06em',
        userSelect: 'none',
        ...style,
      }}
      className={className}
      {...rest}
    >
      {children}
      {sub && (
        <tspan dy="0.32em" fontSize="0.75em" fill="var(--fg-subtle)">
          {sub}
        </tspan>
      )}
      {sup && (
        <tspan dy={sub ? '-0.65em' : '-0.45em'} fontSize="0.75em" fill="var(--fg-subtle)">
          {sup}
        </tspan>
      )}
    </text>
  )
})

export const Label = Object.assign(LabelComponent, {
  Sub: LabelSub,
  Sup: LabelSup,
})
