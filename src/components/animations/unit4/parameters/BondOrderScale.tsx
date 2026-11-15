'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { LewisDiagram, type LewisAtom } from '@/components/molecule/LewisDiagram'
import type { LewisBondSpec } from '@/components/molecule/lewis-geometry'
import { useTweenedValues } from '@/components/animations/unit2/bohr/useTweenedValues'
import { BOND_ORDER_SPECIES, CARBON_BONDS, bondOrderTarget } from './parameters-steps'

export interface BondOrderScaleProps {
  step: number
  reducedMotion: boolean
}

// SVG viewBox 580 × 330.
const VIEW = { width: 580, height: 490 }
/** Moves the drawing down so it sits centred in the tall panel. */
const OFFSET_Y = 96
const LEWIS_Y = 100
const ROW = { length: 186, enthalpy: 246, carbon: [186, 218, 250] as const }
const BAR_X = 168
/** Pixels per picture-pm for bond length, and per kJ mol⁻¹ for bond enthalpy. */
const PX_PER_PM = 1.5
const PX_PER_KJ = 0.24
const BAR_HEIGHT = 18

/** Lewis layouts for the four diatomics, drawn with the bond on the horizontal axis. */
const DIATOMIC_LEWIS: readonly { atoms: LewisAtom[]; bonds: LewisBondSpec[] }[] = [
  {
    atoms: [
      { id: 'l', element: 'H', x: -60, y: 0, lonePairs: 0 },
      { id: 'r', element: 'H', x: 60, y: 0, lonePairs: 0 },
    ],
    bonds: [{ a: 'l', b: 'r', order: 1 }],
  },
  {
    atoms: [
      { id: 'l', element: 'O', x: -60, y: 0, lonePairs: 2 },
      { id: 'r', element: 'O', x: 60, y: 0, lonePairs: 2 },
    ],
    bonds: [{ a: 'l', b: 'r', order: 2 }],
  },
  {
    atoms: [
      { id: 'l', element: 'N', x: -60, y: 0, lonePairs: 1 },
      { id: 'r', element: 'N', x: 60, y: 0, lonePairs: 1 },
    ],
    bonds: [{ a: 'l', b: 'r', order: 3 }],
  },
  {
    atoms: [
      { id: 'l', element: 'F', x: -60, y: 0, lonePairs: 3 },
      { id: 'r', element: 'F', x: 60, y: 0, lonePairs: 3 },
    ],
    bonds: [{ a: 'l', b: 'r', order: 1 }],
  },
]

