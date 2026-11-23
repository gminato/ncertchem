'use client'

import { useMemo, useState } from 'react'
import { Segmented } from '@/components/controls'
import { CurvedArrow, SkeletalFormula } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ChemArrow,
  LonePairDots,
  StatusPill,
  SvgCard,
} from '@/components/animations/c12-unit7/ether-svg-helpers'
import {
  BOILING_GAP_ALCOHOL_VS_ETHER_K,
  DEHYDRATION_ALCOHOL_OPTIONS,
  DEHYDRATION_TEMPS,
  ETHER_ANGLE_DEG,
  PHYSICAL_PROPERTY_RECORDS,
  WILLIAMSON_HALIDES,
  WILLIAMSON_NUCLEOPHILES,
  evaluateDehydration,
  evaluateWilliamson,
  getPhysicalPropertyRecord,
  type CompoundSelection,
  type DehydrationAlcohol,
  type DehydrationTempK,
  type PhaseView,
  type PropertyCompoundId,
  type SynthesisOutcome,
  type SynthesisRoute,
  type WilliamsonHalide,
  type WilliamsonNucleophile,
} from '@/lib/chem/c12-u7-s11-ethers'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import styles from './ether-synthesis-and-properties-lab.module.css'

type LabMode = 'synthesis' | 'properties'

const MODE_OPTIONS = [
  { value: 'synthesis', label: 'Synthesis Lab' },
  { value: 'properties', label: 'Physical Properties Lab' },
] as const satisfies readonly { value: LabMode; label: string }[]

const ROUTE_OPTIONS = [
  { value: 'dehydration', label: 'Alcohol Dehydration (H₂SO₄)' },
  { value: 'williamson', label: 'Williamson Synthesis' },
] as const satisfies readonly { value: SynthesisRoute; label: string }[]

const ALCOHOL_OPTIONS = DEHYDRATION_ALCOHOL_OPTIONS.map((a) => ({
  value: a.id,
  label: a.label,
}))

const TEMP_OPTIONS = DEHYDRATION_TEMPS.map((t) => ({
  value: String(t) as `${DehydrationTempK}`,
  label: `${t} K`,
}))

const NUCLEOPHILE_OPTIONS = WILLIAMSON_NUCLEOPHILES.map((n) => ({
  value: n.id,
  label: n.label,
}))

const HALIDE_OPTIONS = WILLIAMSON_HALIDES.map((h) => ({
  value: h.id,
  label: h.label,
}))

const COMPOUND_OPTIONS = [
  { value: 'n-pentane', label: 'n-Pentane' },
  { value: 'ethoxyethane', label: 'Ethoxyethane' },
  { value: 'butan-1-ol', label: 'Butan-1-ol' },
  { value: 'all', label: 'Compare All' },
] as const satisfies readonly { value: CompoundSelection; label: string }[]

const PHASE_OPTIONS = [
  { value: 'boiling', label: 'Pure Liquid (Boiling)' },
  { value: 'miscibility', label: 'In Water (Miscibility)' },
] as const satisfies readonly { value: PhaseView; label: string }[]

const VB_W = 760
const VB_H = 416

/** Small phenyl ring icon for phenoxide / phenetole / anisole mechanisms. */
function MiniPhenylRing({ cx, cy, r = 28 }: { cx: number; cy: number; r?: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon points={pts} fill="none" stroke="var(--fg)" strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="var(--fg)" strokeWidth={1.6} />
    </g>
  )
}

