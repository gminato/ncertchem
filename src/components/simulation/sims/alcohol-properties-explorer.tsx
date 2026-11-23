'use client'

import { useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  BOILING_COMPARISON_SETS,
  BP_TEMP_MAX_K,
  BP_TEMP_MIN_K,
  ROOM_TEMP_K,
  SOLUBILITY_COMPOUNDS,
  boilingSummary,
  getBoilingCompound,
  getBoilingSet,
  getSolubilityCompound,
  phaseAtTemperature,
  solubilitySummary,
  type BoilingComparisonSet,
  type BoilingCompound,
  type BoilingSetId,
  type SimMode,
  type SolubilityCompound,
} from '@/lib/chem/c12-u7-s6-physical'
import styles from './alcohol-properties-explorer.module.css'

const MODE_OPTIONS = [
  { value: 'boiling', label: 'Boiling Point' },
  { value: 'solubility', label: 'Water Solubility' },
] as const satisfies readonly { value: SimMode; label: string }[]

const SET_OPTIONS = BOILING_COMPARISON_SETS.map((s) => ({
  value: s.id,
  label: s.label,
}))

const SOLUBILITY_OPTIONS = SOLUBILITY_COMPOUNDS.map((c) => ({
  value: c.id,
  label: c.kind === 'alkane' ? c.name : `${c.name} (${c.formula})`,
}))

function shortChartLabel(id: string): string {
  switch (id) {
    case 'propane':
      return 'Propane'
    case 'methoxymethane':
      return 'Ether (CH₃OCH₃)'
    case 'ethanol':
      return 'Ethanol'
    case 'methanol':
      return 'Methanol'
    case 'butan-1-ol':
      return 'Butan-1-ol'
    case 'butan-2-ol':
      return 'Butan-2-ol'
    case '2-methylpropan-2-ol':
      return '2-Me-propan-2-ol'
    default:
      return id
  }
}