/** Lines for one carbon bond of a given order, centred on (0, 0) and drawn horizontally. */
function BondGlyph({ order, cx, cy }: { order: 1 | 2 | 3; cx: number; cy: number }) {
  const offsets = order === 1 ? [0] : order === 2 ? [-4, 4] : [-8, 0, 8]
  return (
    <g>
      {offsets.map((off) => (
        <line
          key={off}
          x1={cx - 42}
          y1={cy + off}
          x2={cx + 42}
          y2={cy + off}
          stroke="var(--fg)"
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
    </g>
  )
}

/**
 * Bond order against bond length and bond enthalpy. The Lewis drawing shows how
 * many pairs are shared, and the bars show that more shared pairs mean a shorter,
 * stronger bond. The bars are drawn to scale within each row.
 */
export function BondOrderScale({ step, reducedMotion }: BondOrderScaleProps) {
  const target = bondOrderTarget(step)
  const live = useTweenedValues(
    { length: target.lengthPm, enthalpy: target.enthalpyKj, enthalpyShown: target.showEnthalpy },
    reducedMotion
  )
  const species = target.species >= 0 ? BOND_ORDER_SPECIES[target.species] : null
  const carbonOn = target.species === -1
  const lengthW = live.length * PX_PER_PM
  const enthalpyW = live.enthalpy * PX_PER_KJ

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={
        species
          ? `${species.label}: bond order ${species.bondOrder}, bond length ${species.lengthPm} pm${
              species.enthalpyKj !== null ? `, bond enthalpy ${species.enthalpyKj} kJ per mole` : ''
            }.`
          : 'Carbon bonds: C–C, C=C and C≡C, with bond lengths of 154, 133 and 120 pm. More shared pairs give a shorter bond.'
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <VocabDefs />
      <g transform={`translate(0, ${OFFSET_Y})`}>
      {DIATOMIC_LEWIS.map((lewis, i) => {
        const shown = species?.id === ['H2', 'O2', 'N2', 'F2'][i]
        return (
          <g
            key={i}
            data-layer="lewis"
            data-visible={shown ? 'true' : 'false'}
            opacity={shown ? 1 : 0}
            transform={`translate(${VIEW.width / 2}, ${LEWIS_Y}) scale(1.5)`}
          >
            <LewisDiagram atoms={lewis.atoms} bonds={lewis.bonds} fontSize={22} dotRadius={2.6} pairHalfGap={2.9} lonePairRadius={11} />
          </g>
        )
      })}

      <g data-layer="carbon" data-visible={carbonOn ? 'true' : 'false'} opacity={carbonOn ? 1 : 0}>
        {CARBON_BONDS.map((bond, i) => (
          <g key={bond.label}>
            <BondGlyph order={bond.order} cx={100 + i * 190} cy={LEWIS_Y} />
            <Label x={100 + i * 190} y={LEWIS_Y + 34} fontSize={18} fill="var(--fg)">
              {bond.label}
            </Label>
          </g>
        ))}
      </g>

      <Label x={VIEW.width / 2} y={24} fontSize={18} fill="var(--fg)">
        {species ? `${species.label}: bond order ${species.bondOrder}` : 'C–C, C=C and C≡C'}
      </Label>

      {/* Molecule rows: length and enthalpy, both drawn from the tweened values. */}
      <g data-layer="molecule-bars" opacity={carbonOn ? 0 : 1}>
        <Label x={20} y={ROW.length} fontSize={16} fill="var(--fg-muted)" textAnchor="start">
          Bond length
        </Label>
        <rect x={BAR_X} y={ROW.length - BAR_HEIGHT / 2} width={lengthW} height={BAR_HEIGHT} rx={4} fill="var(--accent)" />
        <Label x={BAR_X + lengthW + 10} y={ROW.length} fontSize={16} fill="var(--fg)" textAnchor="start">
          {Math.round(live.length)} pm
        </Label>

        <g opacity={live.enthalpyShown}>
          <Label x={20} y={ROW.enthalpy} fontSize={16} fill="var(--fg-muted)" textAnchor="start">
            Bond enthalpy
          </Label>
          <rect x={BAR_X} y={ROW.enthalpy - BAR_HEIGHT / 2} width={enthalpyW} height={BAR_HEIGHT} rx={4} fill="var(--el-O)" />
          <Label x={BAR_X + enthalpyW + 10} y={ROW.enthalpy} fontSize={16} fill="var(--fg)" textAnchor="start">
            {Math.round(live.enthalpy * 10) / 10} kJ mol⁻¹
          </Label>
        </g>
      </g>

      {/* Carbon rows: the three lengths from Table 4.2, drawn to the same scale. */}
      <g data-layer="carbon-bars" opacity={carbonOn ? 1 : 0}>
        {CARBON_BONDS.map((bond, i) => {
          const y = ROW.carbon[i]
          const w = bond.lengthPm * PX_PER_PM
          return (
            <g key={bond.label}>
              <Label x={20} y={y} fontSize={16} fill="var(--fg-muted)" textAnchor="start">
                {bond.label}
              </Label>
              <rect x={BAR_X} y={y - BAR_HEIGHT / 2} width={w} height={BAR_HEIGHT} rx={4} fill="var(--accent)" />
              <Label x={BAR_X + w + 10} y={y} fontSize={16} fill="var(--fg)" textAnchor="start">
                {bond.lengthPm} pm
              </Label>
            </g>
          )
        })}
      </g>

      <Label x={VIEW.width / 2} y={VIEW.height - OFFSET_Y - 18} fontSize={14} fill="var(--fg-subtle)">
        {species ? species.source : 'Lengths: Table 4.2 (single, double and triple bonds).'}
      </Label>
      </g>
    </svg>
  )
}
