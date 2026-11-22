'use client'

import { structuralStepVisual } from './isomer-steps'
import { OctahedralComplex, TONE, type LigandStyle } from './ComplexDiagrams'

export interface StructuralIsomerSwapsProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 450

const LIG_NH3: LigandStyle = { label: 'N', fill: TONE.l }
const LIG_CN: LigandStyle = { label: 'CN', fill: TONE.b }
const LIG_H2O: LigandStyle = { label: 'O', fill: TONE.accent }
const LIG_CL: LigandStyle = { label: 'Cl', fill: TONE.x }
const LIG_SO4: LigandStyle = { label: 'SO4', fill: TONE.yellow }
const LIG_BR: LigandStyle = { label: 'Br', fill: TONE.b }
const LIG_ONO: LigandStyle = { label: 'O', fill: TONE.red }
const LIG_NO2: LigandStyle = { label: 'N', fill: TONE.yellow }

function StepLinkage() {
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Linkage isomerism (5.4.3)
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Ambidentate nitrite flips its donor atom on Co
      </text>

      {/* Left: Red O-bound (-ONO) */}
      <rect x={16} y={76} width={226} height={290} rx={12} fill={TONE.red} fillOpacity={0.1} stroke={TONE.red} strokeWidth={2} />
      <OctahedralComplex
        cx={129}
        cy={198}
        radius={58}
        metal="Co"
        ligands={[LIG_ONO, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3]}
        fontSize={16}
      />
      <text x={129} y={306} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        Co-ONO (red)
      </text>
      <text x={129} y={332} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Bound through O
      </text>
      <text x={129} y={356} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        [Co(NH3)5(ONO)]Cl2
      </text>

      {/* Center flip arrow */}
      <path d="M 248 188 Q 270 162 292 188" fill="none" stroke={TONE.fg} strokeWidth={2.4} />
      <polygon points="295,191 284,187 291,179" fill={TONE.fg} />
      <path d="M 292 214 Q 270 240 248 214" fill="none" stroke={TONE.fg} strokeWidth={2.4} />
      <polygon points="245,211 256,215 249,223" fill={TONE.fg} />
      <text x={W / 2} y={156} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        Flip
      </text>

      {/* Right: Yellow N-bound (-NO2) */}
      <rect x={298} y={76} width={226} height={290} rx={12} fill={TONE.yellow} fillOpacity={0.14} stroke={TONE.yellow} strokeWidth={2} />
      <OctahedralComplex
        cx={411}
        cy={198}
        radius={58}
        metal="Co"
        ligands={[LIG_NO2, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3]}
        fontSize={16}
      />
      <text x={411} y={306} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        Co-NO2 (yellow)
      </text>
      <text x={411} y={332} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Bound through N
      </text>
      <text x={411} y={356} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        [Co(NH3)5(NO2)]Cl2
      </text>

      <text x={W / 2} y={414} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Five blue dots = NH3; top ligand flips between O and N.
      </text>
    </g>
  )
}

function StepCoordination() {
  const sixNH3: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle] = [
    LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3,
  ]
  const sixCN: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle] = [
    LIG_CN, LIG_CN, LIG_CN, LIG_CN, LIG_CN, LIG_CN,
  ]

  return (
    <g>
      <text x={W / 2} y={28} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Coordination isomerism (5.4.4)
      </text>

      {/* Top pair */}
      <rect x={18} y={44} width={236} height={152} rx={10} fill={TONE.raised} stroke={TONE.l} strokeWidth={1.6} />
      <OctahedralComplex cx={136} cy={108} radius={44} metal="Co" ligands={sixNH3} fontSize={16} />
      <text x={136} y={184} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Co(NH3)6]3+
      </text>

      <rect x={286} y={44} width={236} height={152} rx={10} fill={TONE.raised} stroke={TONE.b} strokeWidth={1.6} />
      <OctahedralComplex cx={404} cy={108} radius={44} metal="Cr" ligands={sixCN} fontSize={16} />
      <text x={404} y={184} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Cr(CN)6]3-
      </text>

      {/* Swap arrows */}
      <line x1={190} y1={202} x2={340} y2={236} stroke={TONE.l} strokeWidth={2.4} />
      <polygon points="346,238 334,239 337,230" fill={TONE.l} />
      <line x1={350} y1={202} x2={200} y2={236} stroke={TONE.b} strokeWidth={2.4} />
      <polygon points="194,238 206,239 203,230" fill={TONE.b} />
      <rect x={W / 2 - 64} y={206} width={128} height={26} rx={13} fill={TONE.surface} stroke={TONE.guide} strokeWidth={1.2} />
      <text x={W / 2} y={224} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        Swap ligands
      </text>

      {/* Bottom pair */}
      <rect x={18} y={244} width={236} height={152} rx={10} fill={TONE.raised} stroke={TONE.l} strokeWidth={1.6} />
      <OctahedralComplex cx={136} cy={308} radius={44} metal="Cr" ligands={sixNH3} fontSize={16} />
      <text x={136} y={384} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Cr(NH3)6]3+
      </text>

      <rect x={286} y={244} width={236} height={152} rx={10} fill={TONE.raised} stroke={TONE.b} strokeWidth={1.6} />
      <OctahedralComplex cx={404} cy={308} radius={44} metal="Co" ligands={sixCN} fontSize={16} />
      <text x={404} y={384} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Co(CN)6]3-
      </text>

      <text x={W / 2} y={428} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Overall formula count is unchanged: 1 Co, 1 Cr, 6 NH3, 6 CN.
      </text>
    </g>
  )
}

