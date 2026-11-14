import React, { forwardRef } from 'react'

export interface ElectronProps extends React.SVGAttributes<SVGGElement> {
  x?: number
  y?: number
  size?: number
  scale?: number
  defsPrefix?: string
}

export const Electron = forwardRef<SVGGElement, ElectronProps>(function Electron(
  {
    x = 0,
    y = 0,
    size = 10,
    scale = 1,
    defsPrefix = 'vocab',
    className,
    style,
    ...rest
  },
  ref
) {
  const radius = size / 2
  const haloRadius = radius * 3.5

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={className}
      style={style}
      {...rest}
    >
      {/* Soft radial glow halo - opacity scales with --glow-strength */}
      <circle
        cx={0}
        cy={0}
        r={haloRadius}
        fill={`url(#${defsPrefix}-electron-glow)`}
        style={{
          opacity: 'calc(0.18 + 0.82 * var(--glow-strength))',
          pointerEvents: 'none',
        }}
      />

      {/* Solid electron core */}
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill="var(--electron)"
      />
    </g>
  )
})
