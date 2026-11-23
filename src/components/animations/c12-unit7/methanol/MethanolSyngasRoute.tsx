'use client'

import { useMemo } from 'react'
import { StructuralFormula } from '@/components/organic'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  METHANOL_CONDITIONS,
  METHANOL_SMILES,
  METHANOL_STEP_COUNT,
  METHANOL_STEP_LABELS,
  METHANOL_STEP_TITLES,
} from './methanol-steps'

export interface MethanolSyngasRouteProps {
  step: number
  reducedMotion: boolean
}

const W = 600
const H = 480

/** Broken-axis linear scale (280 K baseline to 370 K) so 337 K vs 351 K (+14 K) reads clearly. */
function bpHeight(bpK: number): number {
  return Math.round(((bpK - 280) / (370 - 280)) * 102)
}

function BoilingPointCard({ highlightMethanol, showDelta }: { highlightMethanol: boolean; showDelta: boolean }) {
  const base = 218
  const hMe = bpHeight(METHANOL_CONDITIONS.methanolBpK)
  const hEt = bpHeight(METHANOL_CONDITIONS.ethanolBpK)
  const yMe = base - hMe
  const yEt = base - hEt

  return (
    <g>
      <rect x={360} y={62} width={224} height={192} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={472} y={86} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Boiling point / K
      </text>

      {/* Broken-axis baseline */}
      <line x1={382} y1={base} x2={562} y2={base} stroke="var(--bond)" strokeWidth={1.8} />
      <text x={382} y={base - 6} fontSize={16} fill="var(--fg-subtle)">
        280
      </text>

      {/* Methanol bar */}
      <rect
        x={416}
        y={yMe}
        width={44}
        height={hMe}
        rx={5}
        fill={highlightMethanol ? 'var(--accent)' : 'var(--liquid-edge)'}
      />
      <text x={438} y={yMe - 8} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        337 K
      </text>
      <text x={438} y={240} textAnchor="middle" fontSize={16} fill="var(--fg)">
        CH₃OH
      </text>

      {/* Ethanol bar */}
      <rect
        x={498}
        y={yEt}
        width={44}
        height={hEt}
        rx={5}
        fill="var(--fg-muted)"
        fillOpacity={highlightMethanol ? 0.45 : 0.72}
      />
      <text x={520} y={yEt - 8} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        351 K
      </text>
      <text x={520} y={240} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        C₂H₅OH
      </text>

      {showDelta && (
        <g>
          <line x1={462} y1={yMe} x2={496} y2={yMe} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="4 3" />
          <line x1={482} y1={yEt} x2={482} y2={yMe} stroke="var(--accent)" strokeWidth={2} />
          <text x={480} y={108} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--accent)">
            +14 K
          </text>
        </g>
      )}
    </g>
  )
}

