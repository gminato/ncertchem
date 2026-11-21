'use client'

import { useId } from 'react'
import { Vessel, VocabDefs } from '@/components/vocab'
import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { clampTypesStep, getTypesStepSpec } from './types-steps'

export interface SolutionsNineTypesProps {
  step: number
  reducedMotion: boolean
}

const FONT = 'var(--font-sans)'

function ShadedSphere({
  cx,
  cy,
  r,
  fill,
  shadeUrl,
  stroke = 'var(--atom-rim)',
  strokeWidth = 0.9,
  fillOpacity = 1,
}: {
  cx: number
  cy: number
  r: number
  fill: string
  shadeUrl: string
  stroke?: string
  strokeWidth?: number
  fillOpacity?: number
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <circle cx={cx} cy={cy} r={r} fill={shadeUrl} style={{ pointerEvents: 'none' }} />
    </g>
  )
}

function DiatomicMolecule({
  cx,
  cy,
  angleDeg,
  r,
  fill,
  shadeUrl,
}: {
  cx: number
  cy: number
  angleDeg: number
  r: number
  fill: string
  shadeUrl: string
}) {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.cos(rad) * (r * 0.78)
  const dy = Math.sin(rad) * (r * 0.78)
  return (
    <g>
      <ShadedSphere cx={cx - dx} cy={cy - dy} r={r} fill={fill} shadeUrl={shadeUrl} />
      <ShadedSphere cx={cx + dx} cy={cy + dy} r={r} fill={fill} shadeUrl={shadeUrl} />
    </g>
  )
}

function ChloroformMolecule({
  cx,
  cy,
  angleDeg,
  shadeUrl,
}: {
  cx: number
  cy: number
  angleDeg: number
  shadeUrl: string
}) {
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`}>
      <ShadedSphere cx={-5.8} cy={4} r={3.9} fill="var(--el-Cl)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={5.8} cy={4} r={3.9} fill="var(--el-Cl)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={0} cy={-5.8} r={3.9} fill="var(--el-Cl)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={0} cy={0.3} r={4.2} fill="var(--el-C)" shadeUrl={shadeUrl} />
    </g>
  )
}

function EthanolMolecule({
  cx,
  cy,
  angleDeg,
  shadeUrl,
}: {
  cx: number
  cy: number
  angleDeg: number
  shadeUrl: string
}) {
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`}>
      <ShadedSphere cx={-6.4} cy={1.4} r={4.6} fill="var(--el-C)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={0.4} cy={-2.2} r={4.6} fill="var(--el-C)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={7.2} cy={1.4} r={4.6} fill="var(--spot-2)" shadeUrl={shadeUrl} />
    </g>
  )
}

function HexRingMolecule({
  cx,
  cy,
  r,
  angleDeg,
  fill,
  shadeUrl,
}: {
  cx: number
  cy: number
  r: number
  angleDeg: number
  fill: string
  shadeUrl: string
}) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 30 + angleDeg) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon points={pts} fill={fill} stroke="var(--atom-rim)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r * 0.72} fill={shadeUrl} opacity={0.8} />
    </g>
  )
}

/* ───────────────────────── STEP 0: HOMOGENEOUS OVERVIEW ───────────────────────── */

const MIXED_SOLVENT: readonly [number, number][] = [
  [180, 314], [216, 308], [254, 316], [292, 310], [330, 315], [368, 309], [402, 316],
  [192, 350], [234, 344], [274, 352], [314, 346], [354, 351], [392, 347],
  [182, 388], [220, 384], [260, 390], [300, 384], [340, 390], [380, 384], [406, 392],
  [198, 424], [240, 422], [282, 426], [326, 422], [368, 426],
]

const MIXED_SOLUTE: readonly [number, number][] = [
  [214, 330], [290, 332], [368, 330],
  [216, 404], [294, 406], [366, 404],
]