function SynthesisMechanismSvg({
  route,
  alcohol,
  tempK,
  nucleophile,
  halide,
  outcome,
}: {
  route: SynthesisRoute
  alcohol: DehydrationAlcohol
  tempK: DehydrationTempK
  nucleophile: WilliamsonNucleophile
  halide: WilliamsonHalide
  outcome: SynthesisOutcome
}) {
  if (route === 'dehydration') {
    if (alcohol === 'ethanol' && tempK === 413) {
      return (
        <g>
          <text x={194} y={98} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
            SN2 Attack on Protonated Ethanol
          </text>
          <text x={74} y={206} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            C₂H₅–
          </text>
          <text x={118} y={206} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
            O
          </text>
          <LonePairDots cx={118} cy={206} angleDeg={0} radius={18} />
          <line x1={118} y1={220} x2={118} y2={242} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
          <text x={118} y={256} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            H
          </text>
          <text x={94} y={292} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--lone-pair-edge)">
            2nd ethanol
          </text>

          {/* Protonated ethanol */}
          <text x={198} y={156} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            CH₃
          </text>
          <line x1={212} y1={168} x2={228} y2={192} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={238} cy={206} r={16} fill="var(--highlight)" />
          <text x={238} y={206} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
            CH₂
          </text>
          <text x={238} y={238} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
            δ⁺ (α-C)
          </text>
          <line x1={262} y1={206} x2={300} y2={206} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
          <text x={332} y={206} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
            ⁺OH₂
          </text>

          <CurvedArrow from={{ x: 142, y: 200 }} to={{ x: 216, y: 202 }} bend={-0.35} />
          <CurvedArrow from={{ x: 282, y: 202 }} to={{ x: 318, y: 188 }} bend={-0.38} />

          <text x={194} y={340} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
            H₂O departs → oxonium loses H⁺ → ether
          </text>
        </g>
      )
    }

    if (alcohol === 'mixture' && tempK === 413) {
      return (
        <g>
          <text x={194} y={98} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
            Competing Cross-SN2 Coupling
          </text>
          <text x={194} y={142} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            CH₃OH  +  C₂H₅OH  +  H⁺
          </text>
          <text x={194} y={182} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Both alcohols protonate: CH₃–OH₂⁺ &amp; C₂H₅–OH₂⁺
          </text>
          <text x={194} y={214} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Both alcohols attack: CH₃OH &amp; C₂H₅OH
          </text>
          <rect x={44} y={240} width={300} height={66} rx={10} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1.4} />
          <text x={194} y={266} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
            4 competing SN2 pairings
          </text>
          <text x={194} y={292} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
            Yields all 3 ethers (poor selectivity)
          </text>
          <text x={194} y={342} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Use Williamson synthesis for mixed ethers
          </text>
        </g>
      )
    }

    // Elimination mechanism for dehydration (443 K ethanol/mixture, 2° propan-2-ol, 3° tert-butyl alcohol)
    const alcLabel =
      alcohol === 'propan-2-ol'
        ? '2° Propan-2-ol'
        : alcohol === 'tert-butanol'
          ? '3° tert-Butyl alcohol'
          : 'Protonated ethanol'
    const betaCarbonGroup = 'CH₂'
    const alphaCarbonGroup =
      alcohol === 'tert-butanol' ? 'C(CH₃)₂' : alcohol === 'propan-2-ol' ? 'CH(CH₃)' : 'CH₂'
    const showCarbocationNote = alcohol === 'propan-2-ol' || alcohol === 'tert-butanol'

    return (
      <g>
        <text x={194} y={98} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
          {showCarbocationNote ? `${alcLabel}: Elimination Outpaces SN2` : `${alcLabel} at 443 K: Elimination`}
        </text>

        <circle cx={88} cy={156} r={15} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1.6} />
        <text x={88} y={156} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
          H
        </text>
        <text x={54} y={156} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
          β-H
        </text>
        <line x1={98} y1={168} x2={122} y2={200} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />

        <text x={136} y={214} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          {betaCarbonGroup}
        </text>
        <line x1={160} y1={214} x2={216} y2={214} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
        <line x1={164} y1={204} x2={212} y2={204} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />

        <text x={246} y={214} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          {alphaCarbonGroup}
        </text>

        <line x1={284} y1={214} x2={318} y2={214} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
        <text x={342} y={214} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          ⁺OH₂
        </text>

        <CurvedArrow from={{ x: 112, y: 186 }} to={{ x: 186, y: 200 }} bend={0.35} />
        <CurvedArrow from={{ x: 300, y: 210 }} to={{ x: 336, y: 194 }} bend={-0.38} />

        <text x={194} y={288} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          β-proton lost + H₂O departs → C=C π bond forms
        </text>
        <text x={194} y={336} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
          {showCarbocationNote ? '2° / 3° substrates fail to yield ethers' : '443 K favours alkene over ether'}
        </text>
      </g>
    )
  }

  // Williamson mechanism drawing
  const is3Halide = halide === '(CH3)3C-Br'
  const isPhenoxide = nucleophile === 'phenoxide'
  const isTertButoxide = nucleophile === 'tert-butoxide'
  const nucShort = isPhenoxide ? 'O⁻' : isTertButoxide ? '(CH₃)₃C–O⁻' : 'CH₃–O⁻'

  if (!is3Halide) {
    const halCarbon = halide === 'CH3-Br' ? 'CH₃' : 'CH₂–CH₃'
    return (
      <g>
        <text x={194} y={98} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          {isPhenoxide ? 'Phenoxide SN2 on 1° Halide' : 'Alkoxide SN2 Backside Attack'}
        </text>

        {isPhenoxide ? (
          <>
            <MiniPhenylRing cx={86} cy={222} r={26} />
            <line x1={104} y1={206} x2={124} y2={194} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
            <text x={142} y={190} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
              {nucShort}
            </text>
            <LonePairDots cx={140} cy={190} angleDeg={0} radius={18} />
            <text x={106} y={272} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              from C₆H₅OH + NaOH
            </text>
          </>
        ) : (
          <>
            <text x={98} y={204} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
              {nucShort}
            </text>
            <LonePairDots cx={128} cy={204} angleDeg={0} radius={18} />
            <text x={98} y={244} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ion-cation)">
              Na⁺
            </text>
          </>
        )}

        {/* 1 deg halide */}
        <circle cx={246} cy={204} r={16} fill="var(--highlight)" />
        <text x={246} y={204} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          {halide === 'CH3-Br' ? 'CH₃' : 'CH₂'}
        </text>
        {halide === 'CH3CH2-Br' ? (
          <>
            <line x1={238} y1={188} x2={220} y2={162} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
            <text x={212} y={148} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              CH₃
            </text>
          </>
        ) : null}
        <text x={246} y={236} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
          δ⁺ (1° C)
        </text>

        <line x1={270} y1={204} x2={326} y2={204} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
        <text x={346} y={204} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--el-Br)">
          Br
        </text>
        <text x={346} y={236} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
          δ⁻
        </text>

        <CurvedArrow
          from={{ x: isPhenoxide ? 162 : 154, y: isPhenoxide ? 188 : 198 }}
          to={{ x: 224, y: 200 }}
          bend={-0.36}
        />
        <CurvedArrow from={{ x: 300, y: 200 }} to={{ x: 344, y: 184 }} bend={-0.38} />

        <text x={194} y={310} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
          {`Unhindered ${halCarbon} lets SN2 proceed cleanly`}
        </text>
        <text x={194} y={342} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          {outcome.yieldBadge}
        </text>
      </g>
    )
  }

  // Williamson with 3° halide -> Elimination dominates / sole reaction
  return (
    <g>
      <text x={194} y={98} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
        3° Halide Blocks SN2 → Elimination
      </text>

      {isPhenoxide ? (
        <>
          <MiniPhenylRing cx={56} cy={244} r={22} />
          <line x1={72} y1={230} x2={88} y2={220} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
          <text x={102} y={216} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
            O⁻
          </text>
        </>
      ) : (
        <text x={78} y={218} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          {nucShort}
        </text>
      )}
      <text x={78} y={288} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--base)">
        Acts as base
      </text>

      {/* Steric barrier arc */}
      <path d="M 192 182 A 42 42 0 0 0 192 252" fill="none" stroke="var(--caution)" strokeWidth={2.2} strokeDasharray="5 4" />
      <text x={154} y={230} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        SN2
      </text>
      <text x={154} y={250} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        blocked
      </text>

      {/* (CH3)3C-Br with beta-H */}
      <circle cx={182} cy={138} r={14} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1.6} />
      <text x={182} y={138} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        H
      </text>
      <line x1={198} y1={142} x2={232} y2={150} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={256} y={152} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂
      </text>
      <line x1={256} y1={166} x2={256} y2={200} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <line x1={264} y1={170} x2={264} y2={196} stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="5 4" />

      <text x={256} y={216} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      <line x1={246} y1={228} x2={222} y2={250} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={208} y={264} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>
      <line x1={266} y1={228} x2={290} y2={250} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={304} y={264} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      <line x1={272} y1={216} x2={326} y2={216} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={346} y={216} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--el-Br)">
        Br
      </text>

      <CurvedArrow from={{ x: 112, y: 202 }} to={{ x: 168, y: 146 }} bend={-0.24} />
      <CurvedArrow from={{ x: 218, y: 150 }} to={{ x: 262, y: 184 }} bend={0.35} />
      <CurvedArrow from={{ x: 300, y: 212 }} to={{ x: 344, y: 196 }} bend={-0.38} />

      <text x={194} y={336} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        3 methyl groups block backside SN2 attack
      </text>
    </g>
  )
}

