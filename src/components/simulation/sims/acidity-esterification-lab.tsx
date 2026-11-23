'use client'

import { useId, useState } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import {
  ChargeBadge,
  LonePairDots,
  SubstitutedPhenoxideHybrid,
  ringVertex,
} from '@/components/animations/c12-unit7/acidity/PhenolicRingSvg'
import { CleanReactionFlask } from '@/components/animations/c12-unit7/esterification/EsterificationAcetylation'
import type { SimulationProps } from '@/components/simulation/registry'
import { Vessel } from '@/components/vocab/Vessel'
import {
  ACIDITY_COMPOUNDS,
  ACYL_REAGENTS,
  ESTER_SUBSTRATES,
  compareAcidity,
  esterificationOutcome,
  reagentTestOutcome,
  type AcidityCompound,
  type AcidityCompoundId,
  type AcylReagentId,
  type EsterSubstrateId,
  type ReagentTestId,
} from '@/lib/chem/c12-u7-s7-acidity-esterification'
import { NCERT_TABLE_7_3 } from '@/lib/chem/ncert-c12-unit7-data'
import styles from './acidity-esterification-lab.module.css'

type LabMode = 'acidity' | 'esterification'

const MODE_OPTIONS = [
  { value: 'acidity', label: 'Acidity & pKₐ' },
  { value: 'esterification', label: 'Esterification Bench' },
] as const satisfies readonly { value: LabMode; label: string }[]

const REAGENT_OPTIONS = [
  { value: 'Na', label: 'Na metal' },
  { value: 'Al', label: 'Al metal' },
  { value: 'NaOH', label: 'Aqueous NaOH' },
] as const satisfies readonly { value: ReagentTestId; label: string }[]

const SUBSTRATE_OPTIONS = ESTER_SUBSTRATES.map((s) => ({
  value: s.id,
  label: s.name,
})) as readonly { value: EsterSubstrateId; label: string }[]

const ACYL_OPTIONS = ACYL_REAGENTS.map((r) => ({
  value: r.id,
  label: r.label,
})) as readonly { value: AcylReagentId; label: string }[]

const FONT = 'var(--font-sans)'
const VB_W = 460
const VB_H = 390

function ConjugateBaseGlyph({
  compound,
  cx,
  cy,
}: {
  compound: AcidityCompound
  cx: number
  cy: number
}) {
  if (compound.isAromatic) {
    const sub = compound.substituent
    const shiftedCx = sub && (sub.position === 2 || sub.position === 3) ? cx - 8 : cx
    const displaySub = sub
      ? {
          position: sub.position,
          label: sub.group,
          tone: sub.group === 'NO₂' ? 'var(--atom-n)' : 'var(--rev)',
          flow: (sub.group === 'NO₂' ? 'out-of-ring' : 'into-ring') as 'out-of-ring' | 'into-ring',
        }
      : null
    return (
      <g>
        <SubstitutedPhenoxideHybrid
          cx={shiftedCx}
          cy={cy}
          r={38}
          topGroup="O⁻"
          highlightTop
          delocalisedSites={[1, 3, 5]}
          substituent={displaySub}
        />
      </g>
    )
  }

  if (compound.category === 'water') {
    return (
      <g>
        <circle cx={cx + 10} cy={cy} r={20} fill="var(--highlight)" />
        <text x={cx - 24} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
          H–
        </text>
        <text x={cx + 8} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
          O
        </text>
        <LonePairDots px={cx + 8} py={cy - 17} angleRad={0} />
        <LonePairDots px={cx + 8} py={cy + 17} angleRad={0} />
        <LonePairDots px={cx + 22} py={cy} angleRad={Math.PI / 2} />
        <ChargeBadge x={cx + 38} y={cy - 16} sign="−" tone="var(--delta-minus)" />
      </g>
    )
  }

  // Alcohol conjugate base (1°, 2°, 3°): negative charge localised on oxygen + inductive arrows
  const degree = compound.alcoholDegree ?? '1°'
  const stem = degree === '1°' ? 'C₂H₅–' : degree === '2°' ? '(CH₃)₂CH–' : '(CH₃)₃C–'
  return (
    <g>
      <circle cx={cx + 38} cy={cy} r={19} fill="var(--highlight)" />
      <text x={cx + 24} y={cy} textAnchor="end" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {stem}
      </text>
      <text x={cx + 36} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <LonePairDots px={cx + 36} py={cy - 17} angleRad={0} />
      <LonePairDots px={cx + 36} py={cy + 17} angleRad={0} />
      <LonePairDots px={cx + 50} py={cy} angleRad={Math.PI / 2} />
      <ChargeBadge x={cx + 66} y={cy - 16} sign="−" tone="var(--delta-minus)" />
      {/* +I inductive push indicator */}
      <line x1={cx - 32} y1={cy + 26} x2={cx + 18} y2={cy + 26} stroke="var(--rev)" strokeWidth={2.2} strokeLinecap="round" />
      <polygon points={`${cx + 24},${cy + 26} ${cx + 15},${cy + 21} ${cx + 15},${cy + 31}`} fill="var(--rev)" />
      <text x={cx - 4} y={cy + 44} textAnchor="middle" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--rev)">
        {degree === '1°' ? '+I (1 alkyl)' : degree === '2°' ? '+I (2 alkyl)' : '+I (3 alkyl)'}
      </text>
    </g>
  )
}