function StepZeroLeft({ reveal }: { reveal: number }) {
  return (
    <g>
      {/* Historical wood retort */}
      <g opacity={1 - 0.35 * reveal}>
        <rect x={30} y={80} width={126} height={116} rx={12} fill="var(--surface)" stroke="var(--glass-amber)" strokeWidth={2} />
        <rect x={48} y={102} width={90} height={22} rx={6} fill="var(--glass-amber)" fillOpacity={0.35} stroke="var(--glass-amber)" strokeWidth={1.4} />
        <line x1={58} y1={113} x2={128} y2={113} stroke="var(--glass-amber)" strokeWidth={2} />
        <text x={93} y={150} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          Wood spirit
        </text>
        <text x={93} y={172} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          No air heating
        </text>
      </g>

      {/* Transition arrow */}
      <g opacity={reveal}>
        <line x1={164} y1={138} x2={204} y2={138} stroke="var(--accent)" strokeWidth={2.6} />
        <polygon points="214,138 202,131 202,145" fill="var(--accent)" />
        <text x={188} y={120} textAnchor="middle" fontSize={16} fill="var(--accent)">
          Today
        </text>
      </g>

      {/* Modern syngas box */}
      <g opacity={0.4 + 0.6 * reveal}>
        <rect x={218} y={80} width={114} height={116} rx={12} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
        <text x={275} y={120} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          Syngas
        </text>
        <text x={275} y={148} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--accent)">
          CO + 2 H₂
        </text>
        <text x={275} y={172} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          Gas feed
        </text>
      </g>

      {/* Reactor entry feed pipe */}
      <rect x={30} y={224} width={302} height={186} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.6} />
      <text x={181} y={254} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        High-pressure reactor inlet
      </text>

      {/* CO + 2 H2 molecule badges */}
      <g transform="translate(52, 282)">
        <circle cx={20} cy={22} r={14} fill="var(--el-C)" stroke="var(--atom-rim)" strokeWidth={1.5} />
        <circle cx={46} cy={22} r={14} fill="var(--el-O)" stroke="var(--atom-rim)" strokeWidth={1.5} />
        <text x={33} y={56} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          CO
        </text>
      </g>
      <text x={126} y={310} textAnchor="middle" fontSize={18} fontWeight={600} fill="var(--fg-muted)">
        +
      </text>
      <g transform="translate(148, 282)">
        <circle cx={14} cy={14} r={10} fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth={1.2} />
        <circle cx={34} cy={14} r={10} fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth={1.2} />
        <circle cx={14} cy={36} r={10} fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth={1.2} />
        <circle cx={34} cy={36} r={10} fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth={1.2} />
        <text x={24} y={64} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          2 H₂
        </text>
      </g>

      {/* Flow arrow into reactor chamber */}
      <line x1={206} y1={310} x2={252} y2={310} stroke="var(--accent)" strokeWidth={3} />
      <polygon points="264,310 250,302 250,318" fill="var(--accent)" />
      <rect x={266} y={272} width={50} height={80} rx={8} fill="var(--surface-raised)" stroke="var(--bond)" strokeWidth={2} />
      <text x={291} y={316} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg-muted)">
        Inlet
      </text>
      <text x={181} y={392} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        3 mol gas enter steel reactor
      </text>
    </g>
  )
}

function StepOneLeft({ reveal }: { reveal: number }) {
  const pellets = [
    [142, 232], [166, 232], [190, 232], [214, 232], [238, 232],
    [154, 256], [178, 256], [202, 256], [226, 256],
  ] as const

  return (
    <g>
      {/* Pressure dial */}
      <g transform="translate(96, 122)">
        <path d="M -38 0 A 38 38 0 0 1 38 0" fill="none" stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
        <path d="M 10 -36 A 38 38 0 0 1 36 -10" fill="none" stroke="var(--success)" strokeWidth={8} strokeLinecap="round" />
        <line x1={0} y1={0} x2={22} y2={-22} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={0} cy={0} r={5} fill="var(--fg)" />
        <text x={0} y={24} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          200-300 atm
        </text>
      </g>

      {/* Temperature pill */}
      <rect x={186} y={84} width={144} height={46} rx={10} fill="var(--surface)" stroke="var(--heat)" strokeWidth={2} />
      <text x={258} y={113} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--heat)">
        573-673 K
      </text>

      {/* Steel reactor chamber */}
      <rect x={94} y={172} width={196} height={128} rx={18} fill="var(--surface)" stroke="var(--bond)" strokeWidth={3} />
      <text x={192} y={200} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        ZnO-Cr₂O₃ bed
      </text>
      {pellets.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={8}
          fill="var(--ox)"
          fillOpacity={0.35 + 0.55 * reveal}
          stroke="var(--ox)"
          strokeWidth={1.4}
        />
      ))}

      {/* Feed arrow in */}
      <line x1={32} y1={244} x2={80} y2={244} stroke="var(--fg)" strokeWidth={2.5} />
      <polygon points="90,244 78,237 78,251" fill="var(--fg)" />
      <text x={58} y={224} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        CO+2H₂
      </text>

      {/* Product arrow out */}
      <line x1={292} y1={236} x2={326} y2={236} stroke="var(--accent)" strokeWidth={2.8} />
      <polygon points="336,236 324,229 324,243" fill="var(--accent)" />

      {/* Product liquid card */}
      <g opacity={reveal}>
        <rect x={54} y={322} width={254} height={92} rx={12} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
        <text x={181} y={356} textAnchor="middle" fontSize={18} fontWeight={600} fill="var(--fg)">
          CH₃OH (liquid)
        </text>
        <text x={181} y={386} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          3 mol gas → 1 mol methanol
        </text>
      </g>
    </g>
  )
}

