'use client'

import { Sub } from '@/components/animations/c12-unit1/ChemSvg'
import { EnergyCycle, energyDomain, oxoanionBounds, oxoanionGeometry, SERIES_TONE, type EnergyStep } from '@/components/vocab/dblock'
import { PlotFrame, PlotLine, usePlotScale } from '@/components/vocab/kinetics'
import { formatVolt } from '@/lib/chem/dblock'
import {
  BELOW_TREND,
  THREE_D,
  cycleBars,
  highestHalides,
  plotX,
  potentialM2,
  potentialM3M2,
  signedKj,
  signedVolt,
} from './electrode-steps'

export interface ElectrodePotentialCycleProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 540
const TONE = SERIES_TONE['3d']
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SZ = 14
const CURVE_FRAME = { x: 78, y: 20, width: 480, height: 380 }
const E2_DOMAIN = { xMin: 0.5, xMax: 10.5, yMin: -2, yMax: 0.6 }
const E3_DOMAIN = { xMin: 0.5, xMax: 10.5, yMin: -0.8, yMax: 2.2 }
const X_TICKS = THREE_D.map((_, i) => i + 1)
const BAR_UNIT = 28
const HALIDE_METALS = ['Ti', 'V', 'Cr', 'Mn'] as const

const symbolAt = (v: number) => THREE_D[Math.round(v) - 1] ?? ''
const tickNumber = (v: number) => String(Number(v.toFixed(2))).replace('-', '−')

const ZN_SPECIES = ['Zn(s)', 'Zn(g)', 'Zn²⁺(g)', 'Zn²⁺(aq)']
const CU_SPECIES = ['Cu(s)', 'Cu(g)', 'Cu²⁺(g)', 'Cu²⁺(aq)']

/** The three Table 4.4 bars of a cycle as EnergyCycle steps (up = endothermic). */
function cycleSteps(symbol: string): EnergyStep[] {
  const [atom, ionise, hydr] = cycleBars(symbol)
  return [
    { name: <>Δ<Sub>a</Sub>H</>, value: atom, text: signedKj(atom) },
    { name: 'IE₁ + IE₂', value: ionise, text: signedKj(ionise) },
    { name: <>Δ<Sub>hyd</Sub>H</>, value: hydr, text: signedKj(hydr) },
  ]
}

function netOf(symbol: string) {
  const bars = cycleBars(symbol)
  const sum = bars.reduce((a, b) => a + b, 0)
  return { name: 'Net', value: sum, text: signedKj(sum) }
}

/** A metal's point on a plot, in data coordinates. */
function Dot({ x, y, ring = false, halo = false, label, dx = 10, dy = 20, anchor = 'start' }: {
  x: number
  y: number
  ring?: boolean
  halo?: boolean
  label?: string
  dx?: number
  dy?: number
  anchor?: 'start' | 'middle' | 'end'
}) {
  const s = usePlotScale()
  const cx = s.x(x)
  const cy = s.y(y)
  return (
    <g>
      {halo && <circle cx={cx} cy={cy} r={11} fill="none" stroke="var(--accent)" strokeWidth={2} />}
      <circle cx={cx} cy={cy} r={ring ? 8 : 6} fill={ring ? 'var(--surface)' : TONE} stroke={TONE} strokeWidth={2.4} />
      {label !== undefined && (
        <text x={cx + dx} y={cy + dy} textAnchor={anchor} fontSize={SZ} style={{ fill: INK }}>
          {label}
        </text>
      )}
    </g>
  )
}

/** A straight piece of the 3d series line, joined only within the series. */
function Segment({ from, to }: { from: [number, number]; to: [number, number] }) {
  const s = usePlotScale()
  return (
    <line
      x1={s.x(from[0])}
      y1={s.y(from[1])}
      x2={s.x(to[0])}
      y2={s.y(to[1])}
      style={{ stroke: TONE, strokeWidth: 2.4, strokeLinecap: 'round' }}
    />
  )
}