function AcidityResonanceSvg({
  compoundA,
  compoundB,
  stronger,
}: {
  compoundA: AcidityCompound
  compoundB: AcidityCompound
  stronger: 'A' | 'B' | 'equal'
}) {
  const cols = [
    { label: 'Compound A', compound: compoundA, cx: 118, active: stronger === 'A' },
    { label: 'Compound B', compound: compoundB, cx: 342, active: stronger === 'B' },
  ]

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Conjugate bases of ${compoundA.name} and ${compoundB.name}`}
      className={styles.canvasSvg}
    >
      {cols.map((col, idx) => {
        const x0 = idx === 0 ? 10 : 238
        const c = col.compound
        const stroke = col.active ? 'var(--fwd)' : 'var(--border)'
        return (
          <g key={col.label}>
            <rect
              x={x0}
              y={10}
              width={212}
              height={370}
              rx={12}
              fill="var(--surface-raised)"
              stroke={stroke}
              strokeWidth={col.active ? 2 : 1.2}
            />
            <text x={col.cx} y={36} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={col.active ? 'var(--fwd)' : 'var(--fg-muted)'}>
              {col.label}{col.active ? ' (Stronger)' : ''}
            </text>
            <text x={col.cx} y={60} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
              {c.shortName}
            </text>

            <ConjugateBaseGlyph compound={c} cx={col.cx} cy={176} />

            <text x={col.cx} y={292} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
              {c.pKa !== null ? `pKₐ = ${c.printedPka}` : 'Qualitative (no pKₐ)'}
            </text>
            <text x={col.cx} y={318} textAnchor="middle" fontSize={14} fontWeight={600} fontFamily={FONT} fill={c.resonanceDelocalised ? 'var(--fwd)' : 'var(--rev)'}>
              {c.resonanceDelocalised ? 'Charge delocalised (o, p)' : 'Charge localised on O'}
            </text>
            <text x={col.cx} y={342} textAnchor="middle" fontSize={14.5} fontFamily={FONT} fill="var(--fg-muted)">
              {c.carbonHybridisation ? `O–H on ${c.carbonHybridisation} carbon` : 'Reference Brønsted acid'}
            </text>
            <text x={col.cx} y={364} textAnchor="middle" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
              {c.substituent ? c.substituent.effectBadge.split(' (')[0] : c.isAromatic ? '5 resonance forms' : c.alcoholDegree ?? 'H–O–H'}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function AcidityFlaskAndScaleSvg({
  compoundA,
  compoundB,
  reagent,
  time,
}: {
  compoundA: AcidityCompound
  compoundB: AcidityCompound
  reagent: ReagentTestId
  time: number
}) {
  const outA = reagentTestOutcome(compoundA.id, reagent)
  const outB = reagentTestOutcome(compoundB.id, reagent)

  const scaleTop = 52
  const scaleBottom = 288
  const minPka = 6.5
  const maxPka = 16.5
  const yFromPka = (pka: number) => scaleTop + ((pka - minPka) / (maxPka - minPka)) * (scaleBottom - scaleTop)
  const qualY = (rank: number) => {
    // Water sits between cresols (10.2) and ethanol (15.9); 2° and 3° sit below ethanol
    if (rank === 7) return yFromPka(13.8)
    if (rank === 9) return scaleBottom + 34
    return scaleBottom + 56
  }
  const pinY = (c: AcidityCompound) => (c.pKa !== null ? yFromPka(c.pKa) : qualY(c.acidityRank))
  const pinAY = pinY(compoundA)
  const pinBY = pinY(compoundB)

  // Keep both circles at their true pKa / qualitative coordinates on the scale axis;
  // stagger only the text labels (with leader ticks) when markers sit close together.
  const minLabelGap = 22
  let labelAY = pinAY
  let labelBY = pinBY
  if (Math.abs(pinBY - pinAY) < minLabelGap) {
    const midY = (pinAY + pinBY) / 2
    const aIsUpper = pinAY <= pinBY
    let upperY = midY - minLabelGap / 2
    let lowerY = midY + minLabelGap / 2
    const maxLowerY = 344
    const minUpperY = 52
    if (lowerY > maxLowerY) {
      lowerY = maxLowerY
      upperY = lowerY - minLabelGap
    } else if (upperY < minUpperY) {
      upperY = minUpperY
      lowerY = upperY + minLabelGap
    }
    labelAY = aIsUpper ? upperY : lowerY
    labelBY = aIsUpper ? lowerY : upperY
  }
  const circlesOverlap = Math.abs(pinBY - pinAY) < 5

  const bubbleLift = (phase: number) => (time > 0 ? ((time * 24 + phase) % 34) : phase % 22)

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Reagent test (${reagent}) and NCERT Table 7.3 pKa scale for ${compoundA.name} and ${compoundB.name}`}
      className={styles.canvasSvg}
    >
      {/* Left half: Reagent beakers for A and B */}
      <rect x={10} y={10} width={232} height={370} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={126} y={34} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Test with {reagent === 'NaOH' ? 'aq. NaOH' : `${reagent} metal`}
      </text>

      {[
        { label: `A: ${compoundA.shortName}`, out: outA, cy: 128, badgeY: 194 },
        { label: `B: ${compoundB.shortName}`, out: outB, cy: 292, badgeY: 358 },
      ].map((beaker, idx) => (
        <g key={beaker.label}>
          <text x={126} y={beaker.cy - 66} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
            {beaker.label}
          </text>
          <Vessel variant="beaker" level={0.58} width={82} height={88} x={126} y={beaker.cy} />
          {beaker.out.gasEvolved && (
            <g>
              <circle cx={116} cy={beaker.cy + 8 - bubbleLift(idx * 11)} r={3.5} fill="var(--bubble-fill)" stroke="var(--accent)" strokeWidth={1.2} />
              <circle cx={134} cy={beaker.cy + 14 - bubbleLift(idx * 11 + 17)} r={4} fill="var(--bubble-fill)" stroke="var(--accent)" strokeWidth={1.2} />
              <text x={178} y={beaker.cy - 14} textAnchor="start" fontSize={14} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
                H₂ ↑
              </text>
            </g>
          )}
          <text
            x={126}
            y={beaker.badgeY}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fontFamily={FONT}
            fill={beaker.out.reacts ? 'var(--fwd)' : 'var(--rev)'}
          >
            {beaker.out.badge}
          </text>
        </g>
      ))}

      {/* Right half: pKa thermometer / ladder */}
      <rect x={250} y={10} width={200} height={370} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={350} y={34} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Table 7.3 pKₐ Scale
      </text>
      <text x={350} y={370} textAnchor="middle" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
        Smaller pKₐ = stronger acid
      </text>

      {/* Axis bar + qualitative dashed extension */}
      <line x1={326} y1={scaleTop} x2={326} y2={scaleBottom} stroke="var(--border)" strokeWidth={6} strokeLinecap="round" />
      <line x1={326} y1={scaleBottom} x2={326} y2={scaleBottom + 58} stroke="var(--border)" strokeWidth={4} strokeDasharray="4 4" />
      <line x1={326} y1={scaleTop} x2={326} y2={yFromPka(10.5)} stroke="var(--fwd)" strokeWidth={4} strokeLinecap="round" opacity={0.5} />

      {/* Subtle reference ticks for Table 7.3 */}
      {NCERT_TABLE_7_3.filter((r) => ['p-Nitrophenol', 'm-Nitrophenol', 'Phenol', 'Ethanol'].includes(r.name)).map((r) => {
        const y = yFromPka(r.pKa)
        return (
          <g key={r.name}>
            <line x1={318} y1={y} x2={334} y2={y} stroke="var(--fg-subtle)" strokeWidth={1.4} />
            <text x={312} y={y} textAnchor="end" dominantBaseline="central" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
              {r.printed}
            </text>
          </g>
        )
      })}

      {/* Qualitative dashed zone below 15.9 */}
      <line x1={266} y1={scaleBottom + 14} x2={434} y2={scaleBottom + 14} stroke="var(--border)" strokeDasharray="4 3" />

      {/* Marker A */}
      <circle cx={326} cy={pinAY} r={circlesOverlap ? 7.5 : 6.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      {Math.abs(labelAY - pinAY) > 2 && (
        <line x1={332} y1={pinAY} x2={342} y2={labelAY} stroke="var(--accent)" strokeWidth={1.3} />
      )}
      <text x={344} y={labelAY} textAnchor="start" dominantBaseline="central" fontSize={14} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        A: {compoundA.printedPka ?? 'qual.'}
      </text>

      {/* Marker B */}
      <circle cx={326} cy={pinBY} r={circlesOverlap ? 4.5 : 6.5} fill="var(--ox)" stroke="var(--surface)" strokeWidth={1.6} />
      {Math.abs(labelBY - pinBY) > 2 && (
        <line x1={332} y1={pinBY} x2={342} y2={labelBY} stroke="var(--ox)" strokeWidth={1.3} />
      )}
      <text x={344} y={labelBY} textAnchor="start" dominantBaseline="central" fontSize={14} fontWeight={700} fontFamily={FONT} fill="var(--ox)">
        B: {compoundB.printedPka ?? 'qual.'}
      </text>
    </svg>
  )
}

