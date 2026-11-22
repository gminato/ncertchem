'use client'

import { PlotCurve, PlotFrame, usePlotScale } from '@/components/vocab'
import { SERIES_TONE } from '@/components/vocab/dblock'
import {
  CE_IV_E_VOLT,
  FALL_BOTTOM_PM,
  FALL_TOP_PM,
  HF_RADIUS_PM,
  LN_COLUMNS,
  RADIUS_POINTS,
  SPECIAL_STATES,
  ZR_RADIUS_PM,
  hundSpins,
  lanthanoidStepVisual,
  radiusFallPm,
  type LnColumn,
} from './lanthanoid-steps'

/** Steps are cut, not tweened, so there is no motion to reduce: reducedMotion is not needed. */
export interface LanthanoidContractionProps {
  /** 0-based Step index from Scrolly. */
  step: number
}

const W = 580
const H = 480
const LN = SERIES_TONE.ln
const GREY_STROKE = 'var(--kin-grid)'
const TEXT = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const ELECTRON = 'var(--electron)'
const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

function sup(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPTS[Number(d)])
    .join('')
}

const Z_TICKS = LN_COLUMNS.map((c) => c.Z)
const SYMBOL_BY_Z: Record<number, string> = Object.fromEntries(LN_COLUMNS.map((c) => [c.Z, c.symbol]))

// ----- Step 1: 4f boxes, one column per ion, La³⁺ to Lu³⁺ -----

const COL_X0 = 14
const COL_DX = 37
const BOX = 24
const BOX_PITCH = 27
const BOX_TOP = 92
const ATOM_Y = 328

function Column({ col, index }: { col: LnColumn; index: number }) {
  const x = COL_X0 + index * COL_DX
  const spins = hundSpins(col.f)
  const cx = x + BOX / 2
  return (
    <g>
      <text x={cx} y={78} textAnchor="middle" fontSize={14} fill={TEXT}>
        {col.ion}
      </text>
      {spins.map((o, i) => {
        const y = BOX_TOP + i * BOX_PITCH
        const filled = o.up || o.down
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={BOX}
              height={BOX}
              rx={3}
              fill={filled ? LN : 'var(--surface)'}
              fillOpacity={filled ? 0.22 : 1}
              stroke={filled ? LN : GREY_STROKE}
              strokeWidth={1.4}
            />
            {o.up && <Arrow x={x + BOX * 0.36} y={y} up />}
            {o.down && <Arrow x={x + BOX * 0.64} y={y} up={false} />}
          </g>
        )
      })}
      <text x={cx} y={306} textAnchor="middle" fontSize={14} fill={MUTED}>
        f{sup(col.f)}
      </text>
    </g>
  )
}

/** The atom under each ion column: its symbol, and the 5d¹ tag where the atom has one. */
function AtomRow({ col, index }: { col: LnColumn; index: number }) {
  const cx = COL_X0 + index * COL_DX + BOX / 2
  return (
    <g>
      <text x={cx} y={ATOM_Y} textAnchor="middle" fontSize={14} fill={TEXT}>
        {col.symbol}
      </text>
      {col.atomHas5d && (
        <g>
          <rect x={cx - 17} y={ATOM_Y + 8} width={34} height={20} rx={10} fill={LN} fillOpacity={0.25} stroke={LN} strokeWidth={1} />
          <text x={cx} y={ATOM_Y + 23} textAnchor="middle" fontSize={14} fill={TEXT}>
            5d¹
          </text>
        </g>
      )}
    </g>
  )
}

/** A vertical arrow inside one orbital box, pointing up (spin +½) or down (spin −½). */
function Arrow({ x, y, up }: { x: number; y: number; up: boolean }) {
  const top = y + BOX * 0.2
  const bottom = y + BOX * 0.8
  const tip = up ? top : bottom
  const tail = up ? bottom : top
  const head = up ? 1 : -1
  return (
    <g stroke={ELECTRON} fill={ELECTRON} strokeWidth={1.8} strokeLinecap="round">
      <line x1={x} y1={tail} x2={x} y2={tip + head * 2} />
      <polygon points={`${x},${tip} ${x - 3.6},${tip + head * 6} ${x + 3.6},${tip + head * 6}`} stroke="none" />
    </g>
  )
}