/** A bar from zero to the value, one slot wide. */
function Bar({ x, value, label }: { x: number; value: number; label: string }) {
  const s = usePlotScale()
  const left = s.x(x - 0.28)
  const right = s.x(x + 0.28)
  const top = s.y(Math.max(value, 0))
  const bottom = s.y(Math.min(value, 0))
  const labelY = value >= 0 ? top - 8 : bottom + 18
  return (
    <g>
      <rect x={left} y={top} width={right - left} height={bottom - top} rx={3} style={{ fill: TONE }} />
      <text x={(left + right) / 2} y={labelY} textAnchor="middle" fontSize={SZ} style={{ fill: INK }}>
        {label}
      </text>
    </g>
  )
}

/** Text placed in data coordinates (a dash for a missing entry, the zero-line label). */
function DataText({ x, y, dy = -6, anchor = 'middle', children }: { x: number; y: number; dy?: number; anchor?: 'start' | 'middle' | 'end'; children: string }) {
  const s = usePlotScale()
  return (
    <text x={s.x(x)} y={s.y(y) + dy} textAnchor={anchor} fontSize={SZ} style={{ fill: INK }}>
      {children}
    </text>
  )
}

/** Step 1: zinc's cycle, alone and to scale. */
function ZincStep() {
  const eZn = potentialM2('Zn') as number
  const card = { x: 318, y: 40, width: 248, height: 300 }
  return (
    <>
      <EnergyCycle x={6} y={20} width={296} height={440} domain={energyDomain(cycleBars('Zn'))} species={ZN_SPECIES} steps={cycleSteps('Zn')} net={netOf('Zn')} />
      <rect x={card.x} y={card.y} width={card.width} height={card.height} rx={14} style={{ fill: 'var(--surface)', stroke: 'var(--kin-grid)' }} />
      <text x={card.x + 18} y={card.y + 34} fontSize={15} style={{ fill: MUTED }}>E°(Zn²⁺/Zn)</text>
      <text x={card.x + 18} y={card.y + 80} fontSize={30} style={{ fill: INK, fontWeight: 600 }}>{formatVolt(eZn)}</text>
      <text x={card.x + 18} y={card.y + 124} fontSize={15} style={{ fill: INK }}>Negative: zinc is oxidised</text>
      <text x={card.x + 18} y={card.y + 146} fontSize={15} style={{ fill: INK }}>by H⁺ and gives off H₂.</text>
      <text x={card.x + 18} y={card.y + 200} fontSize={15} style={{ fill: INK }}>The total, {signedKj(netOf('Zn').value)} kJ mol⁻¹,</text>
      <text x={card.x + 18} y={card.y + 222} fontSize={15} style={{ fill: INK }}>is positive, like every total.</text>
      <text x={card.x + 18} y={card.y + 256} fontSize={15} style={{ fill: INK }}>Compare metals, not the sign.</text>
      <text x={card.x} y={card.y + card.height + 30} fontSize={14} style={{ fill: MUTED }}>Table 4.4 values</text>
    </>
  )
}

/** Step 2: copper beside zinc on one shared scale. */
function CopperStep() {
  const shared = energyDomain(cycleBars('Zn'), cycleBars('Cu'))
  const ni = cycleBars('Ni')[2]
  return (
    <>
      <EnergyCycle x={0} y={20} width={296} height={420} domain={shared} species={ZN_SPECIES} steps={cycleSteps('Zn')} />
      <EnergyCycle x={284} y={20} width={296} height={420} domain={shared} species={CU_SPECIES} steps={cycleSteps('Cu')} net={netOf('Cu')} />
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} style={{ fill: INK }}>
        Both totals are positive: Zn +711, Cu +921 kJ mol⁻¹.
      </text>
      <text x={W / 2} y={504} textAnchor="middle" fontSize={15} style={{ fill: INK }}>
        Compare metals, not signs. Cu and Ni share ΔhydH {signedKj(ni)} kJ mol⁻¹.
      </text>
    </>
  )
}

