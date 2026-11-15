'use client'

import { Label } from '@/components/vocab'
import { superscript } from '@/components/equilibrium/geometry'
import { spacedScatter, type Point } from '@/components/thermo/geometry'
import type { Reaction } from '@/lib/chem/equilibrium'
import {
  KPKC_RT,
  KPKC_T,
  equationBare,
  equationText,
  formatConstant,
  kpKcSteps,
  signedInt,
  subscripted,
  type KpKcExample,
  type KpKcStep,
} from './kpkc-steps'

export interface KpKcProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const STEPS = kpKcSteps()

/** Box on the left, bar panel on the right, formula band beneath. */
const BOX = { x0: 40, y0: 68, x1: 260, y1: 228 }
const BAR_PANEL = { x: 300, y: 68, width: 256, height: 224 }
const BAR_BASE = 246
const BAR_PER_MOL = 26
const BAR_WIDTH = 64
const BAR_CENTERS = [372, 500] as const
const PARTICLE_R = 5
/** Particles per mole per litre: a concentration of 0.40 mol L⁻¹ draws eight particles. */
const PARTICLES_PER_CONC = 20

/** Colour of each species in the box and its legend, from the Visual Vocabulary tokens. */
const SPECIES_COLOUR: Record<string, string> = {
  H2: 'var(--fwd)',
  I2: 'var(--i2)',
  HI: 'var(--rev)',
  N2: 'var(--fg-muted)',
  NH3: 'var(--rev)',
  NOCl: 'var(--acid)',
  NO: 'var(--no2)',
  Cl2: 'var(--i2)',
  CO2: 'var(--no2)',
}

function colourOf(formula: string): string {
  return SPECIES_COLOUR[formula] ?? 'var(--fg-muted)'
}

/** Ideal-gas box: particles scattered in proportion to each concentration. */
function GasBox({ example }: { example: KpKcExample }) {
  const counts = example.species.map((s) => Math.round(s.concentration * PARTICLES_PER_CONC))
  const total = counts.reduce((a, b) => a + b, 0)
  const points: Point[] = spacedScatter(total, { x0: BOX.x0 + 16, y0: BOX.y0 + 16, x1: BOX.x1 - 16, y1: BOX.y1 - 16 }, 7, 16)
  const starts = counts.map((_, i) => counts.slice(0, i).reduce((a, b) => a + b, 0))
  const coloured = example.species.map((s, i) => ({
    formula: s.formula,
    colour: colourOf(s.formula),
    points: points.slice(starts[i], starts[i] + counts[i]),
  }))
  return (
    <g data-testid="kpkc-box">
      <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={14} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      {coloured.map((group) =>
        group.points.map((p, j) => (
          <circle key={`${group.formula}-${j}`} cx={p.x} cy={p.y} r={PARTICLE_R} fill={group.colour} stroke="var(--surface)" strokeWidth={1} />
        ))
      )}
      {example.species.map((s, i) => (
        <g key={s.formula} transform={`translate(${BOX.x0 + 6}, ${BOX.y1 + 22 + i * 22})`}>
          <circle cx={6} cy={0} r={6} fill={colourOf(s.formula)} stroke="var(--surface)" strokeWidth={1} />
          <Label x={20} y={0} textAnchor="start" fontSize={15} fill="var(--fg)">
            <tspan className="sym">[{subscripted(s.formula)}]</tspan> = {formatConstant(s.concentration)} mol L⁻¹
          </Label>
        </g>
      ))}
    </g>
  )
}

/** Bars for gaseous moles: reactant side against product side. */
function GasMoleBars({ example }: { example: KpKcExample }) {
  const heights = [example.gasReactants, example.gasProducts]
  return (
    <g data-testid="kpkc-bars">
      <rect x={BAR_PANEL.x} y={BAR_PANEL.y} width={BAR_PANEL.width} height={BAR_PANEL.height} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 22} fontSize={16} fill="var(--fg)">
        Gaseous moles in the equation
      </Label>
      <line x1={BAR_PANEL.x + 16} x2={BAR_PANEL.x + BAR_PANEL.width - 16} y1={BAR_BASE} y2={BAR_BASE} stroke="var(--fg-subtle)" strokeWidth={1.5} />
      {heights.map((n, i) => {
        const h = n * BAR_PER_MOL
        const cx = BAR_CENTERS[i]
        return (
          <g key={i}>
            <rect x={cx - BAR_WIDTH / 2} y={BAR_BASE - h} width={BAR_WIDTH} height={h} rx={6} fill={i === 0 ? 'var(--fwd)' : 'var(--rev)'} opacity={0.85} />
            <Label x={cx} y={BAR_BASE - h - 14} fontSize={16} fill="var(--fg)">
              {n} mol
            </Label>
          </g>
        )
      })}
      <Label x={BAR_CENTERS[0]} y={BAR_BASE + 18} fontSize={15} fill="var(--fg-muted)">
        reactants
      </Label>
      <Label x={BAR_CENTERS[1]} y={BAR_BASE + 18} fontSize={15} fill="var(--fg-muted)">
        products
      </Label>
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 44} fontSize={15} fill="var(--fg-muted)">
        Δn = products − reactants = {signedInt(example.deltaN)}
      </Label>
    </g>
  )
}