function SynthesisProductsSvg({ outcome }: { outcome: SynthesisOutcome }) {
  const isMixed = Boolean(outcome.mixedProducts && outcome.mixedProducts.length > 0)
  const productGraph = useMemo(() => parseSmiles(outcome.productSmiles), [outcome.productSmiles])
  const ringTone = outcome.isEtherSuccess ? 'success' : 'caution'

  return (
    <g>
      <text x={599} y={98} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        {isMixed ? '3 Competing Ether Products' : 'Major Product & By-Products'}
      </text>

      {isMixed && outcome.mixedProducts ? (
        <g>
          {outcome.mixedProducts.map((item, idx) => {
            const py = 128 + idx * 62
            return (
              <g key={item.formula}>
                <rect
                  x={476}
                  y={py}
                  width={246}
                  height={48}
                  rx={10}
                  fill={idx === 1 ? 'var(--accent-soft)' : 'var(--surface)'}
                  stroke={idx === 1 ? 'var(--accent)' : 'var(--border)'}
                  strokeWidth={1.5}
                />
                <text x={599} y={py + 18} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {item.formula}
                </text>
                <text x={599} y={py + 38} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {item.name}
                </text>
              </g>
            )
          })}
          <text x={599} y={336} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {`By-product: ${outcome.byProducts}`}
          </text>
        </g>
      ) : (
        <g>
          <SkeletalFormula graph={productGraph} scale={42} x={599} y={170} />
          <text
            x={599}
            y={252}
            textAnchor="middle"
            fontSize={16}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={outcome.isEtherSuccess ? 'var(--success)' : 'var(--caution)'}
          >
            {outcome.majorProductName}
          </text>
          {outcome.majorProductSubtitle ? (
            <text x={599} y={276} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {`(${outcome.majorProductSubtitle})`}
            </text>
          ) : null}
          <text
            x={599}
            y={outcome.majorProductSubtitle ? 302 : 282}
            textAnchor="middle"
            fontSize={16}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            {outcome.majorProductFormula}
          </text>
          <text
            x={599}
            y={outcome.majorProductSubtitle ? 330 : 314}
            textAnchor="middle"
            fontSize={15}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
          >
            {`By-products: ${outcome.byProducts}`}
          </text>
        </g>
      )}

      <StatusPill cx={599} cy={368} width={264} tone={ringTone}>
        {outcome.yieldBadge}
      </StatusPill>
    </g>
  )
}