function FillStep() {
  return (
    <g>
      {LN_COLUMNS.map((col, i) => (
        <Column key={col.symbol} col={col} index={i} />
      ))}
      {LN_COLUMNS.map((col, i) => (
        <AtomRow key={`atom-${col.symbol}`} col={col} index={i} />
      ))}
      <text x={W / 2} y={372} textAnchor="middle" fontSize={14} fill={TEXT}>
        Top: one Ln³⁺ ion per column, its seven 4f boxes filled by Hund’s rule.
      </text>
      <text x={W / 2} y={392} textAnchor="middle" fontSize={14} fill={MUTED}>
        Bottom: the atom. The 5d¹ tag marks La, Ce, Gd and Lu.
      </text>
      <text x={W / 2} y={412} textAnchor="middle" fontSize={14} fill={MUTED}>
        No Ln³⁺ ion has a 5d electron. Lu³⁺ has all fourteen 4f.
      </text>
    </g>
  )
}

// ----- Step 2: radius falls on a PlotFrame -----

function LnPoints() {
  const s = usePlotScale()
  return (
    <g>
      {RADIUS_POINTS.map(([Z, r]) => (
        <circle key={Z} cx={s.x(Z)} cy={s.y(r)} r={4.6} fill={LN} stroke="var(--surface)" strokeWidth={1.4} />
      ))}
    </g>
  )
}

function RadiusNotes() {
  const s = usePlotScale()
  const top = FALL_TOP_PM
  const bottom = FALL_BOTTOM_PM
  const bx = 71.4
  const xTop = s.x(bx)
  return (
    <g stroke={MUTED} strokeWidth={1.4} fill="none">
      <line x1={xTop} x2={xTop} y1={s.y(top)} y2={s.y(bottom)} />
      <line x1={xTop - 5} x2={xTop + 5} y1={s.y(top)} y2={s.y(top)} />
      <line x1={xTop - 5} x2={xTop + 5} y1={s.y(bottom)} y2={s.y(bottom)} />
      <text x={s.x(bx + 0.5)} y={s.y((top + bottom) / 2) + 5} fontSize={14} fill={TEXT} stroke="none">
        {`${radiusFallPm()} pm`}
      </text>
      <text x={s.x(71)} y={s.y(108)} textAnchor="middle" fontSize={14} fill={MUTED} stroke="none">
        Lu: not printed
      </text>
    </g>
  )
}

function RadiusStep() {
  return (
    <g>
      <PlotFrame
        x={72}
        y={28}
        width={480}
        height={340}
        domain={{ xMin: 56, xMax: 74, yMin: 84, yMax: 110 }}
        xTicks={Z_TICKS}
        yTicks={[85, 90, 95, 100, 105]}
        xTickFormat={(v) => SYMBOL_BY_Z[v] ?? ''}
        yTickFormat={(v) => String(v)}
        xTitle="Lanthanoid (atomic number 57 to 71)"
        yTitle="r(Ln³⁺) / pm"
      >
        <PlotCurve points={RADIUS_POINTS} stroke={LN} width={3} />
        <LnPoints />
        <RadiusNotes />
      </PlotFrame>
    </g>
  )
}

// ----- Step 3: the 4f shield, schematic -----

