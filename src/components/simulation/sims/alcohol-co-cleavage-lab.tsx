'use client'

import React, { useState } from 'react'
import { Segmented } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  DEHYDRATION_CONDITIONS,
  REAGENTS,
  SUBSTRATES,
  evaluateCleavageReaction,
  type CleavageOutcome,
  type DehydrationConditionId,
  type HighlightMode,
  type ReagentId,
  type SubstrateId,
} from '@/lib/chem/c12-u7-s8-cleavage'
import styles from './alcohol-co-cleavage-lab.module.css'

const SUBSTRATE_OPTIONS = SUBSTRATES.map((s) => ({
  value: s.id,
  label: s.shortLabel,
}))

const REAGENT_OPTIONS = REAGENTS.map((r) => ({
  value: r.id,
  label: r.shortLabel,
}))

const CONDITION_OPTIONS = DEHYDRATION_CONDITIONS.map((c) => ({
  value: c.id,
  label: c.label,
}))

const FONT = 'var(--font-sans)'
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const BOND = 'var(--bond)'
const OXYGEN = 'var(--atom-o)'
const ACCENT = 'var(--accent)'
const SUCCESS = 'var(--success)'
const OX = 'var(--ox)'
const PROTON = 'var(--proton)'

function Bond({
  x1,
  y1,
  x2,
  y2,
  cleaving = false,
  intact = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  cleaving?: boolean
  intact?: boolean
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1)
  return (
    <g>
      {cleaving && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={OX} strokeWidth={12} strokeLinecap="round" opacity={0.3} />
      )}
      {intact && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={SUCCESS} strokeWidth={12} strokeLinecap="round" opacity={0.28} />
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={cleaving ? OX : intact ? SUCCESS : BOND}
        strokeWidth={cleaving || intact ? 3.2 : 2.6}
        strokeDasharray={cleaving ? '5 4' : undefined}
        strokeLinecap="round"
      />
      {cleaving &&
        (horizontal ? (
          <line x1={mx - 4} y1={my - 9} x2={mx + 4} y2={my + 9} stroke={PROTON} strokeWidth={2.4} strokeLinecap="round" />
        ) : (
          <line x1={mx - 9} y1={my - 4} x2={mx + 9} y2={my + 4} stroke={PROTON} strokeWidth={2.4} strokeLinecap="round" />
        ))}
    </g>
  )
}

function Atom({
  x,
  y,
  label,
  fill = INK,
  size = 17,
}: {
  x: number
  y: number
  label: string
  fill?: string
  size?: number
}) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={700} fontFamily={FONT} fill={fill}>
      {label}
    </text>
  )
}