function PureLiquidSvg({ selection }: { selection: CompoundSelection }) {
  const maxK = 430
  const chartX = 468
  const chartY = 66
  const chartW = 252
  const chartH = 264
  const yOf = (k: number) => chartY + chartH - (k / maxK) * chartH
  const ticks = [0, 100, 200, 300, 400]
  const barCenters = [520, 600, 680]

  const isSelected = (id: PropertyCompoundId) => selection === 'all' || selection === id
  const single = selection === 'all' ? null : getPhysicalPropertyRecord(selection)

  return (
    <g>
      {/* Left card: Pure-liquid molecular interactions */}
      <SvgCard x={16} y={16} width={394} height={384} />
      <text x={213} y={44} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        Pure Liquid Intermolecular Forces
      </text>

      {single ? (
        <g>
          <text x={213} y={76} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
            {`${single.name} (${single.formula})`}
          </text>

          {single.id === 'n-pentane' ? (
            <g>
              <SkeletalFormula graph={parseSmiles('CCCCC')} scale={42} x={213} y={144} />
              <line x1={120} y1={194} x2={306} y2={194} stroke="var(--fg-muted)" strokeWidth={2} strokeDasharray="3 6" />
              <SkeletalFormula graph={parseSmiles('CCCCC')} scale={42} x={213} y={244} />
              <text x={213} y={308} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                Nonpolar chains → van der Waals only
              </text>
              <text x={213} y={336} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                No oxygen atom → no dipole or H-bonding
              </text>
            </g>
          ) : single.id === 'ethoxyethane' ? (
            <g>
              {/* Bent ether dipole */}
              <text x={213} y={142} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
                O
              </text>
              <LonePairDots cx={213} cy={142} angleDeg={-120} radius={18} />
              <LonePairDots cx={213} cy={142} angleDeg={-60} radius={18} />
              <line x1={198} y1={152} x2={148} y2={182} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
              <line x1={228} y1={152} x2={278} y2={182} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
              <text x={120} y={188} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₂H₅
              </text>
              <text x={306} y={188} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₂H₅
              </text>
              <text x={213} y={222} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
                {`Bent (${ETHER_ANGLE_DEG}°) → net dipole`}
              </text>
              <line x1={110} y1={242} x2={316} y2={242} stroke="var(--caution)" strokeWidth={1.8} strokeDasharray="5 4" />
              <text x={213} y={274} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₂H₅–O–C₂H₅  ⋯×⋯  C₂H₅–O–C₂H₅
              </text>
              <text x={213} y={312} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
                No O–H bond → no self hydrogen bonding
              </text>
              <text x={213} y={338} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                Boils at 307.6 K (close to n-pentane)
              </text>
            </g>
          ) : (
            <g>
              <text x={118} y={162} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₄H₉–O–H
              </text>
              <line x1={170} y1={162} x2={232} y2={162} stroke="var(--success)" strokeWidth={2.8} strokeDasharray="6 4" />
              <text x={294} y={162} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                O(H)–C₄H₉
              </text>
              <text x={201} y={136} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
                O–H⋯O H-bond
              </text>

              <line x1={294} y1={182} x2={294} y2={232} stroke="var(--success)" strokeWidth={2.6} strokeDasharray="6 4" />
              <text x={294} y={252} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                H–O–C₄H₉
              </text>

              <text x={213} y={308} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
                Extensive O–H⋯O network in pure liquid
              </text>
              <text x={213} y={336} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                Extra heat needed → boils at 390 K
              </text>
            </g>
          )}
          <StatusPill
            cx={213}
            cy={372}
            width={344}
            tone={single.id === 'butan-1-ol' ? 'success' : single.id === 'ethoxyethane' ? 'accent' : 'neutral'}
          >
            {`b.p. = ${single.printedBp} K`}
          </StatusPill>
        </g>
      ) : (
        <g>
          {PHYSICAL_PROPERTY_RECORDS.map((rec, idx) => {
            const cy = 98 + idx * 96
            const tone = rec.id === 'butan-1-ol' ? 'success' : rec.id === 'ethoxyethane' ? 'accent' : 'neutral'
            return (
              <g key={rec.id}>
                <SvgCard x={32} y={cy - 24} width={362} height={82} tone={tone} />
                <text x={48} y={cy} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {`${rec.name} (${rec.printedBp} K)`}
                </text>
                <text x={48} y={cy + 26} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {rec.id === 'n-pentane'
                    ? 'van der Waals dispersion only'
                    : rec.id === 'ethoxyethane'
                      ? 'Dipole-dipole; no O–H self H-bond'
                      : 'Strong O–H⋯O H-bonding network'}
                </text>
              </g>
            )
          })}
          <text x={213} y={380} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
            {`Butan-1-ol is +${BOILING_GAP_ALCOHOL_VS_ETHER_K} K higher than ethoxyethane`}
          </text>
        </g>
      )}

      {/* Right card: Boiling point bar chart */}
      <SvgCard x={422} y={16} width={322} height={384} />
      <text x={583} y={44} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        Boiling Point Comparison (K)
      </text>

      {ticks.map((t) => {
        const ty = yOf(t)
        return (
          <g key={t}>
            <line x1={chartX} y1={ty} x2={chartX + chartW} y2={ty} stroke="var(--border)" strokeWidth={1} />
            <text x={chartX - 8} y={ty} textAnchor="end" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {t}
            </text>
          </g>
        )
      })}
      <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} stroke="var(--fg-muted)" strokeWidth={1.6} />
      <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke="var(--fg-muted)" strokeWidth={1.6} />

      {PHYSICAL_PROPERTY_RECORDS.map((rec, i) => {
        const cx = barCenters[i]
        const active = isSelected(rec.id)
        const top = yOf(rec.bpK)
        const h = chartY + chartH - top
        const fill =
          rec.id === 'butan-1-ol'
            ? 'var(--success)'
            : rec.id === 'ethoxyethane'
              ? 'var(--accent)'
              : 'var(--fg-muted)'
        return (
          <g key={rec.id} opacity={active ? 1 : 0.32}>
            <rect x={cx - 24} y={top} width={48} height={h} rx={4} fill={fill} />
            <text
              x={cx}
              y={top - 10}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {`${rec.printedBp} K`}
            </text>
            <text x={cx} y={chartY + chartH + 22} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {rec.id === 'n-pentane' ? 'Pentane' : rec.id === 'ethoxyethane' ? 'Ether' : 'Butan-1-ol'}
            </text>
          </g>
        )
      })}

      <text x={583} y={384} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        NCERT 7.6.2 (similar molar mass)
      </text>
    </g>
  )
}