function MoleculeToken({
  compound,
  cx,
  cy,
  vapour,
  flipped = false,
  chargesBelow = false,
}: {
  compound: BoilingCompound
  cx: number
  cy: number
  vapour: boolean
  flipped?: boolean
  chargesBelow?: boolean
}) {
  if (compound.forceKind === 'h-bond') {
    const tailText =
      compound.id === 'methanol'
        ? 'CH₃'
        : compound.id === 'ethanol'
          ? 'CH₃CH₂'
          : compound.id === 'butan-1-ol'
            ? 'CH₃(CH₂)₃'
            : compound.id === 'butan-2-ol'
              ? 'CH₃CH(C₂H₅)'
              : '(CH₃)₃C'
    const tailRx =
      compound.id === 'butan-2-ol'
        ? 48
        : compound.surfaceContactRating === 3
          ? 46
          : compound.surfaceContactRating === 2
            ? 38
            : 32
    const tailRy = compound.shapeKind === 'compact-tertiary' ? 24 : 16

    if (flipped) {
      // Orientation: H(δ⁺) - O(δ⁻) - [tail] so O faces left toward Mol 1's H, and H points down-left toward Mol 3's O.
      const tailCx = cx + 32
      return (
        <g>
          <ellipse
            cx={tailCx}
            cy={cy}
            rx={tailRx}
            ry={tailRy}
            fill={vapour ? 'var(--surface)' : 'var(--highlight)'}
            stroke={compound.shapeKind === 'compact-tertiary' ? 'var(--fg-muted)' : 'var(--ox)'}
            strokeWidth={1.3}
            strokeDasharray={compound.shapeKind === 'compact-tertiary' ? '4 3' : undefined}
          />
          <text x={tailCx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
            {tailText}
          </text>
          <line x1={cx - 32} y1={cy} x2={tailCx - tailRx} y2={cy} stroke="var(--fg)" strokeWidth={2} />
          <text x={cx - 44} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--atom-o)">
            O
          </text>
          <text x={cx - 44} y={cy - 14} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-minus)">
            δ⁻
          </text>
          <line x1={cx - 44} y1={cy + 12} x2={cx - 44} y2={cy + 28} stroke="var(--fg)" strokeWidth={2} />
          <text x={cx - 44} y={cy + 44} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
            H
          </text>
          <text x={cx - 24} y={cy + 44} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
            δ⁺
          </text>
        </g>
      )
    }

    const tailCx = cx - 28
    const chargeY = chargesBelow ? cy + 23 : cy - 14
    return (
      <g>
        <ellipse
          cx={tailCx}
          cy={cy}
          rx={tailRx}
          ry={tailRy}
          fill={vapour ? 'var(--surface)' : 'var(--highlight)'}
          stroke={compound.shapeKind === 'compact-tertiary' ? 'var(--fg-muted)' : 'var(--ox)'}
          strokeWidth={1.3}
          strokeDasharray={compound.shapeKind === 'compact-tertiary' ? '4 3' : undefined}
        />
        <text x={tailCx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
          {tailText}
        </text>
        <line x1={tailCx + tailRx} y1={cy} x2={cx + 34} y2={cy} stroke="var(--fg)" strokeWidth={2} />
        <text x={cx + 46} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--atom-o)">
          O
        </text>
        <text x={cx + 46} y={chargeY} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-minus)">
          δ⁻
        </text>
        <line x1={cx + 54} y1={cy} x2={cx + 68} y2={cy} stroke="var(--fg)" strokeWidth={2} />
        <text x={cx + 76} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
          H
        </text>
        <text x={cx + 76} y={chargeY} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
          δ⁺
        </text>
      </g>
    )
  }

  if (compound.forceKind === 'dipole') {
    return (
      <g>
        <rect
          x={cx - 64}
          y={cy - 16}
          width={128}
          height={32}
          rx={14}
          fill={vapour ? 'var(--surface)' : 'var(--caution-soft)'}
          stroke="var(--dipole)"
          strokeWidth={1.3}
        />
        <text x={cx - 34} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
          CH₃
        </text>
        <line x1={cx - 18} y1={cy} x2={cx - 8} y2={cy} stroke="var(--fg)" strokeWidth={2} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--atom-o)">
          O
        </text>
        <text x={cx} y={cy - 19} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-minus)">
          δ⁻
        </text>
        <line x1={cx + 8} y1={cy} x2={cx + 18} y2={cy} stroke="var(--fg)" strokeWidth={2} />
        <text x={cx + 36} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
          CH₃
        </text>
      </g>
    )
  }

  return (
    <g>
      <rect
        x={cx - 64}
        y={cy - 16}
        width={128}
        height={32}
        rx={14}
        fill="var(--surface)"
        stroke="var(--fg-muted)"
        strokeWidth={1.3}
        strokeDasharray="4 3"
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        CH₃-CH₂-CH₃
      </text>
    </g>
  )
}

