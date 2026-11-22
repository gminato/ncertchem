'use client'

import React from 'react'
import {
  CFT_COLOR,
  ElectronSpinArrow,
  EnergyAxis,
  OrbitalLevelSet,
  SplitDoubleArrow,
  fillSubshellSlots,
  formatOctahedralConfig,
  toSuperscript,
} from './cft-svg-helpers'
import { highLowStepState, type D4ToD7Entry } from './cft-high-low-steps'

export interface CftHighLowSpinProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

/** Side comparison bars for Δo vs P on the right of steps 1, 2, 3. */
function DeltaVsPairingBars({
  deltaFrac,
  pairingFrac,
  highlight,
  reducedMotion,
}: {
  deltaFrac: number
  pairingFrac: number
  highlight: 'none' | 'delta' | 'pairing'
  reducedMotion: boolean
}) {
  const baseY = 304
  const maxH = 176
  const deltaH = Math.round(deltaFrac * maxH)
  const pairH = Math.round(pairingFrac * maxH)
  const barW = 46
  const xDelta = 382
  const xPair = 452
  const tStyle: React.CSSProperties | undefined = reducedMotion
    ? undefined
    : { transition: 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }

  return (
    <g>
      <text x={440} y={64} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
        Compare costs
      </text>
      <line x1={364} y1={baseY} x2={514} y2={baseY} stroke={CFT_COLOR.subtle} strokeWidth={1.5} />

      {/* Δo bar */}
      <rect
        x={xDelta}
        y={baseY - deltaH}
        width={barW}
        height={deltaH}
        rx={6}
        fill={highlight === 'delta' ? CFT_COLOR.success : CFT_COLOR.highRepulsion}
        fillOpacity={highlight === 'delta' ? 0.32 : 0.24}
        stroke={highlight === 'delta' ? CFT_COLOR.success : CFT_COLOR.highRepulsion}
        strokeWidth={highlight === 'delta' ? 2.4 : 1.8}
        style={tStyle}
      />
      <text x={xDelta + barW / 2} y={baseY + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        Δo
      </text>

      {/* P bar */}
      <rect
        x={xPair}
        y={baseY - pairH}
        width={barW}
        height={pairH}
        rx={6}
        fill={highlight === 'pairing' ? CFT_COLOR.success : CFT_COLOR.pairing}
        fillOpacity={highlight === 'pairing' ? 0.32 : 0.24}
        stroke={highlight === 'pairing' ? CFT_COLOR.success : CFT_COLOR.pairing}
        strokeWidth={highlight === 'pairing' ? 2.4 : 1.8}
        style={tStyle}
      />
      <text x={xPair + barW / 2} y={baseY + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        P
      </text>

      {/* Verdict text */}
      <text x={440} y={356} textAnchor="middle" fontSize={15} fontWeight={600} fill={highlight === 'none' ? CFT_COLOR.muted : CFT_COLOR.success}>
        {highlight === 'none' && 'Shorter bar wins'}
        {highlight === 'delta' && 'Δo < P (climb)'}
        {highlight === 'pairing' && 'Δo > P (pair)'}
      </text>
    </g>
  )
}

/** Compact cell for one d^n configuration in Step 4 (d4 to d7 grid). */
function CompactConfigCell({
  cx,
  topY,
  t2g,
  eg,
  unpaired,
}: {
  cx: number
  topY: number
  t2g: number
  eg: number
  unpaired: number
}) {
  const egSlots = fillSubshellSlots(eg, 2)
  const t2gSlots = fillSubshellSlots(t2g, 3)
  return (
    <g>
      <OrbitalLevelSet
        cx={cx}
        y={topY + 28}
        slots={2}
        slotWidth={24}
        slotGap={8}
        stroke={CFT_COLOR.highRepulsion}
        electrons={egSlots}
        arrowHeight={22}
      />
      <OrbitalLevelSet
        cx={cx}
        y={topY + 74}
        slots={3}
        slotWidth={22}
        slotGap={6}
        stroke={CFT_COLOR.lowRepulsion}
        electrons={t2gSlots}
        arrowHeight={22}
      />
      <text x={cx} y={topY + 106} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.fg}>
        {unpaired} unpaired
      </text>
    </g>
  )
}

function GridStepView({ grid }: { grid: readonly D4ToD7Entry[] }) {
  const colXs = [92, 210, 328, 446]
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
        High spin vs low spin across d⁴ to d⁷
      </text>

      {/* Column headers */}
      {grid.map((entry, i) => (
        <text key={entry.d} x={colXs[i]} y={60} textAnchor="middle" fontSize={17} fontWeight={700} fill={CFT_COLOR.accent}>
          {`d${toSuperscript(entry.d)}`}
        </text>
      ))}

      {/* Row 1: Weak field (high spin) */}
      <rect x={20} y={72} width={500} height={148} rx={10} fill={CFT_COLOR.raised} stroke={CFT_COLOR.border} strokeWidth={1.2} />
      <text x={32} y={94} fontSize={15} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
        Weak field (high spin, Δo &lt; P)
      </text>
      {grid.map((entry, i) => (
        <CompactConfigCell
          key={`w-${entry.d}`}
          cx={colXs[i]}
          topY={102}
          t2g={entry.weak.t2g}
          eg={entry.weak.eg}
          unpaired={entry.weak.unpaired}
        />
      ))}

      {/* Row 2: Strong field (low spin) */}
      <rect x={20} y={232} width={500} height={148} rx={10} fill={CFT_COLOR.raised} stroke={CFT_COLOR.border} strokeWidth={1.2} />
      <text x={32} y={254} fontSize={15} fontWeight={600} fill={CFT_COLOR.lowRepulsion}>
        Strong field (low spin, Δo &gt; P)
      </text>
      {grid.map((entry, i) => (
        <CompactConfigCell
          key={`s-${entry.d}`}
          cx={colXs[i]}
          topY={262}
          t2g={entry.strong.t2g}
          eg={entry.strong.eg}
          unpaired={entry.strong.unpaired}
        />
      ))}

      {/* Bottom note */}
      <text x={W / 2} y={416} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
        Strong field always gives fewer unpaired electrons
      </text>
    </g>
  )
}

