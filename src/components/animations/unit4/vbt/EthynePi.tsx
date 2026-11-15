'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from './useStepTween'
import { Symbolised } from './symbols'
import { ETHYNE_STEP_COUNT, ethyneStepAt } from './vbt-steps'

export interface EthynePiProps {
  step: number
  reducedMotion: boolean
}

const CENTRE = { x: 300, y: 140 }
/** Offset of each π lobe from the axis, in SVG units. */
const LOBE_OFFSET = 56

const CAPTIONS = [
  'One σ bond: the sp hybrids overlap end on, along the C≡C axis',
  'First π bond: the two p_y orbitals overlap above and below the axis',
  'Second π bond: the two p_z orbitals overlap left and right',
  'Together: one σ and two π bonds make the triple bond',
] as const

/**
 * Ethyne seen down the C≡C axis, which points at the viewer. The σ bond is the disc on the axis.
 * The two π bonds come from the two p orbitals of each carbon that are not hybridised, and they
 * sit at right angles to each other and to the axis. Coral is positive and teal negative.
 */
export function EthynePi({ step, reducedMotion }: EthynePiProps) {
  const index = Math.min(ETHYNE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const target = ethyneStepAt(index)
  const { sigma, piY, piZ } = useStepTween(target, reducedMotion)

  return (
    <svg
      viewBox="0 0 600 340"
      role="img"
      aria-label="Ethyne end on: a σ bond on the axis and two π bonds at right angles"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />

      {/* π bond from the p_y orbitals: lobes above (positive) and below (negative) the axis */}
      <g opacity={piY} data-testid="pi-y">
        <ellipse cx={CENTRE.x} cy={CENTRE.y - LOBE_OFFSET} rx={34} ry={24} style={{ fill: 'var(--orbital-pos)', fillOpacity: 0.55, stroke: 'var(--orbital-pos)' }} strokeWidth={1.2} />
        <ellipse cx={CENTRE.x} cy={CENTRE.y + LOBE_OFFSET} rx={34} ry={24} style={{ fill: 'var(--orbital-neg)', fillOpacity: 0.55, stroke: 'var(--orbital-neg)' }} strokeWidth={1.2} />
      </g>

      {/* π bond from the p_z orbitals: lobes left and right of the axis */}
      <g opacity={piZ} data-testid="pi-z">
        <ellipse cx={CENTRE.x - LOBE_OFFSET - 28} cy={CENTRE.y} rx={24} ry={34} style={{ fill: 'var(--orbital-pos)', fillOpacity: 0.55, stroke: 'var(--orbital-pos)' }} strokeWidth={1.2} />
        <ellipse cx={CENTRE.x + LOBE_OFFSET + 28} cy={CENTRE.y} rx={24} ry={34} style={{ fill: 'var(--orbital-neg)', fillOpacity: 0.55, stroke: 'var(--orbital-neg)' }} strokeWidth={1.2} />
      </g>

      {/* σ bond on the axis */}
      <g opacity={sigma} data-testid="sigma">
        <circle cx={CENTRE.x} cy={CENTRE.y} r={22} style={{ fill: 'var(--accent)', fillOpacity: 0.35, stroke: 'var(--accent)' }} strokeWidth={1.4} />
        <Label x={CENTRE.x} y={CENTRE.y} fontSize={16} fill="var(--fg)">
          <tspan className="sym">σ</tspan>
        </Label>
      </g>

      <circle cx={CENTRE.x} cy={CENTRE.y} r={2.8} style={{ fill: 'var(--fg)' }} />

      <Label x={430} y={92} textAnchor="start" fontSize={14} fill="var(--fg)" style={{ opacity: piY }}>
        <tspan className="sym">π</tspan> from 2<tspan className="sym">p</tspan>
        <tspan className="sym" dy="4" fontSize="11">y</tspan>
      </Label>
      <Label x={100} y={200} textAnchor="start" fontSize={14} fill="var(--fg)" style={{ opacity: piZ }}>
        <tspan className="sym">π</tspan> from 2<tspan className="sym">p</tspan>
        <tspan className="sym" dy="4" fontSize="11">z</tspan>
      </Label>

      <Label x={300} y={262} fontSize={16} fill="var(--fg)" data-testid="ethyne-caption">
        <Symbolised text={CAPTIONS[index]} />
      </Label>
      <Label x={300} y={300} fontSize={14} fill="var(--fg-subtle)">
        The C≡C axis points at you. Coral is positive, teal negative.
      </Label>
    </svg>
  )
}