function BoilingInteractionCanvas({
  compound,
  temperatureK,
  reducedMotion,
}: {
  compound: BoilingCompound
  temperatureK: number
  reducedMotion: boolean
}) {
  const phase = phaseAtTemperature(compound, temperatureK)
  const vapour = phase.isVapour

  const positions = vapour
    ? [
        { x: 132, y: 108 },
        { x: 356, y: 122 },
        { x: 236, y: 222 },
      ]
    : [
        { x: 126, y: 206 },
        { x: 368, y: 206 },
        { x: 172, y: 282 },
      ]

  const badgeFill = vapour ? 'var(--caution-soft)' : 'var(--accent-soft)'
  const badgeStroke = vapour ? 'var(--heat)' : 'var(--accent)'
  const badgeText = vapour ? 'Gas (vapour)' : phase.state === 'transition' ? '< 390 K range' : 'Liquid phase'

  return (
    <svg
      className={styles.svgScene}
      viewBox="0 0 500 380"
      role="img"
      aria-label={`Molecular interaction view for ${compound.name} at ${temperatureK} K: ${phase.label}`}
    >
      <text x={16} y={28} fontSize={16} fontWeight={700} fill="var(--fg)">
        {compound.name} ({compound.formula})
      </text>
      <rect x={346} y={8} width={140} height={28} rx={14} fill={badgeFill} stroke={badgeStroke} strokeWidth={1.3} />
      <text x={416} y={27} textAnchor="middle" fontSize={15} fontWeight={600} fill={badgeStroke}>
        {badgeText}
      </text>

      {/* Vessel box */}
      <rect
        x={14}
        y={44}
        width={472}
        height={292}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />

      {/* Liquid meniscus region */}
      <rect
        x={16}
        y={162}
        width={468}
        height={172}
        rx={10}
        fill="var(--liquid)"
        fillOpacity={vapour ? 0.08 : 0.32}
      />
      <line
        x1={16}
        y1={162}
        x2={484}
        y2={162}
        stroke="var(--liquid-edge)"
        strokeWidth={1.6}
        strokeDasharray={vapour ? '6 5' : undefined}
        strokeOpacity={vapour ? 0.35 : 0.85}
      />
      <text x={28} y={68} fontSize={15} fill="var(--fg-muted)">
        {vapour ? 'Vapour space: intermolecular attractions broken' : 'Vapour space'}
      </text>
      <text x={28} y={184} fontSize={15} fill="var(--fg-muted)">
        {vapour ? 'Liquid depleted' : 'Liquid cluster'}
      </text>

      {/* Intermolecular links when clustered in liquid */}
      {!vapour && compound.forceKind === 'h-bond' ? (
        <g>
          {/* Mol 0 H (x=202) -> Mol 1 O (x=324) */}
          <line
            x1={positions[0].x + 88}
            y1={positions[0].y}
            x2={positions[1].x - 56}
            y2={positions[1].y}
            stroke="var(--accent)"
            strokeWidth={2.6}
            strokeDasharray="5 4"
          />
          {/* Mol 1 H (x=324, y=250) -> Mol 2 O (x=218, y=282) */}
          <line
            x1={positions[1].x - 56}
            y1={positions[1].y + 42}
            x2={positions[2].x + 48}
            y2={positions[2].y - 12}
            stroke="var(--accent)"
            strokeWidth={2.6}
            strokeDasharray="5 4"
          />
        </g>
      ) : null}

      {!vapour && compound.forceKind === 'dipole' ? (
        <g>
          <line
            x1={positions[0].x + 66}
            y1={positions[0].y}
            x2={positions[1].x - 66}
            y2={positions[1].y}
            stroke="var(--dipole)"
            strokeWidth={2.2}
            strokeDasharray="4 4"
          />
          <line
            x1={positions[0].x + 28}
            y1={positions[0].y + 18}
            x2={positions[2].x - 16}
            y2={positions[2].y - 18}
            stroke="var(--dipole)"
            strokeWidth={2.2}
            strokeDasharray="4 4"
          />
        </g>
      ) : null}

      {!vapour && compound.forceKind === 'dispersion' ? (
        <g>
          <line
            x1={positions[0].x + 66}
            y1={positions[0].y}
            x2={positions[1].x - 66}
            y2={positions[1].y}
            stroke="var(--fg-subtle)"
            strokeWidth={1.6}
            strokeDasharray="2 4"
          />
        </g>
      ) : null}

      {/* Dispersed broken-bond indicators in gas phase */}
      {vapour ? (
        <g>
          <line
            x1={232}
            y1={114}
            x2={278}
            y2={118}
            stroke="var(--heat)"
            strokeWidth={2}
            strokeDasharray="4 6"
            opacity={0.75}
          />
          <text x={255} y={142} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--heat)">
            separated
          </text>
        </g>
      ) : null}

      {/* Molecules */}
      {positions.map((pos, idx) => (
        <g key={idx}>
          {!reducedMotion && vapour ? (
            <circle
              cx={pos.x}
              cy={pos.y}
              r={4}
              fill="none"
              stroke="var(--heat)"
              strokeOpacity={0.35}
            />
          ) : null}
          <MoleculeToken
            compound={compound}
            cx={pos.x}
            cy={pos.y}
            vapour={vapour}
            flipped={!vapour && compound.forceKind === 'h-bond' && idx === 1}
            chargesBelow={!vapour && compound.forceKind === 'h-bond' && idx === 2}
          />
        </g>
      ))}

      {/* Thermal indicator bar at vessel base when heated */}
      {temperatureK > ROOM_TEMP_K ? (
        <text x={250} y={325} textAnchor="middle" fontSize={15} fill="var(--heat)">
          Thermal energy rising: T = {temperatureK} K
        </text>
      ) : (
        <text x={250} y={325} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {compound.surfaceContactLabel}
        </text>
      )}

      <text x={250} y={362} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {vapour
          ? 'Covalent bonds stay intact; intermolecular forces are overcome.'
          : compound.forcesSummary}
      </text>
    </svg>
  )
}