function HomogeneousScene({
  t,
  shadeUrl,
  uid,
}: {
  t: number
  shadeUrl: string
  uid: string
}) {
  const dropPhase1 = (t * 0.75) % 1
  const dropPhase2 = (t * 0.75 + 0.5) % 1
  const pulse = Math.sin(t * 2.2) * 1.4

  return (
    <g>
      <defs>
        <clipPath id={`${uid}-mix-clip`}>
          <rect x={152} y={288} width={276} height={164} rx={10} />
        </clipPath>
      </defs>

      {/* Left tilted Solvent flask */}
      <g transform="translate(186, 134) rotate(22)">
        <Vessel variant="flask" width={88} height={106} level={0.68} liquid />
        {[
          [-16, 20],
          [0, 14],
          [16, 22],
          [-8, 34],
          [12, 36],
        ].map(([dx, dy], i) => (
          <ShadedSphere
            key={`sf-${i}`}
            cx={dx + Math.sin(t * 1.6 + i) * 1.5}
            cy={dy + Math.cos(t * 1.4 + i) * 1.2}
            r={5.2}
            fill="var(--liquid-edge)"
            shadeUrl={shadeUrl}
          />
        ))}
      </g>
      <text x={22} y={118} fontSize={15.5} fontWeight={700} fill="var(--fg)" fontFamily={FONT}>
        Solvent
      </text>
      <text x={22} y={139} fontSize={14} fill="var(--fg-muted)" fontFamily={FONT}>
        Larger amount
      </text>
      <text x={22} y={160} fontSize={14} fontWeight={600} fill="var(--accent)" fontFamily={FONT}>
        Sets final state
      </text>

      {/* Right tilted Solute flask */}
      <g transform="translate(394, 134) rotate(-22)">
        <Vessel variant="flask" width={88} height={106} level={0.28} liquid={false} />
        {[
          [-14, 24],
          [4, 20],
          [16, 30],
          [-4, 36],
        ].map(([dx, dy], i) => (
          <HexRingMolecule
            key={`suf-${i}`}
            cx={dx + Math.cos(t * 1.5 + i) * 1.2}
            cy={dy + Math.sin(t * 1.7 + i) * 1.2}
            r={5.8}
            angleDeg={i * 22}
            fill="var(--spot-2)"
            shadeUrl={shadeUrl}
          />
        ))}
      </g>
      <text
        x={558}
        y={118}
        textAnchor="end"
        fontSize={15.5}
        fontWeight={700}
        fill="var(--fg)"
        fontFamily={FONT}
      >
        Solute
      </text>
      <text
        x={558}
        y={139}
        textAnchor="end"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily={FONT}
      >
        Smaller amount
      </text>
      <text
        x={558}
        y={160}
        textAnchor="end"
        fontSize={14}
        fontWeight={600}
        fill="var(--spot-2)"
        fontFamily={FONT}
      >
        Disperses evenly
      </text>

      {/* Pouring streams into central solution vessel */}
      <path
        d="M 210 92 Q 254 128, 268 286"
        fill="none"
        stroke="var(--liquid-edge)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
      <path
        d="M 370 92 Q 326 128, 312 286"
        fill="none"
        stroke="var(--spot-2)"
        strokeWidth={2.4}
        strokeDasharray="5 6"
        strokeLinecap="round"
        strokeOpacity={0.65}
      />

      {/* Living falling droplets along streams */}
      {[dropPhase1, dropPhase2].map((p, idx) => {
        // Quadratic Bezier interpolation from (210,92) via (254,128) to (268,286)
        const u = 1 - p
        const lx = u * u * 210 + 2 * u * p * 254 + p * p * 268
        const ly = u * u * 92 + 2 * u * p * 128 + p * p * 286
        const rx = u * u * 370 + 2 * u * p * 326 + p * p * 312
        const ry = u * u * 92 + 2 * u * p * 128 + p * p * 286
        return (
          <g key={`pour-${idx}`}>
            <ShadedSphere cx={lx} cy={ly} r={4.4} fill="var(--liquid-edge)" shadeUrl={shadeUrl} />
            <ShadedSphere cx={rx} cy={ry} r={4.2} fill="var(--spot-2)" shadeUrl={shadeUrl} />
          </g>
        )
      })}

      {/* Central large open glass solution beaker */}
      <Vessel
        variant="beaker"
        x={290}
        y={354}
        width={284}
        height={208}
        level={0.78}
        liquid
        graduated
      />

      {/* Drifting homogeneous particles inside the beaker */}
      <g clipPath={`url(#${uid}-mix-clip)`}>
        {MIXED_SOLVENT.map(([bx, by], i) => {
          const dx = Math.sin(t * 1.15 + i * 0.9) * 3.2
          const dy = Math.cos(t * 0.95 + i * 1.1) * 2.4
          return (
            <ShadedSphere
              key={`msv-${i}`}
              cx={bx + dx}
              cy={by + dy}
              r={6.2}
              fill="var(--liquid)"
              fillOpacity={0.92}
              stroke="var(--liquid-edge)"
              shadeUrl={shadeUrl}
            />
          )
        })}
        {MIXED_SOLUTE.map(([bx, by], i) => {
          const dx = Math.cos(t * 1.2 + i * 1.4) * 3.4
          const dy = Math.sin(t * 1.05 + i * 1.2) * 2.8
          return (
            <HexRingMolecule
              key={`msu-${i}`}
              cx={bx + dx}
              cy={by + dy}
              r={6.8}
              angleDeg={t * 14 * (i % 2 === 0 ? 1 : -1) + i * 25}
              fill="var(--spot-2)"
              shadeUrl={shadeUrl}
            />
          )
        })}
      </g>

      {/* Two magnifying sampling probes proving uniform ratio */}
      <g>
        <circle
          cx={215}
          cy={332}
          r={30 + pulse * 0.4}
          fill="none"
          stroke="var(--success)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <line
          x1={184}
          y1={332}
          x2={122}
          y2={332}
          stroke="var(--success)"
          strokeWidth={1.4}
          strokeOpacity={0.75}
        />
        <text
          x={116}
          y={328}
          textAnchor="end"
          fontSize={14.5}
          fontWeight={700}
          fill="var(--success)"
          fontFamily={FONT}
        >
          1 : 4
        </text>
        <text
          x={116}
          y={347}
          textAnchor="end"
          fontSize={14}
          fill="var(--fg-muted)"
          fontFamily={FONT}
        >
          top sample
        </text>

        <circle
          cx={366}
          cy={404}
          r={30 - pulse * 0.4}
          fill="none"
          stroke="var(--success)"
          strokeWidth={2}
          strokeDasharray="5 4"
        />
        <line
          x1={397}
          y1={404}
          x2={458}
          y2={404}
          stroke="var(--success)"
          strokeWidth={1.4}
          strokeOpacity={0.75}
        />
        <text
          x={464}
          y={400}
          textAnchor="start"
          fontSize={14.5}
          fontWeight={700}
          fill="var(--success)"
          fontFamily={FONT}
        >
          1 : 4
        </text>
        <text
          x={464}
          y={419}
          textAnchor="start"
          fontSize={14}
          fill="var(--fg-muted)"
          fontFamily={FONT}
        >
          base sample
        </text>
      </g>
    </g>
  )
}