function EsterSubstrateGlyph({ substrate, cx, cy }: { substrate: EsterSubstrateId; cx: number; cy: number }) {
  if (substrate === 'ethanol') {
    return (
      <g>
        <text x={cx - 10} y={cy} textAnchor="end" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
          C₂H₅–
        </text>
        <text x={cx - 1} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
          O
        </text>
        <line x1={cx + 10} y1={cy} x2={cx + 34} y2={cy} stroke="var(--fg)" strokeWidth={2.2} />
        <line x1={cx + 18} y1={cy + 12} x2={cx + 26} y2={cy - 12} stroke="var(--rev)" strokeWidth={2.4} strokeDasharray="3 2" />
        <text x={cx + 44} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
          H
        </text>
      </g>
    )
  }

  const r = 32
  const verts = Array.from({ length: 6 }, (_, k) => ringVertex(cx, cy, r, k))
  const c1 = verts[0]
  const c2 = verts[1]
  const innerR = r * (Math.sqrt(3) / 2) * 0.68

  if (substrate === 'phenol') {
    return (
      <g>
        <polygon points={verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')} fill="none" stroke="var(--fg)" strokeWidth={2.1} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--fg)" strokeWidth={1.6} />
        <line x1={c1.x} y1={c1.y} x2={c1.x} y2={c1.y - 18} stroke="var(--fg)" strokeWidth={2.1} />
        <text x={c1.x} y={c1.y - 28} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
          O
        </text>
        <line x1={c1.x + 8} y1={c1.y - 28} x2={c1.x + 28} y2={c1.y - 28} stroke="var(--fg)" strokeWidth={2} />
        <line x1={c1.x + 15} y1={c1.y - 18} x2={c1.x + 21} y2={c1.y - 38} stroke="var(--rev)" strokeWidth={2.4} strokeDasharray="3 2" />
        <text x={c1.x + 36} y={c1.y - 28} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
          H
        </text>
      </g>
    )
  }

  // Salicylic acid
  return (
    <g>
      <polygon points={verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')} fill="none" stroke="var(--fg)" strokeWidth={2.1} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--fg)" strokeWidth={1.6} />
      <line x1={c1.x} y1={c1.y} x2={c1.x} y2={c1.y - 18} stroke="var(--fg)" strokeWidth={2.1} />
      <text x={c1.x} y={c1.y - 28} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        COOH
      </text>
      <line x1={c2.x} y1={c2.y} x2={c2.x + 18} y2={c2.y - 10} stroke="var(--fg)" strokeWidth={2.1} />
      <text x={c2.x + 28} y={c2.y - 12} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <line x1={c2.x + 36} y1={c2.y - 12} x2={c2.x + 54} y2={c2.y - 12} stroke="var(--fg)" strokeWidth={2} />
      <line x1={c2.x + 42} y1={c2.y - 3} x2={c2.x + 48} y2={c2.y - 21} stroke="var(--rev)" strokeWidth={2.4} strokeDasharray="3 2" />
      <text x={c2.x + 62} y={c2.y - 12} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        H
      </text>
    </g>
  )
}

function EsterProductGlyph({
  substrate,
  isAspirin,
  cx,
  cy,
}: {
  substrate: EsterSubstrateId
  isAspirin: boolean
  cx: number
  cy: number
}) {
  const acylTag = isAspirin ? 'COCH₃' : "COR'"
  if (substrate === 'ethanol') {
    return (
      <g>
        <text x={cx - 4} y={cy} textAnchor="end" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
          C₂H₅–
        </text>
        <text x={cx + 5} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
          O
        </text>
        <text x={cx + 14} y={cy} textAnchor="start" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
          –{acylTag}
        </text>
      </g>
    )
  }

  const r = 32
  const verts = Array.from({ length: 6 }, (_, k) => ringVertex(cx, cy, r, k))
  const c1 = verts[0]
  const c2 = verts[1]
  const innerR = r * (Math.sqrt(3) / 2) * 0.68

  if (substrate === 'phenol') {
    return (
      <g>
        <polygon points={verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')} fill="none" stroke="var(--fg)" strokeWidth={2.1} />
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--fg)" strokeWidth={1.6} />
        <line x1={c1.x} y1={c1.y} x2={c1.x} y2={c1.y - 18} stroke="var(--fg)" strokeWidth={2.1} />
        <text x={c1.x - 6} y={c1.y - 28} textAnchor="start" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
          O–{acylTag}
        </text>
      </g>
    )
  }

  return (
    <g>
      <polygon points={verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')} fill="none" stroke="var(--fg)" strokeWidth={2.1} />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--fg)" strokeWidth={1.6} />
      <line x1={c1.x} y1={c1.y} x2={c1.x} y2={c1.y - 18} stroke="var(--fg)" strokeWidth={2.1} />
      <text x={c1.x} y={c1.y - 28} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        COOH
      </text>
      <line x1={c2.x} y1={c2.y} x2={c2.x + 18} y2={c2.y - 10} stroke="var(--fg)" strokeWidth={2.1} />
      <text x={c2.x + 22} y={c2.y - 12} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        O{acylTag}
      </text>
    </g>
  )
}

function EsterCleavageAndProductSvg({
  substrate,
  acylReagent,
  trapActive,
}: {
  substrate: EsterSubstrateId
  acylReagent: AcylReagentId
  trapActive: boolean
}) {
  const out = esterificationOutcome(substrate, acylReagent, trapActive)
  const reagentDisplay = out.isAspirinSynthesis ? '(CH₃CO)₂O' : out.reagent.formula

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`O-H cleavage and esterification product for ${out.substrate.name} with ${out.reagent.classLabel}`}
      className={styles.canvasSvg}
    >
      {/* Top reactants card */}
      <rect x={10} y={10} width={440} height={156} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={230} y={30} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        O–H bond cleavage in {out.substrate.name}
      </text>

      <EsterSubstrateGlyph substrate={substrate} cx={110} cy={116} />

      <text x={242} y={116} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <rect x={268} y={96} width={156} height={40} rx={8} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.4} />
      <text x={346} y={116} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        {reagentDisplay}
      </text>
      <text x={346} y={154} textAnchor="middle" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
        {out.reagent.classLabel}
      </text>

      {/* Reaction arrow */}
      <line x1={230} y1={174} x2={230} y2={208} stroke={out.trapActive ? 'var(--fwd)' : 'var(--accent)'} strokeWidth={2.8} strokeLinecap="round" />
      <polygon points="230,214 224,204 236,204" fill={out.trapActive ? 'var(--fwd)' : 'var(--accent)'} />
      <text x={244} y={194} textAnchor="start" fontSize={14} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        {out.catalystOrBase}
      </text>

      {/* Bottom product card */}
      <rect x={10} y={222} width={440} height={158} rx={12} fill="var(--surface-raised)" stroke={out.isAspirinSynthesis ? 'var(--accent)' : 'var(--fwd)'} strokeWidth={1.6} />
      <text x={230} y={244} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={out.isAspirinSynthesis ? 'var(--accent)' : 'var(--fwd)'}>
        {out.productName}
      </text>

      <EsterProductGlyph substrate={substrate} isAspirin={out.isAspirinSynthesis} cx={130} cy={328} />

      <text x={286} y={328} textAnchor="middle" fontSize={17} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <text x={368} y={328} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        {out.byproduct.split(' ')[0]}
      </text>
      <text x={368} y={352} textAnchor="middle" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
        {out.isAspirinSynthesis ? 'Acetic acid' : 'Byproduct'}
      </text>
    </svg>
  )
}