function BoilingChartPanel({
  set,
  selected,
  temperatureK,
}: {
  set: BoilingComparisonSet
  selected: BoilingCompound
  temperatureK: number
}) {
  if (set.id === 'branching') {
    const meters = [
      { id: 'butan-1-ol', label: 'Butan-1-ol (1° linear)', pct: 100, tag: '390 K (Highest)' },
      { id: 'butan-2-ol', label: 'Butan-2-ol (2° branched)', pct: 68, tag: 'Lower b.p.' },
      { id: '2-methylpropan-2-ol', label: '2-Methylpropan-2-ol (3°)', pct: 42, tag: 'Lowest b.p.' },
    ]
    const scaleLeft = 64
    const scaleRight = 406
    const xOf = (t: number) =>
      scaleLeft + ((t - BP_TEMP_MIN_K) / (BP_TEMP_MAX_K - BP_TEMP_MIN_K)) * (scaleRight - scaleLeft)
    const cursorX = xOf(temperatureK)
    const cursorLabelX = Math.min(Math.max(cursorX, 66), 394)

    return (
      <svg
        className={styles.svgScene}
        viewBox="0 0 460 380"
        role="img"
        aria-label="Branching comparison of C4H10O alcohol isomers showing qualitative surface contact and 390 K reference for butan-1-ol"
      >
        <text x={230} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
          Surface contact &amp; relative b.p. (C₄H₁₀O)
        </text>

        {meters.map((m, idx) => {
          const y0 = 46 + idx * 62
          const active = m.id === selected.id
          return (
            <g key={m.id}>
              <rect
                x={14}
                y={y0}
                width={432}
                height={52}
                rx={8}
                fill={active ? 'var(--accent-soft)' : 'var(--surface-raised)'}
                stroke={active ? 'var(--accent)' : 'var(--border)'}
                strokeWidth={active ? 1.8 : 1}
              />
              <text x={26} y={y0 + 21} fontSize={15} fontWeight={active ? 700 : 600} fill="var(--fg)">
                {m.label}
              </text>
              <text x={434} y={y0 + 21} textAnchor="end" fontSize={15} fontWeight={600} fill={active ? 'var(--accent)' : 'var(--fg-muted)'}>
                {m.tag}
              </text>
              <rect x={26} y={y0 + 30} width={408} height={12} rx={6} fill="var(--surface)" stroke="var(--border)" />
              <rect
                x={26}
                y={y0 + 30}
                width={(408 * m.pct) / 100}
                height={12}
                rx={6}
                fill={active ? 'var(--accent)' : 'var(--liquid-edge)'}
              />
            </g>
          )
        })}

        {/* Verified 390 K + Room Temp + Live T slider gauge */}
        <rect x={14} y={240} width={432} height={106} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
        <text x={26} y={264} fontSize={15} fontWeight={600} fill="var(--fg)">
          Temperature scale (200-420 K)
        </text>

        <line x1={scaleLeft} y1={302} x2={scaleRight} y2={302} stroke="var(--border)" strokeWidth={8} strokeLinecap="round" />
        {/* 298 K tick */}
        <line x1={xOf(ROOM_TEMP_K)} y1={284} x2={xOf(ROOM_TEMP_K)} y2={320} stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 3" />
        <text x={xOf(ROOM_TEMP_K)} y={336} textAnchor="middle" fontSize={15} fill="var(--accent)">
          298 K
        </text>
        {/* 390 K Butan-1-ol tick */}
        <line x1={xOf(390)} y1={284} x2={xOf(390)} y2={320} stroke="var(--liquid-edge)" strokeWidth={2.4} />
        <text x={xOf(390)} y={336} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
          390 K
        </text>
        {/* Live temperature cursor */}
        <circle cx={cursorX} cy={302} r={8} fill="var(--heat)" stroke="var(--surface)" strokeWidth={2} />
        <text x={cursorLabelX} y={282} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--heat)">
          T = {temperatureK} K
        </text>

        <text x={230} y={366} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          Qualitative trend: 1° &gt; 2° &gt; 3° (exact 2°/3° values unprinted).
        </text>
      </svg>
    )
  }

  const plotLeft = 68
  const plotRight = 446
  const plotTop = 50
  const plotBottom = 304
  const sy = (tK: number) =>
    plotBottom - ((tK - BP_TEMP_MIN_K) / (BP_TEMP_MAX_K - BP_TEMP_MIN_K)) * (plotBottom - plotTop)
  const ticks = [200, 250, 300, 350, 400]
  const cols = [124, 218, 312]
  const yRoom = sy(ROOM_TEMP_K)
  const yTemp = sy(temperatureK)
  const nearRoom = Math.abs(temperatureK - ROOM_TEMP_K) <= 22
  const tempBadgeY = nearRoom || yTemp <= plotTop + 28 ? yTemp + 4 : yTemp - 24

  return (
    <svg
      className={styles.svgScene}
      viewBox="0 0 460 380"
      role="img"
      aria-label={`Boiling point bar chart for ${set.label} with temperature cursor at ${temperatureK} K`}
    >
      <text x={230} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        {set.label} (b.p. / K)
      </text>

      <rect
        x={plotLeft}
        y={plotTop}
        width={plotRight - plotLeft}
        height={plotBottom - plotTop}
        rx={8}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />

      {ticks.map((tk) => {
        const y = sy(tk)
        return (
          <g key={tk}>
            <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={plotLeft - 8} y={y + 5} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
              {tk}
            </text>
          </g>
        )
      })}

      {/* 298 K reference line */}
      <line x1={plotLeft} y1={yRoom} x2={plotRight} y2={yRoom} stroke="var(--accent)" strokeWidth={1.8} strokeDasharray="5 4" />
      <rect x={plotRight - 92} y={yRoom - 22} width={86} height={19} rx={4} fill="var(--surface)" />
      <text x={plotRight - 8} y={yRoom - 7} textAnchor="end" fontSize={15} fill="var(--accent)">
        Room 298 K
      </text>

      {/* Live Temperature cursor drawn behind bar labels so high b.p. pills never get crossed */}
      <line x1={plotLeft} y1={yTemp} x2={plotRight} y2={yTemp} stroke="var(--heat)" strokeWidth={2.4} />
      <rect x={plotRight - 94} y={tempBadgeY} width={88} height={21} rx={4} fill="var(--surface)" stroke="var(--heat)" strokeWidth={1} />
      <text
        x={plotRight - 50}
        y={tempBadgeY + 16}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="var(--heat)"
      >
        T = {temperatureK} K
      </text>

      {set.compounds.map((c, idx) => {
        const cx = cols[idx]
        const bp = c.bpK ?? 200
        const top = sy(bp)
        const isActive = c.id === selected.id
        const isVap = temperatureK >= bp
        const fill = isVap
          ? 'var(--surface)'
          : c.forceKind === 'h-bond'
            ? 'var(--liquid)'
            : 'var(--caution-soft)'
        const stroke = isActive
          ? 'var(--accent)'
          : c.forceKind === 'h-bond'
            ? 'var(--liquid-edge)'
            : c.forceKind === 'dipole'
              ? 'var(--dipole)'
              : 'var(--fg-muted)'

        return (
          <g key={c.id}>
            <rect
              x={cx - 21}
              y={top}
              width={42}
              height={plotBottom - top}
              rx={5}
              fill={fill}
              stroke={stroke}
              strokeWidth={isActive ? 3 : 2}
            />
            <rect x={cx - 25} y={top - 24} width={50} height={20} rx={4} fill="var(--surface)" />
            <text x={cx} y={top - 9} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">
              {bp} K
            </text>
            <text
              x={cx}
              y={330}
              textAnchor="middle"
              fontSize={15}
              fontWeight={isActive ? 700 : 500}
              fill={isActive ? 'var(--accent)' : 'var(--fg)'}
            >
              {shortChartLabel(c.id)}
            </text>
          </g>
        )
      })}

      <text x={230} y={366} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Filled bar: liquid at {temperatureK} K · Outlined: gas at {temperatureK} K
      </text>
    </svg>
  )
}

