'use client'

import React from 'react'
import { SkeletalFormula, drawingFrame, deltaText, elementColour, freeAngle, lonePairAnchor, type Point } from '@/components/organic'
import { PushArrowOverlay } from '@/components/animations/unit8/effects/PushArrows'
import { hybridOf, speciesForms, type PushArrow, type ResonanceSpecies } from '@/lib/chem/resonance-species'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { ringOf } from '@/lib/chem/directing'
import { DIRECTING_STEP_KINDS, extraRow, groupColumns, groupLabel, nitroSpecies, PHENOL, sigmaRow, type DirectingStepKind, type SigmaItem } from './directing-steps'
import styles from './DirectingGroups.module.css'

export interface DirectingGroupsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
/** One height for every Step, so the card does not jump between Steps. */
const VIEW_HEIGHT = 600
const FONT = 'var(--font-sans)'
const ROW_MAX_WIDTH = 540
const KINDS: readonly DirectingStepKind[] = DIRECTING_STEP_KINDS

/**
 * The width a drawing actually occupies: the ring and its labels, from the atom positions plus one bond of
 * room for a label. (The frame's own bounds add a wide margin that would leave the molecules small.)
 */
function contentWidth(g: MolGraph, s: number): number {
  const xs = drawingFrame(g, s).points.map((p) => p.x)
  return Math.max(...xs) - Math.min(...xs) + 1.1 * s
}

/** The largest bond length (up to `maxScale`) at which a row of graphs fits `maxWidth` across. */
function fitRowScale(graphs: readonly MolGraph[], gap: number, maxWidth: number, maxScale: number): number {
  for (let s = maxScale; s >= 20; s -= 2) {
    const total = graphs.reduce((t, g) => t + contentWidth(g, s), 0) + gap * (graphs.length - 1)
    if (total <= maxWidth) return s
  }
  return 20
}

/** A row of drawings centred on `centreX`, with a gap between them. */
function rowCentres(widths: number[], gap: number, centreX: number): number[] {
  const width = widths.reduce((t, w) => t + w, 0) + gap * (widths.length - 1)
  let cursor = centreX - width / 2
  return widths.map((w) => {
    const cx = cursor + w / 2
    cursor += w + gap
    return cx
  })
}

/** The double-headed resonance arrow ↔ of length `len`, centred on (x, y), with a head at each end. */
function ResonanceSign({ x, y, len }: { x: number; y: number; len: number }) {
  const h = len / 2
  return (
    <g stroke="var(--fg-muted)" fill="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round">
      <line x1={x - h + 8} y1={y} x2={x + h - 8} y2={y} />
      <polygon points={`${x - h},${y} ${x - h + 12},${y - 7} ${x - h + 12},${y + 7}`} />
      <polygon points={`${x + h},${y} ${x + h - 12},${y - 7} ${x + h - 12},${y + 7}`} />
    </g>
  )
}

/**
 * The curved arrows of a form, with a pair of dots at each lone pair the arrows start from (and nowhere
 * else): the lone pairs are not drawn on every heteroatom.
 */
function PushWithDots({ graph, scale, arrows }: { graph: MolGraph; scale: number; arrows: readonly PushArrow[] }) {
  const frame = drawingFrame(graph, scale)
  const starts = arrows.flatMap((a) => ('lonePair' in a.from ? [a.from.lonePair] : []))
  return (
    <g>
      <PushArrowOverlay graph={graph} scale={scale} arrows={arrows} />
      {starts.map((atom) => {
        const p: Point = lonePairAnchor(frame.points[atom], freeAngle(frame.points, frame.adj, atom, []), 0.62 * scale)
        const dx = 3.5
        return (
          <g key={`lp${atom}`} fill="var(--fg)">
            <circle cx={p.x - dx} cy={p.y} r={2.6} />
            <circle cx={p.x + dx} cy={p.y} r={2.6} />
          </g>
        )
      })}
    </g>
  )
}

/**
 * One row of resonance forms (with the curved arrows and dots on the first form, and ↔ between forms), or the
 * hybrid alone. Each drawing is placed at the common scale `scale`.
 */
