'use client'

import type { ReactNode } from 'react'
import {
  bondAnchor,
  CurvedArrow,
  drawingFrame,
  type Frame,
  lonePairPoint,
  outwardAngle,
  type Point,
  SkeletalFormula,
} from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { BUTENAL, CARBANION, ENOLATE, ETHANAL, GRID, GRID_NAMES, HYDROXYBUTANAL, SMILES } from './aldol-steps'

export interface AldolScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps its size as the reader scrolls. */
const W = 580
const H = 420
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const LABEL = 15

interface Placed {
  graph: MolGraph
  frame: Frame
  x: number
  y: number
  scale: number
}

/** A molecule's drawing, centred at (x, y) in the panel, at `scale` pixels per bond. */
function place(graph: MolGraph, x: number, y: number, scale: number): Placed {
  return { graph, frame: drawingFrame(graph, scale), x, y, scale }
}

/** Panel coordinates of atom i. */
function at(m: Placed, i: number): Point {
  const p = m.frame.points[i]
  return { x: m.x + p.x, y: m.y + p.y }
}

function outward(m: Placed, i: number): number {
  return outwardAngle(m.frame.points, m.frame.adj, i)
}

function drawMolecule(m: Placed, key: string): ReactNode {
  return <SkeletalFormula key={key} graph={m.graph} scale={m.scale} x={m.x} y={m.y} showLonePairs />
}

/** A tone dot on a vertex: marks the carbon's role. */
function dot(m: Placed, i: number, fill: string, key: string): ReactNode {
  const p = at(m, i)
  return <circle key={key} cx={p.x} cy={p.y} r={7} fill={fill} />
}

/** Text placed a distance out from atom i, away from its bonds. One or more lines, each a [text, fill]. */
function callout(m: Placed, i: number, lines: ReadonlyArray<readonly [string, string]>, key: string, dist = 46): ReactNode {
  const p = at(m, i)
  const a = outward(m, i)
  const c = Math.cos(a)
  const s = Math.sin(a)
  const x = p.x + dist * c
  const y = p.y + dist * s
  const anchor = c > 0.3 ? 'start' : c < -0.3 ? 'end' : 'middle'
  const n = lines.length
  const firstDy = s < -0.3 ? -(n - 1) * 18 : s > 0.3 ? 0 : -(n - 1) * 9
  return (
    <text key={key} x={x} y={y} textAnchor={anchor} fontSize={LABEL} fontFamily="var(--font-sans)">
      {lines.map(([text, fill], k) => (
        <tspan key={k} x={x} dy={k === 0 ? firstDy : 18} fill={fill}>
          {text}
        </tspan>
      ))}
    </text>
  )
}

/** Water as a text label, so that it reads H₂O (a drawn water molecule would read OH₂). */
function waterLabel(x: number, y: number, key: string): ReactNode {
  return (
    <text key={key} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={INK}>
      H₂O
    </text>
  )
}

/** A left-hand row label of one or more lines, centred on y. */
function rowLabel(lines: readonly string[], x: number, y: number, key: string): ReactNode {
  return (
    <text key={key} x={x} y={y - ((lines.length - 1) * 18) / 2} dominantBaseline="central" fontSize={LABEL} fontFamily="var(--font-sans)" fill={INK}>
      {lines.map((t, k) => (
        <tspan key={k} x={x} dy={k === 0 ? 0 : 18}>
          {t}
        </tspan>
      ))}
    </text>
  )
}

function caption(x: number, y: number, text: string, key: string, fill = MUTED): ReactNode {
  return (
    <text key={key} x={x} y={y} textAnchor="middle" fontSize={LABEL} fontFamily="var(--font-sans)" fill={fill}>
      {text}
    </text>
  )
}

function arrow(from: Point, to: Point, bend: number, key: string): ReactNode {
  return <CurvedArrow key={key} from={from} to={to} bend={bend} />
}

/** Step 1: ethanal, with the α-carbon and its three α-hydrogens, and the carbonyl carbon. */
function Step1() {
  const m = place(ETHANAL, 290, 210, 140)
  return (
    <g>
      {drawMolecule(m, 'ethanal')}
      {dot(m, 1, ROLE_TONE.electrophilicCarbon, 'carbonyl')}
      {callout(m, 0, [['α-carbon', INK], ['3 α-H', ROLE_TONE.betaHydrogen]], 'alpha-label')}
      {callout(m, 1, [['carbonyl carbon', ROLE_TONE.electrophilicCarbon]], 'carbonyl-label')}
      {caption(W / 2, H - 24, unit8Name(SMILES.ethanal), 'name')}
    </g>
  )
}