/* ───────────────────────── STEP 1: GASEOUS SOLUTIONS ───────────────────────── */

const COL_CENTERS = [104, 290, 476] as const

const GAS_N2_REL: readonly [number, number, number][] = [
  [-40, -96, 24], [18, -104, -22], [44, -64, 42],
  [-32, -32, -30], [26, -18, 16], [-42, 26, 34],
  [36, 38, -26], [-22, 82, 18], [32, 92, -34],
]

const GAS_GUEST_REL: readonly [number, number][] = [
  [-6, -68], [30, -8], [-24, 52], [12, 100],
]

function GaseousScene({
  t,
  shadeUrl,
  uid,
}: {
  t: number
  shadeUrl: string
  uid: string
}) {
  const columns = [
    {
      id: 'gas-gas',
      phase: 'Gas in Gas',
      sub: 'Both gases',
    },
    {
      id: 'liquid-gas',
      phase: 'Liquid in Gas',
      sub: 'Vapourised liquid',
    },
    {
      id: 'solid-gas',
      phase: 'Solid in Gas',
      sub: 'Sublimed solid',
    },
  ] as const

  const cy = 262
  const w = 136
  const h = 264

  return (
    <g>
      {columns.map((col, colIdx) => {
        const cx = COL_CENTERS[colIdx]
        const clipId = `${uid}-gas-${col.id}`
        return (
          <g key={col.id}>
            <defs>
              <clipPath id={clipId}>
                <rect x={cx - w / 2 + 2} y={cy - h / 2 + 2} width={w - 4} height={h - 4} rx={8} />
              </clipPath>
            </defs>

            {/* Phase pair header */}
            <text
              x={cx}
              y={104}
              textAnchor="middle"
              fontSize={14.5}
              fontWeight={700}
              fill="var(--accent)"
              fontFamily={FONT}
            >
              {col.phase}
            </text>

            {/* Open-air glass gas cylinder */}
            <Vessel variant="cylinder" x={cx} y={cy} width={w} height={h} liquid={false} />

            {/* Soft vapour tint + animated gas molecules */}
            <g clipPath={`url(#${clipId})`}>
              <rect
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                fill="var(--vapour)"
                fillOpacity={0.18}
              />

              {GAS_N2_REL.map(([rx, ry, ang], i) => {
                const dx = Math.sin(t * 1.85 + i * 1.3 + colIdx) * 7.5
                const dy = Math.cos(t * 1.55 + i * 1.7 + colIdx) * 6.5
                const rot = ang + Math.sin(t * 1.4 + i) * 18
                return (
                  <DiatomicMolecule
                    key={`n2-${i}`}
                    cx={cx + rx + dx}
                    cy={cy + ry + dy}
                    angleDeg={rot}
                    r={4.7}
                    fill="var(--el-N)"
                    shadeUrl={shadeUrl}
                  />
                )
              })}

              {GAS_GUEST_REL.map(([rx, ry], i) => {
                const dx = Math.cos(t * 1.65 + i * 1.9 + colIdx) * 6.5
                const dy = Math.sin(t * 1.35 + i * 1.4 + colIdx) * 6
                const px = cx + rx + dx
                const py = cy + ry + dy

                if (col.id === 'gas-gas') {
                  return (
                    <DiatomicMolecule
                      key={`g-${i}`}
                      cx={px}
                      cy={py}
                      angleDeg={-25 + i * 38 + t * 20}
                      r={5}
                      fill="var(--el-O)"
                      shadeUrl={shadeUrl}
                    />
                  )
                }
                if (col.id === 'liquid-gas') {
                  return (
                    <ChloroformMolecule
                      key={`g-${i}`}
                      cx={px}
                      cy={py}
                      angleDeg={i * 35 + Math.sin(t + i) * 18}
                      shadeUrl={shadeUrl}
                    />
                  )
                }
                return (
                  <HexRingMolecule
                    key={`g-${i}`}
                    cx={px}
                    cy={py}
                    r={7.6}
                    angleDeg={i * 25 + t * 14}
                    fill="var(--spot-3)"
                    shadeUrl={shadeUrl}
                  />
                )
              })}
            </g>

            {/* Clean chemical label below */}
            <text
              x={cx}
              y={426}
              textAnchor="middle"
              fontSize={15.5}
              fontWeight={700}
              fill="var(--fg)"
              fontFamily={FONT}
            >
              {col.id === 'gas-gas' && (
                <>
                  O<Sub>2</Sub> in N<Sub>2</Sub> (Air)
                </>
              )}
              {col.id === 'liquid-gas' && (
                <>
                  CHCl<Sub>3</Sub> in N<Sub>2</Sub>
                </>
              )}
              {col.id === 'solid-gas' && (
                <>
                  Camphor in N<Sub>2</Sub>
                </>
              )}
            </text>
            <text
              x={cx}
              y={449}
              textAnchor="middle"
              fontSize={14}
              fill="var(--fg-muted)"
              fontFamily={FONT}
            >
              {col.sub}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ───────────────────────── STEP 2: LIQUID SOLUTIONS ───────────────────────── */

const LIQ_WATER_REL: readonly [number, number][] = [
  [-44, -40], [-14, -44], [18, -38], [46, -42],
  [-36, -6], [-4, -10], [28, -4], [48, 0],
  [-46, 30], [-16, 26], [16, 32], [44, 28],
  [-34, 64], [-2, 62], [30, 66],
  [-42, 96], [-8, 98], [26, 94], [46, 98],
]

const LIQ_GUEST_REL: readonly [number, number][] = [
  [-24, -22], [28, -20], [0, 14], [-26, 48], [26, 52], [-4, 82],
]

function LiquidScene({
  t,
  shadeUrl,
  uid,
}: {
  t: number
  shadeUrl: string
  uid: string
}) {
  const columns = [
    { id: 'gas-liquid', phase: 'Gas in Liquid', sub: 'Dissolved gas' },
    { id: 'liquid-liquid', phase: 'Liquid in Liquid', sub: 'Miscible blend' },
    { id: 'solid-liquid', phase: 'Solid in Liquid', sub: 'Dissolved solid' },
  ] as const

  const cy = 264
  const w = 140
  const h = 250

  return (
    <g>
      {columns.map((col, colIdx) => {
        const cx = COL_CENTERS[colIdx]
        const clipId = `${uid}-liq-${col.id}`
        return (
          <g key={col.id}>
            <defs>
              <clipPath id={clipId}>
                <rect x={cx - w / 2 + 2} y={cy - h / 2 + 64} width={w - 4} height={h - 68} rx={8} />
              </clipPath>
            </defs>

            <text
              x={cx}
              y={104}
              textAnchor="middle"
              fontSize={14.5}
              fontWeight={700}
              fill="var(--accent)"
              fontFamily={FONT}
            >
              {col.phase}
            </text>

            {/* Real Vessel beaker with meniscus, glass sheen & graduation marks */}
            <Vessel
              variant="beaker"
              x={cx}
              y={cy}
              width={w}
              height={h}
              level={0.76}
              liquid
              graduated
            />

            {/* Dispersed particles inside the liquid volume */}
            <g clipPath={`url(#${clipId})`}>
              {LIQ_WATER_REL.map(([rx, ry], i) => {
                const dx = Math.sin(t * 1.1 + i * 0.8 + colIdx) * 2.4
                const dy = Math.cos(t * 0.9 + i * 1.1 + colIdx) * 2
                return (
                  <ShadedSphere
                    key={`h2o-${i}`}
                    cx={cx + rx + dx}
                    cy={cy + ry + dy}
                    r={5.4}
                    fill="var(--liquid)"
                    fillOpacity={0.9}
                    stroke="var(--liquid-edge)"
                    shadeUrl={shadeUrl}
                  />
                )
              })}

              {LIQ_GUEST_REL.map(([rx, ry], i) => {
                const dx = Math.cos(t * 1.2 + i * 1.3 + colIdx) * 3.2
                const dy =
                  col.id === 'gas-liquid'
                    ? Math.sin(t * 1.4 + i) * 4.5
                    : Math.sin(t * 1.0 + i * 1.5) * 2.6
                const px = cx + rx + dx
                const py = cy + ry + dy

                if (col.id === 'gas-liquid') {
                  return (
                    <DiatomicMolecule
                      key={`lg-${i}`}
                      cx={px}
                      cy={py}
                      angleDeg={i * 34 + Math.sin(t + i) * 14}
                      r={4.2}
                      fill="var(--el-O)"
                      shadeUrl={shadeUrl}
                    />
                  )
                }
                if (col.id === 'liquid-liquid') {
                  return (
                    <EthanolMolecule
                      key={`lg-${i}`}
                      cx={px}
                      cy={py}
                      angleDeg={i * 28 + Math.sin(t * 0.8 + i) * 12}
                      shadeUrl={shadeUrl}
                    />
                  )
                }
                return (
                  <HexRingMolecule
                    key={`lg-${i}`}
                    cx={px}
                    cy={py}
                    r={7.2}
                    angleDeg={i * 18 + Math.sin(t * 0.7 + i) * 10}
                    fill="var(--spot-3)"
                    shadeUrl={shadeUrl}
                  />
                )
              })}
            </g>

            {/* Clean chemical label below */}
            <text
              x={cx}
              y={426}
              textAnchor="middle"
              fontSize={15.5}
              fontWeight={700}
              fill="var(--fg)"
              fontFamily={FONT}
            >
              {col.id === 'gas-liquid' && (
                <>
                  O<Sub>2</Sub> in H<Sub>2</Sub>O
                </>
              )}
              {col.id === 'liquid-liquid' && (
                <>
                  Ethanol in H<Sub>2</Sub>O
                </>
              )}
              {col.id === 'solid-liquid' && (
                <>
                  Glucose in H<Sub>2</Sub>O
                </>
              )}
            </text>
            <text
              x={cx}
              y={449}
              textAnchor="middle"
              fontSize={14}
              fill="var(--fg-muted)"
              fontFamily={FONT}
            >
              {col.sub}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ───────────────────────── STEP 3: SOLID SOLUTIONS ───────────────────────── */

const LATTICE_COLS = [-51, -17, 17, 51] as const
const LATTICE_ROWS = [-76, -26, 24, 74] as const
const SUBSTITUTED_SITES = new Set([2, 5, 10, 13])

function SolidScene({ t, shadeUrl }: { t: number; shadeUrl: string }) {
  const columns = [
    {
      id: 'gas-solid',
      phase: 'Gas in Solid',
      sub: 'Interstitial voids',
      hostFill: 'var(--el-other)',
    },
    {
      id: 'liquid-solid',
      phase: 'Liquid in Solid',
      sub: 'Sodium amalgam',
      hostFill: 'var(--el-Na)',
    },
    {
      id: 'solid-solid',
      phase: 'Solid in Solid',
      sub: 'Substitutional alloy',
      hostFill: 'var(--spot-4)',
    },
  ] as const

  const cy = 264

  return (
    <g>
      {columns.map((col, colIdx) => {
        const cx = COL_CENTERS[colIdx]
        return (
          <g key={col.id}>
            <text
              x={cx}
              y={104}
              textAnchor="middle"
              fontSize={14.5}
              fontWeight={700}
              fill="var(--accent)"
              fontFamily={FONT}
            >
              {col.phase}
            </text>

            {/* Subtle crystal unit-cell frame (no heavy card box) */}
            <rect
              x={cx - 72}
              y={cy - 102}
              width={144}
              height={202}
              rx={12}
              fill="var(--surface-raised)"
              fillOpacity={0.45}
              stroke="var(--border)"
              strokeWidth={1.2}
              strokeDasharray="5 4"
            />

            {/* Crystal lattice bond grid */}
            {LATTICE_ROWS.map((ry, rIdx) => (
              <line
                key={`lr-${rIdx}`}
                x1={cx + LATTICE_COLS[0]}
                y1={cy + ry}
                x2={cx + LATTICE_COLS[LATTICE_COLS.length - 1]}
                y2={cy + ry}
                stroke="var(--border)"
                strokeWidth={1.5}
              />
            ))}
            {LATTICE_COLS.map((lx, cIdx) => (
              <line
                key={`lc-${cIdx}`}
                x1={cx + lx}
                y1={cy + LATTICE_ROWS[0]}
                x2={cx + lx}
                y2={cy + LATTICE_ROWS[LATTICE_ROWS.length - 1]}
                stroke="var(--border)"
                strokeWidth={1.5}
              />
            ))}

            {/* Ordered 3D metallic lattice spheres with subtle thermal vibration */}
            {LATTICE_ROWS.map((ry, rIdx) =>
              LATTICE_COLS.map((lx, cIdx) => {
                const flatIdx = rIdx * LATTICE_COLS.length + cIdx
                const isGuest =
                  (col.id === 'liquid-solid' || col.id === 'solid-solid') &&
                  SUBSTITUTED_SITES.has(flatIdx)
                const atomFill = isGuest
                  ? col.id === 'solid-solid'
                    ? 'var(--el-Cu)'
                    : 'var(--spot-2)'
                  : col.hostFill
                const vibX = Math.sin(t * 7.5 + flatIdx * 2.1 + colIdx) * 0.65
                const vibY = Math.cos(t * 6.8 + flatIdx * 1.7 + colIdx) * 0.65
                const radius = isGuest && col.id === 'liquid-solid' ? 10.6 : 12

                return (
                  <ShadedSphere
                    key={`at-${flatIdx}`}
                    cx={cx + lx + vibX}
                    cy={cy + ry + vibY}
                    r={radius}
                    fill={atomFill}
                    shadeUrl={shadeUrl}
                    stroke={isGuest ? 'var(--fg)' : 'var(--atom-rim)'}
                    strokeWidth={isGuest ? 1.2 : 1}
                  />
                )
              }),
            )}

            {/* Interstitial H atoms nestled inside Pd voids */}
            {col.id === 'gas-solid' &&
              [0, 1, 2].flatMap((ci) =>
                [0, 1, 2].map((ri) => {
                  if ((ci + ri) % 2 !== 0) return null
                  const ix = (LATTICE_COLS[ci] + LATTICE_COLS[ci + 1]) / 2
                  const iy = (LATTICE_ROWS[ri] + LATTICE_ROWS[ri + 1]) / 2
                  const vibX = Math.sin(t * 9 + ci * 2 + ri) * 1.1
                  const vibY = Math.cos(t * 8.4 + ri * 3 + ci) * 1.1
                  return (
                    <ShadedSphere
                      key={`h-${ci}-${ri}`}
                      cx={cx + ix + vibX}
                      cy={cy + iy + vibY}
                      r={5.8}
                      fill="var(--el-H)"
                      shadeUrl={shadeUrl}
                      stroke="var(--accent)"
                      strokeWidth={1.5}
                    />
                  )
                }),
              )}

            {/* Clean chemical label below */}
            <text
              x={cx}
              y={426}
              textAnchor="middle"
              fontSize={15.5}
              fontWeight={700}
              fill="var(--fg)"
              fontFamily={FONT}
            >
              {col.id === 'gas-solid' && (
                <>
                  H<Sub>2</Sub> in Pd
                </>
              )}
              {col.id === 'liquid-solid' && 'Hg in Na'}
              {col.id === 'solid-solid' && 'Cu in Au'}
            </text>
            <text
              x={cx}
              y={449}
              textAnchor="middle"
              fontSize={14}
              fill="var(--fg-muted)"
              fontFamily={FONT}
            >
              {col.sub}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/* ───────────────────────── MAIN COMPONENT ───────────────────────── */

export function SolutionsNineTypes({ step, reducedMotion }: SolutionsNineTypesProps) {
  const index = clampTypesStep(step)
  const spec = getTypesStepSpec(index)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const shadeUrl = `url(#${uid}-sphere-shading)`

  const t = useAmbientTime(reducedMotion)

  // Smooth cross-fade weights across the 4 steps
  const w0 = useTweenedNumber(index === 0 ? 1 : 0, reducedMotion, 0.45)
  const w1 = useTweenedNumber(index === 1 ? 1 : 0, reducedMotion, 0.45)
  const w2 = useTweenedNumber(index === 2 ? 1 : 0, reducedMotion, 0.45)
  const w3 = useTweenedNumber(index === 3 ? 1 : 0, reducedMotion, 0.45)

  return (
    <svg
      viewBox="0 0 580 540"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={spec.ariaLabel}
      data-testid="solutions-nine-types"
      data-step={index}
    >
      <VocabDefs idPrefix={uid} />

      {/* Clean editorial stage title (borderless, no step pill) */}
      <text
        x={290}
        y={34}
        textAnchor="middle"
        fontSize={17.5}
        fontWeight={700}
        fill="var(--fg)"
        fontFamily={FONT}
      >
        {index === 0 && 'Homogeneous Binary Solution'}
        {index === 1 && (
          <>
            Gaseous Solutions · N<Sub>2</Sub> Solvent
          </>
        )}
        {index === 2 && (
          <>
            Liquid Solutions · H<Sub>2</Sub>O Solvent
          </>
        )}
        {index === 3 && 'Solid Solutions · Metal Crystal Lattice'}
      </text>

      {/* Smoothly morphing visual layers */}
      {w0 > 0.01 && (
        <g opacity={w0} transform={`translate(0, ${((1 - w0) * 10).toFixed(1)})`}>
          <HomogeneousScene t={t} shadeUrl={shadeUrl} uid={uid} />
        </g>
      )}
      {w1 > 0.01 && (
        <g opacity={w1} transform={`translate(0, ${((1 - w1) * 10).toFixed(1)})`}>
          <GaseousScene t={t} shadeUrl={shadeUrl} uid={uid} />
        </g>
      )}
      {w2 > 0.01 && (
        <g opacity={w2} transform={`translate(0, ${((1 - w2) * 10).toFixed(1)})`}>
          <LiquidScene t={t} shadeUrl={shadeUrl} uid={uid} />
        </g>
      )}
      {w3 > 0.01 && (
        <g opacity={w3} transform={`translate(0, ${((1 - w3) * 10).toFixed(1)})`}>
          <SolidScene t={t} shadeUrl={shadeUrl} />
        </g>
      )}

      {/* Subtle hairline divider above single-line working summary */}
      <line
        x1={56}
        y1={486}
        x2={524}
        y2={486}
        stroke="var(--border)"
        strokeWidth={1}
        strokeOpacity={0.7}
      />

      {/* Understated single-line scientific footer */}
      <text
        x={290}
        y={514}
        textAnchor="middle"
        fontSize={14.5}
        fontWeight={600}
        fill="var(--fg-muted)"
        fontFamily={FONT}
      >
        {index === 0 && '3 solute states × 3 solvent states = 9 binary solution types'}
        {index === 1 && (
          <>
            Gas solvent (N<Sub>2</Sub>) → single gaseous phase for all three mixtures
          </>
        )}
        {index === 2 && (
          <>
            Liquid solvent (H<Sub>2</Sub>O) → single liquid phase for all three mixtures
          </>
        )}
        {index === 3 && 'Solid metal solvent → guests fill interstitial voids or lattice sites'}
      </text>
    </svg>
  )
}