function SubstrateStructure({
  substrateId,
  highlightMode,
  preserveDoubleBond,
}: {
  substrateId: SubstrateId
  highlightMode: HighlightMode
  preserveDoubleBond: boolean
}) {
  const cleaveCO = highlightMode === 'co' || highlightMode === 'co-beta-ch'
  const cleaveOH =
    highlightMode === 'oh-alpha-ch' || highlightMode === 'oh-alpha-ch-and-cc-double'
  const cleaveAlphaCH =
    highlightMode === 'oh-alpha-ch' || highlightMode === 'oh-alpha-ch-and-cc-double'
  const cleaveBetaCH = highlightMode === 'co-beta-ch'
  const cleaveCC = highlightMode === 'cc-cleave'
  const cleaveCCDouble = highlightMode === 'oh-alpha-ch-and-cc-double'

  if (substrateId === 'ethanol') {
    return (
      <g>
        {cleaveBetaCH ? (
          <>
            <Atom x={80} y={146} label="CH₂" size={17} />
            <Bond x1={80} y1={110} x2={80} y2={132} cleaving />
            <Atom x={80} y={96} label="H" size={17} fill={OX} />
            <text x={48} y={96} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={OX}>
              β-H
            </text>
          </>
        ) : (
          <Atom x={74} y={146} label="CH₃" size={17} />
        )}
        <Bond x1={98} y1={146} x2={126} y2={146} />
        <Atom x={138} y={146} label="C" size={18} />
        <Bond x1={138} y1={108} x2={138} y2={132} cleaving={cleaveAlphaCH} />
        <Atom x={138} y={94} label="H" size={17} fill={cleaveAlphaCH ? OX : MUTED} />
        <Bond x1={138} y1={160} x2={138} y2={184} />
        <Atom x={138} y={198} label="H" size={17} fill={MUTED} />
        <Bond x1={150} y1={146} x2={182} y2={146} cleaving={cleaveCO} />
        <Atom x={192} y={146} label="O" size={18} fill={OXYGEN} />
        <Bond x1={204} y1={146} x2={228} y2={146} cleaving={cleaveOH} />
        <Atom x={238} y={146} label="H" size={17} fill={cleaveOH ? OX : INK} />
      </g>
    )
  }

  if (substrateId === 'propan-2-ol') {
    return (
      <g>
        {cleaveBetaCH ? (
          <>
            <Atom x={78} y={146} label="CH₂" size={17} />
            <Bond x1={78} y1={110} x2={78} y2={132} cleaving />
            <Atom x={78} y={96} label="H" size={17} fill={OX} />
            <text x={46} y={96} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={OX}>
              β-H
            </text>
          </>
        ) : (
          <Atom x={72} y={146} label="CH₃" size={17} />
        )}
        <Bond x1={96} y1={146} x2={126} y2={146} />
        <Atom x={138} y={146} label="C" size={18} />
        <Bond x1={138} y1={108} x2={138} y2={132} />
        <Atom x={138} y={94} label="CH₃" size={17} />
        <Bond x1={138} y1={160} x2={138} y2={184} cleaving={cleaveAlphaCH} />
        <Atom x={138} y={198} label="H" size={17} fill={cleaveAlphaCH ? OX : MUTED} />
        <Bond x1={150} y1={146} x2={182} y2={146} cleaving={cleaveCO} />
        <Atom x={192} y={146} label="O" size={18} fill={OXYGEN} />
        <Bond x1={204} y1={146} x2={228} y2={146} cleaving={cleaveOH} />
        <Atom x={238} y={146} label="H" size={17} fill={cleaveOH ? OX : INK} />
      </g>
    )
  }

  if (substrateId === '2-methylpropan-2-ol') {
    return (
      <g>
        <Atom x={68} y={146} label="CH₃" size={17} />
        <Bond x1={90} y1={146} x2={126} y2={146} cleaving={cleaveCC} />
        <Atom x={138} y={146} label="C" size={18} />
        <Bond x1={138} y1={108} x2={138} y2={132} />
        {cleaveBetaCH ? (
          <>
            <Atom x={138} y={94} label="CH₂" size={17} />
            <Bond x1={158} y1={94} x2={184} y2={94} cleaving />
            <Atom x={194} y={94} label="H" size={17} fill={OX} />
          </>
        ) : (
          <Atom x={138} y={94} label="CH₃" size={17} />
        )}
        <Bond x1={138} y1={160} x2={138} y2={184} />
        <Atom x={138} y={198} label="CH₃" size={17} />
        <Bond x1={150} y1={146} x2={182} y2={146} cleaving={cleaveCO} />
        <Atom x={192} y={146} label="O" size={18} fill={OXYGEN} />
        <Bond x1={204} y1={146} x2={228} y2={146} cleaving={cleaveOH} />
        <Atom x={238} y={146} label="H" size={17} fill={cleaveOH ? OX : INK} />
      </g>
    )
  }

  // But-2-en-1-ol: CH3-CH=CH-CH2-OH
  return (
    <g>
      {cleaveBetaCH ? (
        <>
          <Atom x={28} y={146} label="CH₂" size={16} />
          <Bond x1={28} y1={110} x2={28} y2={132} cleaving />
          <Atom x={28} y={96} label="H" size={16} fill={OX} />
        </>
      ) : (
        <Atom x={28} y={146} label="CH₃" size={16} />
      )}
      <Bond x1={49} y1={146} x2={62} y2={146} />
      <Atom x={77} y={146} label="CH" size={16} />

      {/* C=C double bond */}
      {preserveDoubleBond && (
        <rect x={91} y={134} width={26} height={24} rx={6} fill={SUCCESS} fillOpacity={0.2} stroke={SUCCESS} strokeWidth={1.4} />
      )}
      {cleaveCCDouble && (
        <rect x={91} y={134} width={26} height={24} rx={6} fill={OX} fillOpacity={0.22} stroke={OX} strokeWidth={1.4} />
      )}
      <Bond x1={93} y1={142} x2={115} y2={142} intact={preserveDoubleBond} cleaving={cleaveCCDouble} />
      <Bond x1={93} y1={151} x2={115} y2={151} intact={preserveDoubleBond} cleaving={cleaveCCDouble} />

      <Atom x={132} y={146} label="CH" size={16} />
      <Bond x1={148} y1={146} x2={160} y2={146} />
      <Atom x={170} y={146} label="C" size={17} />
      <Bond x1={170} y1={108} x2={170} y2={132} cleaving={cleaveAlphaCH} />
      <Atom x={170} y={94} label="H" size={16} fill={cleaveAlphaCH ? OX : MUTED} />
      <Bond x1={170} y1={160} x2={170} y2={184} />
      <Atom x={170} y={198} label="H" size={16} fill={MUTED} />
      <Bond x1={180} y1={146} x2={202} y2={146} cleaving={cleaveCO} />
      <Atom x={212} y={146} label="O" size={17} fill={OXYGEN} />
      <Bond x1={223} y1={146} x2={237} y2={146} cleaving={cleaveOH} />
      <Atom x={246} y={146} label="H" size={16} fill={cleaveOH ? OX : INK} />

      {preserveDoubleBond && (
        <text x={104} y={118} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={SUCCESS}>
          C=C intact
        </text>
      )}
      {cleaveCCDouble && (
        <text x={104} y={118} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={PROTON}>
          C=C cleaved
        </text>
      )}
    </g>
  )
}