/** Step 3: the 3d potential curve with the zero line for hydrogen. */
function CurveStep() {
  const plotted: Array<{ symbol: string; x: number; e: number }> = []
  for (const symbol of THREE_D) {
    const e = potentialM2(symbol)
    if (e !== null) plotted.push({ symbol, x: plotX(symbol), e })
  }
  return (
    <>
      <PlotFrame
        x={CURVE_FRAME.x}
        y={CURVE_FRAME.y}
        width={CURVE_FRAME.width}
        height={CURVE_FRAME.height}
        domain={E2_DOMAIN}
        xTicks={X_TICKS}
        yTicks={[-2, -1.5, -1, -0.5, 0, 0.5]}
        xTickFormat={symbolAt}
        yTickFormat={tickNumber}
        xTitle="metal (3d series)"
        yTitle="E°(M²⁺/M) / V"
      >
        <PlotLine from={{ x: 0.5, y: 0 }} to={{ x: 10.5, y: 0 }} tone="accent" width={2} dashed />
        <DataText x={0.62} y={0.05} anchor="start">H⁺/H₂ = 0 V</DataText>
        <DataText x={1.2} y={0.5} anchor="start">Ring: below the trend (Mn, Ni, Zn)</DataText>
        {plotted.slice(1).map((p, i) => (
          <Segment key={`seg${p.symbol}`} from={[plotted[i].x, plotted[i].e]} to={[p.x, p.e]} />
        ))}
        {plotted.map((p) => {
          const label = signedVolt(p.e)
          if (p.symbol === 'Cu') return <Dot key={p.symbol} x={p.x} y={p.e} halo label={label} dy={-18} dx={0} anchor="middle" />
          if (p.symbol === 'Zn') return <Dot key={p.symbol} x={p.x} y={p.e} ring label={label} dx={-10} dy={22} anchor="end" />
          if (p.symbol === 'Cr') return <Dot key={p.symbol} x={p.x} y={p.e} label={label} dx={0} dy={-16} anchor="middle" />
          const ring = (BELOW_TREND as readonly string[]).includes(p.symbol)
          return <Dot key={p.symbol} x={p.x} y={p.e} ring={ring} label={label} />
        })}
      </PlotFrame>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} style={{ fill: INK }}>
        Only copper rises above zero.
      </text>
      <text x={W / 2} y={504} textAnchor="middle" fontSize={15} style={{ fill: MUTED }}>
        Sc has no entry, so its slot is a dash.
      </text>
    </>
  )
}

/** Step 4: the M³⁺/M²⁺ couple as bars from Table 4.2. */
function CoupleStep() {
  return (
    <>
      <PlotFrame
        x={CURVE_FRAME.x}
        y={CURVE_FRAME.y}
        width={CURVE_FRAME.width}
        height={CURVE_FRAME.height}
        domain={E3_DOMAIN}
        xTicks={X_TICKS}
        yTicks={[-0.5, 0, 0.5, 1, 1.5, 2]}
        xTickFormat={symbolAt}
        yTickFormat={tickNumber}
        xTitle="metal (3d series)"
        yTitle="E°(M³⁺/M²⁺) / V"
      >
        <PlotLine from={{ x: 0.5, y: 0 }} to={{ x: 10.5, y: 0 }} tone="accent" width={2} dashed />
        {THREE_D.map((symbol) => {
          const e = potentialM3M2(symbol)
          const x = plotX(symbol)
          return e === null ? (
            <DataText key={symbol} x={x} y={0} dy={-6}>–</DataText>
          ) : (
            <Bar key={symbol} x={x} value={e} label={signedVolt(e)} />
          )
        })}
      </PlotFrame>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} style={{ fill: INK }}>
        Co³⁺ and Mn³⁺ are strong oxidants; Ti²⁺, V²⁺ and Cr²⁺ are reductants.
      </text>
      <text x={W / 2} y={504} textAnchor="middle" fontSize={15} style={{ fill: MUTED }}>
        A dash means Table 4.2 has no entry (Sc, Ni, Cu, Zn).
      </text>
    </>
  )
}

