'use client'

import { Label } from '@/components/vocab'
import { radiusFromSeparation } from '@/lib/chem/ionic-radii'
import type { RadiiStepProps } from './PeriodRadii'

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 300
/** Drawing scale in px per pm, shared by both pictures so the sizes compare directly. */
const PX_PER_PM = 0.55
const BASE_Y = 200

/** NCERT 3.7.1(a): bond distance in Cl₂ is 198 pm; the Cu–Cu distance in solid copper is 256 pm. */
const CL_BOND_PM = 198
const CU_SPACING_PM = 256

const COVALENT_CENTRES = [VIEW_WIDTH / 2 - (CL_BOND_PM * PX_PER_PM) / 2, VIEW_WIDTH / 2 + (CL_BOND_PM * PX_PER_PM) / 2]
const CU_CENTRES = [0, 1, 2].map((i) => VIEW_WIDTH / 2 + (i - 1) * CU_SPACING_PM * PX_PER_PM)

/** Step targets: 0 covalent pair, 1 metallic lattice, 2 both read as half a separation. */
export function definitionTarget(step: number): { covalent: number; metallic: number; halves: number } {
  switch (step) {
    case 0:
      return { covalent: 1, metallic: 0, halves: 0 }
    case 1:
      return { covalent: 0, metallic: 1, halves: 0 }
    default:
      return { covalent: 1, metallic: 1, halves: 1 }
  }
}

/**
 * Scrolly visual: a covalent pair of Cl atoms and a metallic row of Cu atoms, drawn at one
 * scale. The covalent radius is half the Cl–Cl bond; the metallic radius is half the Cu–Cu
 * spacing. Opacity transitions carry the change between Steps.
 */
export function DefinitionRadii({ step, reducedMotion }: RadiiStepProps) {
  const t = definitionTarget(step)
  const covalentR = radiusFromSeparation(CL_BOND_PM) * PX_PER_PM
  const metallicR = radiusFromSeparation(CU_SPACING_PM) * PX_PER_PM
  const transition = reducedMotion ? 'none' : 'opacity 600ms ease'

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="Two chlorine atoms bonded 198 pm apart, and three copper atoms 256 pm apart. Each radius is half the distance between the atoms."
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <g style={{ opacity: t.covalent, transition }}>
        <circle cx={COVALENT_CENTRES[0]} cy={BASE_Y - covalentR} r={covalentR} style={{ fill: 'var(--electron)', opacity: 0.22, stroke: 'var(--electron)', strokeWidth: 1.5 }} />
        <circle cx={COVALENT_CENTRES[1]} cy={BASE_Y - covalentR} r={covalentR} style={{ fill: 'var(--electron)', opacity: 0.22, stroke: 'var(--electron)', strokeWidth: 1.5 }} />
        <line x1={COVALENT_CENTRES[0]} x2={COVALENT_CENTRES[1]} y1={BASE_Y - covalentR} y2={BASE_Y - covalentR} style={{ stroke: 'var(--fg)', strokeWidth: 1.5 }} />
        <Label x={VIEW_WIDTH / 2} y={BASE_Y - 2 * covalentR - 14} fontSize={16} halo fill="var(--fg)">
          Cl–Cl bond, 198 pm
        </Label>
        <Label x={VIEW_WIDTH / 2} y={BASE_Y + 26} fontSize={16} halo fill="var(--fg-muted)">
          covalent radius = 198 / 2 = 99 pm
        </Label>
      </g>

      <g style={{ opacity: t.metallic, transition }}>
        {CU_CENTRES.map((cx, i) => (
          <circle key={i} cx={cx} cy={BASE_Y - metallicR} r={metallicR} style={{ fill: 'var(--proton)', opacity: 0.22, stroke: 'var(--proton)', strokeWidth: 1.5 }} />
        ))}
        <line x1={CU_CENTRES[0]} x2={CU_CENTRES[1]} y1={BASE_Y - metallicR} y2={BASE_Y - metallicR} style={{ stroke: 'var(--fg)', strokeWidth: 1.5 }} />
        <Label x={VIEW_WIDTH / 2} y={BASE_Y - 2 * metallicR - 14} fontSize={16} halo fill="var(--fg)">
          Cu–Cu spacing, 256 pm
        </Label>
        <Label x={VIEW_WIDTH / 2} y={BASE_Y + 26} fontSize={16} halo fill="var(--fg-muted)">
          metallic radius = 256 / 2 = 128 pm
        </Label>
      </g>

      <g style={{ opacity: t.halves, transition }}>
        <line x1={0} x2={VIEW_WIDTH} y1={BASE_Y + 56} y2={BASE_Y + 56} style={{ stroke: 'var(--border)', strokeWidth: 1 }} />
        <Label x={VIEW_WIDTH / 2} y={BASE_Y + 80} fontSize={16} halo fill="var(--fg)">
          Both radii: half the distance between the two nuclei
        </Label>
      </g>
    </svg>
  )
}