function EsterEquilibriumGaugeSvg({
  substrate,
  acylReagent,
  trapActive,
  time,
}: {
  substrate: EsterSubstrateId
  acylReagent: AcylReagentId
  trapActive: boolean
  time: number
}) {
  const out = esterificationOutcome(substrate, acylReagent, trapActive)
  const gaugeLeft = 46
  const gaugeRight = 414
  const markerX = gaugeLeft + out.equilibriumPosition * (gaugeRight - gaugeLeft)
  const pulse = time > 0 ? Math.sin(time * 2.5) * 4 : 0

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label={`Reaction flask and Le Chatelier equilibrium shift for ${out.productName}`}
      className={styles.canvasSvg}
    >
      {/* Top flask card */}
      <rect x={10} y={10} width={440} height={224} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={230} y={34} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Reaction Vessel &amp; Trap Status
      </text>

      <CleanReactionFlask x={130} y={144} width={126} height={116} level={0.6} />
      <text x={130} y={176} textAnchor="middle" fontSize={14.5} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        {out.isAspirinSynthesis ? 'Aspirin' : 'Ester'}
      </text>

      {trapActive ? (
        acylReagent === 'carboxylic-acid' ? (
          <g>
            <line x1={130} y1={82} x2={130} y2={58 - pulse * 0.5} stroke="var(--fwd)" strokeWidth={2.6} strokeLinecap="round" />
            <polygon points={`130,${50 - pulse * 0.5} 124,${60 - pulse * 0.5} 136,${60 - pulse * 0.5}`} fill="var(--fwd)" />
            <text x={236} y={96} textAnchor="start" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
              H₂O removed ↑
            </text>
            <text x={236} y={124} textAnchor="start" fontSize={14} fontFamily={FONT} fill="var(--fg)">
              Blocks reverse hydrolysis
            </text>
            <text x={236} y={152} textAnchor="start" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--fwd)">
              {out.verdictBadge}
            </text>
          </g>
        ) : acylReagent === 'anhydride' ? (
          <g>
            <text x={236} y={96} textAnchor="start" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
              {out.isAspirinSynthesis ? 'Acetylates phenolic –OH' : 'Driven to ester'}
            </text>
            <text x={236} y={124} textAnchor="start" fontSize={14} fontFamily={FONT} fill="var(--fg)">
              {out.isAspirinSynthesis ? 'Yields Aspirin + CH₃COOH' : "Shifts R'COOH equilibrium"}
            </text>
            <text x={236} y={152} textAnchor="start" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--fwd)">
              {out.verdictBadge}
            </text>
          </g>
        ) : (
          <g>
            <text x={236} y={96} textAnchor="start" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
              Pyridine traps HCl
            </text>
            <text x={236} y={124} textAnchor="start" fontSize={14} fontFamily={FONT} fill="var(--fg)">
              Forms pyridinium chloride
            </text>
            <text x={236} y={152} textAnchor="start" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--fwd)">
              {out.verdictBadge}
            </text>
          </g>
        )
      ) : (
        <g>
          <text x={236} y={104} textAnchor="start" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--rev)">
            No trap active
          </text>
          <text x={236} y={132} textAnchor="start" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
            {out.byproduct} stays in flask
          </text>
          <text x={236} y={158} textAnchor="start" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--rev)">
            Reverse reaction competes
          </text>
        </g>
      )}

      {/* Bottom Le Chatelier gauge */}
      <rect x={10} y={248} width={440} height={132} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={230} y={274} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Le Chatelier Equilibrium Position
      </text>

      <rect x={gaugeLeft} y={298} width={gaugeRight - gaugeLeft} height={16} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <rect
        x={gaugeLeft}
        y={298}
        width={Math.max(18, markerX - gaugeLeft)}
        height={16}
        rx={8}
        fill={trapActive ? 'var(--fwd)' : 'var(--caution)'}
      />
      <circle cx={markerX} cy={306} r={10} fill="var(--fg)" stroke="var(--surface)" strokeWidth={2} />

      <text x={gaugeLeft} y={338} textAnchor="start" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        Reactants
      </text>
      <text x={230} y={338} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={FONT} fill={trapActive ? 'var(--fwd)' : 'var(--caution)'}>
        {Math.round(out.equilibriumPosition * 100)}% shift right
      </text>
      <text x={gaugeRight} y={338} textAnchor="end" fontSize={14} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        Ester
      </text>
      <text x={230} y={364} textAnchor="middle" fontSize={14} fontFamily={FONT} fill="var(--fg-muted)">
        {out.reversible ? 'Reversible equilibrium (⇌)' : 'Driven cleanly to completion (→)'}
      </text>
    </svg>
  )
}

