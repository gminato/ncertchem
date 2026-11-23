'use client'

import type { ReactNode } from 'react'
import {
  ALCOHOL_HBOND_STEP_COUNT,
  ALCOHOL_HBOND_STEP_TITLES,
  CHAIN_LENGTH_BARS,
  COMPARABLE_MASS_BARS,
  HBOND_ETHANOL_ETHER_GAP_K,
  HBOND_ROOM_TEMP_K,
} from './alcohol-hbond-steps'

export interface AlcoholHBondBoilingProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

function BenzeneHexagon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / 3
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon points={pts} fill="none" stroke="var(--fg)" strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke="var(--fg)" strokeWidth={1.8} />
    </g>
  )
}

function LonePairDots({ cx, cy, vertical }: { cx: number; cy: number; vertical?: boolean }) {
  const dx = vertical ? 0 : 4
  const dy = vertical ? 4 : 0
  return (
    <g>
      <circle cx={cx - dx} cy={cy - dy} r={2.3} fill="var(--lone-pair-edge)" />
      <circle cx={cx + dx} cy={cy + dy} r={2.3} fill="var(--lone-pair-edge)" />
    </g>
  )
}

/** Step 1: Intermolecular O-H···O hydrogen bonding in alcohols (R-OH) and phenols (Ar-OH). */
function IntermolecularNetworks() {
  const alcoholUnits = [
    { x: 96, branchDir: 'down' as const, hasLeftR: true },
    { x: 214, branchDir: 'up' as const, hasLeftR: false },
    { x: 332, branchDir: 'down' as const, hasLeftR: false },
    { x: 450, branchDir: 'up' as const, hasLeftR: false },
  ]
  const phenolX = [132, 272, 412]

  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Intermolecular O-H···O hydrogen bonding
      </text>

      {/* Top panel: Alcohol chains */}
      <rect
        x={16}
        y={42}
        width={508}
        height={176}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text x={30} y={66} fontSize={15} fontWeight={600} fill="var(--fg)">
        Alcohol chains (R-OH)
      </text>

      {alcoholUnits.map((u, idx) => {
        const oy = 128
        const hX = u.x - 42
        const branchY = u.branchDir === 'up' ? oy - 48 : oy + 48
        const bondY1 = u.branchDir === 'up' ? oy - 14 : oy + 14
        const bondY2 = u.branchDir === 'up' ? oy - 34 : oy + 34
        const chargeY = u.branchDir === 'up' ? oy + 24 : oy - 22
        return (
          <g key={`alc-${idx}`}>
            {u.hasLeftR ? (
              <>
                <text x={40} y={oy + 5} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
                  R
                </text>
                <line x1={54} y1={oy} x2={u.x - 15} y2={oy} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
                <line x1={u.x} y1={oy + 14} x2={u.x} y2={oy + 34} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
                <text x={u.x} y={oy + 52} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
                  H
                </text>
                <text x={u.x + 22} y={oy + 52} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
                  δ⁺
                </text>
              </>
            ) : (
              <>
                <text x={hX} y={oy + 5} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
                  H
                </text>
                <text x={hX} y={chargeY} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
                  δ⁺
                </text>
                <line x1={hX + 13} y1={oy} x2={u.x - 15} y2={oy} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
                <line x1={u.x} y1={bondY1} x2={u.x} y2={bondY2} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
                <text x={u.x} y={branchY + 5} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
                  R
                </text>
              </>
            )}

            <text x={u.x} y={oy + 5} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
              O
            </text>
            <text
              x={u.hasLeftR ? u.x - 10 : u.x}
              y={u.hasLeftR ? oy - 22 : chargeY}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fill="var(--delta-minus)"
            >
              δ⁻
            </text>
            <LonePairDots cx={u.x + 15} cy={oy} vertical />

            {idx < alcoholUnits.length - 1 ? (
              <line
                x1={u.x + 24}
                y1={oy}
                x2={alcoholUnits[idx + 1].x - 56}
                y2={oy}
                stroke="var(--accent)"
                strokeWidth={2.6}
                strokeDasharray="5 4"
              />
            ) : (
              <line
                x1={u.x + 24}
                y1={oy}
                x2={510}
                y2={oy}
                stroke="var(--accent)"
                strokeWidth={2.6}
                strokeDasharray="5 4"
              />
            )}
          </g>
        )
      })}

      {/* Bottom panel: Phenol network */}
      <rect
        x={16}
        y={230}
        width={508}
        height={176}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text x={30} y={254} fontSize={15} fontWeight={600} fill="var(--fg)">
        Phenol network (Ar-OH)
      </text>

      {phenolX.map((cx, idx) => {
        const oy = 296
        const hx = cx - 42
        return (
          <g key={`ph-${idx}`}>
            <text x={hx} y={oy + 5} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
              H
            </text>
            <text x={hx} y={oy - 16} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
              δ⁺
            </text>
            <line x1={hx + 12} y1={oy} x2={cx - 14} y2={oy} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
            <text x={cx} y={oy + 5} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
              O
            </text>
            <text x={cx} y={oy - 16} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-minus)">
              δ⁻
            </text>
            <LonePairDots cx={cx + 15} cy={oy} vertical />
            <line x1={cx} y1={oy + 12} x2={cx} y2={oy + 30} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
            <BenzeneHexagon cx={cx} cy={358} r={30} />

            {idx < phenolX.length - 1 ? (
              <line
                x1={cx + 24}
                y1={oy}
                x2={phenolX[idx + 1] - 56}
                y2={oy}
                stroke="var(--accent)"
                strokeWidth={2.6}
                strokeDasharray="5 4"
              />
            ) : (
              <line
                x1={cx + 24}
                y1={oy}
                x2={488}
                y2={oy}
                stroke="var(--accent)"
                strokeWidth={2.6}
                strokeDasharray="5 4"
              />
            )}
          </g>
        )
      })}

      {/* Legend */}
      <line x1={62} y1={431} x2={96} y2={431} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={104} y={436} fontSize={15} fill="var(--fg-muted)">
        Covalent bond
      </text>
      <line x1={236} y1={431} x2={274} y2={431} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="5 4" />
      <text x={282} y={436} fontSize={15} fill="var(--fg)">
        Intermolecular H-bond (H···O)
      </text>
    </g>
  )
}

