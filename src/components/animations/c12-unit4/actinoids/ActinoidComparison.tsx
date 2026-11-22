'use client'

import type { ReactNode } from 'react'
import { PlotFrame } from '@/components/vocab'
import { makePlotScale } from '@/components/vocab/kinetics'
import { ConfigurationBoxes, configurationLayout } from '@/components/vocab/dblock'
import { NCERT_ACTINOIDS } from '@/lib/chem/ncert-c12-unit4-tables'
import {
  CONFIG_ROW_SYMBOLS,
  STEP_COUNT,
  actinoidLadder,
  actinoidPmPerStep,
  actinoidRadiusPoints,
  actinoidSubshells,
  lanthanoidLadder,
  lanthanoidPmPerStep,
  lanthanoidRadiusPoints,
  type LadderCell,
  type RadiusPoint,
} from './actinoid-steps'

export interface ActinoidComparisonProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 600

const LN = 'var(--db-ln)'
const AN = 'var(--db-an)'
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const GRID = 'var(--kin-grid)'

const STEP_LABELS = [
  'Actinoids are all radioactive: fourteen tiles from thorium to lawrencium',
  'Electron configurations of six actinoids: 5f and 6d boxes against the 7s pair',
  'M³⁺ radii against position in the f-series, lanthanoids and actinoids side by side',
  'Oxidation states of the lanthanoids (Table 4.9) and actinoids (Table 4.11) as ladders',
  'Schematic radial extent of 4f and 5f orbitals, with the bonding and hydrolysis notes',
]

/** Format a per-step slope from the lib to one decimal place (half-up). */
function oneDecimal(v: number): string {
  return (Math.floor(v * 10 + 0.5) / 10).toFixed(1)
}

function Note({ x, y, children, anchor = 'start', fill = FG, size = 15 }: {
  x: number
  y: number
  children: ReactNode
  anchor?: 'start' | 'middle' | 'end'
  fill?: string
  size?: number
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fill={fill}>
      {children}
    </text>
  )
}

/** Step 1: every member is radioactive. Tiles are tinted with the actinoid tone; bars are schematic. */
function RadioactivityStep() {
  const members = NCERT_ACTINOIDS.filter((r) => r.Z >= 90)
  const TILE_W = 72
  const TILE_H = 120
  const GAP = 10
  const X0 = (W - (7 * TILE_W + 6 * GAP)) / 2
  return (
    <>
      <Note x={W / 2} y={62} anchor="middle" size={22}>
        None of the fourteen is stable
      </Note>
      {members.map((r, i) => {
        const col = i % 7
        const row = Math.floor(i / 7)
        const x = X0 + col * (TILE_W + GAP)
        const y = 110 + row * 190
        const barW = TILE_W - 16
        const frac = 1 - (0.8 * i) / (members.length - 1)
        return (
          <g key={r.symbol}>
            <rect x={x} y={y} width={TILE_W} height={TILE_H} rx={10} fill={AN} fillOpacity={0.14} stroke={AN} strokeWidth={1.6} />
            <text x={x + TILE_W / 2} y={y + 46} textAnchor="middle" fontSize={26} fontWeight={600} fill={FG}>
              {r.symbol}
            </text>
            <text x={x + TILE_W / 2} y={y + 70} textAnchor="middle" fontSize={14} fill={MUTED}>
              {`Z ${r.Z}`}
            </text>
            <rect x={x + 8} y={y + 92} width={barW} height={8} rx={4} fill={MUTED} fillOpacity={0.2} />
            <rect x={x + 8} y={y + 92} width={barW * frac} height={8} rx={4} fill={AN} />
          </g>
        )
      })}
      <Note x={W / 2} y={500} anchor="middle">
        Bar length is schematic: a longer bar means a longer-lived member.
      </Note>
      <Note x={W / 2} y={526} anchor="middle" fill={MUTED}>
        No half-life values are shown.
      </Note>
    </>
  )
}

