'use client'

import { Atom, Label, VocabDefs } from '@/components/vocab'
import { LewisDiagram, type LewisAtom } from '@/components/molecule/LewisDiagram'
import type { LewisBondSpec } from '@/components/molecule/lewis-geometry'
import { useTweenedValues } from '@/components/animations/unit2/bohr/useTweenedValues'
import { OZONE_LENGTHS, resonanceTarget } from './parameters-steps'

export interface OzoneResonanceProps {
  step: number
  reducedMotion: boolean
}

// SVG viewBox 580 × 300.
const VIEW = { width: 580, height: 490 }
/** Enlarges the drawing about its centre, which sits at the middle of the tall panel. */
const S = 1.25
const FIT = `translate(${290 - 290 * S}, ${245 - 154 * S}) scale(${S})`
const CX = 290
const CY = 108
/** How far apart the two forms sit once they are shown side by side, and their scale then. */
const SPREAD = 140
const SIDE_SCALE_LOSS = 0.28

/** Canonical form I: a double bond on the left (O=O⁺–O⁻), with the charges written on the atoms. */
const FORM_I: { atoms: LewisAtom[]; bonds: LewisBondSpec[] } = {
  atoms: [
    { id: 'a', element: 'O', x: -110, y: 0, lonePairs: 2 },
    { id: 'b', element: 'O', x: 0, y: -36, lonePairs: 1, formalCharge: 1 },
    { id: 'c', element: 'O', x: 110, y: 0, lonePairs: 3, formalCharge: -1 },
  ],
  bonds: [
    { a: 'a', b: 'b', order: 2 },
    { a: 'b', b: 'c', order: 1 },
  ],
}

/** Canonical form II: the mirror image, with the double bond on the right. */
const FORM_II: { atoms: LewisAtom[]; bonds: LewisBondSpec[] } = {
  atoms: [
    { id: 'a', element: 'O', x: -110, y: 0, lonePairs: 3, formalCharge: -1 },
    { id: 'b', element: 'O', x: 0, y: -36, lonePairs: 1, formalCharge: 1 },
    { id: 'c', element: 'O', x: 110, y: 0, lonePairs: 2 },
  ],
  bonds: [
    { a: 'a', b: 'b', order: 1 },
    { a: 'b', b: 'c', order: 2 },
  ],
}

/** The three oxygen centres of the hybrid, in the same places as the forms. */
const HYBRID_ATOMS = [
  { x: -110, y: 0 },
  { x: 0, y: -36 },
  { x: 110, y: 0 },
] as const

/** Shortens a segment by `trim` at both ends, so a line starts at the edge of each atom. */
function trimmed(a: { x: number; y: number }, b: { x: number; y: number }, trim: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  return {
    x1: a.x + ux * trim,
    y1: a.y + uy * trim,
    x2: b.x - ux * trim,
    y2: b.y - uy * trim,
  }
}

/** The resonance hybrid: both O–O bonds drawn as one solid and one dashed line, so each is 1.5. */
function Hybrid() {
  const bonds: [number, number][] = [
    [0, 1],
    [1, 2],
  ]
  return (
    <g>
      {bonds.map(([i, j]) => {
        const seg = trimmed(HYBRID_ATOMS[i], HYBRID_ATOMS[j], 15)
        const dx = seg.x2 - seg.x1
        const dy = seg.y2 - seg.y1
        const len = Math.hypot(dx, dy)
        const nx = (-dy / len) * 4
        const ny = (dx / len) * 4
        return (
          <g key={`${i}-${j}`}>
            <line x1={seg.x1 + nx} y1={seg.y1 + ny} x2={seg.x2 + nx} y2={seg.y2 + ny} stroke="var(--bond)" strokeWidth={2.2} strokeLinecap="round" />
            <line
              x1={seg.x1 - nx}
              y1={seg.y1 - ny}
              x2={seg.x2 - nx}
              y2={seg.y2 - ny}
              stroke="var(--bond)"
              strokeWidth={2.2}
              strokeDasharray="5 4"
              strokeLinecap="round"
            />
          </g>
        )
      })}
      {HYBRID_ATOMS.map((p, i) => (
        <Atom key={i} element="O" x={p.x} y={p.y} />
      ))}
    </g>
  )
}

/**
 * Ozone as the two canonical forms of Section 4.3.5, then the one hybrid with both
 * O–O bonds at 128 pm. The forms are drawn to show that neither one is a real
 * structure: the arrow between them is the resonance symbol, and the hybrid is the
 * only drawing of the molecule that is meant to be read as the molecule.
 */