function wrapLines(text: string, maxLen: number, maxLines = 3): string[] {
  if (text.length <= maxLen) return [text]
  const lines: string[] = []
  let remaining = text.trim()
  while (remaining.length > maxLen && lines.length < maxLines - 1) {
    const plusIdx = remaining.indexOf(' + ')
    if (plusIdx > 0 && plusIdx + 2 <= maxLen) {
      lines.push(remaining.slice(0, plusIdx + 2))
      remaining = remaining.slice(plusIdx + 3).trim()
      continue
    }
    const spaceIdx = remaining.lastIndexOf(' ', maxLen)
    if (spaceIdx > 2) {
      lines.push(remaining.slice(0, spaceIdx))
      remaining = remaining.slice(spaceIdx + 1).trim()
      continue
    }
    const hyphenIdx = remaining.lastIndexOf('-', maxLen)
    if (hyphenIdx > 2) {
      lines.push(remaining.slice(0, hyphenIdx + 1))
      remaining = remaining.slice(hyphenIdx + 1).trim()
      continue
    }
    break
  }
  if (remaining) lines.push(remaining)
  return lines
}

function ReactionStageSvg({ outcome }: { outcome: CleavageOutcome }) {
  const formulaLines = wrapLines(outcome.majorProductFormula, 18, 3)
  const nameLines = wrapLines(outcome.majorProductName, 18, 3)
  const arrowTopLines = wrapLines(outcome.reagentArrowTop, 13, 2)
  const arrowBotLines = wrapLines(outcome.reagentArrowBottom, 14, 2)
  const formulaStartY = formulaLines.length >= 3 ? 92 : 104
  const nameStartY = Math.max(166, formulaStartY + formulaLines.length * 22 + 12)
  const prodTone = outcome.reacts ? ACCENT : MUTED
  const cleaveShort =
    outcome.bondsCleaved === 'None'
      ? 'No bonds cleaved'
      : outcome.highlightMode === 'oh-alpha-ch-and-cc-double'
        ? 'Cleaves: O-H, α-C-H, C=C'
        : `Cleaves: ${outcome.bondsCleaved}`

  return (
    <svg
      className={styles.reactionSvg}
      viewBox="0 0 600 310"
      role="img"
      aria-label={`${outcome.substrate.name} reacting with ${outcome.reagent.label}`}
    >
      {/* Left substrate card */}
      <rect x={8} y={24} width={250} height={224} rx={12} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={133} y={50} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={INK}>
        {`${outcome.substrate.name} (${outcome.substrate.degree})`}
      </text>

      <SubstrateStructure
        substrateId={outcome.substrate.id}
        highlightMode={outcome.highlightMode}
        preserveDoubleBond={outcome.preserveDoubleBond}
      />

      <text x={133} y={232} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        {cleaveShort}
      </text>

      {/* Center arrow */}
      <line x1={264} y1={146} x2={382} y2={146} stroke={outcome.reacts ? INK : MUTED} strokeWidth={2.6} strokeLinecap="round" />
      <polygon points="374,140 386,146 374,152" fill={outcome.reacts ? INK : MUTED} />
      {arrowTopLines.map((line, idx) => (
        <text
          key={`at-${idx}`}
          x={325}
          y={arrowTopLines.length === 1 ? 124 : 106 + idx * 19}
          textAnchor="middle"
          fontSize={15}
          fontWeight={700}
          fontFamily={FONT}
          fill={ACCENT}
        >
          {line}
        </text>
      ))}
      {arrowBotLines.map((line, idx) => (
        <text
          key={`ab-${idx}`}
          x={325}
          y={174 + idx * 19}
          textAnchor="middle"
          fontSize={15}
          fontWeight={500}
          fontFamily={FONT}
          fill={MUTED}
        >
          {line}
        </text>
      ))}

      {/* Right product card */}
      <rect
        x={392}
        y={24}
        width={200}
        height={224}
        rx={12}
        fill="var(--surface-raised)"
        stroke={outcome.reacts ? ACCENT : 'var(--border)'}
        strokeWidth={outcome.reacts ? 1.8 : 1.2}
      />
      <rect
        x={423}
        y={38}
        width={138}
        height={28}
        rx={8}
        fill={prodTone}
        fillOpacity={0.14}
      />
      <text x={492} y={57} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={prodTone}>
        {outcome.reacts ? 'Major product' : 'No product'}
      </text>

      {formulaLines.map((line, idx) => (
        <text
          key={`f-${idx}`}
          x={492}
          y={formulaStartY + idx * 22}
          textAnchor="middle"
          fontSize={16}
          fontWeight={700}
          fontFamily={FONT}
          fill={INK}
        >
          {line}
        </text>
      ))}

      {nameLines.map((line, idx) => (
        <text
          key={`n-${idx}`}
          x={492}
          y={nameStartY + idx * 19}
          textAnchor="middle"
          fontSize={15}
          fontWeight={600}
          fontFamily={FONT}
          fill={MUTED}
        >
          {line}
        </text>
      ))}

      <text x={492} y={232} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={outcome.byProduct ? SUCCESS : MUTED}>
        {outcome.byProduct ? `+ ${outcome.byProduct}` : 'No by-product'}
      </text>

      {/* Bottom colour legend */}
      <circle cx={38} cy={282} r={6} fill={OX} />
      <text x={52} y={287} textAnchor="start" fontSize={15} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        Cleaving bond
      </text>

      <circle cx={210} cy={282} r={6} fill={SUCCESS} />
      <text x={224} y={287} textAnchor="start" fontSize={15} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        Intact C=C / By-product
      </text>

      <circle cx={442} cy={282} r={6} fill={ACCENT} />
      <text x={456} y={287} textAnchor="start" fontSize={15} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        Target product
      </text>
    </svg>
  )
}