/** Step 2: configurations. Each row ends with the 7s pair; the 5f boxes are outlined. Thorium has no 5f box. */
function ConfigurationsStep() {
  const ROW_W = 470
  const MAX = 28
  const X = 100
  return (
    <>
      <Note x={30} y={44} size={18}>
        Configurations (Table 4.10)
      </Note>
      {CONFIG_ROW_SYMBOLS.map((symbol, i) => {
        const config = actinoidSubshells(symbol)
        const layout = configurationLayout(config, ROW_W, MAX)
        const y = 84 + i * 82
        return (
          <g key={symbol}>
            <text x={30} y={y + layout.height / 2 + 7} fontSize={22} fontWeight={600} fill={AN}>
              {symbol}
            </text>
            <ConfigurationBoxes x={X} y={y} width={ROW_W} maxSize={MAX} fontSize={14} config={config} highlight={{ subshell: '5f' }} />
          </g>
        )
      })}
      <Note x={30} y={580} fill={MUTED}>
        Outlined: 5f. Each row ends with 7s². Inner [Rn] core not drawn.
      </Note>
    </>
  )
}

/** Step 3: M³⁺ radii on one f-series axis, with the lanthanoid series in its tone and the actinoid series in its own. */
function RadiiStep() {
  const FRAME = { x: 80, y: 74, width: 468, height: 300 }
  const DOMAIN = { xMin: -0.5, xMax: 14.5, yMin: 80, yMax: 115 }
  const scale = makePlotScale(DOMAIN, { left: FRAME.x, top: FRAME.y, width: FRAME.width, height: FRAME.height })
  const ln = lanthanoidRadiusPoints()
  const an = actinoidRadiusPoints()
  const lnDrawn = ln.filter((p): p is RadiusPoint & { pm: number } => p.pm !== null)
  const anDrawn = an.filter((p): p is RadiusPoint & { pm: number } => p.pm !== null)

  const path = (pts: Array<{ pos: number; pm: number }>, joinAdjacentOnly: boolean) => {
    let d = ''
    pts.forEach((p, i) => {
      const prev = pts[i - 1]
      const join = prev !== undefined && (!joinAdjacentOnly || prev.pos + 1 === p.pos)
      d += `${i === 0 || !join ? 'M' : 'L'}${scale.x(p.pos)} ${scale.y(p.pm)} `
    })
    return d
  }

  return (
    <>
      <circle cx={34} cy={34} r={7} fill={LN} />
      <Note x={48} y={40} size={15}>Ln³⁺, Table 4.9</Note>
      <circle cx={210} cy={34} r={7} fill={AN} />
      <Note x={224} y={40} size={15}>M³⁺ of the actinoids, Table 4.10</Note>
      <PlotFrame
        x={FRAME.x}
        y={FRAME.y}
        width={FRAME.width}
        height={FRAME.height}
        domain={DOMAIN}
        xTicks={[0, 2, 4, 6, 8, 10, 12, 14]}
        yTicks={[80, 90, 100, 110]}
        xTitle="f-series position (La or Ac = 0; Ce or Th = 1)"
        yTitle="radius / pm"
      >
        <path d={path(lnDrawn, false)} fill="none" stroke={LN} strokeWidth={2.6} />
        <path d={path(anDrawn, true)} fill="none" stroke={AN} strokeWidth={2.6} />
        {lnDrawn.map((p) => (
          <circle key={`ln-${p.symbol}`} cx={scale.x(p.pos)} cy={scale.y(p.pm)} r={5.5} fill={LN} stroke={SURFACE} strokeWidth={1.5} />
        ))}
        {anDrawn.map((p) => (
          <circle key={`an-${p.symbol}`} cx={scale.x(p.pos)} cy={scale.y(p.pm)} r={5.5} fill={AN} stroke={SURFACE} strokeWidth={1.5} />
        ))}
        <Note x={scale.x(8.4)} y={scale.y(113)} fill={LN}>
          {`Ln: about ${oneDecimal(lanthanoidPmPerStep())} pm per step`}
        </Note>
        <Note x={scale.x(8.4)} y={scale.y(107.5)} fill={AN}>
          {`An: about ${oneDecimal(actinoidPmPerStep())} pm per step`}
        </Note>
        <Note x={scale.x(1.5)} y={scale.y(82)} anchor="middle" fill={MUTED}>
          Th, Pa: not printed
        </Note>
        <Note x={scale.x(14)} y={scale.y(82)} anchor="end" fill={MUTED}>
          Lu: not printed
        </Note>
      </PlotFrame>
      <Note x={30} y={470} fill={FG}>
        NCERT says the actinoid contraction is steeper from element
      </Note>
      <Note x={30} y={496} fill={FG}>
        to element, because 5f electrons shield poorly. The printed
      </Note>
      <Note x={30} y={522} fill={FG}>
        M³⁺ radii do not clearly show that. Es to Lr print a dash.
      </Note>
    </>
  )
}