function WaterBeaker({
  cx,
  topY,
  rec,
  highlighted,
  compact = false,
}: {
  cx: number
  topY: number
  rec: ReturnType<typeof getPhysicalPropertyRecord>
  highlighted: boolean
  compact?: boolean
}) {
  const bw = compact ? 64 : 112
  const bh = compact ? 92 : 140
  const bx = cx - bw / 2
  const by = topY + 26
  const isImmiscible = rec.miscibilityGPer100Ml === null

  return (
    <g opacity={highlighted ? 1 : 0.35}>
      <text x={cx} y={topY + 12} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        {compact && rec.id === 'ethoxyethane' ? 'Ether' : rec.name}
      </text>
      <rect x={bx} y={by} width={bw} height={bh} rx={8} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      {isImmiscible ? (
        <>
          <rect x={bx + 2} y={by + 16} width={bw - 4} height={bh * 0.28} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1.3} />
          <rect x={bx + 2} y={by + 16 + bh * 0.28} width={bw - 4} height={bh - 18 - bh * 0.28} rx={5} fill="var(--liquid)" />
          {!compact ? (
            <>
              <text x={cx} y={by + 16 + bh * 0.15} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
                Alkane layer
              </text>
              <text x={cx} y={by + 16 + bh * 0.62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
                Water layer
              </text>
            </>
          ) : null}
        </>
      ) : (
        <>
          <rect
            x={bx + 2}
            y={by + 18}
            width={bw - 4}
            height={bh - 20}
            rx={6}
            fill={rec.id === 'ethoxyethane' ? 'var(--accent-soft)' : 'var(--success-soft)'}
            stroke={rec.id === 'ethoxyethane' ? 'var(--accent)' : 'var(--success)'}
            strokeWidth={1.4}
          />
          {!compact ? (
            <text
              x={cx}
              y={by + bh * 0.56}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={rec.id === 'ethoxyethane' ? 'var(--accent)' : 'var(--success)'}
            >
              Mixed solution
            </text>
          ) : null}
        </>
      )}
      <text
        x={cx}
        y={by + bh + 22}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={isImmiscible ? 'var(--caution)' : rec.id === 'ethoxyethane' ? 'var(--accent)' : 'var(--success)'}
      >
        {rec.miscibilityGPer100Ml === null
          ? 'Immiscible'
          : `${rec.miscibilityGPer100Ml} g / 100 mL`}
      </text>
    </g>
  )
}

