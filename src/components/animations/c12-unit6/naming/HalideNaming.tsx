'use client'

import type { ReactNode } from 'react'
import { SkeletalFormula, type SkeletalMark } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  GEM_COMMON,
  GEM_SMILES,
  LONG_BR_CARBON,
  LONG_CHAIN,
  LONG_METHYL_CARBON,
  LONG_SMILES,
  META_SMILES,
  ORTHO_SMILES,
  PARA_SMILES,
  SEC_BUTYL_BR,
  SEC_BUTYL_COMMON,
  SEC_BUTYL_SMILES,
  TABLE_ROW_COMMONS,
  VIC_COMMON,
  VIC_SMILES,
  alphabeticalPrefixes,
  chainLocants,
  isLowerSet,
  nameOf,
  tableRow,
} from './naming-steps'

export interface HalideNamingProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 400
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const ACCENT = 'var(--accent)'

/** Parsed once: the drawings never change. */
const SEC = parseSmiles(SEC_BUTYL_SMILES)
const LONG: MolGraph = parseSmiles(LONG_SMILES)
const ORTHO = parseSmiles(ORTHO_SMILES)
const META = parseSmiles(META_SMILES)
const PARA = parseSmiles(PARA_SMILES)
const GEM = parseSmiles(GEM_SMILES)
const VIC = parseSmiles(VIC_SMILES)

/** Locants of the Step 3 count: from the left (chain carbon 1 first) and from the right. */
const LOCANTS = chainLocants(LONG_CHAIN, [LONG_BR_CARBON, LONG_METHYL_CARBON])
const LEFT_WINS = isLowerSet(LOCANTS.left, LOCANTS.right)
/** Locant of each substituent counted from the left (the numbers the name uses). */
const BR_LOCANT = chainLocants(LONG_CHAIN, [LONG_BR_CARBON]).left[0]
const METHYL_LOCANT = chainLocants(LONG_CHAIN, [LONG_METHYL_CARBON]).left[0]

function Text({ x, y, size = 16, fill = FG, anchor = 'middle', weight, children }: { x: number; y: number; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number; children: ReactNode }) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} textAnchor={anchor} fontWeight={weight}>
      {children}
    </text>
  )
}

/** Step 1: the common name (group plus halide) and the IUPAC name (halo-substituted alkane), over one drawing. */
function StepOne() {
  return (
    <>
      <Text x={145} y={40} size={14} fill={MUTED}>common name</Text>
      <Text x={145} y={70} size={22} weight={600}>{SEC_BUTYL_COMMON}</Text>
      <Text x={435} y={40} size={14} fill={MUTED}>IUPAC name</Text>
      <Text x={435} y={70} size={22} weight={600}>{nameOf(SEC_BUTYL_SMILES)}</Text>
      <line x1={290} x2={290} y1={92} y2={300} stroke={MUTED} strokeWidth={1} strokeDasharray="4 6" />
      <SkeletalFormula graph={SEC} scale={78} x={290} y={212} highlightAtoms={[SEC_BUTYL_BR]} />
      <Text x={290} y={362} size={16} fill={MUTED}>The bromine sits on the second carbon of a butane chain.</Text>
    </>
  )
}

/** Step 2: the longest unbroken carbon chain, highlighted; the methyl stays outside it. */
function StepTwo() {
  return (
    <>
      <SkeletalFormula graph={LONG} scale={80} x={290} y={175} highlightAtoms={LONG_CHAIN} />
      <Text x={290} y={320} size={20} weight={600}>Longest chain: six carbons, so the parent is hexane.</Text>
      <Text x={290} y={352} size={16} fill={MUTED}>The bromine and the methyl are substituents hanging off it.</Text>
    </>
  )
}

/** Step 3: number the chain from each end and compare the locant sets. */
function StepThree() {
  const n = LONG_CHAIN.length
  const leftMarks: SkeletalMark[] = LONG_CHAIN.map((atom, i) => ({ atom, label: String(i + 1) }))
  const rightMarks: SkeletalMark[] = LONG_CHAIN.map((atom, i) => ({ atom, label: String(n - i) }))
  const setText = (set: number[]) => `{${set.join(', ')}}`
  return (
    <>
      <Text x={150} y={40} size={18} fill={MUTED}>count from the left</Text>
      <Text x={430} y={40} size={18} fill={MUTED}>count from the right</Text>
      <SkeletalFormula graph={LONG} scale={46} x={150} y={150} locants={leftMarks} highlightAtoms={[LONG_BR_CARBON, LONG_METHYL_CARBON]} />
      <SkeletalFormula graph={LONG} scale={46} x={430} y={150} locants={rightMarks} highlightAtoms={[LONG_BR_CARBON, LONG_METHYL_CARBON]} />
      <Text x={150} y={280} size={26} weight={700} fill={LEFT_WINS ? ACCENT : MUTED}>{setText(LOCANTS.left)}</Text>
      <Text x={430} y={280} size={26} weight={700} fill={LEFT_WINS ? MUTED : ACCENT}>{setText(LOCANTS.right)}</Text>
      <Text x={150} y={318} size={16} fill={LEFT_WINS ? ACCENT : MUTED}>{LEFT_WINS ? 'lower set: this one wins' : 'higher set: dropped'}</Text>
      <Text x={430} y={318} size={16} fill={LEFT_WINS ? MUTED : ACCENT}>{LEFT_WINS ? 'higher set: dropped' : 'lower set: this one wins'}</Text>
      <Text x={290} y={372} size={16} fill={MUTED}>Compare the sets number by number; the first difference decides.</Text>
    </>
  )
}