function FormRow({
  graphs,
  arrows,
  scale,
  cy,
  gap,
  centreX = VIEW_WIDTH / 2,
  labels,
}: {
  graphs: MolGraph[]
  arrows?: readonly PushArrow[]
  scale: number
  cy: number
  gap: number
  centreX?: number
  labels?: readonly string[]
}) {
  const xs = rowCentres(
    graphs.map((g) => contentWidth(g, scale)),
    gap,
    centreX
  )
  // Labels sit under the ring: one bond's height below its centre, plus a margin.
  const ringHalf = 0.87 * scale + 6
  return (
    <g>
      {graphs.map((g, i) => (
        <SkeletalFormula
          key={`f${i}`}
          graph={g}
          scale={scale}
          x={xs[i]}
          y={cy}
          overlay={i === 0 && arrows && arrows.length > 0 ? <PushWithDots graph={g} scale={scale} arrows={arrows} /> : undefined}
        />
      ))}
      {graphs.slice(0, -1).map((_, i) => (
        <ResonanceSign key={`r${i}`} x={(xs[i] + xs[i + 1]) / 2} y={cy} len={gap - 10} />
      ))}
      {labels?.map((text, i) => (
        <text key={`l${i}`} x={xs[i]} y={cy + ringHalf + 26} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
          {text}
        </text>
      ))}
    </g>
  )
}

/** Hybrid drawing on its own row, with the δ labels that the NCERT argument gives. */
function HybridRow({ species, scale, cy }: { species: ResonanceSpecies; scale: number; cy: number }) {
  const hy = hybridOf(species)
  return (
    <SkeletalFormula
      graph={hy.graph}
      scale={scale}
      x={VIEW_WIDTH / 2}
      y={cy}
      innerCircles={species.innerCircles}
      partialBonds={hy.partialBonds}
      partialCharges={hy.charges.map((c) => ({ atom: c.atom, label: c.label }))}
    />
  )
}

/**
 * Donor or withdrawing group: row 1 is forms I and II with ↔ between them, row 2 is form III, row 3 is the
 * hybrid. Two forms to a row keeps each molecule large.
 */
function ResonanceStep({ species, forms, arrows, labels }: { species: ResonanceSpecies; forms: MolGraph[]; arrows: readonly PushArrow[]; labels: string[] }) {
  const hy = hybridOf(species)
  const scale = Math.min(fitRowScale(forms.slice(0, 2), 70, ROW_MAX_WIDTH, 60), fitRowScale([forms[2], hy.graph], 0, ROW_MAX_WIDTH, 60))
  return (
    <g>
      <FormRow graphs={forms.slice(0, 2)} arrows={arrows} scale={scale} cy={150} gap={70} labels={labels.slice(0, 2)} />
      <FormRow graphs={[forms[2]]} scale={scale} cy={300} gap={0} labels={[labels[2]]} />
      <HybridRow species={species} scale={scale} cy={455} />
    </g>
  )
}

/** The Section's phenol contributors, and the nitrobenzene contributors from the lib. */
function DonorStep() {
  const forms = speciesForms(PHENOL)
  return (
    <g>
      <Title>−OH: the lone pair feeds the ring (+R)</Title>
      <ResonanceStep species={PHENOL} forms={forms} arrows={PHENOL.pushes[0]} labels={['I', 'II', 'III']} />
      <Caption
        y={552}
        lines={[
          <React.Fragment key="a">Electron density rises at the ortho and para carbons ({deltaText('δ−')}).</React.Fragment>,
          'Form IV repeats II at the other ortho carbon.',
        ]}
      />
    </g>
  )
}

function WithdrawerStep() {
  const species = nitroSpecies()
  return (
    <g>
      <Title>−NO₂: the ring feeds the nitro group (−R)</Title>
      <ResonanceStep species={species} forms={speciesForms(species)} arrows={species.pushes[0]} labels={['I', 'II', 'III']} />
      <Caption
        y={552}
        lines={[
          <React.Fragment key="a">Electron density falls at the ortho and para carbons ({deltaText('δ+')}).</React.Fragment>,
          'The meta carbons keep more electron density.',
        ]}
      />
    </g>
  )
}

/* ---- σ-complexes, drawn as textbooks do ---- */

/** Radius of a σ-complex ring, in drawing units. */
const SIGMA_R = 70
const DEG = Math.PI / 180

/** Outward unit vector of a point from the centre. */
const outward = (p: Point, c: Point) => {
  const d = Math.hypot(p.x - c.x, p.y - c.y) || 1
  return { x: (p.x - c.x) / d, y: (p.y - c.y) / d }
}

/**
 * One σ-complex: a hexagon with two C=C bonds, the sp³ carbon at the top carrying H and the NO₂ group written
 * as text, one + on the ring (or on the C–OH carbon's O for the extra form, drawn outside the ring). The ring
 * order and the bond orders come from the lib's graph.
 */