export function CftHighLowSpin({ step, reducedMotion }: CftHighLowSpinProps) {
  const s = highLowStepState(step)

  if (s.kind === 'd4-to-d7-grid') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={s.ariaLabel}>
        <GridStepView grid={s.grid} />
      </svg>
    )
  }

  const tStyle: React.CSSProperties | undefined = reducedMotion
    ? undefined
    : { transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease' }

  const showBars = s.kind !== 'd1-to-d3'
  const diagCx = showBars ? 190 : 284
  const baryY = 216
  const gapPx = Math.round(132 * s.gapScale)
  const egY = Math.round(baryY - 0.6 * gapPx)
  const t2gY = Math.round(baryY + 0.4 * gapPx)

  const t2gSlots = fillSubshellSlots(s.config.t2g, 3)
  const egSlots = fillSubshellSlots(s.config.eg, 2)

  const heading =
    s.kind === 'd1-to-d3'
      ? 'First three electrons (d¹ to d³)'
      : s.kind === 'fourth-choice'
        ? 'Fourth electron: two possible routes'
        : s.kind === 'weak-high-spin'
          ? 'Weak field: high spin (d⁴)'
          : 'Strong field: low spin (d⁴)'

  const barHighlight =
    s.kind === 'weak-high-spin' ? 'delta' : s.kind === 'strong-low-spin' ? 'pairing' : 'none'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={s.ariaLabel}>
      <text x={showBars ? 190 : W / 2} y={36} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
        {heading}
      </text>

      <EnergyAxis x={36} yTop={56} yBottom={344} />

      {/* Barycentre dashed line */}
      <line
        x1={56}
        y1={baryY}
        x2={showBars ? 332 : 478}
        y2={baryY}
        stroke={CFT_COLOR.subtle}
        strokeWidth={1.4}
        strokeDasharray="6 5"
      />

      {/* Δo arrow */}
      <SplitDoubleArrow x={76} yTop={egY} yBottom={t2gY} color={CFT_COLOR.fg} transitionStyle={tStyle} />
      <text x={86} y={baryY - 6} fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        Δo
      </text>

      {/* Upper eg set */}
      <OrbitalLevelSet
        cx={diagCx}
        y={egY}
        slots={2}
        slotWidth={44}
        slotGap={16}
        stroke={CFT_COLOR.highRepulsion}
        electrons={egSlots}
        arrowHeight={30}
        transitionStyle={tStyle}
      />
      <text x={diagCx + 68} y={egY + 5} fontSize={17} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
        eg
      </text>

      {/* Lower t2g set */}
      <OrbitalLevelSet
        cx={diagCx}
        y={t2gY}
        slots={3}
        slotWidth={40}
        slotGap={12}
        stroke={CFT_COLOR.lowRepulsion}
        electrons={t2gSlots}
        arrowHeight={30}
        transitionStyle={tStyle}
      />
      <text x={diagCx + 86} y={t2gY + 5} fontSize={17} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
        t₂g
      </text>

      {/* Step 1: hovering 4th electron with two dashed routes */}
      {s.kind === 'fourth-choice' && (
        <g>
          {/* Hovering 4th electron */}
          <circle cx={diagCx - 48} cy={baryY} r={16} fill={CFT_COLOR.accentSoft} stroke={CFT_COLOR.accent} strokeWidth={1.6} />
          <ElectronSpinArrow x={diagCx - 48} cy={baryY} height={22} direction="up" color={CFT_COLOR.accent} />

          {/* Dashed path UP to eg */}
          <path
            d={`M ${diagCx - 42} ${baryY - 18} Q ${diagCx - 42} ${egY + 12} ${diagCx - 24} ${egY + 6}`}
            fill="none"
            stroke={CFT_COLOR.highRepulsion}
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <text x={diagCx + 42} y={egY + 34} fontSize={15} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
            cost Δo
          </text>

          {/* Dashed path DOWN to pair in t2g */}
          <path
            d={`M ${diagCx - 42} ${baryY + 18} Q ${diagCx - 42} ${t2gY - 18} ${diagCx - 44} ${t2gY - 12}`}
            fill="none"
            stroke={CFT_COLOR.pairing}
            strokeWidth={2}
            strokeDasharray="5 4"
          />
          <text x={diagCx + 42} y={t2gY - 26} fontSize={15} fontWeight={600} fill={CFT_COLOR.pairing}>
            cost P
          </text>
        </g>
      )}

      {/* Right panel: Δo vs P bars (Steps 1, 2, 3) */}
      {showBars && (
        <>
          <line x1={348} y1={42} x2={348} y2={364} stroke={CFT_COLOR.border} strokeWidth={1.2} />
          <DeltaVsPairingBars
            deltaFrac={s.deltaBar}
            pairingFrac={s.pairingBar}
            highlight={barHighlight}
            reducedMotion={reducedMotion}
          />
        </>
      )}

      {/* Bottom readout card */}
      <rect x={24} y={380} width={492} height={60} rx={10} fill={CFT_COLOR.raised} stroke={CFT_COLOR.border} strokeWidth={1.2} />
      {s.kind === 'd1-to-d3' && (
        <>
          <text x={W / 2} y={405} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            {`${formatOctahedralConfig(s.config.t2g, s.config.eg)}  ·  ${s.config.unpaired} unpaired electrons`}
          </text>
          <text x={W / 2} y={428} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            Hund&apos;s rule: identical arrangement in weak or strong fields
          </text>
        </>
      )}
      {s.kind === 'fourth-choice' && (
        <>
          <text x={W / 2} y={405} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            Climb to eg (cost Δo) or pair in t₂g (cost P)?
          </text>
          <text x={W / 2} y={428} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            The fourth electron takes whichever route costs less energy
          </text>
        </>
      )}
      {s.kind === 'weak-high-spin' && (
        <>
          <text x={W / 2} y={405} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
            {`${formatOctahedralConfig(s.config.t2g, s.config.eg)}  ·  ${s.config.unpaired} unpaired  ·  High spin`}
          </text>
          <text x={W / 2} y={428} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            Weak field (Δo &lt; P): cheaper to occupy eg than to pair
          </text>
        </>
      )}
      {s.kind === 'strong-low-spin' && (
        <>
          <text x={W / 2} y={405} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.lowRepulsion}>
            {`${formatOctahedralConfig(s.config.t2g, s.config.eg)}  ·  ${s.config.unpaired} unpaired  ·  Low spin`}
          </text>
          <text x={W / 2} y={428} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            Strong field (Δo &gt; P): cheaper to pair in t₂g than to climb
          </text>
        </>
      )}
    </svg>
  )
}