/** Step 5: highest states in halides (bars) and in the oxide Mn₂O₇ (drawing). */
function StatesStep() {
  const halides = highestHalides(HALIDE_METALS)
  const geom = oxoanionGeometry('cr2o7')
  const b = oxoanionBounds('cr2o7')
  const box = { x: 336, y: 84, width: 220, height: 236 }
  const k = Math.min(box.width / (b.maxX - b.minX), box.height / (b.maxY - b.minY))
  const ox = box.x + (box.width - (b.maxX - b.minX) * k) / 2
  const oy = box.y + (box.height - (b.maxY - b.minY) * k) / 2
  const px = (i: number) => ox + (geom.atoms[i].x - b.minX) * k
  const py = (i: number) => oy + (geom.atoms[i].y - b.minY) * k
  return (
    <>
      <text x={14} y={40} fontSize={15} style={{ fill: INK, fontWeight: 600 }}>Highest state in halides</text>
      <text x={316} y={40} fontSize={15} style={{ fill: INK, fontWeight: 600 }}>Highest oxide: Mn₂O₇ (+7)</text>
      {halides.map((h, i) => {
        const y = 96 + i * 60
        const bar = h.state * BAR_UNIT
        const note = h.halogens === 'F' ? h.formula : `${h.formula} (${h.halogens})`
        return (
          <g key={h.metal}>
            <text x={14} y={y + 4} fontSize={18} style={{ fill: INK, fontWeight: 600 }}>{h.metal}</text>
            <rect x={80} y={y - 12} width={bar} height={20} rx={4} style={{ fill: TONE }} />
            <text x={h.metal === 'Mn' ? 80 + 7 * BAR_UNIT + 10 : 80 + bar + 8} y={y + 4} fontSize={16} style={{ fill: INK, fontWeight: 600 }}>{`+${h.state}`}</text>
            <text x={14} y={y + 26} fontSize={14} style={{ fill: MUTED }}>{note}</text>
            {h.metal === 'Mn' && (
              <>
                <rect x={80 + 4 * BAR_UNIT} y={y - 12} width={3 * BAR_UNIT} height={20} rx={4} style={{ fill: 'none', stroke: TONE, strokeWidth: 2, strokeDasharray: '4 3' }} />
                <text x={14} y={y + 46} fontSize={14} style={{ fill: MUTED }}>Stops at +4; +7 only in Mn₂O₇</text>
              </>
            )}
          </g>
        )
      })}
      {geom.bonds.map((bond) => (
        <line
          key={`b${bond.a}-${bond.b}`}
          x1={px(bond.a)}
          y1={py(bond.a)}
          x2={px(bond.b)}
          y2={py(bond.b)}
          style={{ stroke: MUTED, strokeWidth: 2, strokeDasharray: bond.style === 'dash' ? '4 3' : undefined }}
        />
      ))}
      {geom.atoms.map((atom, i) =>
        geom.metals.includes(i) ? (
          <g key={`a${i}`}>
            <circle cx={px(i)} cy={py(i)} r={15} style={{ fill: 'var(--surface)', stroke: TONE, strokeWidth: 3 }} />
            <text x={px(i)} y={py(i) + 5} textAnchor="middle" fontSize={14} style={{ fill: INK, fontWeight: 600 }}>Mn</text>
          </g>
        ) : (
          <circle key={`a${i}`} cx={px(i)} cy={py(i)} r={9} style={{ fill: 'var(--ion-anion)' }} />
        )
      )}
      <text x={336} y={346} fontSize={14} style={{ fill: MUTED }}>Ring: Mn. Dot: O.</text>
      <text x={336} y={366} fontSize={14} style={{ fill: MUTED }}>The shared O bridges Mn–O–Mn.</text>
      <text x={W / 2} y={470} textAnchor="middle" fontSize={15} style={{ fill: INK }}>
        Fluorine and oxygen hold the highest states.
      </text>
      <text x={W / 2} y={496} textAnchor="middle" fontSize={15} style={{ fill: INK }}>
        They are small and very electronegative; O also forms multiple bonds.
      </text>
      <text x={W / 2} y={522} textAnchor="middle" fontSize={15} style={{ fill: MUTED }}>
        MnF₄ is the highest simple fluoride of manganese.
      </text>
    </>
  )
}

/** Five Steps, one drawing per Step. Panels are fixed-size; Scrolly swaps the Step. */
export function ElectrodePotentialCycle({ step }: ElectrodePotentialCycleProps) {
  const index = Math.min(Math.max(Math.round(step), 0), 4)
  const drawings = [<ZincStep key="zn" />, <CopperStep key="cu" />, <CurveStep key="curve" />, <CoupleStep key="couple" />, <StatesStep key="states" />]
  const labels = [
    'Zinc: the energy cycle for Zn(s) to Zn²⁺(aq) and its potential',
    'Copper beside zinc on one shared scale of energy',
    'E° for the 3d series from titanium to zinc, with the hydrogen zero line',
    'M³⁺/M²⁺ couples from Table 4.2 as bars around zero',
    'Highest oxidation states in halides and in the oxide Mn₂O₇',
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={labels[index]}>
      {drawings[index]}
    </svg>
  )
}