function WaterMiscibilitySvg({ selection }: { selection: CompoundSelection }) {
  const single = selection === 'all' ? null : getPhysicalPropertyRecord(selection)

  return (
    <g>
      {/* Left card: Aqueous H-bonding interaction */}
      <SvgCard x={16} y={16} width={394} height={384} />
      <text x={213} y={44} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        Interactions with Water (H₂O)
      </text>

      {single ? (
        <g>
          <text x={213} y={76} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
            {`${single.name} (${single.formula})`}
          </text>

          {single.id === 'n-pentane' ? (
            <g>
              <SkeletalFormula graph={parseSmiles('CCCCC')} scale={42} x={213} y={136} />
              <line x1={76} y1={184} x2={350} y2={184} stroke="var(--caution)" strokeWidth={2} strokeDasharray="6 4" />
              <text x={213} y={222} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
                H₂O  ⋯  H₂O  ⋯  H₂O
              </text>
              <text x={213} y={266} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
                Cannot form H-bonds with water
              </text>
              <text x={213} y={298} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                Water stays self-bonded; alkane separates
              </text>
            </g>
          ) : single.id === 'ethoxyethane' ? (
            <g>
              <text x={82} y={142} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₂H₅
              </text>
              <line x1={106} y1={148} x2={136} y2={166} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
              <text x={82} y={204} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₂H₅
              </text>
              <line x1={106} y1={196} x2={136} y2={178} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />

              <text x={152} y={172} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
                O
              </text>
              <LonePairDots cx={152} cy={172} angleDeg={0} radius={18} />
              <LonePairDots cx={152} cy={172} angleDeg={-85} radius={18} />

              <line x1={174} y1={172} x2={244} y2={172} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="6 4" />
              <text x={209} y={154} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
                H-bond
              </text>
              <text x={294} y={172} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
                H–O–H
              </text>
              <text x={213} y={248} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
                Ether oxygen accepts H-bonds from H₂O
              </text>
              <text x={213} y={280} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                Donor: No (no O–H)  |  Acceptor: Yes (2 lone pairs)
              </text>
            </g>
          ) : (
            <g>
              <text x={213} y={136} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                C₄H₉–O–H  ⋯⋯  O(H)–H
              </text>
              <text x={213} y={168} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
                Donates H-bond to water O
              </text>
              <text x={213} y={214} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                H–O(H)  ⋯⋯  O(H)–C₄H₉
              </text>
              <text x={213} y={246} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
                Accepts H-bond from water H
              </text>
              <text x={213} y={292} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                Donor: Yes  |  Acceptor: Yes
              </text>
            </g>
          )}

          <StatusPill
            cx={213}
            cy={370}
            width={344}
            tone={single.id === 'n-pentane' ? 'caution' : single.id === 'ethoxyethane' ? 'accent' : 'success'}
          >
            {single.printedMiscibility}
          </StatusPill>
        </g>
      ) : (
        <g>
          {PHYSICAL_PROPERTY_RECORDS.map((rec, idx) => {
            const cy = 98 + idx * 96
            const tone = rec.id === 'butan-1-ol' ? 'success' : rec.id === 'ethoxyethane' ? 'accent' : 'caution'
            return (
              <g key={rec.id}>
                <SvgCard x={32} y={cy - 24} width={362} height={82} tone={tone} />
                <text x={48} y={cy} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {`${rec.name}: ${rec.printedMiscibility}`}
                </text>
                <text x={48} y={cy + 26} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {`Donor: ${rec.hBondDonor ? 'Yes' : 'No'}   |   Acceptor: ${rec.hBondAcceptor ? 'Yes' : 'No'}`}
                </text>
              </g>
            )
          })}
          <text x={213} y={380} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
            H-bond acceptance lifts ether solubility
          </text>
        </g>
      )}

      {/* Right card: Aqueous miscibility beakers */}
      <SvgCard x={422} y={16} width={322} height={384} />
      <text x={583} y={44} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        Miscibility in 100 mL Water
      </text>

      {single ? (
        <WaterBeaker cx={583} topY={82} rec={single} highlighted />
      ) : (
        <g>
          <WaterBeaker cx={478} topY={118} rec={PHYSICAL_PROPERTY_RECORDS[0]} highlighted compact />
          <WaterBeaker cx={583} topY={118} rec={PHYSICAL_PROPERTY_RECORDS[1]} highlighted compact />
          <WaterBeaker cx={688} topY={118} rec={PHYSICAL_PROPERTY_RECORDS[2]} highlighted compact />
          <text x={583} y={338} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            7.5 g (ether) vs 9 g (alcohol) per 100 mL
          </text>
        </g>
      )}
    </g>
  )
}