function StepIonisation() {
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Ionisation isomerism (5.4.5)
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        A ligand and counter ion swap across the bracket
      </text>

      {/* Left complex */}
      <rect x={16} y={76} width={238} height={292} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      {/* Bracket box */}
      <rect x={28} y={90} width={156} height={176} rx={10} fill={TONE.surface} stroke={TONE.accent} strokeWidth={2} />
      <OctahedralComplex
        cx={106}
        cy={178}
        radius={48}
        metal="Co"
        ligands={[LIG_SO4, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3]}
        fontSize={16}
      />
      {/* Free counter ion */}
      <circle cx={218} cy={178} r={22} fill={TONE.b} />
      <text x={218} y={184} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--accent-fg)">
        Br-
      </text>
      <text x={135} y={300} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Co(NH3)5(SO4)]Br
      </text>
      <text x={135} y={328} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Free ion in water:
      </text>
      <text x={135} y={352} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.b}>
        Br- (gives AgBr)
      </text>

      {/* Center swap arrow */}
      <line x1={258} y1={178} x2={282} y2={178} stroke={TONE.fg} strokeWidth={2.6} />
      <polygon points="285,178 275,172 275,184" fill={TONE.fg} />

      {/* Right complex */}
      <rect x={286} y={76} width={238} height={292} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <rect x={298} y={90} width={156} height={176} rx={10} fill={TONE.surface} stroke={TONE.accent} strokeWidth={2} />
      <OctahedralComplex
        cx={376}
        cy={178}
        radius={48}
        metal="Co"
        ligands={[LIG_BR, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3, LIG_NH3]}
        fontSize={16}
      />
      <circle cx={488} cy={178} r={24} fill={TONE.yellow} />
      <text x={488} y={184} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--accent-fg)">
        SO4
      </text>
      <text x={405} y={300} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Co(NH3)5Br]SO4
      </text>
      <text x={405} y={328} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Free ion in water:
      </text>
      <text x={405} y={352} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.yellow}>
        SO4^2- (gives BaSO4)
      </text>

      <text x={W / 2} y={414} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Only the ion outside the bracket reacts in precipitation tests.
      </text>
    </g>
  )
}

function StepSolvate() {
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Solvate (hydrate) isomerism (5.4.6)
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Water moves from the sphere into the crystal lattice
      </text>

      {/* Left: Violet [Cr(H2O)6]Cl3 */}
      <rect x={16} y={76} width={236} height={292} rx={12} fill={TONE.violet} fillOpacity={0.12} stroke={TONE.violet} strokeWidth={2} />
      <rect x={28} y={90} width={154} height={172} rx={10} fill={TONE.surface} stroke={TONE.violet} strokeWidth={1.8} />
      <OctahedralComplex
        cx={105}
        cy={176}
        radius={47}
        metal="Cr"
        ligands={[LIG_H2O, LIG_H2O, LIG_H2O, LIG_H2O, LIG_H2O, LIG_H2O]}
        fontSize={16}
      />
      {/* Lattice ions */}
      <text x={216} y={142} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.x}>
        Cl-
      </text>
      <text x={216} y={178} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.x}>
        Cl-
      </text>
      <text x={216} y={214} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.x}>
        Cl-
      </text>
      <text x={134} y={298} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Cr(H2O)6]Cl3
      </text>
      <text x={134} y={324} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.violet}>
        Violet (3 free Cl-)
      </text>
      <text x={134} y={350} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        0 lattice H2O
      </text>

      {/* Center swap arrow */}
      <line x1={256} y1={176} x2={282} y2={176} stroke={TONE.fg} strokeWidth={2.6} />
      <polygon points="285,176 275,170 275,182" fill={TONE.fg} />

      {/* Right: Grey-green [Cr(H2O)5Cl]Cl2.H2O */}
      <rect x={288} y={76} width={236} height={292} rx={12} fill={TONE.greyGreen} fillOpacity={0.14} stroke={TONE.greyGreen} strokeWidth={2} />
      <rect x={300} y={90} width={154} height={172} rx={10} fill={TONE.surface} stroke={TONE.greyGreen} strokeWidth={1.8} />
      <OctahedralComplex
        cx={377}
        cy={176}
        radius={47}
        metal="Cr"
        ligands={[LIG_CL, LIG_H2O, LIG_H2O, LIG_H2O, LIG_H2O, LIG_H2O]}
        fontSize={16}
      />
      <text x={488} y={142} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.x}>
        Cl-
      </text>
      <text x={488} y={178} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.x}>
        Cl-
      </text>
      <text x={488} y={214} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.accent}>
        H2O
      </text>
      <text x={406} y={298} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        [Cr(H2O)5Cl]Cl2.H2O
      </text>
      <text x={406} y={324} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.greyGreen}>
        Grey-green (2 free Cl-)
      </text>
      <text x={406} y={350} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        1 lattice H2O
      </text>

      <text x={W / 2} y={414} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        One H2O leaves the bracket and one Cl- enters it.
      </text>
    </g>
  )
}

export function StructuralIsomerSwaps({ step }: StructuralIsomerSwapsProps) {
  const visual = structuralStepVisual(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Structural isomerism swaps: linkage (-ONO vs -NO2), coordination ([Co(NH3)6][Cr(CN)6]), ionisation ([Co(NH3)5(SO4)]Br), and solvate ([Cr(H2O)6]Cl3)"
      style={{ display: 'block' }}
    >
      {visual === 'linkage' && <StepLinkage />}
      {visual === 'coordination' && <StepCoordination />}
      {visual === 'ionisation' && <StepIonisation />}
      {visual === 'solvate' && <StepSolvate />}
    </svg>
  )
}