export function OzoneResonance({ step, reducedMotion }: OzoneResonanceProps) {
  const target = resonanceTarget(step)
  const live = useTweenedValues({ ...target }, reducedMotion)

  const xI = CX - SPREAD * live.arrow
  const xII = CX + SPREAD * live.arrow
  const scale = 1 - SIDE_SCALE_LOSS * live.arrow
  // The bond labels belong to the single-form view only; they would be too small beside the other form.
  const labelsOn = live.formI * (1 - live.arrow)
  const labelsOnII = live.formII * (1 - live.arrow)

  // Number line for the bond lengths, from 148 pm (single) on the left to 121 pm (double) on the right.
  const LINE = { left: 110, right: 470, y: 236 }
  const xFor = (pm: number) => LINE.left + ((OZONE_LENGTHS.single - pm) / (OZONE_LENGTHS.single - OZONE_LENGTHS.double)) * (LINE.right - LINE.left)
  const markers = [
    { pm: OZONE_LENGTHS.single, above: 'order 1', below: `single ${OZONE_LENGTHS.single} pm` },
    { pm: OZONE_LENGTHS.measured, above: 'average 1.5', below: `ozone ${OZONE_LENGTHS.measured} pm` },
    { pm: OZONE_LENGTHS.double, above: 'order 2', below: `double ${OZONE_LENGTHS.double} pm` },
  ]

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={
        live.hybrid > 0.5
          ? `Ozone as one resonance hybrid: both O–O bonds are ${OZONE_LENGTHS.measured} pm, between a single bond of ${OZONE_LENGTHS.single} pm and a double bond of ${OZONE_LENGTHS.double} pm.`
          : `Ozone as two canonical forms, one with a double bond on the left and one with the double bond on the right, joined by a resonance arrow.`
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <VocabDefs />
      <g transform={FIT}>

      <Label x={CX} y={22} fontSize={18} fill="var(--fg)">
        Ozone, O<tspan dy="0.3em" fontSize="0.75em">3</tspan>
      </Label>

      <g data-layer="form-I" data-visible={live.formI > 0.5 ? 'true' : 'false'} opacity={live.formI} transform={`translate(${xI}, ${CY}) scale(${scale})`}>
        <LewisDiagram atoms={FORM_I.atoms} bonds={FORM_I.bonds} fontSize={22} dotRadius={2.6} pairHalfGap={2.9} lonePairRadius={11} />
        <g opacity={labelsOn}>
          <Label x={-55} y={-62} fontSize={15} fill="var(--fg-muted)">
            O=O {OZONE_LENGTHS.double} pm
          </Label>
          <Label x={55} y={-62} fontSize={15} fill="var(--fg-muted)">
            O–O {OZONE_LENGTHS.single} pm
          </Label>
        </g>
      </g>

      <g data-layer="form-II" data-visible={live.formII > 0.5 ? 'true' : 'false'} opacity={live.formII} transform={`translate(${xII}, ${CY}) scale(${scale})`}>
        <LewisDiagram atoms={FORM_II.atoms} bonds={FORM_II.bonds} fontSize={22} dotRadius={2.6} pairHalfGap={2.9} lonePairRadius={11} />
        <g opacity={labelsOnII}>
          <Label x={-55} y={-62} fontSize={15} fill="var(--fg-muted)">
            O–O {OZONE_LENGTHS.single} pm
          </Label>
          <Label x={55} y={-62} fontSize={15} fill="var(--fg-muted)">
            O=O {OZONE_LENGTHS.double} pm
          </Label>
        </g>
      </g>

      <g data-layer="resonance-arrow" opacity={live.arrow}>
        <line x1={CX - 36} y1={CY} x2={CX + 36} y2={CY} stroke="var(--fg-muted)" strokeWidth={2} />
        <path d={`M${CX - 36},${CY} l10,-6 l0,12 Z`} fill="var(--fg-muted)" />
        <path d={`M${CX + 36},${CY} l-10,-6 l0,12 Z`} fill="var(--fg-muted)" />
      </g>

      <g data-layer="hybrid" data-visible={live.hybrid > 0.5 ? 'true' : 'false'} opacity={live.hybrid} transform={`translate(${CX}, ${CY})`}>
        <Hybrid />
        <Label x={-55} y={62} fontSize={15} fill="var(--fg-muted)">
          {OZONE_LENGTHS.measured} pm
        </Label>
        <Label x={55} y={62} fontSize={15} fill="var(--fg-muted)">
          {OZONE_LENGTHS.measured} pm
        </Label>
        <Label x={0} y={98} fontSize={16} fill="var(--fg)">
          Resonance hybrid
        </Label>
      </g>

      <g data-layer="number-line" data-visible={live.scale > 0.5 ? 'true' : 'false'} opacity={live.scale}>
        <line x1={LINE.left} y1={LINE.y} x2={LINE.right} y2={LINE.y} stroke="var(--bond)" strokeWidth={2} />
        {markers.map((m) => (
          <g key={m.pm}>
            <circle cx={xFor(m.pm)} cy={LINE.y} r={5} fill={m.pm === OZONE_LENGTHS.measured ? 'var(--accent)' : 'var(--fg-muted)'} />
            <Label x={xFor(m.pm)} y={LINE.y - 20} fontSize={15} fill="var(--fg)">
              {m.above}
            </Label>
            <Label x={xFor(m.pm)} y={LINE.y + 22} fontSize={15} fill="var(--fg-muted)">
              {m.below}
            </Label>
          </g>
        ))}
        <Label x={CX} y={282} fontSize={14} fill="var(--fg-subtle)">
          Shorter bonds lie further right. The average bond order is (2 + 1) / 2 = 1.5.
        </Label>
      </g>
      </g>
    </svg>
  )
}
