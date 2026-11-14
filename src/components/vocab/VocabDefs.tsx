import React from 'react'

export interface VocabDefsProps {
  idPrefix?: string
}

export function VocabDefs({ idPrefix = 'vocab' }: VocabDefsProps) {
  return (
    <defs>
      {/* Electron radial glow halo */}
      <radialGradient
        id={`${idPrefix}-electron-glow`}
        cx="50%"
        cy="50%"
        r="50%"
      >
        <stop offset="0%" stopColor="var(--electron)" stopOpacity="0.8" />
        <stop offset="35%" stopColor="var(--electron)" stopOpacity="0.35" />
        <stop offset="70%" stopColor="var(--electron)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="var(--electron)" stopOpacity="0" />
      </radialGradient>

      {/* Shading overlay for 3D nucleon spheres */}
      <radialGradient
        id={`${idPrefix}-sphere-shading`}
        cx="35%"
        cy="35%"
        r="65%"
        fx="28%"
        fy="28%"
      >
        <stop offset="0%" stopColor="var(--sphere-highlight)" stopOpacity="0.75" />
        <stop offset="40%" stopColor="var(--sphere-highlight)" stopOpacity="0" />
        <stop offset="70%" stopColor="var(--sphere-shadow)" stopOpacity="0" />
        <stop offset="100%" stopColor="var(--sphere-shadow)" stopOpacity="0.6" />
      </radialGradient>

      {/* Nucleus warm glow halo */}
      <radialGradient
        id={`${idPrefix}-nucleus-halo`}
        cx="50%"
        cy="50%"
        r="50%"
      >
        <stop offset="0%" stopColor="var(--nucleus-glow)" stopOpacity="0.9" />
        <stop offset="45%" stopColor="var(--nucleus-glow)" stopOpacity="0.4" />
        <stop offset="75%" stopColor="var(--nucleus-glow)" stopOpacity="0.1" />
        <stop offset="100%" stopColor="var(--nucleus-glow)" stopOpacity="0" />
      </radialGradient>

      {/* Subtle glow filter for luminous entities in dark mode */}
      <filter
        id={`${idPrefix}-glow-filter`}
        x="-50%"
        y="-50%"
        width="200%"
        height="200%"
      >
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}