/** Kc expression with the solids and liquids absent, as Unicode text for SVG. */
function kcText(reaction: Reaction): string {
  const term = (list: Reaction['products']) =>
    list
      .filter((t) => t.phase === 'g' || t.phase === 'aq')
      .map((t) => `[${subscripted(t.species)}]${t.coefficient > 1 ? superscript(t.coefficient) : ''}`)
      .join('')
  const top = term(reaction.products) || '1'
  const bottom = term(reaction.reactants) || '1'
  return `${top}/${bottom}`
}

/** A K-symbol with its subscript, e.g. Kc or Kp: the letter in the sym class, the subscript upright. */
function KLabel({ sub }: { sub: 'c' | 'p' }) {
  return (
    <>
      <tspan className="sym">K</tspan>
      <Label.Sub>{sub}</Label.Sub>
    </>
  )
}

function ExampleStep({ example, title }: { example: KpKcExample; title: string }) {
  const kpUnit = example.kpUnit === 'none' ? '' : ` ${example.kpUnit}`
  const kcUnit = example.kcUnit === 'none' ? '' : ` ${example.kcUnit}`
  const rtText = KPKC_RT.toFixed(2)
  const exponentText = example.deltaN > 0 ? `+${example.deltaN}` : `${example.deltaN}`
  return (
    <>
      <Label x={VIEW_WIDTH / 2} y={24} fontSize={17} fill="var(--fg)">
        {equationText(example.reaction)}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={46} fontSize={14} fill="var(--fg-muted)">
        {title}
      </Label>
      <GasBox example={example} />
      <GasMoleBars example={example} />
      <Label x={24} y={322} textAnchor="start" fontSize={16} fill="var(--fg)">
        <KLabel sub="c" /> = {kcText(example.reaction)} = {formatConstant(example.kc)}
        {kcUnit}
      </Label>
      <Label x={24} y={352} textAnchor="start" fontSize={16} fill="var(--fg)">
        <KLabel sub="p" /> = <KLabel sub="c" /> (RT)<tspan dy="-0.45em" fontSize="0.75em">Δn</tspan>
        <tspan dy="0.45em">, with RT = {rtText} L bar mol⁻¹</tspan>
      </Label>
      <Label x={24} y={382} textAnchor="start" fontSize={18} fill="var(--fg)" fontWeight={600}>
        <KLabel sub="p" /> = {formatConstant(example.kc)} × {example.deltaN === 0 ? '1' : `(${rtText})`}
        {example.deltaN === 0 ? '' : <tspan dy="-0.45em" fontSize="0.75em">{exponentText}</tspan>}
        {example.deltaN === 0 ? '' : <tspan dy="0.45em"> </tspan>}= {formatConstant(example.kp)}
        {kpUnit}
      </Label>
      <Label x={24} y={414} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
        Kc in mol L⁻¹, Kp in bar. Pure solids and liquids are not counted.
      </Label>
    </>
  )
}

