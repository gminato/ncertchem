'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import {
  chargeText,
  CurvedArrow,
  drawingFrame,
  type Frame,
  lonePairPoint,
  outwardAngle,
  SkeletalFormula,
} from '@/components/organic'
import { HALOGEN_TONE, MechanismProfile, PlanarCation, ROLE_TONE, StereoCentre, stereoLayout } from '@/components/vocab/organic6'
import { formulaUnicode } from '@/lib/chem/haloalkanes'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  ALLYL_CATION_FORMS,
  BENZYL_CATION_FORMS,
  type ChargedForm,
  FORMULAS,
  NAMES,
  SN2_STRIP,
  SN2_SN1_BEATS,
  sn2BarHeight,
} from './sn2-sn1-steps'

export interface Sn2Sn1ScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 660
const STAGE_H = 340
const STAGE_Y = (H - STAGE_H) / 2
const PROFILE_Y = 360
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const BAR_MAX = 190
const BAR_BASE = 470
/** Highlight of the reacting carbon in the resonance forms: a tint of the accent, readable in both themes. */
const CATION_HIGHLIGHT: CSSProperties = { ['--highlight' as string]: 'color-mix(in srgb, var(--accent) 26%, transparent)' }

function Caption({ x, y, children, fill = INK }: { x: number; y: number; children: ReactNode; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={14} fill={fill}>
      {children}
    </text>
  )
}

function BacksideApproach() {
  // The incoming HO⁻ has no bond yet, so StereoCentre would fade it; it is drawn here at full ink.
  const left = stereoLayout({ invert: 0, mirror: false, cx: W / 2, cy: STAGE_H / 2, length: 112 }).left
  return (
    <g>
      <StereoCentre
        y={STAGE_Y}
        umbrella={[{ label: 'H' }, { label: 'H' }, { label: 'H' }]}
        leaving={{ label: 'Br', tone: HALOGEN_TONE.Br }}
        invert={0}
      />
      <g transform={`translate(0 ${STAGE_Y})`}>
        <circle cx={left.x} cy={left.y} r={11} fill={ROLE_TONE.nucleophile} />
        <text x={left.x - 17} y={left.y} textAnchor="end" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={ROLE_TONE.nucleophile}>
          HO⁻
        </text>
      </g>
      <CurvedArrow from={{ x: 112, y: 262 }} to={{ x: 262, y: 300 }} bend={-0.25} />
      <Caption x={W / 2} y={H - 60}>{`${NAMES.methylBromide} (CH₃Br) with HO⁻ from the side away from Br`}</Caption>
      <Caption x={W / 2} y={H - 34} fill={MUTED}>
        The lone pair on oxygen moves to the carbon
      </Caption>
    </g>
  )
}

function TransitionState() {
  return (
    <g>
      <StereoCentre
        y={STAGE_Y}
        umbrella={[{ label: 'H' }, { label: 'H' }, { label: 'H' }]}
        incoming={{ label: <>HO<Sup>δ−</Sup></>, tone: ROLE_TONE.nucleophile, bondOrder: 0.5 }}
        leaving={{ label: <>Br<Sup>δ−</Sup></>, tone: HALOGEN_TONE.Br, bondOrder: 0.5 }}
        invert={0.5}
        bracketTS
      />
      <Caption x={W / 2} y={H - 60}>Transition state ‡: carbon bonded to five atoms</Caption>
      <Caption x={W / 2} y={H - 34} fill={MUTED}>
        Both bonds are partial, so both are drawn dashed
      </Caption>
    </g>
  )
}

function InvertedProduct() {
  return (
    <g>
      <StereoCentre
        y={0}
        umbrella={[{ label: 'H' }, { label: 'H' }, { label: 'H' }]}
        incoming={{ label: 'HO', tone: ROLE_TONE.nucleophile, bondOrder: 1 }}
        invert={1}
      />
      <Caption x={W / 2} y={318}>{`${NAMES.methanol} (CH₃OH) + Br⁻`}</Caption>
      <MechanismProfile kind="one-step" x={10} y={PROFILE_Y} />
    </g>
  )
}

function CrowdingStrip() {
  const base = BAR_BASE
  const colW = W / SN2_STRIP.length
  return (
    <g>
      {SN2_STRIP.map((row, i) => {
        const cx = colW * i + colW / 2
        const h = sn2BarHeight(row.relativeRate, BAR_MAX)
        return (
          <g key={row.smiles}>
            <SkeletalFormula graph={parseSmiles(row.smiles)} scale={44} x={cx} y={160} />
            <Caption x={cx} y={236}>{row.unicode}</Caption>
            <rect
              x={cx - 26}
              y={base - h}
              width={52}
              height={Math.max(h, 0)}
              rx={3}
              fill={row.relativeRate > 0 ? ROLE_TONE.nucleophile : MUTED}
            />
            <Caption x={cx} y={base - h - 10}>{row.display}</Caption>
            <Caption x={cx} y={base + 22} fill={MUTED}>{row.degree}</Caption>
          </g>
        )
      })}
      <line x1={20} y1={base} x2={W - 20} y2={base} stroke="var(--bond)" strokeWidth={1.5} />
      <Caption x={W / 2} y={H - 60}>Relative SN2 rate (ethyl bromide = 1)</Caption>
      <Caption x={W / 2} y={H - 34} fill={MUTED}>More groups around the carbon, slower SN2</Caption>
    </g>
  )
}