function Arenium({ item, cx, cy }: { item: SigmaItem; cx: number; cy: number }) {
  const g = item.graph
  const { ring, ipso } = ringOf(g)
  const ia = ring.indexOf(item.attack)
  const C: Point = { x: cx, y: cy }
  const pos = new Map<number, Point>()
  for (let k = 0; k < 6; k++) {
    const t = (-90 + 60 * k) * DEG
    pos.set(ring[(ia + k) % 6], { x: cx + SIGMA_R * Math.cos(t), y: cy + SIGMA_R * Math.sin(t) })
  }
  const bondOf = (a: number, b: number) => g.bonds.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a))
  const edges: React.ReactNode[] = []
  for (let k = 0; k < 6; k++) {
    const a = ring[(ia + k) % 6]
    const b = ring[(ia + k + 1) % 6]
    const P = pos.get(a)!
    const Q = pos.get(b)!
    edges.push(<line key={`e${k}`} x1={P.x} y1={P.y} x2={Q.x} y2={Q.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />)
    if (bondOf(a, b)?.order === 2) {
      // The inner line of a C=C: shortened and set in towards the centre.
      const mx = (P.x + Q.x) / 2
      const my = (P.y + Q.y) / 2
      const ix = (C.x - mx) / SIGMA_R
      const iy = (C.y - my) / SIGMA_R
      const shrink = (A: Point, B: Point) => ({ x1: A.x + (B.x - A.x) * 0.16 + ix * 9, y1: A.y + (B.y - A.y) * 0.16 + iy * 9, x2: A.x + (B.x - A.x) * 0.84 + ix * 9, y2: A.y + (B.y - A.y) * 0.84 + iy * 9 })
      const s = shrink(P, Q)
      edges.push(<line key={`d${k}`} {...s} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />)
    }
  }
  // Charge on the ring carbon (basic contributor).
  const charged = ring.find((a) => (g.atoms[a].charge ?? 0) === 1)
  const P0 = pos.get(item.attack)!
  const u0 = outward(P0, C)
  const rot = (v: { x: number; y: number }, deg: number) => {
    const t = deg * DEG
    return { x: v.x * Math.cos(t) - v.y * Math.sin(t), y: v.x * Math.sin(t) + v.y * Math.cos(t) }
  }
  const dN = rot(u0, 32)
  const dH = rot(u0, -32)
  const N = { x: P0.x + dN.x * 44, y: P0.y + dN.y * 44 }
  const Hh = { x: P0.x + dH.x * 44, y: P0.y + dH.y * 44 }
  const pIpso = pos.get(ipso)!
  const uI = outward(pIpso, C)
  const O = { x: pIpso.x + uI.x * 46, y: pIpso.y + uI.y * 46 }
  const anchorO = uI.x >= 0 ? 'start' : 'end'
  const plusAt = charged !== undefined && !item.oxonium ? pos.get(charged)! : undefined
  const uPlus = plusAt ? outward(plusAt, C) : { x: 0, y: 0 }
  return (
    <g>
      {edges}
      <line x1={P0.x} y1={P0.y} x2={N.x} y2={N.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
      <line x1={P0.x} y1={P0.y} x2={Hh.x} y2={Hh.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
      <text x={N.x + (dN.x >= 0 ? 4 : -4)} y={N.y + 6} textAnchor={dN.x >= 0 ? 'start' : 'end'} fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        <tspan fill={elementColour('N')}>NO</tspan>
        <tspan fontSize={13} dy={5}>2</tspan>
      </text>
      <text x={Hh.x + (dH.x >= 0 ? 4 : -4)} y={Hh.y + 6} textAnchor={dH.x >= 0 ? 'start' : 'end'} fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        H
      </text>
      {item.oxonium ? (
        <g>
          {[-3, 3].map((k) => (
            <line
              key={k}
              x1={pIpso.x - uI.y * k}
              y1={pIpso.y + uI.x * k}
              x2={O.x - uI.y * k}
              y2={O.y + uI.x * k}
              stroke="var(--fg)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          ))}
          <text x={O.x + (anchorO === 'start' ? 4 : -4)} y={O.y + 6} textAnchor={anchorO} fontSize={19} fontWeight={600} fontFamily={FONT} fill={elementColour('O')}>
            <tspan fontSize={13} dy={-9}>+</tspan>
            <tspan dy={9}>OH</tspan>
          </text>
        </g>
      ) : (
        <g>
          <line x1={pIpso.x} y1={pIpso.y} x2={O.x} y2={O.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
          <text x={O.x + (anchorO === 'start' ? 4 : -4)} y={O.y + 6} textAnchor={anchorO} fontSize={19} fontWeight={600} fontFamily={FONT} fill={elementColour('O')}>
            OH
          </text>
        </g>
      )}
      {plusAt && (
        <g>
          <circle cx={plusAt.x + uPlus.x * 26} cy={plusAt.y + uPlus.y * 26} r={10} fill="var(--surface-raised)" stroke="var(--fg)" strokeWidth={1.6} />
          <text x={plusAt.x + uPlus.x * 26} y={plusAt.y + uPlus.y * 26 + 6} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
            +
          </text>
        </g>
      )}
    </g>
  )
}

/**
 * Two σ-complexes per row; the third on a row of its own, with the caption beside it. The name and the note
 * of each sit inside its ring, where there is room, so the drawings can be large.
 */
function SigmaGrid({ items, caption }: { items: SigmaItem[]; caption: string[] }) {
  const place = [
    { cx: 170, cy: 190 },
    { cx: 420, cy: 190 },
    { cx: 170, cy: 424 },
  ]
  return (
    <g>
      {items.map((it, i) => (
        <g key={it.label}>
          <Arenium item={it} cx={place[i].cx} cy={place[i].cy} />
          <text x={place[i].cx} y={place[i].cy - 4} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            {it.label}
          </text>
          <text x={place[i].cx} y={place[i].cy + 18} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
            {it.note}
          </text>
        </g>
      ))}
      {caption.map((line, i) => (
        <text key={i} x={330} y={398 + i * 24} textAnchor="start" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </g>
  )
}

function SigmaStep() {
  return (
    <g>
      <Title>Phenol + NO₂⁺: three σ-complexes</Title>
      <SigmaGrid items={sigmaRow()} caption={['Each attack leaves an sp³', 'carbon bearing H and NO₂.', 'The + sits ortho or para', 'to the attacked carbon.']} />
    </g>
  )
}

function ExtraStep() {
  return (
    <g>
      <Title>The extra form: OH reaches the +</Title>
      <SigmaGrid items={extraRow()} caption={['For ortho and para attacks,', 'the + can sit on the C–OH carbon.', 'Its O lone pair forms C=O⁺H,', 'outside the ring. Meta cannot.']} />
    </g>
  )
}

function TableStep() {
  const cols = groupColumns()
  const colX = [VIEW_WIDTH * 0.18, VIEW_WIDTH * 0.5, VIEW_WIDTH * 0.82]
  const heads = ['o, p: activating', 'o, p: halogens', 'm: deactivating']
  const lists = [cols.activating, cols.halogens, cols.meta]
  return (
    <g>
      <Title>Where each group sends the attack</Title>
      {lists.map((list, c) => (
        <g key={c}>
          <text x={colX[c]} y={130} textAnchor="middle" fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            {heads[c]}
          </text>
          {list.map((g, r) => (
            <text key={g.group} x={colX[c]} y={180 + r * 36} textAnchor="middle" fontSize={21} fontFamily={FONT} fill="var(--fg)">
              {groupLabel(g.group)}
            </text>
          ))}
        </g>
      ))}
      <Caption
        lines={['Activating groups and halogens send it to o and p.', 'The deactivating groups in the right column send it to m.']}
        y={552}
      />
    </g>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={46} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines, y = 620 }: { lines: readonly React.ReactNode[]; y?: number }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text key={i} x={VIEW_WIDTH / 2} y={y + i * 26} textAnchor="middle" fontSize={17} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </g>
  )
}

function renderStep(kind: DirectingStepKind): React.ReactNode {
  switch (kind) {
    case 'donor':
      return <DonorStep />
    case 'withdrawer':
      return <WithdrawerStep />
    case 'sigma':
      return <SigmaStep />
    case 'extra':
      return <ExtraStep />
    case 'table':
      return <TableStep />
  }
}

function ariaFor(kind: DirectingStepKind): string {
  switch (kind) {
    case 'donor':
      return 'Phenol: resonance forms I to III in which the OH lone pair moves into the ring, and the hybrid with δ minus on the ortho and para carbons'
    case 'withdrawer':
      return 'Nitrobenzene: resonance forms in which the ring gives electrons to the nitro group, and the hybrid with δ plus on the ortho and para carbons'
    case 'sigma':
      return 'Phenol with an NO2 plus attack at the ortho, meta and para carbons: three arenium ions with a positive charge on the ring'
    case 'extra':
      return 'The extra form for the ortho and para attacks on phenol, with the positive charge on the carbon that bears OH; the meta attack has no such form'
    case 'table':
      return 'Table of NCERT groups: activating groups and halogens direct to the ortho and para carbons, and the deactivating groups direct to the meta carbons'
  }
}

/** The directing-groups Scrolly: five Steps (Section 9.5.6). The drawing fades in on each Step. */
export function DirectingGroups({ step, reducedMotion }: DirectingGroupsProps) {
  const kind = KINDS[Math.max(0, Math.min(step, KINDS.length - 1))]
  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={ariaFor(kind)} className={styles.drawing} data-step={kind}>
      <g key={kind} className={reducedMotion ? undefined : styles.enter}>
        {renderStep(kind)}
      </g>
    </svg>
  )
}

