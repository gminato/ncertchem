'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from './useStepTween'
import { Symbolised } from './symbols'
import { ETHYNE_STEP_COUNT, ethyneStepAt } from './vbt-steps'

export interface EthynePiProps {
  step: number
  reducedMotion: boolean
}

const CENTRE = { x: 300, y: 185 }
/** Distance of each π_y lobe above and below the axis, in SVG units. */
const PI_Y_OFFSET = 88
/** Distance of each π_z lobe left and right of the axis. */
const PI_Z_OFFSET = 120
/** The second carbon's lobe is drawn offset by this much, so both carbons' lobes show. */
const PARTNER_SHIFT = 16

const CAPTIONS = [
  'One σ bond: sp hybrids overlap end on, along the axis',
  'First π bond: 2p_y from both carbons, above and below',
  'Second π bond: 2p_z from both carbons, left and right',
  'Together: one σ and two π bonds make the triple bond',
] as const

/**
 * Ethyne seen down the C≡C axis, which points at the viewer. The σ bond is the disc on the axis.
 * Each π bond is formed by the p orbitals of both carbons. In this view the two carbons' lobes
 * sit on top of each other, so the second carbon's lobe is drawn as a dashed outline, offset a
 * little. The two π bonds are at right angles to each other and to the axis. Coral is positive
 * and teal negative.
 */
export function EthynePi({ step, reducedMotion }: EthynePiProps) {
  const index = Math.min(ETHYNE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const target = ethyneStepAt(index)
  const { sigma, piY, piZ } = useStepTween(target, reducedMotion)
  const pos = { fill: 'var(--orbital-pos)', fillOpacity: 0.55, stroke: 'var(--orbital-pos)' }
  const neg = { fill: 'var(--orbital-neg)', fillOpacity: 0.55, stroke: 'var(--orbital-neg)' }
  const partner = (colour: string) => ({ fill: 'none', stroke: colour, strokeDasharray: '5 4' })

  return (
    <svg
      viewBox="0 0 600 440"
      role="img"
      aria-label="Ethyne end on: a σ bond on the axis and two π bonds at right angles, each from both carbons' p orbitals"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />

      {/* π bond from the p_y orbitals: lobes above (positive) and below (negative) the axis */}
      <g opacity={piY} data-testid="pi-y">
        <ellipse cx={CENTRE.x} cy={CENTRE.y - PI_Y_OFFSET} rx={62} ry={38} style={{ ...pos, fillOpacity: 0.55 }} strokeWidth={1.4} />
        <ellipse cx={CENTRE.x + PARTNER_SHIFT} cy={CENTRE.y - PI_Y_OFFSET} rx={62} ry={38} style={partner('var(--orbital-pos)')} strokeWidth={1.4} />
        <ellipse cx={CENTRE.x} cy={CENTRE.y + PI_Y_OFFSET} rx={62} ry={38} style={{ ...neg, fillOpacity: 0.55 }} strokeWidth={1.4} />
        <ellipse cx={CENTRE.x + PARTNER_SHIFT} cy={CENTRE.y + PI_Y_OFFSET} rx={62} ry={38} style={partner('var(--orbital-neg)')} strokeWidth={1.4} />
      </g>

      {/* π bond from the p_z orbitals: lobes left (positive) and right (negative) of the axis */}
      <g opacity={piZ} data-testid="pi-z">
        <ellipse cx={CENTRE.x - PI_Z_OFFSET} cy={CENTRE.y} rx={38} ry={62} style={pos} strokeWidth={1.4} />
        <ellipse cx={CENTRE.x - PI_Z_OFFSET} cy={CENTRE.y + PARTNER_SHIFT} rx={38} ry={62} style={partner('var(--orbital-pos)')} strokeWidth={1.4} />
        <ellipse cx={CENTRE.x + PI_Z_OFFSET} cy={CENTRE.y} rx={38} ry={62} style={neg} strokeWidth={1.4} />
        <ellipse cx={CENTRE.x + PI_Z_OFFSET} cy={CENTRE.y + PARTNER_SHIFT} rx={38} ry={62} style={partner('var(--orbital-neg)')} strokeWidth={1.4} />
      </g>

      {/* σ bond on the axis */}
      <g opacity={sigma} data-testid="sigma">
        <circle cx={CENTRE.x} cy={CENTRE.y} r={30} style={{ fill: 'var(--accent)', fillOpacity: 0.35, stroke: 'var(--accent)' }} strokeWidth={1.6} />
        <Label x={CENTRE.x} y={CENTRE.y} fontSize={20} fill="var(--fg)">
          <tspan className="sym">σ</tspan>
        </Label>
      </g>

      <Label x={CENTRE.x} y={42} fontSize={16} fill="var(--fg)" style={{ opacity: piY }} data-testid="pi-y-label">
        <Symbolised text="π: C₁ 2p_y + C₂ 2p_y" />
      </Label>
      <Label x={CENTRE.x} y={352} fontSize={16} fill="var(--fg)" style={{ opacity: piZ }} data-testid="pi-z-label">
        <Symbolised text="π: C₁ 2p_z + C₂ 2p_z" />
      </Label>

      <Label x={300} y={398} fontSize={16} fill="var(--fg)" data-testid="ethyne-caption">
        <Symbolised text={CAPTIONS[index]} />
      </Label>
      <Label x={300} y={426} fontSize={14} fill="var(--fg-subtle)">
        Coral positive, teal negative. The C≡C axis points at you. Dashed: second carbon.
      </Label>
    </svg>
  )
}
