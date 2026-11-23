'use client'

import type { ReactNode } from 'react'
import { CurvedArrow, SkeletalFormula } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { SMILES } from './acid-derivatives-steps'

export interface AcidDerivativesScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Unused: every Step is a cut between static drawings, so there is no tween to switch off. */
  reducedMotion: boolean
}

/** One viewBox for every Step. Skeletal drawings use SCALE 46: labels 0.36 × 46 ≈ 16.6 units. */
const W = 580
const H = 384
const SCALE = 46
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const DELTA = ROLE_TONE.electrophilicCarbon

function T({
  x,
  y,
  children,
  size = 16,
  fill = INK,
  weight,
  anchor = 'middle',
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  fill?: string
  weight?: number
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill} fontFamily="var(--font-sans)">
      {children}
    </text>
  )
}

function Mol({ smiles, x, y }: { smiles: string; x: number; y: number }) {
  return <SkeletalFormula graph={parseSmiles(smiles)} scale={SCALE} x={x} y={y} />
}

/** Straight reaction arrow with a filled head. */
function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const h = 9
  return (
    <g stroke={INK} fill={INK} strokeWidth={2}>
      <line x1={x1} y1={y} x2={x2 - h} y2={y} />
      <polygon points={`${x2},${y} ${x2 - h * 1.4},${y - h * 0.7} ${x2 - h * 1.4},${y + h * 0.7}`} stroke="none" />
    </g>
  )
}

function Caption({ lines }: { lines: readonly string[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <T key={line} x={W / 2} y={338 + i * 24} size={16} fill={i === 0 ? INK : MUTED}>
          {line}
        </T>
      ))}
    </g>
  )
}

function Step1() {
  return (
    <g>
      <T x={150} y={170} size={22}>2 CH₃COOH</T>
      <Arrow x1={220} x2={330} y={170} />
      <T x={275} y={150} size={15}>H₂SO₄ or P₂O₅, Δ</T>
      <Mol smiles={SMILES.anhydride} x={445} y={170} />
      <T x={445} y={250} size={18}>+ H₂O</T>
      <Caption lines={['The C–OH bond of one acid breaks', 'Water is the second product']} />
    </g>
  )
}

function Step2() {
  return (
    <g>
      <T x={140} y={160} size={20}>CH₃COOH + CH₃OH</T>
      <Arrow x1={250} x2={330} y={160} />
      <T x={290} y={138} size={15}>conc. H₂SO₄</T>
      <Mol smiles={SMILES.methylEthanoate} x={445} y={160} />
      <T x={445} y={240} size={18}>+ H₂O</T>
      <Caption lines={['The acid is a catalyst: it starts the reaction', 'and is recovered at the end']} />
    </g>
  )
}

/** x of the down-arrows between stage rows: centre of the formula column (text from x 96, about 205 wide). */
const STAGE_ARROW_X = 198

const STAGES: readonly { y: number; text: ReactNode; label: string }[] = [
  {
    y: 84,
    text: (
      <>
        CH₃<tspan fill={DELTA}>C</tspan>(=OH⁺)OH
      </>
    ),
    label: '1  H⁺ on the C=O oxygen',
  },
  {
    y: 138,
    text: (
      <>
        CH₃<tspan fill={DELTA}>C</tspan>(OH)₂OCH₃
      </>
    ),
    label: '2  CH₃OH adds to C',
  },
  {
    y: 192,
    text: (
      <>
        CH₃<tspan fill={DELTA}>C</tspan>(OH)(OH₂⁺)OCH₃
      </>
    ),
    label: '3  H⁺ shifts: –OH → –OH₂⁺',
  },
  {
    y: 246,
    text: (
      <>
        CH₃<tspan fill={DELTA}>C</tspan>(OH)=O⁺CH₃
      </>
    ),
    label: '4  water leaves',
  },
  {
    y: 300,
    text: 'CH₃COOCH₃ + H⁺',
    label: '5  H⁺ lost: ester',
  },
]