/** Oxidation-state ladders: lanthanoids (Table 4.9) above, actinoids (Table 4.11) below. */
function StatesStep() {
  const lnCells = lanthanoidLadder()
  const anCells = actinoidLadder()
  const LN_X0 = 110
  const LN_COL = 30
  const AN_X0 = 112
  const AN_COL = 32
  const lnSymbols = [...new Set(lnCells.map((c) => c.symbol))]
  const anSymbols = [...new Set(anCells.map((c) => c.symbol))]
  const lnRows = [4, 3, 2]
  const anRows = [7, 6, 5, 4, 3]
  const lnY = (state: number) => 110 + (4 - state) * 40
  const anY = (state: number) => 370 + (7 - state) * 44
  const lnX = (pos: number) => LN_X0 + pos * LN_COL + LN_COL / 2
  const anX = (pos: number) => AN_X0 + (pos - 1) * AN_COL + AN_COL / 2

  const dot = (c: LadderCell, x: number, y: number, tone: string) =>
    c.hollow ? (
      <circle key={`${c.symbol}-${c.state}`} cx={x} cy={y} r={8} fill={SURFACE} stroke={tone} strokeWidth={2} />
    ) : (
      <circle key={`${c.symbol}-${c.state}`} cx={x} cy={y} r={8} fill={tone} />
    )

  return (
    <>
      <Note x={30} y={40} size={18}>Lanthanoids, Table 4.9</Note>
      {lnSymbols.map((s, i) => (
        <Note key={s} x={LN_X0 + i * LN_COL + LN_COL / 2} y={74} anchor="middle" fill={MUTED} size={14}>
          {s}
        </Note>
      ))}
      {lnRows.map((state) => (
        <g key={`ln-row-${state}`}>
          <Note x={96} y={lnY(state) + 5} anchor="end" fill={MUTED}>{`+${state}`}</Note>
          <line x1={LN_X0} x2={LN_X0 + lnSymbols.length * LN_COL} y1={lnY(state)} y2={lnY(state)} stroke={GRID} strokeWidth={1} />
        </g>
      ))}
      {lnCells.map((c) => {
        const cx = lnX(c.pos)
        return dot(c, cx, lnY(c.state), LN)
      })}
      <Note x={30} y={226} fill={MUTED}>
        Hollow dots: Ln²⁺ configurations printed in Table 4.9.
      </Note>

      <Note x={30} y={300} size={18}>Actinoids, Table 4.11</Note>
      {anSymbols.map((s, i) => (
        <Note key={s} x={AN_X0 + i * AN_COL + AN_COL / 2} y={336} anchor="middle" fill={MUTED} size={14}>
          {s}
        </Note>
      ))}
      {anRows.map((state) => (
        <g key={`an-row-${state}`}>
          <Note x={96} y={anY(state) + 5} anchor="end" fill={MUTED}>{`+${state}`}</Note>
          <line x1={AN_X0} x2={AN_X0 + anSymbols.length * AN_COL} y1={anY(state)} y2={anY(state)} stroke={GRID} strokeWidth={1} />
        </g>
      ))}
      {anCells.map((c) => dot(c, anX(c.pos), anY(c.state), AN))}
      <Note x={30} y={572} fill={FG}>
        Np and Pu both reach +7; from Cf on, only +3 is printed.
      </Note>
    </>
  )
}