function StepTwoLeft({ reveal }: { reveal: number }) {
  const meGraph = useMemo(() => parseSmiles(METHANOL_SMILES.methanol), [])
  const formGraph = useMemo(() => parseSmiles(METHANOL_SMILES.formaldehyde), [])
  const acidGraph = useMemo(() => parseSmiles(METHANOL_SMILES.formicAcid), [])

  const rows = [
    { label: 'Methanol', formula: 'CH₃OH', graph: meGraph, y: 98, tone: 'var(--border)' },
    { label: 'Methanal', formula: 'HCHO', graph: formGraph, y: 194, tone: 'var(--caution)' },
    { label: 'Methanoic acid', formula: 'HCOOH', graph: acidGraph, y: 290, tone: 'var(--delta-plus)' },
  ] as const

  return (
    <g>
      <text x={182} y={84} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Metabolic oxidation in body
      </text>
      {rows.map((row, idx) => (
        <g key={row.label} opacity={idx === 0 ? 1 : 0.25 + 0.75 * reveal}>
          <rect
            x={28}
            y={row.y}
            width={308}
            height={74}
            rx={10}
            fill="var(--surface)"
            stroke={row.tone}
            strokeWidth={1.8}
          />
          <g transform={`translate(96, ${row.y + 37})`}>
            <StructuralFormula graph={row.graph} mode="complete" completeScale={21} scale={46} />
          </g>
          <text x={174} y={row.y + 30} fontSize={16} fontWeight={600} fill="var(--fg)">
            {row.label}
          </text>
          <text x={174} y={row.y + 54} fontSize={16} fill="var(--fg-muted)">
            {row.formula}
          </text>
          {idx < 2 && (
            <g>
              <line x1={182} y1={row.y + 75} x2={182} y2={row.y + 89} stroke="var(--caution)" strokeWidth={2.2} />
              <polygon points={`182,${row.y + 95} 176,${row.y + 85} 188,${row.y + 85}`} fill="var(--caution)" />
            </g>
          )}
        </g>
      ))}
      <rect x={28} y={378} width={308} height={42} rx={10} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1.6} />
      <text x={182} y={405} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Highly poisonous if ingested
      </text>
    </g>
  )
}

function StepThreeLeft({ reveal }: { reveal: number }) {
  const formGraph = useMemo(() => parseSmiles(METHANOL_SMILES.formaldehyde), [])

  return (
    <g>
      {/* Inlet CH3OH pipe */}
      <rect x={28} y={208} width={96} height={52} rx={10} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
      <text x={76} y={240} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        CH₃OH
      </text>

      {/* Split pipes */}
      <path d="M 124 224 Q 152 224 166 148 L 182 148" fill="none" stroke="var(--bond)" strokeWidth={4} />
      <polygon points="190,148 178,141 178,155" fill="var(--bond)" />

      <path d="M 124 244 Q 152 244 166 322 L 180 322" fill="none" stroke="var(--accent)" strokeWidth={9} />
      <polygon points="192,322 178,312 178,332" fill="var(--accent)" />

      {/* Upper destination: paint & varnish solvent */}
      <g opacity={reveal}>
        <rect x={194} y={96} width={142} height={106} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.8} />
        <text x={265} y={130} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          Solvent
        </text>
        <text x={265} y={156} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          Paints &amp;
        </text>
        <text x={265} y={178} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          varnishes
        </text>
      </g>

      {/* Lower destination (thicker main pipe): Formaldehyde */}
      <g opacity={reveal}>
        <rect x={194} y={232} width={142} height={174} rx={12} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2.2} />
        <text x={265} y={262} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--accent)">
          Chief use
        </text>
        <text x={265} y={288} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          Formaldehyde
        </text>
        <g transform="translate(265, 342)">
          <StructuralFormula graph={formGraph} mode="complete" completeScale={24} scale={46} />
        </g>
        <text x={265} y={392} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
          HCHO
        </text>
      </g>
    </g>
  )
}