function Pull({ cx, cy, Z }: { cx: number; cy: number; Z: number }) {
  // The outer electron sits on the 6s/5d shell, at this angle from the nucleus.
  const angle = (-50 * Math.PI) / 180
  const ex = cx + 118 * Math.cos(angle)
  const ey = cy + 118 * Math.sin(angle)
  const nx = cx + 24 * Math.cos(angle)
  const ny = cy + 24 * Math.sin(angle)
  const width = 1.6 + (Z - 57) * 0.2
  const ux = nx - ex
  const uy = ny - ey
  const len = Math.hypot(ux, uy)
  const ax = ux / len
  const ay = uy / len
  const headBase = { x: nx - ax * 11, y: ny - ay * 11 }
  const perp = { x: -ay, y: ax }
  return (
    <g>
      <line x1={ex} y1={ey} x2={headBase.x} y2={headBase.y} stroke="var(--accent)" strokeWidth={width} strokeLinecap="round" />
      <polygon
        points={`${nx},${ny} ${headBase.x + perp.x * 6},${headBase.y + perp.y * 6} ${headBase.x - perp.x * 6},${headBase.y - perp.y * 6}`}
        fill="var(--accent)"
      />
      <circle cx={ex} cy={ey} r={6} fill={ELECTRON} />
    </g>
  )
}

function ShieldPanel({ symbol, cx, cy, r }: { symbol: string; cx: number; cy: number; r: number }) {
  const col = LN_COLUMNS.find((c) => c.symbol === symbol)
  if (!col) return null
  const electronAngle = (200 * Math.PI) / 180
  return (
    <g>
      <text x={cx} y={44} textAnchor="middle" fontSize={15} fill={TEXT}>
        {`${col.ion} · Z = ${col.Z}`}
      </text>
      <circle cx={cx} cy={cy} r={118} fill="none" stroke={GREY_STROKE} strokeWidth={1.2} strokeDasharray="5 6" />
      <circle cx={cx} cy={cy} r={r} fill={LN} fillOpacity={0.12} stroke={LN} strokeWidth={1.6} />
      <circle cx={cx + r * Math.cos(electronAngle)} cy={cy + r * Math.sin(electronAngle)} r={5} fill={ELECTRON} />
      <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={14} fill={MUTED}>
        4f
      </text>
      <circle cx={cx} cy={cy} r={21} fill="var(--accent)" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fill="var(--surface)">
        {`+${col.Z}`}
      </text>
      <Pull cx={cx} cy={cy} Z={col.Z} />
    </g>
  )
}

function ShieldStep() {
  return (
    <g>
      <ShieldPanel symbol="La" cx={150} cy={220} r={78} />
      <ShieldPanel symbol="Yb" cx={430} cy={220} r={60} />
      <text x={W / 2} y={380} textAnchor="middle" fontSize={14} fill={TEXT}>
        The pull on the outer electron grows as Z rises.
      </text>
      <text x={W / 2} y={402} textAnchor="middle" fontSize={14} fill={MUTED}>
        The 4f cloud shields poorly, so the 4f shell is drawn in tighter.
      </text>
      <text x={W / 2} y={450} textAnchor="middle" fontSize={14} fill={MUTED}>
        Schematic: the sizes are not to scale.
      </text>
    </g>
  )
}

// ----- Step 4: Zr and Hf -----

function Sphere({ cx, cy, r, symbol, pm, tone }: { cx: number; cy: number; r: number; symbol: string; pm: number; tone: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={tone} fillOpacity={0.25} stroke={tone} strokeWidth={2.4} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize={24} fill={TEXT}>
        {symbol}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fontSize={15} fill={MUTED}>
        {`${pm} pm`}
      </text>
    </g>
  )
}

const LANTHANOID_TILES = LN_COLUMNS.filter((c) => c.Z >= 58)