function Step3() {
  return (
    <g>
      {STAGES.map((s, i) => (
        <g key={s.label}>
          <T x={96} y={s.y} size={19} anchor="start">
            {s.text}
          </T>
          <T x={330} y={s.y} size={15} anchor="start" fill={MUTED}>
            {s.label}
          </T>
          {i < STAGES.length - 1 ? (
            <g stroke={MUTED} fill={MUTED} strokeWidth={2}>
              <line x1={STAGE_ARROW_X} y1={s.y + 14} x2={STAGE_ARROW_X} y2={STAGES[i + 1].y - 17} />
              <polygon
                points={`${STAGE_ARROW_X},${STAGES[i + 1].y - 8} ${STAGE_ARROW_X - 4.5},${STAGES[i + 1].y - 17} ${STAGE_ARROW_X + 4.5},${STAGES[i + 1].y - 17}`}
                stroke="none"
              />
            </g>
          ) : null}
        </g>
      ))}
      <Caption lines={['Protonation makes the carbonyl C more positive']} />
    </g>
  )
}

function Step4() {
  return (
    <g>
      <T x={120} y={160} size={19}>CH₃CH₂CH₂COOH</T>
      <Arrow x1={216} x2={330} y={160} />
      <T x={268} y={128} size={15}>PCl₅, PCl₃</T>
      <T x={268} y={146} size={15}>or SOCl₂</T>
      <Mol smiles={SMILES.butanoylChloride} x={445} y={160} />
      <T x={24} y={224} size={16} anchor="start">PCl₅: also POCl₃ + HCl</T>
      <T x={24} y={250} size={16} anchor="start">PCl₃: also H₃PO₃, stays in the mixture</T>
      <T x={24} y={276} size={16} anchor="start">SOCl₂: also SO₂ + HCl, both gases</T>
      <Caption lines={['The –OH of the acid is replaced by –Cl']} />
    </g>
  )
}

function Step5() {
  return (
    <g>
      <T x={150} y={150} size={19}>CH₃CH₂COOH + NH₃</T>
      <Arrow x1={262} x2={322} y={150} />
      <T x={470} y={150} size={18}>CH₃CH₂COO⁻ NH₄⁺</T>
      <g stroke={INK} fill={INK} strokeWidth={2}>
        <line x1={470} y1={168} x2={470} y2={204} />
        <polygon points="470,207 465.5,197.5 474.5,197.5" stroke="none" />
      </g>
      <T x={482} y={200} size={15} anchor="start">heat, Δ</T>
      <Mol smiles={SMILES.propanamide} x={400} y={262} />
      <T x={505} y={266} size={18}>+ H₂O</T>
      <Caption lines={['The salt forms first; the amide needs heating', 'The amide N comes from the ammonia']} />
    </g>
  )
}

function Step6() {
  return (
    <g>
      <Mol smiles={SMILES.pentanoicAcid} x={135} y={120} />
      <Arrow x1={252} x2={328} y={120} />
      <Mol smiles={SMILES.pentanol} x={445} y={120} />
      <T x={290} y={182} size={15}>LiAlH₄ or B₂H₆, then H₃O⁺</T>
      <T x={290} y={204} size={15} fill={MUTED}>NaBH₄: no reaction</T>
      <T x={130} y={274} size={17}>CH₃(CH₂)₄COONa</T>
      <Arrow x1={228} x2={310} y={270} />
      <T x={270} y={300} size={14}>NaOH : CaO (3 : 1), Δ</T>
      <Mol smiles={SMILES.pentane} x={445} y={270} />
      <Caption lines={['C₆ salt → C₅ hydrocarbon: one carbon fewer']} />
    </g>
  )
}

const TITLES: Readonly<Record<number, string>> = {
  1: 'Two acids lose water: an anhydride',
  2: 'Esterification with an acid catalyst',
  3: 'The mechanism, arrow by arrow',
  4: 'The OH swapped for Cl',
  5: 'Ammonia: salt, then amide on heating',
  6: 'The COOH carbon: reduction and decarboxylation',
}

const PANELS: Readonly<Record<number, () => ReactNode>> = {
  1: Step1,
  2: Step2,
  3: Step3,
  4: Step4,
  5: Step5,
  6: Step6,
}

export function AcidDerivativesScrolly({ step }: AcidDerivativesScrollyProps) {
  const number = step + 1
  const Panel = PANELS[number]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Acid derivatives, Step ${number} of 6: ${TITLES[number] ?? ''}`}
      data-step={step}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <T x={W / 2} y={34} size={18} weight={600}>
        {TITLES[number] ?? ''}
      </T>
      {Panel ? <Panel /> : null}
    </svg>
  )
}
