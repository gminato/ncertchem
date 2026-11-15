'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { formatSci } from '@/components/equilibrium/geometry'
import { Label } from '@/components/vocab'
import { experiments, meanKc, range, relatedConstants, type Experiment } from './massaction-steps'

export interface MassActionProps {
  step: number
  reducedMotion: boolean
}

const VIEW = { width: 580, height: 500 }
const CAPTION_Y = 488
const ROWS = experiments()
const K = meanKc()
const FIRST = range(ROWS.map((r) => r.firstTrial))
const CONSTANT = range(ROWS.map((r) => r.kc))
const RELATED = relatedConstants(K)

/** A value with three significant figures in the middle range, and a power of ten outside it. */
function displayValue(value: number): string {
  if (value >= 0.01 && value < 1000) return value.toPrecision(3)
  return formatSci(value, 2)
}

/** Table 6.2 as a grid: the start and equilibrium of each experiment, in 10⁻² mol L⁻¹. */
function DataTable() {
  const cols = [
    { x: 44, head: 'Exp.' },
    { x: 112, head: 'Start' },
    { x: 194, head: '[H₂]' },
    { x: 266, head: '[I₂]' },
    { x: 338, head: '[HI]' },
    { x: 420, head: '[H₂]' },
    { x: 484, head: '[I₂]' },
    { x: 540, head: '[HI]' },
  ]
  const headY = 118
  const rowTop = 156
  const rowH = 48
  // Show each value as NCERT prints it: two decimals, or three where the table has three (0.345).
  const cell = (value: number) => {
    const v = Number((value / 0.01).toFixed(3))
    return Number(v.toFixed(2)) === v ? v.toFixed(2) : v.toFixed(3)
  }
  return (
    <g>
      <Label x={290} y={30} fontSize={17} fontWeight={600} fill="var(--fg)">
        Six experiments at 731 K, in 10⁻² mol L⁻¹
      </Label>
      <Label x={266} y={70} fontSize={15} fontWeight={600} fill="var(--fg-muted)">
        starting amounts
      </Label>
      <Label x={480} y={70} fontSize={15} fontWeight={600} fill="var(--fg-muted)">
        at equilibrium
      </Label>
      <line x1={176} x2={356} y1={86} y2={86} stroke="var(--border)" strokeWidth={1.2} />
      <line x1={402} x2={558} y1={86} y2={86} stroke="var(--border)" strokeWidth={1.2} />
      {cols.map((c) => (
        <Label key={`h-${c.x}`} x={c.x} y={headY} fontSize={15} fontWeight={600} fill="var(--fg)" textAnchor="middle">
          {c.head}
        </Label>
      ))}
      {ROWS.map((row: Experiment, i) => {
        const y = rowTop + i * rowH
        return (
          <g key={row.experiment}>
            {i % 2 === 0 && <rect x={24} y={y - rowH / 2} width={532} height={rowH} rx={8} fill="var(--surface-raised)" />}
            <Label x={44} y={y} fontSize={16} fill="var(--fg)" fontWeight={600}>
              {row.experiment}
            </Label>
            <Label x={112} y={y} fontSize={15} fill="var(--fg-muted)">
              {row.start === 'HI' ? 'HI' : 'H₂ + I₂'}
            </Label>
            <Label x={194} y={y} fontSize={16} fill="var(--fg)">{cell(row.initial.H2)}</Label>
            <Label x={266} y={y} fontSize={16} fill="var(--fg)">{cell(row.initial.I2)}</Label>
            <Label x={338} y={y} fontSize={16} fill="var(--fg)">{cell(row.initial.HI)}</Label>
            <Label x={420} y={y} fontSize={16} fill="var(--fg)">{cell(row.equilibrium.H2)}</Label>
            <Label x={484} y={y} fontSize={16} fill="var(--fg)">{cell(row.equilibrium.I2)}</Label>
            <Label x={540} y={y} fontSize={16} fill="var(--fg)">{cell(row.equilibrium.HI)}</Label>
          </g>
        )
      })}
      <Label x={290} y={442} fontSize={15} fill="var(--fg-muted)">
        Experiments 1 to 4 start from H₂ and I₂. Experiments 5 and 6 start from HI alone.
      </Label>
      <Label x={290} y={CAPTION_Y} fontSize={15} fill="var(--fg-muted)">
        The equilibrium amounts are the data for every trial that follows.
      </Label>
    </g>
  )
}

const PLOT = { left: 92, right: 556, top: 72, bottom: 408 }

function xOfExperiment(i: number): number {
  return PLOT.left + ((i + 0.5) / ROWS.length) * (PLOT.right - PLOT.left)
}