export function AcidityEsterificationLab({ reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<LabMode>('acidity')
  const [compoundAId, setCompoundAId] = useState<AcidityCompoundId>('phenol')
  const [compoundBId, setCompoundBId] = useState<AcidityCompoundId>('ethanol')
  const [reagent, setReagent] = useState<ReagentTestId>('NaOH')

  const [substrate, setSubstrate] = useState<EsterSubstrateId>('salicylic-acid')
  const [acylReagent, setAcylReagent] = useState<AcylReagentId>('anhydride')
  const [trapActive, setTrapActive] = useState(true)

  const idA = useId()
  const idB = useId()
  const time = useAmbientTime(reducedMotion)

  const comparison = compareAcidity(compoundAId, compoundBId)
  const testA = reagentTestOutcome(compoundAId, reagent)
  const testB = reagentTestOutcome(compoundBId, reagent)

  const esterResult = esterificationOutcome(substrate, acylReagent, trapActive)

  const liveAnnouncement =
    mode === 'acidity'
      ? `${comparison.orderVerdict} ${comparison.deltaPka !== null ? `Delta pKa is ${comparison.deltaPka}, relative acidity ${comparison.factorDisplay}.` : ''} With ${reagent}: ${comparison.compoundA.shortName} ${testA.badge}; ${comparison.compoundB.shortName} ${testB.badge}.`
      : `${esterResult.substrate.name} with ${esterResult.reagent.classLabel}, ${esterResult.trapActive ? 'trap active' : 'no trap'}. Catalyst or base: ${esterResult.catalystOrBase}. Product: ${esterResult.productName}. Byproduct: ${esterResult.byproduct}. ${esterResult.trapEffectText}`

  return (
    <div className={styles.root} data-mode={mode}>
      <div className={styles.topBar}>
        <div className={styles.controlRow}>
          <Segmented label="Workbench mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        </div>

        {mode === 'acidity' ? (
          <div className={styles.controlRow}>
            <div className={styles.selectField}>
              <label htmlFor={idA} className={styles.fieldLabel}>
                Compound A
              </label>
              <select
                id={idA}
                className={styles.select}
                value={compoundAId}
                onChange={(e) => setCompoundAId(e.target.value as AcidityCompoundId)}
              >
                {ACIDITY_COMPOUNDS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.printedPka ? `(pKₐ ${c.printedPka})` : '(qualitative)'}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.selectField}>
              <label htmlFor={idB} className={styles.fieldLabel}>
                Compound B
              </label>
              <select
                id={idB}
                className={styles.select}
                value={compoundBId}
                onChange={(e) => setCompoundBId(e.target.value as AcidityCompoundId)}
              >
                {ACIDITY_COMPOUNDS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.printedPka ? `(pKₐ ${c.printedPka})` : '(qualitative)'}
                  </option>
                ))}
              </select>
            </div>

            <Segmented label="Reagent test" options={REAGENT_OPTIONS} value={reagent} onChange={setReagent} />
          </div>
        ) : (
          <div className={styles.controlRow}>
            <Segmented label="Substrate" options={SUBSTRATE_OPTIONS} value={substrate} onChange={setSubstrate} />
            <Segmented label="Acylating reagent" options={ACYL_OPTIONS} value={acylReagent} onChange={setAcylReagent} />
            <div className={styles.trapGroup}>
              <Toggle
                label="Remove H₂O / Add Pyridine"
                checked={trapActive}
                onChange={setTrapActive}
              />
              <span className={`${styles.trapBadge} ${trapActive ? styles.trapBadgeActive : ''}`}>
                {trapActive ? 'Trap ON' : 'No trap'}
              </span>
            </div>
          </div>
        )}
      </div>

      {mode === 'acidity' ? (
        <>
          <div className={styles.workbench}>
            <figure className={styles.panelCard}>
              <h4 className={styles.panelHeading}>Conjugate Base Charge Distribution</h4>
              <AcidityResonanceSvg
                compoundA={comparison.compoundA}
                compoundB={comparison.compoundB}
                stronger={comparison.stronger}
              />
            </figure>

            <figure className={styles.panelCard}>
              <h4 className={styles.panelHeading}>Reagent Reaction &amp; pKₐ Scale</h4>
              <AcidityFlaskAndScaleSvg
                compoundA={comparison.compoundA}
                compoundB={comparison.compoundB}
                reagent={reagent}
                time={time}
              />
            </figure>
          </div>

          <div className={styles.readoutGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Acidity Comparison</span>
              <span className={styles.statValue}>{comparison.orderVerdict}</span>
              <p className={styles.explanationText}>
                {comparison.compoundA.shortName}: {comparison.compoundA.chargeDistributionSummary}.
              </p>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>ΔpKₐ &amp; Relative Strength</span>
              <span className={styles.statValue}>
                {comparison.deltaPka !== null ? `ΔpKₐ = ${comparison.deltaPka.toFixed(1)}` : 'Qualitative comparison'}
              </span>
              <p className={styles.explanationText}>Relative factor: {comparison.factorDisplay}</p>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                {comparison.compoundA.shortName} + {reagent === 'NaOH' ? 'aq. NaOH' : reagent}
              </span>
              <span className={styles.statValue}>{testA.badge}</span>
              <p className={styles.equationText}>{testA.equation}</p>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>
                {comparison.compoundB.shortName} + {reagent === 'NaOH' ? 'aq. NaOH' : reagent}
              </span>
              <span className={styles.statValue}>{testB.badge}</span>
              <p className={styles.equationText}>{testB.equation}</p>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.workbench}>
            <figure className={styles.panelCard}>
              <h4 className={styles.panelHeading}>O–H Bond Cleavage &amp; Product</h4>
              <EsterCleavageAndProductSvg
                substrate={substrate}
                acylReagent={acylReagent}
                trapActive={trapActive}
              />
            </figure>

            <figure className={styles.panelCard}>
              <h4 className={styles.panelHeading}>Flask Reaction &amp; Le Chatelier Gauge</h4>
              <EsterEquilibriumGaugeSvg
                substrate={substrate}
                acylReagent={acylReagent}
                trapActive={trapActive}
                time={time}
              />
            </figure>
          </div>

          <div className={styles.readoutGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Product</span>
              <span className={styles.statValue}>{esterResult.productName}</span>
              <p className={styles.explanationText}>Formula: {esterResult.productFormula}</p>
            </div>

            <div className={styles.statCard}>
              <span className={styles.statLabel}>Catalyst / Base &amp; Byproduct</span>
              <span className={styles.statValue}>{esterResult.catalystOrBase}</span>
              <p className={styles.explanationText}>Byproduct: {esterResult.byproduct}</p>
            </div>

            <div className={`${styles.statCard} ${styles.statCardWide}`}>
              <span className={styles.statLabel}>Balanced Reaction &amp; Equilibrium Verdict</span>
              <p className={styles.equationText}>{esterResult.equation}</p>
              <p className={styles.explanationText}>
                {esterResult.trapEffectText} {esterResult.explanation}
              </p>
            </div>
          </div>
        </>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {liveAnnouncement}
      </p>
    </div>
  )
}