/** Step 2: Propane (231 K), methoxymethane (248 K), ethanol (351 K) vs 298 K room temp. */
function ComparableMassThermometers() {
  const plotLeft = 80
  const plotRight = 508
  const plotTop = 52
  const plotBottom = 322
  const tMin = 200
  const tMax = 400
  const sy = (tK: number) => plotBottom - ((tK - tMin) / (tMax - tMin)) * (plotBottom - plotTop)
  const ticks = [200, 250, 300, 350, 400]
  const cols = [154, 290, 426]
  const yRoom = sy(HBOND_ROOM_TEMP_K)
  const yEther = sy(248)
  const yEthanol = sy(351)

  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Comparable mass (44-46 u): boiling points
      </text>

      <rect
        x={plotLeft}
        y={plotTop}
        width={plotRight - plotLeft}
        height={plotBottom - plotTop}
        rx={6}
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
      <text
        transform={`translate(24 ${(plotTop + plotBottom) / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg)"
      >
        boiling point / K
      </text>

      {/* 298 K Room temp line */}
      <line
        x1={plotLeft}
        y1={yRoom}
        x2={plotRight}
        y2={yRoom}
        stroke="var(--accent)"
        strokeWidth={2}
        strokeDasharray="6 4"
      />
      <rect x={plotLeft + 8} y={yRoom - 26} width={114} height={21} rx={4} fill="var(--surface)" />
      <text x={plotLeft + 14} y={yRoom - 10} fontSize={15} fontWeight={600} fill="var(--accent)">
        Room T: 298 K
      </text>

      {COMPARABLE_MASS_BARS.map((c, idx) => {
        const cx = cols[idx]
        const bp = c.bpK ?? 200
        const top = sy(bp)
        const isLiquid = bp > HBOND_ROOM_TEMP_K
        const fill =
          c.forceKind === 'h-bond'
            ? 'var(--liquid)'
            : c.forceKind === 'dipole'
              ? 'var(--caution-soft)'
              : 'var(--surface)'
        const stroke =
          c.forceKind === 'h-bond'
            ? 'var(--liquid-edge)'
            : c.forceKind === 'dipole'
              ? 'var(--dipole)'
              : 'var(--fg-muted)'

        return (
          <g key={c.id}>
            <rect
              x={cx - 22}
              y={top}
              width={44}
              height={plotBottom - top}
              rx={4}
              fill={fill}
              stroke={stroke}
              strokeWidth={2.2}
            />
            <rect x={cx - 28} y={top - 25} width={56} height={20} rx={4} fill="var(--surface)" />
            <text x={cx} y={top - 10} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">
              {bp} K
            </text>
            <text x={cx} y={346} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
              {c.name}
            </text>
            <text x={cx} y={368} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
              {c.molecularMassLabel} · {isLiquid ? 'Liquid' : 'Gas'}
            </text>
            <text
              x={cx}
              y={390}
              textAnchor="middle"
              fontSize={15}
              fontWeight={c.forceKind === 'h-bond' ? 600 : 400}
              fill={c.forceKind === 'h-bond' ? 'var(--accent)' : 'var(--fg-muted)'}
            >
              {c.forceKind === 'h-bond'
                ? 'O-H···O H-bonds'
                : c.forceKind === 'dipole'
                  ? 'Dipole-dipole'
                  : 'Dispersion'}
            </text>
          </g>
        )
      })}

      {/* +103 K jump bracket between Methoxymethane (248 K) and Ethanol (351 K) */}
      <path
        d={`M 326 ${yEther} H 338 V ${yEthanol} H 326`}
        fill="none"
        stroke="var(--heat)"
        strokeWidth={2}
      />
      <rect x={340} y={(yEther + yEthanol) / 2 - 11} width={60} height={22} rx={4} fill="var(--surface)" />
      <text
        x={370}
        y={(yEther + yEthanol) / 2 + 5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={700}
        fill="var(--heat)"
      >
        +{HBOND_ETHANOL_ETHER_GAP_K} K
      </text>

      <text x={W / 2} y={434} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        O-H···O bridges keep ethanol liquid far above its 46 u ether isomer.
      </text>
    </g>
  )
}

/** Step 3: Methanol (337 K) -> Ethanol (351 K) -> Butan-1-ol (390 K). */
function ChainLengthTrend() {
  const rows = [
    {
      compound: CHAIN_LENGTH_BARS[0],
      chainLabel: 'CH₃-OH',
      contactWidth: 32,
      deltaNote: '1-C tail',
    },
    {
      compound: CHAIN_LENGTH_BARS[1],
      chainLabel: 'CH₃CH₂-OH',
      contactWidth: 64,
      deltaNote: '2-C tail (+14 K)',
    },
    {
      compound: CHAIN_LENGTH_BARS[2],
      chainLabel: 'CH₃(CH₂)₃-OH',
      contactWidth: 118,
      deltaNote: '4-C tail (+39 K)',
    },
  ]

  const barX0 = 288
  const barMaxW = 210
  const tBase = 260
  const tSpan = 160 // up to 420 K

  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Longer carbon chains raise boiling point
      </text>

      {rows.map((row, i) => {
        const y0 = 46 + i * 122
        const cy = y0 + 62
        const bp = row.compound.bpK ?? 337
        const barW = ((bp - tBase) / tSpan) * barMaxW
        return (
          <g key={row.compound.id}>
            <rect
              x={16}
              y={y0}
              width={508}
              height={108}
              rx={10}
              fill="var(--surface-raised)"
              stroke="var(--border)"
            />

            <text x={30} y={y0 + 23} fontSize={16} fontWeight={600} fill="var(--fg)">
              {row.compound.name}
            </text>
            <text x={148} y={y0 + 23} fontSize={15} fill="var(--fg-muted)">
              {row.deltaNote}
            </text>

            {/* Glowing van der Waals contact seam between paired tails */}
            <rect
              x={34}
              y={cy - 8}
              width={row.contactWidth}
              height={18}
              rx={9}
              fill="var(--highlight)"
              stroke="var(--ox)"
              strokeWidth={1.2}
              strokeDasharray="4 3"
            />
            <text x={36} y={cy - 14} fontSize={15} fontWeight={600} fill="var(--fg)">
              {row.chainLabel}
            </text>
            <text x={36} y={cy + 27} fontSize={15} fontWeight={600} fill="var(--fg)">
              {row.chainLabel}
            </text>
            {/* H-bond connector strictly in the gap to the right of the tails */}
            <line
              x1={42 + row.contactWidth + 24}
              y1={cy - 10}
              x2={42 + row.contactWidth + 24}
              y2={cy + 12}
              stroke="var(--accent)"
              strokeWidth={2.4}
              strokeDasharray="4 3"
            />
            <text x={42 + row.contactWidth + 34} y={cy + 6} fontSize={15} fontWeight={600} fill="var(--accent)">
              O-H···O
            </text>

            {/* Horizontal boiling point bar */}
            <text x={barX0} y={y0 + 34} fontSize={15} fill="var(--fg-muted)">
              Boiling point
            </text>
            <rect
              x={barX0}
              y={y0 + 46}
              width={barMaxW}
              height={28}
              rx={6}
              fill="var(--surface)"
              stroke="var(--border)"
            />
            <rect
              x={barX0}
              y={y0 + 46}
              width={barW}
              height={28}
              rx={6}
              fill="var(--liquid)"
              stroke="var(--liquid-edge)"
              strokeWidth={1.8}
            />
            <text x={barX0 + barW - 8} y={y0 + 66} textAnchor="end" fontSize={15} fontWeight={700} fill="var(--fg)">
              {bp} K
            </text>
          </g>
        )
      })}

      <text x={W / 2} y={436} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        More -CH₂- units expand surface contact and van der Waals attraction.
      </text>
    </g>
  )
}

/** Step 4: Butan-1-ol (straight chain) vs 2-Methylpropan-2-ol (compact spherical). */
function BranchingContrast() {
  const straightZigzag = (x0: number, y0: number) =>
    `M ${x0} ${y0} L ${x0 + 30} ${y0 - 16} L ${x0 + 60} ${y0} L ${x0 + 90} ${y0 - 16} L ${x0 + 118} ${y0}`

  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Branching shrinks surface contact (C₄H₁₀O)
      </text>

      {/* Left card: Butan-1-ol */}
      <rect
        x={16}
        y={46}
        width={246}
        height={354}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />
      <text x={139} y={72} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        Butan-1-ol (1°)
      </text>
      <text x={139} y={94} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Unbranched chain
      </text>

      {/* Extended capsule pair */}
      <rect
        x={40}
        y={114}
        width={198}
        height={56}
        rx={28}
        fill="var(--surface)"
        stroke="var(--fg-muted)"
        strokeDasharray="5 4"
        strokeWidth={1.6}
      />
      <path d={straightZigzag(54, 150)} fill="none" stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <text x={180} y={154} fontSize={15} fontWeight={700} fill="var(--atom-o)">
        OH
      </text>

      {/* Large glowing contact strip */}
      <rect
        x={52}
        y={176}
        width={162}
        height={24}
        rx={8}
        fill="var(--highlight)"
        stroke="var(--ox)"
        strokeWidth={1.4}
      />
      <text x={133} y={193} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        Broad contact
      </text>

      <rect
        x={40}
        y={206}
        width={198}
        height={56}
        rx={28}
        fill="var(--surface)"
        stroke="var(--fg-muted)"
        strokeDasharray="5 4"
        strokeWidth={1.6}
      />
      <path d={straightZigzag(54, 242)} fill="none" stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      <text x={180} y={246} fontSize={15} fontWeight={700} fill="var(--atom-o)">
        OH
      </text>

      <text x={139} y={302} textAnchor="middle" fontSize={15} fill="var(--fg)">
        Stronger dispersion
      </text>
      <rect x={44} y={322} width={190} height={48} rx={8} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.6} />
      <text x={139} y={351} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        b.p. 390 K (higher)
      </text>

      {/* Right card: 2-Methylpropan-2-ol */}
      <rect
        x={278}
        y={46}
        width={246}
        height={354}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />
      <text x={401} y={72} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        2-Methylpropan-2-ol
      </text>
      <text x={401} y={94} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Compact 3° sphere
      </text>

      {/* Two compact circles touching at small waist */}
      <circle cx={344} cy={188} r={52} fill="var(--surface)" stroke="var(--fg-muted)" strokeDasharray="5 4" strokeWidth={1.6} />
      <line x1={308} y1={188} x2={334} y2={188} stroke="var(--fg)" strokeWidth={2.4} />
      <line x1={334} y1={188} x2={334} y2={162} stroke="var(--fg)" strokeWidth={2.4} />
      <line x1={334} y1={188} x2={334} y2={214} stroke="var(--fg)" strokeWidth={2.4} />
      <line x1={334} y1={188} x2={354} y2={188} stroke="var(--fg)" strokeWidth={2.4} />
      <text x={371} y={193} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--atom-o)">
        OH
      </text>

      <circle cx={458} cy={188} r={52} fill="var(--surface)" stroke="var(--fg-muted)" strokeDasharray="5 4" strokeWidth={1.6} />
      <line x1={422} y1={188} x2={448} y2={188} stroke="var(--fg)" strokeWidth={2.4} />
      <line x1={448} y1={188} x2={448} y2={162} stroke="var(--fg)" strokeWidth={2.4} />
      <line x1={448} y1={188} x2={448} y2={214} stroke="var(--fg)" strokeWidth={2.4} />
      <line x1={448} y1={188} x2={468} y2={188} stroke="var(--fg)" strokeWidth={2.4} />
      <text x={485} y={193} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--atom-o)">
        OH
      </text>

      {/* Small tangent contact highlight */}
      <ellipse cx={401} cy={188} rx={11} ry={22} fill="var(--highlight)" stroke="var(--ox)" strokeWidth={1.4} />
      <text x={401} y={266} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Small tangent contact
      </text>

      <text x={401} y={302} textAnchor="middle" fontSize={15} fill="var(--fg)">
        Weaker dispersion
      </text>
      <rect x={306} y={322} width={190} height={48} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.6} />
      <text x={401} y={351} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg-muted)">
        Lower b.p. (compact)
      </text>

      <text x={W / 2} y={434} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Same C₄H₁₀O formula; branching cuts surface contact and boiling point.
      </text>
    </g>
  )
}

export function AlcoholHBondBoiling({ step }: AlcoholHBondBoilingProps) {
  const index = Math.min(Math.max(0, step), ALCOHOL_HBOND_STEP_COUNT - 1)
  let scene: ReactNode
  switch (index) {
    case 0:
      scene = <IntermolecularNetworks />
      break
    case 1:
      scene = <ComparableMassThermometers />
      break
    case 2:
      scene = <ChainLengthTrend />
      break
    default:
      scene = <BranchingContrast />
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ALCOHOL_HBOND_STEP_TITLES[index]}>
      {scene}
    </svg>
  )
}