/** Dot plot of one value per experiment, on a linear axis from 0 to yMax. */
function DotPlot({ values, yMax, ticks, yLabel, digits, meanLine, band }: {
  values: number[]
  yMax: number
  ticks: number[]
  yLabel: string
  digits: number
  meanLine?: number
  band?: number
}) {
  const yOf = (v: number) => PLOT.bottom - (v / yMax) * (PLOT.bottom - PLOT.top)
  return (
    <g>
      {band !== undefined && meanLine !== undefined && (
        <rect
          x={PLOT.left}
          y={yOf(meanLine * (1 + band))}
          width={PLOT.right - PLOT.left}
          height={yOf(meanLine * (1 - band)) - yOf(meanLine * (1 + band))}
          fill="var(--fwd)"
          opacity={0.1}
        />
      )}
      <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
      <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
      {ticks.map((t) => (
        <g key={`t-${t}`}>
          <line x1={PLOT.left - 4} x2={PLOT.left} y1={yOf(t)} y2={yOf(t)} stroke="var(--fg-muted)" strokeWidth={1} />
          <Label x={PLOT.left - 10} y={yOf(t)} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
            {t}
          </Label>
        </g>
      ))}
      <Label x={28} y={(PLOT.top + PLOT.bottom) / 2} fontSize={15} fill="var(--fg-muted)" transform={`rotate(-90 28 ${(PLOT.top + PLOT.bottom) / 2})`}>
        {yLabel}
      </Label>
      {meanLine !== undefined && (
        <g>
          <line x1={PLOT.left} x2={PLOT.right} y1={yOf(meanLine)} y2={yOf(meanLine)} stroke="var(--fwd)" strokeWidth={2} strokeDasharray="7 5" />
          {/* Top left of the plot, clear of every data label: the points lie below it. */}
          <Label x={PLOT.left + 10} y={PLOT.top + 12} textAnchor="start" fontSize={16} fontWeight={600} fill="var(--fwd)">
            {`mean ${meanLine.toFixed(1)}`}
          </Label>
        </g>
      )}
      {ROWS.map((row, i) => {
        const v = values[i]
        const cx = xOfExperiment(i)
        const cy = yOf(v)
        const fromProducts = row.start === 'HI'
        return (
          <g key={`dot-${row.experiment}`}>
            <circle cx={cx} cy={cy} r={10} fill={fromProducts ? 'var(--surface)' : 'var(--accent)'} stroke="var(--accent)" strokeWidth={2.4} />
            <Label x={cx} y={cy - 22} fontSize={15} fontWeight={600} fill="var(--fg)">
              {v.toFixed(digits)}
            </Label>
            <Label x={cx} y={PLOT.bottom + 22} fontSize={15} fill="var(--fg)">
              {row.experiment}
            </Label>
          </g>
        )
      })}
      <Label x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 46} fontSize={15} fill="var(--fg-muted)">
        experiment (filled: from H₂ and I₂; open: from HI)
      </Label>
    </g>
  )
}