/** Step 2: HO⁻ takes an α-H; the carbanion and its resonance form (charge on O). */
function Step2() {
  const m = place(ETHANAL, 160, 220, 120)
  const a0 = outward(m, 0)
  const p0 = at(m, 0)
  const h = { x: p0.x + 44 * Math.cos(a0), y: p0.y + 44 * Math.sin(a0) }
  const u = { x: Math.cos(a0), y: Math.sin(a0) }
  const carb = place(CARBANION, 440, 300, 58)
  const enol = place(ENOLATE, 440, 120, 58)
  return (
    <g>
      {drawMolecule(m, 'ethanal')}
      <line x1={p0.x + 10 * u.x} y1={p0.y + 10 * u.y} x2={p0.x + 30 * u.x} y2={p0.y + 30 * u.y} stroke={INK} strokeWidth={2} />
      <text x={h.x} y={h.y} textAnchor="middle" dominantBaseline="central" fontSize={LABEL} fontWeight={600} fill={ROLE_TONE.betaHydrogen}>
        H
      </text>
      <text x={62} y={92} fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={ROLE_TONE.base}>
        HO⁻
      </text>
      {arrow({ x: 96, y: 100 }, { x: h.x - 8 * u.x, y: h.y - 8 * u.y }, -0.3, 'arrow-base')}
      {arrow(bondAnchor(p0, h, 0.5), p0, 0.35, 'arrow-bond')}
      {drawMolecule(carb, 'carbanion')}
      {drawMolecule(enol, 'enolate')}
      <text x={at(carb, 0).x} y={at(carb, 0).y + 32} textAnchor="middle" fontSize={LABEL} fontFamily="var(--font-sans)" fill={INK}>
        CH₂
      </text>
      {caption(440, 395, 'carbanion', 'carb-cap')}
      {caption(440, 40, 'resonance form', 'enol-cap')}
      {caption(440, 212, '↔', 'resonance-sign', INK)}
      {caption(160, 372, unit8Name(SMILES.ethanal), 'name')}
    </g>
  )
}

/** Step 3: the carbanion's lone pair attacks the carbonyl carbon of a second ethanal. */
function Step3() {
  const carb = place(CARBANION, 176, 220, 100)
  const second = place(ETHANAL, 424, 220, 100)
  const lp = lonePairPoint(at(carb, 0), outward(carb, 0), 20)
  const carbonyl = at(second, 1)
  const oxygen = at(second, 2)
  return (
    <g>
      {drawMolecule(carb, 'carbanion')}
      {drawMolecule(second, 'second-ethanal')}
      {dot(carb, 0, ROLE_TONE.nucleophile, 'nucleophile')}
      {dot(second, 1, ROLE_TONE.electrophilicCarbon, 'electrophile')}
      {arrow(lp, carbonyl, -0.4, 'arrow-attack')}
      {arrow(bondAnchor(carbonyl, oxygen, 0.5), oxygen, 0.6, 'arrow-pi')}
      {caption(176, 380, 'carbanion', 'carb-cap')}
      {caption(424, 380, 'second ethanal', 'second-cap')}
      {caption(W / 2, 40, 'attack on the carbonyl carbon', 'title')}
    </g>
  )
}

/** Step 4: the aldol, 3-hydroxybutanal, with α- and β-carbons labelled; a proton from water. */
function Step4() {
  const m = place(HYDROXYBUTANAL, 230, 210, 100)
  return (
    <g>
      {drawMolecule(m, 'aldol')}
      {callout(m, 3, [['α-carbon', INK]], 'alpha-label')}
      {callout(m, 1, [['β-carbon', INK]], 'beta-label')}
      {waterLabel(500, 140, 'water')}
      {caption(500, 230, 'proton from H₂O', 'water-cap')}
      {caption(230, 380, unit8Name(SMILES.hydroxybutanal), 'name')}
    </g>
  )
}

/** Step 5: heat; water leaves and but-2-enal forms with the C=C between α and β. */
function Step5() {
  const left = place(HYDROXYBUTANAL, 118, 200, 56)
  const right = place(BUTENAL, 406, 200, 56)
  return (
    <g>
      {drawMolecule(left, 'aldol')}
      {drawMolecule(right, 'butenal')}
      <line x1={240} y1={200} x2={280} y2={200} stroke={INK} strokeWidth={2} />
      <path d="M 292 200 L 282 194 L 282 206 Z" fill={INK} />
      {caption(260, 186, 'heat', 'heat', INK)}
      {caption(118, 360, unit8Name(SMILES.hydroxybutanal), 'name-left')}
      {caption(406, 360, unit8Name(SMILES.butenal), 'name-right')}
      <text x={406} y={305} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={INK}>
        + H₂O
      </text>
      {caption(W / 2, 40, 'water leaves: C=C forms between α and β', 'title')}
    </g>
  )
}

/** Step 6: 2 × 2 grid of the four aldol products from propanal and 2-methylpropanal. */
function Step6() {
  const cols = [196, 436]
  const rows = [130, 300]
  const nameY = [207, 362]
  const cells = GRID.map((c, k) => ({ graph: c.graph, x: cols[k % 2], y: rows[Math.floor(k / 2)], nameY: nameY[Math.floor(k / 2)] }))
  return (
    <g>
      {caption(cols[0], 32, 'propanal', 'col-0')}
      {caption(cols[1], 32, '2-methylpropanal', 'col-1')}
      {rowLabel(['propanal'], 12, rows[0] - 14, 'row-0')}
      {rowLabel(['2-methyl', 'propanal'], 12, rows[1] - 14, 'row-1')}
      {cells.map((c, k) => {
        const m = place(c.graph, c.x, c.y - 14, 40)
        return (
          <g key={k}>
            {drawMolecule(m, `cell-${k}`)}
            {caption(c.x, c.nameY, GRID_NAMES[k], `name-${k}`, INK)}
          </g>
        )
      })}
      {caption(W / 2, H - 14, 'Across: forms the carbanion. Down: is attacked.', 'legend')}
    </g>
  )
}

const SCENES: readonly (() => ReactNode)[] = [Step1, Step2, Step3, Step4, Step5, Step6]

export function AldolScrolly({ step }: AldolScrollyProps) {
  const Scene = SCENES[step] ?? Step1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Aldol drawing, Step ${step + 1}`} style={{ display: 'block' }}>
      <Scene />
    </svg>
  )
}

