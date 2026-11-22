import type { ReactNode, SVGAttributes } from 'react'
import { NCERT_TABLE_6_2 } from '@/lib/chem/ncert-c12-unit6-data'
import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { bondLengthUnits } from './geometry'
import { HALOGEN_TONE, type Halogen } from './tones'

/** Drawing box for a polar C–X bond. */
export const POLAR_BOND_SIZE = { width: 560, height: 260 } as const

const CY = POLAR_BOND_SIZE.height / 2
const SPHERE_R: Record<Halogen, number> = { F: 12, Cl: 15, Br: 17, I: 20 }
/** Carbon sits this far left of the bond centre-line so the alkyl label fits. */
const LABEL_LEFT = 44
const BOND_START = 4

export interface PolarBondProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  halogen: Halogen
  /** The alkyl group on carbon. Default CH₃. */
  alkyl?: ReactNode
  /** C–X bond length in pm. Default: NCERT Table 6.2 for this halogen. */
  lengthPm?: number
  /** Drawn units per picometre. Default 0.55. */
  unitsPerPm?: number
  /** δ+ on carbon and δ− on the halogen. Default true. */
  deltas?: boolean
  /** Crossed-tail dipole arrow pointing to the halogen. Default false. */
  dipole?: boolean
  /** Dimension line with the bond length in pm. Default false. */
  ruler?: boolean
  x?: number
  y?: number
}

function Delta({ sign, x, y, tone }: { sign: '+' | '−'; x: number; y: number; tone: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill={tone}>
      δ{sign === '+' ? <Sup>+</Sup> : <Sup>−</Sup>}
    </text>
  )
}

/**
 * C–X bond: a carbon with its alkyl group, the halogen as a sphere sized by the halogen, the bond
 * drawn at lengthPm × unitsPerPm, and optional δ±, dipole arrow and pm ruler.
 */
export function PolarBond({
  halogen,
  alkyl = 'CH₃',
  lengthPm,
  unitsPerPm = 0.55,
  deltas = true,
  dipole = false,
  ruler = false,
  x = 0,
  y = 0,
  ...rest
}: PolarBondProps) {
  const pm = lengthPm ?? NCERT_TABLE_6_2.find((r) => r.halogen === halogen)?.lengthPm ?? 0
  const len = bondLengthUnits(pm, unitsPerPm)
  const r = SPHERE_R[halogen]
  const tone = HALOGEN_TONE[halogen]
  const c = carbonX(len, r)
  const X = c + len
  const tail = c + 10
  const headAt = X - r - 6

  return (
    <g transform={`translate(${x} ${y})`} {...rest}>
      {ruler && (
        <g stroke="var(--fg-muted)" strokeWidth={1.4} fill="none">
          <line x1={c} y1={CY - 56} x2={X} y2={CY - 56} />
          <line x1={c} y1={CY - 62} x2={c} y2={CY - 50} />
          <line x1={X} y1={CY - 62} x2={X} y2={CY - 50} />
          <text x={(c + X) / 2} y={CY - 70} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)" stroke="none">
            {pm} pm
          </text>
        </g>
      )}

      <text x={c - 6} y={CY} textAnchor="end" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {alkyl}
      </text>
      <line x1={c + BOND_START} y1={CY} x2={X - r + 2} y2={CY} stroke="var(--bond)" strokeWidth={3.2} strokeLinecap="round" />
      <circle cx={X} cy={CY} r={r} fill={tone} />
      <circle cx={X - r * 0.35} cy={CY - r * 0.35} r={r * 0.28} fill="var(--sphere-highlight)" />
      <text x={X} y={CY + r + 20} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {halogen}
      </text>

      {deltas && (
        <>
          <Delta sign="+" x={c} y={CY - 26} tone="var(--delta-plus)" />
          <Delta sign="−" x={X} y={CY - r - 14} tone="var(--delta-minus)" />
        </>
      )}

      {dipole && (
        <g stroke="var(--dipole)" strokeWidth={2.4} strokeLinecap="round" fill="var(--dipole)">
          <line x1={tail} y1={CY + 42} x2={headAt} y2={CY + 42} />
          <path d={`M${headAt} ${CY + 42} L${headAt - 10} ${CY + 36} L${headAt - 10} ${CY + 48} Z`} stroke="none" />
          <line x1={tail - 5} y1={CY + 42} x2={tail + 5} y2={CY + 42} strokeWidth={1.6} />
          <line x1={tail} y1={CY + 37} x2={tail} y2={CY + 47} strokeWidth={1.6} />
        </g>
      )}
    </g>
  )
}

/** Carbon x so that the label block plus the bond and sphere sit centred in the box. */
function carbonX(len: number, r: number): number {
  return POLAR_BOND_SIZE.width / 2 - (len + r - LABEL_LEFT) / 2
}