export function EtherSynthesisAndPropertiesLab(_props: SimulationProps) {
  const [mode, setMode] = useState<LabMode>('synthesis')
  const [route, setRoute] = useState<SynthesisRoute>('dehydration')
  const [alcohol, setAlcohol] = useState<DehydrationAlcohol>('ethanol')
  const [tempK, setTempK] = useState<DehydrationTempK>(413)
  const [nucleophile, setNucleophile] = useState<WilliamsonNucleophile>('tert-butoxide')
  const [halide, setHalide] = useState<WilliamsonHalide>('CH3-Br')
  const [compound, setCompound] = useState<CompoundSelection>('ethoxyethane')
  const [phaseView, setPhaseView] = useState<PhaseView>('boiling')

  const synthesisOutcome = useMemo(
    () =>
      route === 'dehydration'
        ? evaluateDehydration(alcohol, tempK)
        : evaluateWilliamson(nucleophile, halide),
    [route, alcohol, tempK, nucleophile, halide]
  )

  const selectedProp = compound === 'all' ? null : getPhysicalPropertyRecord(compound)

  const liveSummary = useMemo(() => {
    if (mode === 'synthesis') {
      return `${synthesisOutcome.pathway}. Major product: ${synthesisOutcome.majorProductName} (${synthesisOutcome.majorProductFormula}). By-products: ${synthesisOutcome.byProducts}. ${synthesisOutcome.yieldBadge}.`
    }
    if (selectedProp) {
      return `${selectedProp.name}: boiling point ${selectedProp.printedBp} K, water miscibility ${selectedProp.printedMiscibility}, H-bond donor ${selectedProp.hBondDonorLabel}, H-bond acceptor ${selectedProp.hBondAcceptorLabel}.`
    }
    return `Comparing n-pentane (309.1 K, essentially immiscible), ethoxyethane (307.6 K, 7.5 g per 100 mL water), and butan-1-ol (390 K, 9 g per 100 mL water).`
  }, [mode, synthesisOutcome, selectedProp])

  return (
    <div className={styles.sim} data-testid="ether-synthesis-and-properties-lab">
      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={
            mode === 'synthesis'
              ? `Ether synthesis mechanism and products: ${synthesisOutcome.equation}`
              : `Ether physical properties comparison in ${phaseView === 'boiling' ? 'pure liquid' : 'water'}`
          }
        >
          {mode === 'synthesis' ? (
            <g>
              {/* Equation banner */}
              <SvgCard
                x={16}
                y={12}
                width={728}
                height={48}
                tone={synthesisOutcome.isEtherSuccess ? 'success' : 'caution'}
              />
              <text
                x={380}
                y={36}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={16}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                {synthesisOutcome.equation}
              </text>

              {/* Left mechanism card */}
              <SvgCard x={16} y={72} width={356} height={328} />
              <SynthesisMechanismSvg
                route={route}
                alcohol={alcohol}
                tempK={tempK}
                nucleophile={nucleophile}
                halide={halide}
                outcome={synthesisOutcome}
              />

              {/* Middle reaction arrow */}
              <ChemArrow
                x1={380}
                x2={446}
                y={224}
                topLabel={route === 'dehydration' ? 'H₂SO₄' : halide === '(CH3)3C-Br' ? 'Elim.' : 'SN2'}
                bottomLabel={route === 'dehydration' ? `${tempK} K` : 'NaBr'}
                tone={synthesisOutcome.isEtherSuccess ? 'var(--success)' : 'var(--caution)'}
              />

              {/* Right product card */}
              <SvgCard
                x={454}
                y={72}
                width={290}
                height={328}
                tone={synthesisOutcome.isEtherSuccess ? 'success' : 'caution'}
              />
              <SynthesisProductsSvg outcome={synthesisOutcome} />
            </g>
          ) : phaseView === 'boiling' ? (
            <PureLiquidSvg selection={compound} />
          ) : (
            <WaterMiscibilitySvg selection={compound} />
          )}
        </svg>
      </div>

      {/* Readout panel */}
      {mode === 'synthesis' ? (
        <div className={styles.readout}>
          <div className={`${styles.stat} ${synthesisOutcome.isEtherSuccess ? styles.statSuccess : styles.statCaution}`}>
            <span className={styles.statLabel}>Pathway verdict</span>
            <span className={styles.statValue} data-testid="ether-pathway-verdict">
              {synthesisOutcome.pathway}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Major product</span>
            <span className={styles.statValue} data-testid="ether-major-product">
              {`${synthesisOutcome.majorProductName}${synthesisOutcome.majorProductSubtitle ? ` (${synthesisOutcome.majorProductSubtitle})` : ''} (${synthesisOutcome.majorProductFormula})`}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>By-products</span>
            <span className={styles.statValue}>{synthesisOutcome.byProducts}</span>
          </div>
          <div className={`${styles.stat} ${synthesisOutcome.isEtherSuccess ? styles.statSuccess : styles.statCaution}`}>
            <span className={styles.statLabel}>Ether yield</span>
            <span className={styles.statValue}>{synthesisOutcome.yieldBadge}</span>
          </div>
        </div>
      ) : (
        <div className={styles.readout}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Boiling point</span>
            <span className={styles.statValue} data-testid="ether-bp-readout">
              {selectedProp ? `${selectedProp.printedBp} K` : '309.1 K / 307.6 K / 390 K'}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Water miscibility</span>
            <span className={styles.statValue} data-testid="ether-misc-readout">
              {selectedProp ? selectedProp.printedMiscibility : 'Immiscible / 7.5 g / 9 g per 100 mL'}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>H-bond donor</span>
            <span className={styles.statValue}>
              {selectedProp ? selectedProp.hBondDonorLabel : 'Only Butan-1-ol (O–H)'}
            </span>
          </div>
          <div className={`${styles.stat} ${selectedProp?.hBondAcceptor !== false ? styles.statAccent : ''}`}>
            <span className={styles.statLabel}>H-bond acceptor</span>
            <span className={styles.statValue}>
              {selectedProp ? selectedProp.hBondAcceptorLabel : 'Ethoxyethane & Butan-1-ol'}
            </span>
          </div>
        </div>
      )}

      <p className={styles.explanation}>
        {mode === 'synthesis'
          ? synthesisOutcome.explanation
          : selectedProp
            ? phaseView === 'boiling'
              ? `${selectedProp.name} boils at ${selectedProp.printedBp} K: ${selectedProp.pureLiquidInteraction}.`
              : `${selectedProp.name} (${selectedProp.printedMiscibility}): ${selectedProp.aqueousInteraction}.`
            : `Ethoxyethane (307.6 K) boils close to n-pentane (309.1 K) because it cannot self hydrogen-bond, whereas butan-1-ol (390 K) is +${BOILING_GAP_ALCOHOL_VS_ETHER_K} K higher. In water, ethoxyethane accepts H-bonds from H₂O (7.5 g / 100 mL vs 9 g / 100 mL for butan-1-ol).`}
      </p>

      <SimulationControls>
        <div className={styles.controlsWrap}>
          <div className={styles.controlRow}>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Lab mode</span>
              <Segmented label="Lab mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
            </div>
            {mode === 'synthesis' ? (
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Synthesis route</span>
                <Segmented label="Synthesis route" options={ROUTE_OPTIONS} value={route} onChange={setRoute} />
              </div>
            ) : (
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Phase view</span>
                <Segmented label="Phase view" options={PHASE_OPTIONS} value={phaseView} onChange={setPhaseView} />
              </div>
            )}
          </div>

          {mode === 'synthesis' ? (
            route === 'dehydration' ? (
              <div className={styles.controlRow}>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Alcohol class</span>
                  <Segmented label="Alcohol class" options={ALCOHOL_OPTIONS} value={alcohol} onChange={setAlcohol} />
                </div>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Temperature</span>
                  <Segmented
                    label="Temperature"
                    options={TEMP_OPTIONS}
                    value={String(tempK) as `${DehydrationTempK}`}
                    onChange={(v) => setTempK(Number(v) as DehydrationTempK)}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.controlRow}>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Nucleophile (alkoxide / phenoxide)</span>
                  <Segmented
                    label="Nucleophile"
                    options={NUCLEOPHILE_OPTIONS}
                    value={nucleophile}
                    onChange={setNucleophile}
                  />
                </div>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Alkyl halide</span>
                  <Segmented label="Alkyl halide" options={HALIDE_OPTIONS} value={halide} onChange={setHalide} />
                </div>
              </div>
            )
          ) : (
            <div className={styles.controlRow}>
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Compound</span>
                <Segmented label="Compound" options={COMPOUND_OPTIONS} value={compound} onChange={setCompound} />
              </div>
            </div>
          )}
        </div>
      </SimulationControls>

      <p className={styles.srOnly} aria-live="polite" data-testid="ether-lab-live">
        {liveSummary}
      </p>
    </div>
  )
}