function LucasTubeDiagnostic({ turbidity }: { turbidity: 'immediate' | 'delayed' | 'none' }) {
  const droplets =
    turbidity === 'immediate'
      ? [
          [94, 96],
          [112, 104],
          [128, 92],
          [100, 120],
          [120, 126],
          [90, 142],
          [110, 148],
          [130, 138],
          [104, 162],
          [122, 160],
        ]
      : turbidity === 'delayed'
        ? [
            [98, 108],
            [122, 122],
            [102, 144],
            [124, 152],
          ]
        : []

  const statusText =
    turbidity === 'immediate'
      ? 'Immediate turbidity'
      : turbidity === 'delayed'
        ? 'Delayed turbidity'
        : 'Clear solution (298 K)'
  const badgeTone =
    turbidity === 'immediate' ? OX : turbidity === 'delayed' ? ACCENT : SUCCESS

  return (
    <div className={styles.diagnosticBody}>
      <svg
        className={styles.diagnosticSvg}
        viewBox="0 0 220 194"
        role="img"
        aria-label={`Lucas test tube showing ${statusText}`}
      >
        {/* Test tube liquid */}
        <path
          d="M 80 78 L 80 146 A 30 30 0 0 0 140 146 L 140 78 Z"
          fill={turbidity === 'immediate' ? 'var(--precipitate)' : turbidity === 'delayed' ? 'var(--limewater-milky)' : 'var(--sol-clear)'}
          fillOpacity={turbidity === 'immediate' ? 0.85 : turbidity === 'delayed' ? 0.65 : 0.45}
        />
        <ellipse cx={110} cy={78} rx={30} ry={6} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.4} />

        {/* Immiscible alkyl chloride droplets */}
        {droplets.map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={turbidity === 'immediate' ? 5.2 : 4.2}
            fill="var(--surface)"
            stroke={OX}
            strokeWidth={1.6}
          />
        ))}

        {/* Test tube glass outline */}
        <path
          d="M 78 24 L 78 146 A 32 32 0 0 0 142 146 L 142 24"
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={2.8}
          strokeLinecap="round"
        />
        <ellipse cx={110} cy={24} rx={34} ry={6} fill="none" stroke="var(--glass-wall)" strokeWidth={2.4} />
      </svg>
      <p className={styles.diagnosticCaption} style={{ color: badgeTone, fontWeight: 700 }}>
        {statusText}
      </p>
      <p className={styles.diagnosticCaption}>
        {turbidity === 'none'
          ? 'Alcohol remains soluble; no R-Cl phase separates at room temperature.'
          : 'Immiscible alkyl chloride droplets scatter light and turn the layer cloudy.'}
      </p>
    </div>
  )
}

