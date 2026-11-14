import React, { forwardRef } from 'react'

export interface EnergyLevelProps extends React.SVGAttributes<SVGGElement> {
  variant?: 'orbit' | 'ladder'
  r?: number
  width?: number
  active?: boolean
  x?: number
  y?: number
  scale?: number
}

export const EnergyLevel = forwardRef<SVGGElement, EnergyLevelProps>(function EnergyLevel(
  {
    variant = 'orbit',
    r = 40,
    width = 100,
    active = false,
    x = 0,
    y = 0,
    scale = 1,
    className,
    style,
    ...rest
  },
  ref
) {
  const strokeColor = active ? 'var(--orbit-active)' : 'var(--orbit)'
  const strokeWidth = active ? 2.5 : 1.4

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={className}
      style={{
        filter: active
          ? 'drop-shadow(0 0 calc(3px * var(--glow-strength)) var(--orbit-active))'
          : undefined,
        ...style,
      }}
      {...rest}
    >
      {variant === 'orbit' ? (
        <circle
          cx={0}
          cy={0}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      ) : (
        <line
          x1={-width / 2}
          y1={0}
          x2={width / 2}
          y2={0}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
    </g>
  )
})