function BoxStep({ step }: { step: Extract<KpKcStep, { kind: 'box' }> }) {
  const points = spacedScatter(10, { x0: BOX.x0 + 16, y0: BOX.y0 + 16, x1: BOX.x1 - 16, y1: BOX.y1 - 16 }, 3, 16)
  return (
    <>
      <Label x={VIEW_WIDTH / 2} y={24} fontSize={17} fill="var(--fg)">
        {step.title}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={46} fontSize={14} fill="var(--fg-subtle)">
        An ideal gas: the pressure follows the concentration
      </Label>
      <g data-testid="kpkc-box">
        <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={14} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={PARTICLE_R} fill="var(--fwd)" stroke="var(--surface)" strokeWidth={1} />
        ))}
        <Label x={(BOX.x0 + BOX.x1) / 2} y={BOX.y1 + 22} fontSize={15} fill="var(--fg-muted)">
          particles drawn for illustration
        </Label>
      </g>
      <rect x={BAR_PANEL.x} y={BAR_PANEL.y} width={BAR_PANEL.width} height={BAR_PANEL.height} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 40} fontSize={16} fill="var(--fg-muted)">
        <tspan className="sym">p</tspan> = <tspan className="sym">[gas]</tspan> <tspan className="sym">RT</tspan>
      </Label>
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 96} fontSize={16} fill="var(--fg)">
        <tspan className="sym">[gas]</tspan> = {formatConstant(step.concentration)} mol L⁻¹
      </Label>
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 124} fontSize={16} fill="var(--fg)">
        R = 0.0831 bar L mol⁻¹ K⁻¹
      </Label>
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 152} fontSize={16} fill="var(--fg)">
        T = {step.temperatureK} K
      </Label>
      <Label x={BAR_PANEL.x + BAR_PANEL.width / 2} y={BAR_PANEL.y + 200} fontSize={32} fill="var(--fwd)" fontWeight={600}>
        <tspan className="sym">p</tspan> = {formatConstant(step.pressureBar)} bar
      </Label>
      <Label x={24} y={352} textAnchor="start" fontSize={16} fill="var(--fg)">
        <tspan className="sym">p</tspan> = <tspan className="sym">[gas]</tspan> × 0.0831 × {step.temperatureK} = {formatConstant(step.pressureBar)} bar
      </Label>
      <Label x={24} y={382} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
        From pV = nRT, dividing by V: p = (n/V) RT.
      </Label>
      <Label x={24} y={408} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
        So Kc and Kp differ by a factor that depends on RT and on the gas moles.
      </Label>
    </>
  )
}

function SummaryStep({ examples }: { examples: KpKcExample[] }) {
  const cardWidth = 176
  const gap = 16
  const left = (VIEW_WIDTH - (cardWidth * 3 + gap * 2)) / 2
  return (
    <>
      <Label x={VIEW_WIDTH / 2} y={24} fontSize={17} fill="var(--fg)">
        Δn sets the factor and the unit of Kp
      </Label>
      {examples.map((ex, i) => {
        const x = left + i * (cardWidth + gap)
        const y = 56
        const h = 320
        const cx = x + cardWidth / 2
        return (
          <g key={ex.id} data-testid="kpkc-card">
            <rect x={x} y={y} width={cardWidth} height={h} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
            <rect x={x} y={y} width={cardWidth} height={6} rx={3} fill={ex.deltaN > 0 ? 'var(--rev)' : ex.deltaN < 0 ? 'var(--fwd)' : 'var(--fg-subtle)'} />
            <Label x={cx} y={y + 36} fontSize={14} fill="var(--fg)">
              {equationBare(ex.reaction)}
            </Label>
            <Label x={cx} y={y + 82} fontSize={14} fill="var(--fg-muted)">
              Δn
            </Label>
            <Label x={cx} y={y + 124} fontSize={44} fill="var(--fg)" fontWeight={600}>
              {signedInt(ex.deltaN)}
            </Label>
            <Label x={cx} y={y + 170} fontSize={14} fill="var(--fg-muted)">
              factor (RT)<tspan dy="-0.45em" fontSize="0.75em">Δn</tspan>
            </Label>
            <Label x={cx} y={y + 196} fontSize={16} fill="var(--fg)">
              {ex.deltaN === 0 ? '1' : formatConstant(ex.factor)}
            </Label>
            <Label x={cx} y={y + 240} fontSize={14} fill="var(--fg-muted)">
              unit of Kp
            </Label>
            <Label x={cx} y={y + 266} fontSize={18} fill="var(--fg)" fontWeight={600}>
              {ex.kpUnit === 'none' ? 'none' : ex.kpUnit}
            </Label>
            <Label x={cx} y={y + 300} fontSize={14} fill="var(--fg-muted)">
              {ex.deltaN === 0 ? 'Kp = Kc' : 'Kp = Kc × (RT)^Δn'}
            </Label>
          </g>
        )
      })}
      <Label x={VIEW_WIDTH / 2} y={404} fontSize={15} fill="var(--fg-muted)">
        At {KPKC_T} K, RT = {KPKC_RT.toFixed(2)} L bar mol⁻¹. Only gases count in Δn.
      </Label>
    </>
  )
}

/**
 * The kp-kc Scrolly: a gas box at p = [gas]RT, then three reactions with Δn = 0, −2 and +1, each
 * worked from its equilibrium concentrations with the lib, then a summary of the factors.
 */
export function KpKc({ step }: KpKcProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current = STEPS[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Kc and Kp: ${current.title}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="kp-kc"
      data-step={index}
    >
      {current.kind === 'box' && <BoxStep step={current} />}
      {current.kind === 'example' && <ExampleStep example={current.example} title={current.title} />}
      {current.kind === 'summary' && <SummaryStep examples={current.examples} />}
    </svg>
  )
}