function DehydrationBarrierDiagnostic({ outcome }: { outcome: CleavageOutcome }) {
  const assessment = outcome.dehydrationAssessment
  if (!assessment) return null

  const bars = [
    { label: '3°', rank: 1, height: 34 },
    { label: '2°', rank: 2, height: 64 },
    { label: '1°', rank: 3, height: 94 },
  ] as const

  const baseLine = 172
  const thresholdHeight = assessment.severityRank === 1 ? 42 : assessment.severityRank === 2 ? 72 : 102
  const thresholdY = baseLine - thresholdHeight
  const isAllylic = outcome.substrate.isAllylic

  return (
    <div className={styles.diagnosticBody}>
      <svg
        className={styles.diagnosticSvg}
        viewBox={isAllylic ? '0 0 240 226' : '0 0 240 202'}
        role="img"
        aria-label={`E1 activation barrier gauge: ${assessment.passes ? 'passes' : 'blocked'}`}
      >
        <text x={120} y={20} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={INK}>
          E1 Carbocation Barrier
        </text>

        {/* Legend pill for the applied acid/temperature threshold */}
        <rect x={14} y={32} width={212} height={26} rx={7} fill="var(--surface-raised)" stroke={ACCENT} strokeWidth={1.2} />
        <line x1={24} y1={45} x2={44} y2={45} stroke={ACCENT} strokeWidth={2.4} strokeDasharray="5 3" />
        <text x={52} y={50} textAnchor="start" fontSize={15} fontWeight={700} fontFamily={FONT} fill={ACCENT}>
          {assessment.activeLabel}
        </text>

        {bars.map((b, idx) => {
          const x = 34 + idx * 62
          const active = assessment.requiredRank === b.rank
          const tone = active ? (assessment.passes ? SUCCESS : PROTON) : MUTED
          return (
            <g key={b.label}>
              <rect
                x={x}
                y={baseLine - b.height}
                width={44}
                height={b.height}
                rx={6}
                fill={tone}
                fillOpacity={active ? 0.78 : 0.25}
                stroke={active ? tone : 'var(--border)'}
                strokeWidth={active ? 2 : 1}
              />
              <text x={x + 22} y={baseLine + 20} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={active ? tone : MUTED}>
                {b.label}
              </text>
            </g>
          )
        })}

        {/* Applied condition thermal threshold */}
        <line x1={18} y1={thresholdY} x2={222} y2={thresholdY} stroke={ACCENT} strokeWidth={2.4} strokeDasharray="6 4" />

        {isAllylic && (
          <text x={120} y={216} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill={ACCENT}>
            Allylic 1° ≈ 2° barrier
          </text>
        )}
      </svg>

      <p
        className={styles.diagnosticCaption}
        style={{ color: assessment.passes ? SUCCESS : PROTON, fontWeight: 700 }}
      >
        {assessment.passes ? 'Barrier overcome: alkene forms' : `Blocked: needs ${assessment.requiredLabel}`}
      </p>
      {isAllylic && (
        <p className={styles.diagnosticCaption}>
          Resonance lowers the allylic 1° carbocation barrier to ~2° level.
        </p>
      )}
    </div>
  )
}

