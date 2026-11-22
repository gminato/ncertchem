'use client'

import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { HALOGEN_TONE } from '@/components/vocab/organic6/tones'
import { formatDipole, type Halogen } from '@/lib/chem/ncert-c12-unit6-data'
import { bondRow, enthalpyDifferenceFI, getCxBondStepState, type CxBondStepState } from './cxbond-steps'

/** Drawing box: about the 570 px panel, so 16-unit labels render at ≥ 15 px. */
const W = 580
const H = 520
const ROW_Y: Record<Halogen, number> = { F: 105, Cl: 205, Br: 305, I: 405 }
const CARBON_X = 150
/** Drawn units per picometre (bond lengths stay to scale across the four rows). */
const UNITS_PER_PM = 0.7
const SPHERE_R: Record<Halogen, number> = { F: 12, Cl: 15, Br: 17, I: 20 }
const BAR_X = 380
const UNITS_PER_KJ = 0.38
const UNITS_PER_DEBYE = 95
/** Step 1 zooms the single Cl row so it fills the panel: the row's centre maps to (290, 260). */
const ZOOM_SCALE = 1.7
const ZOOM_CENTRE = { x: 290, y: 260 }
const ZOOM_ROW_CENTRE = { x: CARBON_X + (bondRow('Cl').lengthPm * UNITS_PER_PM) / 2, y: ROW_Y.Cl }

const MUTED = 'var(--fg-muted)'
const FONT = 'var(--font-sans)'

function Delta({ sign, x, y }: { sign: '+' | '−'; x: number; y: number }) {
  const tone = sign === '+' ? 'var(--delta-plus)' : 'var(--delta-minus)'
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily={FONT} fill={tone}>
      δ{sign === '+' ? <Sup>+</Sup> : <Sup>−</Sup>}
    </text>
  )
}

function CloudBehindBond() {
  const len = bondRow('Cl').lengthPm * UNITS_PER_PM
  const X = CARBON_X + len
  return (
    <g>
      <ellipse cx={(CARBON_X + X) / 2} cy={ROW_Y.Cl} rx={len / 2 + 14} ry={30} fill="var(--bond)" opacity={0.1} />
      <ellipse cx={X - 14} cy={ROW_Y.Cl} rx={34} ry={22} fill={HALOGEN_TONE.Cl} opacity={0.28} />
    </g>
  )
}

function BondRow({ h, state }: { h: Halogen; state: CxBondStepState }) {
  const row = bondRow(h)
  const y = ROW_Y[h]
  const r = SPHERE_R[h]
  const len = row.lengthPm * UNITS_PER_PM
  const X = CARBON_X + len
  const tone = HALOGEN_TONE[h]
  const opacity = state.dim.includes(h) ? 0.3 : 1

  return (
    <g opacity={opacity}>
      {state.focus === h && (
        <circle cx={CARBON_X - 30} cy={y} r={32} fill="none" stroke="var(--delta-plus)" strokeWidth={2} strokeDasharray="5 5" />
      )}
      <text x={CARBON_X - 12} y={y} textAnchor="end" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        CH₃
      </text>
      <Delta sign="+" x={CARBON_X - 4} y={y - 30} />
      <line x1={CARBON_X + 4} y1={y} x2={X - r + 2} y2={y} stroke="var(--bond)" strokeWidth={3.2} strokeLinecap="round" />
      <circle cx={X} cy={y} r={r} fill={tone} />
      <circle cx={X - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="var(--sphere-highlight)" />
      <text x={X + r + 12} y={y} dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {h}
      </text>
      <Delta sign="−" x={X} y={y - r - 14} />
      {state.showLength && (
        <text x={CARBON_X + len / 2} y={y + 36} textAnchor="middle" fontSize={16} fontFamily={FONT} fill={MUTED}>
          {row.lengthPm} pm
        </text>
      )}
    </g>
  )
}

/** Bars (enthalpy) or arrows (dipole) in the right-hand column, one per row. */
function Readout({ h, kind }: { h: Halogen; kind: 'enthalpy' | 'dipole' }) {
  const row = bondRow(h)
  const y = ROW_Y[h]
  const tone = HALOGEN_TONE[h]
  if (kind === 'enthalpy') {
    const w = row.enthalpyKjPerMol * UNITS_PER_KJ
    return (
      <g>
        <rect x={BAR_X} y={y - 11} width={w} height={22} rx={4} fill={tone} opacity={0.85} />
        <text x={BAR_X} y={y - 18} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
          {row.enthalpyKjPerMol}
        </text>
      </g>
    )
  }
  const x2 = BAR_X + row.dipoleDebye * UNITS_PER_DEBYE
  return (
    <g>
      <line x1={BAR_X} y1={y} x2={x2 - 10} y2={y} stroke="var(--dipole)" strokeWidth={4} strokeLinecap="round" />
      <polygon points={`${x2},${y} ${x2 - 13},${y - 7} ${x2 - 13},${y + 7}`} fill="var(--dipole)" />
      <text x={BAR_X} y={y - 18} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {formatDipole(row.dipoleDebye)}
      </text>
    </g>
  )
}

function LengthScale() {
  const x1 = CARBON_X
  const x2 = CARBON_X + 100 * UNITS_PER_PM
  const y = 476
  return (
    <g stroke={MUTED} strokeWidth={1.4} fill="none">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <text x={x2 + 8} y={y} dominantBaseline="central" fontSize={16} fontFamily={FONT} fill={MUTED} stroke="none">
        100 pm
      </text>
    </g>
  )
}

/** Dashed arrow from a lone-pair nucleophile to just below-right of the δ+ carbon. */
function Approach() {
  const tail = { x: CARBON_X - 14, y: 462 }
  const head = { x: CARBON_X + 6, y: ROW_Y.I + 20 }
  const dx = head.x - tail.x
  const dy = head.y - tail.y
  const n = Math.hypot(dx, dy)
  const ux = dx / n
  const uy = dy / n
  const barb = (sx: number, sy: number) => `${sx},${sy} ${sx - ux * 11 - uy * 6},${sy - uy * 11 + ux * 6} ${sx - ux * 11 + uy * 6},${sy - uy * 11 - ux * 6}`
  return (
    <g>
      <text x={CARBON_X - 36} y={470} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--lone-pair)">
        Nu⁻
      </text>
      <circle cx={CARBON_X - 42} cy={450} r={2.8} fill="var(--lone-pair)" />
      <circle cx={CARBON_X - 30} cy={450} r={2.8} fill="var(--lone-pair)" />
      <line x1={tail.x} y1={tail.y} x2={head.x - ux * 12} y2={head.y - uy * 12} stroke="var(--lone-pair)" strokeWidth={2.4} strokeDasharray="6 6" />
      <polygon points={barb(head.x, head.y)} fill="var(--lone-pair)" />
    </g>
  )
}