function Sn1Ionisation() {
  return (
    <g>
      <PlanarCation x={0} y={0} />
      <Caption x={W / 2} y={352}>
        {`${formulaUnicode(FORMULAS.tertButylBromide)} → (CH₃)₃C⁺ + Br⁻ (${NAMES.tertButylBromide})`}
      </Caption>
      <MechanismProfile kind="two-step" x={10} y={PROFILE_Y} />
    </g>
  )
}

/**
 * The +-bearing contributors of a resonance row, joined by double-headed arrows. The + is drawn
 * touching its carbon: the charge is taken off the graph and a ⊕ disc is placed on that atom.
 */
function ChargedRow({ forms, cx, cy, scale, gap }: { forms: readonly ChargedForm[]; cx: number; cy: number; scale: number; gap: number }) {
  const graphs = forms.map((f) => parseSmiles(f.smiles))
  const frames: Frame[] = graphs.map((g) => drawingFrame(g, scale))
  const widths = frames.map((f) => f.bounds.width)
  const rowW = widths.reduce((s, w) => s + w, 0) + gap * (forms.length - 1)
  const starts = widths.map((_, i) => cx - rowW / 2 + widths.slice(0, i).reduce((s, w) => s + w + gap, 0))
  const centres = widths.map((w, i) => starts[i] + w / 2)
  return (
    <g style={CATION_HIGHLIGHT}>
      {forms.map((f, i) => {
        const g = graphs[i]
        const bare: MolGraph = { ...g, atoms: g.atoms.map((a, j) => (j === f.cation ? { ...a, charge: 0 } : a)) }
        const fr = frames[i]
        const at = fr.points[f.cation]
        const th = outwardAngle(fr.points, fr.adj, f.cation)
        const r = 0.22 * scale
        const c = lonePairPoint(at, th, r + 2)
        return (
          <SkeletalFormula
            key={f.smiles}
            graph={bare}
            scale={scale}
            x={centres[i]}
            y={cy}
            highlightAtoms={[f.cation]}
            overlay={
              <g>
                <circle cx={c.x} cy={c.y} r={r} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.2} />
                <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {chargeText(1)}
                </text>
              </g>
            }
          />
        )
      })}
      {centres.slice(0, -1).map((c, i) => {
        const left = c + widths[i] / 2
        const right = centres[i + 1] - widths[i + 1] / 2
        const mx = (left + right) / 2
        const half = (right - left) * 0.3
        return (
          <g key={`ra-${i}`} stroke="var(--fg-muted)" fill="var(--fg-muted)" strokeWidth={2} transform={`translate(0 ${cy})`}>
            <line x1={mx - half} y1={0} x2={mx + half} y2={0} strokeLinecap="round" />
            <polygon points={`${mx - half - 3},0 ${mx - half + 9},-6 ${mx - half + 9},6`} stroke="none" />
            <polygon points={`${mx + half + 3},0 ${mx + half - 9},-6 ${mx + half - 9},6`} stroke="none" />
          </g>
        )
      })}
    </g>
  )
}

function Sn1AttackAndResonance() {
  return (
    <g>
      <PlanarCation x={0} y={0} attackTop attackBottom nucleophile="HO⁻" />
      <ChargedRow forms={ALLYL_CATION_FORMS} cx={W / 2} cy={430} scale={30} gap={44} />
      <Caption x={W / 2} y={478} fill={MUTED}>allylic cation: the + moves between the two ends</Caption>
      <ChargedRow forms={BENZYL_CATION_FORMS} cx={W / 2} cy={548} scale={30} gap={30} />
      <Caption x={W / 2} y={600} fill={MUTED}>benzylic cation: the + also sits on the ring, ortho and para</Caption>
      <Caption x={W / 2} y={636} fill={MUTED}>Charge spread over the allyl or ring carbons</Caption>
    </g>
  )
}

const BEAT_VIEW = {
  'backside-approach': BacksideApproach,
  'transition-state': TransitionState,
  'inverted-product': InvertedProduct,
  'crowding-strip': CrowdingStrip,
  'sn1-ionisation': Sn1Ionisation,
  'sn1-attack-and-resonance': Sn1AttackAndResonance,
} as const

export function Sn2Sn1Scrolly({ step }: Sn2Sn1ScrollyProps) {
  const index = Math.min(SN2_SN1_BEATS.length - 1, Math.max(0, Math.round(step)))
  const beat = SN2_SN1_BEATS[index]
  const View = BEAT_VIEW[beat]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`SN2 and SN1 mechanisms, Step ${index + 1} of ${SN2_SN1_BEATS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <View />
    </svg>
  )
}