/** Step 4: 4f and 5f radial sketches (schematic) and the bonding and hydrolysis notes. */
function RadialStep() {
  const PANELS = [
    { x: 14, tone: LN, title: '4f, lanthanoids', r0: 52, s: 18 },
    { x: 296, tone: AN, title: '5f, actinoids', r0: 84, s: 30 },
  ]
  const TOP = 70
  const BASE = 250
  const PW = 270
  const PH = 260
  const curve = (cx: number, r0: number, s: number) => {
    let d = ''
    for (let r = 0; r <= 240; r += 2) {
      const amp = 130 * Math.exp(-((r - r0) ** 2) / (2 * s * s))
      d += `${r === 0 ? 'M' : 'L'}${cx + r} ${BASE - amp} `
    }
    return d
  }
  return (
    <>
      {PANELS.map((p) => {
        const cx = p.x + 16
        return (
          <g key={p.title}>
            <rect x={p.x} y={TOP} width={PW} height={PH} rx={10} fill={SURFACE} fillOpacity={0.55} stroke={GRID} strokeWidth={1} />
            <Note x={p.x + 14} y={TOP + 28} size={16} fill={p.tone}>{p.title}</Note>
            <path d={`${curve(cx, p.r0, p.s)} L${cx + 240} ${BASE} L${cx} ${BASE} Z`} fill={p.tone} fillOpacity={0.18} />
            <path d={curve(cx, p.r0, p.s)} fill="none" stroke={p.tone} strokeWidth={2.6} />
            <line x1={cx} x2={cx + 244} y1={BASE} y2={BASE} stroke={MUTED} strokeWidth={1.2} />
            <circle cx={cx} cy={BASE} r={7} fill={FG} />
            <Note x={p.x + PW / 2} y={TOP + PH - 14} anchor="middle" fill={MUTED} size={14}>
              distance from nucleus (schematic)
            </Note>
          </g>
        )
      })}
      <Note x={30} y={372} fill={FG}>
        The 5f orbitals resemble the 4f orbitals in shape, but they
      </Note>
      <Note x={30} y={398} fill={FG}>
        reach further out. Less buried, they are held less firmly and
      </Note>
      <Note x={30} y={424} fill={FG}>
        are more available for bonding. Early actinoid ionisation
      </Note>
      <Note x={30} y={450} fill={FG}>
        enthalpies are lower than early lanthanoid ones (values not shown).
      </Note>
      <rect x={30} y={474} width={170} height={44} rx={10} fill={AN} fillOpacity={0.16} stroke={AN} strokeWidth={1.6} />
      <Note x={115} y={502} anchor="middle" fill={FG} size={16}>M³⁺ and M⁴⁺</Note>
      <line x1={206} x2={266} y1={496} y2={496} stroke={MUTED} strokeWidth={2} />
      <path d="M266 490 L278 496 L266 502 Z" fill={MUTED} />
      <Note x={290} y={502} fill={FG}>hydrolyse in water</Note>
      <Note x={30} y={560} fill={MUTED}>Schematic, not to scale.</Note>
    </>
  )
}

const STEPS = [RadioactivityStep, ConfigurationsStep, RadiiStep, StatesStep, RadialStep]

export function ActinoidComparison({ step }: ActinoidComparisonProps) {
  const index = Math.min(Math.max(Math.round(step), 0), STEP_COUNT - 1)
  const Body = STEPS[index]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={STEP_LABELS[index]}>
      <Body />
    </svg>
  )
}