/** A KaTeX block rendered inside the SVG. The foreignObject keeps the viewBox scale. */
function Tex({ math, size }: { math: string; size: number }) {
  // Inline mode with \displaystyle: full-size fractions, and no display margins to push the stack out of its box.
  const html = useMemo(() => katex.renderToString(`\\displaystyle ${math}`, { throwOnError: false, displayMode: false }), [math])
  return (
    <div
      style={{ fontSize: size, color: 'var(--fg)', textAlign: 'center', lineHeight: 1.25 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function LawStep() {
  const values = ROWS.map((r) => r.kc)
  const x0 = 60
  const x1 = 520
  const lo = 40
  const hi = 50
  const xOf = (v: number) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0)
  return (
    <g>
      <Label x={290} y={32} fontSize={18} fontWeight={600} fill="var(--fg)">
        Law of chemical equilibrium
      </Label>
      <foreignObject x={20} y={52} width={540} height={236}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly', height: 236 }}>
          <Tex math={String.raw`a\,\mathrm{A} + b\,\mathrm{B} \rightleftharpoons c\,\mathrm{C} + d\,\mathrm{D}`} size={20} />
          <Tex math={String.raw`K_c = \dfrac{[\mathrm{C}]^{c}\,[\mathrm{D}]^{d}}{[\mathrm{A}]^{a}\,[\mathrm{B}]^{b}}`} size={24} />
          <Tex math={String.raw`\ce{H2 + I2 <=> 2HI} \qquad K_c = \dfrac{[\ce{HI}]^{2}}{[\ce{H2}]\,[\ce{I2}]}`} size={20} />
        </div>
      </foreignObject>
      <Label x={290} y={310} fontSize={15} fill="var(--fg-muted)">
        each exponent is the stoichiometric coefficient of that species
      </Label>
      <Label x={290} y={346} fontSize={16} fontWeight={600} fill="var(--fg)">
        The six Kc values from Table 6.2
      </Label>
      <line x1={x0} x2={x1} y1={430} y2={430} stroke="var(--fg-muted)" strokeWidth={1.4} />
      {[40, 45, 50].map((t) => (
        <g key={`s-${t}`}>
          <line x1={xOf(t)} x2={xOf(t)} y1={430} y2={435} stroke="var(--fg-muted)" strokeWidth={1} />
          <Label x={xOf(t)} y={450} fontSize={14} fill="var(--fg-muted)">
            {t}
          </Label>
        </g>
      ))}
      <line x1={xOf(K)} x2={xOf(K)} y1={366} y2={430} stroke="var(--fwd)" strokeWidth={2} strokeDasharray="6 4" />
      {values.map((v, i) => (
        <circle key={`k-${i}`} cx={xOf(v)} cy={402} r={9} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} />
      ))}
      <Label x={290} y={468} fontSize={15} fill="var(--fg-muted)">
        {`Kc of the six experiments lies between ${CONSTANT.min.toFixed(1)} and ${CONSTANT.max.toFixed(1)}`}
      </Label>
      <Label x={290} y={CAPTION_Y} fontSize={15} fill="var(--fg-muted)">
        Pure solids and liquids are left out of Kc.
      </Label>
    </g>
  )
}

function RelationsStep() {
  const original = [
    { equation: 'H₂ + I₂ ⇌ 2HI', k: K, label: 'Original equation' },
    ...RELATED.map((r, i) => ({
      equation: r.equation,
      k: r.value,
      label: [
        'Reverse the equation: K′ = 1/Kc',
        'Double every coefficient: K″ = Kc²',
        'Halve every coefficient: K‴ = Kc½',
      ][i],
    })),
  ]
  const symbols = ['Kc', 'K′', 'K″', 'K‴']
  return (
    <g>
      <Label x={290} y={30} fontSize={18} fontWeight={600} fill="var(--fg)">
        How K changes when the equation changes
      </Label>
      {original.map((row, i) => {
        const y = 62 + i * 102
        return (
          <g key={row.equation}>
            <rect x={36} y={y} width={508} height={90} rx={14} fill={i === 0 ? 'var(--accent-soft)' : 'var(--surface-raised)'} />
            <Label x={58} y={y + 28} textAnchor="start" fontSize={18} fontWeight={600} fill="var(--fg)">
              {row.equation}
            </Label>
            <Label x={58} y={y + 60} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
              {row.label}
            </Label>
            <Label x={526} y={y + 40} textAnchor="end" fontSize={22} fontWeight={600} fill="var(--fwd)">
              {`${symbols[i]} = ${displayValue(row.k)}`}
            </Label>
          </g>
        )
      })}
      <Label x={290} y={CAPTION_Y} fontSize={15} fill="var(--fg-muted)">
        A new equation gets a new K, so the equation must be written with K.
      </Label>
    </g>
  )
}

/**
 * Section 6.3 Scrolly. Five Steps: the six Table 6.2 experiments, the first trial expression (not
 * constant), the squared expression (constant), the law of mass action, and how K changes with the
 * equation (Table 6.4).
 */
export function MassAction({ step }: MassActionProps) {
  const index = Math.min(4, Math.max(0, Math.round(step)))
  let body
  if (index === 0) body = <DataTable />
  else if (index === 1) {
    body = (
      <g>
        <Label x={290} y={30} fontSize={17} fontWeight={600} fill="var(--fg)">
          <tspan className="sym">[HI]</tspan> / (<tspan className="sym">[H₂][I₂]</tspan>), in L mol⁻¹
        </Label>
        <DotPlot
          values={ROWS.map((r) => r.firstTrial)}
          yMax={2000}
          ticks={[0, 500, 1000, 1500, 2000]}
          yLabel="L mol⁻¹"
          digits={0}
        />
        <Label x={290} y={CAPTION_Y} fontSize={15} fill="var(--fg-muted)">
          {`Not constant: from about ${Math.round(FIRST.min)} to ${Math.round(FIRST.max)} L mol⁻¹.`}
        </Label>
      </g>
    )
  } else if (index === 2) {
    body = (
      <g>
        <Label x={290} y={30} fontSize={17} fontWeight={600} fill="var(--fg)">
          <tspan className="sym">[HI]</tspan>
          <tspan dy="-0.45em" fontSize="0.7em">2</tspan>
          <tspan dy="0.45em"> / (</tspan>
          <tspan className="sym">[H₂][I₂]</tspan>
          <tspan>) = </tspan>
          <tspan className="sym">Kc</tspan>
        </Label>
        <DotPlot
          values={ROWS.map((r) => r.kc)}
          yMax={60}
          ticks={[0, 15, 30, 45, 60]}
          yLabel="Kc (L mol⁻¹)"
          digits={1}
          meanLine={K}
          band={0.02}
        />
        <Label x={290} y={CAPTION_Y} fontSize={15} fill="var(--fg-muted)">
          {`Constant to within about 2 %: the mean is Kc = ${K.toFixed(1)} at 731 K.`}
        </Label>
      </g>
    )
  } else if (index === 3) body = <LawStep />
  else body = <RelationsStep />

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label="Equilibrium data and trial expressions for H2 + I2 ⇌ 2HI, Kc, the law of mass action, and how K changes with the equation"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="mass-action"
      data-step={index}
    >
      {body}
    </svg>
  )
}