function TwinsStep() {
  const scale = 0.7
  const rZr = ZR_RADIUS_PM * scale
  const rHf = HF_RADIUS_PM * scale
  const zrX = 150
  const hfX = 430
  const cy = 190
  return (
    <g>
      <Sphere cx={zrX} cy={cy} r={rZr} symbol="Zr" pm={ZR_RADIUS_PM} tone={SERIES_TONE['4d']} />
      <Sphere cx={hfX} cy={cy} r={rHf} symbol="Hf" pm={HF_RADIUS_PM} tone={SERIES_TONE['5d']} />
      <line x1={zrX + rZr + 6} x2={hfX - rHf - 6} y1={cy} y2={cy} stroke={MUTED} strokeWidth={1.2} />
      <text x={(zrX + hfX) / 2} y={cy - 8} textAnchor="middle" fontSize={14} fill={TEXT}>
        {`${ZR_RADIUS_PM - HF_RADIUS_PM} pm`}
      </text>
      <text x={W / 2} y={350} textAnchor="middle" fontSize={14} fill={TEXT}>
        The 14 lanthanoids, Ce to Lu, sit between La and Hf in period 6.
      </text>
      {LANTHANOID_TILES.map((c, i) => (
        <g key={c.symbol}>
          <rect x={18 + i * 39} y={364} width={35} height={28} rx={4} fill={LN} fillOpacity={0.18} stroke={LN} strokeWidth={1} />
          <text x={18 + i * 39 + 17.5} y={384} textAnchor="middle" fontSize={14} fill={TEXT}>
            {c.symbol}
          </text>
        </g>
      ))}
      <text x={W / 2} y={432} textAnchor="middle" fontSize={14} fill={TEXT}>
        Zr (4d) and Hf (5d) are almost the same size, so they behave alike.
      </text>
      <text x={W / 2} y={456} textAnchor="middle" fontSize={14} fill={MUTED}>
        The lanthanoid contraction is why. The spheres are drawn to scale.
      </text>
    </g>
  )
}

// ----- Step 5: the special oxidation states -----

const CELL_X0 = 20
const CELL_DX = 39
const CELL_W = 35
const CELL_Y = 150
const CELL_H = 64

function SpecialStep() {
  const cells = LN_COLUMNS.filter((c) => c.Z >= 58)
  return (
    <g>
      {cells.map((c, i) => {
        const special = SPECIAL_STATES.find((s) => s.symbol === c.symbol)
        const x = CELL_X0 + i * CELL_DX
        const cx = x + CELL_W / 2
        return (
          <g key={c.symbol}>
            <rect
              x={x}
              y={CELL_Y}
              width={CELL_W}
              height={CELL_H}
              rx={4}
              fill={special ? LN : 'var(--surface)'}
              fillOpacity={special ? 0.25 : 1}
              stroke={special ? LN : GREY_STROKE}
              strokeWidth={special ? 2.6 : 1.2}
            />
            <text x={cx} y={CELL_Y + 26} textAnchor="middle" fontSize={14} fill={special ? TEXT : MUTED}>
              {c.symbol}
            </text>
            <text x={cx} y={CELL_Y + 52} textAnchor="middle" fontSize={14} fill={MUTED}>
              {`f${sup(special ? special.fCount : c.f)}`}
            </text>
            {special && (
              <g>
                <text x={cx} y={CELL_Y - 30} textAnchor="middle" fontSize={14} fill={TEXT}>
                  {special.ion}
                </text>
                <text x={cx} y={CELL_Y - 14} textAnchor="middle" fontSize={14} fill={TEXT}>
                  {`f${sup(special.fCount)}`}
                </text>
              </g>
            )}
          </g>
        )
      })}
      <text x={20} y={250} fontSize={14} fill={MUTED}>
        Grey cells: the Ln³⁺ f count. Outlined: the special ion’s f count.
      </text>
      {SPECIAL_STATES.map((s, i) => (
        <text key={s.ion} x={20} y={288 + i * 26} fontSize={14} fill={TEXT}>
          {`${s.ion}  ${s.reason}`}
        </text>
      ))}
      <text x={20} y={402} fontSize={14} fill={MUTED}>
        {`E°(Ce⁴⁺/Ce³⁺) = +${CE_IV_E_VOLT.toFixed(2)} V. The other cells stay grey.`}
      </text>
    </g>
  )
}

export function LanthanoidContraction({ step }: LanthanoidContractionProps) {
  const visual = lanthanoidStepVisual(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Lanthanoid contraction: 4f filling, Ln³⁺ radii, the shielding picture, Zr and Hf, and special oxidation states"
      style={{ display: 'block' }}
    >
      {visual === 'fill' && <FillStep />}
      {visual === 'radius' && <RadiusStep />}
      {visual === 'shield' && <ShieldStep />}
      {visual === 'twins' && <TwinsStep />}
      {visual === 'special' && <SpecialStep />}
    </svg>
  )
}
