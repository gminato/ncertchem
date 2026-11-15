'use client'

import { Atom, Label, VocabDefs } from '@/components/vocab'
import { useTweenedValues } from '@/components/animations/unit2/bohr/useTweenedValues'
import { CARBON_BONDS, bondLengthTarget } from './parameters-steps'

export interface BondLengthRadiiProps {
  step: number
  reducedMotion: boolean
}

// SVG viewBox 580 × 300. One unit is one picture-pm, so a radius of 77 is drawn at 77 units.
const VIEW = { width: 580, height: 490 }
/** Scale and offset that enlarge the drawing and centre it in the tall panel. */
const S = 1.25
const FIT = `translate(${290 - 290 * S}, ${245 - 165 * S}) scale(${S})`
const CENTRE_X = 290
const ATOM_Y = 120
const DIM_Y = 232

/**
 * Two carbon atoms drawn to scale, each as a sphere of its covalent radius. The
 * bond length is the distance between the nuclei, and it is the sum of the two
 * radii (Section 4.3.1). Each Step changes the bond order, and the radii shrink
 * with it: a double bond draws its carbons at 67 pm and a triple at 60 pm.
 */
export function BondLengthRadii({ step, reducedMotion }: BondLengthRadiiProps) {
  const target = bondLengthTarget(step)
  const live = useTweenedValues(
    { radius: target.radiusPm, length: target.lengthPm, second: target.second },
    reducedMotion
  )

  // The pair stays centred: each nucleus sits half the bond length from the middle.
  const aX = CENTRE_X - live.length / 2
  const bX = CENTRE_X + live.length / 2
  const r = live.radius
  const bond = CARBON_BONDS[target.bondOrder - 1]

  const heading = target.second === 1 ? `${bond.label}: ${bond.order === 1 ? 'single' : bond.order === 2 ? 'double' : 'triple'} bond` : 'One carbon atom'
  const note =
    target.second === 1
      ? target.bondOrder === 1
        ? `Table 4.2 prints ${bond.lengthPm} pm for ${bond.label}, the same as the sum.`
        : `Table 4.2 prints ${bond.lengthPm} pm for ${bond.label}. The radii give ${target.lengthPm} pm.`
      : ''

  const radiusLabel = (x: number) => (
    <Label x={x} y={ATOM_Y + r + 18} fontSize={16} fill="var(--fg)">
      <tspan className="sym">r</tspan>
      <tspan dy="0.3em" fontSize="0.7em">
        cov
      </tspan>
      <tspan dy="-0.3em"> = {Math.round(r)} pm</tspan>
    </Label>
  )

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={`Carbon atoms drawn to scale, each with covalent radius ${Math.round(r)} pm. ${
        target.second === 1
          ? `Their nuclei are ${Math.round(live.length)} pm apart, the sum of the two radii, for a ${bond.label} bond.`
          : 'One carbon atom, with its covalent radius marked from the centre to the edge.'
      }`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <VocabDefs />
      <g transform={FIT}>

      <g data-layer="atom-a">
        <Atom element="C" x={aX} y={ATOM_Y} r={r} />
        <line x1={aX} y1={ATOM_Y} x2={aX + r} y2={ATOM_Y} stroke="var(--fg)" strokeWidth={1.5} />
        {radiusLabel(aX)}
      </g>

      <g data-layer="atom-b" data-visible={target.second === 1 ? 'true' : 'false'} opacity={live.second}>
        <Atom element="C" x={bX} y={ATOM_Y} r={r} />
        <line x1={bX} y1={ATOM_Y} x2={bX - r} y2={ATOM_Y} stroke="var(--fg)" strokeWidth={1.5} />
        {radiusLabel(bX)}
      </g>

      <g data-layer="dimension" opacity={live.second}>
        <line x1={aX} y1={DIM_Y} x2={bX} y2={DIM_Y} stroke="var(--accent)" strokeWidth={1.5} />
        <line x1={aX} y1={DIM_Y - 7} x2={aX} y2={DIM_Y + 7} stroke="var(--accent)" strokeWidth={1.5} />
        <line x1={bX} y1={DIM_Y - 7} x2={bX} y2={DIM_Y + 7} stroke="var(--accent)" strokeWidth={1.5} />
        <Label x={CENTRE_X} y={DIM_Y + 26} fontSize={17} fill="var(--accent)">
          <tspan className="sym">R</tspan> = {Math.round(live.length)} pm
        </Label>
      </g>

      <Label x={CENTRE_X} y={34} fontSize={16} fill="var(--fg-muted)">
        {heading}
      </Label>

      <Label x={CENTRE_X} y={282} fontSize={15} fill="var(--fg-subtle)">
        {note}
      </Label>
      </g>
    </svg>
  )
}