/** Step 4: the assembled name, its locants on the drawing, and the alphabetical order of prefixes. */
function StepFour() {
  const marks: SkeletalMark[] = [
    { atom: LONG_BR_CARBON, label: String(BR_LOCANT) },
    { atom: LONG_METHYL_CARBON, label: String(METHYL_LOCANT) },
  ]
  return (
    <>
      <Text x={290} y={56} size={30} weight={700}>{nameOf(LONG_SMILES)}</Text>
      <SkeletalFormula graph={LONG} scale={70} x={290} y={190} locants={marks} highlightAtoms={[LONG_BR_CARBON, LONG_METHYL_CARBON]} />
      <Text x={290} y={330} size={18} fill={ACCENT}>{alphabeticalPrefixes(['methyl', 'bromo']).join(', then ')}</Text>
      <Text x={290} y={362} size={16} fill={MUTED}>Each locant goes in front of its prefix; the parent name closes the word.</Text>
    </>
  )
}

/** Step 5: ortho, meta and para dichlorobenzene, with their IUPAC locants. */
function StepFive() {
  const cols: Array<{ x: number; g: MolGraph; smiles: string; label: string; tone: string }> = [
    { x: 105, g: ORTHO, smiles: ORTHO_SMILES, label: 'ortho', tone: ACCENT },
    { x: 290, g: META, smiles: META_SMILES, label: 'meta', tone: FG },
    { x: 475, g: PARA, smiles: PARA_SMILES, label: 'para', tone: FG },
  ]
  return (
    <>
      {cols.map((c) => (
        <g key={c.label}>
          <SkeletalFormula graph={c.g} scale={38} x={c.x} y={140} />
          <Text x={c.x} y={262} size={20} weight={600} fill={c.tone}>{c.label}</Text>
          <Text x={c.x} y={292} size={16}>{nameOf(c.smiles)}</Text>
        </g>
      ))}
      <Text x={290} y={345} size={16} fill={MUTED}>One halogen needs no number on the ring.</Text>
      <Text x={290} y={372} size={16} fill={MUTED}>Two halogens: 1,2 is ortho, 1,3 meta and 1,4 para.</Text>
    </>
  )
}

/** Step 6: gem and vic dihalides, then three Table 6.1 rows (common name, then the namer's IUPAC name). */
function StepSix() {
  return (
    <>
      <SkeletalFormula graph={GEM} scale={52} x={145} y={100} />
      <SkeletalFormula graph={VIC} scale={52} x={435} y={100} />
      <Text x={145} y={172} size={16} fill={MUTED}>gem: both Cl on one carbon</Text>
      <Text x={145} y={200} size={20} weight={600}>{nameOf(GEM_SMILES)}</Text>
      <Text x={145} y={226} size={16}>{GEM_COMMON}</Text>
      <Text x={435} y={172} size={16} fill={MUTED}>vic: Cl on neighbouring carbons</Text>
      <Text x={435} y={200} size={20} weight={600}>{nameOf(VIC_SMILES)}</Text>
      <Text x={435} y={226} size={16}>{VIC_COMMON}</Text>
      <line x1={40} x2={540} y1={254} y2={254} stroke={MUTED} strokeWidth={1} />
      <Text x={40} y={284} size={15} fill={MUTED} anchor="start">Table 6.1: common name, then IUPAC</Text>
      {TABLE_ROW_COMMONS.map((common, i) => {
        const y = 314 + i * 30
        return (
          <g key={common}>
            <Text x={40} y={y} size={17} anchor="start">{common}</Text>
            <Text x={262} y={y} size={17} anchor="start" fill={MUTED}>→</Text>
            <Text x={290} y={y} size={17} anchor="start" weight={600}>{nameOf(tableRow(common).smiles)}</Text>
          </g>
        )
      })}
    </>
  )
}

const STEPS: Array<{ label: string; draw: () => ReactNode }> = [
  { label: 'Two names for one molecule: sec-butyl bromide and 2-bromobutane', draw: StepOne },
  { label: 'The longest chain of 2-bromo-4-methylhexane is hexane', draw: StepTwo },
  { label: 'Locant sets counted from the left and from the right', draw: StepThree },
  { label: 'The assembled name of 2-bromo-4-methylhexane', draw: StepFour },
  { label: 'Ortho, meta and para dichlorobenzene with IUPAC locants', draw: StepFive },
  { label: 'gem and vic dichloroethanes, and three Table 6.1 rows', draw: StepSix },
]

/** One SVG per Scrolly Step; the panel is the whole drawing (no animation between Steps). */
export function HalideNaming({ step }: HalideNamingProps) {
  const s = STEPS[Math.min(Math.max(step, 0), STEPS.length - 1)]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={s.label} style={{ display: 'block', maxWidth: '100%', height: 'auto' }}>
      {s.draw()}
    </svg>
  )
}