export interface CarbonHalogenBondProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Accepted for the Scrolly contract. Every Step is a cut between states, so nothing tweens. */
  reducedMotion: boolean
}

/** Scrolly visual for Section 6.3: CH₃–X bonds to scale, with the enthalpy and dipole columns. */
export function CarbonHalogenBond({ step }: CarbonHalogenBondProps) {
  const state = getCxBondStepState(step)
  const rows = state.rows
  const zoomed = state.zoom
  const readout = state.readout
  const label = describe(state)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g transform={zoomed ? `translate(${ZOOM_CENTRE.x - ZOOM_SCALE * ZOOM_ROW_CENTRE.x} ${ZOOM_CENTRE.y - ZOOM_SCALE * ZOOM_ROW_CENTRE.y}) scale(${ZOOM_SCALE})` : undefined}>
        {state.cloud && <CloudBehindBond />}
        {rows.map((h) => (
          <BondRow key={h} h={h} state={state} />
        ))}
      </g>

      {readout !== 'none' && (
        <g>
          <text x={BAR_X} y={56} fontSize={16} fontFamily={FONT} fill={MUTED}>
            {readout === 'enthalpy' ? 'bond enthalpy / kJ mol⁻¹' : 'dipole moment / D'}
          </text>
          {rows.map((h) => (
            <Readout key={h} h={h} kind={readout} />
          ))}
        </g>
      )}

      {readout === 'enthalpy' && (
        <text x={24} y={506} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--accent)">
          Difference, C–F minus C–I: {enthalpyDifferenceFI()} kJ mol⁻¹
        </text>
      )}
      {readout === 'dipole' && (
        <text x={24} y={470} fontSize={16} fontFamily={FONT} fill={MUTED}>
          Not a steady trend: CH₃–Cl is largest, CH₃–I smallest.
        </text>
      )}

      {state.showLength && <LengthScale />}
      {state.approach && <Approach />}
    </svg>
  )
}

function describe(state: CxBondStepState): string {
  if (state.cloud) return 'CH₃–Cl: the C–Cl electron pair is pulled toward chlorine.'
  if (state.approach) return 'CH₃–I: a lone-pair nucleophile approaches the δ⁺ carbon.'
  if (state.readout === 'enthalpy') return 'Bond enthalpy bars for CH₃–F, CH₃–Cl, CH₃–Br and CH₃–I: they shrink down the group.'
  if (state.readout === 'dipole') return 'Dipole moments of CH₃–F, CH₃–Cl, CH₃–Br and CH₃–I: CH₃–Cl is the largest.'
  return 'CH₃–X bonds drawn to scale, F to I: the bond lengthens from 139 pm to 214 pm.'
}

