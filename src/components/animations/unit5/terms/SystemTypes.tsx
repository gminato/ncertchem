'use client'

import { SystemBoundary } from '@/components/thermo/SystemBoundary'
import { Label } from '@/components/vocab'
import { SYSTEM_TYPES_STEP_COUNT, systemTypeForStep } from './system-types-steps'
import { clampIndex } from './useTweenedSnapshot'
import styles from './terms.module.css'

export interface SystemTypesProps {
  step: number
  reducedMotion: boolean
}

// Viewbox sized for the ~570 px Scrolly panel: the boundary and its surroundings span about 64%
// of the width, and every label is 14 units or larger.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 340
const BOUNDARY = { x: 280, y: 165, width: 280, height: 160, margin: 56 }
const WALL = {
  left: BOUNDARY.x - BOUNDARY.width / 2,
  right: BOUNDARY.x + BOUNDARY.width / 2,
  top: BOUNDARY.y - BOUNDARY.height / 2,
  bottom: BOUNDARY.y + BOUNDARY.height / 2,
}

/**
 * SystemTypes: one boundary drawn in the three kinds from Section 5.1.2, with the flows that each
 * kind allows. The drawing is keyed by Step, so each Step fades in its own picture.
 */
export function SystemTypes({ step, reducedMotion }: SystemTypesProps) {
  const index = clampIndex(step, SYSTEM_TYPES_STEP_COUNT)
  const target = systemTypeForStep(index)
  const motion = reducedMotion ? undefined : styles.enter

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label={`Diagram of a system with its boundary. ${target.caption}.`}
      data-testid="thermo-system-types"
      data-step={index}
      data-kind={target.kind}
    >
      <g key={index} className={motion}>
        <SystemBoundary
          kind={target.kind}
          matter={target.matter}
          heat={target.heat}
          work={target.work}
          particles={index === 0 ? 0 : 12}
          animated={target.matter !== 'none' || target.heat !== 'none' || target.work !== 'none'}
          x={BOUNDARY.x}
          y={BOUNDARY.y}
          width={BOUNDARY.width}
          height={BOUNDARY.height}
          margin={BOUNDARY.margin}
        />

        {index === 0 && (
          <g>
            <Label x={BOUNDARY.x} y={WALL.top - BOUNDARY.margin / 2} fontSize={15} fill="var(--fg)">
              surroundings
            </Label>
            <Label x={BOUNDARY.x} y={BOUNDARY.y} fontSize={15} fill="var(--fg)">
              system
            </Label>
            <Label x={BOUNDARY.x} y={WALL.bottom + 22} fontSize={15} fill="var(--fg)">
              boundary
            </Label>
          </g>
        )}

        {index === 1 && (
          <g>
            <Label x={WALL.right + 52} y={WALL.top - BOUNDARY.margin / 2} fontSize={15} fill="var(--fg)">
              matter
            </Label>
            <Label x={WALL.left - 30} y={WALL.top + 40} fontSize={15} fill="var(--heat)">
              <tspan className="sym">q</tspan> in
            </Label>
          </g>
        )}

        {index === 2 && (
          <g>
            <Label x={WALL.left - 30} y={WALL.top + 40} fontSize={15} fill="var(--heat)">
              <tspan className="sym">q</tspan> out
            </Label>
            <Label x={WALL.right + 34} y={WALL.top + 40} fontSize={15} fill="var(--work)">
              <tspan className="sym">w</tspan> in
            </Label>
          </g>
        )}

        <Label x={BOUNDARY.x} y={318} fontSize={15} fill="var(--fg)">
          {target.caption}
        </Label>
      </g>
    </svg>
  )
}