function AlphaHydrogenDiagnostic({ outcome }: { outcome: CleavageOutcome }) {
  const count = outcome.alphaHydrogens
  return (
    <div className={styles.diagnosticBody}>
      <div className={styles.alphaCounter}>
        <div className={styles.alphaCountBadge}>
          <span className={count === 0 ? styles.alphaCountNumberZero : styles.alphaCountNumber}>
            {count}
          </span>
          <span className={styles.alphaCountUnit}>α-hydrogens</span>
        </div>

        <div className={styles.alphaSlots}>
          {count === 0 ? (
            <span className={styles.alphaSlotEmpty}>0 α-H on carbinol C</span>
          ) : (
            Array.from({ length: count }, (_, idx) => (
              <span key={idx} className={styles.alphaSlotFilled}>
                {`α-H #${idx + 1}`}
              </span>
            ))
          )}
        </div>
      </div>

      <p className={styles.diagnosticCaption}>
        {count === 2
          ? 'Two α-H atoms allow oxidation to aldehyde (PCC / CrO₃) or onward to carboxylic acid (KMnO₄).'
          : count === 1
            ? 'One α-H atom yields a ketone on oxidation or dehydrogenation.'
            : 'Zero α-H blocks mild oxidation; Cu at 573 K switches to dehydration.'}
      </p>
    </div>
  )
}

export function AlcoholCoCleavageLab(_props: SimulationProps) {
  const [substrateId, setSubstrateId] = useState<SubstrateId>('ethanol')
  const [reagentId, setReagentId] = useState<ReagentId>('dehydration')
  const [dehydrationCond, setDehydrationCond] = useState<DehydrationConditionId>('matched')

  const outcome = evaluateCleavageReaction(substrateId, reagentId, dehydrationCond)

  const diagnosticTitle =
    outcome.diagnosticMode === 'lucas'
      ? 'Lucas Turbidity Tube'
      : outcome.diagnosticMode === 'dehydration'
        ? 'E1 Energy Barrier Gauge'
        : 'α-Hydrogen Availability'

  return (
    <div className={styles.lab}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Alcohol substrate</span>
          <div className={styles.segmentedWrap}>
            <Segmented
              label="Alcohol substrate"
              options={SUBSTRATE_OPTIONS}
              value={substrateId}
              onChange={setSubstrateId}
            />
          </div>
        </div>

        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Reagent / condition</span>
          <div className={styles.segmentedWrap}>
            <Segmented
              label="Reagent or condition"
              options={REAGENT_OPTIONS}
              value={reagentId}
              onChange={setReagentId}
            />
          </div>
        </div>

        {reagentId === 'dehydration' && (
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Acid &amp; temperature condition</span>
            <div className={styles.segmentedWrap}>
              <Segmented
                label="Acid and temperature condition"
                options={CONDITION_OPTIONS}
                value={dehydrationCond}
                onChange={setDehydrationCond}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.stageGrid}>
        <div className={styles.reactionCard}>
          <span className={styles.cardEyebrow}>Bond-cleavage reaction scheme</span>
          <ReactionStageSvg outcome={outcome} />
        </div>

        <div className={styles.diagnosticCard}>
          <span className={styles.cardEyebrow}>{diagnosticTitle}</span>
          {outcome.diagnosticMode === 'lucas' && outcome.lucasTurbidity && (
            <LucasTubeDiagnostic turbidity={outcome.lucasTurbidity} />
          )}
          {outcome.diagnosticMode === 'dehydration' && (
            <DehydrationBarrierDiagnostic outcome={outcome} />
          )}
          {outcome.diagnosticMode === 'oxidation' && (
            <AlphaHydrogenDiagnostic outcome={outcome} />
          )}
        </div>
      </div>

      <div className={styles.readoutGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Reaction type</span>
          <span className={styles.statValue}>{outcome.reactionType}</span>
          <span className={styles.statSub}>{outcome.mechanismNote}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Bonds cleaved</span>
          <span className={styles.statValue}>{outcome.bondsCleaved}</span>
          <span className={styles.statSub}>{`α-H count: ${outcome.alphaHydrogens}`}</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Major product &amp; by-product</span>
          <span className={styles.statValue}>{`${outcome.majorProductName} (${outcome.majorProductFormula})`}</span>
          <span className={styles.statSub}>
            {outcome.byProduct ? `By-product: ${outcome.byProduct}` : 'No separate molecular by-product shown'}
          </span>
        </div>
      </div>

      <div className={styles.noteCard}>
        <span className={styles.noteHeading}>NCERT Condition Note:</span>
        {outcome.ncertNote}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {outcome.liveSummary}
      </p>
    </div>
  )
}