function RightSummaryCard({ index }: { index: number }) {
  const isHazard = index === 2
  const bg = isHazard ? 'var(--caution-soft)' : 'var(--surface-raised)'
  const border = isHazard ? 'var(--caution)' : 'var(--border)'

  const lines: Record<number, { heading: string; rows: readonly string[]; tone?: string }> = {
    0: {
      heading: 'Feed transition',
      rows: ['Old: Wood retort', 'Now: Syngas stream', '1 CO + 2 H₂'],
    },
    1: {
      heading: 'Balanced equation',
      rows: ['CO + 2 H₂ → CH₃OH', 'Cat: ZnO-Cr₂O₃', '200-300 atm, 573-673 K'],
    },
    2: {
      heading: 'Hazard readout',
      rows: ['Small dose: Blindness', 'Large dose: Death', 'CH₃OH→HCHO→HCOOH'],
      tone: 'var(--caution)',
    },
    3: {
      heading: 'Product profile',
      rows: ['Colourless liquid', 'Boils at 337 K', 'Mainly makes HCHO'],
    },
  }

  const card = lines[index] ?? lines[0]

  return (
    <g>
      <rect x={360} y={268} width={224} height={166} rx={12} fill={bg} stroke={border} strokeWidth={1.8} />
      <text x={472} y={298} textAnchor="middle" fontSize={16} fontWeight={600} fill={card.tone ?? 'var(--fg)'}>
        {card.heading}
      </text>
      {card.rows.map((line, i) => (
        <text key={line} x={472} y={334 + i * 32} textAnchor="middle" fontSize={16} fill="var(--fg)">
          {line}
        </text>
      ))}
    </g>
  )
}

export function MethanolSyngasRoute({ step, reducedMotion }: MethanolSyngasRouteProps) {
  const index = Math.min(METHANOL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)

  const captions = [
    'Destructive distillation of wood gives way to CO + 2 H₂ synthesis gas.',
    'ZnO-Cr₂O₃ at 200-300 atm and 573-673 K hydrogenates CO to CH₃OH.',
    'Methanol boils at 337 K and oxidises in the body to HCHO and HCOOH.',
    'Methanol feeds paints and varnishes as a solvent and makes HCHO.',
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={METHANOL_STEP_LABELS[index]}
      style={{ width: '100%', height: '100%', maxHeight: '100%', display: 'block' }}
      data-step={index}
      data-testid="methanol-syngas-visual"
    >
      {/* Header */}
      <text x={W / 2} y={34} textAnchor="middle" fontSize={19} fontWeight={600} fill="var(--fg)">
        {METHANOL_STEP_TITLES[index]}
      </text>

      {/* Left 60% process stage */}
      <rect x={16} y={62} width={332} height={372} rx={14} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      {index === 0 && <StepZeroLeft reveal={reveal} />}
      {index === 1 && <StepOneLeft reveal={reveal} />}
      {index === 2 && <StepTwoLeft reveal={reveal} />}
      {index === 3 && <StepThreeLeft reveal={reveal} />}

      {/* Right 40% comparison & hazard / readout */}
      <BoilingPointCard highlightMethanol={index === 2 || index === 3} showDelta={index >= 2} />
      <RightSummaryCard index={index} />

      {/* Bottom caption */}
      <text x={W / 2} y={462} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {captions[index]}
      </text>
    </svg>
  )
}