function WaterNode({ cx, cy, muted = false }: { cx: number; cy: number; muted?: boolean }) {
  return (
    <g>
      <rect
        x={cx - 26}
        y={cy - 15}
        width={52}
        height={30}
        rx={15}
        fill={muted ? 'var(--surface)' : 'var(--liquid)'}
        stroke={muted ? 'var(--fg-muted)' : 'var(--liquid-edge)'}
        strokeWidth={1.6}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        H₂O
      </text>
    </g>
  )
}

function SolubilityInteractionCanvas({ compound }: { compound: SolubilityCompound }) {
  const isMiscible = compound.hydrophilicScore > compound.hydrophobicScore
  const isAlkane = compound.kind === 'alkane'
  const pillFill = isAlkane ? 'var(--surface)' : isMiscible ? 'var(--success-soft)' : 'var(--caution-soft)'
  const pillStroke = isAlkane ? 'var(--fg-muted)' : isMiscible ? 'var(--success)' : 'var(--caution)'

  return (
    <svg
      className={styles.svgScene}
      viewBox="0 0 500 380"
      role="img"
      aria-label={`Water interaction scene for ${compound.name}: ${compound.statusLabel}`}
    >
      <text x={16} y={28} fontSize={16} fontWeight={700} fill="var(--fg)">
        {compound.name} ({compound.formula})
      </text>
      <rect x={302} y={8} width={184} height={28} rx={14} fill={pillFill} stroke={pillStroke} strokeWidth={1.3} />
      <text x={394} y={27} textAnchor="middle" fontSize={15} fontWeight={600} fill={pillStroke}>
        {compound.quantitativeTag}
      </text>

      <rect
        x={14}
        y={44}
        width={472}
        height={292}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />

      {/* Hydrophobic zone around tail */}
      <ellipse
        cx={compound.kind === 'alkane' ? 236 : 148}
        cy={182}
        rx={compound.kind === 'alkane' ? 162 : 34 + compound.carbonCount * 13}
        ry={compound.kind === 'phenol' ? 66 : compound.kind === 'alkane' ? 60 : 34 + compound.carbonCount * 5}
        fill={compound.carbonCount >= 4 ? 'var(--caution-soft)' : 'var(--surface)'}
        stroke={compound.carbonCount >= 4 ? 'var(--caution)' : 'var(--border)'}
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />

      {compound.kind === 'phenol' ? (
        <g>
          <polygon
            points="182,182 165,211 131,211 114,182 131,153 165,153"
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <circle cx={148} cy={182} r={19} fill="none" stroke="var(--fg)" strokeWidth={1.8} />
          <line x1={182} y1={182} x2={266} y2={182} stroke="var(--fg)" strokeWidth={2.2} />
        </g>
      ) : compound.kind === 'alkane' ? (
        <text x={236} y={188} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--fg)">
          CH₃-CH₂-CH₂-CH₂-CH₃
        </text>
      ) : (
        <g>
          <text x={148} y={188} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
            {compound.id === 'methanol'
              ? 'CH₃'
              : compound.id === 'ethanol'
                ? 'CH₃-CH₂'
                : compound.id === 'propan-1-ol'
                  ? 'CH₃-CH₂-CH₂'
                  : 'CH₃-(CH₂)₃'}
          </text>
          <line
            x1={
              compound.id === 'methanol'
                ? 170
                : compound.id === 'ethanol'
                  ? 188
                  : compound.id === 'propan-1-ol'
                    ? 206
                    : 196
            }
            y1={182}
            x2={266}
            y2={182}
            stroke="var(--fg)"
            strokeWidth={2.2}
          />
        </g>
      )}

      {/* Polar -OH group & H-bonds to 3 water molecules */}
      {!isAlkane ? (
        <g>
          <text x={286} y={188} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--atom-o)">
            OH
          </text>
          <line x1={304} y1={172} x2={358} y2={118} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="5 4" />
          <line x1={308} y1={182} x2={366} y2={182} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="5 4" />
          <line x1={304} y1={192} x2={358} y2={246} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="5 4" />
          <WaterNode cx={390} cy={108} />
          <WaterNode cx={398} cy={182} />
          <WaterNode cx={390} cy={256} />
        </g>
      ) : (
        <g>
          <text x={236} y={220} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--caution)">
            No -OH group: zero H-bonds
          </text>
          <WaterNode cx={64} cy={88} muted />
          <WaterNode cx={426} cy={88} muted />
          <WaterNode cx={426} cy={272} muted />
          <line x1={90} y1={86} x2={184} y2={84} stroke="var(--liquid-edge)" strokeWidth={1.6} strokeDasharray="4 4" />
          <line x1={236} y1={84} x2={400} y2={88} stroke="var(--liquid-edge)" strokeWidth={1.6} strokeDasharray="4 4" />
        </g>
      )}

      {/* Outer water molecules pushed aside by larger tails */}
      <WaterNode cx={68} cy={272} muted={compound.carbonCount >= 4} />
      <WaterNode cx={210} cy={84} muted={compound.carbonCount >= 4} />

      <text x={250} y={318} textAnchor="middle" fontSize={15} fill={compound.carbonCount >= 4 ? 'var(--caution)' : 'var(--fg-muted)'}>
        {compound.carbonCount >= 4
          ? 'Large hydrophobic region pushes H₂O molecules apart'
          : 'Small tail fits inside H₂O hydrogen-bonded network'}
      </text>

      <text x={250} y={362} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {compound.forcesSummary}
      </text>
    </svg>
  )
}

function SolubilityGaugePanel({ compound }: { compound: SolubilityCompound }) {
  return (
    <svg
      className={styles.svgScene}
      viewBox="0 0 460 380"
      role="img"
      aria-label={`Hydrophilic vs hydrophobic balance and NCERT solubility scale for ${compound.name}`}
    >
      <text x={230} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        Hydrophilic vs hydrophobic balance
      </text>

      <rect x={14} y={42} width={432} height={116} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={26} y={66} fontSize={15} fontWeight={600} fill="var(--fg)">
        -OH H-bonding pull ({compound.hBondsWithWater} H-bonds)
      </text>
      <rect x={26} y={74} width={408} height={16} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <rect
        x={26}
        y={74}
        width={(408 * compound.hydrophilicScore) / 100}
        height={16}
        rx={8}
        fill="var(--accent)"
      />

      <text x={26} y={118} fontSize={15} fontWeight={600} fill="var(--fg)">
        Hydrophobic disruption ({compound.carbonCount}-C hydrocarbon)
      </text>
      <rect x={26} y={126} width={408} height={16} rx={8} fill="var(--surface)" stroke="var(--border)" />
      <rect
        x={26}
        y={126}
        width={(408 * compound.hydrophobicScore) / 100}
        height={16}
        rx={8}
        fill="var(--caution)"
      />

      {/* All 6 compounds comparison ladder */}
      <text x={16} y={184} fontSize={15} fontWeight={700} fill="var(--fg)">
        Unit 7 solubility trend
      </text>
      {SOLUBILITY_COMPOUNDS.map((c, idx) => {
        const y0 = 196 + idx * 28
        const active = c.id === compound.id
        return (
          <g key={c.id}>
            <rect
              x={14}
              y={y0}
              width={432}
              height={24}
              rx={6}
              fill={active ? 'var(--accent-soft)' : 'var(--surface-raised)'}
              stroke={active ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={active ? 1.5 : 0.8}
            />
            <text x={24} y={y0 + 17} fontSize={15} fontWeight={active ? 700 : 500} fill="var(--fg)">
              {c.name}
            </text>
            <text
              x={436}
              y={y0 + 17}
              textAnchor="end"
              fontSize={15}
              fontWeight={active ? 700 : 500}
              fill={active ? 'var(--accent)' : 'var(--fg-muted)'}
            >
              {c.quantitativeTag}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function AlcoholPropertiesExplorer({ reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<SimMode>('boiling')
  const [setId, setSetId] = useState<BoilingSetId>('comparable-mass')
  const [compoundId, setCompoundId] = useState<string>('ethanol')
  const [temperatureK, setTemperatureK] = useState<number>(ROOM_TEMP_K)
  const [solubilityId, setSolubilityId] = useState<string>('propan-1-ol')

  const activeSet = getBoilingSet(setId)
  const activeBoilingCompound = getBoilingCompound(setId, compoundId)
  const activePhase = phaseAtTemperature(activeBoilingCompound, temperatureK)
  const activeSolubility = getSolubilityCompound(solubilityId)

  const handleSetChange = (nextSetId: BoilingSetId) => {
    setSetId(nextSetId)
    const nextSet = getBoilingSet(nextSetId)
    if (!nextSet.compounds.some((c) => c.id === compoundId)) {
      const preferred =
        nextSet.compounds.find((c) => c.id === 'ethanol') ??
        nextSet.compounds.find((c) => c.id === 'butan-1-ol') ??
        nextSet.compounds[0]
      setCompoundId(preferred.id)
    }
  }

  const compoundOptions = activeSet.compounds.map((c) => ({
    value: c.id,
    label: c.name,
  }))

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <div className={styles.controlsRow}>
          <Segmented label="Property mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
          {mode === 'boiling' ? (
            <>
              <Segmented label="Comparison set" options={SET_OPTIONS} value={setId} onChange={handleSetChange} />
              <Segmented
                label="Compound focus"
                options={compoundOptions}
                value={activeBoilingCompound.id}
                onChange={setCompoundId}
              />
              <div className={styles.sliderGroup}>
                <div className={styles.sliderWrap}>
                  <Slider
                    label="Temperature"
                    value={temperatureK}
                    min={BP_TEMP_MIN_K}
                    max={BP_TEMP_MAX_K}
                    step={1}
                    unit="K"
                    onChange={setTemperatureK}
                  />
                </div>
                <Button variant="secondary" onClick={() => setTemperatureK(ROOM_TEMP_K)}>
                  298 K (Room T)
                </Button>
              </div>
            </>
          ) : (
            <Segmented
              label="Molecule"
              options={SOLUBILITY_OPTIONS}
              value={activeSolubility.id}
              onChange={setSolubilityId}
            />
          )}
        </div>
      </SimulationControls>

      <div className={styles.stageGrid}>
        <div className={styles.panelCard}>
          {mode === 'boiling' ? (
            <BoilingInteractionCanvas
              compound={activeBoilingCompound}
              temperatureK={temperatureK}
              reducedMotion={reducedMotion}
            />
          ) : (
            <SolubilityInteractionCanvas compound={activeSolubility} />
          )}
        </div>
        <div className={styles.panelCard}>
          {mode === 'boiling' ? (
            <BoilingChartPanel
              set={activeSet}
              selected={activeBoilingCompound}
              temperatureK={temperatureK}
            />
          ) : (
            <SolubilityGaugePanel compound={activeSolubility} />
          )}
        </div>
      </div>

      {mode === 'boiling' ? (
        <div className={styles.readout}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Compound &amp; formula</span>
            <span className={styles.statValue}>
              {activeBoilingCompound.name} ({activeBoilingCompound.formula})
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Molar mass (NCERT)</span>
            <span className={styles.statValue}>{activeBoilingCompound.molecularMassLabel}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Boiling point</span>
            <span className={styles.statValue}>{activeBoilingCompound.bpLabel}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Dominant forces &amp; phase</span>
            <span className={styles.statValue}>
              {activePhase.label} · {activeBoilingCompound.forcesSummary}
            </span>
          </div>
        </div>
      ) : (
        <div className={styles.readout}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Molecule</span>
            <span className={styles.statValue}>
              {activeSolubility.name} ({activeSolubility.formula})
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Water solubility status</span>
            <span className={styles.statValue}>{activeSolubility.statusLabel}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Dominant interactions</span>
            <span className={styles.statValue}>{activeSolubility.forcesSummary}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Molecular balance</span>
            <span className={styles.statValue}>{activeSolubility.note}</span>
          </div>
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {mode === 'boiling'
          ? boilingSummary(activeSet, activeBoilingCompound, temperatureK)
          : solubilitySummary(activeSolubility)}
      </p>
    </div>
  )
}
